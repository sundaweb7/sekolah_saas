<?php

namespace App\Controllers\Parent;

use App\Controllers\BaseResourceController;
use App\Models\StudentModel;
use App\Models\SppInvoiceModel;
use App\Models\ClassModel;
use CodeIgniter\HTTP\ResponseInterface;
use Exception;

class ParentController extends BaseResourceController
{
    protected StudentModel $studentModel;
    protected SppInvoiceModel $sppInvoiceModel;

    public function __construct()
    {
        $this->studentModel = new StudentModel();
        $this->sppInvoiceModel = new SppInvoiceModel();
    }

    /**
     * GET /api/v1/parent/dashboard
     */
    public function dashboard(): ResponseInterface
    {
        $user = $this->request->user ?? null;
        if (!$user || $user->role !== 'parent') {
            return $this->respondError('Unauthorized parent access', ResponseInterface::HTTP_FORBIDDEN);
        }

        $children = $this->studentModel->where('parent_user_id', $user->id)->orderBy('full_name', 'ASC')->findAll();
        if (!$children) {
            return $this->respondError('Data profil anak belum dihubungkan ke akun wali siswa Anda.', ResponseInterface::HTTP_NOT_FOUND);
        }
        $requestedChildId = (int) ($this->request->getGet('student_id') ?? 0);
        $child = $children[0];
        if ($requestedChildId) {
            foreach ($children as $candidate) {
                if ((int) $candidate->id === $requestedChildId) {
                    $child = $candidate;
                    break;
                }
            }
            if ((int) $child->id !== $requestedChildId) {
                return $this->respondError('Akses data anak ditolak.', ResponseInterface::HTTP_FORBIDDEN);
            }
        }

        // Fetch SPP invoices
        $sppInvoices = $this->sppInvoiceModel
            ->where('student_id', $child->id)
            ->orderBy('month', 'DESC')
            ->findAll();

        // Load Class Name & Wali Kelas if registered
        $className = 'Belum masuk kelas';
        $teacherName = 'Belum ditugaskan';
        if ($child->current_class_id) {
            $db = \Config\Database::connect();
            $classData = $db->table('classes')
                ->select('classes.name as class_name, classes.age_group, teachers.full_name as teacher_name')
                ->join('teachers', 'teachers.id = classes.teacher_id', 'left')
                ->where('classes.id', $child->current_class_id)
                ->get()
                ->getRow();

            if ($classData) {
                $ageLabel = '';
                switch ($classData->age_group) {
                    case '2-3_years': $ageLabel = 'KB A (2-3 Tahun)'; break;
                    case '3-4_years': $ageLabel = 'KB B (3-4 Tahun)'; break;
                    case '4-6_years': $ageLabel = 'TK (4-6 Tahun)'; break;
                    default: $ageLabel = str_replace('_', ' ', $classData->age_group);
                }
                $className = $classData->class_name . ' - ' . $ageLabel;
                $teacherName = $classData->teacher_name ?? 'Belum ditugaskan';
            }
        }

        // Fetch Daily Activities from database
        $dailyModel = new \App\Models\DailyReportModel();
        $dailyActivitiesRaw = $dailyModel
            ->where('student_id', $child->id)
            ->orderBy('date', 'DESC')
            ->findAll();

        $dailyActivities = [];
        foreach ($dailyActivitiesRaw as $da) {
            $dailyActivities[] = [
                'id' => $da->id,
                'date' => $da->date,
                'title' => 'Laporan Aktivitas Harian',
                'description' => $da->activities,
                'mood' => 'Aktif',
                'teacher' => 'Guru Kelas',
                'photo' => $da->photo
            ];
        }

        // Fetch Semester Reports from database
        $semesterModel = new \App\Models\SemesterReportModel();
        $semesterReports = $semesterModel
            ->where('student_id', $child->id)
            ->orderBy('id', 'DESC')
            ->findAll();

        $formattedSemester = null;
        if (!empty($semesterReports)) {
            $latest = $semesterReports[0];
            $formattedSemester = [
                'academic_year' => $latest->academic_year,
                'semester' => $latest->semester,
                'summary' => $latest->general_notes,
                'grades' => [
                    ['aspect' => 'Nilai Agama & Moral', 'grade' => 'Evaluasi', 'desc' => $latest->religion_morals],
                    ['aspect' => 'Fisik Motorik', 'grade' => 'Evaluasi', 'desc' => $latest->physical_motor],
                    ['aspect' => 'Kognitif', 'grade' => 'Evaluasi', 'desc' => $latest->cognitive],
                    ['aspect' => 'Bahasa & Komunikasi', 'grade' => 'Evaluasi', 'desc' => $latest->language],
                    ['aspect' => 'Sosial Emosional', 'grade' => 'Evaluasi', 'desc' => $latest->social_emotional],
                    ['aspect' => 'Seni & Kreativitas', 'grade' => 'Evaluasi', 'desc' => $latest->art]
                ]
            ];
        }

        // Fetch Child's Attendance
        $attendanceModel = new \App\Models\StudentAttendanceModel();
        $attendance = $attendanceModel
            ->where('student_id', $child->id)
            ->orderBy('date', 'DESC')
            ->findAll();

        // Fetch Class Announcements
        $announcements = [];
        if ($child->current_class_id) {
            $announcementModel = new \App\Models\ClassAnnouncementModel();
            $announcements = $announcementModel
                ->where('class_id', $child->current_class_id)
                ->orderBy('id', 'DESC')
                ->findAll();
        }

        return $this->respondSuccess([
            'children' => array_map(static fn ($item) => [
                'id' => $item->id,
                'full_name' => $item->full_name,
                'registration_number' => $item->registration_number,
            ], $children),
            'child' => [
                'id'            => $child->id,
                'full_name'     => $child->full_name,
                'registration_number' => $child->registration_number,
                'gender'        => $child->gender === 'L' ? 'Laki-laki' : 'Perempuan',
                'birth_date'    => $child->birth_date,
                'class_name'    => $className,
                'teacher_name'   => $teacherName,
                'photo'         => $child->photo,
            ],
            'spp_invoices'     => $sppInvoices,
            'daily_activities' => $dailyActivities,
            'semester_report'  => $formattedSemester,
            'attendance'       => $attendance,
            'announcements'    => $announcements
        ]);
    }

    /**
     * POST /api/v1/parent/spp/pay/{id}
     */
    public function paySpp($id = null): ResponseInterface
    {
        $user = $this->request->user ?? null;
        if (!$user || $user->role !== 'parent') {
            return $this->respondError('Unauthorized parent access', ResponseInterface::HTTP_FORBIDDEN);
        }

        $invoice = $this->sppInvoiceModel->find($id);
        if (!$invoice) {
            return $this->respondError('Tagihan SPP tidak ditemukan', ResponseInterface::HTTP_NOT_FOUND);
        }

        // Verify that this invoice belongs to the parent's child
        $child = $this->studentModel
            ->where('id', $invoice->student_id)
            ->where('parent_user_id', $user->id)
            ->first();
        if (!$child) {
            return $this->respondError('Akses tagihan ditolak.', ResponseInterface::HTTP_FORBIDDEN);
        }

        if ($invoice->status === 'paid') {
            return $this->respondError('Tagihan ini sudah lunas terbayar.', ResponseInterface::HTTP_BAD_REQUEST);
        }

        $paymentMethod = $this->request->getVar('payment_method') ?? 'Virtual Account Mandiri';

        // Call Tripay Service
        $tripayService = new \App\Libraries\TripayService();

        try {
            $monthName = date('F Y', strtotime($invoice->month . '-01'));
            $tripayRes = $tripayService->createClosedTransaction([
                'method'          => $paymentMethod,
                'merchant_ref'    => 'SPP-' . $invoice->id . '-' . time(),
                'amount'          => $invoice->amount,
                'customer_name'   => $child->full_name,
                'customer_email'  => $user->email,
                'item_name'       => 'SPP Bulan ' . $monthName
            ]);

            $tripayData = $tripayRes['data'];

            $this->sppInvoiceModel->update($invoice->id, [
                'tripay_reference'      => $tripayData['reference'],
                'tripay_pay_code'       => $tripayData['pay_code'],
                'tripay_payment_method' => $paymentMethod,
                'tripay_instructions'   => json_encode($tripayData['instructions'] ?? [])
            ]);

            return $this->respondSuccess([
                'invoice'     => $this->sppInvoiceModel->find($invoice->id),
                'tripay_data' => $tripayData
            ], 'Instruksi pembayaran berhasil dibuat.');

        } catch (Exception $e) {
            log_message('error', 'SPP checkout failed: {message}', ['message' => $e->getMessage()]);
            return $this->respondError('Penyedia pembayaran sedang tidak tersedia.', ResponseInterface::HTTP_SERVICE_UNAVAILABLE);
        }
    }
}
