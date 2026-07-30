<?php

namespace App\Controllers;

use App\Models\SppInvoiceModel;
use CodeIgniter\HTTP\ResponseInterface;

class PaymentCallbackController extends BaseResourceController
{
    /**
     * POST /api/v1/payment/tripay-callback
     * Tripay Callback / Webhook handler
     */
    public function handleTripayCallback(): ResponseInterface
    {
        $privateKey = env('TRIPAY_PRIVATE_KEY', '');
        
        // Get JSON payload
        $json = $this->request->getBody();
        
        // Get Callback Signature header
        $callbackSignature = $this->request->getServer('HTTP_X_CALLBACK_SIGNATURE') 
            ?? $this->request->getServer('X-Callback-Signature') 
            ?? '';

        if (empty($json)) {
            return $this->respondError('Empty payload', ResponseInterface::HTTP_BAD_REQUEST);
        }

        // Payment callbacks must fail closed. Accepting unsigned callbacks
        // would allow anyone to mark an invoice as paid.
        if (empty($privateKey)) {
            log_message('critical', 'Tripay callback rejected: TRIPAY_PRIVATE_KEY is not configured.');
            return $this->respondError('Payment callback is not configured', ResponseInterface::HTTP_SERVICE_UNAVAILABLE);
        }

        $localSignature = hash_hmac('sha256', $json, $privateKey);
        if (empty($callbackSignature) || !hash_equals($localSignature, $callbackSignature)) {
            return $this->respondError('Invalid signature', ResponseInterface::HTTP_UNAUTHORIZED);
        }

        // Parse payload
        $data = json_decode($json, true);
        if (!$data) {
            return $this->respondError('Invalid JSON', ResponseInterface::HTTP_BAD_REQUEST);
        }

        $event = $this->request->getServer('HTTP_X_CALLBACK_EVENT') ?? '';

        // Tripay callbacks are typically payment status updates
        $merchantRef = $data['merchant_ref'] ?? '';
        $reference   = $data['reference'] ?? '';
        $status      = $data['status'] ?? ''; // e.g. PAID, EXPIRED, FAILED

        if (empty($merchantRef)) {
            return $this->respondError('Missing merchant reference', ResponseInterface::HTTP_BAD_REQUEST);
        }

        // Parse invoice ID from merchant reference (e.g. SPP-12-178499...)
        $parts = explode('-', $merchantRef);
        if (count($parts) < 2 || $parts[0] !== 'SPP') {
            return $this->respondError('Invalid merchant reference format', ResponseInterface::HTTP_BAD_REQUEST);
        }

        $invoiceId = (int) $parts[1];

        $sppInvoiceModel = new SppInvoiceModel();
        $invoice = $sppInvoiceModel->find($invoiceId);

        if (!$invoice) {
            return $this->respondError('Invoice not found', ResponseInterface::HTTP_NOT_FOUND);
        }

        if (!empty($invoice->tripay_reference) && !hash_equals((string) $invoice->tripay_reference, (string) $reference)) {
            return $this->respondError('Payment reference does not match invoice', ResponseInterface::HTTP_BAD_REQUEST);
        }
        $paidAmount = $data['total_amount'] ?? $data['amount'] ?? null;
        if ($paidAmount === null || (int) $paidAmount !== (int) $invoice->amount) {
            return $this->respondError('Payment amount does not match invoice', ResponseInterface::HTTP_BAD_REQUEST);
        }

        if ($invoice->status === 'paid') {
            return $this->respondSuccess(['status' => 'already_processed'], 'Invoice already marked as paid.');
        }

        if (strtoupper($status) === 'PAID') {
            $paymentMethod = $data['payment_method'] ?? 'Tripay Payment';
            $paidAt        = isset($data['paid_at']) ? date('Y-m-d H:i:s', $data['paid_at']) : date('Y-m-d H:i:s');

            $sppInvoiceModel->where('id', $invoice->id)->where('status !=', 'paid')->set([
                'status'         => 'paid',
                'payment_method' => $paymentMethod,
                'paid_at'        => $paidAt
            ])->update();
            if (\Config\Database::connect()->affectedRows() !== 1) {
                return $this->respondSuccess(['status' => 'already_processed'], 'Invoice already marked as paid.');
            }
            (new \App\Models\AuditLogModel())->insert([
                'school_id' => $invoice->school_id,
                'role' => 'payment_gateway',
                'action' => 'payment:spp:paid',
                'method' => 'WEBHOOK',
                'path' => 'payment/tripay-callback',
                'status_code' => 200,
                'created_at' => date('Y-m-d H:i:s'),
            ]);

            return $this->respondSuccess(['status' => 'updated'], 'Payment received and invoice updated.');
        }

        return $this->respondSuccess(['status' => 'ignored'], 'Status ignored: ' . $status);
    }
}
