<?php

namespace App\Models;

class SchoolLetterModel extends BaseModel
{
    protected $table = 'school_letters';
    protected $returnType = 'object';
    protected $useTimestamps = true;
    protected $allowedFields = [
        'school_id', 'student_id', 'created_by', 'letter_type', 'letter_number',
        'academic_year', 'payload', 'issued_at',
    ];
}
