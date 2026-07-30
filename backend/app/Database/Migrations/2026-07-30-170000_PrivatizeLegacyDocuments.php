<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class PrivatizeLegacyDocuments extends Migration
{
    public function up()
    {
        foreach ($this->db->table('domain_requests')->get()->getResult() as $row) {
            if (!$row->document_file || !str_starts_with($row->document_file, 'uploads/documents/')) continue;
            $new = $this->movePublicFile($row->document_file, 'domains/' . $row->school_id);
            if ($new) $this->db->table('domain_requests')->where('id', $row->id)->update(['document_file' => $new]);
        }

        foreach ($this->db->table('ppdb_registrations')->get()->getResult() as $row) {
            $documents = json_decode($row->document_files ?? '{}', true);
            $changed = false;
            foreach ($documents as $key => $path) {
                if (!is_string($path) || !str_starts_with($path, 'uploads/')) continue;
                $new = $this->movePublicFile($path, 'ppdb/' . $row->school_id);
                if ($new) {
                    $documents[$key] = $new;
                    $changed = true;
                }
            }
            if ($changed) {
                $this->db->table('ppdb_registrations')->where('id', $row->id)->update([
                    'document_files' => json_encode($documents),
                ]);
            }
        }
    }

    private function movePublicFile(string $relative, string $privateFolder): ?string
    {
        $source = realpath(ROOTPATH . 'public/' . ltrim($relative, '/'));
        $publicRoot = realpath(ROOTPATH . 'public');
        if (!$source || !$publicRoot || !str_starts_with($source, $publicRoot . DIRECTORY_SEPARATOR)) return null;

        $targetDir = WRITEPATH . 'uploads/' . $privateFolder;
        if (!is_dir($targetDir) && !mkdir($targetDir, 0750, true) && !is_dir($targetDir)) return null;
        $name = bin2hex(random_bytes(16)) . '.' . pathinfo($source, PATHINFO_EXTENSION);
        if (!rename($source, $targetDir . '/' . $name)) return null;
        return $privateFolder . '/' . $name;
    }

    public function down()
    {
        // Moving sensitive files back into the public directory is intentionally unsupported.
    }
}
