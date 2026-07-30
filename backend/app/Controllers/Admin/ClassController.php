<?php

namespace App\Controllers\Admin;

use App\Controllers\BaseResourceController;
use App\Models\ClassModel;
use App\Models\TeacherModel;
use CodeIgniter\HTTP\ResponseInterface;

class ClassController extends BaseResourceController
{
    protected ClassModel $classModel;

    public function __construct()
    {
        $this->classModel = new ClassModel();
    }

    /**
     * GET /api/v1/admin/classes
     */
    public function index(): ResponseInterface
    {
        $params   = $this->getRequestParams();
        $schoolId = defined('CURRENT_SCHOOL_ID') ? CURRENT_SCHOOL_ID : null;
        $db       = \Config\Database::connect();

        $builder = $db->table('classes')
            ->select('classes.*, teachers.full_name AS teacher_name')
            ->join('teachers', 'teachers.id = classes.teacher_id AND teachers.deleted_at IS NULL', 'left')
            ->where('classes.deleted_at IS NULL')
            ->where('classes.school_id', $schoolId);

        if (!empty($params['search']['q'])) {
            $builder->like('classes.name', $params['search']['q']);
        }

        $perPage = $params['perPage'] ?? 20;
        $page    = $params['page'] ?? 1;
        $offset  = ($page - 1) * $perPage;

        $total   = $builder->countAllResults(false);
        $classes = $builder->limit($perPage, $offset)->get()->getResultObject();

        $paginationDetails = [
            'total'     => $total,
            'perPage'   => $perPage,
            'page'      => $page,
            'pageCount' => (int) ceil($total / $perPage),
        ];

        return $this->respondPaginated($classes, $paginationDetails);
    }

    /**
     * GET /api/v1/admin/classes/show/{id}
     */
    public function show($id = null): ResponseInterface
    {
        $class = $this->classModel->find($id);
        if (!$class) {
            return $this->respondError('Class group not found', ResponseInterface::HTTP_NOT_FOUND);
        }
        return $this->respondSuccess($class);
    }

    /**
     * POST /api/v1/admin/classes
     */
    public function create(): ResponseInterface
    {
        $data = $this->request->getVar();
        if (!empty($data['teacher_id']) && !(new TeacherModel())->find($data['teacher_id'])) {
            return $this->respondError('Teacher not found in this school', ResponseInterface::HTTP_BAD_REQUEST);
        }
        
        $userPayload = $this->request->user ?? null;
        if ($userPayload) {
            $data['created_by'] = $userPayload->id;
        }

        if (!$this->classModel->insert($data)) {
            return $this->respondError('Failed to create class', ResponseInterface::HTTP_BAD_REQUEST, $this->classModel->errors());
        }

        $id = $this->classModel->getInsertID();
        $class = $this->classModel
            ->select('classes.*, teachers.full_name AS teacher_name')
            ->join('teachers', 'teachers.id = classes.teacher_id AND teachers.deleted_at IS NULL', 'left')
            ->find($id);
        return $this->respondSuccess($class, 'Class created successfully', ResponseInterface::HTTP_CREATED);
    }

    /**
     * POST /api/v1/admin/classes/update/{id}
     */
    public function update($id = null): ResponseInterface
    {
        $class = $this->classModel->find($id);
        if (!$class) {
            return $this->respondError('Class not found', ResponseInterface::HTTP_NOT_FOUND);
        }

        $teacherIdRaw = $this->request->getVar('teacher_id');
        if ($teacherIdRaw && !(new TeacherModel())->find($teacherIdRaw)) {
            return $this->respondError('Teacher not found in this school', ResponseInterface::HTTP_BAD_REQUEST);
        }
        
        $data = [
            'name'       => $this->request->getVar('name'),
            'age_group'  => $this->request->getVar('age_group'),
            'teacher_id' => ($teacherIdRaw !== null && $teacherIdRaw !== '') ? (int)$teacherIdRaw : null,
        ];
        
        $userPayload = $this->request->user ?? null;
        if ($userPayload) {
            $data['updated_by'] = $userPayload->id;
        }

        if (!$this->classModel->update($id, $data)) {
            return $this->respondError('Failed to update class', ResponseInterface::HTTP_BAD_REQUEST, $this->classModel->errors());
        }

        // Re-fetch with teacher name joined
        $db      = \Config\Database::connect();
        $updated = $db->table('classes')
                      ->select('classes.*, teachers.full_name AS teacher_name')
                      ->join('teachers', 'teachers.id = classes.teacher_id AND teachers.deleted_at IS NULL', 'left')
                      ->where('classes.id', $id)
                      ->where('classes.school_id', defined('CURRENT_SCHOOL_ID') ? CURRENT_SCHOOL_ID : 0)
                      ->get()->getRowObject();
        return $this->respondSuccess($updated, 'Class updated successfully');
    }

    /**
     * DELETE /api/v1/admin/classes/delete/{id}
     */
    public function delete($id = null): ResponseInterface
    {
        $class = $this->classModel->find($id);
        if (!$class) {
            return $this->respondError('Class not found', ResponseInterface::HTTP_NOT_FOUND);
        }

        $this->classModel->delete($id);
        return $this->respondSuccess(null, 'Class deleted successfully');
    }
}
