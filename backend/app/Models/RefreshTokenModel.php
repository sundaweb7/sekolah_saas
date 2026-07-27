<?php

namespace App\Models;

class RefreshTokenModel extends BaseModel
{
    protected $table            = 'refresh_tokens';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'object';
    protected $useSoftDeletes   = false; // Refresh tokens are rotated/deleted permanently
    protected $protectFields    = true;
    protected $allowedFields    = ['school_id', 'user_id', 'token', 'expires_at'];

    // Dates
    protected $useTimestamps = true;
    protected $dateFormat    = 'datetime';
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';
}
