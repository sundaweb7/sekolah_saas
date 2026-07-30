<?php

namespace App\Controllers\Admin;

use App\Controllers\BaseResourceController;
use App\Models\ExtracurricularModel;
use App\Models\ExtracurricularMemberModel;
use App\Models\ExtracurricularPaymentModel;
use App\Models\ExtracurricularPresenceModel;
use App\Models\StudentModel;
use CodeIgniter\HTTP\ResponseInterface;
use Exception;

class ExtracurricularController extends BaseResourceController
{
    protected $model;
    protected ExtracurricularMemberModel $memberModel;
    protected ExtracurricularPaymentModel $paymentModel;
    protected ExtracurricularPresenceModel $presenceModel;
    protected StudentModel $studentModel;

    public function __construct()
    {
        $this->model = new ExtracurricularModel();
        $this->memberModel = new ExtracurricularMemberModel();
        $this->paymentModel = new ExtracurricularPaymentModel();
        $this->presenceModel = new ExtracurricularPresenceModel();
        $this->studentModel = new StudentModel();
    }

    /**
     * GET /api/v1/admin/extracurriculars
     */
    public function index(): ResponseInterface
    {
        $schoolId = defined('CURRENT_SCHOOL_ID') ? CURRENT_SCHOOL_ID : null;
        if (!$schoolId) {
            return $this->respondError('School context required', ResponseInterface::HTTP_BAD_REQUEST);
        }

        $data = $this->model->where('school_id', $schoolId)->findAll();
        return $this->respondSuccess($data);
    }

    /**
     * POST /api/v1/admin/extracurriculars
     */
    public function create(): ResponseInterface
    {
        $schoolId = defined('CURRENT_SCHOOL_ID') ? CURRENT_SCHOOL_ID : null;
        if (!$schoolId) {
            return $this->respondError('School context required', ResponseInterface::HTTP_BAD_REQUEST);
        }

        $data = $this->request->getJSON(true) ?: $this->request->getPost();
        $data['school_id'] = $schoolId;

        try {
            $id = $this->model->insert($data);
            if ($id) {
                return $this->respondSuccess(['id' => $id], 'Ekskul berhasil dibuat.');
            }
            return $this->respondError('Gagal membuat Ekskul.');
        } catch (Exception $e) {
            return $this->respondError($e->getMessage());
        }
    }

    /**
     * POST /api/v1/admin/extracurriculars/update/{id}
     */
    public function update($id = null): ResponseInterface
    {
        $schoolId = defined('CURRENT_SCHOOL_ID') ? CURRENT_SCHOOL_ID : null;
        if (!$schoolId) {
            return $this->respondError('School context required', ResponseInterface::HTTP_BAD_REQUEST);
        }

        $ekskul = $this->model->where('school_id', $schoolId)->find($id);
        if (!$ekskul) {
            return $this->respondError('Ekskul tidak ditemukan.', ResponseInterface::HTTP_NOT_FOUND);
        }

        $data = $this->request->getJSON(true) ?: $this->request->getPost();

        try {
            if ($this->model->update($id, $data)) {
                return $this->respondSuccess(null, 'Ekskul berhasil diperbarui.');
            }
            return $this->respondError('Gagal memperbarui ekskul.');
        } catch (Exception $e) {
            return $this->respondError($e->getMessage());
        }
    }

    /**
     * DELETE /api/v1/admin/extracurriculars/{id}
     */
    public function delete($id = null): ResponseInterface
    {
        $schoolId = defined('CURRENT_SCHOOL_ID') ? CURRENT_SCHOOL_ID : null;
        if (!$schoolId) {
            return $this->respondError('School context required', ResponseInterface::HTTP_BAD_REQUEST);
        }

        $ekskul = $this->model->where('school_id', $schoolId)->find($id);
        if (!$ekskul) {
            return $this->respondError('Ekskul tidak ditemukan.', ResponseInterface::HTTP_NOT_FOUND);
        }

        try {
            $this->model->delete($id);
            return $this->respondSuccess(null, 'Ekskul berhasil dihapus.');
        } catch (Exception $e) {
            return $this->respondError($e->getMessage());
        }
    }

    /**
     * GET /api/v1/admin/extracurriculars/members
     */
    public function listMembers(): ResponseInterface
    {
        $schoolId = defined('CURRENT_SCHOOL_ID') ? CURRENT_SCHOOL_ID : null;
        if (!$schoolId) {
            return $this->respondError('School context required', ResponseInterface::HTTP_BAD_REQUEST);
        }

        $extracurricularId = $this->request->getVar('extracurricular_id');

        $builder = $this->memberModel
            ->select('extracurricular_members.*, extracurriculars.name as extracurricular_name, students.full_name as student_name, students.gender as student_gender, students.registration_number')
            ->join('extracurriculars', 'extracurricular_members.extracurricular_id = extracurriculars.id')
            ->join('students', 'extracurricular_members.student_id = students.id')
            ->where('extracurricular_members.school_id', $schoolId);

        if (!empty($extracurricularId)) {
            $builder->where('extracurricular_members.extracurricular_id', $extracurricularId);
        }

        $members = $builder->findAll();
        return $this->respondSuccess($members);
    }

    /**
     * POST /api/v1/admin/extracurriculars/members/enroll
     */
    public function enroll(): ResponseInterface
    {
        $schoolId = defined('CURRENT_SCHOOL_ID') ? CURRENT_SCHOOL_ID : null;
        if (!$schoolId) {
            return $this->respondError('School context required', ResponseInterface::HTTP_BAD_REQUEST);
        }

        $data = $this->request->getJSON(true) ?: $this->request->getPost();
        $studentId = $data['student_id'] ?? null;
        $extracurricularId = $data['extracurricular_id'] ?? null;

        if (!$studentId || !$extracurricularId) {
            return $this->respondError('Siswa dan Ekskul harus diisi.', ResponseInterface::HTTP_BAD_REQUEST);
        }

        // Check if already enrolled
        $existing = $this->memberModel
            ->where('school_id', $schoolId)
            ->where('extracurricular_id', $extracurricularId)
            ->where('student_id', $studentId)
            ->first();

        if ($existing) {
            return $this->respondError('Siswa ini sudah terdaftar di ekskul tersebut.');
        }

        $insertData = [
            'school_id' => $schoolId,
            'extracurricular_id' => $extracurricularId,
            'student_id' => $studentId,
            'status' => 'pending' // Default pending
        ];

        try {
            $id = $this->memberModel->insert($insertData);
            return $this->respondSuccess(['id' => $id], 'Pendaftaran siswa berhasil diajukan.');
        } catch (Exception $e) {
            return $this->respondError($e->getMessage());
        }
    }

    /**
     * POST /api/v1/admin/extracurriculars/members/approve
     */
    public function approveMember(): ResponseInterface
    {
        $schoolId = defined('CURRENT_SCHOOL_ID') ? CURRENT_SCHOOL_ID : null;
        if (!$schoolId) {
            return $this->respondError('School context required', ResponseInterface::HTTP_BAD_REQUEST);
        }

        $data = $this->request->getJSON(true) ?: $this->request->getPost();
        $id = $data['id'] ?? null;
        $status = $data['status'] ?? 'approved'; // approved or rejected

        $member = $this->memberModel->where('school_id', $schoolId)->find($id);
        if (!$member) {
            return $this->respondError('Pendaftaran tidak ditemukan.', ResponseInterface::HTTP_NOT_FOUND);
        }

        try {
            $this->memberModel->update($id, ['status' => $status]);

            // If approved, generate billing if there are fees
            if ($status === 'approved') {
                $ekskul = $this->model->find($member->extracurricular_id);
                if ($ekskul) {
                    // 1. Fee Registration Bill
                    if ($ekskul->fee_registration > 0) {
                        $this->paymentModel->insert([
                            'school_id' => $schoolId,
                            'member_id' => $id,
                            'fee_type' => 'registration',
                            'month_period' => null,
                            'amount' => $ekskul->fee_registration,
                            'status' => 'unpaid'
                        ]);
                    }
                    // 2. Initial Monthly Bill (Current Month)
                    if ($ekskul->fee_monthly > 0) {
                        $currentPeriod = date('F Y');
                        $this->paymentModel->insert([
                            'school_id' => $schoolId,
                            'member_id' => $id,
                            'fee_type' => 'monthly',
                            'month_period' => $currentPeriod,
                            'amount' => $ekskul->fee_monthly,
                            'status' => 'unpaid'
                        ]);
                    }
                }
            }

            return $this->respondSuccess(null, 'Status pendaftaran berhasil diperbarui.');
        } catch (Exception $e) {
            return $this->respondError($e->getMessage());
        }
    }

    /**
     * POST /api/v1/admin/extracurriculars/members/grade
     */
    public function updateGrade(): ResponseInterface
    {
        $schoolId = defined('CURRENT_SCHOOL_ID') ? CURRENT_SCHOOL_ID : null;
        if (!$schoolId) {
            return $this->respondError('School context required', ResponseInterface::HTTP_BAD_REQUEST);
        }

        $data = $this->request->getJSON(true) ?: $this->request->getPost();
        $id = $data['id'] ?? null;
        $grade = $data['grade'] ?? '';
        $gradeDescription = $data['grade_description'] ?? '';

        $member = $this->memberModel->where('school_id', $schoolId)->find($id);
        if (!$member) {
            return $this->respondError('Anggota ekskul tidak ditemukan.', ResponseInterface::HTTP_NOT_FOUND);
        }

        try {
            $this->memberModel->update($id, [
                'grade' => $grade,
                'grade_description' => $gradeDescription
            ]);
            return $this->respondSuccess(null, 'Penilaian ekskul berhasil diperbarui.');
        } catch (Exception $e) {
            return $this->respondError($e->getMessage());
        }
    }

    /**
     * GET /api/v1/admin/extracurriculars/payments
     */
    public function listPayments(): ResponseInterface
    {
        $schoolId = defined('CURRENT_SCHOOL_ID') ? CURRENT_SCHOOL_ID : null;
        if (!$schoolId) {
            return $this->respondError('School context required', ResponseInterface::HTTP_BAD_REQUEST);
        }

        $payments = $this->paymentModel
            ->select('extracurricular_payments.*, extracurriculars.name as extracurricular_name, students.full_name as student_name, students.registration_number')
            ->join('extracurricular_members', 'extracurricular_payments.member_id = extracurricular_members.id')
            ->join('extracurriculars', 'extracurricular_members.extracurricular_id = extracurriculars.id')
            ->join('students', 'extracurricular_members.student_id = students.id')
            ->where('extracurricular_payments.school_id', $schoolId)
            ->orderBy('extracurricular_payments.id', 'DESC')
            ->findAll();

        return $this->respondSuccess($payments);
    }

    /**
     * POST /api/v1/admin/extracurriculars/payments/pay
     */
    public function processPayment(): ResponseInterface
    {
        $schoolId = defined('CURRENT_SCHOOL_ID') ? CURRENT_SCHOOL_ID : null;
        if (!$schoolId) {
            return $this->respondError('School context required', ResponseInterface::HTTP_BAD_REQUEST);
        }

        $data = $this->request->getJSON(true) ?: $this->request->getPost();
        $id = $data['id'] ?? null;

        $payment = $this->paymentModel->where('school_id', $schoolId)->find($id);
        if (!$payment) {
            return $this->respondError('Tagihan tidak ditemukan.', ResponseInterface::HTTP_NOT_FOUND);
        }

        try {
            $this->paymentModel->update($id, [
                'status' => 'paid',
                'payment_date' => date('Y-m-d H:i:s')
            ]);
            return $this->respondSuccess(null, 'Pembayaran berhasil dikonfirmasi lunas.');
        } catch (Exception $e) {
            return $this->respondError($e->getMessage());
        }
    }

    /**
     * GET /api/v1/admin/extracurriculars/presences
     */
    public function listPresences(): ResponseInterface
    {
        $schoolId = defined('CURRENT_SCHOOL_ID') ? CURRENT_SCHOOL_ID : null;
        if (!$schoolId) {
            return $this->respondError('School context required', ResponseInterface::HTTP_BAD_REQUEST);
        }

        $extracurricularId = $this->request->getVar('extracurricular_id');
        $date = $this->request->getVar('presence_date') ?: date('Y-m-d');

        if (!$extracurricularId) {
            return $this->respondError('ID Ekskul harus ditentukan.', ResponseInterface::HTTP_BAD_REQUEST);
        }

        // Fetch approved members of this extracurricular
        $members = $this->memberModel
            ->select('extracurricular_members.id as member_id, students.full_name as student_name, students.registration_number')
            ->join('students', 'extracurricular_members.student_id = students.id')
            ->where('extracurricular_members.school_id', $schoolId)
            ->where('extracurricular_members.extracurricular_id', $extracurricularId)
            ->where('extracurricular_members.status', 'approved')
            ->findAll();

        // Fetch recorded presences for this date
        $recorded = $this->presenceModel
            ->where('school_id', $schoolId)
            ->where('extracurricular_id', $extracurricularId)
            ->where('presence_date', $date)
            ->findAll();

        // Map presence status
        $presenceMap = [];
        foreach ($recorded as $p) {
            $presenceMap[$p->member_id] = $p->status;
        }

        $result = [];
        foreach ($members as $m) {
            $result[] = [
                'member_id' => $m->member_id,
                'student_name' => $m->student_name,
                'registration_number' => $m->registration_number,
                'status' => $presenceMap[$m->member_id] ?? 'present' // default to present if not marked
            ];
        }

        return $this->respondSuccess($result);
    }

    /**
     * POST /api/v1/admin/extracurriculars/presences/save
     */
    public function savePresence(): ResponseInterface
    {
        $schoolId = defined('CURRENT_SCHOOL_ID') ? CURRENT_SCHOOL_ID : null;
        if (!$schoolId) {
            return $this->respondError('School context required', ResponseInterface::HTTP_BAD_REQUEST);
        }

        $data = $this->request->getJSON(true) ?: $this->request->getPost();
        $extracurricularId = $data['extracurricular_id'] ?? null;
        $date = $data['presence_date'] ?? date('Y-m-d');
        $presencesList = $data['presences'] ?? []; // Array of ['member_id' => X, 'status' => Y]

        if (!$extracurricularId) {
            return $this->respondError('ID Ekskul harus ditentukan.', ResponseInterface::HTTP_BAD_REQUEST);
        }

        try {
            foreach ($presencesList as $p) {
                $memberId = $p['member_id'];
                $status = $p['status'];

                // Check existing
                $existing = $this->presenceModel
                    ->where('school_id', $schoolId)
                    ->where('extracurricular_id', $extracurricularId)
                    ->where('member_id', $memberId)
                    ->where('presence_date', $date)
                    ->first();

                if ($existing) {
                    $this->presenceModel->update($existing->id, ['status' => $status]);
                } else {
                    $this->presenceModel->insert([
                        'school_id' => $schoolId,
                        'extracurricular_id' => $extracurricularId,
                        'member_id' => $memberId,
                        'presence_date' => $date,
                        'status' => $status
                    ]);
                }
            }

            return $this->respondSuccess(null, 'Presensi ekskul berhasil disimpan.');
        } catch (Exception $e) {
            return $this->respondError($e->getMessage());
        }
    }
}
