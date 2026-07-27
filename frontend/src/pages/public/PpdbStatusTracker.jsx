import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import api from '../../config/axios';
import TenantWebsiteLayout from '../../layouts/TenantWebsiteLayout';
import { Search, Printer, AlertTriangle, FileText, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';

export default function PpdbStatusTracker() {
  const { schoolSlug } = useParams();
  const [searchParams] = useSearchParams();
  const [regNum, setRegNum] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStatus = async (numberToQuery) => {
    if (!numberToQuery) return;
    setLoading(true);
    setError(null);
    try {
      const host = window.location.hostname;
      let subdomain = host.split('.')[0];
      if (subdomain === 'localhost' || subdomain === '127') {
        subdomain = schoolSlug || 'tkmelati';
      }
      const response = await api.get(`/ppdb/status/${numberToQuery}`, {
        headers: {
          'X-School-ID': subdomain === 'tkmelati' ? '1' : localStorage.getItem('school_id') || '1'
        }
      });
      setData(response.data);
    } catch (err) {
      setError(err.message || 'Nomor Pendaftaran tidak terdaftar atau terjadi kesalahan.');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const num = searchParams.get('reg');
    if (num) {
      setRegNum(num);
      fetchStatus(num);
    }
  }, [searchParams]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchStatus(regNum);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <TenantWebsiteLayout>
      <div className="mx-auto max-w-3xl px-6 py-16 text-[#f3f4f6]">
        
        {/* Search Bar Block (hidden on print) */}
        <div className="space-y-6 print:hidden">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-white">Pantau Status PPDB</h1>
            <p className="mt-2 text-sm text-zinc-400">
              Masukkan Nomor Pendaftaran Anda untuk melacak status seleksi dan pembayaran.
            </p>
          </div>

          <form onSubmit={handleSearch} className="flex gap-3 max-w-md mx-auto">
            <div className="relative flex-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
                <Search className="h-5 w-5" />
              </div>
              <input
                type="text"
                value={regNum}
                onChange={(e) => setRegNum(e.target.value)}
                className="block w-full rounded-lg border border-zinc-800 bg-zinc-950 py-2.5 pl-10 pr-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-indigo-500 focus:ring-2"
                placeholder="Contoh: PPDB-2026-00001"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Cek Status'}
            </button>
          </form>

          {error && (
            <div className="flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400 max-w-md mx-auto">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Status Receipt Card */}
        {data && (
          <div className="mt-8 space-y-6">
            
            {/* Action Bar (hidden on print) */}
            <div className="flex items-center justify-between border-b border-zinc-850 pb-4 print:hidden">
              <Link to={`/school/${schoolSlug}`} className="text-zinc-400 hover:text-white flex items-center gap-1 text-sm">
                <ArrowLeft className="h-4 w-4" /> Kembali
              </Link>
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 px-4 py-2 text-sm font-semibold text-white transition-colors"
              >
                <Printer className="h-4 w-4" />
                Cetak Kartu
              </button>
            </div>

            {/* Print Container */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-8 shadow-xl backdrop-blur-md space-y-6 print:border-none print:bg-white print:text-black print:p-0 print:shadow-none">
              
              {/* Receipt Header */}
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-6 print:border-black print:pb-4">
                <div>
                  <h2 className="text-xl font-bold text-white print:text-black">KARTU PENDAFTARAN PPDB</h2>
                  <p className="text-sm text-zinc-500 print:text-zinc-700 mt-1">Status dan Keterangan Pendaftaran Siswa</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-zinc-500 print:text-zinc-700 block">No. Pendaftaran:</span>
                  <span className="text-lg font-mono font-bold text-white print:text-black">{data.registration.registration_number}</span>
                </div>
              </div>

              {/* Status Badge (visual on screen) */}
              <div className="flex flex-col sm:flex-row justify-between gap-6 print:gap-4 border-b border-zinc-850 pb-6 print:pb-4">
                <div>
                  <p className="text-xs text-zinc-500 print:text-zinc-700 font-bold uppercase tracking-wider">Status Verifikasi Berkas:</p>
                  <div className="mt-1 flex items-center gap-2">
                    <CheckCircle2 className={`h-5 w-5 ${
                      data.registration.status === 'accepted' ? 'text-green-500' : data.registration.status === 'rejected' ? 'text-red-500' : 'text-yellow-400'
                    }`} />
                    <span className="font-bold text-white print:text-black uppercase text-sm">{data.registration.status}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 print:text-zinc-700 font-bold uppercase tracking-wider">Status Pembayaran:</p>
                  <span className={`inline-block mt-1 font-bold text-xs uppercase ${
                    data.registration.payment_status === 'paid' ? 'text-green-400 print:text-black' : 'text-red-400 print:text-black'
                  }`}>{data.registration.payment_status}</span>
                </div>
              </div>

              {/* Student and Parent Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 print:gap-4 text-sm">
                <div className="space-y-2">
                  <h3 className="font-semibold text-white print:text-black text-xs uppercase tracking-wider text-indigo-400">Data Calon Siswa</h3>
                  <p><span className="text-zinc-500 print:text-zinc-600 block">Nama Lengkap Anak:</span> <strong className="text-white print:text-black">{data.registration.full_name}</strong></p>
                  <p><span className="text-zinc-500 print:text-zinc-600 block">Tanggal Lahir:</span> {data.registration.birth_date}</p>
                  <p><span className="text-zinc-500 print:text-zinc-600 block">Jenis Kelamin:</span> {data.registration.gender === 'L' ? 'Laki-Laki' : 'Perempuan'}</p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-white print:text-black text-xs uppercase tracking-wider text-indigo-400">Data Orang Tua / Wali</h3>
                  <p><span className="text-zinc-500 print:text-zinc-600 block">Nama Orang Tua:</span> <strong className="text-white print:text-black">{data.registration.parent_name}</strong></p>
                  <p><span className="text-zinc-500 print:text-zinc-600 block">No. Telepon:</span> {data.registration.parent_phone}</p>
                </div>
              </div>

              {/* Admin Note if Rejected / Action required */}
              {data.registration.admin_notes && (
                <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4 text-sm text-zinc-300 print:border-black print:text-black">
                  <p className="font-bold text-white print:text-black text-xs uppercase tracking-wider mb-1">Catatan Verifikator:</p>
                  <p className="italic">"{data.registration.admin_notes}"</p>
                </div>
              )}

              {/* Payment Instructions if unpaid */}
              {data.registration.payment_status === 'unpaid' && data.instructions && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-sm text-zinc-300 print:hidden space-y-2">
                  <h4 className="font-semibold text-red-400 flex items-center gap-1">
                    <FileText className="h-4 w-4" /> Instruksi Pembayaran Biaya Pendaftaran
                  </h4>
                  <p className="text-xs text-zinc-400">
                    Silakan selesaikan pembayaran sebesar <strong>Rp {parseFloat(data.registration_fee).toLocaleString('id-ID')}</strong> ke instruksi rekening di bawah:
                  </p>
                  <p className="text-xs bg-zinc-950 p-3 rounded font-mono border border-zinc-800 whitespace-pre-wrap">{data.instructions}</p>
                </div>
              )}

            </div>
          </div>
        )}

      </div>
    </TenantWebsiteLayout>
  );
}
