<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddBillingCycleToInvoices extends Migration
{
    public function up()
    {
        $fields = [
            'billing_cycle' => [
                'type'       => 'VARCHAR',
                'constraint' => '30',
                'default'    => 'monthly',
                'null'       => false,
                'after'      => 'plan_name'
            ]
        ];
        $this->forge->addColumn('invoices', $fields);
    }

    public function down()
    {
        $this->forge->dropColumn('invoices', 'billing_cycle');
    }
}
