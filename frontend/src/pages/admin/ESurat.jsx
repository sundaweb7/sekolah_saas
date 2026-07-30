import { useState, useEffect, useRef } from 'react';
import api from '../../config/axios';
import { 
  FileText, Search, Printer, CheckCircle2, ChevronRight, 
  ArrowLeft, Calendar, User, FileDigit, HelpCircle, Loader2, AlertCircle, FileCheck
} from 'lucide-react';

function getBackendBase() {
  if (import.meta.env.VITE_BACKEND_URL) return import.meta.env.VITE_BACKEND_URL;
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

export default function ESurat() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  
  // Selection
  const [selectedLetter, setSelectedLetter] = useState(null); // 'aktif_belajar' or 'mutasi'
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showKop, setShowKop] = useState(true);

  // Form Fields
  const [letterNo, setLetterNo] = useState('');
  const [academicYear, setAcademicYear] = useState('2025/2026');
  const [parentName, setParentName] = useState('');
  const [purpose, setPurpose] = useState('Persyaratan administrasi keluarga');
  
  // Transfer (Mutasi) specific fields
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split('T')[0]);
  const [targetSchool, setTargetSchool] = useState('');
  const [reason, setReason] = useState('Mengikuti domisili orang tua');

  // School context info (for letter head)
  const [schoolInfo, setSchoolInfo] = useState({
    name: 'SEKOLAH INDONESIA',
    level: 'TK',
    address: 'Jl. Raya Pendidikan No. 123',
    phone: '(021) 1234567',
    email: 'admin@sekolah.sch.id',
    logo: null,
    principalName: '......................................................',
    postalCode: ''
  });

  useEffect(() => {
    fetchStudents();
    fetchSchoolStats();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/admin/students', { params: { per_page: 300 } });
      setStudents(response.data?.data || response.data || []);
    } catch (err) {
      console.error(err);
      setError('Gagal memuat data siswa. Silakan muat ulang halaman.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSchoolStats = async () => {
    try {
      // 1. Get base school name and level
      const statsRes = await api.get('/admin/dashboard/stats');
      let baseInfo = {
        name: 'SEKOLAH INDONESIA',
        level: 'TK',
        address: 'Jl. Raya Pendidikan No. 123',
        phone: '(021) 1234567',
        email: 'admin@sekolah.sch.id',
        logo: null,
        principalName: '......................................................',
        postalCode: ''
      };
      
      if (statsRes.data?.school) {
        baseInfo.name = statsRes.data.school.name;
        baseInfo.level = statsRes.data.school.level;
      }

      // 2. Get detailed website settings & profile
      const settingsRes = await api.get('/admin/website/settings');
      const { settings, profile } = settingsRes.data;
      
      if (settings) {
        baseInfo.logo = settings.letterhead_logo 
          ? `${BACKEND_BASE}/${settings.letterhead_logo}` 
          : (settings.logo ? `${BACKEND_BASE}/${settings.logo}` : null);
        if (settings.contact_info) {
          baseInfo.address = settings.contact_info.address || baseInfo.address;
          baseInfo.phone = settings.contact_info.phone || baseInfo.phone;
          baseInfo.email = settings.contact_info.email || baseInfo.email;
          baseInfo.postalCode = settings.contact_info.postal_code || settings.contact_info.postalCode || '';
        }
      }

      if (profile) {
        baseInfo.principalName = profile.principal_name || baseInfo.principalName;
      }

      setSchoolInfo(baseInfo);
    } catch (err) {
      console.error('Failed to fetch school details for letter', err);
    }
  };

  // Pre-fill parent name when student is selected
  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    setParentName(student.parent_name || student.guardian_name || '');
    setSearchQuery('');
  };

  // Filter students by query
  const filteredStudents = searchQuery.trim() === ''
    ? []
    : students.filter(s => 
        s.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.nisn?.includes(searchQuery)
      );

  const handlePrint = async () => {
    if (!selectedStudent || !selectedLetter || !letterNo.trim()) {
      setError('Pilih siswa, jenis surat, dan isi nomor surat sebelum mencetak.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.post('/admin/letters', {
        student_id: selectedStudent.id,
        letter_type: selectedLetter,
        letter_number: letterNo,
        academic_year: academicYear,
        payload: { parent_name: parentName, purpose, transfer_date: transferDate, target_school: targetSchool, reason },
      });
      window.print();
    } catch (err) {
      setError(err.message || 'Gagal mencatat penerbitan surat.');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setSelectedStudent(null);
    setLetterNo('');
    setParentName('');
    setTargetSchool('');
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      
      {/* CSS @media print block to isolate print output */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Title Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-sm no-print">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
            <FileText className="h-7 w-7 text-[#d4af37]" />
            Manajemen E-surat Resmi
          </h1>
          <p className="text-xs text-zinc-500 mt-1.5 font-sans">
            Cetak surat administrasi resmi siswa secara instan dan otomatis menggunakan data siswa terdaftar.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-750 p-4 rounded-xl flex items-center gap-2 text-xs font-semibold no-print">
          <AlertCircle className="h-4.5 w-4.5 text-red-500 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 no-print">
          <Loader2 className="h-8 w-8 text-[#d4af37] animate-spin" />
          <p className="text-xs text-zinc-400 font-medium">Menghubungkan basis data siswa...</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6 items-start">
          
          {/* LEFT: Choose Letter & Fill Form */}
          <div className="md:col-span-1 space-y-6 no-print">
            
            {/* 1. Choose Letter Type */}
            <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="font-extrabold text-zinc-800 text-xs uppercase tracking-widest">
                Pilih Jenis Surat
              </h3>
              <div className="space-y-2 text-xs">
                <button
                  onClick={() => { setSelectedLetter('aktif_belajar'); resetForm(); }}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left font-bold transition-all ${selectedLetter === 'aktif_belajar' ? 'border-[#d4af37] bg-[#d4af37]/5 text-zinc-900' : 'border-zinc-200 bg-white text-zinc-650 hover:bg-zinc-50'}`}
                >
                  <span>Surat Aktif Belajar Siswa</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => { setSelectedLetter('mutasi'); resetForm(); }}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left font-bold transition-all ${selectedLetter === 'mutasi' ? 'border-[#d4af37] bg-[#d4af37]/5 text-zinc-900' : 'border-zinc-200 bg-white text-zinc-650 hover:bg-zinc-50'}`}
                >
                  <span>Surat Mutasi Siswa</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* 2. Search & Select Student */}
            {selectedLetter && (
              <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                <h3 className="font-extrabold text-zinc-800 text-xs uppercase tracking-widest">
                  Pilih Siswa Yang Bersangkutan
                </h3>
                
                {selectedStudent ? (
                  <div className="flex items-center justify-between p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
                    <div className="min-w-0">
                      <p className="font-bold text-zinc-850 text-sm truncate">{selectedStudent.full_name}</p>
                      <p className="text-[10px] text-zinc-450 mt-0.5">NISN: {selectedStudent.nisn || '-'}</p>
                    </div>
                    <button 
                      onClick={() => setSelectedStudent(null)}
                      className="text-xs text-red-500 font-bold hover:underline"
                    >
                      Ganti
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="absolute left-3 top-3.5 h-4 w-4 text-zinc-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Cari nama siswa..."
                      className="w-full pl-9 pr-4 py-3 border border-zinc-200 rounded-xl text-xs outline-none focus:border-[#d4af37] transition-all"
                    />
                    
                    {/* Autocomplete Dropdown */}
                    {filteredStudents.length > 0 && (
                      <div className="absolute left-0 right-0 mt-2 bg-white border border-zinc-200 rounded-xl max-h-48 overflow-y-auto z-10 shadow-lg divide-y divide-zinc-50">
                        {filteredStudents.map(student => (
                          <button
                            key={student.id}
                            onClick={() => handleSelectStudent(student)}
                            className="w-full px-4 py-2.5 text-left hover:bg-zinc-50 text-xs block truncate"
                          >
                            <span className="font-bold text-zinc-850">{student.full_name}</span>
                            <span className="text-zinc-450 block text-[10px] mt-0.5">NISN: {student.nisn || '-'} | Kelas: {student.class_name || '-'}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 3. Letter Specific Inputs */}
            {selectedLetter && selectedStudent && (
              <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-sm space-y-4 text-xs">
                <h3 className="font-extrabold text-zinc-800 text-[10px] uppercase tracking-widest">
                  Detail &amp; Konten Surat
                </h3>

                {/* Toggle Kop Surat */}
                <div className="flex items-center gap-2 py-2 bg-zinc-50 border border-zinc-200 p-3 rounded-xl">
                  <input
                    type="checkbox"
                    id="toggle-kop"
                    checked={showKop}
                    onChange={(e) => setShowKop(e.target.checked)}
                    className="h-4.5 w-4.5 rounded border-zinc-300 text-[#d4af37] focus:ring-[#d4af37] cursor-pointer"
                  />
                  <label htmlFor="toggle-kop" className="font-bold text-zinc-700 cursor-pointer select-none">
                    Cetak Kop Surat Sekolah
                  </label>
                </div>
                
                {/* Letter Number */}
                <div className="space-y-1.5">
                  <label className="block font-bold text-zinc-700">Nomor Surat</label>
                  <input
                    type="text"
                    value={letterNo}
                    onChange={(e) => setLetterNo(e.target.value)}
                    placeholder="Contoh: 124/DISDIK/TK-MI/VII/2026"
                    className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl outline-none focus:border-[#d4af37]"
                  />
                </div>

                {/* Common fields for Aktif Belajar */}
                {selectedLetter === 'aktif_belajar' && (
                  <>
                    <div className="space-y-1.5">
                      <label className="block font-bold text-zinc-700">Tahun Ajaran</label>
                      <input
                        type="text"
                        value={academicYear}
                        onChange={(e) => setAcademicYear(e.target.value)}
                        placeholder="Contoh: 2025/2026"
                        className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block font-bold text-zinc-700">Nama Orang Tua / Wali</label>
                      <input
                        type="text"
                        value={parentName}
                        onChange={(e) => setParentName(e.target.value)}
                        placeholder="Nama orang tua kandung/wali"
                        className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block font-bold text-zinc-700">Keperluan Surat</label>
                      <textarea
                        rows="3"
                        value={purpose}
                        onChange={(e) => setPurpose(e.target.value)}
                        placeholder="Keperluan permohonan surat"
                        className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl outline-none"
                      />
                    </div>
                  </>
                )}

                {/* Common fields for Mutasi */}
                {selectedLetter === 'mutasi' && (
                  <>
                    <div className="space-y-1.5">
                      <label className="block font-bold text-zinc-700">Sekolah Penerima / Tujuan</label>
                      <input
                        type="text"
                        value={targetSchool}
                        onChange={(e) => setTargetSchool(e.target.value)}
                        placeholder="Contoh: TK Pertiwi Jakarta"
                        className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl outline-none focus:border-[#d4af37]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block font-bold text-zinc-700">Tanggal Mutasi Keluar</label>
                      <input
                        type="date"
                        value={transferDate}
                        onChange={(e) => setTransferDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block font-bold text-zinc-700">Alasan Mutasi</label>
                      <textarea
                        rows="3"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Alasan keluar / pindah"
                        className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl outline-none"
                      />
                    </div>
                  </>
                )}

                <button
                  onClick={handlePrint}
                  disabled={saving}
                  className="w-full mt-4 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#d4af37] hover:bg-[#f3cb65] text-black font-extrabold text-xs shadow-md shadow-[#d4af37]/15 transition-all"
                >
                  <Printer className="h-4.5 w-4.5" />
                  {saving ? 'Mencatat Surat...' : 'Cetak Surat Sekarang'}
                </button>
              </div>
            )}
          </div>

          {/* RIGHT: Live Preview Page */}
          <div className="md:col-span-2">
            {!selectedLetter ? (
              <div className="bg-white border border-dashed border-zinc-300 rounded-2xl p-12 text-center text-zinc-400 space-y-3 shadow-sm no-print">
                <FileDigit className="h-10 w-10 mx-auto text-zinc-300" />
                <p className="text-xs font-medium">Pilih jenis surat di panel sebelah kiri untuk memulai pembuatan surat.</p>
              </div>
            ) : !selectedStudent ? (
              <div className="bg-white border border-dashed border-zinc-300 rounded-2xl p-12 text-center text-zinc-400 space-y-3 shadow-sm no-print">
                <User className="h-10 w-10 mx-auto text-zinc-300" />
                <p className="text-xs font-medium">Cari dan pilih siswa yang bersangkutan untuk menampilkan pratinjau surat.</p>
              </div>
            ) : (
              <div className="space-y-4">
                
                {/* Preview Actions bar */}
                <div className="flex justify-between items-center bg-zinc-950 text-white px-5 py-3 rounded-xl shadow-sm no-print">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Live Print Preview</span>
                  <button
                    onClick={handlePrint}
                    disabled={saving}
                    className="flex items-center gap-1.5 bg-[#d4af37] text-black px-3.5 py-1.5 rounded-lg text-xs font-extrabold shadow-md hover:bg-[#f3cb65] transition-all"
                  >
                    <Printer className="h-4 w-4" /> Cetak
                  </button>
                </div>

                {/* THE ACTUAL PRINTER AREA (Fits A4 Aspect Ratio) */}
                <div 
                  id="print-area" 
                  className="bg-white border border-zinc-200 shadow-xl rounded-2xl p-12 md:p-16 text-black font-serif text-sm leading-relaxed mx-auto max-w-[210mm] min-h-[297mm]"
                >
                  {/* KOP SURAT (Letterhead) */}
                  {showKop ? (
                    <div className="border-b-4 border-double border-black pb-4 flex items-center justify-between gap-6">
                      {schoolInfo.logo && (
                        <img src={schoolInfo.logo} alt="Logo" className="h-16 w-16 object-contain shrink-0" />
                      )}
                      <div className="text-center flex-1">
                        <h2 className="text-xl font-extrabold uppercase tracking-wide leading-tight">{schoolInfo.name}</h2>
                        <p className="text-[11px] font-sans mt-1 text-zinc-700 tracking-wide uppercase">
                          Jenjang {schoolInfo.level} • NPSN / Izin Operasional Resmi
                        </p>
                        <p className="text-[10px] font-sans mt-0.5 text-zinc-650 italic">
                          Alamat: {schoolInfo.address} {schoolInfo.postalCode ? `Kode Pos ${schoolInfo.postalCode}` : ''} • Telp: {schoolInfo.phone} • Email: {schoolInfo.email}
                        </p>
                      </div>
                      {schoolInfo.logo && <div className="w-16 h-16 shrink-0" />}
                    </div>
                  ) : (
                    /* Spacer for pre-printed letterhead paper */
                    <div className="h-[120px] w-full border-b-4 border-transparent"></div>
                  )}

                  {/* SURAT AKTIF BELAJAR */}
                  {selectedLetter === 'aktif_belajar' && (
                    <div className="mt-10 space-y-6">
                      <div className="text-center">
                        <h3 className="text-base font-bold uppercase underline tracking-wide">SURAT KETERANGAN AKTIF BELAJAR</h3>
                        <p className="text-[11px] font-sans mt-1">Nomor: {letterNo || '..........................................................'}</p>
                      </div>

                      <p className="indent-8 text-justify mt-6">
                        Yang bertanda tangan di bawah ini, Kepala Sekolah <strong>{schoolInfo.name}</strong>, menerangkan dengan sesungguhnya bahwa siswa yang tersebut di bawah ini:
                      </p>

                      {/* Student Specs */}
                      <table className="w-11/12 mx-auto text-xs my-4 border-collapse">
                        <tbody>
                          <tr className="align-top">
                            <td className="w-1/3 py-1">Nama Lengkap</td>
                            <td className="w-4 py-1">:</td>
                            <td className="py-1 font-bold">{selectedStudent.full_name}</td>
                          </tr>
                          <tr className="align-top">
                            <td className="py-1">NISN / No. Induk</td>
                            <td className="py-1">:</td>
                            <td className="py-1">{selectedStudent.nisn || '-'} / {selectedStudent.nis || '-'}</td>
                          </tr>
                          <tr className="align-top">
                            <td className="py-1">Jenis Kelamin</td>
                            <td className="py-1">:</td>
                            <td className="py-1">{selectedStudent.gender === 'male' ? 'Laki-laki' : 'Perempuan'}</td>
                          </tr>
                          <tr className="align-top">
                            <td className="py-1">Kelas / Rombel</td>
                            <td className="py-1">:</td>
                            <td className="py-1 font-bold">{selectedStudent.class_name || 'Umum'}</td>
                          </tr>
                          <tr className="align-top">
                            <td className="py-1">Nama Orang Tua / Wali</td>
                            <td className="py-1">:</td>
                            <td className="py-1">{parentName || '..............................................'}</td>
                          </tr>
                        </tbody>
                      </table>

                      <p className="text-justify">
                        Adalah benar-benar siswa aktif belajar di <strong>{schoolInfo.name}</strong> pada Tahun Ajaran <strong>{academicYear}</strong>.
                      </p>

                      <p className="text-justify">
                        Demikian surat keterangan ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya sebagai <strong>{purpose || 'persyaratan administrasi'}</strong>.
                      </p>

                      {/* Signature Area */}
                      <div className="mt-16 flex justify-end">
                        <div className="text-center w-72">
                          <p>Jakarta, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                          <p className="mt-1">Kepala Sekolah,</p>
                          <div className="h-20"></div>
                          <p className="font-bold underline">{schoolInfo.principalName}</p>
                          <p className="text-xs">NIP. ...............................................</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SURAT MUTASI SISWA */}
                  {selectedLetter === 'mutasi' && (
                    <div className="mt-10 space-y-6">
                      <div className="text-center">
                        <h3 className="text-base font-bold uppercase underline tracking-wide">SURAT KETERANGAN MUTASI / KELUAR</h3>
                        <p className="text-[11px] font-sans mt-1">Nomor: {letterNo || '..........................................................'}</p>
                      </div>

                      <p className="indent-8 text-justify mt-6">
                        Yang bertanda tangan di bawah ini, Kepala Sekolah <strong>{schoolInfo.name}</strong>, menerangkan dengan sesungguhnya bahwa siswa di bawah ini mengajukan mutasi keluar:
                      </p>

                      {/* Student Specs */}
                      <table className="w-11/12 mx-auto text-xs my-4 border-collapse">
                        <tbody>
                          <tr className="align-top">
                            <td className="w-1/3 py-1">Nama Lengkap</td>
                            <td className="w-4 py-1">:</td>
                            <td className="py-1 font-bold">{selectedStudent.full_name}</td>
                          </tr>
                          <tr className="align-top">
                            <td className="py-1">NISN / No. Induk</td>
                            <td className="py-1">:</td>
                            <td className="py-1">{selectedStudent.nisn || '-'} / {selectedStudent.nis || '-'}</td>
                          </tr>
                          <tr className="align-top">
                            <td className="py-1">Jenis Kelamin</td>
                            <td className="py-1">:</td>
                            <td className="py-1">{selectedStudent.gender === 'male' ? 'Laki-laki' : 'Perempuan'}</td>
                          </tr>
                          <tr className="align-top">
                            <td className="py-1">Kelas Terakhir</td>
                            <td className="py-1">:</td>
                            <td className="py-1 font-bold">{selectedStudent.class_name || 'Umum'}</td>
                          </tr>
                        </tbody>
                      </table>

                      <p className="text-justify">
                        Telah resmi keluar / mutasi dari <strong>{schoolInfo.name}</strong> terhitung sejak tanggal <strong>{new Date(transferDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</strong> dengan alasan <strong>"{reason || 'Mengikuti domisili orang tua'}"</strong>.
                      </p>

                      <p className="text-justify">
                        Siswa tersebut di atas dimutasikan ke sekolah tujuan yaitu <strong>{targetSchool || '......................................................'}</strong>.
                      </p>

                      <p className="text-justify">
                        Demikian surat keterangan mutasi ini diterbitkan untuk dipergunakan sebagai kelengkapan dokumen kepindahan siswa pada sekolah yang baru.
                      </p>

                      {/* Signature Area */}
                      <div className="mt-16 flex justify-end">
                        <div className="text-center w-72">
                          <p>Jakarta, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                          <p className="mt-1">Kepala Sekolah,</p>
                          <div className="h-20"></div>
                          <p className="font-bold underline">{schoolInfo.principalName}</p>
                          <p className="text-xs">NIP. ...............................................</p>
                        </div>
                      </div>
                    </div>
                  )}

                </div>

              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
