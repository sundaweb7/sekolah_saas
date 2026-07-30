import { useState, useEffect } from 'react';
import api from '../../config/axios';
import { 
  Image as ImageIcon, Plus, Trash2, Edit, X, Loader2, RefreshCw
} from 'lucide-react';

export default function GalleryManager() {
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingContent, setEditingContent] = useState(null);

  // Form states
  const [contentTitle, setContentTitle] = useState('');
  const [contentText, setContentText] = useState('');
  const [contentFile, setContentFile] = useState(null);

  useEffect(() => {
    fetchContents();
  }, []);

  const fetchContents = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/admin/website/contents?type=gallery');
      setContents(response.data.data || response.data || []);
    } catch (err) {
      console.error(err);
      setError('Gagal memuat galeri foto.');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingContent(null);
    setContentTitle('');
    setContentText('');
    setContentFile(null);
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingContent(item);
    setContentTitle(item.title || '');
    setContentText(item.content || '');
    setContentFile(null);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!contentTitle.trim()) return;

    setSubmitLoading(true);
    const formData = new FormData();
    formData.append('type', 'gallery');
    formData.append('title', contentTitle);
    formData.append('content', contentText);
    formData.append('status', 'published');

    if (contentFile) {
      formData.append('image_file', contentFile);
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
      fetchContents();
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan foto galeri.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus foto galeri ini?')) return;
    try {
      await api.delete(`/admin/website/contents/delete/${id}`);
      fetchContents();
    } catch (err) {
      console.error(err);
      alert('Gagal menghapus foto.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-zinc-200/85 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
            <ImageIcon className="h-7 w-7 text-[#d4af37]" />
            Galeri Foto Kegiatan
          </h1>
          <p className="text-xs text-zinc-550 mt-1.5 font-sans">
            Kelola dokumentasi foto kegiatan sekolah yang tampil di galeri website publik.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchContents}
            className="p-3 border border-zinc-200 hover:bg-zinc-50 rounded-xl transition-all shadow-sm"
          >
            <RefreshCw className="h-4.5 w-4.5 text-zinc-650" />
          </button>
          <button
            onClick={openAddModal}
            className="rounded-xl bg-[#d4af37] hover:bg-[#f3cb65] text-black px-4 py-2.5 text-xs font-extrabold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" /> Tambah Foto
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-750 p-4 rounded-xl flex items-center gap-2 text-xs font-semibold">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-8 w-8 text-[#d4af37] animate-spin" />
          <p className="text-xs text-zinc-400 font-medium">Memuat galeri foto...</p>
        </div>
      ) : contents.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-2xl p-12 text-center text-zinc-400 shadow-sm">
          <ImageIcon className="h-10 w-10 mx-auto text-zinc-350 mb-2" />
          <p className="text-xs font-medium">Belum ada foto galeri kegiatan.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {contents.map((item) => (
            <div key={item.id} className="rounded-2xl border border-zinc-200 bg-white overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-300">
              <div>
                {item.image && (
                  <img 
                    src={`http://${window.location.hostname}:8080/${item.image}`} 
                    alt={item.title} 
                    className="h-44 w-full object-cover border-b border-zinc-150" 
                  />
                )}
                <div className="p-4 space-y-1">
                  <h4 className="font-bold text-sm text-zinc-900">{item.title}</h4>
                  <p className="text-xs text-zinc-550 line-clamp-2 leading-relaxed">{item.content}</p>
                </div>
              </div>

              <div className="p-4 border-t border-zinc-100 flex justify-end gap-2 bg-zinc-50/50">
                <button 
                  onClick={() => openEditModal(item)}
                  className="p-1.5 text-zinc-450 hover:text-[#d4af37] transition-colors"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => handleDelete(item.id)}
                  className="p-1.5 text-zinc-450 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FORM MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl space-y-5 text-xs text-zinc-800">
            <div className="flex items-center justify-between border-b border-zinc-150 pb-3">
              <h3 className="text-sm font-bold text-zinc-900">
                {editingContent ? 'Edit Foto Galeri' : 'Tambah Foto Galeri Baru'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-zinc-450 hover:text-zinc-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block font-bold text-zinc-750">Judul Kegiatan</label>
                <input 
                  type="text" 
                  required
                  value={contentTitle}
                  onChange={(e) => setContentTitle(e.target.value)}
                  placeholder="Contoh: Upacara Hari Kemerdekaan"
                  className="block w-full rounded-xl border border-zinc-300 py-2.5 px-3.5 focus:border-[#d4af37] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-zinc-755">Keterangan / Deskripsi</label>
                <textarea 
                  rows="3"
                  value={contentText}
                  onChange={(e) => setContentText(e.target.value)}
                  placeholder="Keterangan singkat pelaksanaan kegiatan..."
                  className="block w-full rounded-xl border border-zinc-300 py-2.5 px-3.5 focus:border-[#d4af37] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-zinc-755">Upload Berkas Foto</label>
                <input 
                  type="file" 
                  accept="image/*"
                  required={!editingContent}
                  onChange={(e) => setContentFile(e.target.files?.[0] || null)}
                  className="block w-full text-xs text-zinc-500 mt-1"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-150">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-zinc-300 px-4 py-2.5 font-bold text-zinc-550 hover:text-zinc-800"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={submitLoading}
                  className="rounded-xl bg-[#d4af37] hover:bg-[#f3cb65] px-6 py-2.5 font-bold text-black flex items-center gap-1 shadow-sm"
                >
                  {submitLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Simpan Foto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
