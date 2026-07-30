<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateSchoolsTable extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id' => [
                'type'           => 'BIGINT',
                'constraint'     => 20,
                'unsigned'       => true,
                'auto_increment' => true,
            ],
            'name' => [
                'type'       => 'VARCHAR',
                'constraint' => '150',
            ],
            'subdomain' => [
                'type'       => 'VARCHAR',
                'constraint' => '50',
                'unique'     => true,
            ],
            'custom_domain' => [
                'type'       => 'VARCHAR',
                'constraint' => '100',
                'null'       => true,
                'unique'     => true,
            ],
            'status' => [
                'type'       => 'ENUM',
                'constraint' => ['active', 'inactive', 'suspended'],
                'default'    => 'active',
            ],
            'subscription_plan' => ['type' => 'VARCHAR', 'constraint' => 30, 'default' => 'trial'],
            'billing_cycle' => ['type' => 'VARCHAR', 'constraint' => 20, 'null' => true],
            'expires_at' => ['type' => 'DATE', 'null' => true],
            'created_at' => [
                'type' => 'DATETIME',
                'null' => true,
            ],
            'updated_at' => [
                'type' => 'DATETIME',
                'null' => true,
            ],
            'deleted_at' => [
                'type' => 'DATETIME',
                'null' => true,
            ],
        ]);

        $this->forge->addKey('id', true);
        $this->forge->createTable('schools');
    }

    public function down()
    {
        $this->forge->dropTable('schools');
    }
}
