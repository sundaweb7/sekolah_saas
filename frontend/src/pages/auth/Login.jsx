import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../../context/AuthContext';
import api from '../../config/axios';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { KeyRound, Mail, AlertTriangle, Eye, EyeOff, Loader2, Globe, Building, CheckCircle2 } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email({ message: 'Alamat email tidak valid' }),
  password: z.string().min(6, { message: 'Kata sandi minimal 6 karakter' }),
  rememberMe: z.boolean().optional()
});

const registerSchema = z.object({
  school_name: z.string().min(3, { message: 'Nama sekolah minimal 3 karakter' }),
  npsn: z.string().length(8, { message: 'NPSN sekolah harus 8 digit angka' }).regex(/^[0-9]+$/, { message: 'NPSN hanya boleh berupa angka' }),
  subdomain: z.string().min(3, { message: 'Subdomain minimal 3 karakter' }).regex(/^[a-z0-9-]+$/, { message: 'Subdomain hanya boleh huruf kecil, angka, dan strip' }),
  admin_name: z.string().min(3, { message: 'Nama admin/kepala sekolah wajib diisi' }),
  phone: z.string().min(10, { message: 'Nomor WhatsApp minimal 10 digit' }),
  email: z.string().email({ message: 'Alamat email tidak valid' }),
  password: z.string().min(6, { message: 'Kata sandi minimal 6 karakter' }),
});

const getBaseDomain = () => {
  if (typeof window === 'undefined') return 'paudku.id';
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  if (hostname.endsWith('.my.id')) {
    return parts.slice(-3).join('.');
  }
  return parts.slice(-2).join('.');
};

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [searchParams] = useSearchParams();
  
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    setIsRegisterMode(searchParams.get('register') === 'true');

    // Impersonate / SSO SSO auto login parameters
    const ssoToken = searchParams.get('sso_token');
    const ssoRefreshToken = searchParams.get('sso_refresh_token');
    const ssoSchoolId = searchParams.get('sso_school_id');
    const ssoRole = searchParams.get('sso_role');
    
    if (ssoToken && ssoRefreshToken) {
      sessionStorage.setItem('access_token', ssoToken);
      localStorage.setItem('refresh_token', ssoRefreshToken);
      if (ssoSchoolId) {
        localStorage.setItem('school_id', ssoSchoolId);
      }
      // Trigger a page reload or standard redirect to dashboard
      if (ssoRole === 'admin') {
        window.location.href = '/admin';
      } else if (ssoRole === 'teacher') {
        window.location.href = '/teacher';
      } else {
        window.location.href = '/parent';
      }
    }
  }, [searchParams, navigate]);

  // Login Form Form Hook
  const {
    register: loginRegister,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors, isSubmitting: loginSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { rememberMe: false }
  });

  // Register Form Form Hook
  const {
    register: regRegister,
    handleSubmit: handleRegSubmit,
    formState: { errors: regErrors },
  } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const onLoginSubmit = async (data) => {
    setError(null);
    try {
      const user = await login(data.email, data.password, data.rememberMe);
      // Redirect based on role
      if (user.role === 'superadmin') {
        navigate('/superadmin');
      } else if (user.role === 'admin') {
        localStorage.setItem('school_id', user.school_id);
        navigate('/admin');
      } else if (user.role === 'teacher') {
        navigate('/teacher');
      } else {
        navigate('/parent');
      }
    } catch (err) {
      setError(err.message || 'Email atau kata sandi salah.');
    }
  };

  const onRegisterSubmit = async (data) => {
    setError(null);
    setSuccess(null);
    setRegistering(true);

    try {
      await api.post('/auth/register-tenant', data);
      setSuccess('Registrasi sekolah berhasil! Silakan masuk dengan akun Anda.');
      setIsRegisterMode(false);
    } catch (err) {
      setError(err.message || 'Pendaftaran tenant gagal.');
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#08060d] px-4 text-[#f3f4f6]">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 shadow-2xl backdrop-blur-md">
        
        {/* Toggle Headings */}
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-400">
            {isRegisterMode ? <Building className="h-6 w-6" /> : <KeyRound className="h-6 w-6" />}
          </div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-white">
            {isRegisterMode ? 'Daftar Sekolah Baru' : 'Masuk ke PAUDKU'}
          </h2>
          <p className="mt-2 text-sm text-zinc-400 font-medium">
            {isRegisterMode ? 'Mulai buat website & sistem PPDB sekolah Anda' : 'Silakan masukkan kredensial akun Anda'}
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div className="flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-3 rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-400">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {isRegisterMode ? (
          /* REGISTRATION FORM */
          <form className="mt-8 space-y-4" onSubmit={handleRegSubmit(onRegisterSubmit)}>
            <div>
              <label className="block text-sm font-medium text-zinc-300">Nama Sekolah PAUD/TK</label>
              <input
                {...regRegister('school_name')}
                type="text"
                placeholder="TK Melati Indah"
                className="block w-full mt-1.5 rounded-lg border border-zinc-800 bg-zinc-950 py-2 px-3 text-sm text-white focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20 outline-none"
              />
              {regErrors.school_name && <p className="mt-1 text-xs text-red-400">{regErrors.school_name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300">NPSN Sekolah</label>
              <input
                {...regRegister('npsn')}
                type="text"
                maxLength={8}
                placeholder="12345678"
                className="block w-full mt-1.5 rounded-lg border border-zinc-800 bg-zinc-950 py-2 px-3 text-sm text-white focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20 outline-none"
              />
              {regErrors.npsn && <p className="mt-1 text-xs text-red-400">{regErrors.npsn.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300">Subdomain Yang Diinginkan</label>
              <div className="flex mt-1.5 rounded-lg border border-zinc-800 bg-zinc-950 overflow-hidden focus-within:border-[#d4af37] focus-within:ring-2 focus-within:ring-[#d4af37]/20">
                <input
                  {...regRegister('subdomain')}
                  type="text"
                  placeholder="tkmelati"
                  className="flex-1 bg-transparent py-2 px-3 text-sm text-white outline-none"
                />
                <span className="bg-zinc-900 px-3 py-2 text-sm text-zinc-500 font-mono border-l border-zinc-850">
                  .{getBaseDomain()}
                </span>
              </div>
              {regErrors.subdomain && <p className="mt-1 text-xs text-red-400">{regErrors.subdomain.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300">Pilih Paket Pendaftaran</label>
              <select
                {...regRegister('registration_plan')}
                className="block w-full mt-1.5 rounded-lg border border-zinc-800 bg-zinc-950 py-2 px-3 text-sm text-white focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20 outline-none"
              >
                <option value="premium">Uji Coba Premium (Gratis 7 Hari)</option>
                <option value="basic">Paket Basic (Rp 25.000 / Bulan)</option>
                <option value="standard">Paket Standard (Rp 50.000 / Bulan)</option>
                <option value="premium_paid">Paket Premium (Rp 100.000 / Bulan)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300">Jenjang Sekolah</label>
              <select
                {...regRegister('level')}
                className="block w-full mt-1.5 rounded-lg border border-zinc-800 bg-zinc-950 py-2 px-3 text-sm text-white focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20 outline-none"
              >
                <option value="TK">TK (Taman Kanak-Kanak / PAUD)</option>
                <option value="SD">SD (Sekolah Dasar)</option>
                <option value="SMP">SMP (Sekolah Menengah Pertama)</option>
                <option value="SMA">SMA (Sekolah Menengah Atas)</option>
                <option value="MTS_MA">MTS / MA (Madrasah)</option>
                <option value="SMK">SMK (Sekolah Menengah Kejuruan)</option>
                <option value="PESANTREN">Pesantren / Pondok Pesantren</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300">Nama Lengkap Admin / Kepala Sekolah</label>
              <input
                {...regRegister('admin_name')}
                type="text"
                placeholder="Sri Wahyuni, S.Pd"
                className="block w-full mt-1.5 rounded-lg border border-zinc-800 bg-zinc-950 py-2 px-3 text-sm text-white focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20 outline-none"
              />
              {regErrors.admin_name && <p className="mt-1 text-xs text-red-400">{regErrors.admin_name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300">Nomor WhatsApp Aktif (untuk Notifikasi)</label>
              <input
                {...regRegister('phone')}
                type="text"
                placeholder="081234567890"
                className="block w-full mt-1.5 rounded-lg border border-zinc-800 bg-zinc-950 py-2 px-3 text-sm text-white focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20 outline-none"
              />
              {regErrors.phone && <p className="mt-1 text-xs text-red-400">{regErrors.phone.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300">Alamat Email Utama</label>
              <input
                {...regRegister('email')}
                type="email"
                placeholder="admin@school.sch.id"
                className="block w-full mt-1.5 rounded-lg border border-zinc-800 bg-zinc-950 py-2 px-3 text-sm text-white focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20 outline-none"
              />
              {regErrors.email && <p className="mt-1 text-xs text-red-400">{regErrors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300">Kata Sandi Akun</label>
              <input
                {...regRegister('password')}
                type="password"
                placeholder="••••••••"
                className="block w-full mt-1.5 rounded-lg border border-zinc-800 bg-zinc-950 py-2 px-3 text-sm text-white focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20 outline-none"
              />
              {regErrors.password && <p className="mt-1 text-xs text-red-400">{regErrors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={registering}
              className="flex w-full items-center justify-center rounded-lg bg-[#aa8410] py-3 text-sm font-semibold text-white shadow-lg hover:bg-[#c5a028] disabled:opacity-50 transition-colors mt-6"
            >
              {registering ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Daftarkan Sekolah Saya'}
            </button>

            <p className="text-center text-xs text-zinc-500 mt-4">
              Sudah memiliki sekolah terdaftar?{' '}
              <button type="button" onClick={() => setIsRegisterMode(false)} className="text-[#d4af37] hover:underline">
                Masuk Ke Akun
              </button>
            </p>
          </form>
        ) : (
          /* LOGIN FORM */
          <form className="mt-8 space-y-6" onSubmit={handleLoginSubmit(onLoginSubmit)}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300">Alamat Email</label>
                <div className="relative mt-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
                    <Mail className="h-5 w-5" />
                  </div>
                  <input
                    {...loginRegister('email')}
                    type="email"
                    className="block w-full rounded-lg border border-zinc-800 bg-zinc-950 py-2.5 pl-10 pr-3 text-sm text-white placeholder-zinc-500 outline-none ring-offset-zinc-900 transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="name@school.sch.id"
                  />
                </div>
                {loginErrors.email && <p className="mt-1 text-xs text-red-400">{loginErrors.email.message}</p>}
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-zinc-300">Kata Sandi</label>
                  <Link to="/forgot-password" className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline">
                    Lupa kata sandi?
                  </Link>
                </div>
                <div className="relative mt-1">
                  <input
                    {...loginRegister('password')}
                    type={showPassword ? 'text' : 'password'}
                    className="block w-full rounded-lg border border-zinc-800 bg-zinc-950 py-2.5 pl-3 pr-10 text-sm text-white placeholder-zinc-500 outline-none ring-offset-zinc-900 transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-500 hover:text-zinc-300"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {loginErrors.password && <p className="mt-1 text-xs text-red-400">{loginErrors.password.message}</p>}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  {...loginRegister('rememberMe')}
                  type="checkbox"
                  className="h-4 w-4 rounded border-zinc-800 bg-zinc-950 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-zinc-400">Ingat Saya</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loginSubmitting}
              className="flex w-full items-center justify-center rounded-lg bg-indigo-600 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:bg-indigo-500 disabled:opacity-50"
            >
              {loginSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Masuk Ke Akun'}
            </button>

            <p className="text-center text-xs text-zinc-500 mt-4">
              Ingin mendaftarkan sekolah PAUD/TK baru?{' '}
              <button type="button" onClick={() => setIsRegisterMode(true)} className="text-indigo-400 hover:underline">
                Daftar Sekarang (SaaS Onboarding)
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
