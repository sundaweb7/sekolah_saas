<?php

namespace App\Models;

class ClassJournalModel extends BaseModel
{
    protected $table            = 'class_journals';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'object';
    protected $protectFields    = true;
    protected $allowedFields    = [
        'school_id', 'class_id', 'teacher_id', 'date', 'subject', 'activities', 'notes'
    ];

    // Dates
    protected $useTimestamps = true;
    protected $dateFormat    = 'datetime';
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';

    protected $beforeInsert = ['setSchoolId'];
}
