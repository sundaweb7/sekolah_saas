<?php

namespace App\Repositories\Eloquent;

use App\Repositories\Contracts\RepositoryInterface;
use CodeIgniter\Model;

abstract class BaseRepository implements RepositoryInterface
{
    protected Model $model;

    public function __construct(Model $model)
    {
        $this->model = $model;
    }

    /**
     * Get all records with pagination, searching, and sorting
     */
    public function getPaginated(int $page, int $perPage, array $search = [], array $sortBy = []): array
    {
        $builder = $this->model;

        // Apply searching (e.g. ['name' => 'John', 'email' => 'john@example.com'])
        if (!empty($search)) {
            $builder->groupStart();
            foreach ($search as $field => $value) {
                if ($value !== '') {
                    $builder->like($field, $value);
                }
            }
            $builder->groupEnd();
        }

        // Apply sorting (e.g. ['created_at' => 'DESC'])
        if (!empty($sortBy)) {
            foreach ($sortBy as $field => $direction) {
                $builder->orderBy($field, $direction);
            }
        } else {
            $builder->orderBy($this->model->primaryKey, 'DESC');
        }

        $data = $builder->paginate($perPage, 'default', $page);
        
        return [
            'list' => $data,
            'pager' => $builder->pager->getDetails()
        ];
    }

    /**
     * Find record by ID
     */
    public function findById(int|string $id): ?object
    {
        return $this->model->find($id) ?: null;
    }

    /**
     * Create new record
     */
    public function create(array $data): object|bool
    {
        $id = $this->model->insert($data);
        if ($id) {
            return $this->findById($id);
        }
        return false;
    }

    /**
     * Update existing record
     */
    public function update(int|string $id, array $data): bool
    {
        return $this->model->update($id, $data);
    }

    /**
     * Delete record (supports Soft Delete via Model)
     */
    public function delete(int|string $id, int|string $deletedBy = null): bool
    {
        if ($deletedBy && in_array('deleted_by', $this->model->allowedFields)) {
            $this->model->update($id, ['deleted_by' => $deletedBy]);
        }
        return $this->model->delete($id);
    }
}
