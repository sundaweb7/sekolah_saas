<?php

use App\Models\SchoolModel;
use App\Models\SubscriptionModel;
use App\Services\PlanService;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\DatabaseTestTrait;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;

/** @internal */
final class PlanServiceTest extends CIUnitTestCase
{
    use DatabaseTestTrait;
    protected $namespace = 'App';
    protected $migrate = true;
    protected $refresh = true;

    #[RunInSeparateProcess]
    public function testTrialExpiryAndActiveSubscriptionResolution(): void
    {
        $schools = new SchoolModel();
        $newSchool = $schools->insert(['name' => 'New', 'subdomain' => 'new', 'status' => 'active']);
        $oldSchool = $schools->insert(['name' => 'Old', 'subdomain' => 'old', 'status' => 'active']);
        $this->db->table('schools')->where('id', $oldSchool)->update(['created_at' => date('Y-m-d H:i:s', strtotime('-8 days'))]);

        $service = new PlanService();
        $this->assertSame('trial', $service->activePlan((int) $newSchool));
        $this->assertSame('expired', $service->activePlan((int) $oldSchool));

        (new SubscriptionModel())->insert([
            'school_id' => $oldSchool, 'plan_name' => 'standard', 'billing_cycle' => 'monthly',
            'start_date' => date('Y-m-d'), 'end_date' => date('Y-m-d', strtotime('+1 month')), 'status' => 'active',
        ]);
        $this->assertSame('standard', $service->activePlan((int) $oldSchool));
        $this->assertSame(100, $service->studentLimit((int) $oldSchool));
    }
}
