<?php

namespace App\Controllers\Admin;

use App\Controllers\BaseResourceController;
use App\Models\AcademicYearModel;
use CodeIgniter\HTTP\ResponseInterface;

class AcademicYearController extends BaseResourceController
{
    protected AcademicYearModel $academicYearModel;

    public function __construct()
    {
        $this->academicYearModel = new AcademicYearModel();
    }

    /**
     * GET /api/v1/admin/academic-years
     */
    public function index(): ResponseInterface
    {
        $params = $this->getRequestParams();
        $academicYears = $this->academicYearModel->orderBy('name', 'DESC')->findAll();
        return $this->respondSuccess($academicYears);
    }

    /**
     * POST /api/v1/admin/academic-years
     */
    public function create(): ResponseInterface
    {
        $name = $this->request->getVar('name'); // e.g. "2026/2027"
        $status = $this->request->getVar('status') ?? 'inactive';

        if (empty($name)) {
            return $this->respondError('Name is required', ResponseInterface::HTTP_BAD_REQUEST);
        }

        $db = \Config\Database::connect();
        $db->transStart();

        // If status is active, set all other academic years in this school to inactive
        if ($status === 'active') {
            $this->academicYearModel->where('status', 'active')->update(null, ['status' => 'inactive']);
        }

        $this->academicYearModel->insert([
            'name'   => $name,
            'status' => $status
        ]);

        $db->transComplete();

        if ($db->transStatus() === false) {
            return $this->respondError('Failed to create academic year', ResponseInterface::HTTP_INTERNAL_SERVER_ERROR);
        }

        return $this->respondSuccess($this->academicYearModel->find($this->academicYearModel->getInsertID()), 'Academic year created successfully', ResponseInterface::HTTP_CREATED);
    }

    /**
     * POST /api/v1/admin/academic-years/update/{id}
     */
    public function update($id = null): ResponseInterface
    {
        $academicYear = $this->academicYearModel->find($id);
        if (!$academicYear) {
            return $this->respondError('Academic year not found', ResponseInterface::HTTP_NOT_FOUND);
        }

        $status = $this->request->getVar('status');
        $name = $this->request->getVar('name');

        $data = [];
        if ($name) $data['name'] = $name;
        if ($status) $data['status'] = $status;

        $db = \Config\Database::connect();
        $db->transStart();

        if (isset($data['status']) && $data['status'] === 'active') {
            // Deactivate all others
            $this->academicYearModel->where('status', 'active')->update(null, ['status' => 'inactive']);
        }

        $this->academicYearModel->update($id, $data);

        $db->transComplete();

        if ($db->transStatus() === false) {
            return $this->respondError('Failed to update academic year', ResponseInterface::HTTP_INTERNAL_SERVER_ERROR);
        }

        return $this->respondSuccess($this->academicYearModel->find($id), 'Academic year updated successfully');
    }

    /**
     * DELETE /api/v1/admin/academic-years/delete/{id}
     */
    public function delete($id = null): ResponseInterface
    {
        $academicYear = $this->academicYearModel->find($id);
        if (!$academicYear) {
            return $this->respondError('Academic year not found', ResponseInterface::HTTP_NOT_FOUND);
        }

        $this->academicYearModel->delete($id);
        return $this->respondSuccess(null, 'Academic year deleted successfully');
    }
}
