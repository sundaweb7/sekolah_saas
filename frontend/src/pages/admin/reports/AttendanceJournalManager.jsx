import { useState, useEffect } from 'react';
import api from '../../../config/axios';
import { 
  Calendar, Users, BookOpen, RefreshCw, MapPin
} from 'lucide-react';

export default function AttendanceJournalManager() {
  const [activeTab, setActiveTab] = useState('teacher_attendance'); // 'teacher_attendance', 'student_attendance', 'journals'
  const [loading, setLoading] = useState(false);

  // States
  const [teacherAttendanceList, setTeacherAttendanceList] = useState([]);
  const [teacherAttendanceDate, setTeacherAttendanceDate] = useState('');
  
  const [studentAttendanceList, setStudentAttendanceList] = useState([]);
  const [studentAttendanceDate, setStudentAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [classList, setClassList] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');

  const [journalList, setJournalList] = useState([]);
  const [journalDate, setJournalDate] = useState('');

  const fetchClasses = async () => {
    try {
      const response = await api.get('/admin/classes');
      setClassList(response.data || []);
    } catch (err) {
      console.error('Failed to load classes', err);
    }
  };

  const fetchTeacherAttendance = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/reports/teacher-attendance', {
        params: { date: teacherAttendanceDate }
      });
      setTeacherAttendanceList(response.data || []);
    } catch (err) {
      console.error('Failed to load teacher attendance', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentAttendance = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/reports/student-attendance', {
        params: { 
          date: studentAttendanceDate,
          class_id: selectedClassId
        }
      });
      setStudentAttendanceList(response.data || []);
    } catch (err) {
      console.error('Failed to load student attendance', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchJournals = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/reports/class-journals', {
        params: { 
          date: journalDate,
          class_id: selectedClassId
        }
      });
      setJournalList(response.data || []);
    } catch (err) {
      console.error('Failed to load class journals', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (activeTab === 'teacher_attendance') {
      fetchTeacherAttendance();
    } else if (activeTab === 'student_attendance') {
      fetchStudentAttendance();
    } else if (activeTab === 'journals') {
      fetchJournals();
    }
  }, [activeTab, teacherAttendanceDate, studentAttendanceDate, selectedClassId, journalDate]);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-955 flex items-center gap-2">
            <Calendar className="h-8 w-8 text-[#aa8410]" /> Absensi & Jurnal Kelas
          </h1>
          <p className="mt-1 text-sm text-zinc-550">
            Pantau kehadiran mandiri guru (GPS), absensi harian siswa, dan jurnal pembelajaran kelas.
          </p>
        </div>
      </div>

      {/* Tab Controller */}
      <div className="flex border-b border-zinc-200 gap-2 overflow-x-auto pb-1">
        <button 
          onClick={() => setActiveTab('teacher_attendance')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all shrink-0 ${activeTab === 'teacher_attendance' ? 'border-[#d4af37] text-zinc-900' : 'border-transparent text-zinc-500 hover:text-zinc-800'}`}
        >
          Absensi Guru
        </button>
        <button 
          onClick={() => setActiveTab('student_attendance')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all shrink-0 ${activeTab === 'student_attendance' ? 'border-[#d4af37] text-zinc-900' : 'border-transparent text-zinc-500 hover:text-zinc-800'}`}
        >
          Absensi Siswa
        </button>
        <button 
          onClick={() => setActiveTab('journals')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all shrink-0 ${activeTab === 'journals' ? 'border-[#d4af37] text-zinc-900' : 'border-transparent text-zinc-500 hover:text-zinc-800'}`}
        >
          Jurnal Kelas
        </button>
      </div>

      {/* Conditionally Render Pages */}
      {activeTab === 'teacher_attendance' ? (
        /* Teacher Attendance Report */
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-100 pb-4">
            <div>
              <h3 className="text-lg font-bold text-zinc-955">Laporan Kehadiran Mandiri Guru</h3>
              <p className="text-xs text-zinc-500">Log absensi check-in guru berbasis koordinat GPS.</p>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-xs text-zinc-500 font-bold uppercase">Tanggal:</label>
              <input 
                type="date"
                value={teacherAttendanceDate}
                onChange={(e) => setTeacherAttendanceDate(e.target.value)}
                className="rounded-xl border border-zinc-250 bg-white py-1.5 px-3 text-xs text-zinc-900 outline-none"
              />
              {teacherAttendanceDate && (
                <button onClick={() => setTeacherAttendanceDate('')} className="text-xs text-red-500 hover:underline">Reset</button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex h-48 items-center justify-center"><RefreshCw className="h-8 w-8 animate-spin text-[#d4af37]" /></div>
          ) : teacherAttendanceList.length === 0 ? (
            <p className="text-xs text-zinc-500 text-center py-10">Belum ada data absensi guru.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-150 bg-zinc-50 text-zinc-500 font-bold uppercase tracking-wider">
                    <th className="px-4 py-3">Nama Guru</th>
                    <th className="px-4 py-3">Tanggal</th>
                    <th className="px-4 py-3">Jam Check-In</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Lokasi (GPS)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {teacherAttendanceList.map((item) => (
                    <tr key={item.id} className="hover:bg-zinc-50/40">
                      <td className="px-4 py-3 font-bold text-zinc-850">{item.teacher_name}</td>
                      <td className="px-4 py-3 text-zinc-600">{item.date}</td>
                      <td className="px-4 py-3 text-zinc-650 font-mono">{item.check_in_time || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                          item.status === 'hadir' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {item.latitude && item.longitude ? (
                          <a 
                            href={`https://www.google.com/maps?q=${item.latitude},${item.longitude}`}
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-indigo-600 hover:underline font-semibold"
                          >
                            Lihat Peta ↗
                          </a>
                        ) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : activeTab === 'student_attendance' ? (
        /* Student Attendance Report */
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-100 pb-4">
            <div>
              <h3 className="text-lg font-bold text-zinc-955">Laporan Absensi Siswa</h3>
              <p className="text-xs text-zinc-500">Log absensi kelas siswa per tanggal terpilih.</p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-xs text-zinc-500 font-bold uppercase">Kelas:</label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="rounded-xl border border-zinc-250 bg-white py-1.5 px-3 text-xs text-zinc-900 outline-none"
                >
                  <option value="">Semua Kelas</option>
                  {classList.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-zinc-500 font-bold uppercase">Tanggal:</label>
                <input 
                  type="date"
                  value={studentAttendanceDate}
                  onChange={(e) => setStudentAttendanceDate(e.target.value)}
                  className="rounded-xl border border-zinc-250 bg-white py-1.5 px-3 text-xs text-zinc-900 outline-none"
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex h-48 items-center justify-center"><RefreshCw className="h-8 w-8 animate-spin text-[#d4af37]" /></div>
          ) : studentAttendanceList.length === 0 ? (
            <p className="text-xs text-zinc-500 text-center py-10">Belum ada data absensi siswa untuk tanggal ini.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-150 bg-zinc-50 text-zinc-500 font-bold uppercase tracking-wider">
                    <th className="px-4 py-3">Nama Siswa</th>
                    <th className="px-4 py-3">Kelas</th>
                    <th className="px-4 py-3">Tanggal</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {studentAttendanceList.map((item) => (
                    <tr key={item.id} className="hover:bg-zinc-50/40">
                      <td className="px-4 py-3 font-bold text-zinc-850">{item.student_name}</td>
                      <td className="px-4 py-3 text-zinc-600">{item.class_name || '-'}</td>
                      <td className="px-4 py-3 text-zinc-500">{item.date}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                          item.status === 'hadir' ? 'bg-green-50 text-green-700 border border-green-200' :
                          item.status === 'sakit' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          item.status === 'izin' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-650 italic">{item.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Class Journals Report */
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-100 pb-4">
            <div>
              <h3 className="text-lg font-bold text-zinc-955">Jurnal Pembelajaran Kelas</h3>
              <p className="text-xs text-zinc-500">Materi & aktivitas pembelajaran harian yang diisi oleh guru.</p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-xs text-zinc-500 font-bold uppercase">Kelas:</label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="rounded-xl border border-zinc-250 bg-white py-1.5 px-3 text-xs text-zinc-900 outline-none"
                >
                  <option value="">Semua Kelas</option>
                  {classList.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-zinc-500 font-bold uppercase">Tanggal:</label>
                <input 
                  type="date"
                  value={journalDate}
                  onChange={(e) => setJournalDate(e.target.value)}
                  className="rounded-xl border border-zinc-250 bg-white py-1.5 px-3 text-xs text-zinc-900 outline-none"
                />
                {journalDate && (
                  <button onClick={() => setJournalDate('')} className="text-xs text-red-500 hover:underline">Reset</button>
                )}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex h-48 items-center justify-center"><RefreshCw className="h-8 w-8 animate-spin text-[#d4af37]" /></div>
          ) : journalList.length === 0 ? (
            <p className="text-xs text-zinc-500 text-center py-10">Belum ada log jurnal pembelajaran.</p>
          ) : (
            <div className="space-y-4">
              {journalList.map((item) => (
                <div key={item.id} className="border border-zinc-200 rounded-xl p-5 hover:shadow-sm transition-shadow space-y-3 bg-[#fafbfc]">
                  <div className="flex justify-between items-center border-b border-zinc-150 pb-2.5">
                    <div>
                      <span className="font-bold text-zinc-800 text-sm">Kelas: {item.class_name}</span>
                      <p className="text-xs text-zinc-500">Guru Pengajar: {item.teacher_name}</p>
                    </div>
                    <span className="text-xs text-zinc-550 font-bold bg-white px-2.5 py-1 rounded-lg border border-zinc-200">
                      📅 {item.date}
                    </span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div>
                      <h5 className="font-extrabold text-zinc-400 uppercase tracking-widest text-[10px]">Materi / Tema:</h5>
                      <p className="font-semibold text-zinc-900 mt-0.5">{item.subject}</p>
                    </div>
                    <div>
                      <h5 className="font-extrabold text-zinc-400 uppercase tracking-widest text-[10px]">Aktivitas:</h5>
                      <p className="text-zinc-750 mt-0.5 whitespace-pre-line leading-relaxed">{item.activities}</p>
                    </div>
                    {item.notes && (
                      <div>
                        <h5 className="font-extrabold text-zinc-400 uppercase tracking-widest text-[10px]">Catatan:</h5>
                        <p className="text-zinc-650 mt-0.5 italic whitespace-pre-line leading-relaxed">{item.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
