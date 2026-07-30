<?php

namespace App\Controllers\SuperAdmin;

use App\Controllers\BaseResourceController;
use App\Models\SchoolModel;
use App\Models\UserModel;
use App\Models\InvoiceModel;
use CodeIgniter\HTTP\ResponseInterface;

class SuperAdminController extends BaseResourceController
{
    /**
     * GET /api/v1/superadmin/stats
     */
    public function stats(): ResponseInterface
    {
        $schoolModel = new SchoolModel();
        $userModel = new UserModel();
        $invoiceModel = new InvoiceModel();

        $totalSchools = $schoolModel->countAllResults();
        $activeSchools = $schoolModel->where('status', 'active')->countAllResults();
        $totalUsers = $userModel->countAllResults();
        $totalInvoices = $invoiceModel->countAllResults();
        
        $totalRevenue = $invoiceModel->where('status', 'paid')
                                     ->selectSum('amount')
                                     ->first();
        $revenue = $totalRevenue->amount ?? 0;

        return $this->respondSuccess([
            'total_schools'  => $totalSchools,
            'active_schools' => $activeSchools,
            'total_users'    => $totalUsers,
            'total_invoices' => $totalInvoices,
            'total_revenue'  => (float) $revenue
        ], 'SuperAdmin statistics retrieved successfully');
    }

    /**
     * GET /api/v1/superadmin/schools
     */
    public function schools(): ResponseInterface
    {
        $schoolModel = new SchoolModel();
        $schools = $schoolModel->select('schools.*, users.full_name as admin_name, subscriptions.plan_name, subscriptions.end_date as sub_end_date')
                               ->join('users', 'users.school_id = schools.id AND users.role = "admin"', 'left')
                               ->join('subscriptions', 'subscriptions.school_id = schools.id AND subscriptions.status = "active"', 'left')
                               ->orderBy('schools.created_at', 'DESC')
                               ->findAll();

        return $this->respondSuccess($schools, 'Schools retrieved successfully');
    }

    /**
     * POST /api/v1/superadmin/schools/status/(:num)
     */
    public function updateSchoolStatus($id = null): ResponseInterface
    {
        if (!$id) {
            return $this->respondError('School ID is required', ResponseInterface::HTTP_BAD_REQUEST);
        }

        $schoolModel = new SchoolModel();
        $school = $schoolModel->find($id);

        if (!$school) {
            return $this->respondError('School not found', ResponseInterface::HTTP_NOT_FOUND);
        }

        $body = $this->getRequestBody();
        $status = $body['status'] ?? null;

        if (!in_array($status, ['active', 'inactive'])) {
            return $this->respondError('Invalid status. Must be active or inactive.', ResponseInterface::HTTP_BAD_REQUEST);
        }

        $schoolModel->update($id, [
            'status' => $status
        ]);

        // Find the admin user of this school and send a WhatsApp notification
        $userModel = new UserModel();
        $admin = $userModel->where('school_id', $id)
                           ->where('role', 'admin')
                           ->first();

        if ($admin && !empty($school->phone)) {
            $fonnte = new \App\Libraries\FonnteService();
            $statusText = $status === 'active' ? 'AKTIF' : 'NON-AKTIF';
            $message = "Halo *{$admin->full_name}*,\n\nStatus keanggotaan sekolah Anda *{$school->name}* saat ini telah diubah menjadi: *{$statusText}* oleh Administrator Pusat.\n\nJika ini adalah kekeliruan atau ada pertanyaan lebih lanjut, silakan hubungi tim dukungan kami.\n\nTerima kasih,\n*PAUDKU Pusat*";
            $fonnte->sendMessage($school->phone, $message);
        }

        return $this->respondSuccess(null, "School status updated to {$status}");
    }

    /**
     * POST /api/v1/superadmin/schools/update/(:num)
     */
    public function updateSchool($id = null): ResponseInterface
    {
        if (!$id) {
            return $this->respondError('School ID is required', ResponseInterface::HTTP_BAD_REQUEST);
        }

        $schoolModel = new SchoolModel();
        $school = $schoolModel->find($id);

        if (!$school) {
            return $this->respondError('School not found', ResponseInterface::HTTP_NOT_FOUND);
        }

        $body = $this->getRequestBody();
        $name = $body['name'] ?? null;
        $npsn = $body['npsn'] ?? null;
        $level = $body['level'] ?? null;
        $subdomain = $body['subdomain'] ?? null;
        $adminName = $body['admin_name'] ?? null;
        $phone = $body['phone'] ?? null;

        if (empty($name) || empty($subdomain) || empty($level)) {
            return $this->respondError('Nama Sekolah, Subdomain, dan Jenjang wajib diisi.', ResponseInterface::HTTP_BAD_REQUEST);
        }

        // Validate level enum
        if (!in_array($level, ['TK', 'SD', 'SMP', 'SMA', 'MTS_MA', 'SMK', 'PESANTREN'])) {
            return $this->respondError('Jenjang sekolah tidak valid.', ResponseInterface::HTTP_BAD_REQUEST);
        }

        // Check if subdomain taken by other school
        $duplicate = $schoolModel->where('subdomain', $subdomain)->where('id !=', $id)->first();
        if ($duplicate) {
            return $this->respondError('Subdomain sudah digunakan oleh sekolah lain.', ResponseInterface::HTTP_BAD_REQUEST);
        }

        $db = \Config\Database::connect();
        $db->transStart();

        // 1. Update School details
        $schoolModel->update($id, [
            'name'      => $name,
            'npsn'      => $npsn,
            'level'     => $level,
            'subdomain' => $subdomain,
            'phone'     => $phone,
        ]);

        // 2. Update Admin user details (if adminName is provided)
        if (!empty($adminName)) {
            $userModel = new UserModel();
            $admin = $userModel->where('school_id', $id)->where('role', 'admin')->first();
            if ($admin) {
                $userModel->update($admin->id, [
                    'full_name' => $adminName
                ]);
            }
        }

        $db->transComplete();

        if ($db->transStatus() === false) {
            return $this->respondError('Gagal memperbarui data sekolah.', ResponseInterface::HTTP_INTERNAL_SERVER_ERROR);
        }

        return $this->respondSuccess(null, 'Data sekolah berhasil diperbarui.');
    }


    /**
     * POST /api/v1/superadmin/cache/clear
     */
    public function clearCache(): ResponseInterface
    {
        $cache = \Config\Services::cache();
        if ($cache->clean()) {
            return $this->respondSuccess(null, 'Seluruh cache platform berhasil dibersihkan');
        }
        return $this->respondError('Gagal membersihkan cache platform', ResponseInterface::HTTP_INTERNAL_SERVER_ERROR);
    }

    /**
     * GET /api/v1/superadmin/invoices
     */
    public function invoices(): ResponseInterface
    {
        $invoiceModel = new InvoiceModel();
        
        // Join with schools table to show which school the invoice belongs to
        $invoices = $invoiceModel->select('invoices.*, schools.name as school_name')
                                 ->join('schools', 'schools.id = invoices.school_id', 'left')
                                 ->orderBy('invoices.created_at', 'DESC')
                                 ->findAll();

        return $this->respondSuccess($invoices, 'All invoices retrieved successfully');
    }

    /**
     * POST /api/v1/superadmin/impersonate/(:num)
     */
    public function impersonate($schoolId = null): ResponseInterface
    {
        if (!$schoolId) {
            return $this->respondError('School ID is required', ResponseInterface::HTTP_BAD_REQUEST);
        }

        $schoolModel = new SchoolModel();
        $school = $schoolModel->find($schoolId);

        if (!$school) {
            return $this->respondError('School not found', ResponseInterface::HTTP_NOT_FOUND);
        }

        $userModel = new UserModel();
        // Temporarily ignore multi-tenancy query scope using skipValidation or a direct query builder logic
        // because we query globally. 
        $admin = $userModel->where('school_id', $schoolId)
                           ->where('role', 'admin')
                           ->where('status', 'active')
                           ->first();

        if (!$admin) {
            return $this->respondError('Active Administrator user not found for this school', ResponseInterface::HTTP_NOT_FOUND);
        }

        return $this->respondSuccess([
            'code' => (new \App\Services\ImpersonationService())->createCode((int) $admin->school_id, (int) $admin->id),
            'subdomain' => $school->subdomain
        ], 'Single-use impersonation code generated');
    }

    /**
     * GET /api/v1/superadmin/schools/detail/(:num)
     */
    public function schoolDetail($id = null): ResponseInterface
    {
        if (!$id) {
            return $this->respondError('School ID is required', ResponseInterface::HTTP_BAD_REQUEST);
        }

        $schoolModel = new SchoolModel();
        $school = $schoolModel->find($id);

        if (!$school) {
            return $this->respondError('School not found', ResponseInterface::HTTP_NOT_FOUND);
        }

        // Get admin info
        $userModel = new UserModel();
        $admin = $userModel->where('school_id', $id)
                           ->where('role', 'admin')
                           ->first();

        // Count students
        $studentModel = new \App\Models\StudentModel();
        $totalStudents = $studentModel->where('school_id', $id)->countAllResults();

        // Count teachers
        $teacherModel = new \App\Models\TeacherModel();
        $totalTeachers = $teacherModel->where('school_id', $id)->countAllResults();

        // Count classes
        $classModel = new \App\Models\ClassModel();
        $totalClasses = $classModel->where('school_id', $id)->countAllResults();

        // Get subscription plan
        $subscriptionModel = new \App\Models\SubscriptionModel();
        $subscription = $subscriptionModel->where('school_id', $id)->where('status', 'active')->first();

        $planName = $subscription ? $subscription->plan_name : 'premium';
        $expiresAt = $subscription ? $subscription->end_date : date('Y-m-d H:i:s', strtotime('+7 days', strtotime($school->created_at)));
        $planType = $subscription ? 'paid' : 'trial';

        return $this->respondSuccess([
            'school' => $school,
            'admin' => $admin ? [
                'full_name' => $admin->full_name,
                'email' => $admin->email,
                'phone' => $school->phone,
            ] : null,
            'stats' => [
                'total_students' => $totalStudents,
                'total_teachers' => $totalTeachers,
                'total_classes' => $totalClasses
            ],
            'subscription' => [
                'plan_name' => $planName,
                'plan_type' => $planType,
                'expires_at' => $expiresAt
            ]
        ], 'School detail retrieved successfully');
    }

    /**
     * GET /api/v1/superadmin/features
     */
    public function getFeatures(): ResponseInterface
    {
        $featureModel = new \App\Models\FeatureSettingModel();
        $features = $featureModel->findAll();
        return $this->respondSuccess($features, 'Features retrieved successfully');
    }

    /**
     * POST /api/v1/superadmin/features/update
     */
    public function updateFeature(): ResponseInterface
    {
        $rules = [
            'feature_key' => 'required',
            'level'       => 'required|in_list[tk,sd,smp,sma,mts_ma,smk,pesantren,plan_trial,plan_basic,plan_standard,plan_premium]',
            'value'       => 'required|in_list[0,1]'
        ];

        if (!$this->validate($rules)) {
            return $this->respondError($this->validator->getErrors(), 400);
        }

        $featureKey = $this->request->getVar('feature_key');
        $level = $this->request->getVar('level');
        $value = (int) $this->request->getVar('value');

        $featureModel = new \App\Models\FeatureSettingModel();
        $feature = $featureModel->where('feature_key', $featureKey)->first();

        if (!$feature) {
            return $this->respondError('Feature not found', 404);
        }

        $column = $level;
        if (in_array($level, ['tk', 'sd', 'smp', 'sma', 'mts_ma', 'smk', 'pesantren'])) {
            $column = 'level_' . $level;
        }

        $featureModel->update($feature['id'], [$column => $value]);

        return $this->respondSuccess(null, 'Feature setting updated successfully');
    }

    /**
     * POST /api/v1/superadmin/features/create
     */
    public function createFeature(): ResponseInterface
    {
        $rules = [
            'feature_key'  => 'required|is_unique[feature_settings.feature_key]',
            'feature_name' => 'required'
        ];

        if (!$this->validate($rules)) {
            return $this->respondError($this->validator->getErrors(), 400);
        }

        $featureModel = new \App\Models\FeatureSettingModel();
        $id = $featureModel->insert([
            'feature_key'     => $this->request->getVar('feature_key'),
            'feature_name'    => $this->request->getVar('feature_name'),
            'level_tk'        => 0,
            'level_sd'        => 0,
            'level_smp'       => 0,
            'level_sma'       => 0,
            'level_mts_ma'    => 0,
            'level_smk'       => 0,
            'level_pesantren' => 0,
            'plan_trial'      => 1,
            'plan_basic'      => 1,
            'plan_standard'   => 1,
            'plan_premium'    => 1,
        ]);

        $newFeature = $featureModel->find($id);
        return $this->respondSuccess($newFeature, 'Feature created successfully');
    }

    /**
     * DELETE /api/v1/superadmin/features/delete/{id}
     */
    public function deleteFeature($id): ResponseInterface
    {
        $featureModel = new \App\Models\FeatureSettingModel();
        $feature = $featureModel->find($id);

        if (!$feature) {
            return $this->respondError('Feature not found', 404);
        }

        $featureModel->delete($id);
        return $this->respondSuccess(null, 'Feature deleted successfully');
    }

    /**
     * GET /api/v1/superadmin/domain-requests
     */
    public function getDomainRequests(): ResponseInterface
    {
        $db = \Config\Database::connect();
        $requests = $db->table('domain_requests')
            ->select('domain_requests.*, schools.name as school_name, schools.subdomain as school_subdomain')
            ->join('schools', 'schools.id = domain_requests.school_id')
            ->where('domain_requests.deleted_at', null)
            ->orderBy('domain_requests.created_at', 'DESC')
            ->get()->getResult();

        return $this->respondSuccess($requests, 'Domain requests retrieved successfully');
    }

    /**
     * POST /api/v1/superadmin/domain-requests/process/{id}
     */
    public function processDomainRequest($id = null): ResponseInterface
    {
        $domainReqModel = new \App\Models\DomainRequestModel();
        $request = $domainReqModel->find($id);
        if (!$request) {
            return $this->respondError('Domain request not found', ResponseInterface::HTTP_NOT_FOUND);
        }

        $domainReqModel->update($id, ['status' => 'processing']);

        $schoolModel = new \App\Models\SchoolModel();
        $schoolModel->update($request->school_id, ['custom_domain_status' => 'processing']);

        return $this->respondSuccess(null, 'Domain request status updated to processing');
    }

    /**
     * POST /api/v1/superadmin/domain-requests/approve/{id}
     */
    public function approveDomainRequest($id = null): ResponseInterface
    {
        $domainReqModel = new \App\Models\DomainRequestModel();
        $request = $domainReqModel->find($id);
        if (!$request) {
            return $this->respondError('Domain request not found', ResponseInterface::HTTP_NOT_FOUND);
        }

        // Update domain request status to active
        $domainReqModel->update($id, ['status' => 'active']);

        // Update school's custom_domain and custom_domain_status
        $schoolModel = new \App\Models\SchoolModel();
        $domainOwner = $schoolModel->where('custom_domain', $request->requested_domain)
            ->where('id !=', $request->school_id)->first();
        if ($domainOwner) {
            return $this->respondError('Domain is already assigned to another school', ResponseInterface::HTTP_CONFLICT);
        }
        $schoolModel->update($request->school_id, [
            'custom_domain' => $request->requested_domain,
            'custom_domain_status' => 'active'
        ]);

        // Invalidate public website profile cache
        $cache = \Config\Services::cache();
        $cache->delete("school_profile_{$request->school_id}");
        $cache->delete("school_profile_subdomain_{$request->requested_domain}");

        return $this->respondSuccess(null, 'Domain request approved and activated successfully');
    }

    /**
     * POST /api/v1/superadmin/domain-requests/reject/{id}
     */
    public function rejectDomainRequest($id = null): ResponseInterface
    {
        $domainReqModel = new \App\Models\DomainRequestModel();
        $request = $domainReqModel->find($id);
        if (!$request) {
            return $this->respondError('Domain request not found', ResponseInterface::HTTP_NOT_FOUND);
        }

        $adminNote = $this->request->getVar('admin_note') ?: 'Persyaratan dokumen kurang lengkap atau nama domain sudah terpakai.';

        // Update domain request status to rejected and write admin note
        $domainReqModel->update($id, [
            'status' => 'rejected',
            'admin_note' => $adminNote
        ]);

        // Update school's status to rejected
        $schoolModel = new \App\Models\SchoolModel();
        $schoolModel->update($request->school_id, [
            'custom_domain_status' => 'rejected'
        ]);

        return $this->respondSuccess(null, 'Domain request rejected successfully');
    }

    public function downloadDomainDocument($id = null): ResponseInterface
    {
        $request = (new \App\Models\DomainRequestModel())->find($id);
        if (!$request || !$request->document_file) {
            return $this->respondError('Document not found', ResponseInterface::HTTP_NOT_FOUND);
        }

        $base = realpath(WRITEPATH . 'uploads/domains');
        $file = realpath(WRITEPATH . 'uploads/' . ltrim($request->document_file, '/'));
        if (!$base || !$file || !str_starts_with($file, $base . DIRECTORY_SEPARATOR) || !is_file($file)) {
            return $this->respondError('Document not found', ResponseInterface::HTTP_NOT_FOUND);
        }

        return $this->response->download($file, null)->setFileName(
            'domain-request-' . $request->id . '.' . pathinfo($file, PATHINFO_EXTENSION)
        );
    }
}
