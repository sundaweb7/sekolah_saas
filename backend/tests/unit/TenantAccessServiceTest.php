<?php

use App\Services\TenantAccessService;
use CodeIgniter\Test\CIUnitTestCase;

/**
 * @internal
 */
final class TenantAccessServiceTest extends CIUnitTestCase
{
    private TenantAccessService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new TenantAccessService();
    }

    public function testRejectsTenantMismatch(): void
    {
        $result = $this->service->resolveAuthenticatedTenant('admin', 10, 20);

        $this->assertFalse($result['allowed']);
        $this->assertNull($result['school_id']);
        $this->assertSame('Tenant does not match authenticated user', $result['message']);
    }

    public function testUsesSignedTokenTenantWhenRequestHasNoTenant(): void
    {
        $result = $this->service->resolveAuthenticatedTenant('teacher', 10, null);

        $this->assertTrue($result['allowed']);
        $this->assertSame(10, $result['school_id']);
    }

    public function testAllowsMatchingTenant(): void
    {
        $result = $this->service->resolveAuthenticatedTenant('parent', 10, 10);

        $this->assertTrue($result['allowed']);
        $this->assertSame(10, $result['school_id']);
    }

    public function testRejectsSchoolUserWithoutTenantClaim(): void
    {
        $result = $this->service->resolveAuthenticatedTenant('admin', null, null);

        $this->assertFalse($result['allowed']);
        $this->assertSame('Tenant identity is missing from token', $result['message']);
    }

    public function testKeepsSuperadminGlobal(): void
    {
        $result = $this->service->resolveAuthenticatedTenant('superadmin', null, 10);

        $this->assertTrue($result['allowed']);
        $this->assertNull($result['school_id']);
    }

    public function testRejectsTenantScopedSuperadmin(): void
    {
        $result = $this->service->resolveAuthenticatedTenant('superadmin', 10, 10);
        $this->assertFalse($result['allowed']);
        $this->assertSame('Superadmin must not be scoped to a tenant', $result['message']);
    }
}
