import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../config/axios';
import { useAuth } from '../../context/AuthContext';
import { 
  BookOpen, FileText, Calendar, Plus, Edit2, Trash2, X, Upload, 
  Loader2, CheckCircle, AlertCircle, RefreshCw, LogOut, User, Award, Printer, ChevronRight, Megaphone, CheckSquare,
  Users, MapPin, ClipboardList, Info, Sparkles, BarChart2, TrendingUp, MessageCircle
} from 'lucide-react';

export default function TeacherDashboard() {
  const { logout, user, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const allTabs = [
    { id: 'attendance', label: 'Absensi & Jurnal', icon: <CheckSquare className="h-5 w-5" />, feature: 'absensi_siswa_jurnal' },
    { id: 'my_attendance', label: 'Absensi Anda', icon: <Calendar className="h-5 w-5" /> },
    { id: 'daily', label: 'Laporan Harian', icon: <BookOpen className="h-5 w-5" />, feature: 'perkembangan_siswa' },
    { id: 'semester', label: 'Rapor Semester', icon: <FileText className="h-5 w-5" />, feature: 'perkembangan_siswa' },
    { id: 'recap', label: 'Rekap Absensi', icon: <BarChart2 className="h-5 w-5" />, feature: 'absensi_siswa_jurnal' },
    { id: 'announcements', label: 'Pengumuman', icon: <Megaphone className="h-5 w-5" /> }
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Attendance State
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceList, setAttendanceList] = useState([]);
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [teacherAttendance, setTeacherAttendance] = useState(null);
  const [pinData, setPinData] = useState(null);
  const [checkingInTeacher, setCheckingInTeacher] = useState(false);
  const [geolocationError, setGeolocationError] = useState(null);
  const [journalSubject, setJournalSubject] = useState('');
  const [journalActivities, setJournalActivities] = useState('');
  const [journalNotes, setJournalNotes] = useState('');
  const [savingJournal, setSavingJournal] = useState(false);
  const [kbmList, setKbmList] = useState([]);

  // Class Announcements State
  const [announcements, setAnnouncements] = useState([]);
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [savingAnn, setSavingAnn] = useState(false);

  // Rekap Absensi State
  const [recapMonth, setRecapMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [recapData, setRecapData] = useState(null);
  const [recapLoading, setRecapLoading] = useState(false);

  // My Attendance History State
  const [myAttendanceMonth, setMyAttendanceMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [myAttendanceHistory, setMyAttendanceHistory] = useState([]);
  const [myAttendanceLoading, setMyAttendanceLoading] = useState(false);

  const fetchMyAttendance = async () => {
    setMyAttendanceLoading(true);
    try {
      const res = await api.get('/teacher/attendance/my-history', { params: { month: myAttendanceMonth } });
      setMyAttendanceHistory(res.data?.data || res.data || []);
    } catch (err) {
      console.error('Failed to load teacher attendance history', err);
    } finally {
      setMyAttendanceLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'my_attendance') {
      fetchMyAttendance();
    }
  }, [activeTab, myAttendanceMonth]);

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
    const fetchKbmSchedules = async () => {
      const classId = dashboardData?.teacher?.class_id;
      if (activeTab === 'attendance' && classId) {
        try {
          const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
          const dayName = days[new Date(attendanceDate).getDay()];
          const kbmRes = await api.get(`/admin/kbm-schedules/class/${classId}/day/${encodeURIComponent(dayName)}`);
          setKbmList(kbmRes.data || []);
        } catch (e) {
          console.error(e);
        }
      }
    };
    fetchKbmSchedules();
  }, [activeTab, attendanceDate, dashboardData]);

  useEffect(() => {
    if (user?.allowed_features) {
      const allowedKeys = filteredTabs.map(t => t.id);
      if (!allowedKeys.includes(activeTab)) {
        setActiveTab(allowedKeys[0] || 'attendance');
      }
    }
  }, [user, filteredTabs, activeTab]);

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

  const fetchAttendance = async () => {
    if (activeTab !== 'attendance') return;
    setReportsLoading(true);
    try {
      const response = await api.get('/teacher/attendance', {
        params: { date: attendanceDate }
      });
      setAttendanceList(response.data || []);
      
      try {
        const statusRes = await api.get('/teacher/attendance/status');
        setTeacherAttendance(statusRes.data || null);
      } catch (e) {
        console.error(e);
      }

      try {
        const pinRes = await api.get('/teacher/attendance/pin');
        setPinData(pinRes.data || null);
      } catch (e) {
        console.error(e);
      }

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

  const handleRefreshPin = async () => {
    try {
      const response = await api.post('/teacher/attendance/pin/refresh');
      setPinData(response.data || null);
    } catch (err) {
      console.error('Failed to refresh PIN', err);
    }
  };

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

  const fetchAttendanceRecap = async () => {
    if (activeTab !== 'recap') return;
    setRecapLoading(true);
    try {
      const response = await api.get('/teacher/attendance/recap', {
        params: { month: recapMonth }
      });
      setRecapData(response.data || null);
    } catch (err) {
      console.error('Failed to load attendance recap', err);
      setRecapData(null);
    } finally {
      setRecapLoading(false);
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

  useEffect(() => {
    fetchAttendanceRecap();
  }, [activeTab, recapMonth]);

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
      <div className="flex min-h-screen items-center justify-center bg-[#f0f2f8]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
          <p className="text-xs font-semibold text-zinc-500">Memuat portal guru...</p>
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f0f2f8] p-6 text-center">
        <div className="h-16 w-16 bg-red-100 border border-red-200 rounded-2xl flex items-center justify-center mb-4 text-red-500">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h2 className="text-lg font-bold text-zinc-900">Akses Portal Guru Gagal</h2>
        <p className="text-xs mt-2 max-w-sm text-zinc-500">{error || 'Gagal memuat profil bimbingan kelas Anda.'}</p>
        <button onClick={logout} className="mt-6 rounded-xl bg-indigo-600 text-white px-6 py-2.5 text-xs font-extrabold hover:bg-indigo-500 transition-all shadow-md">
          Keluar &amp; Login Kembali
        </button>
      </div>
    );
  }

  const { teacher, students: classStudents } = dashboardData;
  const totalStudents = classStudents.length;
  const presentCount = attendanceList.filter(s => s.status === 'hadir').length;

  const activeTabLabel = filteredTabs.find(t => t.id === activeTab)?.label || '';

  // ── Sidebar nav items config ──────────────────────────────────────────────
  const navGroups = [
    {
      group: 'Kelas Hari Ini',
      items: filteredTabs.filter(t => ['attendance'].includes(t.id))
    },
    {
      group: 'Perkembangan Murid',
      items: filteredTabs.filter(t => ['daily', 'semester'].includes(t.id))
    },
    {
      group: 'Statistik & Info',
      items: filteredTabs.filter(t => ['recap', 'announcements'].includes(t.id))
    },
  ].filter(g => g.items.length > 0);

  return (
    <div className="flex min-h-screen bg-[#f0f2f8] font-sans text-zinc-800">
      <button onClick={() => navigate('/teacher/communication')} className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-3 text-xs font-bold text-white shadow-xl hover:bg-indigo-700"><MessageCircle className="h-5 w-5" />Komunikasi</button>

      {/* ═══════════════════════════════════════════════════════
          SIDEBAR
      ═══════════════════════════════════════════════════════ */}

      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar panel */}
      <aside className={`
        fixed top-0 left-0 h-full z-50 flex flex-col
        w-[260px] bg-white border-r border-zinc-200
        shadow-[4px_0_24px_rgba(0,0,0,0.06)]
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:static md:shadow-none
      `}>

        {/* Sidebar Brand Header */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-zinc-100">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-md shadow-indigo-200 shrink-0">
            <span className="text-white font-black text-base">G</span>
          </div>
          <div className="min-w-0">
            <p className="font-black text-sm text-zinc-900 leading-tight">Portal Guru</p>
            <p className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest truncate">
              {teacher.class_name || 'Bimbingan'}
            </p>
          </div>
          {/* Close button (mobile only) */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto md:hidden p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Teacher Profile Card in Sidebar */}
        <div className="mx-3 mt-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100/50 border border-indigo-100 p-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-full overflow-hidden border-2 border-indigo-200 bg-white shadow-sm shrink-0 flex items-center justify-center text-sm font-extrabold text-indigo-600 uppercase">
              {teacher.photo
                ? <img src={`http://${window.location.hostname}:8080/${teacher.photo}`} alt="" className="h-full w-full object-cover" />
                : teacher.full_name.charAt(0)
              }
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black text-zinc-900 truncate leading-tight">{teacher.full_name}</p>
              <p className="text-[9px] font-mono text-zinc-500 truncate">NUPTK: {teacher.nuptk || '-'}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`h-1.5 w-1.5 rounded-full ${teacherAttendance ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'}`} />
                <span className={`text-[9px] font-bold uppercase ${teacherAttendance ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {teacherAttendance ? 'Hadir' : 'Belum Absen'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Groups */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {navGroups.map(group => (
            <div key={group.group}>
              <p className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-400 px-2 mb-2">{group.group}</p>
              <ul className="space-y-0.5">
                {group.items.map(tab => (
                  <li key={tab.id}>
                    <button
                      onClick={() => { setActiveTab(tab.id); setSidebarOpen(false); }}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left text-sm font-semibold transition-all ${
                        activeTab === tab.id
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                          : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                      }`}
                    >
                      <span className={`shrink-0 ${activeTab === tab.id ? 'text-white' : 'text-zinc-400'}`}>
                        {tab.icon}
                      </span>
                      <span className="text-xs font-bold">{tab.label}</span>
                      {activeTab === tab.id && (
                        <ChevronRight className="h-3.5 w-3.5 ml-auto opacity-60" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>



        {/* Logout Button at Bottom */}
        <div className="border-t border-zinc-100 p-3">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-red-500 hover:bg-red-50 font-bold text-xs transition-all"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Keluar dari Akun
          </button>
        </div>
      </aside>

      {/* ═══════════════════════════════════════════════════════
          MAIN CONTENT AREA
      ═══════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">

        {/* Top Header Bar */}
        <header className="h-14 bg-white border-b border-zinc-200 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 shrink-0">
          <div className="flex items-center gap-3">
            {/* Hamburger for mobile */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl hover:bg-zinc-100 text-zinc-600 transition-all"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-zinc-400">Portal Guru</span>
              <ChevronRight className="h-3.5 w-3.5 text-zinc-300" />
              <span className="font-extrabold text-zinc-900">{activeTabLabel}</span>
            </div>
          </div>

          {/* Header Right: date + stats */}
          <div className="flex items-center gap-3">
            {/* Today Date */}
            <div className="hidden sm:flex items-center gap-1.5 bg-zinc-100 px-3 py-1.5 rounded-xl">
              <Calendar className="h-3.5 w-3.5 text-zinc-500" />
              <span className="text-[10px] font-bold text-zinc-600">
                {new Date().toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>

            {/* Stat Pill: Total Siswa */}
            <div className="hidden sm:flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-xl">
              <Users className="h-3.5 w-3.5 text-indigo-500" />
              <span className="text-[10px] font-extrabold text-indigo-700">{totalStudents} Murid</span>
            </div>

            {/* Stat Pill: Kehadiran */}
            {activeTab === 'attendance' && (
              <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl">
                <ClipboardList className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-[10px] font-extrabold text-emerald-700">{presentCount}/{totalStudents} Hadir</span>
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 space-y-5 overflow-auto pb-20 md:pb-6">

          {/* Global Message Toast */}
          {message && (
            <div className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 text-xs font-bold border ${
              message.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              {message.type === 'success' ? <CheckCircle className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
              {message.text}
              <button onClick={() => setMessage(null)} className="ml-auto opacity-60 hover:opacity-100"><X className="h-3.5 w-3.5" /></button>
            </div>
          )}

          {/* Student Selector & Profile Card (Daily/Semester only) */}
          {(activeTab === 'daily' || activeTab === 'semester') && (
            <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
                {/* Student Dropdown Selector */}
                <div className="w-full sm:w-64">
                  <label className="block text-[9px] font-extrabold uppercase tracking-widest text-zinc-400 mb-1.5">Pilih Murid Bimbingan</label>
                  <select
                    value={selectedStudent?.id || ''}
                    onChange={(e) => {
                      const selected = classStudents.find(s => String(s.id) === String(e.target.value));
                      if (selected) setSelectedStudent(selected);
                    }}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2 px-3 text-xs font-bold text-zinc-800 outline-none focus:border-indigo-650 focus:ring-2 focus:ring-indigo-100"
                  >
                    <option value="" disabled>-- Pilih Murid --</option>
                    {classStudents.map(student => (
                      <option key={student.id} value={student.id}>
                        👦 {student.full_name} ({student.registration_number || '-'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selected Student Profile Summary */}
                {selectedStudent && (
                  <div className="flex items-center gap-3 border-t sm:border-t-0 sm:border-l border-zinc-200 pt-3 sm:pt-0 sm:pl-4">
                    <div className="h-10 w-10 rounded-full overflow-hidden border border-zinc-200 bg-zinc-50 flex items-center justify-center text-sm font-extrabold text-indigo-600 uppercase shrink-0">
                      {selectedStudent.photo
                        ? <img src={`http://${window.location.hostname}:8080/${selectedStudent.photo}`} alt="" className="h-full w-full object-cover" />
                        : selectedStudent.full_name.charAt(0)
                      }
                    </div>
                    <div>
                      <h2 className="text-xs font-black text-zinc-900 leading-tight">{selectedStudent.full_name}</h2>
                      <p className="text-[9px] text-zinc-500 font-medium mt-0.5">
                        NISN: <span className="font-mono">{selectedStudent.registration_number || '-'}</span>
                        &nbsp;|&nbsp;{selectedStudent.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {selectedStudent && (
                <button
                  onClick={openAddModal}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-indigo-100 shrink-0 self-start md:self-auto"
                >
                  <Plus className="h-4 w-4" />
                  {activeTab === 'daily' ? 'Input Laporan Harian' : 'Input Rapor Semester'}
                </button>
              )}
            </div>
          )}

          {/* ─── TAB: ABSENSI & JURNAL ─────────────────────────────── */}
          {activeTab === 'attendance' && (
            <div className="space-y-5">

              {/* 1. Guru Self Check-in */}
              <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-zinc-100 pb-4">
                  <div>
                    <h4 className="text-sm font-black text-zinc-900 flex items-center gap-2">
                      <span className="h-7 w-7 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                        <MapPin className="h-4 w-4" />
                      </span>
                      Absensi Mandiri Guru (GPS)
                    </h4>
                    <p className="text-[10px] text-zinc-500 mt-1 ml-9">Lakukan absensi mandiri sebelum mengisi presensi siswa.</p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider self-start sm:self-auto ${
                    teacherAttendance ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {teacherAttendance ? '✓ Sudah Check-In' : '● Belum Check-In'}
                  </span>
                </div>

                {/* PIN Dinamis Kelas */}
                <div className="border-t border-zinc-150 pt-4 flex flex-col md:flex-row justify-between md:items-center gap-4">
                  <div>
                    <h5 className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                      PIN Absensi Kiosk Kelas
                    </h5>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Berikan PIN ini kepada siswa untuk absensi mandiri di tablet/kiosk sekolah.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {pinData ? (
                      <div className="bg-zinc-100 border border-zinc-200 rounded-xl px-4 py-2 text-lg font-mono font-bold tracking-wider text-zinc-900 shadow-inner">
                        {pinData.pin}
                      </div>
                    ) : (
                      <span className="text-xs text-zinc-400 font-mono">Belum digenerate</span>
                    )}
                    <button
                      onClick={handleRefreshPin}
                      className="px-3 py-2 rounded-xl border border-zinc-205 text-zinc-700 hover:bg-zinc-50 text-[10px] font-bold transition-all shrink-0"
                    >
                      Perbarui PIN
                    </button>
                    <a
                      href="/kiosk"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold transition-all shrink-0"
                    >
                      Buka Kiosk
                    </a>
                  </div>
                </div>

                {teacherAttendance ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { label: 'Tanggal', value: teacherAttendance.date },
                      { label: 'Jam Check-In', value: teacherAttendance.check_in_time },
                      { label: 'Status', value: teacherAttendance.status?.toUpperCase(), colored: true },
                    ].map(item => (
                      <div key={item.label} className="bg-zinc-50 rounded-xl p-3 border border-zinc-200">
                        <p className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">{item.label}</p>
                        <p className={`text-xs font-extrabold mt-0.5 ${item.colored ? 'text-indigo-600' : 'text-zinc-900'}`}>{item.value}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {geolocationError && <p className="text-xs text-red-500 font-semibold">{geolocationError}</p>}
                    <button
                      onClick={handleTeacherCheckIn}
                      disabled={checkingInTeacher}
                      className="w-full sm:w-auto rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-3 px-6 shadow-md shadow-indigo-100 transition-all flex items-center justify-center gap-2"
                    >
                      {checkingInTeacher ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                      {checkingInTeacher ? 'Mendeteksi lokasi...' : 'Mulai Check-In Guru'}
                    </button>
                  </div>
                )}
              </div>

              {/* 2. Presensi Siswa */}
              <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-4">
                  <div>
                    <h4 className="text-sm font-black text-zinc-900 flex items-center gap-2">
                      <span className="h-7 w-7 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                        <ClipboardList className="h-4 w-4" />
                      </span>
                      Presensi Harian Kelas
                    </h4>
                    <p className="text-[10px] text-zinc-500 mt-1 ml-9">Tentukan status kehadiran murid kelas Anda hari ini.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={attendanceDate}
                      onChange={(e) => setAttendanceDate(e.target.value)}
                      className="rounded-xl border border-zinc-200 bg-zinc-50 py-2 px-3 text-xs text-zinc-800 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                    />
                    <button
                      onClick={handleSaveAttendance}
                      disabled={savingAttendance || attendanceList.length === 0 || !teacherAttendance}
                      className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-100 disabled:opacity-30"
                    >
                      {savingAttendance && <Loader2 className="h-3 w-3 animate-spin" />}
                      Simpan
                    </button>
                  </div>
                </div>

                {!teacherAttendance ? (
                  <div className="text-center py-10 border border-dashed border-zinc-200 rounded-xl bg-zinc-50">
                    <AlertCircle className="h-7 w-7 text-amber-400 mx-auto mb-2" />
                    <p className="text-xs text-zinc-500 font-bold max-w-xs mx-auto">Lakukan Absensi Mandiri Guru terlebih dahulu.</p>
                  </div>
                ) : reportsLoading ? (
                  <div className="flex h-40 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>
                ) : attendanceList.length === 0 ? (
                  <p className="text-xs text-zinc-500 text-center py-8">Tidak ada murid aktif di kelas ini.</p>
                ) : (
                  <div className="space-y-2.5">
                    {attendanceList.map((item, idx) => (
                      <div key={item.student_id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-zinc-50 border border-zinc-200 rounded-xl hover:border-indigo-200 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 overflow-hidden rounded-full border border-zinc-200 bg-white flex items-center justify-center text-xs font-bold text-zinc-500">
                            {item.photo
                              ? <img src={`http://${window.location.hostname}:8080/${item.photo}`} alt="" className="h-full w-full object-cover" />
                              : item.student_name.charAt(0)
                            }
                          </div>
                          <div>
                            <p className="text-xs font-extrabold text-zinc-900">{item.student_name}</p>
                            <p className="text-[9px] font-mono text-zinc-400">NISN: {item.registration_number || '-'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <select
                            value={item.status}
                            onChange={(e) => {
                              const updated = [...attendanceList];
                              updated[idx].status = e.target.value;
                              setAttendanceList(updated);
                            }}
                            className="rounded-xl border border-zinc-200 bg-white py-2 px-3 text-xs text-zinc-800 outline-none focus:border-indigo-600 shrink-0"
                          >
                            <option value="hadir">🟢 Hadir</option>
                            <option value="sakit">🟡 Sakit</option>
                            <option value="izin">🔵 Izin</option>
                            <option value="alfa">🔴 Alfa</option>
                          </select>
                          <input
                            type="text"
                            value={item.notes}
                            onChange={(e) => {
                              const updated = [...attendanceList];
                              updated[idx].notes = e.target.value;
                              setAttendanceList(updated);
                            }}
                            placeholder="Keterangan..."
                            className="flex-1 sm:w-48 rounded-xl border border-zinc-200 bg-white py-2 px-3 text-xs text-zinc-900 outline-none focus:border-indigo-600"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 3. Jurnal Harian */}
              <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-zinc-100 pb-4">
                  <div>
                    <h4 className="text-sm font-black text-zinc-900 flex items-center gap-2">
                      <span className="h-7 w-7 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
                        <Award className="h-4 w-4" />
                      </span>
                      Jurnal Harian Kelas
                    </h4>
                    <p className="text-[10px] text-zinc-500 mt-1 ml-9">Catat materi & aktivitas pembelajaran kelas hari ini.</p>
                  </div>
                  <button
                    onClick={handleSaveJournal}
                    disabled={savingJournal || !teacherAttendance || !journalSubject || !journalActivities}
                    className="rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 transition-all disabled:opacity-30"
                  >
                    {savingJournal && <Loader2 className="h-3 w-3 animate-spin" />}
                    Simpan Jurnal
                  </button>
                </div>

                {!teacherAttendance ? (
                  <div className="text-center py-8 border border-dashed border-zinc-200 rounded-xl bg-zinc-50">
                    <AlertCircle className="h-7 w-7 text-amber-400 mx-auto mb-2" />
                    <p className="text-xs text-zinc-500 font-bold">Lakukan absensi mandiri guru terlebih dahulu.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {kbmList && kbmList.length > 0 && (
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-amber-500 mb-1.5">Auto-Fill dari Jadwal KBM Hari Ini</label>
                        <select
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val) {
                              setJournalSubject(val);
                            }
                          }}
                          className="w-full rounded-xl border border-amber-300 bg-amber-50/30 py-2.5 px-3.5 text-xs text-zinc-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                        >
                          <option value="">-- Pilih Mata Pelajaran Jadwal --</option>
                          {kbmList.map((sch) => (
                            <option key={sch.id} value={sch.subject_name}>
                              {sch.start_time.slice(0, 5)} - {sch.end_time.slice(0, 5)} : {sch.subject_name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Materi / Tema Pembelajaran</label>
                      <input type="text" value={journalSubject} onChange={e => setJournalSubject(e.target.value)}
                        placeholder="Contoh: Pengenalan Angka & Mewarnai Gambar"
                        className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 px-3.5 text-xs text-zinc-900 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Aktivitas Pembelajaran (Detail)</label>
                      <textarea rows={3} value={journalActivities} onChange={e => setJournalActivities(e.target.value)}
                        placeholder="Tuliskan detail aktivitas di kelas hari ini..."
                        className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 px-3.5 text-xs text-zinc-900 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Catatan Tambahan (Opsional)</label>
                      <textarea rows={2} value={journalNotes} onChange={e => setJournalNotes(e.target.value)}
                        placeholder="Catatan hambatan belajar atau info penting lainnya..."
                        className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 px-3.5 text-xs text-zinc-900 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 resize-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─── TAB: LAPORAN HARIAN ─────────────────────────────────── */}
          {activeTab === 'daily' && (
            <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm min-h-[360px]">
              {!selectedStudent ? (
                <div className="flex flex-col items-center justify-center h-64 text-zinc-400">
                  <Users className="h-9 w-9 text-zinc-300 mb-2" />
                  <p className="text-xs font-bold">Pilih murid dari sidebar untuk memuat laporan harian.</p>
                </div>
              ) : reportsLoading ? (
                <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>
              ) : reports.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-zinc-400 border border-dashed border-zinc-200 rounded-2xl bg-zinc-50">
                  <Info className="h-7 w-7 text-zinc-300 mb-1.5" />
                  <p className="text-xs font-bold">Belum ada laporan harian untuk murid ini.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reports.map((r) => (
                    <div key={r.id} className="border border-zinc-200 bg-white rounded-2xl p-4 hover:shadow-md transition-shadow">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                        <div className="space-y-3 flex-1">
                          <span className="inline-block text-[9px] font-bold uppercase tracking-widest bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full">
                            📅 {new Date(r.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </span>
                          <div className="space-y-2.5">
                            <div>
                              <h4 className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Aktivitas Murid</h4>
                              <p className="text-xs text-zinc-800 leading-relaxed mt-0.5 whitespace-pre-line font-medium">{r.activities || '-'}</p>
                            </div>
                            {r.notes && (
                              <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-100">
                                <h4 className="text-[9px] font-bold text-amber-800 uppercase tracking-widest">Catatan Khusus Orang Tua</h4>
                                <p className="text-xs text-zinc-700 leading-relaxed mt-0.5 whitespace-pre-line">{r.notes}</p>
                              </div>
                            )}
                          </div>
                        </div>
                        {r.photo && (
                          <div className="h-24 w-full sm:w-24 shrink-0 overflow-hidden rounded-xl border border-zinc-200">
                            <img src={`http://${window.location.hostname}:8080/${r.photo}`} alt="" className="h-full w-full object-cover" />
                          </div>
                        )}
                      </div>
                      <div className="flex justify-end gap-3 mt-3 pt-3 border-t border-zinc-100">
                        <button onClick={() => openEditModal(r)} className="text-xs font-bold text-zinc-500 hover:text-indigo-600 flex items-center gap-1"><Edit2 className="h-3.5 w-3.5" /> Edit</button>
                        <button onClick={() => handleDelete(r.id)} className="text-xs font-bold text-zinc-500 hover:text-red-500 flex items-center gap-1"><Trash2 className="h-3.5 w-3.5" /> Hapus</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ─── TAB: RAPOR SEMESTER ─────────────────────────────────── */}
          {activeTab === 'semester' && (
            <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm min-h-[360px]">
              {!selectedStudent ? (
                <div className="flex flex-col items-center justify-center h-64 text-zinc-400">
                  <Users className="h-9 w-9 text-zinc-300 mb-2" />
                  <p className="text-xs font-bold">Pilih murid dari sidebar untuk memuat rapor semester.</p>
                </div>
              ) : reportsLoading ? (
                <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>
              ) : reports.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-zinc-400 border border-dashed border-zinc-200 rounded-2xl bg-zinc-50">
                  <Info className="h-7 w-7 text-zinc-300 mb-1.5" />
                  <p className="text-xs font-bold">Belum ada data rapor semester murid ini.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {reports.map((r) => (
                    <div key={r.id} className="border border-zinc-200 rounded-2xl p-5 bg-zinc-50/30 space-y-4">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-zinc-200 pb-4">
                        <div>
                          <h4 className="text-sm font-black text-zinc-900">Rapor Hasil Belajar</h4>
                          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5">Tahun Ajaran: {r.academic_year} | Semester: {r.semester}</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => window.print()} className="rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 px-3.5 py-2 text-xs font-extrabold text-zinc-700 flex items-center gap-1.5 shadow-sm"><Printer className="h-3.5 w-3.5" /> Cetak</button>
                          <button onClick={() => openEditModal(r)} className="rounded-xl border border-zinc-200 bg-white hover:bg-indigo-50 hover:text-indigo-600 px-3.5 py-2 text-xs font-extrabold text-zinc-600 flex items-center gap-1.5 shadow-sm"><Edit2 className="h-3.5 w-3.5" /> Edit</button>
                          <button onClick={() => handleDelete(r.id)} className="rounded-xl border border-zinc-200 bg-white hover:bg-red-50 hover:text-red-500 px-3.5 py-2 text-xs font-extrabold text-zinc-600 flex items-center gap-1.5 shadow-sm"><Trash2 className="h-3.5 w-3.5" /> Hapus</button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        {[
                          ['1. Nilai Agama & Moral', r.religion_morals],
                          ['2. Fisik & Motorik', r.physical_motor],
                          ['3. Kognitif', r.cognitive],
                          ['4. Bahasa & Komunikasi', r.language],
                          ['5. Sosial & Emosional', r.social_emotional],
                          ['6. Seni & Kreativitas', r.art],
                        ].map(([label, val]) => (
                          <div key={label} className="space-y-1.5">
                            <p className="font-extrabold text-zinc-700">{label}</p>
                            <p className="text-zinc-800 bg-white p-3 rounded-xl border border-zinc-200 leading-relaxed whitespace-pre-line font-medium shadow-sm">{val || '-'}</p>
                          </div>
                        ))}
                      </div>
                      <div className="pt-3.5 border-t border-zinc-200">
                        <p className="font-extrabold text-zinc-700 text-xs">Catatan & Masukan Umum:</p>
                        <p className="text-xs text-zinc-600 italic bg-white p-3 rounded-xl border border-zinc-200 mt-1 leading-relaxed whitespace-pre-line font-medium shadow-sm">{r.general_notes || '-'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ─── TAB: RIWAYAT ABSEN GURU ──────────────────────────────────── */}
          {activeTab === 'my_attendance' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="text-base font-black text-zinc-900 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-indigo-600" /> Riwayat Kehadiran Anda
                  </h3>
                  <p className="text-[11px] text-zinc-500 mt-0.5">Catatan check-in GPS dan jam kerja Anda</p>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Bulan:</label>
                  <input type="month" value={myAttendanceMonth} onChange={e => setMyAttendanceMonth(e.target.value)}
                    className="border border-zinc-200 rounded-xl px-3 py-2 text-xs font-bold text-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-white"
                  />
                </div>
              </div>

              {myAttendanceLoading ? (
                <div className="flex h-64 items-center justify-center bg-white border border-zinc-200 rounded-2xl">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                </div>
              ) : myAttendanceHistory.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-zinc-300 p-12 text-center text-zinc-500 text-xs">
                  Tidak ada data absensi untuk bulan ini.
                </div>
              ) : (
                <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-zinc-50 border-b border-zinc-200 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                          <th className="px-5 py-3.5">Tanggal</th>
                          <th className="px-5 py-3.5">Jam Masuk</th>
                          <th className="px-5 py-3.5">Jam Pulang</th>
                          <th className="px-5 py-3.5">Status</th>
                          <th className="px-5 py-3.5">Lokasi GPS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200 text-xs font-medium text-zinc-700">
                        {myAttendanceHistory.map((item) => (
                          <tr key={item.id} className="hover:bg-zinc-50/50">
                            <td className="px-5 py-4 font-bold text-zinc-900">
                              {new Date(item.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                            </td>
                            <td className="px-5 py-4 font-mono text-zinc-800">{item.check_in_time || '-'}</td>
                            <td className="px-5 py-4 font-mono text-zinc-800">{item.check_out_time || '-'}</td>
                            <td className="px-5 py-4">
                              <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                                item.status === 'hadir' ? 'bg-emerald-50 text-emerald-700' :
                                item.status === 'terlambat' ? 'bg-amber-50 text-amber-700' :
                                'bg-rose-50 text-rose-700'
                              }`}>
                                {item.status}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-[10px] text-zinc-500">
                              {item.latitude && item.longitude ? (
                                <a 
                                  href={`https://www.google.com/maps?q=${item.latitude},${item.longitude}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-indigo-600 hover:underline flex items-center gap-1"
                                >
                                  <MapPin className="h-3 w-3" /> Lihat Maps
                                </a>
                              ) : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── TAB: REKAP ABSENSI ──────────────────────────────────── */}
          {activeTab === 'recap' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="text-base font-black text-zinc-900 flex items-center gap-2">
                    <BarChart2 className="h-5 w-5 text-indigo-600" /> Rekap Kehadiran Bulanan
                  </h3>
                  <p className="text-[11px] text-zinc-500 mt-0.5">Ringkasan kehadiran seluruh murid dalam satu bulan</p>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Bulan:</label>
                  <input type="month" value={recapMonth} onChange={e => setRecapMonth(e.target.value)}
                    className="border border-zinc-200 rounded-xl px-3 py-2 text-xs font-bold text-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-white"
                  />
                </div>
              </div>

              {recapLoading ? (
                <div className="flex h-64 items-center justify-center bg-white border border-zinc-200 rounded-2xl">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                </div>
              ) : !recapData || !recapData.students || recapData.students.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 border border-dashed border-zinc-200 rounded-2xl bg-white text-zinc-400">
                  <BarChart2 className="h-9 w-9 mb-2 text-zinc-300" />
                  <p className="text-xs font-bold">Belum ada data kehadiran untuk bulan ini.</p>
                </div>
              ) : (
                <>
                  {/* Summary cards */}
                  {(() => {
                    const st = recapData.students;
                    const cards = [
                      { label: 'Total Hadir', count: st.reduce((s,x) => s+x.hadir,0), bg:'bg-emerald-50', text:'text-emerald-700', border:'border-emerald-200', dot:'bg-emerald-500' },
                      { label: 'Total Sakit', count: st.reduce((s,x) => s+x.sakit,0), bg:'bg-amber-50',   text:'text-amber-700',   border:'border-amber-200',   dot:'bg-amber-500' },
                      { label: 'Total Izin',  count: st.reduce((s,x) => s+x.izin,0),  bg:'bg-sky-50',     text:'text-sky-700',     border:'border-sky-200',     dot:'bg-sky-500' },
                      { label: 'Total Alfa',  count: st.reduce((s,x) => s+x.alfa,0),  bg:'bg-red-50',     text:'text-red-700',     border:'border-red-200',     dot:'bg-red-500' },
                    ];
                    return (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {cards.map(c => (
                          <div key={c.label} className={`${c.bg} border ${c.border} rounded-2xl p-4 flex flex-col gap-1.5`}>
                            <div className="flex items-center gap-1.5">
                              <span className={`h-2 w-2 rounded-full ${c.dot}`} />
                              <span className={`text-[10px] font-bold uppercase tracking-wider ${c.text}`}>{c.label}</span>
                            </div>
                            <p className={`text-2xl font-black ${c.text}`}>{c.count} <span className="text-xs font-normal opacity-70">kali</span></p>
                          </div>
                        ))}
                      </div>
                    );
                  })()}

                  <div className="flex items-center gap-2 p-3 rounded-xl bg-indigo-50 border border-indigo-100">
                    <Calendar className="h-4 w-4 text-indigo-600 shrink-0" />
                    <p className="text-xs font-bold text-indigo-700">
                      Hari sekolah tercatat: <span className="font-black">{recapData.students[0]?.school_days ?? 0} hari</span>
                      <span className="font-normal ml-2 text-indigo-500">({new Date(recapMonth + '-01').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })})</span>
                    </p>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-zinc-50 border-b border-zinc-200">
                          <th className="text-left px-4 py-3 font-bold text-zinc-500 uppercase tracking-wider text-[10px]">#</th>
                          <th className="text-left px-4 py-3 font-bold text-zinc-500 uppercase tracking-wider text-[10px]">Nama Murid</th>
                          <th className="text-center px-3 py-3 font-bold text-[10px] text-emerald-700 uppercase">Hadir</th>
                          <th className="text-center px-3 py-3 font-bold text-[10px] text-amber-600 uppercase">Sakit</th>
                          <th className="text-center px-3 py-3 font-bold text-[10px] text-sky-600 uppercase">Izin</th>
                          <th className="text-center px-3 py-3 font-bold text-[10px] text-red-600 uppercase">Alfa</th>
                          <th className="text-left px-4 py-3 font-bold text-zinc-500 uppercase tracking-wider text-[10px] min-w-[120px]">Grafik Kehadiran</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {recapData.students.map((st, idx) => {
                          const total = st.school_days || 1;
                          const hadirPct = Math.round((st.hadir / total) * 100);
                          const sakitPct = Math.round((st.sakit / total) * 100);
                          const izinPct  = Math.round((st.izin  / total) * 100);
                          const alfaPct  = Math.round((st.alfa  / total) * 100);
                          const rate = Math.round((st.hadir / total) * 100);
                          const rateColor = rate >= 80 ? 'text-emerald-600' : rate >= 60 ? 'text-amber-600' : 'text-red-600';
                          return (
                            <tr key={st.student_id} className="hover:bg-zinc-50/70 transition-colors">
                              <td className="px-4 py-3.5 text-zinc-400 font-mono text-[11px]">{idx + 1}</td>
                              <td className="px-4 py-3.5">
                                <div className="flex items-center gap-2.5">
                                  <div className="h-8 w-8 rounded-full overflow-hidden border border-zinc-200 bg-zinc-100 shrink-0 flex items-center justify-center text-[10px] font-bold text-zinc-500 uppercase">
                                    {st.photo ? <img src={`http://${window.location.hostname}:8080/${st.photo}`} alt="" className="h-full w-full object-cover" /> : st.student_name.charAt(0)}
                                  </div>
                                  <div>
                                    <p className="font-bold text-zinc-900 text-xs">{st.student_name}</p>
                                    <p className="text-[9px] font-mono text-zinc-400">{st.registration_number || '-'}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 py-3.5 text-center"><span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-emerald-50 text-emerald-700 font-black text-xs border border-emerald-200">{st.hadir}</span></td>
                              <td className="px-3 py-3.5 text-center"><span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-amber-50 text-amber-700 font-black text-xs border border-amber-200">{st.sakit}</span></td>
                              <td className="px-3 py-3.5 text-center"><span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-sky-50 text-sky-700 font-black text-xs border border-sky-200">{st.izin}</span></td>
                              <td className="px-3 py-3.5 text-center"><span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-red-50 text-red-700 font-black text-xs border border-red-200">{st.alfa}</span></td>
                              <td className="px-4 py-3.5">
                                <div className="flex flex-col gap-1 min-w-[110px]">
                                  <div className="flex h-2.5 rounded-full overflow-hidden bg-zinc-100 w-full">
                                    {hadirPct > 0 && <div className="bg-emerald-400" style={{ width: `${hadirPct}%` }} />}
                                    {sakitPct > 0 && <div className="bg-amber-400" style={{ width: `${sakitPct}%` }} />}
                                    {izinPct  > 0 && <div className="bg-sky-400"    style={{ width: `${izinPct}%` }} />}
                                    {alfaPct  > 0 && <div className="bg-red-400"    style={{ width: `${alfaPct}%` }} />}
                                  </div>
                                  <p className={`text-[10px] font-extrabold ${rateColor}`}>{rate}% Hadir</p>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {[['Hadir','bg-emerald-400'],['Sakit','bg-amber-400'],['Izin','bg-sky-400'],['Alfa','bg-red-400']].map(([l,c]) => (
                      <div key={l} className="flex items-center gap-1.5">
                        <div className={`h-2.5 w-5 rounded-full ${c}`} />
                        <span className="text-[10px] font-bold text-zinc-500">{l}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ─── TAB: PENGUMUMAN ─────────────────────────────────────── */}
          {activeTab === 'announcements' && (
            <div className="space-y-5">
              {/* Form Buat Pengumuman */}
              <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
                <h3 className="text-sm font-black text-zinc-900 flex items-center gap-2 mb-4">
                  <span className="h-7 w-7 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                    <Megaphone className="h-4 w-4" />
                  </span>
                  Buat Pengumuman Kelas
                </h3>
                <form onSubmit={handleSaveAnnouncement} className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Judul Pengumuman</label>
                    <input type="text" required value={annTitle} onChange={e => setAnnTitle(e.target.value)}
                      placeholder="Contoh: Libur Hari Batik Nasional"
                      className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 px-3.5 text-xs text-zinc-900 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Isi Pengumuman</label>
                    <textarea rows={3} required value={annContent} onChange={e => setAnnContent(e.target.value)}
                      placeholder="Sampaikan informasi penting kepada orang tua murid..."
                      className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 px-3.5 text-xs text-zinc-900 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 resize-none"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button type="submit" disabled={savingAnn}
                      className="rounded-xl bg-amber-500 hover:bg-amber-400 text-white px-5 py-2.5 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-amber-100 disabled:opacity-30"
                    >
                      {savingAnn && <Loader2 className="h-3 w-3 animate-spin" />}
                      <Megaphone className="h-3.5 w-3.5" /> Terbitkan Pengumuman
                    </button>
                  </div>
                </form>
              </div>

              {/* Daftar Pengumuman */}
              <div className="space-y-3">
                {reportsLoading ? (
                  <div className="flex h-32 items-center justify-center bg-white border border-zinc-200 rounded-2xl">
                    <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                  </div>
                ) : announcements.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 border border-dashed border-zinc-200 rounded-2xl bg-white text-zinc-400">
                    <Megaphone className="h-7 w-7 text-zinc-300 mb-1.5" />
                    <p className="text-xs font-bold">Belum ada pengumuman yang diterbitkan.</p>
                  </div>
                ) : (
                  announcements.map(ann => (
                    <div key={ann.id} className="bg-white border border-zinc-200 rounded-2xl p-4.5 shadow-sm hover:border-amber-200 transition-colors">
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1.5 flex-1">
                          <h4 className="text-sm font-black text-zinc-900">{ann.title}</h4>
                          <p className="text-xs text-zinc-600 leading-relaxed whitespace-pre-line">{ann.content}</p>
                          <p className="text-[9px] font-mono text-zinc-400">
                            {ann.created_at ? new Date(ann.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                          </p>
                        </div>
                        <button onClick={() => handleDeleteAnnouncement(ann.id)} className="p-2 rounded-xl text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-all shrink-0">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ═══════════════════════════════════════════════════════
          MODAL: ADD / EDIT REPORT
      ═══════════════════════════════════════════════════════ */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full sm:max-w-xl rounded-t-3xl sm:rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
              <div>
                <h3 className="text-sm font-black text-zinc-900">
                  {editingReport ? '✏️ Edit Laporan' : '➕ Tambah Laporan'}
                </h3>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  {activeTab === 'daily' ? 'Laporan Harian' : 'Rapor Semester'} — {selectedStudent?.full_name}
                </p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-all">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
              {activeTab === 'daily' ? (
                <>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">Tanggal Kegiatan</label>
                    <input type="date" required value={reportDate} onChange={e => setReportDate(e.target.value)}
                      className="block w-full mt-1.5 rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 px-3.5 text-xs text-zinc-900 focus:border-indigo-600 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">Aktivitas / Kegiatan Murid</label>
                    <textarea rows={4} required value={activities} onChange={e => setActivities(e.target.value)}
                      placeholder="Ceritakan kegiatan, pencapaian, dan perkembangan anak hari ini..."
                      className="block w-full mt-1.5 rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 px-3.5 text-xs text-zinc-900 focus:border-indigo-600 outline-none resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">Pesan untuk Orang Tua (Opsional)</label>
                    <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)}
                      placeholder="Pesan khusus untuk orang tua..."
                      className="block w-full mt-1.5 rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 px-3.5 text-xs text-zinc-900 focus:border-indigo-600 outline-none resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">Foto Kegiatan (Opsional)</label>
                    <input type="file" accept="image/*" onChange={e => setPhotoFile(e.target.files[0])}
                      className="block w-full mt-1.5 text-xs text-zinc-600 file:mr-3 file:rounded-xl file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:text-xs file:font-bold file:text-indigo-700 hover:file:bg-indigo-100"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">Tahun Ajaran</label>
                      <input type="text" required value={academicYear} onChange={e => setAcademicYear(e.target.value)} placeholder="2025/2026"
                        className="block w-full mt-1.5 rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 px-3.5 text-xs text-zinc-900 focus:border-indigo-600 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">Semester</label>
                      <select value={semester} onChange={e => setSemester(e.target.value)}
                        className="block w-full mt-1.5 rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 px-3.5 text-xs text-zinc-900 focus:border-indigo-600 outline-none"
                      >
                        <option value="Ganjil">Semester Ganjil</option>
                        <option value="Genap">Semester Genap</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[280px] overflow-y-auto pr-1">
                    {[
                      ['1. Nilai Agama & Moral', religion, setReligion, 'Anak mampu mengenal penciptanya...'],
                      ['2. Fisik & Motorik', physical, setPhysical, 'Anak lincah berlari, memegang krayon...'],
                      ['3. Kognitif', cognitive, setCognitive, 'Anak mengenal warna dasar dan bentuk...'],
                      ['4. Bahasa & Komunikasi', language, setLanguage, 'Anak aktif menceritakan kegiatan...'],
                      ['5. Sosial & Emosional', socialEmotional, setSocialEmotional, 'Anak bersahabat, mampu antri...'],
                      ['6. Seni & Kreativitas', art, setArt, 'Anak bersemangat bernyanyi bersama...'],
                    ].map(([label, val, setter, placeholder]) => (
                      <div key={label}>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">{label}</label>
                        <textarea rows="3" value={val} onChange={e => setter(e.target.value)} placeholder={placeholder}
                          className="block w-full mt-1.5 rounded-xl border border-zinc-200 bg-zinc-50 py-2 px-3 text-xs text-zinc-900 focus:border-indigo-600 outline-none resize-none"
                        />
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">Catatan & Masukan Umum Guru</label>
                    <textarea rows="2" value={generalNotes} onChange={e => setGeneralNotes(e.target.value)}
                      placeholder="Ulasan umum perkembangan anak sepanjang semester ini..."
                      className="block w-full mt-1.5 rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 px-3.5 text-xs text-zinc-900 focus:border-indigo-600 outline-none resize-none"
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200">
                <button type="button" onClick={() => setShowModal(false)}
                  className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-xs font-bold text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100"
                >
                  Batal
                </button>
                <button type="submit" disabled={submitting}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-30 shadow-md shadow-indigo-100"
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
