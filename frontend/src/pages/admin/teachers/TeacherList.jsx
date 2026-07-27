import { useState, useEffect } from 'react';
import api from '../../../config/axios';
import ConfirmModal from '../../../components/ConfirmModal';
import { 
  Plus, Search, Trash2, Edit2, ChevronLeft, ChevronRight, 
  Users, AlertCircle, RefreshCw, X, Loader2, Award, Phone, Mail, FileKey, Upload, LogIn
} from 'lucide-react';

export default function TeacherList() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [message, setMessage] = useState(null);

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null, name: '' });
  const [deleting, setDeleting] = useState(false);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [selectedRoles, setSelectedRoles] = useState(['guru_kelas']);
  const [position, setPosition] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nuptk, setNuptk] = useState('');
  const [phone, setPhone] = useState('');
  const [photoFile, setPhotoFile] = useState(null);

  // Teacher role options
  const TEACHER_ROLES = [
    { key: 'guru_kelas',  label: 'Guru Kelas',           desc: 'Mengajar semua mapel di satu kelas (umum untuk TK/PAUD)',  color: 'bg-sky-50 text-sky-700 border-sky-200' },
    { key: 'guru_mapel', label: 'Guru Mata Pelajaran',   desc: 'Mengajar satu mata pelajaran tertentu lintas kelas',        color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    { key: 'wali_kelas', label: 'Wali Kelas',            desc: 'Penanggung jawab administrasi dan pembinaan satu kelas',   color: 'bg-amber-50 text-amber-700 border-amber-200' },
  ];

  const getRoleBadges = (roles) => {
    const roleList = Array.isArray(roles) ? roles : (typeof roles === 'string' ? JSON.parse(roles || '[]') : []);
    return roleList.map(key => TEACHER_ROLES.find(r => r.key === key)).filter(Boolean);
  };

  const toggleRole = (key) => {
    setSelectedRoles(prev =>
      prev.includes(key) ? prev.filter(r => r !== key) : [...prev, key]
    );
  };

  const [impersonatingId, setImpersonatingId] = useState(null);

  const handleImpersonate = async (teacherId) => {
    setImpersonatingId(teacherId);
    try {
      const res = await api.post(`/admin/teachers/impersonate/${teacherId}`);
      const { access_token, refresh_token, user } = res.data;
      const protocol = window.location.protocol;
      const host = window.location.host;
      const redirectUrl = `${protocol}//${host}/login?sso_token=${access_token}&sso_refresh_token=${refresh_token}&sso_school_id=${user.school_id}&sso_role=${user.role}`;
      window.open(redirectUrl, '_blank');
    } catch (err) {
      alert(err.message || 'Gagal masuk sebagai guru.');
    } finally {
      setImpersonatingId(null);
    }
  };

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/teachers', {
        params: {
          page: page,
          per_page: 10,
          q: searchQuery
        }
      });
      setTeachers(response.data || []);
      const pager = response.pagination;
      if (pager) {
        setTotalPages(pager.pageCount || 1);
      }
    } catch (error) {
      console.error('Failed to fetch teachers', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, [page, searchQuery]);

  const handleDelete = (id, name) => {
    setConfirmDelete({ open: true, id, name });
  };

  const doDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/admin/teachers/${confirmDelete.id}`);
      setConfirmDelete({ open: false, id: null, name: '' });
      fetchTeachers();
      setMessage({ type: 'success', text: 'Data guru berhasil dihapus.' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Gagal menghapus data guru.' });
    } finally {
      setDeleting(false);
    }
  };

  const openAddModal = () => {
    setEditingTeacher(null);
    setFullName('');
    setSelectedRoles(['guru_kelas']);
    setPosition('');
    setEmail('');
    setPassword('');
    setNuptk('');
    setPhone('');
    setPhotoFile(null);
    setShowModal(true);
  };

  const openEditModal = (t) => {
    setEditingTeacher(t);
    setFullName(t.full_name);
    const existingRoles = Array.isArray(t.roles) ? t.roles : (t.roles ? JSON.parse(t.roles) : ['guru_kelas']);
    setSelectedRoles(existingRoles.length > 0 ? existingRoles : ['guru_kelas']);
    setPosition(t.position || '');
    setEmail(t.email || '');
    setPassword('');
    setNuptk(t.nuptk || '');
    setPhone(t.phone || '');
    setPhotoFile(null);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    const formData = new FormData();
    formData.append('full_name', fullName);
    formData.append('roles', JSON.stringify(selectedRoles.length > 0 ? selectedRoles : ['guru_kelas']));
    if (position) formData.append('position', position);
    formData.append('email', email);
    if (password) formData.append('password', password);
    if (nuptk) formData.append('nuptk', nuptk);
    if (phone) formData.append('phone', phone);
    if (photoFile) formData.append('photo_file', photoFile);

    try {
      if (editingTeacher) {
        await api.post(`/admin/teachers/update/${editingTeacher.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setMessage({ type: 'success', text: 'Data guru berhasil diperbarui!' });
      } else {
        await api.post('/admin/teachers', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setMessage({ type: 'success', text: 'Guru baru berhasil ditambahkan!' });
      }
      setShowModal(false);
      fetchTeachers();
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Gagal menyimpan data guru.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
            <Award className="h-8 w-8 text-[#d4af37]" /> Manajemen Guru / Pendidik
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Kelola profil pendidik, data NUPTK, nomor telepon, dan buatkan akun login untuk Guru.
          </p>
        </div>
        <button 
          onClick={openAddModal}
          className="rounded-xl bg-[#d4af37] hover:bg-[#f3cb65] px-4 py-2.5 text-sm font-bold text-black flex items-center gap-2 transition-colors self-start sm:self-auto shadow-sm"
        >
          <Plus className="h-5 w-5" /> Tambah Guru Baru
        </button>
      </div>

      {message && (
        <div className={`flex items-center gap-3 rounded-xl border p-4 text-sm ${
          message.type === 'success' ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'
        }`}>
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{message.text}</span>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
          <Search className="h-5 w-5" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="block w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-10 pr-3 text-sm text-zinc-800 placeholder-zinc-400 outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/20 transition-all"
          placeholder="Cari guru berdasarkan nama atau NUPTK..."
        />
      </div>

      {/* Table grid */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <RefreshCw className="h-8 w-8 animate-spin text-[#d4af37]" />
          </div>
        ) : teachers.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-zinc-500 space-y-4">
            <Award className="h-12 w-12 text-zinc-300" />
            <div>
              <p className="font-semibold text-lg text-zinc-800">Belum Ada Data Guru</p>
              <p className="text-sm mt-1 text-zinc-500">Silakan klik Tambah Guru Baru untuk mendaftarkan pendidik pertama.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50 text-[10px] font-bold uppercase tracking-wider text-zinc-450">
                  <th className="px-6 py-4">Foto</th>
                  <th className="px-6 py-4">Nama Lengkap</th>
                  <th className="px-6 py-4">Jenis Guru</th>
                  <th className="px-6 py-4">NUPTK</th>
                  <th className="px-6 py-4">Kontak / Email</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-xs">
                {teachers.map((t) => (
                  <tr key={t.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="h-10 w-10 overflow-hidden rounded-full border border-zinc-200 bg-zinc-100">
                        {t.photo ? (
                          <img src={`http://${window.location.hostname}:8080/${t.photo}`} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs font-bold text-zinc-500 bg-zinc-100 uppercase">
                            {t.full_name.charAt(0)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-zinc-900">{t.full_name}</p>
                      {t.position && <p className="text-[10px] text-zinc-400 mt-0.5">{t.position}</p>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {getRoleBadges(t.roles).length > 0 ? (
                          getRoleBadges(t.roles).map(role => (
                            <span key={role.key} className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border whitespace-nowrap ${role.color}`}>
                              {role.label}
                            </span>
                          ))
                        ) : (
                          <span className="text-zinc-400 text-[10px]">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-zinc-600">{t.nuptk || '-'}</td>
                    <td className="px-6 py-4 text-zinc-600 space-y-1">
                      <div className="flex items-center gap-1.5"><Phone className="h-3 w-3 text-[#d4af37]" /> {t.phone || '-'}</div>
                      <div className="flex items-center gap-1.5"><Mail className="h-3 w-3 text-zinc-400" /> {t.email || '-'}</div>
                    </td>
                    <td className="px-6 py-4 text-right space-x-1 whitespace-nowrap">
                      <button 
                        disabled={impersonatingId !== null}
                        onClick={() => handleImpersonate(t.id)}
                        className="p-2 text-zinc-400 hover:text-green-600 transition-colors inline-flex items-center"
                        title="Login sebagai Guru"
                      >
                        {impersonatingId === t.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <LogIn className="h-4 w-4" />
                        )}
                      </button>
                      <button 
                        onClick={() => openEditModal(t)}
                        className="p-2 text-zinc-400 hover:text-[#d4af37] transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(t.id, t.full_name)}
                        className="p-2 text-zinc-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
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

      {/* Teacher Form Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="text-base font-bold text-zinc-900">
                {editingTeacher ? 'Edit Profil Guru' : 'Daftarkan Guru Baru'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-zinc-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nama Lengkap */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500">Nama Lengkap Guru</label>
                <input 
                  type="text" 
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Masukkan nama lengkap beserta gelar"
                  className="block w-full mt-1.5 rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 px-3.5 text-sm text-zinc-900 focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/20 outline-none"
                />
              </div>

              {/* Jenis / Role Guru - Multi Checklist */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Jenis Peran Guru <span className="text-zinc-400 font-normal lowercase normal-case">(pilih satu atau lebih)</span></label>
                <div className="space-y-2">
                  {TEACHER_ROLES.map(role => (
                    <label
                      key={role.key}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        selectedRoles.includes(role.key)
                          ? 'border-[#d4af37] bg-[#d4af37]/5'
                          : 'border-zinc-200 bg-zinc-50 hover:border-zinc-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedRoles.includes(role.key)}
                        onChange={() => toggleRole(role.key)}
                        className="mt-0.5 h-4 w-4 accent-[#d4af37] shrink-0"
                      />
                      <div>
                        <p className="text-xs font-bold text-zinc-800">{role.label}</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5 font-light">{role.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Bidang Studi / Keterangan Tambahan */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500">Bidang Studi / Keterangan Tambahan <span className="text-zinc-400 font-normal normal-case">(opsional)</span></label>
                <input
                  type="text"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="Contoh: Guru Matematika & IPA, Pembina Pramuka"
                  className="block w-full mt-1.5 rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 px-3.5 text-sm text-zinc-900 focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/20 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500">Email (Untuk Login)</label>
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@sekolah.sch.id"
                    className="block w-full mt-1.5 rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 px-3.5 text-sm text-zinc-900 focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/20 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500">
                    {editingTeacher ? 'Password Baru (Kosongkan jika tak diubah)' : 'Kata Sandi'}
                  </label>
                  <input 
                    type="password" 
                    required={!editingTeacher}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={editingTeacher ? '••••••••' : 'Masukkan password login'}
                    className="block w-full mt-1.5 rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 px-3.5 text-sm text-zinc-900 focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/20 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500">NUPTK / No. Registrasi</label>
                  <input 
                    type="text" 
                    value={nuptk}
                    onChange={(e) => setNuptk(e.target.value)}
                    placeholder="Contoh: 1234567890"
                    className="block w-full mt-1.5 rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 px-3.5 text-sm text-zinc-900 focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/20 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500">Nomor HP / WhatsApp</label>
                  <input 
                    type="text" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Contoh: 0812345678"
                    className="block w-full mt-1.5 rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 px-3.5 text-sm text-zinc-900 focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/20 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500">Foto Profil Pendidik</label>
                <div className="relative mt-1.5">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                    className="peer absolute inset-0 h-full w-full opacity-0 cursor-pointer"
                  />
                  <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 hover:bg-zinc-100 flex items-center justify-center gap-2 py-2.5 text-xs text-zinc-500 font-semibold transition-all">
                    <Upload className="h-4 w-4 text-[#d4af37]" /> 
                    <span className="truncate max-w-[250px]">
                      {photoFile ? photoFile.name : 'Upload Foto Profil Guru'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 px-4 py-2.5 text-xs font-bold text-zinc-700 transition-all"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={submitting || selectedRoles.length === 0}
                  className="rounded-xl bg-[#d4af37] hover:bg-[#f3cb65] px-6 py-2.5 text-xs font-bold text-black flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Simpan Guru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={confirmDelete.open}
        title="Hapus Data Guru?"
        message={<>Data guru <span className="font-semibold text-zinc-800">{confirmDelete.name}</span> dan akun login terkait akan dihapus permanen.</>}
        confirmLabel="Ya, Hapus"
        loading={deleting}
        onConfirm={doDelete}
        onCancel={() => setConfirmDelete({ open: false, id: null, name: '' })}
      />

    </div>
  );
}
