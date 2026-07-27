<?php

namespace App\Filters;

use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;
use App\Services\TenantService;

class TenantFilter implements FilterInterface
{
    protected TenantService $tenantService;

    public function __construct()
    {
        $this->tenantService = new TenantService();
    }

    /**
     * Resolves the current school_id based on header or subdomain host
     */
    public function before(RequestInterface $request, $arguments = null)
    {
        $headerId = $request->getHeaderLine('X-School-ID') ?? '';
        $host = $request->getServer('HTTP_HOST') ?? '';

        $schoolId = $this->tenantService->resolveTenant($host, $headerId);

        // Set globally accessible runtime variable for models/services
        if ($schoolId !== null) {
            define('CURRENT_SCHOOL_ID', $schoolId);
        }
    }

    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null)
    {
        // No post-processing needed
    }
}
