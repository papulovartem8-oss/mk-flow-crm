"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type View =
  | "overview"
  | "leads"
  | "teams"
  | "users"
  | "problems"
  | "analytics"
  | "structure"
  | "offers"
  | "partner"
  | "access"
  | "integrations"
  | "settings"
  | "reports"
  | "mini-app"
  | "info"
  | "media"
  | "rko-stats"
  | "media-stats"
  | "accounting";

type UserRole = "influencer" | "leader" | "partner" | "admin" | "owner";

type AuthState =
  | { status: "checking" }
  | { status: "anonymous" }
  | { status: "authenticated"; role: UserRole; label: string };

type NavGroup = {
  label: string;
  roles: UserRole[];
  items: { id: View; label: string; icon: string }[];
};

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
  createdAt?: string;
  description: string;
  issue?: "Нет контакта" | "Нет суммы" | "Низкое качество" | "Застрял";
  ai: number;
  offers: OfferItem[];
  persisted?: boolean;
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
  lastLoginAt?: string;
  sessionSeconds?: number;
  isOnline?: boolean;
};

type SessionRecord = {
  id: number;
  userId: number;
  signedInAt: string;
  signedOutAt: string | null;
  durationSeconds: number;
  ipAddress: string | null;
  userAgent: string | null;
};

type BootstrapPayload = {
  teams?: Array<{ id: number; name: string }>;
  users?: Array<{
    id: number;
    name: string;
    email: string;
    role: string;
    teamId: number | null;
    status: string;
  }>;
  leads?: Array<{
    id: number;
    clientName: string;
    phone: string | null;
    telegram: string | null;
    whatsapp: string | null;
    description: string;
    source: string;
    product: string;
    status: string;
    amount: number;
    managerId: number | null;
    teamId: number | null;
    issueType: string | null;
    aiScore: number | null;
    createdAt: string;
  }>;
  offers?: Array<{
    id: number;
    category: string;
    partnerName: string;
    title: string;
    payout: number;
    targetActionCost: number;
  }>;
  leadOffers?: Array<{
    id: number;
    leadId: number;
    offerId: number | null;
    stage: string;
    payout: number;
    targetActionCost: number;
    deliveryAt: string | null;
    deliveryNote: string | null;
  }>;
  sessions?: SessionRecord[];
};

type TeamReport = {
  id: number;
  teamLead: string;
  team: string;
  period: string;
  completedTasks: string;
  currentState: string;
  blockers: string;
  nextSteps: string;
  completionPercent: number;
  status: string;
  createdAt: string;
};

const money = (value: number) =>
  new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(value);

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Основное",
    roles: ["influencer", "leader", "partner", "admin", "owner"],
    items: [
      { id: "overview", label: "Дашборд", icon: "⌂" },
      { id: "offers", label: "Офферы", icon: "◆" },
      { id: "leads", label: "Лидогенерация", icon: "◫" },
      { id: "analytics", label: "Инсайды", icon: "↗" },
      { id: "mini-app", label: "Mini App", icon: "◉" },
      { id: "info", label: "Инфораздел", icon: "i" },
    ],
  },
  {
    label: "Premium Private",
    roles: ["influencer", "leader", "partner", "admin", "owner"],
    items: [
      { id: "teams", label: "Команда", icon: "♟" },
      { id: "media", label: "Медиа", icon: "▶" },
    ],
  },
  {
    label: "Admin Panel",
    roles: ["admin", "owner"],
    items: [
      { id: "access", label: "Админка", icon: "⌘" },
      { id: "rko-stats", label: "Статистика РКО", icon: "₽" },
      { id: "media-stats", label: "Статистика медиа", icon: "▥" },
      { id: "accounting", label: "Бухгалтерский учёт", icon: "▤" },
    ],
  },
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

const INITIAL_REPORTS: TeamReport[] = [
  {
    id: -1,
    teamLead: "Анна Сидорова",
    team: "Север",
    period: "20–23 июля",
    completedTasks:
      "Перераспределили входящие лиды; закрыли 9 целевых действий; проверили статусы доставок ВТБ и Газпромбанка",
    currentState:
      "Команда держит темп. В работе 18 лидов, четыре клиента ожидают курьера, две выплаты подтверждаются.",
    blockers: "По двум заявкам ВТБ нет подтверждения доставки.",
    nextSteps: "Закрыть доставки до пятницы и проверить повторный контакт по отказам.",
    completionPercent: 82,
    status: "По плану",
    createdAt: "2026-07-23T12:40:00.000Z",
  },
  {
    id: -2,
    teamLead: "Иван Петров",
    team: "Альфа",
    period: "20–23 июля",
    completedTasks:
      "Обработали 31 заявку; передали 12 РКО-офферов; выполнили 6 ЦД",
    currentState:
      "Основной поток идёт из Яндекса. Конверсия выросла, но часть клиентов задерживается на этапе согласования.",
    blockers: "Три лида без контакта более 12 часов.",
    nextSteps: "Повторный контакт, перераспределение очереди и сверка выплат.",
    completionPercent: 68,
    status: "Есть риски",
    createdAt: "2026-07-23T11:15:00.000Z",
  },
  {
    id: -3,
    teamLead: "Мария Орлова",
    team: "Вектор",
    period: "20–23 июля",
    completedTasks:
      "Запустили новый источник; подготовили скрипт по РКО; закрыли 4 выплаты",
    currentState:
      "Новый источник даёт стабильный поток. Команда переключает часть менеджеров на дебетовые продукты.",
    blockers: "",
    nextSteps: "Собрать статистику по первому циклу и масштабировать связку.",
    completionPercent: 91,
    status: "По плану",
    createdAt: "2026-07-23T09:30:00.000Z",
  },
];

const daily = [38, 52, 44, 61, 78, 70, 86, 72, 94, 88, 102, 118, 109, 126];
const hourly = [20, 38, 54, 47, 72, 83, 64, 92, 78, 58, 34, 18];

const SOURCE_COLORS = ["#f7c900", "#f59e0b", "#46d9ff", "#a78bfa", "#ff6e91", "#7f8da6"];
const PRODUCT_COLORS = ["#f7c900", "#46d9ff", "#a78bfa", "#ffb35c", "#ff6e91", "#62708c"];

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const formatPercent = (value: number) =>
  `${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 }).format(value)}%`;

const formatDuration = (seconds: number) => {
  const safeSeconds = Math.max(0, Math.round(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  if (!hours) return `${minutes} мин`;
  return `${hours} ч ${minutes} мин`;
};

const durationToSeconds = (value: string) => {
  const hours = Number(value.match(/(\d+)\s*ч/)?.[1] ?? 0);
  const minutes = Number(value.match(/(\d+)\s*мин/)?.[1] ?? 0);
  return hours * 3600 + minutes * 60;
};

const startOfDay = (value: Date) => {
  const result = new Date(value);
  result.setHours(0, 0, 0, 0);
  return result;
};

const periodDays = (period: Period) => (period === "День" ? 1 : period === "Неделя" ? 7 : 30);

const parsedLeadDate = (lead: Lead) => {
  if (!lead.createdAt) return null;
  const date = new Date(lead.createdAt);
  return Number.isNaN(date.getTime()) ? null : date;
};

const buildSourceStats = (leads: Lead[]) => {
  const grouped = new Map<string, { leads: number; revenue: number; successful: number }>();
  leads.forEach((lead) => {
    const current = grouped.get(lead.source) ?? { leads: 0, revenue: 0, successful: 0 };
    current.leads += 1;
    current.revenue += lead.amount;
    current.successful += lead.status === "Успешно" ? 1 : 0;
    grouped.set(lead.source, current);
  });

  return [...grouped.entries()]
    .map(([name, value], index) => ({
      name,
      leads: value.leads,
      revenue: value.revenue,
      conversion: value.leads ? (value.successful / value.leads) * 100 : 0,
      color: SOURCE_COLORS[index % SOURCE_COLORS.length],
    }))
    .sort((a, b) => b.leads - a.leads);
};

function buildDashboardStats(
  leads: Lead[],
  users: User[],
  sessions: SessionRecord[],
  period: Period,
) {
  const now = new Date();
  const today = startOfDay(now);
  const days = periodDays(period);
  const currentStart = new Date(today);
  currentStart.setDate(currentStart.getDate() - (days - 1));
  const previousStart = new Date(currentStart);
  previousStart.setDate(previousStart.getDate() - days);
  const datedLeads = leads.filter((lead) => parsedLeadDate(lead));
  const scopedLeads = datedLeads.length
    ? leads.filter((lead) => {
        const date = parsedLeadDate(lead);
        return date && date >= currentStart && date <= now;
      })
    : leads;
  const previousLeads = datedLeads.length
    ? leads.filter((lead) => {
        const date = parsedLeadDate(lead);
        return date && date >= previousStart && date < currentStart;
      })
    : [];
  const successful = scopedLeads.filter((lead) => lead.status === "Успешно").length;
  const revenue = scopedLeads.reduce((sum, lead) => sum + lead.amount, 0);
  const costs = scopedLeads.reduce(
    (sum, lead) => sum + lead.offers.reduce((offerSum, offer) => offerSum + offer.cdCost, 0),
    0,
  );
  const conversion = scopedLeads.length ? (successful / scopedLeads.length) * 100 : 0;
  const previousSuccessful = previousLeads.filter((lead) => lead.status === "Успешно").length;
  const previousConversion = previousLeads.length
    ? (previousSuccessful / previousLeads.length) * 100
    : 0;
  const leadDelta = previousLeads.length
    ? ((scopedLeads.length - previousLeads.length) / previousLeads.length) * 100
    : 0;
  const conversionDelta = conversion - previousConversion;
  const todaySessions = sessions.filter((session) => {
    const signedIn = new Date(session.signedInAt);
    return !Number.isNaN(signedIn.getTime()) && signedIn >= today && signedIn <= now;
  });
  const sessionAverage = todaySessions.length
    ? todaySessions.reduce((sum, session) => {
        const liveDuration = session.signedOutAt
          ? session.durationSeconds
          : Math.max(session.durationSeconds, (now.getTime() - new Date(session.signedInAt).getTime()) / 1000);
        return sum + liveDuration;
      }, 0) / todaySessions.length
    : users.length
      ? users.reduce(
          (sum, user) => sum + (user.sessionSeconds ?? durationToSeconds(user.session)),
          0,
        ) / users.length
      : 0;
  const activeUserIds = new Set(
    sessions.filter((session) => !session.signedOutAt).map((session) => session.userId),
  );
  const onlineUsers =
    activeUserIds.size ||
    users.filter((user) => user.isOnline ?? user.status === "Активен").length;
  const problemLeads = scopedLeads.filter((lead) => lead.issue);
  const sourceBreakdown = buildSourceStats(scopedLeads);

  const productCounts = new Map<string, number>();
  scopedLeads.forEach((lead) => {
    const key = ["Дебет", "РКО", "Кредит", "МФО", "Регбиз"].includes(lead.product)
      ? lead.product
      : "HR и другие";
    productCounts.set(key, (productCounts.get(key) ?? 0) + 1);
  });
  const products = [...productCounts.entries()]
    .map(([name, count], index) => ({
      name,
      count,
      value: scopedLeads.length ? (count / scopedLeads.length) * 100 : 0,
      color: PRODUCT_COLORS[index % PRODUCT_COLORS.length],
    }))
    .sort((a, b) => b.count - a.count);

  const todayHourlyLabels = Array.from({ length: 12 }, (_, index) =>
    String(index + 9).padStart(2, "0"),
  );
  const todayHourlyValues = todayHourlyLabels.map((label) => {
    const hour = Number(label);
    return datedLeads.filter((lead) => {
      const date = parsedLeadDate(lead);
      return date && date >= today && date <= now && date.getHours() === hour;
    }).length;
  });

  const bucketCount = period === "День" ? 12 : period === "Неделя" ? 7 : 14;
  const chartLabels: string[] = [];
  const chartValues: number[] = [];
  if (period === "День") {
    chartLabels.push(...todayHourlyLabels);
    chartValues.push(...todayHourlyValues);
  } else {
    for (let offset = bucketCount - 1; offset >= 0; offset -= 1) {
      const day = new Date(today);
      day.setDate(day.getDate() - offset);
      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);
      chartLabels.push(
        period === "Неделя"
          ? day.toLocaleDateString("ru-RU", { weekday: "short" }).replace(".", "")
          : String(day.getDate()).padStart(2, "0"),
      );
      chartValues.push(
        datedLeads.filter((lead) => {
          const date = parsedLeadDate(lead);
          return date && date >= day && date < nextDay;
        }).length,
      );
    }
  }

  const usersWithStats = users.map((user) => {
    const userLeads = scopedLeads.filter((lead) => lead.manager === user.name);
    const userSuccessful = userLeads.filter((lead) => lead.status === "Успешно").length;
    return {
      ...user,
      leads: userLeads.length,
      revenue: userLeads.reduce((sum, lead) => sum + lead.amount, 0),
      conversion: userLeads.length ? (userSuccessful / userLeads.length) * 100 : 0,
    };
  });

  return {
    scopedLeads,
    usersWithStats,
    revenue,
    netRevenue: Math.max(0, revenue - costs),
    conversion,
    leadDelta,
    conversionDelta,
    sessionsToday:
      todaySessions.length || users.filter((user) => user.lastLogin.startsWith("Сегодня")).length,
    averageSession: sessionAverage,
    onlineUsers,
    problemLeads,
    sourceBreakdown,
    products,
    chartLabels,
    chartValues: datedLeads.length
      ? chartValues
      : period === "День"
        ? hourly
        : daily.slice(-bucketCount),
    todayHourlyLabels,
    todayHourlyValues: datedLeads.length ? todayHourlyValues : hourly,
  };
}

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
  const max = Math.max(1, ...values);
  return (
    <div className={`bar-chart ${compact ? "bar-chart-compact" : ""}`}>
      {values.map((value, index) => (
        <div className="bar-column" key={`${labels[index]}-${value}`}>
          <div className="bar-track">
            <span
              className="bar-fill"
              style={{ height: value ? `${Math.max(8, (value / max) * 100)}%` : "0%" }}
            />
          </div>
          <span>{labels[index]}</span>
        </div>
      ))}
    </div>
  );
}

function Donut({
  center,
  label,
  segments,
}: {
  center: string;
  label: string;
  segments?: Array<{ value: number; color: string }>;
}) {
  let cursor = 0;
  const gradient = segments?.length
    ? `conic-gradient(${segments
        .map((segment) => {
          const start = cursor;
          cursor += segment.value;
          return `${segment.color} ${start}% ${cursor}%`;
        })
        .join(", ")})`
    : undefined;
  return (
    <div className="donut-wrap">
      <div className="donut" style={gradient ? { background: gradient } : undefined}>
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

function AccessLogin({
  onSuccess,
}: {
  onSuccess: (role: UserRole, label: string) => void;
}) {
  const [agentName, setAgentName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, agentName }),
      });
      const payload = (await response.json()) as { error?: string; role?: string; label?: string };
      if (!response.ok || !payload.role) throw new Error(payload.error ?? "Код доступа не принят");
      const allowed: UserRole[] = ["influencer", "leader", "partner", "admin", "owner"];
      const role = allowed.includes(payload.role as UserRole) ? (payload.role as UserRole) : "partner";
      onSuccess(role, payload.label ?? "Пользователь");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Не удалось выполнить вход");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="access-login-shell">
      <div className="access-login-glow" />
      <section className="access-login-card">
        <div className="access-login-mark"><img src="/mk-logo-transparent.png" alt="Логотип M&K" /></div>
        <div className="access-login-copy">
          <h1>Платформа M&K</h1>
          <p>Вход по коду доступа. Регистрация закрыта.</p>
        </div>
        <form onSubmit={submit}>
          <label><span>Имя агента</span><input value={agentName} onChange={(event) => setAgentName(event.target.value)} placeholder="Например, Дмитрий" autoComplete="name" autoFocus /></label>
          <label><span>Код доступа</span><input value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder="MK-XXXX" autoComplete="one-time-code" /></label>
          {error && <div className="access-login-error">{error}</div>}
          <button className="primary-button" disabled={submitting || !code.trim() || !agentName.trim()}>{submitting ? "Проверяем…" : "Войти"}</button>
          <p className="access-login-help">Нет кода доступа? Обратитесь к своему тимлиду или администратору.</p>
        </form>
      </section>
    </main>
  );
}

export function CrmDashboard() {
  const [auth, setAuth] = useState<AuthState>({ status: "checking" });
  const [view, setView] = useState<View>("overview");
  const [period, setPeriod] = useState<Period>("Месяц");
  const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [reports, setReports] = useState<TeamReport[]>(INITIAL_REPORTS);
  const [reportModal, setReportModal] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [metricModal, setMetricModal] = useState<string | null>(null);
  const [editingLead, setEditingLead] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Все статусы");
  const [problemFilter, setProblemFilter] = useState("Все проблемы");
  const [toast, setToast] = useState<string | null>(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [viewTransition, setViewTransition] = useState(false);
  const transitionTimeout = useRef<number | null>(null);
  const [connected, setConnected] = useState<string[]>(["Telegram-бот"]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/session")
      .then(async (response) => {
        if (!response.ok) throw new Error("anonymous");
        return (await response.json()) as { role?: string; label?: string };
      })
      .then((payload) => {
        if (cancelled) return;
        const allowed: UserRole[] = ["influencer", "leader", "partner", "admin", "owner"];
        const role = allowed.includes(payload.role as UserRole) ? (payload.role as UserRole) : "partner";
        setAuth({ status: "authenticated", role, label: payload.label ?? "Пользователь" });
      })
      .catch(() => {
        if (!cancelled) setAuth({ status: "anonymous" });
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (auth.status !== "authenticated") return;
    let cancelled = false;

    fetch("/api/bootstrap")
      .then(async (response) => {
        if (!response.ok) throw new Error("CRM data unavailable");
        return (await response.json()) as BootstrapPayload;
      })
      .then((payload) => {
        if (cancelled) return;

        const teamNames = new Map((payload.teams ?? []).map((team) => [team.id, team.name]));
        const rawUsers = payload.users ?? [];
        const userNames = new Map(rawUsers.map((user) => [user.id, user.name]));
        const offerById = new Map((payload.offers ?? []).map((offer) => [offer.id, offer]));
        const leadOffersByLead = new Map<number, NonNullable<BootstrapPayload["leadOffers"]>>();
        (payload.leadOffers ?? []).forEach((leadOffer) => {
          const current = leadOffersByLead.get(leadOffer.leadId) ?? [];
          current.push(leadOffer);
          leadOffersByLead.set(leadOffer.leadId, current);
        });
        const sessionRows = payload.sessions ?? [];
        setSessions(sessionRows);

        if (rawUsers.length) {
          const roleLabels: Record<string, string> = {
            leader: "Тимлид",
            manager: "Менеджер",
            influencer: "Лидогенератор",
            partner: "Партнёр",
            admin: "Администратор",
            owner: "Владелец",
          };
          const hydratedUsers = rawUsers.map<User>((user) => {
            const userSessions = sessionRows
              .filter((session) => session.userId === user.id)
              .sort((a, b) => b.signedInAt.localeCompare(a.signedInAt));
            const latestSession = userSessions[0];
            const isOnline = userSessions.some((session) => !session.signedOutAt);
            return {
              id: user.id,
              name: user.name,
              initials: initialsOf(user.name),
              role: roleLabels[user.role] ?? user.role,
              team: user.teamId ? teamNames.get(user.teamId) ?? "Без команды" : "Без команды",
              status: user.status === "active" ? "Активен" : "Деактивирован",
              leads: 0,
              revenue: 0,
              conversion: 0,
              lastLogin: latestSession
                ? new Date(latestSession.signedInAt).toLocaleString("ru-RU", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Никогда",
              session: latestSession ? formatDuration(latestSession.durationSeconds) : "0 мин",
              topOffer: "—",
              lastLoginAt: latestSession?.signedInAt,
              sessionSeconds: latestSession?.durationSeconds ?? 0,
              isOnline,
            };
          });
          setUsers(hydratedUsers);
        }

        if (payload.leads?.length) {
          const allowedStatuses: LeadStatus[] = ["Новый", "В работе", "Успешно", "Отказ"];
          const allowedIssues: NonNullable<Lead["issue"]>[] = [
            "Нет контакта",
            "Нет суммы",
            "Низкое качество",
            "Застрял",
          ];
          const hydratedLeads = payload.leads.map<Lead>((lead) => {
            const attachedOffers = leadOffersByLead.get(lead.id) ?? [];
            const createdAt = new Date(lead.createdAt);
            return {
              id: lead.id,
              client: lead.clientName,
              initials: initialsOf(lead.clientName),
              phone: lead.phone ?? "Не указан",
              telegram: lead.telegram ?? "Не указан",
              whatsapp: lead.whatsapp ?? "Не указан",
              source: lead.source,
              product: lead.product,
              status: allowedStatuses.includes(lead.status as LeadStatus)
                ? (lead.status as LeadStatus)
                : "Новый",
              amount: lead.amount,
              manager: lead.managerId ? userNames.get(lead.managerId) ?? "Не назначен" : "Не назначен",
              team: lead.teamId ? teamNames.get(lead.teamId) ?? "Без команды" : "Без команды",
              created: Number.isNaN(createdAt.getTime())
                ? lead.createdAt
                : createdAt.toLocaleString("ru-RU", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
              createdAt: lead.createdAt,
              description: lead.description,
              issue: allowedIssues.includes(lead.issueType as NonNullable<Lead["issue"]>)
                ? (lead.issueType as NonNullable<Lead["issue"]>)
                : undefined,
              ai: lead.aiScore ?? 50,
              offers: attachedOffers.map((leadOffer) => {
                const offer = leadOffer.offerId ? offerById.get(leadOffer.offerId) : undefined;
                return {
                  bank: offer?.partnerName ?? "Партнёр",
                  product: offer?.title ?? lead.product,
                  stage: leadOffer.stage,
                  payout: leadOffer.payout || offer?.payout || 0,
                  cdCost: leadOffer.targetActionCost || offer?.targetActionCost || 0,
                  delivery: leadOffer.deliveryNote ?? leadOffer.deliveryAt ?? "Не указано",
                };
              }),
              persisted: true,
            };
          });
          setLeads(hydratedLeads);
        }
      })
      .catch(() => {
        // Демо-данные остаются резервом, если база временно недоступна или ещё не заполнена.
      });

    fetch("/api/reports")
      .then(async (response) => {
        if (!response.ok) throw new Error("reports unavailable");
        return (await response.json()) as { reports?: TeamReport[] };
      })
      .then((payload) => {
        if (!cancelled && payload.reports?.length) {
          setReports(payload.reports);
        }
      })
      .catch(() => {
        // Демо-отчёты остаются видимыми, пока постоянное хранилище недоступно.
      });

    return () => {
      cancelled = true;
    };
  }, [auth.status]);

  const calculatedUsers = useMemo(
    () => buildDashboardStats(leads, users, sessions, "Месяц").usersWithStats,
    [leads, users, sessions],
  );
  const selectedLead = leads.find((lead) => lead.id === selectedLeadId) ?? null;
  const selectedUser = calculatedUsers.find((user) => user.id === selectedUserId) ?? null;

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

  const problemLeads = leads.filter((lead) => lead.issue);

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
    setMobileNav(false);
    setSelectedLeadId(null);
    setSelectedUserId(null);
    if (next === view) return;
    if (transitionTimeout.current) window.clearTimeout(transitionTimeout.current);
    setViewTransition(true);
    transitionTimeout.current = window.setTimeout(() => {
      setView(next);
      setViewTransition(false);
    }, 220);
  };

  const saveReport = async (draft: Omit<TeamReport, "id" | "createdAt">) => {
    const response = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      throw new Error(payload.error ?? "Не удалось сохранить отчёт");
    }

    const payload = (await response.json()) as { report: TeamReport };
    setReports((current) => [payload.report, ...current]);
    setReportModal(false);
    showToast("Отчёт тимлида сохранён");
  };

  const saveLead = async (lead: Lead) => {
    const isExisting = Boolean(lead.persisted);
    const response = await fetch("/api/leads", {
      method: isExisting ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        isExisting
          ? {
              id: lead.id,
              source: lead.source,
              product: lead.product,
              status: lead.status,
              amount: lead.amount,
              description: lead.description,
              issueType: lead.issue ?? null,
            }
          : {
              clientName: lead.client,
              phone: lead.phone === "Не указан" ? "" : lead.phone,
              telegram: lead.telegram === "Не указан" ? "" : lead.telegram,
              whatsapp: lead.whatsapp === "Не указан" ? "" : lead.whatsapp,
              description: lead.description,
              source: lead.source,
              product: lead.product,
              status: lead.status,
              amount: lead.amount,
            },
      ),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      throw new Error(payload.error ?? "Не удалось сохранить лид");
    }

    const payload = (await response.json()) as {
      lead: { id: number; createdAt?: string; updatedAt?: string };
    };
    const savedId = payload.lead.id;
    setLeads((current) =>
      current.map((item) =>
        item.id === lead.id
          ? {
              ...item,
              id: savedId,
              persisted: true,
              createdAt: item.createdAt ?? payload.lead.createdAt ?? new Date().toISOString(),
            }
          : item,
      ),
    );
    setSelectedLeadId(savedId);
    setEditingLead(false);
    showToast("Изменения по лиду сохранены");
  };

  if (auth.status === "checking") {
    return <main className="access-login-shell"><div className="access-login-loading"><img src="/mk-logo-transparent.png" alt="" /><span>Проверяем доступ…</span></div></main>;
  }

  if (auth.status === "anonymous") {
    return <AccessLogin onSuccess={(role, label) => setAuth({ status: "authenticated", role, label })} />;
  }

  const currentUserRole = auth.role;

  const logout = async () => {
    await fetch("/api/auth/session", { method: "DELETE" }).catch(() => undefined);
    setAuth({ status: "anonymous" });
    setView("overview");
  };

  return (
    <div className="app-shell">
      <div className="intro-loader" aria-hidden="true">
        <div className="intro-aura" />
        <div className="intro-logo-wrap">
          <img src="/mk-logo-transparent.png" alt="" />
          <span className="intro-wand" />
          <i className="intro-spark intro-spark-a" />
          <i className="intro-spark intro-spark-b" />
          <i className="intro-spark intro-spark-c" />
        </div>
        <strong>Платформа M&K</strong>
        <small>Управление лидами</small>
      </div>

      <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
        <button className="brand" onClick={() => navigate("overview")}>
          <span className="brand-mark">
            <img src="/mk-logo-transparent.png" alt="Логотип M&K" />
          </span>
          <span>
            <strong>Платформа M&K</strong>
            <small>УПРАВЛЕНИЕ ЛИДАМИ</small>
          </span>
        </button>

        <nav className="nav-list" aria-label="Основная навигация">
          {NAV_GROUPS.filter((group) => group.roles.includes(currentUserRole)).map((group) => (
            <section className="nav-group" key={group.label}>
              <span className="nav-group-label">{group.label}</span>
              <div className="nav-group-items">
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    className={view === item.id ? "active" : ""}
                    onClick={() => navigate(item.id)}
                  >
                    <span>{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </div>
            </section>
          ))}
        </nav>

        <div className="sidebar-foot">
          <div className="online-dot" />
          <div>
            <strong>{auth.label}</strong>
            <small>{currentUserRole === "admin" || currentUserRole === "owner" ? "Полный доступ" : "Обычный доступ"}</small>
          </div>
          <button aria-label="Выйти" title="Выйти" onClick={logout}>
            ↪
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
              onFocus={() => navigate("leads")}
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

        <div className={`content view-stage ${viewTransition ? "view-leaving" : ""}`} key={view}>
          {view === "overview" && (
            <Overview
              period={period}
              setPeriod={setPeriod}
              users={users}
              leads={leads}
              sessions={sessions}
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
                  createdAt: new Date().toISOString(),
                  description: "Заполните данные нового лида.",
                  ai: 50,
                  offers: [],
                  persisted: false,
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
              leads={leads}
              sessions={sessions}
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
            <AnalyticsView
              period={period}
              setPeriod={setPeriod}
              users={users}
              leads={leads}
              sessions={sessions}
              openUser={openUser}
            />
          )}
          {view === "structure" && (
            <StructureView period={period} setPeriod={setPeriod} navigate={navigate} />
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
          {view === "reports" && (
            <ReportsView reports={reports} onAdd={() => setReportModal(true)} />
          )}
          {view === "mini-app" && <ModuleView type="mini-app" />}
          {view === "info" && <ModuleView type="info" />}
          {view === "media" && <ModuleView type="media" />}
          {view === "rko-stats" && <ModuleView type="rko-stats" />}
          {view === "media-stats" && <ModuleView type="media-stats" />}
          {view === "accounting" && <ModuleView type="accounting" />}
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
            void saveLead(selectedLead).catch((error) =>
              showToast(error instanceof Error ? error.message : "Не удалось сохранить лид"),
            );
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
          users={calculatedUsers}
          leads={leads}
          onClose={() => setMetricModal(null)}
          openUser={(id) => {
            setMetricModal(null);
            openUser(id);
          }}
          showToast={showToast}
        />
      )}

      {reportModal && (
        <ReportModal
          users={users}
          onClose={() => setReportModal(false)}
          onSave={saveReport}
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
  sessions,
  setMetricModal,
  openUser,
  navigate,
}: {
  period: Period;
  setPeriod: (period: Period) => void;
  users: User[];
  leads: Lead[];
  sessions: SessionRecord[];
  setMetricModal: (type: string) => void;
  openUser: (id: number) => void;
  navigate: (view: View) => void;
}) {
  const stats = useMemo(
    () => buildDashboardStats(leads, users, sessions, period),
    [leads, users, sessions, period],
  );
  const statusCounts = (["Новый", "В работе", "Успешно", "Отказ"] as LeadStatus[]).map(
    (status) => ({ status, count: stats.scopedLeads.filter((lead) => lead.status === status).length }),
  );
  const bestUser = [...stats.usersWithStats].sort((a, b) => b.revenue - a.revenue)[0];
  const bestSource = stats.sourceBreakdown[0];
  const dateLabel = new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    weekday: "long",
  }).format(new Date());
  const peakHourIndex = stats.todayHourlyValues.indexOf(Math.max(...stats.todayHourlyValues));
  const peakHour = stats.todayHourlyLabels[Math.max(0, peakHourIndex)] ?? "—";

  return (
    <>
      <div className="page-title">
        <div>
          <span className="eyebrow">{dateLabel}</span>
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
            {bestUser?.name ?? "Команда"} лидирует по выручке. {stats.problemLeads.length} лидов
            требуют внимания. Лучший источник за период — {bestSource?.name ?? "пока не определён"}
            {bestSource ? ` с конверсией ${formatPercent(bestSource.conversion)}` : ""}.
          </p>
        </div>
        <button onClick={() => navigate("problems")}>Разобрать проблемы →</button>
      </section>

      <div className="kpi-grid">
        <KpiCard
          label="Всего лидов"
          value={String(stats.scopedLeads.length)}
          meta={`${stats.leadDelta >= 0 ? "+" : ""}${formatPercent(stats.leadDelta)} к прошлому периоду`}
          accent="#f7c900"
          icon="◫"
          onClick={() => setMetricModal("leads")}
        />
        <KpiCard
          label="Общая сумма"
          value={money(stats.revenue)}
          meta={`Чистыми ${money(stats.netRevenue)}`}
          accent="#ffb800"
          icon="₽"
          onClick={() => setMetricModal("revenue")}
        />
        <KpiCard
          label="Конверсия"
          value={formatPercent(stats.conversion)}
          meta={`${stats.conversionDelta >= 0 ? "+" : ""}${formatPercent(stats.conversionDelta)} к прошлому периоду`}
          accent="#fcd34d"
          icon="%"
          onClick={() => setMetricModal("conversion")}
        />
        <KpiCard
          label="Пользователей"
          value={String(users.length)}
          meta={`${stats.onlineUsers} активны сейчас`}
          accent="#eab308"
          icon="◎"
          onClick={() => setMetricModal("users")}
        />
        <KpiCard
          label="Входов сегодня"
          value={String(stats.sessionsToday)}
          meta={`Средняя сессия ${formatDuration(stats.averageSession)}`}
          accent="#f59e0b"
          icon="↗"
          onClick={() => setMetricModal("sessions")}
        />
        <KpiCard
          label="Проблемные лиды"
          value={String(stats.problemLeads.length)}
          meta={`${stats.problemLeads.filter((lead) => lead.status !== "Отказ").length} требуют реакции`}
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
              <strong>{stats.scopedLeads.length}</strong>
              <span>лидов за период</span>
            </div>
            <span className={stats.leadDelta >= 0 ? "positive" : "warning-copy"}>
              {stats.leadDelta >= 0 ? "+" : ""}{formatPercent(stats.leadDelta)}
            </span>
          </div>
          <BarChart
            values={stats.chartValues}
            labels={stats.chartLabels}
          />
        </Panel>

        <Panel title="Распределение по продуктам" subtitle="Количество лидов">
          <div className="distribution">
            <Donut
              center={String(stats.scopedLeads.length)}
              label="лидов"
              segments={stats.products.map((item) => ({ value: item.value, color: item.color }))}
            />
            <div className="legend">
              {stats.products.map((item) => (
                <div key={item.name}>
                  <i style={{ background: item.color }} />
                  <span>{item.name}</span>
                  <strong>{formatPercent(item.value)}</strong>
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
            {[...stats.usersWithStats]
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
          subtitle={`Пик: ${peakHour}:00–${String((Number(peakHour) + 1) % 24).padStart(2, "0")}:00`}
          action={<span className="live-pill">● LIVE</span>}
        >
          <BarChart
            compact
            values={stats.todayHourlyValues}
            labels={stats.todayHourlyLabels}
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
          <h1>Команда</h1>
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
  leads,
  sessions,
  openUser,
  onInvite,
}: {
  users: User[];
  leads: Lead[];
  sessions: SessionRecord[];
  openUser: (id: number) => void;
  onInvite: () => void;
}) {
  const stats = useMemo(
    () => buildDashboardStats(leads, users, sessions, "Месяц"),
    [leads, users, sessions],
  );
  const inactiveUsers = users.filter((user) => user.status === "Деактивирован").length;
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
        <div><span>Всего</span><strong>{users.length}</strong><small>пользователей</small></div>
        <div><span>Онлайн</span><strong className="lime">{stats.onlineUsers}</strong><small>прямо сейчас</small></div>
        <div><span>Входов сегодня</span><strong>{stats.sessionsToday}</strong><small>средняя сессия {formatDuration(stats.averageSession)}</small></div>
        <div><span>Деактивированы</span><strong className="pink">{inactiveUsers}</strong><small>ограничен доступ</small></div>
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
              {stats.usersWithStats.map((user) => (
                <tr key={user.id} onClick={() => openUser(user.id)}>
                  <td><div className="person-cell"><Avatar initials={user.initials} /><span><strong>{user.name}</strong><small>ID · {String(user.id).padStart(4, "0")}</small></span></div></td>
                  <td><span className="role-pill">{user.role}</span></td>
                  <td>{user.team}</td>
                  <td><strong>{user.leads}</strong></td>
                  <td><strong>{money(user.revenue)}</strong></td>
                  <td>{formatPercent(user.conversion)}</td>
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
  const issueNames: NonNullable<Lead["issue"]>[] = [
    "Нет контакта",
    "Нет суммы",
    "Низкое качество",
    "Застрял",
  ];
  const categories = [
    { name: "Все проблемы", count: leads.length, color: "#ff6e91" },
    ...issueNames.map((name, index) => ({
      name,
      count: leads.filter((lead) => lead.issue === name).length,
      color: ["#ffb35c", "#46d9ff", "#a78bfa", "#bdff38"][index],
    })),
  ];
  const visibleLeads = filter === "Все проблемы" ? leads : leads.filter((lead) => lead.issue === filter);
  const sourceProblems = [...leads.reduce((grouped, lead) => {
    grouped.set(lead.source, (grouped.get(lead.source) ?? 0) + 1);
    return grouped;
  }, new Map<string, number>()).entries()].sort((a, b) => b[1] - a[1]);
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
        <Panel title={`Требуют внимания · ${visibleLeads.length}`} subtitle="Проблема, источник и ответственный">
          <div className="problem-list">
            {visibleLeads.map((lead) => (
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
              {leads.slice(0, 3).map((lead, index) => (
                <li key={lead.id}><span>0{index + 1}</span><p><strong>Проверить лид «{lead.client}»</strong>{lead.issue} · {lead.source} · {lead.manager}</p></li>
              ))}
              {!leads.length && <li><span>✓</span><p><strong>Проблем нет</strong>Все лиды обработаны или не требуют реакции.</p></li>}
            </ul>
          </Panel>
          <Panel title="По источникам" subtitle="Доля проблемных лидов">
            <div className="source-problems">
              {sourceProblems.map(([source, count]) => (
                <div key={source}><span>{source}</span><div><i style={{ width: `${leads.length ? (count / leads.length) * 100 : 0}%` }} /></div><strong>{count}</strong></div>
              ))}
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
  leads,
  sessions,
  openUser,
}: {
  period: Period;
  setPeriod: (period: Period) => void;
  users: User[];
  leads: Lead[];
  sessions: SessionRecord[];
  openUser: (id: number) => void;
}) {
  const stats = useMemo(
    () => buildDashboardStats(leads, users, sessions, period),
    [leads, users, sessions, period],
  );
  const costs = Math.max(0, stats.revenue - stats.netRevenue);
  return (
    <>
      <div className="page-title compact-title">
        <div>
          <span className="eyebrow">Глубокая статистика</span>
          <h1>Инсайды</h1>
          <p>Источники, конверсия, продукты, команды и динамика.</p>
        </div>
        <div className="title-actions"><PeriodControl period={period} setPeriod={setPeriod} /><button className="secondary-button">⇩ Отчёт</button></div>
      </div>
      <div className="mini-kpis">
        <div><span>Лиды</span><strong>{stats.scopedLeads.length}</strong><small className={stats.leadDelta >= 0 ? "positive" : "warning-copy"}>{stats.leadDelta >= 0 ? "+" : ""}{formatPercent(stats.leadDelta)}</small></div>
        <div><span>Оборот</span><strong>{money(stats.revenue)}</strong><small>за выбранный период</small></div>
        <div><span>Конверсия</span><strong>{formatPercent(stats.conversion)}</strong><small className={stats.conversionDelta >= 0 ? "positive" : "warning-copy"}>{stats.conversionDelta >= 0 ? "+" : ""}{formatPercent(stats.conversionDelta)}</small></div>
        <div><span>Чистыми</span><strong>{money(stats.netRevenue)}</strong><small>−{money(costs)} затрат</small></div>
      </div>
      <div className="dashboard-grid">
        <Panel title="Динамика по дням" subtitle="Новые и успешные лиды" className="span-2">
          <div className="chart-summary"><div><strong>{stats.scopedLeads.length}</strong><span>всего лидов</span></div><span className={stats.leadDelta >= 0 ? "positive" : "warning-copy"}>{stats.leadDelta >= 0 ? "+" : ""}{formatPercent(stats.leadDelta)}</span></div>
          <BarChart values={stats.chartValues} labels={stats.chartLabels} />
        </Panel>
        <Panel title="По часам" subtitle="Средний день">
          <BarChart compact values={stats.todayHourlyValues} labels={stats.todayHourlyLabels} />
        </Panel>
        <Panel title="Конверсия по источникам" subtitle="Сумма и результат" className="span-2">
          <div className="source-table">
            {stats.sourceBreakdown.map((source) => (
              <div key={source.name}>
                <i style={{ background: source.color }} />
                <span><strong>{source.name}</strong><small>{source.leads} лидов</small></span>
                <div className="progress"><span style={{ width: `${Math.min(100, source.conversion)}%`, background: source.color }} /></div>
                <strong>{formatPercent(source.conversion)}</strong>
                <strong>{money(source.revenue)}</strong>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Продукты" subtitle="Доля от общего объёма">
          <div className="distribution vertical">
            <Donut center={String(stats.products.length)} label="категорий" segments={stats.products.map((item) => ({ value: item.value, color: item.color }))} />
            <div className="legend">
              {stats.products.map((item) => <div key={item.name}><i style={{ background: item.color }} /><span>{item.name}</span><strong>{formatPercent(item.value)}</strong></div>)}
            </div>
          </div>
        </Panel>
        <Panel title="Топ по конверсии" subtitle="Пользователи" className="span-3">
          <div className="leader-grid">
            {[...stats.usersWithStats].sort((a, b) => b.conversion - a.conversion).slice(0, 3).map((user, index) => (
              <button key={user.id} onClick={() => openUser(user.id)}>
                <span className="position">0{index + 1}</span><Avatar initials={user.initials} large />
                <span><strong>{user.name}</strong><small>{user.team} · {user.topOffer}</small></span>
                <b>{formatPercent(user.conversion)}</b>
              </button>
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}

function StructureView({
  period,
  setPeriod,
  navigate,
}: {
  period: Period;
  setPeriod: (period: Period) => void;
  navigate: (view: View) => void;
}) {
  const trend = {
    День: [22, 38, 31, 52, 47, 68, 74],
    Неделя: [38, 51, 46, 67, 72, 64, 88],
    Месяц: [31, 42, 55, 48, 69, 77, 91],
  }[period];
  const pipeline = [
    {
      index: "01",
      title: "ИП / НПБ",
      caption: "Первичный поток",
      metric: "208 заявок",
      detail: "Авито, Яндекс, Telegram",
      owner: "Лидогенерация",
    },
    {
      index: "02",
      title: "РКО-офферы",
      caption: "Обработка",
      metric: "146 одобрено",
      detail: "70,2% от входящего потока",
      owner: "Тимлиды",
    },
    {
      index: "03",
      title: "Целевое действие",
      caption: "Доставка и активация",
      metric: "83 выполнено",
      detail: "14 ожидают курьера",
      owner: "Менеджеры",
    },
    {
      index: "04",
      title: "Карты и кредиты",
      caption: "Выплаты",
      metric: "2,14 млн ₽",
      detail: "Чистый результат",
      owner: "Финансы",
    },
  ];
  const workItems = [
    {
      title: "Дебетовые карты · Север",
      text: "ВТБ — ЦД выполняется, Газпромбанк — доставка 24 июля, ОТП — ждём выплату",
      value: "18 / 24",
      percent: 75,
      state: "В работе",
    },
    {
      title: "РКО · Альфа",
      text: "12 заявок переданы банкам, 7 одобрены, по 3 клиентам нужен повторный контакт",
      value: "7 / 12",
      percent: 58,
      state: "Есть риски",
    },
    {
      title: "Premium Private · Вектор",
      text: "Первичный отбор завершён, два клиента назначены на консультацию",
      value: "6 / 8",
      percent: 82,
      state: "По плану",
    },
  ];

  return (
    <>
      <div className="page-title compact-title">
        <div>
          <span className="eyebrow">Операционная карта</span>
          <h1>Структура и динамика</h1>
          <p>Весь путь лида — от входящего потока до целевого действия и выплаты.</p>
        </div>
        <PeriodControl period={period} setPeriod={setPeriod} />
      </div>

      <div className="structure-kpis">
        <div><span>Входящий поток</span><strong>208</strong><small className="positive">+18,6%</small></div>
        <div><span>В работе</span><strong>76</strong><small>36,5% потока</small></div>
        <div><span>ЦД выполнено</span><strong>83</strong><small className="positive">+12 за неделю</small></div>
        <div><span>Потенциал дохода</span><strong>3,48 млн ₽</strong><small>при текущей конверсии</small></div>
      </div>

      <div className="structure-top-grid">
        <Panel
          title="Динамика результата"
          subtitle={`${period.toLowerCase()} · лиды, ЦД и выручка`}
          className="structure-trend-panel"
        >
          <div className="trend-head">
            <div><strong>+24,8%</strong><span>к прошлому периоду</span></div>
            <div className="trend-legend"><span><i />Лиды</span><span><i />ЦД</span></div>
          </div>
          <div className="trend-chart" aria-label="Рост результата по периодам">
            <div className="trend-grid" />
            <div
              className="trend-area"
              style={{
                clipPath: `polygon(0 ${100 - trend[0]}%, 16.6% ${100 - trend[1]}%, 33.2% ${100 - trend[2]}%, 49.8% ${100 - trend[3]}%, 66.4% ${100 - trend[4]}%, 83% ${100 - trend[5]}%, 100% ${100 - trend[6]}%, 100% 100%, 0 100%)`,
              }}
            />
            {trend.map((value, index) => (
              <span
                className="trend-point"
                key={`${period}-${index}`}
                style={{ left: `${index * 16.66}%`, bottom: `${value}%` }}
              />
            ))}
            <div className="trend-labels">
              {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((label) => <span key={label}>{label}</span>)}
            </div>
          </div>
        </Panel>

        <Panel title="Сводка процесса" subtitle="Где сейчас находится работа">
          <div className="process-summary">
            <div className="process-ring"><strong>70%</strong><span>прошли отбор</span></div>
            <div>
              <p><i className="is-yellow" /><span>Первичный поток</span><strong>208</strong></p>
              <p><i className="is-orange" /><span>Одобрено</span><strong>146</strong></p>
              <p><i className="is-white" /><span>Выполнено ЦД</span><strong>83</strong></p>
              <p><i className="is-muted" /><span>Ожидают действия</span><strong>42</strong></p>
            </div>
          </div>
        </Panel>
      </div>

      <Panel
        title="Рабочая цепочка"
        subtitle="Детализация по каждому этапу"
        action={<button className="text-button" onClick={() => navigate("analytics")}>Открыть аналитику →</button>}
        className="flow-panel"
      >
        <div className="structure-flow">
          {pipeline.map((stage, index) => (
            <article key={stage.title} className="flow-stage">
              <div className="flow-stage-top"><span>{stage.index}</span><small>{stage.caption}</small></div>
              <h3>{stage.title}</h3>
              <strong>{stage.metric}</strong>
              <p>{stage.detail}</p>
              <footer><span>Ответственный</span><b>{stage.owner}</b></footer>
              {index < pipeline.length - 1 && <i className="flow-arrow" aria-hidden="true">→</i>}
            </article>
          ))}
        </div>
      </Panel>

      <div className="structure-bottom-grid">
        <Panel title="Активные направления" subtitle="Короткие рабочие блоки вместо разрозненных записей">
          <div className="work-stack">
            {workItems.map((item) => (
              <article key={item.title}>
                <div><span className={`report-state ${item.state === "Есть риски" ? "risk" : ""}`}>{item.state}</span><strong>{item.value}</strong></div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
                <div className="work-progress"><span style={{ width: `${item.percent}%` }} /></div>
              </article>
            ))}
          </div>
        </Panel>

        <Panel title="Зоны ответственности" subtitle="Кто ведёт каждый контур">
          <div className="responsibility-list">
            <div><span>Lead generation</span><strong>Тимлид + лидогенераторы</strong><small>Источники, входящий поток, первичная квалификация</small></div>
            <div><span>Premium Private</span><strong>Leader / Influencer</strong><small>Премиальные офферы, партнёры, развитие команды</small></div>
            <div><span>Команда и медиа</span><strong>Тимлид + администратор</strong><small>Операционные задачи, обучение, текущие статусы</small></div>
            <div><span>Контроль</span><strong>Админ-панель</strong><small>РКО, медиа, доступы, выплаты и отчёты</small></div>
          </div>
        </Panel>
      </div>
    </>
  );
}

function ReportsView({
  reports,
  onAdd,
}: {
  reports: TeamReport[];
  onAdd: () => void;
}) {
  const completed = reports.reduce(
    (sum, report) => sum + report.completedTasks.split(";").filter(Boolean).length,
    0,
  );
  const average = Math.round(
    reports.reduce((sum, report) => sum + report.completionPercent, 0) /
      Math.max(1, reports.length),
  );
  const risks = reports.filter((report) => report.blockers.trim()).length;

  return (
    <>
      <div className="page-title compact-title">
        <div>
          <span className="eyebrow">Контроль команд</span>
          <h1>Отчёты тимлидов</h1>
          <p>Выполненные задачи, текущее состояние дел, риски и следующий шаг.</p>
        </div>
        <button className="primary-button" onClick={onAdd}>＋ Добавить отчёт</button>
      </div>

      <div className="report-kpis">
        <div><span>Отчётов</span><strong>{reports.length}</strong><small>в текущей выборке</small></div>
        <div><span>Выполнено блоков</span><strong>{completed}</strong><small className="positive">за период</small></div>
        <div><span>Средняя готовность</span><strong>{average}%</strong><small>по всем командам</small></div>
        <div><span>Требуют внимания</span><strong>{risks}</strong><small className={risks ? "warning-copy" : "positive"}>{risks ? "есть блокеры" : "рисков нет"}</small></div>
      </div>

      <div className="reports-toolbar">
        <div><button className="active">Все команды</button><button>Север</button><button>Альфа</button><button>Вектор</button></div>
        <span>Сначала новые ↓</span>
      </div>

      <div className="reports-list">
        {reports.map((report) => (
          <article className="report-card" key={report.id}>
            <header>
              <Avatar initials={report.teamLead.split(" ").map((part) => part[0]).join("").slice(0, 2)} />
              <div><h3>{report.teamLead}</h3><p>Команда {report.team} · {report.period}</p></div>
              <span className={`report-state ${report.status === "Есть риски" ? "risk" : ""}`}>{report.status}</span>
              <time>{new Date(report.createdAt).toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}</time>
            </header>
            <div className="report-progress-row">
              <div><span>Готовность периода</span><strong>{report.completionPercent}%</strong></div>
              <div className="work-progress"><span style={{ width: `${report.completionPercent}%` }} /></div>
            </div>
            <div className="report-columns">
              <section>
                <span>Выполненные задачи</span>
                <p>{report.completedTasks}</p>
              </section>
              <section>
                <span>Текущее состояние дел</span>
                <p>{report.currentState}</p>
              </section>
              <section className={report.blockers ? "has-risk" : ""}>
                <span>Блокеры</span>
                <p>{report.blockers || "Блокеров нет"}</p>
              </section>
              <section>
                <span>Следующие шаги</span>
                <p>{report.nextSteps || "Не указаны"}</p>
              </section>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

type ModuleViewType =
  | "mini-app"
  | "info"
  | "media"
  | "rko-stats"
  | "media-stats"
  | "accounting";

const MODULE_CONTENT: Record<
  ModuleViewType,
  {
    eyebrow: string;
    title: string;
    description: string;
    status: string;
    stats: { label: string; value: string; hint: string }[];
    listTitle: string;
    listSubtitle: string;
    rows: { title: string; meta: string; value: string; state: string }[];
    noteTitle: string;
    notes: { title: string; text: string }[];
  }
> = {
  "mini-app": {
    eyebrow: "Мобильный продукт",
    title: "Mini App",
    description: "Управление клиентским Mini App, сценариями и ключевыми показателями.",
    status: "Версия 2.4 · работает",
    stats: [
      { label: "Пользователи", value: "1 248", hint: "+14% за месяц" },
      { label: "Запуски", value: "6 840", hint: "за 30 дней" },
      { label: "Конверсия", value: "32,8%", hint: "+4,1 п.п." },
      { label: "Доступность", value: "99,98%", hint: "без сбоев" },
    ],
    listTitle: "Сценарии Mini App",
    listSubtitle: "Основные пользовательские маршруты",
    rows: [
      { title: "Подбор оффера", meta: "Каталог → заявка", value: "2 914", state: "Активен" },
      { title: "Статус заявки", meta: "Проверка этапа лида", value: "1 806", state: "Активен" },
      { title: "Связь с менеджером", meta: "Чат и обратный звонок", value: "742", state: "Активен" },
    ],
    noteTitle: "Последние обновления",
    notes: [
      { title: "Новая карточка оффера", text: "Добавлены условия, выплата и короткий путь до заявки." },
      { title: "Уведомления", text: "Клиент получает сообщение при смене статуса заявки." },
    ],
  },
  info: {
    eyebrow: "База знаний",
    title: "Инфораздел",
    description: "Инструкции, регламенты и материалы для ежедневной работы команды.",
    status: "24 материала",
    stats: [
      { label: "Инструкции", value: "12", hint: "актуальные версии" },
      { label: "Регламенты", value: "7", hint: "для всех ролей" },
      { label: "Обновлено", value: "5", hint: "за эту неделю" },
      { label: "Прочитано", value: "84%", hint: "сотрудников" },
    ],
    listTitle: "Популярные материалы",
    listSubtitle: "То, что чаще всего открывает команда",
    rows: [
      { title: "Как квалифицировать новый лид", meta: "Инструкция · 8 минут", value: "186", state: "Обновлено" },
      { title: "Регламент работы с РКО", meta: "Регламент · 12 минут", value: "143", state: "Актуально" },
      { title: "Целевые действия по банкам", meta: "Справочник · 6 минут", value: "119", state: "Актуально" },
    ],
    noteTitle: "Для быстрого старта",
    notes: [
      { title: "Новому сотруднику", text: "Пройдите вводный маршрут и проверьте доступы к рабочим каналам." },
      { title: "Перед запуском оффера", text: "Сверьте ставку, ЦД и ограничения в последней версии регламента." },
    ],
  },
  media: {
    eyebrow: "Premium Private",
    title: "Медиа",
    description: "Контент, публикации и медиаактивности премиального направления.",
    status: "8 кампаний в работе",
    stats: [
      { label: "Публикации", value: "42", hint: "за месяц" },
      { label: "Охват", value: "1,84 млн", hint: "+22%" },
      { label: "Переходы", value: "31 260", hint: "CTR 1,7%" },
      { label: "Лиды", value: "1 096", hint: "из медиа" },
    ],
    listTitle: "Активные кампании",
    listSubtitle: "Текущие размещения и результат",
    rows: [
      { title: "РКО для предпринимателей", meta: "Telegram · 12 размещений", value: "486 лидов", state: "В эфире" },
      { title: "Дебетовая карта Premium", meta: "Influencer · 8 размещений", value: "341 лид", state: "В эфире" },
      { title: "Регистрация бизнеса", meta: "Shorts · 14 роликов", value: "269 лидов", state: "Оптимизация" },
    ],
    noteTitle: "Фокус команды",
    notes: [
      { title: "Усилить РКО", text: "Лучший результат дают короткие кейсы с конкретной выгодой для ИП." },
      { title: "Проверить креативы", text: "Три публикации вышли ниже целевого CTR и требуют новой подачи." },
    ],
  },
  "rko-stats": {
    eyebrow: "Admin Panel",
    title: "Статистика РКО",
    description: "Полная воронка РКО: заявки, открытия, целевые действия и выплаты.",
    status: "Данные обновлены 5 минут назад",
    stats: [
      { label: "Заявки", value: "418", hint: "+18,4%" },
      { label: "Открыто счетов", value: "164", hint: "39,2% от заявок" },
      { label: "Выполнено ЦД", value: "112", hint: "68,3% от открытий" },
      { label: "Начислено", value: "3,86 млн ₽", hint: "+420 тыс. ₽" },
    ],
    listTitle: "Банки и результат",
    listSubtitle: "Сводка по активным РКО-офферам",
    rows: [
      { title: "Т-Банк", meta: "126 заявок · 54 открытия", value: "1 642 000 ₽", state: "43%" },
      { title: "Точка", meta: "104 заявки · 47 открытий", value: "1 118 000 ₽", state: "45%" },
      { title: "Альфа-Банк", meta: "92 заявки · 36 открытий", value: "714 000 ₽", state: "39%" },
    ],
    noteTitle: "Контрольные точки",
    notes: [
      { title: "12 заявок без статуса", text: "Не получено обновление банка более 24 часов." },
      { title: "Рост конверсии", text: "Точка прибавила 6 п.п. после обновления первичного скрипта." },
    ],
  },
  "media-stats": {
    eyebrow: "Admin Panel",
    title: "Статистика медиа",
    description: "Экономика медиа: охваты, переходы, лиды и стоимость результата.",
    status: "Все каналы подключены",
    stats: [
      { label: "Охват", value: "4,7 млн", hint: "+31%" },
      { label: "Переходы", value: "82 410", hint: "CTR 1,75%" },
      { label: "Лиды", value: "2 346", hint: "CR 2,85%" },
      { label: "Средний CPL", value: "684 ₽", hint: "−9,4%" },
    ],
    listTitle: "Каналы привлечения",
    listSubtitle: "Результат и стоимость лида",
    rows: [
      { title: "Telegram", meta: "1,8 млн охвата · 1 104 лида", value: "612 ₽ CPL", state: "Лучший" },
      { title: "Influencer", meta: "1,3 млн охвата · 742 лида", value: "738 ₽ CPL", state: "Стабильно" },
      { title: "Shorts / Reels", meta: "980 тыс. охвата · 388 лидов", value: "804 ₽ CPL", state: "Рост" },
    ],
    noteTitle: "Рекомендации",
    notes: [
      { title: "Перераспределить бюджет", text: "Telegram сохраняет лучший CPL при достаточном объёме трафика." },
      { title: "Масштабировать видео", text: "Короткие кейсы растут третью неделю подряд и готовы к расширению." },
    ],
  },
  accounting: {
    eyebrow: "Admin Panel",
    title: "Бухгалтерский учёт",
    description: "Начисления, выплаты партнёрам, расходы и закрывающие документы.",
    status: "Июль 2026 · открыт",
    stats: [
      { label: "Начислено", value: "8,42 млн ₽", hint: "за июль" },
      { label: "Выплачено", value: "6,18 млн ₽", hint: "73,4%" },
      { label: "К выплате", value: "2,24 млн ₽", hint: "46 операций" },
      { label: "Расходы", value: "1,31 млн ₽", hint: "15,6% оборота" },
    ],
    listTitle: "Ближайшие операции",
    listSubtitle: "Очередь выплат и документов",
    rows: [
      { title: "Выплаты партнёрам", meta: "24 получателя · реестр №0724", value: "1 286 400 ₽", state: "К оплате" },
      { title: "Медиа-размещения", meta: "11 актов · июль", value: "642 000 ₽", state: "Проверка" },
      { title: "Операционные расходы", meta: "18 документов", value: "308 700 ₽", state: "Согласовано" },
    ],
    noteTitle: "Требует внимания",
    notes: [
      { title: "4 документа без подписи", text: "Закрывающие документы ожидают подтверждения контрагентов." },
      { title: "Сверка завершена на 92%", text: "Осталось проверить три банковские операции за 23 июля." },
    ],
  },
};

function ModuleView({ type }: { type: ModuleViewType }) {
  const content = MODULE_CONTENT[type];

  return (
    <>
      <div className="page-title compact-title module-title">
        <div>
          <span className="eyebrow">{content.eyebrow}</span>
          <h1>{content.title}</h1>
          <p>{content.description}</p>
        </div>
        <span className="module-status"><i />{content.status}</span>
      </div>

      <div className="module-kpis">
        {content.stats.map((stat) => (
          <article key={stat.label}>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
            <small>{stat.hint}</small>
          </article>
        ))}
      </div>

      <div className="module-layout">
        <Panel title={content.listTitle} subtitle={content.listSubtitle} className="module-list-panel">
          <div className="module-list">
            {content.rows.map((row, index) => (
              <article key={row.title}>
                <span className="module-index">{String(index + 1).padStart(2, "0")}</span>
                <div><strong>{row.title}</strong><small>{row.meta}</small></div>
                <div className="module-value"><strong>{row.value}</strong><small>{row.state}</small></div>
              </article>
            ))}
          </div>
        </Panel>

        <Panel title={content.noteTitle} subtitle="Актуально на текущий период" className="module-notes-panel">
          <div className="module-notes">
            {content.notes.map((note) => (
              <article key={note.title}>
                <i />
                <div><strong>{note.title}</strong><p>{note.text}</p></div>
              </article>
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
        <div><span className="eyebrow">Premium Private</span><h1>Админка</h1><p>Ключи регистрации, доступы участников и журнал входов.</p></div>
        <button className="primary-button" onClick={onNewKey}>＋ Создать ключ</button>
      </div>
      <div className="two-columns">
        <Panel title="Ключи доступа" subtitle="Для регистрации новых участников">
          <div className="access-keys">
            {[
              ["USER-••••••••", "Участник", "Активен", "без ограничения"],
              ["LEAD-••••••••", "Лидогенератор", "Активен", "без ограничения"],
              ["ADMIN-••••••••", "Администратор", "Активен", "без ограничения"],
            ].map((key) => <div key={key[0]}><code>{key[0]}</code><span><strong>{key[1]}</strong><small>{key[2]} · {key[3]}</small></span><button onClick={onNewKey}>Сменить</button></div>)}
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

function ReportModal({
  users,
  onClose,
  onSave,
}: {
  users: User[];
  onClose: () => void;
  onSave: (report: Omit<TeamReport, "id" | "createdAt">) => Promise<void>;
}) {
  const teamLeads = users.filter((user) => user.role === "Тимлид");
  const firstLead = teamLeads[0] ?? users[0];
  const [teamLead, setTeamLead] = useState(firstLead?.name ?? "");
  const [team, setTeam] = useState(firstLead?.team ?? "");
  const [period, setPeriod] = useState("20–26 июля");
  const [completedTasks, setCompletedTasks] = useState("");
  const [currentState, setCurrentState] = useState("");
  const [blockers, setBlockers] = useState("");
  const [nextSteps, setNextSteps] = useState("");
  const [completionPercent, setCompletionPercent] = useState(75);
  const [status, setStatus] = useState("По плану");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  return (
    <div className="modal-layer">
      <button className="modal-scrim" onClick={onClose} aria-label="Закрыть окно" />
      <form
        className="modal report-modal"
        onSubmit={async (event) => {
          event.preventDefault();
          setSaving(true);
          setError("");
          try {
            await onSave({
              teamLead,
              team,
              period,
              completedTasks,
              currentState,
              blockers,
              nextSteps,
              completionPercent,
              status,
            });
          } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : "Не удалось сохранить отчёт");
            setSaving(false);
          }
        }}
      >
        <div className="modal-head">
          <div><h2>Новый отчёт тимлида</h2><p>Зафиксируйте результат и текущее состояние команды.</p></div>
          <button type="button" onClick={onClose}>×</button>
        </div>
        <div className="report-form">
          <label>
            <span>Тимлид</span>
            <select
              value={teamLead}
              onChange={(event) => {
                const next = users.find((user) => user.name === event.target.value);
                setTeamLead(event.target.value);
                if (next) setTeam(next.team);
              }}
            >
              {(teamLeads.length ? teamLeads : users).map((user) => (
                <option value={user.name} key={user.id}>{user.name}</option>
              ))}
            </select>
          </label>
          <label><span>Команда</span><input value={team} onChange={(event) => setTeam(event.target.value)} required /></label>
          <label><span>Период</span><input value={period} onChange={(event) => setPeriod(event.target.value)} required /></label>
          <label>
            <span>Статус</span>
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option>По плану</option>
              <option>Есть риски</option>
              <option>Завершено</option>
            </select>
          </label>
          <label className="full"><span>Выполненные задачи</span><textarea value={completedTasks} onChange={(event) => setCompletedTasks(event.target.value)} placeholder="Например: закрыли 9 ЦД; проверили доставки; перераспределили лиды" required /></label>
          <label className="full"><span>Текущее состояние дел</span><textarea value={currentState} onChange={(event) => setCurrentState(event.target.value)} placeholder="Что происходит сейчас в команде и на каком этапе работа" required /></label>
          <label className="full"><span>Блокеры и проблемы</span><textarea value={blockers} onChange={(event) => setBlockers(event.target.value)} placeholder="Можно оставить пустым, если блокеров нет" /></label>
          <label className="full"><span>Следующие шаги</span><textarea value={nextSteps} onChange={(event) => setNextSteps(event.target.value)} placeholder="Что команда сделает дальше" /></label>
          <label className="full report-range">
            <span>Готовность периода <strong>{completionPercent}%</strong></span>
            <input type="range" min="0" max="100" step="5" value={completionPercent} onChange={(event) => setCompletionPercent(Number(event.target.value))} />
          </label>
          {error && <p className="form-error full">{error}</p>}
          <div className="report-form-actions full">
            <button type="button" className="secondary-button" onClick={onClose}>Отмена</button>
            <button type="submit" className="primary-button" disabled={saving}>{saving ? "Сохраняем…" : "Сохранить отчёт"}</button>
          </div>
        </div>
      </form>
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
  const liveSourceStats = buildSourceStats(leads);
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
        {type === "revenue" && <div className="metric-list sources">{liveSourceStats.map((source, index) => <div key={source.name}><span className="rank">{index + 1}</span><i style={{ background: source.color }} /><span><strong>{source.name}</strong><small>{source.leads} лидов</small></span><b>{money(source.revenue)}</b></div>)}</div>}
        {type === "conversion" && <div className="metric-list sources">{[...liveSourceStats].sort((a, b) => b.conversion - a.conversion).map((source, index) => <div key={source.name}><span className="rank">{index + 1}</span><i style={{ background: source.color }} /><span><strong>{source.name}</strong><small>{source.leads} лидов</small></span><div className="progress"><span style={{ width: `${Math.min(100, source.conversion)}%`, background: source.color }} /></div><b>{formatPercent(source.conversion)}</b></div>)}</div>}
        {type === "users" && <div className="metric-list">{users.map((user) => <button key={user.id} onClick={() => openUser(user.id)}><Avatar initials={user.initials} /><span><strong>{user.name}</strong><small>{user.role} · {user.team}</small></span><span className={`user-state ${user.status === "Активен" ? "is-active" : ""}`}>● {user.status}</span><i>›</i></button>)}</div>}
        {type === "sessions" && <div className="metric-list">{users.filter((user) => {
          if (!user.lastLoginAt) return user.lastLogin.startsWith("Сегодня");
          const loginDate = new Date(user.lastLoginAt);
          return !Number.isNaN(loginDate.getTime()) && loginDate >= startOfDay(new Date());
        }).map((user) => <button key={user.id} onClick={() => openUser(user.id)}><Avatar initials={user.initials} /><span><strong>{user.name}</strong><small>Вход: {user.lastLogin.replace("Сегодня, ", "")}</small></span><b>{user.session}</b><i>›</i></button>)}</div>}
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
