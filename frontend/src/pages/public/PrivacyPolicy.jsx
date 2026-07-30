import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-16 text-zinc-300">
      <article className="mx-auto max-w-3xl space-y-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-8">
        <h1 className="text-3xl font-bold text-white">Kebijakan Privasi</h1>
        <p>Data siswa dan wali diproses untuk pendaftaran, kegiatan akademik, komunikasi sekolah, serta administrasi pembayaran oleh sekolah yang menjadi pengendali data.</p>
        <h2 className="text-xl font-semibold text-white">Data yang diproses</h2>
        <p>Data identitas siswa, orang tua/wali, kelas, kehadiran, laporan perkembangan, tagihan, serta dokumen yang secara khusus diminta sekolah.</p>
        <h2 className="text-xl font-semibold text-white">Akses dan penyimpanan</h2>
        <p>Akses dibatasi menurut peran pengguna dan tenant sekolah. Dokumen privat hanya tersedia bagi petugas berwenang. Masa simpan mengikuti kebutuhan pendidikan, kewajiban hukum, dan kebijakan sekolah.</p>
        <h2 className="text-xl font-semibold text-white">Hak wali dan siswa</h2>
        <p>Permintaan koreksi, salinan, pembatasan, atau penghapusan data dapat diajukan kepada sekolah terkait. Sebagian data mungkin perlu dipertahankan untuk kewajiban administrasi atau hukum.</p>
        <p className="text-sm text-amber-300">Sekolah perlu menyesuaikan kebijakan ini dengan identitas badan hukum, kontak petugas, periode retensi, dan peraturan yang berlaku sebelum production.</p>
        <Link to="/" className="inline-block text-indigo-400 hover:underline">Kembali</Link>
      </article>
    </main>
  );
}
