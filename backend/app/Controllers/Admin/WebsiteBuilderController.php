<?php

namespace App\Controllers\Admin;

use App\Controllers\BaseResourceController;
use App\Models\WebsiteSettingModel;
use App\Models\SchoolProfileModel;
use App\Models\SchoolContentModel;
use App\Libraries\UploadService;
use CodeIgniter\HTTP\ResponseInterface;
use Exception;

class WebsiteBuilderController extends BaseResourceController
{
    protected WebsiteSettingModel $webSettingsModel;
    protected SchoolProfileModel $profileModel;
    protected SchoolContentModel $contentModel;
    protected UploadService $uploadService;

    public function __construct()
    {
        $this->webSettingsModel = new WebsiteSettingModel();
        $this->profileModel = new SchoolProfileModel();
        $this->contentModel = new SchoolContentModel();
        $this->uploadService = new UploadService();
    }

    /**
     * GET /api/v1/admin/website/settings
     */
    public function getSettings(): ResponseInterface
    {
        $schoolId = defined('CURRENT_SCHOOL_ID') ? CURRENT_SCHOOL_ID : null;
        if (!$schoolId) {
            return $this->respondError('School context required', ResponseInterface::HTTP_BAD_REQUEST);
        }

        $settings = $this->webSettingsModel->where('school_id', $schoolId)->first();
        if (!$settings) {
            // Create default settings on first lookup
            $id = $this->webSettingsModel->insert([
                'school_id' => $schoolId,
                'theme_color' => '#6366F1',
                'theme_template' => 'ceria'
            ]);
            $settings = $this->webSettingsModel->find($id);
        }

        $settings = $this->formatSettings($settings);

        $profile = $this->profileModel->where('school_id', $schoolId)->first();
        if (!$profile) {
            $id = $this->profileModel->insert([
                'school_id' => $schoolId
            ]);
            $profile = $this->profileModel->find($id);
        }

        return $this->respondSuccess([
            'settings' => $settings,
            'profile' => $profile
        ]);
    }

    /**
     * POST /api/v1/admin/website/settings
     */
    public function saveSettings(): ResponseInterface
    {
        $schoolId = defined('CURRENT_SCHOOL_ID') ? CURRENT_SCHOOL_ID : null;
        $settings = $this->webSettingsModel->where('school_id', $schoolId)->first();
        
        $data = $this->request->getPost();

        // Decode JSON arrays sent as string fields from form-data
        if (isset($data['menu_data']) && is_string($data['menu_data'])) {
            $data['menu_data'] = json_decode($data['menu_data'], true);
        }
        if (isset($data['contact_info']) && is_string($data['contact_info'])) {
            $data['contact_info'] = json_decode($data['contact_info'], true);
        }
        if (isset($data['slider_images']) && is_string($data['slider_images'])) {
            $data['slider_images'] = json_decode($data['slider_images'], true);
        }

        // Handle Logo Upload
        $logoFile = $this->request->getFile('logo_file');
        if ($logoFile && $logoFile->isValid()) {
            try {
                $data['logo'] = $this->uploadService->uploadImage($logoFile, 'uploads/website');
            } catch (Exception $e) {
                return $this->respondError($e->getMessage(), ResponseInterface::HTTP_BAD_REQUEST);
            }
        }

        // Handle Favicon Upload
        $faviconFile = $this->request->getFile('favicon_file');
        if ($faviconFile && $faviconFile->isValid()) {
            try {
                $data['favicon'] = $this->uploadService->uploadImage($faviconFile, 'uploads/website');
            } catch (Exception $e) {
                return $this->respondError($e->getMessage(), ResponseInterface::HTTP_BAD_REQUEST);
            }
        }

        // Handle Hero Banner Upload
        $bannerFile = $this->request->getFile('banner_file');
        if ($bannerFile && $bannerFile->isValid()) {
            try {
                $data['hero_banner_image'] = $this->uploadService->uploadImage($bannerFile, 'uploads/website');
            } catch (Exception $e) {
                return $this->respondError($e->getMessage(), ResponseInterface::HTTP_BAD_REQUEST);
            }
        }

        // Re-encode arrays to JSON strings for database compatibility
        if (isset($data['menu_data']) && is_array($data['menu_data'])) {
            $data['menu_data'] = json_encode($data['menu_data']);
        }
        if (isset($data['contact_info']) && is_array($data['contact_info'])) {
            $data['contact_info'] = json_encode($data['contact_info']);
        }
        if (isset($data['slider_images']) && is_array($data['slider_images'])) {
            $data['slider_images'] = json_encode($data['slider_images']);
        }

        $this->webSettingsModel->update($settings->id, $data);
        $this->invalidateCache($schoolId);

        $updatedSettings = $this->formatSettings($this->webSettingsModel->find($settings->id));
        return $this->respondSuccess($updatedSettings, 'Website settings saved successfully');
    }

    /**
     * Helper to decode JSON fields back to PHP objects/arrays for API response.
     */
    private function formatSettings($settings)
    {
        if ($settings) {
            if (isset($settings->contact_info) && is_string($settings->contact_info)) {
                $settings->contact_info = json_decode($settings->contact_info);
            }
            if (isset($settings->menu_data) && is_string($settings->menu_data)) {
                $settings->menu_data = json_decode($settings->menu_data);
            }
            if (isset($settings->slider_images) && is_string($settings->slider_images)) {
                $settings->slider_images = json_decode($settings->slider_images);
            }
        }
        return $settings;
    }

    /**
     * POST /api/v1/admin/website/profile
     */
    public function saveProfile(): ResponseInterface
    {
        $schoolId = defined('CURRENT_SCHOOL_ID') ? CURRENT_SCHOOL_ID : null;
        $profile = $this->profileModel->where('school_id', $schoolId)->first();

        $data = $this->request->getPost();

        // Handle Principal Photo Upload
        $photoFile = $this->request->getFile('principal_photo_file');
        if ($photoFile && $photoFile->isValid()) {
            try {
                $data['principal_photo'] = $this->uploadService->uploadImage($photoFile, 'uploads/website');
            } catch (Exception $e) {
                return $this->respondError($e->getMessage(), ResponseInterface::HTTP_BAD_REQUEST);
            }
        }

        $this->profileModel->update($profile->id, $data);
        $this->invalidateCache($schoolId);

        return $this->respondSuccess($this->profileModel->find($profile->id), 'School profile settings saved successfully');
    }

    /**
     * POST /api/v1/admin/website/contents
     * CRUD endpoint for News/Gallery/Events
     */
    public function createContent(): ResponseInterface
    {
        $data = $this->request->getPost();
        
        $imageFile = $this->request->getFile('image_file');
        if ($imageFile && $imageFile->isValid()) {
            try {
                $data['image'] = $this->uploadService->uploadImage($imageFile, 'uploads/contents');
            } catch (Exception $e) {
                return $this->respondError($e->getMessage(), ResponseInterface::HTTP_BAD_REQUEST);
            }
        }

        $data['created_by'] = $this->request->user ? $this->request->user->id : null;

        // Empty category_id check
        if (isset($data['category_id']) && $data['category_id'] === '') {
            $data['category_id'] = null;
        }

        if (!$this->contentModel->insert($data)) {
            return $this->respondError('Failed to save content', ResponseInterface::HTTP_BAD_REQUEST, $this->contentModel->errors());
        }

        $insertId = $this->contentModel->getInsertID();
        $this->invalidateCache(defined('CURRENT_SCHOOL_ID') ? CURRENT_SCHOOL_ID : null);

        // Fetch with joined category
        $db = \Config\Database::connect();
        $newContent = $db->table('school_contents')
            ->select('school_contents.*, news_categories.name as category_name')
            ->join('news_categories', 'news_categories.id = school_contents.category_id', 'left')
            ->where('school_contents.id', $insertId)
            ->get()->getRow();

        return $this->respondSuccess($newContent, 'Content created successfully');
    }

    /**
     * GET /api/v1/admin/website/contents
     */
    public function getContents(): ResponseInterface
    {
        $type = $this->request->getVar('type');
        
        $db = \Config\Database::connect();
        $builder = $db->table('school_contents')
            ->select('school_contents.*, news_categories.name as category_name')
            ->join('news_categories', 'news_categories.id = school_contents.category_id', 'left')
            ->where('school_contents.school_id', defined('CURRENT_SCHOOL_ID') ? CURRENT_SCHOOL_ID : null)
            ->where('school_contents.deleted_at IS NULL');
        
        if ($type) {
            $builder->where('school_contents.type', $type);
        }

        $contents = $builder->orderBy('school_contents.created_at', 'DESC')->get()->getResult();
        return $this->respondSuccess($contents);
    }

    /**
     * POST /api/v1/admin/website/contents/update/{id}
     */
    public function updateContent($id = null): ResponseInterface
    {
        $content = $this->contentModel->find($id);
        if (!$content) {
            return $this->respondError('Content not found', ResponseInterface::HTTP_NOT_FOUND);
        }

        $data = $this->request->getPost();
        
        $imageFile = $this->request->getFile('image_file');
        if ($imageFile && $imageFile->isValid()) {
            try {
                $data['image'] = $this->uploadService->uploadImage($imageFile, 'uploads/contents');
                if ($content->image && file_exists(ROOTPATH . 'public/' . $content->image)) {
                    unlink(ROOTPATH . 'public/' . $content->image);
                }
            } catch (Exception $e) {
                return $this->respondError($e->getMessage(), ResponseInterface::HTTP_BAD_REQUEST);
            }
        }

        // Empty category_id check
        if (isset($data['category_id']) && $data['category_id'] === '') {
            $data['category_id'] = null;
        }

        $this->contentModel->update($id, $data);
        $this->invalidateCache(defined('CURRENT_SCHOOL_ID') ? CURRENT_SCHOOL_ID : null);

        // Fetch with joined category
        $db = \Config\Database::connect();
        $updated = $db->table('school_contents')
            ->select('school_contents.*, news_categories.name as category_name')
            ->join('news_categories', 'news_categories.id = school_contents.category_id', 'left')
            ->where('school_contents.id', $id)
            ->get()->getRow();

        return $this->respondSuccess($updated, 'Content updated successfully');
    }

    /**
     * DELETE /api/v1/admin/website/contents/delete/{id}
     */
    public function deleteContent($id = null): ResponseInterface
    {
        $content = $this->contentModel->find($id);
        if (!$content) {
            return $this->respondError('Content not found', ResponseInterface::HTTP_NOT_FOUND);
        }

        $this->contentModel->delete($id);
        $this->invalidateCache(defined('CURRENT_SCHOOL_ID') ? CURRENT_SCHOOL_ID : null);

        return $this->respondSuccess(null, 'Content deleted successfully');
    }

    // ==========================================
    // NEWS CATEGORIES CRUD
    // ==========================================

    /**
     * GET /api/v1/admin/website/categories
     */
    public function getCategories(): ResponseInterface
    {
        $schoolId = defined('CURRENT_SCHOOL_ID') ? CURRENT_SCHOOL_ID : null;
        $categoryModel = new \App\Models\NewsCategoryModel();
        $categories = $categoryModel->where('school_id', $schoolId)->orderBy('name', 'ASC')->findAll();
        return $this->respondSuccess($categories);
    }

    /**
     * POST /api/v1/admin/website/categories
     */
    public function createCategory(): ResponseInterface
    {
        $categoryModel = new \App\Models\NewsCategoryModel();
        
        // Support JSON request payloads from Axios
        $name = $this->request->getVar('name');
        
        if (empty($name)) {
            return $this->respondError('Category Name is required', ResponseInterface::HTTP_BAD_REQUEST);
        }

        $data = ['name' => $name];

        if (!$categoryModel->insert($data)) {
            return $this->respondError('Failed to create category', ResponseInterface::HTTP_BAD_REQUEST, $categoryModel->errors());
        }

        $this->invalidateCache(defined('CURRENT_SCHOOL_ID') ? CURRENT_SCHOOL_ID : null);
        return $this->respondSuccess($categoryModel->find($categoryModel->getInsertID()), 'Category created successfully');
    }

    /**
     * POST /api/v1/admin/website/categories/update/{id}
     */
    public function updateCategory($id = null): ResponseInterface
    {
        $categoryModel = new \App\Models\NewsCategoryModel();
        $category = $categoryModel->find($id);
        if (!$category) {
            return $this->respondError('Category not found', ResponseInterface::HTTP_NOT_FOUND);
        }

        // Support JSON request payloads from Axios
        $name = $this->request->getVar('name');
        if (empty($name)) {
            return $this->respondError('Category Name is required', ResponseInterface::HTTP_BAD_REQUEST);
        }

        $data = ['name' => $name];

        if (!$categoryModel->update($id, $data)) {
            return $this->respondError('Failed to update category', ResponseInterface::HTTP_BAD_REQUEST, $categoryModel->errors());
        }

        $this->invalidateCache(defined('CURRENT_SCHOOL_ID') ? CURRENT_SCHOOL_ID : null);
        return $this->respondSuccess($categoryModel->find($id), 'Category updated successfully');
    }

    /**
     * DELETE /api/v1/admin/website/categories/delete/{id}
     */
    public function deleteCategory($id = null): ResponseInterface
    {
        $categoryModel = new \App\Models\NewsCategoryModel();
        $category = $categoryModel->find($id);
        if (!$category) {
            return $this->respondError('Category not found', ResponseInterface::HTTP_NOT_FOUND);
        }

        $categoryModel->delete($id);
        $this->invalidateCache(defined('CURRENT_SCHOOL_ID') ? CURRENT_SCHOOL_ID : null);
        return $this->respondSuccess(null, 'Category deleted successfully');
    }

    /**
     * Helper to clear cached public school profile response.
     */
    private function invalidateCache(?int $schoolId)
    {
        if (!$schoolId) return;
        $cache = \Config\Services::cache();
        $cache->delete("school_profile_{$schoolId}");
        
        $schoolModel = new \App\Models\SchoolModel();
        $school = $schoolModel->find($schoolId);
        if ($school && !empty($school->subdomain)) {
            $cache->delete("school_profile_subdomain_{$school->subdomain}");
        }
    }

    /**
     * GET /api/v1/admin/website/domain-request
     */
    public function getDomainRequest(): ResponseInterface
    {
        $schoolId = defined('CURRENT_SCHOOL_ID') ? CURRENT_SCHOOL_ID : null;
        if (!$schoolId) {
            return $this->respondError('School context required', ResponseInterface::HTTP_BAD_REQUEST);
        }

        $domainReqModel = new \App\Models\DomainRequestModel();
        $request = $domainReqModel->where('school_id', $schoolId)->orderBy('created_at', 'DESC')->first();

        // Get school details
        $schoolModel = new \App\Models\SchoolModel();
        $school = $schoolModel->find($schoolId);

        // Fetch subscription info
        $subModel = new \App\Models\SubscriptionModel();
        $subscription = $subModel->where('school_id', $schoolId)->where('status', 'active')->first();
        
        $planName = $subscription ? $subscription->plan_name : 'premium'; // default trial is premium
        $billingCycle = $subscription ? $subscription->billing_cycle : 'monthly'; // default monthly

        return $this->respondSuccess([
            'request' => $request,
            'school' => [
                'custom_domain' => $school->custom_domain,
                'custom_domain_status' => $school->custom_domain_status,
                'plan_name' => $planName,
                'billing_cycle' => $billingCycle
            ]
        ]);
    }

    /**
     * POST /api/v1/admin/website/domain-request
     */
    public function submitDomainRequest(): ResponseInterface
    {
        $schoolId = defined('CURRENT_SCHOOL_ID') ? CURRENT_SCHOOL_ID : null;
        if (!$schoolId) {
            return $this->respondError('School context required', ResponseInterface::HTTP_BAD_REQUEST);
        }

        // 1. Validate plan must be Premium
        $subModel = new \App\Models\SubscriptionModel();
        $subscription = $subModel->where('school_id', $schoolId)->where('status', 'active')->first();
        $planName = $subscription ? $subscription->plan_name : 'premium';
        $billingCycle = $subscription ? $subscription->billing_cycle : 'monthly';

        if (strtolower($planName) !== 'premium' || strtolower($billingCycle) !== 'yearly') {
            return $this->respondError('Fitur Custom Domain hanya tersedia bagi pengguna Paket Premium dengan siklus tagihan Tahunan (Yearly).', ResponseInterface::HTTP_FORBIDDEN);
        }

        // 2. Validate input domain
        $requestedDomain = $this->request->getVar('requested_domain');
        if (empty($requestedDomain)) {
            return $this->respondError('Nama domain pengajuan wajib diisi.', ResponseInterface::HTTP_BAD_REQUEST);
        }

        // Simple validation check: must end with .sch.id or common domains
        $requestedDomain = strtolower(trim($requestedDomain));
        if (!preg_match('/^[a-z0-9.-]+\.[a-z]{2,6}$/', $requestedDomain)) {
            return $this->respondError('Format nama domain tidak valid. Contoh: sekolahkami.sch.id', ResponseInterface::HTTP_BAD_REQUEST);
        }

        // 3. Document File upload handling
        $file = $this->request->getFile('document_file');
        $documentPath = null;

        if ($file && $file->isValid() && !$file->hasMoved()) {
            // Validation rules: max size 5MB, zip/pdf/jpeg/png
            $rules = [
                'document_file' => [
                    'rules' => 'uploaded[document_file]|max_size[document_file,5120]|ext_in[document_file,zip,rar,pdf,jpg,jpeg,png]',
                    'errors' => [
                        'max_size' => 'Ukuran berkas dokumen terlalu besar, maksimal 5MB.',
                        'ext_in' => 'Format berkas dokumen tidak didukung. Harap upload format ZIP, PDF, JPG, atau PNG.'
                    ]
                ]
            ];

            if (!$this->validate($rules)) {
                return $this->respondError($this->validator->getError('document_file'), ResponseInterface::HTTP_BAD_REQUEST);
            }

            // Move to uploads directory
            $newName = $file->getRandomName();
            $file->move(ROOTPATH . 'public/uploads/documents', $newName);
            $documentPath = 'uploads/documents/' . $newName;
        }

        // 4. Save Domain Request
        $domainReqModel = new \App\Models\DomainRequestModel();
        
        // Deactivate previous requests if any (soft delete)
        $domainReqModel->where('school_id', $schoolId)->whereIn('status', ['pending', 'rejected'])->delete();

        $requestData = [
            'school_id' => $schoolId,
            'requested_domain' => $requestedDomain,
            'status' => 'pending',
            'billing_type' => ($billingCycle === 'yearly') ? 'yearly' : 'monthly',
            'document_file' => $documentPath,
            'admin_note' => null
        ];

        if (!$domainReqModel->insert($requestData)) {
            return $this->respondError('Gagal menyimpan pengajuan domain.', ResponseInterface::HTTP_INTERNAL_SERVER_ERROR);
        }

        // 5. Update School status
        $schoolModel = new \App\Models\SchoolModel();
        $schoolModel->update($schoolId, [
            'custom_domain_status' => 'pending'
        ]);

        $this->invalidateCache($schoolId);

        return $this->respondSuccess(null, 'Pengajuan custom domain berhasil dikirim. Super Admin akan memproses pengajuan Anda.');
    }
}
