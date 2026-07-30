<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddOperationalStudentFields extends Migration
{
    public function up()
    {
        $addedParent = false;
        if (!$this->db->fieldExists('parent_user_id', 'students')) {
            $this->forge->addColumn('students', [
                'parent_user_id' => [
                    'type' => 'BIGINT', 'constraint' => 20, 'unsigned' => true,
                    'null' => true, 'after' => 'current_class_id',
                ],
            ]);
            $addedParent = true;
        }
        if (!$this->db->fieldExists('status', 'students')) {
            $this->forge->addColumn('students', [
                'status' => [
                    'type' => 'VARCHAR', 'constraint' => 20,
                    'default' => 'aktif', 'after' => 'parent_user_id',
                ],
            ]);
        }

        if ($addedParent && $this->db->DBDriver !== 'SQLite3') {
            $this->db->query('ALTER TABLE students ADD CONSTRAINT fk_students_parent_user_id FOREIGN KEY (parent_user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE');
        }
    }

    public function down()
    {
        // Non-destructive reconciliation migration.
    }
}
