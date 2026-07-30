<?php

namespace App\Controllers;

use App\Models\CommunicationMessageModel;
use App\Models\CommunicationParticipantModel;
use App\Models\CommunicationThreadModel;
use App\Models\NotificationModel;
use App\Models\SchoolEventModel;
use App\Models\StudentAttendanceModel;
use App\Models\StudentModel;
use App\Models\StudentRequestModel;
use App\Services\CommunicationAccessService;
use App\Services\NotificationService;
use CodeIgniter\HTTP\ResponseInterface;
use RuntimeException;

class CommunicationController extends BaseResourceController
{
    private CommunicationAccessService $access;
    private NotificationService $notifications;

    public function __construct()
    {
        $this->access = new CommunicationAccessService();
        $this->notifications = new NotificationService();
    }

    public function contacts(): ResponseInterface
    {
        $actor = $this->actor();
        $children = [];
        if ($actor->role === 'parent') {
            $children = array_map(static fn ($student) => ['id' => $student->id, 'full_name' => $student->full_name],
                (new StudentModel())->where('parent_user_id', $actor->id)->orderBy('full_name', 'ASC')->findAll());
        }
        return $this->respondSuccess(['contacts' => $this->access->contacts($actor), 'classes' => $this->access->classes($actor), 'children' => $children]);
    }

    public function threads(): ResponseInterface
    {
        $actor = $this->actor();
        $db = \Config\Database::connect();
        $memberships = $db->table('communication_participants')->where('school_id', $actor->school_id)
            ->where('user_id', $actor->id)->get()->getResult();
        $rows = [];
        foreach ($memberships as $membership) {
            $thread = $db->table('communication_threads t')->select('t.*, c.name AS class_name, u.full_name AS creator_name')
                ->join('classes c', 'c.id = t.class_id', 'left')->join('users u', 'u.id = t.created_by')
                ->where('t.id', $membership->thread_id)->where('t.school_id', $actor->school_id)->get()->getRow();
            if (!$thread) continue;
            $latest = $db->table('communication_messages m')->select('m.id, m.body, m.created_at, u.full_name AS sender_name')
                ->join('users u', 'u.id = m.sender_user_id')->where('m.thread_id', $thread->id)
                ->orderBy('m.id', 'DESC')->limit(1)->get()->getRow();
            $unreadBuilder = $db->table('communication_messages')->where('thread_id', $thread->id)
                ->where('sender_user_id !=', $actor->id);
            if ($membership->last_read_at) $unreadBuilder->where('created_at >', $membership->last_read_at);
            $rows[] = array_merge((array) $thread, [
                'latest_message' => $latest,
                'unread_count' => $unreadBuilder->countAllResults(),
                'last_read_at' => $membership->last_read_at,
            ]);
        }
        usort($rows, static fn ($a, $b) => strcmp((string) ($b['latest_message']->created_at ?? $b['updated_at']), (string) ($a['latest_message']->created_at ?? $a['updated_at'])));
        return $this->respondSuccess($rows);
    }

    public function createThread(): ResponseInterface
    {
        $actor = $this->actor();
        $body = $this->getRequestBody();
        $target = (int) ($body['recipient_user_id'] ?? 0);
        $subject = trim((string) ($body['subject'] ?? ''));
        $message = trim((string) ($body['message'] ?? ''));
        if (!$target || mb_strlen($subject) < 3 || mb_strlen($subject) > 180 || mb_strlen($message) < 1 || mb_strlen($message) > 5000) {
            return $this->respondError('Penerima, subjek, dan pesan wajib diisi dengan format yang valid.', 422);
        }
        try {
            $this->access->assertCanContact($actor, $target);
            return $this->createConversation($actor, [$target], 'direct', $subject, $message, null);
        } catch (RuntimeException $e) {
            return $this->respondError($e->getMessage(), ResponseInterface::HTTP_FORBIDDEN);
        }
    }

    public function broadcast(): ResponseInterface
    {
        $actor = $this->actor();
        $body = $this->getRequestBody();
        $audience = (string) ($body['audience'] ?? 'class');
        $classId = isset($body['class_id']) ? (int) $body['class_id'] : null;
        $subject = trim((string) ($body['subject'] ?? ''));
        $message = trim((string) ($body['message'] ?? ''));
        if (!in_array($audience, ['school', 'class', 'staff', 'parents'], true)
            || mb_strlen($subject) < 3 || mb_strlen($subject) > 180 || mb_strlen($message) < 1 || mb_strlen($message) > 5000) {
            return $this->respondError('Target, subjek, atau isi broadcast tidak valid.', 422);
        }
        if ($actor->role === 'teacher' && $audience !== 'class') {
            return $this->respondError('Guru hanya dapat mengirim broadcast ke kelas yang diampu.', 403);
        }
        try {
            if ($audience === 'class') $this->access->assertCanManageClass($actor, (int) $classId);
            $recipients = $this->access->audienceUserIds((int) $actor->school_id, $audience, $classId);
            return $this->createConversation($actor, $recipients, 'broadcast', $subject, $message, $classId);
        } catch (RuntimeException $e) {
            return $this->respondError($e->getMessage(), 403);
        }
    }

    public function messages($threadId = null): ResponseInterface
    {
        $actor = $this->actor();
        $thread = $this->accessibleThread((int) $threadId, $actor);
        if (!$thread) return $this->respondError('Percakapan tidak ditemukan.', 404);
        $db = \Config\Database::connect();
        $messages = $db->table('communication_messages m')->select('m.*, u.full_name AS sender_name, u.role AS sender_role')
            ->join('users u', 'u.id = m.sender_user_id')->where('m.thread_id', $thread->id)
            ->where('m.school_id', $actor->school_id)->orderBy('m.id', 'ASC')->get()->getResultArray();
        $participants = $db->table('communication_participants p')->select('p.user_id, p.last_read_at, u.full_name, u.role')
            ->join('users u', 'u.id = p.user_id')->where('p.thread_id', $thread->id)->get()->getResultArray();
        $this->markThreadRead((int) $thread->id, (int) $actor->id);
        return $this->respondSuccess(['thread' => $thread, 'messages' => $messages, 'participants' => $participants]);
    }

    public function sendMessage($threadId = null): ResponseInterface
    {
        $actor = $this->actor();
        $thread = $this->accessibleThread((int) $threadId, $actor);
        if (!$thread) return $this->respondError('Percakapan tidak ditemukan.', 404);
        $message = trim((string) ($this->getRequestBody()['message'] ?? ''));
        if ($message === '' || mb_strlen($message) > 5000) return $this->respondError('Pesan wajib diisi dan maksimal 5.000 karakter.', 422);

        $model = new CommunicationMessageModel();
        $id = $model->insert(['school_id' => $actor->school_id, 'thread_id' => $thread->id, 'sender_user_id' => $actor->id, 'body' => $message]);
        (new CommunicationThreadModel())->update($thread->id, ['subject' => $thread->subject]);
        $this->markThreadRead((int) $thread->id, (int) $actor->id);
        $recipientIds = array_column(\Config\Database::connect()->table('communication_participants')->select('user_id')
            ->where('thread_id', $thread->id)->where('user_id !=', $actor->id)->get()->getResultArray(), 'user_id');
        $this->notifications->queue((int) $actor->school_id, $recipientIds, 'message', 'Pesan baru: ' . $thread->subject,
            $actor->full_name . ': ' . mb_substr($message, 0, 240), ['thread_id' => (int) $thread->id, 'url' => $this->roleUrl($actor->role)]);
        return $this->respondSuccess($model->find($id), 'Pesan berhasil dikirim.', 201);
    }

    public function markRead($threadId = null): ResponseInterface
    {
        $actor = $this->actor();
        if (!$this->accessibleThread((int) $threadId, $actor)) return $this->respondError('Percakapan tidak ditemukan.', 404);
        $this->markThreadRead((int) $threadId, (int) $actor->id);
        return $this->respondSuccess(null, 'Percakapan ditandai sudah dibaca.');
    }

    public function notificationList(): ResponseInterface
    {
        $actor = $this->actor();
        $limit = min(100, max(1, (int) ($this->request->getGet('limit') ?? 50)));
        $model = new NotificationModel();
        $items = $model->where('user_id', $actor->id)->orderBy('id', 'DESC')->findAll($limit);
        $unread = (new NotificationModel())->where('user_id', $actor->id)->where('read_at', null)->countAllResults();
        return $this->respondSuccess(['items' => $items, 'unread_count' => $unread]);
    }

    public function notificationRead($id = null): ResponseInterface
    {
        $actor = $this->actor();
        $model = new NotificationModel();
        $item = $model->where('user_id', $actor->id)->find((int) $id);
        if (!$item) return $this->respondError('Notifikasi tidak ditemukan.', 404);
        $model->update($item->id, ['read_at' => date('Y-m-d H:i:s')]);
        return $this->respondSuccess(null, 'Notifikasi ditandai sudah dibaca.');
    }

    public function notificationReadAll(): ResponseInterface
    {
        $actor = $this->actor();
        (new NotificationModel())->where('user_id', $actor->id)->where('read_at', null)
            ->set(['read_at' => date('Y-m-d H:i:s')])->update();
        return $this->respondSuccess(null, 'Semua notifikasi ditandai sudah dibaca.');
    }

    public function requests(): ResponseInterface
    {
        $actor = $this->actor();
        $db = \Config\Database::connect();
        $builder = $db->table('student_requests r')->select('r.*, s.full_name AS student_name, c.name AS class_name, u.full_name AS requester_name')
            ->join('students s', 's.id = r.student_id')->join('classes c', 'c.id = s.current_class_id', 'left')
            ->join('users u', 'u.id = r.requested_by')->where('r.school_id', $actor->school_id);
        if ($actor->role === 'parent') $builder->where('r.requested_by', $actor->id);
        if ($actor->role === 'teacher') {
            $classIds = array_column($this->access->classes($actor), 'id');
            if (!$classIds) return $this->respondSuccess([]);
            $builder->whereIn('s.current_class_id', $classIds);
        }
        return $this->respondSuccess($builder->orderBy('r.id', 'DESC')->limit(200)->get()->getResultArray());
    }

    public function createRequest(): ResponseInterface
    {
        $actor = $this->actor();
        if ($actor->role !== 'parent') return $this->respondError('Hanya wali siswa yang dapat membuat pengajuan.', 403);
        $body = $this->getRequestBody();
        $studentId = (int) ($body['student_id'] ?? 0);
        $type = (string) ($body['type'] ?? '');
        $date = (string) ($body['request_date'] ?? '');
        $reason = trim((string) ($body['reason'] ?? ''));
        $student = (new StudentModel())->where('parent_user_id', $actor->id)->find($studentId);
        if (!$student) return $this->respondError('Data anak tidak ditemukan.', 403);
        if (!in_array($type, ['leave', 'pickup'], true) || !$this->validDate($date) || $reason === '' || mb_strlen($reason) > 2000) {
            return $this->respondError('Jenis, tanggal, dan alasan pengajuan wajib diisi dengan benar.', 422);
        }
        if ($type === 'pickup' && (empty($body['pickup_name']) || empty($body['pickup_relationship']) || empty($body['pickup_phone']))) {
            return $this->respondError('Nama, hubungan, dan telepon penjemput wajib diisi.', 422);
        }
        $model = new StudentRequestModel();
        $id = $model->insert([
            'school_id' => $actor->school_id, 'student_id' => $studentId, 'requested_by' => $actor->id,
            'type' => $type, 'request_date' => $date, 'reason' => $reason,
            'pickup_name' => $type === 'pickup' ? mb_substr(trim((string) $body['pickup_name']), 0, 150) : null,
            'pickup_relationship' => $type === 'pickup' ? mb_substr(trim((string) $body['pickup_relationship']), 0, 80) : null,
            'pickup_phone' => $type === 'pickup' ? mb_substr(preg_replace('/[^0-9+]/', '', (string) $body['pickup_phone']), 0, 30) : null,
            'status' => 'pending',
        ]);
        $recipients = $this->access->audienceUserIds((int) $actor->school_id, 'class', $student->current_class_id ? (int) $student->current_class_id : null);
        $this->notifications->queue((int) $actor->school_id, array_diff($recipients, [(int) $actor->id]), 'student_request',
            $type === 'leave' ? 'Pengajuan izin siswa' : 'Konfirmasi penjemputan', $student->full_name . ': ' . $reason,
            ['request_id' => (int) $id, 'url' => $this->roleUrl('admin')]);
        return $this->respondSuccess($model->find($id), 'Pengajuan berhasil dikirim.', 201);
    }

    public function updateRequest($id = null): ResponseInterface
    {
        $actor = $this->actor();
        if (!in_array($actor->role, ['admin', 'teacher'], true)) return $this->respondError('Akses ditolak.', 403);
        $model = new StudentRequestModel();
        $request = $model->find((int) $id);
        if (!$request) return $this->respondError('Pengajuan tidak ditemukan.', 404);
        if ($actor->role === 'teacher') {
            $student = (new StudentModel())->find($request->student_id);
            $this->access->assertCanManageClass($actor, (int) $student->current_class_id);
        }
        $body = $this->getRequestBody();
        $status = (string) ($body['status'] ?? '');
        if (!in_array($status, ['approved', 'rejected', 'completed'], true)) return $this->respondError('Status tidak valid.', 422);
        if ($request->status !== 'pending' && $status !== 'completed') return $this->respondError('Pengajuan ini sudah diproses.', 409);
        $model->update($request->id, ['status' => $status, 'admin_note' => mb_substr(trim((string) ($body['admin_note'] ?? '')), 0, 2000),
            'handled_by' => $actor->id, 'handled_at' => date('Y-m-d H:i:s')]);
        $this->notifications->queue((int) $actor->school_id, [(int) $request->requested_by], 'student_request_status',
            'Status pengajuan diperbarui', 'Pengajuan Anda berstatus ' . $status . '.', ['request_id' => (int) $request->id, 'url' => '/parent/communication']);

        // Jika izin disetujui → buat/update record absensi otomatis
        if ($status === 'approved' && $request->type === 'leave') {
            $student = (new StudentModel())->find($request->student_id);
            if ($student) {
                $attModel = new StudentAttendanceModel();
                $existing = $attModel->where('student_id', $student->id)->where('date', $request->request_date)->first();
                $attPayload = [
                    'status' => 'izin',
                    'notes'  => 'Izin disetujui. ' . ($request->reason ?? ''),
                    'source' => 'manual',
                ];
                if ($existing) {
                    $attModel->update($existing->id, $attPayload);
                } else {
                    $attModel->insert(array_merge($attPayload, [
                        'school_id'  => (int) $actor->school_id,
                        'student_id' => (int) $student->id,
                        'class_id'   => (int) ($student->current_class_id ?? 0),
                        'date'       => $request->request_date,
                    ]));
                }
            }
        }

        return $this->respondSuccess($model->find($request->id), 'Status pengajuan berhasil diperbarui.');
    }

    public function events(): ResponseInterface
    {
        $actor = $this->actor();
        $from = $this->request->getGet('from') ?: date('Y-m-d', strtotime('-30 days'));
        $to = $this->request->getGet('to') ?: date('Y-m-d', strtotime('+180 days'));
        $items = (new SchoolEventModel())->where('starts_at >=', $from . ' 00:00:00')->where('starts_at <=', $to . ' 23:59:59')
            ->orderBy('starts_at', 'ASC')->findAll(500);
        return $this->respondSuccess(array_values(array_filter($items, fn ($event) => $this->access->canViewEvent($actor, $event))));
    }

    public function createEvent(): ResponseInterface
    {
        $actor = $this->actor();
        if (!in_array($actor->role, ['admin', 'teacher'], true)) return $this->respondError('Akses ditolak.', 403);
        return $this->saveEvent($actor);
    }

    public function updateEvent($id = null): ResponseInterface
    {
        $actor = $this->actor();
        $event = (new SchoolEventModel())->find((int) $id);
        if (!$event) return $this->respondError('Kegiatan tidak ditemukan.', 404);
        if ($actor->role !== 'admin' && (int) $event->created_by !== (int) $actor->id) return $this->respondError('Akses ditolak.', 403);
        return $this->saveEvent($actor, $event);
    }

    public function deleteEvent($id = null): ResponseInterface
    {
        $actor = $this->actor();
        $model = new SchoolEventModel();
        $event = $model->find((int) $id);
        if (!$event) return $this->respondError('Kegiatan tidak ditemukan.', 404);
        if ($actor->role !== 'admin' && (int) $event->created_by !== (int) $actor->id) return $this->respondError('Akses ditolak.', 403);
        $model->delete($event->id);
        return $this->respondSuccess(null, 'Kegiatan berhasil dihapus.');
    }

    private function saveEvent(object $actor, ?object $event = null): ResponseInterface
    {
        $body = $this->getRequestBody();
        $title = trim((string) ($body['title'] ?? ''));
        $audience = (string) ($body['audience'] ?? 'school');
        $classId = isset($body['class_id']) && $body['class_id'] !== '' ? (int) $body['class_id'] : null;
        $startsAt = str_replace('T', ' ', (string) ($body['starts_at'] ?? ''));
        $endsAt = !empty($body['ends_at']) ? str_replace('T', ' ', (string) $body['ends_at']) : null;
        if (mb_strlen($title) < 3 || mb_strlen($title) > 180 || !in_array($audience, ['school', 'class', 'staff', 'parents'], true)
            || strtotime($startsAt) === false || ($endsAt && strtotime($endsAt) < strtotime($startsAt))) {
            return $this->respondError('Data kegiatan tidak valid.', 422);
        }
        if ($actor->role === 'teacher') {
            if ($audience !== 'class' || !$classId) return $this->respondError('Guru hanya dapat membuat kegiatan untuk kelas yang diampu.', 403);
            try { $this->access->assertCanManageClass($actor, $classId); } catch (RuntimeException $e) { return $this->respondError($e->getMessage(), 403); }
        } elseif ($audience === 'class') {
            try { $this->access->assertCanManageClass($actor, (int) $classId); } catch (RuntimeException $e) { return $this->respondError($e->getMessage(), 403); }
        }
        $payload = [
            'school_id' => $actor->school_id, 'class_id' => $audience === 'class' ? $classId : null,
            'created_by' => $event ? $event->created_by : $actor->id, 'title' => $title,
            'description' => mb_substr(trim((string) ($body['description'] ?? '')), 0, 5000),
            'location' => mb_substr(trim((string) ($body['location'] ?? '')), 0, 180), 'audience' => $audience,
            'starts_at' => date('Y-m-d H:i:s', strtotime($startsAt)), 'ends_at' => $endsAt ? date('Y-m-d H:i:s', strtotime($endsAt)) : null,
            'reminder_minutes' => min(10080, max(0, (int) ($body['reminder_minutes'] ?? 1440))), 'reminder_sent_at' => null,
        ];
        $model = new SchoolEventModel();
        if ($event) $model->update($event->id, $payload); else $eventId = $model->insert($payload);
        $id = $event ? $event->id : $eventId;
        $recipients = $this->access->audienceUserIds((int) $actor->school_id, $audience, $classId);
        $this->notifications->queue((int) $actor->school_id, array_diff($recipients, [(int) $actor->id]), 'event',
            $event ? 'Kegiatan diperbarui' : 'Kegiatan baru', $title . ' — ' . date('d-m-Y H:i', strtotime($startsAt)), ['event_id' => (int) $id, 'url' => $this->roleUrl($actor->role)]);
        return $this->respondSuccess($model->find($id), $event ? 'Kegiatan berhasil diperbarui.' : 'Kegiatan berhasil dibuat.', $event ? 200 : 201);
    }

    private function createConversation(object $actor, array $recipientIds, string $type, string $subject, string $message, ?int $classId): ResponseInterface
    {
        $recipientIds = array_values(array_unique(array_diff(array_map('intval', $recipientIds), [(int) $actor->id])));
        if (!$recipientIds) return $this->respondError('Tidak ada penerima aktif untuk target tersebut.', 422);
        $db = \Config\Database::connect();
        $db->transStart();
        $threadModel = new CommunicationThreadModel();
        $threadId = $threadModel->insert(['school_id' => $actor->school_id, 'class_id' => $classId, 'created_by' => $actor->id, 'type' => $type, 'subject' => $subject]);
        $participantModel = new CommunicationParticipantModel();
        foreach (array_merge([(int) $actor->id], $recipientIds) as $userId) {
            $participantModel->insert(['school_id' => $actor->school_id, 'thread_id' => $threadId, 'user_id' => $userId,
                'last_read_at' => $userId === (int) $actor->id ? date('Y-m-d H:i:s') : null, 'created_at' => date('Y-m-d H:i:s')]);
        }
        (new CommunicationMessageModel())->insert(['school_id' => $actor->school_id, 'thread_id' => $threadId, 'sender_user_id' => $actor->id, 'body' => $message]);
        $db->transComplete();
        if (!$db->transStatus()) return $this->respondError('Percakapan gagal dibuat.', 500);
        $this->notifications->queue((int) $actor->school_id, $recipientIds, $type, $subject, $actor->full_name . ': ' . mb_substr($message, 0, 240),
            ['thread_id' => (int) $threadId, 'url' => $this->roleUrl($actor->role)]);
        return $this->respondSuccess($threadModel->find($threadId), $type === 'broadcast' ? 'Broadcast berhasil dikirim.' : 'Percakapan berhasil dibuat.', 201);
    }

    private function accessibleThread(int $threadId, object $actor): ?object
    {
        if (!$threadId) return null;
        $db = \Config\Database::connect();
        $member = $db->table('communication_participants')->where('thread_id', $threadId)
            ->where('school_id', $actor->school_id)->where('user_id', $actor->id)->get()->getRow();
        if (!$member) return null;
        return $db->table('communication_threads')->where('id', $threadId)->where('school_id', $actor->school_id)->get()->getRow();
    }

    private function markThreadRead(int $threadId, int $userId): void
    {
        (new CommunicationParticipantModel())->where('thread_id', $threadId)->where('user_id', $userId)
            ->set(['last_read_at' => date('Y-m-d H:i:s')])->update();
    }

    private function actor(): object
    {
        return $this->request->user;
    }

    private function validDate(string $date): bool
    {
        $parsed = \DateTimeImmutable::createFromFormat('!Y-m-d', $date);
        return $parsed && $parsed->format('Y-m-d') === $date;
    }

    private function roleUrl(string $role): string
    {
        return '/communication';
    }
}
