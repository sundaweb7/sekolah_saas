import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Globe, CreditCard, Sparkles, FileText, ArrowRight,
  MapPin, BookOpen, CheckSquare, CheckCircle2, Award, Megaphone, UserPlus,
  Menu, X 
} from 'lucide-react';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#06050a] text-[#f3f4f6] font-sans selection:bg-[#aa8410] selection:text-white">
      <style>{`
        @keyframes float-slow-1 {
          0%, 100% { transform: translateY(0px) translateX(0px) scale(1); }
          50% { transform: translateY(-30px) translateX(15px) scale(1.1); }
        }
        @keyframes float-slow-2 {
          0%, 100% { transform: translateY(0px) translateX(0px) scale(1.05); }
          50% { transform: translateY(25px) translateX(-20px) scale(0.95); }
        }
        @keyframes grid-move {
          0% { transform: translateY(0); }
          100% { transform: translateY(50px); }
        }
        @keyframes pulse-galaxy {
          0%, 100% { opacity: 0.08; transform: scale(1); }
          50% { opacity: 0.14; transform: scale(1.08); }
        }
        .animate-float-1 {
          animation: float-slow-1 12s ease-in-out infinite;
        }
        .animate-float-2 {
          animation: float-slow-2 15s ease-in-out infinite;
        }
        .animate-pulse-galaxy {
          animation: pulse-galaxy 8s ease-in-out infinite;
        }
      `}</style>

      {/* Navbar */}
      <header className="border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[#aa8410] flex items-center justify-center text-white font-bold text-sm">P</div>
            <span className="font-bold text-lg tracking-tight text-white">PAUDKU.ID</span>
          </div>
          
          {/* Middle Nav Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-zinc-400">
            <a href="#" className="hover:text-white transition-colors">Home</a>
            <a href="#features" className="hover:text-white transition-colors">Fitur</a>
            <a href="#pricing" className="hover:text-white transition-colors">Harga</a>
            <a href="#testimonials" className="hover:text-white transition-colors">Testimoni</a>
          </nav>

          {/* Action Buttons (Desktop) */}
          <div className="hidden md:flex items-center gap-4">
            <Link to="/login" className="text-sm font-semibold text-zinc-400 hover:text-white transition-colors">
              Masuk
            </Link>
            <Link to="/login?register=true" className="rounded-lg bg-[#aa8410] px-4 py-2 text-sm font-semibold text-white hover:bg-[#c5a028] transition-all">
              Daftar Uji Coba Gratis
            </Link>
          </div>

          {/* Hamburger Icon (Mobile) */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1 text-zinc-400 hover:text-white transition-colors"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Dropdown Panel */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-zinc-900 bg-zinc-950 px-6 py-6 space-y-6 flex flex-col">
            <nav className="flex flex-col gap-4 text-sm font-semibold text-zinc-400">
              <a 
                href="#" 
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-white transition-colors"
              >
                Home
              </a>
              <a 
                href="#features" 
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-white transition-colors"
              >
                Fitur
              </a>
              <a 
                href="#pricing" 
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-white transition-colors"
              >
                Harga
              </a>
              <a 
                href="#testimonials" 
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-white transition-colors"
              >
                Testimoni
              </a>
            </nav>
            <div className="border-t border-zinc-900 pt-6 flex flex-col gap-3">
              <Link 
                to="/login" 
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 text-sm font-semibold text-zinc-400 hover:text-white transition-colors"
              >
                Masuk
              </Link>
              <Link 
                to="/login?register=true" 
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center rounded-lg bg-[#aa8410] py-2.5 text-sm font-semibold text-white hover:bg-[#c5a028] transition-all"
              >
                Daftar Uji Coba Gratis
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative py-28 md:py-36 overflow-hidden flex flex-col items-center justify-center text-center px-6">
        {/* Gold Dots Pattern Background */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#d4af37_1px,transparent_1px)] [background-size:16px_16px] z-0"></div>
        {/* Animated Galaxy Background Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(170,132,16,0.12)_0,transparent_70%)] animate-pulse-galaxy z-0" />
        
        {/* Rotating Tech Grid Pattern */}
        <div 
          className="absolute inset-0 bg-[linear-gradient(rgba(170,132,16,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(170,132,16,0.035)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)] z-0" 
          style={{ animation: 'grid-move 24s linear infinite' }}
        />

        {/* Floating Galaxy Particles */}
        <div className="absolute top-[15%] left-[15%] w-40 h-40 rounded-full bg-[#d4af37]/5 blur-3xl animate-float-1 z-0" />
        <div className="absolute bottom-[20%] right-[15%] w-60 h-60 rounded-full bg-[#aa8410]/5 blur-3xl animate-float-2 z-0" />
        <div className="absolute top-[30%] right-[25%] w-24 h-24 rounded-full bg-amber-500/5 blur-2xl animate-float-1 z-0" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#d4af37]/10 px-3 py-1 text-xs font-bold text-[#d4af37] uppercase tracking-wider border border-[#d4af37]/20">
            <Sparkles className="h-3.5 w-3.5" /> Platform SaaS Manajemen Sekolah No. 1 di Indonesia
          </span>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white leading-tight">
            Digitalkan Instansi <span className="text-[#d4af37]">Sekolah Anda</span> Dalam 5 Menit
          </h1>
          <p className="text-lg md:text-xl text-zinc-400 leading-relaxed">
            Kelola website profil sekolah, tagihan SPP digital, absensi guru GPS, absensi murid &amp; jurnal harian, hingga laporan perkembangan siswa untuk semua jenjang pendidikan (PAUD/TK, SD, SMP, SMA, SMK &amp; Pesantren) dalam satu platform terintegrasi.
          </p>
          <div className="pt-6 flex justify-center gap-4">
            <Link to="/login?register=true" className="rounded-lg bg-[#aa8410] px-6 py-3 text-sm font-semibold text-white hover:bg-[#c5a028] transition-all flex items-center gap-2 shadow-lg shadow-[#aa8410]/20">
              Mulai Uji Coba Gratis <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="#features" className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-6 py-3 text-sm font-semibold text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors">
              Lihat Fitur
            </a>
          </div>
        </div>
      </section>

      {/* Why Digitize Section */}
      <section className="border-t border-zinc-900 bg-zinc-950/30 py-20">
        <div className="max-w-6xl mx-auto px-6 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl font-bold text-white tracking-tight">Mengapa Sekolah Harus Didigitalisasi?</h2>
            <p className="text-zinc-400 text-sm">Transformasikan tata kelola lembaga pendidikan Anda untuk hasil akreditasi maksimal dan kemudahan layanan wali murid.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="rounded-2xl border border-zinc-900 bg-zinc-950/80 p-8 space-y-4 hover:border-zinc-800 transition-all">
              <div className="h-12 w-12 rounded-xl bg-[#d4af37]/10 text-[#d4af37] flex items-center justify-center">
                <Award className="h-6 w-6" />
              </div>
              <h3 className="font-extrabold text-white text-lg">Penunjang Akreditasi</h3>
              <p className="text-sm text-zinc-400 leading-relaxed font-light">
                Platform menyediakan pencatatan absensi guru terverifikasi koordinat GPS, rekap absensi murid, dan jurnal kelas mengajar harian yang tertata rapi sebagai berkas pendukung penilaian akreditasi sekolah secara riil.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-900 bg-zinc-950/80 p-8 space-y-4 hover:border-zinc-800 transition-all">
              <div className="h-12 w-12 rounded-xl bg-[#d4af37]/10 text-[#d4af37] flex items-center justify-center">
                <Megaphone className="h-6 w-6" />
              </div>
              <h3 className="font-extrabold text-white text-lg">Publikasi Kegiatan & Profil</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Tampilkan jati diri sekolah secara profesional melalui Website Company Profile mandiri. Publikasikan visi misi, struktur organisasi, galeri foto kegiatan, serta berita sekolah agar dipercaya oleh masyarakat umum.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-900 bg-zinc-950/80 p-8 space-y-4 hover:border-zinc-800 transition-all">
              <div className="h-12 w-12 rounded-xl bg-[#d4af37]/10 text-[#d4af37] flex items-center justify-center">
                <UserPlus className="h-6 w-6" />
              </div>
              <h3 className="font-extrabold text-white text-lg">PPDB Online Praktis</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Mempermudah pendaftaran siswa baru secara online. Memotong jalur administrasi fisik yang rumit, memberikan kemudahan wali murid mendaftar dari rumah, dan berkas KK/Akta langsung terarsip di sistem secara instan.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-20 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h2 className="text-3xl font-bold text-white tracking-tight">Satu Platform, Semua Solusi Sekolah</h2>
          <p className="text-zinc-400 text-sm">Fitur premium lengkap yang dirancang khusus untuk mempercepat transformasi digital sekolah Anda.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-6 space-y-4 hover:border-[#d4af37]/40 transition-all duration-300">
            <div className="h-10 w-10 rounded-lg bg-[#d4af37]/10 text-[#d4af37] flex items-center justify-center">
              <Globe className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-white text-lg">Website Company Profile Sekolah</h3>
            <p className="text-sm text-zinc-400 leading-relaxed font-light">
              Setiap sekolah mendapatkan subdomain unik (`sekolah.paudku.id`). Dilengkapi custom tema warna, visi misi, profil lembaga, galeri foto kegiatan, dan berita terintegrasi.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-850 bg-zinc-950/40 p-6 space-y-4 hover:border-[#d4af37]/40 transition-all duration-300">
            <div className="h-10 w-10 rounded-lg bg-[#d4af37]/10 text-[#d4af37] flex items-center justify-center">
              <CreditCard className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-white text-lg">Fitur SPP Siswa</h3>
            <p className="text-sm text-zinc-400 leading-relaxed font-light">
              Manajemen penagihan SPP bulanan siswa otomatis, sistem konfirmasi pembayaran dari wali murid, rekapitulasi data pembayaran kelas, dan cetak kuitansi digital.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-6 space-y-4 hover:border-[#d4af37]/40 transition-all duration-300">
            <div className="h-10 w-10 rounded-lg bg-[#d4af37]/10 text-[#d4af37] flex items-center justify-center">
              <MapPin className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-white text-lg">Fitur Absensi Guru GPS</h3>
            <p className="text-sm text-zinc-400 leading-relaxed font-light">
              Pencatatan kehadiran mandiri guru (Check-In) berbasis titik koordinat lokasi GPS secara real-time langsung melalui browser handphone/perangkat guru.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-850 bg-zinc-950/40 p-6 space-y-4 hover:border-[#d4af37]/40 transition-all duration-300">
            <div className="h-10 w-10 rounded-lg bg-[#d4af37]/10 text-[#d4af37] flex items-center justify-center">
              <CheckSquare className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-white text-lg">Fitur Absensi Siswa &amp; Jurnal</h3>
            <p className="text-sm text-zinc-400 leading-relaxed font-light">
              Guru mencatat kehadiran harian siswa di kelas dan menulis jurnal harian mengajar kelas (mata pelajaran/aktivitas) dalam alur sistematis yang saling terhubung.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-6 space-y-4 hover:border-[#d4af37]/40 transition-all duration-300">
            <div className="h-10 w-10 rounded-lg bg-[#d4af37]/10 text-[#d4af37] flex items-center justify-center">
              <BookOpen className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-white text-lg">Laporan / Perkembangan Siswa</h3>
            <p className="text-sm text-zinc-400 leading-relaxed font-light">
              Pencatatan perkembangan harian siswa (Daily Report) beserta lampiran foto aktivitas, dan rekapitulasi penilaian rapor akhir semester anak yang rapi.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-850 bg-zinc-950/40 p-6 space-y-4 hover:border-[#d4af37]/40 transition-all duration-300">
            <div className="h-10 w-10 rounded-lg bg-[#d4af37]/10 text-[#d4af37] flex items-center justify-center">
              <FileText className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-white text-lg">PPDB Online</h3>
            <p className="text-sm text-zinc-400 leading-relaxed font-light">
              Penerimaan peserta didik baru secara mandiri melalui formulir online wali murid, unggah KK/akta, pelacakan status registrasi, verifikasi admin, hingga bukti daftar.
            </p>
          </div>
        </div>
      </section>

      {/* Subscription Pricing Section */}
      <section id="pricing" className="max-w-6xl mx-auto px-6 py-20 border-t border-zinc-900 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h2 className="text-3xl font-bold text-white tracking-tight">Pilihan Paket Langganan SaaS</h2>
          <p className="text-zinc-400 text-sm">Skalakan operasional sekolah Anda dengan harga transparan tanpa biaya tersembunyi.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Basic */}
          <div className="rounded-2xl border border-zinc-900 bg-zinc-950 p-8 flex flex-col justify-between">
            <div className="space-y-4">
              <h4 className="font-bold text-lg text-white uppercase">Basic</h4>
              <p className="text-xs text-zinc-500">Esensial profile dan penerimaan siswa baru.</p>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-white">
                  Rp 25.000<span className="text-xs font-normal text-zinc-550"> / bulan</span>
                </div>
                <div className="text-xs text-[#d4af37] font-semibold">
                  Rp 300.000 / tahun
                </div>
              </div>
              <ul className="space-y-2.5 text-xs text-zinc-400 pt-6 border-t border-zinc-900">
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#d4af37]" /> Website Company Profile Sekolah</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#d4af37]" /> PPDB Online Mandiri</li>
              </ul>
            </div>
            <Link to="/login?register=true" className="w-full text-center mt-8 rounded-lg bg-zinc-900 hover:bg-zinc-800 py-2.5 text-sm font-semibold text-white transition-colors">
              Pilih Paket Basic
            </Link>
          </div>

          {/* Standard */}
          <div className="rounded-2xl border border-[#d4af37] bg-zinc-950 p-8 flex flex-col justify-between relative">
            <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-[#aa8410] px-3 py-1 text-[10px] font-bold text-white uppercase tracking-wider">
              Paling Populer
            </span>
            <div className="space-y-4">
              <h4 className="font-bold text-lg text-white uppercase">Standard</h4>
              <p className="text-xs text-zinc-500">Solusi administrasi, SPP, dan kehadiran lengkap.</p>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-white">
                  Rp 50.000<span className="text-xs font-normal text-zinc-550"> / bulan</span>
                </div>
                <div className="text-xs text-[#d4af37] font-semibold">
                  Rp 600.000 / tahun
                </div>
              </div>
              <ul className="space-y-2.5 text-xs text-zinc-400 pt-6 border-t border-zinc-900">
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#d4af37]" /> Semua Fitur Paket Basic</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#d4af37]" /> Fitur Absensi Guru (GPS) & Siswa</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#d4af37]" /> Fitur SPP Siswa Digital</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#d4af37]" /> Maksimal 100 Siswa Aktif</li>
              </ul>
            </div>
            <Link to="/login?register=true" className="w-full text-center mt-8 rounded-lg bg-[#aa8410] hover:bg-[#c5a028] py-2.5 text-sm font-semibold text-white transition-all shadow-md shadow-[#aa8410]/10">
              Pilih Paket Standard
            </Link>
          </div>

          {/* Premium */}
          <div className="rounded-2xl border border-zinc-900 bg-zinc-950 p-8 flex flex-col justify-between">
            <div className="space-y-4">
              <h4 className="font-bold text-lg text-white uppercase">Premium</h4>
              <p className="text-xs text-zinc-500">Kapasitas besar dengan dukungan Domain Custom .sch.id khusus Paket Tahunan.</p>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-white">
                  Rp 100.000<span className="text-xs font-normal text-zinc-555"> / bulan</span>
                </div>
                <div className="text-xs text-[#d4af37] font-semibold">
                  Rp 1.000.000 / tahun
                </div>
              </div>
              <ul className="space-y-2.5 text-xs text-zinc-400 pt-6 border-t border-zinc-900">
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#d4af37]" /> Semua Fitur Paket Standar</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#d4af37]" /> Maksimal 300 Siswa Aktif</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#d4af37]" /> Domain Custom (.sch.id) khusus Paket Tahunan</li>
              </ul>
            </div>
            <Link to="/login?register=true" className="w-full text-center mt-8 rounded-lg bg-zinc-900 hover:bg-zinc-800 py-2.5 text-sm font-semibold text-white transition-colors">
              Pilih Paket Premium
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="border-t border-zinc-900 bg-zinc-950/30 py-20">
        <div className="max-w-6xl mx-auto px-6 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl font-bold text-white tracking-tight">Dipercaya Oleh Lembaga Pendidikan</h2>
            <p className="text-zinc-400 text-sm">Apa kata mereka yang telah mendigitalkan sekolahnya bersama PAUDKU.ID?</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="rounded-2xl border border-zinc-900 bg-zinc-950 p-6 space-y-4 hover:border-zinc-800 transition-all flex flex-col justify-between">
              <p className="text-xs text-zinc-400 leading-relaxed italic">
                "Semenjak menggunakan PAUDKU.ID, penerimaan murid baru (PPDB) menjadi sangat mudah dan cepat. Pendidik kami juga sangat terbantu dengan adanya fitur absensi GPS mandiri langsung dari handphone."
              </p>
              <div className="flex items-center gap-3 pt-4 border-t border-zinc-900">
                <div className="h-10 w-10 rounded-full bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37] font-black text-xs border border-[#d4af37]/20">
                  BM
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Bunda Melati</h4>
                  <p className="text-[10px] text-zinc-500">Kepala Sekolah, TK Melati Indah</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#d4af37]/30 bg-zinc-950 p-6 space-y-4 hover:border-zinc-800 transition-all flex flex-col justify-between">
              <p className="text-xs text-zinc-400 leading-relaxed italic">
                "Fitur penagihan SPP otomatis dan rekap laporan perkembangan harian anak sangat disukai oleh wali murid. Pengarsipan dokumen dan absensi kehadiran untuk penunjang berkas akreditasi jadi sangat rapi."
              </p>
              <div className="flex items-center gap-3 pt-4 border-t border-zinc-900">
                <div className="h-10 w-10 rounded-full bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37] font-black text-xs border border-[#d4af37]/20">
                  BS
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Bunda Sarah</h4>
                  <p className="text-[10px] text-zinc-500">Kepala Sekolah, TK Bintang Harapan</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-900 bg-zinc-950 p-6 space-y-4 hover:border-zinc-800 transition-all flex flex-col justify-between">
              <p className="text-xs text-zinc-400 leading-relaxed italic">
                "Manajemen yayasan kami yang menaungi beberapa sekolah sekarang terpantau lengkap dan praktis dalam satu platform. Sangat menghemat biaya operasional tata usaha dan cetak dokumen."
              </p>
              <div className="flex items-center gap-3 pt-4 border-t border-zinc-900">
                <div className="h-10 w-10 rounded-full bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37] font-black text-xs border border-[#d4af37]/20">
                  PB
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Pak Budi</h4>
                  <p className="text-[10px] text-zinc-500">Ketua Yayasan Mentari Bangsa</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-12 bg-zinc-950 text-center text-sm text-zinc-500">
        <p>&copy; {new Date().getFullYear()} PAUDKU.ID SaaS Platform. Hak Cipta Dilindungi Undang-Undang.</p>
      </footer>
    </div>
  );
}
