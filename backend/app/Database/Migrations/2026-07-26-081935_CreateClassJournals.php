<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateClassJournals extends Migration
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
            'class_id' => [
                'type'       => 'BIGINT',
                'constraint' => 20,
                'unsigned'   => true,
            ],
            'teacher_id' => [
                'type'       => 'BIGINT',
                'constraint' => 20,
                'unsigned'   => true,
            ],
            'date' => [
                'type' => 'DATE',
            ],
            'subject' => [
                'type'       => 'VARCHAR',
                'constraint' => '150',
            ],
            'activities' => [
                'type' => 'TEXT',
            ],
            'notes' => [
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
        ]);

        $this->forge->addKey('id', true);
        $this->forge->addForeignKey('school_id', 'schools', 'id', 'RESTRICT', 'CASCADE');
        $this->forge->addForeignKey('class_id', 'classes', 'id', 'RESTRICT', 'CASCADE');
        $this->forge->addForeignKey('teacher_id', 'teachers', 'id', 'RESTRICT', 'CASCADE');
        $this->forge->createTable('class_journals');
    }

    public function down()
    {
        $this->forge->dropTable('class_journals');
    }
}
