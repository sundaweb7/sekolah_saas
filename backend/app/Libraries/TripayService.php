<?php

namespace App\Libraries;

class TripayService
{
    protected string $apiKey;
    protected string $privateKey;
    protected string $merchantCode;
    protected bool $isSandbox;
    protected string $baseUrl;

    public function __construct(?array $config = null)
    {
        $this->apiKey       = $config['api_key'] ?? env('TRIPAY_API_KEY', '');
        $this->privateKey   = $config['private_key'] ?? env('TRIPAY_PRIVATE_KEY', '');
        $this->merchantCode = $config['merchant_code'] ?? env('TRIPAY_MERCHANT_CODE', '');
        $this->isSandbox    = (bool) ($config['is_sandbox'] ?? env('TRIPAY_IS_SANDBOX', true));

        $this->baseUrl = $this->isSandbox 
            ? 'https://tripay.co.id/api-sandbox/' 
            : 'https://tripay.co.id/api/';
    }

    /**
     * Request a closed transaction to Tripay
     */
    public function createClosedTransaction(array $params): array
    {
        if (empty($this->apiKey) || empty($this->privateKey) || empty($this->merchantCode)) {
            if (ENVIRONMENT === 'production') {
                throw new \RuntimeException('Tripay credentials are not configured.');
            }
            // Development-only response for local UI testing.
            return [
                'success' => true,
                'data' => [
                    'reference'      => 'TRP-DEV-DUMMY-' . uniqid(),
                    'merchant_ref'   => $params['merchant_ref'],
                    'payment_method' => $params['method'],
                    'payment_name'   => str_replace('Virtual Account ', '', $params['method']) . ' Transfer',
                    'amount'         => $params['amount'],
                    'pay_code'       => '98801234567890', // dummy payment code / VA
                    'checkout_url'   => null,
                    'status'         => 'UNPAID',
                    'instructions'   => [
                        [
                            'title' => 'ATM Transfer',
                            'steps' => [
                                'Masukkan kartu ATM dan PIN Anda',
                                'Pilih Menu Transaksi Lainnya > Transfer',
                                'Masukkan Nomor Virtual Account: 98801234567890',
                                'Masukkan nominal transfer sesuai tagihan',
                                'Ikuti instruksi selanjutnya untuk menyelesaikan transaksi'
                            ]
                        ]
                    ]
                ]
            ];
        }

        $endpoint = $this->baseUrl . 'transaction/create';
        
        $merchantRef = $params['merchant_ref'];
        $amount      = (int) $params['amount'];
        
        // Calculate Signature
        $signature = hash_hmac('sha256', $this->merchantCode . $merchantRef . $amount, $this->privateKey);

        $payload = [
            'method'         => $this->mapPaymentMethod($params['method']),
            'merchant_ref'   => $merchantRef,
            'amount'         => $amount,
            'customer_name'  => $params['customer_name'] ?? 'Wali Murid',
            'customer_email' => $params['customer_email'] ?? 'parent@paudku.local',
            'order_items'    => [
                [
                    'sku'      => 'SPP-FEE',
                    'name'     => $params['item_name'] ?? 'Pembayaran SPP',
                    'price'    => $amount,
                    'quantity' => 1
                ]
            ],
            'expired_time'   => time() + (24 * 60 * 60), // 24 hours expiry
            'signature'      => $signature
        ];

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $endpoint);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $this->apiKey
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $result = json_decode($response, true);

        if ($httpCode !== 200 || !($result['success'] ?? false)) {
            $errorMessage = $result['message'] ?? 'Gagal menghubungi server Tripay.';
            throw new \Exception($errorMessage);
        }

        return $result;
    }

    /**
     * Compatibility entry point used by subscription billing.
     */
    public function createPayment(
        string $merchantRef,
        int $amount,
        string $itemName,
        string $paymentMethod,
        array $customer = []
    ): array {
        return $this->createClosedTransaction([
            'merchant_ref' => $merchantRef,
            'amount' => $amount,
            'item_name' => $itemName,
            'method' => $paymentMethod,
            'customer_name' => $customer['name'] ?? 'Admin Sekolah',
            'customer_email' => $customer['email'] ?? 'admin@school.sch.id',
        ]);
    }

    /**
     * Verify that a callback was signed by Tripay.
     */
    public function verifyCallbackSignature(string $json, string $receivedSignature): bool
    {
        if ($this->privateKey === '' || $receivedSignature === '') {
            return false;
        }

        $localSignature = hash_hmac('sha256', $json, $this->privateKey);
        return hash_equals($localSignature, $receivedSignature);
    }

    /**
     * Map friendly payment method names to Tripay method codes
     */
    private function mapPaymentMethod(string $friendlyName): string
    {
        $name = strtolower($friendlyName);
        if (str_contains($name, 'mandiri')) {
            return 'MANDIRIVA';
        }
        if (str_contains($name, 'bca')) {
            return 'BCAVA';
        }
        if (str_contains($name, 'bni')) {
            return 'BNIVA';
        }
        if (str_contains($name, 'bri')) {
            return 'BRIVA';
        }
        if (str_contains($name, 'qris') || str_contains($name, 'gopay')) {
            return 'QRIS';
        }
        return 'QRIS';
    }
}
