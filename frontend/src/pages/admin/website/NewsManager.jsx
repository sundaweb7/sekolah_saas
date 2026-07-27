import { useState, useEffect, useCallback } from 'react';
import api from '../../../config/axios';
import { 
  Newspaper, Plus, Edit, Trash2, X, Upload, Loader2, AlertTriangle, Image as ImageIcon,
  Tag, FolderPlus, Save, RefreshCw
} from 'lucide-react';

function getBackendBase() {
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  const lastPart = parts[parts.length - 1];
  if (lastPart === 'localhost' || lastPart === '127' || parts.length === 1) {
    return 'http://localhost:8080';
  }
  const baseHost = parts.slice(-2).join('.');
  return `http://${baseHost}`;
}

const BACKEND_BASE = getBackendBase();

export default function NewsManager() {
  const [activeTab, setActiveTab] = useState('news'); // 'news' or 'categories'
  const [contents, setContents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingContent, setEditingContent] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states (News)
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState('published');
  const [imageFile, setImageFile] = useState(null);

  // Form states (Categories Management)
  const [categoryName, setCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [savingCategory, setSavingCategory] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await api.get('/admin/website/categories');
      setCategories(response.data || []);
    } catch (err) {
      console.error('Failed to load categories');
    }
  }, []);

  const fetchNews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/admin/website/contents?type=news');
      setContents(response.data.data || response.data || []);
    } catch (err) {
      setError('Gagal memuat berita sekolah.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNews();
    fetchCategories();
  }, [fetchNews, fetchCategories]);

  const openAddModal = () => {
    setEditingContent(null);
    setTitle('');
    setContent('');
    setCategoryId('');
    setStatus('published');
    setImageFile(null);
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingContent(item);
    setTitle(item.title);
    setContent(item.content || '');
    setCategoryId(item.category_id || '');
    setStatus(item.status || 'published');
    setImageFile(null);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Apakah Anda yakin ingin menghapus berita ini?')) return;
    try {
      await api.delete(`/admin/website/contents/delete/${id}`);
      fetchNews();
    } catch (err) {
      setError('Gagal menghapus berita.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.append('type', 'news');
    formData.append('title', title);
    formData.append('content', content);
    formData.append('category_id', categoryId);
    formData.append('status', status);
    
    if (imageFile) {
      formData.append('image_file', imageFile);
    }

    try {
      if (editingContent) {
        await api.post(`/admin/website/contents/update/${editingContent.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await api.post('/admin/website/contents', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      setShowModal(false);
      fetchNews();
    } catch (err) {
      setError('Gagal menyimpan berita.');
    } finally {
      setSubmitting(false);
    }
  };

  // Categories CRUD handlers
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!categoryName.trim()) return;
    setSavingCategory(true);
    try {
      if (editingCategory) {
        await api.post(`/admin/website/categories/update/${editingCategory.id}`, { name: categoryName });
      } else {
        await api.post('/admin/website/categories', { name: categoryName });
      }
      setCategoryName('');
      setEditingCategory(null);
      fetchCategories();
      fetchNews(); // Refresh news categories representation
    } catch (err) {
      alert('Gagal menyimpan kategori');
    } finally {
      setSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!confirm('Hapus kategori ini? Berita dalam kategori ini akan berubah status menjadi Tanpa Kategori.')) return;
    try {
      await api.delete(`/admin/website/categories/delete/${id}`);
      fetchCategories();
      fetchNews();
    } catch (err) {
      alert('Gagal menghapus kategori');
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <Newspaper className="h-8 w-8 text-[#d4af37]" /> Berita Sekolah
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Kelola pengumuman, kategori, dan artikel kegiatan sekolah di halaman beranda.
          </p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={() => setActiveTab(activeTab === 'news' ? 'categories' : 'news')}
            className={`rounded-xl border border-zinc-800 px-4 py-2.5 text-sm font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'categories' ? 'bg-[#d4af37] text-black border-transparent font-bold' : 'text-zinc-300 bg-zinc-900/40 hover:bg-zinc-850'
            }`}
          >
            <Tag className="h-4 w-4" /> Kelola Kategori
          </button>
          
          {activeTab === 'news' && (
            <button 
              onClick={openAddModal}
              className="rounded-xl bg-[#d4af37] hover:bg-[#f3cb65] px-4 py-2.5 text-sm font-bold text-black flex items-center gap-2 transition-colors"
            >
              <Plus className="h-5 w-5" /> Tulis Berita Baru
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tab Contents: Categories Management */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Category Input Form */}
          <div className="bg-zinc-950/20 border border-zinc-850 rounded-2xl p-6 h-fit space-y-4">
            <h3 className="text-md font-bold text-white flex items-center gap-2">
              <FolderPlus className="h-5 w-5 text-[#d4af37]" />
              {editingCategory ? 'Edit Kategori' : 'Kategori Baru'}
            </h3>
            <form onSubmit={handleSaveCategory} className="space-y-3">
              <input
                type="text"
                required
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="Nama kategori, contoh: Pengumuman"
                className="block w-full rounded-xl border border-zinc-850 bg-zinc-900 py-2.5 px-3.5 text-sm text-white focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/20 outline-none"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={savingCategory}
                  className="flex-1 rounded-xl bg-[#d4af37] hover:bg-[#f3cb65] py-2 text-xs font-bold text-black flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  {savingCategory ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Simpan Kategori
                </button>
                {editingCategory && (
                  <button
                    type="button"
                    onClick={() => { setEditingCategory(null); setCategoryName(''); }}
                    className="rounded-xl border border-zinc-800 px-3 py-2 text-xs font-bold text-zinc-400 hover:text-white"
                  >
                    Batal
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Categories List */}
          <div className="md:col-span-2 overflow-hidden rounded-2xl border border-zinc-850 bg-zinc-900/30">
            {categories.length === 0 ? (
              <div className="text-center py-12 text-zinc-500 text-sm">Belum ada kategori yang dibuat.</div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-900 bg-zinc-950/30 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    <th className="px-6 py-4">Nama Kategori</th>
                    <th className="px-6 py-4">Slug URL</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-zinc-800/10 transition-colors">
                      <td className="px-6 py-4 text-sm font-semibold text-white">{cat.name}</td>
                      <td className="px-6 py-4 text-xs font-mono text-zinc-500">{cat.slug}</td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => { setEditingCategory(cat); setCategoryName(cat.name); }}
                          className="p-2 text-zinc-400 hover:text-[#d4af37] transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="p-2 text-zinc-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Tab Contents: List/Table View of News */}
      {activeTab === 'news' && (
        <div className="overflow-hidden rounded-2xl border border-zinc-850 bg-zinc-900/30">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-[#d4af37]" />
            </div>
          ) : contents.length === 0 ? (
            <div className="text-center py-20 text-zinc-500 text-sm space-y-2">
              <Newspaper className="h-12 w-12 mx-auto text-zinc-700" />
              <p>Belum ada berita yang ditambahkan.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-900 bg-zinc-950/30 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    <th className="px-6 py-4 w-24">Thumbnail</th>
                    <th className="px-6 py-4">Judul Berita</th>
                    <th className="px-6 py-4">Kategori</th>
                    <th className="px-6 py-4">Tanggal Post</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {contents.map((item) => (
                    <tr key={item.id} className="hover:bg-zinc-800/10 transition-colors">
                      <td className="px-6 py-4">
                        <div className="h-12 w-16 overflow-hidden rounded-lg bg-zinc-950 flex items-center justify-center border border-zinc-800">
                          {item.image ? (
                            <img 
                              src={`${BACKEND_BASE}/${item.image}`} 
                              alt={item.title} 
                              className="h-full w-full object-cover" 
                            />
                          ) : (
                            <ImageIcon className="h-5 w-5 text-zinc-700" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-white text-sm line-clamp-1">{item.title}</p>
                        <p className="text-xs text-zinc-500 line-clamp-1 mt-0.5">{item.content}</p>
                      </td>
                      <td className="px-6 py-4">
                        {item.category_name ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/20 uppercase tracking-wider">
                            {item.category_name}
                          </span>
                        ) : (
                          <span className="text-zinc-650 text-xs font-medium italic">Tidak ada kategori</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-zinc-400">
                        {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          item.status === 'published' 
                            ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                            : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                        }`}>
                          {item.status === 'published' ? 'Terbit' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button 
                          onClick={() => openEditModal(item)}
                          className="rounded bg-zinc-850 hover:bg-zinc-800 text-zinc-300 p-2 border border-zinc-800 transition-colors"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="rounded bg-red-950/10 hover:bg-red-950/30 text-red-400 p-2 border border-zinc-800 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Editor Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-2xl border border-zinc-850 bg-zinc-950 p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <h3 className="text-lg font-bold text-white">
                {editingContent ? 'Edit Berita Sekolah' : 'Tulis Berita Baru'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">Judul Berita</label>
                <input 
                  type="text" 
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Masukkan judul artikel"
                  className="block w-full mt-1.5 rounded-xl border border-zinc-850 bg-zinc-900 py-2.5 px-3.5 text-sm text-white focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/20 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">Kategori Berita</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="block w-full mt-1.5 rounded-xl border border-zinc-850 bg-zinc-900 py-2.5 px-3.5 text-sm text-white focus:border-[#d4af37] outline-none"
                  >
                    <option value="">Pilih Kategori (Opsional)</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">Status</label>
                  <select 
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="block w-full mt-1.5 rounded-xl border border-zinc-850 bg-zinc-900 py-2.5 px-3.5 text-sm text-white focus:border-[#d4af37] outline-none"
                  >
                    <option value="published">Terbit (Public)</option>
                    <option value="draft">Draft (Arsip)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">Isi Konten Berita</label>
                <textarea 
                  required
                  rows="6"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Tulis artikel berita secara detail di sini..."
                  className="block w-full mt-1.5 rounded-xl border border-zinc-850 bg-zinc-900 py-2.5 px-3.5 text-sm text-white focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/20 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">Foto Ilustrasi</label>
                <div className="relative mt-1.5">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    className="peer absolute inset-0 h-full w-full opacity-0 cursor-pointer"
                  />
                  <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900 flex items-center justify-center gap-2 py-2.5 text-xs text-zinc-400 font-semibold transition-all">
                    <Upload className="h-4 w-4 text-[#d4af37]" /> 
                    <span className="truncate max-w-[200px]">
                      {imageFile ? imageFile.name : 'Upload Foto Baru'}
                    </span>
                  </div>
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
                  Simpan Berita
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
