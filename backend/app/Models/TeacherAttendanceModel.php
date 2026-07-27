<?php

namespace App\Models;

class TeacherAttendanceModel extends BaseModel
{
    protected $table            = 'teacher_attendances';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'object';
    protected $protectFields    = true;
    protected $allowedFields    = [
        'school_id', 'teacher_id', 'date', 'status', 'latitude', 'longitude', 'check_in_time', 'check_out_time'
    ];

    // Dates
    protected $useTimestamps = true;
    protected $dateFormat    = 'datetime';
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';

    protected $beforeInsert = ['setSchoolId'];
}
