<?php

namespace App\Filters;

use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;
use Config\Services;

class FeatureGateFilter implements FilterInterface
{
    public function before(RequestInterface $request, $arguments = null)
    {
        $required = $arguments[0] ?? null;
        $user = $request->user ?? null;
        if (!$required || !$user) {
            return Services::response()->setStatusCode(403)->setJSON([
                'status' => 'error', 'message' => 'Feature access cannot be verified',
            ]);
        }

        if (($user->role ?? '') !== 'superadmin' && !in_array($required, (array) ($user->allowed_features ?? []), true)) {
            return Services::response()->setStatusCode(403)->setJSON([
                'status' => 'error', 'message' => 'Feature is not available for this subscription',
            ]);
        }
    }

    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null)
    {
    }
}
