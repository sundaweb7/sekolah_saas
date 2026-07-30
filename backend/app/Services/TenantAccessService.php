<?php

namespace App\Services;

/**
 * Makes tenant authorization decisions without depending on HTTP state.
 * Keeping this logic pure makes cross-tenant access rules easy to test.
 */
class TenantAccessService
{
    /**
     * @return array{allowed: bool, school_id: ?int, message: ?string}
     */
    public function resolveAuthenticatedTenant(
        string $role,
        ?int $tokenSchoolId,
        ?int $requestSchoolId
    ): array {
        if ($role === 'superadmin') {
            if ($tokenSchoolId !== null) {
                return [
                    'allowed' => false,
                    'school_id' => null,
                    'message' => 'Superadmin must not be scoped to a tenant',
                ];
            }
            return [
                'allowed' => true,
                'school_id' => null,
                'message' => null,
            ];
        }

        if (!$tokenSchoolId) {
            return [
                'allowed' => false,
                'school_id' => null,
                'message' => 'Tenant identity is missing from token',
            ];
        }

        if ($requestSchoolId !== null && $requestSchoolId !== $tokenSchoolId) {
            return [
                'allowed' => false,
                'school_id' => null,
                'message' => 'Tenant does not match authenticated user',
            ];
        }

        return [
            'allowed' => true,
            'school_id' => $tokenSchoolId,
            'message' => null,
        ];
    }
}
