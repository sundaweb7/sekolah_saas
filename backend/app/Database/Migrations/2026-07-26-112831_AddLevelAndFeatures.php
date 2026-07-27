<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddLevelAndFeatures extends Migration
{
    public function up()
    {
        // 1. Add level to schools
        $this->forge->addColumn('schools', [
            'level' => [
                'type'       => 'ENUM',
                'constraint' => ['TK', 'SD', 'SMP', 'SMA', 'MTS_MA', 'SMK'],
                'default'    => 'TK',
                'null'       => false,
                'after'      => 'npsn'
            ]
        ]);

        // 2. Create feature_settings table
        $this->forge->addField([
            'id' => [
                'type'           => 'INT',
                'constraint'     => 11,
                'unsigned'       => true,
                'auto_increment' => true,
            ],
            'feature_key' => [
                'type'       => 'VARCHAR',
                'constraint' => 50,
                'null'       => false,
            ],
            'feature_name' => [
                'type'       => 'VARCHAR',
                'constraint' => 100,
                'null'       => false,
            ],
            'level_tk' => [
                'type'       => 'TINYINT',
                'constraint' => 1,
                'default'    => 1,
            ],
            'level_sd' => [
                'type'       => 'TINYINT',
                'constraint' => 1,
                'default'    => 1,
            ],
            'level_smp' => [
                'type'       => 'TINYINT',
                'constraint' => 1,
                'default'    => 1,
            ],
            'level_sma' => [
                'type'       => 'TINYINT',
                'constraint' => 1,
                'default'    => 1,
            ],
            'level_mts_ma' => [
                'type'       => 'TINYINT',
                'constraint' => 1,
                'default'    => 1,
            ],
            'level_smk' => [
                'type'       => 'TINYINT',
                'constraint' => 1,
                'default'    => 1,
            ],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->addUniqueKey('feature_key');
        $this->forge->createTable('feature_settings');

        // 3. Seed default features
        $db      = \Config\Database::connect();
        $builder = $db->table('feature_settings');
        
        $builder->insertBatch([
            [
                'feature_key'  => 'company_profile',
                'feature_name' => 'Website Company Profile Sekolah',
                'level_tk'     => 1,
                'level_sd'     => 1,
                'level_smp'    => 1,
                'level_sma'    => 1,
                'level_mts_ma' => 1,
                'level_smk'    => 1,
            ],
            [
                'feature_key'  => 'ppdb',
                'feature_name' => 'PPDB Online',
                'level_tk'     => 1,
                'level_sd'     => 1,
                'level_smp'    => 1,
                'level_sma'    => 1,
                'level_mts_ma' => 1,
                'level_smk'    => 1,
            ],
            [
                'feature_key'  => 'absensi_guru',
                'feature_name' => 'Fitur Absensi Guru GPS',
                'level_tk'     => 1,
                'level_sd'     => 1,
                'level_smp'    => 1,
                'level_sma'    => 1,
                'level_mts_ma' => 1,
                'level_smk'    => 1,
            ],
            [
                'feature_key'  => 'absensi_siswa_jurnal',
                'feature_name' => 'Fitur Absensi Siswa & Jurnal',
                'level_tk'     => 1,
                'level_sd'     => 1,
                'level_smp'    => 1,
                'level_sma'    => 1,
                'level_mts_ma' => 1,
                'level_smk'    => 1,
            ],
            [
                'feature_key'  => 'perkembangan_siswa',
                'feature_name' => 'Laporan / Perkembangan Siswa',
                'level_tk'     => 1,
                'level_sd'     => 1,
                'level_smp'    => 1,
                'level_sma'    => 1,
                'level_mts_ma' => 1,
                'level_smk'    => 1,
            ],
            [
                'feature_key'  => 'spp_siswa',
                'feature_name' => 'Fitur SPP Siswa',
                'level_tk'     => 1,
                'level_sd'     => 1,
                'level_smp'    => 1,
                'level_sma'    => 1,
                'level_mts_ma' => 1,
                'level_smk'    => 1,
            ],
        ]);
    }

    public function down()
    {
        $this->forge->dropTable('feature_settings', true);
        $this->forge->dropColumn('schools', 'level');
    }
}
