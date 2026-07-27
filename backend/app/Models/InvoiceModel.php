<?php

namespace App\Models;

class InvoiceModel extends BaseModel
{
    protected $table            = 'invoices';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'object';
    protected $protectFields    = true;
    protected $allowedFields    = [
        'school_id', 'invoice_number', 'amount', 'plan_name', 'billing_cycle',
        'status', 'payment_method', 'tripay_reference', 'payment_url', 'paid_at'
    ];

    // Dates
    protected $useTimestamps = true;
    protected $dateFormat    = 'datetime';
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';

    protected $beforeInsert = ['setSchoolId', 'generateInvoiceNumber'];

    /**
     * Generate unique invoice number e.g. INV-20260725-XXXX
     */
    protected function generateInvoiceNumber(array $data)
    {
        $date = date('Ymd');
        $random = str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
        $data['data']['invoice_number'] = "INV-{$date}-{$random}";
        return $data;
    }
}
