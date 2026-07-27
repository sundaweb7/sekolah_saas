<?php

namespace App\Models;

class NewsCategoryModel extends BaseModel
{
    protected $table            = 'news_categories';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'object';
    protected $useSoftDeletes   = true;
    protected $protectFields    = true;
    protected $allowedFields    = [
        'school_id', 'name', 'slug'
    ];

    // Dates
    protected $useTimestamps = true;
    protected $dateFormat    = 'datetime';
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';
    protected $deletedField  = 'deleted_at';

    protected $beforeInsert = ['setSchoolId', 'generateSlug'];
    protected $beforeUpdate = ['checkSchoolIdScope', 'generateSlug'];

    /**
     * Generate slug from category name
     */
    protected function generateSlug(array $data)
    {
        if (isset($data['data']['name'])) {
            $data['data']['slug'] = url_title($data['data']['name'], '-', true);
        }
        return $data;
    }
}
