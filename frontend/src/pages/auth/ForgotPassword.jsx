import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '../../config/axios';
import { Link } from 'react-router-dom';
import { Mail, HelpCircle, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Alamat email tidak valid' }),
});

export default function ForgotPassword() {
  const [success, setSuccess] = useState(false);
  const [resetToken, setResetToken] = useState(null); // For local simulation testing
  const [error, setError] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data) => {
    setError(null);
    setSuccess(false);
    try {
      const response = await api.post('/auth/forgot-password', { email: data.email });
      setSuccess(true);
      // For local testing, show the generated token if returned by backend
      if (response.data && response.data.reset_token) {
        setResetToken(response.data.reset_token);
      }
    } catch (err) {
      setError(err.message || 'Gagal mengajukan permintaan reset password.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#08060d] px-4 text-[#f3f4f6]">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 shadow-2xl backdrop-blur-md">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-400">
            <HelpCircle className="h-6 w-6" />
          </div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-white">
            Lupa Kata Sandi?
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            Masukkan alamat email Anda untuk menerima link reset kata sandi
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="space-y-6 text-center">
            <div className="flex items-center gap-3 rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-400 text-left">
              <CheckCircle className="h-5 w-5 shrink-0" />
              <div>
                <p className="font-semibold">Permintaan Terkirim!</p>
                <p className="mt-1 text-zinc-300">
                  Tautan pemulihan kata sandi telah dikirim ke email Anda. Silakan periksa folder masuk dan spam.
                </p>
              </div>
            </div>

            {resetToken && (
              <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 p-4 text-sm text-indigo-400 text-left">
                <p className="font-semibold">Simulasi Token Pengujian Lokal:</p>
                <p className="font-mono mt-1 select-all">{resetToken}</p>
                <p className="mt-2 text-xs text-zinc-400">
                  Gunakan token di atas pada halaman reset password untuk menyelesaikan alur.
                </p>
                <Link
                  to={`/reset-password?token=${resetToken}`}
                  className="mt-3 block text-center rounded bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors"
                >
                  Buka Halaman Reset Password
                </Link>
              </div>
            )}

            <div className="text-sm">
              <Link
                to="/login"
                className="font-medium text-indigo-400 hover:text-indigo-300 hover:underline"
              >
                Kembali ke halaman login
              </Link>
            </div>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label className="block text-sm font-medium text-zinc-300">
                Alamat Email
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  {...register('email')}
                  type="email"
                  className="block w-full rounded-lg border border-zinc-800 bg-zinc-950 py-2.5 pl-10 pr-3 text-sm text-white placeholder-zinc-500 outline-none ring-offset-zinc-900 transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="name@school.sch.id"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center rounded-lg bg-indigo-600 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:bg-indigo-500 active:scale-98 disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                'Kirim Tautan Reset'
              )}
            </button>

            <div className="text-center text-sm">
              <Link
                to="/login"
                className="font-medium text-indigo-400 hover:text-indigo-300 hover:underline"
              >
                Kembali ke halaman login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
