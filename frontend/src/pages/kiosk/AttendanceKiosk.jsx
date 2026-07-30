import { useState, useEffect } from 'react';
import { Loader2, KeyRound, UserCheck, Calendar, ArrowRight, ShieldCheck, Clock, CheckCircle } from 'lucide-react';
import api from '../../config/axios';

export default function AttendanceKiosk() {
  const [schools, setSchools] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState('');
  const [pin, setPin] = useState('');
  const [validatedClass, setValidatedClass] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [schoolsLoading, setSchoolsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Auto-clear message
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(''), 8000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  // Load active schools for dropdown selection
  useEffect(() => {
    api.get('/tenant/profile') // public tenant config check
      .then(() => {
        // Just fallback list since we are public kiosk, but we can query public list
        // Let's get school list by hitting a simpler endpoint
        api.get('/ppdb/settings')
          .then((res) => {
            // If school context is active on current subdomain, pre-select it
            const currentSchoolId = res.data?.settings?.school_id || '';
            setSelectedSchool(currentSchoolId);
          });
      })
      .catch(() => {})
      .finally(() => setSchoolsLoading(false));
  }, []);

  const handleValidatePin = async (e) => {
    e.preventDefault();
    if (!selectedSchool) {
      setError('Silakan tentukan ID sekolah Anda.');
      return;
    }
    if (pin.length < 6) {
      setError('PIN harus berupa 6 digit angka.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/kiosk/validate-pin', {
        school_id: Number(selectedSchool),
        pin: pin
      });
      setValidatedClass(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'PIN tidak valid atau sudah kadaluarsa.');
      setValidatedClass(null);
    } finally {
      setLoading(false);
    }
  };

  const handleStudentCheckin = async (studentId) => {
    setLoading(true);
    setError(null);
    setSuccessMsg('');
    try {
      const response = await api.post('/kiosk/checkin', {
        school_id: Number(selectedSchool),
        pin: pin,
        student_id: studentId
      });
      setSuccessMsg(response.message || `Berhasil presensi: ${response.data.student_name} (${response.data.status})`);
      
      // Re-validate PIN silently to update checked_in status on UI
      const refreshRes = await api.post('/kiosk/validate-pin', {
        school_id: Number(selectedSchool),
        pin: pin
      });
      setValidatedClass(refreshRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mencatat absensi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col justify-between p-6">
      {/* Header Kiosk */}
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-amber-400 flex items-center justify-center text-black font-black text-xl shadow-lg shadow-amber-400/20">
            K
          </div>
          <div>
            <h1 className="font-bold tracking-tight text-lg">Koola Kiosk Mode</h1>
            <p className="text-xs text-zinc-500">Absensi Mandiri Siswa & Guru</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-zinc-400 font-mono flex items-center gap-1.5 justify-end">
            <Calendar className="h-3.5 w-3.5 text-amber-400" />
            {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full flex items-center justify-center py-10">
        {!validatedClass ? (
          /* PIN Input Card */
          <form onSubmit={handleValidatePin} className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900/50 p-8 shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <div className="h-14 w-14 rounded-2xl bg-zinc-800 flex items-center justify-center mx-auto border border-zinc-700">
                <KeyRound className="h-6 w-6 text-amber-400" />
              </div>
              <h2 className="text-xl font-bold">Masukkan PIN Absensi</h2>
              <p className="text-xs text-zinc-400">PIN dinamis dapat dilihat di Dashboard Guru bimbingan kelas Anda.</p>
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/25 bg-red-500/10 p-3.5 text-xs text-red-400 text-center">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-400">Kode Unik / ID Sekolah</label>
                <input
                  type="number"
                  required
                  placeholder="Contoh: 1"
                  value={selectedSchool}
                  onChange={(e) => setSelectedSchool(e.target.value)}
                  className="block w-full mt-2 rounded-xl border border-zinc-800 bg-zinc-950 py-3.5 px-4 text-center text-lg font-bold text-white focus:border-amber-400 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-400">PIN Absensi Kelas (6 Digit)</label>
                <input
                  type="text"
                  pattern="[0-9]*"
                  maxLength="6"
                  required
                  placeholder="0 0 0 0 0 0"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  className="block w-full mt-2 rounded-xl border border-zinc-800 bg-zinc-950 py-3.5 px-4 text-center text-2xl font-mono font-bold tracking-[0.5em] text-white focus:border-amber-400 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:bg-amber-600 text-zinc-950 py-3.5 text-sm font-bold shadow-xl transition-all"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Masuk Mode Kiosk'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        ) : (
          /* Kiosk Class Attendance View */
          <div className="w-full space-y-6">
            {/* Info Bar */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 flex items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Kelas</span>
                <h2 className="text-xl font-bold">{validatedClass.class}</h2>
              </div>
              <div className="text-right">
                <button
                  onClick={() => { setValidatedClass(null); setPin(''); }}
                  className="text-xs text-zinc-400 hover:text-white underline"
                >
                  Keluar Kiosk
                </button>
              </div>
            </div>

            {/* Notification Messages */}
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

            {/* Students Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {validatedClass.students.map((student) => (
                <button
                  key={student.id}
                  disabled={student.checked_in || loading}
                  onClick={() => handleStudentCheckin(student.id)}
                  className={`rounded-2xl border p-4 text-center transition-all flex flex-col items-center justify-between gap-3 min-h-[160px] relative ${
                    student.checked_in
                      ? 'border-green-500/35 bg-green-500/5 text-zinc-400'
                      : 'border-zinc-800 bg-zinc-900/30 hover:bg-zinc-800/50 hover:border-zinc-700 text-white'
                  }`}
                >
                  {/* Photo or initials */}
                  <div className={`h-14 w-14 rounded-full flex items-center justify-center text-sm font-bold border ${
                    student.checked_in ? 'border-green-900/50 bg-zinc-800' : 'border-zinc-700 bg-zinc-950'
                  }`}>
                    {student.photo ? (
                      <img src={student.photo} alt={student.full_name} className="h-full w-full object-cover rounded-full" />
                    ) : (
                      student.full_name.slice(0, 2).toUpperCase()
                    )}
                  </div>

                  <div>
                    <p className="text-xs font-semibold line-clamp-2">{student.full_name}</p>
                    {student.nis && <p className="text-[10px] text-zinc-500 mt-0.5">NIS: {student.nis}</p>}
                  </div>

                  {student.checked_in ? (
                    <div className="flex items-center gap-1 text-[10px] font-bold text-green-400 uppercase">
                      <UserCheck className="h-3 w-3" />
                      {student.status === 'terlambat' ? `Telat ${student.late_minutes}m` : 'Hadir'}
                    </div>
                  ) : (
                    <span className="text-[10px] font-bold text-amber-400 uppercase group-hover:underline">Presensi</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer Kiosk */}
      <footer className="text-center text-xs text-zinc-600 mt-6 max-w-4xl mx-auto w-full border-t border-zinc-900 pt-4 flex items-center justify-between">
        <p className="flex items-center gap-1">
          <ShieldCheck className="h-3.5 w-3.5 text-zinc-500" />
          Kiosk Mode Terlindungi
        </p>
        <p>© 2026 Koola Paudku Center</p>
      </footer>
    </div>
  );
}
