<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateWebsiteSettingsTable extends Migration
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
            'favicon' => [
                'type'       => 'VARCHAR',
                'constraint' => '255',
                'null'       => true,
            ],
            'logo' => [
                'type'       => 'VARCHAR',
                'constraint' => '255',
                'null'       => true,
            ],
            'letterhead_logo' => ['type' => 'VARCHAR', 'constraint' => 255, 'null' => true],
            'theme_color' => [
                'type'       => 'VARCHAR',
                'constraint' => '10',
                'default'    => '#6366F1', // default Indigo color
            ],
            'theme_template' => ['type' => 'VARCHAR', 'constraint' => 50, 'default' => 'modern'],
            'menu_data' => [
                'type' => 'JSON',
                'null' => true,
            ],
            'google_maps_iframe' => [
                'type' => 'TEXT',
                'null' => true,
            ],
            'footer_text' => [
                'type'       => 'VARCHAR',
                'constraint' => '255',
                'null'       => true,
            ],
            'contact_info' => [
                'type' => 'JSON',
                'null' => true,
            ],
            'payment_bank_name' => ['type' => 'VARCHAR', 'constraint' => 100, 'null' => true],
            'payment_account_number' => ['type' => 'VARCHAR', 'constraint' => 100, 'null' => true],
            'payment_account_name' => ['type' => 'VARCHAR', 'constraint' => 150, 'null' => true],
            'bank_accounts' => ['type' => 'JSON', 'null' => true],
            'show_accreditation' => ['type' => 'TINYINT', 'constraint' => 1, 'default' => 0],
            'hero_banner_image' => [
                'type'       => 'VARCHAR',
                'constraint' => '255',
                'null'       => true,
            ],
            'slider_images' => [
                'type' => 'JSON',
                'null' => true,
            ],
            'seo_title' => [
                'type'       => 'VARCHAR',
                'constraint' => '150',
                'null'       => true,
            ],
            'seo_description' => [
                'type'       => 'VARCHAR',
                'constraint' => '255',
                'null'       => true,
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
        $this->forge->createTable('website_settings');
    }

    public function down()
    {
        $this->forge->dropTable('website_settings');
    }
}
