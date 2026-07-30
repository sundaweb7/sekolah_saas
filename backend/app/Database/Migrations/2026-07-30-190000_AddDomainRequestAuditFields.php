<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddDomainRequestAuditFields extends Migration
{
    public function up()
    {
        foreach (['created_by', 'updated_by', 'deleted_by'] as $column) {
            if (!$this->db->fieldExists($column, 'domain_requests')) {
                $this->forge->addColumn('domain_requests', [
                    $column => ['type' => 'BIGINT', 'constraint' => 20, 'unsigned' => true, 'null' => true],
                ]);
            }
        }
    }

    public function down()
    {
        // Non-destructive reconciliation migration.
    }
}
