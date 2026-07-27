import { useState, useEffect } from 'react';
import api from '../../../config/axios';
import { 
  Plus, Search, Trash2, Edit2, ChevronLeft, ChevronRight, 
  Users, AlertCircle, RefreshCw, X, Loader2, Key, UserCheck, ShieldAlert
} from 'lucide-react';

export default function UserManager() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState(null);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('parent');
  const [status, setStatus] = useState('active');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data || []);
    } catch (error) {
      console.error('Failed to fetch users', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Apakah Anda yakin ingin menghapus user ini?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      fetchUsers();
      setMessage({ type: 'success', text: 'User berhasil dihapus.' });
    } catch (error) {
      alert('Gagal menghapus user.');
    }
  };

  const openAddModal = () => {
    setEditingUser(null);
    setFullName('');
    setEmail('');
    setPassword('');
    setRole('parent');
    setStatus('active');
    setShowModal(true);
  };

  const openEditModal = (u) => {
    setEditingUser(u);
    setFullName(u.full_name);
    setEmail(u.email);
    setPassword(''); // leave blank if no change
    setRole(u.role);
    setStatus(u.status);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    const payload = {
      full_name: fullName,
      email: email,
      role: role,
      status: status
    };

    if (password) {
      payload.password = password;
    }

    try {
      if (editingUser) {
        await api.post(`/admin/users/update/${editingUser.id}`, payload);
        setMessage({ type: 'success', text: 'User berhasil diperbarui!' });
      } else {
        await api.post('/admin/users', payload);
        setMessage({ type: 'success', text: 'User baru berhasil dibuat!' });
      }
      setShowModal(false);
      fetchUsers();
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Gagal menyimpan user.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Filter users by search query
  const filteredUsers = users.filter(u => 
    u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <Users className="h-8 w-8 text-[#d4af37]" /> Manajemen Akun / User
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Kelola data autentikasi login untuk Admin, Guru Pendidik, dan Wali Murid.
          </p>
        </div>
        <button 
          onClick={openAddModal}
          className="rounded-xl bg-[#d4af37] hover:bg-[#f3cb65] px-4 py-2.5 text-sm font-bold text-black flex items-center gap-2 transition-colors self-start sm:self-auto"
        >
          <Plus className="h-5 w-5" /> Daftarkan User Baru
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
          placeholder="Cari user berdasarkan nama, email, atau role..."
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-zinc-850 bg-zinc-900/30 backdrop-blur-md">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <RefreshCw className="h-8 w-8 animate-spin text-[#d4af37]" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-zinc-500 space-y-4">
            <Users className="h-12 w-12 text-zinc-700" />
            <div>
              <p className="font-semibold text-lg text-white">Belum Ada Akun Terdaftar</p>
              <p className="text-sm mt-1">Cari kata kunci lain atau daftarkan user baru.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-900 bg-zinc-950/30 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Nama Lengkap</th>
                  <th className="px-6 py-4">Alamat Email</th>
                  <th className="px-6 py-4">Hak Akses / Role</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-zinc-800/10 transition-colors">
                    <td className="px-6 py-4 font-mono text-sm text-zinc-400">#{u.id}</td>
                    <td className="px-6 py-4 font-medium text-white">{u.full_name}</td>
                    <td className="px-6 py-4 text-sm text-zinc-300">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full ${
                        u.role === 'admin' ? 'bg-red-500/10 text-red-400' :
                        u.role === 'teacher' ? 'bg-blue-500/10 text-blue-400' :
                        'bg-[#d4af37]/10 text-[#d4af37]'
                      }`}>
                        {u.role === 'parent' ? 'wali murid' : u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${u.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-zinc-800 text-zinc-500'}`}>
                        {u.status === 'active' ? 'Aktif' : 'Non-aktif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button 
                        onClick={() => openEditModal(u)}
                        className="p-2 text-zinc-400 hover:text-[#d4af37] transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(u.id)}
                        className="p-2 text-zinc-400 hover:text-red-400 transition-colors"
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

      {/* User Form Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-850 bg-zinc-950 p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <h3 className="text-lg font-bold text-white">
                {editingUser ? 'Edit Akun User' : 'Daftarkan User Baru'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">Nama Lengkap</label>
                <input 
                  type="text" 
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Masukkan nama pemilik akun"
                  className="block w-full mt-1.5 rounded-xl border border-zinc-850 bg-zinc-900 py-2.5 px-3.5 text-sm text-white focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/20 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">Alamat Email</label>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="block w-full mt-1.5 rounded-xl border border-zinc-850 bg-zinc-900 py-2.5 px-3.5 text-sm text-white focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/20 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                  {editingUser ? 'Password Baru (Kosongkan jika tak diubah)' : 'Kata Sandi (Password)'}
                </label>
                <input 
                  type="password" 
                  required={!editingUser}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={editingUser ? '••••••••' : 'Masukkan password login'}
                  className="block w-full mt-1.5 rounded-xl border border-zinc-850 bg-zinc-900 py-2.5 px-3.5 text-sm text-white focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/20 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">Hak Akses / Role</label>
                  <select 
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="block w-full mt-1.5 rounded-xl border border-zinc-850 bg-zinc-900 py-2.5 px-3.5 text-sm text-white focus:border-[#d4af37] outline-none"
                  >
                    <option value="parent">Wali Murid</option>
                    <option value="teacher">Guru Pendidik</option>
                    <option value="admin">Administrator Sekolah</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">Status Akun</label>
                  <select 
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="block w-full mt-1.5 rounded-xl border border-zinc-850 bg-zinc-900 py-2.5 px-3.5 text-sm text-white focus:border-[#d4af37] outline-none"
                  >
                    <option value="active">Aktif</option>
                    <option value="inactive">Non-aktif</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-900">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-zinc-800 px-4 py-2.5 text-xs font-bold text-zinc-400 hover:text-white"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-[#d4af37] hover:bg-[#f3cb65] px-6 py-2.5 text-xs font-bold text-black flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Simpan User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
