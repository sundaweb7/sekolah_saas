<?php

namespace App\Models;

use CodeIgniter\Model;

abstract class BaseModel extends Model
{
    // Auto-fill tenant id during inserts
    protected bool $isTenantScoped = true;

    protected $beforeInsert = ['setSchoolId'];
    protected $beforeUpdate = ['checkSchoolIdScope'];
    protected $beforeFind   = ['applySchoolIdScope'];
    protected $beforeDelete = ['checkSchoolIdScope'];

    /**
     * Automatically sets school_id for new inserts
     */
    protected function setSchoolId(array $data)
    {
        if ($this->isTenantScoped && defined('CURRENT_SCHOOL_ID')) {
            $data['data']['school_id'] = CURRENT_SCHOOL_ID;
        }
        return $data;
    }

    /**
     * Automatically filters query results to current school_id
     */
    protected function applySchoolIdScope(array $data)
    {
        if ($this->isTenantScoped && defined('CURRENT_SCHOOL_ID')) {
            $this->builder()->where($this->table . '.school_id', CURRENT_SCHOOL_ID);
        }
        return $data;
    }

    /**
     * Prevents modifying data outside tenant scope
     */
    protected function checkSchoolIdScope(array $data)
    {
        if ($this->isTenantScoped && defined('CURRENT_SCHOOL_ID')) {
            $this->builder()->where($this->table . '.school_id', CURRENT_SCHOOL_ID);
        }
        return $data;
    }
}
