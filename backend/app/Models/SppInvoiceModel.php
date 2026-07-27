<?php

namespace App\Models;

class SppInvoiceModel extends BaseModel
{
    protected $table            = 'spp_invoices';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'object';
    protected $protectFields    = true;
    protected $allowedFields    = [
        'school_id', 'student_id', 'month', 'amount', 'status', 'payment_method', 'paid_at',
        'tripay_reference', 'tripay_pay_code', 'tripay_payment_method', 'tripay_instructions',
        'payment_type', 'description'
    ];

    // Dates
    protected $useTimestamps = true;
    protected $dateFormat    = 'datetime';
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';
}
