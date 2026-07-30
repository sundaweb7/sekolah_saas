<?php

use App\Models\SchoolModel;
use App\Models\StudentModel;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\DatabaseTestTrait;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;

/** @internal */
final class TenantModelIsolationTest extends CIUnitTestCase
{
    use DatabaseTestTrait;

    protected $namespace = 'App';
    protected $migrate = true;
    protected $refresh = true;

    #[RunInSeparateProcess]
    public function testModelCannotReadWriteOrMoveAnotherTenantsStudent(): void
    {
        $schools = new SchoolModel();
        $schoolA = $schools->insert(['name' => 'School A', 'subdomain' => 'school-a', 'status' => 'active']);
        $schoolB = $schools->insert(['name' => 'School B', 'subdomain' => 'school-b', 'status' => 'active']);
        define('CURRENT_SCHOOL_ID', (int) $schoolA);

        $students = new StudentModel();
        $studentA = $students->insert([
            'school_id' => $schoolB,
            'full_name' => 'Student A', 'birth_date' => '2020-01-01', 'gender' => 'L',
        ]);
        $this->assertSame((int) $schoolA, (int) $this->db->table('students')->where('id', $studentA)->get()->getRow()->school_id);

        $this->db->table('students')->insert([
            'school_id' => $schoolB, 'full_name' => 'Student B', 'birth_date' => '2020-01-01', 'gender' => 'P',
        ]);
        $studentB = $this->db->insertID();

        $visible = $students->findAll();
        $this->assertCount(1, $visible);
        $this->assertSame('Student A', $visible[0]->full_name);

        $students->update($studentB, ['full_name' => 'Compromised', 'school_id' => $schoolA]);
        $unchanged = $this->db->table('students')->where('id', $studentB)->get()->getRow();
        $this->assertSame('Student B', $unchanged->full_name);
        $this->assertSame((int) $schoolB, (int) $unchanged->school_id);
    }
}
