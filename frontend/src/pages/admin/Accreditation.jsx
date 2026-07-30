import { useState, useEffect } from 'react';
import api from '../../config/axios';
import { 
  Plus, Trash2, Edit, Eye, Download, ExternalLink, FileText, 
  ChevronDown, ChevronUp, AlertCircle, Loader2, Search, CheckCircle2, FileCheck
} from 'lucide-react';

const DEFAULT_TOPICS = {
  "Kepemimpinan Kepala Sekolah dalam Pengelolaan": [
    "RKJM (Rencana Kerja Jangka Menengah)",
    "RKT (Rencana Kerja Tahunan)",
    "RKAS (Rencana Kegiatan dan Anggaran Sekolah)",
    "Program supervisi",
    "Notulen rapat",
    "Evaluasi program"
  ],
  "Standar Isi & Kurikulum": [
    "Dokumen KTSP / KOSP",
    "Kalender Akademik",
    "Program Tahunan & Semesteran",
    "Silabus & RPP / Modul Ajar"
  ],
  "Standar Pendidik & Tenaga Kependidikan": [
    "SK Pembagian Tugas Mengajar",
    "Ijazah & Sertifikat Pendidik Guru",
    "Daftar Riwayat Hidup Guru",
    "Penilaian Kinerja Guru (PKG)"
  ],
  "Standar Sarana & Prasarana": [
    "Buku Inventaris Barang",
    "Bukti Kepemilikan Lahan/Gedung",
    "Dokumentasi Sarana Bermain & Belajar",
    "Rencana Perawatan Sarana"
  ]
};

export default function Accreditation() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  
  // Accordion state for Topics
  const [expandedTopics, setExpandedTopics] = useState({});
  const [expandedSubTopics, setExpandedSubTopics] = useState({});

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingFile, setEditingFile] = useState(null);
  
  // Form State
  const [topicInput, setTopicInput] = useState('');
  const [subTopicInput, setSubTopicInput] = useState('');
  const [fileNameInput, setFileNameInput] = useState('');
  const [fileLinkInput, setFileLinkInput] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  // Load files on mount
  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/admin/acreditation');
      setFiles(response.data || []);
      
      // Auto expand first topic if exists
      if (response.data && response.data.length > 0) {
        setExpandedTopics({ [response.data[0].topic]: true });
        setExpandedSubTopics({ [`${response.data[0].topic}-${response.data[0].sub_topic}`]: true });
      }
    } catch (err) {
      console.error(err);
      setError('Gagal memuat daftar berkas akreditasi. Silakan coba kembali.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingFile(null);
    setTopicInput('Kepemimpinan Kepala Sekolah dalam Pengelolaan');
    setSubTopicInput('RKJM (Rencana Kerja Jangka Menengah)');
    setFileNameInput('');
    setFileLinkInput('');
    setFormError(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (file) => {
    setEditingFile(file);
    setTopicInput(file.topic);
    setSubTopicInput(file.sub_topic);
    setFileNameInput(file.file_name);
    setFileLinkInput(file.file_link);
    setFormError(null);
    setShowModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    
    if (!topicInput.trim() || !subTopicInput.trim() || !fileNameInput.trim() || !fileLinkInput.trim()) {
      setFormError('Semua field wajib diisi.');
      return;
    }

    if (!fileLinkInput.startsWith('http://') && !fileLinkInput.startsWith('https://')) {
      setFormError('Link berkas harus diawali dengan http:// atau https:// (contoh: link Google Drive)');
      return;
    }

    setSubmitLoading(true);
    try {
      await api.post('/admin/acreditation/save', {
        id: editingFile ? editingFile.id : undefined,
        topic: topicInput.trim(),
        sub_topic: subTopicInput.trim(),
        file_name: fileNameInput.trim(),
        file_link: fileLinkInput.trim()
      });

      setSuccessMsg(editingFile ? 'Berkas berhasil diperbarui!' : 'Berkas akreditasi baru berhasil ditambahkan!');
      setTimeout(() => setSuccessMsg(null), 3500);
      
      setShowModal(false);
      fetchFiles();
    } catch (err) {
      console.error(err);
      setFormError(err.response?.data?.message || 'Gagal menyimpan berkas. Silakan cek kembali inputan Anda.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteFile = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus berkas akreditasi ini dari daftar?')) return;
    
    try {
      await api.delete(`/admin/acreditation/delete/${id}`);
      setSuccessMsg('Berkas akreditasi berhasil dihapus.');
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchFiles();
    } catch (err) {
      console.error(err);
      alert('Gagal menghapus berkas akreditasi. Coba lagi.');
    }
  };

  const toggleTopic = (topic) => {
    setExpandedTopics(prev => ({
      ...prev,
      [topic]: !prev[topic]
    }));
  };

  const toggleSubTopic = (topic, subTopic) => {
    const key = `${topic}-${subTopic}`;
    setExpandedSubTopics(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Group files by Topic -> Sub Topic
  const groupedData = {};
  
  // Seed with default topics structure so users see the accreditation framework
  Object.keys(DEFAULT_TOPICS).forEach(topic => {
    groupedData[topic] = {};
    DEFAULT_TOPICS[topic].forEach(sub => {
      groupedData[topic][sub] = [];
    });
  });

  // Populate with files from backend
  files.forEach(file => {
    if (!groupedData[file.topic]) {
      groupedData[file.topic] = {};
    }
    if (!groupedData[file.topic][file.sub_topic]) {
      groupedData[file.topic][file.sub_topic] = [];
    }
    groupedData[file.topic][file.sub_topic].push(file);
  });

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      
      {/* Title Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
            <FileCheck className="h-7 w-7 text-[#d4af37]" />
            Dokumen Akreditasi Sekolah
          </h1>
          <p className="text-xs text-zinc-500 mt-1.5 font-sans">
            Kelola berkas instrumen dan syarat akreditasi menggunakan tautan file Google Drive yang rapi.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="rounded-xl bg-[#d4af37] hover:bg-[#f3cb65] px-4.5 py-3 text-xs font-bold text-black flex items-center gap-1.5 transition-all shadow-md shadow-[#d4af37]/10"
        >
          <Plus className="h-4 w-4" />
          Tambah Link File
        </button>
      </div>

      {/* Success notification banner */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-750 px-4 py-3 rounded-xl flex items-center gap-2 text-xs font-semibold">
          <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Main Framework Container */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-8 w-8 text-[#d4af37] animate-spin" />
          <p className="text-xs text-zinc-400 font-medium">Memuat kerangka akreditasi...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-750 p-6 rounded-xl flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm">Terjadi Masalah</h4>
            <p className="text-xs mt-1 text-red-650">{error}</p>
            <button onClick={fetchFiles} className="mt-3 px-3 py-1.5 bg-white border border-red-200 hover:bg-red-50 rounded-lg text-xs font-bold transition-all">Muat Ulang</button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.keys(groupedData).map(topic => {
            const hasAnyFiles = Object.values(groupedData[topic]).some(arr => arr.length > 0);
            const isTopicExpanded = expandedTopics[topic];
            
            return (
              <div key={topic} className="bg-white border border-zinc-200/80 rounded-2xl overflow-hidden shadow-sm">
                
                {/* Topic Header */}
                <button
                  onClick={() => toggleTopic(topic)}
                  className="w-full flex justify-between items-center px-6 py-4.5 bg-zinc-50/50 hover:bg-zinc-50 transition-colors text-left border-b border-zinc-150"
                >
                  <div className="flex items-center gap-3">
                    <span className="h-6.5 w-6.5 rounded-lg bg-zinc-200/60 flex items-center justify-center font-bold text-xs text-zinc-700">
                      T
                    </span>
                    <h3 className="font-extrabold text-[#aa8410] text-sm md:text-base leading-snug">
                      {topic}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasAnyFiles && (
                      <span className="text-[10px] font-bold bg-[#aa8410]/10 text-[#aa8410] px-2 py-0.5 rounded-full">
                        Ada Berkas
                      </span>
                    )}
                    {isTopicExpanded ? <ChevronUp className="h-5 w-5 text-zinc-400" /> : <ChevronDown className="h-5 w-5 text-zinc-400" />}
                  </div>
                </button>

                {/* Subtopics Area */}
                {isTopicExpanded && (
                  <div className="p-4 md:p-6 space-y-4 bg-white divide-y divide-zinc-100">
                    {Object.keys(groupedData[topic]).map((subTopic, subIdx) => {
                      const subTopicFiles = groupedData[topic][subTopic];
                      const subKey = `${topic}-${subTopic}`;
                      const isSubExpanded = expandedSubTopics[subKey];

                      return (
                        <div key={subTopic} className={`${subIdx > 0 ? 'pt-4' : ''}`}>
                          
                          {/* Sub Topic Header */}
                          <button
                            onClick={() => toggleSubTopic(topic, subTopic)}
                            className="w-full flex items-center justify-between py-2 text-left hover:text-zinc-900 transition-colors"
                          >
                            <span className="font-bold text-xs md:text-sm text-zinc-700 flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-[#d4af37]" />
                              {subTopic}
                              <span className="text-[10px] font-normal text-zinc-400">({subTopicFiles.length} file)</span>
                            </span>
                            {isSubExpanded ? <ChevronUp className="h-4 w-4 text-zinc-400" /> : <ChevronDown className="h-4 w-4 text-zinc-400" />}
                          </button>

                          {/* Files Table under this Sub Topic */}
                          {isSubExpanded && (
                            <div className="mt-3 overflow-x-auto rounded-xl border border-zinc-150">
                              <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                  <tr className="bg-zinc-50 border-b border-zinc-150 text-[10px] font-extrabold text-zinc-450 uppercase tracking-widest">
                                    <th className="px-5 py-3 w-16 text-center">NO</th>
                                    <th className="px-5 py-3">Nama File</th>
                                    <th className="px-5 py-3">Link File</th>
                                    <th className="px-5 py-3 text-center w-52">Aksi</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100">
                                  {subTopicFiles.length === 0 ? (
                                    <tr>
                                      <td colSpan="4" className="px-5 py-5 text-center text-zinc-400 italic">
                                        Belum ada tautan berkas diunggah. Silakan klik "Tambah Link File" untuk mengisi sub topik ini.
                                      </td>
                                    </tr>
                                  ) : (
                                    subTopicFiles.map((file, idx) => (
                                      <tr key={file.id} className="hover:bg-zinc-50/50">
                                        <td className="px-5 py-3.5 text-center font-bold text-zinc-400">{idx + 1}</td>
                                        <td className="px-5 py-3.5 font-bold text-zinc-850 flex items-center gap-2">
                                          <FileText className="h-4 w-4 text-zinc-455 shrink-0" />
                                          {file.file_name}
                                        </td>
                                        <td className="px-5 py-3.5 text-indigo-650 max-w-xs truncate font-medium">
                                          <a 
                                            href={file.file_link} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="hover:underline flex items-center gap-1 inline-flex"
                                          >
                                            Google Drive Link <ExternalLink className="h-3 w-3" />
                                          </a>
                                        </td>
                                        <td className="px-5 py-3.5 text-center">
                                          <div className="flex justify-center items-center gap-2">
                                            <a
                                              href={file.file_link}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              title="View File"
                                              className="p-1.5 text-zinc-600 hover:text-zinc-900 border border-zinc-200 hover:border-zinc-300 rounded-lg bg-white shadow-sm transition-colors"
                                            >
                                              <Eye className="h-4 w-4" />
                                            </a>
                                            <a
                                              href={file.file_link}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              title="Download File"
                                              className="p-1.5 text-zinc-600 hover:text-[#aa8410] border border-zinc-200 hover:border-[#aa8410]/30 rounded-lg bg-white shadow-sm transition-colors"
                                            >
                                              <Download className="h-4 w-4" />
                                            </a>
                                            <button
                                              onClick={() => handleOpenEditModal(file)}
                                              title="Edit File"
                                              className="p-1.5 text-zinc-650 hover:text-amber-700 border border-zinc-200 hover:border-amber-200 rounded-lg bg-white shadow-sm transition-colors"
                                            >
                                              <Edit className="h-4 w-4" />
                                            </button>
                                            <button
                                              onClick={() => handleDeleteFile(file.id)}
                                              title="Hapus File"
                                              className="p-1.5 text-red-500 hover:text-red-750 border border-zinc-200 hover:border-red-200 rounded-lg bg-white shadow-sm transition-colors"
                                            >
                                              <Trash2 className="h-4 w-4" />
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    ))
                                  )}
                                </tbody>
                              </table>
                            </div>
                          )}

                        </div>
                      );
                    })}
                  </div>
                )}
                
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE & EDIT DIALOG MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-zinc-150 overflow-hidden">
            
            {/* Modal Header */}
            <div className="px-6 py-4.5 border-b border-zinc-150 flex justify-between items-center bg-zinc-50/50">
              <h3 className="font-extrabold text-zinc-900 text-base">
                {editingFile ? 'Edit Link Berkas Akreditasi' : 'Tambah Link Berkas Akreditasi'}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-zinc-400 hover:text-zinc-650 font-bold p-1 rounded-lg hover:bg-zinc-100 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 text-xs">
              
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-750 px-4 py-2.5 rounded-xl flex items-center gap-2">
                  <AlertCircle className="h-4.5 w-4.5 text-red-500 shrink-0" />
                  {formError}
                </div>
              )}

              {/* Topic Select/Input */}
              <div className="space-y-1.5">
                <label className="block font-bold text-zinc-700">Topik Akreditasi</label>
                <select
                  value={topicInput}
                  onChange={(e) => {
                    setTopicInput(e.target.value);
                    // Autofill subtopic list
                    const subList = DEFAULT_TOPICS[e.target.value] || [];
                    if (subList.length > 0) setSubTopicInput(subList[0]);
                  }}
                  className="block w-full rounded-xl border border-zinc-300 py-2.5 px-3 focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] outline-none text-zinc-800"
                >
                  {Object.keys(DEFAULT_TOPICS).map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                  <option value="Custom">-- Custom Topik (Ketik Bebas) --</option>
                </select>
                
                {topicInput === 'Custom' && (
                  <input
                    type="text"
                    required
                    placeholder="Ketik nama Topik baru..."
                    onChange={(e) => setTopicInput(e.target.value)}
                    className="block w-full rounded-xl border border-zinc-300 py-2.5 px-3 mt-2 focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] outline-none"
                  />
                )}
              </div>

              {/* Sub Topic Select/Input */}
              <div className="space-y-1.5">
                <label className="block font-bold text-zinc-700">Sub Topik</label>
                {DEFAULT_TOPICS[topicInput] ? (
                  <select
                    value={subTopicInput}
                    onChange={(e) => setSubTopicInput(e.target.value)}
                    className="block w-full rounded-xl border border-zinc-300 py-2.5 px-3 focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] outline-none text-zinc-800"
                  >
                    {DEFAULT_TOPICS[topicInput].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                    <option value="CustomSub">-- Custom Sub-Topik (Ketik Bebas) --</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    value={subTopicInput === 'CustomSub' ? '' : subTopicInput}
                    onChange={(e) => setSubTopicInput(e.target.value)}
                    placeholder="Masukkan nama Sub Topik..."
                    className="block w-full rounded-xl border border-zinc-300 py-2.5 px-3 focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] outline-none"
                  />
                )}

                {subTopicInput === 'CustomSub' && (
                  <input
                    type="text"
                    required
                    placeholder="Ketik nama Sub Topik baru..."
                    onChange={(e) => setSubTopicInput(e.target.value)}
                    className="block w-full rounded-xl border border-zinc-300 py-2.5 px-3 mt-2 focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] outline-none"
                  />
                )}
              </div>

              {/* File Name */}
              <div className="space-y-1.5">
                <label className="block font-bold text-zinc-700">Nama Berkas / File</label>
                <input
                  type="text"
                  required
                  value={fileNameInput}
                  onChange={(e) => setFileNameInput(e.target.value)}
                  placeholder="Contoh: Dokumen RKJM 2025-2029"
                  className="block w-full rounded-xl border border-zinc-300 py-2.5 px-3 focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] outline-none"
                />
              </div>

              {/* File Link (Gdrive URL) */}
              <div className="space-y-1.5">
                <label className="block font-bold text-zinc-700">Link File (Tautan Google Drive)</label>
                <input
                  type="url"
                  required
                  value={fileLinkInput}
                  onChange={(e) => setFileLinkInput(e.target.value)}
                  placeholder="https://drive.google.com/file/d/... atau link file lainnya"
                  className="block w-full rounded-xl border border-zinc-300 py-2.5 px-3 focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] outline-none"
                />
                <span className="text-[10px] text-zinc-400 block mt-1">
                  Tips: Pastikan akses link Google Drive diatur ke "Siapa saja yang memiliki link" agar bisa dibuka.
                </span>
              </div>

              {/* Modal Footer Actions */}
              <div className="pt-4 border-t border-zinc-150 flex justify-end gap-3 font-sans">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-300 hover:bg-zinc-50 font-bold text-zinc-700 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-5 py-2.5 rounded-xl bg-[#d4af37] hover:bg-[#f3cb65] font-bold text-black flex items-center gap-1.5 transition-colors shadow-md shadow-[#d4af37]/10"
                >
                  {submitLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingFile ? 'Simpan Perubahan' : 'Tambahkan'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
