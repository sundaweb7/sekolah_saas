<?php

namespace App\Filters;

use App\Services\PlanService;
use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;
use Config\Services;
use App\Libraries\JWTService;

class SubscriptionGuardFilter implements FilterInterface
{
    public function before(RequestInterface $request, $arguments = null)
    {
        if (strtoupper($request->getMethod()) === 'GET') return;
        $path = trim($request->getUri()->getPath(), '/');
        if (in_array($path, ['api/v1/admin/billing/checkout'], true)) return;

        $schoolId = defined('CURRENT_SCHOOL_ID') ? (int) CURRENT_SCHOOL_ID : 0;
        if (!$schoolId) {
            $authorization = $request->getHeaderLine('Authorization');
            $token = str_starts_with($authorization, 'Bearer ') ? substr($authorization, 7) : '';
            $decoded = $token ? (new JWTService())->decodeToken($token) : null;
            $schoolId = (int) ($decoded->school_id ?? 0);
        }

        // Authentication errors remain the responsibility of the JWT filter.
        if ($schoolId && (new PlanService())->activePlan($schoolId) === 'expired') {
            return Services::response()->setStatusCode(402)->setJSON([
                'status' => 'error',
                'message' => 'Subscription has expired. Data remains available in read-only mode.',
            ]);
        }
    }

    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null)
    {
    }
}
