<?php

namespace App\Libraries;

use CodeIgniter\HTTP\CURLRequest;
use Config\Services;
use Exception;

class FonnteService
{
    protected string $token;
    protected string $apiUrl = 'https://api.fonnte.com/send';

    public function __construct()
    {
        $this->token = env('FONNTE_TOKEN', '');
    }

    /**
     * Send WhatsApp message using Fonnte API
     * 
     * @param string $target Recipient number (e.g. 628123456789)
     * @param string $message Text message content
     * @return array Response payload from Fonnte API or error info
     */
    public function sendMessage(string $target, string $message): array
    {
        if (empty($this->token) || $this->token === 'your_fonnte_api_token_here') {
            log_message('warning', 'Fonnte WhatsApp skipped: FONNTE_TOKEN is not configured or is using default placeholder.');
            return [
                'status' => false,
                'message' => 'FONNTE_TOKEN is not configured'
            ];
        }

        // Clean target phone number: ensure it starts with 62 or equivalent and has no spaces/dashes
        $target = preg_replace('/[^0-9]/', '', $target);
        
        // Convert leading 0 to 62 (Indonesian country code format commonly expected by gateways)
        if (strpos($target, '0') === 0) {
            $target = '62' . substr($target, 1);
        }

        if (empty($target)) {
            return [
                'status' => false,
                'message' => 'Empty or invalid target number'
            ];
        }

        try {
            /** @var CURLRequest $client */
            $client = Services::curlrequest();
            
            $response = $client->request('POST', $this->apiUrl, [
                'headers' => [
                    'Authorization' => $this->token,
                ],
                'form_params' => [
                    'target'  => $target,
                    'message' => $message,
                ],
                'http_errors' => false // Prevent throwing exception on HTTP errors so we can read body
            ]);

            $statusCode = $response->getStatusCode();
            $body = json_decode($response->getBody(), true);

            if ($statusCode === 200 && ($body['status'] ?? false) === true) {
                log_message('info', "Fonnte WhatsApp sent successfully to {$target}.");
                return [
                    'status' => true,
                    'data' => $body
                ];
            }

            log_message('error', "Fonnte WhatsApp failed to {$target} with code {$statusCode}. Response: " . json_encode($body));
            return [
                'status' => false,
                'message' => $body['reason'] ?? 'API request failed',
                'code' => $statusCode
            ];

        } catch (Exception $e) {
            log_message('error', 'Fonnte WhatsApp exception: ' . $e->getMessage());
            return [
                'status' => false,
                'message' => $e->getMessage()
            ];
        }
    }
}
