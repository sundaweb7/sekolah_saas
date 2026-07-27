<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateTeacherAttendances extends Migration
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
            'teacher_id' => [
                'type'       => 'BIGINT',
                'constraint' => 20,
                'unsigned'   => true,
            ],
            'date' => [
                'type' => 'DATE',
            ],
            'status' => [
                'type'       => 'ENUM',
                'constraint' => ['hadir', 'terlambat', 'absen'],
                'default'    => 'hadir',
            ],
            'latitude' => [
                'type'       => 'VARCHAR',
                'constraint' => '50',
                'null'       => true,
            ],
            'longitude' => [
                'type'       => 'VARCHAR',
                'constraint' => '50',
                'null'       => true,
            ],
            'check_in_time' => [
                'type' => 'TIME',
                'null' => true,
            ],
            'check_out_time' => [
                'type' => 'TIME',
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
        $this->forge->addForeignKey('teacher_id', 'teachers', 'id', 'RESTRICT', 'CASCADE');
        $this->forge->createTable('teacher_attendances');
    }

    public function down()
    {
        $this->forge->dropTable('teacher_attendances');
    }
}
