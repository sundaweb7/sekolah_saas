<?php

use App\Models\SchoolModel;
use App\Services\TenantService;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\DatabaseTestTrait;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;

/** @internal */
final class TenantServiceResolutionTest extends CIUnitTestCase
{
    use DatabaseTestTrait;
    protected $namespace = 'App';
    protected $migrate = true;
    protected $refresh = true;

    #[RunInSeparateProcess]
    public function testResolvesSubdomainHeaderAndApprovedCustomDomain(): void
    {
        $id = (new SchoolModel())->insert([
            'name' => 'Tenant', 'subdomain' => 'tenant-a', 'status' => 'active',
            'custom_domain' => 'school.example.id', 'custom_domain_status' => 'active',
        ]);
        (new SchoolModel())->insert(['name' => 'Other', 'subdomain' => 'school', 'status' => 'active']);
        $service = new TenantService();

        $this->assertSame((int) $id, $service->resolveTenant('api.example.id', 'tenant-a'));
        $this->assertSame((int) $id, $service->resolveTenant('tenant-a.example.id'));
        $this->assertSame((int) $id, $service->resolveTenant('school.example.id:443', 'school'));
        $this->assertNull($service->resolveTenant('example.id'));
    }
}
