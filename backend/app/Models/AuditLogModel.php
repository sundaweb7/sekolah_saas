<?php

namespace App\Models;

class AuditLogModel extends BaseModel
{
    protected $table = 'audit_logs';
    protected $returnType = 'object';
    protected $useTimestamps = false;
    protected $allowedFields = [
        'school_id', 'user_id', 'role', 'action', 'method', 'path',
        'status_code', 'ip_address', 'user_agent', 'created_at',
    ];
}
