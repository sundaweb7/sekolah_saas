<?php

namespace App\Controllers\Teacher;

use App\Controllers\BaseResourceController;
use App\Models\StudentAttendanceModel;
use App\Models\ClassAnnouncementModel;
use App\Models\TeacherModel;
use App\Models\ClassModel;
use App\Models\StudentModel;
use App\Models\TeacherAttendanceModel;
use App\Models\ClassJournalModel;
use CodeIgniter\HTTP\ResponseInterface;

class AttendanceAnnouncementController extends BaseResourceController
{
    protected TeacherAttendanceModel $teacherAttendanceModel;
    protected ClassJournalModel $classJournalModel;
    protected StudentAttendanceModel $attendanceModel;
    protected ClassAnnouncementModel $announcementModel;
    protected TeacherModel $teacherModel;
    protected ClassModel $classModel;

    public function __construct()
    {
        $this->attendanceModel = new StudentAttendanceModel();
        $this->announcementModel = new ClassAnnouncementModel();
        $this->teacherModel = new TeacherModel();
        $this->classModel = new ClassModel();
        $this->teacherAttendanceModel = new TeacherAttendanceModel();
        $this->classJournalModel = new ClassJournalModel();
    }

    /**
     * Helper to resolve current logged in teacher and their class
     */
    private function getTeacherClass()
    {
        $user = $this->request->user ?? null;
        if (!$user || $user->role !== 'teacher') {
            return null;
        }
        $teacher = $this->teacherModel->where('user_id', $user->id)->first();
        if (!$teacher) {
            return null;
        }
        $class = $this->classModel->where('teacher_id', $teacher->id)->first();
        return [
            'teacher' => $teacher,
            'class' => $class
        ];
    }

    /**
     * GET /api/v1/teacher/attendance
     */
    public function getAttendance(): ResponseInterface
    {
        $context = $this->getTeacherClass();
        if (!$context || !$context['class']) {
            return $this->respondError('Kelas bimbingan tidak ditemukan.', ResponseInterface::HTTP_NOT_FOUND);
        }

        $date = $this->request->getVar('date') ?: date('Y-m-d');
        $classId = $context['class']->id;

        // Fetch students in this class
        $studentModel = new StudentModel();
        $students = $studentModel->where('current_class_id', $classId)->where('status', 'aktif')->findAll();

        // Fetch existing attendance records
        $existing = $this->attendanceModel
            ->where('class_id', $classId)
            ->where('date', $date)
            ->findAll();

        $attendanceMap = [];
        foreach ($existing as $att) {
            $attendanceMap[$att->student_id] = $att;
        }

        $result = [];
        foreach ($students as $st) {
            $record = isset($attendanceMap[$st->id]) ? $attendanceMap[$st->id] : null;
            $result[] = [
                'student_id' => $st->id,
                'student_name' => $st->full_name,
                'registration_number' => $st->registration_number,
                'photo' => $st->photo,
                'status' => $record ? $record->status : 'hadir',
                'notes' => $record ? $record->notes : ''
            ];
        }

        return $this->respondSuccess($result);
    }

    /**
     * POST /api/v1/teacher/attendance
     */
    public function saveAttendance(): ResponseInterface
    {
        $context = $this->getTeacherClass();
        if (!$context || !$context['class']) {
            return $this->respondError('Kelas bimbingan tidak ditemukan.', ResponseInterface::HTTP_NOT_FOUND);
        }

        $json = $this->request->getJSON(true);
        $date = $json['date'] ?? date('Y-m-d');
        $records = $json['attendance'] ?? [];
        $classId = $context['class']->id;
        $schoolId = defined('CURRENT_SCHOOL_ID') ? CURRENT_SCHOOL_ID : null;

        foreach ($records as $rec) {
            $studentId = $rec['student_id'];
            $status = $rec['status'] ?? 'hadir';
            $notes = $rec['notes'] ?? '';

            // Check if record exists
            $existing = $this->attendanceModel
                ->where('student_id', $studentId)
                ->where('date', $date)
                ->first();

            if ($existing) {
                $this->attendanceModel->update($existing->id, [
                    'status' => $status,
                    'notes' => $notes
                ]);
            } else {
                $this->attendanceModel->insert([
                    'school_id' => $schoolId,
                    'student_id' => $studentId,
                    'class_id' => $classId,
                    'date' => $date,
                    'status' => $status,
                    'notes' => $notes
                ]);
            }
        }

        return $this->respondSuccess(null, 'Absensi harian berhasil disimpan.');
    }

    /**
     * GET /api/v1/teacher/announcements
     */
    public function getAnnouncements(): ResponseInterface
    {
        $context = $this->getTeacherClass();
        if (!$context || !$context['class']) {
            return $this->respondError('Kelas bimbingan tidak ditemukan.', ResponseInterface::HTTP_NOT_FOUND);
        }

        $list = $this->announcementModel
            ->where('class_id', $context['class']->id)
            ->orderBy('id', 'DESC')
            ->findAll();

        return $this->respondSuccess($list);
    }

    /**
     * POST /api/v1/teacher/announcements
     */
    public function saveAnnouncement(): ResponseInterface
    {
        $context = $this->getTeacherClass();
        if (!$context || !$context['class']) {
            return $this->respondError('Kelas bimbingan tidak ditemukan.', ResponseInterface::HTTP_NOT_FOUND);
        }

        $json = $this->request->getJSON(true) ?? $this->request->getPost() ?? [];
        if (empty($json['title']) || empty($json['content'])) {
            return $this->respondError('Judul dan isi pengumuman wajib diisi.', ResponseInterface::HTTP_BAD_REQUEST);
        }

        $schoolId = defined('CURRENT_SCHOOL_ID') ? CURRENT_SCHOOL_ID : null;

        $id = $this->announcementModel->insert([
            'school_id' => $schoolId,
            'class_id' => $context['class']->id,
            'teacher_id' => $context['teacher']->id,
            'title' => $json['title'],
            'content' => $json['content']
        ]);

        if (!$id) {
            return $this->respondError('Gagal menyimpan pengumuman.', ResponseInterface::HTTP_BAD_REQUEST);
        }

        return $this->respondSuccess($this->announcementModel->find($id), 'Pengumuman kelas berhasil diterbitkan.');
    }

    /**
     * DELETE /api/v1/teacher/announcements/{id}
     */
    public function deleteAnnouncement($id = null): ResponseInterface
    {
        $context = $this->getTeacherClass();
        if (!$context || !$context['class']) {
            return $this->respondError('Akses ditolak.', ResponseInterface::HTTP_FORBIDDEN);
        }

        $ann = $this->announcementModel->find($id);
        if (!$ann || $ann->class_id != $context['class']->id) {
            return $this->respondError('Pengumuman tidak ditemukan.', ResponseInterface::HTTP_NOT_FOUND);
        }

        $this->announcementModel->delete($id);
        return $this->respondSuccess(null, 'Pengumuman kelas berhasil dihapus.');
    }

    /**
     * GET /api/v1/teacher/attendance/status
     */
    public function getTeacherAttendanceStatus(): ResponseInterface
    {
        $context = $this->getTeacherClass();
        if (!$context) {
            return $this->respondError('Akses ditolak.', ResponseInterface::HTTP_FORBIDDEN);
        }

        $date = date('Y-m-d');
        $att = $this->teacherAttendanceModel
            ->where('teacher_id', $context['teacher']->id)
            ->where('date', $date)
            ->first();

        return $this->respondSuccess($att);
    }

    /**
     * POST /api/v1/teacher/attendance/check-in
     */
    public function checkInTeacher(): ResponseInterface
    {
        $context = $this->getTeacherClass();
        if (!$context) {
            return $this->respondError('Akses ditolak.', ResponseInterface::HTTP_FORBIDDEN);
        }

        $json = $this->request->getJSON(true) ?? [];
        $lat = $json['latitude'] ?? null;
        $lng = $json['longitude'] ?? null;

        if (empty($lat) || empty($lng)) {
            return $this->respondError('Koordinat GPS wajib dikirimkan.', ResponseInterface::HTTP_BAD_REQUEST);
        }

        $date = date('Y-m-d');
        $time = date('H:i:s');

        // Determine status (late if past 08:00:00)
        $status = (strtotime($time) > strtotime('08:00:00')) ? 'terlambat' : 'hadir';

        $existing = $this->teacherAttendanceModel
            ->where('teacher_id', $context['teacher']->id)
            ->where('date', $date)
            ->first();

        $schoolId = defined('CURRENT_SCHOOL_ID') ? CURRENT_SCHOOL_ID : null;

        if ($existing) {
            $this->teacherAttendanceModel->update($existing->id, [
                'latitude'       => $lat,
                'longitude'      => $lng,
                'check_in_time'  => $time,
                'status'         => $status
            ]);
            $record = $this->teacherAttendanceModel->find($existing->id);
        } else {
            $id = $this->teacherAttendanceModel->insert([
                'school_id'     => $schoolId,
                'teacher_id'    => $context['teacher']->id,
                'date'          => $date,
                'status'        => $status,
                'latitude'      => $lat,
                'longitude'     => $lng,
                'check_in_time' => $time
            ]);
            $record = $this->teacherAttendanceModel->find($id);
        }

        return $this->respondSuccess($record, 'Absensi mandiri guru berhasil dicatat.');
    }

    /**
     * GET /api/v1/teacher/journals
     */
    public function getJournals(): ResponseInterface
    {
        $context = $this->getTeacherClass();
        if (!$context || !$context['class']) {
            return $this->respondError('Kelas bimbingan tidak ditemukan.', ResponseInterface::HTTP_NOT_FOUND);
        }

        $date = $this->request->getVar('date') ?: date('Y-m-d');
        
        $journal = $this->classJournalModel
            ->where('class_id', $context['class']->id)
            ->where('date', $date)
            ->first();

        return $this->respondSuccess($journal);
    }

    /**
     * POST /api/v1/teacher/journals
     */
    public function saveJournal(): ResponseInterface
    {
        $context = $this->getTeacherClass();
        if (!$context || !$context['class']) {
            return $this->respondError('Kelas bimbingan tidak ditemukan.', ResponseInterface::HTTP_NOT_FOUND);
        }

        $json = $this->request->getJSON(true) ?? [];
        $subject = $json['subject'] ?? '';
        $activities = $json['activities'] ?? '';
        $notes = $json['notes'] ?? '';
        $date = $json['date'] ?? date('Y-m-d');

        if (empty($subject) || empty($activities)) {
            return $this->respondError('Materi dan Kegiatan pembelajaran wajib diisi.', ResponseInterface::HTTP_BAD_REQUEST);
        }

        $schoolId = defined('CURRENT_SCHOOL_ID') ? CURRENT_SCHOOL_ID : null;

        $existing = $this->classJournalModel
            ->where('class_id', $context['class']->id)
            ->where('date', $date)
            ->first();

        if ($existing) {
            $this->classJournalModel->update($existing->id, [
                'subject'    => $subject,
                'activities' => $activities,
                'notes'      => $notes
            ]);
            $record = $this->classJournalModel->find($existing->id);
        } else {
            $id = $this->classJournalModel->insert([
                'school_id'  => $schoolId,
                'class_id'   => $context['class']->id,
                'teacher_id' => $context['teacher']->id,
                'date'       => $date,
                'subject'    => $subject,
                'activities' => $activities,
                'notes'      => $notes
            ]);
            $record = $this->classJournalModel->find($id);
        }

        return $this->respondSuccess($record, 'Jurnal pembelajaran harian berhasil disimpan.');
    }
}
