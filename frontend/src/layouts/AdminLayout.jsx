import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../config/axios';
import { 
  LayoutDashboard, Users, GraduationCap, Globe, CreditCard, 
  LogOut, Menu, X, ChevronRight, Bell, Settings, ArrowLeftRight, Newspaper, School, DollarSign, Award, BookOpen, Calendar
} from 'lucide-react';

export default function AdminLayout({ children }) {
  const { logout, user, refreshProfile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [schoolName, setSchoolName] = useState('PAUD/TK Admin');
  const [schoolSubdomain, setSchoolSubdomain] = useState('tkmelati');

  useEffect(() => {
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
  }, []);

  const menuItems = [
    { 
      label: 'Dashboard', 
      path: '/admin', 
      icon: <LayoutDashboard className="h-5 w-5" /> 
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
    { 
      label: 'Laporan Siswa', 
      path: '/admin/reports', 
      icon: <BookOpen className="h-5 w-5" />,
      feature: 'perkembangan_siswa'
    },
    { 
      label: 'Absensi & Jurnal', 
      path: '/admin/attendance-journals', 
      icon: <Calendar className="h-5 w-5" />,
      feature: 'absensi_siswa_jurnal'
    },
    { 
      label: 'Pembayaran', 
      path: '/admin/spp', 
      icon: <DollarSign className="h-5 w-5" />,
      feature: 'spp_siswa'
    },
    { 
      label: 'Pendaftaran PPDB', 
      path: '/admin/ppdb', 
      icon: <GraduationCap className="h-5 w-5" />,
      feature: 'ppdb'
    },
    { 
      label: 'Berita Sekolah', 
      path: '/admin/news', 
      icon: <Newspaper className="h-5 w-5" />,
      feature: 'company_profile'
    },
    { 
      label: 'Website Builder', 
      path: '/admin/website-builder', 
      icon: <Globe className="h-5 w-5" />,
      feature: 'company_profile'
    },
    { 
      label: 'Domain Custom', 
      path: '/admin/domain', 
      icon: <Globe className="h-5 w-5" />,
      feature: 'company_profile'
    },
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
  ];

  const filteredMenuItems = menuItems.filter(item => {
    if (!item.feature) return true;
    return user?.allowed_features?.includes(item.feature);
  });

  return (
    <div className="min-h-screen bg-[#f3f7f9] text-zinc-800 flex font-sans admin-portal-theme">
      
      {/* Sidebar Drawer */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#ebf3f6] border-r border-zinc-200/80 transition-transform duration-300 transform lg:translate-x-0 lg:static lg:flex flex-col justify-between ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Top Header Section */}
        <div>
          <div className="h-16 flex items-center justify-between px-6 border-b border-zinc-200 bg-white">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#d4af37] to-[#aa8410] flex items-center justify-center font-bold text-black text-sm shadow-md">
                P
              </div>
              <div className="min-w-0">
                <p className="font-extrabold text-sm text-zinc-900 truncate leading-tight">{schoolName}</p>
                <p className="text-[10px] font-bold tracking-wider text-[#aa8410] uppercase mt-0.5">Admin Portal</p>
              </div>
            </div>
            <button className="lg:hidden text-zinc-550 hover:text-zinc-800" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>
 
          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {filteredMenuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold transition-all group ${isActive ? 'bg-white text-zinc-900 shadow-sm border-l-4 border-[#d4af37]' : 'text-zinc-650 hover:text-zinc-900 hover:bg-white/40'}`}
                >
                  <div className="flex items-center gap-3.5">
                    <span className={isActive ? 'text-[#d4af37]' : 'text-zinc-450 group-hover:text-zinc-800 transition-colors'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="h-4 w-4 text-[#d4af37]" />}
                </Link>
              );
            })}
          </nav>
        </div>
 
        {/* Bottom User Profile Section */}
        <div className="p-4 border-t border-zinc-200 bg-white/40">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-9 w-9 rounded-full bg-zinc-200 flex items-center justify-center text-xs font-bold text-[#aa8410] uppercase border border-zinc-300">
              AD
            </div>
            <div className="min-w-0">
              <p className="font-bold text-xs text-zinc-800">Administrator</p>
              <p className="text-[10px] text-zinc-500 truncate">{schoolSubdomain}.paudku.local</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white hover:bg-red-50 hover:text-red-650 py-2.5 text-xs font-bold text-zinc-700 transition-all shadow-sm"
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
            
            <button className="relative p-1.5 text-zinc-500 hover:text-zinc-800 rounded-lg transition-colors">
              <Bell className="h-4.5 w-4.5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
            </button>
          </div>
        </header>
 
        {/* Content Children Body wrapper */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
 
      </div>
 
    </div>
  );
}
