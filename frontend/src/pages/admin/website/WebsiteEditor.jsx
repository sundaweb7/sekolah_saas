import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '../../../config/axios';
import {
  Palette, Phone, User, CheckCircle, AlertTriangle,
  Loader2, Globe, FileText, Image as ImageIcon, Calendar, Plus, Trash2, Edit, Upload, Sparkles, BookOpen, X,
  Check, Layers, Settings, CreditCard, Eye
} from 'lucide-react';

const websiteSchema = z.object({
  themeColor: z.string().regex(/^#[0-9A-F]{6}$/i, { message: 'Format warna hex tidak valid' }),
  themeTemplate: z.string().optional(),
  footerText: z.string().optional(),
  googleMapsIframe: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  postalCode: z.string().optional(),
  paymentBankName: z.string().optional(),
  paymentAccountNumber: z.string().optional(),
  paymentAccountName: z.string().optional(),
  fonnteToken: z.string().optional()
});

export default function WebsiteEditor() {
  const [activeTab, setActiveTab] = useState('tampilan');
  const [logoFile, setLogoFile] = useState(null);
  const [letterheadLogoFile, setLetterheadLogoFile] = useState(null);
  const [faviconFile, setFaviconFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  // Custom Pages and Dynamic Menus States
  const [pagesList, setPagesList] = useState([]);
  const [pagesLoading, setPagesLoading] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [menuSaving, setMenuSaving] = useState(false);



  // Homepage Profile Content State
  const [heroTagline, setHeroTagline] = useState('');
  const [principalName, setPrincipalName] = useState('');
  const [principalMessage, setPrincipalMessage] = useState('');
  const [history, setHistory] = useState('');
  const [vision, setVision] = useState('');
  const [mission, setMission] = useState('');
  const [ppdbText, setPpdbText] = useState('');
  const [principalPhotoFile, setPrincipalPhotoFile] = useState(null);
  const [profileSaving, setProfileSaving] = useState(false);

  // Academic Settings States
  const [academicYears, setAcademicYears] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [academicLoading, setAcademicLoading] = useState(false);

  // Form Modals State
  const [showYearModal, setShowYearModal] = useState(false);
  const [showSemesterModal, setShowSemesterModal] = useState(false);
  const [editingYear, setEditingYear] = useState(null);
  const [editingSemester, setEditingSemester] = useState(null);

  const [bankAccountsList, setBankAccountsList] = useState([{ bankName: '', accountNumber: '', accountName: '' }]);

  // Year Form inputs
  const [yearName, setYearName] = useState('');
  const [yearIsActive, setYearIsActive] = useState(false);

  // Semester Form inputs
  const [semesterYearId, setSemesterYearId] = useState('');
  const [semesterName, setSemesterName] = useState('Ganjil');
  const [semesterStatus, setSemesterStatus] = useState('inactive');
  const [academicSubmitLoading, setAcademicSubmitLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(websiteSchema),
  });

  const watchThemeColor = watch('themeColor');

  const fetchSettings = async () => {
    try {
      const response = await api.get('/admin/website/settings');
      const { settings, profile } = response.data;
      if (settings) {
        setValue('themeColor', settings.theme_color || '#6366F1');
        setValue('themeTemplate', settings.theme_template || 'ceria');
        setValue('footerText', settings.footer_text || '');
        setValue('googleMapsIframe', settings.google_maps_iframe || '');
        setMenuItems(settings.menu_data || []);

        const contacts = settings.contact_info;
        if (contacts) {
          setValue('phone', contacts.phone || '');
          setValue('email', contacts.email || '');
          setValue('address', contacts.address || '');
          setValue('postalCode', contacts.postal_code || contacts.postalCode || '');
        }

        setValue('paymentBankName', settings.payment_bank_name || '');
        setValue('paymentAccountNumber', settings.payment_account_number || '');
        setValue('paymentAccountName', settings.payment_account_name || '');
        setValue('fonnteToken', settings.fonnte_token || '');

        if (settings.bank_accounts) {
          setBankAccountsList(settings.bank_accounts);
        } else if (settings.payment_bank_name) {
          setBankAccountsList([{
            bankName: settings.payment_bank_name,
            accountNumber: settings.payment_account_number,
            accountName: settings.payment_account_name
          }]);
        } else {
          setBankAccountsList([{ bankName: '', accountNumber: '', accountName: '' }]);
        }
      }

      if (profile) {
        setHeroTagline(profile.hero_tagline || '');
        setPrincipalName(profile.principal_name || '');
        setPrincipalMessage(profile.principal_welcome_message || '');
        setHistory(profile.history || '');
        setVision(profile.vision || '');
        setMission(profile.mission || '');
        setPpdbText(profile.ppdb_banner_text || '');
      }
    } catch (err) {
      setError('Gagal memuat konfigurasi website.');
    } finally {
      setLoading(false);
    }
  };



  const fetchAcademicData = async () => {
    setAcademicLoading(true);
    setError(null);
    try {
      const yearsRes = await api.get('/admin/academic-years');
      const semestersRes = await api.get('/admin/semesters');

      setAcademicYears(yearsRes.data || []);
      setSemesters(semestersRes.data || []);

      if (yearsRes.data?.length > 0 && !semesterYearId) {
        setSemesterYearId(yearsRes.data[0].id);
      }
    } catch (err) {
      console.error(err);
      setError('Gagal memuat data akademik.');
    } finally {
      setAcademicLoading(false);
    }
  };

  // YEAR HANDLERS
  const handleOpenAddYear = () => {
    setEditingYear(null);
    setYearName('');
    setYearIsActive(false);
    setShowYearModal(true);
  };

  const handleOpenEditYear = (year) => {
    setEditingYear(year);
    setYearName(year.name);
    setYearIsActive(Number(year.is_active) === 1);
    setShowYearModal(true);
  };

  const handleYearSubmit = async (e) => {
    e.preventDefault();
    if (!yearName.trim()) return;

    setAcademicSubmitLoading(true);
    try {
      await api.post('/admin/academic-years/save', {
        id: editingYear ? editingYear.id : undefined,
        name: yearName.trim(),
        is_active: yearIsActive ? 1 : 0
      });
      setShowYearModal(false);
      fetchAcademicData();
    } catch (err) {
      console.error(err);
      setError('Gagal menyimpan tahun ajaran.');
    } finally {
      setAcademicSubmitLoading(false);
    }
  };

  const handleSetActiveYear = async (year) => {
    try {
      await api.post('/admin/academic-years/save', {
        id: year.id,
        name: year.name,
        is_active: 1
      });
      fetchAcademicData();
    } catch (err) {
      console.error(err);
      setError('Gagal mengaktifkan tahun ajaran.');
    }
  };

  const handleDeleteYear = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus Tahun Ajaran ini? Semua data kelas dan semester terikat mungkin akan terpengaruh.')) return;
    try {
      await api.delete(`/admin/academic-years/delete/${id}`);
      fetchAcademicData();
    } catch (err) {
      console.error(err);
      setError('Gagal menghapus Tahun Ajaran.');
    }
  };

  // SEMESTER HANDLERS
  const handleOpenAddSemester = () => {
    setEditingSemester(null);
    setSemesterName('Ganjil');
    setSemesterStatus('inactive');
    if (academicYears.length > 0) {
      setSemesterYearId(academicYears[0].id);
    }
    setShowSemesterModal(true);
  };

  const handleOpenEditSemester = (semester) => {
    setEditingSemester(semester);
    setSemesterYearId(semester.academic_year_id);
    setSemesterName(semester.name);
    setSemesterStatus(semester.status);
    setShowSemesterModal(true);
  };

  const handleSemesterSubmit = async (e) => {
    e.preventDefault();
    if (!semesterYearId || !semesterName) return;

    setAcademicSubmitLoading(true);
    try {
      await api.post('/admin/semesters/save', {
        id: editingSemester ? editingSemester.id : undefined,
        academic_year_id: semesterYearId,
        name: semesterName,
        status: semesterStatus
      });
      setShowSemesterModal(false);
      fetchAcademicData();
    } catch (err) {
      console.error(err);
      setError('Gagal menyimpan semester.');
    } finally {
      setAcademicSubmitLoading(false);
    }
  };

  const handleSetActiveSemester = async (semester) => {
    try {
      await api.post('/admin/semesters/save', {
        id: semester.id,
        academic_year_id: semester.academic_year_id,
        name: semester.name,
        status: 'active'
      });
      fetchAcademicData();
    } catch (err) {
      console.error(err);
      setError('Gagal mengaktifkan semester.');
    }
  };

  const handleDeleteSemester = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus Semester ini?')) return;
    try {
      await api.delete(`/admin/semesters/delete/${id}`);
      fetchAcademicData();
    } catch (err) {
      console.error(err);
      setError('Gagal menghapus semester.');
    }
  };

  const handleBankAccountChange = (index, field, value) => {
    const updated = [...bankAccountsList];
    updated[index][field] = value;
    setBankAccountsList(updated);
  };

  const handleAddBankAccountRow = () => {
    setBankAccountsList([...bankAccountsList, { bankName: '', accountNumber: '', accountName: '' }]);
  };

  const handleRemoveBankAccountRow = (index) => {
    if (bankAccountsList.length === 1) {
      setBankAccountsList([{ bankName: '', accountNumber: '', accountName: '' }]);
    } else {
      setBankAccountsList(bankAccountsList.filter((_, i) => i !== index));
    }
  };

  // CUSTOM PAGES & MENUS HANDLERS
  const fetchPages = async () => {
    setPagesLoading(true);
    setError(null);
    try {
      const response = await api.get('/admin/website/pages');
      setPagesList(response.data || []);
    } catch (err) {
      console.error(err);
      setError('Gagal memuat daftar halaman kustom.');
    } finally {
      setPagesLoading(false);
    }
  };

  const [showPageModal, setShowPageModal] = useState(false);
  const [editingPage, setEditingPage] = useState(null);
  const [pageTitle, setPageTitle] = useState('');
  const [pageContent, setPageContent] = useState('');
  const [pageStatus, setPageStatus] = useState('published');
  const [pageSubmitLoading, setPageSubmitLoading] = useState(false);

  const handleOpenAddPage = () => {
    setEditingPage(null);
    setPageTitle('');
    setPageContent('');
    setPageStatus('published');
    setShowPageModal(true);
  };

  const handleOpenEditPage = (page) => {
    setEditingPage(page);
    setPageTitle(page.title);
    setPageContent(page.content || '');
    setPageStatus(page.status || 'published');
    setShowPageModal(true);
  };

  const handlePageSubmit = async (e) => {
    e.preventDefault();
    if (!pageTitle.trim()) return;

    setPageSubmitLoading(true);
    try {
      if (editingPage) {
        await api.post(`/admin/website/pages/update/${editingPage.id}`, {
          title: pageTitle.trim(),
          content: pageContent,
          status: pageStatus
        });
      } else {
        await api.post('/admin/website/pages', {
          title: pageTitle.trim(),
          content: pageContent,
          status: pageStatus
        });
      }
      setShowPageModal(false);
      fetchPages();
      setSuccess(true);
    } catch (err) {
      console.error(err);
      setError('Gagal menyimpan halaman kustom.');
    } finally {
      setPageSubmitLoading(false);
    }
  };

  const handleDeletePage = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus halaman kustom ini?')) return;
    try {
      await api.delete(`/admin/website/pages/delete/${id}`);
      fetchPages();
      setSuccess(true);
    } catch (err) {
      console.error(err);
      setError('Gagal menghapus halaman kustom.');
    }
  };

  // CUSTOM MENU HANDLERS
  const [newMenuLabel, setNewMenuLabel] = useState('');
  const [newMenuType, setNewMenuType] = useState('built_in');
  const [newMenuValue, setNewMenuValue] = useState('#home');

  const handleAddMenuItem = () => {
    if (!newMenuLabel.trim()) return;
    const newItem = {
      label: newMenuLabel.trim(),
      type: newMenuType,
      value: newMenuValue
    };
    setMenuItems([...menuItems, newItem]);
    setNewMenuLabel('');
    setNewMenuType('built_in');
    setNewMenuValue('#home');
  };

  const handleRemoveMenuItem = (index) => {
    setMenuItems(menuItems.filter((_, i) => i !== index));
  };

  const handleMoveMenuItem = (index, direction) => {
    const nextItems = [...menuItems];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= nextItems.length) return;

    // Swap
    const temp = nextItems[index];
    nextItems[index] = nextItems[targetIndex];
    nextItems[targetIndex] = temp;
    setMenuItems(nextItems);
  };

  const handleSaveMenus = async () => {
    setMenuSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const formData = new FormData();
      formData.append('menu_data', JSON.stringify(menuItems));

      await api.post('/admin/website/settings', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccess(true);
      fetchSettings();
    } catch (err) {
      console.error(err);
      setError('Gagal menyimpan susunan menu.');
    } finally {
      setMenuSaving(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [setValue]);

  useEffect(() => {
    if (activeTab === 'tahun_ajaran') {
      fetchAcademicData();
    } else if (activeTab === 'custom_pages' || activeTab === 'custom_menus') {
      fetchPages();
    }
  }, [activeTab]);

  const onSettingsSubmit = async (data) => {
    setSuccess(false);
    setError(null);

    const formData = new FormData();
    formData.append('theme_color', data.themeColor);
    formData.append('theme_template', data.themeTemplate);
    formData.append('footer_text', data.footerText);
    formData.append('google_maps_iframe', data.googleMapsIframe);

    const contactInfo = {
      phone: data.phone,
      email: data.email,
      address: data.address,
      postal_code: data.postalCode
    };
    formData.append('contact_info', JSON.stringify(contactInfo));

    formData.append('payment_bank_name', data.paymentBankName || '');
    formData.append('payment_account_number', data.paymentAccountNumber || '');
    formData.append('payment_account_name', data.paymentAccountName || '');
    formData.append('bank_accounts', JSON.stringify(bankAccountsList));
    formData.append('fonnte_token', data.fonnteToken || '');

    if (logoFile) formData.append('logo_file', logoFile);
    if (letterheadLogoFile) formData.append('letterhead_logo_file', letterheadLogoFile);
    if (faviconFile) formData.append('favicon_file', faviconFile);
    if (bannerFile) formData.append('banner_file', bannerFile);

    try {
      await api.post('/admin/website/settings', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccess(true);
      fetchSettings();
    } catch (err) {
      setError(err.message || 'Gagal menyimpan pengaturan.');
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setSuccess(false);
    setError(null);

    const formData = new FormData();
    formData.append('hero_tagline', heroTagline);
    formData.append('principal_name', principalName);
    formData.append('principal_welcome_message', principalMessage);
    formData.append('history', history);
    formData.append('vision', vision);
    formData.append('mission', mission);
    formData.append('ppdb_banner_text', ppdbText);

    if (principalPhotoFile) {
      formData.append('principal_photo_file', principalPhotoFile);
    }

    try {
      await api.post('/admin/website/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccess(true);
      fetchSettings();
    } catch (err) {
      setError(err.message || 'Gagal menyimpan konten profil halaman utama.');
    } finally {
      setProfileSaving(false);
    }
  };



  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505] text-white">
        <Loader2 className="h-8 w-8 animate-spin text-[#d4af37]" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 text-zinc-800">
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-950 flex items-center gap-2">
              <Settings className="h-8 w-8 text-[#aa8410]" /> Website Setting
            </h1>
            <p className="mt-1 text-sm text-zinc-550">
              Kelola pengaturan tampilan, logo, konten halaman utama, berita, galeri, serta konfigurasi tahun ajaran sekolah Anda secara dinamis.
            </p>
          </div>
        </div>

        {/* Tabs Controller */}
        <div className="flex border-b border-zinc-200 gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('tampilan')}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${activeTab === 'tampilan' ? 'border-[#d4af37] text-zinc-900' : 'border-transparent text-zinc-500 hover:text-zinc-900'}`}
          >
            <Palette className="h-4 w-4" /> Desain & Tampilan
          </button>
          <button
            onClick={() => setActiveTab('konten_utama')}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${activeTab === 'konten_utama' ? 'border-[#d4af37] text-zinc-900' : 'border-transparent text-zinc-500 hover:text-zinc-900'}`}
          >
            <BookOpen className="h-4 w-4" /> Konten Halaman Utama
          </button>
          <button
            onClick={() => setActiveTab('tahun_ajaran')}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${activeTab === 'tahun_ajaran' ? 'border-[#d4af37] text-zinc-900' : 'border-transparent text-zinc-500 hover:text-zinc-900'}`}
          >
            <Calendar className="h-4 w-4" /> Tahun Ajaran &amp; Semester
          </button>
          <button
            onClick={() => setActiveTab('rekening')}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${activeTab === 'rekening' ? 'border-[#d4af37] text-zinc-900' : 'border-transparent text-zinc-500 hover:text-zinc-900'}`}
          >
            <CreditCard className="h-4 w-4" /> Rekening Pembayaran
          </button>
          <button
            onClick={() => setActiveTab('custom_pages')}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${activeTab === 'custom_pages' ? 'border-[#d4af37] text-zinc-900' : 'border-transparent text-zinc-500 hover:text-zinc-900'}`}
          >
            <Layers className="h-4 w-4" /> Halaman Kustom
          </button>
          <button
            onClick={() => setActiveTab('custom_menus')}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${activeTab === 'custom_menus' ? 'border-[#d4af37] text-zinc-900' : 'border-transparent text-zinc-500 hover:text-zinc-900'}`}
          >
            <Globe className="h-4 w-4" /> Menu Navigasi
          </button>
        </div>

        {/* Global Messages */}
        {success && (
          <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-400">
            <CheckCircle className="h-5 w-5 shrink-0" />
            <span>Pengaturan website berhasil disimpan! Konten public otomatis dimuat dinamis.</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Tab 1: Desain & Tampilan */}
        {activeTab === 'tampilan' && (
          <form onSubmit={handleSubmit(onSettingsSubmit)} className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl space-y-6">
              <div className="flex items-center gap-3 border-b border-zinc-800 pb-3">
                <Palette className="h-5 w-5 text-[#d4af37]" />
                <h2 className="text-xl font-semibold text-white">Tema & Visual</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-300">Warna Tema (Hex Code)</label>
                  <div className="flex gap-3 mt-2">
                    <input
                      type="color"
                      value={watchThemeColor || '#6366F1'}
                      onChange={(e) => setValue('themeColor', e.target.value)}
                      className="h-10 w-12 rounded border border-zinc-800 bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      {...register('themeColor')}
                      placeholder="#6366F1"
                      className="block w-full rounded-lg border border-zinc-800 bg-zinc-950 py-2 px-3 text-sm text-white focus:border-[#d4af37]"
                    />
                  </div>
                  {errors.themeColor && <p className="mt-1 text-xs text-red-400">{errors.themeColor.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300">Model Landing Page</label>
                  <select
                    {...register('themeTemplate')}
                    className="block w-full mt-2 rounded-lg border border-zinc-800 bg-zinc-950 py-2.5 px-3 text-sm text-white focus:border-[#d4af37] outline-none"
                  >
                    <option value="ceria">TK</option>
                    <option value="sd">SD</option>
                    <option value="smp">SMP</option>
                    <option value="sma">SMA</option>
                    <option value="smk">SMK</option>
                    <option value="pesantren">Pesantren</option>
                    <option value="mts">MTS</option>
                    <option value="ma">MA</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 pt-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300">Logo Website</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                    className="block w-full mt-2 text-xs text-zinc-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300">Logo KOP Surat</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setLetterheadLogoFile(e.target.files?.[0] || null)}
                    className="block w-full mt-2 text-xs text-zinc-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300">Favicon</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFaviconFile(e.target.files?.[0] || null)}
                    className="block w-full mt-2 text-xs text-zinc-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300">Hero Banner Website</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setBannerFile(e.target.files?.[0] || null)}
                    className="block w-full mt-2 text-xs text-zinc-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300">Footer Copyright Text</label>
                <input
                  type="text"
                  {...register('footerText')}
                  placeholder="© 2026 TK Melati Indah. All rights reserved."
                  className="block w-full mt-2 rounded-lg border border-zinc-800 bg-zinc-950 py-2.5 px-3.5 text-sm text-white focus:border-[#d4af37] outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300">Google Maps Embed Iframe Code</label>
                <textarea
                  rows="3"
                  {...register('googleMapsIframe')}
                  placeholder='<iframe src="https://www.google.com/maps/embed..." ...></iframe>'
                  className="block w-full mt-2 rounded-lg border border-zinc-800 bg-zinc-950 py-2 px-3 text-sm text-white focus:border-[#d4af37] outline-none font-mono"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="rounded-xl bg-[#d4af37] hover:bg-[#f3cb65] text-black px-6 py-2.5 text-sm font-bold shadow-md"
                >
                  Simpan Tampilan
                </button>
              </div>
            </div>

            {/* Sidebar Contact Info */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl space-y-6">
              <div className="flex items-center gap-3 border-b border-zinc-800 pb-3">
                <Phone className="h-5 w-5 text-[#d4af37]" />
                <h2 className="text-xl font-semibold text-white">Detail Kontak</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-400">Nomor Telepon / WA</label>
                  <input
                    type="text"
                    {...register('phone')}
                    placeholder="0812XXXXXXXX"
                    className="block w-full mt-1.5 rounded-lg border border-zinc-800 bg-zinc-950 py-2.5 px-3 text-sm text-white focus:border-[#d4af37] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-400">Alamat Email</label>
                  <input
                    type="email"
                    {...register('email')}
                    placeholder="kontak@sekolah.sch.id"
                    className="block w-full mt-1.5 rounded-lg border border-zinc-800 bg-zinc-950 py-2.5 px-3 text-sm text-white focus:border-[#d4af37] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-400">Kode Pos</label>
                  <input
                    type="text"
                    {...register('postalCode')}
                    placeholder="12345"
                    className="block w-full mt-1.5 rounded-lg border border-zinc-800 bg-zinc-950 py-2.5 px-3 text-sm text-white focus:border-[#d4af37] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-400">Alamat Lengkap</label>
                  <textarea
                    rows="3"
                    {...register('address')}
                    placeholder="Jl. Raya Merdeka No. 45..."
                    className="block w-full mt-1.5 rounded-lg border border-zinc-800 bg-zinc-950 py-2.5 px-3 text-sm text-white focus:border-[#d4af37] outline-none"
                  />
                </div>

                <div className="border-t border-zinc-800 pt-4 mt-4">
                  <label className="block text-xs font-semibold uppercase text-[#d4af37]">Fonnte WhatsApp Token (Khusus Sekolah)</label>
                  <input
                    type="text"
                    {...register('fonnteToken')}
                    placeholder="Masukkan token Fonnte Anda..."
                    className="block w-full mt-1.5 rounded-lg border border-zinc-700 bg-zinc-950 py-2.5 px-3 text-sm text-white focus:border-[#d4af37] outline-none font-mono"
                  />
                  <p className="text-[10px] text-zinc-400 mt-1">Kosongkan jika ingin menggunakan token default sistem.</p>
                </div>
              </div>
            </div>
          </form>
        )}

        {/* Tab 2: Konten Halaman Utama */}
        {activeTab === 'konten_utama' && (
          <form onSubmit={handleProfileSubmit} className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl space-y-6">
            <div className="flex items-center gap-3 border-b border-zinc-800 pb-3">
              <Sparkles className="h-5 w-5 text-[#d4af37]" />
              <h2 className="text-xl font-semibold text-white">Kelola Isi Halaman Utama</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300">Hero Tagline / Subtitle Website</label>
                  <input
                    type="text"
                    value={heroTagline}
                    onChange={(e) => setHeroTagline(e.target.value)}
                    placeholder="Contoh: Mendidik anak usia dini dengan cinta, kreatifitas, dan akhlak mulia."
                    className="block w-full mt-2 rounded-lg border border-zinc-800 bg-zinc-950 py-2.5 px-3.5 text-sm text-white focus:border-[#d4af37] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300">Nama Kepala Sekolah / Pimpinan</label>
                  <input
                    type="text"
                    value={principalName}
                    onChange={(e) => setPrincipalName(e.target.value)}
                    placeholder="Contoh: Ibu Maria, S.Pd"
                    className="block w-full mt-2 rounded-lg border border-zinc-800 bg-zinc-950 py-2.5 px-3.5 text-sm text-white focus:border-[#d4af37] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300">Upload Foto Kepala Sekolah</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPrincipalPhotoFile(e.target.files?.[0] || null)}
                    className="block w-full mt-2 text-xs text-zinc-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300">Sambutan Kepala Sekolah</label>
                  <textarea
                    rows="5"
                    value={principalMessage}
                    onChange={(e) => setPrincipalMessage(e.target.value)}
                    placeholder="Tulis pidato sambutan hangat untuk pengunjung website..."
                    className="block w-full mt-2 rounded-lg border border-zinc-800 bg-zinc-950 py-2 px-3 text-sm text-white focus:border-[#d4af37] outline-none"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300">Sejarah & Profil Singkat</label>
                  <textarea
                    rows="3"
                    value={history}
                    onChange={(e) => setHistory(e.target.value)}
                    placeholder="Tuliskan sejarah singkat berdirinya sekolah..."
                    className="block w-full mt-2 rounded-lg border border-zinc-800 bg-zinc-950 py-2 px-3 text-sm text-white focus:border-[#d4af37] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300">Visi Sekolah</label>
                  <textarea
                    rows="3"
                    value={vision}
                    onChange={(e) => setVision(e.target.value)}
                    placeholder="Mewujudkan anak didik yang berakhlak..."
                    className="block w-full mt-2 rounded-lg border border-zinc-800 bg-zinc-950 py-2 px-3 text-sm text-white focus:border-[#d4af37] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300">Misi Sekolah (Gunakan baris baru untuk point)</label>
                  <textarea
                    rows="4"
                    value={mission}
                    onChange={(e) => setMission(e.target.value)}
                    placeholder="1. Mengembangkan kecerdasan...&#10;2. Membina kemandirian..."
                    className="block w-full mt-2 rounded-lg border border-zinc-800 bg-zinc-950 py-2 px-3 text-sm text-white focus:border-[#d4af37] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300">Teks Keterangan Pendaftaran PPDB</label>
                  <input
                    type="text"
                    value={ppdbText}
                    onChange={(e) => setPpdbText(e.target.value)}
                    placeholder="Pendaftaran untuk tahun ajaran baru telah resmi dibuka secara online..."
                    className="block w-full mt-2 rounded-lg border border-zinc-800 bg-zinc-950 py-2.5 px-3.5 text-sm text-white focus:border-[#d4af37] outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-zinc-900">
              <button
                type="submit"
                disabled={profileSaving}
                className="rounded-xl bg-[#d4af37] hover:bg-[#f3cb65] text-black px-6 py-2.5 text-sm font-bold flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {profileSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                Simpan Konten Utama
              </button>
            </div>
          </form>
        )}

        {/* Tab 5: Tahun Ajaran & Semester */}
        {activeTab === 'tahun_ajaran' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-8 items-start">

              {/* Tahun Ajaran Card */}
              <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-zinc-150 pb-3">
                  <h3 className="font-extrabold text-zinc-800 text-sm flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-[#d4af37]" />
                    Daftar Tahun Ajaran
                  </h3>
                  <button
                    onClick={handleOpenAddYear}
                    className="text-[10px] font-bold bg-[#d4af37] hover:bg-[#f3cb65] text-black px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all"
                  >
                    <Plus className="h-3 w-3" /> Tambah
                  </button>
                </div>

                <div className="overflow-x-auto rounded-xl border border-zinc-150">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-zinc-50 border-b border-zinc-150 text-[10px] font-extrabold text-zinc-450 uppercase tracking-widest">
                        <th className="px-4 py-3">Tahun Ajaran</th>
                        <th className="px-4 py-3 text-center">Status</th>
                        <th className="px-4 py-3 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {academicYears.length === 0 ? (
                        <tr>
                          <td colSpan="3" className="px-4 py-6 text-center text-zinc-450 italic">Belum ada tahun ajaran.</td>
                        </tr>
                      ) : (
                        academicYears.map(year => (
                          <tr key={year.id} className="hover:bg-zinc-50/50">
                            <td className="px-4 py-3.5 font-bold text-zinc-800">{year.name}</td>
                            <td className="px-4 py-3.5 text-center">
                              {Number(year.is_active) === 1 ? (
                                <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wider">Aktif</span>
                              ) : (
                                <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-zinc-100 text-zinc-500 uppercase tracking-wider">Nonaktif</span>
                              )}
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <div className="flex justify-center items-center gap-2">
                                {Number(year.is_active) !== 1 && (
                                  <button
                                    onClick={() => handleSetActiveYear(year)}
                                    title="Set Aktif"
                                    className="p-1 text-emerald-600 hover:bg-emerald-50 rounded border border-emerald-250 transition-colors"
                                  >
                                    <Check className="h-3.5 w-3.5" />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleOpenEditYear(year)}
                                  title="Edit"
                                  className="p-1 text-zinc-600 hover:bg-zinc-50 border border-zinc-200 rounded transition-colors"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteYear(year.id)}
                                  title="Hapus"
                                  className="p-1 text-red-500 hover:bg-red-50 border border-red-200 rounded transition-colors"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Semester Card */}
              <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-zinc-150 pb-3">
                  <h3 className="font-extrabold text-zinc-800 text-sm flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-[#d4af37]" />
                    Daftar Semester
                  </h3>
                  <button
                    onClick={handleOpenAddSemester}
                    className="text-[10px] font-bold bg-[#d4af37] hover:bg-[#f3cb65] text-black px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all"
                  >
                    <Plus className="h-3 w-3" /> Tambah
                  </button>
                </div>

                <div className="overflow-x-auto rounded-xl border border-zinc-150">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-zinc-50 border-b border-zinc-150 text-[10px] font-extrabold text-zinc-450 uppercase tracking-widest">
                        <th className="px-4 py-3">Tahun Ajaran</th>
                        <th className="px-4 py-3">Semester</th>
                        <th className="px-4 py-3 text-center">Status</th>
                        <th className="px-4 py-3 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {semesters.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="px-4 py-6 text-center text-zinc-455 italic">Belum ada data semester.</td>
                        </tr>
                      ) : (
                        semesters.map(semester => {
                          const yearObj = academicYears.find(y => y.id === semester.academic_year_id);
                          return (
                            <tr key={semester.id} className="hover:bg-zinc-50/50">
                              <td className="px-4 py-3.5 text-zinc-650 font-medium">{yearObj ? yearObj.name : 'Unknown'}</td>
                              <td className="px-4 py-3.5 font-bold text-zinc-800">Semester {semester.name}</td>
                              <td className="px-4 py-3.5 text-center">
                                {semester.status === 'active' ? (
                                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wider">Aktif</span>
                                ) : (
                                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-zinc-100 text-zinc-500 uppercase tracking-wider">Nonaktif</span>
                                )}
                              </td>
                              <td className="px-4 py-3.5 text-center">
                                <div className="flex justify-center items-center gap-2">
                                  {semester.status !== 'active' && (
                                    <button
                                      onClick={() => handleSetActiveSemester(semester)}
                                      title="Set Aktif"
                                      className="p-1 text-emerald-600 hover:bg-emerald-50 rounded border border-emerald-250 transition-colors"
                                    >
                                      <Check className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleOpenEditSemester(semester)}
                                    title="Edit"
                                    className="p-1 text-zinc-600 hover:bg-zinc-50 border border-zinc-200 rounded transition-colors"
                                  >
                                    <Edit className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteSemester(semester.id)}
                                    title="Hapus"
                                    className="p-1 text-red-500 hover:bg-red-50 border border-red-200 rounded transition-colors"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Tab 6: Rekening Pembayaran */}
        {activeTab === 'rekening' && (
          <form onSubmit={handleSubmit(onSettingsSubmit)} className="space-y-6">
            <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex justify-between items-center border-b border-zinc-150 pb-3">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-[#d4af37]" />
                  <div>
                    <h2 className="text-sm font-extrabold text-zinc-800">Daftar Rekening Bank Sekolah</h2>
                    <p className="text-[10px] text-zinc-400 mt-0.5">Kelola daftar rekening bank resmi sekolah Anda untuk penerimaan iuran SPP, ekskul, dll.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAddBankAccountRow}
                  className="rounded-lg bg-[#d4af37] hover:bg-[#f3cb65] text-black px-3 py-1.5 text-[10px] font-extrabold flex items-center gap-1 transition-all shadow-sm"
                >
                  + Tambah Rekening
                </button>
              </div>

              <div className="space-y-4">
                {bankAccountsList.map((acc, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-zinc-50/50 p-4 rounded-xl border border-zinc-150 text-xs">
                    <div className="md:col-span-3 space-y-1">
                      <label className="block font-bold text-zinc-450 uppercase tracking-wider text-[9px]">Nama Bank</label>
                      <input
                        type="text"
                        required
                        value={acc.bankName || ''}
                        onChange={(e) => handleBankAccountChange(index, 'bankName', e.target.value)}
                        placeholder="Contoh: BNI, Mandiri, BRI"
                        className="block w-full rounded-xl border border-zinc-300 py-2 px-3 focus:border-[#d4af37] outline-none text-zinc-700 font-medium bg-white"
                      />
                    </div>

                    <div className="md:col-span-4 space-y-1">
                      <label className="block font-bold text-zinc-450 uppercase tracking-wider text-[9px]">Nomor Rekening</label>
                      <input
                        type="text"
                        required
                        value={acc.accountNumber || ''}
                        onChange={(e) => handleBankAccountChange(index, 'accountNumber', e.target.value)}
                        placeholder="Contoh: 123456789"
                        className="block w-full rounded-xl border border-zinc-300 py-2 px-3 focus:border-[#d4af37] outline-none text-zinc-700 font-medium bg-white"
                      />
                    </div>

                    <div className="md:col-span-4 space-y-1">
                      <label className="block font-bold text-zinc-450 uppercase tracking-wider text-[9px]">Atas Nama Pemilik</label>
                      <input
                        type="text"
                        required
                        value={acc.accountName || ''}
                        onChange={(e) => handleBankAccountChange(index, 'accountName', e.target.value)}
                        placeholder="Contoh: Bendahara TK Melati"
                        className="block w-full rounded-xl border border-zinc-300 py-2 px-3 focus:border-[#d4af37] outline-none text-zinc-700 font-medium bg-white"
                      />
                    </div>

                    <div className="md:col-span-1 flex justify-center pb-0.5">
                      <button
                        type="button"
                        onClick={() => handleRemoveBankAccountRow(index)}
                        className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        title="Hapus Rekening"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-4 border-t border-zinc-150">
                <button
                  type="submit"
                  className="rounded-xl bg-[#d4af37] hover:bg-[#f3cb65] text-black px-6 py-2.5 text-xs font-bold shadow-sm transition-all"
                >
                  Simpan Pengaturan Rekening
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Tab 6: Halaman Kustom (Pages) */}
        {activeTab === 'custom_pages' && (
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex justify-between items-center border-b border-zinc-150 pb-3">
              <div>
                <h3 className="font-extrabold text-zinc-900 text-base">Halaman Kustom (Single Page)</h3>
                <p className="text-xs text-zinc-500 mt-0.5">Buat halaman statis independen selain Berita (contoh: Profil Sejarah, Visi Misi, Alur Pendaftaran, Fasilitas).</p>
              </div>
              <button
                onClick={handleOpenAddPage}
                className="text-xs font-bold bg-[#d9a425] hover:bg-[#e5c158] text-black px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-sm shadow-[#d9a425]/10"
              >
                <Plus className="h-4 w-4" /> Buat Halaman Baru
              </button>
            </div>

            {pagesLoading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-2">
                <Loader2 className="h-6 w-6 animate-spin text-[#d9a425]" />
                <span className="text-xs text-zinc-500 font-semibold">Memuat halaman kustom...</span>
              </div>
            ) : pagesList.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-zinc-150 rounded-2xl space-y-2 text-zinc-400">
                <Layers className="h-10 w-10 mx-auto opacity-50" />
                <p className="text-xs">Belum ada halaman kustom yang dibuat. Mulai buat halaman pertama Anda!</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-zinc-150">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-150 text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">
                      <th className="px-5 py-3.5">Judul Halaman</th>
                      <th className="px-5 py-3.5">Link / Slug</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5">Diperbarui</th>
                      <th className="px-5 py-3.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {pagesList.map((page) => (
                      <tr key={page.id} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="px-5 py-3 font-semibold text-zinc-800 text-sm">{page.title}</td>
                        <td className="px-5 py-3 font-mono text-zinc-500">/page/{page.slug}</td>
                        <td className="px-5 py-3">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold uppercase text-[9px] ${
                            page.status === 'published' ? 'bg-green-50 text-green-700 border border-green-150' : 'bg-zinc-50 text-zinc-500 border border-zinc-150'
                          }`}>
                            {page.status === 'published' ? 'Terbit' : 'Draft'}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-zinc-500">
                          {new Date(page.updated_at || page.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {page.status === 'published' && (
                              <a
                                href={`/school/${window.location.hostname.split('.')[0] === 'localhost' || window.location.hostname.split('.')[0] === '127' ? 'tkmelati' : window.location.hostname.split('.')[0]}/page/${page.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 text-zinc-500 hover:text-emerald-600 hover:bg-zinc-50 rounded-lg transition-all inline-flex items-center"
                                title="Lihat Halaman Publik"
                              >
                                <Eye className="h-4 w-4" />
                              </a>
                            )}
                            <button
                              onClick={() => handleOpenEditPage(page)}
                              className="p-1.5 text-zinc-500 hover:text-[#d9a425] hover:bg-zinc-50 rounded-lg transition-all"
                              title="Edit Halaman"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeletePage(page.id)}
                              className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                              title="Hapus Halaman"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 7: Menu Navigasi Dinamis */}
        {activeTab === 'custom_menus' && (
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="border-b border-zinc-150 pb-3">
              <h3 className="font-extrabold text-zinc-900 text-base">Susunan Menu Navigasi</h3>
              <p className="text-xs text-zinc-500 mt-0.5">Kelola menu yang tampil di bagian atas website sekolah Anda. Anda bisa menautkan ke halaman kustom, link luar, atau menu bawaan.</p>
            </div>

            <div className="grid md:grid-cols-12 gap-8">

              {/* Tambah Item Menu Form */}
              <div className="md:col-span-5 bg-zinc-50 rounded-2xl p-5 border border-zinc-150 space-y-4 text-xs">
                <h4 className="font-extrabold text-zinc-800 text-sm">Tambah Menu Baru</h4>

                <div className="space-y-1.5">
                  <label className="block font-bold text-zinc-700">Label Menu</label>
                  <input
                    type="text"
                    value={newMenuLabel}
                    onChange={(e) => setNewMenuLabel(e.target.value)}
                    placeholder="Contoh: Sejarah, Kontak"
                    className="block w-full rounded-xl border border-zinc-300 py-2 px-3 focus:border-[#d9a425] outline-none text-zinc-800 bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block font-bold text-zinc-700">Tipe Menu</label>
                  <select
                    value={newMenuType}
                    onChange={(e) => {
                      setNewMenuType(e.target.value);
                      if (e.target.value === 'built_in') setNewMenuValue('#home');
                      else if (e.target.value === 'page' && pagesList.length > 0) setNewMenuValue(pagesList[0].slug);
                      else setNewMenuValue('');
                    }}
                    className="block w-full rounded-xl border border-zinc-300 py-2 px-3 focus:border-[#d9a425] outline-none text-zinc-800 bg-white"
                  >
                    <option value="built_in">Menu Bawaan (Anchor/Sistem)</option>
                    <option value="page">Halaman Kustom</option>
                    <option value="link">Link Luar (External URL)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block font-bold text-zinc-700">Tujuan Penautan</label>

                  {newMenuType === 'built_in' && (
                    <select
                      value={newMenuValue}
                      onChange={(e) => setNewMenuValue(e.target.value)}
                      className="block w-full rounded-xl border border-zinc-300 py-2 px-3 focus:border-[#d9a425] outline-none text-zinc-800 bg-white"
                    >
                      <option value="#home">Beranda</option>
                      <option value="#profil">Sambutan Kepala Sekolah</option>
                      <option value="#visi-misi">Visi &amp; Misi</option>
                      <option value="#galeri">Galeri Foto</option>
                      <option value="#berita">Berita Terbaru</option>
                      <option value="#kontak">Kontak &amp; Lokasi</option>
                      <option value="ppdb">Pendaftaran PPDB Online</option>
                      <option value="ppdb/status">Cek Status PPDB</option>
                    </select>
                  )}

                  {newMenuType === 'page' && (
                    <select
                      value={newMenuValue}
                      onChange={(e) => setNewMenuValue(e.target.value)}
                      className="block w-full rounded-xl border border-zinc-300 py-2 px-3 focus:border-[#d9a425] outline-none text-zinc-800 bg-white"
                    >
                      {pagesList.length === 0 ? (
                        <option value="" disabled>Belum ada halaman kustom. Buat dulu di tab Halaman Kustom!</option>
                      ) : (
                        pagesList.map(page => (
                          <option key={page.id} value={page.slug}>{page.title}</option>
                        ))
                      )}
                    </select>
                  )}

                  {newMenuType === 'link' && (
                    <input
                      type="text"
                      value={newMenuValue}
                      onChange={(e) => setNewMenuValue(e.target.value)}
                      placeholder="https://facebook.com/sekolah"
                      className="block w-full rounded-xl border border-zinc-300 py-2 px-3 focus:border-[#d9a425] outline-none text-zinc-800 bg-white"
                    />
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleAddMenuItem}
                  disabled={!newMenuLabel.trim() || (newMenuType === 'page' && pagesList.length === 0)}
                  className="w-full mt-2 rounded-xl bg-[#d9a425] hover:bg-[#e5c158] disabled:opacity-50 text-black py-2.5 font-bold flex items-center justify-center gap-1.5 transition-all"
                >
                  <Plus className="h-4 w-4" /> Tambah ke Navigasi
                </button>
              </div>

              {/* List Menu Susunan */}
              <div className="md:col-span-7 space-y-4">
                <h4 className="font-extrabold text-zinc-800 text-sm">Susunan Navigasi Aktif</h4>

                {menuItems.length === 0 ? (
                  <div className="text-center py-16 border-2 border-dashed border-zinc-150 rounded-2xl space-y-2 text-zinc-400">
                    <Globe className="h-10 w-10 mx-auto opacity-50" />
                    <p className="text-xs">Navigasi kosong. Gunakan panel sebelah kiri untuk menambahkan menu.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {menuItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3.5 bg-white border border-zinc-200 rounded-xl shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="min-w-0 text-xs">
                          <p className="font-extrabold text-zinc-800 text-sm">{item.label}</p>
                          <p className="text-[10px] text-zinc-500 mt-0.5">
                            Tipe: <span className="font-bold text-zinc-700 capitalize">{item.type}</span> |
                            Tujuan: <span className="font-mono text-zinc-650 bg-zinc-50 px-1 rounded">{item.value}</span>
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Reordering */}
                          <button
                            type="button"
                            onClick={() => handleMoveMenuItem(idx, -1)}
                            disabled={idx === 0}
                            className="p-1.5 text-zinc-400 hover:text-zinc-700 disabled:opacity-30 hover:bg-zinc-50 rounded-lg"
                            title="Pindah Ke Atas"
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveMenuItem(idx, 1)}
                            disabled={idx === menuItems.length - 1}
                            className="p-1.5 text-zinc-400 hover:text-zinc-700 disabled:opacity-30 hover:bg-zinc-50 rounded-lg"
                            title="Pindah Ke Bawah"
                          >
                            ▼
                          </button>

                          {/* Remove */}
                          <button
                            type="button"
                            onClick={() => handleRemoveMenuItem(idx)}
                            className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                            title="Hapus Menu"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}

                    <div className="flex justify-end pt-4 border-t border-zinc-150">
                      <button
                        type="button"
                        onClick={handleSaveMenus}
                        disabled={menuSaving}
                        className="rounded-xl bg-[#d9a425] hover:bg-[#e5c158] text-black px-6 py-2.5 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-[#d9a425]/10"
                      >
                        {menuSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                        Simpan Susunan Menu
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

      </div>

      {/* PAGE DIALOG MODAL */}
      {showPageModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-zinc-150 overflow-hidden text-xs">
            <div className="px-6 py-4.5 border-b border-zinc-150 flex justify-between items-center bg-zinc-50/50">
              <h3 className="font-extrabold text-zinc-900 text-sm">
                {editingPage ? 'Edit Halaman Kustom' : 'Buat Halaman Kustom Baru'}
              </h3>
              <button onClick={() => setShowPageModal(false)} className="text-zinc-400 hover:text-zinc-650 font-bold">✕</button>
            </div>

            <form onSubmit={handlePageSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="block font-bold text-zinc-700">Judul Halaman</label>
                <input
                  type="text"
                  required
                  value={pageTitle}
                  onChange={(e) => setPageTitle(e.target.value)}
                  placeholder="Contoh: Sejarah Berdirinya Yayasan"
                  className="block w-full rounded-xl border border-zinc-300 py-2.5 px-3 focus:border-[#d9a425] outline-none text-zinc-800 bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-zinc-700">Konten Halaman (Format teks kosong didukung)</label>
                <textarea
                  rows="12"
                  required
                  value={pageContent}
                  onChange={(e) => setPageContent(e.target.value)}
                  placeholder="Tulis sejarah sekolah, profil, program, visi misi, atau informasi penting lainnya..."
                  className="block w-full rounded-xl border border-zinc-300 py-2.5 px-3 focus:border-[#d9a425] outline-none text-zinc-850 bg-white leading-relaxed font-light text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-zinc-700">Status Halaman</label>
                <select
                  value={pageStatus}
                  onChange={(e) => setPageStatus(e.target.value)}
                  className="block w-full rounded-xl border border-zinc-300 py-2.5 px-3 focus:border-[#d9a425] outline-none text-zinc-800 bg-white"
                >
                  <option value="published">Terbitkan Langsung (Published)</option>
                  <option value="draft">Simpan Sebagai Draft</option>
                </select>
              </div>

              <div className="pt-4 border-t border-zinc-150 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowPageModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-350 hover:bg-zinc-50 font-bold text-zinc-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={pageSubmitLoading}
                  className="px-5 py-2.5 rounded-xl bg-[#d9a425] hover:bg-[#e5c158] font-bold text-black flex items-center gap-1.5 transition-all shadow-sm"
                >
                  {pageSubmitLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Simpan Halaman
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



      {/* YEAR MODAL DIALOG */}
      {showYearModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl border border-zinc-150 overflow-hidden text-xs">
            <div className="px-6 py-4.5 border-b border-zinc-150 flex justify-between items-center bg-zinc-50/50">
              <h3 className="font-extrabold text-zinc-900 text-sm">
                {editingYear ? 'Edit Tahun Ajaran' : 'Tambah Tahun Ajaran'}
              </h3>
              <button onClick={() => setShowYearModal(false)} className="text-zinc-400 hover:text-zinc-600 font-bold">✕</button>
            </div>
            <form onSubmit={handleYearSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="block font-bold text-zinc-700">Tahun Ajaran</label>
                <input
                  type="text"
                  required
                  value={yearName}
                  onChange={(e) => setYearName(e.target.value)}
                  placeholder="Contoh: 2025/2026"
                  className="block w-full rounded-xl border border-zinc-350 py-2.5 px-3 focus:border-[#d4af37] outline-none text-zinc-800"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="year-active"
                  checked={yearIsActive}
                  onChange={(e) => setYearIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300 text-[#d4af37] focus:ring-[#d4af37]"
                />
                <label htmlFor="year-active" className="font-bold text-zinc-700 cursor-pointer">Jadikan Tahun Ajaran Aktif</label>
              </div>

              <div className="pt-4 border-t border-zinc-150 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowYearModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-300 hover:bg-zinc-50 font-bold text-zinc-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={academicSubmitLoading}
                  className="px-5 py-2.5 rounded-xl bg-[#d4af37] hover:bg-[#f3cb65] font-bold text-black flex items-center gap-1"
                >
                  {academicSubmitLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SEMESTER MODAL DIALOG */}
      {showSemesterModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl border border-zinc-150 overflow-hidden text-xs">
            <div className="px-6 py-4.5 border-b border-zinc-150 flex justify-between items-center bg-zinc-50/50">
              <h3 className="font-extrabold text-zinc-900 text-sm">
                {editingSemester ? 'Edit Semester' : 'Tambah Semester'}
              </h3>
              <button onClick={() => setShowSemesterModal(false)} className="text-zinc-400 hover:text-zinc-650 font-bold">✕</button>
            </div>
            <form onSubmit={handleSemesterSubmit} className="p-6 space-y-4">

              <div className="space-y-1.5">
                <label className="block font-bold text-zinc-700">Tahun Ajaran Terikat</label>
                <select
                  value={semesterYearId}
                  onChange={(e) => setSemesterYearId(e.target.value)}
                  className="block w-full rounded-xl border border-zinc-300 py-2.5 px-3 focus:border-[#d4af37] outline-none text-zinc-800"
                >
                  {academicYears.map(year => (
                    <option key={year.id} value={year.id}>{year.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-zinc-700">Nama Semester</label>
                <select
                  value={semesterName}
                  onChange={(e) => setSemesterName(e.target.value)}
                  className="block w-full rounded-xl border border-zinc-300 py-2.5 px-3 focus:border-[#d4af37] outline-none text-zinc-800"
                >
                  <option value="Ganjil">Semester Ganjil</option>
                  <option value="Genap">Semester Genap</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-zinc-700">Status</label>
                <select
                  value={semesterStatus}
                  onChange={(e) => setSemesterStatus(e.target.value)}
                  className="block w-full rounded-xl border border-zinc-300 py-2.5 px-3 focus:border-[#d4af37] outline-none text-zinc-800"
                >
                  <option value="active">Aktif</option>
                  <option value="inactive">Nonaktif</option>
                </select>
              </div>

              <div className="pt-4 border-t border-zinc-150 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowSemesterModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-300 hover:bg-zinc-50 font-bold text-zinc-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={academicSubmitLoading}
                  className="px-5 py-2.5 rounded-xl bg-[#d4af37] hover:bg-[#f3cb65] font-bold text-black flex items-center gap-1"
                >
                  {academicSubmitLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
