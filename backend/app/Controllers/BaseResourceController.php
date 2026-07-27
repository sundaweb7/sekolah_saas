<?php

namespace App\Controllers;

use CodeIgniter\RESTful\ResourceController;
use App\Traits\ApiResponseTrait;

abstract class BaseResourceController extends ResourceController
{
    use ApiResponseTrait;

    protected $format = 'json';

    /**
     * Parse common URL parameters for pagination, sorting, and searching
     */
    protected function getRequestParams(): array
    {
        $page = (int) ($this->request->getVar('page') ?? 1);
        $perPage = (int) ($this->request->getVar('per_page') ?? 10);
        $sortField = $this->request->getVar('sort_by') ?? null;
        $sortOrder = $this->request->getVar('sort_order') ?? 'DESC';
        
        $sortBy = [];
        if ($sortField) {
            $sortBy[$sortField] = strtoupper($sortOrder) === 'ASC' ? 'ASC' : 'DESC';
        }

        // Get all query params except system/pagination keys for search filters
        $search = $this->request->getGet();
        unset($search['page'], $search['per_page'], $search['sort_by'], $search['sort_order']);

        return [
            'page'    => $page,
            'perPage' => $perPage,
            'sortBy'  => $sortBy,
            'search'  => $search
        ];
    }

    /**
     * Get request body variables (handling both application/json and post/get data)
     */
    protected function getRequestBody(): array
    {
        $json = $this->request->getJSON(true);
        if (is_array($json) && !empty($json)) {
            return $json;
        }
        return (array) ($this->request->getVar() ?? []);
    }
}
