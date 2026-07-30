<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateAuditLogsTable extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id' => ['type' => 'BIGINT', 'constraint' => 20, 'unsigned' => true, 'auto_increment' => true],
            'school_id' => ['type' => 'BIGINT', 'constraint' => 20, 'unsigned' => true, 'null' => true],
            'user_id' => ['type' => 'BIGINT', 'constraint' => 20, 'unsigned' => true, 'null' => true],
            'role' => ['type' => 'VARCHAR', 'constraint' => 30, 'null' => true],
            'action' => ['type' => 'VARCHAR', 'constraint' => 255],
            'method' => ['type' => 'VARCHAR', 'constraint' => 10],
            'path' => ['type' => 'VARCHAR', 'constraint' => 500],
            'status_code' => ['type' => 'SMALLINT', 'constraint' => 5],
            'ip_address' => ['type' => 'VARCHAR', 'constraint' => 45, 'null' => true],
            'user_agent' => ['type' => 'VARCHAR', 'constraint' => 500, 'null' => true],
            'created_at' => ['type' => 'DATETIME', 'null' => true],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->addKey(['school_id', 'created_at']);
        $this->forge->addKey(['user_id', 'created_at']);
        $this->forge->addForeignKey('school_id', 'schools', 'id', 'SET NULL', 'CASCADE');
        $this->forge->addForeignKey('user_id', 'users', 'id', 'SET NULL', 'CASCADE');
        $this->forge->createTable('audit_logs');
    }

    public function down()
    {
        $this->forge->dropTable('audit_logs', true);
    }
}
