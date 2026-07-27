<?php

namespace App\Controllers\Admin;

use App\Controllers\BaseResourceController;
use App\Models\SppInvoiceModel;
use App\Models\StudentModel;
use App\Models\ClassModel;
use CodeIgniter\HTTP\ResponseInterface;

class SppAdminController extends BaseResourceController
{
    protected SppInvoiceModel $sppInvoiceModel;
    protected StudentModel $studentModel;

    public function __construct()
    {
        $this->sppInvoiceModel = new SppInvoiceModel();
        $this->studentModel = new StudentModel();
    }

    /**
     * GET /api/v1/admin/spp
     */
    public function index(): ResponseInterface
    {
        $schoolId = defined('CURRENT_SCHOOL_ID') ? CURRENT_SCHOOL_ID : null;
        
        // Fetch all SPP invoices for this school
        $db = \Config\Database::connect();
        $builder = $db->table('spp_invoices')
            ->select('spp_invoices.*, students.full_name as student_name, students.registration_number, classes.name as class_name')
            ->join('students', 'students.id = spp_invoices.student_id')
            ->join('classes', 'classes.id = students.current_class_id', 'left')
            ->where('spp_invoices.school_id', $schoolId)
            ->orderBy('spp_invoices.month', 'DESC')
            ->orderBy('students.full_name', 'ASC');

        $invoices = $builder->get()->getResult();

        return $this->respondSuccess($invoices);
    }

    /**
     * POST /api/v1/admin/spp/generate
     * Generate SPP invoices for all active students for a given month
     */
    public function generate(): ResponseInterface
    {
        $schoolId = defined('CURRENT_SCHOOL_ID') ? CURRENT_SCHOOL_ID : null;
        $data = $this->request->getJSON(true) ?? $this->request->getPost() ?? [];

        $paymentType = $data['payment_type'] ?? 'monthly';
        $amount = $data['amount'] ?? null;
        $description = $data['description'] ?? null;
        $month = $data['month'] ?? null; // only required for monthly

        if (empty($paymentType) || empty($amount)) {
            return $this->respondError('Jenis pembayaran dan nominal wajib diisi.', ResponseInterface::HTTP_BAD_REQUEST);
        }

        if ($paymentType === 'monthly') {
            if (empty($month)) {
                return $this->respondError('Bulan wajib dipilih untuk pembayaran bulanan.', ResponseInterface::HTTP_BAD_REQUEST);
            }
            if (empty($description)) {
                $description = 'SPP Bulan ' . $month;
            }
        } else {
            // For annual or one_time, use current YYYY-MM as placeholder for the month field
            $month = date('Y-m');
            if (empty($description)) {
                $description = ($paymentType === 'annual' ? 'Tagihan Tahunan' : 'Tagihan Satu Kali');
            }
        }

        // Get all active students for this school
        $students = $this->studentModel->where('school_id', $schoolId)->findAll();
        if (empty($students)) {
            return $this->respondError('Tidak ada data siswa aktif untuk dibuatkan tagihan.', ResponseInterface::HTTP_BAD_REQUEST);
        }

        $generatedCount = 0;
        $skippedCount = 0;

        foreach ($students as $student) {
            // For monthly, check if this month already exists
            // For annual or one_time, check if this specific description already exists for this student
            if ($paymentType === 'monthly') {
                $exists = $this->sppInvoiceModel
                    ->where('student_id', $student->id)
                    ->where('payment_type', 'monthly')
                    ->where('month', $month)
                    ->first();
            } else {
                $exists = $this->sppInvoiceModel
                    ->where('student_id', $student->id)
                    ->where('payment_type', $paymentType)
                    ->where('description', $description)
                    ->first();
            }

            if ($exists) {
                $skippedCount++;
                continue;
            }

            $this->sppInvoiceModel->insert([
                'school_id'    => $schoolId,
                'student_id'   => $student->id,
                'month'        => $month,
                'amount'       => $amount,
                'status'       => 'unpaid',
                'payment_type' => $paymentType,
                'description'  => $description
            ]);
            $generatedCount++;
        }

        return $this->respondSuccess([
            'generated' => $generatedCount,
            'skipped'   => $skippedCount
        ], "Berhasil membuat $generatedCount tagihan baru. ($skippedCount dilewati karena sudah ada)");
    }

    /**
     * POST /api/v1/admin/spp/confirm/{id}
     * Manually mark invoice as paid
     */
    public function confirmPayment($id = null): ResponseInterface
    {
        $invoice = $this->sppInvoiceModel->find($id);
        if (!$invoice) {
            return $this->respondError('Tagihan tidak ditemukan.', ResponseInterface::HTTP_NOT_FOUND);
        }

        $this->sppInvoiceModel->update($invoice->id, [
            'status'         => 'paid',
            'payment_method' => 'Tunai / Manual Admin',
            'paid_at'        => date('Y-m-d H:i:s')
        ]);

        return $this->respondSuccess($this->sppInvoiceModel->find($invoice->id), 'Pembayaran SPP berhasil dikonfirmasi secara manual.');
    }

    /**
     * DELETE /api/v1/admin/spp/delete/{id}
     */
    public function delete($id = null): ResponseInterface
    {
        if (!$this->sppInvoiceModel->find($id)) {
            return $this->respondError('Tagihan tidak ditemukan.', ResponseInterface::HTTP_NOT_FOUND);
        }

        $this->sppInvoiceModel->delete($id);
        return $this->respondSuccess(null, 'Tagihan SPP berhasil dihapus.');
    }
}
