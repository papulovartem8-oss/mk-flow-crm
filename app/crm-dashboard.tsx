"use client";

import { useMemo, useState } from "react";

type View =
  | "overview"
  | "leads"
  | "teams"
  | "users"
  | "problems"
  | "analytics"
  | "offers"
  | "partner"
  | "access"
  | "integrations"
  | "settings";

type LeadStatus = "Новый" | "В работе" | "Успешно" | "Отказ";
type Period = "День" | "Неделя" | "Месяц";

type OfferItem = {
  bank: string;
  product: string;
  stage: string;
  payout: number;
  cdCost: number;
  delivery: string;
};

type Lead = {
  id: number;
  client: string;
  initials: string;
  phone: string;
  telegram: string;
  whatsapp: string;
  source: string;
  product: string;
  status: LeadStatus;
  amount: number;
  manager: string;
  team: string;
  created: string;
  description: string;
  issue?: "Нет контакта" | "Нет суммы" | "Низкое качество" | "Застрял";
  ai: number;
  offers: OfferItem[];
};

type User = {
  id: number;
  name: string;
  initials: string;
  role: string;
  team: string;
  status: "Активен" | "Деактивирован";
  leads: number;
  revenue: number;
  conversion: number;
  lastLogin: string;
  session: string;
  topOffer: string;
};

const money = (value: number) =>
  new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(value);

const NAV: { id: View; label: string; icon: string }[] = [
  { id: "overview", label: "Обзор", icon: "⌂" },
  { id: "leads", label: "Лиды", icon: "◫" },
  { id: "teams", label: "Команды", icon: "♟" },
  { id: "users", label: "Пользователи", icon: "◎" },
  { id: "problems", label: "Проблемы", icon: "!" },
  { id: "analytics", label: "Аналитика", icon: "↗" },
  { id: "offers", label: "Офферы", icon: "◆" },
  { id: "partner", label: "Партнёрский кабинет", icon: "₽" },
  { id: "access", label: "Доступы", icon: "⌘" },
  { id: "integrations", label: "Интеграции", icon: "⇄" },
  { id: "settings", label: "Настройки", icon: "⚙" },
];

const INITIAL_LEADS: Lead[] = [
  {
    id: 1042,
    client: "Ирина Волкова",
    initials: "ИВ",
    phone: "+7 912 420-18-73",
    telegram: "@irina_volk",
    whatsapp: "+7 912 420-18-73",
    source: "Авито",
    product: "Дебет",
    status: "В работе",
    amount: 18600,
    manager: "Анна Сидорова",
    team: "Север",
    created: "Сегодня, 12:41",
    description:
      "Клиенту нужны три дебетовые карты. Готова принять курьера в будни после 18:00.",
    ai: 91,
    offers: [
      {
        bank: "ВТБ",
        product: "Дебетовая карта",
        stage: "ЦД выполняется",
        payout: 6800,
        cdCost: 900,
        delivery: "Курьер доставил 22 июля",
      },
      {
        bank: "Газпромбанк",
        product: "Умная карта",
        stage: "Ожидаем доставку",
        payout: 7200,
        cdCost: 1100,
        delivery: "Доставка 24 июля, 18:00–21:00",
      },
      {
        bank: "ОТП",
        product: "ОТП Карта",
        stage: "Ждём выплату",
        payout: 4600,
        cdCost: 700,
        delivery: "ЦД выполнено 21 июля",
      },
    ],
  },
  {
    id: 1041,
    client: "Александр Иванов",
    initials: "АИ",
    phone: "+7 916 924-11-38",
    telegram: "@alex_msk",
    whatsapp: "+7 916 924-11-38",
    source: "Яндекс",
    product: "Кредит",
    status: "Новый",
    amount: 12500,
    manager: "Иван Петров",
    team: "Альфа",
    created: "Сегодня, 11:36",
    description: "Оставил заявку на кредитную карту, предпочитает связь в Telegram.",
    ai: 83,
    issue: "Нет контакта",
    offers: [
      {
        bank: "Альфа-Банк",
        product: "Кредитная карта",
        stage: "Новая заявка",
        payout: 12500,
        cdCost: 0,
        delivery: "Контакт не подтверждён",
      },
    ],
  },
  {
    id: 1040,
    client: "Ольга Морозова",
    initials: "ОМ",
    phone: "+7 903 901-58-84",
    telegram: "@morozova_o",
    whatsapp: "+7 903 901-58-84",
    source: "Telegram",
    product: "Инвестиции",
    status: "Отказ",
    amount: 0,
    manager: "Иван Петров",
    team: "Альфа",
    created: "Сегодня, 10:18",
    description: "Интерес к инвестиционному продукту, не согласована сумма.",
    ai: 74,
    issue: "Нет суммы",
    offers: [
      {
        bank: "БКС",
        product: "Брокерский счёт",
        stage: "Отказ клиента",
        payout: 9200,
        cdCost: 300,
        delivery: "Не требуется",
      },
    ],
  },
  {
    id: 1039,
    client: "Дмитрий Смирнов",
    initials: "ДС",
    phone: "+7 977 992-32-34",
    telegram: "@dsmirnov",
    whatsapp: "+7 977 992-32-34",
    source: "Холодный звонок",
    product: "РКО",
    status: "Успешно",
    amount: 38500,
    manager: "Мария Орлова",
    team: "Север",
    created: "Вчера, 19:43",
    description: "ИП в сфере логистики. Счёт открыт, ждём подтверждение выплаты.",
    ai: 96,
    offers: [
      {
        bank: "Т-Банк",
        product: "РКО для ИП",
        stage: "Выплачено",
        payout: 38500,
        cdCost: 2400,
        delivery: "Счёт активирован",
      },
    ],
  },
  {
    id: 1038,
    client: "Павел Фёдоров",
    initials: "ПФ",
    phone: "+7 915 800-12-11",
    telegram: "@pavel_f",
    whatsapp: "+7 915 800-12-11",
    source: "Реферал",
    product: "МФО",
    status: "В работе",
    amount: 7400,
    manager: "Анна Сидорова",
    team: "Север",
    created: "Вчера, 17:26",
    description: "Повторная заявка, документы отправлены на проверку.",
    ai: 69,
    issue: "Застрял",
    offers: [
      {
        bank: "Займер",
        product: "Первый заём",
        stage: "Проверка документов",
        payout: 7400,
        cdCost: 800,
        delivery: "Онлайн",
      },
    ],
  },
  {
    id: 1037,
    client: "Елена Соколова",
    initials: "ЕС",
    phone: "+7 906 211-44-09",
    telegram: "@lena_sokol",
    whatsapp: "+7 906 211-44-09",
    source: "Сайт",
    product: "HR",
    status: "Успешно",
    amount: 22000,
    manager: "Мария Орлова",
    team: "Вектор",
    created: "22 июля, 15:04",
    description: "Кандидат трудоустроен, испытательный период начат.",
    ai: 88,
    offers: [
      {
        bank: "HR",
        product: "Оператор поддержки",
        stage: "Вышел на работу",
        payout: 22000,
        cdCost: 3200,
        delivery: "Первый рабочий день 22 июля",
      },
    ],
  },
  {
    id: 1036,
    client: "Никита Беляев",
    initials: "НБ",
    phone: "+7 925 332-10-07",
    telegram: "@belyaev_n",
    whatsapp: "+7 925 332-10-07",
    source: "Авито",
    product: "Регбиз",
    status: "Новый",
    amount: 14800,
    manager: "Общий пользователь",
    team: "Вектор",
    created: "22 июля, 13:17",
    description: "Нужна регистрация ИП и расчётный счёт.",
    ai: 61,
    issue: "Низкое качество",
    offers: [
      {
        bank: "Точка",
        product: "Регистрация бизнеса",
        stage: "Новая заявка",
        payout: 14800,
        cdCost: 500,
        delivery: "Документы не загружены",
      },
    ],
  },
  {
    id: 1035,
    client: "Алина Кузнецова",
    initials: "АК",
    phone: "+7 901 144-52-21",
    telegram: "@alina_kzn",
    whatsapp: "+7 901 144-52-21",
    source: "Яндекс",
    product: "Дебет",
    status: "Успешно",
    amount: 17300,
    manager: "Анна Сидорова",
    team: "Север",
    created: "21 июля, 18:02",
    description: "Карта доставлена, целевое действие выполнено.",
    ai: 94,
    offers: [
      {
        bank: "Газпромбанк",
        product: "Дебетовая карта",
        stage: "Выплачено",
        payout: 17300,
        cdCost: 1200,
        delivery: "ЦД выполнено",
      },
    ],
  },
];

const INITIAL_USERS: User[] = [
  {
    id: 1,
    name: "Анна Сидорова",
    initials: "АС",
    role: "Тимлид",
    team: "Север",
    status: "Активен",
    leads: 46,
    revenue: 486300,
    conversion: 31.8,
    lastLogin: "Сегодня, 12:58",
    session: "3 ч 24 мин",
    topOffer: "Дебет",
  },
  {
    id: 2,
    name: "Иван Петров",
    initials: "ИП",
    role: "Менеджер",
    team: "Альфа",
    status: "Активен",
    leads: 38,
    revenue: 392700,
    conversion: 27.4,
    lastLogin: "Сегодня, 12:41",
    session: "2 ч 51 мин",
    topOffer: "Кредит",
  },
  {
    id: 3,
    name: "Мария Орлова",
    initials: "МО",
    role: "Менеджер",
    team: "Вектор",
    status: "Активен",
    leads: 31,
    revenue: 354200,
    conversion: 29.1,
    lastLogin: "Сегодня, 11:07",
    session: "1 ч 46 мин",
    topOffer: "РКО",
  },
  {
    id: 4,
    name: "Сергей Ковалёв",
    initials: "СК",
    role: "Лидогенератор",
    team: "Альфа",
    status: "Активен",
    leads: 24,
    revenue: 188900,
    conversion: 22.7,
    lastLogin: "Сегодня, 09:12",
    session: "4 ч 02 мин",
    topOffer: "МФО",
  },
  {
    id: 5,
    name: "Общий пользователь",
    initials: "ОП",
    role: "Менеджер",
    team: "Вектор",
    status: "Деактивирован",
    leads: 17,
    revenue: 112400,
    conversion: 18.6,
    lastLogin: "Вчера, 18:30",
    session: "38 мин",
    topOffer: "Регбиз",
  },
];

const sourceStats = [
  { name: "Авито", leads: 58, revenue: 842600, conversion: 32.4, color: "#bdff38" },
  { name: "Яндекс", leads: 42, revenue: 611900, conversion: 27.1, color: "#a78bfa" },
  { name: "Telegram", leads: 36, revenue: 524800, conversion: 30.6, color: "#46d9ff" },
  { name: "Сайт", leads: 29, revenue: 387400, conversion: 24.8, color: "#ffb35c" },
  { name: "Реферал", leads: 24, revenue: 318200, conversion: 35.9, color: "#ff6e91" },
  { name: "Холодный звонок", leads: 19, revenue: 196700, conversion: 16.2, color: "#7f8da6" },
];

const productStats = [
  { name: "Дебет", value: 31, color: "#bdff38" },
  { name: "РКО", value: 22, color: "#46d9ff" },
  { name: "Кредит", value: 18, color: "#a78bfa" },
  { name: "МФО", value: 12, color: "#ffb35c" },
  { name: "Регбиз", value: 9, color: "#ff6e91" },
  { name: "HR и другие", value: 8, color: "#62708c" },
];

const daily = [38, 52, 44, 61, 78, 70, 86, 72, 94, 88, 102, 118, 109, 126];
const hourly = [20, 38, 54, 47, 72, 83, 64, 92, 78, 58, 34, 18];

function StatusBadge({ status }: { status: LeadStatus }) {
  return <span className={`status status-${status.replace(" ", "-").toLowerCase()}`}>{status}</span>;
}

function Avatar({ initials, large = false }: { initials: string; large?: boolean }) {
  return <span className={`avatar ${large ? "avatar-large" : ""}`}>{initials}</span>;
}

function Panel({
  title,
  subtitle,
  action,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      <div className="panel-head">
        <div>
          <h3>{title}</h3>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function KpiCard({
  label,
  value,
  meta,
  accent,
  icon,
  onClick,
}: {
  label: string;
  value: string;
  meta: string;
  accent: string;
  icon: string;
  onClick: () => void;
}) {
  return (
    <button className="kpi-card" onClick={onClick}>
      <span className="kpi-icon" style={{ background: `${accent}1f`, color: accent }}>
        {icon}
      </span>
      <span className="kpi-label">{label}</span>
      <strong>{value}</strong>
      <span className="kpi-meta">{meta}</span>
      <span className="kpi-arrow">↗</span>
    </button>
  );
}

function BarChart({
  values,
  labels,
  compact = false,
}: {
  values: number[];
  labels: string[];
  compact?: boolean;
}) {
  const max = Math.max(...values);
  return (
    <div className={`bar-chart ${compact ? "bar-chart-compact" : ""}`}>
      {values.map((value, index) => (
        <div className="bar-column" key={`${labels[index]}-${value}`}>
          <div className="bar-track">
            <span className="bar-fill" style={{ height: `${Math.max(8, (value / max) * 100)}%` }} />
          </div>
          <span>{labels[index]}</span>
        </div>
      ))}
    </div>
  );
}

function Donut({ center, label }: { center: string; label: string }) {
  return (
    <div className="donut-wrap">
      <div className="donut">
        <div className="donut-center">
          <strong>{center}</strong>
          <span>{label}</span>
        </div>
      </div>
    </div>
  );
}

function PeriodControl({
  period,
  setPeriod,
}: {
  period: Period;
  setPeriod: (period: Period) => void;
}) {
  return (
    <div className="period-control">
      {(["День", "Неделя", "Месяц"] as Period[]).map((item) => (
        <button
          className={period === item ? "active" : ""}
          key={item}
          onClick={() => setPeriod(item)}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

export function CrmDashboard() {
  const [view, setView] = useState<View>("overview");
  const [period, setPeriod] = useState<Period>("Месяц");
  const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [metricModal, setMetricModal] = useState<string | null>(null);
  const [editingLead, setEditingLead] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Все статусы");
  const [problemFilter, setProblemFilter] = useState("Все проблемы");
  const [toast, setToast] = useState<string | null>(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [connected, setConnected] = useState<string[]>(["Telegram-бот"]);

  const selectedLead = leads.find((lead) => lead.id === selectedLeadId) ?? null;
  const selectedUser = users.find((user) => user.id === selectedUserId) ?? null;

  const filteredLeads = useMemo(() => {
    const query = search.trim().toLowerCase();
    return leads.filter((lead) => {
      const matchesSearch =
        !query ||
        [lead.client, lead.phone, lead.telegram, lead.source, lead.product, lead.manager]
          .join(" ")
          .toLowerCase()
          .includes(query);
      const matchesStatus = statusFilter === "Все статусы" || lead.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [leads, search, statusFilter]);

  const problemLeads = leads.filter(
    (lead) => lead.issue && (problemFilter === "Все проблемы" || lead.issue === problemFilter),
  );

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2400);
  };

  const updateLead = (field: keyof Lead, value: string | number) => {
    if (!selectedLeadId) return;
    setLeads((current) =>
      current.map((lead) => (lead.id === selectedLeadId ? { ...lead, [field]: value } : lead)),
    );
  };

  const openUser = (id: number) => {
    setSelectedUserId(id);
    setSelectedLeadId(null);
  };

  const navigate = (next: View) => {
    setView(next);
    setMobileNav(false);
    setSelectedLeadId(null);
    setSelectedUserId(null);
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
        <button className="brand" onClick={() => navigate("overview")}>
          <span className="brand-mark">
            <img src="/mk-logo.jpg" alt="Логотип M&K" />
          </span>
          <span>
            <strong>Платформа M&K</strong>
            <small>УПРАВЛЕНИЕ ЛИДАМИ</small>
          </span>
        </button>

        <nav className="nav-list" aria-label="Основная навигация">
          {NAV.map((item) => (
            <button
              key={item.id}
              className={view === item.id ? "active" : ""}
              onClick={() => navigate(item.id)}
            >
              <span>{item.icon}</span>
              {item.label}
              {item.id === "problems" && <b>4</b>}
            </button>
          ))}
        </nav>

        <div className="sidebar-foot">
          <div className="online-dot" />
          <div>
            <strong>Супер Администратор</strong>
            <small>admin@m8.team</small>
          </div>
          <button aria-label="Открыть профиль" onClick={() => navigate("settings")}>
            ›
          </button>
        </div>
      </aside>

      {mobileNav && <button className="scrim" onClick={() => setMobileNav(false)} aria-label="Закрыть меню" />}

      <main className="main">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMobileNav(true)} aria-label="Открыть меню">
            ☰
          </button>
          <div className="global-search">
            <span>⌕</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Найти лид, пользователя, источник…"
              onFocus={() => setView("leads")}
            />
            <kbd>Ctrl K</kbd>
          </div>
          <div className="top-actions">
            <button className="icon-button" aria-label="Уведомления">
              ●<i />
            </button>
            <button className="avatar-button" onClick={() => navigate("settings")}>
              СА
            </button>
          </div>
        </header>

        <div className="content">
          {view === "overview" && (
            <Overview
              period={period}
              setPeriod={setPeriod}
              users={users}
              leads={leads}
              setMetricModal={setMetricModal}
              openUser={openUser}
              navigate={navigate}
            />
          )}
          {view === "leads" && (
            <LeadsView
              leads={filteredLeads}
              search={search}
              setSearch={setSearch}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              onOpen={(id) => setSelectedLeadId(id)}
              onAdd={() => {
                const nextId = Math.max(...leads.map((lead) => lead.id)) + 1;
                const blank: Lead = {
                  id: nextId,
                  client: "Новый клиент",
                  initials: "НК",
                  phone: "Не указан",
                  telegram: "Не указан",
                  whatsapp: "Не указан",
                  source: "Сайт",
                  product: "Дебет",
                  status: "Новый",
                  amount: 0,
                  manager: "Не назначен",
                  team: "Без команды",
                  created: "Только что",
                  description: "Заполните данные нового лида.",
                  ai: 50,
                  offers: [],
                };
                setLeads((current) => [blank, ...current]);
                setSelectedLeadId(nextId);
                setEditingLead(true);
              }}
            />
          )}
          {view === "teams" && <TeamsView users={users} openUser={openUser} />}
          {view === "users" && (
            <UsersView
              users={users}
              openUser={openUser}
              onInvite={() => setMetricModal("invite")}
            />
          )}
          {view === "problems" && (
            <ProblemsView
              leads={problemLeads}
              filter={problemFilter}
              setFilter={setProblemFilter}
              onOpen={(id) => setSelectedLeadId(id)}
            />
          )}
          {view === "analytics" && (
            <AnalyticsView period={period} setPeriod={setPeriod} users={users} openUser={openUser} />
          )}
          {view === "offers" && <OffersView setMetricModal={setMetricModal} />}
          {view === "partner" && <PartnerView setMetricModal={setMetricModal} />}
          {view === "access" && (
            <AccessView
              users={users}
              onUser={(id) => openUser(id)}
              onNewKey={() => setMetricModal("key")}
            />
          )}
          {view === "integrations" && (
            <IntegrationsView connected={connected} setConnected={setConnected} showToast={showToast} />
          )}
          {view === "settings" && <SettingsView showToast={showToast} />}
        </div>
      </main>

      {selectedLead && (
        <LeadDrawer
          lead={selectedLead}
          editing={editingLead}
          setEditing={setEditingLead}
          updateLead={updateLead}
          onClose={() => {
            setSelectedLeadId(null);
            setEditingLead(false);
          }}
          onSave={() => {
            setEditingLead(false);
            showToast("Изменения по лиду сохранены");
          }}
        />
      )}

      {selectedUser && (
        <UserDrawer
          user={selectedUser}
          leads={leads.filter((lead) => lead.manager === selectedUser.name)}
          onLead={(id) => {
            setSelectedUserId(null);
            setSelectedLeadId(id);
          }}
          onClose={() => setSelectedUserId(null)}
          onToggle={() => {
            setUsers((current) =>
              current.map((user) =>
                user.id === selectedUser.id
                  ? {
                      ...user,
                      status: user.status === "Активен" ? "Деактивирован" : "Активен",
                    }
                  : user,
              ),
            );
            showToast(
              selectedUser.status === "Активен"
                ? "Пользователь деактивирован"
                : "Пользователь активирован",
            );
          }}
        />
      )}

      {metricModal && (
        <MetricModal
          type={metricModal}
          users={users}
          leads={leads}
          onClose={() => setMetricModal(null)}
          openUser={(id) => {
            setMetricModal(null);
            openUser(id);
          }}
          showToast={showToast}
        />
      )}

      {toast && <div className="toast">✓ {toast}</div>}
    </div>
  );
}

function Overview({
  period,
  setPeriod,
  users,
  leads,
  setMetricModal,
  openUser,
  navigate,
}: {
  period: Period;
  setPeriod: (period: Period) => void;
  users: User[];
  leads: Lead[];
  setMetricModal: (type: string) => void;
  openUser: (id: number) => void;
  navigate: (view: View) => void;
}) {
  const periodData = {
    День: { leads: "19", revenue: "184 200 ₽", conversion: "28,6%", delta: "+12,4%" },
    Неделя: { leads: "86", revenue: "742 800 ₽", conversion: "26,9%", delta: "+8,1%" },
    Месяц: { leads: "208", revenue: "2 881 600 ₽", conversion: "27,4%", delta: "+18,6%" },
  }[period];
  const statusCounts = (["Новый", "В работе", "Успешно", "Отказ"] as LeadStatus[]).map(
    (status) => ({ status, count: leads.filter((lead) => lead.status === status).length }),
  );

  return (
    <>
      <div className="page-title">
        <div>
          <span className="eyebrow">23 июля · четверг</span>
          <h1>Добрый день, Алексей</h1>
          <p>Вот что происходит с лидами и командами прямо сейчас.</p>
        </div>
        <PeriodControl period={period} setPeriod={setPeriod} />
      </div>

      <section className="ai-brief">
        <span className="ai-mark">AI</span>
        <div>
          <strong>Сводка за 30 секунд</strong>
          <p>
            Анна Сидорова лидирует по выручке. 4 лида требуют внимания, а конверсия
            Авито выросла на 6,2%. Пик входящих сегодня ожидается в 16:00.
          </p>
        </div>
        <button onClick={() => navigate("problems")}>Разобрать проблемы →</button>
      </section>

      <div className="kpi-grid">
        <KpiCard
          label="Всего лидов"
          value={periodData.leads}
          meta={`${periodData.delta} к прошлому периоду`}
          accent="#f7c900"
          icon="◫"
          onClick={() => setMetricModal("leads")}
        />
        <KpiCard
          label="Общая сумма"
          value={periodData.revenue}
          meta="Чистыми 2 137 400 ₽"
          accent="#ffb800"
          icon="₽"
          onClick={() => setMetricModal("revenue")}
        />
        <KpiCard
          label="Конверсия"
          value={periodData.conversion}
          meta="+3,8% по источникам"
          accent="#fcd34d"
          icon="%"
          onClick={() => setMetricModal("conversion")}
        />
        <KpiCard
          label="Пользователей"
          value="18"
          meta="13 активны сейчас"
          accent="#eab308"
          icon="◎"
          onClick={() => setMetricModal("users")}
        />
        <KpiCard
          label="Входов сегодня"
          value="42"
          meta="Средняя сессия 2 ч 18 мин"
          accent="#f59e0b"
          icon="↗"
          onClick={() => setMetricModal("sessions")}
        />
        <KpiCard
          label="Проблемные лиды"
          value="4"
          meta="2 требуют реакции сегодня"
          accent="#ff6e91"
          icon="!"
          onClick={() => setMetricModal("problems")}
        />
      </div>

      <div className="dashboard-grid">
        <Panel
          title="Динамика лидов"
          subtitle="По дням · наведение показывает значение"
          action={<button className="text-button" onClick={() => navigate("analytics")}>Подробнее ↗</button>}
          className="span-2"
        >
          <div className="chart-summary">
            <div>
              <strong>208</strong>
              <span>лидов за период</span>
            </div>
            <span className="positive">+18,6%</span>
          </div>
          <BarChart
            values={daily}
            labels={["10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23"]}
          />
        </Panel>

        <Panel title="Распределение по продуктам" subtitle="Количество лидов">
          <div className="distribution">
            <Donut center="208" label="лидов" />
            <div className="legend">
              {productStats.map((item) => (
                <div key={item.name}>
                  <i style={{ background: item.color }} />
                  <span>{item.name}</span>
                  <strong>{item.value}%</strong>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        <Panel
          title="Статусы лидов"
          subtitle="Нажмите, чтобы открыть список"
          action={<button className="text-button" onClick={() => navigate("leads")}>Все лиды →</button>}
          className="span-3"
        >
          <div className="status-grid">
            {statusCounts.map(({ status, count }) => (
              <button key={status} onClick={() => navigate("leads")}>
                <StatusBadge status={status} />
                <strong>{count}</strong>
                <span>лидов</span>
              </button>
            ))}
          </div>
        </Panel>

        <Panel
          title="Топ пользователей"
          subtitle="По заработку за месяц"
          action={<button className="text-button" onClick={() => navigate("users")}>Весь рейтинг →</button>}
          className="span-2"
        >
          <div className="ranking">
            {[...users]
              .sort((a, b) => b.revenue - a.revenue)
              .slice(0, 4)
              .map((user, index) => (
                <button key={user.id} onClick={() => openUser(user.id)}>
                  <span className={`rank rank-${index + 1}`}>{index + 1}</span>
                  <Avatar initials={user.initials} />
                  <span className="rank-name">
                    <strong>{user.name}</strong>
                    <small>{user.team} · {user.leads} лидов</small>
                  </span>
                  <strong>{money(user.revenue)}</strong>
                </button>
              ))}
          </div>
        </Panel>

        <Panel
          title="Сегодня по часам"
          subtitle="Пик: 16:00–17:00"
          action={<span className="live-pill">● LIVE</span>}
        >
          <BarChart
            compact
            values={hourly}
            labels={["09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20"]}
          />
        </Panel>
      </div>
    </>
  );
}

function LeadsView({
  leads,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  onOpen,
  onAdd,
}: {
  leads: Lead[];
  search: string;
  setSearch: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  onOpen: (id: number) => void;
  onAdd: () => void;
}) {
  return (
    <>
      <div className="page-title compact-title">
        <div>
          <span className="eyebrow">База клиентов</span>
          <h1>Лиды</h1>
          <p>Управление всеми заявками, офферами и контактами.</p>
        </div>
        <button className="primary-button" onClick={onAdd}>＋ Добавить лид</button>
      </div>
      <Panel title={`${leads.length} лидов`} subtitle="Нажмите на строку, чтобы открыть полную карточку">
        <div className="toolbar">
          <label className="field-search">
            <span>⌕</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Имя, телефон, Telegram, источник…"
            />
          </label>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option>Все статусы</option>
            <option>Новый</option>
            <option>В работе</option>
            <option>Успешно</option>
            <option>Отказ</option>
          </select>
          <button className="secondary-button">⇩ Экспорт</button>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Клиент</th>
                <th>Источник</th>
                <th>Продукт</th>
                <th>Статус</th>
                <th>Офферы</th>
                <th>Сумма</th>
                <th>Ответственный</th>
                <th>Дата</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} onClick={() => onOpen(lead.id)}>
                  <td>
                    <div className="person-cell">
                      <Avatar initials={lead.initials} />
                      <span>
                        <strong>{lead.client}</strong>
                        <small>{lead.phone}</small>
                      </span>
                      {lead.issue && <i className="warning-dot" title={lead.issue}>!</i>}
                    </div>
                  </td>
                  <td><span className="source-pill">{lead.source}</span></td>
                  <td>{lead.product}</td>
                  <td><StatusBadge status={lead.status} /></td>
                  <td><strong>{lead.offers.length}</strong></td>
                  <td><strong>{lead.amount ? money(lead.amount) : "—"}</strong></td>
                  <td>{lead.manager}</td>
                  <td><span className="muted">{lead.created}</span></td>
                  <td><button className="row-action" aria-label={`Открыть ${lead.client}`}>›</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!leads.length && <div className="empty-state">По выбранным фильтрам лидов нет.</div>}
      </Panel>
    </>
  );
}

function TeamsView({ users, openUser }: { users: User[]; openUser: (id: number) => void }) {
  const teams = [
    { name: "Север", lead: "Анна Сидорова", members: 7, leads: 84, revenue: 928400, conversion: 31.4 },
    { name: "Альфа", lead: "Иван Петров", members: 6, leads: 71, revenue: 786900, conversion: 27.8 },
    { name: "Вектор", lead: "Мария Орлова", members: 5, leads: 53, revenue: 612700, conversion: 25.9 },
  ];
  return (
    <>
      <div className="page-title compact-title">
        <div>
          <span className="eyebrow">Люди и результат</span>
          <h1>Команды</h1>
          <p>Два рейтинга: по заработку и по количеству лидов.</p>
        </div>
        <button className="primary-button">＋ Создать команду</button>
      </div>
      <div className="two-columns">
        <Panel title="Топ пользователей · заработок" subtitle="Текущий месяц">
          <div className="ranking ranking-wide">
            {[...users].sort((a, b) => b.revenue - a.revenue).map((user, index) => (
              <button key={user.id} onClick={() => openUser(user.id)}>
                <span className={`rank rank-${index + 1}`}>{index + 1}</span>
                <Avatar initials={user.initials} />
                <span className="rank-name">
                  <strong>{user.name}</strong><small>{user.team}</small>
                </span>
                <strong>{money(user.revenue)}</strong>
              </button>
            ))}
          </div>
        </Panel>
        <Panel title="Топ пользователей · лиды" subtitle="Текущий месяц">
          <div className="ranking ranking-wide">
            {[...users].sort((a, b) => b.leads - a.leads).map((user, index) => (
              <button key={user.id} onClick={() => openUser(user.id)}>
                <span className={`rank rank-${index + 1}`}>{index + 1}</span>
                <Avatar initials={user.initials} />
                <span className="rank-name">
                  <strong>{user.name}</strong><small>{user.team}</small>
                </span>
                <strong>{user.leads} лидов</strong>
              </button>
            ))}
          </div>
        </Panel>
      </div>
      <Panel title="Результаты команд" subtitle="Сводная эффективность">
        <div className="team-cards">
          {teams.map((team, index) => (
            <article key={team.name} className="team-card">
              <span className="team-number">0{index + 1}</span>
              <div className="team-title">
                <span className="avatar avatar-team">{team.name.slice(0, 1)}</span>
                <div><h3>{team.name}</h3><p>Тимлид: {team.lead}</p></div>
              </div>
              <div className="team-stats">
                <div><span>Выручка</span><strong>{money(team.revenue)}</strong></div>
                <div><span>Лиды</span><strong>{team.leads}</strong></div>
                <div><span>Конверсия</span><strong>{team.conversion}%</strong></div>
                <div><span>Участники</span><strong>{team.members}</strong></div>
              </div>
              <div className="progress"><span style={{ width: `${team.conversion * 2.3}%` }} /></div>
            </article>
          ))}
        </div>
      </Panel>
    </>
  );
}

function UsersView({
  users,
  openUser,
  onInvite,
}: {
  users: User[];
  openUser: (id: number) => void;
  onInvite: () => void;
}) {
  return (
    <>
      <div className="page-title compact-title">
        <div>
          <span className="eyebrow">Доступ и производительность</span>
          <h1>Пользователи</h1>
          <p>Статистика, сессии, роли, команды и ограничения доступа.</p>
        </div>
        <button className="primary-button" onClick={onInvite}>＋ Пригласить</button>
      </div>
      <div className="mini-kpis">
        <div><span>Всего</span><strong>18</strong><small>пользователей</small></div>
        <div><span>Онлайн</span><strong className="lime">13</strong><small>прямо сейчас</small></div>
        <div><span>Входов сегодня</span><strong>42</strong><small>средняя сессия 2:18</small></div>
        <div><span>Деактивированы</span><strong className="pink">1</strong><small>ограничен доступ</small></div>
      </div>
      <Panel title="Список пользователей" subtitle="Нажмите на пользователя, чтобы открыть статистику">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Пользователь</th><th>Роль</th><th>Команда</th><th>Лиды</th>
                <th>Выручка</th><th>Конверсия</th><th>Последний вход</th><th>Статус</th><th />
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} onClick={() => openUser(user.id)}>
                  <td><div className="person-cell"><Avatar initials={user.initials} /><span><strong>{user.name}</strong><small>ID · {String(user.id).padStart(4, "0")}</small></span></div></td>
                  <td><span className="role-pill">{user.role}</span></td>
                  <td>{user.team}</td>
                  <td><strong>{user.leads}</strong></td>
                  <td><strong>{money(user.revenue)}</strong></td>
                  <td>{user.conversion}%</td>
                  <td>{user.lastLogin}</td>
                  <td><span className={`user-state ${user.status === "Активен" ? "is-active" : ""}`}>● {user.status}</span></td>
                  <td><button className="row-action">›</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}

function ProblemsView({
  leads,
  filter,
  setFilter,
  onOpen,
}: {
  leads: Lead[];
  filter: string;
  setFilter: (value: string) => void;
  onOpen: (id: number) => void;
}) {
  const categories = [
    { name: "Все проблемы", count: 4, color: "#ff6e91" },
    { name: "Нет контакта", count: 1, color: "#ffb35c" },
    { name: "Нет суммы", count: 1, color: "#46d9ff" },
    { name: "Низкое качество", count: 1, color: "#a78bfa" },
    { name: "Застрял", count: 1, color: "#bdff38" },
  ];
  return (
    <>
      <div className="page-title compact-title">
        <div>
          <span className="eyebrow">Контроль качества</span>
          <h1>Проблемные лиды</h1>
          <p>Лиды, которым нужна реакция менеджера или администратора.</p>
        </div>
        <button className="secondary-button">⟳ Обновить</button>
      </div>
      <div className="problem-categories">
        {categories.map((category) => (
          <button
            className={filter === category.name ? "active" : ""}
            onClick={() => setFilter(category.name)}
            key={category.name}
          >
            <span style={{ color: category.color }}>●</span>
            <strong>{category.count}</strong>
            <small>{category.name}</small>
          </button>
        ))}
      </div>
      <div className="problems-layout">
        <Panel title={`Требуют внимания · ${leads.length}`} subtitle="Проблема, источник и ответственный">
          <div className="problem-list">
            {leads.map((lead) => (
              <button key={lead.id} onClick={() => onOpen(lead.id)}>
                <Avatar initials={lead.initials} />
                <span className="problem-main">
                  <strong>{lead.client}</strong>
                  <small>{lead.source} · {lead.product} · {lead.manager}</small>
                  <span>{lead.issue}</span>
                </span>
                <span className="ai-score">AI {lead.ai}</span>
                <span className="row-action">›</span>
              </button>
            ))}
          </div>
        </Panel>
        <div className="side-stack">
          <Panel title="Быстрые рекомендации" subtitle="С чего начать">
            <ul className="recommendations">
              <li><span>01</span><p><strong>Связаться с Александром</strong>Нет контакта более 45 минут · Яндекс</p></li>
              <li><span>02</span><p><strong>Уточнить сумму у Ольги</strong>Сделка не может перейти в работу · Telegram</p></li>
              <li><span>03</span><p><strong>Проверить документы Павла</strong>Статус не менялся 19 часов · Реферал</p></li>
            </ul>
          </Panel>
          <Panel title="По источникам" subtitle="Доля проблемных лидов">
            <div className="source-problems">
              <div><span>Авито</span><div><i style={{ width: "25%" }} /></div><strong>1</strong></div>
              <div><span>Яндекс</span><div><i style={{ width: "25%" }} /></div><strong>1</strong></div>
              <div><span>Telegram</span><div><i style={{ width: "25%" }} /></div><strong>1</strong></div>
              <div><span>Реферал</span><div><i style={{ width: "25%" }} /></div><strong>1</strong></div>
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}

function AnalyticsView({
  period,
  setPeriod,
  users,
  openUser,
}: {
  period: Period;
  setPeriod: (period: Period) => void;
  users: User[];
  openUser: (id: number) => void;
}) {
  return (
    <>
      <div className="page-title compact-title">
        <div>
          <span className="eyebrow">Глубокая статистика</span>
          <h1>Аналитика</h1>
          <p>Источники, конверсия, продукты, команды и динамика.</p>
        </div>
        <div className="title-actions"><PeriodControl period={period} setPeriod={setPeriod} /><button className="secondary-button">⇩ Отчёт</button></div>
      </div>
      <div className="mini-kpis">
        <div><span>Лиды</span><strong>208</strong><small className="positive">+18,6%</small></div>
        <div><span>Оборот</span><strong>2,88 млн ₽</strong><small className="positive">+12,1%</small></div>
        <div><span>Конверсия</span><strong>27,4%</strong><small className="positive">+3,8%</small></div>
        <div><span>Чистыми</span><strong>2,14 млн ₽</strong><small>−744,2 тыс. затрат</small></div>
      </div>
      <div className="dashboard-grid">
        <Panel title="Динамика по дням" subtitle="Новые и успешные лиды" className="span-2">
          <div className="chart-summary"><div><strong>208</strong><span>всего лидов</span></div><span className="positive">+18,6%</span></div>
          <BarChart values={daily} labels={["10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23"]} />
        </Panel>
        <Panel title="По часам" subtitle="Средний день">
          <BarChart compact values={hourly} labels={["09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20"]} />
        </Panel>
        <Panel title="Конверсия по источникам" subtitle="Сумма и результат" className="span-2">
          <div className="source-table">
            {sourceStats.map((source) => (
              <div key={source.name}>
                <i style={{ background: source.color }} />
                <span><strong>{source.name}</strong><small>{source.leads} лидов</small></span>
                <div className="progress"><span style={{ width: `${source.conversion * 2.4}%`, background: source.color }} /></div>
                <strong>{source.conversion}%</strong>
                <strong>{money(source.revenue)}</strong>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Продукты" subtitle="Доля от общего объёма">
          <div className="distribution vertical">
            <Donut center="6" label="категорий" />
            <div className="legend">
              {productStats.map((item) => <div key={item.name}><i style={{ background: item.color }} /><span>{item.name}</span><strong>{item.value}%</strong></div>)}
            </div>
          </div>
        </Panel>
        <Panel title="Топ по конверсии" subtitle="Пользователи" className="span-3">
          <div className="leader-grid">
            {[...users].sort((a, b) => b.conversion - a.conversion).slice(0, 3).map((user, index) => (
              <button key={user.id} onClick={() => openUser(user.id)}>
                <span className="position">0{index + 1}</span><Avatar initials={user.initials} large />
                <span><strong>{user.name}</strong><small>{user.team} · {user.topOffer}</small></span>
                <b>{user.conversion}%</b>
              </button>
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}

function OffersView({ setMetricModal }: { setMetricModal: (type: string) => void }) {
  const categories = [
    { name: "РКО", count: 12, avg: 28600, color: "#bdff38" },
    { name: "Дебет", count: 18, avg: 7900, color: "#46d9ff" },
    { name: "Кредит", count: 9, avg: 12800, color: "#a78bfa" },
    { name: "Регбиз", count: 7, avg: 16400, color: "#ffb35c" },
    { name: "МФО", count: 14, avg: 6200, color: "#ff6e91" },
    { name: "HR", count: 6, avg: 24500, color: "#5eead4" },
  ];
  const catalog = [
    { bank: "ВТБ", category: "Дебет", offer: "Карта для жизни", payout: 6800, cd: 900, net: 5900, status: "Активен" },
    { bank: "Газпромбанк", category: "Дебет", offer: "Умная карта", payout: 7200, cd: 1100, net: 6100, status: "Активен" },
    { bank: "ОТП Банк", category: "Дебет", offer: "ОТП Карта", payout: 4600, cd: 700, net: 3900, status: "Активен" },
    { bank: "Т-Банк", category: "РКО", offer: "РКО для ИП", payout: 38500, cd: 2400, net: 36100, status: "Активен" },
    { bank: "Точка", category: "Регбиз", offer: "Регистрация ИП", payout: 14800, cd: 500, net: 14300, status: "Пауза" },
  ];
  return (
    <>
      <div className="page-title compact-title">
        <div><span className="eyebrow">Каталог и экономика</span><h1>Офферы</h1><p>Выплата, стоимость ЦД, чистый доход и этапы работы.</p></div>
        <button className="primary-button" onClick={() => setMetricModal("offer")}>＋ Новый оффер</button>
      </div>
      <div className="offer-categories">
        {categories.map((category) => (
          <article key={category.name} style={{ "--category-color": category.color } as React.CSSProperties}>
            <span>{category.name}</span><strong>{category.count}</strong><small>Средняя выплата</small><b>{money(category.avg)}</b>
          </article>
        ))}
      </div>
      <Panel title="Каталог офферов" subtitle="Исходные настройки выплат и ЦД">
        <div className="table-scroll">
          <table>
            <thead><tr><th>Банк / партнёр</th><th>Категория</th><th>Оффер</th><th>Выплата</th><th>Затраты на ЦД</th><th>Чистыми</th><th>Статус</th><th /></tr></thead>
            <tbody>{catalog.map((item) => (
              <tr key={`${item.bank}-${item.offer}`}>
                <td><strong>{item.bank}</strong></td><td><span className="source-pill">{item.category}</span></td><td>{item.offer}</td>
                <td><strong>{money(item.payout)}</strong></td><td className="pink">{money(item.cd)}</td><td className="lime"><strong>{money(item.net)}</strong></td>
                <td><span className={`user-state ${item.status === "Активен" ? "is-active" : ""}`}>● {item.status}</span></td><td><button className="row-action">⋯</button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}

function PartnerView({ setMetricModal }: { setMetricModal: (type: string) => void }) {
  return (
    <>
      <div className="partner-hero">
        <div><span className="eyebrow">M&K PARTNERS</span><h1>Привет, Сергей!</h1><p>У тебя 24 активных лида и новый уровень уже близко.</p></div>
        <div className="partner-balance"><span>Доступно к выводу</span><strong>86 420 ₽</strong><button onClick={() => setMetricModal("withdraw")}>Заказать выплату</button></div>
      </div>
      <div className="partner-grid">
        <Panel title="Ваш статус" subtitle="Silver · до Gold осталось 12 лидов" className="partner-rank-panel">
          <div className="rank-ladder">
            {["Bronze", "Silver", "Gold", "Platinum"].map((rank, index) => <div className={index <= 1 ? "done" : ""} key={rank}><span>{index < 2 ? "✓" : index + 1}</span><strong>{rank}</strong><small>{[0, 30, 100, 250][index]} лидов</small></div>)}
          </div>
          <div className="progress"><span style={{ width: "62%" }} /></div>
          <p className="rank-hint">На Gold откроются повышенные выплаты и приоритетная поддержка.</p>
        </Panel>
        <Panel title="Ваша статистика" subtitle="Текущий месяц">
          <div className="partner-stats"><div><span>Лиды</span><strong>24</strong></div><div><span>Успешно</span><strong>9</strong></div><div><span>Конверсия</span><strong>37,5%</strong></div><div><span>Заработано</span><strong>118 600 ₽</strong></div></div>
        </Panel>
        <Panel title="Топ офферов" subtitle="Лучшие условия для вас" className="span-2">
          <div className="partner-offers">
            {[
              ["Т-Банк · РКО", "до 42 000 ₽", "Повышенная выплата"],
              ["ВТБ · Дебет", "до 7 600 ₽", "Быстрое подтверждение"],
              ["Газпромбанк · Дебет", "до 7 200 ₽", "Популярный оффер"],
            ].map((offer) => <button key={offer[0]}><span><strong>{offer[0]}</strong><small>{offer[2]}</small></span><b>{offer[1]}</b><i>Получить ссылку →</i></button>)}
          </div>
        </Panel>
        <Panel title="Объём лидов" subtitle="Динамика за 14 дней">
          <BarChart compact values={daily} labels={["10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23"]} />
        </Panel>
      </div>
    </>
  );
}

function AccessView({
  users,
  onUser,
  onNewKey,
}: {
  users: User[];
  onUser: (id: number) => void;
  onNewKey: () => void;
}) {
  return (
    <>
      <div className="page-title compact-title">
        <div><span className="eyebrow">Безопасность</span><h1>Доступы и сессии</h1><p>Ключи регистрации, время использования и журнал входов.</p></div>
        <button className="primary-button" onClick={onNewKey}>＋ Создать ключ</button>
      </div>
      <div className="two-columns">
        <Panel title="Ключи доступа" subtitle="Для регистрации новых участников">
          <div className="access-keys">
            {[
              ["MK-TEAM-2026", "Менеджер", "12 / 25", "31.08.2026"],
              ["LEAD-SILVER", "Лидогенератор", "4 / 20", "15.08.2026"],
              ["ADMIN-ONE", "Администратор", "1 / 2", "01.09.2026"],
            ].map((key) => <div key={key[0]}><code>{key[0]}</code><span><strong>{key[1]}</strong><small>Использовано {key[2]} · до {key[3]}</small></span><button>Копировать</button></div>)}
          </div>
        </Panel>
        <Panel title="Правила использования" subtitle="Ограничения по времени">
          <div className="policy">
            <label><span><strong>Рабочие часы</strong><small>Доступ с 08:00 до 23:00</small></span><input type="checkbox" defaultChecked /></label>
            <label><span><strong>Автовыход</strong><small>После 45 минут бездействия</small></span><input type="checkbox" defaultChecked /></label>
            <label><span><strong>Доступ в выходные</strong><small>Для менеджеров и лидогенераторов</small></span><input type="checkbox" /></label>
            <button className="secondary-button">Редактировать условия</button>
          </div>
        </Panel>
      </div>
      <Panel title="Входы сегодня" subtitle="Время входа и продолжительность посещения">
        <div className="table-scroll">
          <table>
            <thead><tr><th>Пользователь</th><th>Вход</th><th>Продолжительность</th><th>Устройство</th><th>IP</th><th>Статус</th><th /></tr></thead>
            <tbody>{users.filter((user) => user.lastLogin.startsWith("Сегодня")).map((user) => (
              <tr key={user.id} onClick={() => onUser(user.id)}><td><div className="person-cell"><Avatar initials={user.initials} /><strong>{user.name}</strong></div></td><td>{user.lastLogin.replace("Сегодня, ", "")}</td><td>{user.session}</td><td>Chrome · Windows</td><td>95.31.•••.24</td><td><span className="user-state is-active">● Онлайн</span></td><td><button className="row-action">›</button></td></tr>
            ))}</tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}

function IntegrationsView({
  connected,
  setConnected,
  showToast,
}: {
  connected: string[];
  setConnected: (value: string[]) => void;
  showToast: (message: string) => void;
}) {
  const integrations = [
    ["Telegram-бот", "Новые лиды и уведомления", "TG"],
    ["Avito", "Автоматический импорт заявок", "AV"],
    ["Яндекс Метрика", "Источники и рекламные кампании", "YM"],
    ["Google Sheets", "Импорт и резервные выгрузки", "GS"],
    ["Телефония", "Звонки, записи и длительность", "PH"],
    ["Партнёрские API", "Статусы офферов и выплаты", "API"],
  ];
  return (
    <>
      <div className="page-title compact-title">
        <div><span className="eyebrow">Автозагрузка данных</span><h1>Интеграции</h1><p>Подключите источники, чтобы лиды и статусы обновлялись автоматически.</p></div>
        <button className="secondary-button">Документация API ↗</button>
      </div>
      <div className="integration-grid">
        {integrations.map(([name, description, mark]) => {
          const isConnected = connected.includes(name);
          return (
            <article key={name}>
              <span className="integration-mark">{mark}</span>
              <div><h3>{name}</h3><p>{description}</p></div>
              <span className={`integration-state ${isConnected ? "connected" : ""}`}>● {isConnected ? "Подключено" : "Не подключено"}</span>
              <button
                className={isConnected ? "secondary-button" : "primary-button"}
                onClick={() => {
                  setConnected(isConnected ? connected.filter((item) => item !== name) : [...connected, name]);
                  showToast(isConnected ? `${name}: подключение приостановлено` : `${name}: тестовое подключение создано`);
                }}
              >
                {isConnected ? "Настроить" : "Подключить"}
              </button>
            </article>
          );
        })}
      </div>
      <Panel title="Журнал синхронизации" subtitle="Последние автоматические обновления">
        <div className="sync-log">
          <div><span className="success-mark">✓</span><p><strong>Telegram-бот</strong><small>Получено 4 новых лида</small></p><time>12:56</time></div>
          <div><span className="success-mark">✓</span><p><strong>Статусы офферов</strong><small>Обновлено 18 записей</small></p><time>12:40</time></div>
          <div><span className="pending-mark">↻</span><p><strong>Выплаты партнёров</strong><small>Следующая синхронизация через 8 минут</small></p><time>12:32</time></div>
        </div>
      </Panel>
    </>
  );
}

function SettingsView({ showToast }: { showToast: (message: string) => void }) {
  return (
    <>
      <div className="page-title compact-title">
        <div><span className="eyebrow">Система</span><h1>Настройки</h1><p>Профиль компании, справочники, уведомления и безопасность.</p></div>
      </div>
      <div className="settings-grid">
        <Panel title="Профиль компании" subtitle="Основные данные">
          <div className="form-grid">
            <label><span>Название</span><input defaultValue="Платформа M&K" /></label>
            <label><span>Часовой пояс</span><select defaultValue="Екатеринбург"><option>Екатеринбург</option><option>Москва</option></select></label>
            <label className="full"><span>Email администратора</span><input defaultValue="admin@m8.team" /></label>
            <button className="primary-button" onClick={() => showToast("Настройки компании сохранены")}>Сохранить</button>
          </div>
        </Panel>
        <Panel title="Статусы лидов" subtitle="Базовая воронка">
          <div className="settings-statuses">
            {(["Новый", "В работе", "Успешно", "Отказ"] as LeadStatus[]).map((status) => <div key={status}><StatusBadge status={status} /><span>{{
              "Новый": "Только поступил, ещё не обрабатывали",
              "В работе": "Менеджер уже работает с лидом",
              "Успешно": "ЦД выполнено или получена выплата",
              "Отказ": "Клиент отказался или потерян",
            }[status]}</span><button>⋯</button></div>)}
          </div>
        </Panel>
        <Panel title="Уведомления" subtitle="Какие события отслеживать">
          <div className="policy">
            <label><span><strong>Новый проблемный лид</strong><small>Telegram и внутри CRM</small></span><input type="checkbox" defaultChecked /></label>
            <label><span><strong>Изменение выплаты</strong><small>Только администраторам</small></span><input type="checkbox" defaultChecked /></label>
            <label><span><strong>Долгое отсутствие активности</strong><small>После 12 часов без изменений</small></span><input type="checkbox" defaultChecked /></label>
          </div>
        </Panel>
        <Panel title="Вход и регистрация" subtitle="Для новых пользователей">
          <div className="auth-preview">
            <div className="auth-tabs"><span className="active">Вход</span><span>Регистрация</span></div>
            <input placeholder="Логин или Telegram" /><input placeholder="Пароль" type="password" /><select defaultValue=""><option value="" disabled>Выберите команду</option><option>Север</option><option>Альфа</option><option>Вектор</option></select>
            <button className="primary-button">Продолжить</button><small>Регистрация доступна по 8-значному коду</small>
          </div>
        </Panel>
      </div>
    </>
  );
}

function LeadDrawer({
  lead,
  editing,
  setEditing,
  updateLead,
  onClose,
  onSave,
}: {
  lead: Lead;
  editing: boolean;
  setEditing: (value: boolean) => void;
  updateLead: (field: keyof Lead, value: string | number) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const costs = lead.offers.reduce((sum, offer) => sum + offer.cdCost, 0);
  const payouts = lead.offers.reduce((sum, offer) => sum + offer.payout, 0);
  return (
    <div className="drawer-layer">
      <button className="drawer-scrim" onClick={onClose} aria-label="Закрыть карточку" />
      <aside className="drawer">
        <div className="drawer-head">
          <button className="close-button" onClick={onClose}>×</button>
          <Avatar initials={lead.initials} large />
          <div><span>Лид #{lead.id}</span><h2>{lead.client}</h2><p>{lead.source} · {lead.created}</p></div>
          <div className="drawer-actions">
            {editing ? <button className="primary-button" onClick={onSave}>Сохранить</button> : <button className="secondary-button" onClick={() => setEditing(true)}>✎ Редактировать</button>}
          </div>
        </div>

        {lead.issue && <div className="issue-banner"><span>!</span><div><strong>{lead.issue}</strong><p>Лид отмечен как проблемный. Ответственный: {lead.manager}</p></div></div>}

        <div className="drawer-section">
          <div className="section-title"><h3>Данные о лиде</h3><span className="ai-score">AI {lead.ai}/100</span></div>
          <div className="contact-grid">
            <a href={`tel:${lead.phone}`}><span>Телефон</span><strong>{lead.phone}</strong></a>
            <a href="#"><span>Telegram</span><strong>{lead.telegram}</strong></a>
            <a href="#"><span>WhatsApp</span><strong>{lead.whatsapp}</strong></a>
            <div><span>Команда</span><strong>{lead.team}</strong></div>
          </div>
          <p className="lead-description">{lead.description}</p>
        </div>

        <div className="drawer-section">
          <div className="section-title"><h3>Управление</h3><StatusBadge status={lead.status} /></div>
          <div className="edit-grid">
            <label><span>Источник</span>{editing ? <select value={lead.source} onChange={(event) => updateLead("source", event.target.value)}><option>Авито</option><option>Яндекс</option><option>Telegram</option><option>Сайт</option><option>Реферал</option><option>Холодный звонок</option></select> : <strong>{lead.source}</strong>}</label>
            <label><span>Продукт</span>{editing ? <select value={lead.product} onChange={(event) => updateLead("product", event.target.value)}><option>РКО</option><option>Дебет</option><option>Кредит</option><option>Регбиз</option><option>МФО</option><option>HR</option><option>Инвестиции</option></select> : <strong>{lead.product}</strong>}</label>
            <label><span>Статус</span>{editing ? <select value={lead.status} onChange={(event) => updateLead("status", event.target.value)}><option>Новый</option><option>В работе</option><option>Успешно</option><option>Отказ</option></select> : <strong>{lead.status}</strong>}</label>
            <label><span>Сумма</span>{editing ? <input type="number" value={lead.amount} onChange={(event) => updateLead("amount", Number(event.target.value))} /> : <strong>{money(lead.amount)}</strong>}</label>
          </div>
        </div>

        <div className="drawer-section">
          <div className="section-title"><h3>Офферы · {lead.offers.length}</h3><button className="text-button">＋ Добавить оффер</button></div>
          <div className="offer-list">
            {lead.offers.map((offer, index) => (
              <article key={`${offer.bank}-${index}`}>
                <div className="offer-top"><span className="offer-index">0{index + 1}</span><div><strong>{offer.bank}</strong><p>{offer.product}</p></div><span className="stage-pill">{offer.stage}</span></div>
                <div className="offer-meta"><div><span>Выплата</span><strong>{money(offer.payout)}</strong></div><div><span>Затраты ЦД</span><strong className="pink">−{money(offer.cdCost)}</strong></div><div><span>Чистыми</span><strong className="lime">{money(offer.payout - offer.cdCost)}</strong></div></div>
                <p className="delivery">◷ {offer.delivery}</p>
              </article>
            ))}
            {!lead.offers.length && <div className="empty-state">Офферы ещё не добавлены.</div>}
          </div>
          {!!lead.offers.length && <div className="finance-total"><span>Итого по клиенту</span><div><small>Начислено</small><strong>{money(payouts)}</strong></div><div><small>Затраты</small><strong className="pink">−{money(costs)}</strong></div><div><small>Чистыми</small><strong className="lime">{money(payouts - costs)}</strong></div></div>}
        </div>

        <div className="drawer-section">
          <div className="section-title"><h3>Комментарии и история</h3></div>
          <div className="comment-box"><textarea placeholder="Добавить комментарий…" /><button>Отправить</button></div>
          <div className="timeline">
            <div><i /><span><strong>Статус изменён на «{lead.status}»</strong><small>Сегодня, 12:48 · {lead.manager}</small></span></div>
            <div><i /><span><strong>Данные лида обновлены</strong><small>Сегодня, 11:52 · система</small></span></div>
            <div><i /><span><strong>Лид создан из источника «{lead.source}»</strong><small>{lead.created}</small></span></div>
          </div>
        </div>
      </aside>
    </div>
  );
}

function UserDrawer({
  user,
  leads,
  onLead,
  onClose,
  onToggle,
}: {
  user: User;
  leads: Lead[];
  onLead: (id: number) => void;
  onClose: () => void;
  onToggle: () => void;
}) {
  return (
    <div className="drawer-layer">
      <button className="drawer-scrim" onClick={onClose} aria-label="Закрыть профиль" />
      <aside className="drawer user-drawer">
        <div className="drawer-head">
          <button className="close-button" onClick={onClose}>×</button><Avatar initials={user.initials} large />
          <div><span>{user.role} · команда {user.team}</span><h2>{user.name}</h2><p><span className={`user-state ${user.status === "Активен" ? "is-active" : ""}`}>● {user.status}</span></p></div>
          <button className="secondary-button" onClick={onToggle}>{user.status === "Активен" ? "Деактивировать" : "Активировать"}</button>
        </div>
        <div className="user-hero-stats">
          <div><span>Выручка</span><strong>{money(user.revenue)}</strong><small className="positive">+14,8%</small></div>
          <div><span>Лиды</span><strong>{user.leads}</strong><small>за месяц</small></div>
          <div><span>Конверсия</span><strong>{user.conversion}%</strong><small>топ 24%</small></div>
          <div><span>Топ оффер</span><strong>{user.topOffer}</strong><small>по доходу</small></div>
        </div>
        <div className="drawer-section">
          <div className="section-title"><h3>Активность</h3><span className="live-pill">● онлайн</span></div>
          <div className="session-grid"><div><span>Последний вход</span><strong>{user.lastLogin}</strong></div><div><span>Текущая сессия</span><strong>{user.session}</strong></div><div><span>Среднее в день</span><strong>3 ч 14 мин</strong></div><div><span>Входов за месяц</span><strong>86</strong></div></div>
          <BarChart compact values={[32, 47, 59, 42, 68, 76, 61]} labels={["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]} />
        </div>
        <div className="drawer-section">
          <div className="section-title"><h3>Лиды пользователя</h3><span>{leads.length} в текущей выборке</span></div>
          <div className="user-leads">
            {leads.map((lead) => <button key={lead.id} onClick={() => onLead(lead.id)}><Avatar initials={lead.initials} /><span><strong>{lead.client}</strong><small>{lead.product} · {lead.source}</small></span><StatusBadge status={lead.status} /><b>{money(lead.amount)}</b><i>›</i></button>)}
            {!leads.length && <div className="empty-state">Нет лидов в демо-выборке.</div>}
          </div>
        </div>
        <div className="drawer-section">
          <div className="section-title"><h3>Условия доступа</h3><button className="text-button">Редактировать</button></div>
          <div className="access-summary"><div><span>Роль</span><strong>{user.role}</strong></div><div><span>Рабочее время</span><strong>08:00–23:00</strong></div><div><span>Действует до</span><strong>Без ограничения</strong></div></div>
        </div>
      </aside>
    </div>
  );
}

function MetricModal({
  type,
  users,
  leads,
  onClose,
  openUser,
  showToast,
}: {
  type: string;
  users: User[];
  leads: Lead[];
  onClose: () => void;
  openUser: (id: number) => void;
  showToast: (message: string) => void;
}) {
  const titles: Record<string, [string, string]> = {
    leads: ["Кто принёс лиды", "Рейтинг по количеству за месяц"],
    revenue: ["Откуда приходит выручка", "Сумма по каждому источнику"],
    conversion: ["Конверсия по источникам", "Подробная эффективность каналов"],
    users: ["Пользователи", "Нажмите, чтобы открыть личную статистику"],
    sessions: ["Входы сегодня", "Время входа и продолжительность сессии"],
    problems: ["Проблемные лиды", "Причина и ответственный пользователь"],
    invite: ["Пригласить пользователя", "Роль, команда и срок доступа"],
    key: ["Новый ключ доступа", "Создайте код для регистрации"],
    offer: ["Новый оффер", "Категория, выплата и стоимость ЦД"],
    withdraw: ["Заказать выплату", "Доступно 86 420 ₽"],
  };
  const [title, subtitle] = titles[type] ?? ["Действие", "Заполните данные"];
  const simpleForm = ["invite", "key", "offer", "withdraw"].includes(type);
  return (
    <div className="modal-layer">
      <button className="modal-scrim" onClick={onClose} aria-label="Закрыть окно" />
      <div className="modal">
        <div className="modal-head"><div><h2>{title}</h2><p>{subtitle}</p></div><button onClick={onClose}>×</button></div>
        {type === "leads" && <div className="metric-list">{[...users].sort((a, b) => b.leads - a.leads).map((user, index) => <button key={user.id} onClick={() => openUser(user.id)}><span className="rank">{index + 1}</span><Avatar initials={user.initials} /><span><strong>{user.name}</strong><small>{user.team}</small></span><b>{user.leads} лидов</b><i>›</i></button>)}</div>}
        {type === "revenue" && <div className="metric-list sources">{sourceStats.map((source, index) => <div key={source.name}><span className="rank">{index + 1}</span><i style={{ background: source.color }} /><span><strong>{source.name}</strong><small>{source.leads} лидов</small></span><b>{money(source.revenue)}</b></div>)}</div>}
        {type === "conversion" && <div className="metric-list sources">{sourceStats.sort((a, b) => b.conversion - a.conversion).map((source, index) => <div key={source.name}><span className="rank">{index + 1}</span><i style={{ background: source.color }} /><span><strong>{source.name}</strong><small>{source.leads} лидов</small></span><div className="progress"><span style={{ width: `${source.conversion * 2.5}%`, background: source.color }} /></div><b>{source.conversion}%</b></div>)}</div>}
        {type === "users" && <div className="metric-list">{users.map((user) => <button key={user.id} onClick={() => openUser(user.id)}><Avatar initials={user.initials} /><span><strong>{user.name}</strong><small>{user.role} · {user.team}</small></span><span className={`user-state ${user.status === "Активен" ? "is-active" : ""}`}>● {user.status}</span><i>›</i></button>)}</div>}
        {type === "sessions" && <div className="metric-list">{users.filter((user) => user.lastLogin.startsWith("Сегодня")).map((user) => <button key={user.id} onClick={() => openUser(user.id)}><Avatar initials={user.initials} /><span><strong>{user.name}</strong><small>Вход: {user.lastLogin.replace("Сегодня, ", "")}</small></span><b>{user.session}</b><i>›</i></button>)}</div>}
        {type === "problems" && <div className="metric-list">{leads.filter((lead) => lead.issue).map((lead) => <div key={lead.id}><Avatar initials={lead.initials} /><span><strong>{lead.client}</strong><small>{lead.issue} · {lead.manager}</small></span><StatusBadge status={lead.status} /></div>)}</div>}
        {simpleForm && (
          <div className="modal-form">
            {type === "invite" && <><label><span>Имя пользователя</span><input placeholder="Иван Иванов" /></label><label><span>Роль</span><select><option>Менеджер</option><option>Тимлид</option><option>Лидогенератор</option><option>Администратор</option></select></label><label><span>Команда</span><select><option>Север</option><option>Альфа</option><option>Вектор</option></select></label></>}
            {type === "key" && <><label><span>Роль</span><select><option>Менеджер</option><option>Лидогенератор</option><option>Администратор</option></select></label><label><span>Максимум использований</span><input type="number" defaultValue="20" /></label><label><span>Действует до</span><input type="date" /></label></>}
            {type === "offer" && <><label><span>Категория</span><select><option>РКО</option><option>Дебет</option><option>Кредит</option><option>Регбиз</option><option>МФО</option><option>HR</option></select></label><label><span>Название / банк</span><input placeholder="Например, ВТБ" /></label><label><span>Выплата</span><input type="number" placeholder="6800" /></label><label><span>Стоимость ЦД</span><input type="number" placeholder="900" /></label></>}
            {type === "withdraw" && <><label><span>Сумма</span><input type="number" defaultValue="86420" /></label><label><span>Способ выплаты</span><select><option>СБП</option><option>Банковская карта</option><option>Расчётный счёт</option></select></label><label><span>Реквизиты</span><input placeholder="+7 ••• •••-••-••" /></label></>}
            <button className="primary-button" onClick={() => { onClose(); showToast("Действие сохранено в демо-режиме"); }}>Сохранить</button>
          </div>
        )}
      </div>
    </div>
  );
}
