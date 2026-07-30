<?php

namespace App\Controllers\Admin;

use App\Controllers\BaseResourceController;
use App\Models\TeacherModel;
use App\Models\StudentModel;
use App\Models\PpdbRegistrationModel;
use App\Models\SchoolContentModel;
use App\Models\SchoolModel;
use App\Models\AuditLogModel;
use App\Models\ClassModel;
use App\Models\AcademicYearModel;
use App\Models\WebsiteSettingModel;
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
        $totalClasses = (new ClassModel())->where('school_id', $schoolId)->countAllResults();
        $hasAcademicYear = (new AcademicYearModel())->where('school_id', $schoolId)->countAllResults() > 0;
        $hasWebsiteSettings = (new WebsiteSettingModel())->where('school_id', $schoolId)->countAllResults() > 0;

        // 2. School / Subscription / Domain Settings
        $school = $schoolModel->find($schoolId);

        // Storage accounting starts at private tenant uploads. Public legacy
        // assets are intentionally not attributed to an arbitrary tenant.
        $storageUsed = $this->directorySizeMb(WRITEPATH . 'uploads/ppdb/' . $schoolId);
        $storageLimit = 1000; // MB (1 GB)

        $activityLogs = array_map(static fn ($log) => [
            'id' => $log->id,
            'user' => $log->role ?: 'system',
            'action' => $log->action,
            'time' => $log->created_at,
            'ip' => $log->ip_address,
        ], (new AuditLogModel())->where('school_id', $schoolId)->orderBy('created_at', 'DESC')->findAll(10));

        $months = [];
        for ($i = 6; $i >= 0; $i--) {
            $key = date('Y-m', strtotime("-{$i} months"));
            $months[$key] = 0;
        }
        foreach ($ppdbModel->where('school_id', $schoolId)->where('created_at >=', array_key_first($months) . '-01')->findAll() as $row) {
            $key = substr((string) $row->created_at, 0, 7);
            if (isset($months[$key])) $months[$key]++;
        }
        $chartData = array_map(static fn ($key, $value) => [
            'label' => date('M', strtotime($key . '-01')),
            'value' => $value,
        ], array_keys($months), array_values($months));

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
                'subdomain'         => ($school->subdomain ?? 'koola') . '.koola.id',
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
            'onboarding' => [
                ['label' => 'Lengkapi profil sekolah', 'complete' => $hasWebsiteSettings, 'path' => '/admin/website-builder'],
                ['label' => 'Atur tahun ajaran', 'complete' => $hasAcademicYear, 'path' => '/admin/website-builder'],
                ['label' => 'Tambahkan guru', 'complete' => $totalTeachers > 0, 'path' => '/admin/teachers'],
                ['label' => 'Buat kelas', 'complete' => $totalClasses > 0, 'path' => '/admin/classes'],
                ['label' => 'Tambahkan siswa', 'complete' => $totalStudents > 0, 'path' => '/admin/students'],
            ],
        ], 'Dashboard statistics compiled successfully');
    }

    private function directorySizeMb(string $path): float
    {
        if (!is_dir($path)) return 0.0;
        $bytes = 0;
        foreach (new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($path, \FilesystemIterator::SKIP_DOTS)) as $file) {
            if ($file->isFile()) $bytes += $file->getSize();
        }
        return round($bytes / 1048576, 2);
    }
}
