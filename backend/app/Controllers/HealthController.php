<?php

namespace App\Controllers;

use CodeIgniter\HTTP\ResponseInterface;

class HealthController extends BaseController
{
    public function index(): ResponseInterface
    {
        try {
            $db = \Config\Database::connect();
            $db->query('SELECT 1');
            $database = 'up';
            $status = ResponseInterface::HTTP_OK;
        } catch (\Throwable $e) {
            $database = 'down';
            $status = ResponseInterface::HTTP_SERVICE_UNAVAILABLE;
        }

        return $this->response->setStatusCode($status)->setJSON([
            'status' => $status === ResponseInterface::HTTP_OK ? 'ok' : 'degraded',
            'database' => $database,
            'timestamp' => gmdate(DATE_ATOM),
        ]);
    }
}
