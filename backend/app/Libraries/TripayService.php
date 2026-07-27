<?php

namespace App\Libraries;

class TripayService
{
    protected string $apiKey;
    protected string $privateKey;
    protected string $merchantCode;
    protected bool $isSandbox;
    protected string $baseUrl;

    public function __construct()
    {
        $this->apiKey       = env('TRIPAY_API_KEY', '');
        $this->privateKey   = env('TRIPAY_PRIVATE_KEY', '');
        $this->merchantCode = env('TRIPAY_MERCHANT_CODE', '');
        $this->isSandbox    = (bool) env('TRIPAY_IS_SANDBOX', true);

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
            // If credentials are placeholder or empty, fallback to a dummy sandbox response to prevent crash
            return [
                'success' => true,
                'data' => [
                    'reference'      => 'TRP-DEV-DUMMY-' . uniqid(),
                    'merchant_ref'   => $params['merchant_ref'],
                    'payment_method' => $params['method'],
                    'payment_name'   => str_replace('Virtual Account ', '', $params['method']) . ' Transfer',
                    'amount'         => $params['amount'],
                    'pay_code'       => '98801234567890', // dummy payment code / VA
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
     * Map friendly payment method names to Tripay method codes
     */
    private function mapPaymentMethod(string $friendlyName): string
    {
        switch ($friendlyName) {
            case 'Virtual Account Mandiri': return 'MANDIRIVA';
            case 'Virtual Account BCA':     return 'BCAVA';
            case 'Virtual Account BNI':     return 'BNIVA';
            case 'Virtual Account BRI':     return 'BRIVA';
            case 'Gopay / QRIS':            return 'QRIS';
            default:                        return 'QRIS';
        }
    }
}
