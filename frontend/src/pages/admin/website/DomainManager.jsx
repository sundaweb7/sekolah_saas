import { useState, useEffect } from 'react';
import api from '../../../config/axios';
import { 
  Globe, Info, FileText, CheckCircle2, AlertTriangle, 
  Hourglass, CheckSquare, XCircle, ArrowUpCircle, ShieldCheck 
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

export default function DomainManager() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Data States
  const [schoolInfo, setSchoolInfo] = useState(null);
  const [requestInfo, setRequestInfo] = useState(null);
  
  // Form States
  const [requestedDomain, setRequestedDomain] = useState('');
  const [documentFile, setDocumentFile] = useState(null);

  const fetchDomainData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/admin/website/domain-request');
      setSchoolInfo(response.data.school);
      setRequestInfo(response.data.request);
      if (response.data.request) {
        setRequestedDomain(response.data.request.requested_domain);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat status pengajuan domain.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDomainData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setSubmitting(true);

    if (!requestedDomain) {
      setError('Nama domain pengajuan wajib diisi.');
      setSubmitting(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('requested_domain', requestedDomain);
      if (documentFile) {
        formData.append('document_file', documentFile);
      }

      await api.post('/admin/website/domain-request', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setSuccessMsg('Pengajuan Custom Domain berhasil dikirim!');
      fetchDomainData();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengirim pengajuan domain.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[350px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-[#d4af37]"></div>
      </div>
    );
  }

  const isPremium = String(schoolInfo?.plan_name).toLowerCase() === 'premium';
  const isYearly = String(schoolInfo?.billing_cycle).toLowerCase() === 'yearly';

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Custom Domain</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Arahkan domain resmi sekolah Anda (seperti <strong className="text-zinc-800">.sch.id</strong>) langsung ke halaman web profil PAUDKU.
        </p>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-650 flex gap-2.5 items-start">
          <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="rounded-xl bg-green-50 border border-green-200 p-4 text-sm text-green-700 flex gap-2.5 items-start">
          <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 1. NON-PREMIUM BLOCKER */}
      {!isPremium && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center space-y-5 shadow-sm">
          <Globe className="h-16 w-16 text-zinc-350 mx-auto" />
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-lg font-bold text-zinc-900">Gunakan Domain Custom (.sch.id)</h3>
            <p className="text-sm text-zinc-500 leading-relaxed font-light">
              Fitur Custom Domain hanya tersedia eksklusif bagi pengguna <strong className="text-[#b38f1d] font-bold">Paket Premium</strong>. 
              Gunakan domain sekolah pribadi Anda untuk meningkatkan brand dan profesionalisme di mata wali murid.
            </p>
          </div>
          <div className="pt-2">
            <a 
              href="/admin/billing" 
              className="inline-flex items-center gap-2 rounded-full bg-[#d4af37] hover:bg-[#b38f1d] text-white font-bold text-sm px-6 py-3 transition-colors shadow-sm"
            >
              <ArrowUpCircle className="h-4.5 w-4.5" /> Upgrade ke Paket Premium
            </a>
          </div>
        </div>
      )}

      {/* 2. PREMIUM NOTIFICATION & STATUS LOGIC */}
      {isPremium && (
        <div className="grid md:grid-cols-3 gap-6 items-start">
          
          {/* Form & Status Request */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Active / Pending Status Banner */}
            {requestInfo && (
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 space-y-4 shadow-sm">
                <h3 className="font-bold text-sm uppercase tracking-wider text-zinc-400">Status Pengajuan</h3>
                
                <div className="flex items-center gap-3">
                  {requestInfo.status === 'pending' && (
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
                      <Hourglass className="h-5 w-5 animate-pulse" />
                    </div>
                  )}
                  {requestInfo.status === 'processing' && (
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
                      <Hourglass className="h-5 w-5 animate-spin" />
                    </div>
                  )}
                  {requestInfo.status === 'active' && (
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600 border border-green-200">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                  )}
                  {requestInfo.status === 'rejected' && (
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-650 border border-red-200">
                      <XCircle className="h-5 w-5" />
                    </div>
                  )}
                  
                  <div>
                    <h4 className="font-bold text-base text-zinc-900 leading-snug">
                      {requestInfo.requested_domain}
                    </h4>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {requestInfo.status === 'pending' && 'Menunggu diproses oleh Super Admin.'}
                      {requestInfo.status === 'processing' && 'Super Admin sedang mendaftarkan domain Anda.'}
                      {requestInfo.status === 'active' && 'Custom domain aktif dan sudah dapat diakses!'}
                      {requestInfo.status === 'rejected' && 'Pengajuan ditolak.'}
                    </p>
                  </div>
                </div>

                {requestInfo.admin_note && (
                  <div className="rounded-xl bg-zinc-50 border border-zinc-150 p-4 text-xs text-zinc-650 leading-relaxed font-light">
                    <strong className="text-zinc-800 block font-bold mb-1">Catatan Admin:</strong>
                    {requestInfo.admin_note}
                  </div>
                )}
              </div>
            )}

            {/* Submission Form (Only show if not active, or if rejected to allow resubmit) */}
            {(!requestInfo || requestInfo.status === 'rejected') && (
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                {!isYearly ? (
                  <div className="text-center py-6 space-y-4">
                    <Info className="h-12 w-12 text-amber-500 mx-auto" />
                    <div className="max-w-md mx-auto space-y-2">
                      <h4 className="font-bold text-zinc-900 text-base">Butuh Paket Premium Tahunan</h4>
                      <p className="text-xs text-zinc-500 leading-relaxed font-light">
                        Anda saat ini berlangganan <strong className="text-zinc-800">Paket Premium Bulanan</strong>. 
                        Sesuai ketentuan platform, fitur Custom Domain (.sch.id) hanya didukung penuh secara gratis khusus untuk pelanggan dengan siklus tagihan <strong className="text-green-600 font-bold">Tahunan (Yearly)</strong>.
                      </p>
                    </div>
                    <div className="pt-2">
                      <a 
                        href="/admin/billing"
                        className="inline-flex items-center gap-2 rounded-full bg-[#d4af37] hover:bg-[#b38f1d] text-white font-bold text-xs px-5 py-2.5 transition-colors shadow-sm"
                      >
                        Ubah Tagihan ke Tahunan
                      </a>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <h3 className="font-bold text-sm text-zinc-900">Formulir Pengajuan Domain Baru</h3>
                    
                    <div className="space-y-1">
                      <label htmlFor="reqDomain" className="text-xs font-bold text-zinc-650">Nama Domain yang Diinginkan</label>
                      <input 
                        id="reqDomain"
                        type="text"
                        required
                        placeholder="sekolahkami.sch.id"
                        value={requestedDomain}
                        onChange={(e) => setRequestedDomain(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50/50 text-sm outline-none focus:ring-2 focus:ring-[#d4af37] focus:border-transparent transition-all"
                      />
                      <p className="text-[10px] text-zinc-400 mt-1">Masukkan nama domain berakhiran resmi .sch.id yang ingin Anda gunakan.</p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-650 block">Dokumen Pendukung (ZIP / PDF / Gambar)</label>
                      <div className="flex items-center gap-3">
                        <label 
                          htmlFor="docFile" 
                          className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-zinc-200 hover:border-zinc-300 bg-white hover:bg-zinc-50 px-4 py-2.5 text-xs font-bold text-[#b38f1d] transition-all"
                        >
                          <FileText className="h-4 w-4" /> Pilih Berkas Dokumen
                        </label>
                        <input 
                          id="docFile"
                          type="file"
                          accept=".zip,.rar,.pdf,.jpg,.jpeg,.png"
                          onChange={(e) => setDocumentFile(e.target.files[0])}
                          className="hidden"
                        />
                        <span className="text-xs text-zinc-500 font-light truncate max-w-[200px]">
                          {documentFile ? documentFile.name : 'Belum ada file dipilih'}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-400 leading-relaxed font-light mt-1">
                        Unggah berkas persyaratan resmi dalam satu file (ZIP/PDF maks 5MB) berisi: SK Pendirian Sekolah, KTP Kepala Sekolah, dan Surat Kuasa (jika diwakilkan) untuk memudahkan pendaftaran ke PANDI.
                      </p>
                    </div>

                    {/* Pricing billing type warning */}
                    <div className="rounded-xl bg-zinc-50 border border-zinc-150 p-4 flex gap-3 items-start">
                      <Info className="h-5 w-5 text-zinc-550 shrink-0 mt-0.5" />
                      <div className="text-xs text-zinc-500 leading-relaxed font-light">
                        <span>
                          Anda berlangganan <strong className="text-zinc-800 font-bold">Paket Premium Tahunan</strong>. 
                          Biaya pembelian, setup, dan perpanjangan domain ini <strong className="text-green-600 font-bold">100% GRATIS</strong> ditanggung oleh PAUDKU.
                        </span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button 
                        type="submit"
                        disabled={submitting}
                        className="rounded-full bg-[#d4af37] hover:bg-[#b38f1d] disabled:bg-zinc-350 text-white font-bold text-xs uppercase tracking-widest px-6 py-3 transition-colors shadow-sm"
                      >
                        {submitting ? 'Mengirim...' : 'Ajukan Custom Domain'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

          </div>

          {/* Quick Guidance Info Sidebar */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 space-y-4 shadow-sm">
            <h3 className="font-bold text-sm text-zinc-900">Panduan & Alur</h3>
            
            <ul className="space-y-4 text-xs font-light leading-relaxed text-zinc-500">
              <li className="flex gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#d4af37]/10 text-xs font-bold text-[#b38f1d]">1</span>
                <span>Isi nama domain sekolah yang diinginkan (contoh: <strong>tkmelatiindah.sch.id</strong>) dan unggah persyaratan.</span>
              </li>
              <li className="flex gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#d4af37]/10 text-xs font-bold text-[#b38f1d]">2</span>
                <span>Super Admin akan memverifikasi kelengkapan berkas dokumen sekolah Anda.</span>
              </li>
              <li className="flex gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#d4af37]/10 text-xs font-bold text-[#b38f1d]">3</span>
                <span>Super Admin memproses pembelian dan setup domain resmi Anda di sistem dalam waktu 1-3 hari kerja.</span>
              </li>
              <li className="flex gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#d4af37]/10 text-xs font-bold text-[#b38f1d]">4</span>
                <span>Website profil sekolah secara otomatis aktif menggunakan alamat domain baru Anda.</span>
              </li>
            </ul>
          </div>

        </div>
      )}
    </div>
  );
}
