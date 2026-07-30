import { useState, useEffect } from 'react';
import api from '../../config/axios';
import { 
  Trophy, Plus, Edit2, Trash2, CheckCircle, XCircle, DollarSign, Calendar, Users, Award, 
  Loader2, RefreshCw, X, Check, Save, UserCheck, AlertCircle
} from 'lucide-react';

export default function ExtracurricularManager() {
  const [activeTab, setActiveTab] = useState('ekskul');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Master Data States
  const [ekskuls, setEkskuls] = useState([]);
  const [students, setStudents] = useState([]); // All active students for enrollment lookup
  
  // Tab 2: Pendaftaran & Pembayaran States
  const [enrollments, setEnrollments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [enrollStudentId, setEnrollStudentId] = useState('');
  const [enrollEkskulId, setEnrollEkskulId] = useState('');
  const [submitEnrollLoading, setSubmitEnrollLoading] = useState(false);

  // Tab 3: Presensi & Nilai States
  const [presenceEkskulId, setPresenceEkskulId] = useState('');
  const [presenceDate, setPresenceDate] = useState(new Date().toISOString().split('T')[0]);
  const [presenceMembers, setPresenceMembers] = useState([]);
  const [presenceLoading, setPresenceLoading] = useState(false);
  const [presenceSaveLoading, setPresenceSaveLoading] = useState(false);

  // Grading Modal States
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [gradingMember, setGradingMember] = useState(null);
  const [gradeScore, setGradeScore] = useState('A');
  const [gradeDesc, setGradeDesc] = useState('');
  const [gradeSaveLoading, setGradeSaveLoading] = useState(false);

  // CRUD Modal States (Master Ekskul)
  const [showEkskulModal, setShowEkskulModal] = useState(false);
  const [editingEkskul, setEditingEkskul] = useState(null);
  const [ekskulName, setEkskulName] = useState('');
  const [ekskulCoach, setEkskulCoach] = useState('');
  const [ekskulDay, setEkskulDay] = useState('Senin');
  const [ekskulTime, setEkskulTime] = useState('14:00 - 15:30');
  const [ekskulLocation, setEkskulLocation] = useState('');
  const [ekskulQuota, setEkskulQuota] = useState(30);
  const [ekskulFeeReg, setEkskulFeeReg] = useState(0);
  const [ekskulFeeMonthly, setEkskulFeeMonthly] = useState(0);
  const [ekskulStatus, setEkskulStatus] = useState('active');
  const [ekskulSubmitLoading, setEkskulSubmitLoading] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (activeTab === 'pendaftaran') {
      fetchEnrollmentData();
    } else if (activeTab === 'presensi') {
      if (presenceEkskulId) {
        fetchPresenceMembers();
      } else {
        setPresenceMembers([]);
      }
    }
  }, [activeTab, presenceEkskulId, presenceDate]);

  const fetchInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Ekskuls
      const ekskulsRes = await api.get('/admin/extracurriculars');
      setEkskuls(ekskulsRes.data || []);
      if (ekskulsRes.data && ekskulsRes.data.length > 0) {
        setPresenceEkskulId(ekskulsRes.data[0].id);
      }

      // 2. Fetch Active Students for Enrollment
      const studentsRes = await api.get('/admin/students?status=aktif&per_page=300');
      setStudents(studentsRes.data || []);
    } catch (err) {
      console.error(err);
      setError('Gagal memuat data awal ekskul.');
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrollmentData = async () => {
    try {
      const membersRes = await api.get('/admin/extracurriculars/members');
      setEnrollments(membersRes.data || []);

      const paymentsRes = await api.get('/admin/extracurriculars/payments');
      setPayments(paymentsRes.data || []);
    } catch (err) {
      console.error(err);
      setError('Gagal memuat data pendaftaran dan pembayaran.');
    }
  };

  const fetchPresenceMembers = async () => {
    if (!presenceEkskulId) return;
    setPresenceLoading(true);
    try {
      const presenceRes = await api.get(`/admin/extracurriculars/presences?extracurricular_id=${presenceEkskulId}&presence_date=${presenceDate}`);
      setPresenceMembers(presenceRes.data || []);
    } catch (err) {
      console.error(err);
      setError('Gagal memuat daftar hadir ekskul.');
    } finally {
      setPresenceLoading(false);
    }
  };

  // --- CRUD HANDLERS (Master Ekskul) ---
  const handleOpenAddEkskul = () => {
    setEditingEkskul(null);
    setEkskulName('');
    setEkskulCoach('');
    setEkskulDay('Senin');
    setEkskulTime('14:00 - 15:30');
    setEkskulLocation('');
    setEkskulQuota(30);
    setEkskulFeeReg(0);
    setEkskulFeeMonthly(0);
    setEkskulStatus('active');
    setShowEkskulModal(true);
  };

  const handleOpenEditEkskul = (ekskul) => {
    setEditingEkskul(ekskul);
    setEkskulName(ekskul.name || '');
    setEkskulCoach(ekskul.coach || '');
    setEkskulDay(ekskul.schedule_day || 'Senin');
    setEkskulTime(ekskul.schedule_time || '14:00 - 15:30');
    setEkskulLocation(ekskul.location || '');
    setEkskulQuota(ekskul.quota || 0);
    setEkskulFeeReg(parseFloat(ekskul.fee_registration || 0));
    setEkskulFeeMonthly(parseFloat(ekskul.fee_monthly || 0));
    setEkskulStatus(ekskul.status || 'active');
    setShowEkskulModal(true);
  };

  const handleEkskulSubmit = async (e) => {
    e.preventDefault();
    if (!ekskulName.trim()) return;

    setEkskulSubmitLoading(true);
    setError(null);
    setSuccess(null);

    const payload = {
      name: ekskulName,
      coach: ekskulCoach,
      schedule_day: ekskulDay,
      schedule_time: ekskulTime,
      location: ekskulLocation,
      quota: ekskulQuota,
      fee_registration: ekskulFeeReg,
      fee_monthly: ekskulFeeMonthly,
      status: ekskulStatus
    };

    try {
      if (editingEkskul) {
        await api.post(`/admin/extracurriculars/update/${editingEkskul.id}`, payload);
        setSuccess('Ekskul berhasil diperbarui!');
      } else {
        await api.post('/admin/extracurriculars', payload);
        setSuccess('Ekskul baru berhasil dibuat!');
      }
      setShowEkskulModal(false);
      fetchInitialData();
    } catch (err) {
      console.error(err);
      setError('Gagal menyimpan ekskul.');
    } finally {
      setEkskulSubmitLoading(false);
    }
  };

  const handleEkskulDelete = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus ekskul ini?')) return;
    setError(null);
    setSuccess(null);
    try {
      await api.delete(`/admin/extracurriculars/${id}`);
      setSuccess('Ekskul berhasil dihapus.');
      fetchInitialData();
    } catch (err) {
      console.error(err);
      setError('Gagal menghapus ekskul.');
    }
  };

  // --- ENROLLMENT HANDLERS ---
  const handleEnrollSubmit = async (e) => {
    e.preventDefault();
    if (!enrollStudentId || !enrollEkskulId) return;

    setSubmitEnrollLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await api.post('/admin/extracurriculars/members/enroll', {
        student_id: enrollStudentId,
        extracurricular_id: enrollEkskulId
      });
      setSuccess('Pendaftaran siswa berhasil diajukan.');
      setEnrollStudentId('');
      fetchEnrollmentData();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Gagal mendaftarkan siswa.');
    } finally {
      setSubmitEnrollLoading(false);
    }
  };

  const handleApproveEnroll = async (id, approveStatus) => {
    setError(null);
    setSuccess(null);
    try {
      await api.post('/admin/extracurriculars/members/approve', {
        id: id,
        status: approveStatus
      });
      setSuccess(`Pendaftaran siswa berhasil ${approveStatus === 'approved' ? 'disetujui' : 'ditolak'}.`);
      fetchEnrollmentData();
    } catch (err) {
      console.error(err);
      setError('Gagal memverifikasi pendaftaran.');
    }
  };

  const handleConfirmPayment = async (id) => {
    if (!window.confirm('Apakah Anda yakin konfirmasi lunas tagihan ekskul ini?')) return;
    setError(null);
    setSuccess(null);
    try {
      await api.post('/admin/extracurriculars/payments/pay', { id });
      setSuccess('Pembayaran tagihan berhasil dilunasi.');
      fetchEnrollmentData();
    } catch (err) {
      console.error(err);
      setError('Gagal mengonfirmasi pembayaran.');
    }
  };

  // --- PRESENCE HANDLERS ---
  const handlePresenceStatusChange = (memberId, status) => {
    setPresenceMembers(prev => prev.map(m => m.member_id === memberId ? { ...m, status } : m));
  };

  const handleSavePresence = async () => {
    setPresenceSaveLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await api.post('/admin/extracurriculars/presences/save', {
        extracurricular_id: presenceEkskulId,
        presence_date: presenceDate,
        presences: presenceMembers.map(m => ({ member_id: m.member_id, status: m.status }))
      });
      setSuccess('Presensi latihan ekskul berhasil disimpan.');
      fetchPresenceMembers();
    } catch (err) {
      console.error(err);
      setError('Gagal menyimpan presensi.');
    } finally {
      setPresenceSaveLoading(false);
    }
  };

  // --- GRADING HANDLERS ---
  const handleOpenGradeModal = (member) => {
    setGradingMember(member);
    setGradeScore(member.grade || 'A');
    setGradeDesc(member.grade_description || '');
    setShowGradeModal(true);
  };

  const handleGradeSubmit = async (e) => {
    e.preventDefault();
    if (!gradingMember) return;

    setGradeSaveLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await api.post('/admin/extracurriculars/members/grade', {
        id: gradingMember.id,
        grade: gradeScore,
        grade_description: gradeDesc
      });
      setSuccess('Penilaian prestasi ekskul berhasil disimpan.');
      setShowGradeModal(false);
      fetchEnrollmentData();
    } catch (err) {
      console.error(err);
      setError('Gagal menyimpan penilaian.');
    } finally {
      setGradeSaveLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
            <Trophy className="h-7 w-7 text-[#d4af37]" />
            Manajemen Ekskul
          </h1>
          <p className="text-xs text-zinc-550 mt-1.5 font-sans">
            Kelola ekstrakurikuler sekolah, registrasi siswa, absensi kehadiran, iuran kas, dan catatan prestasi akhir semester.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchInitialData}
            className="p-3 border border-zinc-200 hover:bg-zinc-50 rounded-xl transition-all shadow-sm"
          >
            <RefreshCw className="h-4.5 w-4.5 text-zinc-650" />
          </button>
          <button
            onClick={handleOpenAddEkskul}
            className="rounded-xl bg-[#d4af37] hover:bg-[#f3cb65] text-black px-4 py-2.5 text-xs font-extrabold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" /> Buat Ekskul Baru
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-750 p-4 rounded-xl flex items-center gap-2 text-xs font-semibold">
          <AlertCircle className="h-4.5 w-4.5" />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-750 p-4 rounded-xl flex items-center gap-2 text-xs font-semibold">
          <CheckCircle className="h-4.5 w-4.5" />
          {success}
        </div>
      )}

      {/* Tabs Controller */}
      <div className="flex border-b border-zinc-200 gap-2 overflow-x-auto pb-1">
        <button 
          onClick={() => setActiveTab('ekskul')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${activeTab === 'ekskul' ? 'border-[#d4af37] text-zinc-900 font-extrabold' : 'border-transparent text-zinc-500 hover:text-zinc-800'}`}
        >
          <Trophy className="h-4 w-4" /> Daftar Ekskul
        </button>
        <button 
          onClick={() => { setActiveTab('pendaftaran'); fetchEnrollmentData(); }}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${activeTab === 'pendaftaran' ? 'border-[#d4af37] text-zinc-900 font-extrabold' : 'border-transparent text-zinc-500 hover:text-zinc-800'}`}
        >
          <UserCheck className="h-4 w-4" /> Pendaftaran & Keuangan
        </button>
        <button 
          onClick={() => setActiveTab('presensi')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${activeTab === 'presensi' ? 'border-[#d4af37] text-zinc-900 font-extrabold' : 'border-transparent text-zinc-500 hover:text-zinc-800'}`}
        >
          <Calendar className="h-4 w-4" /> Presensi & Nilai
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-8 w-8 text-[#d4af37] animate-spin" />
          <p className="text-xs text-zinc-400 font-medium">Memuat data ekskul...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: DAFTAR EKSKUL */}
          {activeTab === 'ekskul' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ekskuls.length === 0 ? (
                <div className="col-span-full bg-white border border-zinc-200 rounded-2xl p-12 text-center text-zinc-400 shadow-sm">
                  <Trophy className="h-10 w-10 mx-auto text-zinc-300 mb-2" />
                  <p className="text-xs font-medium">Belum ada kelompok ekskul terdaftar.</p>
                </div>
              ) : (
                ekskuls.map((ekskul) => (
                  <div key={ekskul.id} className="rounded-2xl border border-zinc-200 bg-white p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <h4 className="font-extrabold text-base text-zinc-900">{ekskul.name}</h4>
                        <span className={`px-2.5 py-0.5 text-[9px] font-bold tracking-wider uppercase rounded-full ${ekskul.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-zinc-100 text-zinc-500 border border-zinc-200'}`}>
                          {ekskul.status === 'active' ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </div>
                      
                      <div className="space-y-1.5 text-xs text-zinc-600 font-sans border-t border-zinc-100 pt-3">
                        <p>👤 <strong>Pembina:</strong> {ekskul.coach || '-'}</p>
                        <p>📅 <strong>Jadwal:</strong> {ekskul.schedule_day}, {ekskul.schedule_time}</p>
                        <p>📍 <strong>Tempat:</strong> {ekskul.location || '-'}</p>
                        <p>👥 <strong>Kuota:</strong> {ekskul.quota ? `${ekskul.quota} Siswa` : 'Tak Terbatas'}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 bg-zinc-50 p-2.5 rounded-xl border border-zinc-150 text-[10px]">
                        <div>
                          <p className="font-bold text-zinc-400 uppercase tracking-wide">Pendaftaran</p>
                          <p className="font-extrabold text-zinc-800 mt-0.5">Rp {parseFloat(ekskul.fee_registration).toLocaleString('id-ID')}</p>
                        </div>
                        <div>
                          <p className="font-bold text-zinc-400 uppercase tracking-wide">Iuran Bulanan</p>
                          <p className="font-extrabold text-zinc-800 mt-0.5">Rp {parseFloat(ekskul.fee_monthly).toLocaleString('id-ID')}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 border-t border-zinc-100 mt-4 pt-3.5">
                      <button 
                        onClick={() => handleOpenEditEkskul(ekskul)}
                        className="p-2 border border-zinc-200 text-zinc-450 hover:text-[#d4af37] hover:border-[#d4af37] rounded-xl transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleEkskulDelete(ekskul.id)}
                        className="p-2 border border-zinc-200 text-zinc-450 hover:text-red-500 hover:border-red-200 rounded-xl transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: PENDAFTARAN & PEMBAYARAN */}
          {activeTab === 'pendaftaran' && (
            <div className="space-y-6">
              
              {/* Form Input Registrasi Manual */}
              <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-zinc-900 text-sm flex items-center gap-1.5 border-b border-zinc-100 pb-3">
                  <UserCheck className="h-5 w-5 text-[#d4af37]" /> Mendaftarkan Siswa Baru ke Ekskul
                </h3>
                <form onSubmit={handleEnrollSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end mt-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-zinc-700">Pilih Kelompok Ekskul</label>
                    <select
                      required
                      value={enrollEkskulId}
                      onChange={(e) => setEnrollEkskulId(e.target.value)}
                      className="block w-full rounded-xl border border-zinc-300 py-2.5 px-3 focus:border-[#d4af37] outline-none text-zinc-700"
                    >
                      <option value="">-- Pilih Ekskul --</option>
                      {ekskuls.filter(e => e.status === 'active').map(e => (
                        <option key={e.id} value={e.id}>{e.name} (Jadwal: {e.schedule_day})</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-zinc-700">Pilih Siswa Aktif</label>
                    <select
                      required
                      value={enrollStudentId}
                      onChange={(e) => setEnrollStudentId(e.target.value)}
                      className="block w-full rounded-xl border border-zinc-300 py-2.5 px-3 focus:border-[#d4af37] outline-none text-zinc-700"
                    >
                      <option value="">-- Pilih Siswa --</option>
                      {students.map(s => (
                        <option key={s.id} value={s.id}>{s.full_name} ({s.registration_number || 'No Induk -'})</option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={submitEnrollLoading}
                    className="w-full bg-[#d4af37] hover:bg-[#f3cb65] text-black font-extrabold py-2.5 px-4 rounded-xl flex items-center justify-center gap-1 transition-colors shadow-sm h-[40px]"
                  >
                    {submitEnrollLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Daftarkan Siswa
                  </button>
                </form>
              </div>

              {/* Grid 2 Column: Pendaftar & Keuangan */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                
                {/* Panel 1: Status Anggota */}
                <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-4">
                  <h3 className="font-bold text-zinc-800 text-sm flex items-center gap-2 border-b border-zinc-100 pb-3">
                    <Users className="h-5 w-5 text-[#d4af37]" /> Daftar Anggota / Pendaftar Ekskul
                  </h3>
                  <div className="overflow-x-auto rounded-xl border border-zinc-200">
                    <table className="w-full text-left border-collapse text-[11px] font-sans">
                      <thead>
                        <tr className="bg-zinc-50 border-b border-zinc-200 text-[9px] font-extrabold text-zinc-400 uppercase tracking-widest">
                          <th className="px-4 py-3">Siswa / Ekskul</th>
                          <th className="px-4 py-3 text-center">Status</th>
                          <th className="px-4 py-3 text-center">Nilai</th>
                          <th className="px-4 py-3 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 text-zinc-700">
                        {enrollments.length === 0 ? (
                          <tr>
                            <td colSpan="4" className="px-4 py-6 text-center text-zinc-400 italic">Belum ada pengajuan pendaftaran.</td>
                          </tr>
                        ) : (
                          enrollments.map((item) => (
                            <tr key={item.id} className="hover:bg-zinc-50/50">
                              <td className="px-4 py-3.5">
                                <p className="font-bold text-zinc-900">{item.student_name}</p>
                                <p className="text-[10px] text-zinc-400 mt-0.5">{item.extracurricular_name} (L/P: {item.student_gender})</p>
                              </td>
                              <td className="px-4 py-3.5 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                                  item.status === 'approved' ? 'bg-emerald-50 text-emerald-700' :
                                  item.status === 'rejected' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                                }`}>
                                  {item.status === 'approved' ? 'Aktif' : item.status === 'rejected' ? 'Ditolak' : 'Pending'}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 text-center">
                                {item.status === 'approved' ? (
                                  <button
                                    onClick={() => handleOpenGradeModal(item)}
                                    className="px-2 py-0.5 rounded bg-zinc-100 hover:bg-[#d4af37]/20 text-zinc-800 border border-zinc-200 font-extrabold"
                                  >
                                    {item.grade ? `Nilai: ${item.grade}` : '+ Nilai'}
                                  </button>
                                ) : '-'}
                              </td>
                              <td className="px-4 py-3.5 text-center">
                                {item.status === 'pending' ? (
                                  <div className="flex justify-center gap-1.5">
                                    <button 
                                      onClick={() => handleApproveEnroll(item.id, 'approved')}
                                      className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                                      title="Setujui Pendaftaran"
                                    >
                                      <Check className="h-4 w-4" />
                                    </button>
                                    <button 
                                      onClick={() => handleApproveEnroll(item.id, 'rejected')}
                                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                                      title="Tolak Pendaftaran"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  </div>
                                ) : '-'}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Panel 2: Log Pembayaran */}
                <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-4">
                  <h3 className="font-bold text-zinc-800 text-sm flex items-center gap-2 border-b border-zinc-100 pb-3">
                    <DollarSign className="h-5 w-5 text-[#d4af37]" /> Keuangan & Iuran Tagihan Ekskul
                  </h3>
                  <div className="overflow-x-auto rounded-xl border border-zinc-200">
                    <table className="w-full text-left border-collapse text-[11px] font-sans">
                      <thead>
                        <tr className="bg-zinc-50 border-b border-zinc-200 text-[9px] font-extrabold text-zinc-400 uppercase tracking-widest">
                          <th className="px-4 py-3">Siswa / Ekskul</th>
                          <th className="px-4 py-3">Jenis / Periode</th>
                          <th className="px-4 py-3 text-right">Nominal</th>
                          <th className="px-4 py-3 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 text-zinc-700">
                        {payments.length === 0 ? (
                          <tr>
                            <td colSpan="4" className="px-4 py-6 text-center text-zinc-450 italic">Belum ada catatan tagihan keuangan.</td>
                          </tr>
                        ) : (
                          payments.map((p) => (
                            <tr key={p.id} className="hover:bg-zinc-50/50">
                              <td className="px-4 py-3.5">
                                <p className="font-bold text-zinc-900">{p.student_name}</p>
                                <p className="text-[10px] text-zinc-400 mt-0.5">{p.extracurricular_name}</p>
                              </td>
                              <td className="px-4 py-3.5">
                                <p className="font-medium text-zinc-800 capitalize">{p.fee_type === 'registration' ? 'Pendaftaran' : 'Iuran Bulanan'}</p>
                                <p className="text-[10px] text-zinc-400 mt-0.5">{p.month_period || '-'}</p>
                              </td>
                              <td className="px-4 py-3.5 text-right font-extrabold text-zinc-900">
                                Rp {parseFloat(p.amount).toLocaleString('id-ID')}
                              </td>
                              <td className="px-4 py-3.5 text-center">
                                {p.status === 'unpaid' ? (
                                  <button
                                    onClick={() => handleConfirmPayment(p.id)}
                                    className="px-2.5 py-1 bg-amber-50 hover:bg-[#d4af37] text-amber-700 hover:text-black font-extrabold border border-amber-200 hover:border-transparent rounded-lg transition-all"
                                  >
                                    Bayar Tunai
                                  </button>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase">
                                    Lunas
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 3: PRESENSI & NILAI */}
          {activeTab === 'presensi' && (
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-100 pb-4 text-xs">
                <h3 className="font-bold text-zinc-950 text-sm flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-[#d4af37]" /> Presensi Latihan Harian
                </h3>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <label className="font-bold text-zinc-650">Kelompok Ekskul:</label>
                    <select
                      value={presenceEkskulId}
                      onChange={(e) => setPresenceEkskulId(e.target.value)}
                      className="rounded-xl border border-zinc-300 py-1.5 px-3 focus:border-[#d4af37] outline-none text-zinc-700 font-medium"
                    >
                      {ekskuls.filter(e => e.status === 'active').map(e => (
                        <option key={e.id} value={e.id}>{e.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <label className="font-bold text-zinc-650">Tanggal Latihan:</label>
                    <input
                      type="date"
                      value={presenceDate}
                      onChange={(e) => setPresenceDate(e.target.value)}
                      className="rounded-xl border border-zinc-300 py-1.5 px-3 focus:border-[#d4af37] outline-none text-zinc-700 font-medium"
                    />
                  </div>
                </div>
              </div>

              {presenceLoading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <Loader2 className="h-6 w-6 text-[#d4af37] animate-spin" />
                  <p className="text-xs text-zinc-400">Memuat lembar hadir...</p>
                </div>
              ) : presenceMembers.length === 0 ? (
                <div className="text-center py-12 text-zinc-400 italic font-sans text-xs">
                  Belum ada anggota siswa aktif yang disetujui bergabung dalam ekskul ini.
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="overflow-x-auto rounded-xl border border-zinc-200">
                    <table className="w-full text-left border-collapse text-xs font-sans">
                      <thead>
                        <tr className="bg-zinc-50 border-b border-zinc-200 text-[9px] font-extrabold text-zinc-400 uppercase tracking-widest">
                          <th className="px-5 py-3">Nama Siswa</th>
                          <th className="px-5 py-3">No. Induk</th>
                          <th className="px-5 py-3 text-center">Status Kehadiran</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 text-zinc-700">
                        {presenceMembers.map((m) => (
                          <tr key={m.member_id} className="hover:bg-zinc-50/50">
                            <td className="px-5 py-3.5 font-bold text-zinc-900">{m.student_name}</td>
                            <td className="px-5 py-3.5">{m.registration_number || '-'}</td>
                            <td className="px-5 py-3.5">
                              <div className="flex justify-center gap-4">
                                {[
                                  { value: 'present', label: 'Hadir', activeClass: 'bg-emerald-50 text-emerald-700 border-emerald-350' },
                                  { value: 'absent', label: 'Alpa', activeClass: 'bg-red-50 text-red-750 border-red-300' },
                                  { value: 'permit', label: 'Izin', activeClass: 'bg-amber-50 text-amber-750 border-amber-300' },
                                  { value: 'sick', label: 'Sakit', activeClass: 'bg-blue-50 text-blue-750 border-blue-300' }
                                ].map((opt) => (
                                  <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => handlePresenceStatusChange(m.member_id, opt.value)}
                                    className={`px-3 py-1 text-[10px] font-bold rounded-lg border transition-all ${
                                      m.status === opt.value 
                                        ? opt.activeClass 
                                        : 'bg-white text-zinc-400 border-zinc-250 hover:text-zinc-750 hover:bg-zinc-50'
                                    }`}
                                  >
                                    {opt.label}
                                  </button>
                                ))}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end pt-3">
                    <button
                      onClick={handleSavePresence}
                      disabled={presenceSaveLoading}
                      className="rounded-xl bg-[#d4af37] hover:bg-[#f3cb65] px-6 py-2.5 text-xs font-bold text-black flex items-center gap-1.5 shadow-sm transition-colors"
                    >
                      {presenceSaveLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      Simpan Daftar Hadir
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

        </>
      )}

      {/* CRUD MODAL MASTER EKSKUL */}
      {showEkskulModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl space-y-5 text-xs text-zinc-800">
            <div className="flex items-center justify-between border-b border-zinc-150 pb-3">
              <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-1">
                <Trophy className="h-5 w-5 text-[#d4af37]" />
                {editingEkskul ? 'Edit Kelompok Ekskul' : 'Buat Ekskul Baru'}
              </h3>
              <button onClick={() => setShowEkskulModal(false)} className="text-zinc-450 hover:text-zinc-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEkskulSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block font-bold text-zinc-700">Nama Kelompok Ekskul</label>
                <input 
                  type="text" 
                  required
                  value={ekskulName}
                  onChange={(e) => setEkskulName(e.target.value)}
                  placeholder="Contoh: Karate, Tari Tradisional, Futsal"
                  className="block w-full rounded-xl border border-zinc-300 py-2.5 px-3.5 focus:border-[#d4af37] outline-none text-zinc-800 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-zinc-700">Nama Pelatih / Pembina</label>
                <input 
                  type="text"
                  value={ekskulCoach}
                  onChange={(e) => setEkskulCoach(e.target.value)}
                  placeholder="Contoh: Kak Wahyu / Sabeum Anton"
                  className="block w-full rounded-xl border border-zinc-300 py-2.5 px-3.5 focus:border-[#d4af37] outline-none text-zinc-800 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-bold text-zinc-700">Hari Latihan</label>
                  <select
                    value={ekskulDay}
                    onChange={(e) => setEkskulDay(e.target.value)}
                    className="block w-full rounded-xl border border-zinc-300 py-2.5 px-3.5 focus:border-[#d4af37] outline-none text-zinc-850"
                  >
                    {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-zinc-700">Jam Latihan</label>
                  <input 
                    type="text" 
                    value={ekskulTime}
                    onChange={(e) => setEkskulTime(e.target.value)}
                    placeholder="Contoh: 14:00 - 15:30"
                    className="block w-full rounded-xl border border-zinc-300 py-2.5 px-3.5 focus:border-[#d4af37] outline-none text-zinc-800 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-bold text-zinc-700">Tempat Latihan</label>
                  <input 
                    type="text" 
                    value={ekskulLocation}
                    onChange={(e) => setEkskulLocation(e.target.value)}
                    placeholder="Aula / Lapangan Utama"
                    className="block w-full rounded-xl border border-zinc-300 py-2.5 px-3.5 focus:border-[#d4af37] outline-none text-zinc-800 font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-zinc-700">Kuota Siswa</label>
                  <input 
                    type="number" 
                    value={ekskulQuota}
                    onChange={(e) => setEkskulQuota(parseInt(e.target.value) || 0)}
                    className="block w-full rounded-xl border border-zinc-300 py-2.5 px-3.5 focus:border-[#d4af37] outline-none text-zinc-800 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-bold text-zinc-700">Biaya Pendaftaran (Rp)</label>
                  <input 
                    type="number" 
                    value={ekskulFeeReg}
                    onChange={(e) => setEkskulFeeReg(parseFloat(e.target.value) || 0)}
                    className="block w-full rounded-xl border border-zinc-300 py-2.5 px-3.5 focus:border-[#d4af37] outline-none text-zinc-800 font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-zinc-700">Iuran Bulanan (Rp)</label>
                  <input 
                    type="number" 
                    value={ekskulFeeMonthly}
                    onChange={(e) => setEkskulFeeMonthly(parseFloat(e.target.value) || 0)}
                    className="block w-full rounded-xl border border-zinc-300 py-2.5 px-3.5 focus:border-[#d4af37] outline-none text-zinc-800 font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-zinc-700">Status Kelompok</label>
                <select
                  value={ekskulStatus}
                  onChange={(e) => setEkskulStatus(e.target.value)}
                  className="block w-full rounded-xl border border-zinc-300 py-2.5 px-3.5 focus:border-[#d4af37] outline-none text-zinc-850"
                >
                  <option value="active">Aktif</option>
                  <option value="inactive">Nonaktif</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-150">
                <button 
                  type="button"
                  onClick={() => setShowEkskulModal(false)}
                  className="rounded-xl border border-zinc-350 px-4 py-2.5 font-bold text-zinc-550 hover:text-zinc-800"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={ekskulSubmitLoading}
                  className="rounded-xl bg-[#d4af37] hover:bg-[#f3cb65] px-6 py-2.5 font-bold text-black flex items-center gap-1 shadow-sm"
                >
                  {ekskulSubmitLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Simpan Ekskul
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GRADING MODAL DIALOG */}
      {showGradeModal && gradingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl space-y-4 text-xs text-zinc-800">
            <div className="flex items-center justify-between border-b border-zinc-150 pb-3">
              <h3 className="text-sm font-bold text-zinc-950 flex items-center gap-1">
                <Award className="h-5 w-5 text-[#d4af37]" />
                Penilaian Kegiatan Ekskul
              </h3>
              <button onClick={() => setShowGradeModal(false)} className="text-zinc-400 hover:text-zinc-650 font-bold">✕</button>
            </div>

            <form onSubmit={handleGradeSubmit} className="space-y-4">
              <div className="bg-zinc-50 border border-zinc-150 rounded-xl p-3">
                <p className="font-bold text-zinc-900">{gradingMember.student_name}</p>
                <p className="text-[10px] text-zinc-400 mt-0.5">Ekskul: {gradingMember.extracurricular_name}</p>
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-zinc-700">Predikat Nilai Raport</label>
                <select
                  value={gradeScore}
                  onChange={(e) => setGradeScore(e.target.value)}
                  className="block w-full rounded-xl border border-zinc-300 py-2.5 px-3 focus:border-[#d4af37] outline-none text-zinc-800 font-extrabold"
                >
                  <option value="A">Sangat Baik (A)</option>
                  <option value="B">Baik (B)</option>
                  <option value="C">Cukup (C)</option>
                  <option value="D">Kurang (D)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-zinc-700">Catatan Pembina / Perkembangan Prestasi</label>
                <textarea
                  rows="3"
                  value={gradeDesc}
                  onChange={(e) => setGradeDesc(e.target.value)}
                  placeholder="Masukkan deskripsi perkembangan siswa selama mengikuti ekskul..."
                  className="block w-full rounded-xl border border-zinc-300 py-2.5 px-3 focus:border-[#d4af37] outline-none text-zinc-800"
                />
              </div>

              <div className="pt-4 border-t border-zinc-150 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowGradeModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-300 hover:bg-zinc-50 font-bold text-zinc-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={gradeSaveLoading}
                  className="px-5 py-2.5 rounded-xl bg-[#d4af37] hover:bg-[#f3cb65] font-bold text-black flex items-center gap-1"
                >
                  {gradeSaveLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Simpan Nilai
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
