<?php

namespace App\Traits;

use CodeIgniter\HTTP\ResponseInterface;

trait ApiResponseTrait
{
    /**
     * Standard success response
     */
    protected function respondSuccess(array|object|string $data = null, string $message = 'Success', int $statusCode = ResponseInterface::HTTP_OK): ResponseInterface
    {
        return $this->response->setJSON([
            'status'  => 'success',
            'code'    => $statusCode,
            'message' => $message,
            'data'    => $data
        ])->setStatusCode($statusCode);
    }

    /**
     * Standard error response
     */
    protected function respondError(string $message = 'Error occurred', int $statusCode = ResponseInterface::HTTP_BAD_REQUEST, array $errors = []): ResponseInterface
    {
        $response = [
            'status'  => 'error',
            'code'    => $statusCode,
            'message' => $message
        ];

        if (!empty($errors)) {
            $response['errors'] = $errors;
        }

        return $this->response->setJSON($response)->setStatusCode($statusCode);
    }

    /**
     * Standard paginated response
     */
    protected function respondPaginated(array $data, array $pagination, string $message = 'Success'): ResponseInterface
    {
        return $this->response->setJSON([
            'status'     => 'success',
            'code'       => ResponseInterface::HTTP_OK,
            'message'    => $message,
            'data'       => $data,
            'pagination' => $pagination
        ])->setStatusCode(ResponseInterface::HTTP_OK);
    }
}
