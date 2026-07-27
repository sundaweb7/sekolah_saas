import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '../../config/axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

const resetPasswordSchema = z.object({
  password: z.string().min(6, { message: 'Kata sandi minimal 6 karakter' }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Konfirmasi kata sandi tidak cocok',
  path: ['confirmPassword'],
});

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [token, setToken] = useState('');

  useEffect(() => {
    const t = searchParams.get('token');
    if (t) {
      setToken(t);
    }
  }, [searchParams]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data) => {
    setError(null);
    setSuccess(false);

    if (!token) {
      setError('Token reset password tidak ditemukan. Silakan ajukan lupa kata sandi kembali.');
      return;
    }

    try {
      await api.post('/auth/reset-password', {
        token: token,
        password: data.password,
      });
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.message || 'Gagal mengubah kata sandi.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#08060d] px-4 text-[#f3f4f6]">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 shadow-2xl backdrop-blur-md">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-400">
            <Lock className="h-6 w-6" />
          </div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-white">
            Setel Ulang Sandi
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            Masukkan kata sandi baru untuk akun Anda
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="flex items-center gap-3 rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-400">
            <CheckCircle className="h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Kata Sandi Berhasil Diperbarui!</p>
              <p className="mt-1 text-zinc-300">
                Mengarahkan Anda kembali ke halaman masuk dalam 3 detik...
              </p>
            </div>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {!searchParams.get('token') && (
              <div>
                <label className="block text-sm font-medium text-zinc-300">
                  Token Reset
                </label>
                <input
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="block w-full mt-1 rounded-lg border border-zinc-800 bg-zinc-950 py-2.5 px-3 text-sm text-white placeholder-zinc-500 outline-none ring-offset-zinc-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Masukkan token reset"
                />
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300">
                  Kata Sandi Baru
                </label>
                <input
                  {...register('password')}
                  type="password"
                  className="block w-full mt-1 rounded-lg border border-zinc-800 bg-zinc-950 py-2.5 px-3 text-sm text-white placeholder-zinc-500 outline-none ring-offset-zinc-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="••••••••"
                />
                {errors.password && (
                  <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300">
                  Konfirmasi Kata Sandi Baru
                </label>
                <input
                  {...register('confirmPassword')}
                  type="password"
                  className="block w-full mt-1 rounded-lg border border-zinc-800 bg-zinc-950 py-2.5 px-3 text-sm text-white placeholder-zinc-500 outline-none ring-offset-zinc-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="••••••••"
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-400">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center rounded-lg bg-indigo-600 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:bg-indigo-500 active:scale-98 disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                'Perbarui Kata Sandi'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
