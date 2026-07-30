<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddModernAttendanceAndTenantFonnte extends Migration
{
    public function up()
    {
        // 1. Tambah fonnte_token ke website_settings (per-tenant WhatsApp via Fonnte)
        if (!$this->db->fieldExists('fonnte_token', 'website_settings')) {
            $this->forge->addColumn('website_settings', [
                'fonnte_token' => ['type' => 'VARCHAR', 'constraint' => 255, 'null' => true, 'after' => 'show_accreditation'],
            ]);
        }

        // 2. Tambah kolom modern ke student_attendances
        $attCols = [
            'lesson_id'       => ['type' => 'BIGINT', 'constraint' => 20, 'unsigned' => true, 'null' => true],
            'check_in_time'   => ['type' => 'TIME', 'null' => true],
            'late_minutes'    => ['type' => 'SMALLINT', 'constraint' => 5, 'unsigned' => true, 'default' => 0],
            'source'          => ['type' => 'ENUM', 'constraint' => ['manual', 'qr', 'pin', 'kiosk'], 'default' => 'manual'],
            'notified_at'     => ['type' => 'DATETIME', 'null' => true],
        ];
        foreach ($attCols as $col => $def) {
            if (!$this->db->fieldExists($col, 'student_attendances')) {
                $this->forge->addColumn('student_attendances', [$col => $def]);
            }
        }

        // 3. Tabel attendance_pins — PIN dinamis harian per kelas
        if (!$this->db->tableExists('attendance_pins')) {
            $this->forge->addField([
                'id'         => ['type' => 'BIGINT', 'constraint' => 20, 'unsigned' => true, 'auto_increment' => true],
                'school_id'  => ['type' => 'BIGINT', 'constraint' => 20, 'unsigned' => true],
                'class_id'   => ['type' => 'BIGINT', 'constraint' => 20, 'unsigned' => true],
                'pin'        => ['type' => 'VARCHAR', 'constraint' => 8],
                'date'       => ['type' => 'DATE'],
                'expires_at' => ['type' => 'DATETIME'],
                'created_by' => ['type' => 'BIGINT', 'constraint' => 20, 'unsigned' => true],
                'created_at' => ['type' => 'DATETIME', 'null' => true],
                'updated_at' => ['type' => 'DATETIME', 'null' => true],
            ]);
            $this->forge->addKey('id', true);
            $this->forge->addUniqueKey(['school_id', 'class_id', 'date']);
            $this->forge->addKey(['school_id', 'pin', 'date']);
            $this->forge->addForeignKey('school_id', 'schools', 'id', 'CASCADE', 'CASCADE');
            $this->forge->addForeignKey('class_id', 'classes', 'id', 'CASCADE', 'CASCADE');
            $this->forge->createTable('attendance_pins');
        }

        // 4. Tambah feature flag 'modern_attendance'
        $db = \Config\Database::connect();
        $existing = $db->table('feature_settings')->where('feature_key', 'modern_attendance')->countAllResults();
        if (!$existing) {
            $db->table('feature_settings')->insertBatch([
                [
                    'feature_key'  => 'modern_attendance',
                    'feature_name' => 'Absensi Modern (QR/PIN/Kiosk)',
                    'level_tk'     => 1,
                    'level_sd'     => 1,
                    'level_smp'    => 1,
                    'level_sma'    => 1,
                    'level_mts_ma' => 1,
                    'level_smk'    => 1,
                ],
            ]);
        }
    }

    public function down()
    {
        // Non-destructive
    }
}
