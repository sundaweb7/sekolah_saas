<?php

namespace App\Controllers\Admin;

use App\Controllers\BaseResourceController;
use App\Libraries\FonnteService;
use App\Models\ClassModel;
use App\Models\StudentAttendanceModel;
use App\Models\StudentModel;
use App\Models\UserModel;
use App\Services\NotificationService;
use CodeIgniter\HTTP\ResponseInterface;

class AttendanceAdminController extends BaseResourceController
{
    protected StudentAttendanceModel $attendanceModel;

    public function __construct()
    {
        $this->attendanceModel = new StudentAttendanceModel();
    }

    // ─────────────────────────────────────────────────────────────
    // GET /admin/attendance/analytics
    // ─────────────────────────────────────────────────────────────
    public function analytics(): ResponseInterface
    {
        $actor   = $this->request->user;
        $classId = $this->request->getGet('class_id');
        $from    = $this->request->getGet('from') ?: date('Y-m-d', strtotime('-30 days'));
        $to      = $this->request->getGet('to')   ?: date('Y-m-d');

        $db = \Config\Database::connect();

        // Per-day summary
        $dailyBuilder = $db->table('student_attendances sa')
            ->select("sa.date, sa.status, COUNT(*) AS total")
            ->join('students s', 's.id = sa.student_id')
            ->where('sa.school_id', $actor->school_id)
            ->where('sa.date >=', $from)
            ->where('sa.date <=', $to)
            ->groupBy(['sa.date', 'sa.status'])
            ->orderBy('sa.date', 'ASC');
        if ($classId) $dailyBuilder->where('sa.class_id', $classId);
        $daily = $dailyBuilder->get()->getResultArray();

        // Most absent students
        $absentBuilder = $db->table('student_attendances sa')
            ->select("sa.student_id, s.full_name, s.registration_number, COUNT(*) AS absent_count, SUM(sa.late_minutes) AS total_late_minutes")
            ->join('students s', 's.id = sa.student_id')
            ->where('sa.school_id', $actor->school_id)
            ->where('sa.date >=', $from)
            ->where('sa.date <=', $to)
            ->whereIn('sa.status', ['absen', 'alpha'])
            ->groupBy('sa.student_id')
            ->orderBy('absent_count', 'DESC')
            ->limit(20);
        if ($classId) $absentBuilder->where('sa.class_id', $classId);
        $mostAbsent = $absentBuilder->get()->getResultArray();

        // Late students
        $lateBuilder = $db->table('student_attendances sa')
            ->select("sa.student_id, s.full_name, COUNT(*) AS late_count, SUM(sa.late_minutes) AS total_late_minutes")
            ->join('students s', 's.id = sa.student_id')
            ->where('sa.school_id', $actor->school_id)
            ->where('sa.date >=', $from)
            ->where('sa.date <=', $to)
            ->where('sa.status', 'terlambat')
            ->groupBy('sa.student_id')
            ->orderBy('late_count', 'DESC')
            ->limit(20);
        if ($classId) $lateBuilder->where('sa.class_id', $classId);
        $mostLate = $lateBuilder->get()->getResultArray();

        // Status summary totals
        $summaryBuilder = $db->table('student_attendances sa')
            ->select("sa.status, COUNT(*) AS total")
            ->where('sa.school_id', $actor->school_id)
            ->where('sa.date >=', $from)
            ->where('sa.date <=', $to)
            ->groupBy('sa.status');
        if ($classId) $summaryBuilder->where('sa.class_id', $classId);
        $summary = $summaryBuilder->get()->getResultArray();

        $classes = (new ClassModel())->where('school_id', $actor->school_id)->findAll();

        return $this->respondSuccess([
            'daily'       => $daily,
            'most_absent' => $mostAbsent,
            'most_late'   => $mostLate,
            'summary'     => $summary,
            'classes'     => $classes,
            'period'      => ['from' => $from, 'to' => $to],
        ]);
    }

    // ─────────────────────────────────────────────────────────────
    // GET /admin/attendance/export?class_id=&from=&to=&format=csv
    // ─────────────────────────────────────────────────────────────
    public function export(): ResponseInterface
    {
        $actor   = $this->request->user;
        $classId = $this->request->getGet('class_id');
        $from    = $this->request->getGet('from') ?: date('Y-m-d', strtotime('-30 days'));
        $to      = $this->request->getGet('to')   ?: date('Y-m-d');

        $db = \Config\Database::connect();
        $builder = $db->table('student_attendances sa')
            ->select('sa.date, s.full_name, s.registration_number, c.name AS class_name, sa.status, sa.check_in_time, sa.late_minutes, sa.notes, sa.source')
            ->join('students s', 's.id = sa.student_id')
            ->join('classes c', 'c.id = sa.class_id', 'left')
            ->where('sa.school_id', $actor->school_id)
            ->where('sa.date >=', $from)
            ->where('sa.date <=', $to)
            ->orderBy('sa.date', 'DESC')
            ->orderBy('s.full_name', 'ASC');
        if ($classId) $builder->where('sa.class_id', $classId);

        $rows = $builder->get()->getResultArray();

        // Build CSV
        $csv  = "Tanggal,Nama Siswa,Nomor Registrasi,Kelas,Status,Jam Masuk,Terlambat (menit),Catatan,Sumber\n";
        foreach ($rows as $r) {
            $csv .= implode(',', [
                $r['date'],
                '"' . str_replace('"', '""', $r['full_name']) . '"',
                $r['registration_number'] ?? '',
                '"' . str_replace('"', '""', $r['class_name'] ?? '') . '"',
                $r['status'],
                $r['check_in_time'] ?? '',
                $r['late_minutes'] ?? 0,
                '"' . str_replace('"', '""', $r['notes'] ?? '') . '"',
                $r['source'] ?? 'manual',
            ]) . "\n";
        }

        $filename = 'absensi_' . $from . '_' . $to . '.csv';
        return $this->response
            ->setHeader('Content-Type', 'text/csv; charset=UTF-8')
            ->setHeader('Content-Disposition', "attachment; filename=\"{$filename}\"")
            ->setBody("\xEF\xBB\xBF" . $csv); // BOM for Excel UTF-8
    }

    // ─────────────────────────────────────────────────────────────
    // POST /admin/attendance/notify-absent
    // Kirim notifikasi WA ke orang tua siswa yang absen hari ini
    // ─────────────────────────────────────────────────────────────
    public function notifyAbsent(): ResponseInterface
    {
        $actor  = $this->request->user;
        $date   = $this->request->getJsonVar('date') ?: date('Y-m-d');
        $classId = $this->request->getJsonVar('class_id');

        $db = \Config\Database::connect();
        $builder = $db->table('student_attendances sa')
            ->select('sa.id, sa.student_id, sa.status, s.full_name, s.registration_number, c.name AS class_name, u.phone AS parent_phone, u.full_name AS parent_name')
            ->join('students s', 's.id = sa.student_id')
            ->join('classes c', 'c.id = sa.class_id', 'left')
            ->join('users u', 'u.id = s.parent_user_id', 'left')
            ->where('sa.school_id', $actor->school_id)
            ->where('sa.date', $date)
            ->whereIn('sa.status', ['absen', 'alpha', 'terlambat'])
            ->where('sa.notified_at', null)
            ->where('u.phone IS NOT NULL');

        if ($classId) $builder->where('sa.class_id', $classId);

        $absent = $builder->get()->getResultArray();

        if (empty($absent)) {
            return $this->respondSuccess(['sent' => 0], 'Tidak ada siswa yang perlu dinotifikasi.');
        }

        $fonnte = FonnteService::forSchool((int) $actor->school_id);
        $sent   = 0;
        $failed = 0;
        $now    = date('Y-m-d H:i:s');

        foreach ($absent as $row) {
            if (empty($row['parent_phone'])) continue;

            $statusLabel = match ($row['status']) {
                'absen', 'alpha' => 'tidak hadir (alpha)',
                'terlambat' => 'terlambat masuk',
                default => $row['status'],
            };

            $message = "Assalamualaikum Bapak/Ibu *{$row['parent_name']}*,\n\n"
                . "Kami informasikan bahwa putra/putri Anda:\n"
                . "👦 *{$row['full_name']}*\n"
                . "📚 Kelas: {$row['class_name']}\n"
                . "📅 Tanggal: " . date('d-m-Y', strtotime($date)) . "\n\n"
                . "Status kehadiran: *{$statusLabel}*\n\n"
                . "Jika ada keterangan atau pertanyaan, silakan hubungi sekolah.\n\n"
                . "_Pesan otomatis dari sistem sekolah._";

            $result = $fonnte->sendMessage($row['parent_phone'], $message);

            if ($result['status'] ?? false) {
                // Mark as notified
                $db->table('student_attendances')
                    ->where('id', $row['id'])
                    ->update(['notified_at' => $now]);
                $sent++;
            } else {
                $failed++;
            }
        }

        return $this->respondSuccess([
            'sent'   => $sent,
            'failed' => $failed,
            'total'  => count($absent),
        ], "Notifikasi WA terkirim: {$sent}, gagal: {$failed}.");
    }
}
