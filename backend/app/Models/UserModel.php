<?php

namespace App\Models;

class UserModel extends BaseModel
{
    protected $table            = 'users';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'object';
    protected $useSoftDeletes   = true;
    protected $protectFields    = true;
    protected $allowedFields    = [
        'school_id', 'email', 'password_hash', 'role', 
        'full_name', 'phone', 'status', 'created_by', 'updated_by', 'deleted_by'
    ];

    // Dates
    protected $useTimestamps = true;
    protected $dateFormat    = 'datetime';
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';
    protected $deletedField  = 'deleted_at';

    // Override hooks from BaseModel to include password hashing
    protected $beforeInsert = ['setSchoolId', 'hashPassword'];
    protected $beforeUpdate = ['checkSchoolIdScope', 'hashPassword'];

    /**
     * Hash password automatically before storing
     */
    protected function hashPassword(array $data)
    {
        if (isset($data['data']['password_hash'])) {
            $data['data']['password_hash'] = password_hash($data['data']['password_hash'], PASSWORD_BCRYPT);
        }
        return $data;
    }
}
