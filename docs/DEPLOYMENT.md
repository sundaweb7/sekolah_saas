# Deployment dan Operasi

## Checklist production

1. Gunakan HTTPS, set `CI_ENVIRONMENT=production`, dan `app.forceGlobalSecureRequests=true` (pastikan trusted proxy meneruskan header skema HTTPS dengan benar).
2. Tetapkan `app.baseURL`, koneksi database, `JWT_SECRET` acak minimal 32 karakter, `CORS_ALLOWED_ORIGINS`, kredensial SMTP, `FRONTEND_BASE_URL`, serta seluruh kredensial payment gateway.
3. Jalankan `composer install --no-dev --optimize-autoloader`, `npm ci`, dan `npm run build`.
4. Jalankan `php spark migrate` sebelum mengalihkan trafik.
5. Pastikan `backend/writable` dapat ditulis proses aplikasi, sedangkan source code tidak.
6. Pantau `GET /api/v1/health`, HTTP 5xx, latensi, ruang disk, dan kegagalan callback pembayaran.
7. Jalankan `php spark subscriptions:expire` melalui cron setiap hari.
8. Untuk beberapa instance aplikasi, gunakan Redis sebagai cache agar rate limit berlaku lintas instance; cache file hanya membatasi per server.
9. Daftarkan webhook Tripay hanya ke endpoint HTTPS resmi dan pantau respons 401/400 sebagai indikasi signature, referensi, atau nominal yang tidak cocok.

## Backup dan restore

- Backup database setiap hari dengan retensi harian, mingguan, dan bulanan sesuai kebijakan organisasi.
- Salin direktori upload ke object storage/private backup terenkripsi.
- Simpan backup di lokasi berbeda dari server aplikasi.
- Uji restore secara berkala pada environment terisolasi; backup tanpa uji restore belum dapat dianggap valid.
- Sebelum migration besar, buat snapshot database dan upload.

Urutan restore: pulihkan database, pulihkan upload pada path yang sama, deploy versi aplikasi yang kompatibel, jalankan migration yang diperlukan, lalu validasi health check dan alur login tenant.

## Rollback

Gunakan artefak rilis yang immutable. Jika rilis gagal, kembalikan artefak aplikasi sebelumnya. Rollback migration hanya dilakukan setelah memastikan migration tersebut aman untuk dibalik dan tidak menghapus data baru.
