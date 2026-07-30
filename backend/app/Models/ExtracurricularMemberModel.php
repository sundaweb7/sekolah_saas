<?php

namespace App\Models;

use App\Models\BaseModel;

class ExtracurricularMemberModel extends BaseModel
{
    protected $table            = 'extracurricular_members';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'object';
    protected $useSoftDeletes   = false;
    protected $protectFields    = true;
    protected $allowedFields    = [
        'school_id', 'extracurricular_id', 'student_id', 'status', 'grade', 'grade_description'
    ];

    // Dates
    protected $useTimestamps = true;
    protected $dateFormat    = 'datetime';
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';
}
