import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../config/axios';
import TenantWebsiteLayout from '../../layouts/TenantWebsiteLayout';
import { Calendar, Image as ImageIcon, MapPin, Phone, Mail, User, CheckCircle, Volume2, ArrowRight } from 'lucide-react';

/**
 * Returns the backend base URL for serving uploaded files.
 * Strips subdomain so images always resolve to the correct backend host.
 * e.g. tkmelati.localhost → http://localhost:8080
 *      sub.paudku.id     → http://paudku.id (or configured VITE_BACKEND_URL)
 */
function getBackendBase() {
  if (import.meta.env.VITE_BACKEND_URL) return import.meta.env.VITE_BACKEND_URL;
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  const lastPart = parts[parts.length - 1];
  // If the TLD is 'localhost' or the host is already a plain IP/localhost, use it directly
  if (lastPart === 'localhost' || lastPart === '127' || parts.length === 1) {
    return 'http://localhost:8080';
  }
  // Production: strip subdomain → keep last 2 parts (e.g. paudku.id)
  const baseHost = parts.slice(-2).join('.');
  return `http://${baseHost}`;
}

const BACKEND_BASE = getBackendBase();

function ModernTemplate({ 
  school, settings, profile, news, events, announcements, gallery, teachers, 
  schoolSlug, heroImage, principalPhoto, contactInfo, handleMessageSubmit, 
  formName, setFormName, formMessage, setFormMessage, formSuccess 
}) {
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const ppdbLink = isLocalhost ? `/school/${schoolSlug}/ppdb` : '/ppdb';

  return (
    <div className="w-full bg-[#fcfcfc] text-[#1a1a1a] selection:bg-zinc-950 selection:text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      
      {/* Announcements Alert Bar */}
      {announcements.length > 0 && (
        <div className="bg-zinc-950 text-white py-3 px-6 border-b border-zinc-800">
          <div className="max-w-6xl mx-auto flex items-center gap-2 text-xs font-semibold uppercase tracking-widest">
            <Volume2 className="h-4 w-4 shrink-0 text-amber-400" />
            <span className="text-amber-400">Pengumuman:</span>
            <span className="truncate normal-case font-normal text-zinc-350 ml-1 flex-1">{announcements[0].title}</span>
          </div>
        </div>
      )}

      {/* Hero Section - Modern Full Cover */}
      <header id="hero" className="relative h-[85vh] flex items-center justify-center overflow-hidden bg-zinc-950">
        <div className="absolute inset-0 z-0">
          <img src={heroImage} alt="School Banner" className="h-full w-full object-cover brightness-[0.35]" />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
        </div>
        <div className="relative z-10 text-center max-w-4xl px-6 space-y-6">
          <span className="inline-block rounded border border-white/20 bg-white/5 backdrop-blur-md px-3 py-1 text-xs font-semibold uppercase tracking-widest text-zinc-300">
            Official Portal
          </span>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white leading-tight">
            {school.name}
          </h1>
          <p className="text-base md:text-xl text-zinc-300 max-w-2xl mx-auto font-light leading-relaxed">
            {profile?.hero_tagline || 'Mendidik anak usia dini dengan cinta, kreatifitas, dan akhlak mulia.'}
          </p>
          <div className="pt-6 flex flex-wrap justify-center gap-4">
            <Link 
              to={ppdbLink} 
              className="inline-flex items-center gap-2 rounded bg-white hover:bg-zinc-150 px-8 py-4 text-xs font-bold uppercase tracking-widest text-black transition-all shadow-xl"
            >
              Pendaftaran PPDB <ArrowRight className="h-4 w-4" />
            </Link>
            <a 
              href="#profil" 
              className="inline-flex items-center gap-2 rounded border border-white/20 hover:border-white/40 bg-white/5 backdrop-blur-md px-8 py-4 text-xs font-bold uppercase tracking-widest text-white transition-all"
            >
              Profil Sekolah
            </a>
          </div>
        </div>
      </header>

      {/* Profil Section - Modern Geometric */}
      <section id="profil" className="py-28 bg-[#fafafa]">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">About Us</span>
              <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 leading-tight">
                Membangun Generasi Unggul Sejak Usia Dini
              </h2>
            </div>
            
            <div className="border-l-4 border-zinc-900 pl-6 py-1">
              <p className="text-sm text-zinc-500 leading-relaxed italic">
                "{profile?.principal_welcome_message || 'Selamat datang di website resmi kami. Kami berkomitmen untuk membimbing tumbuh kembang anak didik dengan pola pengajaran aktif, kreatif, ceria, dan berkarakter mulia.'}"
              </p>
              <p className="text-xs font-bold text-zinc-800 mt-2">&mdash; {profile?.principal_name || 'Kepala Sekolah'}</p>
            </div>

            <p className="text-sm text-zinc-650 leading-relaxed">
              {profile?.history || 'Sekolah kami didirikan untuk memberikan fondasi belajar yang menyenangkan sejak usia dini demi kesiapan akademis dan mental masa depan.'}
            </p>

            {/* Clean minimalist stats */}
            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-zinc-200">
              <div>
                <p className="text-3xl font-extrabold text-zinc-950">{teachers.length}</p>
                <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 mt-1">Guru Pendidik</p>
              </div>
              <div>
                <p className="text-3xl font-extrabold text-zinc-950">{news.length}</p>
                <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 mt-1">Berita Aktif</p>
              </div>
              <div>
                <p className="text-3xl font-extrabold text-zinc-950">{gallery.length}</p>
                <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 mt-1">Galeri Foto</p>
              </div>
            </div>
          </div>

          <div className="relative flex justify-center">
            {/* Minimalist modern frame */}
            <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl border border-zinc-250 bg-white p-2">
              <img 
                src={principalPhoto} 
                alt="Kepala Sekolah" 
                className="w-full h-96 object-cover rounded-xl" 
                loading="lazy" 
              />
            </div>
          </div>
        </div>
      </section>

      {/* Visi Misi Section - High Contrast */}
      <section id="visi-misi" className="py-28 bg-zinc-950 text-white">
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-3 gap-12 items-center">
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Vision & Mission</span>
            <h2 className="text-3xl font-bold text-white leading-tight">
              Tujuan Utama Lembaga Kami
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed font-light">
              Misi kami berfokus pada keseimbangan kecerdasan kognitif, emosional, dan karakter anak didik.
            </p>
          </div>

          <div className="md:col-span-2 space-y-6">
            <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Visi Sekolah</span>
              <p className="text-base md:text-lg font-medium text-zinc-200 leading-relaxed">
                {profile?.vision || 'Mewujudkan anak usia dini yang cerdas, mandiri, kreatif, aktif dan berkarakter mulia.'}
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Misi Sekolah</span>
              <p className="text-sm text-zinc-350 leading-relaxed whitespace-pre-line font-light">
                {profile?.mission || '1. Menyelenggarakan proses pembelajaran yang kreatif dan ceria.\n2. Menanamkan nilai luhur budi pekerti.\n3. Mengembangkan kemandirian fisik anak.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Galeri Section - Grid */}
      <section id="galeri" className="py-28 bg-white">
        <div className="max-w-6xl mx-auto px-6 space-y-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-zinc-100 pb-6">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Media</span>
              <h2 className="text-3xl font-bold text-zinc-950">Galeri Dokumentasi</h2>
            </div>
            <p className="text-sm text-zinc-500 font-light">Aktivitas pembelajaran dan bermain putra-putri kami</p>
          </div>

          {gallery.length === 0 ? (
            <div className="text-center py-12 text-zinc-400 text-sm">Belum ada dokumentasi galeri yang diunggah.</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {gallery.slice(0, 6).map((photo) => (
                <div key={photo.id} className="group relative aspect-video rounded-xl overflow-hidden border border-zinc-200 bg-zinc-50">
                  <img 
                    src={`${BACKEND_BASE}/${photo.image}`} 
                    alt={photo.title} 
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" 
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                    <span className="text-xs font-semibold text-white truncate">{photo.title}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Daftar Guru Section - Horizontal Card Slider */}
      {teachers.length > 0 && (
        <section id="guru" className="py-24 bg-white border-t border-zinc-100">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-zinc-100 pb-6 mb-12">
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Tim Pengajar</span>
                <h2 className="text-3xl font-bold text-zinc-950">Daftar Guru &amp; Tenaga Pendidik</h2>
                <p className="text-sm text-zinc-500 font-light">Tenaga pendidik kami yang berdedikasi dan berpengalaman</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
              {teachers.map((teacher) => {
                const photoUrl = teacher.photo
                  ? `${BACKEND_BASE}/${teacher.photo}`
                  : `https://ui-avatars.com/api/?name=${encodeURIComponent(teacher.full_name)}&background=18181b&color=fff&size=300`;
                return (
                  <div key={teacher.id} className="group flex flex-col bg-[#fafafa] rounded-2xl overflow-hidden border border-zinc-200 hover:border-zinc-300 hover:shadow-lg transition-all duration-300">
                    <div className="relative overflow-hidden aspect-[3/4] bg-zinc-100">
                      <img
                        src={photoUrl}
                        alt={teacher.full_name}
                        className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    <div className="p-4 space-y-0.5 border-t border-zinc-200">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                        {teacher.position || teacher.subject || 'Guru'}
                      </p>
                      <p className="text-sm font-bold text-zinc-900 leading-snug line-clamp-2">
                        {teacher.full_name}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Berita Section - Modern Minimalist Cards */}
      <section id="berita" className="py-28 bg-[#fafafa] border-y border-zinc-100">
        <div className="max-w-6xl mx-auto px-6 space-y-12">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Update</span>
            <h2 className="text-3xl font-bold text-zinc-950">Berita Terbaru</h2>
          </div>

          {/* Category Filters */}
          {categories && categories.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2 pb-6">
              <button
                onClick={() => setSelectedCategoryId('all')}
                className={`rounded-full px-5 py-2 text-xs font-bold transition-all duration-300 ${
                  selectedCategoryId === 'all'
                    ? 'bg-zinc-950 text-white shadow-md'
                    : 'bg-white border border-zinc-200 text-zinc-650 hover:border-zinc-300'
                }`}
              >
                Semua Berita
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`rounded-full px-5 py-2 text-xs font-bold transition-all duration-300 ${
                    String(selectedCategoryId) === String(cat.id)
                      ? 'bg-zinc-950 text-white shadow-md'
                      : 'bg-white border border-zinc-200 text-zinc-650 hover:border-zinc-300'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}

          {news.length === 0 ? (
            <div className="text-center py-12 text-zinc-450 text-sm font-light">Tidak ada berita yang diterbitkan dalam kategori ini.</div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8">
              {news.map((item) => (
                <Link key={item.id} to={`/school/${schoolSlug}/news/${item.slug || item.id}`} className="group bg-white rounded-xl overflow-hidden border border-zinc-200 hover:border-zinc-300 hover:shadow-md transition-all flex flex-col justify-between h-full">
                  <div>
                    <div className="h-48 w-full overflow-hidden bg-zinc-100">
                      {item.image ? (
                        <img 
                          src={`${BACKEND_BASE}/${item.image}`} 
                          alt={item.title} 
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" 
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-zinc-300">
                          <ImageIcon className="h-10 w-10" />
                        </div>
                      )}
                    </div>
                    <div className="p-6 space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-bold text-zinc-450 uppercase tracking-widest">
                        <span>{new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        {item.category_name && (
                          <span className="bg-zinc-100 px-2 py-0.5 rounded text-[8px] tracking-widest text-zinc-650">{item.category_name}</span>
                        )}
                      </div>
                      <h3 className="font-bold text-zinc-950 text-base line-clamp-2 leading-snug group-hover:text-zinc-600 transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-xs text-zinc-500 leading-relaxed line-clamp-3 font-light">
                        {item.content}
                      </p>
                    </div>
                  </div>
                  <div className="px-6 pb-5">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-zinc-800 uppercase tracking-widest hover:underline">
                      Baca Selengkapnya <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Agenda Section - Modern Row List */}
      <section id="agenda" className="py-28 bg-white">
        <div className="max-w-4xl mx-auto px-6 space-y-12">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Events</span>
            <h2 className="text-3xl font-bold text-zinc-950">Agenda & Kegiatan</h2>
          </div>

          {events.length === 0 ? (
            <div className="text-center py-12 text-zinc-400 text-sm">Belum ada agenda yang dijadwalkan.</div>
          ) : (
            <div className="space-y-4 max-w-2xl mx-auto">
              {events.map((event) => (
                <div key={event.id} className="bg-white border border-zinc-200 flex items-center gap-5 p-5 rounded-xl hover:border-zinc-300 transition-all">
                  <div className="flex-shrink-0 w-12 h-12 rounded bg-zinc-100 flex items-center justify-center text-zinc-800">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-zinc-900 text-sm md:text-base truncate">{event.title}</p>
                    <p className="text-xs text-zinc-500 mt-1">{event.event_date}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* PPDB Section - Clean CTA Banner */}
      <section id="ppdb" className="py-28 bg-[#fafafa]">
        <div className="max-w-6xl mx-auto px-6 py-16 rounded-2xl bg-zinc-950 text-white relative overflow-hidden border border-zinc-800 shadow-2xl">
          <div className="grid md:grid-cols-2 gap-12 items-center relative z-10">
            <div className="space-y-6">
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">New Registration</span>
              <h2 className="text-3xl md:text-4xl font-bold text-white">
                Penerimaan Peserta Didik Baru
              </h2>
              <p className="text-sm text-zinc-400 leading-relaxed font-light">
                {profile?.ppdb_banner_text || 'Mari daftarkan putra-putri Anda segera. Kami menyediakan pendaftaran online yang fleksibel dan instan untuk kenyamanan Anda.'}
              </p>
              
              <ul className="space-y-3 font-light text-zinc-300">
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-sm">Isi data formulir secara online kapan saja</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-sm">Pantau status seleksi berkas instan</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-sm">Kurikulum modern yang holistik</span>
                </li>
              </ul>

              <div className="pt-4">
                <Link 
                  to={ppdbLink} 
                  className="inline-block rounded bg-white hover:bg-zinc-150 px-8 py-3.5 text-xs font-bold uppercase tracking-widest text-black transition-all"
                >
                  Daftar Sekarang
                </Link>
              </div>
            </div>

            <div className="relative flex justify-center">
              <div className="w-full max-w-sm rounded-xl overflow-hidden shadow-2xl border border-zinc-800">
                <img 
                  src={heroImage} 
                  alt="PPDB Banner" 
                  className="w-full h-72 object-cover brightness-[0.7]" 
                  loading="lazy" 
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Kontak Section - Modern Clean Grid */}
      <section id="kontak" className="py-28 bg-white border-t border-zinc-200">
        <div className="max-w-6xl mx-auto px-6 space-y-12">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Contact</span>
            <h2 className="text-3xl font-bold text-zinc-950">Lokasi & Hubungi Kami</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-[#fafafa] border border-zinc-200 p-8 rounded-xl text-center space-y-4">
              <MapPin className="w-8 h-8 mx-auto text-zinc-900" />
              <h4 className="font-bold text-zinc-900 text-sm">Alamat Sekolah</h4>
              <p className="text-xs text-zinc-500 leading-relaxed font-light">{contactInfo.address}</p>
            </div>

            <div className="bg-[#fafafa] border border-zinc-200 p-8 rounded-xl text-center space-y-4">
              <Phone className="w-8 h-8 mx-auto text-zinc-900" />
              <h4 className="font-bold text-zinc-900 text-sm">Nomor Telepon</h4>
              <p className="text-xs text-zinc-500 leading-relaxed font-light">{contactInfo.phone}</p>
            </div>

            <div className="bg-[#fafafa] border border-zinc-200 p-8 rounded-xl text-center space-y-4">
              <Mail className="w-8 h-8 mx-auto text-zinc-900" />
              <h4 className="font-bold text-zinc-900 text-sm">Alamat Email</h4>
              <p className="text-xs text-zinc-500 leading-relaxed font-light">{contactInfo.email}</p>
            </div>
          </div>

          {/* Map Frame */}
          {settings?.google_maps_iframe && (
            <div className="rounded-xl overflow-hidden border border-zinc-200 shadow-sm h-96 w-full bg-zinc-100 mt-12">
              <div dangerouslySetInnerHTML={{ __html: settings.google_maps_iframe }} className="w-full h-full" />
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleMessageSubmit} id="contact-form" className="mt-16 max-w-lg mx-auto space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-center text-zinc-800 mb-6">Hubungi Admin</h3>
            <div>
              <input 
                type="text" 
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Nama Lengkap Anda"
                className="w-full px-4 py-3 rounded-lg border border-zinc-200 bg-white focus:border-zinc-900 outline-none text-sm text-zinc-700" 
              />
            </div>
            <div>
              <textarea 
                rows="4" 
                required
                value={formMessage}
                onChange={(e) => setFormMessage(e.target.value)}
                placeholder="Tulis Pesan Anda di Sini..."
                className="w-full px-4 py-3 rounded-lg border border-zinc-200 bg-white focus:border-zinc-900 outline-none text-sm text-zinc-700"
              />
            </div>
            <button 
              type="submit" 
              className="w-full py-3.5 rounded bg-zinc-950 hover:bg-zinc-800 font-bold text-xs uppercase tracking-widest text-white transition-colors"
            >
              Kirim Pesan
            </button>
            {formSuccess && (
              <p className="text-center text-xs text-green-650 font-semibold mt-2">Pesan Anda berhasil dikirim! ✨</p>
            )}
          </form>

        </div>
      </section>

    </div>
  );
}

function SchoolHomeContent() {
  const { schoolSlug } = useParams();
  const [data, setData] = useState(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');
  const [formName, setFormName] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);

  useEffect(() => {
    // Inject Fonts
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Fraunces:wght@700;900&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    const loadData = async () => {
      try {
        const host = window.location.hostname;
        let subdomain = host.split('.')[0];
        if (subdomain === 'localhost' || subdomain === '127') {
          subdomain = schoolSlug || 'tkmelati';
        }
        const response = await api.get('/tenant/profile', {
          headers: {
            'X-School-ID': subdomain
          }
        });
        setData(response.data);
      } catch (err) {
        console.error(err);
      }
    };
    loadData();

    return () => {
      document.head.removeChild(link);
    };
  }, [schoolSlug]);

  if (!data) return null;

  const { school, settings, profile, news, categories, events, announcements, gallery, teachers } = data;

  const filteredNews = selectedCategoryId === 'all' 
    ? news 
    : news.filter(item => String(item.category_id) === String(selectedCategoryId));

  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const ppdbLink = isLocalhost ? `/school/${schoolSlug}/ppdb` : '/ppdb';

  const heroImage = settings?.hero_banner_image 
    ? `${BACKEND_BASE}/${settings.hero_banner_image}` 
    : 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=80';

  const principalPhoto = profile?.principal_photo
    ? `${BACKEND_BASE}/${profile.principal_photo}`
    : 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80';

  const contactInfo = settings?.contact_info || {
    phone: '(021) 1234-5678',
    email: 'info@school.sch.id',
    address: 'Jl. Mawar Indah No. 12, Jakarta, Indonesia'
  };

  const handleMessageSubmit = (e) => {
    e.preventDefault();
    setFormName('');
    setFormMessage('');
    setFormSuccess(true);
    setTimeout(() => setFormSuccess(false), 4000);
  };

  // CONDITIONAL RENDERING BASED ON CHOSEN TEMPLATE STYLE
  if (settings?.theme_template === 'modern') {
    return (
      <ModernTemplate 
        school={school}
        settings={settings}
        profile={profile}
        news={filteredNews}
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        setSelectedCategoryId={setSelectedCategoryId}
        events={events}
        announcements={announcements}
        gallery={gallery}
        teachers={teachers}
        schoolSlug={schoolSlug}
        heroImage={heroImage}
        principalPhoto={principalPhoto}
        contactInfo={contactInfo}
        handleMessageSubmit={handleMessageSubmit}
        formName={formName}
        setFormName={setFormName}
        formMessage={formMessage}
        setFormMessage={setFormMessage}
        formSuccess={formSuccess}
      />
    );
  }

  return (
    <div className="w-full bg-[#ffffff] text-[#111111] selection:bg-[#d4af37] selection:text-black" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      
      {/* Announcements Alert Bar */}
      {announcements.length > 0 && (
        <div className="bg-[#111111] text-[#d4af37] py-2.5 px-6 border-b border-[#d4af37]/20">
          <div className="max-w-6xl mx-auto flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
            <Volume2 className="h-4 w-4 shrink-0 text-[#d4af37]" />
            <span className="text-white">Pengumuman:</span>
            <span className="truncate normal-case font-normal text-sm ml-1 flex-1 text-[#d4af37]">{announcements[0].title}</span>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <header id="hero" className="relative pt-28 pb-20 md:pt-36 md:pb-28 overflow-hidden bg-[#111111] border-b border-[#d4af37]/20">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#d4af37_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center relative z-10">
          <div className="space-y-6">
            <span className="inline-block rounded-full bg-[#d4af37]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[#d4af37] border border-[#d4af37]/30">Website Resmi</span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight" style={{ fontFamily: "'Fraunces', serif" }}>
              {school.name}
            </h1>
            <p className="text-base md:text-lg text-zinc-300 leading-relaxed font-normal">
              {profile?.hero_tagline && profile.hero_tagline.trim() !== "" 
                ? profile.hero_tagline 
                : 'Tempat terbaik bagi putra-putri Anda untuk belajar, bermain, dan berkembang dalam lingkungan yang aman, nyaman, dan penuh kasih sayang.'}
            </p>
            <div className="pt-2 flex flex-wrap gap-4">
              <Link 
                to={ppdbLink} 
                className="inline-block rounded-full bg-[#d4af37] hover:bg-[#b38f1d] px-8 py-3.5 text-sm font-bold text-white transition-all duration-300 hover:scale-105 shadow-lg shadow-[#d4af37]/20"
              >
                Pendaftaran PPDB Online
              </Link>
              <a 
                href="#profil" 
                className="inline-block rounded-full border border-zinc-700 hover:border-zinc-500 bg-white/5 px-8 py-3.5 text-sm font-bold text-white transition-all duration-300"
              >
                Profil Sekolah
              </a>
            </div>
          </div>

          <div className="relative flex justify-center">
            <div className="w-full max-w-md rounded-[2rem] overflow-hidden shadow-2xl transition-transform duration-500 border border-zinc-800 bg-[#1a1a1a] p-2">
              <img 
                src={heroImage} 
                alt={school.name} 
                className="w-full h-80 object-cover rounded-[1.8rem]" 
                loading="lazy" 
              />
            </div>
          </div>
        </div>
      </header>

      {/* Profil Section */}
      <section id="profil" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
          <div className="relative flex justify-center">
            <div className="w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl transition-transform duration-500 border border-zinc-150 bg-white p-2">
              <img 
                src={principalPhoto} 
                alt="Kepala Sekolah" 
                className="w-full h-80 object-cover rounded-[1.8rem]" 
                loading="lazy" 
              />
            </div>
          </div>

          <div className="space-y-6">
            <span className="text-xs font-bold uppercase tracking-widest text-[#d4af37] border-b-2 border-[#d4af37] pb-1">Mengenal Kami</span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#111111] leading-tight" style={{ fontFamily: "'Fraunces', serif" }}>
              Sambutan Kepala Sekolah
            </h2>
            <p className="text-sm text-zinc-650 leading-relaxed italic border-l-4 border-[#d4af37] pl-4">
              "{profile?.principal_welcome_message || 'Selamat datang di website resmi kami. Kami berkomitmen untuk membimbing tumbuh kembang anak didik dengan pola pengajaran aktif, kreatif, ceria, dan berkarakter mulia.'}"
            </p>
            
            <div className="pt-4">
              <h3 className="font-bold text-[#111111] mb-2" style={{ fontFamily: "'Fraunces', serif" }}>Sejarah & Profil Singkat</h3>
              <p className="text-sm text-zinc-650 leading-relaxed font-light">
                {profile?.history || 'Sekolah kami didirikan untuk memberikan fondasi belajar yang menyenangkan sejak usia dini demi kesiapan akademis dan mental masa depan.'}
              </p>
            </div>

            {/* Stats Cards from Template style */}
            <div className="mt-8 grid grid-cols-3 gap-4 text-center">
              <div className="bg-[#fafafa] border border-zinc-150 p-4 rounded-2xl shadow-sm">
                <p className="text-2xl font-black text-[#d4af37]" style={{ fontFamily: "'Fraunces', serif" }}>{teachers.length}</p>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Guru Pendidik</p>
              </div>
              <div className="bg-[#fafafa] border border-zinc-150 p-4 rounded-2xl shadow-sm">
                <p className="text-2xl font-black text-[#d4af37]" style={{ fontFamily: "'Fraunces', serif" }}>{news.length}</p>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Berita Kegiatan</p>
              </div>
              <div className="bg-[#fafafa] border border-zinc-150 p-4 rounded-2xl shadow-sm">
                <p className="text-2xl font-black text-[#d4af37]" style={{ fontFamily: "'Fraunces', serif" }}>{gallery.length}</p>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Galeri Foto</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Visi Misi Section */}
      <section id="visi-misi" className="py-24 bg-[#111111] text-white">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-12">
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-[#d4af37]">Visi & Misi</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: "'Fraunces', serif" }}>
              Tujuan & Komitmen Belajar
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 text-left">
            <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 shadow-sm space-y-4">
              <span className="inline-block rounded bg-[#d4af37]/20 border border-[#d4af37]/30 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#d4af37]">Visi Sekolah</span>
              <p className="text-lg font-medium text-zinc-200 leading-relaxed">
                {profile?.vision || 'Mewujudkan anak usia dini yang cerdas, mandiri, kreatif, aktif dan berkarakter mulia.'}
              </p>
            </div>

            <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 shadow-sm space-y-4">
              <span className="inline-block rounded bg-[#d4af37]/20 border border-[#d4af37]/30 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#d4af37]">Misi Sekolah</span>
              <p className="text-sm text-zinc-350 leading-relaxed whitespace-pre-line font-light">
                {profile?.mission || '1. Menyelenggarakan proses pembelajaran yang kreatif dan ceria.\n2. Menanamkan nilai luhur budi pekerti.\n3. Mengembangkan kemandirian fisik anak.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Galeri Section */}
      <section id="galeri" className="py-24 bg-[#fafafa] border-b border-zinc-100">
        <div className="max-w-6xl mx-auto px-6 space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-[#111111]" style={{ fontFamily: "'Fraunces', serif" }}>Galeri Foto Kegiatan</h2>
            <p className="text-sm text-zinc-500 font-light">Momen bermain, belajar, dan tumbuh bersama di sekolah</p>
          </div>

          {gallery.length === 0 ? (
            <div className="text-center py-12 text-zinc-400 text-sm font-light">Belum ada foto galeri sekolah yang diunggah.</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {gallery.slice(0, 6).map((photo) => (
                <div key={photo.id} className="group relative aspect-[4/3] rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 border border-zinc-200 bg-white">
                  <img 
                    src={`${BACKEND_BASE}/${photo.image}`} 
                    alt={photo.title} 
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                    <span className="text-xs font-semibold text-white truncate">{photo.title}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Daftar Guru Section - Default Template */}
      {teachers && teachers.length > 0 && (
        <section id="guru" className="py-24 bg-white">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center space-y-3 mb-14">
              <span className="text-xs font-bold uppercase tracking-widest text-[#d4af37]">Tim Pengajar</span>
              <h2 className="text-3xl font-bold text-[#111111]" style={{ fontFamily: "'Fraunces', serif" }}>Daftar Guru &amp; Tenaga Pendidik</h2>
              <p className="text-sm text-zinc-500 font-light">Tenaga pendidik kami yang berdedikasi dan berpengalaman</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
              {teachers.map((teacher) => {
                const photoUrl = teacher.photo
                  ? `${BACKEND_BASE}/${teacher.photo}`
                  : `https://ui-avatars.com/api/?name=${encodeURIComponent(teacher.full_name)}&background=111111&color=d4af37&size=300`;
                return (
                  <div key={teacher.id} className="group flex flex-col bg-[#fafafa] rounded-2xl overflow-hidden border border-zinc-200 hover:border-[#d4af37] hover:shadow-xl transition-all duration-300">
                    <div className="relative overflow-hidden aspect-[3/4] bg-zinc-100">
                      <img
                        src={photoUrl}
                        alt={teacher.full_name}
                        className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    <div className="p-4 space-y-0.5 border-t border-zinc-200">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#b38f1d]">
                        {teacher.position || 'Guru'}
                      </p>
                      <p className="text-sm font-bold text-zinc-900 leading-snug line-clamp-2" style={{ fontFamily: "'Fraunces', serif" }}>
                        {teacher.full_name}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Berita Section */}
      <section id="berita" className="py-24 bg-[#fafafa] border-y border-zinc-100">
        <div className="max-w-6xl mx-auto px-6 space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-[#111111]" style={{ fontFamily: "'Fraunces', serif" }}>Berita &amp; Artikel</h2>
            <p className="text-sm text-zinc-500 font-light">Ikuti terus kabar kegiatan dan pengumuman terbaru sekolah</p>
          </div>

          {/* Category Filters */}
          {categories && categories.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2 pb-6">
              <button
                onClick={() => setSelectedCategoryId('all')}
                className={`rounded-full px-5 py-2 text-xs font-bold transition-all duration-300 ${
                  selectedCategoryId === 'all'
                    ? 'bg-[#d4af37] text-white shadow-md'
                    : 'bg-white border border-zinc-200 text-zinc-600 hover:border-zinc-300'
                }`}
              >
                Semua Berita
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`rounded-full px-5 py-2 text-xs font-bold transition-all duration-300 ${
                    String(selectedCategoryId) === String(cat.id)
                      ? 'bg-[#d4af37] text-white shadow-md'
                      : 'bg-white border border-zinc-200 text-zinc-600 hover:border-zinc-300'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}

          {filteredNews.length === 0 ? (
            <div className="text-center py-12 text-zinc-400 text-sm font-light">Tidak ada berita yang diterbitkan dalam kategori ini.</div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8">
              {filteredNews.map((item) => (
                <Link key={item.id} to={`/school/${schoolSlug}/news/${item.slug || item.id}`} className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg border border-zinc-200 hover:border-[#d4af37] transition-all flex flex-col h-full justify-between">
                  <div>
                    <div className="h-44 w-full overflow-hidden bg-zinc-150">
                      {item.image ? (
                        <img 
                          src={`${BACKEND_BASE}/${item.image}`} 
                          alt={item.title} 
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" 
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-zinc-350">
                          <ImageIcon className="h-10 w-10" />
                        </div>
                      )}
                    </div>
                    <div className="p-5 space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-bold text-[#b38f1d] uppercase tracking-wider">
                        <span>{new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        {item.category_name && (
                          <span className="bg-[#d4af37]/10 px-2 py-0.5 rounded text-[8px] tracking-widest">{item.category_name}</span>
                        )}
                      </div>
                      <h3 className="font-bold text-[#111111] text-base line-clamp-2 leading-snug group-hover:text-[#b38f1d] transition-colors" style={{ fontFamily: "'Fraunces', serif" }}>
                        {item.title}
                      </h3>
                      <p className="text-xs text-zinc-500 leading-relaxed line-clamp-3 font-light">
                        {item.content}
                      </p>
                    </div>
                  </div>
                  <div className="px-5 pb-4">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#b38f1d] uppercase tracking-widest hover:underline">
                      Baca Selengkapnya <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Agenda Section */}
      <section id="agenda" className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-6 space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-[#111111]" style={{ fontFamily: "'Fraunces', serif" }}>Agenda & Acara Terdekat</h2>
            <p className="text-sm text-zinc-500 font-light">Rangkaian agenda kegiatan penting yang akan segera berlangsung</p>
          </div>

          {events.length === 0 ? (
            <div className="text-center py-12 text-zinc-400 text-sm font-light">Belum ada agenda yang dijadwalkan.</div>
          ) : (
            <div className="space-y-4 max-w-2xl mx-auto">
              {events.map((event) => (
                <div key={event.id} className="bg-[#fafafa] border border-zinc-200 flex items-center gap-5 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-[#d4af37]/10 flex items-center justify-center text-[#b38f1d] border border-[#d4af37]/20">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-zinc-900 text-sm md:text-base truncate" style={{ fontFamily: "'Fraunces', serif" }}>{event.title}</p>
                    <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                      {event.event_date}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* PPDB CTA Section */}
      <section id="ppdb" className="py-24 bg-[#fafafa]">
        <div className="max-w-6xl mx-auto px-6 py-16 rounded-[2rem] bg-white border border-zinc-200 shadow-xl relative overflow-hidden">
          <div className="grid md:grid-cols-2 gap-12 items-center relative z-10">
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold text-[#111111]" style={{ fontFamily: "'Fraunces', serif" }}>
                Penerimaan Siswa Baru
              </h2>
              <p className="text-sm text-zinc-650 leading-relaxed font-light">
                {profile?.ppdb_banner_text || `Mari bergabung bersama keluarga besar ${school.name}. Pendaftaran untuk tahun ajaran baru telah resmi dibuka secara online melalui situs pendaftaran PPDB.`}
              </p>
              
              <ul className="space-y-3.5">
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-zinc-900 shrink-0" />
                  <span className="text-sm text-zinc-700 font-medium">Proses pendaftaran online yang cepat dan mudah</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-zinc-900 shrink-0" />
                  <span className="text-sm text-zinc-700 font-medium">Fasilitas pembelajaran ceria dan lengkap</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-zinc-900 shrink-0" />
                  <span className="text-sm text-zinc-700 font-medium">Kurikulum pengembangan karakter dan budi pekerti</span>
                </li>
              </ul>

              <div className="pt-4">
                <Link 
                  to={ppdbLink} 
                  className="inline-block rounded-full bg-[#d4af37] hover:bg-[#b38f1d] px-8 py-3.5 text-sm font-bold text-white transition-all duration-300 hover:scale-105 shadow-md shadow-[#d4af37]/10"
                >
                  Daftarkan Anak Sekarang
                </Link>
              </div>
            </div>

            <div className="relative flex justify-center">
              <div className="w-full max-w-sm rounded-[2rem] overflow-hidden shadow-xl border border-zinc-150 bg-white p-2">
                <img 
                  src={heroImage} 
                  alt="PPDB Banner" 
                  className="w-full h-64 object-cover rounded-[1.8rem]" 
                  loading="lazy" 
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Kontak & Lokasi Section */}
      <section id="kontak" className="py-24 bg-[#111111] text-white">
        <div className="max-w-6xl mx-auto px-6 space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-white" style={{ fontFamily: "'Fraunces', serif" }}>Hubungi & Lokasi Kami</h2>
            <p className="text-sm text-zinc-400 font-light">Pertanyaan seputar PPDB dan kurikulum sekolah silakan hubungi kontak resmi kami</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl text-center space-y-4 shadow-sm">
              <MapPin className="w-8 h-8 mx-auto text-[#d4af37]" />
              <h4 className="font-bold text-zinc-100" style={{ fontFamily: "'Fraunces', serif" }}>Alamat Sekolah</h4>
              <p className="text-xs text-zinc-400 leading-relaxed font-light">{contactInfo.address}</p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl text-center space-y-4 shadow-sm">
              <Phone className="w-8 h-8 mx-auto text-[#d4af37]" />
              <h4 className="font-bold text-zinc-100" style={{ fontFamily: "'Fraunces', serif" }}>Nomor Telepon</h4>
              <p className="text-xs text-zinc-400 leading-relaxed font-light">{contactInfo.phone}</p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl text-center space-y-4 shadow-sm">
              <Mail className="w-8 h-8 mx-auto text-[#d4af37]" />
              <h4 className="font-bold text-zinc-100" style={{ fontFamily: "'Fraunces', serif" }}>Alamat Email</h4>
              <p className="text-xs text-zinc-400 leading-relaxed font-light">{contactInfo.email}</p>
            </div>
          </div>

          {/* Interactive Map if Configured */}
          {settings?.google_maps_iframe && (
            <div className="rounded-[2rem] overflow-hidden border border-zinc-800 shadow-lg h-96 w-full bg-zinc-900 mt-12">
              <div dangerouslySetInnerHTML={{ __html: settings.google_maps_iframe }} className="w-full h-full" />
            </div>
          )}

        </div>
      </section>

    </div>
  );
}

export default function SchoolHome() {
  return (
    <TenantWebsiteLayout>
      <SchoolHomeContent />
    </TenantWebsiteLayout>
  );
}
