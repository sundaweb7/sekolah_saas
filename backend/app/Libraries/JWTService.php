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
        $this->key = env('JWT_SECRET', 'paudku_secret_key_123456');
        $this->algorithm = 'HS256';
        $this->expire = (int) env('JWT_EXPIRE', 3600); // 1 hour default
    }

    /**
     * Generate new JWT token for a user
     */
    public function generateToken(array $userData): string
    {
        $issuedAt = time();
        $expireTime = $issuedAt + $this->expire;

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
