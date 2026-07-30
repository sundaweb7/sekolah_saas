import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, Download, Send, ArrowLeft, Loader2,
  Calendar, CheckCircle, XCircle, Clock, AlertTriangle, Filter, RefreshCw
} from 'lucide-react';
import api from '../../../config/axios';

export default function AttendanceAnalytics() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [notifying, setNotifying] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  
  const [classes, setClasses] = useState([]);
  const [summary, setSummary] = useState([]);
  const [dailyData, setDailyData] = useState([]);
  const [mostAbsent, setMostAbsent] = useState([]);
  const [mostLate, setMostLate] = useState([]);

  // Filters
  const [selectedClass, setSelectedClass] = useState('');
  const [fromDate, setFromDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
  const [toDate, setToDate] = useState(new Date().toISOString().slice(0, 10));

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    setSuccessMsg('');
    try {
      const response = await api.get('/admin/attendance/analytics', {
        params: {
          class_id: selectedClass || undefined,
          from: fromDate,
          to: toDate
        }
      });
      const data = response.data;
      setClasses(data.classes || []);
      setSummary(data.summary || []);
      setDailyData(data.daily || []);
      setMostAbsent(data.most_absent || []);
      setMostLate(data.most_late || []);
    } catch (err) {
      setError(err.message || 'Gagal memuat analitik absensi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [selectedClass, fromDate, toDate]);

  const handleExport = () => {
    const url = `${api.defaults.baseURL || ''}/admin/attendance/export?class_id=${selectedClass || ''}&from=${fromDate}&to=${toDate}`;
    // Fetch with authentication token from local/session storage
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    
    // Simple download using token in header is difficult via plain link.
    // Instead we can use fetch/axios blob download
    setLoading(true);
    api.get('/admin/attendance/export', {
      params: { class_id: selectedClass || undefined, from: fromDate, to: toDate },
      responseType: 'blob'
    }).then((res) => {
      const blob = new Blob([res.data], { type: 'text/csv' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `rekap_absensi_${fromDate}_to_${toDate}.csv`;
      link.click();
    }).catch((err) => {
      setError('Gagal mengekspor data absensi.');
    }).finally(() => {
      setLoading(false);
    });
  };

  const handleNotifyAbsent = async () => {
    if (!window.confirm('Kirim notifikasi WhatsApp ke seluruh wali murid siswa yang tidak hadir atau terlambat hari ini?')) {
      return;
    }
    setNotifying(true);
    setError(null);
    setSuccessMsg('');
    try {
      const response = await api.post('/admin/attendance/notify-absent', {
        date: new Date().toISOString().slice(0, 10),
        class_id: selectedClass || undefined
      });
      setSuccessMsg(`Berhasil mengirimkan ${response.data.sent} notifikasi WhatsApp. Gagal: ${response.data.failed}.`);
    } catch (err) {
      setError(err.message || 'Gagal mengirimkan notifikasi.');
    } finally {
      setNotifying(false);
    }
  };

  // Compute stat totals
  const totalHadir = Number(summary.find(s => s.status === 'hadir')?.total || 0);
  const totalSakit = Number(summary.find(s => s.status === 'sakit')?.total || 0);
  const totalIzin = Number(summary.find(s => s.status === 'izin')?.total || 0);
  const totalAbsen = Number(summary.find(s => s.status === 'absen')?.total || 0) + Number(summary.find(s => s.status === 'alfa')?.total || 0) + Number(summary.find(s => s.status === 'alpha')?.total || 0);
  const totalLate = Number(summary.find(s => s.status === 'terlambat')?.total || 0);
  const totalRecords = totalHadir + totalSakit + totalIzin + totalAbsen + totalLate;

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin')}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-[#d4af37]" />
              Analitik Kehadiran Siswa
            </h1>
            <p className="text-sm text-zinc-400">Analisis keterlambatan, ketidakhadiran, rekap ekspor dan notifikasi wali murid</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleNotifyAbsent}
            disabled={notifying}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:bg-red-800 text-sm font-bold text-white shadow-lg transition-all"
          >
            {notifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Kirim Notifikasi WA Hari Ini
          </button>

          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-sm font-bold text-zinc-200 transition-all"
          >
            <Download className="h-4 w-4 text-[#d4af37]" />
            Ekspor Rekap CSV
          </button>
        </div>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="rounded-xl border border-green-500/25 bg-green-500/10 p-4 text-sm text-green-400 flex items-center gap-2">
          <CheckCircle className="h-5 w-5 shrink-0" />
          {successMsg}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-400 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          {error}
        </div>
      )}

      {/* Filters Box */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 shadow-xl flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-semibold uppercase text-zinc-400">Filter Kelas</label>
          <div className="relative mt-2">
            <Filter className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="block w-full rounded-xl border border-zinc-850 bg-zinc-950 py-2.5 pl-10 pr-4 text-sm text-white focus:border-[#d4af37] outline-none"
            >
              <option value="">Semua Kelas</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="w-[180px]">
          <label className="block text-xs font-semibold uppercase text-zinc-400">Dari Tanggal</label>
          <div className="relative mt-2">
            <Calendar className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="block w-full rounded-xl border border-zinc-855 bg-zinc-950 py-2.5 pl-10 pr-4 text-sm text-white focus:border-[#d4af37] outline-none"
            />
          </div>
        </div>

        <div className="w-[180px]">
          <label className="block text-xs font-semibold uppercase text-zinc-400">Hingga Tanggal</label>
          <div className="relative mt-2">
            <Calendar className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="block w-full rounded-xl border border-zinc-855 bg-zinc-950 py-2.5 pl-10 pr-4 text-sm text-white focus:border-[#d4af37] outline-none"
            />
          </div>
        </div>

        <button
          onClick={fetchAnalytics}
          className="p-2.5 rounded-xl border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 transition-all text-zinc-400 hover:text-white"
          title="Segarkan data"
        >
          <RefreshCw className="h-5 w-5" />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#d4af37]" />
        </div>
      ) : (
        <>
          {/* Summary Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="rounded-2xl border border-zinc-850 bg-zinc-900/40 p-4 space-y-2">
              <span className="text-xs font-semibold text-zinc-400 uppercase">Hadir</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold">{totalHadir}</span>
                <span className="text-xs text-green-400">
                  {totalRecords ? `${Math.round((totalHadir / totalRecords) * 100)}%` : '0%'}
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-850 bg-zinc-900/40 p-4 space-y-2">
              <span className="text-xs font-semibold text-zinc-400 uppercase">Terlambat</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-amber-400">{totalLate}</span>
                <span className="text-xs text-amber-400">
                  {totalRecords ? `${Math.round((totalLate / totalRecords) * 100)}%` : '0%'}
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-850 bg-zinc-900/40 p-4 space-y-2">
              <span className="text-xs font-semibold text-zinc-400 uppercase">Izin</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-blue-400">{totalIzin}</span>
                <span className="text-xs text-blue-400">
                  {totalRecords ? `${Math.round((totalIzin / totalRecords) * 100)}%` : '0%'}
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-850 bg-zinc-900/40 p-4 space-y-2">
              <span className="text-xs font-semibold text-zinc-400 uppercase">Sakit</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-[#d4af37]">{totalSakit}</span>
                <span className="text-xs text-[#d4af37]">
                  {totalRecords ? `${Math.round((totalSakit / totalRecords) * 100)}%` : '0%'}
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-850 bg-zinc-900/40 p-4 space-y-2 col-span-2 md:col-span-1">
              <span className="text-xs font-semibold text-zinc-400 uppercase">Tanpa Keterangan / Absen</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-red-500">{totalAbsen}</span>
                <span className="text-xs text-red-400">
                  {totalRecords ? `${Math.round((totalAbsen / totalRecords) * 100)}%` : '0%'}
                </span>
              </div>
            </div>
          </div>

          {/* Ranking / Analytics List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Most Absent */}
            <div className="rounded-2xl border border-zinc-850 bg-zinc-900/40 p-6 space-y-4">
              <h2 className="text-lg font-bold text-red-400 flex items-center gap-2">
                <XCircle className="h-5 w-5" />
                Siswa Paling Sering Absen / Alfa
              </h2>
              
              <div className="divide-y divide-zinc-850 max-h-[350px] overflow-y-auto pr-2">
                {mostAbsent.length === 0 ? (
                  <p className="text-sm text-zinc-500 py-6 text-center">Tidak ada data absensi/alfa dalam periode ini.</p>
                ) : (
                  mostAbsent.map((st, idx) => (
                    <div key={st.student_id} className="py-3.5 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-zinc-500 w-5">{idx + 1}.</span>
                        <div>
                          <p className="text-sm font-semibold">{st.full_name}</p>
                          <p className="text-xs text-zinc-500">NIS: {st.nis || '-'}</p>
                        </div>
                      </div>
                      <span className="rounded-full bg-red-950 text-red-400 px-3 py-1 text-xs font-bold border border-red-900">
                        {st.absent_count} kali
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Most Late */}
            <div className="rounded-2xl border border-zinc-850 bg-zinc-900/40 p-6 space-y-4">
              <h2 className="text-lg font-bold text-amber-400 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Siswa Paling Sering Terlambat
              </h2>
              
              <div className="divide-y divide-zinc-850 max-h-[350px] overflow-y-auto pr-2">
                {mostLate.length === 0 ? (
                  <p className="text-sm text-zinc-500 py-6 text-center">Tidak ada data keterlambatan dalam periode ini.</p>
                ) : (
                  mostLate.map((st, idx) => (
                    <div key={st.student_id} className="py-3.5 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-zinc-500 w-5">{idx + 1}.</span>
                        <div>
                          <p className="text-sm font-semibold">{st.full_name}</p>
                          <p className="text-xs text-zinc-500">Akumulasi: {st.total_late_minutes} menit</p>
                        </div>
                      </div>
                      <span className="rounded-full bg-amber-950 text-amber-400 px-3 py-1 text-xs font-bold border border-amber-900">
                        {st.late_count} kali terlambat
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
