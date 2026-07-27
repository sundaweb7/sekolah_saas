import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '../../config/axios';
import TenantWebsiteLayout from '../../layouts/TenantWebsiteLayout';
import { User, Phone, CheckCircle, FileText, Upload, AlertCircle, Loader2 } from 'lucide-react';

const registrationSchema = z.object({
  fullName: z.string().min(3, { message: 'Nama lengkap minimal 3 karakter' }),
  birthDate: z.string().min(1, { message: 'Tanggal lahir wajib diisi' }),
  gender: z.enum(['L', 'P'], { message: 'Pilih jenis kelamin' }),
  parentName: z.string().min(3, { message: 'Nama orang tua/wali wajib diisi' }),
  parentPhone: z.string().min(10, { message: 'Nomor telepon minimal 10 digit' }),
});

export default function PpdbRegistrationForm() {
  const { schoolSlug } = useParams();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [successData, setSuccessData] = useState(null);
  const [error, setError] = useState(null);
  
  const [aktaFile, setAktaFile] = useState(null);
  const [kkFile, setKkFile] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registrationSchema),
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const host = window.location.hostname;
        let subdomain = host.split('.')[0];
        if (subdomain === 'localhost' || subdomain === '127') {
          subdomain = schoolSlug || 'tkmelati';
        }
        const response = await api.get('/ppdb/settings', {
          headers: {
            'X-School-ID': subdomain === 'tkmelati' ? '1' : localStorage.getItem('school_id') || '1'
          }
        });
        setSettings(response.data);
      } catch (err) {
        setError('Pendaftaran PPDB online saat ini tidak aktif atau belum dikonfigurasi.');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [schoolSlug]);

  const onSubmit = async (data) => {
    setError(null);
    setSuccessData(null);

    const formData = new FormData();
    formData.append('full_name', data.fullName);
    formData.append('birth_date', data.birthDate);
    formData.append('gender', data.gender);
    formData.append('parent_name', data.parentName);
    formData.append('parent_phone', data.parentPhone);

    if (aktaFile) formData.append('akta_kelahiran', aktaFile);
    if (kkFile) formData.append('kartu_keluarga', kkFile);

    try {
      const host = window.location.hostname;
      let subdomain = host.split('.')[0];
      if (subdomain === 'localhost' || subdomain === '127') {
        subdomain = schoolSlug || 'tkmelati';
      }

      const response = await api.post('/ppdb/register', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'X-School-ID': subdomain === 'tkmelati' ? '1' : localStorage.getItem('school_id') || '1'
        }
      });
      setSuccessData(response.data);
    } catch (err) {
      setError(err.message || 'Pendaftaran gagal dikirim.');
    }
  };

  if (loading) {
    return (
      <TenantWebsiteLayout>
        <div className="flex h-96 items-center justify-center text-white">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      </TenantWebsiteLayout>
    );
  }

  return (
    <TenantWebsiteLayout>
      <div className="mx-auto max-w-2xl px-6 py-16 text-[#f3f4f6]">
        
        {successData ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 text-center space-y-6 shadow-2xl backdrop-blur-md">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 text-green-400">
              <CheckCircle className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">Pendaftaran Berhasil Dikirim!</h2>
              <p className="text-zinc-400">
                Putra/putri Anda telah terdaftar dalam sistem penerimaan peserta didik baru.
              </p>
            </div>

            <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 p-6 text-left space-y-4">
              <div>
                <p className="text-xs text-indigo-400 font-bold uppercase tracking-wider">Nomor Pendaftaran Anda:</p>
                <p className="text-3xl font-mono font-bold text-white mt-1 select-all">{successData.registration_number}</p>
              </div>
              <div className="text-sm text-zinc-300 border-t border-zinc-800/80 pt-3">
                <p><strong>Nama Anak:</strong> {successData.full_name}</p>
                <p><strong>Status Pendaftaran:</strong> <span className="text-yellow-400 uppercase font-semibold text-xs">Menunggu Verifikasi</span></p>
                {settings?.registration_fee > 0 && (
                  <p><strong>Biaya Pendaftaran:</strong> Rp {parseFloat(settings.registration_fee).toLocaleString('id-ID')}</p>
                )}
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row justify-center gap-4">
              <Link 
                to={`/school/${schoolSlug}/ppdb/status?reg=${successData.registration_number}`}
                className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
              >
                Pantau Status Pendaftaran
              </Link>
              <Link 
                to={`/school/${schoolSlug}`}
                className="rounded-lg border border-zinc-800 bg-zinc-900 px-6 py-2.5 text-sm font-semibold text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
              >
                Kembali Ke Beranda
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-400">
                <FileText className="h-6 w-6" />
              </div>
              <h2 className="mt-6 text-3xl font-bold tracking-tight text-white">Formulir PPDB Online</h2>
              <p className="mt-2 text-sm text-zinc-400">
                Silakan isi data calon siswa baru dan lampirkan berkas yang diperlukan.
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 rounded-2xl border border-zinc-800 bg-zinc-900/30 p-8 shadow-xl backdrop-blur-md">
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-white border-b border-zinc-850 pb-2 flex items-center gap-2">
                  <User className="h-5 w-5 text-indigo-400" />
                  Biodata Calon Siswa
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-zinc-300">Nama Lengkap Anak</label>
                    <input
                      {...register('fullName')}
                      type="text"
                      className="block w-full mt-1 rounded-lg border border-zinc-800 bg-zinc-950 py-2.5 px-3 text-sm text-white focus:border-indigo-500 focus:ring-2"
                      placeholder="Nama Lengkap"
                    />
                    {errors.fullName && <p className="mt-1 text-xs text-red-400">{errors.fullName.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300">Tanggal Lahir</label>
                    <input
                      {...register('birthDate')}
                      type="date"
                      className="block w-full mt-1 rounded-lg border border-zinc-800 bg-zinc-950 py-2.5 px-3 text-sm text-white focus:border-indigo-500 focus:ring-2"
                    />
                    {errors.birthDate && <p className="mt-1 text-xs text-red-400">{errors.birthDate.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300">Jenis Kelamin</label>
                    <select
                      {...register('gender')}
                      className="block w-full mt-1 rounded-lg border border-zinc-800 bg-zinc-950 py-2.5 px-3 text-sm text-white focus:border-indigo-500 focus:ring-2"
                    >
                      <option value="">Pilih</option>
                      <option value="L">Laki-Laki (L)</option>
                      <option value="P">Perempuan (P)</option>
                    </select>
                    {errors.gender && <p className="mt-1 text-xs text-red-400">{errors.gender.message}</p>}
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-white border-b border-zinc-850 pt-4 pb-2 flex items-center gap-2">
                  <Phone className="h-5 w-5 text-indigo-400" />
                  Data Orang Tua / Wali
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300">Nama Orang Tua / Wali</label>
                    <input
                      {...register('parentName')}
                      type="text"
                      className="block w-full mt-1 rounded-lg border border-zinc-800 bg-zinc-950 py-2.5 px-3 text-sm text-white focus:border-indigo-500 focus:ring-2"
                      placeholder="Nama Lengkap"
                    />
                    {errors.parentName && <p className="mt-1 text-xs text-red-400">{errors.parentName.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300">Nomor Telepon (WhatsApp)</label>
                    <input
                      {...register('parentPhone')}
                      type="text"
                      className="block w-full mt-1 rounded-lg border border-zinc-800 bg-zinc-950 py-2.5 px-3 text-sm text-white focus:border-indigo-500 focus:ring-2"
                      placeholder="0812XXXXXXXX"
                    />
                    {errors.parentPhone && <p className="mt-1 text-xs text-red-400">{errors.parentPhone.message}</p>}
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-white border-b border-zinc-850 pt-4 pb-2 flex items-center gap-2">
                  <Upload className="h-5 w-5 text-indigo-400" />
                  Berkas Persyaratan (Maks 2MB)
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300">Scan Akta Kelahiran</label>
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      onChange={(e) => setAktaFile(e.target.files?.[0] || null)}
                      className="block w-full mt-1 text-xs text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-zinc-800 file:text-white hover:file:bg-zinc-700 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300">Scan Kartu Keluarga (KK)</label>
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      onChange={(e) => setKkFile(e.target.files?.[0] || null)}
                      className="block w-full mt-1 text-xs text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-zinc-800 file:text-white hover:file:bg-zinc-700 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-zinc-800/80">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center rounded-lg bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-500 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    'Kirim Pendaftaran'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </TenantWebsiteLayout>
  );
}
