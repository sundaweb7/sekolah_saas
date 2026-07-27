import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, School, CreditCard, LogOut, Menu, X, ChevronRight, Bell, Shield, Settings
} from 'lucide-react';

export default function SuperAdminLayout({ children, activeTab, setActiveTab }) {
  const { logout, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { 
      id: 'overview',
      label: 'Dashboard', 
      icon: <LayoutDashboard className="h-5 w-5" /> 
    },
    { 
      id: 'schools',
      label: 'Data Sekolah', 
      icon: <School className="h-5 w-5" /> 
    },
    { 
      id: 'features',
      label: 'Manajemen Fitur', 
      icon: <Settings className="h-5 w-5" /> 
    },
    { 
      id: 'invoices',
      label: 'Riwayat Tagihan', 
      icon: <CreditCard className="h-5 w-5" /> 
    },
    { 
      id: 'domain_requests',
      label: 'Pengajuan Domain', 
      icon: <Settings className="h-5 w-5" /> 
    },
  ];

  return (
    <div className="min-h-screen bg-[#f3f7f9] text-zinc-800 flex font-sans admin-portal-theme">
      
      {/* Sidebar Drawer */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#ebf3f6] border-r border-zinc-200/80 transition-transform duration-300 transform lg:translate-x-0 lg:static lg:flex flex-col justify-between ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Top Header Section */}
        <div>
          <div className="h-16 flex items-center justify-between px-6 border-b border-zinc-200 bg-white">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-600 to-indigo-800 flex items-center justify-center font-bold text-white text-sm shadow-md">
                SA
              </div>
              <div className="min-w-0">
                <p className="font-extrabold text-sm text-zinc-900 truncate leading-tight">PAUDKU PUSAT</p>
                <p className="text-[10px] font-bold tracking-wider text-indigo-600 uppercase mt-0.5">Super Admin</p>
              </div>
            </div>
            <button className="lg:hidden text-zinc-550 hover:text-zinc-800" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>
  
          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {menuItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold transition-all group ${isActive ? 'bg-white text-zinc-900 shadow-sm border-l-4 border-indigo-600' : 'text-zinc-650 hover:text-zinc-900 hover:bg-white/40'}`}
                >
                  <div className="flex items-center gap-3.5">
                    <span className={isActive ? 'text-indigo-600' : 'text-zinc-455 group-hover:text-zinc-800 transition-colors'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="h-4 w-4 text-indigo-600" />}
                </button>
              );
            })}
          </nav>
        </div>
  
        {/* Bottom User Profile Section */}
        <div className="p-4 border-t border-zinc-200 bg-white/40">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-9 w-9 rounded-full bg-indigo-550/10 flex items-center justify-center text-xs font-bold text-indigo-600 uppercase border border-indigo-200">
              <Shield className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-xs text-zinc-800">{user?.full_name || 'Super Admin'}</p>
              <p className="text-[10px] text-zinc-550 truncate">SaaS Owner</p>
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
              SaaS Multi-Tenant Management Platform (Super Admin Portal)
            </span>
          </div>
  
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-full px-3 py-1">
              <Shield className="h-3.5 w-3.5" /> System Mode: SaaS Central
            </div>
            
            <div className="h-8 w-[1px] bg-zinc-200" />
            
            <button className="relative p-1.5 text-zinc-500 hover:text-zinc-800 rounded-lg transition-colors">
              <Bell className="h-4.5 w-4.5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-indigo-600" />
            </button>
          </div>
        </header>
  
        {/* Content Body wrapper */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
  
      </div>
  
    </div>
  );
}
