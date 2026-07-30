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
     * POST /api/v1/admin/semesters/save
     */
    public function save(): ResponseInterface
    {
        $schoolId = defined('CURRENT_SCHOOL_ID') ? CURRENT_SCHOOL_ID : null;
        if (!$schoolId) {
            return $this->respondError('School context required', ResponseInterface::HTTP_BAD_REQUEST);
        }

        $body = $this->getRequestBody();
        $id = $body['id'] ?? null;
        $academicYearId = $body['academic_year_id'] ?? null;
        $name = $body['name'] ?? null;
        $status = $body['status'] ?? 'inactive';

        if (empty($academicYearId) || empty($name)) {
            return $this->respondError('Academic Year ID and Semester Name are required', ResponseInterface::HTTP_BAD_REQUEST);
        }

        $db = \Config\Database::connect();
        $db->transStart();

        if ($status === 'active') {
            // Deactivate all other semesters in this school
            $this->semesterModel->where('school_id', $schoolId)->update(null, ['status' => 'inactive']);
        }

        $data = [
            'school_id'        => $schoolId,
            'academic_year_id' => $academicYearId,
            'name'             => $name,
            'status'           => $status
        ];

        if ($id) {
            $existing = $this->semesterModel->where('school_id', $schoolId)->find($id);
            if (!$existing) {
                return $this->respondError('Semester not found', ResponseInterface::HTTP_NOT_FOUND);
            }
            $this->semesterModel->update($id, $data);
            $db->transComplete();
            return $this->respondSuccess(null, 'Semester updated successfully');
        } else {
            $this->semesterModel->insert($data);
            $db->transComplete();
            return $this->respondSuccess(null, 'Semester created successfully');
        }
    }

    /**
     * DELETE /api/v1/admin/semesters/delete/{id}
     */
    public function delete($id = null): ResponseInterface
    {
        $schoolId = defined('CURRENT_SCHOOL_ID') ? CURRENT_SCHOOL_ID : null;
        if (!$schoolId) {
            return $this->respondError('School context required', ResponseInterface::HTTP_BAD_REQUEST);
        }

        $semester = $this->semesterModel->where('school_id', $schoolId)->find($id);
        if (!$semester) {
            return $this->respondError('Semester not found', ResponseInterface::HTTP_NOT_FOUND);
        }

        $this->semesterModel->delete($id);
        return $this->respondSuccess(null, 'Semester deleted successfully');
    }
}
