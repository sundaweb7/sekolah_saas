<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddBillingCycleToSubscriptions extends Migration
{
    public function up()
    {
        if (!$this->db->fieldExists('billing_cycle', 'subscriptions')) {
            $this->forge->addColumn('subscriptions', [
                'billing_cycle' => [
                    'type' => 'VARCHAR',
                    'constraint' => 20,
                    'default' => 'monthly',
                    'after' => 'plan_name',
                ],
            ]);
        }
    }

    public function down()
    {
        // Non-destructive reconciliation migration.
    }
}
