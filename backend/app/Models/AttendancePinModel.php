<?php

namespace App\Models;

use CodeIgniter\Model;

class AttendancePinModel extends Model
{
    protected $table            = 'attendance_pins';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'object';
    protected $protectFields    = true;
    protected $allowedFields    = [
        'school_id', 'class_id', 'pin', 'date', 'expires_at', 'created_by',
    ];

    protected $useTimestamps = true;
    protected $dateFormat    = 'datetime';
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';

    /**
     * Get or generate PIN for a class on a given date.
     * PIN is regenerated automatically if the existing one has expired.
     */
    public function getOrCreate(int $schoolId, int $classId, int $createdBy, string $date = ''): object
    {
        $date = $date ?: date('Y-m-d');
        $existing = $this->where('school_id', $schoolId)
            ->where('class_id', $classId)
            ->where('date', $date)
            ->first();

        if ($existing && strtotime($existing->expires_at) > time()) {
            return $existing;
        }

        // Generate unique 6-digit PIN for this school+date (not reused in same school today)
        do {
            $pin = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
            $clash = $this->where('school_id', $schoolId)->where('date', $date)->where('pin', $pin)->first();
        } while ($clash);

        $expiresAt = $date . ' 23:59:59';

        if ($existing) {
            $this->update($existing->id, ['pin' => $pin, 'expires_at' => $expiresAt, 'created_by' => $createdBy]);
            return $this->find($existing->id);
        }

        $id = $this->insert([
            'school_id'  => $schoolId,
            'class_id'   => $classId,
            'pin'        => $pin,
            'date'       => $date,
            'expires_at' => $expiresAt,
            'created_by' => $createdBy,
        ]);
        return $this->find($id);
    }

    /**
     * Validate a PIN and return the associated class/school, or null if invalid.
     */
    public function verifyPin(int $schoolId, string $pin, string $date = ''): ?object
    {
        $date = $date ?: date('Y-m-d');
        return $this->where('school_id', $schoolId)
            ->where('pin', $pin)
            ->where('date', $date)
            ->where('expires_at >=', date('Y-m-d H:i:s'))
            ->first();
    }
}
