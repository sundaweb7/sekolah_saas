<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateExistingFeatureTables extends Migration
{
    public function up()
    {
        $timestamps = [
            'created_at' => ['type' => 'DATETIME', 'null' => true],
            'updated_at' => ['type' => 'DATETIME', 'null' => true],
        ];

        $this->forge->addField(array_merge([
            'id' => ['type' => 'BIGINT', 'constraint' => 20, 'unsigned' => true, 'auto_increment' => true],
            'school_id' => ['type' => 'BIGINT', 'constraint' => 20, 'unsigned' => true],
            'topic' => ['type' => 'VARCHAR', 'constraint' => 150],
            'sub_topic' => ['type' => 'VARCHAR', 'constraint' => 150],
            'file_name' => ['type' => 'VARCHAR', 'constraint' => 255],
            'file_link' => ['type' => 'TEXT'],
        ], $timestamps, ['deleted_at' => ['type' => 'DATETIME', 'null' => true]]));
        $this->tenantTable('accreditation_files');

        $this->forge->addField(array_merge([
            'id' => ['type' => 'BIGINT', 'constraint' => 20, 'unsigned' => true, 'auto_increment' => true],
            'school_id' => ['type' => 'BIGINT', 'constraint' => 20, 'unsigned' => true],
            'name' => ['type' => 'VARCHAR', 'constraint' => 150],
            'coach' => ['type' => 'VARCHAR', 'constraint' => 150, 'null' => true],
            'schedule_day' => ['type' => 'VARCHAR', 'constraint' => 20, 'null' => true],
            'schedule_time' => ['type' => 'TIME', 'null' => true],
            'location' => ['type' => 'VARCHAR', 'constraint' => 255, 'null' => true],
            'quota' => ['type' => 'INT', 'constraint' => 11, 'default' => 0],
            'fee_registration' => ['type' => 'DECIMAL', 'constraint' => '12,2', 'default' => 0],
            'fee_monthly' => ['type' => 'DECIMAL', 'constraint' => '12,2', 'default' => 0],
            'status' => ['type' => 'VARCHAR', 'constraint' => 20, 'default' => 'active'],
        ], $timestamps, ['deleted_at' => ['type' => 'DATETIME', 'null' => true]]));
        $this->tenantTable('extracurriculars');

        $this->forge->addField(array_merge([
            'id' => ['type' => 'BIGINT', 'constraint' => 20, 'unsigned' => true, 'auto_increment' => true],
            'school_id' => ['type' => 'BIGINT', 'constraint' => 20, 'unsigned' => true],
            'extracurricular_id' => ['type' => 'BIGINT', 'constraint' => 20, 'unsigned' => true],
            'student_id' => ['type' => 'BIGINT', 'constraint' => 20, 'unsigned' => true],
            'status' => ['type' => 'VARCHAR', 'constraint' => 20, 'default' => 'pending'],
            'grade' => ['type' => 'VARCHAR', 'constraint' => 10, 'null' => true],
            'grade_description' => ['type' => 'TEXT', 'null' => true],
        ], $timestamps));
        $this->forge->addKey('id', true);
        $this->forge->addUniqueKey(['school_id', 'extracurricular_id', 'student_id']);
        $this->forge->addForeignKey('school_id', 'schools', 'id', 'CASCADE', 'CASCADE');
        $this->forge->addForeignKey('extracurricular_id', 'extracurriculars', 'id', 'CASCADE', 'CASCADE');
        $this->forge->addForeignKey('student_id', 'students', 'id', 'CASCADE', 'CASCADE');
        $this->forge->createTable('extracurricular_members');

        $this->forge->addField(array_merge([
            'id' => ['type' => 'BIGINT', 'constraint' => 20, 'unsigned' => true, 'auto_increment' => true],
            'school_id' => ['type' => 'BIGINT', 'constraint' => 20, 'unsigned' => true],
            'member_id' => ['type' => 'BIGINT', 'constraint' => 20, 'unsigned' => true],
            'fee_type' => ['type' => 'VARCHAR', 'constraint' => 30],
            'month_period' => ['type' => 'VARCHAR', 'constraint' => 7, 'null' => true],
            'amount' => ['type' => 'DECIMAL', 'constraint' => '12,2', 'default' => 0],
            'status' => ['type' => 'VARCHAR', 'constraint' => 20, 'default' => 'unpaid'],
            'payment_date' => ['type' => 'DATETIME', 'null' => true],
        ], $timestamps));
        $this->childTable('extracurricular_payments', 'member_id', 'extracurricular_members');

        $this->forge->addField(array_merge([
            'id' => ['type' => 'BIGINT', 'constraint' => 20, 'unsigned' => true, 'auto_increment' => true],
            'school_id' => ['type' => 'BIGINT', 'constraint' => 20, 'unsigned' => true],
            'extracurricular_id' => ['type' => 'BIGINT', 'constraint' => 20, 'unsigned' => true],
            'member_id' => ['type' => 'BIGINT', 'constraint' => 20, 'unsigned' => true],
            'presence_date' => ['type' => 'DATE'],
            'status' => ['type' => 'VARCHAR', 'constraint' => 20],
        ], $timestamps));
        $this->forge->addKey('id', true);
        $this->forge->addUniqueKey(['member_id', 'presence_date']);
        $this->forge->addForeignKey('school_id', 'schools', 'id', 'CASCADE', 'CASCADE');
        $this->forge->addForeignKey('extracurricular_id', 'extracurriculars', 'id', 'CASCADE', 'CASCADE');
        $this->forge->addForeignKey('member_id', 'extracurricular_members', 'id', 'CASCADE', 'CASCADE');
        $this->forge->createTable('extracurricular_presences');

        $this->forge->addField(array_merge([
            'id' => ['type' => 'BIGINT', 'constraint' => 20, 'unsigned' => true, 'auto_increment' => true],
            'school_id' => ['type' => 'BIGINT', 'constraint' => 20, 'unsigned' => true],
            'class_id' => ['type' => 'BIGINT', 'constraint' => 20, 'unsigned' => true],
            'day_name' => ['type' => 'VARCHAR', 'constraint' => 20],
            'subject_name' => ['type' => 'VARCHAR', 'constraint' => 150],
            'teacher_id' => ['type' => 'BIGINT', 'constraint' => 20, 'unsigned' => true, 'null' => true],
            'start_time' => ['type' => 'TIME'],
            'end_time' => ['type' => 'TIME'],
        ], $timestamps, ['deleted_at' => ['type' => 'DATETIME', 'null' => true]]));
        $this->forge->addKey('id', true);
        $this->forge->addKey(['school_id', 'class_id', 'day_name']);
        $this->forge->addForeignKey('school_id', 'schools', 'id', 'CASCADE', 'CASCADE');
        $this->forge->addForeignKey('class_id', 'classes', 'id', 'CASCADE', 'CASCADE');
        $this->forge->addForeignKey('teacher_id', 'teachers', 'id', 'SET NULL', 'CASCADE');
        $this->forge->createTable('kbm_schedules');
    }

    private function tenantTable(string $name): void
    {
        $this->forge->addKey('id', true);
        $this->forge->addKey('school_id');
        $this->forge->addForeignKey('school_id', 'schools', 'id', 'CASCADE', 'CASCADE');
        $this->forge->createTable($name);
    }

    private function childTable(string $name, string $foreignKey, string $parent): void
    {
        $this->forge->addKey('id', true);
        $this->forge->addKey('school_id');
        $this->forge->addForeignKey('school_id', 'schools', 'id', 'CASCADE', 'CASCADE');
        $this->forge->addForeignKey($foreignKey, $parent, 'id', 'CASCADE', 'CASCADE');
        $this->forge->createTable($name);
    }

    public function down()
    {
        foreach (['kbm_schedules', 'extracurricular_presences', 'extracurricular_payments', 'extracurricular_members', 'extracurriculars', 'accreditation_files'] as $table) {
            $this->forge->dropTable($table, true);
        }
    }
}
