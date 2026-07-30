import { useState, useEffect } from 'react';
import api from '../../../config/axios';
import ConfirmModal from '../../../components/ConfirmModal';
import {
  Plus, Search, Download, Upload, Trash2, Edit2,
  ChevronLeft, ChevronRight, UserPlus, AlertCircle, RefreshCw, X, Loader2, LogIn,
  Users, GraduationCap, ArrowLeftRight
} from 'lucide-react';

export default function StudentsList() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [importing, setImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [message, setMessage] = useState(null);

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null, name: '' });
  const [deleting, setDeleting] = useState(false);
  const [impersonatingId, setImpersonatingId] = useState(null);

  // Form Fields State
  const [fullName, setFullName] = useState('');
  const [regNum, setRegNum] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('L');
  const [classId, setClassId] = useState('');
  const [parentId, setParentId] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentPassword, setParentPassword] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [statusTab, setStatusTab] = useState('aktif');
  const [status, setStatus] = useState('aktif');
  const [photoFile, setPhotoFile] = useState(null);

  const [stats, setStats] = useState({
    total_active: 0,
    total_male: 0,
    total_female: 0,
    total_mutation: 0
  });

  const fetchStudentStats = async () => {
    try {
      const statsRes = await api.get('/admin/students/stats');
      if (statsRes.data) {
        setStats(statsRes.data);
      }
    } catch (error) {
      console.error('Failed to fetch student stats', error);
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      fetchStudentStats(); // Also fetch counts cards
      const response = await api.get('/admin/students', {
        params: {
          page: page,
          per_page: 10,
          q: searchQuery,
          status: statusTab
        }
      });
      setStudents(response.data || []);
      const pager = response.pagination;
      if (pager) {
        setTotalPages(pager.pageCount || 1);
      }
    } catch (error) {
      console.error('Failed to fetch students', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const classRes = await api.get('/admin/classes');
      setClasses(classRes.data || []);
    } catch (err) {
      console.error('Failed to fetch support list data', err);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [page, searchQuery, statusTab]);

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleExport = async () => {
    try {
      const response = await api.get('/admin/students/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'data_siswa.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert('Gagal mengekspor data.');
    }
  };

  const handleImport = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('excel_file', selectedFile);

    setImporting(true);
    setMessage(null);

    try {
      await api.post('/admin/students/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage({ type: 'success', text: 'Data siswa berhasil diimpor!' });
      setSelectedFile(null);
      fetchStudents();
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Gagal mengimpor data.' });
    } finally {
      setImporting(false);
    }
  };

  const handleDelete = (id, name) => {
    setConfirmDelete({ open: true, id, name });
  };

  const doDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/admin/students/${confirmDelete.id}`);
      setConfirmDelete({ open: false, id: null, name: '' });
      fetchStudents();
      setMessage({ type: 'success', text: 'Siswa berhasil dihapus.' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Gagal menghapus siswa.' });
    } finally {
      setDeleting(false);
    }
  };

  const handleImpersonateParent = async (studentId, studentName) => {
    setImpersonatingId(studentId);
    try {
      const res = await api.post(`/admin/students/impersonate-parent/${studentId}`);
      const { code } = res.data;
      const protocol = window.location.protocol;
      const host = window.location.host;
      const redirectUrl = `${protocol}//${host}/login?impersonation_code=${encodeURIComponent(code)}`;
      window.open(redirectUrl, '_blank');
    } catch (err) {
      setMessage({ type: 'error', text: err.message || `Gagal masuk sebagai wali ${studentName}.` });
    } finally {
      setImpersonatingId(null);
    }
  };

  const openAddModal = () => {
    setEditingStudent(null);
    setFullName('');
    setRegNum('');
    setBirthDate('');
    setGender('L');
    setClassId('');
    setParentId('');
    setParentEmail('');
    setParentName('');
    setParentPassword('');
    setParentPhone('');
    setStatus('aktif');
    setPhotoFile(null);
    setShowModal(true);
  };

  const openEditModal = (student) => {
    setEditingStudent(student);
    setFullName(student.full_name);
    setRegNum(student.registration_number || '');
    setBirthDate(student.birth_date);
    setGender(student.gender);
    setClassId(student.current_class_id || '');
    setParentId(student.parent_user_id || '');
    setParentEmail(student.parent_email || '');
    setParentName(student.parent_name || '');
    setParentPassword('');
    setParentPhone(student.parent_phone || '');
    setStatus(student.status || 'aktif');
    setPhotoFile(null);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    const formData = new FormData();
    formData.append('full_name', fullName);
    formData.append('registration_number', regNum);
    formData.append('birth_date', birthDate);
    formData.append('gender', gender);
    if (classId) formData.append('current_class_id', classId);
    if (parentId) formData.append('parent_user_id', parentId);
    formData.append('status', status);

    // Parent Account Info
    if (parentEmail) formData.append('parent_email', parentEmail);
    if (parentName) formData.append('parent_name', parentName);
    if (parentPassword) formData.append('parent_password', parentPassword);
    if (parentPhone) formData.append('parent_phone', parentPhone);

    if (photoFile) {
      formData.append('photo_file', photoFile);
    }

    try {
      if (editingStudent) {
        await api.post(`/admin/students/update/${editingStudent.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setMessage({ type: 'success', text: 'Profil siswa berhasil diperbarui!' });
      } else {
        await api.post('/admin/students', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setMessage({ type: 'success', text: 'Siswa baru berhasil ditambahkan!' });
      }
      setShowModal(false);
      fetchStudents();
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Gagal menyimpan data siswa.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">Database Siswa</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Kelola, ekspor, dan impor seluruh profil data siswa sekolah Anda secara mudah.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 px-4 py-2.5 text-xs font-semibold text-zinc-700 shadow-sm transition-colors"
          >
            <Download className="h-4 w-4" />
            Ekspor Excel
          </button>

          <button
            onClick={() => document.getElementById('import-input').click()}
            className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 px-4 py-2.5 text-xs font-semibold text-zinc-700 shadow-sm transition-colors"
          >
            <Upload className="h-4 w-4" />
            Impor Excel
          </button>
          <input
            id="import-input"
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                setSelectedFile(e.target.files[0]);
                document.getElementById('submit-import').click();
              }
            }}
            className="hidden"
          />

          <button
            onClick={openAddModal}
            className="flex items-center gap-2 rounded-xl bg-[#d9a425] hover:bg-[#e5c158] px-4 py-2.5 text-xs font-bold text-black shadow-sm transition-colors"
          >
            <Plus className="h-4 w-4" />
            Tambah Siswa
          </button>
        </div>
      </div>

      {/* Kartu Ringkasan (Student Stats Summary) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Siswa Aktif */}
        <div className="bg-[#18181b] border border-zinc-900 rounded-2xl p-5 flex items-center justify-between hover:border-[#d9a425]/30 transition-all duration-300">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#d9a425]">Siswa Permukiman / Aktif</p>
            <p className="text-3xl font-black text-white">{stats.total_active}</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-zinc-900 flex items-center justify-center border border-zinc-800 shrink-0">
            <GraduationCap className="h-6 w-6 text-[#d9a425]" />
          </div>
        </div>

        {/* Card 2: Putra */}
        <div className="bg-[#18181b] border border-zinc-900 rounded-2xl p-5 flex items-center justify-between hover:border-[#d9a425]/30 transition-all duration-300">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#d9a425]">Siswa Putra (L)</p>
            <p className="text-3xl font-black text-white">{stats.total_male}</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-zinc-900 flex items-center justify-center border border-zinc-800 shrink-0">
            <Users className="h-6 w-6 text-[#d9a425]" />
          </div>
        </div>

        {/* Card 3: Putri */}
        <div className="bg-[#18181b] border border-zinc-900 rounded-2xl p-5 flex items-center justify-between hover:border-[#d9a425]/30 transition-all duration-300">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#d9a425]">Siswa Putri (P)</p>
            <p className="text-3xl font-black text-white">{stats.total_female}</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-zinc-900 flex items-center justify-center border border-zinc-800 shrink-0">
            <Users className="h-6 w-6 text-[#d9a425]" />
          </div>
        </div>

        {/* Card 4: Mutasi */}
        <div className="bg-[#18181b] border border-zinc-900 rounded-2xl p-5 flex items-center justify-between hover:border-[#d9a425]/30 transition-all duration-300">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#d9a425]">Siswa Mutasi</p>
            <p className="text-3xl font-black text-white">{stats.total_mutation}</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-zinc-900 flex items-center justify-center border border-zinc-800 shrink-0">
            <ArrowLeftRight className="h-6 w-6 text-[#d9a425]" />
          </div>
        </div>
      </div>

      {/* Hidden Form for triggering auto-import on file select */}
      {selectedFile && (
        <form onSubmit={handleImport} className="hidden">
          <button id="submit-import" type="submit">Submit</button>
        </form>
      )}

      {/* Status Tab Bar */}
      <div className="flex border-b border-zinc-200 gap-2">
        <button
          onClick={() => { setStatusTab('aktif'); setPage(1); }}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${statusTab === 'aktif' ? 'border-[#d9a425] text-zinc-900' : 'border-transparent text-zinc-500 hover:text-zinc-800'}`}
        >
          Siswa Aktif
        </button>
        <button
          onClick={() => { setStatusTab('mutasi'); setPage(1); }}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${statusTab === 'mutasi' ? 'border-[#d9a425] text-zinc-900' : 'border-transparent text-zinc-500 hover:text-zinc-800'}`}
        >
          Mutasi (Pindah)
        </button>
        <button
          onClick={() => { setStatusTab('lulus'); setPage(1); }}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${statusTab === 'lulus' ? 'border-[#d9a425] text-zinc-900' : 'border-transparent text-zinc-500 hover:text-zinc-800'}`}
        >
          Lulus
        </button>
      </div>

      {/* Notifications */}
      {message && (
        <div className={`flex items-center gap-3 rounded-xl border p-4 text-sm ${
          message.type === 'success' ? 'border-green-500/30 bg-green-500/10 text-green-700' : 'border-red-500/30 bg-red-500/10 text-red-700'
        }`}>
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{message.text}</span>
        </div>
      )}

      {/* Search bar */}
      <div className="relative max-w-md">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
          <Search className="h-5 w-5" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="block w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-10 pr-3 text-sm text-zinc-800 placeholder-zinc-400 outline-none focus:border-[#d9a425] focus:ring-1 focus:ring-[#d9a425]/20"
          placeholder="Cari siswa berdasarkan nama atau nomor induk..."
        />
      </div>

      {/* Table / Grid */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <RefreshCw className="h-8 w-8 animate-spin text-[#d9a425]" />
          </div>
        ) : students.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-zinc-400 space-y-4">
            <UserPlus className="h-12 w-12 text-zinc-300" />
            <div>
              <p className="font-semibold text-lg text-zinc-700">Belum Ada Data Siswa</p>
              <p className="text-sm mt-1">Cari keyword lain atau klik Tambah Siswa di atas.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-55 text-xs font-bold uppercase tracking-wider text-zinc-500">
                  <th className="px-6 py-4">Foto</th>
                  <th className="px-6 py-4">No. Induk</th>
                  <th className="px-6 py-4">Nama Lengkap</th>
                  <th className="px-6 py-4">Tanggal Lahir</th>
                  <th className="px-6 py-4">L/P</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-150">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="h-10 w-10 overflow-hidden rounded-full border border-zinc-200 bg-zinc-100 flex items-center justify-center">
                        {student.photo ? (
                          <img src={`http://${window.location.hostname}:8080/${student.photo}`} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs font-bold text-zinc-450 bg-zinc-200 uppercase">
                            {student.full_name.charAt(0)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-sm text-zinc-600">
                      {student.registration_number || '-'}
                    </td>
                    <td className="px-6 py-4 font-bold text-zinc-800">{student.full_name}</td>
                    <td className="px-6 py-4 text-sm text-zinc-600">
                      {new Date(student.birth_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-600">{student.gender}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleImpersonateParent(student.id, student.full_name)}
                          disabled={impersonatingId === student.id}
                          title="Login sebagai Wali Siswa"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 text-[11px] font-bold text-blue-700 transition-colors disabled:opacity-50"
                        >
                          {impersonatingId === student.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <LogIn className="h-3.5 w-3.5" />
                          )}
                          Masuk sbg Wali
                        </button>
                        <button
                          onClick={() => openEditModal(student)}
                          className="p-2 text-zinc-450 hover:text-[#d9a425] transition-colors"
                          title="Edit data siswa"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(student.id, student.full_name)}
                          className="p-2 text-zinc-450 hover:text-red-500 transition-colors"
                          title="Hapus siswa"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-zinc-200 pt-4">
          <span className="text-sm text-zinc-500">
            Halaman {page} dari {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="flex items-center gap-1 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-755 hover:bg-zinc-50 disabled:opacity-50 shadow-sm transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Sebelumnya
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="flex items-center gap-1 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-755 hover:bg-zinc-50 disabled:opacity-50 shadow-sm transition-colors"
            >
              Selanjutnya
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Student Form Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-150 bg-white p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-150 pb-3">
              <h3 className="text-lg font-bold text-zinc-900">
                {editingStudent ? 'Edit Profil Siswa' : 'Tambah Siswa Baru'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-zinc-650">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500">Nama Lengkap Siswa</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Masukkan nama lengkap siswa"
                  className="block w-full mt-1.5 rounded-xl border border-zinc-300 bg-white py-2.5 px-3.5 text-sm text-zinc-800 focus:border-[#d9a425] focus:ring-1 focus:ring-[#d9a425]/20 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500">Nomor Induk / NISN</label>
                  <input
                    type="text"
                    value={regNum}
                    onChange={(e) => setRegNum(e.target.value)}
                    placeholder="Contoh: NISN-9982"
                    className="block w-full mt-1.5 rounded-xl border border-zinc-300 bg-white py-2.5 px-3.5 text-sm text-zinc-800 focus:border-[#d9a425] focus:ring-1 focus:ring-[#d9a425]/20 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500">Tanggal Lahir</label>
                  <input
                    type="date"
                    required
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="block w-full mt-1.5 rounded-xl border border-zinc-300 bg-white py-2.5 px-3.5 text-sm text-zinc-800 focus:border-[#d9a425] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500">Jenis Kelamin</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="block w-full mt-1.5 rounded-xl border border-zinc-300 bg-white py-2.5 px-3.5 text-sm text-zinc-800 focus:border-[#d9a425] outline-none"
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500">Kelas Belajar</label>
                  <select
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    className="block w-full mt-1.5 rounded-xl border border-zinc-300 bg-white py-2.5 px-3.5 text-sm text-zinc-800 focus:border-[#d9a425] outline-none"
                  >
                    <option value="">-- Tanpa Kelas --</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} ({cls.age_group.replace('_', ' ')})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500">Status Keaktifan</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="block w-full mt-1.5 rounded-xl border border-zinc-300 bg-white py-2.5 px-3.5 text-sm text-zinc-800 focus:border-[#d9a425] outline-none"
                  >
                    <option value="aktif">Siswa Aktif</option>
                    <option value="mutasi">Mutasi (Pindah)</option>
                    <option value="lulus">Lulus</option>
                  </select>
                </div>
              </div>

              {/* Parent Login Account Section */}
              <div className="border-t border-zinc-150 pt-4 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#d9a425]">
                  Akun Login Wali Murid
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500">Email Login Wali</label>
                    <input
                      type="email"
                      value={parentEmail}
                      onChange={(e) => setParentEmail(e.target.value)}
                      placeholder="email.wali@domain.com"
                      className="block w-full mt-1.5 rounded-xl border border-zinc-300 bg-white py-2.5 px-3.5 text-sm text-zinc-800 focus:border-[#d9a425] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500">
                      {editingStudent ? 'Kata Sandi Baru (Opsional)' : 'Kata Sandi (Password)'}
                    </label>
                    <input
                      type="password"
                      value={parentPassword}
                      onChange={(e) => setParentPassword(e.target.value)}
                      placeholder={editingStudent ? 'Kosongkan jika tak diubah' : 'Min 8 karakter'}
                      className="block w-full mt-1.5 rounded-xl border border-zinc-300 bg-white py-2.5 px-3.5 text-sm text-zinc-800 focus:border-[#d9a425] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500">Nama Wali Murid</label>
                    <input
                      type="text"
                      value={parentName}
                      onChange={(e) => setParentName(e.target.value)}
                      placeholder="Nama orang tua / wali"
                      className="block w-full mt-1.5 rounded-xl border border-zinc-300 bg-white py-2.5 px-3.5 text-sm text-zinc-800 focus:border-[#d9a425] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500">No. WhatsApp / HP</label>
                    <input
                      type="text"
                      value={parentPhone}
                      onChange={(e) => setParentPhone(e.target.value)}
                      placeholder="Contoh: 0812345678"
                      className="block w-full mt-1.5 rounded-xl border border-zinc-300 bg-white py-2.5 px-3.5 text-sm text-zinc-800 focus:border-[#d9a425] outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500">Foto Profil Anak</label>
                <div className="relative mt-1.5">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                    className="peer absolute inset-0 h-full w-full opacity-0 cursor-pointer"
                  />
                  <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 hover:bg-zinc-100 flex items-center justify-center gap-2 py-2.5 text-xs text-zinc-500 font-semibold transition-all">
                    <Upload className="h-4 w-4 text-[#d9a425]" />
                    <span className="truncate max-w-[150px]">
                      {photoFile ? photoFile.name : 'Upload Foto'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-150">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-zinc-350 px-4 py-2.5 text-xs font-bold text-zinc-500 hover:bg-zinc-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-[#d9a425] hover:bg-[#e5c158] px-6 py-2.5 text-xs font-bold text-black flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={confirmDelete.open}
        title="Hapus Data Siswa?"
        message={<>Data siswa <span className="font-semibold text-zinc-800">{confirmDelete.name}</span> akan dihapus permanen.</>}
        confirmLabel="Ya, Hapus"
        loading={deleting}
        onConfirm={doDelete}
        onCancel={() => setConfirmDelete({ open: false, id: null, name: '' })}
      />

    </div>
  );
}
