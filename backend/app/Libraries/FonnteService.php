<?php

namespace App\Libraries;

use CodeIgniter\HTTP\CURLRequest;
use Config\Services;
use Exception;

class FonnteService
{
    protected string $token;
    protected string $apiUrl = 'https://api.fonnte.com/send';

    /**
     * @param string|null $token  Per-tenant Fonnte token. Falls back to global FONNTE_TOKEN from .env.
     */
    public function __construct(?string $token = null)
    {
        $this->token = $token ?? env('FONNTE_TOKEN', '');
    }

    /**
     * Create instance using a school_id — automatically resolves the tenant's Fonnte token
     * from website_settings, falling back to the global .env token.
     */
    public static function forSchool(int $schoolId): self
    {
        $db = \Config\Database::connect();
        $row = $db->table('website_settings')
            ->select('fonnte_token')
            ->where('school_id', $schoolId)
            ->limit(1)
            ->get()
            ->getRow();

        $tenantToken = $row ? ($row->fonnte_token ?? '') : '';
        // Use tenant token if set, otherwise fall back to global
        return new self($tenantToken ?: null);
    }

    /**
     * Send WhatsApp message using Fonnte API
     *
     * @param string $target  Recipient number (e.g. 628123456789)
     * @param string $message Text message content
     * @return array Response payload from Fonnte API or error info
     */
    public function sendMessage(string $target, string $message): array
    {
        if (empty($this->token) || $this->token === 'your_fonnte_api_token_here') {
            log_message('warning', 'Fonnte WhatsApp skipped: token is not configured.');
            return [
                'status'  => false,
                'message' => 'Fonnte token is not configured',
            ];
        }

        // Clean target phone number
        $target = preg_replace('/[^0-9]/', '', $target);
        if (strpos($target, '0') === 0) {
            $target = '62' . substr($target, 1);
        }

        if (empty($target)) {
            return [
                'status'  => false,
                'message' => 'Empty or invalid target number',
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
                'http_errors' => false,
            ]);

            $statusCode = $response->getStatusCode();
            $body = json_decode($response->getBody(), true);

            if ($statusCode === 200 && ($body['status'] ?? false) === true) {
                log_message('info', "Fonnte WhatsApp sent successfully to {$target}.");
                return ['status' => true, 'data' => $body];
            }

            log_message('error', "Fonnte WhatsApp failed to {$target} with code {$statusCode}. Response: " . json_encode($body));
            return [
                'status'  => false,
                'message' => $body['reason'] ?? 'API request failed',
                'code'    => $statusCode,
            ];
        } catch (Exception $e) {
            log_message('error', 'Fonnte WhatsApp exception: ' . $e->getMessage());
            return ['status' => false, 'message' => $e->getMessage()];
        }
    }
}
