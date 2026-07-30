<?php

namespace App\Controllers\Teacher;

use App\Controllers\BaseResourceController;
use App\Models\StudentAttendanceModel;
use App\Models\ClassAnnouncementModel;
use App\Models\AttendancePinModel;
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
    protected AttendancePinModel $pinModel;

    public function __construct()
    {
        $this->attendanceModel = new StudentAttendanceModel();
        $this->announcementModel = new ClassAnnouncementModel();
        $this->teacherModel = new TeacherModel();
        $this->classModel = new ClassModel();
        $this->teacherAttendanceModel = new TeacherAttendanceModel();
        $this->classJournalModel = new ClassJournalModel();
        $this->pinModel = new AttendancePinModel();
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

    /**
     * GET /api/v1/teacher/attendance/recap
     * Returns monthly attendance recap per student for the teacher's class.
     * Query params: month (YYYY-MM), e.g. 2026-07
     */
    public function getAttendanceRecap(): ResponseInterface
    {
        $context = $this->getTeacherClass();
        if (!$context || !$context['class']) {
            return $this->respondError('Kelas bimbingan tidak ditemukan.', ResponseInterface::HTTP_NOT_FOUND);
        }

        $classId = $context['class']->id;
        $month   = $this->request->getVar('month') ?: date('Y-m');

        // Validate month format YYYY-MM
        if (!preg_match('/^\d{4}-\d{2}$/', $month)) {
            return $this->respondError('Format bulan tidak valid. Gunakan YYYY-MM.', ResponseInterface::HTTP_BAD_REQUEST);
        }

        $studentModel = new StudentModel();
        $students     = $studentModel
            ->where('current_class_id', $classId)
            ->where('status', 'aktif')
            ->findAll();

        $db = \Config\Database::connect();

        $recap = [];
        foreach ($students as $st) {
            // Count per status for this student in the given month
            $counts = $db->table('student_attendances')
                ->select("
                    SUM(CASE WHEN status = 'hadir' THEN 1 ELSE 0 END) AS hadir,
                    SUM(CASE WHEN status = 'sakit' THEN 1 ELSE 0 END) AS sakit,
                    SUM(CASE WHEN status = 'izin'  THEN 1 ELSE 0 END) AS izin,
                    SUM(CASE WHEN status = 'alfa'  THEN 1 ELSE 0 END) AS alfa,
                    COUNT(*) AS total_recorded
                ")
                ->where('student_id', $st->id)
                ->where('class_id', $classId)
                ->like('date', $month, 'after')   // LIKE '2026-07%'
                ->get()
                ->getRowArray();

            // Count distinct school days that have ANY attendance record in this class+month
            $schoolDays = (int)$db->table('student_attendances')
                ->selectMax('date')   // just to anchor
                ->select('COUNT(DISTINCT date) AS days', false)
                ->where('class_id', $classId)
                ->like('date', $month, 'after')
                ->get()
                ->getRow()
                ->days ?? 0;

            $recap[] = [
                'student_id'         => $st->id,
                'student_name'       => $st->full_name,
                'registration_number'=> $st->registration_number,
                'photo'              => $st->photo,
                'hadir'              => (int)($counts['hadir'] ?? 0),
                'sakit'              => (int)($counts['sakit'] ?? 0),
                'izin'               => (int)($counts['izin'] ?? 0),
                'alfa'               => (int)($counts['alfa'] ?? 0),
                'total_recorded'     => (int)($counts['total_recorded'] ?? 0),
                'school_days'        => $schoolDays,
            ];
        }

        return $this->respondSuccess([
            'month'   => $month,
            'class'   => $context['class']->name,
            'students'=> $recap,
        ]);
    }

    // ─────────────────────────────────────────────────────────────
    // PIN DINAMIS
    // ─────────────────────────────────────────────────────────────

    /**
     * GET /api/v1/teacher/attendance/pin
     * Returns (or creates) today's PIN for the teacher's class.
     */
    public function getPin(): ResponseInterface
    {
        $context = $this->getTeacherClass();
        if (!$context || !$context['class']) {
            return $this->respondError('Kelas bimbingan tidak ditemukan.', ResponseInterface::HTTP_NOT_FOUND);
        }

        $user     = $this->request->user;
        $schoolId = (int) $user->school_id;
        $classId  = (int) $context['class']->id;

        $pin = $this->pinModel->getOrCreate($schoolId, $classId, (int) $user->id);

        return $this->respondSuccess([
            'pin'        => $pin->pin,
            'date'       => $pin->date,
            'expires_at' => $pin->expires_at,
            'class'      => $context['class']->name,
        ]);
    }

    /**
     * POST /api/v1/teacher/attendance/pin/refresh
     * Force-refresh the PIN (delete existing & generate new).
     */
    public function refreshPin(): ResponseInterface
    {
        $context = $this->getTeacherClass();
        if (!$context || !$context['class']) {
            return $this->respondError('Kelas bimbingan tidak ditemukan.', ResponseInterface::HTTP_NOT_FOUND);
        }

        $user     = $this->request->user;
        $schoolId = (int) $user->school_id;
        $classId  = (int) $context['class']->id;
        $date     = date('Y-m-d');

        // Delete existing PIN so getOrCreate makes a fresh one
        $this->pinModel->where('school_id', $schoolId)->where('class_id', $classId)->where('date', $date)->delete();

        $pin = $this->pinModel->getOrCreate($schoolId, $classId, (int) $user->id);

        return $this->respondSuccess([
            'pin'        => $pin->pin,
            'date'       => $pin->date,
            'expires_at' => $pin->expires_at,
        ], 'PIN absensi diperbarui.');
    }

    // ─────────────────────────────────────────────────────────────
    // KIOSK ENDPOINT (public — requires valid PIN only)
    // ─────────────────────────────────────────────────────────────

    /**
     * POST /api/v1/kiosk/checkin
     * No JWT required. Body: { school_id, pin, student_id, source='kiosk' }
     */
    public function kioskCheckin(): ResponseInterface
    {
        $json     = $this->request->getJSON(true) ?? [];
        $schoolId = (int) ($json['school_id'] ?? 0);
        $pin      = trim((string) ($json['pin'] ?? ''));
        $studentId = (int) ($json['student_id'] ?? 0);

        if (!$schoolId || !$pin || !$studentId) {
            return $this->respondError('school_id, pin, dan student_id wajib diisi.', 422);
        }

        $pinRecord = $this->pinModel->verifyPin($schoolId, $pin);
        if (!$pinRecord) {
            return $this->respondError('PIN tidak valid atau sudah kadaluarsa.', 403);
        }

        $student = (new StudentModel())->where('id', $studentId)->where('school_id', $schoolId)->first();
        if (!$student || (int) $student->current_class_id !== (int) $pinRecord->class_id) {
            return $this->respondError('Siswa tidak ditemukan atau bukan anggota kelas ini.', 403);
        }

        $date    = date('Y-m-d');
        $time    = date('H:i:s');
        // Tentukan terlambat jika lewat 07:30
        $lateMinutes = 0;
        $cutoff = strtotime($date . ' 07:30:00');
        if (time() > $cutoff) {
            $lateMinutes = (int) round((time() - $cutoff) / 60);
        }
        $status = $lateMinutes > 0 ? 'terlambat' : 'hadir';

        $existing = $this->attendanceModel
            ->where('student_id', $studentId)
            ->where('date', $date)
            ->first();

        $payload = [
            'status'         => $status,
            'check_in_time'  => $time,
            'late_minutes'   => $lateMinutes,
            'source'         => 'kiosk',
        ];

        if ($existing) {
            $this->attendanceModel->update($existing->id, $payload);
        } else {
            $this->attendanceModel->insert(array_merge($payload, [
                'school_id'  => $schoolId,
                'student_id' => $studentId,
                'class_id'   => $pinRecord->class_id,
                'date'       => $date,
            ]));
        }

        return $this->respondSuccess([
            'student_name' => $student->full_name,
            'status'       => $status,
            'check_in_time'=> $time,
            'late_minutes' => $lateMinutes,
        ], $status === 'hadir' ? "Selamat datang, {$student->full_name}!" : "Halo {$student->full_name}, Anda terlambat {$lateMinutes} menit.");
    }

    /**
     * POST /api/v1/kiosk/validate-pin
     * No JWT required. Returns class + students list when PIN valid.
     * Body: { school_id, pin }
     */
    public function validatePinPublic(): ResponseInterface
    {
        $json     = $this->request->getJSON(true) ?? [];
        $schoolId = (int) ($json['school_id'] ?? 0);
        $pin      = trim((string) ($json['pin'] ?? ''));

        if (!$schoolId || !$pin) {
            return $this->respondError('school_id dan pin wajib diisi.', 422);
        }

        $pinRecord = $this->pinModel->verifyPin($schoolId, $pin);
        if (!$pinRecord) {
            return $this->respondError('PIN tidak valid atau sudah kadaluarsa.', 403);
        }

        $class = $this->classModel->find($pinRecord->class_id);
        $students = (new StudentModel())
            ->select('id, full_name, nis, photo, registration_number')
            ->where('current_class_id', $pinRecord->class_id)
            ->where('school_id', $schoolId)
            ->where('status', 'aktif')
            ->orderBy('full_name', 'ASC')
            ->findAll();

        // Get today's attendance for this class
        $date = date('Y-m-d');
        $checkedIn = $this->attendanceModel
            ->select('student_id, status, check_in_time, late_minutes')
            ->where('class_id', $pinRecord->class_id)
            ->where('date', $date)
            ->findAll();

        $checkedMap = [];
        foreach ($checkedIn as $att) {
            $checkedMap[$att->student_id] = $att;
        }

        $studentList = array_map(function ($s) use ($checkedMap) {
            return [
                'id'          => $s->id,
                'full_name'   => $s->full_name,
                'nis'         => $s->nis,
                'photo'       => $s->photo,
                'checked_in'  => isset($checkedMap[$s->id]),
                'status'      => $checkedMap[$s->id]->status ?? null,
                'check_in_time' => $checkedMap[$s->id]->check_in_time ?? null,
                'late_minutes'  => $checkedMap[$s->id]->late_minutes ?? 0,
            ];
        }, $students);

        return $this->respondSuccess([
            'class'    => $class ? $class->name : 'Kelas',
            'date'     => $date,
            'students' => $studentList,
            'school_id'=> $schoolId,
            'class_id' => $pinRecord->class_id,
        ]);
    }

    /**
     * GET /api/v1/teacher/attendance/my-history
     * Returns monthly attendance history of the authenticated teacher.
     */
    public function getMyHistory(): ResponseInterface
    {
        $schoolId = defined('CURRENT_SCHOOL_ID') ? CURRENT_SCHOOL_ID : null;
        if (!$schoolId) {
            return $this->respondError('School context required.', ResponseInterface::HTTP_BAD_REQUEST);
        }

        $userId = $this->request->user->id;
        $teacherModel = new \App\Models\TeacherModel();
        $teacher = $teacherModel->where('school_id', $schoolId)->where('user_id', $userId)->first();
        if (!$teacher) {
            return $this->respondError('Guru tidak ditemukan.', ResponseInterface::HTTP_NOT_FOUND);
        }

        $month = $this->request->getVar('month') ?: date('Y-m');
        if (!preg_match('/^\d{4}-\d{2}$/', $month)) {
            return $this->respondError('Format bulan tidak valid. Gunakan YYYY-MM.', ResponseInterface::HTTP_BAD_REQUEST);
        }

        $db = \Config\Database::connect();
        $records = $db->table('teacher_attendances')
            ->where('school_id', $schoolId)
            ->where('teacher_id', $teacher->id)
            ->where("date LIKE '{$month}%'")
            ->orderBy('date', 'DESC')
            ->get()
            ->getResult();

        return $this->respondSuccess($records);
    }
}
