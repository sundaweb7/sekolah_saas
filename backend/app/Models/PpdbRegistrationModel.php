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
        'status', 'payment_status', 'admin_notes', 'privacy_consent_at', 'privacy_version'
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
     * Generate a non-sequential, tenant-aware public tracking number.
     */
    protected function generateRegistrationNumber(array $data)
    {
        $schoolId = defined('CURRENT_SCHOOL_ID') ? CURRENT_SCHOOL_ID : ($data['data']['school_id'] ?? null);
        if (!$schoolId) {
            return $data;
        }

        $year = date('Y');
        
        $random = strtoupper(bin2hex(random_bytes(4)));
        $data['data']['registration_number'] = "PPDB-{$year}-{$schoolId}-{$random}";

        return $data;
    }
}
