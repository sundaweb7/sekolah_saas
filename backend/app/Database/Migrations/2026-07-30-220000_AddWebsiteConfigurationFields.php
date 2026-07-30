<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddWebsiteConfigurationFields extends Migration
{
    private array $fields = [
        'letterhead_logo' => ['type' => 'VARCHAR', 'constraint' => 255, 'null' => true],
        'theme_template' => ['type' => 'VARCHAR', 'constraint' => 50, 'default' => 'modern'],
        'payment_bank_name' => ['type' => 'VARCHAR', 'constraint' => 100, 'null' => true],
        'payment_account_number' => ['type' => 'VARCHAR', 'constraint' => 100, 'null' => true],
        'payment_account_name' => ['type' => 'VARCHAR', 'constraint' => 150, 'null' => true],
        'bank_accounts' => ['type' => 'JSON', 'null' => true],
        'show_accreditation' => ['type' => 'TINYINT', 'constraint' => 1, 'default' => 0],
    ];

    public function up()
    {
        foreach ($this->fields as $name => $definition) {
            if (!$this->db->fieldExists($name, 'website_settings')) $this->forge->addColumn('website_settings', [$name => $definition]);
        }
    }

    public function down()
    {
        // Non-destructive reconciliation migration.
    }
}
