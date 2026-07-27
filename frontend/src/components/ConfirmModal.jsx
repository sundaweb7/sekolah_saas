import { Trash2, AlertTriangle, Loader2, X } from 'lucide-react';

/**
 * Reusable Delete / Action Confirmation Modal
 * 
 * Props:
 *  - open: boolean
 *  - title: string
 *  - message: string | ReactNode
 *  - confirmLabel: string (default "Ya, Hapus")
 *  - confirmClass: string (tailwind, default red)
 *  - loading: boolean
 *  - onConfirm: () => void
 *  - onCancel: () => void
 *  - icon: ReactNode (optional)
 *  - variant: 'danger' | 'warning' | 'info' (default 'danger')
 */
export default function ConfirmModal({
  open,
  title = 'Konfirmasi Hapus',
  message = 'Data ini akan dihapus permanen dan tidak bisa dikembalikan.',
  confirmLabel = 'Ya, Hapus',
  loading = false,
  onConfirm,
  onCancel,
  variant = 'danger',
}) {
  if (!open) return null;

  const variantStyles = {
    danger:  { icon: <Trash2 className="h-5 w-5 text-red-600" />,    ring: 'bg-red-100',    btn: 'bg-red-600 hover:bg-red-700' },
    warning: { icon: <AlertTriangle className="h-5 w-5 text-amber-600" />, ring: 'bg-amber-100', btn: 'bg-amber-500 hover:bg-amber-600' },
    info:    { icon: <AlertTriangle className="h-5 w-5 text-blue-600" />,  ring: 'bg-blue-100',  btn: 'bg-blue-600 hover:bg-blue-700' },
  };
  const v = variantStyles[variant] || variantStyles.danger;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4">
          <div className="flex items-start gap-4">
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${v.ring}`}>
              {v.icon}
            </div>
            <div className="pt-0.5">
              <h3 className="font-bold text-zinc-900 text-base">{title}</h3>
              <p className="text-sm text-zinc-500 mt-1 leading-relaxed">{message}</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            disabled={loading}
            className="ml-2 text-zinc-400 hover:text-zinc-700 shrink-0 mt-0.5"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 pb-6">
          <button
            onClick={onCancel}
            disabled={loading}
            className="rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition-all disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`rounded-xl ${v.btn} px-5 py-2.5 text-sm font-bold text-white flex items-center gap-2 transition-all disabled:opacity-50`}
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Memproses...</>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
