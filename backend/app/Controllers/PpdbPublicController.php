<?php

namespace App\Controllers;

use App\Models\PpdbSettingModel;
use App\Models\PpdbRegistrationModel;
use App\Libraries\UploadService;
use CodeIgniter\HTTP\ResponseInterface;
use Exception;

class PpdbPublicController extends BaseResourceController
{
    protected PpdbSettingModel $settingsModel;
    protected PpdbRegistrationModel $registrationModel;
    protected UploadService $uploadService;

    public function __construct()
    {
        $this->settingsModel = new PpdbSettingModel();
        $this->registrationModel = new PpdbRegistrationModel();
        $this->uploadService = new UploadService();
    }

    /**
     * GET /api/v1/ppdb/settings
     */
    public function getSettings(): ResponseInterface
    {
        if (!defined('CURRENT_SCHOOL_ID')) {
            return $this->respondError('School context not resolved.', ResponseInterface::HTTP_NOT_FOUND);
        }

        $settings = $this->settingsModel->where('school_id', CURRENT_SCHOOL_ID)->first();
        if (!$settings) {
            return $this->respondError('PPDB is not configured for this school.', ResponseInterface::HTTP_NOT_FOUND);
        }

        return $this->respondSuccess($settings);
    }

    /**
     * POST /api/v1/ppdb/register
     */
    public function register(): ResponseInterface
    {
        if (!defined('CURRENT_SCHOOL_ID')) {
            return $this->respondError('School context not resolved.', ResponseInterface::HTTP_NOT_FOUND);
        }

        $schoolId = CURRENT_SCHOOL_ID;

        // Check if PPDB is open
        $settings = $this->settingsModel->where('school_id', $schoolId)->first();
        if (!$settings || !$settings->is_open) {
            return $this->respondError('Pendaftaran PPDB online saat ini sedang ditutup.', ResponseInterface::HTTP_BAD_REQUEST);
        }

        $data = $this->request->getPost();
        $data['school_id'] = $schoolId;

        // Validate required fields
        if (empty($data['full_name']) || empty($data['birth_date']) || empty($data['gender']) || empty($data['parent_name']) || empty($data['parent_phone'])) {
            return $this->respondError('Semua kolom data diri wajib diisi.', ResponseInterface::HTTP_BAD_REQUEST);
        }

        // Handle Documents Uploads (KK / Akta)
        $uploadedFiles = [];
        $files = $this->request->getFiles();
        if ($files) {
            foreach ($files as $key => $file) {
                if ($file->isValid()) {
                    try {
                        // Upload files to writable/uploads/ppdb/
                        $path = $this->uploadService->uploadImage($file, 'uploads/ppdb');
                        $uploadedFiles[$key] = $path;
                    } catch (Exception $e) {
                        return $this->respondError($e->getMessage(), ResponseInterface::HTTP_BAD_REQUEST);
                    }
                }
            }
        }

        if (!empty($uploadedFiles)) {
            $data['document_files'] = json_encode($uploadedFiles);
        }

        $data['status'] = 'pending';
        $data['payment_status'] = ($settings->registration_fee > 0) ? 'unpaid' : 'paid';

        if (!$this->registrationModel->insert($data)) {
            return $this->respondError('Pendaftaran gagal disimpan.', ResponseInterface::HTTP_BAD_REQUEST, $this->registrationModel->errors());
        }

        $id = $this->registrationModel->getInsertID();
        $registeredStudent = $this->registrationModel->find($id);

        return $this->respondSuccess($registeredStudent, 'Pendaftaran berhasil dikirim. Simpan Nomor Pendaftaran Anda!', ResponseInterface::HTTP_CREATED);
    }

    /**
     * GET /api/v1/ppdb/status/{regNum}
     */
    public function getStatus($regNum = null): ResponseInterface
    {
        if (!defined('CURRENT_SCHOOL_ID')) {
            return $this->respondError('School context not resolved.', ResponseInterface::HTTP_NOT_FOUND);
        }

        $registration = $this->registrationModel
            ->where('registration_number', $regNum)
            ->where('school_id', CURRENT_SCHOOL_ID)
            ->first();

        if (!$registration) {
            return $this->respondError('Nomor Pendaftaran tidak ditemukan.', ResponseInterface::HTTP_NOT_FOUND);
        }

        // Fetch settings to include payment instructions
        $settings = $this->settingsModel->where('school_id', CURRENT_SCHOOL_ID)->first();

        return $this->respondSuccess([
            'registration' => $registration,
            'instructions' => $settings ? $settings->payment_instructions : '',
            'registration_fee' => $settings ? $settings->registration_fee : 0
        ]);
    }
}
