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
        if (!$this->ppdbAvailable()) {
            return $this->respondError('PPDB is not available for this school.', ResponseInterface::HTTP_NOT_FOUND);
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
        if (!$this->ppdbAvailable()) {
            return $this->respondError('PPDB is not available for this school.', ResponseInterface::HTTP_FORBIDDEN);
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
        if (($data['privacy_consent'] ?? '0') !== '1') {
            return $this->respondError('Persetujuan pemrosesan data wajib diberikan.', ResponseInterface::HTTP_BAD_REQUEST);
        }
        unset($data['privacy_consent']);
        $data['privacy_consent_at'] = date('Y-m-d H:i:s');
        $data['privacy_version'] = '2026-07-30';
        if (!in_array($data['gender'], ['L', 'P'], true)
            || !preg_match('/^\+?[0-9]{10,15}$/', preg_replace('/[\s-]/', '', $data['parent_phone']))
            || !\DateTimeImmutable::createFromFormat('Y-m-d', $data['birth_date'])) {
            return $this->respondError('Format data pendaftaran tidak valid.', ResponseInterface::HTTP_BAD_REQUEST);
        }

        // Handle Documents Uploads (KK / Akta)
        $uploadedFiles = [];
        $files = $this->request->getFiles();
        if ($files) {
            foreach ($files as $key => $file) {
                if ($file->isValid()) {
                    try {
                        $path = $this->uploadService->uploadPrivateDocument($file, 'ppdb/' . $schoolId);
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

    private function ppdbAvailable(): bool
    {
        return defined('CURRENT_SCHOOL_ID')
            && in_array('ppdb', (new \App\Services\FeatureAccessService())->forSchool((int) CURRENT_SCHOOL_ID), true);
    }

    /**
     * GET /api/v1/ppdb/status/{regNum}
     */
    public function getStatus($regNum = null): ResponseInterface
    {
        if (!defined('CURRENT_SCHOOL_ID')) {
            return $this->respondError('School context not resolved.', ResponseInterface::HTTP_NOT_FOUND);
        }
        if (!$this->ppdbAvailable()) {
            return $this->respondError('PPDB is not available for this school.', ResponseInterface::HTTP_NOT_FOUND);
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
            'registration' => [
                'registration_number' => $registration->registration_number,
                'full_name' => $registration->full_name,
                'status' => $registration->status,
                'payment_status' => $registration->payment_status,
                'admin_notes' => $registration->admin_notes,
                'updated_at' => $registration->updated_at,
            ],
            'instructions' => $settings ? $settings->payment_instructions : '',
            'registration_fee' => $settings ? $settings->registration_fee : 0
        ]);
    }
}
