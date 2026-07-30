<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddSchoolSubscriptionSnapshot extends Migration
{
    public function up()
    {
        $fields = [];
        if (!$this->db->fieldExists('subscription_plan', 'schools')) {
            $fields['subscription_plan'] = ['type' => 'VARCHAR', 'constraint' => 30, 'default' => 'trial'];
        }
        if (!$this->db->fieldExists('billing_cycle', 'schools')) {
            $fields['billing_cycle'] = ['type' => 'VARCHAR', 'constraint' => 20, 'null' => true];
        }
        if (!$this->db->fieldExists('expires_at', 'schools')) {
            $fields['expires_at'] = ['type' => 'DATE', 'null' => true];
        }
        if ($fields) {
            $this->forge->addColumn('schools', $fields);
        }
    }

    public function down()
    {
        // Kept intentionally: rolling back application code must not erase billing state.
    }
}
