import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '../../../config/axios';
import { 
  Palette, Phone, User, CheckCircle, AlertTriangle, 
  Loader2, Globe, FileText, Image as ImageIcon, Calendar, Plus, Trash2, Edit, Upload, Sparkles, BookOpen, X
} from 'lucide-react';

const websiteSchema = z.object({
  themeColor: z.string().regex(/^#[0-9A-F]{6}$/i, { message: 'Format warna hex tidak valid' }),
  themeTemplate: z.string().optional(),
  footerText: z.string().optional(),
  googleMapsIframe: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional()
});

export default function WebsiteEditor() {
  const [activeTab, setActiveTab] = useState('tampilan');
  const [logoFile, setLogoFile] = useState(null);
  const [faviconFile, setFaviconFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  // Content state (gallery, events)
  const [contents, setContents] = useState([]);
  const [contentLoading, setContentLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingContent, setEditingContent] = useState(null);

  // Content form state
  const [contentTitle, setContentTitle] = useState('');
  const [contentText, setContentText] = useState('');
  const [contentDate, setContentDate] = useState('');
  const [contentStatus, setContentStatus] = useState('published');
  const [contentFile, setContentFile] = useState(null);

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
        
        const contacts = settings.contact_info;
        if (contacts) {
          setValue('phone', contacts.phone || '');
          setValue('email', contacts.email || '');
          setValue('address', contacts.address || '');
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

  const fetchContents = async (type) => {
    setContentLoading(true);
    try {
      const response = await api.get(`/admin/website/contents?type=${type}`);
      setContents(response.data.data || response.data);
    } catch (err) {
      setError('Gagal memuat konten.');
    } finally {
      setContentLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [setValue]);

  useEffect(() => {
    if (activeTab !== 'tampilan' && activeTab !== 'konten_utama') {
      let contentType = 'news';
      if (activeTab === 'galeri') contentType = 'gallery';
      if (activeTab === 'agenda') contentType = 'event';
      fetchContents(contentType);
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
      address: data.address
    };
    formData.append('contact_info', JSON.stringify(contactInfo));

    if (logoFile) formData.append('logo_file', logoFile);
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

  const handleContentSubmit = async (e) => {
    e.preventDefault();
    let contentType = 'gallery';
    if (activeTab === 'agenda') contentType = 'event';

    const formData = new FormData();
    formData.append('type', contentType);
    formData.append('title', contentTitle);
    formData.append('content', contentText);
    formData.append('status', contentStatus);

    if (contentDate) {
      formData.append('event_date', contentDate);
    }
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
      resetContentForm();
      fetchContents(contentType);
    } catch (err) {
      setError('Gagal menyimpan konten.');
    }
  };

  const handleDeleteContent = async (id) => {
    if (!confirm('Apakah Anda yakin ingin menghapus konten ini?')) return;
    try {
      await api.delete(`/admin/website/contents/delete/${id}`);
      let contentType = 'gallery';
      if (activeTab === 'agenda') contentType = 'event';
      fetchContents(contentType);
    } catch (err) {
      setError('Gagal menghapus konten.');
    }
  };

  const openAddModal = () => {
    resetContentForm();
    setEditingContent(null);
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingContent(item);
    setContentTitle(item.title);
    setContentText(item.content || '');
    setContentDate(item.event_date || '');
    setContentStatus(item.status || 'published');
    setShowModal(true);
  };

  const resetContentForm = () => {
    setContentTitle('');
    setContentText('');
    setContentDate('');
    setContentStatus('published');
    setContentFile(null);
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
              <Globe className="h-8 w-8 text-[#aa8410]" /> Website Builder
            </h1>
            <p className="mt-1 text-sm text-zinc-550">
              Kelola pengaturan tampilan, logo, konten halaman utama, berita, dan galeri sekolah Anda secara dinamis.
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
            onClick={() => setActiveTab('galeri')}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${activeTab === 'galeri' ? 'border-[#d4af37] text-zinc-900' : 'border-transparent text-zinc-500 hover:text-zinc-900'}`}
          >
            <ImageIcon className="h-4 w-4" /> Galeri Foto
          </button>
          <button 
            onClick={() => setActiveTab('agenda')}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${activeTab === 'agenda' ? 'border-[#d4af37] text-zinc-900' : 'border-transparent text-zinc-500 hover:text-zinc-900'}`}
          >
            <Calendar className="h-4 w-4" /> Agenda Kegiatan
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
                    <option value="ceria">Playful Ceria (TK/PAUD)</option>
                    <option value="modern">Modern Sleek</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300">Logo Sekolah</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
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
                  <label className="block text-xs font-semibold uppercase text-zinc-400">Alamat Lengkap</label>
                  <textarea
                    rows="3"
                    {...register('address')}
                    placeholder="Jl. Raya Merdeka No. 45..."
                    className="block w-full mt-1.5 rounded-lg border border-zinc-800 bg-zinc-950 py-2.5 px-3 text-sm text-white focus:border-[#d4af37] outline-none"
                  />
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

        {/* Tab 3: Galeri Foto */}
        {activeTab === 'galeri' && (
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-150 pb-3">
              <div className="flex items-center gap-3">
                <ImageIcon className="h-5 w-5 text-[#aa8410]" />
                <h2 className="text-xl font-bold text-zinc-950">Galeri Foto Kegiatan</h2>
              </div>
              <button 
                onClick={openAddModal}
                className="rounded-xl bg-[#d4af37] hover:bg-[#f3cb65] px-4 py-2 text-xs font-bold text-black flex items-center gap-1.5 transition-colors"
              >
                <Plus className="h-4 w-4" /> Tambah Foto
              </button>
            </div>

            {contentLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-[#d4af37]" />
              </div>
            ) : contents.length === 0 ? (
              <p className="text-zinc-500 text-sm text-center py-10">Belum ada foto galeri.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {contents.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-zinc-200 bg-white overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
                    <div>
                      {item.image && (
                        <img 
                          src={`http://${window.location.hostname}:8080/${item.image}`} 
                          alt="" 
                          className="h-40 w-full object-cover border-b border-zinc-150" 
                        />
                      )}
                      <div className="p-4 space-y-1">
                        <h4 className="font-bold text-sm text-zinc-900">{item.title}</h4>
                        <p className="text-xs text-zinc-500 line-clamp-2">{item.content}</p>
                      </div>
                    </div>

                    <div className="p-4 border-t border-zinc-100 flex justify-end gap-2">
                      <button 
                        onClick={() => openEditModal(item)}
                        className="p-1.5 text-zinc-400 hover:text-[#d4af37] transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteContent(item.id)}
                        className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Agenda Kegiatan */}
        {activeTab === 'agenda' && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-[#d4af37]" />
                <h2 className="text-xl font-semibold text-white">Agenda Kegiatan Sekolah</h2>
              </div>
              <button 
                onClick={openAddModal}
                className="rounded-lg bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 text-xs font-bold text-white flex items-center gap-1.5"
              >
                <Plus className="h-4 w-4" /> Tambah Agenda
              </button>
            </div>

            {contentLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-[#d4af37]" />
              </div>
            ) : contents.length === 0 ? (
              <p className="text-zinc-500 text-sm text-center py-10">Belum ada agenda kegiatan.</p>
            ) : (
              <div className="space-y-4">
                {contents.map((item) => (
                  <div key={item.id} className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 flex justify-between items-center gap-4">
                    <div className="space-y-1">
                      <h4 className="font-bold text-sm text-white">{item.title}</h4>
                      <p className="text-xs text-[#d4af37] font-mono">
                        📅 {item.event_date ? new Date(item.event_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                      </p>
                      <p className="text-xs text-zinc-400 font-light">{item.content}</p>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <button 
                        onClick={() => openEditModal(item)}
                        className="p-1.5 text-zinc-400 hover:text-[#d4af37]"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteContent(item.id)}
                        className="p-1.5 text-zinc-400 hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Content Form Modal (For Gallery & Agenda add/edit) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-850 bg-zinc-950 p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <h3 className="text-lg font-bold text-white">
                {editingContent ? 'Edit Konten' : 'Tambah Konten Baru'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleContentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">Judul Konten</label>
                <input 
                  type="text" 
                  required
                  value={contentTitle}
                  onChange={(e) => setContentTitle(e.target.value)}
                  placeholder="Masukkan judul menarik"
                  className="block w-full mt-1.5 rounded-xl border border-zinc-850 bg-zinc-900 py-2.5 px-3.5 text-sm text-white focus:border-[#d4af37] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">Keterangan / Isi Deskripsi</label>
                <textarea 
                  rows="4"
                  value={contentText}
                  onChange={(e) => setContentText(e.target.value)}
                  placeholder="Tulis isi deskripsi selengkapnya..."
                  className="block w-full mt-1.5 rounded-xl border border-zinc-850 bg-zinc-900 py-2.5 px-3.5 text-sm text-white focus:border-[#d4af37] outline-none"
                />
              </div>

              {activeTab === 'agenda' && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">Tanggal Pelaksanaan Kegiatan</label>
                  <input 
                    type="date" 
                    required
                    value={contentDate}
                    onChange={(e) => setContentDate(e.target.value)}
                    className="block w-full mt-1.5 rounded-xl border border-zinc-850 bg-zinc-900 py-2.5 px-3.5 text-sm text-white focus:border-[#d4af37] outline-none"
                  />
                </div>
              )}

              {activeTab === 'galeri' && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">Upload Berkas Foto</label>
                  <input 
                    type="file" 
                    accept="image/*"
                    required={!editingContent}
                    onChange={(e) => setContentFile(e.target.files?.[0] || null)}
                    className="block w-full mt-2 text-xs text-zinc-400"
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-900">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-zinc-850 px-4 py-2.5 text-xs font-bold text-zinc-400 hover:text-white"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="rounded-xl bg-[#d4af37] hover:bg-[#f3cb65] px-6 py-2.5 text-xs font-bold text-black transition-colors"
                >
                  Simpan Konten
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
