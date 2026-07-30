import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CalendarDays, Check, CheckCheck, ChevronLeft, Clock, Loader2, Mail, MessageCircle, Plus, Send, UserCheck } from 'lucide-react';
import api from '../../config/axios';
import { useAuth } from '../../context/AuthContext';

const unwrap = (response) => response?.data ?? response;
const formatDate = (value) => value ? new Date(String(value).replace(' ', 'T')).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-';

export default function CommunicationCenter() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('messages');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [threads, setThreads] = useState([]);
  const [notifications, setNotifications] = useState({ items: [], unread_count: 0 });
  const [requests, setRequests] = useState([]);
  const [events, setEvents] = useState([]);
  const [directory, setDirectory] = useState({ contacts: [], classes: [], children: [] });
  const [selectedThread, setSelectedThread] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [message, setMessage] = useState('');
  const [showCompose, setShowCompose] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);

  const canManage = ['admin', 'teacher'].includes(user?.role);
  const roleHome = user?.role === 'admin' ? '/admin' : user?.role === 'teacher' ? '/teacher' : '/parent';

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [threadRes, notificationRes, requestRes, eventRes, contactRes] = await Promise.all([
        api.get('/communication/threads'), api.get('/communication/notifications'),
        api.get('/communication/requests'), api.get('/communication/events'), api.get('/communication/contacts'),
      ]);
      setThreads(unwrap(threadRes) || []);
      setNotifications(unwrap(notificationRes) || { items: [], unread_count: 0 });
      setRequests(unwrap(requestRes) || []);
      setEvents(unwrap(eventRes) || []);
      setDirectory(unwrap(contactRes) || { contacts: [], classes: [], children: [] });
    } catch (err) {
      setError(err.message || 'Pusat komunikasi gagal dimuat.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const openThread = async (thread) => {
    setSelectedThread(thread);
    try {
      const response = await api.get(`/communication/threads/${thread.id}/messages`);
      setConversation(unwrap(response));
      setThreads((items) => items.map((item) => item.id === thread.id ? { ...item, unread_count: 0 } : item));
    } catch (err) { setError(err.message); }
  };

  const sendMessage = async (event) => {
    event.preventDefault();
    if (!message.trim() || !selectedThread) return;
    try {
      await api.post(`/communication/threads/${selectedThread.id}/messages`, { message });
      setMessage('');
      await openThread(selectedThread);
      loadAll();
    } catch (err) { setError(err.message); }
  };

  const unreadThreads = useMemo(() => threads.reduce((sum, item) => sum + Number(item.unread_count || 0), 0), [threads]);
  const tabs = [
    { id: 'messages', label: 'Pesan', icon: MessageCircle, badge: unreadThreads },
    { id: 'notifications', label: 'Notifikasi', icon: Bell, badge: notifications.unread_count },
    { id: 'requests', label: 'Izin & Penjemputan', icon: UserCheck, badge: requests.filter((item) => item.status === 'pending').length },
    { id: 'events', label: 'Kalender', icon: CalendarDays, badge: 0 },
  ];

  if (loading) return <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-amber-400" /></div>;

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900">
      <header className="sticky top-0 z-20 border-b border-zinc-800 bg-zinc-950 text-white">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4">
          <button onClick={() => navigate(roleHome)} className="rounded-xl p-2 hover:bg-zinc-800" aria-label="Kembali"><ChevronLeft /></button>
          <div className="flex-1"><h1 className="font-bold">Pusat Komunikasi</h1><p className="text-xs text-zinc-400">Pesan, notifikasi, pengajuan, dan agenda sekolah</p></div>
          <button onClick={loadAll} className="rounded-xl border border-zinc-700 px-3 py-2 text-xs hover:bg-zinc-800">Segarkan</button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-4 md:p-6">
        {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <div className="mb-5 grid grid-cols-2 gap-2 rounded-2xl bg-white p-2 shadow-sm md:grid-cols-4">
          {tabs.map(({ id, label, icon: Icon, badge }) => (
            <button key={id} onClick={() => setTab(id)} className={`relative flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-xs font-bold ${tab === id ? 'bg-zinc-950 text-white' : 'text-zinc-500 hover:bg-zinc-100'}`}>
              <Icon className="h-4 w-4" />{label}{badge > 0 && <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] text-white">{badge}</span>}
            </button>
          ))}
        </div>

        {tab === 'messages' && <MessagesPanel user={user} threads={threads} selected={selectedThread} conversation={conversation} onOpen={openThread} message={message} setMessage={setMessage} onSend={sendMessage} onCompose={() => setShowCompose(true)} />}
        {tab === 'notifications' && <NotificationsPanel value={notifications} onRead={async (id) => { await api.post(`/communication/notifications/${id}/read`); loadAll(); }} onReadAll={async () => { await api.post('/communication/notifications/read-all'); loadAll(); }} />}
        {tab === 'requests' && <RequestsPanel role={user.role} items={requests} children={directory.children || []} onRefresh={loadAll} />}
        {tab === 'events' && <EventsPanel events={events} canManage={canManage} onAdd={() => setShowEventForm(true)} onDelete={async (id) => { if (window.confirm('Hapus kegiatan ini?')) { await api.delete(`/communication/events/${id}`); loadAll(); } }} user={user} />}
      </main>

      {showCompose && <ComposeModal user={user} directory={directory} onClose={() => setShowCompose(false)} onSaved={() => { setShowCompose(false); loadAll(); }} />}
      {showEventForm && <EventModal user={user} classes={directory.classes || []} onClose={() => setShowEventForm(false)} onSaved={() => { setShowEventForm(false); loadAll(); }} />}
    </div>
  );
}

function MessagesPanel({ user, threads, selected, conversation, onOpen, message, setMessage, onSend, onCompose }) {
  return <div className="grid min-h-[600px] overflow-hidden rounded-2xl bg-white shadow-sm lg:grid-cols-[360px_1fr]">
    <section className={`${selected ? 'hidden lg:block' : ''} border-r border-zinc-200`}>
      <div className="flex items-center justify-between border-b p-4"><h2 className="font-bold">Percakapan</h2><button onClick={onCompose} className="rounded-lg bg-amber-400 p-2 text-zinc-950"><Plus className="h-4 w-4" /></button></div>
      <div className="divide-y">{threads.length === 0 && <Empty text="Belum ada percakapan." />}{threads.map((item) => <button key={item.id} onClick={() => onOpen(item)} className={`w-full p-4 text-left hover:bg-zinc-50 ${selected?.id === item.id ? 'bg-amber-50' : ''}`}>
        <div className="flex gap-2"><p className="flex-1 truncate text-sm font-bold">{item.subject}</p>{item.unread_count > 0 && <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] text-white">{item.unread_count}</span>}</div>
        <p className="mt-1 truncate text-xs text-zinc-500">{item.latest_message?.sender_name}: {item.latest_message?.body}</p><p className="mt-2 text-[10px] uppercase text-zinc-400">{item.type}{item.class_name ? ` • ${item.class_name}` : ''}</p>
      </button>)}</div>
    </section>
    <section className={`${!selected ? 'hidden lg:flex' : 'flex'} flex-col`}>
      {!selected ? <div className="m-auto text-center text-zinc-400"><MessageCircle className="mx-auto mb-3 h-12 w-12" /><p>Pilih percakapan untuk membaca pesan.</p></div> : <>
        <div className="flex items-center gap-3 border-b p-4"><button className="lg:hidden" onClick={() => window.location.reload()}><ChevronLeft /></button><div><h3 className="font-bold">{conversation?.thread?.subject || selected.subject}</h3><p className="text-xs text-zinc-500">{conversation?.participants?.map((p) => p.full_name).join(', ')}</p></div></div>
        <div className="flex-1 space-y-3 overflow-y-auto bg-zinc-50 p-4">
          {conversation?.messages?.map((item) => {
            const isOwnMessage = Number(item.sender_user_id) === Number(user?.id);
            return (
              <div
                key={item.id}
                className={`max-w-[75%] rounded-2xl p-3.5 shadow-sm flex flex-col ${
                  isOwnMessage
                    ? 'ml-auto bg-zinc-900 text-white rounded-tr-none'
                    : 'mr-auto bg-white text-zinc-900 rounded-tl-none border border-zinc-200'
                }`}
              >
                {!isOwnMessage && <p className="text-[10px] font-extrabold text-[#d4af37] uppercase">{item.sender_name}</p>}
                <p className="whitespace-pre-wrap text-sm mt-0.5">{item.body}</p>
                <p className={`mt-1.5 text-[9px] font-medium text-right ${isOwnMessage ? 'text-zinc-400' : 'text-zinc-400'}`}>
                  {formatDate(item.created_at)}
                </p>
              </div>
            );
          })}
        </div>
        <form onSubmit={onSend} className="flex gap-2 border-t p-3"><textarea value={message} onChange={(e) => setMessage(e.target.value)} maxLength={5000} rows="2" className="flex-1 resize-none rounded-xl border p-3 text-sm" placeholder="Tulis pesan…" /><button className="rounded-xl bg-zinc-950 px-4 text-white"><Send className="h-4 w-4" /></button></form>
      </>}
    </section>
  </div>;
}

function NotificationsPanel({ value, onRead, onReadAll }) {
  return <section className="rounded-2xl bg-white p-4 shadow-sm"><div className="mb-4 flex items-center justify-between"><h2 className="font-bold">Notifikasi</h2><button onClick={onReadAll} className="text-xs font-bold text-amber-700">Tandai semua dibaca</button></div><div className="space-y-2">{value.items.length === 0 && <Empty text="Belum ada notifikasi." />}{value.items.map((item) => <button key={item.id} onClick={() => !item.read_at && onRead(item.id)} className={`w-full rounded-xl border p-4 text-left ${item.read_at ? 'bg-white' : 'border-amber-200 bg-amber-50'}`}><div className="flex gap-3"><Bell className="mt-0.5 h-4 w-4 text-amber-600" /><div className="flex-1"><p className="text-sm font-bold">{item.title}</p><p className="mt-1 text-sm text-zinc-600">{item.body}</p><p className="mt-2 text-[10px] text-zinc-400">{formatDate(item.created_at)}</p></div>{item.read_at ? <CheckCheck className="h-4 w-4 text-green-600" /> : <span className="h-2 w-2 rounded-full bg-red-500" />}</div></button>)}</div></section>;
}

function RequestsPanel({ role, items, children, onRefresh }) {
  const [form, setForm] = useState({ student_id: children[0]?.id || '', type: 'leave', request_date: new Date().toISOString().slice(0, 10), reason: '', pickup_name: '', pickup_relationship: '', pickup_phone: '' });
  const submit = async (event) => { event.preventDefault(); await api.post('/communication/requests', form); setForm({ ...form, reason: '', pickup_name: '', pickup_relationship: '', pickup_phone: '' }); onRefresh(); };
  const update = async (id, status) => { const note = status === 'rejected' ? window.prompt('Alasan penolakan:') : ''; if (status === 'rejected' && note === null) return; await api.post(`/communication/requests/${id}/status`, { status, admin_note: note || '' }); onRefresh(); };
  return <div className="grid gap-4 lg:grid-cols-[360px_1fr]">{role === 'parent' && <form onSubmit={submit} className="h-fit space-y-3 rounded-2xl bg-white p-5 shadow-sm"><h2 className="font-bold">Buat Pengajuan</h2><Select value={form.student_id} onChange={(v) => setForm({ ...form, student_id: v })} options={children.map((c) => ({ value: c.id, label: c.full_name }))} /><Select value={form.type} onChange={(v) => setForm({ ...form, type: v })} options={[{ value: 'leave', label: 'Izin tidak masuk' }, { value: 'pickup', label: 'Konfirmasi penjemputan' }]} /><Input type="date" value={form.request_date} onChange={(v) => setForm({ ...form, request_date: v })} />{form.type === 'pickup' && <><Input placeholder="Nama penjemput" value={form.pickup_name} onChange={(v) => setForm({ ...form, pickup_name: v })} /><Input placeholder="Hubungan dengan anak" value={form.pickup_relationship} onChange={(v) => setForm({ ...form, pickup_relationship: v })} /><Input placeholder="Nomor telepon" value={form.pickup_phone} onChange={(v) => setForm({ ...form, pickup_phone: v })} /></>}<textarea required maxLength={2000} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className="w-full rounded-xl border p-3 text-sm" placeholder="Alasan atau keterangan" /><button className="w-full rounded-xl bg-zinc-950 py-3 text-sm font-bold text-white">Kirim Pengajuan</button></form>}
    <section className="rounded-2xl bg-white p-4 shadow-sm"><h2 className="mb-4 font-bold">Riwayat Pengajuan</h2><div className="space-y-3">{items.length === 0 && <Empty text="Belum ada pengajuan." />}{items.map((item) => <article key={item.id} className="rounded-xl border p-4"><div className="flex flex-wrap items-start gap-3"><div className="flex-1"><p className="font-bold">{item.student_name}</p><p className="text-xs text-zinc-500">{item.type === 'leave' ? 'Izin tidak masuk' : 'Penjemputan'} • {item.request_date} • {item.class_name || '-'}</p><p className="mt-2 text-sm">{item.reason}</p>{item.pickup_name && <p className="mt-2 text-xs text-zinc-500">Penjemput: {item.pickup_name} ({item.pickup_relationship}) — {item.pickup_phone}</p>}</div><Status value={item.status} /></div>{role !== 'parent' && item.status === 'pending' && <div className="mt-3 flex gap-2"><button onClick={() => update(item.id, 'approved')} className="rounded-lg bg-green-600 px-3 py-2 text-xs font-bold text-white">Setujui</button><button onClick={() => update(item.id, 'rejected')} className="rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white">Tolak</button></div>}{role !== 'parent' && item.type === 'pickup' && item.status === 'approved' && <button onClick={() => update(item.id, 'completed')} className="mt-3 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white">Tandai selesai</button>}</article>)}</div></section>
  </div>;
}

function EventsPanel({ events, canManage, onAdd, onDelete, user }) {
  return <section className="rounded-2xl bg-white p-4 shadow-sm"><div className="mb-4 flex items-center justify-between"><h2 className="font-bold">Kalender Kegiatan</h2>{canManage && <button onClick={onAdd} className="flex items-center gap-2 rounded-xl bg-zinc-950 px-4 py-2 text-xs font-bold text-white"><Plus className="h-4 w-4" />Kegiatan</button>}</div><div className="grid gap-3 md:grid-cols-2">{events.length === 0 && <Empty text="Belum ada kegiatan." />}{events.map((item) => <article key={item.id} className="rounded-xl border p-4"><div className="flex gap-3"><div className="rounded-xl bg-amber-100 p-3 text-amber-700"><CalendarDays /></div><div className="flex-1"><p className="font-bold">{item.title}</p><p className="mt-1 text-xs text-zinc-500"><Clock className="mr-1 inline h-3 w-3" />{formatDate(item.starts_at)}</p>{item.location && <p className="mt-1 text-xs text-zinc-500">{item.location}</p>}<p className="mt-2 text-sm text-zinc-600">{item.description}</p><span className="mt-3 inline-block rounded-full bg-zinc-100 px-2 py-1 text-[10px] uppercase">{item.audience}</span></div></div>{canManage && (user.role === 'admin' || Number(item.created_by) === Number(user.id)) && <button onClick={() => onDelete(item.id)} className="mt-3 text-xs font-bold text-red-600">Hapus</button>}</article>)}</div></section>;
}

function ComposeModal({ user, directory, onClose, onSaved }) {
  const [mode, setMode] = useState('direct');
  const [form, setForm] = useState({ recipient_user_id: '', audience: 'class', class_id: directory.classes?.[0]?.id || '', subject: '', message: '' });
  const submit = async (event) => { event.preventDefault(); await api.post(mode === 'direct' ? '/communication/threads' : '/communication/broadcasts', form); onSaved(); };
  return <Modal title="Pesan Baru" onClose={onClose}><form onSubmit={submit} className="space-y-3">{['admin', 'teacher'].includes(user.role) && <Select value={mode} onChange={setMode} options={[{ value: 'direct', label: 'Pesan langsung' }, { value: 'broadcast', label: 'Broadcast' }]} />}{mode === 'direct' ? <Select value={form.recipient_user_id} onChange={(v) => setForm({ ...form, recipient_user_id: v })} options={[{ value: '', label: 'Pilih penerima' }, ...(directory.contacts || []).map((c) => ({ value: c.id, label: `${c.full_name} — ${c.role}` }))]} /> : <><Select value={form.audience} onChange={(v) => setForm({ ...form, audience: v })} options={user.role === 'teacher' ? [{ value: 'class', label: 'Kelas yang diampu' }] : [{ value: 'school', label: 'Seluruh sekolah' }, { value: 'class', label: 'Kelas tertentu' }, { value: 'staff', label: 'Admin dan guru' }, { value: 'parents', label: 'Seluruh orang tua' }]} />{form.audience === 'class' && <Select value={form.class_id} onChange={(v) => setForm({ ...form, class_id: v })} options={(directory.classes || []).map((c) => ({ value: c.id, label: c.name }))} />}</>}<Input required placeholder="Subjek" value={form.subject} onChange={(v) => setForm({ ...form, subject: v })} /><textarea required maxLength={5000} rows="6" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="w-full rounded-xl border p-3 text-sm" placeholder="Isi pesan" /><button className="w-full rounded-xl bg-zinc-950 py-3 text-sm font-bold text-white">Kirim</button></form></Modal>;
}

function EventModal({ user, classes, onClose, onSaved }) {
  const [form, setForm] = useState({ title: '', description: '', location: '', audience: user.role === 'teacher' ? 'class' : 'school', class_id: classes[0]?.id || '', starts_at: '', ends_at: '', reminder_minutes: 1440 });
  const submit = async (event) => { event.preventDefault(); await api.post('/communication/events', form); onSaved(); };
  return <Modal title="Kegiatan Baru" onClose={onClose}><form onSubmit={submit} className="space-y-3"><Input required placeholder="Nama kegiatan" value={form.title} onChange={(v) => setForm({ ...form, title: v })} /><Select value={form.audience} onChange={(v) => setForm({ ...form, audience: v })} options={user.role === 'teacher' ? [{ value: 'class', label: 'Kelas yang diampu' }] : [{ value: 'school', label: 'Seluruh sekolah' }, { value: 'class', label: 'Kelas tertentu' }, { value: 'staff', label: 'Admin dan guru' }, { value: 'parents', label: 'Seluruh orang tua' }]} />{form.audience === 'class' && <Select value={form.class_id} onChange={(v) => setForm({ ...form, class_id: v })} options={classes.map((c) => ({ value: c.id, label: c.name }))} />}<Input type="datetime-local" required value={form.starts_at} onChange={(v) => setForm({ ...form, starts_at: v })} /><Input type="datetime-local" value={form.ends_at} onChange={(v) => setForm({ ...form, ends_at: v })} /><Input placeholder="Lokasi" value={form.location} onChange={(v) => setForm({ ...form, location: v })} /><textarea rows="4" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-xl border p-3 text-sm" placeholder="Keterangan" /><Select value={form.reminder_minutes} onChange={(v) => setForm({ ...form, reminder_minutes: Number(v) })} options={[{ value: 60, label: 'Ingatkan 1 jam sebelumnya' }, { value: 1440, label: 'Ingatkan 1 hari sebelumnya' }, { value: 10080, label: 'Ingatkan 7 hari sebelumnya' }]} /><button className="w-full rounded-xl bg-zinc-950 py-3 text-sm font-bold text-white">Simpan Kegiatan</button></form></Modal>;
}

function Modal({ title, onClose, children }) { return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"><div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5"><div className="mb-4 flex items-center justify-between"><h2 className="font-bold">{title}</h2><button onClick={onClose} className="rounded-lg px-3 py-1 text-zinc-500">Tutup</button></div>{children}</div></div>; }
function Input({ onChange, ...props }) { return <input {...props} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border p-3 text-sm" />; }
function Select({ options, onChange, ...props }) { return <select {...props} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border bg-white p-3 text-sm">{options.map((option) => <option key={`${option.value}-${option.label}`} value={option.value}>{option.label}</option>)}</select>; }
function Empty({ text }) { return <div className="p-10 text-center text-sm text-zinc-400"><Mail className="mx-auto mb-3 h-8 w-8" />{text}</div>; }
function Status({ value }) { const colors = { pending: 'bg-amber-100 text-amber-700', approved: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700', completed: 'bg-blue-100 text-blue-700' }; return <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${colors[value] || 'bg-zinc-100'}`}>{value}</span>; }
