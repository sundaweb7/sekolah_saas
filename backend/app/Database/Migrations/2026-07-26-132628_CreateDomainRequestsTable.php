<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateDomainRequestsTable extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id' => [
                'type'           => 'INT',
                'constraint'     => 11,
                'unsigned'       => true,
                'auto_increment' => true,
            ],
            'school_id' => [
                'type'           => 'BIGINT',
                'constraint'     => 20,
                'unsigned'       => true,
            ],
            'requested_domain' => [
                'type'       => 'VARCHAR',
                'constraint' => '150',
            ],
            'status' => [
                'type'       => 'ENUM',
                'constraint' => ['pending', 'processing', 'active', 'rejected'],
                'default'    => 'pending',
            ],
            'billing_type' => [
                'type'       => 'ENUM',
                'constraint' => ['monthly', 'yearly'],
                'default'    => 'monthly',
            ],
            'document_file' => [
                'type'       => 'VARCHAR',
                'constraint' => '255',
                'null'       => true,
            ],
            'admin_note' => [
                'type' => 'TEXT',
                'null' => true,
            ],
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
            'created_by' => ['type' => 'BIGINT', 'constraint' => 20, 'unsigned' => true, 'null' => true],
            'updated_by' => ['type' => 'BIGINT', 'constraint' => 20, 'unsigned' => true, 'null' => true],
            'deleted_by' => ['type' => 'BIGINT', 'constraint' => 20, 'unsigned' => true, 'null' => true],
        ]);

        $this->forge->addKey('id', true);
        $this->forge->addForeignKey('school_id', 'schools', 'id', 'CASCADE', 'CASCADE');
        $this->forge->createTable('domain_requests');
    }

    public function down()
    {
        $this->forge->dropTable('domain_requests');
    }
}
