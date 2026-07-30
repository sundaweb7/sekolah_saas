import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../config/axios';
import TenantWebsiteLayout from '../../layouts/TenantWebsiteLayout';
import { ArrowLeft, BookOpen, Volume2 } from 'lucide-react';

export default function SchoolPageDetail() {
  const { schoolSlug, slug } = useParams();
  const navigate = useNavigate();
  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPageDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const host = window.location.hostname;
        let subdomain = host.split('.')[0];
        if (subdomain === 'localhost' || subdomain === '127') {
          subdomain = schoolSlug || 'tkmelati';
        }
        
        const response = await api.get(`/tenant/page/detail/${slug}`, {
          headers: {
            'X-School-ID': subdomain
          }
        });
        setPageData(response.data);
      } catch (err) {
        setError('Halaman tidak ditemukan atau terjadi kesalahan saat memuat data.');
      } finally {
        setLoading(false);
      }
    };

    fetchPageDetail();
  }, [schoolSlug, slug]);

  return (
    <TenantWebsiteLayout>
      <div className="w-full bg-white text-[#111111] min-h-screen pt-24 pb-20 font-sans">
        <div className="max-w-3xl mx-auto px-6 space-y-8">
          
          {/* Back Button */}
          <button 
            onClick={() => navigate(-1)}
            className="group inline-flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-[#d9a425] transition-colors"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> Kembali
          </button>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-[#d9a425]"></div>
              <p className="text-zinc-500 text-xs font-semibold">Memuat halaman...</p>
            </div>
          ) : error || !pageData ? (
            <div className="text-center py-20 space-y-4">
              <Volume2 className="h-12 w-12 mx-auto text-zinc-300" />
              <p className="text-sm text-zinc-500">{error || 'Halaman tidak ditemukan.'}</p>
            </div>
          ) : (
            <article className="space-y-6">
              
              {/* Category & Date Meta */}
              <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-[#b38f1d] uppercase tracking-wider">
                <span className="flex items-center gap-1 bg-[#d9a425]/10 px-2.5 py-0.5 rounded border border-[#d9a425]/20">
                  <BookOpen className="h-3.5 w-3.5" />
                  Halaman Kustom
                </span>
                <span>
                  Diperbarui pada {new Date(pageData.updated_at || pageData.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-[#111111] leading-tight" style={{ fontFamily: "'Fraunces', serif" }}>
                {pageData.title}
              </h1>

              {/* Content Text Body */}
              <div className="text-[#333333] leading-relaxed text-sm md:text-base whitespace-pre-line font-light pt-4 space-y-4">
                {pageData.content}
              </div>

            </article>
          )}

        </div>
      </div>
    </TenantWebsiteLayout>
  );
}
