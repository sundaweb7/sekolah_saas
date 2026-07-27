import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../config/axios';
import { 
  CreditCard, ShieldAlert, Award, FileText, Check, 
  ArrowUpCircle, AlertCircle, Loader2 
} from 'lucide-react';

export default function BillingOverview() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBillingData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/billing/status');
      setData(response.data);
    } catch (err) {
      setError('Gagal memuat status langganan sekolah.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingData();
  }, []);

  const handleSelectPlan = (planName) => {
    navigate(`/admin/billing/checkout?plan=${planName}`);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f3f7f9] text-zinc-900">
        <Loader2 className="h-8 w-8 animate-spin text-[#d4af37]" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f3f7f9] text-red-500 p-6 text-center">
        <AlertCircle className="h-8 w-8 mb-2" />
        <p>{error || 'Terjadi kesalahan sistem.'}</p>
      </div>
    );
  }

  const { school, usage, quotas, invoices } = data;

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div className="space-y-6">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-950">Paket Langganan & Tagihan</h1>
          <p className="mt-1 text-sm text-zinc-550">
            Kelola langganan sekolah Anda, lihat invoice pembayaran, dan tingkatkan paket fitur.
          </p>
        </div>

        {/* Current Active Plan Card */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
          <div className="space-y-3">
            <span className="rounded-full bg-[#d4af37]/10 px-3 py-1 text-xs font-bold text-[#aa8410] uppercase">
              Paket Pilihan Aktif
            </span>
            <h2 className="text-3xl font-extrabold text-zinc-950 uppercase tracking-tight">
              {school.subscription_type === 'trial' ? 'UJI COBA PREMIUM (7 Hari)' : `${school.subscription_plan} Plan`}
            </h2>
            <p className="text-sm text-zinc-550">
              Masa aktif uji coba/langganan sekolah berakhir pada: <strong className="text-zinc-800">{school.expires_at}</strong>
            </p>
          </div>

          <div className="border-t md:border-t-0 md:border-l border-zinc-200 pt-4 md:pt-0 md:pl-8 space-y-2">
            <p className="text-xs text-zinc-500 uppercase font-semibold">Penggunaan Kuota Siswa:</p>
            <p className="text-lg font-bold text-zinc-900">
              {usage.students} / {quotas[school.subscription_plan]?.students || 100} Siswa
            </p>
            <div className="h-1.5 w-48 rounded-full bg-zinc-100 overflow-hidden">
              <div 
                style={{ width: `${Math.min((usage.students / (quotas[school.subscription_plan]?.students || 100)) * 100, 100)}%` }} 
                className="h-full bg-[#d4af37] rounded-full"
              />
            </div>
          </div>
        </div>

        {/* Pricing/Upgrade Plans Grid */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-zinc-950 flex items-center gap-2">
            <Award className="h-5 w-5 text-[#aa8410]" />
            Tingkatkan atau Pilih Paket Layanan
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Basic Plan */}
            <div className={`rounded-2xl border p-6 flex flex-col justify-between bg-white ${
              school.subscription_plan === 'basic' ? 'border-[#d4af37]' : 'border-zinc-200'
            } shadow-sm`}>
              <div className="space-y-4">
                <div>
                  <h4 className="font-extrabold text-lg text-zinc-900 uppercase">Basic</h4>
                  <p className="text-xs text-zinc-500 mt-1 font-light">Esensial profile dan penerimaan siswa baru.</p>
                </div>
                <div className="text-2xl font-extrabold text-zinc-950">
                  Rp 25.000<span className="text-xs font-normal text-zinc-500"> / bulan</span>
                </div>
                <ul className="space-y-2 text-xs text-zinc-650 pt-4 border-t border-zinc-150 font-light">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-[#aa8410] shrink-0" /> Website Company Profile Sekolah</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-[#aa8410] shrink-0" /> PPDB Online Mandiri</li>
                </ul>
              </div>
              <button
                disabled={school.subscription_type !== 'trial' && (school.subscription_plan === 'basic' || school.subscription_plan === 'standard' || school.subscription_plan === 'premium')}
                onClick={() => handleSelectPlan('basic')}
                className="w-full mt-8 rounded-xl bg-zinc-100 hover:bg-zinc-200 px-4 py-2.5 text-xs font-bold text-zinc-700 transition-colors disabled:opacity-50"
              >
                {school.subscription_type === 'trial' ? 'Pilih Basic' : 
                 school.subscription_plan === 'basic' ? '✓ Paket Aktif' : 
                 (school.subscription_plan === 'standard' || school.subscription_plan === 'premium') ? 'Downgrade Tidak Diizinkan' : 'Pilih Basic'}
              </button>
            </div>

            {/* Standard Plan */}
            <div className={`rounded-2xl border p-6 flex flex-col justify-between bg-white ${
              school.subscription_plan === 'standard' && school.subscription_type !== 'trial' ? 'border-[#d4af37] bg-amber-50/10' : 'border-zinc-200'
            } shadow-sm`}>
              <div className="space-y-4">
                <div>
                  <h4 className="font-extrabold text-lg text-zinc-900 uppercase">Standard</h4>
                  <p className="text-xs text-zinc-500 mt-1 font-light">Solusi administrasi, SPP, dan kehadiran lengkap.</p>
                </div>
                <div className="text-2xl font-extrabold text-zinc-950">
                  Rp 50.000<span className="text-xs font-normal text-zinc-500"> / bulan</span>
                </div>
                <ul className="space-y-2 text-xs text-zinc-650 pt-4 border-t border-zinc-150 font-light">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-[#aa8410] shrink-0" /> Semua Fitur Paket Basic</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-[#aa8410] shrink-0" /> Fitur Absensi Guru (GPS) &amp; Siswa</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-[#aa8410] shrink-0" /> Fitur SPP Siswa Digital</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-[#aa8410] shrink-0" /> Maksimal 100 Siswa Aktif</li>
                </ul>
              </div>
              <button
                disabled={school.subscription_type !== 'trial' && (school.subscription_plan === 'standard' || school.subscription_plan === 'premium')}
                onClick={() => handleSelectPlan('standard')}
                className="w-full mt-8 rounded-xl bg-[#d4af37] hover:bg-[#f3cb65] px-4 py-2.5 text-xs font-bold text-black transition-colors disabled:opacity-50"
              >
                {school.subscription_type === 'trial' ? 'Pilih Standard' :
                 school.subscription_plan === 'standard' ? '✓ Paket Aktif' : 
                 (school.subscription_plan === 'premium') ? 'Downgrade Tidak Diizinkan' : 'Pilih Standard'}
              </button>
            </div>

            {/* Premium Plan */}
            <div className={`rounded-2xl border p-6 flex flex-col justify-between bg-white ${
              school.subscription_plan === 'premium' && school.subscription_type !== 'trial' ? 'border-[#d4af37]' : 'border-zinc-200'
            } shadow-sm`}>
              <div className="space-y-4">
                <div>
                  <h4 className="font-extrabold text-lg text-zinc-900 uppercase">Premium</h4>
                  <p className="text-xs text-zinc-500 mt-1 font-light">Kapasitas besar dengan dukungan Domain Custom.</p>
                </div>
                <div className="text-2xl font-extrabold text-zinc-950">
                  Rp 100.000<span className="text-xs font-normal text-zinc-500"> / bulan</span>
                </div>
                <ul className="space-y-2 text-xs text-zinc-650 pt-4 border-t border-zinc-150 font-light">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-[#aa8410] shrink-0" /> Semua Fitur Paket Standar</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-[#aa8410] shrink-0" /> Maksimal 300 Siswa Aktif</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-[#aa8410] shrink-0" /> Domain Custom (.sch.id) khusus Paket Tahunan</li>
                </ul>
              </div>
              <button
                disabled={school.subscription_plan === 'premium' && school.subscription_type !== 'trial'}
                onClick={() => handleSelectPlan('premium')}
                className="w-full mt-8 rounded-xl bg-zinc-100 hover:bg-zinc-200 px-4 py-2.5 text-xs font-bold text-zinc-700 transition-colors disabled:opacity-50"
              >
                {school.subscription_plan === 'premium' && school.subscription_type !== 'trial' ? '✓ Paket Aktif' : 'Pilih Premium'}
              </button>
            </div>
          </div>
        </div>

        {/* Invoice History Table */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-zinc-950 flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#aa8410]" />
            Riwayat Invoice Tagihan
          </h3>

          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
            {invoices.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-sm">
                Belum ada riwayat tagihan atau invoice pembayaran.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 bg-zinc-50 text-xs font-bold uppercase tracking-wider text-zinc-500">
                      <th className="px-6 py-4">No. Invoice</th>
                      <th className="px-6 py-4">Nominal</th>
                      <th className="px-6 py-4">Paket</th>
                      <th className="px-6 py-4">Metode Bayar</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Tautan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-150">
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-zinc-50 transition-colors text-sm">
                        <td className="px-6 py-4 font-mono font-bold text-zinc-950">{inv.invoice_number}</td>
                        <td className="px-6 py-4 font-bold text-zinc-800">Rp {parseFloat(inv.amount).toLocaleString('id-ID')}</td>
                        <td className="px-6 py-4 uppercase font-bold text-xs text-zinc-500">{inv.plan_name}</td>
                        <td className="px-6 py-4 text-zinc-650">{inv.payment_method}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
                            inv.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {inv.payment_url && inv.status === 'unpaid' && (
                            <a 
                              href={inv.payment_url} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-xs text-[#aa8410] hover:text-[#d4af37] font-bold"
                            >
                              Bayar Sekarang ↗
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
