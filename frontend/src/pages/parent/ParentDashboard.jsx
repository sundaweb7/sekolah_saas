import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../config/axios';
import { useAuth } from '../../context/AuthContext';
import { 
  User, Calendar, FileText, CreditCard, LogOut, CheckCircle, 
  Clock, AlertCircle, Loader2, ArrowRight, ShieldCheck, Heart, Sparkles, X, Menu, Copy, ExternalLink, GraduationCap, Award, CheckSquare, Megaphone, MessageCircle, Bell
} from 'lucide-react';

export default function ParentDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeMenu, setActiveMenu] = useState('home'); // default to Home
  const [notifications, setNotifications] = useState([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  
  // Payment Modal
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Virtual Account Mandiri');
  const [paying, setPaying] = useState(false);
  
  // Instructions Modal
  const [activeInstructions, setActiveInstructions] = useState(null);

  const fetchParentData = async (studentId = null) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/parent/dashboard', { params: studentId ? { student_id: studentId } : {} });
      setData(response.data.data || response.data);
      
      // Fetch notifications as well
      const notifRes = await api.get('/communication/notifications');
      const items = notifRes.data?.data?.items || notifRes.data?.items || [];
      setNotifications(items);
      setUnreadNotificationsCount(notifRes.data?.data?.unread_count || notifRes.data?.unread_count || 0);
    } catch (err) {
      setError(err.message || 'Gagal memuat portal orang tua.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParentData();
  }, []);

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    setPaying(true);
    try {
      const res = await api.post(`/parent/spp/pay/${selectedInvoice.id}`, {
        payment_method: paymentMethod
      });
      const tripayData = res.data?.tripay_data;
      if (tripayData) {
        const updatedInvoice = res.data?.invoice || {
          ...selectedInvoice,
          tripay_pay_code: tripayData.pay_code,
          tripay_payment_method: paymentMethod,
          tripay_instructions: JSON.stringify(tripayData.instructions)
        };
        setActiveInstructions(updatedInvoice);
      } else {
        alert('Instruksi pembayaran berhasil dibuat!');
      }
      setSelectedInvoice(null);
      fetchParentData();
    } catch (err) {
      alert(err.message || 'Gagal memproses pembayaran.');
    } finally {
      setPaying(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    alert('Kode pembayaran berhasil disalin! 📋');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#09070f]">
        <Loader2 className="h-10 w-10 animate-spin text-[#d4af37]" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#09070f] p-6 text-center text-zinc-400">
        <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-white">Akses Portal Gagal</h2>
        <p className="text-sm mt-2 max-w-sm">{error || 'Data profil anak tidak ditemukan.'}</p>
        <button onClick={logout} className="mt-6 rounded-xl bg-[#d4af37] text-black px-6 py-2.5 text-xs font-bold hover:bg-[#f3cb65] transition-colors">
          Keluar & Login Kembali
        </button>
      </div>
    );
  }

  const { child, children = [], spp_invoices, daily_activities, semester_report } = data;

  const menuItems = [
    { id: 'home', label: 'Halaman Utama', shortLabel: 'Home', icon: <Sparkles className="h-5 w-5" /> },
    { id: 'profile', label: 'Profil Anak', shortLabel: 'Profil', icon: <User className="h-5 w-5" /> },
    { id: 'activities', label: 'Kegiatan Harian', shortLabel: 'Laporan', icon: <Calendar className="h-5 w-5" /> },
    { id: 'attendance', label: 'Kehadiran Siswa', shortLabel: 'Absen', icon: <CheckSquare className="h-5 w-5" /> },
    { id: 'announcements', label: 'Mading Pengumuman', shortLabel: 'Mading', icon: <Megaphone className="h-5 w-5" /> },
    { id: 'reports', label: 'Laporan Rapor', shortLabel: 'Rapor', icon: <FileText className="h-5 w-5" /> },
    { id: 'spp', label: 'SPP Bulanan', shortLabel: 'SPP', icon: <CreditCard className="h-5 w-5" /> },
  ];

  return (
    <div className="min-h-screen bg-[#060408] text-zinc-100 flex flex-col md:flex-row pb-24 md:pb-0 font-sans">
      
      {/* Floating Communication Button (Mobile & Desktop) */}
      <button 
        onClick={() => navigate('/parent/communication')} 
        className="fixed bottom-24 right-4 z-40 flex items-center gap-2 rounded-full bg-gradient-to-r from-[#d4af37] to-[#f3cb65] px-4 py-3.5 text-xs font-black text-black shadow-xl shadow-amber-500/20 hover:scale-105 transition-all md:bottom-6 md:right-6"
      >
        <MessageCircle className="h-4.5 w-4.5" />
        Hubungi Sekolah
      </button>
      
      {/* Sidebar Panel for Desktop */}
      <aside className="hidden md:flex w-72 bg-[#0b0912] border-r border-zinc-900 flex-col justify-between shrink-0 p-6">
        <div className="space-y-6">
          {/* Top Logo Header */}
          <div className="flex items-center gap-3 border-b border-zinc-900 pb-5">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-[#d4af37] to-[#ffd700] flex items-center justify-center text-black font-extrabold text-lg shadow-lg shadow-[#d4af37]/20">
              👶
            </div>
            <div>
              <h2 className="font-black text-sm text-white tracking-wider">KOOLA PAUD</h2>
              <span className="text-[9px] uppercase font-bold tracking-widest text-[#d4af37] block mt-0.5">Portal Wali Murid</span>
            </div>
          </div>

          {/* Child Card - Premium Student Badge */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-3 backdrop-blur-md">
            {children.length > 1 && (
              <select
                value={child.id}
                onChange={(event) => fetchParentData(event.target.value)}
                className="w-full rounded-lg border border-zinc-850 bg-zinc-950 px-2 py-2 text-xs text-white outline-none focus:border-[#d4af37]"
                aria-label="Pilih anak"
              >
                {children.map((item) => <option key={item.id} value={item.id}>{item.full_name}</option>)}
              </select>
            )}
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-full bg-gradient-to-br from-[#d4af37] to-amber-600 flex items-center justify-center font-bold text-black uppercase border border-amber-400">
                {child.full_name.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-xs text-white truncate">{child.full_name}</p>
                <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{child.registration_number}</p>
              </div>
            </div>
            <div className="text-[10px] bg-[#d4af37]/10 border border-[#d4af37]/20 rounded-lg p-2 text-center text-[#d4af37] font-bold">
              🏫 {child.class_name}
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-1 pt-4">
            {menuItems.map((item) => {
              const active = activeMenu === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveMenu(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                    active 
                      ? 'bg-gradient-to-r from-[#d4af37] to-amber-500 text-black shadow-lg shadow-amber-500/10' 
                      : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-white'
                  }`}
                >
                  <span className={active ? 'text-black' : 'text-zinc-500'}>
                    {item.icon}
                  </span>
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Logout bottom */}
        <div className="pt-4 border-t border-zinc-900">
          <button 
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950/20 hover:bg-red-950/20 hover:text-red-400 hover:border-red-900/30 py-3 text-xs font-bold text-zinc-400 transition-all"
          >
            <LogOut className="h-4 w-4" /> KELUAR PORTAL
          </button>
        </div>
      </aside>

      {/* Top Mobile Bar */}
      <header className="md:hidden bg-[#0a0810]/90 backdrop-blur-lg border-b border-zinc-900 px-5 py-4 flex items-center justify-between sticky top-0 z-30 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-[#d4af37] to-amber-500 flex items-center justify-center text-black text-sm font-bold shadow-md shadow-amber-500/10">
            👶
          </div>
          <div>
            <h2 className="font-extrabold text-xs text-white leading-tight">{child.full_name}</h2>
            <p className="text-[9px] font-bold text-[#d4af37] uppercase tracking-widest mt-0.5">🏫 {child.class_name}</p>
          </div>
        </div>

        <button 
          onClick={logout}
          className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          title="Keluar"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-5 md:p-12 max-w-5xl mx-auto w-full space-y-8">
        
        {/* Home Section */}
        {activeMenu === 'home' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Halo, Ayah / Bunda! 👋</h1>
                <p className="text-xs text-zinc-500 mt-1">Selamat datang kembali di Portal Wali Murid KOOLA PAUD.</p>
              </div>
            </div>

            {/* Premium Student Card */}
            <div className="relative overflow-hidden rounded-3xl border border-[#d4af37]/30 bg-gradient-to-br from-zinc-950 via-[#181524] to-zinc-950 p-6 shadow-2xl flex items-center gap-5 shadow-[#d4af37]/5">
              {/* Glowing glow effect */}
              <div className="absolute top-0 right-0 h-36 w-36 rounded-full bg-[#d4af37]/10 blur-3xl" />
              <div className="absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-purple-500/5 blur-2xl" />
              
              {/* Photo frame with gold ring */}
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[#ffd700] via-[#e5c158] to-[#b8860b] p-0.5 shadow-xl shrink-0 flex items-center justify-center">
                <div className="h-full w-full rounded-full bg-zinc-950 flex items-center justify-center text-3xl">
                  👦
                </div>
              </div>

              <div className="min-w-0 flex-1 relative z-10">
                <span className="inline-block text-[8px] font-black uppercase tracking-widest text-[#ffd700] bg-[#ffd700]/10 px-2 py-0.5 rounded border border-[#ffd700]/30">
                  {child.class_name || 'Siswa Aktif'}
                </span>
                <h2 className="text-xl font-black bg-gradient-to-r from-[#ffd700] via-[#f3cb65] to-[#d4af37] bg-clip-text text-transparent truncate mt-1.5 tracking-tight">
                  {child.full_name}
                </h2>
                <p className="text-[10px] text-zinc-400 font-mono mt-0.5">NIS: {child.registration_number}</p>
              </div>
            </div>

            {/* Menu Mobile Lengkap Grid */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-zinc-500">Layanan & Fitur Akademik</h3>
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => setActiveMenu('activities')} className="flex flex-col items-center justify-center text-center p-3 rounded-2xl border border-zinc-900 bg-zinc-950/40 hover:border-zinc-850 transition-all space-y-2">
                  <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0"><Calendar className="h-4.5 w-4.5" /></div>
                  <span className="text-[10px] font-bold text-white font-sans leading-tight">Laporan Harian</span>
                </button>
                <button onClick={() => setActiveMenu('spp')} className="flex flex-col items-center justify-center text-center p-3 rounded-2xl border border-zinc-900 bg-zinc-950/40 hover:border-zinc-850 transition-all space-y-2">
                  <div className="h-9 w-9 rounded-xl bg-[#d4af37]/10 text-[#d4af37] flex items-center justify-center shrink-0"><CreditCard className="h-4.5 w-4.5" /></div>
                  <span className="text-[10px] font-bold text-white font-sans leading-tight">Pembayaran SPP</span>
                </button>
                <button onClick={() => setActiveMenu('reports')} className="flex flex-col items-center justify-center text-center p-3 rounded-2xl border border-zinc-900 bg-zinc-950/40 hover:border-zinc-850 transition-all space-y-2">
                  <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0"><FileText className="h-4.5 w-4.5" /></div>
                  <span className="text-[10px] font-bold text-white font-sans leading-tight">Rapor Semester</span>
                </button>
                <button onClick={() => setActiveMenu('profile')} className="flex flex-col items-center justify-center text-center p-3 rounded-2xl border border-zinc-900 bg-zinc-950/40 hover:border-zinc-850 transition-all space-y-2">
                  <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0"><User className="h-4.5 w-4.5" /></div>
                  <span className="text-[10px] font-bold text-white font-sans leading-tight">Profil Lengkap</span>
                </button>
                <button onClick={() => navigate('/parent/communication')} className="flex flex-col items-center justify-center text-center p-3 rounded-2xl border border-zinc-900 bg-zinc-950/40 hover:border-zinc-850 transition-all space-y-2">
                  <div className="h-9 w-9 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0"><MessageCircle className="h-4.5 w-4.5" /></div>
                  <span className="text-[10px] font-bold text-white font-sans leading-tight">Konseling & Chat</span>
                </button>
                <button onClick={() => setActiveMenu('attendance')} className="flex flex-col items-center justify-center text-center p-3 rounded-2xl border border-zinc-900 bg-zinc-950/40 hover:border-zinc-850 transition-all space-y-2">
                  <div className="h-9 w-9 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0"><CheckSquare className="h-4.5 w-4.5" /></div>
                  <span className="text-[10px] font-bold text-white font-sans leading-tight">Absensi Siswa</span>
                </button>
                <button onClick={() => setActiveMenu('announcements')} className="flex flex-col items-center justify-center text-center p-3 rounded-2xl border border-zinc-900 bg-zinc-950/40 hover:border-zinc-850 transition-all space-y-2">
                  <div className="h-9 w-9 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center shrink-0"><Megaphone className="h-4.5 w-4.5" /></div>
                  <span className="text-[10px] font-bold text-white font-sans leading-tight">Mading Sekolah</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notifications Section */}
        {activeMenu === 'notifications' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Notifikasi</h1>
              <p className="text-xs text-zinc-500 mt-1">Pemberitahuan dan kabar terbaru untuk Anda.</p>
            </div>

            <div className="space-y-3">
              {notifications.length === 0 ? (
                <div className="rounded-2xl border border-zinc-900 bg-zinc-900/20 p-12 text-center text-zinc-500 font-sans text-xs">
                  Belum ada notifikasi baru.
                </div>
              ) : (
                notifications.map((item) => (
                  <div key={item.id} className={`rounded-2xl border p-4 text-left ${item.read_at ? 'bg-zinc-900/10 border-zinc-900' : 'border-amber-500/30 bg-amber-500/5'}`}>
                    <div className="flex gap-3">
                      <div className="h-8 w-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                        <AlertCircle className="h-4.5 w-4.5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-white">{item.title}</p>
                        <p className="mt-1 text-xs text-zinc-400 leading-relaxed font-sans">{item.body}</p>
                        <p className="mt-2 text-[9px] text-zinc-550">
                          {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Child Profile Section (Stunning Digital Student ID Card) */}
        {activeMenu === 'profile' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Profil Anak Anda</h1>
              <p className="text-xs text-zinc-500 mt-1">Kartu identitas digital siswa resmi terdaftar.</p>
            </div>
            
            <div className="grid grid-cols-1 gap-6">
              {/* Digital ID Card */}
              <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-gradient-to-br from-[#120e1d] to-[#08060c] p-6 md:p-8 shadow-2xl flex flex-col md:flex-row gap-6 md:gap-8 items-center">
                {/* Glowing glow effect */}
                <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-[#d4af37]/5 blur-3xl" />
                
                {/* Photo frame */}
                <div className="relative shrink-0">
                  <div className="h-28 w-28 rounded-2xl bg-gradient-to-br from-[#d4af37] to-amber-600 p-0.5 shadow-xl">
                    <div className="h-full w-full rounded-[14px] bg-zinc-950 flex items-center justify-center text-5xl">
                      👦
                    </div>
                  </div>
                  <span className="absolute -bottom-2 -right-2 bg-emerald-500 text-zinc-950 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider shadow">
                    Aktif
                  </span>
                </div>

                <div className="space-y-4 flex-1 w-full text-center md:text-left">
                  <div>
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Nama Lengkap Murid</span>
                    <h2 className="text-2xl font-black text-[#d4af37] mt-0.5 tracking-tight">{child.full_name}</h2>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-6 text-left pt-4 border-t border-zinc-900/60">
                    <div>
                      <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">Nomor Induk / NIS</span>
                      <span className="text-xs font-bold text-white font-mono mt-0.5 block">{child.registration_number}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">Jenis Kelamin</span>
                      <span className="text-xs font-bold text-white mt-0.5 block">{child.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">Tanggal Lahir</span>
                      <span className="text-xs font-bold text-white mt-0.5 block">
                        {new Date(child.birth_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">Wali Kelas</span>
                      <span className="text-xs font-bold text-[#d4af37] mt-0.5 block">{child.teacher_name || 'Belum ditugaskan'}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">Kelas / Kelompok</span>
                      <span className="text-xs font-bold text-white mt-0.5 block">{child.class_name || 'Belum masuk kelas'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Daily Activities Section */}
        {activeMenu === 'activities' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Kegiatan Harian</h1>
              <p className="text-sm text-zinc-500 mt-1">Laporan harian perkembangan dan aktivitas belajar anak.</p>
            </div>
            
            <div className="space-y-6 relative before:absolute before:inset-y-0 before:left-4 before:w-0.5 before:bg-zinc-900">
              {daily_activities.map((act) => (
                <div key={act.id} className="relative pl-10 animate-slideUp">
                  {/* Timeline Dot */}
                  <div className="absolute left-2.5 top-1.5 h-3.5 w-3.5 rounded-full bg-[#d4af37] border-4 border-[#08060c] shadow-lg shadow-[#d4af37]/35" />
                  
                  <div className="bg-zinc-900/20 rounded-2xl border border-zinc-900 p-5 shadow-md hover:border-zinc-800 transition-colors backdrop-blur-sm space-y-3">
                    <div className="flex flex-wrap justify-between items-center gap-2">
                      <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono">
                        <Calendar className="h-4 w-4 text-[#d4af37]" />
                        {new Date(act.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                      <span className="text-[9px] uppercase font-bold tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">
                        Mood: {act.mood}
                      </span>
                    </div>
                    
                    <h3 className="text-base font-extrabold text-white">{act.title}</h3>
                    <p className="text-xs md:text-sm text-zinc-400 leading-relaxed font-light">{act.description}</p>
                    
                    {act.photo && (
                      <div className="mt-3 max-w-xs overflow-hidden rounded-xl border border-zinc-850">
                        <img src={`http://${window.location.hostname}:8080/${act.photo}`} alt="" className="w-full h-auto object-cover" />
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between border-t border-zinc-900/40 pt-3 text-[10px] text-zinc-500 font-semibold italic">
                      <span>Dilaporkan oleh: {act.teacher}</span>
                      <span className="text-amber-500">PAUD/TK Guru</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Semester Reports Section */}
        {activeMenu === 'reports' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Laporan Rapor</h1>
              <p className="text-sm text-zinc-500 mt-1">Evaluasi capaian belajar anak akhir semester.</p>
            </div>
            
            {!semester_report ? (
              <div className="rounded-2xl border border-zinc-900 bg-zinc-900/20 p-12 text-center space-y-3">
                <div className="text-4xl">📋</div>
                <p className="font-bold text-zinc-300">Laporan Rapor Belum Tersedia</p>
                <p className="text-sm text-zinc-500">Guru belum menginput laporan rapor semester untuk anak Anda.</p>
              </div>
            ) : (
              <div className="bg-zinc-900/20 rounded-2xl border border-zinc-900 p-6 shadow-md backdrop-blur-md space-y-6">
                <div className="border-b border-zinc-900 pb-4 flex justify-between items-center text-xs font-bold uppercase tracking-wider text-zinc-400">
                  <span>Tahun Ajaran: {semester_report.academic_year}</span>
                  <span className="bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/20 px-3 py-1 rounded-full text-[10px]">
                    Semester {semester_report.semester}
                  </span>
                </div>
                
                <div className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-900 italic text-zinc-350 text-xs md:text-sm leading-relaxed">
                  <span className="font-extrabold text-[#d4af37] not-italic block mb-1.5 uppercase text-[10px] tracking-widest">Catatan Perkembangan Anak:</span>
                  "{semester_report.summary}"
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(semester_report.grades || []).map((g, idx) => (
                    <div key={idx} className="border border-zinc-900 bg-zinc-950/20 rounded-xl p-4 space-y-2 hover:border-zinc-800 transition-colors">
                      <div className="flex justify-between items-start gap-2">
                        <span className="font-bold text-xs md:text-sm text-white">{g.aspect}</span>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded shrink-0">
                          {g.grade}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 leading-relaxed font-light">{g.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Kehadiran/Absensi Siswa Section */}
        {activeMenu === 'attendance' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Kehadiran Siswa</h1>
              <p className="text-sm text-zinc-500 mt-1">Catatan absensi harian kedatangan anak di sekolah.</p>
            </div>
            
            <div className="bg-zinc-900/20 rounded-2xl border border-zinc-900 p-6 shadow-md backdrop-blur-md space-y-4">
              {(!data.attendance || data.attendance.length === 0) ? (
                <p className="text-xs text-zinc-500 text-center py-10">Belum ada data kehadiran siswa dicatat.</p>
              ) : (
                <div className="space-y-3">
                  {data.attendance.map((att) => (
                    <div key={att.id} className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-950/40 border border-zinc-900">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-white">
                          📅 {new Date(att.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                        {att.notes && <p className="text-[10px] text-zinc-400">Ket: {att.notes}</p>}
                      </div>
                      
                      <span>
                        {att.status === 'hadir' && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded">Hadir</span>
                        )}
                        {att.status === 'sakit' && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded">Sakit</span>
                        )}
                        {att.status === 'izin' && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2.5 py-1 rounded">Izin</span>
                        )}
                        {att.status === 'alfa' && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded">Alfa</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Class Announcements Section */}
        {activeMenu === 'announcements' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Mading Pengumuman</h1>
              <p className="text-sm text-zinc-500 mt-1">Pengumuman penting khusus dari guru bimbingan kelas.</p>
            </div>
            
            <div className="space-y-4">
              {(!data.announcements || data.announcements.length === 0) ? (
                <div className="bg-zinc-900/20 rounded-2xl border border-zinc-900 p-10 text-center text-zinc-500 shadow-md">
                  <Megaphone className="h-10 w-10 text-zinc-700 mx-auto mb-2" />
                  <p className="text-sm font-medium">Belum ada pengumuman kelas baru saat ini.</p>
                </div>
              ) : (
                data.announcements.map((ann) => (
                  <div key={ann.id} className="bg-zinc-900/20 rounded-2xl border border-zinc-900 p-5 shadow-md hover:border-zinc-800 transition-colors backdrop-blur-sm space-y-3">
                    <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono">
                      <span>📅 {new Date(ann.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="text-[#d4af37]">Guru Wali Kelas</span>
                    </div>
                    <h3 className="text-base font-extrabold text-white">{ann.title}</h3>
                    <p className="text-xs md:text-sm text-zinc-350 leading-relaxed font-light whitespace-pre-line">{ann.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* SPP Bulanan */}
        {activeMenu === 'spp' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Tagihan SPP Bulanan</h1>
              <p className="text-sm text-zinc-500 mt-1">Pembayaran SPP dan iuran sekolah secara mandiri.</p>
            </div>
            
            <div className="bg-zinc-900/20 rounded-2xl border border-zinc-900 shadow-md backdrop-blur-md overflow-hidden">
              <div className="p-5 bg-zinc-950/40 border-b border-zinc-900 flex items-center gap-3">
                <ShieldCheck className="h-6 w-6 text-[#d4af37]" />
                <div>
                  <h3 className="font-bold text-xs md:text-sm text-white">Status Pembayaran Mandiri</h3>
                  <p className="text-xs text-zinc-500">Terintegrasi dengan payment gateway Tripay (Instan & Otomatis).</p>
                </div>
              </div>
              
              <div className="divide-y divide-zinc-900">
                {spp_invoices.map((inv) => (
                  <div key={inv.id} className="p-5 flex flex-col md:flex-row justify-between md:items-center gap-4 hover:bg-zinc-900/10 transition-colors">
                    <div className="space-y-1.5 flex-1">
                      <p className="font-bold text-white text-sm">
                        SPP Bulan {new Date(inv.month + '-01').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                      </p>
                      <p className="text-xs text-zinc-400 font-semibold font-mono">
                        Rp {parseFloat(inv.amount).toLocaleString('id-ID')}
                      </p>
                      
                      {/* Show active VA details if unpaid but code exists */}
                      {inv.status === 'unpaid' && inv.tripay_pay_code && (
                        <div className="mt-3 p-3.5 rounded-xl border border-zinc-900 bg-zinc-950/40 text-xs space-y-1.5 max-w-sm">
                          <p className="text-zinc-500 font-medium">Metode: <span className="text-white font-bold">{inv.tripay_payment_method}</span></p>
                          <div className="flex items-center gap-2">
                            <span className="text-zinc-500">Kode VA:</span>
                            <span className="font-mono font-bold text-[#d4af37] text-sm tracking-wide">{inv.tripay_pay_code}</span>
                            <button 
                              onClick={() => handleCopy(inv.tripay_pay_code)}
                              className="p-1 hover:bg-zinc-900 rounded text-[#d4af37] transition-colors"
                              title="Salin VA"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <button 
                            onClick={() => setActiveInstructions(inv)}
                            className="mt-1 text-[11px] font-bold text-[#d4af37] hover:text-[#ffd700] flex items-center gap-1 transition-colors"
                          >
                            <ExternalLink className="h-3 w-3" /> Lihat Cara Pembayaran
                          </button>
                        </div>
                      )}

                      {inv.status === 'paid' && (
                        <p className="text-[10px] text-zinc-500">
                          Lunas via {inv.payment_method} &bull; {new Date(inv.paid_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      {inv.status === 'paid' ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 rounded-full uppercase tracking-wider">
                          <CheckCircle className="h-4.5 w-4.5" /> Lunas
                        </span>
                      ) : (
                        <div className="flex gap-2">
                          {inv.tripay_pay_code && (
                            <button 
                              onClick={() => setSelectedInvoice(inv)}
                              className="rounded-xl border border-zinc-800 bg-zinc-900/20 hover:bg-zinc-900 px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white transition-colors"
                            >
                              Ganti Metode
                            </button>
                          )}
                          <button 
                            onClick={() => setSelectedInvoice(inv)}
                            className="rounded-xl bg-[#d4af37] hover:bg-[#f3cb65] px-5 py-2 text-xs font-bold text-black transition-colors flex items-center justify-center gap-1 shadow-md shadow-[#d4af37]/10"
                          >
                            {inv.tripay_pay_code ? 'Bayar' : 'Bayar Sekarang'} <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Bottom Navigation Bar for Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0d0a17] border-t border-zinc-900 flex justify-around items-center py-2.5 z-40 shadow-lg">
        {[
          { id: 'home', label: 'Home', icon: <Sparkles className="h-5 w-5" /> },
          { id: 'activities', label: 'Laporan', icon: <Calendar className="h-5 w-5" /> },
          { id: 'notifications', label: 'Notifikasi', icon: <Bell className="h-5 w-5" />, badge: unreadNotificationsCount },
          { id: 'spp', label: 'SPP', icon: <CreditCard className="h-5 w-5" /> },
          { id: 'profile', label: 'Profile', icon: <User className="h-5 w-5" /> }
        ].map((item) => {
          const active = activeMenu === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveMenu(item.id)}
              className={`relative flex flex-col items-center gap-1 transition-all ${active ? 'text-[#d4af37] font-bold scale-105' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              {item.icon}
              <span className="text-[10px] tracking-tight">{item.label}</span>
              {item.badge > 0 && (
                <span className="absolute -top-1 right-2 rounded-full bg-red-500 px-1.5 py-0.5 text-[8px] text-white font-bold leading-none">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Payment Selection Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-zinc-950 border border-zinc-850 rounded-2xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <h3 className="text-lg font-bold text-white">Pilih Metode Pembayaran</h3>
              <button onClick={() => setSelectedInvoice(null)} className="text-zinc-450 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="bg-[#d4af37]/5 border border-[#d4af37]/10 p-4 rounded-xl text-xs text-[#d4af37] space-y-1">
              <p className="text-zinc-500 font-bold uppercase tracking-wider text-[9px]">Tagihan SPP:</p>
              <p className="font-extrabold text-sm text-[#d4af37]">
                Bulan {new Date(selectedInvoice.month + '-01').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
              </p>
              <div className="pt-2 border-t border-zinc-900 mt-2 flex justify-between items-center text-xs">
                <span className="text-zinc-400">Total Nominal:</span>
                <span className="font-extrabold text-white text-sm font-mono">Rp {parseFloat(selectedInvoice.amount).toLocaleString('id-ID')}</span>
              </div>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-450">Pilih Jalur Transfer (Tripay)</label>
                <select 
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="block w-full mt-1.5 rounded-xl border border-zinc-850 bg-zinc-900 py-2.5 px-3.5 text-sm text-white outline-none focus:border-[#d4af37]"
                >
                  <option value="Virtual Account Mandiri">Mandiri Virtual Account (MANDIRIVA)</option>
                  <option value="Virtual Account BCA">BCA Virtual Account (BCAVA)</option>
                  <option value="Virtual Account BNI">BNI Virtual Account (BNIVA)</option>
                  <option value="Virtual Account BRI">BRI Virtual Account (BRIVA)</option>
                  <option value="Gopay / QRIS">Gopay / QRIS Instan (QRIS)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-900">
                <button 
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="rounded-xl border border-zinc-850 bg-zinc-900 px-4 py-2.5 text-xs font-bold text-zinc-400 hover:text-white"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={paying}
                  className="rounded-xl bg-[#d4af37] hover:bg-[#f3cb65] px-6 py-2.5 text-xs font-bold text-black flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  {paying && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Dapatkan VA Code
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Instructions Modal */}
      {activeInstructions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-zinc-950 border border-zinc-850 rounded-2xl p-6 shadow-2xl max-h-[85vh] flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                <h3 className="text-base font-bold text-white">Panduan Transfer SPP</h3>
                <button onClick={() => setActiveInstructions(null)} className="text-zinc-450 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="bg-zinc-900/40 border border-zinc-900 p-4 rounded-xl text-center space-y-2 mt-4">
                <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest leading-none">Nomor Virtual Account / Kode Bayar</p>
                <div className="flex items-center justify-center gap-2">
                  <span className="font-mono text-[#d4af37] font-extrabold text-xl tracking-wide">{activeInstructions.tripay_pay_code}</span>
                  <button 
                    onClick={() => handleCopy(activeInstructions.tripay_pay_code)}
                    className="p-1.5 hover:bg-zinc-900 rounded text-[#d4af37] transition-colors"
                  >
                    <Copy className="h-4.5 w-4.5" />
                  </button>
                </div>
                <p className="text-xs text-zinc-400">Metode: <span className="font-bold text-white">{activeInstructions.tripay_payment_method}</span></p>
              </div>

              {/* Instructions steps list */}
              <div className="overflow-y-auto max-h-[40vh] mt-4 pr-1 space-y-4">
                {activeInstructions.tripay_instructions && (() => {
                  try {
                    const steps = JSON.parse(activeInstructions.tripay_instructions);
                    return steps.map((group, gIdx) => (
                      <div key={gIdx} className="space-y-2">
                        <h4 className="font-bold text-xs text-white uppercase tracking-wider">{group.title}</h4>
                        <ol className="list-decimal pl-4 text-xs text-zinc-400 space-y-1.5 font-light">
                          {group.steps.map((step, sIdx) => (
                            <li key={sIdx} className="leading-relaxed" dangerouslySetInnerHTML={{ __html: step }} />
                          ))}
                        </ol>
                      </div>
                    ));
                  } catch (e) {
                    return <p className="text-xs text-zinc-500">Gagal mengurai instruksi pembayaran.</p>;
                  }
                })()}
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-900 flex justify-end">
              <button 
                onClick={() => setActiveInstructions(null)}
                className="rounded-xl bg-[#d4af37] hover:bg-[#f3cb65] text-black px-6 py-2.5 text-xs font-bold transition-colors"
              >
                Tutup Panduan
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
