import { useState, useEffect } from 'react';
import api from '../../../config/axios';
import { 
  Plus, Search, Trash2, Edit2, ChevronLeft, ChevronRight, 
  School, AlertCircle, RefreshCw, X, Loader2, Award
} from 'lucide-react';

export default function ClassList() {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [message, setMessage] = useState(null);

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete Confirmation Modal
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null, name: '' });
  const [deleting, setDeleting] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [ageGroup, setAgeGroup] = useState('4-6_years');
  const [teacherId, setTeacherId] = useState('');

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/classes', {
        params: {
          page: page,
          per_page: 10,
          q: searchQuery
        }
      });
      setClasses(response.data || []);
      const pager = response.pagination;
      if (pager) {
        setTotalPages(pager.pageCount || 1);
      }
    } catch (error) {
      console.error('Failed to fetch classes', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await api.get('/admin/teachers', { params: { per_page: 200 } });
      setTeachers(response.data || []);
    } catch (error) {
      console.error('Failed to fetch teachers', error);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, [page, searchQuery]);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleDelete = async (id, name) => {
    setConfirmDelete({ open: true, id, name });
  };

  const doDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/admin/classes/${confirmDelete.id}`);
      setConfirmDelete({ open: false, id: null, name: '' });
      fetchClasses();
      setMessage({ type: 'success', text: 'Kelas berhasil dihapus.' });
    } catch (error) {
      alert('Gagal menghapus kelas.');
    } finally {
      setDeleting(false);
    }
  };

  const openAddModal = () => {
    setEditingClass(null);
    setName('');
    setAgeGroup('4-6_years');
    setTeacherId('');
    setShowModal(true);
  };

  const openEditModal = (cls) => {
    setEditingClass(cls);
    setName(cls.name);
    setAgeGroup(cls.age_group);
    setTeacherId(cls.teacher_id || '');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    const payload = {
      name: name,
      age_group: ageGroup,
      teacher_id: teacherId || null
    };

    try {
      if (editingClass) {
        await api.post(`/admin/classes/update/${editingClass.id}`, payload);
        setMessage({ type: 'success', text: 'Kelas berhasil diperbarui!' });
      } else {
        await api.post('/admin/classes', payload);
        setMessage({ type: 'success', text: 'Kelas baru berhasil dibuat!' });
      }
      setShowModal(false);
      fetchClasses();
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Gagal menyimpan data kelas.' });
    } finally {
      setSubmitting(false);
    }
  };

  const getAgeGroupLabel = (group) => {
    switch (group) {
      case '2-3_years': return 'KB A (2-3 Tahun)';
      case '3-4_years': return 'KB B (3-4 Tahun)';
      case '4-6_years': return 'TK (4-6 Tahun)';
      default: return group.replace('_', ' ');
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <School className="h-8 w-8 text-[#d4af37]" /> Manajemen Kelas
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Kelola kelompok belajar, kelas murid, kelompok umur, beserta wali kelasnya.
          </p>
        </div>
        <button 
          onClick={openAddModal}
          className="rounded-xl bg-[#d4af37] hover:bg-[#f3cb65] px-4 py-2.5 text-sm font-bold text-black flex items-center gap-2 transition-colors self-start sm:self-auto"
        >
          <Plus className="h-5 w-5" /> Buat Kelas Baru
        </button>
      </div>

      {message && (
        <div className={`flex items-center gap-3 rounded-xl border p-4 text-sm ${
          message.type === 'success' ? 'border-green-500/30 bg-green-500/10 text-green-400' : 'border-red-500/30 bg-red-500/10 text-red-400'
        }`}>
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{message.text}</span>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
          <Search className="h-5 w-5" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="block w-full rounded-xl border border-zinc-850 bg-zinc-900/30 py-2.5 pl-10 pr-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/20"
          placeholder="Cari kelas..."
        />
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#d4af37]" />
        </div>
      ) : classes.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-zinc-900 bg-zinc-950/20 text-zinc-500 text-sm space-y-2">
          <School className="h-12 w-12 mx-auto text-zinc-700" />
          <p>Belum ada kelas belajar yang dibuat.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((cls) => {
            const assignedTeacher = teachers.find(t => t.id == cls.teacher_id);
            return (
              <div key={cls.id} className="rounded-2xl border border-zinc-850 bg-zinc-900/20 p-6 flex flex-col justify-between hover:border-zinc-800 transition-colors">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <h3 className="font-extrabold text-white text-lg tracking-tight">{cls.name}</h3>
                    <span className="text-[10px] uppercase font-bold tracking-wider bg-amber-400/10 text-amber-500 px-2 py-0.5 rounded">
                      {getAgeGroupLabel(cls.age_group)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-zinc-400 font-semibold bg-zinc-950/50 p-3 rounded-xl border border-zinc-850/60">
                    <Award className="h-4.5 w-4.5 text-[#d4af37] shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest leading-none">Guru Wali Kelas</p>
                      <p className="font-semibold text-zinc-300 truncate mt-1">
                        {cls.teacher_name || 'Belum Ditugaskan'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2.5 mt-6 pt-4 border-t border-zinc-900">
                  <button 
                    onClick={() => openEditModal(cls)}
                    className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-850 py-2 text-xs font-semibold text-zinc-300 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Edit2 className="h-3.5 w-3.5" /> Edit Kelas
                  </button>
                    <button 
                      onClick={() => handleDelete(cls.id, cls.name)}
                      className="rounded-lg border border-zinc-800 bg-red-950/10 hover:bg-red-950/30 py-2 px-3 text-xs font-semibold text-red-400 flex items-center justify-center transition-colors"
                    >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-zinc-900 pt-4">
          <span className="text-sm text-zinc-400">
            Halaman {page} dari {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="flex items-center gap-1 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-white hover:bg-zinc-800 disabled:opacity-50 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" /> Sebelumnya
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="flex items-center gap-1 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-white hover:bg-zinc-800 disabled:opacity-50 transition-colors"
            >
              Selanjutnya <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Class Form Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-150 pb-3">
              <h3 className="text-lg font-bold text-zinc-900">
                {editingClass ? 'Edit Kelas Belajar' : 'Buat Kelas Baru'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-zinc-950">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-650">Nama Kelas / Rombel</label>
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Kelas Anggrek"
                  className="block w-full mt-1.5 rounded-xl border border-zinc-300 bg-white py-2.5 px-3.5 text-sm text-zinc-900 focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/20 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-650">Kelompok Usia</label>
                <select 
                  value={ageGroup}
                  onChange={(e) => setAgeGroup(e.target.value)}
                  className="block w-full mt-1.5 rounded-xl border border-zinc-300 bg-white py-2.5 px-3.5 text-sm text-zinc-900 focus:border-[#d4af37] outline-none"
                >
                  <option value="2-3_years">Kelompok Bermain A (2-3 Tahun)</option>
                  <option value="3-4_years">Kelompok Bermain B (3-4 Tahun)</option>
                  <option value="4-6_years">Taman Kanak-kanak (4-6 Tahun)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-650">Wali Kelas (Guru)</label>
                <select 
                  value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value)}
                  className="block w-full mt-1.5 rounded-xl border border-zinc-300 bg-white py-2.5 px-3.5 text-sm text-zinc-900 focus:border-[#d4af37] outline-none"
                >
                  <option value="">-- Pilih Guru Wali Kelas --</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.full_name}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-150">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-zinc-200 px-4 py-2.5 text-xs font-bold text-zinc-500 hover:text-zinc-950 hover:bg-zinc-50 transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-[#d4af37] hover:bg-[#f3cb65] px-6 py-2.5 text-xs font-bold text-black flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Simpan Kelas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-100">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-zinc-900">Hapus Kelas?</h3>
                <p className="text-sm text-zinc-500 mt-1">
                  Kelas <span className="font-semibold text-zinc-800">{confirmDelete.name || 'ini'}</span> akan dihapus permanen dan tidak bisa dikembalikan.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmDelete({ open: false, id: null, name: '' })}
                disabled={deleting}
                className="rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition-all disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={doDelete}
                disabled={deleting}
                className="rounded-xl bg-red-600 hover:bg-red-700 px-4 py-2.5 text-sm font-bold text-white flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {deleting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Menghapus...</>
                ) : (
                  <><Trash2 className="h-4 w-4" /> Ya, Hapus</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
