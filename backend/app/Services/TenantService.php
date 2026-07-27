<?php

namespace App\Services;

use App\Models\SchoolModel;

class TenantService
{
    protected SchoolModel $schoolModel;

    public function __construct()
    {
        $this->schoolModel = new SchoolModel();
    }

    /**
     * Resolve school_id from either custom header or request host subdomain.
     */
    public function resolveTenant(string $host, string $headerId = ''): ?int
    {
        // 1. If explicit header ID provided, resolve and validate it
        if (!empty($headerId)) {
            // Support both numeric ID and subdomain string in X-School-ID header
            if (is_numeric($headerId)) {
                $school = $this->schoolModel->find((int)$headerId);
            } else {
                $school = $this->schoolModel->where('subdomain', $headerId)->first();
            }
            if ($school && $school->status === 'active') {
                return (int) $school->id;
            }
        }

        // 2. Otherwise parse subdomain from HTTP Host
        // Example: tkmelati.paudku.id -> tkmelati
        // Example: tkmelati.localhost -> tkmelati
        $parts = explode('.', $host);
        
        if (count($parts) >= 2) {
            $subdomain = $parts[0];
            
            // Exclude common base domains
            if ($subdomain !== 'www' && $subdomain !== 'localhost' && $subdomain !== 'paudku' && $subdomain !== 'pusdatin') {
                $school = $this->schoolModel->where('subdomain', $subdomain)->first();
                if ($school && $school->status === 'active') {
                    return (int) $school->id;
                }
            }
        }

        // Fallback or default school for sandbox/development if needed
        return null;
    }
}
