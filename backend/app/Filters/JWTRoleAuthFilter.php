<?php

namespace App\Filters;

use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;
use Config\Services;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
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
            $key = env('JWT_SECRET', 'paudku_secret_key_123456');
            $decoded = JWT::decode($token, new Key($key, 'HS256'));

            // Attach user data to request context
            $request->user = $decoded;

            // Role verification: If arguments are provided (e.g. ['admin', 'teacher'])
            if (!empty($arguments)) {
                $userRole = $decoded->role ?? '';
                if (!in_array($userRole, $arguments)) {
                    return Services::response()
                        ->setJSON(['status' => 'error', 'message' => 'Unauthorized role access'])
                        ->setStatusCode(ResponseInterface::HTTP_FORBIDDEN);
                }
            }
            
        } catch (Exception $e) {
            return Services::response()
                ->setJSON(['status' => 'error', 'message' => 'Unauthorized: ' . $e->getMessage()])
                ->setStatusCode(ResponseInterface::HTTP_UNAUTHORIZED);
        }
    }

    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null)
    {
        // No post-processing needed
    }
}
