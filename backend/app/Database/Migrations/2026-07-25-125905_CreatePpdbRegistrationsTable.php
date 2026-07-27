<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreatePpdbRegistrationsTable extends Migration
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
            'school_id' => [
                'type'       => 'BIGINT',
                'constraint' => 20,
                'unsigned'   => true,
            ],
            'registration_number' => [
                'type'       => 'VARCHAR',
                'constraint' => '50',
                'unique'     => true,
            ],
            'full_name' => [
                'type'       => 'VARCHAR',
                'constraint' => '100',
            ],
            'birth_date' => [
                'type' => 'DATE',
            ],
            'gender' => [
                'type'       => 'ENUM',
                'constraint' => ['L', 'P'],
            ],
            'parent_name' => [
                'type'       => 'VARCHAR',
                'constraint' => '100',
            ],
            'parent_phone' => [
                'type'       => 'VARCHAR',
                'constraint' => '20',
            ],
            'document_files' => [
                'type' => 'JSON',
                'null' => true, // path map of files e.g. {"akta": "uploads/ppdb/akta.pdf", "kk": "uploads/ppdb/kk.pdf"}
            ],
            'status' => [
                'type'       => 'ENUM',
                'constraint' => ['draft', 'pending', 'verified', 'accepted', 'rejected'],
                'default'    => 'pending',
            ],
            'payment_status' => [
                'type'       => 'ENUM',
                'constraint' => ['unpaid', 'paid'],
                'default'    => 'unpaid',
            ],
            'admin_notes' => [
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
        ]);

        $this->forge->addKey('id', true);
        $this->forge->addForeignKey('school_id', 'schools', 'id', 'RESTRICT', 'CASCADE');
        $this->forge->createTable('ppdb_registrations');
    }

    public function down()
    {
        $this->forge->dropTable('ppdb_registrations');
    }
}
