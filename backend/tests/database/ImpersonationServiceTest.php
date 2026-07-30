<?php

use App\Services\ImpersonationService;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\DatabaseTestTrait;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;

final class ImpersonationServiceTest extends CIUnitTestCase
{
    use DatabaseTestTrait;

    protected $namespace = 'App';
    protected $migrate = true;
    protected $refresh = true;

    #[RunInSeparateProcess]
    public function testCreatesOnlyHashedShortLivedCode(): void
    {
        $this->db->table('schools')->insert([
            'name' => 'Sekolah Tes', 'subdomain' => 'sekolah-tes', 'npsn' => '12345678',
            'level' => 'TK', 'status' => 'active', 'subscription_plan' => 'trial',
            'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s'),
        ]);
        $schoolId = (int) $this->db->insertID();
        $this->db->table('users')->insert([
            'school_id' => $schoolId, 'email' => 'admin@example.test',
            'password_hash' => password_hash('password123', PASSWORD_BCRYPT),
            'role' => 'admin', 'full_name' => 'Admin', 'status' => 'active',
            'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s'),
        ]);
        $userId = (int) $this->db->insertID();

        $code = (new ImpersonationService())->createCode($schoolId, $userId);
        $record = $this->db->table('impersonation_tokens')->get()->getRow();

        $this->assertSame(64, strlen($code));
        $this->assertNotSame($code, $record->token_hash);
        $this->assertSame(hash('sha256', $code), $record->token_hash);
        $this->assertLessThanOrEqual(120, strtotime($record->expires_at) - time());
        $this->assertGreaterThan(0, strtotime($record->expires_at) - time());
    }
}
