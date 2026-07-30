<?php

namespace App\Models;

use App\Models\BaseModel;

class ExtracurricularModel extends BaseModel
{
    protected $table            = 'extracurriculars';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'object';
    protected $useSoftDeletes   = true;
    protected $protectFields    = true;
    protected $allowedFields    = [
        'school_id', 'name', 'coach', 'schedule_day', 'schedule_time',
        'location', 'quota', 'fee_registration', 'fee_monthly', 'status'
    ];

    // Dates
    protected $useTimestamps = true;
    protected $dateFormat    = 'datetime';
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';
    protected $deletedField  = 'deleted_at';
}
