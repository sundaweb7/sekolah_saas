<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateSchoolLettersTable extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id' => ['type' => 'BIGINT', 'constraint' => 20, 'unsigned' => true, 'auto_increment' => true],
            'school_id' => ['type' => 'BIGINT', 'constraint' => 20, 'unsigned' => true],
            'student_id' => ['type' => 'BIGINT', 'constraint' => 20, 'unsigned' => true],
            'created_by' => ['type' => 'BIGINT', 'constraint' => 20, 'unsigned' => true, 'null' => true],
            'letter_type' => ['type' => 'VARCHAR', 'constraint' => 30],
            'letter_number' => ['type' => 'VARCHAR', 'constraint' => 100],
            'academic_year' => ['type' => 'VARCHAR', 'constraint' => 20, 'null' => true],
            'payload' => ['type' => 'TEXT', 'null' => true],
            'issued_at' => ['type' => 'DATETIME'],
            'created_at' => ['type' => 'DATETIME', 'null' => true],
            'updated_at' => ['type' => 'DATETIME', 'null' => true],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->addUniqueKey(['school_id', 'letter_number']);
        $this->forge->addForeignKey('school_id', 'schools', 'id', 'CASCADE', 'CASCADE');
        $this->forge->addForeignKey('student_id', 'students', 'id', 'RESTRICT', 'CASCADE');
        $this->forge->addForeignKey('created_by', 'users', 'id', 'SET NULL', 'CASCADE');
        $this->forge->createTable('school_letters');
    }

    public function down()
    {
        $this->forge->dropTable('school_letters', true);
    }
}
