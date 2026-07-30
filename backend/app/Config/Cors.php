<?php

namespace Config;

use CodeIgniter\Config\BaseConfig;

/**
 * Cross-Origin Resource Sharing (CORS) Configuration
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
 */
class Cors extends BaseConfig
{
    /**
     * The default CORS configuration.
     *
     * @var array{
     *      allowedOrigins: list<string>,
     *      allowedOriginsPatterns: list<string>,
     *      supportsCredentials: bool,
     *      allowedHeaders: list<string>,
     *      exposedHeaders: list<string>,
     *      allowedMethods: list<string>,
     *      maxAge: int,
     *  }
     */
    public array $default = [
        /**
         * Origins for the `Access-Control-Allow-Origin` header.
         *
         * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Origin
         *
         * E.g.:
         *   - ['http://localhost:8080']
         *   - ['https://www.example.com']
         */
        'allowedOrigins' => [
            'http://localhost:5173',
            'http://localhost:4173',
        ],
        'allowedOriginsPatterns' => ['^http://[a-z0-9-]+\.localhost:5173$'],
        'supportsCredentials' => false,
        'allowedHeaders' => ['Authorization', 'Content-Type', 'X-School-ID', 'X-Requested-With'],
        'exposedHeaders' => [],
        'allowedMethods' => ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
        'maxAge' => 7200,
    ];

    public function __construct()
    {
        parent::__construct();

        $origins = trim((string) env('CORS_ALLOWED_ORIGINS', ''));
        if ($origins !== '') {
            $this->default['allowedOrigins'] = array_values(array_filter(array_map('trim', explode(',', $origins))));
        }
        $patterns = trim((string) env('CORS_ALLOWED_ORIGIN_PATTERNS', ''));
        if ($patterns !== '') {
            $this->default['allowedOriginsPatterns'] = array_values(array_filter(array_map('trim', explode(',', $patterns))));
        }

        if (ENVIRONMENT === 'production' && in_array('*', $this->default['allowedOrigins'], true)) {
            throw new \RuntimeException('Wildcard CORS origin is not allowed in production.');
        }
    }
}
