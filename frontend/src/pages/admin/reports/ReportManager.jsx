import { useState, useEffect } from 'react';
import api from '../../../config/axios';
import { 
  BookOpen, FileText, Calendar, Plus, Edit2, Trash2, X, Upload, 
  Loader2, CheckCircle, AlertCircle, RefreshCw, Eye, Printer, Award, User, Search
} from 'lucide-react';

export default function ReportManager() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [activeTab, setActiveTab] = useState('daily'); // 'daily' or 'semester'
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState([]);
  const [message, setMessage] = useState(null);
  
  // Search & Filter States
  const [classFilter, setClassFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Daily Report Form Fields
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [activities, setActivities] = useState('');
  const [notes, setNotes] = useState('');
  const [photoFile, setPhotoFile] = useState(null);

  // Semester Report Form Fields
  const [academicYear, setAcademicYear] = useState('2025/2026');
  const [semester, setSemester] = useState('Ganjil');
  const [religion, setReligion] = useState('');
  const [physical, setPhysical] = useState('');
  const [cognitive, setCognitive] = useState('');
  const [language, setLanguage] = useState('');
  const [socialEmotional, setSocialEmotional] = useState('');
  const [art, setArt] = useState('');
  const [generalNotes, setGeneralNotes] = useState('');

  // Fetch all students and classes for filtering
  const fetchStudentsAndClasses = async () => {
    try {
      const [studentsRes, classesRes] = await Promise.all([
        api.get('/admin/students', { params: { per_page: 200 } }),
        api.get('/admin/classes')
      ]);
      setStudents(studentsRes.data || []);
      setClasses(classesRes.data || []);
      if (studentsRes.data?.length > 0) {
        setSelectedStudent(studentsRes.data[0]);
      }
    } catch (err) {
      console.error('Failed to load students/classes data', err);
    }
  };

  useEffect(() => {
    fetchStudentsAndClasses();
  }, []);

  // Fetch reports when student or tab changes
  const fetchReports = async () => {
    if (!selectedStudent) return;
    if (activeTab !== 'daily' && activeTab !== 'semester') return;
    setLoading(true);
    try {
      const endpoint = activeTab === 'daily' ? '/admin/reports/daily' : '/admin/reports/semester';
      const response = await api.get(endpoint, {
        params: { student_id: selectedStudent.id }
      });
      setReports(response.data || []);
    } catch (err) {
      console.error('Failed to load reports', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [selectedStudent, activeTab]);

  const handleDelete = async (id) => {
    if (!confirm('Apakah Anda yakin ingin menghapus laporan ini?')) return;
    try {
      const endpoint = activeTab === 'daily' ? `/admin/reports/daily/${id}` : `/admin/reports/semester/${id}`;
      await api.delete(endpoint);
      setMessage({ type: 'success', text: 'Laporan berhasil dihapus.' });
      fetchReports();
    } catch (err) {
      alert('Gagal menghapus laporan.');
    }
  };

  const openAddModal = () => {
    setEditingReport(null);
    if (activeTab === 'daily') {
      setReportDate(new Date().toISOString().split('T')[0]);
      setActivities('');
      setNotes('');
      setPhotoFile(null);
    } else {
      setReligion('');
      setPhysical('');
      setCognitive('');
      setLanguage('');
      setSocialEmotional('');
      setArt('');
      setGeneralNotes('');
    }
    setShowModal(true);
  };

  const openEditModal = (r) => {
    setEditingReport(r);
    if (activeTab === 'daily') {
      setReportDate(r.date);
      setActivities(r.activities || '');
      setNotes(r.notes || '');
      setPhotoFile(null);
    } else {
      setAcademicYear(r.academic_year);
      setSemester(r.semester);
      setReligion(r.religion_morals || '');
      setPhysical(r.physical_motor || '');
      setCognitive(r.cognitive || '');
      setLanguage(r.language || '');
      setSocialEmotional(r.social_emotional || '');
      setArt(r.art || '');
      setGeneralNotes(r.general_notes || '');
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    const formData = new FormData();
    formData.append('student_id', selectedStudent.id);

    if (activeTab === 'daily') {
      formData.append('date', reportDate);
      formData.append('activities', activities);
      formData.append('notes', notes);
      if (photoFile) {
        formData.append('photo_file', photoFile);
      }
    } else {
      formData.append('academic_year', academicYear);
      formData.append('semester', semester);
      formData.append('religion_morals', religion);
      formData.append('physical_motor', physical);
      formData.append('cognitive', cognitive);
      formData.append('language', language);
      formData.append('social_emotional', socialEmotional);
      formData.append('art', art);
      formData.append('general_notes', generalNotes);
    }

    try {
      if (editingReport) {
        const endpoint = activeTab === 'daily' 
          ? `/admin/reports/daily/update/${editingReport.id}` 
          : `/admin/reports/semester/update/${editingReport.id}`;
        await api.post(endpoint, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setMessage({ type: 'success', text: 'Laporan berhasil diperbarui!' });
      } else {
        const endpoint = activeTab === 'daily' ? '/admin/reports/daily' : '/admin/reports/semester';
        await api.post(endpoint, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setMessage({ type: 'success', text: 'Laporan baru berhasil ditambahkan!' });
      }
      setShowModal(false);
      fetchReports();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Gagal menyimpan laporan.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-950 flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-[#aa8410]" /> Laporan Perkembangan Siswa
          </h1>
          <p className="mt-1 text-sm text-zinc-550">
            Input laporan aktivitas harian (Daily Report) dan Penilaian Semester (Rapor) PAUD/TK.
          </p>
        </div>
        {selectedStudent && (
          <button 
            onClick={openAddModal}
            className="rounded-xl bg-[#d4af37] hover:bg-[#f3cb65] px-4 py-2.5 text-xs font-bold text-black flex items-center gap-2 transition-colors self-start sm:self-auto"
          >
            <Plus className="h-4.5 w-4.5" /> 
            {activeTab === 'daily' ? 'Input Laporan Harian' : 'Input Rapor Semester'}
          </button>
        )}
      </div>

      {message && (
        <div className={`flex items-center gap-3 rounded-xl border p-4 text-sm ${
          message.type === 'success' ? 'border-green-500/30 bg-green-550/10 text-green-700' : 'border-red-500/30 bg-red-550/10 text-red-750'
        }`}>
          <CheckCircle className="h-5 w-5 shrink-0" />
          <span>{message.text}</span>
        </div>
      )}

      {/* Tab Controller & List */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Student Sidebar List */}
        <div className="md:col-span-1 bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm space-y-4">
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Pilih Siswa</h3>
            
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
              <input 
                type="text"
                placeholder="Cari nama siswa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-zinc-200 text-xs bg-zinc-50/50 outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition-all"
              />
            </div>

            {/* Class Filter Dropdown */}
            <div>
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="w-full px-2 py-1.5 rounded-xl border border-zinc-200 text-xs bg-white outline-none focus:border-[#d4af37] transition-all font-medium text-zinc-650"
              >
                <option value="">Semua Kelas</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>Kelas: {cls.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5 max-h-[300px] overflow-y-auto pt-1">
            {students.filter(student => {
              const matchesSearch = student.full_name.toLowerCase().includes(searchQuery.toLowerCase());
              const matchesClass = classFilter ? String(student.class_id) === String(classFilter) : true;
              return matchesSearch && matchesClass;
            }).length === 0 ? (
              <p className="text-xs text-zinc-400 font-light text-center py-4">Siswa tidak ditemukan.</p>
            ) : (
              students.filter(student => {
                const matchesSearch = student.full_name.toLowerCase().includes(searchQuery.toLowerCase());
                const matchesClass = classFilter ? String(student.class_id) === String(classFilter) : true;
                return matchesSearch && matchesClass;
              }).map((student) => (
                <button
                  key={student.id}
                  onClick={() => setSelectedStudent(student)}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-all ${
                    selectedStudent?.id === student.id 
                      ? 'bg-zinc-100 text-zinc-955 border-l-4 border-[#d4af37]' 
                      : 'text-zinc-650 hover:bg-zinc-50'
                  }`}
                >
                  <User className="h-4 w-4 text-[#aa8410] shrink-0" />
                  <span className="truncate">{student.full_name}</span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Reports Content Area */}
        <div className="md:col-span-3 space-y-6">
          
          {/* Tab Controller */}
          <div className="flex border-b border-zinc-200 gap-2">
            <button 
              onClick={() => setActiveTab('daily')}
              className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${activeTab === 'daily' ? 'border-[#d4af37] text-zinc-900' : 'border-transparent text-zinc-500 hover:text-zinc-800'}`}
            >
              Laporan Harian Siswa
            </button>
            <button 
              onClick={() => setActiveTab('semester')}
              className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${activeTab === 'semester' ? 'border-[#d4af37] text-zinc-900' : 'border-transparent text-zinc-500 hover:text-zinc-800'}`}
            >
              Rapor Semester
            </button>
          </div>

          {/* Table / Grid reports */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm min-h-[300px]">
            {!selectedStudent ? (
              <div className="flex flex-col items-center justify-center h-64 text-zinc-500 space-y-2">
                <AlertCircle className="h-10 w-10 text-zinc-400" />
                <p className="text-sm font-semibold">Pilih siswa terlebih dahulu.</p>
              </div>
            ) : loading ? (
              <div className="flex h-64 items-center justify-center">
                <RefreshCw className="h-8 w-8 animate-spin text-[#d4af37]" />
              </div>
            ) : reports.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-zinc-500 space-y-2">
                <FileText className="h-10 w-10 text-zinc-350" />
                <p className="text-sm font-medium">Belum ada data laporan untuk {selectedStudent.full_name}.</p>
                <button 
                  onClick={openAddModal}
                  className="mt-2 text-xs font-bold text-[#aa8410] hover:underline"
                >
                  + Tambah Laporan Sekarang
                </button>
              </div>
            ) : activeTab === 'daily' ? (
              /* Daily Reports Timeline */
              <div className="space-y-6">
                {reports.map((r) => (
                  <div key={r.id} className="border border-zinc-150 rounded-xl p-5 hover:shadow-md transition-shadow relative">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <span className="inline-block text-[10px] font-bold uppercase tracking-wider bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded-full">
                          📅 {new Date(r.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                        
                        <div className="mt-3 space-y-2">
                          <div>
                            <h4 className="text-xs font-extrabold text-zinc-400 uppercase tracking-widest">Aktivitas Hari Ini</h4>
                            <p className="text-sm text-zinc-800 leading-relaxed mt-0.5 whitespace-pre-line">{r.activities || '-'}</p>
                          </div>
                          {r.notes && (
                            <div>
                              <h4 className="text-xs font-extrabold text-zinc-400 uppercase tracking-widest">Catatan Khusus</h4>
                              <p className="text-xs text-zinc-650 leading-relaxed mt-0.5 whitespace-pre-line">{r.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {r.photo && (
                        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-zinc-200">
                          <img src={`http://${window.location.hostname}:8080/${r.photo}`} alt="" className="h-full w-full object-cover" />
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-zinc-100/60">
                      <button 
                        onClick={() => openEditModal(r)}
                        className="text-xs font-semibold text-zinc-500 hover:text-[#d4af37] flex items-center gap-1"
                      >
                        <Edit2 className="h-3.5 w-3.5" /> Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(r.id)}
                        className="text-xs font-semibold text-zinc-500 hover:text-red-500 flex items-center gap-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Semester Reports Card */
              <div className="space-y-6">
                {reports.map((r) => (
                  <div key={r.id} className="border border-zinc-200 rounded-xl p-6 bg-[#fafbfc] space-y-4">
                    <div className="flex justify-between items-center border-b border-zinc-200 pb-3">
                      <div>
                        <h4 className="text-base font-bold text-zinc-900">Rapor Hasil Belajar Siswa</h4>
                        <p className="text-xs text-zinc-500">Tahun Ajaran: {r.academic_year} | Semester: {r.semester}</p>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => window.print()}
                          className="rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-650 flex items-center gap-1"
                        >
                          <Printer className="h-3.5 w-3.5" /> Cetak
                        </button>
                        <button 
                          onClick={() => openEditModal(r)}
                          className="rounded-lg border border-zinc-200 bg-white hover:bg-[#d4af37]/10 hover:text-[#aa8410] px-3 py-1.5 text-xs font-semibold text-zinc-650 flex items-center gap-1"
                        >
                          <Edit2 className="h-3.5 w-3.5" /> Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(r.id)}
                          className="rounded-lg border border-zinc-200 bg-white hover:bg-red-50 hover:text-red-500 px-3 py-1.5 text-xs font-semibold text-zinc-650 flex items-center gap-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Hapus
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                      <div className="space-y-2">
                        <p className="font-bold text-zinc-700">1. Nilai Agama & Moral</p>
                        <p className="text-zinc-650 bg-white p-3 rounded-lg border border-zinc-150 text-xs leading-relaxed whitespace-pre-line">{r.religion_morals || '-'}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="font-bold text-zinc-700">2. Fisik & Motorik</p>
                        <p className="text-zinc-650 bg-white p-3 rounded-lg border border-zinc-150 text-xs leading-relaxed whitespace-pre-line">{r.physical_motor || '-'}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="font-bold text-zinc-700">3. Kognitif</p>
                        <p className="text-zinc-650 bg-white p-3 rounded-lg border border-zinc-150 text-xs leading-relaxed whitespace-pre-line">{r.cognitive || '-'}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="font-bold text-zinc-700">4. Bahasa & Komunikasi</p>
                        <p className="text-zinc-650 bg-white p-3 rounded-lg border border-zinc-150 text-xs leading-relaxed whitespace-pre-line">{r.language || '-'}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="font-bold text-zinc-700">5. Sosial & Emosional</p>
                        <p className="text-zinc-650 bg-white p-3 rounded-lg border border-zinc-150 text-xs leading-relaxed whitespace-pre-line">{r.social_emotional || '-'}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="font-bold text-zinc-700">6. Seni & Kreativitas</p>
                        <p className="text-zinc-650 bg-white p-3 rounded-lg border border-zinc-150 text-xs leading-relaxed whitespace-pre-line">{r.art || '-'}</p>
                      </div>
                    </div>
                    
                    <div className="pt-3 border-t border-zinc-200">
                      <p className="font-bold text-zinc-700 text-sm">Catatan Umum Kepala Sekolah & Guru:</p>
                      <p className="text-xs text-zinc-600 italic bg-white p-3 rounded-lg border border-zinc-150 mt-1 leading-relaxed whitespace-pre-line">{r.general_notes || '-'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reports Dialog Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <h3 className="text-lg font-bold text-zinc-950">
                {editingReport ? 'Edit Laporan Perkembangan' : 'Input Laporan Perkembangan Baru'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-zinc-800">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {activeTab === 'daily' ? (
                /* Daily Report Fields */
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500">Tanggal Laporan</label>
                      <input 
                        type="date" 
                        required
                        value={reportDate}
                        onChange={(e) => setReportDate(e.target.value)}
                        className="block w-full mt-1.5 rounded-xl border border-zinc-250 bg-white py-2.5 px-3.5 text-sm text-zinc-900 focus:border-[#d4af37] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500">Foto Aktivitas (Opsional)</label>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                        className="block w-full mt-2 text-xs text-zinc-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500">Aktivitas Hari Ini (Pembelajaran & Sikap)</label>
                    <textarea 
                      rows="4"
                      required
                      value={activities}
                      onChange={(e) => setActivities(e.target.value)}
                      placeholder="Masukkan agenda belajar, makan siang anak, sikap, dan keikutsertaannya hari ini..."
                      className="block w-full mt-1.5 rounded-xl border border-zinc-250 bg-white py-2.5 px-3.5 text-sm text-zinc-900 focus:border-[#d4af37] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500">Catatan Khusus Guru (Pesan untuk Wali Murid)</label>
                    <textarea 
                      rows="3"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Pesan khusus untuk orang tua, misal: Anak sempat rewel atau perlu membawa buku menggambar besok..."
                      className="block w-full mt-1.5 rounded-xl border border-zinc-250 bg-white py-2.5 px-3.5 text-sm text-zinc-900 focus:border-[#d4af37] outline-none"
                    />
                  </div>
                </>
              ) : (
                /* Semester Report/Rapor Fields */
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500">Tahun Ajaran</label>
                      <input 
                        type="text" 
                        required
                        value={academicYear}
                        onChange={(e) => setAcademicYear(e.target.value)}
                        placeholder="Contoh: 2025/2026"
                        className="block w-full mt-1.5 rounded-xl border border-zinc-250 bg-white py-2.5 px-3.5 text-sm text-zinc-900 focus:border-[#d4af37] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500">Semester</label>
                      <select
                        value={semester}
                        onChange={(e) => setSemester(e.target.value)}
                        className="block w-full mt-1.5 rounded-xl border border-zinc-250 bg-white py-2.5 px-3.5 text-sm text-zinc-900 focus:border-[#d4af37] outline-none"
                      >
                        <option value="Ganjil">Semester Ganjil</option>
                        <option value="Genap">Semester Genap</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-1">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500">1. Nilai Agama & Moral</label>
                      <textarea 
                        rows="3"
                        value={religion}
                        onChange={(e) => setReligion(e.target.value)}
                        placeholder="Anak mampu mengenal penciptanya, hafalan doa pendek..."
                        className="block w-full mt-1.5 rounded-xl border border-zinc-250 bg-white py-2 px-3 text-xs text-zinc-900 focus:border-[#d4af37] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500">2. Fisik & Motorik (Kasar & Halus)</label>
                      <textarea 
                        rows="3"
                        value={physical}
                        onChange={(e) => setPhysical(e.target.value)}
                        placeholder="Anak lincah berlari, mampu memegang krayon dengan benar..."
                        className="block w-full mt-1.5 rounded-xl border border-zinc-250 bg-white py-2 px-3 text-xs text-zinc-900 focus:border-[#d4af37] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500">3. Kognitif (Pemecahan Masalah & Pola)</label>
                      <textarea 
                        rows="3"
                        value={cognitive}
                        onChange={(e) => setCognitive(e.target.value)}
                        placeholder="Anak mengenal macam-macam warna dasar dan bentuk..."
                        className="block w-full mt-1.5 rounded-xl border border-zinc-250 bg-white py-2 px-3 text-xs text-zinc-900 focus:border-[#d4af37] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500">4. Bahasa (Komunikasi & Memahami)</label>
                      <textarea 
                        rows="3"
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        placeholder="Anak sudah mulai aktif menceritakan kegiatan hariannya..."
                        className="block w-full mt-1.5 rounded-xl border border-zinc-250 bg-white py-2 px-3 text-xs text-zinc-900 focus:border-[#d4af37] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500">5. Sosial & Emosional (Kemandirian)</label>
                      <textarea 
                        rows="3"
                        value={socialEmotional}
                        onChange={(e) => setSocialEmotional(e.target.value)}
                        placeholder="Anak bersahabat, mampu antri menunggu giliran main..."
                        className="block w-full mt-1.5 rounded-xl border border-zinc-250 bg-white py-2 px-3 text-xs text-zinc-900 focus:border-[#d4af37] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500">6. Seni & Kreativitas (Prakarya)</label>
                      <textarea 
                        rows="3"
                        value={art}
                        onChange={(e) => setArt(e.target.value)}
                        placeholder="Anak bersemangat bernyanyi bersama, menyukai kolase..."
                        className="block w-full mt-1.5 rounded-xl border border-zinc-250 bg-white py-2 px-3 text-xs text-zinc-900 focus:border-[#d4af37] outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500">Catatan & Masukan Umum Guru</label>
                    <textarea 
                      rows="2"
                      value={generalNotes}
                      onChange={(e) => setGeneralNotes(e.target.value)}
                      placeholder="Ulasan umum perkembangan anak sepanjang semester ini..."
                      className="block w-full mt-1.5 rounded-xl border border-zinc-250 bg-white py-2.5 px-3.5 text-xs text-zinc-900 focus:border-[#d4af37] outline-none"
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-zinc-200 px-4 py-2.5 text-xs font-bold text-zinc-500 hover:text-zinc-800"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-[#d4af37] hover:bg-[#f3cb65] px-6 py-2.5 text-xs font-bold text-black flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Simpan Laporan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
