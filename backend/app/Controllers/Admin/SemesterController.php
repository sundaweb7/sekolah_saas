<?php

namespace App\Controllers\Admin;

use App\Controllers\BaseResourceController;
use App\Models\SemesterModel;
use CodeIgniter\HTTP\ResponseInterface;

class SemesterController extends BaseResourceController
{
    protected SemesterModel $semesterModel;

    public function __construct()
    {
        $this->semesterModel = new SemesterModel();
    }

    /**
     * GET /api/v1/admin/semesters
     */
    public function index(): ResponseInterface
    {
        $semesters = $this->semesterModel->findAll();
        return $this->respondSuccess($semesters);
    }

    /**
     * POST /api/v1/admin/semesters
     */
    public function create(): ResponseInterface
    {
        $academicYearId = $this->request->getVar('academic_year_id');
        $name = $this->request->getVar('name'); // Ganjil / Genap
        $status = $this->request->getVar('status') ?? 'inactive';

        if (empty($academicYearId) || empty($name)) {
            return $this->respondError('Academic Year ID and Semester Name are required', ResponseInterface::HTTP_BAD_REQUEST);
        }

        $db = \Config\Database::connect();
        $db->transStart();

        if ($status === 'active') {
            // Deactivate all other semesters in this school
            $this->semesterModel->where('status', 'active')->update(null, ['status' => 'inactive']);
        }

        $this->semesterModel->insert([
            'academic_year_id' => $academicYearId,
            'name'             => $name,
            'status'           => $status
        ]);

        $db->transComplete();

        if ($db->transStatus() === false) {
            return $this->respondError('Failed to create semester', ResponseInterface::HTTP_INTERNAL_SERVER_ERROR);
        }

        return $this->respondSuccess($this->semesterModel->find($this->semesterModel->getInsertID()), 'Semester created successfully', ResponseInterface::HTTP_CREATED);
    }

    /**
     * POST /api/v1/admin/semesters/update/{id}
     */
    public function update($id = null): ResponseInterface
    {
        $semester = $this->semesterModel->find($id);
        if (!$semester) {
            return $this->respondError('Semester not found', ResponseInterface::HTTP_NOT_FOUND);
        }

        $status = $this->request->getVar('status');
        $name = $this->request->getVar('name');

        $data = [];
        if ($name) $data['name'] = $name;
        if ($status) $data['status'] = $status;

        $db = \Config\Database::connect();
        $db->transStart();

        if (isset($data['status']) && $data['status'] === 'active') {
            $this->semesterModel->where('status', 'active')->update(null, ['status' => 'inactive']);
        }

        $this->semesterModel->update($id, $data);

        $db->transComplete();

        if ($db->transStatus() === false) {
            return $this->respondError('Failed to update semester', ResponseInterface::HTTP_INTERNAL_SERVER_ERROR);
        }

        return $this->respondSuccess($this->semesterModel->find($id), 'Semester updated successfully');
    }

    /**
     * DELETE /api/v1/admin/semesters/delete/{id}
     */
    public function delete($id = null): ResponseInterface
    {
        $semester = $this->semesterModel->find($id);
        if (!$semester) {
            return $this->respondError('Semester not found', ResponseInterface::HTTP_NOT_FOUND);
        }

        $this->semesterModel->delete($id);
        return $this->respondSuccess(null, 'Semester deleted successfully');
    }
}
