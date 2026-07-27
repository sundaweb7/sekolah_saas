<?php

use App\Models\SchoolModel;

if (!function_exists('current_school_id')) {
    /**
     * Get the resolved school ID of the current tenant.
     */
    function current_school_id(): ?int
    {
        return defined('CURRENT_SCHOOL_ID') ? CURRENT_SCHOOL_ID : null;
    }
}

if (!function_exists('current_school')) {
    /**
     * Fetch the complete profile details of the current tenant school.
     */
    function current_school()
    {
        $schoolId = current_school_id();
        if (!$schoolId) {
            return null;
        }

        // Cache school query instance
        static $currentSchool = null;
        if ($currentSchool === null) {
            $schoolModel = new SchoolModel();
            $currentSchool = $schoolModel->find($schoolId);
        }

        return $currentSchool;
    }
}
