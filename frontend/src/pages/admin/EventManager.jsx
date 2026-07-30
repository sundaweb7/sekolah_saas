import { useState, useEffect } from 'react';
import api from '../../config/axios';
import { 
  Calendar, Plus, Trash2, Edit, X, Loader2, RefreshCw
} from 'lucide-react';

export default function EventManager() {
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
  const [contentDate, setContentDate] = useState('');

  useEffect(() => {
    fetchContents();
  }, []);

  const fetchContents = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/admin/website/contents?type=event');
      setContents(response.data.data || response.data || []);
    } catch (err) {
      console.error(err);
      setError('Gagal memuat agenda kegiatan.');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingContent(null);
    setContentTitle('');
    setContentText('');
    setContentDate(new Date().toISOString().split('T')[0]);
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingContent(item);
    setContentTitle(item.title || '');
    setContentText(item.content || '');
    setContentDate(item.event_date || new Date().toISOString().split('T')[0]);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!contentTitle.trim()) return;

    setSubmitLoading(true);
    const formData = new FormData();
    formData.append('type', 'event');
    formData.append('title', contentTitle);
    formData.append('content', contentText);
    formData.append('event_date', contentDate);
    formData.append('status', 'published');

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
      alert('Gagal menyimpan agenda kegiatan.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus agenda kegiatan ini?')) return;
    try {
      await api.delete(`/admin/website/contents/delete/${id}`);
      fetchContents();
    } catch (err) {
      console.error(err);
      alert('Gagal menghapus agenda.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-zinc-200/85 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
            <Calendar className="h-7 w-7 text-[#d4af37]" />
            Agenda Kegiatan Sekolah
          </h1>
          <p className="text-xs text-zinc-550 mt-1.5 font-sans">
            Kelola agenda/kegiatan mendatang sekolah yang tampil di website publik.
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
            <Plus className="h-4 w-4" /> Tambah Agenda
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
          <p className="text-xs text-zinc-400 font-medium">Memuat agenda kegiatan...</p>
        </div>
      ) : contents.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-2xl p-12 text-center text-zinc-400 shadow-sm">
          <Calendar className="h-10 w-10 mx-auto text-zinc-350 mb-2" />
          <p className="text-xs font-medium">Belum ada agenda kegiatan.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {contents.map((item) => (
            <div key={item.id} className="rounded-2xl border border-zinc-200 bg-white p-5 flex justify-between items-center gap-6 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="space-y-1.5 min-w-0">
                <h4 className="font-bold text-sm text-zinc-900 truncate">{item.title}</h4>
                <p className="text-[10px] text-[#aa8410] font-extrabold uppercase tracking-wide flex items-center gap-1">
                  📅 {item.event_date ? new Date(item.event_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                </p>
                <p className="text-xs text-zinc-550 leading-relaxed font-sans">{item.content}</p>
              </div>

              <div className="flex gap-2 shrink-0 bg-zinc-50 border border-zinc-200 p-2 rounded-xl">
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
                {editingContent ? 'Edit Agenda Kegiatan' : 'Tambah Agenda Baru'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-zinc-450 hover:text-zinc-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block font-bold text-zinc-750">Judul Agenda</label>
                <input 
                  type="text" 
                  required
                  value={contentTitle}
                  onChange={(e) => setContentTitle(e.target.value)}
                  placeholder="Contoh: Rapat Wali Murid Akhir Semester"
                  className="block w-full rounded-xl border border-zinc-300 py-2.5 px-3.5 focus:border-[#d4af37] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-zinc-755">Tanggal Pelaksanaan</label>
                <input 
                  type="date" 
                  required
                  value={contentDate}
                  onChange={(e) => setContentDate(e.target.value)}
                  className="block w-full rounded-xl border border-zinc-300 py-2.5 px-3.5 focus:border-[#d4af37] outline-none text-zinc-750"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-zinc-755">Isi Deskripsi / Detail Kegiatan</label>
                <textarea 
                  rows="3"
                  value={contentText}
                  onChange={(e) => setContentText(e.target.value)}
                  placeholder="Masukkan detail informasi pelaksanaan agenda..."
                  className="block w-full rounded-xl border border-zinc-300 py-2.5 px-3.5 focus:border-[#d4af37] outline-none"
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
                  Simpan Agenda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
