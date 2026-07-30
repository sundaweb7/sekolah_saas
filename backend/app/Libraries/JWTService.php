<?php

namespace App\Libraries;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Exception;

class JWTService
{
    private string $key;
    private string $algorithm;
    private int $expire;

    public function __construct()
    {
        $this->key = self::resolveSecret();
        $this->algorithm = 'HS256';
        $this->expire = (int) env('JWT_EXPIRE', 3600); // 1 hour default
    }

    public static function resolveSecret(): string
    {
        $key = trim((string) env('JWT_SECRET', ''));
        if (strlen($key) >= 32) {
            return $key;
        }

        if (ENVIRONMENT === 'production') {
            throw new \RuntimeException('JWT_SECRET must be configured with at least 32 characters.');
        }

        log_message('warning', 'Using development-only JWT secret. Configure JWT_SECRET before deployment.');
        return 'development-only-change-before-production';
    }

    /**
     * Generate new JWT token for a user
     */
    public function generateToken(array $userData, ?int $expireOverride = null): string
    {
        $issuedAt = time();
        $expireTime = $issuedAt + ($expireOverride ?? $this->expire);

        $payload = array_merge([
            'iss' => base_url(),
            'iat' => $issuedAt,
            'exp' => $expireTime
        ], $userData);

        return JWT::encode($payload, $this->key, $this->algorithm);
    }

    /**
     * Validate and decode token
     */
    public function decodeToken(string $token): ?object
    {
        try {
            return JWT::decode($token, new Key($this->key, $this->algorithm));
        } catch (Exception $e) {
            return null;
        }
    }
}
