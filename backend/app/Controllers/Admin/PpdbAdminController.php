<?php

namespace App\Controllers\Admin;

use App\Controllers\BaseResourceController;
use App\Models\PpdbSettingModel;
use App\Models\PpdbRegistrationModel;
use CodeIgniter\HTTP\ResponseInterface;

class PpdbAdminController extends BaseResourceController
{
    protected PpdbSettingModel $settingsModel;
    protected PpdbRegistrationModel $registrationModel;

    public function __construct()
    {
        $this->settingsModel = new PpdbSettingModel();
        $this->registrationModel = new PpdbRegistrationModel();
    }

    /**
     * GET /api/v1/admin/ppdb/settings
     */
    public function getSettings(): ResponseInterface
    {
        $schoolId = defined('CURRENT_SCHOOL_ID') ? CURRENT_SCHOOL_ID : null;
        $settings = $this->settingsModel->where('school_id', $schoolId)->first();

        if (!$settings) {
            $id = $this->settingsModel->insert([
                'school_id' => $schoolId,
                'registration_fee' => 0,
                'is_open' => 0
            ]);
            $settings = $this->settingsModel->find($id);
        }

        return $this->respondSuccess($settings);
    }

    /**
     * POST /api/v1/admin/ppdb/settings
     */
    public function saveSettings(): ResponseInterface
    {
        $schoolId = defined('CURRENT_SCHOOL_ID') ? CURRENT_SCHOOL_ID : null;
        $settings = $this->settingsModel->where('school_id', $schoolId)->first();

        if (!$settings) {
            $id = $this->settingsModel->insert([
                'school_id' => $schoolId,
                'registration_fee' => 0,
                'is_open' => 0
            ]);
            $settings = $this->settingsModel->find($id);
        }

        // Handle JSON or Form URL Encoded or Multipart Form
        $data = $this->request->getJSON(true);
        if (empty($data)) {
            $data = $this->request->getPost();
        }
        if (empty($data)) {
            $data = $this->request->getVar();
        }

        if (empty($data)) {
            return $this->respondError('No data provided to update settings', ResponseInterface::HTTP_BAD_REQUEST);
        }

        $allowedFields = ['registration_fee', 'is_open', 'start_date', 'end_date', 'payment_instructions', 'required_documents'];
        $updateData = [];
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $updateData[$field] = $data[$field];
            }
        }

        if (isset($updateData['required_documents']) && is_string($updateData['required_documents'])) {
            $updateData['required_documents'] = json_decode($updateData['required_documents'], true);
        }

        if (!empty($updateData)) {
            $this->settingsModel->update($settings->id, $updateData);
        }

        return $this->respondSuccess($this->settingsModel->find($settings->id), 'PPDB configurations saved successfully');
    }

    /**
     * GET /api/v1/admin/ppdb/registrations
     */
    public function getRegistrations(): ResponseInterface
    {
        $params = $this->getRequestParams();
        $builder = $this->registrationModel;

        if (!empty($params['search']['q'])) {
            $q = $params['search']['q'];
            $builder->like('full_name', $q)
                    ->orLike('registration_number', $q)
                    ->orLike('parent_name', $q);
        }

        if (isset($params['search']['status']) && $params['search']['status'] !== '') {
            $builder->where('status', $params['search']['status']);
        }

        $registrations = $builder->paginate($params['perPage'], 'default', $params['page']);
        return $this->respondPaginated($registrations, $builder->pager->getDetails());
    }

    /**
     * POST /api/v1/admin/ppdb/registrations/verify/{id}
     */
    public function verifyRegistration($id = null): ResponseInterface
    {
        $registration = $this->registrationModel->find($id);
        if (!$registration) {
            return $this->respondError('Registration record not found', ResponseInterface::HTTP_NOT_FOUND);
        }

        $status = $this->request->getVar('status'); // verified, accepted, rejected
        $notes = $this->request->getVar('admin_notes');

        if (!in_array($status, ['verified', 'accepted', 'rejected'])) {
            return $this->respondError('Invalid registration status', ResponseInterface::HTTP_BAD_REQUEST);
        }

        $this->registrationModel->update($id, [
            'status' => $status,
            'admin_notes' => $notes
        ]);

        return $this->respondSuccess($this->registrationModel->find($id), 'Applicant status updated successfully');
    }

    /**
     * POST /api/v1/admin/ppdb/registrations/confirm-payment/{id}
     */
    public function confirmPayment($id = null): ResponseInterface
    {
        $registration = $this->registrationModel->find($id);
        if (!$registration) {
            return $this->respondError('Registration record not found', ResponseInterface::HTTP_NOT_FOUND);
        }

        $this->registrationModel->update($id, [
            'payment_status' => 'paid'
        ]);

        return $this->respondSuccess($this->registrationModel->find($id), 'Payment confirmed successfully');
    }

    public function downloadDocument($id = null, $documentKey = null): ResponseInterface
    {
        if (!$id || !in_array($documentKey, ['akta_kelahiran', 'kartu_keluarga'], true)) {
            return $this->respondError('Invalid document request', ResponseInterface::HTTP_BAD_REQUEST);
        }

        $registration = $this->registrationModel->find($id);
        $documents = $registration ? json_decode($registration->document_files ?? '{}', true) : [];
        $relative = $documents[$documentKey] ?? null;
        if (!$relative) {
            return $this->respondError('Document not found', ResponseInterface::HTTP_NOT_FOUND);
        }

        $base = realpath(WRITEPATH . 'uploads/ppdb');
        $file = realpath(WRITEPATH . 'uploads/' . ltrim($relative, '/'));
        if (!$base || !$file || !str_starts_with($file, $base . DIRECTORY_SEPARATOR) || !is_file($file)) {
            return $this->respondError('Document not found', ResponseInterface::HTTP_NOT_FOUND);
        }

        return $this->response->download($file, null)->setFileName($documentKey . '-' . $registration->registration_number . '.' . pathinfo($file, PATHINFO_EXTENSION));
    }
}
