<?php

namespace App\Models;

use CodeIgniter\Model;

class ImpersonationTokenModel extends Model
{
    protected $table = 'impersonation_tokens';
    protected $returnType = 'object';
    protected $allowedFields = ['school_id', 'user_id', 'token_hash', 'expires_at', 'created_at'];
    protected $useTimestamps = false;
}
