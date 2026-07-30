<?php

namespace App\Controllers\Admin;

use App\Controllers\BaseResourceController;
use App\Models\SchoolLetterModel;
use App\Models\StudentModel;
use CodeIgniter\HTTP\ResponseInterface;

class SchoolLetterController extends BaseResourceController
{
    public function index(): ResponseInterface
    {
        return $this->respondSuccess(
            (new SchoolLetterModel())->orderBy('issued_at', 'DESC')->findAll(100)
        );
    }

    public function create(): ResponseInterface
    {
        $data = $this->getRequestBody();
        $schoolId = defined('CURRENT_SCHOOL_ID') ? (int) CURRENT_SCHOOL_ID : null;
        $studentId = (int) ($data['student_id'] ?? 0);
        $type = $data['letter_type'] ?? '';

        if (!$schoolId || !$studentId || !in_array($type, ['aktif_belajar', 'mutasi'], true)) {
            return $this->respondError('Data surat tidak valid.', ResponseInterface::HTTP_BAD_REQUEST);
        }
        if (!(new StudentModel())->where('school_id', $schoolId)->find($studentId)) {
            return $this->respondError('Siswa tidak ditemukan pada sekolah ini.', ResponseInterface::HTTP_NOT_FOUND);
        }

        $letterNumber = trim((string) ($data['letter_number'] ?? ''));
        if ($letterNumber === '') {
            return $this->respondError('Nomor surat wajib diisi.', ResponseInterface::HTTP_BAD_REQUEST);
        }

        $model = new SchoolLetterModel();
        $existing = $model->where('school_id', $schoolId)->where('letter_number', $letterNumber)->first();
        if ($existing) {
            if ((int) $existing->student_id === $studentId && $existing->letter_type === $type) {
                return $this->respondSuccess($existing, 'Surat sudah tercatat.');
            }
            return $this->respondError('Nomor surat sudah digunakan.', ResponseInterface::HTTP_CONFLICT);
        }

        $id = $model->insert([
            'school_id' => $schoolId,
            'student_id' => $studentId,
            'created_by' => $this->request->user->id ?? null,
            'letter_type' => $type,
            'letter_number' => $letterNumber,
            'academic_year' => trim((string) ($data['academic_year'] ?? '')),
            'payload' => json_encode($data['payload'] ?? [], JSON_UNESCAPED_UNICODE),
            'issued_at' => date('Y-m-d H:i:s'),
        ]);

        return $this->respondSuccess($model->find($id), 'Surat tercatat.', ResponseInterface::HTTP_CREATED);
    }
}
