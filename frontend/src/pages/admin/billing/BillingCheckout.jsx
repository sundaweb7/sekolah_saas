import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../../config/axios';
import { 
  CreditCard, Loader2, ArrowLeft, CheckCircle2, 
  ChevronRight, AlertTriangle 
} from 'lucide-react';

export default function BillingCheckout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const plan = searchParams.get('plan') || 'basic';

  const [paymentMethod, setPaymentMethod] = useState('MANDIRI');
  const [billingCycle, setBillingCycle] = useState('monthly'); // monthly or yearly
  const [submitting, setSubmitting] = useState(false);
  const [checkoutResult, setCheckoutResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const plans = {
    basic: { 
      name: 'Basic Plan', 
      prices: { monthly: 25000, yearly: 300000 } 
    },
    standard: { 
      name: 'Standard Plan', 
      prices: { monthly: 50000, yearly: 600000 } 
    },
    premium: { 
      name: 'Premium Plan', 
      prices: { monthly: 100000, yearly: 1000000 } 
    }
  };

  const selectedPlan = plans[plan] || plans.basic;
  const currentPrice = billingCycle === 'yearly' ? selectedPlan.prices.yearly : selectedPlan.prices.monthly;

  const handleCheckout = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const response = await api.post('/admin/billing/checkout', {
        plan_name: plan,
        billing_cycle: billingCycle,
        payment_method: paymentMethod
      });
      setCheckoutResult(response.data);
    } catch (err) {
      setError(err.message || 'Gagal memulai transaksi pembayaran.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#08060d] text-[#f3f4f6] p-8 flex items-center justify-center">
      <div className="w-full max-w-lg space-y-6">
        
        {/* Back button */}
        <button 
          onClick={() => navigate('/admin/billing')}
          className="flex items-center gap-1 text-sm text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke Billing
        </button>

        {checkoutResult ? (
          /* Payment Instructions Card (Success state) */
            <div className="rounded-2xl border border-zinc-200 bg-white p-8 space-y-6 shadow-2xl text-zinc-800">
              <div className="text-center space-y-2">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h2 className="text-xl font-black text-zinc-900">Invoice Berhasil Dibuat</h2>
                <p className="text-xs text-zinc-600 font-medium">Selesaikan pembayaran sesuai instruksi di bawah ini</p>
              </div>

              <div className="rounded-xl bg-zinc-50 p-5 border border-zinc-200 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-600 font-bold">Nomor Invoice:</span>
                  <span className="font-mono text-zinc-950 font-black">{checkoutResult.invoice.invoice_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600 font-bold">Metode Pembayaran:</span>
                  <span className="text-zinc-950 font-black">{checkoutResult.tripay.payment_name}</span>
                </div>
                {checkoutResult.tripay.pay_code && (
                  <div className="flex justify-between items-center border-t border-zinc-200 pt-2.5">
                    <span className="text-zinc-600 font-bold">Kode Bayar / VA:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-amber-600 font-black text-xl tracking-wider select-all">
                        {checkoutResult.tripay.pay_code}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(checkoutResult.tripay.pay_code);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                        className="rounded bg-zinc-100 hover:bg-zinc-200 px-2 py-0.5 text-[10px] font-bold text-zinc-700 transition-all border border-zinc-300 active:scale-95"
                      >
                        {copied ? 'Tersalin' : 'Salin'}
                      </button>
                    </div>
                  </div>
                )}
                <div className="flex justify-between border-t border-zinc-200 pt-2.5">
                  <span className="text-zinc-600 font-bold">Total Nominal:</span>
                  <span className="text-indigo-600 font-black text-lg">
                    Rp {parseFloat(checkoutResult.tripay.amount).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Payment Steps */}
              <div className="space-y-4">
                <h3 className="font-black text-zinc-900 text-sm">Instruksi Pembayaran:</h3>
                <div className="space-y-3">
                  {checkoutResult.tripay.instructions[0].steps.map((step, idx) => (
                    <div key={idx} className="flex gap-3 text-xs text-zinc-800 font-semibold">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-200 text-[10px] font-black text-zinc-700 shrink-0">
                        {idx + 1}
                      </span>
                      <p className="leading-relaxed mt-0.5 text-zinc-700" dangerouslySetInnerHTML={{ __html: step }} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4">
                <a 
                  href={checkoutResult.tripay.checkout_url}
                  target="_blank"
                  rel="noreferrer"
                className="flex w-full items-center justify-center rounded-lg bg-indigo-600 py-3 text-sm font-semibold text-white shadow-lg hover:bg-indigo-500 transition-all"
              >
                Bayar via Tripay Portal ↗
              </a>
            </div>
          </div>
        ) : (
          /* Checkout Settings Form */
          <form onSubmit={handleCheckout} className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 shadow-xl space-y-6 backdrop-blur-md">
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Konfirmasi Pembayaran</h2>
              <p className="mt-1 text-sm text-zinc-400">Pilih metode pembayaran Tripay untuk melanjutkan pemesanan.</p>
            </div>

            {error && (
              <div className="flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="rounded-xl bg-zinc-950 p-4 border border-zinc-850 flex items-center justify-between text-sm">
              <div>
                <p className="text-zinc-500 font-medium">Paket Dipilih:</p>
                <p className="text-white font-bold uppercase text-lg mt-0.5">{selectedPlan.name}</p>
              </div>
              <div className="text-right">
                <p className="text-zinc-500 font-medium">Harga:</p>
                <p className="text-indigo-400 font-bold text-lg mt-0.5">
                  Rp {currentPrice.toLocaleString('id-ID')}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-zinc-300">Pilih Siklus Tagihan</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setBillingCycle('monthly')}
                  className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all ${
                    billingCycle === 'monthly'
                      ? 'border-[#d4af37] bg-[#d4af37]/10 text-white'
                      : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  Bulanan (Rp {selectedPlan.prices.monthly.toLocaleString('id-ID')})
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle('yearly')}
                  className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all ${
                    billingCycle === 'yearly'
                      ? 'border-[#d4af37] bg-[#d4af37]/10 text-white'
                      : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  Tahunan (Rp {selectedPlan.prices.yearly.toLocaleString('id-ID')})
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-zinc-300">Pilih Metode Pembayaran</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="block w-full rounded-lg border border-zinc-800 bg-zinc-950 py-2.5 px-3 text-sm text-white focus:border-indigo-500 focus:ring-2"
              >
                <option value="MANDIRI">Mandiri Virtual Account</option>
                <option value="BCA">BCA Virtual Account</option>
                <option value="BRI">BRI Virtual Account</option>
                <option value="QRIS">QRIS (ShopeePay/GOPAY)</option>
              </select>
            </div>

            <div className="pt-4 border-t border-zinc-805">
              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center rounded-lg bg-indigo-600 py-3 text-sm font-semibold text-white shadow-lg hover:bg-indigo-500 transition-all disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <span className="flex items-center gap-1.5"><CreditCard className="h-4 w-4" /> Proses Pembayaran</span>
                )}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
