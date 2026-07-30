<?php

namespace App\Services;

use App\Models\ImpersonationTokenModel;

class ImpersonationService
{
    public function createCode(int $schoolId, int $userId): string
    {
        $code = bin2hex(random_bytes(32));
        (new ImpersonationTokenModel())->insert([
            'school_id' => $schoolId,
            'user_id' => $userId,
            'token_hash' => hash('sha256', $code),
            'expires_at' => date('Y-m-d H:i:s', time() + 120),
            'created_at' => date('Y-m-d H:i:s'),
        ]);
        return $code;
    }
}
