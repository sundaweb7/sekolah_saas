<?php

use App\Models\BaseModel;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\DatabaseTestTrait;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;

/** @internal */
final class ModelSchemaConsistencyTest extends CIUnitTestCase
{
    use DatabaseTestTrait;

    protected $namespace = 'App';
    protected $migrate = true;
    protected $refresh = true;

    #[RunInSeparateProcess]
    public function testTenantModelFieldsExistInSchema(): void
    {
        foreach (glob(APPPATH . 'Models/*Model.php') as $file) {
            $class = 'App\\Models\\' . basename($file, '.php');
            if (!class_exists($class) || $class === BaseModel::class || !is_subclass_of($class, BaseModel::class)) continue;

            $model = new $class();
            $reflection = new ReflectionClass($model);
            $tableProperty = $reflection->getProperty('table');
            $allowedProperty = $reflection->getProperty('allowedFields');
            $table = $tableProperty->getValue($model);
            $allowed = $allowedProperty->getValue($model);
            $schemaFields = $this->db->getFieldNames($table);

            foreach ($allowed as $field) {
                $this->assertContains($field, $schemaFields, "{$class} allows missing {$table}.{$field}");
            }
            $this->assertContains('school_id', $schemaFields, "Tenant model {$class} has no school_id");
        }
    }
}
