# Roadmap PAUDKU / Koola

Dokumen ini merangkum fitur yang **sudah tersedia di dalam repository** saat ini. Dokumen ini dapat digunakan sebagai baseline dan dilanjutkan dengan rencana pengembangan berikutnya.

## Keterangan Status

- `[x]` Sudah tersedia di repository
- `[~]` Sudah tersedia sebagian atau baru berupa antarmuka
- `[ ]` Belum ditentukan / dapat ditambahkan kemudian

## 1. Fondasi Aplikasi

- [x] Arsitektur frontend React + Vite
- [x] Backend REST API berbasis CodeIgniter 4
- [x] Sistem multi-tenant berdasarkan sekolah, subdomain, dan custom domain
- [x] Autentikasi JWT dan refresh token
- [x] Otorisasi berdasarkan peran: superadmin, admin sekolah, guru, dan orang tua
- [x] Pembatasan fitur berdasarkan paket/langganan sekolah
- [x] Upload dokumen dan media
- [x] Database migration untuk entitas utama aplikasi

## 2. Autentikasi dan Akun

- [x] Login pengguna
- [x] Logout pengguna
- [x] Registrasi tenant/sekolah
- [x] Lupa password dan reset password
- [x] Profil pengguna
- [x] Ubah password
- [x] Impersonasi admin sekolah oleh superadmin
- [x] Impersonasi guru dan orang tua oleh admin sekolah

## 3. Portal Superadmin

- [x] Dashboard statistik platform
- [x] Daftar dan detail sekolah
- [x] Pengubahan data dan status sekolah
- [x] Pengelolaan invoice platform
- [x] Pengelolaan fitur dan paket sekolah
- [x] Pengelolaan permintaan custom domain
- [x] Pembersihan cache aplikasi

## 4. Portal Admin Sekolah

### Dashboard dan Data Master

- [x] Dashboard statistik sekolah
- [x] Manajemen data siswa
- [x] Statistik siswa
- [x] Import dan export data siswa melalui Excel
- [x] Manajemen data guru
- [x] Manajemen kelas
- [x] Manajemen pengguna
- [x] Manajemen tahun ajaran dan semester

### Akademik dan KBM

- [x] Manajemen jadwal KBM per kelas dan hari
- [x] Absensi siswa
- [x] Absensi guru dan rekap absensi
- [x] Jurnal kelas
- [x] Pengumuman kelas
- [x] Laporan perkembangan harian siswa
- [x] Laporan semester siswa
- [x] Rekap laporan absensi siswa dan guru
- [x] Rekap jurnal kelas

### Ekstrakurikuler

- [x] Manajemen kegiatan ekstrakurikuler
- [x] Pendaftaran dan persetujuan anggota
- [x] Penilaian anggota
- [x] Presensi kegiatan
- [x] Pembayaran ekstrakurikuler

### PPDB

- [x] Pengaturan PPDB sekolah
- [x] Formulir pendaftaran PPDB publik
- [x] Pelacakan status pendaftaran
- [x] Daftar pendaftar pada portal admin
- [x] Verifikasi pendaftaran
- [x] Konfirmasi pembayaran pendaftaran

### Keuangan dan Langganan

- [x] Pembuatan tagihan SPP siswa
- [x] Konfirmasi dan penghapusan pembayaran SPP
- [x] Informasi status langganan sekolah
- [x] Checkout biaya langganan
- [x] Integrasi pembayaran Tripay dan webhook pembayaran

### Website Sekolah

- [x] Pengaturan tampilan dan profil website sekolah
- [x] Manajemen berita dan kategori berita
- [x] Manajemen halaman khusus
- [x] Manajemen galeri foto
- [x] Manajemen agenda/kegiatan
- [x] Website publik berdasarkan subdomain atau slug sekolah
- [x] Halaman daftar dan detail berita publik
- [x] Halaman konten khusus publik
- [x] Pengajuan custom domain

### Administrasi

- [x] Penyimpanan dokumen akreditasi melalui tautan Google Drive
- [x] E-Surat dengan pencatatan nomor, penerbitan, dan cetak ulang

## 5. Portal Guru

- [x] Dashboard guru
- [x] Statistik kegiatan guru
- [x] Check-in dan pencatatan absensi guru
- [x] Pengisian absensi siswa
- [x] Pengisian jurnal kelas
- [x] Pengelolaan pengumuman kelas
- [x] Pengelolaan laporan harian siswa
- [x] Pengelolaan laporan semester siswa

## 6. Portal Orang Tua

- [x] Dashboard orang tua dan ringkasan data anak
- [x] Melihat laporan harian siswa
- [x] Melihat laporan semester siswa
- [x] Melihat tagihan SPP
- [x] Pembayaran SPP melalui payment gateway

## 7. Website Publik SaaS

- [x] Landing page produk
- [x] Informasi paket layanan
- [x] Akses login dan pendaftaran tenant
- [x] Resolusi website sekolah berdasarkan subdomain

## 8. Keamanan, Privasi, dan Operasional

- [x] Isolasi tenant pada JWT, host, model, upload, dan dokumen privat
- [x] Refresh token dan reset token disimpan dalam bentuk hash serta dirotasi
- [x] Impersonasi dengan kode sekali pakai berumur pendek
- [x] CORS terbatas, security header, throttling, feature gate, dan subscription guard
- [x] Webhook pembayaran tervalidasi, idempoten, dan memeriksa nominal/referensi
- [x] Audit log mutasi dan kejadian pembayaran
- [x] Persetujuan privasi PPDB dan halaman kebijakan privasi
- [x] Health check, perintah kedaluwarsa langganan, panduan deployment, dan CI
- [x] Tes backend, migrasi SQLite, isolasi tenant, serta tes utilitas frontend
- [x] Kontrak OpenAPI untuk endpoint inti

## Rencana Berikutnya

Baseline SaaS pada repository telah tersedia. Berikut pengembangan lanjutan untuk memenuhi kebutuhan sekolah digital secara lebih menyeluruh. Seluruh butir di bawah masih berstatus rencana.

### 1. Komunikasi Sekolah dan Orang Tua

- [ ] Pesan dua arah antara guru dan orang tua
- [ ] Broadcast pengumuman berdasarkan sekolah atau kelas
- [ ] Notifikasi WhatsApp, email, dan dalam aplikasi
- [ ] Status pengumuman sudah dibaca
- [ ] Pengajuan izin sakit/tidak masuk dan konfirmasi penjemputan
- [ ] Kalender kegiatan serta pengingat otomatis

### 2. LMS dan Pembelajaran Digital

- [ ] Materi pembelajaran per kelas dan mata pelajaran
- [ ] Tugas, tenggat waktu, lampiran, dan pengumpulan tugas siswa
- [ ] Kuis atau asesmen sederhana dan bank soal
- [ ] Penilaian serta umpan balik guru
- [ ] Rekap ketuntasan pembelajaran
- [ ] Tautan sumber belajar dari Rumah Pendidikan

### 3. Kalender dan Penjadwalan Terpadu

- [ ] Kalender akademik, jadwal pelajaran, ujian, dan agenda sekolah
- [ ] Jadwal penggunaan ruangan dan fasilitas
- [ ] Deteksi bentrok guru, kelas, ruangan, dan waktu
- [ ] Kalender bersama untuk admin, guru, siswa, dan orang tua
- [ ] Pengingat jadwal otomatis

### 4. Kurikulum dan Modul Ajar

- [ ] Struktur kurikulum berdasarkan jenjang
- [ ] Capaian dan tujuan pembelajaran
- [ ] Modul ajar atau RPP
- [ ] Pemetaan materi terhadap jadwal KBM
- [ ] Jurnal keterlaksanaan dan supervisi kepala sekolah
- [ ] Fitur khusus PAUD: catatan anekdot, portofolio karya, dan capaian perkembangan

### 5. Penilaian dan E-Rapor

- [ ] Komponen dan bobot penilaian yang dapat dikonfigurasi
- [ ] Nilai formatif, sumatif, praktik, dan proyek
- [ ] Deskripsi capaian siswa dan leger nilai
- [ ] Proses kenaikan kelas dan kelulusan
- [ ] Template serta pencetakan rapor sekolah
- [ ] Validasi kepala sekolah, penguncian nilai, dan riwayat revisi

### 6. Absensi Modern

- [ ] Absensi melalui QR code atau PIN dinamis
- [ ] Mode kiosk untuk perangkat sekolah
- [ ] Absensi siswa per jam pelajaran
- [ ] Pengajuan dan persetujuan izin
- [ ] Notifikasi ketidakhadiran kepada orang tua
- [ ] Analitik keterlambatan, ketidakhadiran, dan rekap ekspor

### 7. Keuangan Sekolah Menyeluruh

- [ ] Jenis tagihan fleksibel di luar SPP
- [ ] Potongan, beasiswa, cicilan, denda, dan invoice gabungan beberapa anak
- [ ] Rekonsiliasi payment gateway dan mutasi bank
- [ ] Refund dan pembatalan transaksi
- [ ] Kas masuk, kas keluar, serta buku besar sederhana
- [ ] Laporan tunggakan, penerimaan, dan kwitansi digital
- [ ] Persetujuan berjenjang untuk pengeluaran

### 8. Manajemen Dokumen dan Persuratan

- [ ] Surat masuk, surat keluar, dan disposisi
- [ ] Penomoran otomatis berdasarkan klasifikasi surat
- [ ] Template dan tanda tangan elektronik
- [ ] Arsip dokumen dengan pencarian serta kontrol akses
- [ ] Pengingat masa berlaku izin dan dokumen akreditasi
- [ ] Berita acara, notulen, dan ekspor arsip akreditasi

### 9. Sarana, Inventaris, dan Peminjaman

- [ ] Data inventaris, lokasi, kondisi, dan penanggung jawab
- [ ] QR label aset
- [ ] Peminjaman perangkat dan ruangan
- [ ] Jadwal pemeliharaan serta laporan kerusakan
- [ ] Stok ATK dan barang habis pakai
- [ ] Riwayat pembelian dan penyusutan sederhana

### 10. Dashboard Mutu Kepala Sekolah

- [ ] KPI kehadiran, penerimaan siswa, tunggakan, dan beban mengajar
- [ ] Analisis ketuntasan belajar dan perkembangan siswa
- [ ] Pemantauan kelengkapan administrasi guru
- [ ] Deteksi risiko siswa tidak aktif atau sering absen
- [ ] Target, program kerja, dan tindak lanjut
- [ ] Alur perencanaan berbasis data: Identifikasi, Refleksi, dan Benahi

### 11. BK, Kesehatan, dan Perlindungan Anak

- [ ] Catatan konseling dengan hak akses khusus
- [ ] Pelaporan insiden dan pemantauan tindak lanjut
- [ ] Data alergi, kondisi medis penting, dan kontak darurat
- [ ] Catatan kunjungan UKS
- [ ] Persetujuan kegiatan dan prosedur penjemputan anak
- [ ] Pelaporan perundungan atau masalah keamanan secara rahasia

### 12. Pengembangan Guru

- [ ] Sasaran kinerja dan supervisi internal
- [ ] Observasi pembelajaran
- [ ] Riwayat pelatihan dan sertifikat
- [ ] Portofolio serta kebutuhan peningkatan kompetensi
- [ ] Berbagi materi dan praktik baik
- [ ] Tautan layanan pengembangan kompetensi Ruang GTK

### 13. Pusat Sinkronisasi Data Pendidikan

- [ ] Mapping siswa, GTK, rombel, kelas, dan mata pelajaran
- [ ] Validasi NPSN, NISN, dan data identitas
- [ ] Deteksi data ganda dan konflik data
- [ ] Import/export menggunakan format yang kompatibel dengan Dapodik
- [ ] Log sinkronisasi dan penyelesaian konflik
- [ ] Integrasi resmi Dapodik apabila akses web service telah disetujui

### 14. SSO, Identitas, dan Hak Akses Granular

- [ ] SSO Google, Microsoft, atau belajar.id jika integrasi resmi tersedia
- [ ] MFA untuk superadmin, admin, kepala sekolah, dan bendahara
- [ ] Delegasi operator tanpa berbagi password
- [ ] Permission granular berdasarkan jabatan, kelas, dan tanggung jawab
- [ ] Manajemen perangkat, sesi aktif, dan recovery code
- [ ] Notifikasi login mencurigakan

### Urutan Implementasi yang Disarankan

1. Komunikasi dan notifikasi
2. Kalender akademik terpadu
3. LMS, tugas, dan penilaian
4. E-Rapor
5. Keuangan sekolah lengkap
6. Hak akses granular dan MFA
7. Sinkronisasi atau ekspor Dapodik
8. Dokumen dan inventaris
9. Dashboard mutu sekolah
10. Fitur AI pendamping setelah fondasi data matang

---

_Terakhir diperbarui: 30 Juli 2026. Status disusun berdasarkan halaman frontend, route API, controller, model, dan migration yang tersedia di repository._
