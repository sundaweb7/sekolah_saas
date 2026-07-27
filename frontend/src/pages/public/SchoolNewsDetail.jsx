import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../config/axios';
import TenantWebsiteLayout from '../../layouts/TenantWebsiteLayout';
import { ArrowLeft, Calendar, Folder, Volume2 } from 'lucide-react';

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

export default function SchoolNewsDetail() {
  const { schoolSlug, slug } = useParams();
  const navigate = useNavigate();
  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNewsDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const host = window.location.hostname;
        let subdomain = host.split('.')[0];
        if (subdomain === 'localhost' || subdomain === '127') {
          subdomain = schoolSlug || 'tkmelati';
        }
        
        const response = await api.get(`/tenant/news/detail/${slug}`, {
          headers: {
            'X-School-ID': subdomain
          }
        });
        setNews(response.data);
      } catch (err) {
        setError('Gagal memuat artikel berita atau artikel tidak ditemukan.');
      } finally {
        setLoading(false);
      }
    };

    fetchNewsDetail();
  }, [schoolSlug, slug]);

  return (
    <TenantWebsiteLayout>
      <div className="w-full bg-white text-[#111111] min-h-screen pt-24 pb-20" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <div className="max-w-3xl mx-auto px-6 space-y-8">
          
          {/* Back Button */}
          <button 
            onClick={() => navigate(-1)}
            className="group inline-flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-[#d4af37] transition-colors"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> Kembali
          </button>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-[#d4af37]"></div>
              <p className="text-zinc-500 text-xs font-semibold">Memuat artikel...</p>
            </div>
          ) : error || !news ? (
            <div className="text-center py-20 space-y-4">
              <Volume2 className="h-12 w-12 mx-auto text-zinc-300" />
              <p className="text-sm text-zinc-500">{error || 'Artikel tidak ditemukan.'}</p>
            </div>
          ) : (
            <article className="space-y-6">
              
              {/* Category & Date Meta */}
              <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-[#b38f1d] uppercase tracking-wider">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(news.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
                {news.category_name && (
                  <span className="flex items-center gap-1 bg-[#d4af37]/10 px-2.5 py-0.5 rounded border border-[#d4af37]/20">
                    <Folder className="h-3 w-3" />
                    {news.category_name}
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-[#111111] leading-tight" style={{ fontFamily: "'Fraunces', serif" }}>
                {news.title}
              </h1>

              {/* Image Illustration */}
              {news.image && (
                <div className="rounded-[2rem] overflow-hidden border border-zinc-200 bg-[#fafafa] p-2 shadow-lg">
                  <img 
                    src={`${BACKEND_BASE}/${news.image}`} 
                    alt={news.title} 
                    className="w-full max-h-[450px] object-cover rounded-[1.8rem]" 
                  />
                </div>
              )}

              {/* Content Text Body */}
              <div className="text-[#333333] leading-relaxed text-sm md:text-base whitespace-pre-line font-light pt-4 space-y-4">
                {news.content}
              </div>

            </article>
          )}

        </div>
      </div>
    </TenantWebsiteLayout>
  );
}
