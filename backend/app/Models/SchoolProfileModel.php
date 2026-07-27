<?php

namespace App\Models;

class SchoolProfileModel extends BaseModel
{
    protected $table            = 'school_profiles';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'object';
    protected $protectFields    = true;
    protected $allowedFields    = [
        'school_id', 'hero_tagline', 'history', 'vision', 'mission', 
        'principal_name', 'principal_photo', 'principal_welcome_message', 'ppdb_banner_text'
    ];

    // Dates
    protected $useTimestamps = true;
    protected $dateFormat    = 'datetime';
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';
}
