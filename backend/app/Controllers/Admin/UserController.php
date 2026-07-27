<?php

namespace App\Controllers\Admin;

use App\Controllers\BaseResourceController;
use App\Models\UserModel;
use CodeIgniter\HTTP\ResponseInterface;

class UserController extends BaseResourceController
{
    protected UserModel $userModel;

    public function __construct()
    {
        $this->userModel = new UserModel();
    }

    /**
     * GET /api/v1/admin/users
     */
    public function index(): ResponseInterface
    {
        $schoolId = defined('CURRENT_SCHOOL_ID') ? CURRENT_SCHOOL_ID : null;
        $users = $this->userModel->where('school_id', $schoolId)->orderBy('id', 'DESC')->findAll();
        
        // Remove password hash from response for security
        foreach ($users as $user) {
            unset($user->password_hash);
        }
        
        return $this->respondSuccess($users);
    }

    /**
     * POST /api/v1/admin/users
     */
    public function create(): ResponseInterface
    {
        $data = $this->request->getJSON(true) ?? $this->request->getPost() ?? [];
        $data['school_id'] = defined('CURRENT_SCHOOL_ID') ? CURRENT_SCHOOL_ID : null;
        
        if (empty($data['email']) || empty($data['password']) || empty($data['role']) || empty($data['full_name'])) {
            return $this->respondError('Semua kolom wajib diisi.', ResponseInterface::HTTP_BAD_REQUEST);
        }

        // Check if email already exists
        $existing = $this->userModel->where('email', $data['email'])->first();
        if ($existing) {
            return $this->respondError('Alamat email sudah terdaftar.', ResponseInterface::HTTP_BAD_REQUEST);
        }

        $data['password_hash'] = password_hash($data['password'], PASSWORD_BCRYPT);
        unset($data['password']);
        $data['status'] = 'active';

        if (!$this->userModel->insert($data)) {
            return $this->respondError('Gagal menambah user.', ResponseInterface::HTTP_BAD_REQUEST, $this->userModel->errors());
        }

        $id = $this->userModel->getInsertID();
        $user = $this->userModel->find($id);
        unset($user->password_hash);

        return $this->respondSuccess($user, 'User berhasil dibuat.', ResponseInterface::HTTP_CREATED);
    }

    /**
     * POST /api/v1/admin/users/update/{id}
     */
    public function update($id = null): ResponseInterface
    {
        $data = $this->request->getJSON(true) ?? $this->request->getPost() ?? [];
        $user = $this->userModel->find($id);

        if (!$user) {
            return $this->respondError('User tidak ditemukan.', ResponseInterface::HTTP_NOT_FOUND);
        }

        if (!empty($data['password'])) {
            $data['password_hash'] = password_hash($data['password'], PASSWORD_BCRYPT);
        }
        unset($data['password']);

        $allowedFields = ['email', 'full_name', 'role', 'status', 'password_hash'];
        $updateData = [];
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $updateData[$field] = $data[$field];
            }
        }

        if (!$this->userModel->update($id, $updateData)) {
            return $this->respondError('Gagal mengupdate user.', ResponseInterface::HTTP_BAD_REQUEST, $this->userModel->errors());
        }

        $updatedUser = $this->userModel->find($id);
        unset($updatedUser->password_hash);

        return $this->respondSuccess($updatedUser, 'User berhasil diupdate.');
    }

    /**
     * DELETE /api/v1/admin/users/delete/{id}
     */
    public function delete($id = null): ResponseInterface
    {
        if (!$this->userModel->find($id)) {
            return $this->respondError('User tidak ditemukan.', ResponseInterface::HTTP_NOT_FOUND);
        }

        $this->userModel->delete($id);
        return $this->respondSuccess(null, 'User berhasil dihapus.');
    }
}
