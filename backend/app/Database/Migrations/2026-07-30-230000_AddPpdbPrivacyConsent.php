<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddPpdbPrivacyConsent extends Migration
{
    public function up()
    {
        $fields = [
            'privacy_consent_at' => ['type' => 'DATETIME', 'null' => true],
            'privacy_version' => ['type' => 'VARCHAR', 'constraint' => 30, 'null' => true],
        ];
        foreach ($fields as $name => $definition) {
            if (!$this->db->fieldExists($name, 'ppdb_registrations')) $this->forge->addColumn('ppdb_registrations', [$name => $definition]);
        }
    }

    public function down()
    {
        // Consent records are intentionally retained for accountability.
    }
}
