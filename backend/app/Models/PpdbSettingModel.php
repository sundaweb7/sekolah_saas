<?php

namespace App\Models;

class PpdbSettingModel extends BaseModel
{
    protected $table            = 'ppdb_settings';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'object';
    protected $protectFields    = true;
    protected $allowedFields    = [
        'school_id', 'registration_fee', 'is_open', 
        'start_date', 'end_date', 'payment_instructions', 'required_documents'
    ];

    // Dates
    protected $useTimestamps = true;
    protected $dateFormat    = 'datetime';
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';
}
