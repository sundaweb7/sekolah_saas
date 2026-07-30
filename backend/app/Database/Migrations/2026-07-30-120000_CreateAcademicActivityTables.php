<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateAcademicActivityTables extends Migration
{
    public function up()
    {
        $base = fn () => [
            'id' => ['type' => 'BIGINT', 'constraint' => 20, 'unsigned' => true, 'auto_increment' => true],
            'school_id' => ['type' => 'BIGINT', 'constraint' => 20, 'unsigned' => true],
        ];
        $timestamps = [
            'created_at' => ['type' => 'DATETIME', 'null' => true],
            'updated_at' => ['type' => 'DATETIME', 'null' => true],
        ];

        $this->forge->addField(array_merge($base(), [
            'class_id' => ['type' => 'BIGINT', 'constraint' => 20, 'unsigned' => true],
            'teacher_id' => ['type' => 'BIGINT', 'constraint' => 20, 'unsigned' => true],
            'title' => ['type' => 'VARCHAR', 'constraint' => 255],
            'content' => ['type' => 'TEXT'],
        ], $timestamps));
        $this->commonKeys();
        $this->forge->addForeignKey('class_id', 'classes', 'id', 'CASCADE', 'CASCADE');
        $this->forge->addForeignKey('teacher_id', 'teachers', 'id', 'CASCADE', 'CASCADE');
        $this->forge->createTable('class_announcements');

        $this->forge->addField(array_merge($base(), [
            'student_id' => ['type' => 'BIGINT', 'constraint' => 20, 'unsigned' => true],
            'class_id' => ['type' => 'BIGINT', 'constraint' => 20, 'unsigned' => true],
            'date' => ['type' => 'DATE'],
            'status' => ['type' => 'VARCHAR', 'constraint' => 20],
            'notes' => ['type' => 'TEXT', 'null' => true],
        ], $timestamps));
        $this->commonKeys();
        $this->forge->addUniqueKey(['student_id', 'date']);
        $this->forge->addForeignKey('student_id', 'students', 'id', 'CASCADE', 'CASCADE');
        $this->forge->addForeignKey('class_id', 'classes', 'id', 'CASCADE', 'CASCADE');
        $this->forge->createTable('student_attendances');

        $this->forge->addField(array_merge($base(), [
            'student_id' => ['type' => 'BIGINT', 'constraint' => 20, 'unsigned' => true],
            'teacher_id' => ['type' => 'BIGINT', 'constraint' => 20, 'unsigned' => true],
            'date' => ['type' => 'DATE'],
            'activities' => ['type' => 'TEXT'],
            'notes' => ['type' => 'TEXT', 'null' => true],
            'photo' => ['type' => 'VARCHAR', 'constraint' => 500, 'null' => true],
        ], $timestamps));
        $this->commonKeys();
        $this->forge->addKey(['student_id', 'date']);
        $this->forge->addForeignKey('student_id', 'students', 'id', 'CASCADE', 'CASCADE');
        $this->forge->addForeignKey('teacher_id', 'teachers', 'id', 'CASCADE', 'CASCADE');
        $this->forge->createTable('daily_reports');

        $this->forge->addField(array_merge($base(), [
            'student_id' => ['type' => 'BIGINT', 'constraint' => 20, 'unsigned' => true],
            'teacher_id' => ['type' => 'BIGINT', 'constraint' => 20, 'unsigned' => true],
            'academic_year' => ['type' => 'VARCHAR', 'constraint' => 20],
            'semester' => ['type' => 'VARCHAR', 'constraint' => 20],
            'religion_morals' => ['type' => 'TEXT', 'null' => true],
            'physical_motor' => ['type' => 'TEXT', 'null' => true],
            'cognitive' => ['type' => 'TEXT', 'null' => true],
            'language' => ['type' => 'TEXT', 'null' => true],
            'social_emotional' => ['type' => 'TEXT', 'null' => true],
            'art' => ['type' => 'TEXT', 'null' => true],
            'general_notes' => ['type' => 'TEXT', 'null' => true],
        ], $timestamps));
        $this->commonKeys();
        $this->forge->addUniqueKey(['student_id', 'academic_year', 'semester']);
        $this->forge->addForeignKey('student_id', 'students', 'id', 'CASCADE', 'CASCADE');
        $this->forge->addForeignKey('teacher_id', 'teachers', 'id', 'CASCADE', 'CASCADE');
        $this->forge->createTable('semester_reports');
    }

    private function commonKeys(): void
    {
        $this->forge->addKey('id', true);
        $this->forge->addKey('school_id');
        $this->forge->addForeignKey('school_id', 'schools', 'id', 'CASCADE', 'CASCADE');
    }

    public function down()
    {
        foreach (['semester_reports', 'daily_reports', 'student_attendances', 'class_announcements'] as $table) {
            $this->forge->dropTable($table, true);
        }
    }
}
