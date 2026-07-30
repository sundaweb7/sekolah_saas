import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../config/axios';
import TenantWebsiteLayout from '../../layouts/TenantWebsiteLayout';
import { ArrowLeft, Calendar, Folder, Volume2, Newspaper, ChevronRight } from 'lucide-react';

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
  const [allNews, setAllNews] = useState([]);
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

        // 1. Fetch current article details
        const detailRes = await api.get(`/tenant/news/detail/${slug}`, {
          headers: { 'X-School-ID': subdomain }
        });
        setNews(detailRes.data);

        // 2. Fetch all news for sidebar and related posts
        const profileRes = await api.get(`/tenant/profile`, {
          headers: { 'X-School-ID': subdomain }
        });
        setAllNews(profileRes.data?.news || []);
      } catch (err) {
        setError('Gagal memuat artikel berita atau artikel tidak ditemukan.');
      } finally {
        setLoading(false);
      }
    };

    fetchNewsData();
  }, [schoolSlug, slug]);

  // Filter dynamic lists
  const sidebarPosts = allNews
    .filter(item => item.id !== news?.id)
    .slice(0, 5);

  const relatedPosts = allNews
    .filter(item => item.id !== news?.id && item.category_id === news?.category_id)
    .slice(0, 3);
  const finalRelated = relatedPosts.length > 0
    ? relatedPosts
    : allNews.filter(item => item.id !== news?.id).slice(0, 3);

  return (
    <TenantWebsiteLayout>
      <div className="w-full bg-slate-50 text-[#111111] min-h-screen pt-8 pb-20 font-sans">
        <div className="max-w-6xl mx-auto px-6 space-y-6">

          {/* Back Button */}
          <div>
            <button
              onClick={() => navigate(-1)}
              className="group inline-flex items-center gap-2 text-xs font-bold text-zinc-550 hover:text-primary transition-colors bg-white px-4 py-2 rounded-xl shadow-sm border border-zinc-200"
            >
              <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" /> Kembali ke Berita
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-primary"></div>
              <p className="text-zinc-500 text-xs font-semibold">Memuat artikel...</p>
            </div>
          ) : error || !news ? (
            <div className="text-center py-32 space-y-4">
              <Volume2 className="h-12 w-12 mx-auto text-zinc-300" />
              <p className="text-sm text-zinc-550">{error || 'Artikel tidak ditemukan.'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

              {/* Left Column: News Detail Content */}
              <article className="lg:col-span-8 bg-white border border-zinc-200/80 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
                {/* Category & Date Meta */}
                <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-primary uppercase tracking-wider">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(news.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                  {news.category_name && (
                    <span className="flex items-center gap-1 bg-primary/10 px-2.5 py-0.5 rounded border border-primary/20">
                      <Folder className="h-3 w-3" />
                      {news.category_name}
                    </span>
                  )}
                </div>

                {/* Title */}
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tight text-[#111111] leading-tight" style={{ fontFamily: "'Fraunces', serif" }}>
                  {news.title}
                </h1>

                {/* Image Illustration */}
                {news.image && (
                  <div className="rounded-2xl overflow-hidden border border-zinc-100 bg-zinc-50 shadow-md">
                    <img
                      src={`${BACKEND_BASE}/${news.image}`}
                      alt={news.title}
                      className="w-full max-h-[400px] object-cover hover:scale-[1.02] transition-transform duration-500"
                    />
                  </div>
                )}

                {/* Content Text Body */}
                <div className="text-[#333333] leading-relaxed text-sm md:text-base whitespace-pre-line font-light pt-2 space-y-4">
                  {news.content}
                </div>
              </article>

              {/* Right Column: News Sidebar */}
              <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
                <div className="bg-white border border-zinc-200/80 rounded-3xl p-6 shadow-sm space-y-5">
                  <h3 className="font-extrabold text-sm uppercase tracking-widest text-primary flex items-center gap-1.5 border-b border-zinc-150 pb-3">
                    <Newspaper className="h-4 w-4" /> Berita Terbaru
                  </h3>

                  {sidebarPosts.length === 0 ? (
                    <p className="text-xs text-zinc-400">Tidak ada berita lainnya.</p>
                  ) : (
                    <div className="space-y-4">
                      {sidebarPosts.map((post) => (
                        <Link
                          key={post.id}
                          to={schoolSlug ? `/school/${schoolSlug}/news/${post.slug}` : `/news/${post.slug}`}
                          className="flex gap-3 group items-center"
                        >
                          {post.image ? (
                            <img
                              src={`${BACKEND_BASE}/${post.image}`}
                              alt={post.title}
                              className="h-14 w-14 rounded-xl object-cover shrink-0 border border-zinc-100 group-hover:opacity-95"
                            />
                          ) : (
                            <div className="h-14 w-14 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0">
                              <Newspaper className="h-5 w-5 text-zinc-400" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-bold text-zinc-800 line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                              {post.title}
                            </h4>
                            <p className="text-[10px] text-zinc-500 mt-1">
                              {new Date(post.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </aside>

            </div>
          )}

          {/* Bottom Row: Related Posts Section */}
          {!loading && !error && finalRelated.length > 0 && (
            <div className="border-t border-zinc-200/80 pt-10 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-zinc-900 tracking-tight" style={{ fontFamily: "'Fraunces', serif" }}>
                  Artikel Terkait
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {finalRelated.map((post) => (
                  <Link
                    key={post.id}
                    to={schoolSlug ? `/school/${schoolSlug}/news/${post.slug}` : `/news/${post.slug}`}
                    className="bg-white border border-zinc-200/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 group flex flex-col justify-between"
                  >
                    <div>
                      {post.image ? (
                        <div className="aspect-video w-full overflow-hidden">
                          <img
                            src={`${BACKEND_BASE}/${post.image}`}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      ) : (
                        <div className="aspect-video w-full bg-zinc-100 flex items-center justify-center">
                          <Newspaper className="h-8 w-8 text-zinc-400" />
                        </div>
                      )}

                      <div className="p-4 space-y-2.5">
                        <span className="inline-block text-[9px] font-extrabold uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/15">
                          {post.category_name || 'Berita'}
                        </span>
                        <h4 className="font-bold text-sm text-zinc-900 line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                          {post.title}
                        </h4>
                      </div>
                    </div>

                    <div className="px-4 pb-4 pt-2 flex items-center justify-between border-t border-zinc-100 text-[10px] text-zinc-550 font-semibold">
                      <span>{new Date(post.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      <span className="flex items-center gap-0.5 text-primary group-hover:translate-x-0.5 transition-transform">
                        Baca <ChevronRight className="h-3 w-3" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </TenantWebsiteLayout>
  );
}
