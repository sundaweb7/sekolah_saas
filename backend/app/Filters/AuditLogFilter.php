<?php

namespace App\Filters;

use App\Models\AuditLogModel;
use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;

class AuditLogFilter implements FilterInterface
{
    public function before(RequestInterface $request, $arguments = null)
    {
    }

    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null)
    {
        $method = strtoupper($request->getMethod());
        $user = $request->user ?? null;
        if (!$user || !in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'], true)) {
            return;
        }

        try {
            (new AuditLogModel())->insert([
                'school_id' => $user->school_id ?? null,
                'user_id' => $user->id ?? null,
                'role' => $user->role ?? null,
                'action' => strtolower($method) . ':' . $request->getUri()->getPath(),
                'method' => $method,
                'path' => $request->getUri()->getPath(),
                'status_code' => $response->getStatusCode(),
                'ip_address' => $request->getIPAddress(),
                'user_agent' => substr($request->getUserAgent()->getAgentString(), 0, 500),
                'created_at' => date('Y-m-d H:i:s'),
            ]);
        } catch (\Throwable $e) {
            // Audit logging must not break the primary request.
            log_message('error', 'Unable to write audit log: {message}', ['message' => $e->getMessage()]);
        }
    }
}
