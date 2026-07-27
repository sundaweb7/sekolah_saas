import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../config/axios';
import { useAuth } from '../../context/AuthContext';
import { 
  BookOpen, FileText, Calendar, Plus, Edit2, Trash2, X, Upload, 
  Loader2, CheckCircle, AlertCircle, RefreshCw, LogOut, User, Award, Printer, ChevronRight, Megaphone, CheckSquare
} from 'lucide-react';

export default function TeacherDashboard() {
  const { logout, user, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const allTabs = [
    { id: 'attendance', label: 'Absensi & Jurnal', icon: <CheckSquare className="h-4.5 w-4.5 inline mr-1" />, feature: 'absensi_siswa_jurnal' },
    { id: 'daily', label: 'Laporan Harian', icon: <BookOpen className="h-4.5 w-4.5 inline mr-1" />, feature: 'perkembangan_siswa' },
    { id: 'semester', label: 'Rapor Semester', icon: <FileText className="h-4.5 w-4.5 inline mr-1" />, feature: 'perkembangan_siswa' },
    { id: 'announcements', label: 'Pengumuman', icon: <Megaphone className="h-4.5 w-4.5 inline mr-1" /> }
  ];

  const filteredTabs = allTabs.filter(tab => {
    if (!tab.feature) return true;
    return user?.allowed_features?.includes(tab.feature);
  });

  const [dashboardData, setDashboardData] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [activeTab, setActiveTab] = useState('attendance');
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  // Attendance State
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceList, setAttendanceList] = useState([]);
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [teacherAttendance, setTeacherAttendance] = useState(null);
  const [checkingInTeacher, setCheckingInTeacher] = useState(false);
  const [geolocationError, setGeolocationError] = useState(null);
  const [journalSubject, setJournalSubject] = useState('');
  const [journalActivities, setJournalActivities] = useState('');
  const [journalNotes, setJournalNotes] = useState('');
  const [savingJournal, setSavingJournal] = useState(false);

  // Class Announcements State
  const [announcements, setAnnouncements] = useState([]);
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [savingAnn, setSavingAnn] = useState(false);

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

  const fetchDashboardStats = async () => {
    try {
      const response = await api.get('/teacher/dashboard/stats');
      setDashboardData(response.data);
      if (response.data.students?.length > 0) {
        setSelectedStudent(response.data.students[0]);
      }
    } catch (err) {
      setError(err.message || 'Gagal memuat dashboard guru.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
    refreshProfile();
  }, []);

  useEffect(() => {
    if (user?.allowed_features) {
      const allowedKeys = filteredTabs.map(t => t.id);
      if (!allowedKeys.includes(activeTab)) {
        setActiveTab(allowedKeys[0] || 'attendance');
      }
    }
  }, [user, filteredTabs, activeTab]);

  // Fetch reports when student or tab changes
  const fetchReports = async () => {
    if (!selectedStudent) return;
    if (activeTab !== 'daily' && activeTab !== 'semester') return;
    setReportsLoading(true);
    try {
      const endpoint = activeTab === 'daily' ? '/teacher/reports/daily' : '/teacher/reports/semester';
      const response = await api.get(endpoint, {
        params: { student_id: selectedStudent.id }
      });
      setReports(response.data || []);
    } catch (err) {
      console.error('Failed to load student reports', err);
    } finally {
      setReportsLoading(false);
    }
  };

  // Fetch Attendance List for Class
  const fetchAttendance = async () => {
    if (activeTab !== 'attendance') return;
    setReportsLoading(true);
    try {
      const response = await api.get('/teacher/attendance', {
        params: { date: attendanceDate }
      });
      setAttendanceList(response.data || []);
      
      // Load teacher check-in status
      try {
        const statusRes = await api.get('/teacher/attendance/status');
        setTeacherAttendance(statusRes.data || null);
      } catch (e) {
        console.error(e);
      }

      // Load today's class journal
      try {
        const journalRes = await api.get('/teacher/journals', {
          params: { date: attendanceDate }
        });
        if (journalRes.data) {
          setJournalSubject(journalRes.data.subject || '');
          setJournalActivities(journalRes.data.activities || '');
          setJournalNotes(journalRes.data.notes || '');
        } else {
          setJournalSubject('');
          setJournalActivities('');
          setJournalNotes('');
        }
      } catch (e) {
        console.error(e);
      }
    } catch (err) {
      console.error('Failed to load attendance list', err);
    } finally {
      setReportsLoading(false);
    }
  };

  // Fetch Class Announcements
  const fetchAnnouncements = async () => {
    if (activeTab !== 'announcements') return;
    setReportsLoading(true);
    try {
      const response = await api.get('/teacher/announcements');
      setAnnouncements(response.data || []);
    } catch (err) {
      console.error('Failed to load class announcements', err);
    } finally {
      setReportsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [selectedStudent, activeTab]);

  useEffect(() => {
    fetchAttendance();
  }, [activeTab, attendanceDate]);

  useEffect(() => {
    fetchAnnouncements();
  }, [activeTab]);

  const handleDelete = async (id) => {
    if (!confirm('Apakah Anda yakin ingin menghapus laporan ini?')) return;
    try {
      const endpoint = activeTab === 'daily' ? `/teacher/reports/daily/${id}` : `/teacher/reports/semester/${id}`;
      await api.delete(endpoint);
      setMessage({ type: 'success', text: 'Laporan berhasil dihapus.' });
      fetchReports();
    } catch (err) {
      alert('Gagal menghapus laporan.');
    }
  };

  // Save attendance list
  const handleSaveAttendance = async () => {
    setSavingAttendance(true);
    setMessage(null);
    try {
      await api.post('/teacher/attendance', {
        date: attendanceDate,
        attendance: attendanceList
      });
      setMessage({ type: 'success', text: 'Presensi kelas hari ini berhasil disimpan!' });
      fetchAttendance();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Gagal menyimpan presensi.' });
    } finally {
      setSavingAttendance(false);
    }
  };

  // Teacher GPS Check In
  const handleTeacherCheckIn = () => {
    setCheckingInTeacher(true);
    setGeolocationError(null);
    setMessage(null);

    if (!navigator.geolocation) {
      setGeolocationError('Geolocation tidak didukung oleh browser Anda.');
      setCheckingInTeacher(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        try {
          const res = await api.post('/teacher/attendance/check-in', {
            latitude: lat.toString(),
            longitude: lng.toString()
          });
          setTeacherAttendance(res.data);
          setMessage({ type: 'success', text: 'Absensi mandiri guru berhasil dicatat!' });
          fetchAttendance();
        } catch (err) {
          setMessage({ type: 'error', text: err.response?.data?.message || 'Gagal mencatat absensi mandiri.' });
        } finally {
          setCheckingInTeacher(false);
        }
      },
      (error) => {
        setGeolocationError('Gagal mendeteksi lokasi GPS. Pastikan izin lokasi aktif.');
        setCheckingInTeacher(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Save Journal
  const handleSaveJournal = async () => {
    setSavingJournal(true);
    setMessage(null);
    try {
      await api.post('/teacher/journals', {
        date: attendanceDate,
        subject: journalSubject,
        activities: journalActivities,
        notes: journalNotes
      });
      setMessage({ type: 'success', text: 'Jurnal pembelajaran harian berhasil disimpan!' });
      fetchAttendance();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Gagal menyimpan jurnal.' });
    } finally {
      setSavingJournal(false);
    }
  };

  // Save Announcement
  const handleSaveAnnouncement = async (e) => {
    e.preventDefault();
    setSavingAnn(true);
    setMessage(null);
    try {
      await api.post('/teacher/announcements', {
        title: annTitle,
        content: annContent
      });
      setMessage({ type: 'success', text: 'Pengumuman kelas berhasil diterbitkan!' });
      setAnnTitle('');
      setAnnContent('');
      fetchAnnouncements();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Gagal menerbitkan pengumuman.' });
    } finally {
      setSavingAnn(false);
    }
  };

  // Delete Announcement
  const handleDeleteAnnouncement = async (id) => {
    if (!confirm('Hapus pengumuman ini?')) return;
    try {
      await api.delete(`/teacher/announcements/${id}`);
      setMessage({ type: 'success', text: 'Pengumuman berhasil dihapus.' });
      fetchAnnouncements();
    } catch (err) {
      alert('Gagal menghapus pengumuman.');
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
          ? `/teacher/reports/daily/update/${editingReport.id}` 
          : `/teacher/reports/semester/update/${editingReport.id}`;
        await api.post(endpoint, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setMessage({ type: 'success', text: 'Laporan berhasil diperbarui!' });
      } else {
        const endpoint = activeTab === 'daily' ? '/teacher/reports/daily' : '/teacher/reports/semester';
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f3f7f9]">
        <Loader2 className="h-10 w-10 animate-spin text-[#d4af37]" />
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f3f7f9] p-6 text-center text-zinc-600">
        <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-zinc-900">Akses Portal Guru Gagal</h2>
        <p className="text-sm mt-2 max-w-sm">{error || 'Gagal memuat profil bimbingan kelas Anda.'}</p>
        <button onClick={logout} className="mt-6 rounded-xl bg-[#d4af37] text-black px-6 py-2.5 text-xs font-bold hover:bg-[#f3cb65] transition-colors">
          Keluar & Login Kembali
        </button>
      </div>
    );
  }

  const { teacher, students: classStudents, class: teacherClass } = dashboardData;

  return (
    <div className="min-h-screen bg-[#f3f7f9] text-zinc-800 flex flex-col font-sans">
      
      {/* Top Navbar */}
      <header className="h-16 border-b border-zinc-200 bg-white/80 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-6">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#d4af37] to-[#aa8410] flex items-center justify-center font-bold text-black text-sm shadow-md">
            G
          </div>
          <div>
            <p className="font-extrabold text-sm text-zinc-900 leading-tight">Guru Portal</p>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{teacher.class_name}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3 text-right">
            <div>
              <p className="text-xs font-bold text-zinc-800">{teacher.full_name}</p>
              <p className="text-[9px] font-medium text-zinc-500">NUPTK: {teacher.nuptk || '-'}</p>
            </div>
            <div className="h-9 w-9 rounded-full overflow-hidden border border-zinc-200 bg-zinc-100">
              {teacher.photo ? (
                <img src={`http://${window.location.hostname}:8080/${teacher.photo}`} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-xs font-bold text-[#aa8410] uppercase">
                  {teacher.full_name.charAt(0)}
                </div>
              )}
            </div>
          </div>

          <div className="h-8 w-[1px] bg-zinc-200" />

          <button 
            onClick={logout}
            className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-red-50 hover:text-red-650 px-3.5 py-2 text-xs font-bold text-zinc-700 transition-all shadow-sm"
          >
            <LogOut className="h-4 w-4" /> Keluar
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 pb-24 md:pb-6 grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Left Sidebar: Class Student List */}
        <div className={`md:col-span-1 bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm space-y-4 h-fit ${(activeTab === 'attendance' || activeTab === 'announcements') ? 'hidden md:block' : ''}`}>
          <div className="space-y-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Kelas Bimbingan</h3>
            <p className="text-sm font-extrabold text-zinc-900">{teacher.class_name}</p>
          </div>

          <div className="border-t border-zinc-100 pt-3 space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
            <h4 className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest mb-1">Daftar Murid ({classStudents.length})</h4>
            {classStudents.length === 0 ? (
              <p className="text-xs text-zinc-500">Belum ada murid aktif di kelas ini.</p>
            ) : (
              classStudents.map((student) => (
                <button
                  key={student.id}
                  onClick={() => setSelectedStudent(student)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all border ${
                    selectedStudent?.id === student.id 
                      ? 'bg-zinc-50 border-[#d4af37]/60 text-zinc-950 font-bold shadow-sm' 
                      : 'border-transparent text-zinc-650 hover:bg-zinc-50/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-8 w-8 rounded-full overflow-hidden border border-zinc-200 bg-zinc-150 shrink-0">
                      {student.photo ? (
                        <img src={`http://${window.location.hostname}:8080/${student.photo}`} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-[10px] font-bold text-zinc-500 uppercase">
                          {student.full_name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs truncate">{student.full_name}</p>
                      <p className="text-[9px] font-mono text-zinc-400">NISN: {student.registration_number || '-'}</p>
                    </div>
                  </div>
                  {selectedStudent?.id === student.id && <ChevronRight className="h-4 w-4 text-[#d4af37] shrink-0" />}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Area: Student Report Entries */}
        <div className="md:col-span-3 space-y-6">
          
          {/* Active Student Header Card */}
          {selectedStudent && (activeTab === 'daily' || activeTab === 'semester') && (
            <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full overflow-hidden border border-zinc-200 bg-zinc-100">
                  {selectedStudent.photo ? (
                    <img src={`http://${window.location.hostname}:8080/${selectedStudent.photo}`} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-sm font-bold text-[#aa8410] uppercase">
                      {selectedStudent.full_name.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-zinc-950">{selectedStudent.full_name}</h2>
                  <p className="text-xs text-zinc-500">
                    No. Induk/NISN: <span className="font-mono">{selectedStudent.registration_number || '-'}</span> | L/P: {selectedStudent.gender}
                  </p>
                </div>
              </div>
              <button
                onClick={openAddModal}
                className="rounded-xl bg-[#d4af37] hover:bg-[#f3cb65] px-4 py-2.5 text-xs font-bold text-black flex items-center gap-1.5 transition-colors self-start sm:self-auto"
              >
                <Plus className="h-4 w-4" />
                {activeTab === 'daily' ? 'Input Laporan Harian' : 'Input Rapor Semester'}
              </button>
            </div>
          )}

          {message && (
            <div className={`flex items-center gap-3 rounded-xl border p-4 text-sm ${
              message.type === 'success' ? 'border-green-500/30 bg-green-500/10 text-green-700' : 'border-red-500/30 bg-red-500/10 text-red-700'
            }`}>
              <CheckCircle className="h-5 w-5 shrink-0" />
              <span>{message.text}</span>
            </div>
          )}

          {/* Tab Controller */}
          <div className="hidden md:flex border-b border-zinc-200 gap-2 overflow-x-auto pb-1">
            {filteredTabs.map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all shrink-0 flex items-center gap-1.5 ${activeTab === tab.id ? 'border-[#d4af37] text-zinc-900' : 'border-transparent text-zinc-500 hover:text-zinc-800'}`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Reports Timeline / Table */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm min-h-[300px]">
            {activeTab === 'daily' && (
              /* Daily Reports */
              !selectedStudent ? (
                <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
                  <AlertCircle className="h-10 w-10 text-zinc-400 mb-2" />
                  <p className="text-sm font-semibold">Pilih murid di sidebar kiri.</p>
                </div>
              ) : reportsLoading ? (
                <div className="flex h-64 items-center justify-center"><RefreshCw className="h-8 w-8 animate-spin text-[#d4af37]" /></div>
              ) : reports.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-zinc-500"><p className="text-sm font-medium">Belum ada laporan harian.</p></div>
              ) : (
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
                              <h4 className="text-xs font-extrabold text-zinc-400 uppercase tracking-widest">Aktivitas Murid</h4>
                              <p className="text-sm text-zinc-800 leading-relaxed mt-0.5 whitespace-pre-line">{r.activities || '-'}</p>
                            </div>
                            {r.notes && (
                              <div>
                                <h4 className="text-xs font-extrabold text-zinc-400 uppercase tracking-widest">Catatan Untuk Orang Tua</h4>
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
                        <button onClick={() => openEditModal(r)} className="text-xs font-semibold text-zinc-550 hover:text-[#d4af37] flex items-center gap-1"><Edit2 className="h-3.5 w-3.5" /> Edit</button>
                        <button onClick={() => handleDelete(r.id)} className="text-xs font-semibold text-zinc-550 hover:text-red-500 flex items-center gap-1"><Trash2 className="h-3.5 w-3.5" /> Hapus</button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {activeTab === 'semester' && (
              /* Semester Reports */
              !selectedStudent ? (
                <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
                  <AlertCircle className="h-10 w-10 text-zinc-400 mb-2" />
                  <p className="text-sm font-semibold">Pilih murid di sidebar kiri.</p>
                </div>
              ) : reportsLoading ? (
                <div className="flex h-64 items-center justify-center"><RefreshCw className="h-8 w-8 animate-spin text-[#d4af37]" /></div>
              ) : reports.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-zinc-500"><p className="text-sm font-medium">Belum ada rapor semester.</p></div>
              ) : (
                <div className="space-y-6">
                  {reports.map((r) => (
                    <div key={r.id} className="border border-zinc-200 rounded-xl p-6 bg-[#fafbfc] space-y-4">
                      <div className="flex justify-between items-center border-b border-zinc-200 pb-3">
                        <div>
                          <h4 className="text-base font-bold text-zinc-900">Rapor Hasil Belajar</h4>
                          <p className="text-xs text-zinc-550">Tahun Ajaran: {r.academic_year} | Semester: {r.semester}</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => window.print()} className="rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-650 flex items-center gap-1"><Printer className="h-3.5 w-3.5" /> Cetak</button>
                          <button onClick={() => openEditModal(r)} className="rounded-lg border border-zinc-200 bg-white hover:bg-[#d4af37]/10 hover:text-[#aa8410] px-3 py-1.5 text-xs font-semibold text-zinc-650 flex items-center gap-1"><Edit2 className="h-3.5 w-3.5" /> Edit</button>
                          <button onClick={() => handleDelete(r.id)} className="rounded-lg border border-zinc-200 bg-white hover:bg-red-50 hover:text-red-500 px-3 py-1.5 text-xs font-semibold text-zinc-650 flex items-center gap-1"><Trash2 className="h-3.5 w-3.5" /> Hapus</button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                        <div className="space-y-2"><p className="font-bold text-zinc-700">1. Nilai Agama & Moral</p><p className="text-zinc-650 bg-white p-3 rounded-lg border border-zinc-150 text-xs leading-relaxed whitespace-pre-line">{r.religion_morals || '-'}</p></div>
                        <div className="space-y-2"><p className="font-bold text-zinc-700">2. Fisik & Motorik</p><p className="text-zinc-650 bg-white p-3 rounded-lg border border-zinc-150 text-xs leading-relaxed whitespace-pre-line">{r.physical_motor || '-'}</p></div>
                        <div className="space-y-2"><p className="font-bold text-zinc-700">3. Kognitif</p><p className="text-zinc-650 bg-white p-3 rounded-lg border border-zinc-150 text-xs leading-relaxed whitespace-pre-line">{r.cognitive || '-'}</p></div>
                        <div className="space-y-2"><p className="font-bold text-zinc-700">4. Bahasa & Komunikasi</p><p className="text-zinc-650 bg-white p-3 rounded-lg border border-zinc-150 text-xs leading-relaxed whitespace-pre-line">{r.language || '-'}</p></div>
                        <div className="space-y-2"><p className="font-bold text-zinc-700">5. Sosial & Emosional</p><p className="text-zinc-650 bg-white p-3 rounded-lg border border-zinc-150 text-xs leading-relaxed whitespace-pre-line">{r.social_emotional || '-'}</p></div>
                        <div className="space-y-2"><p className="font-bold text-zinc-700">6. Seni & Kreativitas</p><p className="text-zinc-650 bg-white p-3 rounded-lg border border-zinc-150 text-xs leading-relaxed whitespace-pre-line">{r.art || '-'}</p></div>
                      </div>
                      <div className="pt-3 border-t border-zinc-200">
                        <p className="font-bold text-zinc-700 text-sm">Catatan Umum:</p>
                        <p className="text-xs text-zinc-600 italic bg-white p-3 rounded-lg border border-zinc-150 mt-1 leading-relaxed whitespace-pre-line">{r.general_notes || '-'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {activeTab === 'attendance' && (
              /* Attendance Manager */
              <div className="space-y-6">
                
                {/* 1. Guru Self Attendance GPS */}
                <div className="bg-[#fafbfc] rounded-2xl border border-zinc-200 p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-150 pb-3">
                    <div>
                      <h4 className="text-sm font-bold text-zinc-950">1. Absensi Mandiri Guru (GPS)</h4>
                      <p className="text-[11px] text-zinc-500">Lakukan absensi mandiri Anda hari ini sebelum melakukan absensi siswa.</p>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                      teacherAttendance ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {teacherAttendance ? '✓ Sudah Check-In' : '● Belum Check-In'}
                    </span>
                  </div>

                  {teacherAttendance ? (
                    <div className="text-xs text-zinc-600 space-y-1 bg-white p-3 rounded-lg border border-zinc-150 font-medium">
                      <p>Tanggal Absen: <span className="font-bold text-zinc-900">{teacherAttendance.date}</span></p>
                      <p>Jam Check-In: <span className="font-bold text-zinc-900">{teacherAttendance.check_in_time}</span></p>
                      <p>Status Kehadiran: <span className="font-bold uppercase text-indigo-650">{teacherAttendance.status}</span></p>
                      <p>Koordinat Lokasi: <span className="font-mono text-zinc-500">{teacherAttendance.latitude}, {teacherAttendance.longitude}</span></p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {geolocationError && (
                        <p className="text-xs text-red-500 font-semibold">{geolocationError}</p>
                      )}
                      <button
                        onClick={handleTeacherCheckIn}
                        disabled={checkingInTeacher}
                        className="w-full sm:w-auto rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2.5 px-4 shadow-sm transition-colors flex items-center justify-center gap-2"
                      >
                        {checkingInTeacher ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Mulai Check-In Guru'}
                      </button>
                    </div>
                  )}
                </div>

                {/* 2. Absensi Siswa (Unlocked only if teacherAttendance exists) */}
                <div className="bg-[#fafbfc] rounded-2xl border border-zinc-200 p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-150 pb-3">
                    <div>
                      <h4 className="text-sm font-bold text-zinc-950">2. Presensi Harian Kelas Siswa</h4>
                      <p className="text-[11px] text-zinc-500">Tentukan status kehadiran murid kelas Anda.</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <input 
                        type="date"
                        value={attendanceDate}
                        onChange={(e) => setAttendanceDate(e.target.value)}
                        className="rounded-xl border border-zinc-250 bg-white py-1.5 px-3 text-xs text-zinc-900 outline-none"
                      />
                      <button
                        onClick={handleSaveAttendance}
                        disabled={savingAttendance || attendanceList.length === 0 || !teacherAttendance}
                        className="rounded-xl bg-[#d4af37] hover:bg-[#f3cb65] px-4 py-2 text-xs font-bold text-black flex items-center gap-1.5 transition-colors disabled:opacity-50"
                      >
                        {savingAttendance && <Loader2 className="h-3 w-3 animate-spin" />}
                        Simpan Absensi Siswa
                      </button>
                    </div>
                  </div>

                  {!teacherAttendance ? (
                    <div className="text-center py-10 bg-white border border-dashed border-zinc-250 rounded-xl">
                      <AlertCircle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                      <p className="text-xs text-zinc-500 font-bold">Harap lakukan Absensi Mandiri Guru terlebih dahulu untuk membuka absensi siswa.</p>
                    </div>
                  ) : reportsLoading ? (
                    <div className="flex h-48 items-center justify-center bg-white rounded-xl"><RefreshCw className="h-8 w-8 animate-spin text-[#d4af37]" /></div>
                  ) : attendanceList.length === 0 ? (
                    <p className="text-xs text-zinc-500 text-center py-10 bg-white rounded-xl">Tidak ada murid aktif di kelas ini.</p>
                  ) : (
                    <div className="overflow-x-auto bg-white rounded-xl border border-zinc-150">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-zinc-150 bg-zinc-50 text-zinc-500 font-bold uppercase tracking-wider">
                            <th className="px-4 py-3">Foto</th>
                            <th className="px-4 py-3">Nama Lengkap</th>
                            <th className="px-4 py-3">No. Induk</th>
                            <th className="px-4 py-3">Status Absen</th>
                            <th className="px-4 py-3">Catatan / Keterangan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                          {attendanceList.map((item, idx) => (
                            <tr key={item.student_id} className="hover:bg-zinc-50/40">
                              <td className="px-4 py-2.5">
                                <div className="h-8 w-8 overflow-hidden rounded-full border border-zinc-200">
                                  {item.photo ? (
                                    <img src={`http://${window.location.hostname}:8080/${item.photo}`} alt="" className="h-full w-full object-cover" />
                                  ) : (
                                    <div className="h-full w-full flex items-center justify-center text-[10px] font-bold text-zinc-400 bg-zinc-150 uppercase">
                                      {item.student_name.charAt(0)}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-2.5 font-bold text-zinc-850">{item.student_name}</td>
                              <td className="px-4 py-2.5 font-mono text-zinc-500">{item.registration_number || '-'}</td>
                              <td className="px-4 py-2.5">
                                <select
                                  value={item.status}
                                  onChange={(e) => {
                                    const updated = [...attendanceList];
                                    updated[idx].status = e.target.value;
                                    setAttendanceList(updated);
                                  }}
                                  className="rounded-lg border border-zinc-250 bg-white py-1 px-2 text-xs text-zinc-850 outline-none"
                                >
                                  <option value="hadir">🟢 Hadir</option>
                                  <option value="sakit">🟡 Sakit</option>
                                  <option value="izin">🔵 Izin</option>
                                  <option value="alfa">🔴 Alfa</option>
                                </select>
                              </td>
                              <td className="px-4 py-2.5">
                                <input 
                                  type="text"
                                  value={item.notes}
                                  onChange={(e) => {
                                    const updated = [...attendanceList];
                                    updated[idx].notes = e.target.value;
                                    setAttendanceList(updated);
                                  }}
                                  placeholder="Tulis alasan jika sakit/izin..."
                                  className="w-full rounded-lg border border-zinc-200 bg-white py-1 px-2.5 text-xs text-zinc-800 outline-none focus:border-[#d4af37]"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* 3. Jurnal Harian Kelas (Unlocked only if teacherAttendance exists) */}
                <div className="bg-[#fafbfc] rounded-2xl border border-zinc-200 p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-150 pb-3">
                    <div>
                      <h4 className="text-sm font-bold text-zinc-950">3. Jurnal Harian Kelas</h4>
                      <p className="text-[11px] text-zinc-500">Catat pokok materi & aktivitas pembelajaran kelas hari ini.</p>
                    </div>
                    <button
                      onClick={handleSaveJournal}
                      disabled={savingJournal || !teacherAttendance || !journalSubject || !journalActivities}
                      className="rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2 text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      {savingJournal && <Loader2 className="h-3 w-3 animate-spin" />}
                      Simpan Jurnal Kelas
                    </button>
                  </div>

                  {!teacherAttendance ? (
                    <div className="text-center py-10 bg-white border border-dashed border-zinc-250 rounded-xl">
                      <AlertCircle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                      <p className="text-xs text-zinc-500 font-bold">Harap lakukan Absensi Mandiri Guru terlebih dahulu untuk membuka pengisian jurnal.</p>
                    </div>
                  ) : (
                    <div className="space-y-4 bg-white p-4 rounded-xl border border-zinc-150">
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 mb-1">Materi / Tema Pembelajaran</label>
                        <input
                          type="text"
                          value={journalSubject}
                          onChange={(e) => setJournalSubject(e.target.value)}
                          placeholder="Contoh: Pengenalan Angka & Mewarnai Gambar Kebun"
                          className="w-full rounded-xl border border-zinc-200 bg-white py-2 px-3 text-xs text-zinc-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 mb-1">Aktivitas Pembelajaran (Detail)</label>
                        <textarea
                          rows={3}
                          value={journalActivities}
                          onChange={(e) => setJournalActivities(e.target.value)}
                          placeholder="Tuliskan detail aktivitas di kelas hari ini..."
                          className="w-full rounded-xl border border-zinc-200 bg-white py-2 px-3 text-xs text-zinc-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 mb-1">Catatan Tambahan (Opsional)</label>
                        <textarea
                          rows={2}
                          value={journalNotes}
                          onChange={(e) => setJournalNotes(e.target.value)}
                          placeholder="Catatan hambatan belajar atau info penting lainnya..."
                          className="w-full rounded-xl border border-zinc-200 bg-white py-2 px-3 text-xs text-zinc-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'announcements' && (
              /* Class Announcements Manager */
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-zinc-950">Mading Pengumuman Kelas</h3>
                  <p className="text-xs text-zinc-500">Kirim pengumuman khusus yang langsung tampil di portal wali murid kelas Anda.</p>
                </div>

                <form onSubmit={handleSaveAnnouncement} className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 space-y-3">
                  <h4 className="text-xs font-bold text-zinc-700">Tulis Pengumuman Baru</h4>
                  <div className="grid grid-cols-1 gap-3">
                    <input 
                      type="text"
                      required
                      value={annTitle}
                      onChange={(e) => setAnnTitle(e.target.value)}
                      placeholder="Judul pengumuman kelas (misal: Baju Olahraga Besok)"
                      className="rounded-lg border border-zinc-200 bg-white py-2 px-3 text-xs text-zinc-900 outline-none focus:border-[#d4af37]"
                    />
                    <textarea 
                      rows="3"
                      required
                      value={annContent}
                      onChange={(e) => setAnnContent(e.target.value)}
                      placeholder="Ketik isi pengumuman secara rinci..."
                      className="rounded-lg border border-zinc-200 bg-white py-2 px-3 text-xs text-zinc-900 outline-none focus:border-[#d4af37]"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={savingAnn}
                      className="rounded-xl bg-[#d4af37] hover:bg-[#f3cb65] px-4 py-2 text-xs font-bold text-black flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      {savingAnn && <Loader2 className="h-3 w-3 animate-spin" />}
                      Terbitkan Pengumuman
                    </button>
                  </div>
                </form>

                <div className="border-t border-zinc-150 pt-4 space-y-4">
                  <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Daftar Pengumuman Diterbitkan</h4>
                  {reportsLoading ? (
                    <div className="flex h-32 items-center justify-center"><RefreshCw className="h-6 w-6 animate-spin text-[#d4af37]" /></div>
                  ) : announcements.length === 0 ? (
                    <p className="text-xs text-zinc-400 text-center py-6">Belum ada pengumuman kelas.</p>
                  ) : (
                    <div className="space-y-3.5">
                      {announcements.map((item) => (
                        <div key={item.id} className="bg-white border border-zinc-150 p-4 rounded-xl relative shadow-sm">
                          <div className="flex justify-between items-start gap-4">
                            <div className="space-y-1">
                              <h5 className="text-xs font-bold text-zinc-800">{item.title}</h5>
                              <p className="text-[9px] text-[#aa8410] font-mono">
                                📅 {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </p>
                              <p className="text-xs text-zinc-600 font-light leading-relaxed mt-1.5 whitespace-pre-line">{item.content}</p>
                            </div>
                            <button
                              onClick={() => handleDeleteAnnouncement(item.id)}
                              className="text-zinc-400 hover:text-red-500 p-1 rounded-lg transition-colors shrink-0"
                              title="Hapus Pengumuman"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>

      </main>

      {/* Reports Dialog Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <h3 className="text-lg font-bold text-zinc-950">
                {editingReport ? 'Edit Laporan Perkembangan' : 'Input Laporan Perkembangan'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-zinc-800">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {activeTab === 'daily' ? (
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
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500">Aktivitas Murid Hari Ini (Pembelajaran & Sikap)</label>
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
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500">Catatan Khusus (Pesan untuk Orang Tua)</label>
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

      {/* Sticky Bottom Navigation for Mobile App Feel */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-zinc-200/80 z-40 flex justify-around py-3.5 shadow-[0_-8px_30px_rgb(0,0,0,0.06)] px-2 pb-safe">
        {filteredTabs.map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center gap-1 transition-all ${activeTab === tab.id ? 'text-[#aa8410] scale-105' : 'text-zinc-400 hover:text-zinc-600'}`}
          >
            {tab.icon}
            <span className="text-[9px] font-bold">{tab.label}</span>
          </button>
        ))}
      </div>

    </div>
  );
}
