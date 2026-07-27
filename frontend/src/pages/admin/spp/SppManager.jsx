import { useState, useEffect } from 'react';
import api from '../../../config/axios';
import { 
  Plus, Search, Trash2, AlertCircle, RefreshCw, X, Loader2, DollarSign, CheckCircle
} from 'lucide-react';

export default function SppManager() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState(null);

  // Modal & Confirmation States
  const [confirmingInvoiceId, setConfirmingInvoiceId] = useState(null);
  const [deletingInvoiceId, setDeletingInvoiceId] = useState(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [paymentType, setPaymentType] = useState('monthly');
  const [description, setDescription] = useState('');
  const [genMonth, setGenMonth] = useState(() => {
    const d = new Date();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${d.getFullYear()}-${month}`;
  });
  const [genAmount, setGenAmount] = useState(250000);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/spp');
      setInvoices(response.data || []);
    } catch (error) {
      console.error('Failed to fetch payments', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setGenerating(true);
    setMessage(null);
    try {
      const res = await api.post('/admin/spp/generate', {
        payment_type: paymentType,
        month: paymentType === 'monthly' ? genMonth : null,
        description: paymentType === 'monthly' ? (description || `SPP Bulan ${genMonth}`) : description,
        amount: Number(genAmount)
      });
      setMessage({ type: 'success', text: res.message || 'Tagihan pembayaran berhasil digenerate!' });
      setShowGenerateModal(false);
      setDescription('');
      fetchInvoices();
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Gagal membuat tagihan pembayaran.' });
    } finally {
      setGenerating(false);
    }
  };

  const submitConfirm = async (id) => {
    try {
      await api.post(`/admin/spp/confirm/${id}`);
      fetchInvoices();
      setMessage({ type: 'success', text: 'Pembayaran berhasil dikonfirmasi!' });
      setConfirmingInvoiceId(null);
    } catch (error) {
      alert('Gagal mengkonfirmasi pembayaran.');
    }
  };

  const submitDelete = async (id) => {
    try {
      await api.delete(`/admin/spp/delete/${id}`);
      fetchInvoices();
      setMessage({ type: 'success', text: 'Tagihan berhasil dihapus.' });
      setDeletingInvoiceId(null);
    } catch (error) {
      alert('Gagal menghapus tagihan.');
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    const term = searchQuery.toLowerCase();
    const typeLabel = inv.payment_type === 'monthly' ? 'bulanan' 
                    : inv.payment_type === 'annual' ? 'tahunan' 
                    : 'satu kali';
    return (
      inv.student_name.toLowerCase().includes(term) ||
      (inv.registration_number && inv.registration_number.toLowerCase().includes(term)) ||
      (inv.class_name && inv.class_name.toLowerCase().includes(term)) ||
      (inv.description && inv.description.toLowerCase().includes(term)) ||
      typeLabel.includes(term)
    );
  });

  const getPaymentTypeBadge = (type) => {
    switch (type) {
      case 'one_time':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wider">1 Kali di Awal</span>;
      case 'annual':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-wider">Tahunan</span>;
      case 'monthly':
      default:
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20 uppercase tracking-wider">Bulanan</span>;
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <DollarSign className="h-8 w-8 text-[#d4af37]" /> Manajemen Pembayaran Murid
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Kelola tagihan Pembayaran (SPP Bulanan, Uang Pangkal Awal, Daftar Ulang Tahunan) untuk seluruh murid.
          </p>
        </div>
        <button 
          onClick={() => setShowGenerateModal(true)}
          className="rounded-xl bg-[#d4af37] hover:bg-[#f3cb65] px-4 py-2.5 text-sm font-bold text-black flex items-center gap-2 transition-colors self-start sm:self-auto shadow-md shadow-[#d4af37]/10"
        >
          <Plus className="h-4.5 w-4.5" /> Buat Tagihan Baru
        </button>
      </div>

      {message && (
        <div className={`flex items-center gap-3 rounded-xl border p-4 text-sm ${
          message.type === 'success' ? 'border-green-500/30 bg-green-500/10 text-green-400' : 'border-red-500/30 bg-red-500/10 text-red-400'
        }`}>
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{message.text}</span>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
          <Search className="h-5 w-5" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="block w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-10 pr-3 text-sm text-zinc-800 placeholder-zinc-450 outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/20 transition-all"
          placeholder="Cari nama, nomor induk, kelas, keterangan, atau jenis..."
        />
      </div>

      {/* Table grid */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <RefreshCw className="h-8 w-8 animate-spin text-[#d4af37]" />
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-zinc-500 space-y-4">
            <DollarSign className="h-12 w-12 text-zinc-300" />
            <div>
              <p className="font-semibold text-lg text-zinc-800">Belum Ada Riwayat Tagihan</p>
              <p className="text-sm mt-1 text-zinc-500">Gunakan tombol "Buat Tagihan Baru" untuk membuat tagihan murid.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-150 bg-zinc-50 text-[10px] font-bold uppercase tracking-wider text-zinc-450">
                  <th className="px-6 py-4">Nama Siswa</th>
                  <th className="px-6 py-4">Kelas</th>
                  <th className="px-6 py-4">Jenis Tagihan</th>
                  <th className="px-6 py-4">Keterangan</th>
                  <th className="px-6 py-4">Nominal</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Metode &amp; Tanggal Lunas</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-xs">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-zinc-900">{inv.student_name}</p>
                      <p className="text-[10px] text-zinc-400 font-mono mt-0.5">{inv.registration_number || '-'}</p>
                    </td>
                    <td className="px-6 py-4 text-zinc-600 font-medium">{inv.class_name || 'Tanpa Kelas'}</td>
                    <td className="px-6 py-4">
                      {getPaymentTypeBadge(inv.payment_type || 'monthly')}
                    </td>
                    <td className="px-6 py-4 text-zinc-600">
                      {inv.description || '-'}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-zinc-800">
                      Rp {parseFloat(inv.amount).toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider whitespace-nowrap ${
                        inv.status === 'paid' 
                          ? 'bg-green-50 text-green-700 border border-green-200' 
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {inv.status === 'paid' ? 'Lunas' : 'Belum Bayar'}
                      </span>
                    </td>
                    <td className="px-6 py-4 leading-tight">
                      {inv.status === 'paid' ? (
                        <>
                          <p className="font-bold text-zinc-700">{inv.payment_method}</p>
                          <p className="text-[10px] text-zinc-400 mt-0.5">
                            {new Date(inv.paid_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </>
                      ) : (
                        <span className="text-zinc-350">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                      {inv.status === 'unpaid' && (
                        <button 
                          onClick={() => setConfirmingInvoiceId(inv.id)}
                          className="rounded-lg bg-green-550/10 hover:bg-green-550/20 text-green-700 border border-green-200 px-3 py-1.5 text-xs font-bold transition-all"
                        >
                          Lunas
                        </button>
                      )}
                      <button 
                        onClick={() => setDeletingInvoiceId(inv.id)}
                        className="p-2 text-zinc-450 hover:text-red-650 transition-colors"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Generate Invoices Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-850 bg-zinc-950 p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <h3 className="text-lg font-bold text-white">Buat Tagihan Massal</h3>
              <button onClick={() => setShowGenerateModal(false)} className="text-zinc-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="bg-[#d4af37]/5 border border-[#d4af37]/10 p-4 rounded-xl text-xs text-[#d4af37] leading-relaxed">
              💡 Fitur ini akan otomatis membuatkan faktur tagihan untuk <strong>semua siswa yang terdaftar</strong> sekaligus.
            </div>

            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">Jenis Pembayaran</label>
                <select
                  value={paymentType}
                  onChange={(e) => { setPaymentType(e.target.value); setDescription(''); }}
                  className="block w-full mt-1.5 rounded-xl border border-zinc-850 bg-zinc-900 py-2.5 px-3.5 text-sm text-white focus:border-[#d4af37] outline-none"
                >
                  <option value="monthly">Setiap Bulan (SPP Bulanan)</option>
                  <option value="annual">1 Tahun Sekali (Daftar Ulang / Seragam)</option>
                  <option value="one_time">1 Kali di Awal (Uang Pangkal / Pembangunan)</option>
                </select>
              </div>

              {paymentType === 'monthly' && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">Pilih Bulan</label>
                  <input 
                    type="month" 
                    required
                    value={genMonth}
                    onChange={(e) => setGenMonth(e.target.value)}
                    className="block w-full mt-1.5 rounded-xl border border-zinc-850 bg-zinc-900 py-2.5 px-3.5 text-sm text-white focus:border-[#d4af37] outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                  {paymentType === 'monthly' ? 'Keterangan (Opsional)' : 'Nama / Keterangan Tagihan'}
                </label>
                <input 
                  type="text" 
                  required={paymentType !== 'monthly'}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={
                    paymentType === 'monthly' ? 'Contoh: SPP Agustus 2026'
                    : paymentType === 'annual' ? 'Contoh: Daftar Ulang 2026/2027'
                    : 'Contoh: Uang Pangkal / Uang Pembangunan'
                  }
                  className="block w-full mt-1.5 rounded-xl border border-zinc-850 bg-zinc-900 py-2.5 px-3.5 text-sm text-white focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/20 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">Nominal Tagihan (Rp)</label>
                <input 
                  type="number" 
                  required
                  min="1000"
                  value={genAmount}
                  onChange={(e) => setGenAmount(e.target.value)}
                  placeholder="Contoh: 250000"
                  className="block w-full mt-1.5 rounded-xl border border-zinc-850 bg-zinc-900 py-2.5 px-3.5 text-sm text-white focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/20 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-900">
                <button 
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="rounded-xl border border-zinc-800 px-4 py-2.5 text-xs font-bold text-zinc-400 hover:text-white"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={generating}
                  className="rounded-xl bg-[#d4af37] hover:bg-[#f3cb65] px-6 py-2.5 text-xs font-bold text-black flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  {generating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Generate Sekarang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Payment Modal */}
      {confirmingInvoiceId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="text-center space-y-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-green-600 border border-green-200">
                <CheckCircle className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900">Konfirmasi Lunas</h3>
              <p className="text-xs text-zinc-500 font-light leading-relaxed">
                Apakah Anda yakin ingin menandai tagihan siswa ini sebagai <strong className="text-green-600 font-bold">LUNAS</strong> secara manual?
              </p>
            </div>

            <div className="pt-2 flex justify-end gap-2 text-xs">
              <button 
                type="button"
                onClick={() => setConfirmingInvoiceId(null)}
                className="rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 px-4 py-2 transition-all font-bold text-zinc-700"
              >
                Batal
              </button>
              <button 
                type="button"
                onClick={() => submitConfirm(confirmingInvoiceId)}
                className="rounded-xl bg-green-600 hover:bg-green-700 px-5 py-2 font-bold text-white shadow-sm transition-all"
              >
                Ya, Set Lunas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Invoice Modal */}
      {deletingInvoiceId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="text-center space-y-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-650 border border-red-200">
                <AlertCircle className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900">Hapus Tagihan</h3>
              <p className="text-xs text-zinc-500 font-light leading-relaxed">
                Apakah Anda yakin ingin menghapus catatan tagihan siswa ini secara permanen dari sistem?
              </p>
            </div>

            <div className="pt-2 flex justify-end gap-2 text-xs">
              <button 
                type="button"
                onClick={() => setDeletingInvoiceId(null)}
                className="rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 px-4 py-2 transition-all font-bold text-zinc-700"
              >
                Batal
              </button>
              <button 
                type="button"
                onClick={() => submitDelete(deletingInvoiceId)}
                className="rounded-xl bg-red-600 hover:bg-red-700 px-5 py-2 font-bold text-white shadow-sm transition-all"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
