import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../config/axios';
import { 
  Loader2, Globe, Phone, Mail, MapPin,
  Home, User, Target, Image, Newspaper, MessageCircle
} from 'lucide-react';

// Map nav labels to icons — fallback by common keyword match
const NAV_ICON_MAP = {
  beranda:   <Home className="h-4 w-4" />,
  home:      <Home className="h-4 w-4" />,
  profil:    <User className="h-4 w-4" />,
  profile:   <User className="h-4 w-4" />,
  tentang:   <User className="h-4 w-4" />,
  visi:      <Target className="h-4 w-4" />,
  misi:      <Target className="h-4 w-4" />,
  'visi misi': <Target className="h-4 w-4" />,
  galeri:    <Image className="h-4 w-4" />,
  gallery:   <Image className="h-4 w-4" />,
  foto:      <Image className="h-4 w-4" />,
  berita:    <Newspaper className="h-4 w-4" />,
  news:      <Newspaper className="h-4 w-4" />,
  artikel:   <Newspaper className="h-4 w-4" />,
  kontak:    <MessageCircle className="h-4 w-4" />,
  contact:   <MessageCircle className="h-4 w-4" />,
  hubungi:   <MessageCircle className="h-4 w-4" />,
};

function getNavIcon(label = '') {
  const key = label.toLowerCase().trim();
  // Exact match first, then partial
  if (NAV_ICON_MAP[key]) return NAV_ICON_MAP[key];
  for (const [k, icon] of Object.entries(NAV_ICON_MAP)) {
    if (key.includes(k) || k.includes(key)) return icon;
  }
  return null;
}

// WA SVG Icon (official green WA color)
function WhatsAppIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

export default function TenantWebsiteLayout({ children }) {
  const { schoolSlug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWebsiteData = async () => {
      setLoading(true);
      setError(null);
      try {
        const host = window.location.hostname;
        let subdomain = host.split('.')[0];
        if (subdomain === 'localhost' || subdomain === '127') {
          subdomain = schoolSlug || 'tkmelati';
        }

        const response = await api.get('/tenant/profile', {
          headers: {
            'X-School-ID': subdomain === 'tkmelati' ? '1' : localStorage.getItem('school_id') || '1'
          }
        });
        
        const resData = response.data;
        setData(resData);

        const themeColor = resData.settings?.theme_color || '#6366F1';
        document.documentElement.style.setProperty('--color-primary', themeColor);
      } catch (err) {
        setError('Gagal memuat website sekolah. Silakan periksa kembali alamat URL.');
      } finally {
        setLoading(false);
      }
    };

    fetchWebsiteData();
  }, [schoolSlug]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#08060d] text-white">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#08060d] text-zinc-400 p-4 text-center">
        <Globe className="h-16 w-16 text-zinc-700 mb-4" />
        <p className="text-xl font-bold text-white">Situs Tidak Ditemukan</p>
        <p className="mt-2 text-sm">{error || 'Website PAUD/TK tidak aktif atau tidak terdaftar.'}</p>
        <Link to="/" className="mt-6 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
          Kembali ke Portal SaaS
        </Link>
      </div>
    );
  }

  const { school, settings } = data;
  const menuData = settings?.menu_data || [
    { label: 'Beranda', path: '#home' },
    { label: 'Profil', path: '#profil' },
    { label: 'Visi Misi', path: '#visi-misi' },
    { label: 'Galeri', path: '#galeri' },
    { label: 'Berita', path: '#berita' },
    { label: 'Kontak', path: '#kontak' }
  ];

  const contactInfo = settings?.contact_info || {
    phone: '',
    email: 'info@school.sch.id',
    address: 'Jl. Mawar Indah No. 12, Jakarta, Indonesia'
  };

  // Build WhatsApp link from contact phone number
  const waNumber = (contactInfo.phone || '')
    .replace(/\D/g, '')                    // strip non-digits
    .replace(/^0/, '62');                  // convert leading 0 → 62
  const waLink = waNumber
    ? `https://wa.me/${waNumber}?text=Halo%20${encodeURIComponent(school.name)}%2C%20saya%20ingin%20bertanya.`
    : 'https://wa.me/';

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-primary selection:text-white font-sans scroll-smooth">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 w-full border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to={schoolSlug ? `/school/${schoolSlug}` : '/'} className="flex items-center gap-3">
            {settings?.logo ? (
              <img src={`http://${window.location.hostname}:8080/${settings.logo}`} alt={school.name} className="h-8 w-auto" />
            ) : (
              <>
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-white">
                  Logo
                </div>
                <span className="font-bold text-lg tracking-tight text-white">{school.name}</span>
              </>
            )}
          </Link>

          <div className="flex items-center gap-4">
            {/* Navigation Menu with Icons */}
            <nav className="hidden md:flex items-center gap-1">
              {menuData.map((menu, idx) => {
                const isAnchor = menu.path && menu.path.startsWith('#');
                const href = isAnchor
                  ? (schoolSlug ? `/school/${schoolSlug}${menu.path}` : menu.path)
                  : menu.path;

                const icon = getNavIcon(menu.label);

                if (isAnchor) {
                  return (
                    <a
                      key={idx}
                      href={href}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
                    >
                      {icon && <span className="opacity-70">{icon}</span>}
                      {menu.label}
                    </a>
                  );
                }

                return (
                  <Link
                    key={idx}
                    to={href}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
                  >
                    {icon && <span className="opacity-70">{icon}</span>}
                    {menu.label}
                  </Link>
                );
              })}
            </nav>

            <Link
              to="/login"
              className="rounded-full bg-primary hover:bg-opacity-90 px-4 py-1.5 text-xs font-bold text-white transition-all shadow-md shadow-primary/20"
            >
              Login Portal
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {children ? (
          typeof children === 'function' ? children(data) : children
        ) : null}
      </main>

      {/* Footer */}
      <footer className="relative bg-gradient-to-b from-[#0f172a] to-[#090d16] text-zinc-400 pt-16 pb-12 overflow-hidden border-t border-zinc-800/80">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(212,175,55,0.02),transparent_40%)] pointer-events-none" />
        
        <div className="mx-auto max-w-6xl px-6 grid grid-cols-1 md:grid-cols-3 gap-10 relative z-10">
          <div className="space-y-4">
            <h3 className="font-black text-white text-lg tracking-tight flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#d4af37]" /> {school.name}
            </h3>
            <p className="text-sm leading-relaxed text-zinc-400 font-light max-w-sm">
              Mewujudkan pendidikan anak usia dini yang cerdas, kreatif, ceria, dan berakhlak mulia demi masa depan generasi emas bangsa.
            </p>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-extrabold text-white text-xs uppercase tracking-widest text-[#d4af37]">Kontak Kami</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <Phone className="h-4.5 w-4.5 text-[#d4af37] shrink-0 mt-0.5" />
                <span className="text-zinc-300 font-light">{contactInfo.phone}</span>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="h-4.5 w-4.5 text-[#d4af37] shrink-0 mt-0.5" />
                <span className="text-zinc-300 font-light truncate">{contactInfo.email}</span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="h-4.5 w-4.5 text-[#d4af37] shrink-0 mt-0.5" />
                <span className="text-zinc-300 font-light leading-relaxed">{contactInfo.address}</span>
              </li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-extrabold text-white text-xs uppercase tracking-widest text-[#d4af37]">Navigasi Cepat</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {menuData.map((menu, idx) => {
                const isAnchor = menu.path && menu.path.startsWith('#');
                const href = isAnchor
                  ? (schoolSlug ? `/school/${schoolSlug}${menu.path}` : menu.path)
                  : menu.path;
                
                if (isAnchor) {
                  return (
                    <a key={idx} href={href} className="text-zinc-400 hover:text-white transition-colors font-light">
                      {menu.label}
                    </a>
                  );
                }

                return (
                  <Link key={idx} to={href} className="text-zinc-400 hover:text-white transition-colors font-light">
                    {menu.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-6 mt-12 pt-6 border-t border-zinc-800/60 relative z-10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
          <p className="text-zinc-500 font-medium">
            &copy; {new Date().getFullYear()} {school.name}. {settings?.footer_text || 'Hak Cipta Dilindungi Undang-Undang.'}
          </p>
          <div className="flex gap-4 text-zinc-500">
            <span>Powered by <strong className="text-zinc-400 font-extrabold">PAUDKU.ID</strong></span>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Button */}
      <a
        href={waLink}
        target="_blank"
        rel="noopener noreferrer"
        id="wa-float-btn"
        aria-label="Chat WhatsApp"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-2xl shadow-green-500/30 hover:scale-110 hover:shadow-green-500/50 active:scale-95 transition-all duration-200 group"
        title={`Chat via WhatsApp — ${school.name}`}
      >
        <WhatsAppIcon className="h-7 w-7" />
        {/* Tooltip */}
        <span className="pointer-events-none absolute right-16 whitespace-nowrap rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg border border-zinc-800">
          Chat via WhatsApp
        </span>
        {/* Pulse ring */}
        <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-25 pointer-events-none" />
      </a>
    </div>
  );
}
