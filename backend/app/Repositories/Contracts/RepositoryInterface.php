<?php

namespace App\Repositories\Contracts;

interface RepositoryInterface
{
    /**
     * Get all records with pagination, searching, and sorting
     */
    public function getPaginated(int $page, int $perPage, array $search = [], array $sortBy = []): array;

    /**
     * Find record by ID
     */
    public function findById(int|string $id): ?object;

    /**
     * Create new record
     */
    public function create(array $data): object|bool;

    /**
     * Update existing record
     */
    public function update(int|string $id, array $data): bool;

    /**
     * Delete record (supports Soft Delete)
     */
    public function delete(int|string $id, int|string $deletedBy = null): bool;
}
