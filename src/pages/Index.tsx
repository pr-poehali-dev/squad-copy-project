import { useState, useEffect, useRef, useCallback } from 'react';
import Icon from '@/components/ui/icon';
import { api } from '@/lib/api';

type Tab = 'chats' | 'contacts' | 'servers' | 'notifications' | 'profile' | 'settings';
type Status = 'online' | 'away' | 'dnd' | 'offline';

interface User {
  id: number;
  username: string;
  display_name: string;
  email?: string;
  avatar_color: string;
  status: Status;
  bio?: string;
  status_text?: string;
}

interface Chat {
  id: number;
  type: string;
  name: string;
  avatar_color: string;
  other_user_id?: number;
  other_user_status?: Status;
  last_message?: string;
  last_time?: string;
  unread: number;
}

interface Message {
  id: number;
  sender_id: number;
  sender_name: string;
  sender_color: string;
  content: string;
  created_at: string;
  encrypted: boolean;
  is_own: boolean;
}

interface Contact {
  id: number;
  username: string;
  display_name: string;
  avatar_color: string;
  status: Status;
  status_text: string;
}

interface Server {
  id: number;
  name: string;
  description: string;
  abbreviation: string;
  color: string;
  members: number;
  online: number;
  role: string;
}

interface ServerMember {
  id: number;
  display_name: string;
  avatar_color: string;
  status: Status;
  role: string;
}

const STATUS_LABELS: Record<Status, string> = {
  online: 'В сети',
  away: 'Отошёл',
  dnd: 'Не беспокоить',
  offline: 'Не в сети',
};

const SERVER_COLORS = ['#4C8FE8', '#6D5BD0', '#E85C8A', '#E8A83C', '#3CB87A', '#E85C4A'];

function initials(name: string): string {
  const words = name.split(' ').filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function StatusDot({ status, size = 8 }: { status: Status; size?: number }) {
  const cls = { online: 'bg-online', away: 'bg-away', dnd: 'bg-dnd', offline: 'bg-offline' }[status];
  return (
    <span
      className={`rounded-full border-2 border-[hsl(var(--squad-servers))] flex-shrink-0 inline-block ${cls}`}
      style={{ width: size, height: size }}
    />
  );
}

function Avatar({ name, color, size = 36, status }: { name: string; color?: string; size?: number; status?: Status }) {
  const colors = ['#4C8FE8', '#6D5BD0', '#E85C8A', '#E8A83C', '#3CB87A', '#E85C4A', '#8F4CE8'];
  const bg = color || colors[(name.charCodeAt(0) || 0) % colors.length];
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <div
        className="rounded-full flex items-center justify-center font-semibold text-white select-none"
        style={{ width: size, height: size, background: bg, fontSize: size * 0.34 }}
      >
        {initials(name)}
      </div>
      {status && (
        <span className="absolute bottom-0 right-0">
          <StatusDot status={status} size={size > 32 ? 11 : 9} />
        </span>
      )}
    </div>
  );
}

function timeAgo(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return 'только что';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} мин`;
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('ru', { day: 'numeric', month: 'short' });
}

// ─── AUTH SCREEN ────────────────────────────────────────────────────────────────
function AuthScreen({ onAuth }: { onAuth: (user: User, token: string) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({ login: '', username: '', display_name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let res;
      if (mode === 'login') {
        res = await api.auth.login({ login: form.login, password: form.password });
      } else {
        res = await api.auth.register({
          username: form.username,
          display_name: form.display_name,
          email: form.email,
          password: form.password,
        });
      }
      localStorage.setItem('squad_token', res.token);
      onAuth(res.user, res.token);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setLoading(false);
    }
  };

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="min-h-screen flex items-center justify-center squad-servers">
      <div className="w-full max-w-sm mx-4">
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-2xl mx-auto mb-4"
            style={{ background: 'hsl(var(--squad-accent))', color: 'hsl(var(--squad-servers))' }}
          >
            С
          </div>
          <h1 className="text-2xl font-bold text-foreground">Сквад</h1>
          <p className="text-muted-foreground text-sm mt-1">Современный мессенджер</p>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex gap-1 p-1 bg-muted rounded-xl mb-6">
            {(['login', 'register'] as const).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); }}
                className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: mode === m ? 'hsl(var(--card))' : 'transparent',
                  color: mode === m ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
                  boxShadow: mode === m ? '0 1px 3px rgba(0,0,0,0.3)' : 'none',
                }}
              >
                {m === 'login' ? 'Войти' : 'Регистрация'}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="flex flex-col gap-3">
            {mode === 'register' && (
              <>
                <input
                  className="w-full bg-muted rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Имя и фамилия"
                  value={form.display_name}
                  onChange={e => set('display_name', e.target.value)}
                  required
                />
                <input
                  className="w-full bg-muted rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Логин (латиница)"
                  value={form.username}
                  onChange={e => set('username', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  required
                />
                <input
                  type="email"
                  className="w-full bg-muted rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Email"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  required
                />
              </>
            )}
            {mode === 'login' && (
              <input
                className="w-full bg-muted rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Логин или email"
                value={form.login}
                onChange={e => set('login', e.target.value)}
                required
              />
            )}
            <input
              type="password"
              className="w-full bg-muted rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Пароль"
              value={form.password}
              onChange={e => set('password', e.target.value)}
              required
              minLength={6}
            />

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all mt-1 disabled:opacity-60"
              style={{ background: 'hsl(var(--squad-accent))', color: 'hsl(var(--squad-servers))' }}
            >
              {loading ? 'Загрузка...' : mode === 'login' ? 'Войти' : 'Создать аккаунт'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────────
export default function Index() {
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [activeTab, setActiveTab] = useState<Tab>('chats');
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [activeServer, setActiveServer] = useState<Server | null>(null);

  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [servers, setServers] = useState<Server[]>([]);
  const [serverMembers, setServerMembers] = useState<ServerMember[]>([]);

  const [messageText, setMessageText] = useState('');
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [settingsSection, setSettingsSection] = useState('account');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Contact[]>([]);
  const [searching, setSearching] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Profile edit
  const [editProfile, setEditProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ display_name: '', bio: '', status_text: '' });
  const [profileSaving, setProfileSaving] = useState(false);

  // Create server modal
  const [showCreateServer, setShowCreateServer] = useState(false);
  const [serverForm, setServerForm] = useState({ name: '', description: '', color: '#4C8FE8' });
  const [serverCreating, setServerCreating] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Проверка авторизации
  useEffect(() => {
    const token = localStorage.getItem('squad_token');
    if (!token) { setAuthChecked(true); return; }
    api.auth.me()
      .then(res => { setUser(res.user); })
      .catch(() => { localStorage.removeItem('squad_token'); })
      .finally(() => setAuthChecked(false));
    setAuthChecked(true);
  }, []);

  // ─── Загрузка данных после входа
  useEffect(() => {
    if (!user) return;
    loadChats();
    loadContacts();
    loadServers();
  }, [user]);

  // ─── Автопрокрутка вниз
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ─── Поллинг сообщений каждые 3 сек
  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (!activeChat) return;
    pollRef.current = setInterval(() => {
      api.chats.messages(activeChat.id).then(res => setMessages(res.messages)).catch(() => null);
    }, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [activeChat]);

  const loadChats = useCallback(async () => {
    const res = await api.chats.list().catch(() => ({ chats: [] }));
    setChats(res.chats);
  }, []);

  const loadContacts = useCallback(async () => {
    const res = await api.contacts.list().catch(() => ({ contacts: [] }));
    setContacts(res.contacts);
  }, []);

  const loadServers = useCallback(async () => {
    const res = await api.servers.list().catch(() => ({ servers: [] }));
    setServers(res.servers);
  }, []);

  const openChat = async (chat: Chat) => {
    setActiveChat(chat);
    setLoadingMessages(true);
    const res = await api.chats.messages(chat.id).catch(() => ({ messages: [] }));
    setMessages(res.messages);
    setLoadingMessages(false);
    loadChats();
  };

  const openContactChat = async (contact: Contact) => {
    const res = await api.chats.create({ type: 'direct', user_id: contact.id });
    await loadChats();
    const chatRes = await api.chats.list();
    const chat = chatRes.chats.find((c: Chat) => c.id === res.chat_id);
    if (chat) { setActiveTab('chats'); openChat(chat); }
  };

  const openServer = async (server: Server) => {
    setActiveServer(server);
    const res = await api.servers.members(server.id).catch(() => ({ members: [] }));
    setServerMembers(res.members);
  };

  const sendMessage = async () => {
    if (!messageText.trim() || !activeChat) return;
    const text = messageText;
    setMessageText('');
    const res = await api.chats.send(activeChat.id, text).catch(() => null);
    if (res) {
      setMessages(prev => [...prev, res.message]);
      loadChats();
    }
  };

  const doSearch = async (q: string) => {
    setSearchQuery(q);
    if (q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    const res = await api.contacts.search(q).catch(() => ({ users: [] }));
    setSearchResults(res.users);
    setSearching(false);
  };

  const addContact = async (userId: number) => {
    await api.contacts.add(userId).catch(() => null);
    loadContacts();
    setSearchResults(prev => prev.map(u => u.id === userId ? { ...u, is_contact: true } as Contact : u));
  };

  const createServer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverForm.name.trim()) return;
    setServerCreating(true);
    await api.servers.create(serverForm).catch(() => null);
    await loadServers();
    setShowCreateServer(false);
    setServerForm({ name: '', description: '', color: '#4C8FE8' });
    setServerCreating(false);
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    await api.auth.updateProfile(profileForm).catch(() => null);
    setUser(prev => prev ? { ...prev, ...profileForm } : prev);
    setEditProfile(false);
    setProfileSaving(false);
  };

  const setStatus = async (s: Status) => {
    await api.auth.setStatus(s).catch(() => null);
    setUser(prev => prev ? { ...prev, status: s } : prev);
    setShowStatusMenu(false);
  };

  const logout = async () => {
    await api.auth.logout().catch(() => null);
    localStorage.removeItem('squad_token');
    setUser(null);
    setChats([]); setMessages([]); setContacts([]); setServers([]);
  };

  if (!authChecked && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center squad-servers">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <AuthScreen onAuth={(u, t) => { setUser(u); }} />;

  const totalUnread = chats.reduce((s, c) => s + (c.unread || 0), 0);

  const navItems: { tab: Tab; icon: string; label: string; badge?: number }[] = [
    { tab: 'chats', icon: 'MessageCircle', label: 'Чаты', badge: totalUnread },
    { tab: 'contacts', icon: 'Users', label: 'Контакты' },
    { tab: 'servers', icon: 'Hash', label: 'Серверы' },
    { tab: 'notifications', icon: 'Bell', label: 'Уведомления' },
    { tab: 'profile', icon: 'User', label: 'Профиль' },
    { tab: 'settings', icon: 'Settings', label: 'Настройки' },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden" style={{ fontFamily: "'Golos Text', sans-serif" }}>

      {/* Навигация */}
      <nav className="flex flex-col items-center py-4 gap-1 w-[64px] flex-shrink-0 squad-servers border-r border-border">
        <div className="mb-4 mt-1">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm"
            style={{ background: 'hsl(var(--squad-accent))', color: 'hsl(var(--squad-servers))' }}>С</div>
        </div>
        <div className="w-8 h-px bg-border mb-2" />
        {navItems.map(({ tab, icon, label, badge }) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="relative w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 group"
            style={{
              background: activeTab === tab ? 'hsl(var(--squad-accent))' : 'transparent',
              color: activeTab === tab ? 'hsl(var(--squad-servers))' : 'hsl(var(--muted-foreground))',
            }}
            title={label}
          >
            <Icon name={icon} size={20} />
            {badge && badge > 0 ? (
              <span className="absolute top-1 right-1 bg-mention rounded-full text-white font-bold flex items-center justify-center"
                style={{ fontSize: 10, minWidth: 16, height: 16, padding: '0 3px' }}>
                {badge > 99 ? '99+' : badge}
              </span>
            ) : null}
            <span className="absolute left-14 bg-card text-foreground text-xs px-2 py-1 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 border border-border shadow-lg">
              {label}
            </span>
          </button>
        ))}
        <div className="flex-1" />
        <div className="relative">
          <button onClick={() => setShowStatusMenu(!showStatusMenu)} className="focus:outline-none">
            <Avatar name={user.display_name} color={user.avatar_color} size={36} status={user.status as Status} />
          </button>
          {showStatusMenu && (
            <div className="absolute bottom-12 left-2 bg-card border border-border rounded-xl shadow-xl p-1 z-50 w-52 animate-scale-in">
              <div className="px-3 py-2 border-b border-border mb-1">
                <p className="text-sm font-semibold text-foreground">{user.display_name}</p>
                <p className="text-xs text-muted-foreground">@{user.username}</p>
              </div>
              {(['online', 'away', 'dnd', 'offline'] as Status[]).map(s => (
                <button key={s} onClick={() => setStatus(s)}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors">
                  <StatusDot status={s} size={8} />
                  <span className={user.status === s ? 'font-semibold text-foreground' : 'text-muted-foreground'}>
                    {STATUS_LABELS[s]}
                  </span>
                  {user.status === s && <Icon name="Check" size={14} className="ml-auto text-primary" />}
                </button>
              ))}
              <div className="border-t border-border mt-1 pt-1">
                <button onClick={logout} className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-destructive hover:bg-muted transition-colors">
                  <Icon name="LogOut" size={14} />
                  Выйти
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">

        {/* САЙДБАР */}
        {(['chats', 'contacts', 'servers', 'notifications'] as Tab[]).includes(activeTab) && (
          <aside className="w-72 flex flex-col squad-sidebar border-r border-border flex-shrink-0">

            {/* Чаты */}
            {activeTab === 'chats' && (
              <>
                <div className="p-4 border-b border-border">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-semibold text-base text-foreground">Сообщения</h2>
                    <button onClick={loadChats} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                      <Icon name="RefreshCw" size={14} />
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto py-2">
                  {chats.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm text-center px-4">
                      <Icon name="MessageCircle" size={32} className="opacity-20 mb-2" />
                      Нет чатов. Найди контакт и начни общение
                    </div>
                  )}
                  {chats.map(chat => (
                    <button
                      key={chat.id}
                      onClick={() => openChat(chat)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left"
                      style={{ margin: '0 4px', width: 'calc(100% - 8px)', background: activeChat?.id === chat.id ? 'hsl(var(--muted))' : 'transparent' }}
                    >
                      <Avatar name={chat.name} color={chat.avatar_color} size={40} status={chat.other_user_status} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm text-foreground truncate">{chat.name}</span>
                          <span className="text-xs text-muted-foreground flex-shrink-0 ml-1">{timeAgo(chat.last_time)}</span>
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                          <span className="text-xs text-muted-foreground truncate">{chat.last_message || 'Нет сообщений'}</span>
                          {chat.unread > 0 && (
                            <span className="bg-mention text-white text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0 ml-1"
                              style={{ minWidth: 18, height: 18, padding: '0 4px', fontSize: 10 }}>
                              {chat.unread}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Контакты */}
            {activeTab === 'contacts' && (
              <>
                <div className="p-4 border-b border-border">
                  <h2 className="font-semibold text-base text-foreground mb-3">Контакты</h2>
                  <div className="relative">
                    <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      className="w-full bg-muted rounded-lg pl-8 pr-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                      placeholder="Найти пользователя..."
                      value={searchQuery}
                      onChange={e => doSearch(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto py-2">
                  {searchQuery.length >= 2 ? (
                    <>
                      <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Результаты поиска</p>
                      {searching && <p className="px-4 text-xs text-muted-foreground">Поиск...</p>}
                      {searchResults.map(u => (
                        <div key={u.id} className="flex items-center gap-3 px-3 py-2 rounded-xl" style={{ margin: '0 4px', width: 'calc(100% - 8px)' }}>
                          <Avatar name={u.display_name} color={u.avatar_color} size={36} status={u.status as Status} />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-foreground">{u.display_name}</p>
                            <p className="text-xs text-muted-foreground">@{u.username}</p>
                          </div>
                          <button
                            onClick={() => addContact(u.id)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors flex-shrink-0"
                            style={{ background: 'hsl(var(--squad-accent))', color: 'hsl(var(--squad-servers))' }}
                            title="Добавить"
                          >
                            <Icon name="UserPlus" size={13} />
                          </button>
                        </div>
                      ))}
                      {!searching && searchResults.length === 0 && (
                        <p className="px-4 text-xs text-muted-foreground">Никого не найдено</p>
                      )}
                    </>
                  ) : (
                    <>
                      {(['online', 'away', 'dnd', 'offline'] as Status[]).map(group => {
                        const grouped = contacts.filter(c => c.status === group);
                        if (!grouped.length) return null;
                        const labels: Record<string, string> = { online: 'В сети', away: 'Отошёл', dnd: 'Не беспокоить', offline: 'Не в сети' };
                        return (
                          <div key={group}>
                            <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              {labels[group]} — {grouped.length}
                            </p>
                            {grouped.map(contact => (
                              <button
                                key={contact.id}
                                onClick={() => openContactChat(contact)}
                                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-muted transition-colors text-left"
                                style={{ margin: '0 4px', width: 'calc(100% - 8px)' }}
                              >
                                <Avatar name={contact.display_name} color={contact.avatar_color} size={36} status={contact.status} />
                                <div>
                                  <p className="font-medium text-sm text-foreground">{contact.display_name}</p>
                                  <p className="text-xs text-muted-foreground">{contact.status_text || STATUS_LABELS[contact.status]}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        );
                      })}
                      {contacts.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm text-center px-4">
                          <Icon name="Users" size={32} className="opacity-20 mb-2" />
                          Найдите пользователей через поиск
                        </div>
                      )}
                    </>
                  )}
                </div>
              </>
            )}

            {/* Серверы */}
            {activeTab === 'servers' && (
              <>
                <div className="p-4 border-b border-border">
                  <div className="flex items-center justify-between mb-1">
                    <h2 className="font-semibold text-base text-foreground">Серверы</h2>
                    <button onClick={() => setShowCreateServer(true)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                      <Icon name="Plus" size={16} />
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto py-2">
                  {servers.map(server => (
                    <button
                      key={server.id}
                      onClick={() => openServer(server)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left"
                      style={{ margin: '0 4px', width: 'calc(100% - 8px)', background: activeServer?.id === server.id ? 'hsl(var(--muted))' : 'transparent' }}
                    >
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-white flex-shrink-0" style={{ background: server.color }}>
                        {server.abbreviation}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-foreground">{server.name}</p>
                        <p className="text-xs text-muted-foreground">
                          <span className="text-online">{server.online} онлайн</span> · {server.members} участников
                        </p>
                      </div>
                    </button>
                  ))}
                  <button onClick={() => setShowCreateServer(true)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors text-muted-foreground"
                    style={{ margin: '0 4px', width: 'calc(100% - 8px)' }}>
                    <div className="w-10 h-10 rounded-xl border-2 border-dashed border-border flex items-center justify-center">
                      <Icon name="Plus" size={18} />
                    </div>
                    <span className="text-sm">Создать сервер</span>
                  </button>
                </div>
              </>
            )}

            {/* Уведомления */}
            {activeTab === 'notifications' && (
              <>
                <div className="p-4 border-b border-border">
                  <h2 className="font-semibold text-base text-foreground">Уведомления</h2>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground text-sm text-center px-4">
                  <Icon name="Bell" size={40} className="opacity-20 mb-3" />
                  Уведомлений пока нет
                </div>
              </>
            )}
          </aside>
        )}

        {/* ГЛАВНАЯ ОБЛАСТЬ */}
        <main className="flex-1 flex flex-col squad-chat-bg overflow-hidden">

          {/* Чат открыт */}
          {activeTab === 'chats' && activeChat && (
            <>
              <header className="flex items-center justify-between px-5 py-3.5 border-b border-border flex-shrink-0">
                <div className="flex items-center gap-3">
                  <Avatar name={activeChat.name} color={activeChat.avatar_color} size={36} status={activeChat.other_user_status} />
                  <div>
                    <h3 className="font-semibold text-sm text-foreground">{activeChat.name}</h3>
                    <p className="text-xs text-muted-foreground">{activeChat.other_user_status ? STATUS_LABELS[activeChat.other_user_status] : 'Группа'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
                    style={{ background: 'hsl(var(--muted))', color: 'hsl(142 70% 45%)' }}>
                    <Icon name="Lock" size={11} />
                    <span>E2E шифрование</span>
                  </div>
                  <button className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                    <Icon name="Phone" size={16} />
                  </button>
                  <button className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                    <Icon name="Video" size={16} />
                  </button>
                </div>
              </header>

              <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-0.5">
                {loadingMessages && (
                  <div className="flex justify-center py-8">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                {!loadingMessages && messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm text-center">
                    <Icon name="MessageCircle" size={40} className="opacity-20 mb-3" />
                    Напишите первое сообщение
                  </div>
                )}
                {messages.map((msg, i) => {
                  const prev = messages[i - 1];
                  const grouped = prev && prev.sender_id === msg.sender_id;
                  return (
                    <div key={msg.id}
                      className={`flex gap-3 group hover:bg-[hsl(220,12%,16%)] rounded-xl px-3 py-1.5 transition-colors ${msg.is_own ? 'flex-row-reverse' : ''} ${grouped ? 'mt-0' : 'mt-2'}`}>
                      {!grouped
                        ? <Avatar name={msg.sender_name} color={msg.sender_color} size={34} />
                        : <div className="w-[34px] flex-shrink-0" />}
                      <div className={`flex flex-col max-w-[70%] ${msg.is_own ? 'items-end' : ''}`}>
                        {!grouped && (
                          <div className={`flex items-baseline gap-2 mb-0.5 ${msg.is_own ? 'flex-row-reverse' : ''}`}>
                            <span className="text-sm font-semibold text-foreground">{msg.sender_name}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(msg.created_at).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        )}
                        <div className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed ${msg.is_own ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}
                          style={{
                            background: msg.is_own ? 'hsl(var(--squad-accent))' : 'hsl(var(--secondary))',
                            color: msg.is_own ? 'hsl(var(--squad-servers))' : 'hsl(var(--foreground))',
                          }}>
                          {msg.content}
                        </div>
                        {msg.encrypted && (
                          <div className="flex items-center gap-1 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Icon name="Lock" size={9} className="text-muted-foreground" />
                            <span className="text-[10px] text-muted-foreground">Зашифровано</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <div className="px-5 pb-5 flex-shrink-0">
                <div className="flex items-end gap-2 bg-muted rounded-2xl px-4 py-3 border border-border focus-within:border-primary transition-colors">
                  <textarea
                    value={messageText}
                    onChange={e => setMessageText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    className="flex-1 bg-transparent resize-none outline-none text-sm text-foreground placeholder:text-muted-foreground max-h-32 leading-relaxed"
                    placeholder={`Написать ${activeChat.name}...`}
                    rows={1}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!messageText.trim()}
                    className="w-8 h-8 rounded-xl flex items-center justify-center transition-all flex-shrink-0 disabled:opacity-30"
                    style={{
                      background: messageText.trim() ? 'hsl(var(--squad-accent))' : 'transparent',
                      color: messageText.trim() ? 'hsl(var(--squad-servers))' : 'hsl(var(--muted-foreground))',
                    }}
                  >
                    <Icon name="Send" size={15} />
                  </button>
                </div>
                <p className="text-center text-[10px] text-muted-foreground mt-2 flex items-center justify-center gap-1">
                  <Icon name="Lock" size={9} />
                  Переписка защищена end-to-end шифрованием
                </p>
              </div>
            </>
          )}

          {/* Нет активного чата */}
          {activeTab === 'chats' && !activeChat && (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 animate-fade-in">
              <Icon name="MessageCircle" size={48} className="text-muted-foreground opacity-20" />
              <p className="text-foreground font-medium">Выберите чат</p>
              <p className="text-muted-foreground text-sm">или найдите человека в Контактах</p>
            </div>
          )}

          {/* Серверы */}
          {activeTab === 'servers' && !activeServer && (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 animate-fade-in">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'hsl(var(--muted))' }}>
                <Icon name="Hash" size={32} className="text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Выберите сервер</h3>
              <p className="text-muted-foreground text-sm text-center max-w-xs">Выберите сервер из списка или создайте новый</p>
              <button onClick={() => setShowCreateServer(true)}
                className="px-5 py-2.5 rounded-xl font-medium text-sm"
                style={{ background: 'hsl(var(--squad-accent))', color: 'hsl(var(--squad-servers))' }}>
                Создать сервер
              </button>
            </div>
          )}

          {activeTab === 'servers' && activeServer && (
            <>
              <header className="flex items-center justify-between px-5 py-3.5 border-b border-border flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm text-white" style={{ background: activeServer.color }}>
                    {activeServer.abbreviation}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-foreground">{activeServer.name}</h3>
                    <p className="text-xs text-muted-foreground">{activeServer.online} онлайн · {activeServer.members} участников</p>
                  </div>
                </div>
                <button onClick={() => setActiveServer(null)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground">
                  <Icon name="X" size={16} />
                </button>
              </header>
              <div className="flex-1 overflow-y-auto p-5">
                {activeServer.description && (
                  <div className="bg-card rounded-2xl p-4 border border-border mb-4">
                    <p className="text-sm text-muted-foreground">{activeServer.description}</p>
                  </div>
                )}
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Участники — {serverMembers.length}
                </h4>
                <div className="flex flex-col gap-1">
                  {serverMembers.map(member => (
                    <div key={member.id} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-muted transition-colors">
                      <Avatar name={member.display_name} color={member.avatar_color} size={36} status={member.status} />
                      <div>
                        <p className="text-sm font-medium text-foreground">{member.display_name}</p>
                        <p className="text-xs text-muted-foreground">{member.role === 'owner' ? 'Владелец' : member.role === 'admin' ? 'Администратор' : 'Участник'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Профиль */}
          {activeTab === 'profile' && (
            <div className="flex-1 overflow-y-auto animate-fade-in">
              <div className="relative">
                <div className="h-36" style={{ background: 'linear-gradient(135deg, hsl(215 80% 25%), hsl(260 60% 25%))' }} />
                <div className="absolute bottom-0 translate-y-1/2 left-8">
                  <Avatar name={user.display_name} color={user.avatar_color} size={80} status={user.status as Status} />
                </div>
              </div>
              <div className="pt-16 px-8 pb-8">
                {!editProfile ? (
                  <>
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <h2 className="text-2xl font-bold text-foreground">{user.display_name}</h2>
                        <p className="text-muted-foreground text-sm mt-0.5">@{user.username} · {STATUS_LABELS[user.status as Status]}</p>
                      </div>
                      <button onClick={() => { setProfileForm({ display_name: user.display_name, bio: user.bio || '', status_text: user.status_text || '' }); setEditProfile(true); }}
                        className="px-4 py-2 rounded-xl text-sm font-medium border border-border hover:bg-muted transition-colors text-foreground flex items-center gap-1.5">
                        <Icon name="Pencil" size={14} />
                        Редактировать
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      {[
                        { label: 'Сообщений', value: String(messages.length) },
                        { label: 'Контактов', value: String(contacts.length) },
                        { label: 'Серверов', value: String(servers.length) },
                      ].map(stat => (
                        <div key={stat.label} className="bg-card rounded-2xl p-4 text-center border border-border">
                          <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                          <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                        </div>
                      ))}
                    </div>
                    {user.bio && (
                      <div className="bg-card rounded-2xl p-5 border border-border mb-4">
                        <h4 className="font-semibold text-sm text-foreground mb-2">О себе</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">{user.bio}</p>
                      </div>
                    )}
                    <div className="bg-card rounded-2xl p-5 border border-border">
                      <h4 className="font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
                        <Icon name="Lock" size={14} className="text-primary" />
                        Конфиденциальность
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Все сообщения защищены end-to-end шифрованием. Никто, кроме участников переписки, не может прочитать ваши сообщения.
                      </p>
                    </div>
                  </>
                ) : (
                  <form onSubmit={saveProfile} className="max-w-md">
                    <h3 className="text-lg font-semibold text-foreground mb-5">Редактировать профиль</h3>
                    <div className="flex flex-col gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">Отображаемое имя</label>
                        <input
                          className="w-full bg-muted rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                          value={profileForm.display_name}
                          onChange={e => setProfileForm(f => ({ ...f, display_name: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">О себе</label>
                        <textarea
                          className="w-full bg-muted rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                          rows={3}
                          value={profileForm.bio}
                          onChange={e => setProfileForm(f => ({ ...f, bio: e.target.value }))}
                          placeholder="Расскажите о себе..."
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">Статус</label>
                        <input
                          className="w-full bg-muted rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                          value={profileForm.status_text}
                          onChange={e => setProfileForm(f => ({ ...f, status_text: e.target.value }))}
                          placeholder="Что вы делаете сейчас?"
                        />
                      </div>
                      <div className="flex gap-3 mt-2">
                        <button type="submit" disabled={profileSaving}
                          className="px-5 py-2.5 rounded-xl text-sm font-medium disabled:opacity-60"
                          style={{ background: 'hsl(var(--squad-accent))', color: 'hsl(var(--squad-servers))' }}>
                          {profileSaving ? 'Сохраняю...' : 'Сохранить'}
                        </button>
                        <button type="button" onClick={() => setEditProfile(false)}
                          className="px-5 py-2.5 rounded-xl text-sm font-medium border border-border hover:bg-muted transition-colors text-foreground">
                          Отмена
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* Настройки */}
          {activeTab === 'settings' && (
            <div className="flex-1 flex overflow-hidden animate-fade-in">
              <div className="w-56 border-r border-border p-3 flex-shrink-0">
                {[
                  { id: 'account', icon: 'User', label: 'Аккаунт' },
                  { id: 'privacy', icon: 'Shield', label: 'Конфиденциальность' },
                  { id: 'appearance', icon: 'Palette', label: 'Внешний вид' },
                  { id: 'about', icon: 'Info', label: 'О приложении' },
                ].map(item => (
                  <button key={item.id} onClick={() => setSettingsSection(item.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors text-left"
                    style={{
                      background: settingsSection === item.id ? 'hsl(var(--muted))' : 'transparent',
                      color: settingsSection === item.id ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
                      fontWeight: settingsSection === item.id ? 500 : 400,
                    }}>
                    <Icon name={item.icon} size={16} />
                    {item.label}
                  </button>
                ))}
                <div className="border-t border-border mt-3 pt-3">
                  <button onClick={logout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-destructive hover:bg-muted transition-colors">
                    <Icon name="LogOut" size={16} />
                    Выйти
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-8">
                {settingsSection === 'account' && (
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-6">Аккаунт</h3>
                    <div className="flex items-center gap-4 mb-8 p-5 bg-card rounded-2xl border border-border">
                      <Avatar name={user.display_name} color={user.avatar_color} size={56} status={user.status as Status} />
                      <div>
                        <p className="font-semibold text-foreground">{user.display_name}</p>
                        <p className="text-sm text-muted-foreground">@{user.username}</p>
                        <p className="text-xs text-primary mt-1">{STATUS_LABELS[user.status as Status]}</p>
                      </div>
                    </div>
                    {[
                      { label: 'Имя пользователя', value: user.username },
                      { label: 'Email', value: user.email || '—' },
                    ].map(field => (
                      <div key={field.label} className="flex items-center justify-between py-4 border-b border-border">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">{field.label}</p>
                          <p className="text-sm text-foreground mt-1">{field.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {settingsSection === 'privacy' && (
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-6">Конфиденциальность</h3>
                    {[
                      { label: 'End-to-end шифрование', desc: 'Все личные сообщения шифруются', enabled: true },
                      { label: 'Зашифрованное хранение', desc: 'Сообщения хранятся в зашифрованном виде', enabled: true },
                    ].map(setting => (
                      <div key={setting.label} className="flex items-center justify-between py-4 border-b border-border">
                        <div>
                          <p className="text-sm font-medium text-foreground">{setting.label}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{setting.desc}</p>
                        </div>
                        <div className="w-10 h-6 rounded-full flex items-center px-1"
                          style={{ background: setting.enabled ? 'hsl(var(--squad-accent))' : 'hsl(var(--muted))' }}>
                          <div className="w-4 h-4 rounded-full bg-white transition-transform"
                            style={{ transform: setting.enabled ? 'translateX(16px)' : 'translateX(0)' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {settingsSection === 'about' && (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 font-bold text-3xl"
                      style={{ background: 'hsl(var(--squad-accent))', color: 'hsl(var(--squad-servers))' }}>С</div>
                    <h2 className="text-2xl font-bold text-foreground">Сквад</h2>
                    <p className="text-muted-foreground text-sm mt-2">Версия 1.0.0</p>
                    <p className="text-muted-foreground text-sm mt-6 max-w-sm mx-auto leading-relaxed">
                      Современный мессенджер с end-to-end шифрованием. Чаты, серверы, контакты — всё в одном месте.
                    </p>
                  </div>
                )}
                {settingsSection === 'appearance' && (
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-6">Внешний вид</h3>
                    <p className="text-sm text-muted-foreground">Тёмная тема активна по умолчанию</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Модалка создания сервера */}
      {showCreateServer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowCreateServer(false)}>
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md mx-4 animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-foreground">Создать сервер</h3>
              <button onClick={() => setShowCreateServer(false)} className="text-muted-foreground hover:text-foreground">
                <Icon name="X" size={18} />
              </button>
            </div>
            <form onSubmit={createServer} className="flex flex-col gap-3">
              <input
                className="w-full bg-muted rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Название сервера"
                value={serverForm.name}
                onChange={e => setServerForm(f => ({ ...f, name: e.target.value }))}
                required
              />
              <input
                className="w-full bg-muted rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Описание (необязательно)"
                value={serverForm.description}
                onChange={e => setServerForm(f => ({ ...f, description: e.target.value }))}
              />
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-2">Цвет</label>
                <div className="flex gap-2 flex-wrap">
                  {SERVER_COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setServerForm(f => ({ ...f, color: c }))}
                      className="w-8 h-8 rounded-lg transition-transform hover:scale-110 flex-shrink-0"
                      style={{ background: c, outline: serverForm.color === c ? '2px solid white' : 'none', outlineOffset: 2 }} />
                  ))}
                </div>
              </div>
              <button type="submit" disabled={serverCreating || !serverForm.name.trim()}
                className="w-full py-3 rounded-xl font-semibold text-sm mt-2 disabled:opacity-60"
                style={{ background: 'hsl(var(--squad-accent))', color: 'hsl(var(--squad-servers))' }}>
                {serverCreating ? 'Создаю...' : 'Создать'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
