<?php

namespace App\Models;

class SchoolContentModel extends BaseModel
{
    protected $table            = 'school_contents';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'object';
    protected $useSoftDeletes   = true;
    protected $protectFields    = true;
    protected $allowedFields    = [
        'school_id', 'category_id', 'type', 'title', 'slug', 'content', 
        'image', 'event_date', 'status', 'created_by', 'updated_by', 'deleted_by'
    ];

    // Dates
    protected $useTimestamps = true;
    protected $dateFormat    = 'datetime';
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';
    protected $deletedField  = 'deleted_at';

    // Override hooks to include slug generator
    protected $beforeInsert = ['setSchoolId', 'generateSlug'];
    protected $beforeUpdate = ['checkSchoolIdScope', 'generateSlug'];

    /**
     * Generate slug from title automatically
     */
    protected function generateSlug(array $data)
    {
        if (isset($data['data']['title'])) {
            $data['data']['slug'] = url_title($data['data']['title'], '-', true);
        }
        return $data;
    }
}
