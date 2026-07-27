<?php

namespace App\Models;

class DailyReportModel extends BaseModel
{
    protected $table            = 'daily_reports';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'object';
    protected $protectFields    = true;
    protected $allowedFields    = [
        'school_id', 'student_id', 'teacher_id', 'date', 'activities', 'notes', 'photo'
    ];

    // Dates
    protected $useTimestamps = true;
    protected $dateFormat    = 'datetime';
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';
}
