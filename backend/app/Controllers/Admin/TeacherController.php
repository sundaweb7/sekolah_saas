<?php

namespace App\Controllers\Admin;

use App\Controllers\BaseResourceController;
use App\Models\TeacherModel;
use App\Models\UserModel;
use App\Libraries\UploadService;
use CodeIgniter\HTTP\ResponseInterface;
use Exception;

class TeacherController extends BaseResourceController
{
    protected TeacherModel $teacherModel;
    protected UploadService $uploadService;

    public function __construct()
    {
        $this->teacherModel = new TeacherModel();
        $this->uploadService = new UploadService();
    }

    /**
     * GET /api/v1/admin/teachers
     */
    public function index(): ResponseInterface
    {
        $params = $this->getRequestParams();
        $builder = $this->teacherModel->select('teachers.*, users.email')
                                      ->join('users', 'users.id = teachers.user_id', 'left');

        if (!empty($params['search']['q'])) {
            $q = $params['search']['q'];
            $builder->groupStart()
                    ->like('teachers.full_name', $q)
                    ->orLike('teachers.nuptk', $q)
                    ->groupEnd();
        }

        $teachers = $builder->paginate($params['perPage'], 'default', $params['page']);
        
        // Decode roles JSON for each teacher
        $teachers = array_map(function ($teacher) {
            if (is_object($teacher)) {
                $teacher->roles = !empty($teacher->roles) ? json_decode($teacher->roles, true) : [];
            } elseif (is_array($teacher)) {
                $teacher['roles'] = !empty($teacher['roles']) ? json_decode($teacher['roles'], true) : [];
            }
            return $teacher;
        }, $teachers);
        
        return $this->respondPaginated($teachers, $builder->pager->getDetails());
    }

    /**
     * GET /api/v1/admin/teachers/show/{id}
     */
    public function show($id = null): ResponseInterface
    {
        $teacher = $this->teacherModel->find($id);
        if (!$teacher) {
            return $this->respondError('Teacher not found', ResponseInterface::HTTP_NOT_FOUND);
        }
        return $this->respondSuccess($teacher);
    }

    /**
     * POST /api/v1/admin/teachers
     */
    public function create(): ResponseInterface
    {
        $email = $this->request->getPost('email');
        $password = $this->request->getPost('password');
        $fullName = $this->request->getPost('full_name');
        
        if (empty($email) || empty($fullName) || empty($password)) {
            return $this->respondError('Full Name, Email, and Password are required', ResponseInterface::HTTP_BAD_REQUEST);
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 8) {
            return $this->respondError('Email tidak valid atau password kurang dari 8 karakter', ResponseInterface::HTTP_BAD_REQUEST);
        }

        $userModel = new UserModel();
        $schoolId = defined('CURRENT_SCHOOL_ID') ? CURRENT_SCHOOL_ID : null;

        // Check if email already taken in this school scope
        if ($userModel->where('email', $email)->where('school_id', $schoolId)->first()) {
            return $this->respondError('Email is already in use by another user in this school', ResponseInterface::HTTP_BAD_REQUEST);
        }

        $db = \Config\Database::connect();
        $db->transStart();

        // 1. Create User
        $userId = $userModel->insert([
            'school_id'     => $schoolId,
            'email'         => $email,
            'password_hash' => $password, // auto-hashed by model hook
            'role'          => 'teacher',
            'full_name'     => $fullName,
            'status'        => 'active'
        ]);

        // 2. Upload Photo if exists
        $photoPath = null;
        $file = $this->request->getFile('photo_file');
        if ($file && $file->isValid()) {
            try {
                $photoPath = $this->uploadService->uploadImage($file, 'uploads/teachers');
            } catch (Exception $e) {
                return $this->respondError($e->getMessage(), ResponseInterface::HTTP_BAD_REQUEST);
            }
        }

        // 3. Create Teacher profile
        $rolesRaw = $this->request->getPost('roles');
        $rolesArray = is_array($rolesRaw) ? $rolesRaw : (is_string($rolesRaw) ? json_decode($rolesRaw, true) : []);
        if (empty($rolesArray)) $rolesArray = ['guru_kelas']; // Default
        
        $this->teacherModel->insert([
            'school_id'  => $schoolId,
            'user_id'    => $userId,
            'nuptk'      => $this->request->getPost('nuptk'),
            'full_name'  => $fullName,
            'position'   => $this->request->getPost('position') ?: null,
            'roles'      => json_encode($rolesArray),
            'phone'      => $this->request->getPost('phone'),
            'photo'      => $photoPath,
            'created_by' => $this->request->user ? $this->request->user->id : null
        ]);

        $db->transComplete();

        if ($db->transStatus() === false) {
            return $this->respondError('Failed to create teacher profile', ResponseInterface::HTTP_INTERNAL_SERVER_ERROR);
        }

        $id = $this->teacherModel->getInsertID();
        return $this->respondSuccess($this->teacherModel->find($id), 'Teacher created successfully', ResponseInterface::HTTP_CREATED);
    }

    /**
     * POST /api/v1/admin/teachers/update/{id}
     */
    public function update($id = null): ResponseInterface
    {
        $teacher = $this->teacherModel->find($id);
        if (!$teacher) {
            return $this->respondError('Teacher not found', ResponseInterface::HTTP_NOT_FOUND);
        }

        $data = $this->request->getPost();
        
        // Handle roles encoding
        if (isset($data['roles'])) {
            $rolesRaw = $data['roles'];
            $rolesArray = is_array($rolesRaw) ? $rolesRaw : (is_string($rolesRaw) ? json_decode($rolesRaw, true) : []);
            $data['roles'] = json_encode($rolesArray ?: ['guru_kelas']);
        }
        
        // Handle Photo Upload
        $file = $this->request->getFile('photo_file');
        if ($file && $file->isValid()) {
            try {
                $path = $this->uploadService->uploadImage($file, 'uploads/teachers');
                $data['photo'] = $path;
                
                // Remove old photo
                if ($teacher->photo && file_exists(ROOTPATH . 'public/' . $teacher->photo)) {
                    unlink(ROOTPATH . 'public/' . $teacher->photo);
                }
            } catch (Exception $e) {
                return $this->respondError($e->getMessage(), ResponseInterface::HTTP_BAD_REQUEST);
            }
        }

        $this->teacherModel->update($id, $data);
        
        // Sync user full_name if updated
        if (isset($data['full_name'])) {
            $userModel = new UserModel();
            $userModel->update($teacher->user_id, ['full_name' => $data['full_name']]);
        }

        return $this->respondSuccess($this->teacherModel->find($id), 'Teacher profile updated successfully');
    }

    /**
     * DELETE /api/v1/admin/teachers/delete/{id}
     */
    public function delete($id = null): ResponseInterface
    {
        $teacher = $this->teacherModel->find($id);
        if (!$teacher) {
            return $this->respondError('Teacher not found', ResponseInterface::HTTP_NOT_FOUND);
        }

        $db = \Config\Database::connect();
        $db->transStart();

        // Delete user account linked to teacher
        $userModel = new UserModel();
        $userModel->delete($teacher->user_id);

        // Delete teacher profile
        $this->teacherModel->delete($id);

        $db->transComplete();

        if ($db->transStatus() === false) {
            return $this->respondError('Failed to delete teacher', ResponseInterface::HTTP_INTERNAL_SERVER_ERROR);
        }

        return $this->respondSuccess(null, 'Teacher deleted successfully');
    }

    /**
     * POST /api/v1/admin/teachers/impersonate/(:num)
     */
    public function impersonate($id = null): ResponseInterface
    {
        if (!$id) {
            return $this->respondError('Teacher ID is required', ResponseInterface::HTTP_BAD_REQUEST);
        }

        $teacher = $this->teacherModel->find($id);
        if (!$teacher) {
            return $this->respondError('Teacher profile not found', ResponseInterface::HTTP_NOT_FOUND);
        }

        $userModel = new UserModel();
        $user = $userModel->find($teacher->user_id);

        if (!$user || $user->status !== 'active') {
            return $this->respondError('Associated teacher user account is not active or not found', ResponseInterface::HTTP_NOT_FOUND);
        }

        return $this->respondSuccess([
            'code' => (new \App\Services\ImpersonationService())->createCode((int) $user->school_id, (int) $user->id),
        ], 'Single-use teacher impersonation code generated');
    }
}
