import { useState, useEffect } from 'react';
import api from '../../config/axios';
import SuperAdminLayout from '../../layouts/SuperAdminLayout';
import { 
  School, CreditCard, Shield, Users, Loader2, AlertCircle, 
  CheckCircle, XCircle, Search, Calendar, DollarSign, Eye, X, LogIn, Power, Plus, Trash2, FileText
} from 'lucide-react';

function getBackendBase() {
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  const lastPart = parts[parts.length - 1];
  if (lastPart === 'localhost' || lastPart === '127' || parts.length === 1) {
    return 'http://localhost:8080';
  }
  const baseHost = parts.slice(-2).join('.');
  return `http://${baseHost}`;
}

const BACKEND_BASE = getBackendBase();

export default function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [schools, setSchools] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [features, setFeatures] = useState([]);
  const [domainRequests, setDomainRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter states
  const [schoolSearch, setSchoolSearch] = useState('');
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [domainSearch, setDomainSearch] = useState('');

  // Reject Request Modal States
  const [rejectingRequestId, setRejectingRequestId] = useState(null);
  const [rejectionNote, setRejectionNote] = useState('');

  // Feature CRUD states
  const [showCreateFeatureModal, setShowCreateFeatureModal] = useState(false);
  const [newFeatureName, setNewFeatureName] = useState('');
  const [newFeatureKey, setNewFeatureKey] = useState('');

  // Status updating state
  const [updatingSchoolId, setUpdatingSchoolId] = useState(null);
  const [clearingCache, setClearingCache] = useState(false);

  // Detail Modal States
  const [selectedSchoolDetail, setSelectedSchoolDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const handleViewDetail = async (schoolId) => {
    setLoadingDetail(true);
    setSelectedSchoolDetail(null);
    setShowDetailModal(true);
    try {
      const res = await api.get(`/superadmin/schools/detail/${schoolId}`);
      setSelectedSchoolDetail(res.data);
    } catch (err) {
      alert(err.message || 'Gagal memuat detail sekolah.');
      setShowDetailModal(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleClearCache = async () => {
    if (!window.confirm('Apakah Anda yakin ingin membersihkan seluruh cache platform?')) {
      return;
    }
    setClearingCache(true);
    try {
      await api.post('/superadmin/cache/clear');
      alert('Seluruh cache platform berhasil dibersihkan!');
    } catch (err) {
      alert(err.message || 'Gagal membersihkan cache platform.');
    } finally {
      setClearingCache(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, schoolsRes, invoicesRes, featuresRes, domainRes] = await Promise.all([
        api.get('/superadmin/stats'),
        api.get('/superadmin/schools'),
        api.get('/superadmin/invoices'),
        api.get('/superadmin/features'),
        api.get('/superadmin/domain-requests')
      ]);

      setStats(statsRes.data);
      setSchools(schoolsRes.data);
      setInvoices(invoicesRes.data);
      setFeatures(featuresRes.data);
      setDomainRequests(domainRes.data);
    } catch (err) {
      console.error('Failed to load superadmin data', err);
      setError(err.message || 'Gagal memuat data dari server pusat.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleSchoolStatus = async (schoolId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    if (!window.confirm(`Apakah Anda yakin ingin mengubah status sekolah ini menjadi ${newStatus.toUpperCase()}?`)) {
      return;
    }

    setUpdatingSchoolId(schoolId);
    try {
      await api.post(`/superadmin/schools/status/${schoolId}`, { status: newStatus });
      
      // Update local state
      setSchools(prev => prev.map(s => s.id === schoolId ? { ...s, status: newStatus } : s));
      
      // Update stats
      setStats(prev => ({
        ...prev,
        active_schools: newStatus === 'active' ? prev.active_schools + 1 : prev.active_schools - 1
      }));
    } catch (err) {
      alert(err.message || 'Gagal mengubah status sekolah.');
    } finally {
      setUpdatingSchoolId(null);
    }
  };

  const handleProcessDomain = async (id) => {
    if (!window.confirm('Tandai pengajuan domain ini sedang didaftarkan ke reseller?')) return;
    try {
      await api.post(`/superadmin/domain-requests/process/${id}`);
      alert('Status pengajuan berhasil diubah menjadi: Sedang Didaftarkan');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal memproses pengajuan domain.');
    }
  };

  const handleApproveDomain = async (id) => {
    if (!window.confirm('Setujui dan aktifkan custom domain ini di platform?')) return;
    try {
      await api.post(`/superadmin/domain-requests/approve/${id}`);
      alert('Pengajuan domain disetujui & domain telah AKTIF!');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal mengaktifkan pengajuan domain.');
    }
  };

  const handleRejectDomain = async (e) => {
    e.preventDefault();
    if (!rejectionNote) {
      alert('Alasan penolakan wajib diisi.');
      return;
    }

    try {
      await api.post(`/superadmin/domain-requests/reject/${rejectingRequestId}`, {
        admin_note: rejectionNote
      });
      alert('Pengajuan domain berhasil ditolak.');
      setRejectingRequestId(null);
      setRejectionNote('');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menolak pengajuan domain.');
    }
  };

  const [impersonatingId, setImpersonatingId] = useState(null);

  const handleImpersonate = async (schoolId) => {
    setImpersonatingId(schoolId);
    try {
      const res = await api.post(`/superadmin/impersonate/${schoolId}`);
      const { access_token, refresh_token, user, subdomain } = res.data;
      
      const protocol = window.location.protocol;
      const hostname = window.location.hostname;
      const port = window.location.port ? `:${window.location.port}` : '';
      
      const domainParts = hostname.split('.');
      let baseDomain = hostname;
      if (domainParts.length >= 2) {
        if (domainParts[domainParts.length - 2] === 'localhost' || domainParts[domainParts.length - 1] === 'localhost') {
          baseDomain = 'localhost';
        } else {
          baseDomain = domainParts.slice(-2).join('.');
        }
      }
      
      const redirectUrl = `${protocol}//${subdomain}.${baseDomain}${port}/login?sso_token=${access_token}&sso_refresh_token=${refresh_token}&sso_school_id=${user.school_id}&sso_role=${user.role}`;
      
      window.open(redirectUrl, '_blank');
    } catch (err) {
      alert(err.message || 'Gagal masuk sebagai tenant.');
    } finally {
      setImpersonatingId(null);
    }
  };

  const handleToggleFeature = async (featureKey, level, currentValue) => {
    const newValue = currentValue === 1 ? 0 : 1;
    try {
      await api.post('/superadmin/features/update', {
        feature_key: featureKey,
        level: level,
        value: newValue
      });
      // Update local state
      setFeatures(prev => prev.map(f => {
        if (f.feature_key === featureKey) {
          const propKey = level.startsWith('plan_') ? level : `level_${level}`;
          return {
            ...f,
            [propKey]: newValue
          };
        }
        return f;
      }));
    } catch (err) {
      alert(err.message || 'Gagal mengubah pengaturan fitur.');
    }
  };

  const handleCreateFeature = async (e) => {
    e.preventDefault();
    if (!newFeatureName || !newFeatureKey) {
      alert('Nama dan Key fitur wajib diisi.');
      return;
    }
    try {
      const res = await api.post('/superadmin/features/create', {
        feature_key: newFeatureKey,
        feature_name: newFeatureName
      });
      setFeatures(prev => [...prev, res.data]);
      setNewFeatureName('');
      setNewFeatureKey('');
      setShowCreateFeatureModal(false);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Gagal membuat fitur baru.');
    }
  };

  const handleDeleteFeature = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus fitur ini secara permanen?')) {
      return;
    }
    try {
      await api.delete(`/superadmin/features/delete/${id}`);
      setFeatures(prev => prev.filter(f => f.id !== id));
    } catch (err) {
      alert(err.message || 'Gagal menghapus fitur.');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f3f7f9]">
        <div className="text-center space-y-3">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-650 mx-auto" />
          <p className="text-sm font-bold text-zinc-500">Memuat Portal Super Admin...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f3f7f9] p-6 text-center text-zinc-500">
        <AlertCircle className="h-14 w-14 text-red-500 mb-4" />
        <p className="text-zinc-900 font-extrabold text-xl">Terjadi Gangguan Koneksi</p>
        <p className="text-sm mt-2 max-w-md">{error}</p>
        <button 
          onClick={fetchData} 
          className="mt-6 rounded-xl bg-indigo-600 text-white px-5 py-2.5 text-xs font-bold hover:bg-indigo-500 transition-all shadow-md"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  // Filter schools based on search
  const filteredSchools = schools.filter(s => 
    s.name.toLowerCase().includes(schoolSearch.toLowerCase()) || 
    s.subdomain.toLowerCase().includes(schoolSearch.toLowerCase())
  );

  // Filter invoices based on search
  const filteredInvoices = invoices.filter(inv => 
    inv.invoice_number.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
    (inv.school_name && inv.school_name.toLowerCase().includes(invoiceSearch.toLowerCase()))
  );

  return (
    <SuperAdminLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-8">
        
        {/* Header Title Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">Dashboard Pusat</h1>
            <p className="mt-1 text-sm text-zinc-500">Kelola database sekolah terdaftar, pendaftaran SaaS, dan pemantauan billing secara real-time.</p>
          </div>
          <div className="flex items-center gap-3 self-start md:self-auto">
            <button 
              disabled={clearingCache}
              onClick={handleClearCache}
              className="rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-xs font-bold text-red-655 px-4 py-2.5 shadow-sm transition-all flex items-center gap-1.5"
            >
              {clearingCache ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Bersihkan Cache'
              )}
            </button>
            <button 
              onClick={fetchData} 
              className="rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-bold text-zinc-700 px-4 py-2.5 shadow-sm transition-all"
            >
              Refresh Data
            </button>
          </div>
        </div>

        {/* 1. OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 mb-4">
                  <School className="h-5 w-5" />
                </div>
                <p className="text-3xl font-black text-zinc-900">{stats?.total_schools}</p>
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mt-1.5">Total Sekolah (Tenant)</p>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center text-green-600 mb-4">
                  <CheckCircle className="h-5 w-5" />
                </div>
                <p className="text-3xl font-black text-zinc-900">{stats?.active_schools}</p>
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mt-1.5">Sekolah Aktif</p>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                <div className="h-10 w-10 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600 mb-4">
                  <Users className="h-5 w-5" />
                </div>
                <p className="text-3xl font-black text-zinc-900">{stats?.total_users}</p>
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mt-1.5">Total Pengguna Terdaftar</p>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 mb-4">
                  <CreditCard className="h-5 w-5" />
                </div>
                <p className="text-3xl font-black text-zinc-900">
                  Rp {(stats?.total_revenue || 0).toLocaleString('id-ID')}
                </p>
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mt-1.5">Total Omzet SaaS</p>
              </div>

            </div>

            {/* Quick Summary Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Recent Schools */}
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-zinc-800">Sekolah Terbaru</h3>
                  <button onClick={() => setActiveTab('schools')} className="text-xs font-bold text-indigo-600 hover:text-indigo-500 transition-colors">
                    Lihat Semua
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-100 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                        <th className="pb-3">Sekolah</th>
                        <th className="pb-3">Subdomain</th>
                        <th className="pb-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50 text-xs">
                      {schools.slice(0, 5).map(s => (
                        <tr key={s.id}>
                          <td className="py-3.5 font-bold text-zinc-850">{s.name}</td>
                          <td className="py-3.5 text-zinc-550">{s.subdomain}.paudku.id</td>
                          <td className="py-3.5 text-right">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${s.status === 'active' ? 'bg-green-150/10 text-green-700' : 'bg-red-150/10 text-red-700'}`}>
                              {s.status === 'active' ? 'Aktif' : 'Non-aktif'}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {schools.length === 0 && (
                        <tr>
                          <td colSpan="3" className="py-4 text-center text-zinc-500">Belum ada sekolah terdaftar.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recent Invoices */}
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-zinc-800">Transaksi Terbaru</h3>
                  <button onClick={() => setActiveTab('invoices')} className="text-xs font-bold text-indigo-600 hover:text-indigo-500 transition-colors">
                    Lihat Semua
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-100 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                        <th className="pb-3">Invoice</th>
                        <th className="pb-3">Sekolah</th>
                        <th className="pb-3 text-right">Nominal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50 text-xs">
                      {invoices.slice(0, 5).map(inv => (
                        <tr key={inv.id}>
                          <td className="py-3.5 font-semibold text-zinc-800">{inv.invoice_number}</td>
                          <td className="py-3.5 text-zinc-550 truncate max-w-[120px]">{inv.school_name || 'Tidak Diketahui'}</td>
                          <td className="py-3.5 text-right font-bold text-zinc-900">Rp {parseInt(inv.amount).toLocaleString('id-ID')}</td>
                        </tr>
                      ))}
                      {invoices.length === 0 && (
                        <tr>
                          <td colSpan="3" className="py-4 text-center text-zinc-500">Belum ada transaksi.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* 2. SCHOOLS TAB */}
        {activeTab === 'schools' && (
          <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
            {/* Search filter bar */}
            <div className="p-5 border-b border-zinc-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
              <h3 className="text-lg font-bold text-zinc-800">Daftar Lembaga Sekolah</h3>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-zinc-400" />
                <input 
                  type="text" 
                  placeholder="Cari sekolah atau subdomain..."
                  value={schoolSearch}
                  onChange={(e) => setSchoolSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full rounded-xl border border-zinc-200 text-xs font-semibold focus:outline-none focus:border-indigo-650"
                />
              </div>
            </div>
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50/50 border-b border-zinc-150 text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest">
                    <th className="px-6 py-4">Nama Sekolah</th>
                    <th className="px-6 py-4">NPSN</th>
                    <th className="px-6 py-4">Jenjang</th>
                    <th className="px-6 py-4">Subdomain</th>
                    <th className="px-6 py-4">Kepala Sekolah</th>
                    <th className="px-6 py-4">No. WhatsApp</th>
                    <th className="px-6 py-4">Tanggal Daftar</th>
                    <th className="px-6 py-4">Paket</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-xs">
                  {filteredSchools.map(s => (
                    <tr key={s.id} className="hover:bg-zinc-50/40">
                      <td className="px-6 py-4.5 font-bold text-zinc-850">{s.name}</td>
                      <td className="px-6 py-4.5 text-zinc-650 font-semibold">{s.npsn || '-'}</td>
                      <td className="px-6 py-4.5 font-bold text-[#aa8410] uppercase">{s.level}</td>
                      <td className="px-6 py-4.5 text-indigo-600 font-semibold">{s.subdomain}.paudku.id</td>
                      <td className="px-6 py-4.5 text-zinc-700 font-semibold">{s.admin_name || '-'}</td>
                      <td className="px-6 py-4.5 text-zinc-700 font-semibold">
                        {s.phone ? (
                          <a 
                            href={`https://wa.me/${s.phone.replace(/[^0-9]/g, '')}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-green-600 hover:underline font-bold"
                          >
                            {s.phone} ↗
                          </a>
                        ) : (
                          <span className="text-zinc-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4.5 text-zinc-500">
                        {new Date(s.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </td>
                      <td className="px-6 py-4.5">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider border ${s.plan_name ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                          {s.plan_name ? s.plan_name : 'Uji Coba'}
                        </span>
                      </td>
                      <td className="px-6 py-4.5">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${s.status === 'active' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                          {s.status === 'active' ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                          {s.status === 'active' ? 'Aktif' : 'Non-aktif'}
                        </span>
                      </td>
                      <td className="px-6 py-4.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleViewDetail(s.id)}
                            title="Detail Sekolah"
                            className="rounded-lg border border-[#aa8410]/20 bg-[#aa8410]/5 hover:bg-[#aa8410]/15 p-2 text-[#aa8410] shadow-sm transition-all"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            disabled={impersonatingId !== null}
                            onClick={() => handleImpersonate(s.id)}
                            title="Login SSO ke Tenant"
                            className="rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 p-2 text-zinc-700 shadow-sm transition-all"
                          >
                            {impersonatingId === s.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <LogIn className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            disabled={updatingSchoolId === s.id}
                            onClick={() => handleToggleSchoolStatus(s.id, s.status)}
                            title={s.status === 'active' ? 'Nonaktifkan Sekolah' : 'Aktifkan Sekolah'}
                            className={`rounded-lg p-2 shadow-sm transition-all border ${s.status === 'active' ? 'border-red-200 bg-red-50 text-red-650 hover:bg-red-100/50' : 'border-green-200 bg-green-50 text-green-650 hover:bg-green-100/50'}`}
                          >
                            {updatingSchoolId === s.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Power className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredSchools.length === 0 && (
                    <tr>
                      <td colSpan="9" className="px-6 py-12 text-center text-zinc-500">Tidak ada sekolah yang cocok dengan pencarian.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. INVOICES TAB */}
        {activeTab === 'invoices' && (
          <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
            {/* Search filter bar */}
            <div className="p-5 border-b border-zinc-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
              <h3 className="text-lg font-bold text-zinc-800">Log Transaksi Langganan</h3>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-zinc-400" />
                <input 
                  type="text" 
                  placeholder="Cari invoice atau sekolah..."
                  value={invoiceSearch}
                  onChange={(e) => setInvoiceSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full rounded-xl border border-zinc-200 text-xs font-semibold focus:outline-none focus:border-indigo-650"
                />
              </div>
            </div>
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50/50 border-b border-zinc-150 text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest">
                    <th className="px-6 py-4">Nomor Invoice</th>
                    <th className="px-6 py-4">Sekolah</th>
                    <th className="px-6 py-4">Paket</th>
                    <th className="px-6 py-4">Nominal</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Metode Bayar</th>
                    <th className="px-6 py-4">Tanggal Pembayaran</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-xs">
                  {filteredInvoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-zinc-50/40">
                      <td className="px-6 py-4.5 font-bold text-zinc-800">{inv.invoice_number}</td>
                      <td className="px-6 py-4.5 font-semibold text-zinc-700">{inv.school_name || 'Tidak Diketahui'}</td>
                      <td className="px-6 py-4.5 text-zinc-500 uppercase tracking-wider text-[10px] font-extrabold">{inv.plan_name}</td>
                      <td className="px-6 py-4.5 font-bold text-zinc-900">Rp {parseInt(inv.amount).toLocaleString('id-ID')}</td>
                      <td className="px-6 py-4.5">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${inv.status === 'paid' ? 'bg-green-150/10 text-green-700' : inv.status === 'pending' ? 'bg-yellow-150/10 text-yellow-750' : 'bg-red-150/10 text-red-700'}`}>
                          {inv.status === 'paid' ? 'Lunas' : inv.status === 'pending' ? 'Pending' : 'Gagal'}
                        </span>
                      </td>
                      <td className="px-6 py-4.5 text-zinc-500 uppercase text-[10px] font-semibold">{inv.payment_method || '-'}</td>
                      <td className="px-6 py-4.5 text-zinc-550">
                        {inv.paid_at ? new Date(inv.paid_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>
                    </tr>
                  ))}
                  {filteredInvoices.length === 0 && (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center text-zinc-500">Tidak ada transaksi yang cocok.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. FEATURES TAB */}
        {activeTab === 'features' && (
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-zinc-800">Manajemen Fitur Platform</h3>
                <p className="text-xs text-zinc-500 mt-0.5">Konfigurasi ketersediaan fitur dasar & premium untuk setiap jenjang pendidikan (TK, SD, SMP, SMA, MTS/MA, SMK, PESANTREN).</p>
              </div>
              <button
                onClick={() => setShowCreateFeatureModal(true)}
                className="rounded-xl bg-[#d4af37] hover:bg-[#f3cb65] px-4 py-2.5 text-xs font-bold text-black flex items-center gap-1.5 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Tambah Fitur
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-zinc-150">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50/50 border-b border-zinc-150 text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest">
                    <th className="px-6 py-4">Nama Fitur</th>
                    <th className="px-6 py-4 text-center">TK</th>
                    <th className="px-6 py-4 text-center">SD</th>
                    <th className="px-6 py-4 text-center">SMP</th>
                    <th className="px-6 py-4 text-center">SMA</th>
                    <th className="px-6 py-4 text-center">MTS / MA</th>
                    <th className="px-6 py-4 text-center">SMK</th>
                    <th className="px-6 py-4 text-center border-r border-zinc-200">PESANTREN</th>
                    <th className="px-6 py-4 text-center bg-indigo-50/40 text-indigo-700 font-black">TRIAL</th>
                    <th className="px-6 py-4 text-center bg-indigo-50/40 text-indigo-700 font-black">BASIC</th>
                    <th className="px-6 py-4 text-center bg-indigo-50/40 text-indigo-700 font-black">STANDARD</th>
                    <th className="px-6 py-4 text-center bg-indigo-50/40 text-indigo-700 font-black">PREMIUM</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-xs">
                  {features.map(f => (
                    <tr key={f.id} className="hover:bg-zinc-50/40">
                      <td className="px-6 py-4.5 font-bold text-zinc-800 flex items-center justify-between gap-4">
                        <span>{f.feature_name}</span>
                        <button
                          onClick={() => handleDeleteFeature(f.id)}
                          className="text-red-500 hover:text-red-750 p-1 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus Fitur"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      </td>
                      
                      {/* TK */}
                      <td className="px-6 py-4.5 text-center">
                        <button
                          onClick={() => handleToggleFeature(f.feature_key, 'tk', f.level_tk)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${Number(f.level_tk) === 1 ? 'bg-[#aa8410]' : 'bg-zinc-200'}`}
                        >
                          <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${Number(f.level_tk) === 1 ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                      </td>

                      {/* SD */}
                      <td className="px-6 py-4.5 text-center">
                        <button
                          onClick={() => handleToggleFeature(f.feature_key, 'sd', f.level_sd)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${Number(f.level_sd) === 1 ? 'bg-[#aa8410]' : 'bg-zinc-200'}`}
                        >
                          <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${Number(f.level_sd) === 1 ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                      </td>

                      {/* SMP */}
                      <td className="px-6 py-4.5 text-center">
                        <button
                          onClick={() => handleToggleFeature(f.feature_key, 'smp', f.level_smp)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${Number(f.level_smp) === 1 ? 'bg-[#aa8410]' : 'bg-zinc-200'}`}
                        >
                          <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${Number(f.level_smp) === 1 ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                      </td>

                      {/* SMA */}
                      <td className="px-6 py-4.5 text-center">
                        <button
                          onClick={() => handleToggleFeature(f.feature_key, 'sma', f.level_sma)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${Number(f.level_sma) === 1 ? 'bg-[#aa8410]' : 'bg-zinc-200'}`}
                        >
                          <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${Number(f.level_sma) === 1 ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                      </td>

                      {/* MTS_MA */}
                      <td className="px-6 py-4.5 text-center">
                        <button
                          onClick={() => handleToggleFeature(f.feature_key, 'mts_ma', f.level_mts_ma)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${Number(f.level_mts_ma) === 1 ? 'bg-[#aa8410]' : 'bg-zinc-200'}`}
                        >
                          <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${Number(f.level_mts_ma) === 1 ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                      </td>

                      {/* SMK */}
                      <td className="px-6 py-4.5 text-center">
                        <button
                          onClick={() => handleToggleFeature(f.feature_key, 'smk', f.level_smk)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${Number(f.level_smk) === 1 ? 'bg-[#aa8410]' : 'bg-zinc-200'}`}
                        >
                          <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${Number(f.level_smk) === 1 ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                      </td>

                      {/* PESANTREN */}
                      <td className="px-6 py-4.5 text-center border-r border-zinc-200">
                        <button
                          onClick={() => handleToggleFeature(f.feature_key, 'pesantren', f.level_pesantren)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${Number(f.level_pesantren) === 1 ? 'bg-[#aa8410]' : 'bg-zinc-200'}`}
                        >
                          <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${Number(f.level_pesantren) === 1 ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                      </td>

                      {/* TRIAL */}
                      <td className="px-6 py-4.5 text-center bg-indigo-50/20">
                        <button
                          onClick={() => handleToggleFeature(f.feature_key, 'plan_trial', f.plan_trial)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${Number(f.plan_trial) === 1 ? 'bg-[#aa8410]' : 'bg-zinc-200'}`}
                        >
                          <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${Number(f.plan_trial) === 1 ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                      </td>

                      {/* BASIC */}
                      <td className="px-6 py-4.5 text-center bg-indigo-50/20">
                        <button
                          onClick={() => handleToggleFeature(f.feature_key, 'plan_basic', f.plan_basic)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${Number(f.plan_basic) === 1 ? 'bg-[#aa8410]' : 'bg-zinc-200'}`}
                        >
                          <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${Number(f.plan_basic) === 1 ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                      </td>

                      {/* STANDARD */}
                      <td className="px-6 py-4.5 text-center bg-indigo-50/20">
                        <button
                          onClick={() => handleToggleFeature(f.feature_key, 'plan_standard', f.plan_standard)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${Number(f.plan_standard) === 1 ? 'bg-[#aa8410]' : 'bg-zinc-200'}`}
                        >
                          <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${Number(f.plan_standard) === 1 ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                      </td>

                      {/* PREMIUM */}
                      <td className="px-6 py-4.5 text-center bg-indigo-50/20">
                        <button
                          onClick={() => handleToggleFeature(f.feature_key, 'plan_premium', f.plan_premium)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${Number(f.plan_premium) === 1 ? 'bg-[#aa8410]' : 'bg-zinc-200'}`}
                        >
                          <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${Number(f.plan_premium) === 1 ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. DOMAIN REQUESTS TAB */}
        {activeTab === 'domain_requests' && (
          <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
            {/* Search filter bar */}
            <div className="p-5 border-b border-zinc-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
              <h3 className="text-lg font-bold text-zinc-800">Manajemen Pengajuan Custom Domain</h3>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-zinc-400" />
                <input 
                  type="text" 
                  placeholder="Cari domain atau sekolah..."
                  value={domainSearch}
                  onChange={(e) => setDomainSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full rounded-xl border border-zinc-200 text-xs font-semibold focus:outline-none focus:border-indigo-650"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-zinc-50/50 border-b border-zinc-150 text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest">
                    <th className="px-6 py-4">Nama Sekolah</th>
                    <th className="px-6 py-4">Subdomain Asal</th>
                    <th className="px-6 py-4">Domain Pengajuan</th>
                    <th className="px-6 py-4">Jenis Tagihan</th>
                    <th className="px-6 py-4">Dokumen Pendukung</th>
                    <th className="px-6 py-4">Tanggal Pengajuan</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {domainRequests
                    .filter(req => {
                      const search = domainSearch.toLowerCase();
                      return (
                        req.school_name.toLowerCase().includes(search) ||
                        req.requested_domain.toLowerCase().includes(search)
                      );
                    })
                    .map((req) => (
                      <tr key={req.id} className="hover:bg-zinc-50/30">
                        <td className="px-6 py-4 font-bold text-zinc-900">{req.school_name}</td>
                        <td className="px-6 py-4 text-zinc-500">{req.school_subdomain}.paudku.id</td>
                        <td className="px-6 py-4 font-semibold text-indigo-650">{req.requested_domain}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${req.billing_type === 'yearly' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                            {req.billing_type === 'yearly' ? 'Premium Tahunan' : 'Premium Bulanan'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {req.document_file ? (
                            <a 
                              href={`${BACKEND_BASE}/${req.document_file}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[#aa8410] hover:text-[#c5a028] font-bold hover:underline"
                            >
                              <FileText className="h-4.5 w-4.5" /> Unduh Berkas
                            </a>
                          ) : (
                            <span className="text-zinc-400 font-light italic">Tidak ada berkas</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-zinc-500">
                          {new Date(req.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-widest ${
                            req.status === 'active' ? 'bg-green-100 text-green-800' :
                            req.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                            req.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {req.status === 'active' ? 'Aktif' :
                             req.status === 'processing' ? 'Didaftarkan' :
                             req.status === 'rejected' ? 'Ditolak' :
                             'Pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-1.5 whitespace-nowrap">
                          {req.status === 'pending' && (
                            <button
                              onClick={() => handleProcessDomain(req.id)}
                              className="rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1.5 text-xs font-bold border border-blue-200 transition-colors"
                            >
                              Proses Daftar
                            </button>
                          )}
                          {(req.status === 'pending' || req.status === 'processing') && (
                            <>
                              <button
                                onClick={() => handleApproveDomain(req.id)}
                                className="rounded-lg bg-green-550/10 hover:bg-green-550/20 text-green-700 px-3 py-1.5 text-xs font-bold border border-green-200 transition-colors"
                              >
                                Aktifkan
                              </button>
                              <button
                                onClick={() => setRejectingRequestId(req.id)}
                                className="rounded-lg bg-red-50 hover:bg-red-100 text-red-650 px-3 py-1.5 text-xs font-bold border border-red-200 transition-colors"
                              >
                                Tolak
                              </button>
                            </>
                          )}
                          {req.status === 'active' && (
                            <span className="text-zinc-400 font-semibold italic text-[10px]">Telah Selesai</span>
                          )}
                          {req.status === 'rejected' && (
                            <span className="text-red-500 font-semibold italic text-[10px]">Ditolak</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  {domainRequests.length === 0 && (
                    <tr>
                      <td colSpan="8" className="py-12 text-center text-zinc-400 font-light">Tidak ada antrean pengajuan custom domain saat ini.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* Detail School Modal */}
      {showDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <div className="flex items-center gap-2">
                <School className="h-6 w-6 text-[#aa8410]" />
                <h3 className="text-lg font-extrabold text-zinc-950">Detail Lembaga Sekolah</h3>
              </div>
              <button 
                onClick={() => setShowDetailModal(false)} 
                className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {loadingDetail ? (
              <div className="py-20 flex flex-col items-center justify-center space-y-3">
                <Loader2 className="h-8 w-8 animate-spin text-[#aa8410]" />
                <p className="text-xs font-bold text-zinc-500">Memuat detail sekolah...</p>
              </div>
            ) : selectedSchoolDetail ? (
              <div className="space-y-6">
                
                {/* School Header Info */}
                <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-150 space-y-3">
                  <h4 className="text-xl font-black text-zinc-900">{selectedSchoolDetail.school.name}</h4>
                  <div className="grid grid-cols-3 gap-4 text-xs">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-450">Subdomain</p>
                      <p className="font-bold text-indigo-600 mt-0.5">{selectedSchoolDetail.school.subdomain}.paudku.id</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-450">NPSN</p>
                      <p className="font-bold text-zinc-800 mt-0.5">{selectedSchoolDetail.school.npsn || 'Belum Diisi'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-450">Jenjang</p>
                      <p className="font-bold text-[#aa8410] mt-0.5 uppercase">{selectedSchoolDetail.school.level}</p>
                    </div>
                  </div>
                </div>

                {/* Subscription Info */}
                {selectedSchoolDetail.subscription && (
                  <div className="bg-indigo-50/50 rounded-2xl p-5 border border-indigo-100 space-y-3">
                    <h5 className="text-xs font-bold uppercase tracking-widest text-indigo-800">Status Layanan & Langganan</h5>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">Paket Aktif</p>
                        <p className="font-extrabold text-zinc-900 uppercase mt-0.5">
                          {selectedSchoolDetail.subscription.plan_name} 
                          {selectedSchoolDetail.subscription.plan_type === 'trial' ? ' (Uji Coba 7 Hari)' : ' (Berbayar)'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">Masa Berlaku</p>
                        <p className="font-bold text-zinc-850 mt-0.5">
                          {new Date(selectedSchoolDetail.subscription.expires_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Stats Section */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="border border-zinc-200 rounded-xl p-4 text-center bg-white shadow-sm">
                    <p className="text-2xl font-black text-zinc-900">{selectedSchoolDetail.stats.total_students}</p>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Siswa</p>
                  </div>
                  <div className="border border-zinc-200 rounded-xl p-4 text-center bg-white shadow-sm">
                    <p className="text-2xl font-black text-zinc-900">{selectedSchoolDetail.stats.total_teachers}</p>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Guru</p>
                  </div>
                  <div className="border border-zinc-200 rounded-xl p-4 text-center bg-white shadow-sm">
                    <p className="text-2xl font-black text-zinc-900">{selectedSchoolDetail.stats.total_classes}</p>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Kelas</p>
                  </div>
                </div>

                {/* Profile Detail */}
                <div className="space-y-4">
                  <h5 className="text-xs font-bold uppercase tracking-widest text-zinc-455 border-b border-zinc-100 pb-1.5">Profil Administrator / Kepala Sekolah</h5>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase">Nama Lengkap</p>
                      <p className="font-semibold text-zinc-800 mt-0.5">{selectedSchoolDetail.admin?.full_name || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase">Email Akun</p>
                      <p className="font-semibold text-zinc-800 mt-0.5">{selectedSchoolDetail.admin?.email || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase">No. WhatsApp</p>
                      <p className="font-semibold text-zinc-800 mt-0.5">{selectedSchoolDetail.admin?.phone || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase">Tanggal Bergabung</p>
                      <p className="font-semibold text-zinc-800 mt-0.5">
                        {new Date(selectedSchoolDetail.school.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="pt-4 border-t border-zinc-200 flex justify-end">
                  <button 
                    onClick={() => setShowDetailModal(false)}
                    className="rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 px-5 py-2.5 text-xs font-bold text-zinc-700 transition-all"
                  >
                    Tutup
                  </button>
                </div>

              </div>
            ) : (
              <div className="py-10 text-center text-zinc-550">
                Gagal memuat data detail.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tambah Fitur Modal */}
      {showCreateFeatureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <h3 className="text-lg font-extrabold text-zinc-950">Tambah Fitur Baru</h3>
              <button 
                onClick={() => setShowCreateFeatureModal(false)} 
                className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFeature} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-600 uppercase">Nama Fitur</label>
                <input 
                  type="text"
                  placeholder="Contoh: Laporan Keuangan"
                  value={newFeatureName}
                  onChange={(e) => setNewFeatureName(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#d4af37]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-600 uppercase">Key Fitur (Unique & Lowercase)</label>
                <input 
                  type="text"
                  placeholder="Contoh: laporan_keuangan"
                  value={newFeatureKey}
                  onChange={(e) => setNewFeatureKey(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#d4af37]"
                  required
                />
              </div>

              <div className="pt-4 border-t border-zinc-100 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setShowCreateFeatureModal(false)}
                  className="rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 px-4 py-2.5 text-xs font-bold text-zinc-700 transition-all"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="rounded-xl bg-[#d4af37] hover:bg-[#f3cb65] px-5 py-2.5 text-xs font-bold text-black shadow-sm transition-all"
                >
                  Simpan Fitur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Domain Request Modal */}
      {rejectingRequestId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
              <h3 className="text-base font-extrabold text-zinc-950">Tolak Pengajuan Domain</h3>
              <button 
                onClick={() => setRejectingRequestId(null)} 
                className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleRejectDomain} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-zinc-650">Alasan Penolakan</label>
                <textarea 
                  rows="3"
                  placeholder="Contoh: Dokumen SK Pendirian Sekolah tidak terbaca / salah upload."
                  value={rejectionNote}
                  onChange={(e) => setRejectionNote(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/50 text-xs outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-550 transition-all"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 text-xs">
                <button 
                  type="button"
                  onClick={() => setRejectingRequestId(null)}
                  className="rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 px-4 py-2 transition-all font-bold text-zinc-700"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="rounded-xl bg-red-600 hover:bg-red-555 px-5 py-2 font-bold text-white shadow-sm transition-all"
                >
                  Tolak Pengajuan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

  </SuperAdminLayout>
);
}
