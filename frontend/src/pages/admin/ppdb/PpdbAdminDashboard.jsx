import { useState, useEffect } from 'react';
import api from '../../../config/axios';
import {
  Users, CheckCircle, Clock, AlertCircle, Eye,
  CreditCard, ShieldAlert, Loader2, Save
} from 'lucide-react';

export default function PpdbAdminDashboard() {
  const [registrations, setRegistrations] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, pending: 0, verified: 0, paid: 0 });

  const [activeTab, setActiveTab] = useState('applicants'); // applicants / settings

  // Settings Form state
  const [fee, setFee] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [instructions, setInstructions] = useState('');

  // Verification Modal state
  const [selectedReg, setSelectedReg] = useState(null);
  const [verifyStatus, setVerifyStatus] = useState('verified');
  const [adminNotes, setAdminNotes] = useState('');
  const [submittingVerify, setSubmittingVerify] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch PPDB Settings
      const settingsRes = await api.get('/admin/ppdb/settings');
      const settingsData = settingsRes.data;
      setSettings(settingsData);
      setFee(settingsData.registration_fee || 0);
      setIsOpen(settingsData.is_open === 1);
      setInstructions(settingsData.payment_instructions || '');

      // 2. Fetch PPDB Registrations
      const regRes = await api.get('/admin/ppdb/registrations', { params: { per_page: 50 } });
      const regList = regRes.data || [];
      setRegistrations(regList);

      // Compute simple stats
      const total = regList.length;
      const pending = regList.filter(r => r.status === 'pending').length;
      const verified = regList.filter(r => r.status === 'verified' || r.status === 'accepted').length;
      const paid = regList.filter(r => r.payment_status === 'paid').length;
      setStats({ total, pending, verified, paid });

    } catch (error) {
      console.error('Failed to load PPDB admin data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const [saving, setSaving] = useState(false);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/admin/ppdb/settings', {
        registration_fee: Number(fee),
        is_open: isOpen ? 1 : 0,
        payment_instructions: instructions
      });
      alert('Pengaturan PPDB berhasil disimpan!');
      fetchData();
    } catch (error) {
      alert('Gagal menyimpan pengaturan.');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmPayment = async (id) => {
    if (!confirm('Apakah Anda yakin ingin mengonfirmasi pembayaran pendaftaran siswa ini secara manual?')) return;
    try {
      await api.post(`/admin/ppdb/registrations/confirm-payment/${id}`);
      fetchData();
    } catch (error) {
      alert('Gagal mengonfirmasi pembayaran.');
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    if (!selectedReg) return;
    setSubmittingVerify(true);
    try {
      await api.post(`/admin/ppdb/registrations/verify/${selectedReg.id}`, {
        status: verifyStatus,
        admin_notes: adminNotes
      });
      setSelectedReg(null);
      setAdminNotes('');
      fetchData();
    } catch (error) {
      alert('Gagal memverifikasi pendaftaran.');
    } finally {
      setSubmittingVerify(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f3f7f9] text-zinc-900">
        <Loader2 className="h-8 w-8 animate-spin text-[#d9a425]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f7f9] text-zinc-800 p-8">
      <div className="mx-auto max-w-6xl space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-950">Dashboard PPDB</h1>
            <p className="mt-1 text-sm text-zinc-550">Kelola dan verifikasi pendaftaran siswa baru secara real-time.</p>
          </div>
          <div className="flex rounded-lg border border-zinc-200 bg-white p-1">
            <button
              onClick={() => setActiveTab('applicants')}
              className={`rounded-md px-4 py-1.5 text-sm font-semibold transition-colors ${
                activeTab === 'applicants' ? 'bg-[#d9a425] text-black' : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              Pendaftar
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`rounded-md px-4 py-1.5 text-sm font-semibold transition-colors ${
                activeTab === 'settings' ? 'bg-[#d9a425] text-black' : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              Konfigurasi
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-[#18181b] border border-zinc-900 rounded-xl p-5 flex items-center gap-4 hover:border-[#d9a425]/30 transition-all duration-300">
            <div className="h-10 w-10 rounded-lg bg-zinc-900 border border-zinc-800 text-[#d9a425] flex items-center justify-center shrink-0">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-white">{stats.total}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#d9a425]">Total Pelamar</p>
            </div>
          </div>
          <div className="bg-[#18181b] border border-zinc-900 rounded-xl p-5 flex items-center gap-4 hover:border-[#d9a425]/30 transition-all duration-300">
            <div className="h-10 w-10 rounded-lg bg-zinc-900 border border-zinc-800 text-[#d9a425] flex items-center justify-center shrink-0">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-white">{stats.pending}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#d9a425]">Menunggu Verifikasi</p>
            </div>
          </div>
          <div className="bg-[#18181b] border border-zinc-900 rounded-xl p-5 flex items-center gap-4 hover:border-[#d9a425]/30 transition-all duration-300">
            <div className="h-10 w-10 rounded-lg bg-zinc-900 border border-zinc-800 text-[#d9a425] flex items-center justify-center shrink-0">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-white">{stats.verified}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#d9a425]">Diverifikasi / Diterima</p>
            </div>
          </div>
          <div className="bg-[#18181b] border border-zinc-900 rounded-xl p-5 flex items-center gap-4 hover:border-[#d9a425]/30 transition-all duration-300">
            <div className="h-10 w-10 rounded-lg bg-zinc-900 border border-zinc-800 text-[#d9a425] flex items-center justify-center shrink-0">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-white">{stats.paid}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#d9a425]">Lunas Pembayaran</p>
            </div>
          </div>
        </div>

        {activeTab === 'applicants' ? (
          /* Applicants List */
          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50 text-xs font-bold uppercase tracking-wider text-zinc-500">
                    <th className="px-6 py-4">No. Registrasi</th>
                    <th className="px-6 py-4">Nama Lengkap</th>
                    <th className="px-6 py-4">Orang Tua</th>
                    <th className="px-6 py-4">Kontak</th>
                    <th className="px-6 py-4">Verifikasi</th>
                    <th className="px-6 py-4">Pembayaran</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-150">
                  {registrations.map((item) => (
                    <tr key={item.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-6 py-4 font-mono text-sm text-[#d9a425] font-bold">
                        {item.registration_number}
                      </td>
                      <td className="px-6 py-4 font-semibold text-zinc-950">{item.full_name}</td>
                      <td className="px-6 py-4 text-zinc-700">{item.parent_name}</td>
                      <td className="px-6 py-4 text-sm text-zinc-500">{item.parent_phone}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold uppercase ${
                          item.status === 'accepted' ? 'bg-green-100 text-green-700' : item.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {item.status === 'accepted' ? 'Diterima' : item.status === 'rejected' ? 'Ditolak' : 'Menunggu'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold uppercase ${
                          item.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {item.payment_status === 'paid' ? 'Lunas' : 'Belum Lunas'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {item.payment_status === 'unpaid' && (
                            <button
                              onClick={() => handleConfirmPayment(item.id)}
                              className="p-1.5 text-zinc-400 hover:text-emerald-500 transition-colors"
                              title="Konfirmasi Pembayaran Manual"
                            >
                              <CreditCard className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedReg(item)}
                            className="p-1.5 text-zinc-400 hover:text-[#d9a425] transition-colors"
                            title="Tinjau Berkas & Verifikasi"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSaveSettings} className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-zinc-150 pb-3">
              <ShieldAlert className="h-5 w-5 text-[#d9a425]" />
              <h2 className="text-xl font-bold text-zinc-950">Konfigurasi Penerimaan</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isOpen"
                  checked={isOpen}
                  onChange={(e) => setIsOpen(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-250 bg-white text-[#d9a425] focus:ring-[#d9a425]"
                />
                <label htmlFor="isOpen" className="text-sm font-semibold text-zinc-700">Buka Pendaftaran PPDB Online</label>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500">Biaya Pendaftaran (Rp)</label>
                <input
                  type="number"
                  required
                  value={fee}
                  onChange={(e) => setFee(e.target.value)}
                  placeholder="Contoh: 150000"
                  className="block w-full mt-2 rounded-xl border border-zinc-250 bg-white py-2.5 px-3.5 text-sm text-zinc-900 focus:border-[#d9a425] outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-bold text-zinc-650">Instruksi Pembayaran</label>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  rows="4"
                  className="block w-full mt-2 rounded-xl border border-zinc-250 bg-white py-2.5 px-3.5 text-sm text-zinc-900 focus:border-[#d9a425] outline-none"
                  placeholder="Masukkan instruksi pembayaran transfer bank, e-wallet, atau cash..."
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-[#d9a425] px-5 py-2.5 text-xs font-bold text-black hover:bg-[#e5c158] transition-colors"
            >
              <Save className="h-4 w-4" />
              Simpan Konfigurasi PPDB
            </button>
          </form>
        )}
      </div>

      {selectedReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 space-y-6 shadow-2xl">
            <h3 className="text-xl font-bold text-zinc-950 border-b border-zinc-150 pb-3">Tinjau & Verifikasi Pendaftaran</h3>
            <div className="text-sm text-zinc-700 space-y-1">
              <p><strong>Nama Anak:</strong> {selectedReg.full_name}</p>
              <p><strong>No. Pendaftaran:</strong> {selectedReg.registration_number}</p>
            </div>
            <form onSubmit={handleVerifySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-550">Status Kelulusan</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="block w-full mt-1.5 rounded-xl border border-zinc-250 bg-white py-2 px-3 text-sm text-zinc-900 focus:border-[#d9a425] outline-none"
                >
                  <option value="pending">Menunggu</option>
                  <option value="accepted">Diterima</option>
                  <option value="rejected">Ditolak</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-zinc-650">Catatan Verifikator untuk Wali Murid</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows="3"
                  className="block w-full mt-1.5 rounded-xl border border-zinc-250 bg-white py-2 px-3 text-sm text-zinc-900 focus:border-[#d9a425] outline-none"
                  placeholder="Tulis alasan jika ditolak, berkas kurang lengkap, atau ucapan selamat jika diterima..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-150">
                <button
                  type="button"
                  onClick={() => setSelectedReg(null)}
                  className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-bold text-zinc-500 hover:text-zinc-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingVerify}
                  className="flex items-center gap-1.5 rounded-xl bg-[#d4af37] hover:bg-[#f3cb65] px-4 py-2 text-xs font-bold text-black transition-colors"
                >
                  {submittingVerify && <Loader2 className="h-4 w-4 animate-spin" />}
                  Simpan Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
