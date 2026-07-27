<?php

namespace App\Services;

use App\Repositories\Contracts\RepositoryInterface;

abstract class BaseService
{
    protected RepositoryInterface $repository;

    public function __construct(RepositoryInterface $repository)
    {
        $this->repository = $repository;
    }

    /**
     * Get paginated data
     */
    public function getPaginatedData(int $page, int $perPage, array $search = [], array $sortBy = []): array
    {
        return $this->repository->getPaginated($page, $perPage, $search, $sortBy);
    }

    /**
     * Get detail data
     */
    public function getDetail(int|string $id): ?object
    {
        return $this->repository->findById($id);
    }

    /**
     * Create resource
     */
    public function createResource(array $data, int|string $createdBy = null): object|bool
    {
        if ($createdBy) {
            $data['created_by'] = $createdBy;
        }
        return $this->repository->create($data);
    }

    /**
     * Update resource
     */
    public function updateResource(int|string $id, array $data, int|string $updatedBy = null): bool
    {
        if ($updatedBy) {
            $data['updated_by'] = $updatedBy;
        }
        return $this->repository->update($id, $data);
    }

    /**
     * Delete resource
     */
    public function deleteResource(int|string $id, int|string $deletedBy = null): bool
    {
        return $this->repository->delete($id, $deletedBy);
    }
}
