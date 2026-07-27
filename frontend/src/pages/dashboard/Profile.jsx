import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../../context/AuthContext';
import api from '../../config/axios';
import { User, Lock, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

const profileSchema = z.object({
  fullName: z.string().min(3, { message: 'Nama lengkap minimal 3 karakter' }),
});

const passwordSchema = z.object({
  oldPassword: z.string().min(1, { message: 'Kata sandi lama wajib diisi' }),
  newPassword: z.string().min(6, { message: 'Kata sandi baru minimal 6 karakter' }),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Konfirmasi kata sandi tidak cocok',
  path: ['confirmPassword'],
});

export default function Profile() {
  const { user, changePassword, refreshSession } = useAuth();
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState(null);

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors, isSubmitting: isProfileSubmitting },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.full_name || '',
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors, isSubmitting: isPasswordSubmitting },
  } = useForm({
    resolver: zodResolver(passwordSchema),
  });

  const onUpdateProfile = async (data) => {
    setProfileError(null);
    setProfileSuccess(false);
    try {
      // In a real application, we hit POST /auth/profile/update or similar
      await api.post('/auth/profile/update', { full_name: data.fullName });
      setProfileSuccess(true);
      refreshSession(); // reload profile in context
    } catch (err) {
      setProfileError(err.message || 'Gagal memperbarui profil.');
    }
  };

  const onChangePasswordSubmit = async (data) => {
    setPasswordError(null);
    setPasswordSuccess(false);
    try {
      await changePassword(data.oldPassword, data.newPassword);
      setPasswordSuccess(true);
      resetPasswordForm();
    } catch (err) {
      setPasswordError(err.message || 'Gagal mengubah kata sandi.');
    }
  };

  return (
    <div className="min-h-screen bg-[#08060d] text-[#f3f4f6] p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Pengaturan Akun</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Kelola informasi profil dan keamanan akun Anda.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Profile Section */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl backdrop-blur-md space-y-6">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-indigo-400" />
              <h2 className="text-xl font-semibold text-white">Profil Pengguna</h2>
            </div>

            {profileSuccess && (
              <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-400">
                <CheckCircle className="h-5 w-5 shrink-0" />
                <span>Profil berhasil diperbarui.</span>
              </div>
            )}

            {profileError && (
              <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            <form onSubmit={handleProfileSubmit(onUpdateProfile)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300">Email (Tidak dapat diubah)</label>
                <input
                  type="text"
                  value={user?.email || ''}
                  disabled
                  className="block w-full mt-1 rounded-lg border border-zinc-800 bg-zinc-950/50 py-2.5 px-3 text-sm text-zinc-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300">Nama Lengkap</label>
                <input
                  {...registerProfile('fullName')}
                  type="text"
                  className="block w-full mt-1 rounded-lg border border-zinc-800 bg-zinc-950 py-2.5 px-3 text-sm text-white placeholder-zinc-500 outline-none ring-offset-zinc-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
                {profileErrors.fullName && (
                  <p className="mt-1 text-xs text-red-400">{profileErrors.fullName.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isProfileSubmitting}
                className="flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:bg-indigo-500 active:scale-98 disabled:opacity-50"
              >
                {isProfileSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  'Simpan Perubahan'
                )}
              </button>
            </form>
          </div>

          {/* Password Section */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl backdrop-blur-md space-y-6">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-indigo-400" />
              <h2 className="text-xl font-semibold text-white">Keamanan Sandi</h2>
            </div>

            {passwordSuccess && (
              <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-400">
                <CheckCircle className="h-5 w-5 shrink-0" />
                <span>Kata sandi berhasil diperbarui.</span>
              </div>
            )}

            {passwordError && (
              <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit(onChangePasswordSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300">Kata Sandi Lama</label>
                <input
                  {...registerPassword('oldPassword')}
                  type="password"
                  className="block w-full mt-1 rounded-lg border border-zinc-800 bg-zinc-950 py-2.5 px-3 text-sm text-white placeholder-zinc-500 outline-none ring-offset-zinc-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="••••••••"
                />
                {passwordErrors.oldPassword && (
                  <p className="mt-1 text-xs text-red-400">{passwordErrors.oldPassword.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300">Kata Sandi Baru</label>
                <input
                  {...registerPassword('newPassword')}
                  type="password"
                  className="block w-full mt-1 rounded-lg border border-zinc-800 bg-zinc-950 py-2.5 px-3 text-sm text-white placeholder-zinc-500 outline-none ring-offset-zinc-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="••••••••"
                />
                {passwordErrors.newPassword && (
                  <p className="mt-1 text-xs text-red-400">{passwordErrors.newPassword.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300">Konfirmasi Kata Sandi Baru</label>
                <input
                  {...registerPassword('confirmPassword')}
                  type="password"
                  className="block w-full mt-1 rounded-lg border border-zinc-800 bg-zinc-950 py-2.5 px-3 text-sm text-white placeholder-zinc-500 outline-none ring-offset-zinc-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="••••••••"
                />
                {passwordErrors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-400">{passwordErrors.confirmPassword.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isPasswordSubmitting}
                className="flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:bg-indigo-500 active:scale-98 disabled:opacity-50"
              >
                {isPasswordSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  'Perbarui Sandi'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
