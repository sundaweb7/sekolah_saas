import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../config/axios';
import TenantWebsiteLayout from '../../layouts/TenantWebsiteLayout';
import { Newspaper, Calendar, ArrowRight, ImageIcon } from 'lucide-react';

function getBackendBase() {
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

export default function SchoolNewsList() {
  const { schoolSlug } = useParams();
  const [news, setNews] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNewsData = async () => {
      setLoading(true);
      setError(null);
      try {
        const host = window.location.hostname;
        let subdomain = host.split('.')[0];
        if (subdomain === 'localhost' || subdomain === '127') {
          subdomain = schoolSlug || 'tkmelati';
        }
        
        const profileRes = await api.get(`/tenant/profile`, {
          headers: { 'X-School-ID': subdomain }
        });
        
        setNews(profileRes.data?.news || []);
        setCategories(profileRes.data?.categories || []);
      } catch (err) {
        setError('Gagal memuat daftar berita.');
      } finally {
        setLoading(false);
      }
    };

    fetchNewsData();
  }, [schoolSlug]);

  const filteredNews = selectedCategoryId === 'all' 
    ? news 
    : news.filter(item => String(item.category_id) === String(selectedCategoryId));

  return (
    <TenantWebsiteLayout>
      <div className="w-full bg-[#fafafa] text-[#111111] min-h-screen pt-8 pb-20 font-sans">
        <div className="max-w-6xl mx-auto px-6 space-y-8">
          
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Arsip Kabar</span>
            <h1 className="text-3xl font-bold text-zinc-950 flex items-center gap-2">
              <Newspaper className="h-8 w-8 text-zinc-800" /> Berita & Kegiatan Sekolah
            </h1>
            <p className="text-sm text-zinc-555">Ikuti terus kabar kegiatan dan pengumuman terbaru sekolah</p>
          </div>

          {/* Category Filters */}
          {categories && categories.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-2 pb-4">
              <button
                onClick={() => setSelectedCategoryId('all')}
                className={`rounded-full px-5 py-2 text-xs font-bold transition-all duration-300 ${
                  selectedCategoryId === 'all'
                    ? 'bg-zinc-950 text-white shadow-md'
                    : 'bg-white border border-zinc-200 text-zinc-650 hover:border-zinc-300'
                }`}
              >
                Semua Berita
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`rounded-full px-5 py-2 text-xs font-bold transition-all duration-300 ${
                    String(selectedCategoryId) === String(cat.id)
                      ? 'bg-zinc-950 text-white shadow-md'
                      : 'bg-white border border-zinc-200 text-zinc-650 hover:border-zinc-300'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-[#d9a425]"></div>
              <p className="text-zinc-500 text-xs font-semibold">Memuat berita...</p>
            </div>
          ) : error ? (
            <div className="text-center py-32 space-y-4">
              <p className="text-sm text-zinc-555">{error}</p>
            </div>
          ) : filteredNews.length === 0 ? (
            <div className="text-center py-20 text-zinc-400 text-sm">Tidak ada berita yang ditemukan.</div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8">
              {filteredNews.map((item) => (
                <Link 
                  key={item.id} 
                  to={schoolSlug ? `/school/${schoolSlug}/news/${item.slug || item.id}` : `/news/${item.slug || item.id}`} 
                  className="group bg-white rounded-xl overflow-hidden border border-zinc-200 hover:border-zinc-300 hover:shadow-md transition-all flex flex-col justify-between h-full"
                >
                  <div>
                    <div className="h-48 w-full overflow-hidden bg-zinc-100">
                      {item.image ? (
                        <img 
                          src={`${BACKEND_BASE}/${item.image}`} 
                          alt={item.title} 
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" 
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-zinc-300">
                          <ImageIcon className="h-10 w-10" />
                        </div>
                      )}
                    </div>
                    <div className="p-6 space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-bold text-zinc-450 uppercase tracking-widest">
                        <span>{new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        {item.category_name && (
                          <span className="bg-zinc-100 px-2 py-0.5 rounded text-[8px] tracking-widest text-zinc-650">{item.category_name}</span>
                        )}
                      </div>
                      <h3 className="font-bold text-zinc-950 text-base line-clamp-2 leading-snug group-hover:text-zinc-600 transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-xs text-zinc-500 leading-relaxed line-clamp-3 font-light">
                        {item.content}
                      </p>
                    </div>
                  </div>
                  <div className="px-6 pb-5">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-zinc-800 uppercase tracking-widest hover:underline">
                      Baca Selengkapnya <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}

        </div>
      </div>
    </TenantWebsiteLayout>
  );
}
