<?php

namespace App\Controllers\Admin;

use App\Controllers\BaseResourceController;
use App\Models\InvoiceModel;
use App\Models\SubscriptionModel;
use App\Models\SchoolModel;
use App\Models\StudentModel;
use App\Libraries\TripayService;
use CodeIgniter\HTTP\ResponseInterface;

class BillingController extends BaseResourceController
{
    protected InvoiceModel $invoiceModel;
    protected SubscriptionModel $subscriptionModel;
    protected SchoolModel $schoolModel;
    protected TripayService $tripayService;

    public function __construct()
    {
        $this->invoiceModel = new InvoiceModel();
        $this->subscriptionModel = new SubscriptionModel();
        $this->schoolModel = new SchoolModel();
        $this->tripayService = new TripayService();
    }

    /**
     * GET /api/v1/admin/billing/status
     */
    public function status(): ResponseInterface
    {
        $schoolId = defined('CURRENT_SCHOOL_ID') ? CURRENT_SCHOOL_ID : null;
        if (!$schoolId) {
            return $this->respondError('School context required', ResponseInterface::HTTP_BAD_REQUEST);
        }

        $school = $this->schoolModel->find($schoolId);
        $invoices = $this->invoiceModel->where('school_id', $schoolId)->orderBy('created_at', 'DESC')->findAll();
        
        // Load subscription detail from subscriptions table
        $subscription = $this->subscriptionModel->where('school_id', $schoolId)->where('status', 'active')->first();
        
        $resolvedPlan = (new \App\Services\PlanService())->activePlan((int) $schoolId);
        $planName = $resolvedPlan === 'trial' ? 'premium' : $resolvedPlan;
        $expiresAt = $subscription ? $subscription->end_date : date('Y-m-d H:i:s', strtotime('+7 days', strtotime($school->created_at)));
        $planType = $subscription ? 'paid' : ($resolvedPlan === 'trial' ? 'trial' : 'expired');

        // Quota usage checks
        $studentModel = new StudentModel();
        $totalStudents = $studentModel->where('school_id', $schoolId)->countAllResults();

        // Fitur batas kuota per plan
        $quotas = array_map(static fn ($plan) => [
            'students' => $plan['students'], 'storage' => $plan['storage'], 'price' => $plan['monthly'],
        ], \App\Services\PlanService::CATALOG);

        return $this->respondSuccess([
            'school' => [
                'name'              => $school->name,
                'subscription_plan' => $planName,
                'subscription_type' => $planType, // 'trial' or 'paid'
                'expires_at'        => $expiresAt,
            ],
            'usage' => [
                'students' => $totalStudents,
            ],
            'quotas'   => $quotas,
            'invoices' => $invoices
        ]);
    }

    /**
     * POST /api/v1/admin/billing/checkout
     */
    public function checkout(): ResponseInterface
    {
        $schoolId = defined('CURRENT_SCHOOL_ID') ? CURRENT_SCHOOL_ID : null;
        if (!$schoolId) {
            return $this->respondError('School context required', ResponseInterface::HTTP_BAD_REQUEST);
        }

        $planName = $this->request->getVar('plan_name'); // basic, standard, premium
        $billingCycle = $this->request->getVar('billing_cycle') ?? 'monthly';
        $paymentMethod = $this->request->getVar('payment_method') ?? 'MY_VIRTUAL_ACCOUNT';

        $plans = \App\Services\PlanService::CATALOG;

        if (!isset($plans[$planName])) {
            return $this->respondError('Invalid subscription plan name', ResponseInterface::HTTP_BAD_REQUEST);
        }

        $cycle = (strtolower($billingCycle) === 'yearly') ? 'yearly' : 'monthly';
        $amount = $plans[$planName][$cycle];

        // Fetch User context for Tripay customer profile
        $user = $this->request->user ?? (object)['full_name' => 'Admin Sekolah', 'email' => 'admin@school.sch.id'];

        // Get unique invoice number (generated in model beforeInsert)
        // Since we want the invoice number for Tripay request, we insert first in UNPAID state
        $db = \Config\Database::connect();
        $db->transStart();

        $invoiceId = $this->invoiceModel->insert([
            'school_id' => $schoolId,
            'amount' => $amount,
            'plan_name' => $planName,
            'billing_cycle' => $cycle,
            'status' => 'unpaid',
            'payment_method' => $paymentMethod
        ]);

        $invoice = $this->invoiceModel->find($invoiceId);

        // Initiate payment with Tripay gateway service
        try {
            $tripayRes = $this->tripayService->createPayment(
                $invoice->invoice_number,
                $amount,
                $planName,
                $paymentMethod,
                ['name' => $user->full_name, 'email' => $user->email]
            );
            if (empty($tripayRes['data']['reference'])) {
                throw new \RuntimeException('Payment provider returned an incomplete response.');
            }
        } catch (\Throwable $e) {
            $db->transRollback();
            log_message('error', 'Subscription checkout failed: {message}', ['message' => $e->getMessage()]);
            return $this->respondError('Payment provider is currently unavailable', ResponseInterface::HTTP_SERVICE_UNAVAILABLE);
        }

        // Update invoice with Tripay reference and checkout details
        $this->invoiceModel->update($invoiceId, [
            'tripay_reference' => $tripayRes['data']['reference'],
            'payment_url'      => $tripayRes['data']['checkout_url']
        ]);

        $db->transComplete();

        if ($db->transStatus() === false) {
            return $this->respondError('Failed to initiate transaction', ResponseInterface::HTTP_INTERNAL_SERVER_ERROR);
        }

        // Trigger WhatsApp Notification
        $userModel = new \App\Models\UserModel();
        $admin = $userModel->where('school_id', $schoolId)->where('role', 'admin')->first();
        if ($admin && !empty($admin->phone)) {
            $school = $this->schoolModel->find($schoolId);
            $fonnte = new \App\Libraries\FonnteService();
            $message = "Halo *{$admin->full_name}*,\n\nTagihan pembayaran langganan baru untuk sekolah *{$school->name}* telah dibuat.\n\n*Detail Tagihan:*\n- No. Invoice: *{$invoice->invoice_number}*\n- Paket: *{$planName}*\n- Nominal: *Rp " . number_format($amount, 0, ',', '.') . "*\n- Metode Pembayaran: *{$paymentMethod}*\n\nSilakan lakukan pembayaran melalui link berikut:\n{$tripayRes['data']['checkout_url']}\n\nTerima kasih,\n*PAUDKU Pusat*";
            $fonnte->sendMessage($admin->phone, $message);
        }

        return $this->respondSuccess([
            'invoice' => $this->invoiceModel->find($invoiceId),
            'tripay'  => $tripayRes['data']
        ], 'Payment checkout transaction initiated successfully');
    }

    /**
     * POST /api/v1/billing/webhook
     * Public callback endpoint triggered by Tripay when payment succeeds.
     */
    public function callback(): ResponseInterface
    {
        $callbackJson = $this->request->getBody();
        $receivedSignature = $this->request->getServer('HTTP_X_CALLBACK_SIGNATURE');

        if (empty($receivedSignature) || !$this->tripayService->verifyCallbackSignature($callbackJson, $receivedSignature)) {
            return $this->respondError('Invalid callback signature', ResponseInterface::HTTP_UNAUTHORIZED);
        }

        $callbackData = json_decode($callbackJson, true);
        if (!$callbackData) {
            return $this->respondError('Invalid callback JSON payload', ResponseInterface::HTTP_BAD_REQUEST);
        }

        $invoiceNumber = $callbackData['merchant_ref'] ?? null;
        $status = $callbackData['status'] ?? null;

        if (!$invoiceNumber || $status !== 'PAID') {
            return $this->respondSuccess(['success' => false, 'message' => 'Invoice unpaid or invalid status']);
        }

        // Find invoice
        $invoice = $this->invoiceModel->where('invoice_number', $invoiceNumber)->first();
        if (!$invoice || $invoice->status === 'paid') {
            return $this->respondSuccess(['success' => true, 'message' => 'Invoice already processed or not found']);
        }
        $callbackReference = $callbackData['reference'] ?? '';
        if (!empty($invoice->tripay_reference) && !hash_equals((string) $invoice->tripay_reference, (string) $callbackReference)) {
            return $this->respondError('Payment reference does not match invoice', ResponseInterface::HTTP_BAD_REQUEST);
        }
        $paidAmount = $callbackData['total_amount'] ?? $callbackData['amount'] ?? null;
        if ($paidAmount === null || (int) $paidAmount !== (int) $invoice->amount) {
            return $this->respondError('Payment amount does not match invoice', ResponseInterface::HTTP_BAD_REQUEST);
        }

        $db = \Config\Database::connect();
        $db->transStart();

        // 1. Atomically mark Invoice as PAID. A repeated callback will not
        // create another subscription.
        $this->invoiceModel->where('id', $invoice->id)->where('status !=', 'paid')->set([
            'status'  => 'paid',
            'paid_at' => date('Y-m-d H:i:s')
        ])->update();

        if ($db->affectedRows() !== 1) {
            $db->transRollback();
            return $this->respondSuccess(['success' => true, 'message' => 'Invoice already processed']);
        }

        // 2. Set Active Subscription & School Expire Dates
        $schoolId = $invoice->school_id;
        $isYearly = (strtolower($invoice->billing_cycle) === 'yearly');
        $activeSubscription = $this->subscriptionModel
            ->where('school_id', $schoolId)
            ->where('status', 'active')
            ->orderBy('end_date', 'DESC')
            ->first();
        $baseTimestamp = $activeSubscription && strtotime($activeSubscription->end_date) > time()
            ? strtotime($activeSubscription->end_date)
            : time();
        $expiryDays = $isYearly ? '+1 year' : '+1 month';
        $expiryDate = date('Y-m-d', strtotime($expiryDays, $baseTimestamp));

        $this->subscriptionModel->where('school_id', $schoolId)
            ->where('status', 'active')
            ->set(['status' => 'expired'])
            ->update();

        $this->schoolModel->update($schoolId, [
            'subscription_plan' => $invoice->plan_name,
            'billing_cycle'     => $invoice->billing_cycle,
            'expires_at'        => $expiryDate
        ]);

        $this->subscriptionModel->insert([
            'school_id'  => $schoolId,
            'plan_name'  => $invoice->plan_name,
            'billing_cycle' => $invoice->billing_cycle,
            'start_date' => date('Y-m-d'),
            'end_date'   => $expiryDate,
            'status'     => 'active'
        ]);

        $db->transComplete();

        if ($db->transStatus() === false) {
            return $this->respondError('Failed to process payment records', ResponseInterface::HTTP_INTERNAL_SERVER_ERROR);
        }

        (new \App\Models\AuditLogModel())->insert([
            'school_id' => $schoolId,
            'role' => 'payment_gateway',
            'action' => 'payment:subscription:paid',
            'method' => 'WEBHOOK',
            'path' => 'billing/webhook',
            'status_code' => 200,
            'created_at' => date('Y-m-d H:i:s'),
        ]);

        // Trigger WhatsApp Notification for Payment Success
        $userModel = new \App\Models\UserModel();
        $admin = $userModel->where('school_id', $schoolId)->where('role', 'admin')->first();
        if ($admin && !empty($admin->phone)) {
            $school = $this->schoolModel->find($schoolId);
            $fonnte = new \App\Libraries\FonnteService();
            $message = "Halo *{$admin->full_name}*,\n\nPembayaran langganan sekolah *{$school->name}* telah berhasil diterima.\n\n*Detail Pembayaran:*\n- No. Invoice: *{$invoice->invoice_number}*\n- Paket: *{$invoice->plan_name}*\n- Nominal: *Rp " . number_format($invoice->amount, 0, ',', '.') . "*\n- Tanggal Aktif: *" . date('d-m-Y') . "* s/d *{$expiryDate}*\n\nStatus keanggotaan sekolah Anda saat ini aktif. Terima kasih telah menggunakan layanan kami!\n\n*PAUDKU Pusat*";
            $fonnte->sendMessage($admin->phone, $message);
        }

        return $this->respondSuccess(['success' => true]);
    }
}
