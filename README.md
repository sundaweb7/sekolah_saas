# PAUDKU / Koola

Platform SaaS multi-tenant untuk pengelolaan sekolah, terdiri dari frontend React/Vite dan REST API CodeIgniter 4.

## Menjalankan secara lokal

Persyaratan: PHP 8.2+, Composer, Node.js 22+, npm, serta MySQL/MariaDB.

```bash
cd backend
cp env .env
composer install
php spark migrate
php spark db:seed SuperAdminSeeder
php spark serve
```

Pada terminal lain:

```bash
cd frontend
npm ci
npm run dev
```

Konfigurasikan database di `backend/.env`. Untuk production, `JWT_SECRET` minimal 32 karakter, daftar `CORS_ALLOWED_ORIGINS`, dan kredensial Tripay wajib ditetapkan.

## Pemeriksaan kualitas

```bash
cd backend && vendor/bin/phpunit --no-coverage
cd frontend && npm run lint && npm run build
```

Health check tersedia di `GET /api/v1/health` dan mengembalikan HTTP 503 jika database tidak tersedia.

## Dokumentasi

- [Roadmap](ROADMAP.md)
- [Deployment dan operasi](docs/DEPLOYMENT.md)
- [Keamanan dan privasi](docs/SECURITY.md)
- [Kontrak OpenAPI](docs/openapi.yaml)
