import { useState, useEffect } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../config/axios';
import {
  LayoutDashboard, Users, GraduationCap, Globe, CreditCard,
  LogOut, Menu, X, ChevronRight, Bell, Settings, ArrowLeftRight, Newspaper, School, DollarSign, Award, BookOpen, Calendar, FileCheck, MailOpen, Image, Trophy, MessageCircle
} from 'lucide-react';

export default function AdminLayout({ children }) {
  const { logout, user, loading, refreshProfile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [schoolName, setSchoolName] = useState('PAUD/TK Admin');
  const [schoolSubdomain, setSchoolSubdomain] = useState('tkmelati');
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    if (loading || user?.role !== 'admin') return;
    const fetchSchoolInfo = async () => {
      try {
        const response = await api.get('/admin/dashboard/stats');
        if (response.data?.school) {
          setSchoolName(response.data.school.name);
          setSchoolSubdomain(response.data.school.subdomain);
          localStorage.setItem('subdomain', response.data.school.subdomain);
        }
      } catch (err) {
        console.error('Failed to load school name in layout', err);
      }
    };
    fetchSchoolInfo();
  }, [loading, user?.role]);

  useEffect(() => {
    if (loading || user?.role !== 'admin' || !user.allowed_features?.includes('communication')) return;
    const loadUnread = () => api.get('/communication/notifications', { params: { limit: 1 } })
      .then((response) => setUnreadNotifications(response.data?.unread_count || 0)).catch(() => {});
    loadUnread();
    const timer = window.setInterval(loadUnread, 60000);
    return () => window.clearInterval(timer);
  }, [loading, user]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Memuat...</div>;
  }
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') {
    const destination = user.role === 'superadmin' ? '/superadmin' : `/${user.role}`;
    return <Navigate to={destination} replace />;
  }

  const menuGroups = [
    {
      title: 'Utama',
      items: [
        {
          label: 'Dashboard',
          path: '/admin',
          icon: <LayoutDashboard className="h-5 w-5" />
        },
        {
          label: 'Komunikasi',
          path: '/admin/communication',
          icon: <MessageCircle className="h-5 w-5" />,
          feature: 'communication'
        },
        {
          label: 'Database Siswa',
          path: '/admin/students',
          icon: <Users className="h-5 w-5" />
        },
        {
          label: 'Manajemen Guru',
          path: '/admin/teachers',
          icon: <Award className="h-5 w-5" />
        },
        {
          label: 'Manajemen Kelas',
          path: '/admin/classes',
          icon: <School className="h-5 w-5" />
        },
      ]
    },
    {
      title: 'Akademik & KBM',
      items: [
        {
          label: 'Jadwal KBM',
          path: '/admin/kbm-schedules',
          icon: <Calendar className="h-5 w-5" />
        },
        {
          label: 'Absensi & Jurnal',
          path: '/admin/attendance-journals',
          icon: <Calendar className="h-5 w-5" />,
          feature: 'absensi_siswa_jurnal'
        },
        {
          label: 'Analitik Absensi',
          path: '/admin/attendance/analytics',
          icon: <Calendar className="h-5 w-5" />,
          feature: 'modern_attendance'
        },
        {
          label: 'Ekskul',
          path: '/admin/extracurriculars',
          icon: <Trophy className="h-5 w-5" />
        },
        {
          label: 'Laporan Siswa',
          path: '/admin/reports',
          icon: <BookOpen className="h-5 w-5" />,
          feature: 'perkembangan_siswa'
        },
      ]
    },
    {
      title: 'Administrasi & Keuangan',
      items: [
        {
          label: 'Pendaftaran PPDB',
          path: '/admin/ppdb',
          icon: <GraduationCap className="h-5 w-5" />,
          feature: 'ppdb'
        },
        {
          label: 'Pembayaran',
          path: '/admin/spp',
          icon: <DollarSign className="h-5 w-5" />,
          feature: 'spp_siswa'
        },
        {
          label: 'E-surat',
          path: '/admin/e-surat',
          icon: <MailOpen className="h-5 w-5" />
        },
        {
          label: 'Akreditasi',
          path: '/admin/accreditation',
          icon: <FileCheck className="h-5 w-5" />
        },
      ]
    },
    {
      title: 'Website Portal',
      items: [
        {
          label: 'Berita Sekolah',
          path: '/admin/news',
          icon: <Newspaper className="h-5 w-5" />,
          feature: 'company_profile'
        },
        {
          label: 'Galeri Foto',
          path: '/admin/gallery',
          icon: <Image className="h-5 w-5" />,
          feature: 'company_profile'
        },
        {
          label: 'Agenda Kegiatan',
          path: '/admin/events',
          icon: <Calendar className="h-5 w-5" />,
          feature: 'company_profile'
        },
        {
          label: 'Website Setting',
          path: '/admin/website-builder',
          icon: <Settings className="h-5 w-5" />,
          feature: 'company_profile'
        },
        {
          label: 'Domain Custom',
          path: '/admin/domain',
          icon: <Globe className="h-5 w-5" />,
          feature: 'company_profile'
        },
      ]
    },
    {
      title: 'Sistem & Pengaturan',
      items: [
        {
          label: 'Manajemen User',
          path: '/admin/users',
          icon: <Users className="h-5 w-5" />
        },
        {
          label: 'Biaya Langganan',
          path: '/admin/billing',
          icon: <CreditCard className="h-5 w-5" />
        },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#f3f7f9] text-zinc-800 flex font-sans admin-portal-theme">

      {/* Sidebar Drawer */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-zinc-950 border-r border-[#d9a425]/15 transition-transform duration-300 transform lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen flex flex-col justify-between ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>

        {/* Top Header Section */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-[#d9a425]/15 bg-zinc-950 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#d9a425] to-[#b8860b] flex items-center justify-center font-black text-black text-sm shadow-md">
              P
            </div>
            <div className="min-w-0">
              <p className="font-extrabold text-sm text-white truncate leading-tight">{schoolName}</p>
              <p className="text-[10px] font-bold tracking-wider text-[#d9a425] uppercase mt-0.5">Admin Portal</p>
            </div>
          </div>
          <button className="lg:hidden text-zinc-400 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Links - Scrollable */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
          {menuGroups.map((group, groupIdx) => {
            // Filter items in group based on user features
            const filteredItems = group.items.filter(item => {
              if (!item.feature) return true;
              return user?.allowed_features?.includes(item.feature);
            });

            if (filteredItems.length === 0) return null;

            return (
              <div key={groupIdx} className="space-y-1.5">
                <div className="text-[9px] font-extrabold text-zinc-550 uppercase tracking-widest px-3 mb-1">
                  {group.title}
                </div>
                {filteredItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-bold transition-all group ${isActive ? 'bg-[#d9a425] text-zinc-950 shadow-md shadow-[#d9a425]/10' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={isActive ? 'text-zinc-950' : 'text-zinc-400 group-hover:text-[#d9a425] transition-colors'}>
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                      </div>
                      {isActive && <ChevronRight className="h-3 w-3 text-zinc-950" />}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Bottom User Profile Section */}
        <div className="p-4 border-t border-zinc-900 bg-zinc-950/40">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-9 w-9 rounded-full bg-zinc-900 flex items-center justify-center text-xs font-bold text-[#d9a425] uppercase border border-zinc-800">
              AD
            </div>
            <div className="min-w-0">
              <p className="font-bold text-xs text-zinc-200">Administrator</p>
              <p className="text-[10px] text-zinc-500 truncate">{schoolSubdomain}.paudku.local</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-zinc-900 bg-zinc-900 hover:bg-red-950/30 hover:text-red-400 hover:border-red-900/30 py-2.5 text-xs font-bold text-zinc-400 transition-all shadow-sm"
          >
            <LogOut className="h-4 w-4" /> Keluar dari Sistem
          </button>
        </div>

      </aside>

      {/* Main Container Right Side */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top Navbar */}
        <header className="h-16 border-b border-zinc-200 bg-white/80 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button className="lg:hidden text-zinc-500 hover:text-zinc-800" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <Menu className="h-6 w-6" />
            </button>
            <span className="hidden md:inline-block text-xs font-bold text-zinc-400 uppercase tracking-widest">
              SaaS Multi-Tenant Management Platform
            </span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href={`/school/${schoolSubdomain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-xs font-bold text-zinc-650 hover:text-zinc-800 transition-all shadow-sm"
            >
              Lihat Portal Website ↗
            </a>

            <div className="h-8 w-[1px] bg-zinc-200" />

            <Link to="/admin/communication" className="relative p-1.5 text-zinc-500 hover:text-zinc-800 rounded-lg transition-colors">
              <Bell className="h-4.5 w-4.5" />
              {unreadNotifications > 0 && <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-red-500 px-1 text-center text-[9px] font-bold text-white">{unreadNotifications > 99 ? '99+' : unreadNotifications}</span>}
            </Link>
          </div>
        </header>

        {/* Content Children Body wrapper */}
        <main className="flex-1 overflow-y-auto admin-content">
          {children}
        </main>

      </div>

    </div>
  );
}
