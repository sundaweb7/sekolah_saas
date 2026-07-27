import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../config/axios';
import { 
  Users, Calendar, FileText, Globe, HardDrive, 
  CreditCard, ShieldCheck, Activity, Loader2, LogOut, AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AdminDashboard() {
  const { logout, user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchDashboardStats = async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await api.get('/admin/dashboard/stats');
      setData(response.data);
    } catch (err) {
      console.error('Failed to load dashboard statistics', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505] text-white">
        <Loader2 className="h-8 w-8 animate-spin text-[#d4af37]" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <div>
          <p className="font-bold text-lg text-zinc-900">Gagal Memuat Data Dashboard</p>
          <p className="text-sm text-zinc-500 mt-1">Sesi login mungkin telah berakhir atau terjadi gangguan jaringan.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={fetchDashboardStats} 
            className="rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 px-4 py-2.5 text-sm font-bold text-zinc-700 transition-all"
          >
            Muat Ulang
          </button>
          <button 
            onClick={() => { sessionStorage.clear(); localStorage.clear(); window.location.href = '/login'; }} 
            className="rounded-xl bg-[#d4af37] hover:bg-[#f3cb65] px-4 py-2.5 text-sm font-bold text-black transition-all flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" /> Login Ulang
          </button>
        </div>
      </div>
    );
  }

  const { counts, school, storage, activity_logs, chart_data } = data;

  // Render SVG Column Chart for registrations
  const maxVal = Math.max(...chart_data.map(d => d.value)) || 1;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* Left Side: Stats and Chart */}
      <div className="lg:col-span-2 space-y-8">
        
        {/* Welcome Panel */}
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">Selamat Datang, Admin</h1>
          <p className="mt-1 text-sm text-zinc-550">Berikut adalah ikhtisar operasional dan metrik platform sekolah Anda hari ini.</p>
        </div>

        {/* Stats Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          <Link to="/admin/students" className="rounded-xl border border-zinc-200 bg-white p-5 hover:border-zinc-350 hover:shadow-sm transition-all">
            <Users className="h-5 w-5 text-[#aa8410] mb-3" />
            <p className="text-2xl font-bold text-zinc-900">{counts.students}</p>
            <p className="text-xs text-zinc-500 mt-1">Siswa Aktif</p>
          </Link>
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <Users className="h-5 w-5 text-[#aa8410] mb-3" />
            <p className="text-2xl font-bold text-zinc-900">{counts.teachers}</p>
            <p className="text-xs text-zinc-500 mt-1">Guru Pendidik</p>
          </div>
          <Link to="/admin/ppdb" className="rounded-xl border border-zinc-200 bg-white p-5 hover:border-zinc-350 hover:shadow-sm transition-all">
            <Calendar className="h-5 w-5 text-[#aa8410] mb-3" />
            <p className="text-2xl font-bold text-zinc-900">{counts.ppdb}</p>
            <p className="text-xs text-zinc-500 mt-1">Pelamar PPDB</p>
          </Link>
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <Globe className="h-5 w-5 text-[#aa8410] mb-3" />
            <p className="text-2xl font-bold text-zinc-900">1.2K</p>
            <p className="text-xs text-zinc-500 mt-1">Pengunjung Web</p>
          </div>
        </div>

        {/* Dynamic Chart block */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm space-y-6">
          <h3 className="text-lg font-bold text-zinc-800">Tren Pendaftaran PPDB</h3>
          <div className="h-64 flex items-end justify-between gap-4 pt-4 border-b border-zinc-200">
            {chart_data.map((d, i) => {
              const pct = (d.value / maxVal) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group relative">
                  <div className="w-full bg-[#d4af37]/85 hover:bg-[#d4af37] rounded-t-lg transition-all" style={{ height: `${Math.max(pct, 5)}%` }} />
                  <span className="text-[10px] text-zinc-550 font-semibold">{d.label}</span>
                  {/* Tooltip */}
                  <span className="absolute -top-8 bg-zinc-900 text-white px-2 py-0.5 rounded text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
                    {d.value} Pelamar
                  </span>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Right Side: Quick Action and Logs */}
      <div className="space-y-8">
        
        {/* Subscription Block */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#aa8410]">
            <CreditCard className="h-4 w-4" /> Status Berlangganan SaaS
          </div>
          <div>
            <p className="text-xs text-zinc-500">Paket Langganan:</p>
            <p className="text-xl font-bold text-zinc-900 mt-0.5 uppercase">
              {school.subscription_type === 'trial' ? 'UJI COBA PREMIUM (7 Hari)' : `${school.subscription_plan} Plan`}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Batas Waktu Langganan:</p>
            <p className="text-sm font-bold text-zinc-700 mt-0.5">
              {new Date(school.expires_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="rounded-lg bg-green-500/5 border border-green-500/20 px-3.5 py-2.5 flex items-center gap-2 text-xs text-green-700 font-bold">
            <ShieldCheck className="h-4 w-4 text-green-600" /> Paket Anda aktif dan aman.
          </div>
        </div>

        {/* Media Disk space storage usage */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#aa8410]">
            <HardDrive className="h-4 w-4" /> Kuota Penyimpanan Media
          </div>
          <div className="flex justify-between text-xs text-zinc-500">
            <span>Penyimpanan Terpakai:</span>
            <span className="font-bold text-zinc-800">{storage.used} MB / {storage.limit} MB</span>
          </div>
          <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden border border-zinc-200">
            <div className="h-full bg-[#d4af37] rounded-full" style={{ width: `${Math.min((storage.used / storage.limit) * 100, 100)}%` }} />
          </div>
          <p className="text-[10px] text-zinc-500 leading-relaxed">
            Menyimpan berkas Akta/KK, foto profil siswa, serta foto galeri sekolah Anda.
          </p>
        </div>

        {/* Quick Menu */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-zinc-800">Menu Cepat</h3>
          <div className="grid grid-cols-1 gap-2.5 text-sm">
            <Link to="/admin/students" className="rounded-lg bg-zinc-50 hover:bg-zinc-100 p-3 border border-zinc-200 hover:border-zinc-300 transition-all text-zinc-700 font-bold">
              Data Master Siswa
            </Link>
            <Link to="/admin/website-builder" className="rounded-lg bg-zinc-50 hover:bg-zinc-100 p-3 border border-zinc-200 hover:border-zinc-300 transition-all text-zinc-700 font-bold">
              Website Builder & Tema
            </Link>
            <Link to="/admin/ppdb" className="rounded-lg bg-zinc-50 hover:bg-zinc-100 p-3 border border-zinc-200 hover:border-zinc-300 transition-all text-zinc-700 font-bold">
              Pendaftaran PPDB Online
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
}
