<?php

namespace App\Controllers\Admin;

use App\Controllers\BaseResourceController;
use App\Models\AccreditationFileModel;
use CodeIgniter\HTTP\ResponseInterface;

class AccreditationController extends BaseResourceController
{
    protected AccreditationFileModel $accreditationModel;

    public function __construct()
    {
        $this->accreditationModel = new AccreditationFileModel();
    }

    /**
     * GET /api/v1/admin/accreditation
     * Get all accreditation files for current school
     */
    public function index(): ResponseInterface
    {
        $schoolId = defined('CURRENT_SCHOOL_ID') ? CURRENT_SCHOOL_ID : null;
        if (!$schoolId) {
            return $this->respondError('School context required', ResponseInterface::HTTP_BAD_REQUEST);
        }

        $files = $this->accreditationModel->where('school_id', $schoolId)->findAll();
        return $this->respondSuccess($files, 'Accreditation files retrieved successfully');
    }

    /**
     * POST /api/v1/admin/accreditation/save
     * Create or update an accreditation file link
     */
    public function save(): ResponseInterface
    {
        $schoolId = defined('CURRENT_SCHOOL_ID') ? CURRENT_SCHOOL_ID : null;
        if (!$schoolId) {
            return $this->respondError('School context required', ResponseInterface::HTTP_BAD_REQUEST);
        }

        $body = $this->getRequestBody();
        $id = $body['id'] ?? null;
        $topic = $body['topic'] ?? null;
        $subTopic = $body['sub_topic'] ?? null;
        $fileName = $body['file_name'] ?? null;
        $fileLink = $body['file_link'] ?? null;

        if (empty($topic) || empty($subTopic) || empty($fileName) || empty($fileLink)) {
            return $this->respondError('Semua field (Topik, Sub Topik, Nama File, dan Link File) wajib diisi.', ResponseInterface::HTTP_BAD_REQUEST);
        }

        // Validate URL format roughly (should start with http/https)
        if (!filter_var($fileLink, FILTER_VALIDATE_URL)) {
            return $this->respondError('Format Link File (Google Drive) tidak valid. Harus diawali dengan http:// atau https://', ResponseInterface::HTTP_BAD_REQUEST);
        }

        $saveData = [
            'school_id' => $schoolId,
            'topic'     => $topic,
            'sub_topic' => $subTopic,
            'file_name' => $fileName,
            'file_link' => $fileLink
        ];

        if ($id) {
            $existing = $this->accreditationModel->where('school_id', $schoolId)->find($id);
            if (!$existing) {
                return $this->respondError('Data file tidak ditemukan.', ResponseInterface::HTTP_NOT_FOUND);
            }
            $this->accreditationModel->update($id, $saveData);
            return $this->respondSuccess(null, 'Link file akreditasi berhasil diperbarui.');
        } else {
            $insertedId = $this->accreditationModel->insert($saveData);
            return $this->respondSuccess(['id' => $insertedId], 'Link file akreditasi berhasil ditambahkan.');
        }
    }

    /**
     * DELETE /api/v1/admin/accreditation/delete/(:num)
     * Delete an accreditation file link
     */
    public function delete($id = null): ResponseInterface
    {
        $schoolId = defined('CURRENT_SCHOOL_ID') ? CURRENT_SCHOOL_ID : null;
        if (!$schoolId) {
            return $this->respondError('School context required', ResponseInterface::HTTP_BAD_REQUEST);
        }

        if (!$id) {
            return $this->respondError('ID is required', ResponseInterface::HTTP_BAD_REQUEST);
        }

        $existing = $this->accreditationModel->where('school_id', $schoolId)->find($id);
        if (!$existing) {
            return $this->respondError('Data file tidak ditemukan.', ResponseInterface::HTTP_NOT_FOUND);
        }

        $this->accreditationModel->delete($id);
        return $this->respondSuccess(null, 'Link file akreditasi berhasil dihapus.');
    }
}
