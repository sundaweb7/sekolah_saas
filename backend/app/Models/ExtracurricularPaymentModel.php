<?php

namespace App\Models;

use App\Models\BaseModel;

class ExtracurricularPaymentModel extends BaseModel
{
    protected $table            = 'extracurricular_payments';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'object';
    protected $useSoftDeletes   = false;
    protected $protectFields    = true;
    protected $allowedFields    = [
        'school_id', 'member_id', 'fee_type', 'month_period', 'amount', 'status', 'payment_date'
    ];

    // Dates
    protected $useTimestamps = true;
    protected $dateFormat    = 'datetime';
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';
}
