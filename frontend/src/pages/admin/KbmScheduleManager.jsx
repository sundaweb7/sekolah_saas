import { useState, useEffect } from 'react';
import api from '../../config/axios';
import { 
  Calendar, Clock, BookOpen, Plus, Trash2, Edit, CheckCircle, AlertTriangle, 
  Loader2, User, ChevronRight, LayoutGrid
} from 'lucide-react';

export default function KbmScheduleManager() {
  const [schedules, setSchedules] = useState([]);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  // Filters
  const [selectedClassId, setSelectedClassId] = useState('');

  // Modal Fields
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [formClassId, setFormClassId] = useState('');
  const [formDayName, setFormDayName] = useState('Senin');
  const [formSubjectName, setFormSubjectName] = useState('');
  const [formTeacherId, setFormTeacherId] = useState('');
  const [formStartTime, setFormStartTime] = useState('');
  const [formEndTime, setFormEndTime] = useState('');

  const daysList = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

  const fetchInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      const classRes = await api.get('/admin/classes');
      setClasses(classRes.data || []);
      if (classRes.data && classRes.data.length > 0) {
        setSelectedClassId(classRes.data[0].id);
      }

      const teacherRes = await api.get('/admin/teachers');
      setTeachers(teacherRes.data || []);

      const schedRes = await api.get('/admin/kbm-schedules');
      setSchedules(schedRes.data || []);
    } catch (err) {
      console.error(err);
      setError('Gagal memuat data awal jadwal KBM.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedulesOnly = async () => {
    try {
      const res = await api.get('/admin/kbm-schedules');
      setSchedules(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const openAddModal = () => {
    setEditingSchedule(null);
    setFormClassId(selectedClassId);
    setFormDayName('Senin');
    setFormSubjectName('');
    setFormTeacherId('');
    setFormStartTime('');
    setFormEndTime('');
    setShowModal(true);
  };

  const openEditModal = (sch) => {
    setEditingSchedule(sch);
    setFormClassId(sch.class_id);
    setFormDayName(sch.day_name);
    setFormSubjectName(sch.subject_name);
    setFormTeacherId(sch.teacher_id);
    setFormStartTime(sch.start_time.slice(0, 5));
    setFormEndTime(sch.end_time.slice(0, 5));
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setError(null);
    setSuccess(null);

    const payload = {
      class_id: formClassId,
      day_name: formDayName,
      subject_name: formSubjectName,
      teacher_id: formTeacherId,
      start_time: formStartTime,
      end_time: formEndTime
    };

    try {
      if (editingSchedule) {
        await api.post(`/admin/kbm-schedules/update/${editingSchedule.id}`, payload);
        setSuccess('Jadwal KBM berhasil diperbarui!');
      } else {
        await api.post('/admin/kbm-schedules', payload);
        setSuccess('Slot jadwal KBM baru berhasil dibuat!');
      }
      setShowModal(false);
      fetchSchedulesOnly();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Gagal menyimpan jadwal KBM.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus slot jadwal pelajaran ini?')) return;
    try {
      await api.delete(`/admin/kbm-schedules/delete/${id}`);
      setSuccess('Jadwal KBM berhasil dihapus.');
      fetchSchedulesOnly();
    } catch (err) {
      console.error(err);
      setError('Gagal menghapus jadwal KBM.');
    }
  };

  // Group schedules by class and day
  const filteredSchedules = schedules.filter(
    (s) => String(s.class_id) === String(selectedClassId)
  );

  const getSchedulesForDay = (day) => {
    return filteredSchedules.filter((s) => s.day_name === day);
  };

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto text-xs text-zinc-800">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-zinc-900 flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-[#d4af37]" /> Jadwal Pelajaran KBM
          </h1>
          <p className="text-zinc-500 mt-1">Susun jadwal mata pelajaran mingguan per kelas secara dinamis terhubung langsung dengan Guru pengajar.</p>
        </div>
        <button
          onClick={openAddModal}
          className="rounded-xl bg-[#d4af37] hover:bg-[#f3cb65] text-black px-5 py-2.5 font-bold flex items-center gap-1.5 transition-all shadow-sm"
        >
          <Plus className="h-4 w-4" /> Tambah Jadwal Pelajaran
        </button>
      </div>

      {/* Success/Error Alerts */}
      {success && (
        <div className="flex items-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-green-600">
          <CheckCircle className="h-5 w-5 shrink-0" />
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-600">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid View */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Left Side: Class Filter Selector */}
        <div className="lg:col-span-1 bg-white border border-zinc-200/80 rounded-2xl p-4 shadow-sm space-y-3">
          <h3 className="font-extrabold text-zinc-700 uppercase tracking-wider text-[10px] pb-2 border-b border-zinc-150 flex items-center gap-1">
            <LayoutGrid className="h-4 w-4 text-[#d4af37]" /> Pilih Kelas
          </h3>
          {classes.length === 0 ? (
            <p className="text-zinc-400 text-xs italic">Belum ada data kelas</p>
          ) : (
            <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
              {classes.map((cls) => (
                <button
                  key={cls.id}
                  onClick={() => setSelectedClassId(cls.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${String(selectedClassId) === String(cls.id) ? 'bg-[#d4af37]/10 border-[#d4af37] text-zinc-900 font-bold' : 'border-zinc-150 bg-white hover:bg-zinc-50 text-zinc-600'}`}
                >
                  <p className="truncate text-xs">Kelas {cls.name}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Weekly Schedule Timetable Sheet */}
        <div className="lg:col-span-3 space-y-6">
          {classes.length === 0 ? (
            <div className="bg-white border border-zinc-200/80 rounded-2xl p-12 text-center text-zinc-400">
              Silakan buat data Kelas terlebih dahulu di menu Manajemen Kelas.
            </div>
          ) : (
            <div className="space-y-6">
              {daysList.map((day) => {
                const daySchedules = getSchedulesForDay(day);
                return (
                  <div key={day} className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                    <div className="flex justify-between items-center border-b border-zinc-150 pb-2.5">
                      <h3 className="font-extrabold text-zinc-800 text-sm flex items-center gap-1.5">
                        <Calendar className="h-4 w-4 text-[#d4af37]" /> Hari {day}
                      </h3>
                      <span className="text-[10px] bg-zinc-100 text-zinc-500 font-bold px-2 py-0.5 rounded-full">
                        {daySchedules.length} Sesi KBM
                      </span>
                    </div>

                    {daySchedules.length === 0 ? (
                      <p className="text-zinc-400 text-xs italic pl-6 py-2">Tidak ada jadwal KBM di hari {day}.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {daySchedules.map((sch) => (
                          <div key={sch.id} className="bg-zinc-50/50 hover:bg-zinc-50 border border-zinc-150 rounded-xl p-4 flex justify-between items-start transition-all">
                            <div className="space-y-2">
                              <h4 className="font-extrabold text-zinc-900 text-sm flex items-center gap-1.5">
                                <BookOpen className="h-3.5 w-3.5 text-zinc-400" /> {sch.subject_name}
                              </h4>
                              <div className="space-y-1 text-zinc-550 text-[10px]">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{sch.start_time.slice(0, 5)} - {sch.end_time.slice(0, 5)}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  <span>Guru: <strong className="text-zinc-700">{sch.teacher_name}</strong></span>
                                </div>
                              </div>
                            </div>

                            <div className="flex gap-1.5">
                              <button
                                onClick={() => openEditModal(sch)}
                                className="p-1.5 text-zinc-450 hover:text-zinc-800 hover:bg-white rounded-lg border border-transparent hover:border-zinc-200 shadow-sm transition-all"
                                title="Edit"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(sch.id)}
                                className="p-1.5 text-zinc-450 hover:text-red-500 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-100 shadow-sm transition-all"
                                title="Hapus"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* SCHEDULE FORM DIALOG MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-zinc-150 overflow-hidden">
            <div className="px-6 py-4.5 border-b border-zinc-150 flex justify-between items-center bg-zinc-50/50">
              <h3 className="font-extrabold text-zinc-900 text-sm flex items-center gap-1.5">
                <BookOpen className="h-5 w-5 text-[#d4af37]" />
                {editingSchedule ? 'Edit Slot Jadwal Pelajaran' : 'Tambah Slot Jadwal Pelajaran'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-zinc-650 font-bold">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block font-bold text-zinc-700">Pilih Kelas</label>
                  <select
                    required
                    value={formClassId}
                    onChange={(e) => setFormClassId(e.target.value)}
                    className="block w-full rounded-xl border border-zinc-350 py-2.5 px-3 focus:border-[#d4af37] outline-none text-zinc-800 bg-white"
                  >
                    <option value="">-- Kelas --</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>Kelas {cls.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block font-bold text-zinc-700">Hari KBM</label>
                  <select
                    required
                    value={formDayName}
                    onChange={(e) => setFormDayName(e.target.value)}
                    className="block w-full rounded-xl border border-zinc-350 py-2.5 px-3 focus:border-[#d4af37] outline-none text-zinc-800 bg-white"
                  >
                    {daysList.map((day) => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-zinc-700">Nama Mata Pelajaran (Subject)</label>
                <input
                  type="text"
                  required
                  value={formSubjectName}
                  onChange={(e) => setFormSubjectName(e.target.value)}
                  placeholder="Contoh: Matematika, Agama Islam, Bahasa Inggris"
                  className="block w-full rounded-xl border border-zinc-300 py-2.5 px-3.5 focus:border-[#d4af37] outline-none text-zinc-800 font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-zinc-700">Guru Pengajar (Pendidik)</label>
                <select
                  required
                  value={formTeacherId}
                  onChange={(e) => setFormTeacherId(e.target.value)}
                  className="block w-full rounded-xl border border-zinc-350 py-2.5 px-3 focus:border-[#d4af37] outline-none text-zinc-800 bg-white"
                >
                  <option value="">-- Pilih Guru --</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.full_name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block font-bold text-zinc-700">Jam Mulai</label>
                  <input
                    type="time"
                    required
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    className="block w-full rounded-xl border border-zinc-300 py-2 px-3 focus:border-[#d4af37] outline-none text-zinc-800"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block font-bold text-zinc-700">Jam Selesai</label>
                  <input
                    type="time"
                    required
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    className="block w-full rounded-xl border border-zinc-300 py-2 px-3 focus:border-[#d4af37] outline-none text-zinc-800"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-150 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-300 hover:bg-zinc-50 font-bold text-zinc-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-5 py-2.5 rounded-xl bg-[#d4af37] hover:bg-[#f3cb65] font-bold text-black flex items-center gap-1.5 shadow-sm transition-all"
                >
                  {submitLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Simpan Jadwal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
