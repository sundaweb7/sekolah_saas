<?php

namespace App\Controllers\Admin;

use App\Controllers\BaseResourceController;
use App\Models\StudentModel;
use App\Libraries\UploadService;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Cell\DataType;
use CodeIgniter\HTTP\ResponseInterface;
use Exception;

class StudentController extends BaseResourceController
{
    protected StudentModel $studentModel;
    protected UploadService $uploadService;

    public function __construct()
    {
        $this->studentModel = new StudentModel();
        $this->uploadService = new UploadService();
    }

    /**
     * GET /api/v1/admin/students
     */
    public function index(): ResponseInterface
    {
        $params = $this->getRequestParams();
        
        $builder = $this->studentModel;

        // Apply Search
        if (!empty($params['search']) && isset($params['search']['q']) && $params['search']['q'] !== '') {
            $q = $params['search']['q'];
            $builder->groupStart()
                    ->like('full_name', $q)
                    ->orLike('registration_number', $q)
                    ->groupEnd();
        }

        // Filter by Status
        $status = $this->request->getVar('status') ?: 'aktif';
        if ($status !== 'all') {
            $builder->where('status', $status);
        }

        // Apply Sorting
        if (!empty($params['sortBy'])) {
            foreach ($params['sortBy'] as $field => $direction) {
                $builder->orderBy($field, $direction);
            }
        } else {
            $builder->orderBy('id', 'DESC');
        }

        $students = $builder->paginate($params['perPage'], 'default', $params['page']);
        
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

        return $this->respondPaginated($students, $builder->pager->getDetails());
    }

    /**
     * GET /api/v1/admin/students/stats
     */
    public function stats(): ResponseInterface
    {
        $schoolId = defined('CURRENT_SCHOOL_ID') ? CURRENT_SCHOOL_ID : null;
        if (!$schoolId) {
            return $this->respondError('School context required', ResponseInterface::HTTP_BAD_REQUEST);
        }

        $totalActive = $this->studentModel->where('school_id', $schoolId)->where('status', 'aktif')->countAllResults();
        $totalMale = $this->studentModel->where('school_id', $schoolId)->where('status', 'aktif')->where('gender', 'L')->countAllResults();
        $totalFemale = $this->studentModel->where('school_id', $schoolId)->where('status', 'aktif')->where('gender', 'P')->countAllResults();
        $totalMutation = $this->studentModel->where('school_id', $schoolId)->where('status', 'mutasi')->countAllResults();

        return $this->respondSuccess([
            'total_active' => $totalActive,
            'total_male' => $totalMale,
            'total_female' => $totalFemale,
            'total_mutation' => $totalMutation
        ]);
    }

    /**
     * GET /api/v1/admin/students/show/{id}
     */
    public function show($id = null): ResponseInterface
    {
        $student = $this->studentModel->find($id);
        if (!$student) {
            return $this->respondError('Student not found', ResponseInterface::HTTP_NOT_FOUND);
        }

        if (!empty($student->parent_user_id)) {
            $userModel = new \App\Models\UserModel();
            $parent = $userModel->find($student->parent_user_id);
            if ($parent) {
                $student->parent_email = $parent->email;
                $student->parent_name = $parent->full_name;
                $student->parent_phone = $parent->phone;
            }
        }

        return $this->respondSuccess($student);
    }

    /**
     * POST /api/v1/admin/students
     */
    public function create(): ResponseInterface
    {
        if (!$this->hasStudentCapacity(1)) {
            return $this->respondError('Kuota siswa paket telah tercapai.', ResponseInterface::HTTP_FORBIDDEN);
        }
        $data = $this->request->getPost();
        
        // Handle Photo Upload
        $file = $this->request->getFile('photo_file');
        if ($file && $file->isValid()) {
            try {
                $path = $this->uploadService->uploadImage($file, 'uploads/students');
                $data['photo'] = $path;
            } catch (Exception $e) {
                return $this->respondError($e->getMessage(), ResponseInterface::HTTP_BAD_REQUEST);
            }
        }

        // Add creator tracking
        $userPayload = $this->request->user ?? null;
        if ($userPayload) {
            $data['created_by'] = $userPayload->id;
        }

        // Auto Create Parent Account
        $parentEmail = $this->request->getPost('parent_email');
        if (!empty($parentEmail)) {
            $userModel = new \App\Models\UserModel();
            $existingUser = $userModel->where('email', $parentEmail)->first();
            if ($existingUser) {
                $data['parent_user_id'] = $existingUser->id;
            } else {
                $parentName = $this->request->getPost('parent_name') ?: 'Wali dari ' . $data['full_name'];
                $parentPassword = $this->request->getPost('parent_password');
                if (!$parentPassword || strlen($parentPassword) < 8) {
                    return $this->respondError('Password wali minimal 8 karakter.', ResponseInterface::HTTP_BAD_REQUEST);
                }
                $parentPhone = $this->request->getPost('parent_phone') ?: '';
                
                $newUserId = $userModel->insert([
                    'school_id' => defined('CURRENT_SCHOOL_ID') ? CURRENT_SCHOOL_ID : null,
                    'email' => $parentEmail,
                    'password_hash' => $parentPassword,
                    'role' => 'parent',
                    'full_name' => $parentName,
                    'phone' => $parentPhone,
                    'status' => 'active'
                ]);
                
                if ($newUserId) {
                    $data['parent_user_id'] = $newUserId;
                } else {
                    return $this->respondError('Gagal membuat akun login wali murid: ' . json_encode($userModel->errors()), ResponseInterface::HTTP_BAD_REQUEST);
                }
            }
        }

        if (!$this->studentModel->insert($data)) {
            return $this->respondError('Failed to create student', ResponseInterface::HTTP_BAD_REQUEST, $this->studentModel->errors());
        }

        $id = $this->studentModel->getInsertID();
        return $this->respondSuccess($this->studentModel->find($id), 'Student created successfully', ResponseInterface::HTTP_CREATED);
    }

    /**
     * POST /api/v1/admin/students/update/{id}
     */
    public function update($id = null): ResponseInterface
    {
        $student = $this->studentModel->find($id);
        if (!$student) {
            return $this->respondError('Student not found', ResponseInterface::HTTP_NOT_FOUND);
        }

        // Content-Type might be multipart/form-data for image uploads via POST with a PUT parameter
        $data = $this->request->getPost();

        // Handle Photo Upload
        $file = $this->request->getFile('photo_file');
        if ($file && $file->isValid()) {
            try {
                $path = $this->uploadService->uploadImage($file, 'uploads/students');
                $data['photo'] = $path;
                
                // Remove old photo
                if ($student->photo && file_exists(ROOTPATH . 'public/' . $student->photo)) {
                    unlink(ROOTPATH . 'public/' . $student->photo);
                }
            } catch (Exception $e) {
                return $this->respondError($e->getMessage(), ResponseInterface::HTTP_BAD_REQUEST);
            }
        }

        // Add updater tracking
        $userPayload = $this->request->user ?? null;
        if ($userPayload) {
            $data['updated_by'] = $userPayload->id;
        }

        // Auto Create/Update Parent Account
        $parentEmail = $this->request->getPost('parent_email');
        if (!empty($parentEmail)) {
            $userModel = new \App\Models\UserModel();
            $existingUser = $userModel->where('email', $parentEmail)->first();
            if ($existingUser) {
                $data['parent_user_id'] = $existingUser->id;
                // Optionally update parent name/phone if changed
                $updateData = [];
                if ($this->request->getPost('parent_name')) $updateData['full_name'] = $this->request->getPost('parent_name');
                if ($this->request->getPost('parent_phone')) $updateData['phone'] = $this->request->getPost('parent_phone');
                if ($this->request->getPost('parent_password')) {
                    if (strlen($this->request->getPost('parent_password')) < 8) {
                        return $this->respondError('Password wali minimal 8 karakter.', ResponseInterface::HTTP_BAD_REQUEST);
                    }
                    $updateData['password_hash'] = $this->request->getPost('parent_password');
                }
                
                if (!empty($updateData)) {
                    $userModel->update($existingUser->id, $updateData);
                }
            } else {
                $parentName = $this->request->getPost('parent_name') ?: 'Wali dari ' . ($data['full_name'] ?? $student->full_name);
                $parentPassword = $this->request->getPost('parent_password');
                if (!$parentPassword || strlen($parentPassword) < 8) {
                    return $this->respondError('Password wali minimal 8 karakter.', ResponseInterface::HTTP_BAD_REQUEST);
                }
                $parentPhone = $this->request->getPost('parent_phone') ?: '';
                
                $newUserId = $userModel->insert([
                    'school_id' => defined('CURRENT_SCHOOL_ID') ? CURRENT_SCHOOL_ID : null,
                    'email' => $parentEmail,
                    'password_hash' => $parentPassword,
                    'role' => 'parent',
                    'full_name' => $parentName,
                    'phone' => $parentPhone,
                    'status' => 'active'
                ]);
                
                if ($newUserId) {
                    $data['parent_user_id'] = $newUserId;
                } else {
                    return $this->respondError('Gagal membuat akun login wali murid: ' . json_encode($userModel->errors()), ResponseInterface::HTTP_BAD_REQUEST);
                }
            }
        }

        if (!$this->studentModel->update($id, $data)) {
            return $this->respondError('Failed to update student', ResponseInterface::HTTP_BAD_REQUEST, $this->studentModel->errors());
        }

        return $this->respondSuccess($this->studentModel->find($id), 'Student updated successfully');
    }

    /**
     * DELETE /api/v1/admin/students/delete/{id}
     */
    public function delete($id = null): ResponseInterface
    {
        $student = $this->studentModel->find($id);
        if (!$student) {
            return $this->respondError('Student not found', ResponseInterface::HTTP_NOT_FOUND);
        }

        $userPayload = $this->request->user ?? null;
        if ($userPayload) {
            $this->studentModel->update($id, ['deleted_by' => $userPayload->id]);
        }

        $this->studentModel->delete($id);
        return $this->respondSuccess(null, 'Student deleted successfully');
    }

    /**
     * GET /api/v1/admin/students/export
     */
    public function export(): ResponseInterface
    {
        $students = $this->studentModel->findAll();

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        
        // Headers
        $sheet->setCellValue('A1', 'NISN');
        $sheet->setCellValue('B1', 'Nama Lengkap');
        $sheet->setCellValue('C1', 'Tanggal Lahir');
        $sheet->setCellValue('D1', 'Jenis Kelamin');

        $row = 2;
        foreach ($students as $student) {
            $sheet->setCellValueExplicit('A' . $row, (string) $student->registration_number, DataType::TYPE_STRING);
            $sheet->setCellValueExplicit('B' . $row, (string) $student->full_name, DataType::TYPE_STRING);
            $sheet->setCellValue('C' . $row, $student->birth_date);
            $sheet->setCellValue('D' . $row, $student->gender);
            $row++;
        }

        $writer = new Xlsx($spreadsheet);
        
        ob_start();
        $writer->save('php://output');
        $excelData = ob_get_clean();

        return $this->response
            ->setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            ->setHeader('Content-Disposition', 'attachment; filename="data_siswa.xlsx"')
            ->setHeader('Cache-Control', 'max-age=0')
            ->setBody($excelData);
    }

    /**
     * POST /api/v1/admin/students/import
     */
    public function import(): ResponseInterface
    {
        $file = $this->request->getFile('excel_file');
        
        if (!$file || !$file->isValid()) {
            return $this->respondError('Invalid file upload', ResponseInterface::HTTP_BAD_REQUEST);
        }
        if ($file->getSizeByUnit('kb') > 2048 || !in_array($file->getMimeType(), [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'text/csv',
            'text/plain',
        ], true)) {
            return $this->respondError('File harus XLSX/CSV dan maksimal 2 MB.', ResponseInterface::HTTP_BAD_REQUEST);
        }

        try {
            $spreadsheet = IOFactory::load($file->getTempName());
            $worksheet = $spreadsheet->getActiveSheet();
            $rows = $worksheet->toArray();
            if (count($rows) > 5001) {
                return $this->respondError('Import dibatasi maksimal 5.000 siswa.', ResponseInterface::HTTP_BAD_REQUEST);
            }
            $nonEmptyRows = count(array_filter(array_slice($rows, 1), static fn ($row) => !empty($row[1])));
            if (!$this->hasStudentCapacity($nonEmptyRows)) {
                return $this->respondError('Import melebihi kuota siswa paket.', ResponseInterface::HTTP_FORBIDDEN);
            }
            
            $inserted = 0;
            $userPayload = $this->request->user ?? null;
            
            $db = \Config\Database::connect();
            $db->transStart();

            // Loop starting from row 2 (skip header)
            for ($i = 1; $i < count($rows); $i++) {
                if (empty($rows[$i][1])) continue; // Skip if Name is empty

                $this->studentModel->insert([
                    'registration_number' => $rows[$i][0],
                    'full_name'           => $rows[$i][1],
                    'birth_date'          => $rows[$i][2] ? date('Y-m-d', strtotime($rows[$i][2])) : date('Y-m-d'),
                    'gender'              => strtoupper($rows[$i][3]) === 'L' ? 'L' : 'P',
                    'created_by'          => $userPayload ? $userPayload->id : null
                ]);
                $inserted++;
            }

            $db->transComplete();
            if ($db->transStatus() === false) {
                return $this->respondError('Import gagal dan tidak ada data yang disimpan.', ResponseInterface::HTTP_BAD_REQUEST);
            }

            return $this->respondSuccess(['imported_rows' => $inserted], 'Data imported successfully');
        } catch (Exception $e) {
            log_message('error', 'Student import failed: {message}', ['message' => $e->getMessage()]);
            return $this->respondError('File tidak dapat diproses.', ResponseInterface::HTTP_BAD_REQUEST);
        }
    }

    /**
     * POST /api/v1/admin/students/impersonate-parent/{id}
     * Generate an impersonation session for the parent (wali) user of a student.
     * Admin can log in as the parent without needing their password.
     */
    public function impersonateParent($id = null): ResponseInterface
    {
        if (!$id) {
            return $this->respondError('Student ID is required', ResponseInterface::HTTP_BAD_REQUEST);
        }

        $student = $this->studentModel->find($id);
        if (!$student) {
            return $this->respondError('Student not found', ResponseInterface::HTTP_NOT_FOUND);
        }

        if (!$student->parent_user_id) {
            return $this->respondError('Siswa ini belum memiliki akun wali yang terhubung.', ResponseInterface::HTTP_NOT_FOUND);
        }

        $userModel = new \App\Models\UserModel();
        $parentUser = $userModel->find($student->parent_user_id);

        if (!$parentUser || $parentUser->status !== 'active') {
            return $this->respondError('Akun wali siswa tidak aktif atau tidak ditemukan.', ResponseInterface::HTTP_NOT_FOUND);
        }

        return $this->respondSuccess([
            'code' => (new \App\Services\ImpersonationService())->createCode((int) $parentUser->school_id, (int) $parentUser->id),
            'student' => [
                'id'        => $student->id,
                'full_name' => $student->full_name,
            ],
        ], 'Single-use parent impersonation code generated');
    }

    private function hasStudentCapacity(int $additional): bool
    {
        $schoolId = defined('CURRENT_SCHOOL_ID') ? (int) CURRENT_SCHOOL_ID : 0;
        if (!$schoolId) return false;
        $limit = (new \App\Services\PlanService())->studentLimit($schoolId);
        $current = (new StudentModel())->where('status', 'aktif')->countAllResults();
        return $current + $additional <= $limit;
    }
}
