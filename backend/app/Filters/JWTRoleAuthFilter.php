<?php

namespace App\Filters;

use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;
use Config\Services;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use App\Services\TenantAccessService;
use App\Libraries\JWTService;
use Exception;

class JWTRoleAuthFilter implements FilterInterface
{
    /**
     * Checks Authorization JWT header and validates role access
     */
    public function before(RequestInterface $request, $arguments = null)
    {
        $authHeader = $request->getServer('HTTP_AUTHORIZATION') ?? $request->getHeaderLine('Authorization');
        
        if (empty($authHeader)) {
            return Services::response()
                ->setJSON(['status' => 'error', 'message' => 'Missing Authorization Token'])
                ->setStatusCode(ResponseInterface::HTTP_UNAUTHORIZED);
        }

        // Extract bearer token
        $arr = explode(" ", $authHeader);
        $token = count($arr) > 1 ? $arr[1] : null;

        if (!$token) {
            return Services::response()
                ->setJSON(['status' => 'error', 'message' => 'Invalid Authorization Header format'])
                ->setStatusCode(ResponseInterface::HTTP_UNAUTHORIZED);
        }

        try {
            // Retrieve secret key from ENV
            $key = JWTService::resolveSecret();
            $decoded = JWT::decode($token, new Key($key, 'HS256'));

            // Attach user data to request context
            $request->user = $decoded;

            // The tenant selected by the host/header must never override the
            // tenant embedded in an authenticated user's token. Without this
            // check, a user could send another school's X-School-ID and make
            // tenant-scoped models query that school's records.
            $userRole = $decoded->role ?? '';
            $tokenSchoolId = isset($decoded->school_id) && $decoded->school_id !== null
                ? (int) $decoded->school_id
                : null;

            $requestSchoolId = defined('CURRENT_SCHOOL_ID') ? (int) CURRENT_SCHOOL_ID : null;
            $tenantAccess = (new TenantAccessService())->resolveAuthenticatedTenant(
                $userRole,
                $tokenSchoolId,
                $requestSchoolId
            );

            if (!$tenantAccess['allowed']) {
                return Services::response()
                    ->setJSON(['status' => 'error', 'message' => $tenantAccess['message']])
                    ->setStatusCode(ResponseInterface::HTTP_FORBIDDEN);
            }

            if ($tenantAccess['school_id'] !== null) {
                // Authenticated requests made through the main domain still
                // receive a safe tenant scope derived from the signed token.
                if (!defined('CURRENT_SCHOOL_ID')) {
                    define('CURRENT_SCHOOL_ID', $tenantAccess['school_id']);
                }
            }

            // Role verification: If arguments are provided (e.g. ['admin', 'teacher'])
            if (!empty($arguments)) {
                if (!in_array($userRole, $arguments)) {
                    return Services::response()
                        ->setJSON(['status' => 'error', 'message' => 'Unauthorized role access'])
                        ->setStatusCode(ResponseInterface::HTTP_FORBIDDEN);
                }
            }
            
        } catch (Exception $e) {
            return Services::response()
                // Do not expose JWT parser or key configuration details.
                ->setJSON(['status' => 'error', 'message' => 'Invalid or expired authorization token'])
                ->setStatusCode(ResponseInterface::HTTP_UNAUTHORIZED);
        }
    }

    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null)
    {
        // No post-processing needed
    }
}
