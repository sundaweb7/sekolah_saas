<?php

namespace App\Controllers\Teacher;

use App\Controllers\BaseResourceController;
use App\Models\TeacherModel;
use App\Models\ClassModel;
use App\Models\StudentModel;
use CodeIgniter\HTTP\ResponseInterface;

class DashboardController extends BaseResourceController
{
    protected TeacherModel $teacherModel;
    protected ClassModel $classModel;
    protected StudentModel $studentModel;

    public function __construct()
    {
        $this->teacherModel = new TeacherModel();
        $this->classModel = new ClassModel();
        $this->studentModel = new StudentModel();
    }

    /**
     * GET /api/v1/teacher/dashboard/stats
     */
    public function getStats(): ResponseInterface
    {
        $user = $this->request->user ?? null;
        if (!$user || $user->role !== 'teacher') {
            return $this->respondError('Unauthorized access', ResponseInterface::HTTP_FORBIDDEN);
        }

        // Find teacher profile
        $teacher = $this->teacherModel->where('user_id', $user->id)->first();
        if (!$teacher) {
            return $this->respondError('Profil pendidik tidak ditemukan di database sekolah.', ResponseInterface::HTTP_NOT_FOUND);
        }

        // Find class assigned to this teacher
        $class = $this->classModel->where('teacher_id', $teacher->id)->first();
        
        $students = [];
        $className = 'Belum memiliki kelas bimbingan';
        $classDetails = null;

        if ($class) {
            $classDetails = $class;
            $className = $class->name . ' (' . str_replace('_', ' ', $class->age_group) . ')';
            
            // Fetch students in this class
            $students = $this->studentModel
                ->where('current_class_id', $class->id)
                ->where('status', 'aktif')
                ->findAll();

            // Load parent login details for each student
            $userModel = new \App\Models\UserModel();
            foreach ($students as &$student) {
                if (!empty($student->parent_user_id)) {
                    $parent = $userModel->find($student->parent_user_id);
                    if ($parent) {
                        $student->parent_email = $parent->email;
                        $student->parent_name = $parent->full_name;
                        $student->parent_phone = $parent->phone;
                    }
                }
            }
        }

        return $this->respondSuccess([
            'teacher' => [
                'id' => $teacher->id,
                'user_id' => $teacher->user_id,
                'full_name' => $teacher->full_name,
                'nuptk' => $teacher->nuptk,
                'phone' => $teacher->phone,
                'photo' => $teacher->photo,
                'class_name' => $className
            ],
            'class' => $classDetails,
            'students' => $students
        ]);
    }
}
