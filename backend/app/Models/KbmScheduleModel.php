<?php

namespace App\Models;

use App\Models\BaseModel;

class KbmScheduleModel extends BaseModel
{
    protected $table            = 'kbm_schedules';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'object';
    protected $protectFields    = true;
    protected $allowedFields    = [
        'school_id', 'class_id', 'day_name', 'subject_name', 'teacher_id', 'start_time', 'end_time'
    ];

    // Dates
    protected $useTimestamps = true;
    protected $dateFormat    = 'datetime';
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';
    protected $deletedField  = 'deleted_at';

    protected $useSoftDeletes = true;
}
