<?php

namespace App\Models;

class SemesterReportModel extends BaseModel
{
    protected $table            = 'semester_reports';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'object';
    protected $protectFields    = true;
    protected $allowedFields    = [
        'school_id', 'student_id', 'teacher_id', 'academic_year', 'semester',
        'religion_morals', 'physical_motor', 'cognitive', 'language', 'social_emotional', 'art', 'general_notes'
    ];

    // Dates
    protected $useTimestamps = true;
    protected $dateFormat    = 'datetime';
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';
}
