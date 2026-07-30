<?php

namespace App\Controllers\Admin;

use App\Controllers\BaseResourceController;
use App\Models\KbmScheduleModel;
use App\Models\ClassModel;
use App\Models\TeacherModel;
use CodeIgniter\HTTP\ResponseInterface;
use Exception;

class KbmScheduleController extends BaseResourceController
{
    protected $model; // KbmScheduleModel
    protected ClassModel $classModel;
    protected TeacherModel $teacherModel;

    public function __construct()
    {
        $this->model = new KbmScheduleModel();
        $this->classModel = new ClassModel();
        $this->teacherModel = new TeacherModel();
    }

    /**
     * GET /api/v1/admin/kbm-schedules
     */
    public function index(): ResponseInterface
    {
        $db = \Config\Database::connect();
        
        $schedules = $db->table('kbm_schedules')
            ->select('kbm_schedules.*, classes.name as class_name, teachers.full_name as teacher_name')
            ->join('classes', 'classes.id = kbm_schedules.class_id')
            ->join('teachers', 'teachers.id = kbm_schedules.teacher_id')
            ->where('kbm_schedules.school_id', defined('CURRENT_SCHOOL_ID') ? CURRENT_SCHOOL_ID : 0)
            ->where('kbm_schedules.deleted_at', null)
            ->orderBy('kbm_schedules.class_id', 'ASC')
            ->orderBy('FIELD(kbm_schedules.day_name, "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu")', '', false)
            ->orderBy('kbm_schedules.start_time', 'ASC')
            ->get()
            ->getResult();

        return $this->respondSuccess($schedules);
    }

    /**
     * POST /api/v1/admin/kbm-schedules
     */
    public function create(): ResponseInterface
    {
        $schoolId = defined('CURRENT_SCHOOL_ID') ? CURRENT_SCHOOL_ID : null;
        $data = $this->request->getJSON(true) ?: $this->request->getPost();
        $data['school_id'] = $schoolId;
        if (!$this->classModel->find($data['class_id'] ?? null)
            || (!empty($data['teacher_id']) && !$this->teacherModel->find($data['teacher_id']))) {
            return $this->respondError('Kelas atau guru tidak ditemukan pada sekolah ini.', ResponseInterface::HTTP_BAD_REQUEST);
        }

        try {
            $id = $this->model->insert($data);
            if (!$id) {
                return $this->respondError('Gagal menyimpan jadwal KBM.', ResponseInterface::HTTP_BAD_REQUEST);
            }
            return $this->respondSuccess(['id' => $id], 'Jadwal KBM berhasil disimpan.');
        } catch (Exception $e) {
            log_message('error', 'KBM schedule create failed: {message}', ['message' => $e->getMessage()]);
            return $this->respondError('Gagal menyimpan jadwal KBM.', ResponseInterface::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * POST /api/v1/admin/kbm-schedules/update/:id
     */
    public function update($id = null): ResponseInterface
    {
        $schedule = $this->model->find($id);
        if (!$schedule) {
            return $this->respondError('Jadwal KBM tidak ditemukan.', ResponseInterface::HTTP_NOT_FOUND);
        }

        $data = $this->request->getJSON(true) ?: $this->request->getPost();
        if (isset($data['class_id']) && !$this->classModel->find($data['class_id'])) {
            return $this->respondError('Kelas tidak ditemukan pada sekolah ini.', ResponseInterface::HTTP_BAD_REQUEST);
        }
        if (!empty($data['teacher_id']) && !$this->teacherModel->find($data['teacher_id'])) {
            return $this->respondError('Guru tidak ditemukan pada sekolah ini.', ResponseInterface::HTTP_BAD_REQUEST);
        }

        try {
            $this->model->update($id, $data);
            return $this->respondSuccess(null, 'Jadwal KBM berhasil diperbarui.');
        } catch (Exception $e) {
            log_message('error', 'KBM schedule update failed: {message}', ['message' => $e->getMessage()]);
            return $this->respondError('Gagal memperbarui jadwal KBM.', ResponseInterface::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * DELETE /api/v1/admin/kbm-schedules/delete/:id
     */
    public function delete($id = null): ResponseInterface
    {
        $schedule = $this->model->find($id);
        if (!$schedule) {
            return $this->respondError('Jadwal KBM tidak ditemukan.', ResponseInterface::HTTP_NOT_FOUND);
        }

        try {
            $this->model->delete($id);
            return $this->respondSuccess(null, 'Jadwal KBM berhasil dihapus.');
        } catch (Exception $e) {
            log_message('error', 'KBM schedule delete failed: {message}', ['message' => $e->getMessage()]);
            return $this->respondError('Gagal menghapus jadwal KBM.', ResponseInterface::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * GET /api/v1/admin/kbm-schedules/class/:classId/day/:dayName
     */
    public function getByClassAndDay($classId = null, $dayName = null): ResponseInterface
    {
        $db = \Config\Database::connect();
        
        $schedules = $db->table('kbm_schedules')
            ->select('kbm_schedules.*, teachers.full_name as teacher_name')
            ->join('teachers', 'teachers.id = kbm_schedules.teacher_id')
            ->where('kbm_schedules.class_id', $classId)
            ->where('kbm_schedules.day_name', urldecode($dayName))
            ->where('kbm_schedules.school_id', defined('CURRENT_SCHOOL_ID') ? CURRENT_SCHOOL_ID : 0)
            ->where('kbm_schedules.deleted_at', null)
            ->orderBy('kbm_schedules.start_time', 'ASC')
            ->get()
            ->getResult();

        return $this->respondSuccess($schedules);
    }
}
