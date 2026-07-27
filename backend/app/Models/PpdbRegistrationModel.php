<?php

namespace App\Models;

class PpdbRegistrationModel extends BaseModel
{
    protected $table            = 'ppdb_registrations';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'object';
    protected $useSoftDeletes   = true;
    protected $protectFields    = true;
    protected $allowedFields    = [
        'school_id', 'registration_number', 'full_name', 'birth_date', 
        'gender', 'parent_name', 'parent_phone', 'document_files', 
        'status', 'payment_status', 'admin_notes'
    ];

    // Dates
    protected $useTimestamps = true;
    protected $dateFormat    = 'datetime';
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';
    protected $deletedField  = 'deleted_at';

    // Override BaseModel hooks to add registration number generator
    protected $beforeInsert = ['setSchoolId', 'generateRegistrationNumber'];

    /**
     * Generate registration number in format PPDB-{YEAR}-{5_DIGIT_AUTO_INCREMENT}
     */
    protected function generateRegistrationNumber(array $data)
    {
        $schoolId = defined('CURRENT_SCHOOL_ID') ? CURRENT_SCHOOL_ID : ($data['data']['school_id'] ?? null);
        if (!$schoolId) {
            return $data;
        }

        $year = date('Y');
        
        // Count previous registrations for this school in this year
        $count = $this->where('school_id', $schoolId)
                      ->like('registration_number', 'PPDB-' . $year . '-')
                      ->withDeleted() // include deleted to prevent number duplication
                      ->countAllResults();

        $increment = str_pad($count + 1, 5, '0', STR_PAD_LEFT);
        
        $data['data']['registration_number'] = "PPDB-{$year}-{$increment}";

        return $data;
    }
}
