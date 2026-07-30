<?php

namespace App\Services;

use CodeIgniter\Database\BaseConnection;
use RuntimeException;

class CommunicationAccessService
{
    private BaseConnection $db;

    public function __construct()
    {
        $this->db = \Config\Database::connect();
    }

    public function contacts(object $actor): array
    {
        $schoolId = (int) $actor->school_id;
        $ids = $this->allowedContactIds($actor);
        if (!$ids) return [];
        return $this->db->table('users')
            ->select('id, full_name, email, phone, role')
            ->where('school_id', $schoolId)->where('status', 'active')
            ->whereIn('id', $ids)->orderBy('full_name', 'ASC')->get()->getResultArray();
    }

    public function classes(object $actor): array
    {
        $builder = $this->db->table('classes c')
            ->select('c.id, c.name, c.age_group')->where('c.school_id', (int) $actor->school_id)
            ->where('c.deleted_at', null);
        if ($actor->role === 'teacher') {
            $teacher = $this->teacherForUser((int) $actor->id, (int) $actor->school_id);
            if (!$teacher) return [];
            $builder->where('c.teacher_id', $teacher->id);
        } elseif ($actor->role === 'parent') {
            $builder->join('students s', 's.current_class_id = c.id')
                ->where('s.parent_user_id', (int) $actor->id)->where('s.deleted_at', null)
                ->groupBy(['c.id', 'c.name', 'c.age_group']);
        }
        return $builder->orderBy('c.name', 'ASC')->get()->getResultArray();
    }

    public function assertCanContact(object $actor, int $targetUserId): void
    {
        if ($targetUserId === (int) $actor->id || !in_array($targetUserId, $this->allowedContactIds($actor), true)) {
            throw new RuntimeException('Penerima tidak dapat dihubungi oleh akun ini.');
        }
    }

    public function assertCanManageClass(object $actor, int $classId): void
    {
        $class = $this->db->table('classes')->where('id', $classId)
            ->where('school_id', (int) $actor->school_id)->where('deleted_at', null)->get()->getRow();
        if (!$class) throw new RuntimeException('Kelas tidak ditemukan.');
        if ($actor->role === 'admin') return;
        $teacher = $this->teacherForUser((int) $actor->id, (int) $actor->school_id);
        if ($actor->role !== 'teacher' || !$teacher || (int) $class->teacher_id !== (int) $teacher->id) {
            throw new RuntimeException('Anda tidak memiliki akses ke kelas ini.');
        }
    }

    public function audienceUserIds(int $schoolId, string $audience, ?int $classId = null): array
    {
        if ($audience === 'class') {
            if (!$classId) return [];
            $parentIds = array_column($this->db->table('students')->select('parent_user_id')
                ->where('school_id', $schoolId)->where('current_class_id', $classId)
                ->where('parent_user_id !=', null)->where('deleted_at', null)->get()->getResultArray(), 'parent_user_id');
            $teacherIds = array_column($this->db->table('classes c')->select('t.user_id')
                ->join('teachers t', 't.id = c.teacher_id', 'left')->where('c.id', $classId)
                ->where('c.school_id', $schoolId)->where('t.user_id !=', null)->get()->getResultArray(), 'user_id');
            $adminIds = array_column($this->db->table('users')->select('id')->where('school_id', $schoolId)
                ->where('role', 'admin')->where('status', 'active')->get()->getResultArray(), 'id');
            return array_values(array_unique(array_map('intval', array_merge($parentIds, $teacherIds, $adminIds))));
        }

        $builder = $this->db->table('users')->select('id')->where('school_id', $schoolId)->where('status', 'active');
        if ($audience === 'staff') $builder->whereIn('role', ['admin', 'teacher']);
        if ($audience === 'parents') $builder->where('role', 'parent');
        return array_map('intval', array_column($builder->get()->getResultArray(), 'id'));
    }

    public function canViewEvent(object $actor, object $event): bool
    {
        if ((int) $event->school_id !== (int) $actor->school_id) return false;
        if ($actor->role === 'admin' || $event->audience === 'school') return true;
        if ($event->audience === 'staff') return $actor->role === 'teacher';
        if ($event->audience === 'parents') return $actor->role === 'parent';
        if ($event->audience === 'class' && $event->class_id) {
            return in_array((int) $event->class_id, array_map(static fn ($row) => (int) $row['id'], $this->classes($actor)), true);
        }
        return false;
    }

    private function allowedContactIds(object $actor): array
    {
        $schoolId = (int) $actor->school_id;
        if ($actor->role === 'admin') {
            return array_map('intval', array_column($this->db->table('users')->select('id')
                ->where('school_id', $schoolId)->where('status', 'active')->whereIn('role', ['teacher', 'parent'])
                ->get()->getResultArray(), 'id'));
        }

        $ids = array_column($this->db->table('users')->select('id')->where('school_id', $schoolId)
            ->where('role', 'admin')->where('status', 'active')->get()->getResultArray(), 'id');
        if ($actor->role === 'teacher') {
            $teacher = $this->teacherForUser((int) $actor->id, $schoolId);
            if ($teacher) {
                $parents = $this->db->table('students s')->select('s.parent_user_id')
                    ->join('classes c', 'c.id = s.current_class_id')
                    ->where('c.teacher_id', $teacher->id)->where('s.school_id', $schoolId)
                    ->where('s.parent_user_id !=', null)->where('s.deleted_at', null)->get()->getResultArray();
                $ids = array_merge($ids, array_column($parents, 'parent_user_id'));
            }
        } elseif ($actor->role === 'parent') {
            $teachers = $this->db->table('students s')->select('t.user_id')
                ->join('classes c', 'c.id = s.current_class_id')
                ->join('teachers t', 't.id = c.teacher_id')
                ->where('s.parent_user_id', (int) $actor->id)->where('s.school_id', $schoolId)
                ->where('s.deleted_at', null)->where('t.deleted_at', null)->get()->getResultArray();
            $ids = array_merge($ids, array_column($teachers, 'user_id'));
        }
        return array_values(array_unique(array_map('intval', $ids)));
    }

    private function teacherForUser(int $userId, int $schoolId): ?object
    {
        return $this->db->table('teachers')->where('user_id', $userId)->where('school_id', $schoolId)
            ->where('deleted_at', null)->get()->getRow();
    }
}
