<?php

namespace App\Controllers\Admin;

use App\Controllers\BaseResourceController;
use App\Models\DailyReportModel;
use App\Models\SemesterReportModel;
use App\Models\TeacherAttendanceModel;
use App\Models\ClassJournalModel;
use App\Models\StudentAttendanceModel;
use App\Libraries\UploadService;
use CodeIgniter\HTTP\ResponseInterface;
use Exception;

class ReportController extends BaseResourceController
{
    protected DailyReportModel $dailyModel;
    protected SemesterReportModel $semesterModel;
    protected UploadService $uploadService;

    public function __construct()
    {
        $this->dailyModel = new DailyReportModel();
        $this->semesterModel = new SemesterReportModel();
        $this->uploadService = new UploadService();
    }

    /**
     * GET /api/v1/admin/reports/daily
     */
    public function getDaily(): ResponseInterface
    {
        $studentId = $this->request->getVar('student_id');
        if (!$studentId) {
            return $this->respondError('ID Siswa diperlukan.', ResponseInterface::HTTP_BAD_REQUEST);
        }

        $reports = $this->dailyModel->where('student_id', $studentId)->orderBy('date', 'DESC')->findAll();
        return $this->respondSuccess($reports);
    }

    /**
     * POST /api/v1/admin/reports/daily
     */
    public function createDaily(): ResponseInterface
    {
        $data = $this->request->getPost();
        
        $file = $this->request->getFile('photo_file');
        if ($file && $file->isValid()) {
            try {
                $path = $this->uploadService->uploadImage($file, 'uploads/reports');
                $data['photo'] = $path;
            } catch (Exception $e) {
                return $this->respondError($e->getMessage(), ResponseInterface::HTTP_BAD_REQUEST);
            }
        }

        $data['school_id'] = defined('CURRENT_SCHOOL_ID') ? CURRENT_SCHOOL_ID : null;
        $user = $this->request->user ?? null;
        if ($user) {
            $data['teacher_id'] = $user->id;
        }

        if (!$this->dailyModel->insert($data)) {
            return $this->respondError('Gagal menyimpan laporan harian.', ResponseInterface::HTTP_BAD_REQUEST, $this->dailyModel->errors());
        }

        $id = $this->dailyModel->getInsertID();
        return $this->respondSuccess($this->dailyModel->find($id), 'Laporan harian berhasil disimpan.', ResponseInterface::HTTP_CREATED);
    }

    /**
     * POST /api/v1/admin/reports/daily/update/{id}
     */
    public function updateDaily($id = null): ResponseInterface
    {
        $report = $this->dailyModel->find($id);
        if (!$report) {
            return $this->respondError('Laporan tidak ditemukan.', ResponseInterface::HTTP_NOT_FOUND);
        }

        $data = $this->request->getPost();

        $file = $this->request->getFile('photo_file');
        if ($file && $file->isValid()) {
            try {
                $path = $this->uploadService->uploadImage($file, 'uploads/reports');
                $data['photo'] = $path;
                if ($report->photo && file_exists(ROOTPATH . 'public/' . $report->photo)) {
                    unlink(ROOTPATH . 'public/' . $report->photo);
                }
            } catch (Exception $e) {
                return $this->respondError($e->getMessage(), ResponseInterface::HTTP_BAD_REQUEST);
            }
        }

        if (!$this->dailyModel->update($id, $data)) {
            return $this->respondError('Gagal memperbarui laporan.', ResponseInterface::HTTP_BAD_REQUEST, $this->dailyModel->errors());
        }

        return $this->respondSuccess($this->dailyModel->find($id), 'Laporan harian berhasil diperbarui.');
    }

    /**
     * DELETE /api/v1/admin/reports/daily/{id}
     */
    public function deleteDaily($id = null): ResponseInterface
    {
        $report = $this->dailyModel->find($id);
        if (!$report) {
            return $this->respondError('Laporan tidak ditemukan.', ResponseInterface::HTTP_NOT_FOUND);
        }

        if ($report->photo && file_exists(ROOTPATH . 'public/' . $report->photo)) {
            unlink(ROOTPATH . 'public/' . $report->photo);
        }

        $this->dailyModel->delete($id);
        return $this->respondSuccess(null, 'Laporan harian berhasil dihapus.');
    }

    /**
     * GET /api/v1/admin/reports/semester
     */
    public function getSemester(): ResponseInterface
    {
        $studentId = $this->request->getVar('student_id');
        if (!$studentId) {
            return $this->respondError('ID Siswa diperlukan.', ResponseInterface::HTTP_BAD_REQUEST);
        }

        $reports = $this->semesterModel->where('student_id', $studentId)->orderBy('id', 'DESC')->findAll();
        return $this->respondSuccess($reports);
    }

    /**
     * POST /api/v1/admin/reports/semester
     */
    public function createSemester(): ResponseInterface
    {
        $data = $this->request->getPost();
        $data['school_id'] = defined('CURRENT_SCHOOL_ID') ? CURRENT_SCHOOL_ID : null;
        $user = $this->request->user ?? null;
        if ($user) {
            $data['teacher_id'] = $user->id;
        }

        if (!$this->semesterModel->insert($data)) {
            return $this->respondError('Gagal menyimpan rapor semester.', ResponseInterface::HTTP_BAD_REQUEST, $this->semesterModel->errors());
        }

        $id = $this->semesterModel->getInsertID();
        return $this->respondSuccess($this->semesterModel->find($id), 'Rapor semester berhasil disimpan.', ResponseInterface::HTTP_CREATED);
    }

    /**
     * POST /api/v1/admin/reports/semester/update/{id}
     */
    public function updateSemester($id = null): ResponseInterface
    {
        $report = $this->semesterModel->find($id);
        if (!$report) {
            return $this->respondError('Rapor tidak ditemukan.', ResponseInterface::HTTP_NOT_FOUND);
        }

        $data = $this->request->getPost();

        if (!$this->semesterModel->update($id, $data)) {
            return $this->respondError('Gagal memperbarui rapor.', ResponseInterface::HTTP_BAD_REQUEST, $this->semesterModel->errors());
        }

        return $this->respondSuccess($this->semesterModel->find($id), 'Rapor semester berhasil diperbarui.');
    }

    /**
     * DELETE /api/v1/admin/reports/semester/{id}
     */
    public function deleteSemester($id = null): ResponseInterface
    {
        $report = $this->semesterModel->find($id);
        if (!$report) {
            return $this->respondError('Rapor tidak ditemukan.', ResponseInterface::HTTP_NOT_FOUND);
        }

        $this->semesterModel->delete($id);
        return $this->respondSuccess(null, 'Rapor semester berhasil dihapus.');
    }

    /**
     * GET /api/v1/admin/reports/teacher-attendance
     */
    public function getTeacherAttendanceReport(): ResponseInterface
    {
        $model = new TeacherAttendanceModel();
        $db = \Config\Database::connect();
        
        $date = $this->request->getVar('date');
        $query = $model->select('teacher_attendances.*, teachers.full_name as teacher_name')
                       ->join('teachers', 'teachers.id = teacher_attendances.teacher_id', 'left');
                       
        if ($date) {
            $query->where('teacher_attendances.date', $date);
        }
        
        $reports = $query->orderBy('teacher_attendances.date', 'DESC')
                         ->orderBy('teacher_attendances.check_in_time', 'ASC')
                         ->findAll();
                         
        return $this->respondSuccess($reports);
    }

    /**
     * GET /api/v1/admin/reports/student-attendance
     */
    public function getStudentAttendanceReport(): ResponseInterface
    {
        $model = new StudentAttendanceModel();
        
        $date = $this->request->getVar('date') ?: date('Y-m-d');
        $classId = $this->request->getVar('class_id');
        
        $query = $model->select('student_attendances.*, students.full_name as student_name, classes.name as class_name')
                       ->join('students', 'students.id = student_attendances.student_id', 'left')
                       ->join('classes', 'classes.id = student_attendances.class_id', 'left')
                       ->where('student_attendances.date', $date);
                       
        if ($classId) {
            $query->where('student_attendances.class_id', $classId);
        }
        
        $reports = $query->orderBy('classes.name', 'ASC')
                         ->orderBy('students.full_name', 'ASC')
                         ->findAll();
                         
        return $this->respondSuccess($reports);
    }

    /**
     * GET /api/v1/admin/reports/class-journals
     */
    public function getClassJournalsReport(): ResponseInterface
    {
        $model = new ClassJournalModel();
        
        $date = $this->request->getVar('date');
        $classId = $this->request->getVar('class_id');
        
        $query = $model->select('class_journals.*, classes.name as class_name, teachers.full_name as teacher_name')
                       ->join('classes', 'classes.id = class_journals.class_id', 'left')
                       ->join('teachers', 'teachers.id = class_journals.teacher_id', 'left');
                       
        if ($date) {
            $query->where('class_journals.date', $date);
        }
        if ($classId) {
            $query->where('class_journals.class_id', $classId);
        }
        
        $reports = $query->orderBy('class_journals.date', 'DESC')
                         ->findAll();
                         
        return $this->respondSuccess($reports);
    }
}
