<?php

namespace App\Models;

use App\Models\BaseModel;

class ExtracurricularPresenceModel extends BaseModel
{
    protected $table            = 'extracurricular_presences';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'object';
    protected $useSoftDeletes   = false;
    protected $protectFields    = true;
    protected $allowedFields    = [
        'school_id', 'extracurricular_id', 'member_id', 'presence_date', 'status'
    ];

    // Dates
    protected $useTimestamps = true;
    protected $dateFormat    = 'datetime';
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';
}
