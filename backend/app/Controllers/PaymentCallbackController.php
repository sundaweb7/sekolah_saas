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

        // Validate Signature if private key is configured
        if (!empty($privateKey)) {
            $localSignature = hash_hmac('sha256', $json, $privateKey);
            if ($callbackSignature !== $localSignature) {
                return $this->respondError('Invalid signature', ResponseInterface::HTTP_UNAUTHORIZED);
            }
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

        if ($invoice->status === 'paid') {
            return $this->respondSuccess(['status' => 'already_processed'], 'Invoice already marked as paid.');
        }

        if (strtoupper($status) === 'PAID') {
            $paymentMethod = $data['payment_method'] ?? 'Tripay Payment';
            $paidAt        = isset($data['paid_at']) ? date('Y-m-d H:i:s', $data['paid_at']) : date('Y-m-d H:i:s');

            $sppInvoiceModel->update($invoice->id, [
                'status'         => 'paid',
                'payment_method' => $paymentMethod,
                'paid_at'        => $paidAt
            ]);

            return $this->respondSuccess(['status' => 'updated'], 'Payment received and invoice updated.');
        }

        return $this->respondSuccess(['status' => 'ignored'], 'Status ignored: ' . $status);
    }
}
