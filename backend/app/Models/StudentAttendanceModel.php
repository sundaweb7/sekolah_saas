<?php

namespace App\Models;

class StudentAttendanceModel extends BaseModel
{
    protected $table            = 'student_attendances';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'object';
    protected $protectFields    = true;
    protected $allowedFields    = [
        'school_id', 'student_id', 'class_id', 'date', 'status', 'notes',
        'lesson_id', 'check_in_time', 'late_minutes', 'source', 'notified_at'
    ];

    // Dates
    protected $useTimestamps = true;
    protected $dateFormat    = 'datetime';
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';
}
