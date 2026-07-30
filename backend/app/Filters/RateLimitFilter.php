<?php

namespace App\Filters;

use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;
use Config\Services;

class RateLimitFilter implements FilterInterface
{
    public function before(RequestInterface $request, $arguments = null)
    {
        $limit = max(1, (int) ($arguments[0] ?? 10));
        $window = max(1, (int) ($arguments[1] ?? 60));
        $bucket = (int) floor(time() / $window);
        $identity = method_exists($request, 'getIPAddress') ? $request->getIPAddress() : 'unknown';
        $path = method_exists($request, 'getUri') ? $request->getUri()->getPath() : 'unknown';
        $key = 'rate_limit_' . hash('sha256', $identity . '|' . $path . '|' . $bucket);

        $cache = Services::cache();
        $attempts = (int) ($cache->get($key) ?? 0) + 1;
        $cache->save($key, $attempts, $window + 1);

        if ($attempts > $limit) {
            return Services::response()
                ->setStatusCode(429)
                ->setHeader('Retry-After', (string) $window)
                ->setJSON(['status' => 'error', 'message' => 'Too many requests. Please try again later.']);
        }
    }

    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null)
    {
    }
}
