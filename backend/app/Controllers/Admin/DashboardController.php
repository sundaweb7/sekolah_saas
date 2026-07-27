<?php

namespace App\Controllers\Admin;

use App\Controllers\BaseResourceController;
use App\Models\TeacherModel;
use App\Models\StudentModel;
use App\Models\PpdbRegistrationModel;
use App\Models\SchoolContentModel;
use App\Models\SchoolModel;
use CodeIgniter\HTTP\ResponseInterface;

class DashboardController extends BaseResourceController
{
    /**
     * GET /api/v1/admin/dashboard/stats
     */
    public function stats(): ResponseInterface
    {
        $schoolId = defined('CURRENT_SCHOOL_ID') ? CURRENT_SCHOOL_ID : null;
        if (!$schoolId) {
            return $this->respondError('School context required', ResponseInterface::HTTP_BAD_REQUEST);
        }

        // 1. Counts
        $teacherModel = new TeacherModel();
        $studentModel = new StudentModel();
        $ppdbModel = new PpdbRegistrationModel();
        $contentModel = new SchoolContentModel();
        $schoolModel = new SchoolModel();

        $totalTeachers = $teacherModel->where('school_id', $schoolId)->countAllResults();
        $totalStudents = $studentModel->where('school_id', $schoolId)->countAllResults();
        $totalPpdb = $ppdbModel->where('school_id', $schoolId)->countAllResults();
        $totalNews = $contentModel->where('school_id', $schoolId)->where('type', 'news')->countAllResults();

        // 2. School / Subscription / Domain Settings
        $school = $schoolModel->find($schoolId);

        // 3. Storage Usage (Mocked/calculated folder size)
        $storageUsed = 12.45; // MB
        $storageLimit = 1000; // MB (1 GB)

        // 4. Activity Logs (Mocked for now as we don't have separate activity log table yet)
        $activityLogs = [
            ['id' => 1, 'user' => 'Admin Sekolah', 'action' => 'Melakukan login ke dashboard', 'time' => '10 menit yang lalu', 'ip' => '127.0.0.1'],
            ['id' => 2, 'user' => 'Admin Sekolah', 'action' => 'Mengupdate warna tema website', 'time' => '2 jam yang lalu', 'ip' => '127.0.0.1'],
            ['id' => 3, 'user' => 'Admin Sekolah', 'action' => 'Menerima berkas PPDB calon siswa', 'time' => '1 hari yang lalu', 'ip' => '127.0.0.1'],
            ['id' => 4, 'user' => 'Admin Sekolah', 'action' => 'Mengimpor data master siswa via Excel', 'time' => '2 hari yang lalu', 'ip' => '127.0.0.1']
        ];

        // 5. Chart Data (Monthly PPDB Registrations mock)
        $chartData = [
            ['label' => 'Jan', 'value' => 5],
            ['label' => 'Feb', 'value' => 12],
            ['label' => 'Mar', 'value' => 18],
            ['label' => 'Apr', 'value' => 24],
            ['label' => 'Mei', 'value' => 35],
            ['label' => 'Jun', 'value' => 45],
            ['label' => 'Jul', 'value' => 50],
        ];

        // Get active subscription data
        $subModel = new \App\Models\SubscriptionModel();
        $subscription = $subModel->where('school_id', $schoolId)->where('status', 'active')->orderBy('end_date', 'DESC')->first();
        
        $planName  = $subscription ? ucfirst($subscription->plan_name) : 'Uji Coba';
        $expiresAt = $subscription ? $subscription->end_date : date('Y-m-d', strtotime('+7 days'));

        return $this->respondSuccess([
            'counts' => [
                'teachers' => $totalTeachers,
                'students' => $totalStudents,
                'ppdb'     => $totalPpdb,
                'news'     => $totalNews,
            ],
            'school' => [
                'name'              => $school->name ?? 'PAUD/TK',
                'subdomain'         => ($school->subdomain ?? 'paudku') . '.paudku.id',
                'subscription_plan' => $planName,
                'subscription_type' => $subscription ? 'paid' : 'trial',
                'expires_at'        => $expiresAt,
                'status'            => $school->status ?? 'active',
            ],
            'storage' => [
                'used'  => $storageUsed,
                'limit' => $storageLimit,
            ],
            'activity_logs' => $activityLogs,
            'chart_data'    => $chartData,
        ], 'Dashboard statistics compiled successfully');
    }
}
