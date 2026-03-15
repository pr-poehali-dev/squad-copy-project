import { useState } from "react";
import Icon from "@/components/ui/icon";

type Tab = "chats" | "contacts" | "servers" | "notifications" | "profile" | "settings";
type Status = "online" | "away" | "dnd" | "offline";

interface Message {
  id: number;
  author: string;
  avatar: string;
  text: string;
  time: string;
  isOwn?: boolean;
  encrypted?: boolean;
}

interface Chat {
  id: number;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread?: number;
  status: Status;
}

interface Contact {
  id: number;
  name: string;
  avatar: string;
  status: Status;
  statusText: string;
}

interface Server {
  id: number;
  name: string;
  abbr: string;
  color: string;
  members: number;
  online: number;
}

interface Notification {
  id: number;
  type: "mention" | "message" | "invite" | "system";
  text: string;
  from: string;
  time: string;
  read: boolean;
}

const CHATS: Chat[] = [
  { id: 1, name: "Алексей Громов", avatar: "АГ", lastMessage: "Окей, завтра созвонимся 👍", time: "14:32", unread: 3, status: "online" },
  { id: 2, name: "Команда Дизайн", avatar: "КД", lastMessage: "Макеты готовы, смотри файл", time: "13:15", unread: 7, status: "online" },
  { id: 3, name: "Марина Лебедева", avatar: "МЛ", lastMessage: "Спасибо за помощь!", time: "12:50", status: "away" },
  { id: 4, name: "Разработка", avatar: "РА", lastMessage: "Деплой прошёл успешно ✅", time: "11:20", status: "online" },
  { id: 5, name: "Дмитрий Орлов", avatar: "ДО", lastMessage: "Посмотрю завтра утром", time: "вчера", status: "dnd" },
  { id: 6, name: "Проект Альфа", avatar: "ПА", lastMessage: "Встреча в пятницу в 15:00", time: "вчера", unread: 2, status: "online" },
  { id: 7, name: "Екатерина Нова", avatar: "ЕН", lastMessage: "Отличная работа команды!", time: "пн", status: "offline" },
  { id: 8, name: "Иван Степанов", avatar: "ИС", lastMessage: "Документы отправил", time: "пн", status: "offline" },
];

const MESSAGES: Message[] = [
  { id: 1, author: "Алексей Громов", avatar: "АГ", text: "Привет! Как дела с проектом?", time: "14:20", encrypted: true },
  { id: 2, author: "Вы", avatar: "ВЫ", text: "Всё идёт по плану. Сегодня закончим основную часть.", time: "14:22", isOwn: true, encrypted: true },
  { id: 3, author: "Алексей Громов", avatar: "АГ", text: "Отлично! Успеваем к дедлайну?", time: "14:25", encrypted: true },
  { id: 4, author: "Вы", avatar: "ВЫ", text: "Да, с запасом. Хочу показать тебе промежуточный результат — там кое-что интересное получилось.", time: "14:28", isOwn: true, encrypted: true },
  { id: 5, author: "Алексей Громов", avatar: "АГ", text: "Давай! Жду. Когда можешь скинуть?", time: "14:30", encrypted: true },
  { id: 6, author: "Вы", avatar: "ВЫ", text: "Через час пришлю. Окей, завтра созвонимся 👍", time: "14:32", isOwn: true, encrypted: true },
];

const CONTACTS: Contact[] = [
  { id: 1, name: "Алексей Громов", avatar: "АГ", status: "online", statusText: "В сети" },
  { id: 2, name: "Марина Лебедева", avatar: "МЛ", status: "away", statusText: "Отошёл" },
  { id: 3, name: "Дмитрий Орлов", avatar: "ДО", status: "dnd", statusText: "Не беспокоить" },
  { id: 4, name: "Екатерина Нова", avatar: "ЕН", status: "online", statusText: "В сети" },
  { id: 5, name: "Иван Степанов", avatar: "ИС", status: "offline", statusText: "Не в сети" },
  { id: 6, name: "Ольга Светлова", avatar: "ОС", status: "online", statusText: "В сети" },
  { id: 7, name: "Павел Рыков", avatar: "ПР", status: "away", statusText: "Занят" },
  { id: 8, name: "Наталья Воронова", avatar: "НВ", status: "offline", statusText: "Не в сети" },
];

const SERVERS: Server[] = [
  { id: 1, name: "Команда Сквад", abbr: "КС", color: "#4C8FE8", members: 24, online: 8 },
  { id: 2, name: "Разработка 2025", abbr: "РА", color: "#6D5BD0", members: 12, online: 5 },
  { id: 3, name: "Дизайн-студия", abbr: "ДС", color: "#E85C8A", members: 18, online: 3 },
  { id: 4, name: "Маркетинг", abbr: "МК", color: "#E8A83C", members: 9, online: 2 },
  { id: 5, name: "Стартап клуб", abbr: "СК", color: "#3CB87A", members: 47, online: 12 },
];

const NOTIFICATIONS: Notification[] = [
  { id: 1, type: "mention", text: "упомянул вас: «@Вы можешь посмотреть задачу?»", from: "Алексей Громов", time: "5 мин назад", read: false },
  { id: 2, type: "message", text: "написал в Команда Дизайн: «Макеты готовы»", from: "Дмитрий Орлов", time: "20 мин назад", read: false },
  { id: 3, type: "invite", text: "приглашает вас на сервер «Стартап клуб»", from: "Екатерина Нова", time: "1 ч назад", read: false },
  { id: 4, type: "system", text: "Новое обновление Сквад 1.0 доступно", from: "Система", time: "2 ч назад", read: true },
  { id: 5, type: "mention", text: "упомянул вас в «Разработка»: «@Вы когда будет готово?»", from: "Иван Степанов", time: "3 ч назад", read: true },
];

const STATUS_LABELS: Record<Status, string> = {
  online: "В сети",
  away: "Отошёл",
  dnd: "Не беспокоить",
  offline: "Не в сети",
};

function StatusDot({ status, size = 8 }: { status: Status; size?: number }) {
  const cls = { online: "bg-online", away: "bg-away", dnd: "bg-dnd", offline: "bg-offline" }[status];
  return (
    <span
      className={`rounded-full border-2 border-[hsl(var(--squad-servers))] flex-shrink-0 ${cls}`}
      style={{ width: size, height: size }}
    />
  );
}

function Avatar({ label, color, size = 36, status }: { label: string; color?: string; size?: number; status?: Status }) {
  const colors = ["#4C8FE8", "#6D5BD0", "#E85C8A", "#E8A83C", "#3CB87A", "#E85C4A", "#8F4CE8"];
  const bg = color || colors[label.charCodeAt(0) % colors.length];
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <div
        className="rounded-full flex items-center justify-center font-semibold text-white select-none"
        style={{ width: size, height: size, background: bg, fontSize: size * 0.35 }}
      >
        {label}
      </div>
      {status && (
        <div className="absolute bottom-0 right-0">
          <StatusDot status={status} size={size > 32 ? 11 : 9} />
        </div>
      )}
    </div>
  );
}

export default function Index() {
  const [activeTab, setActiveTab] = useState<Tab>("chats");
  const [activeChat, setActiveChat] = useState<Chat | null>(CHATS[0]);
  const [activeServer, setActiveServer] = useState<Server | null>(null);
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState<Message[]>(MESSAGES);
  const [userStatus, setUserStatus] = useState<Status>("online");
  const [settingsSection, setSettingsSection] = useState("account");
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  const unreadNotifs = NOTIFICATIONS.filter(n => !n.read).length;
  const unreadChats = CHATS.reduce((sum, c) => sum + (c.unread || 0), 0);

  const sendMessage = () => {
    if (!messageText.trim()) return;
    const newMsg: Message = {
      id: messages.length + 1,
      author: "Вы",
      avatar: "ВЫ",
      text: messageText,
      time: new Date().toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" }),
      isOwn: true,
      encrypted: true,
    };
    setMessages([...messages, newMsg]);
    setMessageText("");
  };

  const navItems: { tab: Tab; icon: string; label: string; badge?: number }[] = [
    { tab: "chats", icon: "MessageCircle", label: "Чаты", badge: unreadChats },
    { tab: "contacts", icon: "Users", label: "Контакты" },
    { tab: "servers", icon: "Hash", label: "Серверы" },
    { tab: "notifications", icon: "Bell", label: "Уведомления", badge: unreadNotifs },
    { tab: "profile", icon: "User", label: "Профиль" },
    { tab: "settings", icon: "Settings", label: "Настройки" },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden" style={{ fontFamily: "'Golos Text', sans-serif" }}>

      {/* Левая навигация */}
      <nav className="flex flex-col items-center py-4 gap-1 w-[64px] flex-shrink-0 squad-servers border-r border-border">
        <div className="mb-4 mt-1">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm"
            style={{ background: "hsl(var(--squad-accent))", color: "hsl(var(--squad-servers))" }}
          >
            С
          </div>
        </div>
        <div className="w-8 h-px bg-border mb-2" />
        {navItems.map(({ tab, icon, label, badge }) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="relative w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 group"
            style={{
              background: activeTab === tab ? "hsl(var(--squad-accent))" : "transparent",
              color: activeTab === tab ? "hsl(var(--squad-servers))" : "hsl(var(--muted-foreground))",
            }}
            title={label}
          >
            <Icon name={icon} size={20} />
            {badge && badge > 0 ? (
              <span
                className="absolute top-1 right-1 bg-mention rounded-full text-white font-bold flex items-center justify-center"
                style={{ fontSize: 10, minWidth: 16, height: 16, padding: "0 3px" }}
              >
                {badge > 99 ? "99+" : badge}
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
            <Avatar label="ВЫ" size={36} status={userStatus} />
          </button>
          {showStatusMenu && (
            <div className="absolute bottom-12 left-2 bg-card border border-border rounded-xl shadow-xl p-1 z-50 w-48 animate-scale-in">
              {(["online", "away", "dnd", "offline"] as Status[]).map(s => (
                <button
                  key={s}
                  onClick={() => { setUserStatus(s); setShowStatusMenu(false); }}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors"
                >
                  <StatusDot status={s} size={8} />
                  <span className={userStatus === s ? "font-semibold text-foreground" : "text-muted-foreground"}>
                    {STATUS_LABELS[s]}
                  </span>
                  {userStatus === s && <Icon name="Check" size={14} className="ml-auto text-primary" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* Основная область */}
      <div className="flex flex-1 overflow-hidden">

        {/* Сайдбар */}
        {(activeTab === "chats" || activeTab === "contacts" || activeTab === "servers" || activeTab === "notifications") && (
          <aside className="w-72 flex flex-col squad-sidebar border-r border-border flex-shrink-0">

            {/* Чаты */}
            {activeTab === "chats" && (
              <>
                <div className="p-4 border-b border-border">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-semibold text-base text-foreground">Сообщения</h2>
                    <button className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                      <Icon name="Plus" size={16} />
                    </button>
                  </div>
                  <div className="relative">
                    <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      className="w-full bg-muted rounded-lg pl-8 pr-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                      placeholder="Поиск..."
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto py-2">
                  {CHATS.map(chat => (
                    <button
                      key={chat.id}
                      onClick={() => setActiveChat(chat)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-left mx-auto"
                      style={{
                        background: activeChat?.id === chat.id ? "hsl(var(--muted))" : "transparent",
                        margin: "0 4px",
                        width: "calc(100% - 8px)",
                      }}
                    >
                      <Avatar label={chat.avatar} size={40} status={chat.status} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm text-foreground truncate">{chat.name}</span>
                          <span className="text-xs text-muted-foreground flex-shrink-0 ml-1">{chat.time}</span>
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                          <span className="text-xs text-muted-foreground truncate">{chat.lastMessage}</span>
                          {chat.unread && (
                            <span
                              className="bg-mention text-white text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0 ml-1"
                              style={{ minWidth: 18, height: 18, padding: "0 4px", fontSize: 10 }}
                            >
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
            {activeTab === "contacts" && (
              <>
                <div className="p-4 border-b border-border">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-semibold text-base text-foreground">Контакты</h2>
                    <button className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                      <Icon name="UserPlus" size={16} />
                    </button>
                  </div>
                  <div className="relative">
                    <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      className="w-full bg-muted rounded-lg pl-8 pr-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                      placeholder="Найти контакт..."
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto py-2">
                  {(["online", "away", "dnd", "offline"] as Status[]).map(group => {
                    const grouped = CONTACTS.filter(c => c.status === group);
                    if (!grouped.length) return null;
                    const groupLabels: Record<string, string> = {
                      online: "В сети", away: "Отошёл", dnd: "Не беспокоить", offline: "Не в сети"
                    };
                    return (
                      <div key={group}>
                        <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {groupLabels[group]} — {grouped.length}
                        </p>
                        {grouped.map(contact => (
                          <button
                            key={contact.id}
                            className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-muted transition-colors text-left"
                            style={{ margin: "0 4px", width: "calc(100% - 8px)" }}
                          >
                            <Avatar label={contact.avatar} size={36} status={contact.status} />
                            <div>
                              <p className="font-medium text-sm text-foreground">{contact.name}</p>
                              <p className="text-xs text-muted-foreground">{contact.statusText}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* Серверы */}
            {activeTab === "servers" && (
              <>
                <div className="p-4 border-b border-border">
                  <div className="flex items-center justify-between mb-1">
                    <h2 className="font-semibold text-base text-foreground">Серверы</h2>
                    <button className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                      <Icon name="Plus" size={16} />
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto py-2">
                  {SERVERS.map(server => (
                    <button
                      key={server.id}
                      onClick={() => setActiveServer(server)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left"
                      style={{
                        margin: "0 4px",
                        width: "calc(100% - 8px)",
                        background: activeServer?.id === server.id ? "hsl(var(--muted))" : "transparent",
                      }}
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-white flex-shrink-0"
                        style={{ background: server.color }}
                      >
                        {server.abbr}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-foreground">{server.name}</p>
                        <p className="text-xs text-muted-foreground">
                          <span className="text-online">{server.online} онлайн</span>
                          {" · "}{server.members} участников
                        </p>
                      </div>
                    </button>
                  ))}
                  <button
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors text-muted-foreground"
                    style={{ margin: "0 4px", width: "calc(100% - 8px)" }}
                  >
                    <div className="w-10 h-10 rounded-xl border-2 border-dashed border-border flex items-center justify-center">
                      <Icon name="Plus" size={18} />
                    </div>
                    <span className="text-sm">Создать сервер</span>
                  </button>
                </div>
              </>
            )}

            {/* Уведомления */}
            {activeTab === "notifications" && (
              <>
                <div className="p-4 border-b border-border">
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-base text-foreground">Уведомления</h2>
                    <button className="text-xs text-primary hover:underline">Прочитать всё</button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto py-2">
                  {NOTIFICATIONS.map(notif => (
                    <div
                      key={notif.id}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-muted transition-colors cursor-pointer"
                      style={{ opacity: notif.read ? 0.55 : 1 }}
                    >
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{
                          background: notif.type === "mention" ? "hsl(var(--squad-mention))" :
                            notif.type === "invite" ? "hsl(var(--squad-accent))" :
                            notif.type === "system" ? "hsl(var(--muted))" : "hsl(var(--squad-online))",
                          color: "white"
                        }}
                      >
                        <Icon
                          name={notif.type === "mention" ? "AtSign" : notif.type === "invite" ? "UserPlus" : notif.type === "system" ? "Info" : "MessageCircle"}
                          size={16}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">
                          <span className="font-semibold">{notif.from}</span>{" "}
                          <span className="text-muted-foreground">{notif.text}</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{notif.time}</p>
                      </div>
                      {!notif.read && <div className="w-2 h-2 rounded-full bg-mention flex-shrink-0 mt-2" />}
                    </div>
                  ))}
                </div>
              </>
            )}
          </aside>
        )}

        {/* Правая область */}
        <main className="flex-1 flex flex-col squad-chat-bg overflow-hidden">

          {/* Чат */}
          {activeTab === "chats" && activeChat && (
            <>
              <header className="flex items-center justify-between px-5 py-3.5 border-b border-border flex-shrink-0">
                <div className="flex items-center gap-3">
                  <Avatar label={activeChat.avatar} size={36} status={activeChat.status} />
                  <div>
                    <h3 className="font-semibold text-sm text-foreground">{activeChat.name}</h3>
                    <p className="text-xs text-muted-foreground">{STATUS_LABELS[activeChat.status]}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
                    style={{ background: "hsl(var(--muted))", color: "hsl(142 70% 45%)" }}
                  >
                    <Icon name="Lock" size={11} />
                    <span>E2E шифрование</span>
                  </div>
                  <button className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                    <Icon name="Phone" size={16} />
                  </button>
                  <button className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                    <Icon name="Video" size={16} />
                  </button>
                  <button className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                    <Icon name="MoreHorizontal" size={16} />
                  </button>
                </div>
              </header>
              <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-0.5">
                {messages.map((msg, i) => {
                  const prevMsg = messages[i - 1];
                  const isGrouped = prevMsg && prevMsg.author === msg.author;
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 group hover:bg-[hsl(220,12%,16%)] rounded-xl px-3 py-1.5 transition-colors ${msg.isOwn ? "flex-row-reverse" : ""} ${isGrouped ? "mt-0" : "mt-2"}`}
                    >
                      {!isGrouped ? (
                        <Avatar label={msg.avatar} size={34} />
                      ) : (
                        <div className="w-[34px] flex-shrink-0" />
                      )}
                      <div className={`flex flex-col max-w-[70%] ${msg.isOwn ? "items-end" : ""}`}>
                        {!isGrouped && (
                          <div className={`flex items-baseline gap-2 mb-0.5 ${msg.isOwn ? "flex-row-reverse" : ""}`}>
                            <span className="text-sm font-semibold text-foreground">{msg.author}</span>
                            <span className="text-xs text-muted-foreground">{msg.time}</span>
                          </div>
                        )}
                        <div
                          className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed ${msg.isOwn ? "rounded-tr-sm" : "rounded-tl-sm"}`}
                          style={{
                            background: msg.isOwn ? "hsl(var(--squad-accent))" : "hsl(var(--secondary))",
                            color: msg.isOwn ? "hsl(var(--squad-servers))" : "hsl(var(--foreground))",
                          }}
                        >
                          {msg.text}
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
              </div>
              <div className="px-5 pb-5 flex-shrink-0">
                <div className="flex items-end gap-2 bg-muted rounded-2xl px-4 py-3 border border-border focus-within:border-primary transition-colors">
                  <button className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 mb-0.5">
                    <Icon name="Paperclip" size={18} />
                  </button>
                  <textarea
                    value={messageText}
                    onChange={e => setMessageText(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    className="flex-1 bg-transparent resize-none outline-none text-sm text-foreground placeholder:text-muted-foreground max-h-32 leading-relaxed"
                    placeholder={`Написать ${activeChat.name}...`}
                    rows={1}
                  />
                  <button className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 mb-0.5">
                    <Icon name="Smile" size={18} />
                  </button>
                  <button
                    onClick={sendMessage}
                    disabled={!messageText.trim()}
                    className="w-8 h-8 rounded-xl flex items-center justify-center transition-all flex-shrink-0 disabled:opacity-30"
                    style={{
                      background: messageText.trim() ? "hsl(var(--squad-accent))" : "transparent",
                      color: messageText.trim() ? "hsl(var(--squad-servers))" : "hsl(var(--muted-foreground))",
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

          {/* Серверы — пустой экран */}
          {activeTab === "servers" && !activeServer && (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 animate-fade-in">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-2" style={{ background: "hsl(var(--muted))" }}>
                <Icon name="Hash" size={32} className="text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Выберите сервер</h3>
              <p className="text-muted-foreground text-sm text-center max-w-xs">
                Выберите сервер из списка слева или создайте новый для общения в группе
              </p>
              <button
                className="px-5 py-2.5 rounded-xl font-medium text-sm transition-all"
                style={{ background: "hsl(var(--squad-accent))", color: "hsl(var(--squad-servers))" }}
              >
                Создать сервер
              </button>
            </div>
          )}

          {/* Сервер — страница */}
          {activeTab === "servers" && activeServer && (
            <>
              <header className="flex items-center justify-between px-5 py-3.5 border-b border-border flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm text-white"
                    style={{ background: activeServer.color }}
                  >
                    {activeServer.abbr}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-foreground">{activeServer.name}</h3>
                    <p className="text-xs text-muted-foreground">{activeServer.online} онлайн · {activeServer.members} участников</p>
                  </div>
                </div>
                <button className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground">
                  <Icon name="Settings" size={16} />
                </button>
              </header>
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center animate-fade-in">
                  <div
                    className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 font-bold text-2xl text-white"
                    style={{ background: activeServer.color }}
                  >
                    {activeServer.abbr}
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">{activeServer.name}</h3>
                  <p className="text-muted-foreground text-sm mb-6">
                    {activeServer.members} участников · {activeServer.online} онлайн
                  </p>
                  <div className="flex gap-3 justify-center">
                    <button className="px-4 py-2 rounded-xl text-sm font-medium hover:bg-muted transition-colors border border-border text-foreground flex items-center gap-1.5">
                      <Icon name="Users" size={14} />
                      Участники
                    </button>
                    <button
                      className="px-4 py-2 rounded-xl text-sm font-medium transition-all text-white flex items-center gap-1.5"
                      style={{ background: activeServer.color }}
                    >
                      <Icon name="MessageCircle" size={14} />
                      Открыть чат
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Профиль */}
          {activeTab === "profile" && (
            <div className="flex-1 overflow-y-auto animate-fade-in">
              <div className="relative">
                <div className="h-36" style={{ background: "linear-gradient(135deg, hsl(215 80% 25%), hsl(260 60% 25%))" }} />
                <div className="absolute bottom-0 translate-y-1/2 left-8">
                  <div className="relative">
                    <Avatar label="ВЫ" size={80} />
                    <button
                      className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center"
                      style={{ background: "hsl(var(--squad-accent))", color: "hsl(var(--squad-servers))" }}
                    >
                      <Icon name="Camera" size={13} />
                    </button>
                  </div>
                </div>
              </div>
              <div className="pt-16 px-8 pb-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">Ваше имя</h2>
                    <p className="text-muted-foreground text-sm mt-0.5">@username · {STATUS_LABELS[userStatus]}</p>
                  </div>
                  <button className="px-4 py-2 rounded-xl text-sm font-medium border border-border hover:bg-muted transition-colors text-foreground flex items-center gap-1.5">
                    <Icon name="Pencil" size={14} />
                    Редактировать
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-8">
                  {[
                    { label: "Сообщений", value: "2 341" },
                    { label: "Контактов", value: "8" },
                    { label: "Серверов", value: "5" },
                  ].map(stat => (
                    <div key={stat.label} className="bg-card rounded-2xl p-4 text-center border border-border">
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                      <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-card rounded-2xl p-5 border border-border mb-4">
                  <h4 className="font-semibold text-sm text-foreground mb-3">О себе</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">Привет! Я пользуюсь Сквадом. Рад общению 👋</p>
                </div>
                <div className="bg-card rounded-2xl p-5 border border-border">
                  <h4 className="font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
                    <Icon name="Lock" size={14} className="text-primary" />
                    Конфиденциальность
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Все ваши сообщения защищены end-to-end шифрованием. Никто, кроме участников переписки, не может прочитать ваши сообщения.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Настройки */}
          {activeTab === "settings" && (
            <div className="flex-1 flex overflow-hidden animate-fade-in">
              <div className="w-56 border-r border-border p-3 flex-shrink-0">
                {[
                  { id: "account", icon: "User", label: "Аккаунт" },
                  { id: "privacy", icon: "Shield", label: "Конфиденциальность" },
                  { id: "notifications_s", icon: "Bell", label: "Уведомления" },
                  { id: "appearance", icon: "Palette", label: "Внешний вид" },
                  { id: "security", icon: "Lock", label: "Безопасность" },
                  { id: "devices", icon: "Smartphone", label: "Устройства" },
                  { id: "about", icon: "Info", label: "О приложении" },
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setSettingsSection(item.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors text-left"
                    style={{
                      background: settingsSection === item.id ? "hsl(var(--muted))" : "transparent",
                      color: settingsSection === item.id ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
                      fontWeight: settingsSection === item.id ? 500 : 400,
                    }}
                  >
                    <Icon name={item.icon} size={16} />
                    {item.label}
                  </button>
                ))}
              </div>
              <div className="flex-1 overflow-y-auto p-8">
                {settingsSection === "account" && (
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-6">Аккаунт</h3>
                    <div className="flex items-center gap-4 mb-8 p-5 bg-card rounded-2xl border border-border">
                      <Avatar label="ВЫ" size={56} status={userStatus} />
                      <div>
                        <p className="font-semibold text-foreground">Ваше имя</p>
                        <p className="text-sm text-muted-foreground">@username</p>
                        <p className="text-xs text-primary mt-1">{STATUS_LABELS[userStatus]}</p>
                      </div>
                    </div>
                    {[
                      { label: "Имя пользователя", value: "Ваше имя" },
                      { label: "Тег", value: "@username" },
                      { label: "Email", value: "user@example.com" },
                      { label: "Телефон", value: "+7 (xxx) xxx-xx-xx" },
                    ].map(field => (
                      <div key={field.label} className="flex items-center justify-between py-4 border-b border-border">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">{field.label}</p>
                          <p className="text-sm text-foreground mt-1">{field.value}</p>
                        </div>
                        <button className="text-xs text-primary hover:underline">Изменить</button>
                      </div>
                    ))}
                  </div>
                )}
                {settingsSection === "privacy" && (
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-6">Конфиденциальность</h3>
                    {[
                      { label: "End-to-end шифрование", desc: "Все личные сообщения шифруются", enabled: true },
                      { label: "Подтверждение прочтения", desc: "Показывать, что вы прочли сообщение", enabled: true },
                      { label: "Индикатор набора", desc: "Показывать, что вы пишете", enabled: false },
                      { label: "Скрыть онлайн статус", desc: "Не показывать когда вы в сети", enabled: false },
                    ].map(setting => (
                      <div key={setting.label} className="flex items-center justify-between py-4 border-b border-border">
                        <div>
                          <p className="text-sm font-medium text-foreground">{setting.label}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{setting.desc}</p>
                        </div>
                        <div
                          className="w-10 h-6 rounded-full transition-colors cursor-pointer flex items-center px-1"
                          style={{ background: setting.enabled ? "hsl(var(--squad-accent))" : "hsl(var(--muted))" }}
                        >
                          <div
                            className="w-4 h-4 rounded-full bg-white transition-transform"
                            style={{ transform: setting.enabled ? "translateX(16px)" : "translateX(0)" }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {settingsSection === "about" && (
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-6">О приложении</h3>
                    <div className="text-center py-12">
                      <div
                        className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 font-bold text-3xl"
                        style={{ background: "hsl(var(--squad-accent))", color: "hsl(var(--squad-servers))" }}
                      >
                        С
                      </div>
                      <h2 className="text-2xl font-bold text-foreground">Сквад</h2>
                      <p className="text-muted-foreground text-sm mt-2">Версия 1.0.0</p>
                      <p className="text-muted-foreground text-sm mt-6 max-w-sm mx-auto leading-relaxed">
                        Современный мессенджер с end-to-end шифрованием для безопасного общения. Чаты, серверы, голосовые звонки — всё в одном месте.
                      </p>
                    </div>
                  </div>
                )}
                {!["account", "privacy", "about"].includes(settingsSection) && (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                    Раздел в разработке
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Пустой экран чатов */}
          {activeTab === "chats" && !activeChat && (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 animate-fade-in">
              <Icon name="MessageCircle" size={48} className="text-muted-foreground opacity-30" />
              <p className="text-muted-foreground text-sm">Выберите чат для начала общения</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}