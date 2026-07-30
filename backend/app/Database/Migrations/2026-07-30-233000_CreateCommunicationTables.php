<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateCommunicationTables extends Migration
{
    public function up()
    {
        $this->createThreads();
        $this->createParticipants();
        $this->createMessages();
        $this->createNotifications();
        $this->createStudentRequests();
        $this->createSchoolEvents();
        $this->seedFeature();
    }

    private function createThreads(): void
    {
        $this->forge->addField([
            'id' => ['type' => 'BIGINT', 'constraint' => 20, 'unsigned' => true, 'auto_increment' => true],
            'school_id' => ['type' => 'BIGINT', 'constraint' => 20, 'unsigned' => true],
            'class_id' => ['type' => 'BIGINT', 'constraint' => 20, 'unsigned' => true, 'null' => true],
            'created_by' => ['type' => 'BIGINT', 'constraint' => 20, 'unsigned' => true],
            'type' => ['type' => 'VARCHAR', 'constraint' => 20, 'default' => 'direct'],
            'subject' => ['type' => 'VARCHAR', 'constraint' => 180],
            'created_at' => ['type' => 'DATETIME', 'null' => true],
            'updated_at' => ['type' => 'DATETIME', 'null' => true],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->addKey(['school_id', 'updated_at']);
        $this->forge->addForeignKey('school_id', 'schools', 'id', 'CASCADE', 'CASCADE');
        $this->forge->addForeignKey('class_id', 'classes', 'id', 'SET NULL', 'CASCADE');
        $this->forge->addForeignKey('created_by', 'users', 'id', 'CASCADE', 'CASCADE');
        $this->forge->createTable('communication_threads');
    }

    private function createParticipants(): void
    {
        $this->forge->addField([
            'id' => ['type' => 'BIGINT', 'constraint' => 20, 'unsigned' => true, 'auto_increment' => true],
            'school_id' => ['type' => 'BIGINT', 'constraint' => 20, 'unsigned' => true],
            'thread_id' => ['type' => 'BIGINT', 'constraint' => 20, 'unsigned' => true],
            'user_id' => ['type' => 'BIGINT', 'constraint' => 20, 'unsigned' => true],
            'last_read_at' => ['type' => 'DATETIME', 'null' => true],
            'created_at' => ['type' => 'DATETIME', 'null' => true],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->addUniqueKey(['thread_id', 'user_id']);
        $this->forge->addKey(['school_id', 'user_id']);
        $this->forge->addForeignKey('school_id', 'schools', 'id', 'CASCADE', 'CASCADE');
        $this->forge->addForeignKey('thread_id', 'communication_threads', 'id', 'CASCADE', 'CASCADE');
        $this->forge->addForeignKey('user_id', 'users', 'id', 'CASCADE', 'CASCADE');
        $this->forge->createTable('communication_participants');
    }

    private function createMessages(): void
    {
        $this->forge->addField([
            'id' => ['type' => 'BIGINT', 'constraint' => 20, 'unsigned' => true, 'auto_increment' => true],
            'school_id' => ['type' => 'BIGINT', 'constraint' => 20, 'unsigned' => true],
            'thread_id' => ['type' => 'BIGINT', 'constraint' => 20, 'unsigned' => true],
            'sender_user_id' => ['type' => 'BIGINT', 'constraint' => 20, 'unsigned' => true],
            'body' => ['type' => 'TEXT'],
            'created_at' => ['type' => 'DATETIME', 'null' => true],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->addKey(['school_id', 'thread_id', 'created_at']);
        $this->forge->addForeignKey('school_id', 'schools', 'id', 'CASCADE', 'CASCADE');
        $this->forge->addForeignKey('thread_id', 'communication_threads', 'id', 'CASCADE', 'CASCADE');
        $this->forge->addForeignKey('sender_user_id', 'users', 'id', 'CASCADE', 'CASCADE');
        $this->forge->createTable('communication_messages');
    }

    private function createNotifications(): void
    {
        $this->forge->addField([
            'id' => ['type' => 'BIGINT', 'constraint' => 20, 'unsigned' => true, 'auto_increment' => true],
            'school_id' => ['type' => 'BIGINT', 'constraint' => 20, 'unsigned' => true],
            'user_id' => ['type' => 'BIGINT', 'constraint' => 20, 'unsigned' => true],
            'type' => ['type' => 'VARCHAR', 'constraint' => 40],
            'title' => ['type' => 'VARCHAR', 'constraint' => 180],
            'body' => ['type' => 'TEXT'],
            'data_json' => ['type' => 'TEXT', 'null' => true],
            'deliver_after' => ['type' => 'DATETIME', 'null' => true],
            'email_status' => ['type' => 'VARCHAR', 'constraint' => 20, 'default' => 'pending'],
            'whatsapp_status' => ['type' => 'VARCHAR', 'constraint' => 20, 'default' => 'pending'],
            'email_attempts' => ['type' => 'INT', 'constraint' => 5, 'default' => 0],
            'whatsapp_attempts' => ['type' => 'INT', 'constraint' => 5, 'default' => 0],
            'read_at' => ['type' => 'DATETIME', 'null' => true],
            'created_at' => ['type' => 'DATETIME', 'null' => true],
            'updated_at' => ['type' => 'DATETIME', 'null' => true],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->addKey(['school_id', 'user_id', 'read_at']);
        $this->forge->addKey(['deliver_after', 'email_status', 'whatsapp_status']);
        $this->forge->addForeignKey('school_id', 'schools', 'id', 'CASCADE', 'CASCADE');
        $this->forge->addForeignKey('user_id', 'users', 'id', 'CASCADE', 'CASCADE');
        $this->forge->createTable('notifications');
    }

    private function createStudentRequests(): void
    {
        $this->forge->addField([
            'id' => ['type' => 'BIGINT', 'constraint' => 20, 'unsigned' => true, 'auto_increment' => true],
            'school_id' => ['type' => 'BIGINT', 'constraint' => 20, 'unsigned' => true],
            'student_id' => ['type' => 'BIGINT', 'constraint' => 20, 'unsigned' => true],
            'requested_by' => ['type' => 'BIGINT', 'constraint' => 20, 'unsigned' => true],
            'handled_by' => ['type' => 'BIGINT', 'constraint' => 20, 'unsigned' => true, 'null' => true],
            'type' => ['type' => 'VARCHAR', 'constraint' => 20],
            'request_date' => ['type' => 'DATE'],
            'reason' => ['type' => 'TEXT'],
            'pickup_name' => ['type' => 'VARCHAR', 'constraint' => 150, 'null' => true],
            'pickup_relationship' => ['type' => 'VARCHAR', 'constraint' => 80, 'null' => true],
            'pickup_phone' => ['type' => 'VARCHAR', 'constraint' => 30, 'null' => true],
            'status' => ['type' => 'VARCHAR', 'constraint' => 20, 'default' => 'pending'],
            'admin_note' => ['type' => 'TEXT', 'null' => true],
            'handled_at' => ['type' => 'DATETIME', 'null' => true],
            'created_at' => ['type' => 'DATETIME', 'null' => true],
            'updated_at' => ['type' => 'DATETIME', 'null' => true],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->addKey(['school_id', 'request_date', 'status']);
        $this->forge->addForeignKey('school_id', 'schools', 'id', 'CASCADE', 'CASCADE');
        $this->forge->addForeignKey('student_id', 'students', 'id', 'CASCADE', 'CASCADE');
        $this->forge->addForeignKey('requested_by', 'users', 'id', 'CASCADE', 'CASCADE');
        $this->forge->addForeignKey('handled_by', 'users', 'id', 'SET NULL', 'CASCADE');
        $this->forge->createTable('student_requests');
    }

    private function createSchoolEvents(): void
    {
        $this->forge->addField([
            'id' => ['type' => 'BIGINT', 'constraint' => 20, 'unsigned' => true, 'auto_increment' => true],
            'school_id' => ['type' => 'BIGINT', 'constraint' => 20, 'unsigned' => true],
            'class_id' => ['type' => 'BIGINT', 'constraint' => 20, 'unsigned' => true, 'null' => true],
            'created_by' => ['type' => 'BIGINT', 'constraint' => 20, 'unsigned' => true],
            'title' => ['type' => 'VARCHAR', 'constraint' => 180],
            'description' => ['type' => 'TEXT', 'null' => true],
            'location' => ['type' => 'VARCHAR', 'constraint' => 180, 'null' => true],
            'audience' => ['type' => 'VARCHAR', 'constraint' => 20, 'default' => 'school'],
            'starts_at' => ['type' => 'DATETIME'],
            'ends_at' => ['type' => 'DATETIME', 'null' => true],
            'reminder_minutes' => ['type' => 'INT', 'constraint' => 11, 'default' => 1440],
            'reminder_sent_at' => ['type' => 'DATETIME', 'null' => true],
            'created_at' => ['type' => 'DATETIME', 'null' => true],
            'updated_at' => ['type' => 'DATETIME', 'null' => true],
            'deleted_at' => ['type' => 'DATETIME', 'null' => true],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->addKey(['school_id', 'starts_at']);
        $this->forge->addForeignKey('school_id', 'schools', 'id', 'CASCADE', 'CASCADE');
        $this->forge->addForeignKey('class_id', 'classes', 'id', 'SET NULL', 'CASCADE');
        $this->forge->addForeignKey('created_by', 'users', 'id', 'CASCADE', 'CASCADE');
        $this->forge->createTable('school_events');
    }

    private function seedFeature(): void
    {
        if (!$this->db->tableExists('feature_settings')) return;
        $builder = $this->db->table('feature_settings');
        if ($builder->where('feature_key', 'communication')->countAllResults() > 0) return;
        $fields = $this->db->getFieldNames('feature_settings');
        $row = ['feature_key' => 'communication', 'feature_name' => 'Komunikasi dan Notifikasi'];
        foreach ($fields as $field) {
            if (str_starts_with($field, 'level_') || str_starts_with($field, 'plan_')) $row[$field] = 1;
        }
        $builder->insert($row);
    }

    public function down()
    {
        foreach (['school_events', 'student_requests', 'notifications', 'communication_messages', 'communication_participants', 'communication_threads'] as $table) {
            $this->forge->dropTable($table, true);
        }
        if ($this->db->tableExists('feature_settings')) {
            $this->db->table('feature_settings')->where('feature_key', 'communication')->delete();
        }
    }
}
