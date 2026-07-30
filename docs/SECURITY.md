# Keamanan dan Privasi

## Pelaporan kerentanan

Jangan membuka data siswa atau kredensial pada issue publik. Laporkan secara privat kepada pengelola sistem dengan langkah reproduksi minimal dan tanpa menyalin data pribadi yang tidak diperlukan.

## Aturan operasional

- Jangan commit `.env`, token, private key, dump database, atau data siswa.
- Rotasi secret jika pernah terpapar.
- Gunakan akun database dengan hak minimum dan koneksi terenkripsi.
- Batasi akses upload dan backup; dokumen siswa tidak boleh tersedia melalui directory listing.
- Tinjau audit log untuk perubahan pembayaran, impersonasi, nilai, absensi, dan data siswa.
- Tetapkan masa retensi serta prosedur ekspor/penghapusan data saat tenant berhenti.
- Jangan memasukkan password, token, isi dokumen, atau data kesehatan anak ke log.
- Kode impersonasi hanya berlaku dua menit, sekali pakai, dan wajib ditukar pada domain tenant tujuan; jangan membagikannya melalui pesan atau tiket dukungan.

## Isolasi tenant

Tenant pengguna sekolah ditentukan oleh `school_id` di JWT yang ditandatangani. Header atau host yang tidak cocok harus ditolak. Setiap model data sekolah wajib memperluas `BaseModel` dan memiliki kolom serta indeks `school_id`.
