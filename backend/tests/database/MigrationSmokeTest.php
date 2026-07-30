<?php

use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\DatabaseTestTrait;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;

/** @internal */
final class MigrationSmokeTest extends CIUnitTestCase
{
    use DatabaseTestTrait;

    protected $namespace = 'App';
    protected $migrate = true;
    protected $refresh = true;

    #[RunInSeparateProcess]
    public function testAllApplicationTablesCanBeMigrated(): void
    {
        foreach (['schools', 'users', 'students', 'teachers', 'classes', 'audit_logs', 'school_letters', 'impersonation_tokens'] as $table) {
            $this->assertTrue($this->db->tableExists($table), "Missing migrated table: {$table}");
        }
        foreach (['subscription_plan', 'billing_cycle', 'expires_at'] as $field) {
            $this->assertTrue($this->db->fieldExists($field, 'schools'), "Missing schools.{$field}");
        }
    }
}
