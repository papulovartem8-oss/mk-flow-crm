"use client";

import { Fragment, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  SquaresFour,
  Bank,
  Megaphone,
  Lightbulb,
  DeviceMobile,
  BookOpen,
  UsersThree,
  Broadcast,
  ShieldCheck,
  ChartBar,
  ChartPieSlice,
  Receipt,
  FileText,
  ClipboardText,
  type Icon,
} from "@phosphor-icons/react";

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
  | "accounting"
  | "blogs";

type UserRole = "leadgen" | "teamlead" | "leader" | "influencer" | "admin";
type UserStatus = "Bronze" | "Silver" | "Gold" | "Platinum";

type Agent = {
  name: string;
  team: string;
  role: UserRole;
  status: UserStatus;
};

const ROLE_LABELS: Record<UserRole, string> = {
  leadgen: "Lead Generator",
  teamlead: "Team Lead",
  leader: "Leader",
  influencer: "Influencer",
  admin: "Администратор",
};

// Коды доступа проверяются на сервере (lib/session.ts, роут /api/auth) —
// в клиентском коде их больше нет.

type NavGroup = {
  label: string;
  roles: UserRole[];
  items: { id: View; label: string; icon: Icon }[];
};

type LeadStatus = "Новый" | "В работе" | "Успешно" | "Отказ";
type Period = "За всё время" | "День" | "Неделя" | "Месяц";
const PERIOD_DESCRIPTIONS: Record<Period, string> = {
  "За всё время": "Весь доступный период",
  "День": "С 00:00 до 23:59 сегодня",
  "Неделя": "С понедельника по воскресенье",
  "Месяц": "С первого по последнее число месяца",
};

// Направления офферов (ТЗ) и статусы оффера по лиду.
type Direction = "РКО" | "Регбиз" | "Беттинг" | "МФО";
type OfferStatus = "Оформляется" | "Ждёт сверки" | "Одобрен";
type TrafficKind = "Онлайн" | "Оффлайн";

const DIRECTIONS: Direction[] = ["РКО", "Регбиз", "Беттинг", "МФО"];
const OFFER_STATUSES: OfferStatus[] = ["Оформляется", "Ждёт сверки", "Одобрен"];

type OfferItem = {
  bank: string;
  product: string;
  stage: string;
  payout: number;
  cdCost: number;
  delivery: string;
  status?: OfferStatus;
  gross?: number; // сколько получаем МЫ от партнёрки (макс. ставка оффера)
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
  issue?: "Нет контакта" | "Нет суммы" | "Низкое качество" | "Застрял" | "Не отвечает" | "Неверно читает указания" | "Блокировка 115-ФЗ" | "Нет банка в городе" | "Проблемы с пропиской";
  ai: number;
  offers: OfferItem[];
  username?: string;
  traffic?: TrafficKind;
  direction?: Direction;
  ipDate?: string;
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

function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const escape = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
  const csv = [headers, ...rows].map((row) => row.map(escape).join(",")).join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

// Placeholder bindings keep legacy stat markup inert; the real resource form lives in MediaView.
const adding = false;
const resourceName = "";
const resourceUrl = "";
const resourceType = "Telegram";
const setResourceName = (_value: string) => {};
const setResourceUrl = (_value: string) => {};
const setResourceType = (_value: string) => {};
const setAdding = (_value: boolean) => {};
const setResources = (_updater: (current: MediaResource[]) => unknown) => {};

// Правильное склонение «лид»: 1 лид, 2 лида, 5 лидов.
const leadWord = (n: number) => {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "лид";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "лида";
  return "лидов";
};

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Основное",
    roles: ["leadgen", "teamlead", "leader", "influencer", "admin"],
    items: [
      { id: "overview", label: "Дашборд", icon: SquaresFour },
      { id: "offers", label: "Офферы", icon: Bank },
      { id: "leads", label: "Лидогенерация", icon: Megaphone },
      { id: "analytics", label: "Инсайды", icon: Lightbulb },
      { id: "mini-app", label: "Mini App", icon: DeviceMobile },
      { id: "info", label: "Инфораздел", icon: BookOpen },
      { id: "blogs", label: "Блоки и задачи", icon: ClipboardText },
    ],
  },
  {
    label: "Premium Private",
    roles: ["teamlead", "leader", "influencer", "admin"],
    items: [
      { id: "teams", label: "Команда", icon: UsersThree },
      { id: "media", label: "Медиа", icon: Broadcast },
      { id: "access", label: "Админка", icon: ShieldCheck },
    ],
  },
  {
    label: "Admin Panel",
    roles: ["admin"],
    items: [
      { id: "rko-stats", label: "Статистика РКО", icon: ChartBar },
      { id: "media-stats", label: "Статистика медиа", icon: ChartPieSlice },
      { id: "accounting", label: "Бухгалтерский учёт", icon: Receipt },
      { id: "reports", label: "Отчёты", icon: FileText },
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

// Статус оффера выводим из его этапа/доставки, чтобы не было противоречий
// («Оформляется», но «ЦД выполнено»).
function offerStatusFromStage(offer: OfferItem): OfferStatus {
  const s = `${offer.stage} ${offer.delivery}`.toLowerCase();
  if (/выплачен|одобрен|выполнено|вышел на работу/.test(s)) return "Одобрен";
  if (/ждём|ждем|сверк|проверк|ожида|выполняется|доставк/.test(s)) return "Ждёт сверки";
  return "Оформляется";
}

// Направление определяем по офферу (банк = РКО, займ = МФО и т.д.), чтобы
// направление лида совпадало с его офферами.
function offerDirection(offer: OfferItem): Direction {
  const s = `${offer.bank} ${offer.product}`.toLowerCase();
  if (/займ|мфо|заём|займер|манимен|веб-займ/.test(s)) return "МФО";
  // Осторожно: «дебет» содержит «бет» — матчим только явные беттинг-термины.
  if (/ставк|беттинг|casino|казино|fonbet|winline|betboom|1xstavka/.test(s)) return "Беттинг";
  return "РКО";
}

// Полный каталог офферов по направлению — в пути лида показываем ВСЕ, даже
// ещё не оформленные (ТЗ: статусы должны быть у всех, просто «Не оформлен»).
const DIRECTION_CATALOG: Record<Direction, string[]> = {
  "Регбиз": ["Регистрация бизнеса", "ИП на НПД", "Открытие расчётного счёта"],
  "РКО": ["Альфа-Банк", "Т-Банк", "ВТБ", "Газпромбанк", "Уралсиб", "ОТП"],
  "Беттинг": ["1xStavka", "Fonbet", "Winline", "Betboom"],
  "МФО": ["Займер", "МаниМен", "Веб-займ", "OTP Займ"],
};

// Дозаполняет демо-лиды полями ТЗ. Реальные лиды с формы приходят готовыми.
function normalizeLead(lead: Lead, index: number): Lead {
  const offers = lead.offers.map((offer) => ({
    ...offer,
    status: offerStatusFromStage(offer),
    gross: offer.gross ?? Math.round(offer.payout * 1.45),
  }));
  return {
    ...lead,
    username: lead.username ?? lead.telegram.replace("@", ""),
    traffic: lead.traffic ?? (index % 3 === 0 ? "Оффлайн" : "Онлайн"),
    direction: offers.length ? offerDirection(offers[0]) : (lead.direction ?? DIRECTIONS[index % DIRECTIONS.length]),
    ipDate: lead.ipDate ?? `${5 + (index % 20)}.07.2026`,
    offers,
  };
}

// Деньги по лиду (ТЗ):
// Баланс = заработано (офферы со статусом «Одобрен»).
// Прогноз = потенциал по всем заявкам (все офферы).
// Наша прибыль = (наша выручка − выплата агенту) по одобренным офферам.
const offerGross = (offer: OfferItem) => offer.gross ?? Math.round(offer.payout * 1.45);
const leadForecast = (lead: Lead) => lead.offers.reduce((sum, offer) => sum + offer.payout, 0);
const leadBalance = (lead: Lead) =>
  lead.offers
    .filter((offer) => offer.status === "Одобрен")
    .reduce((sum, offer) => sum + offer.payout, 0);
const leadProfit = (lead: Lead) =>
  lead.offers
    .filter((offer) => offer.status === "Одобрен")
    .reduce((sum, offer) => sum + (offerGross(offer) - offer.payout), 0);

// Связки (способы привлечения). Рекомендуемую система выбирает сама — по
// числу приведённых лидов (ТЗ).
type Bundle = {
  id: number;
  name: string;
  channel: string;
  traffic: TrafficKind;
  leads: number;
  conversion: number;
  description: string;
};

const BUNDLES: Bundle[] = [
  { id: 1, name: "Reels «Карта за 5 минут»", channel: "Instagram Reels", traffic: "Онлайн", leads: 148, conversion: 34, description: "Короткое видео с оффером РКО. В шапке — ссылка на бота. Заявки идут сразу в CRM по метке reels-rko." },
  { id: 2, name: "Telegram-посев «Дебетовки»", channel: "Telegram Ads", traffic: "Онлайн", leads: 96, conversion: 28, description: "Посев в тематических каналах. Креатив — сравнение банков, СТА на оформление по реф-ссылке." },
  { id: 3, name: "Оффлайн-стойка ТЦ", channel: "Промо в ТЦ", traffic: "Оффлайн", leads: 72, conversion: 41, description: "Живой промоутер у стойки. Оформление на планшете, курьер довозит карту. Высокая конверсия, но дороже." },
  { id: 4, name: "Шортсы «МФО без отказа»", channel: "YouTube Shorts", traffic: "Онлайн", leads: 54, conversion: 22, description: "Ролики под МФО-офферы. Работает на широкую аудиторию, конверсия ниже, но объём большой." },
  { id: 5, name: "Партнёрский обзор блогера", channel: "Блогер-запуск", traffic: "Онлайн", leads: 38, conversion: 37, description: "Интеграция у блогера через influencer-роль. Тёплый трафик, высокий чек." },
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

const sourceStats = [
  { name: "Авито", leads: 58, revenue: 842600, conversion: 32.4, color: "#bdff38" },
  { name: "Яндекс", leads: 42, revenue: 611900, conversion: 27.1, color: "#a78bfa" },
  { name: "Telegram", leads: 36, revenue: 524800, conversion: 30.6, color: "#46d9ff" },
  { name: "Сайт", leads: 29, revenue: 387400, conversion: 24.8, color: "#ffb35c" },
  { name: "Реферал", leads: 24, revenue: 318200, conversion: 35.9, color: "#ff6e91" },
  { name: "Холодный звонок", leads: 19, revenue: 196700, conversion: 16.2, color: "#7f8da6" },
];

const productStats = [
  { name: "РКО", value: 34, color: "#46d9ff" },
  { name: "Регбиз", value: 25, color: "#ffb35c" },
  { name: "Беттинг", value: 23, color: "#a78bfa" },
  { name: "МФО", value: 18, color: "#ff6e91" },
];

const daily = [38, 52, 44, 61, 78, 70, 86, 72, 94, 88, 102, 118, 109, 126];
const hourly = [20, 38, 54, 47, 72, 83, 64, 92, 78, 58, 34, 18];

function StatusBadge({ status }: { status: LeadStatus }) {
  return <span className={`status status-${status.replace(" ", "-").toLowerCase()}`}>{status}</span>;
}

const OFFER_STATUS_CLASS: Record<OfferStatus, string> = {
  "Оформляется": "offer-status-draft",
  "Ждёт сверки": "offer-status-review",
  "Одобрен": "offer-status-approved",
};

function OfferStatusPill({ status }: { status: OfferStatus }) {
  return <span className={`offer-status ${OFFER_STATUS_CLASS[status]}`}>{status}</span>;
}

const DIRECTION_CLASS: Record<Direction, string> = {
  "Регбиз": "dir-regbiz",
  "РКО": "dir-rko",
  "Беттинг": "dir-bet",
  "МФО": "dir-mfo",
};

function DirectionPill({ direction }: { direction: Direction }) {
  return <span className={`dir-pill ${DIRECTION_CLASS[direction]}`}>{direction}</span>;
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
    <div className="period-control-wrap">
      <div className="period-control">
        {(["За всё время", "День", "Неделя", "Месяц"] as Period[]).map((item) => (
          <button
            className={period === item ? "active" : ""}
            key={item}
            title={PERIOD_DESCRIPTIONS[item]}
            onClick={() => setPeriod(item)}
          >
            {item}
          </button>
        ))}
      </div>
      <span className="period-description">{PERIOD_DESCRIPTIONS[period]}</span>
    </div>
  );
}

function StatusPlate({ status }: { status: UserStatus }) {
  return (
    <span className={`status-plate status-${status.toLowerCase()}`}>
      <i />
      {status}
    </span>
  );
}

function LoginScreen({ onLogin }: { onLogin: (agent: Agent) => void }) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Вход проверяется НА СЕРВЕРЕ (/api/auth). Коды доступа в клиенте больше не
  // хранятся — их нельзя подсмотреть в исходниках страницы.
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Введите имя агента");
      return;
    }
    if (!code.trim()) {
      setError("Введите код доступа");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), code: code.trim() }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Неверный код доступа");
        setBusy(false);
        return;
      }
      const agent = (await res.json()) as Agent;
      onLogin(agent);
    } catch {
      setError("Ошибка сети. Попробуйте ещё раз.");
      setBusy(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-aura" aria-hidden="true" />
      <form className="login-card" onSubmit={submit}>
        <div className="login-logo">
          <img src="/mk-logo-transparent.png" alt="Логотип M&K" />
        </div>
        <h1>Платформа M&amp;K</h1>
        <p className="login-sub">Вход по коду доступа. Регистрация закрыта.</p>

        <label className="login-field">
          <span>Имя агента</span>
          <input
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setError("");
            }}
            placeholder="Например, Дмитрий"
            autoComplete="off"
          />
        </label>

        <label className="login-field">
          <span>Код доступа</span>
          <input
            value={code}
            onChange={(event) => {
              setCode(event.target.value);
              setError("");
            }}
            placeholder="MK-XXXX"
            autoComplete="off"
          />
        </label>

        {error && <div className="login-error">{error}</div>}

        <button type="submit" className="login-submit" disabled={busy}>
          {busy ? "Проверяем…" : "Войти"}
        </button>

        <div className="login-hint">
          Нет кода доступа? Обратитесь к своему тимлиду или администратору.
        </div>
      </form>
    </div>
  );
}

type NewsItem = { id: number; title: string; text: string; author: string; role: string; date: string; team?: string };

const INITIAL_NEWS: NewsItem[] = [
  { id: 1, title: "Новый оффер Уралсиб — повышенная ставка", text: "Первые 3 дня выплата по РКО Уралсиб +20%. Налетайте, пока действует акция.", author: "Дмитрий Волков", role: "Leader", date: "Сегодня, 10:20" },
  { id: 2, title: "Стоп по Т-Банку сегодня с 20:00", text: "Плановая сверка на стороне партнёра. Не заводите заявки по Т-Банку вечером.", author: "Анна Сидорова", role: "Team Lead", date: "Вчера, 18:05" },
];

export function CrmDashboard() {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [view, setView] = useState<View>("overview");
  const [period, setPeriod] = useState<Period>("За всё время");
  const [leads, setLeads] = useState<Lead[]>(() => INITIAL_LEADS.map(normalizeLead));
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [reports, setReports] = useState<TeamReport[]>(INITIAL_REPORTS);
  const [news, setNews] = useState<NewsItem[]>(INITIAL_NEWS);
  const [reportModal, setReportModal] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [metricModal, setMetricModal] = useState<string | null>(null);
  const [editingLead, setEditingLead] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Все статусы");
  const [directionFilter, setDirectionFilter] = useState("Все направления");
  const [problemFilter, setProblemFilter] = useState("Все проблемы");
  const [toast, setToast] = useState<string | null>(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [viewTransition, setViewTransition] = useState(false);
  const transitionTimeout = useRef<number | null>(null);
  const [connected, setConnected] = useState<string[]>(["Telegram-бот"]);

  useEffect(() => {
    if (!agent) return; // запросы к API — только после входа (нужна кука сессии)
    let cancelled = false;

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
  }, [agent]);

  useEffect(() => {
    if (!agent) return;
    fetch("/api/ops")
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((payload: { news?: { id: number; title: string; body: string; author: string; role: string; team?: string | null; createdAt: string }[] }) => {
        if (payload.news?.length) setNews(payload.news.map((item) => ({ id: item.id, title: item.title, text: item.body, author: item.author, role: item.role, team: item.team ?? undefined, date: item.createdAt })));
      })
      .catch(() => {});
  }, [agent]);

  // Загружаем лиды из D1. Если база пуста — засеваем демо, чтобы правки
  // сохранялись между заходами.
  useEffect(() => {
    if (!agent) return; // грузим лиды только после входа (API требует куку сессии)
    let cancelled = false;

    fetch("/api/crm-leads")
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((payload: { leads?: Lead[] }) => {
        if (cancelled) return;
        if (payload.leads && payload.leads.length) {
          setLeads(payload.leads.map(normalizeLead));
        } else {
          const seed = INITIAL_LEADS.map(normalizeLead);
          fetch("/api/crm-leads", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ leads: seed }),
          }).catch(() => {});
        }
      })
      .catch(() => {
        // База недоступна — остаются демо-лиды из useState.
      });

    return () => {
      cancelled = true;
    };
  }, [agent]);

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
      const matchesDirection =
        directionFilter === "Все направления" || lead.direction === directionFilter;
      return matchesSearch && matchesStatus && matchesDirection;
    });
  }, [leads, search, statusFilter, directionFilter]);

  const problemLeads = leads.filter(
    (lead) => lead.issue && (problemFilter === "Все проблемы" || lead.issue === problemFilter),
  );

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2400);
  };

  const publishNews = (title: string, text: string) => {
    if (!agent) return;
    setNews((current) => [
      { id: Date.now(), title, text, author: agent.name, role: ROLE_LABELS[agent.role], date: "Только что", team: agent.team },
      ...current,
    ]);
    void fetch("/api/ops", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "news", title, text, author: agent.name, role: ROLE_LABELS[agent.role], team: agent.team }) }).catch(() => {});
    showToast("Новость опубликована — видна всем участникам");
  };

  const deleteNews = (id: number) => {
    setNews((current) => current.filter((item) => item.id !== id));
    void fetch("/api/ops", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "news", id }) }).catch(() => {});
  };

  const updateLead = (field: keyof Lead, value: string | number) => {
    if (!selectedLeadId) return;
    setLeads((current) =>
      current.map((lead) => (lead.id === selectedLeadId ? { ...lead, [field]: value } : lead)),
    );
  };

  const updateOfferStatus = (offerIndex: number, status: OfferStatus) => {
    if (!selectedLeadId) return;
    setLeads((current) =>
      current.map((lead) =>
        lead.id === selectedLeadId
          ? {
              ...lead,
              offers: lead.offers.map((offer, index) =>
                index === offerIndex ? { ...offer, status } : offer,
              ),
            }
          : lead,
      ),
    );
  };

  const persistLead = (lead: Lead) => {
    fetch("/api/crm-leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lead }),
    }).catch(() => {
      // Тихо: сеть/база недоступны — лид остаётся в интерфейсе.
    });
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

  if (!agent) {
    return <LoginScreen onLogin={setAgent} />;
  }

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
          {NAV_GROUPS.filter((group) => group.roles.includes(agent.role)).map((group) => (
            <section className="nav-group" key={group.label}>
              <span className="nav-group-label">{group.label}</span>
              <div className="nav-group-items">
                {group.items.map((item) => {
                  const ItemIcon = item.icon;
                  return (
                    <button
                      key={item.id}
                      className={view === item.id ? "active" : ""}
                      onClick={() => navigate(item.id)}
                    >
                      <span className="nav-icon">
                        <ItemIcon size={20} weight={view === item.id ? "fill" : "duotone"} />
                      </span>
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </nav>

        <div className="sidebar-foot">
          <div className="online-dot" />
          <div className="sidebar-foot-info">
            <strong>{agent.name}</strong>
            <small>{agent.team}</small>
            <div className="sidebar-foot-meta">
              <StatusPlate status={agent.status} />
              <span className="sidebar-foot-role">{ROLE_LABELS[agent.role]}</span>
            </div>
          </div>
          <button
            className="logout-btn"
            aria-label="Выйти"
            onClick={() => {
              void fetch("/api/auth", { method: "DELETE" }).catch(() => {});
              setAgent(null);
            }}
          >
            ⎋
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
              placeholder="Поиск…"
              onFocus={() => navigate("leads")}
            />
            <kbd>Ctrl K</kbd>
          </div>
          <div className="top-actions">
            <button className="avatar-button" onClick={() => navigate("settings")} aria-label="Профиль">
              <img src="/mk-logo-transparent.png" alt="M&K" />
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
              news={news.filter((item) => !item.team || item.team === agent.team)}
              canManageNews={agent.role === "admin" || agent.role === "leader" || agent.role === "teamlead"}
              deleteNews={deleteNews}
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
              directionFilter={directionFilter}
              setDirectionFilter={setDirectionFilter}
              onOpen={(id) => setSelectedLeadId(id)}
              showToast={showToast}
            />
          )}
          {view === "teams" && <TeamsView users={users} openUser={openUser} agent={agent} setMetricModal={setMetricModal} publishNews={publishNews} />}
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
            <AnalyticsView period={period} setPeriod={setPeriod} users={users} openUser={openUser} setMetricModal={setMetricModal} showToast={showToast} />
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
          {view === "mini-app" && <MiniAppView agent={agent} />}
          {view === "info" && <ModuleView type="info" showToast={showToast} />}
          {view === "media" && <MediaView showToast={showToast} />}
          {view === "rko-stats" && <StatsView kind="РКО" showToast={showToast} />}
          {view === "media-stats" && <StatsView kind="Медиа" showToast={showToast} />}
          {view === "accounting" && <AccountingView showToast={showToast} />}
          {view === "blogs" && <BlogsView showToast={showToast} />}
        </div>
      </main>

      {selectedLead && (
        <LeadDrawer
          lead={selectedLead}
          editing={editingLead}
          setEditing={setEditingLead}
          updateLead={updateLead}
          updateOfferStatus={updateOfferStatus}
          onClose={() => {
            setSelectedLeadId(null);
            setEditingLead(false);
          }}
          onSave={() => {
            setEditingLead(false);
            if (selectedLead) persistLead(selectedLead);
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
          showToast={showToast}
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
          openLead={(id) => {
            setMetricModal(null);
            setSelectedLeadId(id);
          }}
          drill={(next) => setMetricModal(next)}
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
  news,
  canManageNews,
  deleteNews,
  setMetricModal,
  openUser,
  navigate,
}: {
  period: Period;
  setPeriod: (period: Period) => void;
  users: User[];
  leads: Lead[];
  news: NewsItem[];
  canManageNews: boolean;
  deleteNews: (id: number) => void;
  setMetricModal: (type: string) => void;
  openUser: (id: number) => void;
  navigate: (view: View) => void;
}) {
  const periodData = {
    "За всё время": { leads: "1 248", revenue: "17 766 247 ₽", conversion: "31,8%", delta: "+24,2%" },
    День: { leads: "19", revenue: "184 200 ₽", conversion: "28,6%", delta: "+12,4%" },
    Неделя: { leads: "86", revenue: "742 800 ₽", conversion: "26,9%", delta: "+8,1%" },
    Месяц: { leads: "208", revenue: "2 881 600 ₽", conversion: "27,4%", delta: "+18,6%" },
  }[period];
  const statusCounts = (["Новый", "В работе", "Успешно", "Отказ"] as LeadStatus[]).map(
    (status) => ({ status, count: leads.filter((lead) => lead.status === status).length }),
  );

  return (
    <div className="overview-page">
      <div className="page-title">
        <div>
          <span className="eyebrow">23 июля · четверг</span>
          <h1>Добрый день, Алексей</h1>
          <p>Вот что происходит с лидами и командами прямо сейчас.</p>
        </div>
        <PeriodControl period={period} setPeriod={setPeriod} />
      </div>

      {news.length > 0 && (
        <div className="news-feed">
          <div className="news-feed-head"><span className="recommend-badge">📢 Новости команды</span></div>
          <div className="news-list">
            {news.slice(0, 3).map((item) => (
              <div key={item.id} className="news-item">
                <div className="news-item-head"><strong>{item.title}</strong><span className="news-meta">{item.author} · {item.role} · {item.date} {canManageNews && <button className="news-delete" onClick={() => deleteNews(item.id)} aria-label="Удалить новость">×</button>}</span></div>
                <p>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

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
          label="Проблемные лиды"
          value="4"
          meta="2 требуют реакции сегодня"
          accent="#ff6e91"
          icon="!"
          onClick={() => setMetricModal("problems")}
        />
        <KpiCard
          label="Баланс"
          value="2 137 400 ₽"
          meta="доступно к выводу"
          accent="#f7c900"
          icon="₽"
          onClick={() => setMetricModal("balance")}
        />
      </div>

      <div className="dashboard-grid">
        <Panel
          title="Динамика лидов"
          subtitle="По дням · нажмите, чтобы увидеть кто принёс"
          className="span-2"
          action={<button className="text-button" onClick={() => setMetricModal("leads")}>Кто принёс →</button>}
        >
          <button className="chart-summary chart-summary-btn" onClick={() => setMetricModal("leads")}>
            <div>
              <strong>208</strong>
              <span>лидов за период</span>
            </div>
            <span className="positive">+18,6%</span>
          </button>
          <BarChart
            values={daily}
            labels={["10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23"]}
          />
        </Panel>

        <Panel title="Распределение по продуктам" subtitle="Нажмите на продукт — какие лиды, откуда пришли, когда оформили">
          <div className="distribution">
            <Donut center="208" label="лидов" />
            <div className="legend legend-clickable">
              {productStats.map((item) => (
                <button key={item.name} onClick={() => setMetricModal(`product:${item.name}`)}>
                  <i style={{ background: item.color }} />
                  <span>{item.name}</span>
                  <strong>{item.value}%</strong>
                  <em className="chev">›</em>
                </button>
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
              <button key={status} onClick={() => setMetricModal(`status:${status}`)}>
                <StatusBadge status={status} />
                <strong>{count}</strong>
                <span>{leadWord(count)}</span>
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
          subtitle="Пик: 16:00–17:00 · нажмите — лиды за сегодня"
          action={<><button className="text-button" onClick={() => setMetricModal("today")}>За сегодня →</button><span className="live-pill">● LIVE</span></>}
        >
          <BarChart
            compact
            values={hourly}
            labels={["09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20"]}
          />
        </Panel>
      </div>
    </div>
  );
}

function LidogenOverview({ leads, showToast }: { leads: Lead[]; showToast: (message: string) => void }) {
  const [openBundle, setOpenBundle] = useState<number | null>(null);
  const [showRecommended, setShowRecommended] = useState(false);
  const online = leads.filter((lead) => lead.traffic === "Онлайн").length;
  const offline = leads.filter((lead) => lead.traffic === "Оффлайн").length;
  const totalTraffic = online + offline || 1;
  const onlinePct = Math.round((online / totalTraffic) * 100);
  const offlinePct = 100 - onlinePct;
  const ranked = [...BUNDLES].sort((a, b) => b.leads - a.leads);
  const recommended = ranked[0];
  const maxLeads = recommended.leads;

  return (
    <div className="lidogen">
      <div className="lidogen-traffic">
        <div className="traffic-card is-online">
          <span className="traffic-label">Онлайн-трафик</span>
          <strong>{online} {leadWord(online)}</strong>
          <div className="traffic-bar"><i style={{ width: `${onlinePct}%` }} /></div>
          <small>{onlinePct}% объёма</small>
        </div>
        <div className="traffic-card is-offline">
          <span className="traffic-label">Оффлайн-трафик</span>
          <strong>{offline} {leadWord(offline)}</strong>
          <div className="traffic-bar"><i style={{ width: `${offlinePct}%` }} /></div>
          <small>{offlinePct}% объёма</small>
        </div>
      </div>

      <div className="lidogen-cols">
        <Panel title="Топ связок" subtitle="Нажмите на связку — откроется описание и материалы">
          <div className="bundle-list">
            {ranked.map((bundle, index) => (
              <div key={bundle.id} className={`bundle-item ${bundle.id === recommended.id ? "is-top" : ""} ${openBundle === bundle.id ? "is-open" : ""}`}>
                <button className="bundle-row" onClick={() => setOpenBundle((current) => (current === bundle.id ? null : bundle.id))}>
                  <span className="bundle-rank">{index + 1}</span>
                  <div className="bundle-main">
                    <strong>{bundle.name}</strong>
                    <small>{bundle.channel} · конверсия {bundle.conversion}%</small>
                    <div className="bundle-bar"><i style={{ width: `${Math.round((bundle.leads / maxLeads) * 100)}%` }} /></div>
                  </div>
                  <div className="bundle-num">
                    <b>{bundle.leads}</b>
                    <span className={`traffic-pill ${bundle.traffic === "Оффлайн" ? "traffic-off" : "traffic-on"}`}>{bundle.traffic}</span>
                  </div>
                </button>
                {openBundle === bundle.id && (
                  <div className="bundle-detail">
                    <p>{bundle.description}</p>
                    <div className="bundle-materials">
                      <span className="mat-title">Материалы для ознакомления</span>
                      <div className="mat-row"><span>📄 Текстовая инструкция</span><button onClick={() => showToast("Материал откроется в Telegram-канале команды")}>Открыть</button></div>
                      <div className="mat-row"><span>🎬 Видео-разбор связки</span><button onClick={() => showToast("Видео откроется в Telegram-канале команды")}>Смотреть</button></div>
                    </div>
                    <button className="secondary-button bundle-contact" onClick={() => showToast("Открываю чат с лидгенщиком (Telegram)")}>💬 Связаться с лидгенщиком</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Panel>

        <div className="lidogen-side">
          <div className="recommend-card">
            <span className="recommend-badge">★ Рекомендуемая связка · система выбрала по числу лидов</span>
            <h3>{recommended.name}</h3>
            <p className="recommend-desc">{recommended.description}</p>
            <div className="recommend-meta">
              <div><span>Лидов</span><strong>{recommended.leads}</strong></div>
              <div><span>Конверсия</span><strong>{recommended.conversion}%</strong></div>
              <div><span>Канал</span><strong>{recommended.channel}</strong></div>
            </div>
            <button className="primary-button recommend-open" onClick={() => setShowRecommended((value) => !value)}>
              {showRecommended ? "Свернуть связку ×" : "Открыть связку и материалы"}
            </button>
            {showRecommended && (
              <div className="bundle-detail recommend-detail">
                <p>{recommended.description}</p>
                <div className="bundle-materials">
                  <span className="mat-title">Материалы для ознакомления</span>
                  <div className="mat-row"><span>📄 Текстовая инструкция</span><button onClick={() => showToast("Материал откроется в Telegram-канале команды")}>Открыть</button></div>
                  <div className="mat-row"><span>🎬 Видео-разбор связки</span><button onClick={() => showToast("Видео откроется в Telegram-канале команды")}>Смотреть</button></div>
                </div>
                <button className="secondary-button bundle-contact" onClick={() => showToast("Открываю чат с лидгенщиком (Telegram)")}>💬 Связаться с лидгенщиком</button>
              </div>
            )}
          </div>

          <div className="review-card">
            <div className="review-head"><span className="review-avatar">СК</span><div><strong>Рецензия обработчика</strong><small>Сергей Козлов · обработчик трафика · пишет в боте/CRM</small></div></div>
            <p>Онлайн-связки дают объём, но конверсия ниже — много «холодных» заявок без ЦД. Оффлайн-стойка конвертит лучше всего (41%), стоит усилить. По МФО-шортсам качество лидов слабое, рекомендую сместить бюджет в РКО-Reels.</p>
            <div className="review-foot">Рецензия может быть по всему трафику или по конкретному лиду. Обработчик оставляет её в Telegram-боте, данные подгружаются в CRM.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LeadsView({
  leads,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  directionFilter,
  setDirectionFilter,
  onOpen,
  showToast,
}: {
  leads: Lead[];
  search: string;
  setSearch: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  directionFilter: string;
  setDirectionFilter: (value: string) => void;
  onOpen: (id: number) => void;
  showToast: (message: string) => void;
}) {
  return (
    <>
      <div className="page-title compact-title">
        <div>
          <span className="eyebrow">Лидогенерация</span>
          <h1>Связки и лиды</h1>
          <p>Объём трафика, топ связок и полная база заявок. Лиды приходят из связок.</p>
        </div>
      </div>
      <LidogenOverview leads={leads} showToast={showToast} />
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
          <select value={directionFilter} onChange={(event) => setDirectionFilter(event.target.value)}>
            <option>Все направления</option>
            <option>РКО</option>
            <option>Регбиз</option>
            <option>Беттинг</option>
            <option>МФО</option>
          </select>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option>Все статусы</option>
            <option>Новый</option>
            <option>В работе</option>
            <option>Успешно</option>
            <option>Отказ</option>
          </select>
          <button className="secondary-button" onClick={() => { downloadCsv("leads.csv", ["Клиент", "Источник", "Продукт", "Статус", "Сумма", "Менеджер"], leads.map((lead) => [lead.client, lead.source, lead.product, lead.status, lead.amount, lead.manager])); showToast("Выгрузка лидов скачана"); }}>⇩ Экспорт</button>
        </div>
        <div className="search-hint">
          <span>Искать можно по имени, телефону, @нику или источнику. Примеры:</span>
          <div className="search-examples">
            {["Авито", "Яндекс", "Дебет", "Анна"].map((ex) => (
              <button key={ex} type="button" onClick={() => setSearch(ex)}>{ex}</button>
            ))}
            {search && <button type="button" className="search-clear" onClick={() => setSearch("")}>× сбросить</button>}
          </div>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Клиент</th>
                <th>Направление</th>
                <th>Трафик</th>
                <th>Статус</th>
                <th>Офферы</th>
                <th>Баланс</th>
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
                  <td data-label="Направление">{lead.direction ? <DirectionPill direction={lead.direction} /> : <span className="muted">—</span>}</td>
                  <td data-label="Трафик"><span className={`traffic-pill ${lead.traffic === "Оффлайн" ? "traffic-off" : "traffic-on"}`}>{lead.traffic ?? "—"}</span></td>
                  <td data-label="Статус"><StatusBadge status={lead.status} /></td>
                  <td data-label="Офферы"><strong>{lead.offers.length}</strong></td>
                  <td data-label="Баланс"><strong>{leadBalance(lead) ? money(leadBalance(lead)) : "—"}</strong></td>
                  <td data-label="Ответственный">{lead.manager}</td>
                  <td data-label="Дата"><span className="muted">{lead.created}</span></td>
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

function TeamsView({ users, openUser, agent, setMetricModal, publishNews }: { users: User[]; openUser: (id: number) => void; agent: Agent; setMetricModal: (type: string) => void; publishNews: (title: string, text: string) => void }) {
  const isAdmin = agent.role === "admin";
  const visibleUsers = isAdmin ? users : users.filter((user) => user.team === agent.team);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [newsTitle, setNewsTitle] = useState("");
  const [newsText, setNewsText] = useState("");
  const publish = () => {
    if (!newsTitle.trim() || !newsText.trim()) return;
    publishNews(newsTitle.trim(), newsText.trim());
    setNewsTitle("");
    setNewsText("");
  };
  const totalRevenue = visibleUsers.reduce((sum, user) => sum + user.revenue, 0);
  const totalLeads = visibleUsers.reduce((sum, user) => sum + user.leads, 0);
  const avgConv = Math.round((visibleUsers.reduce((sum, user) => sum + user.conversion, 0) / (visibleUsers.length || 1)) * 10) / 10;
  const goal = 3_000_000;
  const goalPct = Math.min(100, Math.round((totalRevenue / goal) * 100));
  const ranked = [...visibleUsers].sort((a, b) => b.revenue - a.revenue);
  const medals = ["🥇", "🥈", "🥉"];
  const teams = [
    { name: "Excellent", lead: "Дмитрий Волков", members: 7, leads: 184, revenue: 1284000, conversion: 52 },
    { name: "Северная", lead: "Анна Сидорова", members: 6, leads: 156, revenue: 984000, conversion: 45 },
    { name: "Blogsphere", lead: "Мария Орлова", members: 5, leads: 98, revenue: 786000, conversion: 55 },
  ];

  return (
    <>
      <div className="page-title compact-title">
        <div>
          <span className="eyebrow">Premium Private · моя команда</span>
          <h1>Команда</h1>
          <p>{isAdmin ? "Вы админ — видите все команды ниже." : "Ваша команда, её результат и участники."}</p>
        </div>
        <button className="primary-button" onClick={() => setMetricModal("invite")}>＋ Создать пользователя</button>
      </div>

      <div className="team-hero">
        <div className="team-hero-top">
          <span className="avatar avatar-team big">{String(agent.team).replace(/[«»]/g, "").slice(0, 1)}</span>
          <div>
            <h2>{agent.team}</h2>
            <p>Тимлид: {agent.name} · {users.length} участников</p>
          </div>
          <div className="team-hero-fire">🔥 в топе недели</div>
        </div>
        <div className="team-hero-stats">
          <div><span>Выручка команды</span><strong>{money(totalRevenue)}</strong></div>
          <div><span>Лидов за месяц</span><strong>{totalLeads}</strong></div>
          <div><span>Ср. конверсия</span><strong>{avgConv}%</strong></div>
        </div>
        <div className="team-goal">
          <div className="team-goal-head"><span>Цель месяца: {money(goal)}</span><b>{goalPct}%</b></div>
          <div className="reward-bar"><i style={{ width: `${goalPct}%` }} /></div>
          <small>До цели осталось {money(Math.max(0, goal - totalRevenue))}</small>
        </div>
      </div>

      <Panel title="📢 Опубликовать новость" subtitle="Появится вкладкой у всех участников платформы на дашборде">
        <div className="news-form">
          <input value={newsTitle} onChange={(event) => setNewsTitle(event.target.value)} placeholder="Заголовок новости" />
          <textarea value={newsText} onChange={(event) => setNewsText(event.target.value)} placeholder="Текст новости для команды…" />
          <button className="primary-button" onClick={publish}>Опубликовать</button>
        </div>
      </Panel>

      <Panel title="Участники команды" subtitle="Нажмите, чтобы открыть профиль">
        <div className="member-list">
          {ranked.map((user, index) => (
            <button key={user.id} className="member-row" onClick={() => openUser(user.id)}>
              <span className="member-medal">{medals[index] ?? index + 1}</span>
              <Avatar initials={user.initials} />
              <div className="member-main">
                <strong>{user.name}</strong>
                <small>{user.role} · {user.leads} {leadWord(user.leads)}</small>
                <div className="bundle-bar"><i style={{ width: `${Math.min(100, Math.round((user.revenue / ranked[0].revenue) * 100))}%` }} /></div>
              </div>
              <div className="member-num">
                <b>{money(user.revenue)}</b>
                <span className={`user-state ${user.status === "Активен" ? "is-active" : ""}`}>● {user.status}</span>
              </div>
            </button>
          ))}
        </div>
      </Panel>

      {isAdmin && (
        <Panel title="Все команды" subtitle="Доступно администратору">
          <div className="team-cards">
            {teams.map((team, index) => (
              <article key={team.name} className="team-card" role="button" tabIndex={0} onClick={() => setSelectedTeam(team.name)} onKeyDown={(event) => { if (event.key === "Enter") setSelectedTeam(team.name); }}>
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
                <div className="progress"><span style={{ width: `${team.conversion * 1.6}%` }} /></div>
              </article>
            ))}
          </div>
          {selectedTeam && <div className="team-detail-panel"><div className="section-title"><h3>Подробная аналитика · {selectedTeam}</h3><button className="row-action" onClick={() => setSelectedTeam(null)}>×</button></div><div className="team-detail-list">{users.filter((user) => user.team === selectedTeam).map((user) => <article key={user.id}><strong>{user.name}</strong><span>Роль: {user.role} · Лиды: {user.leads}</span><span>Выручка: {money(user.revenue)} · Конверсия: {user.conversion}%</span><button className="text-button" onClick={() => openUser(user.id)}>Открыть статистику →</button></article>)}</div></div>}
        </Panel>
      )}
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
                  <td data-label="Роль"><span className="role-pill">{user.role}</span></td>
                  <td data-label="Команда">{user.team}</td>
                  <td data-label="Лиды"><strong>{user.leads}</strong></td>
                  <td data-label="Выручка"><strong>{money(user.revenue)}</strong></td>
                  <td data-label="Конверсия">{user.conversion}%</td>
                  <td data-label="Последний вход">{user.lastLogin}</td>
                  <td data-label="Статус"><span className={`user-state ${user.status === "Активен" ? "is-active" : ""}`}>● {user.status}</span></td>
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
    { name: "Не отвечает", count: 0, color: "#ffb35c" },
    { name: "Блокировка 115-ФЗ", count: 0, color: "#ff6e91" },
    { name: "Нет банка в городе", count: 0, color: "#46d9ff" },
    { name: "Проблемы с пропиской", count: 0, color: "#a78bfa" },
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

const REWARD_PRIZES = [
  { name: "AirPods Pro", threshold: 30, tag: "техника", desc: "Наушники AirPods Pro 2. Выдаём после 30 засчитанных открутов — реально достижимо за пару недель активной работы." },
  { name: "MacBook Air", threshold: 100, tag: "техника", desc: "MacBook Air M3 — рабочий инструмент за 100 открутов. Отличная цель на месяц." },
  { name: "iPhone 16 Pro", threshold: 150, tag: "статус", desc: "iPhone 16 Pro за 150 открутов. Статусный приз для стабильно результативных." },
  { name: "Поездка на Бали", threshold: 300, tag: "путешествия", desc: "Поездка на Бали на двоих за 300 открутов. Главная цель сезона для топов команды." },
];

const AI_INSIGHTS = [
  { icon: "◎", title: "Пик заявок в 16:00", text: "Онлайн-трафик стабильно конвертит лучше во второй половине дня.", detail: "На основе статистики по часам: 62% ЦД происходят в 14:00–17:00. Рекомендация: сдвиньте посевы и прогрев на 13:00–16:00, это может добавить ~15% к конверсии." },
  { icon: "▲", title: "РКО-Reels растёт", text: "Связка «Карта за 5 минут» дала +32% лидов за неделю.", detail: "Анализ связок: Reels-РКО — лидер по приросту (148 лидов, конверсия 34%). Рекомендация: увеличьте бюджет на связку на 20–30%, пока тренд активен." },
  { icon: "!", title: "Просадка по МФО", text: "Конверсия МФО-шортсов упала до 22%.", detail: "Сравнение периодов: МФО-шортсы просели с 31% до 22%, много заявок без ЦД. Рекомендация: проверьте качество трафика и переложите часть бюджета в РКО-Reels." },
];

const IMPORTANT_EVENTS = [
  { date: "Сегодня", text: "Альфа-Банк поднял выплату по дебетовым картам до 6 800 ₽." },
  { date: "Завтра", text: "Стоп приёма заявок по Т-Банку с 20:00 — плановая сверка." },
  { date: "25 июля", text: "Запуск нового оффера Уралсиб (РКО), повышенная ставка первые 3 дня." },
];

const LIFEHACKS = [
  "Оффлайн-стойки в ТЦ дают конверсию 41% — используйте на выходных.",
  "Прикрепляйте видео-разъяснение к рекомендуемой связке — заявки растут на 15%.",
  "Переводите лид в «Ждёт сверки» сразу после ЦД — быстрее апрув и выше баланс.",
];

function InsightsPanel({ showToast }: { showToast: (message: string) => void }) {
  const current = 63;
  const [target, setTarget] = useState<string | null>(null);
  const [quizPick, setQuizPick] = useState<string | null>(null);
  const [showDesc, setShowDesc] = useState(false);
  const [openInsight, setOpenInsight] = useState<string | null>(null);
  const [insights, setInsights] = useState(AI_INSIGHTS);
  const [events, setEvents] = useState(IMPORTANT_EVENTS);
  const [lifehacks, setLifehacks] = useState(LIFEHACKS);
  const [quickEntry, setQuickEntry] = useState<"event" | "lifehack" | "insight" | null>(null);
  const [quickText, setQuickText] = useState("");

  const prize = REWARD_PRIZES.find((item) => item.name === target) ?? REWARD_PRIZES[1];
  const pct = Math.min(100, Math.round((current / prize.threshold) * 100));
  const left = Math.max(0, prize.threshold - current);
  const phrase =
    pct >= 100
      ? "Цель достигнута! Забирай приз 🎉"
      : pct >= 66
        ? "Финишная прямая — осталось совсем чуть-чуть!"
        : pct >= 33
          ? "Отличный темп, ты уже на середине пути."
          : "Хороший старт — вперёд к цели!";
  const suggested = REWARD_PRIZES.find((item) => item.tag === quizPick) ?? REWARD_PRIZES[1];

  return (
    <div className="insights">
      <div className="insights-top">
        <div className="reward-card">
          <span className="recommend-badge">Шкала вознаграждений</span>
          {!target ? (
            <div className="reward-quiz">
              <p className="quiz-q">Что тебя больше мотивирует? Подберём цель под тебя.</p>
              <div className="quiz-options">
                {[
                  { tag: "техника", label: "🎧 Техника и гаджеты" },
                  { tag: "статус", label: "📱 Статусные вещи" },
                  { tag: "путешествия", label: "✈️ Путешествия" },
                ].map((option) => (
                  <button
                    key={option.tag}
                    className={quizPick === option.tag ? "is-picked" : ""}
                    onClick={() => setQuizPick(option.tag)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {quizPick && (
                <div className="quiz-result">
                  <p>Твоя цель: <strong>{suggested.name}</strong> · {suggested.threshold} открутов</p>
                  <button className="primary-button" onClick={() => setTarget(suggested.name)}>Принять цель</button>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="reward-head">
                <select value={target} onChange={(event) => { setTarget(event.target.value); setShowDesc(false); }}>
                  {REWARD_PRIZES.map((item) => (
                    <option key={item.name} value={item.name}>{item.name} · {item.threshold} открутов</option>
                  ))}
                </select>
                <button className="text-button" onClick={() => setShowDesc((value) => !value)}>Подробнее</button>
              </div>
              <div className="reward-progress">
                <div className="reward-bar"><i style={{ width: `${pct}%` }} /></div>
                <div className="reward-nums"><strong>{current}</strong><span>из {prize.threshold} открутов · {pct}%</span></div>
              </div>
              <p className="reward-phrase">{phrase}</p>
              {pct >= 100 && (
                <div className="reward-claim">
                  <strong>🎁 Как забрать приз «{prize.name}»</strong>
                  <p>Напиши куратору — приз выдаём в течение 3 рабочих дней.</p>
                  <div className="reward-claim-row">
                    <code>@mk_curator</code>
                    <button
                      className="primary-button"
                      onClick={() => {
                        if (navigator.clipboard) navigator.clipboard.writeText("@mk_curator").catch(() => {});
                        showToast("Контакт @mk_curator скопирован — напиши в Telegram, чтобы забрать приз");
                      }}
                    >
                      Написать за призом
                    </button>
                  </div>
                </div>
              )}
              {left > 0 && <div className="reward-left">До приза «{prize.name}» осталось <b>{left}</b> открутов</div>}
              {showDesc && <div className="reward-desc">{prize.desc}</div>}
              <button className="text-button reward-reset" onClick={() => { setTarget(null); setQuizPick(null); }}>← Выбрать другую цель</button>
            </>
          )}
        </div>

        <div className="ai-insights">
          <span className="recommend-badge">AI-инсайды · на основе анализа статистики</span>
          <div className="ai-list">
            {insights.map((insight) => (
              <button
                key={insight.title}
                className={`ai-item ${openInsight === insight.title ? "is-open" : ""}`}
                onClick={() => setOpenInsight((current) => (current === insight.title ? null : insight.title))}
              >
                <span className="ai-icon">{insight.icon}</span>
                <div>
                  <strong>{insight.title} <i className="ai-chev">{openInsight === insight.title ? "▾" : "▸"}</i></strong>
                  <p>{insight.text}</p>
                  {openInsight === insight.title && <p className="ai-detail">{insight.detail}</p>}
                </div>
                <span className="ai-delete" role="button" tabIndex={0} onClick={(event) => { event.stopPropagation(); setInsights((current) => current.filter((item) => item.title !== insight.title)); }}>×</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="quick-insight-actions"><button className="secondary-button" onClick={() => setQuickEntry("event")}>＋ Добавить важное событие</button><button className="secondary-button" onClick={() => setQuickEntry("lifehack")}>＋ Добавить лайфхак</button><button className="secondary-button" onClick={() => setQuickEntry("insight")}>＋ Добавить AI-инсайт</button></div>
      {quickEntry && <div className="quick-entry"><input autoFocus value={quickText} onChange={(event) => setQuickText(event.target.value)} placeholder={quickEntry === "event" ? "Например: завтра стоп по Т-Банку" : quickEntry === "lifehack" ? "Например: закрепляйте видео-разъяснение" : "Например: Пик заявок · конверсия выше после 16:00"} /><button className="primary-button" onClick={() => { const text = quickText.trim(); if (!text) return; if (quickEntry === "event") setEvents((current) => [{ date: "Новое", text }, ...current]); else if (quickEntry === "lifehack") setLifehacks((current) => [text, ...current]); else setInsights((current) => [{ icon: "✦", title: text.split("·")[0].trim(), text, detail: "Добавлено вручную администратором." }, ...current]); setQuickText(""); setQuickEntry(null); showToast("Добавлено в инсайты"); }}>Добавить</button><button className="text-button" onClick={() => setQuickEntry(null)}>Отмена</button></div>}
      <div className="insights-bottom">
        <Panel title="Важные события" subtitle="Что нужно учесть в работе">
          <div className="events-list">
            {events.map((event) => (
              <div key={event.text} className="event-row"><span className="event-date">{event.date}</span><p>{event.text}</p><button className="row-action" onClick={() => { if (window.confirm("Удалить это событие?")) { setEvents((current) => current.filter((item) => item.text !== event.text)); showToast("Событие удалено"); } }} aria-label="Удалить событие">×</button></div>
            ))}
          </div>
        </Panel>
        <Panel title="Лайфхаки" subtitle="Как работать эффективнее">
          <div className="lifehack-list">
            {lifehacks.map((tip) => (
              <div key={tip} className="lifehack-row"><span>◆</span><p>{tip}</p><button className="row-action" onClick={() => { if (window.confirm("Удалить этот лайфхак?")) { setLifehacks((current) => current.filter((item) => item !== tip)); showToast("Лайфхак удалён"); } }} aria-label="Удалить лайфхак">×</button></div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function AnalyticsView({
  period,
  setPeriod,
  users,
  openUser,
  setMetricModal,
  showToast,
}: {
  period: Period;
  setPeriod: (period: Period) => void;
  users: User[];
  openUser: (id: number) => void;
  setMetricModal: (type: string) => void;
  showToast: (message: string) => void;
}) {
  return (
    <>
      <div className="page-title compact-title">
        <div>
          <span className="eyebrow">Глубокая статистика</span>
          <h1>Инсайды</h1>
          <p>Источники, конверсия, продукты, команды и динамика.</p>
        </div>
        <div className="title-actions"><PeriodControl period={period} setPeriod={setPeriod} /><button className="secondary-button" onClick={() => { downloadCsv("analytics.csv", ["Источник", "Лиды", "Конверсия"], sourceStats.map((item) => [item.name, item.leads, `${item.conversion}%`])); showToast("Отчёт аналитики скачан"); }}>⇩ Отчёт</button></div>
      </div>
      <InsightsPanel showToast={showToast} />
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
        <Panel title="Продукты" subtitle="Нажмите на продукт — лиды, источники и даты">
          <div className="distribution vertical">
            <Donut center="6" label="категорий" />
            <div className="legend legend-clickable">
              {productStats.map((item) => (
                <button key={item.name} onClick={() => setMetricModal(`product:${item.name}`)}>
                  <i style={{ background: item.color }} /><span>{item.name}</span><strong>{item.value}%</strong><em className="chev">›</em>
                </button>
              ))}
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
    "За всё время": [46, 58, 53, 70, 82, 91, 100],
    День: [22, 38, 31, 52, 47, 68, 74],
    Неделя: [38, 51, 46, 67, 72, 64, 88],
    Месяц: [31, 42, 55, 48, 69, 77, 91],
  }[period] ?? [46, 58, 53, 70, 82, 91, 100];
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
  // Фильтр по команде: «Все команды» + список команд из самих отчётов.
  const [teamFilter, setTeamFilter] = useState("Все команды");
  const teams = ["Все команды", ...[...new Set(reports.map((report) => report.team))]];
  const shown = teamFilter === "Все команды" ? reports : reports.filter((report) => report.team === teamFilter);

  const completed = shown.reduce(
    (sum, report) => sum + report.completedTasks.split(";").filter(Boolean).length,
    0,
  );
  const average = Math.round(
    shown.reduce((sum, report) => sum + report.completionPercent, 0) /
      Math.max(1, shown.length),
  );
  const risks = shown.filter((report) => report.blockers.trim()).length;

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
        <div><span>Отчётов</span><strong>{shown.length}</strong><small>в текущей выборке</small></div>
        <div><span>Выполнено блоков</span><strong>{completed}</strong><small className="positive">за период</small></div>
        <div><span>Средняя готовность</span><strong>{average}%</strong><small>по всем командам</small></div>
        <div><span>Требуют внимания</span><strong>{risks}</strong><small className={risks ? "warning-copy" : "positive"}>{risks ? "есть блокеры" : "рисков нет"}</small></div>
      </div>

      <div className="reports-toolbar">
        <div>
          {teams.map((team) => (
            <button
              key={team}
              className={teamFilter === team ? "active" : ""}
              onClick={() => setTeamFilter(team)}
            >
              {team}
            </button>
          ))}
        </div>
        <span>Сначала новые ↓</span>
      </div>

      <div className="reports-list">
        {!shown.length && <div className="empty-state">По команде «{teamFilter}» отчётов пока нет.</div>}
        {shown.map((report) => (
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
    description: "Популярные материалы и быстрый старт для ежедневной работы команды.",
    status: "24 материала",
    stats: [
      { label: "Популярные материалы", value: "12", hint: "открываются в Telegram" },
      { label: "Быстрый старт", value: "7", hint: "пошаговая стратегия" },
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
      { label: "Заработано", value: "2,88 млн ₽", hint: "+18,6%" },
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

const TEAM_STATS = [
  { team: "Excellent", lead: "Дмитрий", leads: 184, approved: 97, revenue: 1284000, payout: 892000, conversion: 52 },
  { team: "Северная", lead: "Анна", leads: 156, approved: 71, revenue: 984000, payout: 712000, conversion: 45 },
  { team: "Вектор", lead: "Иван", leads: 132, approved: 39, revenue: 612000, payout: 498000, conversion: 29 },
  { team: "Blogsphere", lead: "Мария", leads: 98, approved: 54, revenue: 786000, payout: 540000, conversion: 55 },
];
const TEAM_MEMBERS: Record<string, { name: string; leads: number; revenue: number }[]> = {
  Excellent: [{ name: "Анна Сидорова", leads: 46, revenue: 486300 }, { name: "Иван Петров", leads: 38, revenue: 392700 }, { name: "Сергей Ковалёв", leads: 24, revenue: 188900 }],
  Северная: [{ name: "Мария Орлова", leads: 31, revenue: 354200 }, { name: "Ольга Морозова", leads: 28, revenue: 228500 }, { name: "Павел Фёдоров", leads: 22, revenue: 178400 }],
  Вектор: [{ name: "Иван Петров", leads: 38, revenue: 210500 }, { name: "Алина Кузнецова", leads: 27, revenue: 164200 }],
  Blogsphere: [{ name: "Мария Орлова", leads: 31, revenue: 267800 }, { name: "Александр Иванов", leads: 19, revenue: 142300 }],
};

const RKO_PROBLEMS = [
  { title: "Т-Банк не сверяет заявки 3-й день", text: "12 заявок зависли в статусе «Ждёт сверки». Возможен сбой на стороне партнёра — стоит написать менеджеру Т-Банка." },
  { title: "Команда «Вектор» — просадка конверсии", text: "Конверсия 29% против средних 45%. Много холодных лидов без ЦД — разобрать источники трафика." },
  { title: "Рост отказов по МФО", text: "Доля отказов выросла до 18%. Проверить качество трафика по МФО-шортсам." },
];

const MEDIA_PROBLEMS = [
  { title: "YouTube Shorts — ROI ниже 100%", text: "Ресурс убыточен (ROI 62%). Либо переработать креативы, либо снизить бюджет." },
  { title: "Блогер @moneyhacks — дорогой лид", text: "CPL 3 158 ₽ — самый высокий. Пересмотреть условия интеграции или формат." },
];

function StatsView({ kind, showToast }: { kind: string; showToast: (message: string) => void }) {
  const isMedia = kind === "Медиа";
  const [selectedResource, setSelectedResource] = useState<MediaResource | null>(null);
  const detailRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (selectedResource) window.setTimeout(() => detailRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 0);
  }, [selectedResource]);

  if (isMedia) {
    const totalReach = MEDIA_RESOURCES.reduce((sum, item) => sum + item.reach, 0);
    const totalLeads = MEDIA_RESOURCES.reduce((sum, item) => sum + item.leads, 0);
    const totalSpend = MEDIA_RESOURCES.reduce((sum, item) => sum + item.spend, 0);
    const totalRevenue = MEDIA_RESOURCES.reduce((sum, item) => sum + item.revenue, 0);
    const roi = Math.round((totalRevenue / totalSpend) * 100);
    const weak = [...MEDIA_RESOURCES].sort((a, b) => a.revenue / a.spend - b.revenue / b.spend)[0];

    return (
      <>
        <div className="page-title compact-title">
          <div><span className="eyebrow">Admin Panel · головной мозг</span><h1>Статистика Медиа</h1><p>Все ресурсы привлечения, охваты и окупаемость. Медиа — отдельно от РКО.</p></div>
          <button className="secondary-button" onClick={() => { downloadCsv("media-summary.csv", ["Ресурс", "Тип", "Подписчики", "Охват", "Лиды", "Затраты", "Доход", "ROI"], MEDIA_RESOURCES.map((item) => [item.name, item.type, item.followers, item.reach, item.leads, item.spend, item.revenue, `${Math.round((item.revenue / Math.max(1, item.spend)) * 100)}%`])); showToast("Выписка медиа скачана"); }}>⇩ Общая выписка</button>
        </div>
        <div className="media-summary">
          <div className="media-kpi"><span>Суммарный охват</span><strong>{compact(totalReach)}</strong><small>по всем ресурсам</small></div>
          <div className="media-kpi"><span>Привлечено лидов</span><strong>{totalLeads}</strong><small>за период</small></div>
          <div className="media-kpi"><span>Затраты</span><strong className="pink">{money(totalSpend)}</strong><small>на медиа</small></div>
          <div className="media-kpi"><span>ROI</span><strong className={roi >= 100 ? "lime" : "pink"}>{roi}%</strong><small>окупаемость</small></div>
        </div>
        <Panel title="Медиа по командам" subtitle="Нажмите на карточку для полной выписки">
          <div className="team-stat-grid media-team-grid">
            {MEDIA_RESOURCES.map((item) => <button key={item.id} className="team-stat-card" onClick={() => setSelectedResource(item)}><strong>Медиа · {item.name}</strong><span>Аудитория: {compact(item.followers)}</span><span>Охват: {compact(item.reach)}</span><span>Привлечено лидов: {item.leads}</span><p>Доход: {money(item.revenue)}</p><small>ROI: {Math.round((item.revenue / Math.max(1, item.spend)) * 100)}%</small></button>)}
          </div>
          {selectedResource && <div className="team-detail-panel expanded-detail" ref={detailRef}>
            <div className="section-title"><h3>Полная статистика · {selectedResource.name}</h3><button className="row-action" onClick={() => setSelectedResource(null)}>×</button></div>
            <div className="team-detail-list"><article><span>Аудитория: {compact(selectedResource.followers)} · охват: {compact(selectedResource.reach)}</span><span>Переходы: {compact(selectedResource.clicks)} · лиды: {selectedResource.leads}</span><span>CPL: {money(Math.round(selectedResource.spend / Math.max(1, selectedResource.leads)))} · затраты: {money(selectedResource.spend)}</span><b>Доход: {money(selectedResource.revenue)} · ROI: {Math.round((selectedResource.revenue / Math.max(1, selectedResource.spend)) * 100)}%</b></article></div>
            <MediaResourceCard item={selectedResource} initialOpen />
          </div>}
        </Panel>
      </>
    );
  }

  const totalLeads = TEAM_STATS.reduce((sum, team) => sum + team.leads, 0);
  const totalRevenue = TEAM_STATS.reduce((sum, team) => sum + team.revenue, 0);
  const totalPayout = TEAM_STATS.reduce((sum, team) => sum + team.payout, 0);
  const profit = totalRevenue - totalPayout;
  const avgConv = Math.round(TEAM_STATS.reduce((sum, team) => sum + team.conversion, 0) / TEAM_STATS.length);
  const weak = [...TEAM_STATS].sort((a, b) => a.conversion - b.conversion)[0];
  const [selectedTeam, setSelectedTeam] = useState<typeof TEAM_STATS[number] | null>(null);
  const teamDetailRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (selectedTeam) window.setTimeout(() => teamDetailRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 0);
  }, [selectedTeam]);

  return (
    <>
      <div className="page-title compact-title">
        <div><span className="eyebrow">Admin Panel · головной мозг</span><h1>Статистика РКО</h1><p>Все команды, выручки и наша прибыль. Поиск слабых точек.</p></div>
        <button className="secondary-button" onClick={() => { downloadCsv("rko-summary.csv", ["Команда", "Тимлид", "Лиды", "Апрувы", "Выручка", "Выплаты", "Прибыль", "Конверсия"], TEAM_STATS.map((team) => [team.team, team.lead, team.leads, team.approved, team.revenue, team.payout, team.revenue - team.payout, `${team.conversion}%`])); showToast("Выписка РКО скачана"); }}>⇩ Общая выписка</button>
      </div>

      {adding && <div className="resource-add-form"><strong>Добавить канал</strong><p>Вставьте ссылку на сам канал или страницу ресурса — например https://t.me/название, Instagram, VK или YouTube.</p><div className="form-grid"><label><span>Название ресурса</span><input value={resourceName} onChange={(event) => setResourceName(event.target.value)} placeholder="Например, Telegram-канал Финтрафик" /></label><label><span>Тип</span><select value={resourceType} onChange={(event) => setResourceType(event.target.value)}><option>Telegram</option><option>Instagram</option><option>VK</option><option>YouTube</option><option>Сайт</option></select></label><label className="full"><span>Ссылка на канал</span><input value={resourceUrl} onChange={(event) => setResourceUrl(event.target.value)} placeholder="https://t.me/..." /></label></div><div className="resource-add-actions"><button className="primary-button" onClick={() => { if (!resourceName.trim() || !resourceUrl.trim()) return; const base = MEDIA_RESOURCES[0]; setResources((current) => [{ ...base, id: Date.now(), name: resourceName.trim(), type: resourceType, url: resourceUrl.trim(), initials: resourceName.trim().slice(0, 2).toUpperCase(), audience: 0, dailyReach: 0, followers: 0, reach: 0, clicks: 0, leads: 0, spend: 0, revenue: 0, communities: [] }, ...current]); setResourceName(""); setResourceUrl(""); setAdding(false); showToast("Ресурс добавлен в медиа"); }}>Сохранить ресурс</button><button className="text-button" onClick={() => setAdding(false)}>Отмена</button></div></div>}
      <div className="media-summary">
        <div className="media-kpi"><span>Всего лидов</span><strong>{totalLeads}</strong><small>по всем командам</small></div>
        <div className="media-kpi"><span>Выручка</span><strong>{money(totalRevenue)}</strong><small>оборот</small></div>
        <div className="media-kpi"><span>Наша прибыль</span><strong className="lime">{money(profit)}</strong><small>выручка − выплаты</small></div>
        <div className="media-kpi"><span>Средняя конверсия</span><strong>{avgConv}%</strong><small>по командам</small></div>
      </div>

      <Panel title="Команды · РКО" subtitle="Нажмите на карточку для подробной информации">
        <div className="team-stat-grid">
          {TEAM_STATS.map((team) => <button className={`team-stat-card ${team.team === weak.team ? "is-weak" : ""}`} key={team.team} onClick={() => setSelectedTeam(team)}><strong>{team.team}</strong><span>Тимлид: {team.lead}</span><div><b>Лиды: {team.leads}</b><b>Апрувы: {team.approved}</b></div><p>Выручка: {money(team.revenue)}</p><p>Прибыль: <em>{money(team.revenue - team.payout)}</em></p><small>Конверсия: {team.conversion}%</small></button>)}
        </div>
        {selectedTeam && <div className="team-detail-panel expanded-detail" ref={teamDetailRef}><div className="section-title"><h3>Подробная аналитика · {selectedTeam.team}</h3><button className="row-action" onClick={() => setSelectedTeam(null)}>×</button></div><div className="team-detail-list"><article><strong>Тимлид: {selectedTeam.lead}</strong><span>Лиды: {selectedTeam.leads} · Апрувы: {selectedTeam.approved}</span><span>Выручка: {money(selectedTeam.revenue)} · Выплаты: {money(selectedTeam.payout)}</span><b>Прибыль: {money(selectedTeam.revenue - selectedTeam.payout)} · Конверсия: {selectedTeam.conversion}%</b></article>{(TEAM_MEMBERS[selectedTeam.team] ?? []).map((member) => { const linkedUser = users.find((user) => user.name === member.name); return <article key={member.name}><strong>{member.name}</strong><span>Лидов: {member.leads}</span><b>Принёс: {money(member.revenue)}</b>{linkedUser ? <button className="text-button" onClick={() => openUser(linkedUser.id)}>Открыть лидов и статистику →</button> : <small className="muted">Профиль участника пока не подключён</small>}</article>; })}</div></div>}
      </Panel>
    </>
  );
}

function ProblemsAnalysis({ items }: { items: { title: string; text: string }[] }) {
  return (
    <Panel title="🔍 Анализ проблем" subtitle="Система нашла возможные проблемы — их стоит решить">
      <div className="problems-analysis">
        {items.map((item) => (
          <div key={item.title} className="problem-item">
            <span className="problem-dot" />
            <div><strong>{item.title}</strong><p>{item.text}</p></div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

type PayStatus = "Оплачено" | "В обработке" | "Ожидает";

const PAYOUTS: { id: number; recipient: string; team: string; direction: Direction; amount: number; method: string; date: string; status: PayStatus }[] = [
  { id: 1, recipient: "Дмитрий Волков", team: "Excellent", direction: "РКО", amount: 128600, method: "Карта · Сбер", date: "24.07", status: "Оплачено" },
  { id: 2, recipient: "Анна Сидорова", team: "Северная", direction: "Беттинг", amount: 96400, method: "СБП", date: "24.07", status: "В обработке" },
  { id: 3, recipient: "Иван Петров", team: "Вектор", direction: "МФО", amount: 54200, method: "Карта · Тинькофф", date: "23.07", status: "Ожидает" },
  { id: 4, recipient: "Мария Орлова", team: "Blogsphere", direction: "РКО", amount: 112800, method: "USDT", date: "23.07", status: "Оплачено" },
  { id: 5, recipient: "Пётр Смирнов", team: "Excellent", direction: "РКО", amount: 41300, method: "СБП", date: "22.07", status: "Ожидает" },
];

const PAY_STATUS_CLASS: Record<PayStatus, string> = {
  "Оплачено": "offer-status-approved",
  "В обработке": "offer-status-review",
  "Ожидает": "offer-status-draft",
};

function AccountingView({ showToast }: { showToast: (message: string) => void }) {
  const [selectedPay, setSelectedPay] = useState<(typeof PAYOUTS)[number] | null>(null);
  const accrued = PAYOUTS.reduce((sum, pay) => sum + pay.amount, 0);
  const paid = PAYOUTS.filter((pay) => pay.status === "Оплачено").reduce((sum, pay) => sum + pay.amount, 0);
  const pending = accrued - paid;
  const byRecipient = PAYOUTS.reduce<Record<string, { total: number; paid: number; operations: number }>>((result, pay) => {
    const current = result[pay.recipient] ?? { total: 0, paid: 0, operations: 0 };
    current.total += pay.amount;
    current.paid += pay.status === "Оплачено" ? pay.amount : 0;
    current.operations += 1;
    result[pay.recipient] = current;
    return result;
  }, {});
  const byTeam = PAYOUTS.reduce<Record<string, { total: number; paid: number; operations: number }>>((result, pay) => {
    const current = result[pay.team] ?? { total: 0, paid: 0, operations: 0 };
    current.total += pay.amount;
    current.paid += pay.status === "Оплачено" ? pay.amount : 0;
    current.operations += 1;
    result[pay.team] = current;
    return result;
  }, {});

  return (
    <>
      <div className="page-title compact-title">
        <div><span className="eyebrow">Admin Panel</span><h1>Бухгалтерский учёт</h1><p>Реестр выплат: кому, сколько, куда и статус оплаты.</p></div>
        <button className="secondary-button" onClick={() => { downloadCsv("payout-register.csv", ["Получатель", "Команда", "Направление", "Сумма", "Куда", "Дата", "Статус"], PAYOUTS.map((pay) => [pay.recipient, pay.team, pay.direction, pay.amount, pay.method, pay.date, pay.status])); showToast("Реестр выплат скачан"); }}>⇩ Экспорт реестра</button>
      </div>

      <div className="media-summary">
        <div className="media-kpi"><span>Начислено</span><strong>{money(accrued)}</strong><small>всего</small></div>
        <div className="media-kpi"><span>Выплачено</span><strong className="lime">{money(paid)}</strong><small>оплачено</small></div>
        <div className="media-kpi"><span>К выплате</span><strong className="pink">{money(pending)}</strong><small>в обработке и ожидании</small></div>
        <div className="media-kpi"><span>Операций</span><strong>{PAYOUTS.length}</strong><small>в реестре</small></div>
      </div>

      <Panel title="Сводка по сотрудникам и командам" subtitle="Кому начислено, сколько уже выплачено и что осталось к выплате">
        <div className="accounting-group-grid">
          <div><h3>Сотрудники</h3>{Object.entries(byRecipient).map(([recipient, item]) => <article key={recipient}><strong>{recipient}</strong><span>{item.operations} операций · начислено {money(item.total)}</span><b>Выплачено {money(item.paid)} · к выплате {money(item.total - item.paid)}</b></article>)}</div>
          <div><h3>Команды</h3>{Object.entries(byTeam).map(([team, item]) => <article key={team}><strong>{team}</strong><span>{item.operations} операций · начислено {money(item.total)}</span><b>Выплачено {money(item.paid)} · к выплате {money(item.total - item.paid)}</b></article>)}</div>
        </div>
      </Panel>

      <Panel title="Реестр выплат" subtitle="Кому · что · куда · статус">
        <div className="table-scroll">
          <table>
            <thead>
              <tr><th>Получатель</th><th>Команда</th><th>Направление</th><th>Сумма</th><th>Куда</th><th>Дата</th><th>Статус оплаты</th></tr>
            </thead>
            <tbody>
              {PAYOUTS.map((pay) => (
                <tr key={pay.id} className="clickable-row" onClick={() => setSelectedPay(pay)}>
                  <td><strong>{pay.recipient}</strong></td>
                  <td data-label="Команда">{pay.team}</td>
                  <td data-label="Направление"><DirectionPill direction={pay.direction} /></td>
                  <td data-label="Сумма"><strong>{money(pay.amount)}</strong></td>
                  <td data-label="Куда" className="muted">{pay.method}</td>
                  <td data-label="Дата">{pay.date}</td>
                  <td data-label="Статус"><span className={`offer-status ${PAY_STATUS_CLASS[pay.status]}`}>{pay.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="team-detail-list accounting-people-summary">
          {Object.entries(byRecipient).map(([recipient, item]) => <article key={recipient}><strong>{recipient}</strong><span>Операций: {item.operations} · Начислено: {money(item.total)}</span><b>Выплачено: {money(item.paid)} · К выплате: {money(item.total - item.paid)}</b></article>)}
        </div>
        {selectedPay && <div className="team-detail-panel accounting-detail"><div className="section-title"><h3>{selectedPay.recipient}</h3><button className="row-action" onClick={() => setSelectedPay(null)}>×</button></div><div className="team-detail-list"><article><strong>{selectedPay.team} · {selectedPay.direction}</strong><span>Сумма: {money(selectedPay.amount)} · Дата: {selectedPay.date}</span><span>Способ выплаты: {selectedPay.method}</span><b>Статус: {selectedPay.status}</b></article></div></div>}
      </Panel>
    </>
  );
}

const MINI_APP_OFFERS = [
  { bank: "Альфа-Банк", product: "Дебетовая карта", max: 3000 },
  { bank: "Т-Банк", product: "Дебетовая карта", max: 2500 },
  { bank: "Уралсиб", product: "РКО для ИП", max: 4000 },
  { bank: "OTP", product: "Займ МФО", max: 1500 },
];

function MiniAppView({ agent }: { agent: Agent }) {
  const [rates, setRates] = useState(MINI_APP_OFFERS.map((offer) => Math.round(offer.max * 0.6)));
  const [copied, setCopied] = useState(false);
  const slug = agent.role;
  const link = `https://t.me/mk_platform_bot?start=${slug}_a${1000 + ROLE_LABELS[agent.role].length}`;
  const earned = rates.reduce((sum, rate) => sum + rate, 0);

  const setRate = (index: number, raw: number) => {
    const max = MINI_APP_OFFERS[index].max;
    const clamped = Math.min(max, Math.max(0, raw || 0));
    setRates((current) => current.map((value, idx) => (idx === index ? clamped : value)));
  };

  const copy = () => {
    if (navigator.clipboard) navigator.clipboard.writeText(link).catch(() => {});
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <>
      <div className="page-title compact-title">
        <div><span className="eyebrow">Mini App · Telegram</span><h1>Мини-приложение для лидов</h1><p>Ваша персональная ссылка и ставки, которые видят приведённые вами лиды.</p></div>
      </div>

      <div className="miniapp-link">
        <div><span>Ваша ссылка (роль: {ROLE_LABELS[agent.role]})</span><code>{link}</code></div>
        <button className="primary-button" onClick={copy}>{copied ? "✓ Скопировано" : "Копировать"}</button>
      </div>

      <div className="miniapp-cols">
        <Panel title="Ставки для лидов" subtitle="Сколько увидит лид за каждый оффер · не выше максимума">
          <div className="table-scroll">
            <table>
              <thead><tr><th>Оффер</th><th>Макс.</th><th>Ставка лиду</th></tr></thead>
              <tbody>
                {MINI_APP_OFFERS.map((offer, index) => (
                  <tr key={offer.bank}>
                    <td><div className="person-cell"><span><strong>{offer.bank}</strong><small>{offer.product}</small></span></div></td>
                    <td data-label="Макс."><span className="cap-max">{money(offer.max)}</span></td>
                    <td data-label="Ставка лиду">
                      <div className="cap-input">
                        <input type="number" value={rates[index]} max={offer.max} onChange={(event) => setRate(index, Number(event.target.value))} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="phone-preview">
          <div className="phone">
            <div className="phone-notch" />
            <div className="phone-screen">
              <div className="mini-head">
                <span className="mini-logo">M&K</span>
                <div><strong>Личный кабинет</strong><small>@lead_ivan · привёл {ROLE_LABELS[agent.role]}</small></div>
              </div>
              <div className="mini-balance">
                <span>Вы уже заработали</span>
                <strong>{money(3400)}</strong>
                <small>потенциал по офферам: {money(earned)}</small>
              </div>
              <div className="mini-offers">
                <span className="mini-offers-title">Доступные офферы</span>
                {MINI_APP_OFFERS.map((offer, index) => (
                  <div key={offer.bank} className="mini-offer">
                    <div><strong>{offer.bank}</strong><small>{offer.product}</small></div>
                    <b>{money(rates[index])}</b>
                  </div>
                ))}
              </div>
              <button className="mini-cta">Оформить и получить выплату</button>
            </div>
          </div>
          <p className="phone-caption">Так мини-приложение видит ваш лид в Telegram. Ставки обновляются мгновенно.</p>
        </div>
      </div>
    </>
  );
}

function ModuleView({ type, showToast }: { type: ModuleViewType; showToast: (message: string) => void }) {
  const content = MODULE_CONTENT[type];
  const isInfo = type === "info";

  return (
    <>
      <div className="page-title compact-title module-title">
        <div>
          <span className="eyebrow">{content.eyebrow}</span>
          <h1>{content.title}</h1>
          <p>{content.description}</p>
        </div>
        {!isInfo && <span className="module-status"><i />{content.status}</span>}
      </div>

      <div className="module-kpis">
        {content.stats.filter((stat) => !isInfo || !["Обновлено", "Прочитано"].includes(stat.label)).map((stat) => (
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
              isInfo ? (
                <button key={row.title} className="module-row-btn" onClick={() => { window.open("https://t.me/mk_platform", "_blank", "noopener,noreferrer"); showToast(`«${row.title}» открывается в Telegram-группе команды`); }}>
                  <span className="module-index">{String(index + 1).padStart(2, "0")}</span>
                  <div><strong>{row.title}</strong><small>{row.meta}</small></div>
                  <div className="module-value"><span className="tg-link">🔗 Telegram</span></div>
                </button>
              ) : (
                <article key={row.title}>
                  <span className="module-index">{String(index + 1).padStart(2, "0")}</span>
                  <div><strong>{row.title}</strong><small>{row.meta}</small></div>
                  <div className="module-value"><strong>{row.value}</strong><small>{row.state}</small></div>
                </article>
              )
            ))}
          </div>
          {isInfo && <div className="info-note">Все материалы открываются по ссылке в закрытой Telegram-группе.</div>}
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
          {isInfo && <button className="primary-button" onClick={() => { window.open("https://t.me/mk_platform", "_blank", "noopener,noreferrer"); showToast("Открыта пошаговая стратегия в Telegram"); }}>Открыть пошаговую стратегию в Telegram</button>}
        </Panel>
      </div>
    </>
  );
}

// Фирменные бейджи банков (монограмма в цвете бренда). Без внешних картинок —
// работает при строгом CSP и не нарушает права на логотипы.
const BANK_BRAND: Record<string, { short: string; color: string; dark?: boolean }> = {
  "Т-Банк": { short: "Т", color: "#ffdd2d", dark: true },
  "Альфа-Банк": { short: "А", color: "#ef3124" },
  "ВТБ": { short: "ВТБ", color: "#009fdf" },
  "Газпромбанк": { short: "ГПБ", color: "#2f6cb0" },
  "ОТП Банк": { short: "ОТП", color: "#6ab023" },
  "Уралсиб": { short: "У", color: "#e4002b" },
  "Точка": { short: "•", color: "#111318", dark: false },
  "Займер": { short: "З", color: "#ff6a00" },
  "1xStavka": { short: "1x", color: "#0a4d8c" },
  "Fonbet": { short: "F", color: "#e30613" },
};

function BankLogo({ bank }: { bank: string }) {
  const brand = BANK_BRAND[bank] ?? { short: bank.slice(0, 2), color: "#3a3f4a" };
  return (
    <span className="bank-logo" style={{ background: brand.color, color: brand.dark ? "#1a1a1a" : "#fff" }}>
      {brand.short}
    </span>
  );
}

function OffersView({ setMetricModal }: { setMetricModal: (type: string) => void }) {
  const [cat, setCat] = useState<string | null>(null);
  const categories = [
    { name: "РКО", count: 12, avg: 28600, color: "#bdff38" },
    { name: "Дебет", count: 18, avg: 7900, color: "#46d9ff" },
    { name: "Кредит", count: 9, avg: 12800, color: "#a78bfa" },
    { name: "Регбиз", count: 7, avg: 16400, color: "#ffb35c" },
    { name: "МФО", count: 14, avg: 6200, color: "#ff6e91" },
    { name: "Беттинг", count: 8, avg: 13000, color: "#f59e0b" },
    { name: "HR", count: 6, avg: 24500, color: "#5eead4" },
  ];
  const catalog = [
    { bank: "ВТБ", category: "РКО", offer: "РКО для ИП", payout: 5000, costs: "7% · 4% · 15% · 690 ₽", cd: 1990, net: 3010, status: "Активен", recommended: true },
    { bank: "Альфа-Банк", category: "РКО", offer: "РКО + бонус лиду", payout: 15000, costs: "15%", cd: 2250, net: 12750, status: "Активен", recommended: true },
    { bank: "Альфа-Банк", category: "РКО", offer: "Альфа ИП", payout: 21000, costs: "15%", cd: 3150, net: 17850, status: "Активен", recommended: true },
    { bank: "Озон Банк", category: "РКО", offer: "РКО для бизнеса", payout: 4500, costs: "7% · 4% · 20%", cd: 1740, net: 2760, status: "Активен", recommended: false },
    { bank: "Сбер", category: "РКО", offer: "РКО · выплата лиду", payout: 3000, costs: "Выплата лиду", cd: 3000, net: 0, status: "Активен", recommended: false },
    { bank: "ОТП Банк", category: "РКО", offer: "РКО · холд 1 месяц после ЦД", payout: 9000, costs: "7% · 4% · 20% · 690 ₽", cd: 3480, net: 5520, status: "Холд", recommended: false },
    { bank: "Уралсиб", category: "РКО", offer: "РКО «Стандарт»", payout: 6000, costs: "4% · 7% · 20%", cd: 1860, net: 4140, status: "Активен", recommended: false },
    { bank: "Т-Банк", category: "РКО", offer: "РКО · зависит от кабинета", payout: 11000, costs: "4% · 7% · 20%", cd: 3410, net: 7590, status: "Активен", recommended: true },
    { bank: "Билайн", category: "РКО", offer: "РКО для бизнеса", payout: 6000, costs: "7% · 4% · 15% · 500 ₽", cd: 2060, net: 3940, status: "Новый", recommended: true },
    { bank: "Газпромбанк", category: "Дебет", offer: "Умная карта", payout: 7200, costs: "ЦД 1 100 ₽", cd: 1100, net: 6100, status: "Активен", recommended: true },
    { bank: "ОТП Банк", category: "Дебет", offer: "ОТП Карта", payout: 4600, costs: "ЦД 700 ₽", cd: 700, net: 3900, status: "Активен", recommended: false },
    { bank: "Займер", category: "МФО", offer: "Первый займ", payout: 5200, costs: "ЦД 400 ₽", cd: 400, net: 4800, status: "Активен", recommended: false },
    { bank: "1xStavka", category: "Беттинг", offer: "Первый депозит", payout: 14200, costs: "ЦД 1 800 ₽", cd: 1800, net: 12400, status: "Активен", recommended: true },
  ];
  const renderTable = (list: typeof catalog) => (
    <div className="table-scroll">
      <table>
        <thead><tr><th>Банк / партнёр</th><th>Категория</th><th>Оффер</th><th>Выплата</th><th>Расходы</th><th>Затраты на ЦД</th><th>Чистыми</th><th>Статус</th></tr></thead>
        <tbody>{list.map((item) => (
          <tr key={`${item.bank}-${item.offer}`} className={item.recommended ? "row-recommended" : ""}>
            <td><span className="bank-cell"><BankLogo bank={item.bank} /><strong>{item.bank}</strong></span>{item.recommended && <span className="rec-badge">★ Рекомендуем</span>}</td><td data-label="Категория"><span className="source-pill">{item.category}</span></td><td data-label="Оффер">{item.offer}</td>
            <td data-label="Выплата"><strong>{money(item.payout)}</strong></td><td data-label="Расходы" className="muted">{item.costs}</td><td data-label="Затраты на ЦД" className="pink">{money(item.cd)}</td><td data-label="Чистыми" className="lime"><strong>{money(item.net)}</strong></td>
            <td data-label="Статус"><span className={`user-state ${item.status === "Активен" ? "is-active" : ""}`}>● {item.status}</span></td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );

  return (
    <>
      <div className="page-title compact-title">
        <div><span className="eyebrow">Каталог и экономика</span><h1>Офферы</h1><p>Выплата, стоимость ЦД, чистый доход и этапы работы. Нажмите на категорию.</p></div>
        <button className="primary-button" onClick={() => setMetricModal("offer")}>＋ Новый оффер</button>
      </div>
      <div className="offer-categories">
        {categories.map((category) => {
          const catOffers = catalog.filter((item) => item.category === category.name);
          const isOpen = cat === category.name;
          return (
            <Fragment key={category.name}>
              <button
                className={`offer-cat ${isOpen ? "is-active" : ""}`}
                style={{ "--category-color": category.color } as React.CSSProperties}
                onClick={() => setCat((current) => (current === category.name ? null : category.name))}
              >
                <span>{category.name}</span><strong>{category.count}</strong><b>{money(category.avg)}</b>
                <em className="offer-cat-caret" aria-hidden>{isOpen ? "−" : "+"}</em>
              </button>
              {isOpen && (
                <div className="offer-cat-details" style={{ "--category-color": category.color } as React.CSSProperties}>
                  <div className="offer-cat-details-head">
                    <strong>Офферы · {category.name}</strong>
                    <button className="text-button" onClick={() => setCat(null)}>Свернуть ×</button>
                  </div>
                  {catOffers.length ? renderTable(catOffers) : <div className="empty-state">В этой категории офферов пока нет.</div>}
                </div>
              )}
            </Fragment>
          );
        })}
      </div>
      {!cat && (
        <Panel title="Каталог офферов" subtitle="Все офферы · ★ — рекомендованные нами · нажмите категорию выше, чтобы отфильтровать">
          {renderTable(catalog)}
        </Panel>
      )}
    </>
  );
}

function BlogsView({ showToast }: { showToast: (message: string) => void }) {
  const [filter, setFilter] = useState("Все направления");
  const [openRole, setOpenRole] = useState<string | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskDraft, setTaskDraft] = useState({ title: "", owner: "Ассистент", direction: "Операционка", due: "Сегодня" });
  const [tasks, setTasks] = useState([
    { id: 1, owner: "Тимлид лидогенерации", direction: "Лидогенерация", title: "Сверить источники за неделю", due: "Сегодня", status: "В работе" },
    { id: 2, owner: "Тимлид РКО", direction: "РКО", title: "Обновить ставки банков", due: "Завтра", status: "Новая" },
    { id: 3, owner: "Тимлид беттинга", direction: "Беттинг", title: "Подготовить отчёт по качеству трафика", due: "28 июля", status: "Новая" },
    { id: 4, owner: "Тимлид МФО", direction: "МФО", title: "Проверить причины отказов", due: "29 июля", status: "Завершена" },
    { id: 5, owner: "Ассистент", direction: "Операционка", title: "Собрать документы для выплат", due: "Сегодня", status: "В работе" },
  ]);
  const directions = ["Все направления", "Лидогенерация", "РКО", "Беттинг", "МФО", "Операционка"];
  const visible = tasks.filter((task) => filter === "Все направления" || task.direction === filter);
  const toggle = (id: number) => setTasks((current) => current.map((task) => task.id === id ? { ...task, status: task.status === "Завершена" ? "В работе" : "Завершена" } : task));
  const removeTask = (id: number) => { if (!window.confirm("Точно хотите удалить?")) return; setTasks((current) => current.filter((task) => task.id !== id)); fetch("/api/ops", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "task", id }) }).catch(() => {}); };
  const editTask = (task: typeof tasks[number]) => { const title = window.prompt("Название задачи", task.title); if (!title?.trim()) return; setTasks((current) => current.map((item) => item.id === task.id ? { ...item, title: title.trim() } : item)); fetch("/api/ops", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "task", id: task.id, title: title.trim() }) }).catch(() => {}); };
  useEffect(() => {
    let cancelled = false;
    fetch("/api/ops").then((response) => response.ok ? response.json() : Promise.reject()).then((payload: { tasks?: { id: number; title: string; owner: string; direction: string; due: string; status: string }[] }) => {
      if (!cancelled && payload.tasks?.length) setTasks(payload.tasks.map((task) => ({ id: task.id, title: task.title, owner: task.owner, direction: task.direction, due: task.due, status: task.status })));
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);
  return (
    <div className="overview-stack">
      <div className="page-title compact-title"><div><span className="eyebrow">Рабочий центр</span><h1>Блоки и задачи</h1><p>Тимлиды ведут свои направления, а ассистент собирает задачи и статусы в одном месте.</p></div><button className="primary-button" onClick={() => setShowTaskForm(true)}>＋ Добавить задачу</button></div>
      {showTaskForm && <div className="resource-add-form"><strong>Новая задача</strong><div className="form-grid"><label><span>Название</span><input autoFocus value={taskDraft.title} onChange={(event) => setTaskDraft((draft) => ({ ...draft, title: event.target.value }))} placeholder="Что нужно сделать" /></label><label><span>Ответственный</span><select value={taskDraft.owner} onChange={(event) => setTaskDraft((draft) => ({ ...draft, owner: event.target.value }))}>{["Тимлид лидогенерации", "Тимлид РКО", "Тимлид беттинга", "Тимлид МФО", "Ассистент"].map((owner) => <option key={owner}>{owner}</option>)}</select></label><label><span>Срок</span><input value={taskDraft.due} onChange={(event) => setTaskDraft((draft) => ({ ...draft, due: event.target.value }))} /></label></div><div className="resource-add-actions"><button className="primary-button" onClick={async () => { if (!taskDraft.title.trim()) { showToast("Напишите название задачи"); return; } const draft = { ...taskDraft, status: "Новая" }; setTasks((current) => [{ id: Date.now(), ...draft }, ...current]); await fetch("/api/ops", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "task", ...draft }) }).catch(() => {}); setTaskDraft({ title: "", owner: taskDraft.owner, direction: "Операционка", due: "Сегодня" }); setShowTaskForm(false); showToast("Задача добавлена"); }}>Создать</button><button className="text-button" onClick={() => setShowTaskForm(false)}>Отмена</button></div></div>}
      <div className="blog-role-grid">{["Тимлид лидогенерации", "Тимлид РКО", "Тимлид беттинга", "Тимлид МФО", "Ассистент"].map((role) => <article key={role}><span className="blog-role-icon">{role === "Ассистент" ? "A" : "T"}</span><div><strong>{role}</strong><small>{tasks.filter((task) => task.owner === role).length} задач · отчёт раз в день</small></div><button className="text-button" onClick={() => setOpenRole((current) => current === role ? null : role)}>Открыть →</button></article>)}</div>
      {openRole && <Panel title={openRole} subtitle="Задачи и текущий статус"><div className="task-list">{tasks.filter((task) => task.owner === openRole).map((task) => <div className="task-row" key={task.id}><strong>{task.title}</strong><span>{task.status}</span><small>{task.due}</small><button className="text-button" onClick={() => editTask(task)}>Изменить</button></div>)}</div></Panel>}
      <Panel title="Трекер задач" subtitle="Отметьте выполнение — прогресс сохраняется в текущей сессии"><div className="blog-filters">{directions.map((item) => <button className={filter === item ? "is-active" : ""} key={item} onClick={() => setFilter(item)}>{item}</button>)}</div><div className="task-list">{visible.map((task) => <article className={`task-row ${task.status === "Завершена" ? "is-done" : ""}`} key={task.id}><button className="task-check" onClick={() => { const next = task.status === "Завершена" ? "В работе" : "Завершена"; toggle(task.id); fetch("/api/ops", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "task", id: task.id, status: next }) }).catch(() => {}); }}>{task.status === "Завершена" ? "✓" : ""}</button><div><strong>{task.title}</strong><small>{task.owner} · {task.direction}</small></div><span>{task.due}</span><b>{task.status}</b><button className="row-action" onClick={() => removeTask(task.id)} aria-label="Удалить задачу">×</button></article>)}</div></Panel>
      <Panel title="Ежедневный отчёт" subtitle="Что тимлид должен подгрузить по итогам дня"><div className="blog-report-grid"><div><span>Выполненные задачи</span><strong>{tasks.filter((task) => task.status === "Завершена").length}</strong></div><div><span>В работе</span><strong>{tasks.filter((task) => task.status === "В работе").length}</strong></div><div><span>Новые блокеры</span><strong>2</strong></div><div><span>Готовность</span><strong>{Math.round((tasks.filter((task) => task.status === "Завершена").length / tasks.length) * 100)}%</strong></div></div></Panel>
    </div>
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

// Комьюнити ресурса (чаты/клубы), ТЗ: название, участники, направление, вход.
type Community = {
  name: string;
  members: number;
  direction: string;
  entryFee: number;
};

// Пост прогрева: что должно выйти, вышло ли и когда.
type WarmupPost = {
  title: string;
  planned: string;
  published: string | null;
};

// Созвон отдела продаж.
type SalesCall = {
  person: string;
  at: string;
  result: string;
  cash: number;
  wentToSpin: boolean | null;
};

type MediaResource = {
  id: number;
  name: string;
  type: string;
  url?: string;
  initials: string;
  audience: number;
  dailyReach: number;
  followers: number;
  reach: number;
  clicks: number;
  leads: number;
  spend: number;
  revenue: number;
  communities: Community[];
  warmup: {
    start: string;
    end: string;
    plannedPosts: number;
    plannedEvents: number;
    events: string[];
    reactions: number;
    comments: number;
    directMessages: number;
    posts: WarmupPost[];
    result: {
      wroteDm: number;
      calls: number;
      startedSpin: number;
      fullSpin: number;
      cashRevenue: number;
      spinRevenue: number;
    };
  };
  sales: {
    wroteDm: number;
    reachedCall: number;
    calls: SalesCall[];
  };
};

const MEDIA_RESOURCES: MediaResource[] = [
  {
    id: 1,
    name: "Личный блог · Instagram",
    type: "Instagram",
    initials: "ИБ",
    audience: 48200,
    dailyReach: 10400,
    followers: 48200,
    reach: 312000,
    clicks: 8400,
    leads: 148,
    spend: 92000,
    revenue: 486000,
    communities: [
      { name: "Клуб «Финансовая свобода»", members: 1240, direction: "РКО", entryFee: 3000 },
      { name: "Чат «Карты без комиссии»", members: 860, direction: "Дебет", entryFee: 0 },
    ],
    warmup: {
      start: "14 июля",
      end: "23 июля",
      plannedPosts: 8,
      plannedEvents: 3,
      events: ["Эфир «Как открыть ИП за день»", "Разбор кейсов подписчиков", "Инфоповод: новые ставки банков"],
      reactions: 3120,
      comments: 486,
      directMessages: 214,
      posts: [
        { title: "Пост-знакомство: кто я и чем занимаюсь", planned: "14 июля", published: "14 июля, 11:20" },
        { title: "Кейс: как подписчик заработал 90к", planned: "16 июля", published: "16 июля, 18:05" },
        { title: "Разбор: ИП на НПД без взносов", planned: "18 июля", published: "18 июля, 12:40" },
        { title: "Эфир: вопросы-ответы", planned: "21 июля", published: "21 июля, 20:00" },
        { title: "Финальный оффер + условия", planned: "23 июля", published: null },
      ],
      result: {
        wroteDm: 214,
        calls: 96,
        startedSpin: 61,
        fullSpin: 38,
        cashRevenue: 288000,
        spinRevenue: 486000,
      },
    },
    sales: {
      wroteDm: 214,
      reachedCall: 96,
      calls: [
        { person: "Ирина Волкова", at: "22 июля, 14:00", result: "Оплатила вход, стартует по РКО", cash: 3000, wentToSpin: true },
        { person: "Александр Иванов", at: "22 июля, 16:30", result: "Взял паузу до зарплаты", cash: 0, wentToSpin: false },
        { person: "Пётр Соколов", at: "23 июля, 11:00", result: "Оплатил, оформляет ИП", cash: 3000, wentToSpin: true },
        { person: "Мария Орлова", at: "23 июля, 19:00", result: "Созвон назначен", cash: 0, wentToSpin: null },
      ],
    },
  },
  {
    id: 2,
    name: "Telegram-канал «Финтрафик»",
    type: "Telegram",
    initials: "ТГ",
    audience: 21500,
    dailyReach: 6800,
    followers: 21500,
    reach: 164000,
    clicks: 5100,
    leads: 96,
    spend: 61000,
    revenue: 288000,
    communities: [
      { name: "Закрытый чат «Финтрафик PRO»", members: 420, direction: "РКО / МФО", entryFee: 5000 },
    ],
    warmup: {
      start: "16 июля",
      end: "24 июля",
      plannedPosts: 6,
      plannedEvents: 2,
      events: ["Инфоповод: банк поднял выплату", "Эфир с обработчиком"],
      reactions: 1840,
      comments: 232,
      directMessages: 128,
      posts: [
        { title: "Анонс набора в команду", planned: "16 июля", published: "16 июля, 10:00" },
        { title: "Сколько реально платят за РКО", planned: "19 июля", published: "19 июля, 13:15" },
        { title: "Эфир с обработчиком трафика", planned: "22 июля", published: "22 июля, 19:30" },
        { title: "Закрытие набора", planned: "24 июля", published: null },
      ],
      result: {
        wroteDm: 128,
        calls: 54,
        startedSpin: 33,
        fullSpin: 21,
        cashRevenue: 165000,
        spinRevenue: 288000,
      },
    },
    sales: {
      wroteDm: 128,
      reachedCall: 54,
      calls: [
        { person: "Ольга Морозова", at: "22 июля, 12:00", result: "Оплатила PRO-чат", cash: 5000, wentToSpin: true },
        { person: "Денис Кравцов", at: "23 июля, 15:00", result: "Отказ — не подошёл формат", cash: 0, wentToSpin: false },
      ],
    },
  },
  {
    id: 3,
    name: "YouTube Shorts",
    type: "YouTube",
    initials: "YT",
    audience: 12800,
    dailyReach: 14200,
    followers: 12800,
    reach: 421000,
    clicks: 6200,
    leads: 54,
    spend: 78000,
    revenue: 172000,
    communities: [],
    warmup: {
      start: "18 июля",
      end: "26 июля",
      plannedPosts: 10,
      plannedEvents: 1,
      events: ["Инфоповод: подборка банков"],
      reactions: 5400,
      comments: 310,
      directMessages: 64,
      posts: [
        { title: "Shorts: 3 способа заработать на РКО", planned: "18 июля", published: "18 июля, 09:00" },
        { title: "Shorts: сколько платят банки", planned: "20 июля", published: "20 июля, 09:00" },
        { title: "Shorts: ошибки новичков", planned: "24 июля", published: null },
      ],
      result: {
        wroteDm: 64,
        calls: 22,
        startedSpin: 14,
        fullSpin: 8,
        cashRevenue: 42000,
        spinRevenue: 172000,
      },
    },
    sales: {
      wroteDm: 64,
      reachedCall: 22,
      calls: [
        { person: "Игорь Белов", at: "24 июля, 17:00", result: "Созвон назначен", cash: 0, wentToSpin: null },
      ],
    },
  },
  {
    id: 4,
    name: "Запуск у блогера @moneyhacks",
    type: "Интеграция",
    initials: "MH",
    audience: 96000,
    dailyReach: 27500,
    followers: 96000,
    reach: 540000,
    clicks: 9800,
    leads: 38,
    spend: 120000,
    revenue: 210000,
    communities: [
      { name: "Комьюнити @moneyhacks", members: 3100, direction: "Смешанное", entryFee: 2500 },
      { name: "VIP-группа запуска", members: 180, direction: "РКО", entryFee: 15000 },
    ],
    warmup: {
      start: "20 июля",
      end: "28 июля",
      plannedPosts: 5,
      plannedEvents: 2,
      events: ["Совместный эфир", "Ивент: розыгрыш среди участников"],
      reactions: 9200,
      comments: 740,
      directMessages: 96,
      posts: [
        { title: "Интеграция: рассказ о платформе", planned: "20 июля", published: "20 июля, 15:00" },
        { title: "Совместный эфир", planned: "25 июля", published: null },
        { title: "Итоги запуска", planned: "28 июля", published: null },
      ],
      result: {
        wroteDm: 96,
        calls: 31,
        startedSpin: 18,
        fullSpin: 9,
        cashRevenue: 96000,
        spinRevenue: 210000,
      },
    },
    sales: {
      wroteDm: 96,
      reachedCall: 31,
      calls: [
        { person: "Анна Лебедева", at: "25 июля, 13:00", result: "Оплатила VIP-группу", cash: 15000, wentToSpin: true },
        { person: "Сергей Гущин", at: "26 июля, 11:30", result: "Думает, повторный созвон", cash: 0, wentToSpin: null },
      ],
    },
  },
];

const compact = (value: number) =>
  value >= 1000 ? `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}K` : String(value);

// Универсальная воронка-цепочка этапов (та же концепция, что «Путь лида»):
// вертикальные шаги с прогрессом, раскрываются по клику.
type FunnelStage = {
  key: string;
  title: string;
  sub: string;
  badge: string;
  pct: number;
  detail: ReactNode;
};

function FunnelFlow({ stages, defaultOpen }: { stages: FunnelStage[]; defaultOpen?: string }) {
  const [open, setOpen] = useState<string | null>(defaultOpen ?? stages[0]?.key ?? null);
  return (
    <div className="journey funnel-flow">
      {stages.map((stage) => {
        const isOpen = open === stage.key;
        return (
          <div key={stage.key} className={`journey-stage ${stage.pct >= 100 ? "is-done" : ""} ${isOpen ? "is-open" : ""}`}>
            <button className="journey-head" onClick={() => setOpen(isOpen ? null : stage.key)}>
              <span className="journey-node" />
              <span className="journey-titles">
                <strong>{stage.title}</strong>
                <small>{stage.sub}</small>
              </span>
              <span className="journey-badge">{stage.badge}</span>
              <span className="journey-caret">{isOpen ? "▾" : "▸"}</span>
            </button>
            <div className="journey-bar"><i style={{ width: `${Math.min(100, stage.pct)}%` }} /></div>
            {isOpen && <div className="journey-detail">{stage.detail}</div>}
          </div>
        );
      })}
    </div>
  );
}

// Карточка одного медиа-ресурса по ТЗ заказчика.
function MediaResourceCard({ item, initialOpen = false }: { item: MediaResource; initialOpen?: boolean }) {
  const [open, setOpen] = useState(initialOpen);
  const w = item.warmup;
  const publishedPosts = w.posts.filter((post) => post.published).length;
  const postsPct = w.posts.length ? Math.round((publishedPosts / w.posts.length) * 100) : 0;
  const engagement = w.reactions + w.comments + w.directMessages;
  const spinPct = w.result.startedSpin ? Math.round((w.result.fullSpin / w.result.startedSpin) * 100) : 0;

  const s = item.sales;
  const qualPct = s.wroteDm ? Math.round((s.reachedCall / s.wroteDm) * 100) : 0;
  const doneCalls = s.calls.filter((call) => call.wentToSpin !== null);
  const cashCollected = s.calls.reduce((sum, call) => sum + call.cash, 0);
  const sentToSpin = s.calls.filter((call) => call.wentToSpin === true).length;
  const callsPct = s.calls.length ? Math.round((doneCalls.length / s.calls.length) * 100) : 0;
  // Выручка, если все отправленные на открут дойдут до полного открута.
  const avgFullSpin = w.result.fullSpin ? Math.round(w.result.spinRevenue / w.result.fullSpin) : 0;
  const potentialRevenue = sentToSpin * avgFullSpin;

  return (
    <article className="media-resource">
      <button className="media-resource-head media-resource-toggle" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        <Avatar initials={item.initials} large />
        <div>
          <strong>{item.name}</strong>
          <small>{item.type}</small>
        </div>
        <div className="media-resource-nums">
          <div><span>Аудитория</span><strong>{compact(item.audience)}</strong></div>
          <div><span>Суточный охват</span><strong>{compact(item.dailyReach)}</strong></div>
        </div>
        <span className="media-resource-chevron">{open ? "⌃" : "⌄"}</span>
      </button>

      {!open && <div className="media-resource-preview"><span>Комьюнити: {item.communities.length}</span><span>Прогрев: {w.plannedPosts} постов</span><span>Лиды: {item.leads}</span><strong>Нажмите, чтобы раскрыть подробности</strong></div>}

      {open && <>

      <section className="media-block">
        <h4>Действующие комьюнити</h4>
        {item.communities.length ? (
          <div className="community-list">
            {item.communities.map((community) => (
              <div key={community.name} className="community-row">
                <strong>{community.name}</strong>
                <div className="community-meta">
                  <span>Участников <b>{community.members.toLocaleString("ru-RU")}</b></span>
                  <span>Направление <b>{community.direction}</b></span>
                  <span>Вход <b>{community.entryFee ? money(community.entryFee) : "бесплатно"}</b></span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">Отсутствуют</div>
        )}
      </section>

      <section className="media-block">
        <h4>Прогрев-план</h4>
        <FunnelFlow
          defaultOpen={`warm-${item.id}`}
          stages={[
            {
              key: `warm-${item.id}`,
              title: "Прогрев",
              sub: `${w.start} — ${w.end}`,
              badge: `${w.plannedPosts} постов`,
              pct: 100,
              detail: (
                <div className="journey-detail-grid">
                  <div><span>Начало прогрева</span><strong>{w.start}</strong></div>
                  <div><span>Конец прогрева</span><strong>{w.end}</strong></div>
                  <div><span>План постов</span><strong>{w.plannedPosts}</strong></div>
                  <div><span>План мероприятий</span><strong>{w.plannedEvents}</strong></div>
                  <div className="full"><span>Инфоповоды · ивенты · эфиры</span>
                    <ul className="event-list">{w.events.map((event) => <li key={event}>{event}</li>)}</ul>
                  </div>
                </div>
              ),
            },
            {
              key: `stat-${item.id}`,
              title: "Статистика по прогреву",
              sub: `${publishedPosts} из ${w.posts.length} постов вышло`,
              badge: `${postsPct}%`,
              pct: postsPct,
              detail: (
                <>
                  <div className="journey-detail-grid">
                    <div><span>Реакции</span><strong>{w.reactions.toLocaleString("ru-RU")}</strong></div>
                    <div><span>Комментарии</span><strong>{w.comments}</strong></div>
                    <div><span>Написали в личку</span><strong>{w.directMessages}</strong></div>
                    <div><span>Вовлечённость</span><strong>{engagement.toLocaleString("ru-RU")}</strong></div>
                  </div>
                  <div className="post-list">
                    <span className="mat-title">Посты прогрева</span>
                    {w.posts.map((post) => (
                      <div key={post.title} className={`post-row ${post.published ? "is-out" : "is-wait"}`}>
                        <strong>{post.title}</strong>
                        <span>план: {post.planned}</span>
                        {post.published
                          ? <b className="lime">вышел {post.published}</b>
                          : <b className="muted">ещё не вышел</b>}
                      </div>
                    ))}
                  </div>
                </>
              ),
            },
            {
              key: `res-${item.id}`,
              title: "Итог прогрева",
              sub: `${w.result.fullSpin} дошли до полного открута`,
              badge: `${spinPct}%`,
              pct: spinPct,
              detail: (
                <div className="journey-detail-grid">
                  <div><span>Написали в личку</span><strong>{w.result.wroteDm}</strong></div>
                  <div><span>Созвонов проведено</span><strong>{w.result.calls}</strong></div>
                  <div><span>Начали открут</span><strong>{w.result.startedSpin}</strong></div>
                  <div><span>Дошли до полного открута</span><strong className="lime">{w.result.fullSpin}</strong></div>
                  <div><span>Выручка за наличку</span><strong>{money(w.result.cashRevenue)}</strong></div>
                  <div><span>Выручка с открутов</span><strong className="lime">{money(w.result.spinRevenue)}</strong></div>
                </div>
              ),
            },
          ]}
        />
      </section>

      <section className="media-block">
        <h4>Отдел продаж</h4>
        <FunnelFlow
          defaultOpen={`qual-${item.id}`}
          stages={[
            {
              key: `qual-${item.id}`,
              title: "Квалификация",
              sub: `${s.reachedCall} из ${s.wroteDm} вышли на созвон`,
              badge: `${qualPct}%`,
              pct: qualPct,
              detail: (
                <div className="journey-detail-grid">
                  <div><span>Написали в личку</span><strong>{s.wroteDm}</strong></div>
                  <div><span>Вышли на созвон</span><strong className="lime">{s.reachedCall}</strong></div>
                  <div><span>Конверсия в созвон</span><strong>{qualPct}%</strong></div>
                </div>
              ),
            },
            {
              key: `calls-${item.id}`,
              title: "Созвоны",
              sub: `${doneCalls.length} из ${s.calls.length} проведено`,
              badge: `${callsPct}%`,
              pct: callsPct,
              detail: s.calls.length ? (
                <div className="call-list">
                  {s.calls.map((call) => (
                    <div key={`${call.person}-${call.at}`} className="call-row">
                      <div className="call-top">
                        <strong>{call.person}</strong>
                        <span className="muted">{call.at}</span>
                      </div>
                      <p>{call.result}</p>
                      <div className="call-meta">
                        <span>Наличка: <b>{call.cash ? money(call.cash) : "—"}</b></span>
                        {call.wentToSpin === null
                          ? <span className="offer-status offer-status-draft">Созвон запланирован</span>
                          : call.wentToSpin
                            ? <span className="offer-status offer-status-approved">Вышел на открут</span>
                            : <span className="offer-status offer-status-review">Не вышел на открут</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : <div className="empty-state">Созвонов пока нет.</div>,
            },
            {
              key: `sres-${item.id}`,
              title: "Итог",
              sub: `${sentToSpin} отправлено на открут`,
              badge: money(cashCollected),
              pct: s.calls.length ? Math.round((sentToSpin / s.calls.length) * 100) : 0,
              detail: (
                <div className="journey-detail-grid">
                  <div><span>Проведено созвонов</span><strong>{doneCalls.length}</strong></div>
                  <div><span>Кассы собрано</span><strong className="lime">{money(cashCollected)}</strong></div>
                  <div><span>Отправлено на открут</span><strong>{sentToSpin}</strong></div>
                  <div><span>Выручка при полном откруте</span><strong className="lime">{money(potentialRevenue)}</strong></div>
                </div>
              ),
            },
          ]}
        />
      </section>
      </>}
    </article>
  );
}

function MediaView({ showToast }: { showToast: (message: string) => void }) {
  const [resources, setResources] = useState(MEDIA_RESOURCES);
  const [adding, setAdding] = useState(false);
  const [resourceName, setResourceName] = useState("");
  const [resourceUrl, setResourceUrl] = useState("");
  const [resourceType, setResourceType] = useState("Telegram");
  const totalReach = resources.reduce((sum, item) => sum + item.reach, 0);
  const totalLeads = resources.reduce((sum, item) => sum + item.leads, 0);
  const totalSpend = resources.reduce((sum, item) => sum + item.spend, 0);
  const totalRevenue = resources.reduce((sum, item) => sum + item.revenue, 0);
  const avgCpl = Math.round(totalSpend / totalLeads);
  const roi = Math.round((totalRevenue / totalSpend) * 100);

  return (
    <>
      <div className="page-title compact-title">
        <div><span className="eyebrow">Premium Private</span><h1>Медиа</h1><p>Ресурсы привлечения в команду и данные для продюсерского центра.</p></div>
        <button className="primary-button" onClick={() => setAdding((value) => !value)}>＋ Добавить ресурс</button>
      </div>

      <div className="media-summary">
        <div className="media-kpi"><span>Суммарный охват</span><strong>{compact(totalReach)}</strong><small>по всем ресурсам</small></div>
        <div className="media-kpi"><span>Привлечено лидов</span><strong>{totalLeads}</strong><small>за период</small></div>
        <div className="media-kpi"><span>Число подписчиков</span><strong>{compact(resources.reduce((sum, item) => sum + item.followers, 0))}</strong><small>по всем ресурсам</small></div>
        <div className="media-kpi"><span>Заработано</span><strong className="lime">{money(resources.reduce((sum, item) => sum + item.revenue, 0))}</strong><small>доход с медиа</small></div>
      </div>

      <div className="media-resources">
        {resources.map((item) => <MediaResourceCard key={item.id} item={item} />)}
      </div>

    </>
  );
}

const OFFER_CAPS = [
  { offer: "Альфа-Банк · РКО", max: 10000 },
  { offer: "Т-Банк · Дебет", max: 7000 },
  { offer: "Уралсиб · РКО", max: 8500 },
  { offer: "OTP · МФО", max: 5000 },
];

function PayoutCaps() {
  const [payouts, setPayouts] = useState(OFFER_CAPS.map((cap) => Math.round(cap.max * 0.7)));
  const [flash, setFlash] = useState<number | null>(null);

  const setPayout = (index: number, raw: number) => {
    const max = OFFER_CAPS[index].max;
    const clamped = Math.min(max, Math.max(0, raw || 0));
    if (raw > max) {
      setFlash(index);
      window.setTimeout(() => setFlash((current) => (current === index ? null : current)), 1200);
    }
    setPayouts((current) => current.map((value, idx) => (idx === index ? clamped : value)));
  };

  return (
    <Panel title="Выплаты по офферам" subtitle="Ставка команде — не выше максимума, заданного администратором">
      <div className="table-scroll">
        <table>
          <thead>
            <tr><th>Оффер</th><th>Макс. (админ)</th><th>Ставка команде</th><th>Ваша маржа</th></tr>
          </thead>
          <tbody>
            {OFFER_CAPS.map((cap, index) => (
              <tr key={cap.offer}>
                <td><strong>{cap.offer}</strong></td>
                <td data-label="Макс. (админ)"><span className="cap-max">{money(cap.max)}</span></td>
                <td data-label="Ставка команде">
                  <div className={`cap-input ${flash === index ? "cap-flash" : ""}`}>
                    <input
                      type="number"
                      value={payouts[index]}
                      max={cap.max}
                      onChange={(event) => setPayout(index, Number(event.target.value))}
                    />
                    {flash === index && <span className="cap-warn">Не выше {money(cap.max)}</span>}
                  </div>
                </td>
                <td data-label="Ваша маржа"><strong className="lime">{money(cap.max - payouts[index])}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
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
  const [keys, setKeys] = useState([
    { generated: "MK-TEAM-2026", role: "Team Lead", used: "12 / 25", expires: "31.08.2026" },
    { generated: "LEAD-SILVER", role: "Lead Generator", used: "4 / 20", expires: "15.08.2026" },
    { generated: "ADMIN-ONE", role: "Администратор", used: "1 / 2", expires: "01.09.2026" },
  ]);
  const [showKeyForm, setShowKeyForm] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [keyPassword, setKeyPassword] = useState("");
  const [keyRole, setKeyRole] = useState("Lead Generator");
  const [keyTeam, setKeyTeam] = useState("Excellent");
  return (
    <>
      <div className="page-title compact-title">
        <div><span className="eyebrow">Premium Private</span><h1>Админка</h1><p>Ключи регистрации, доступы участников и журнал входов.</p></div>
        <button className="primary-button" onClick={() => setShowKeyForm((value) => !value)}>＋ Создать ключ</button>
      </div>
      <PayoutCaps />
      {showKeyForm && <label className="key-password-field"><span>Пароль / код доступа</span><input value={keyPassword} onChange={(event) => setKeyPassword(event.target.value)} placeholder="Оставьте пустым для генерации" /></label>}
      {showKeyForm && <div className="key-create-form"><label><span>Имя</span><input value={keyName} onChange={(event) => setKeyName(event.target.value)} placeholder="Имя участника" /></label><label><span>Роль</span><select value={keyRole} onChange={(event) => setKeyRole(event.target.value)}><option>Lead Generator</option><option>Team Lead</option><option>Leader</option><option>Influencer</option><option>Администратор</option></select></label><label><span>Команда</span><select value={keyTeam} onChange={(event) => setKeyTeam(event.target.value)}><option>Excellent</option><option>Северная</option><option>Вектор</option><option>Blogsphere</option></select></label><button className="primary-button" onClick={() => { const generated = `MK-${Math.random().toString(36).slice(2, 8).toUpperCase()}`; setKeys((current) => [{ generated, role: `${keyRole} · ${keyName || "Новый участник"} · ${keyTeam}`, used: "0 / 1", expires: "Без ограничения" }, ...current]); setKeyName(""); setShowKeyForm(false); }}>Создать ключ</button></div>}
      {showKeyForm && keyPassword.trim() && <button className="secondary-button key-save-custom" onClick={() => { const generated = keyPassword.trim(); setKeys((current) => [{ generated, role: `${keyRole} · ${keyName || "Новый участник"} · ${keyTeam}`, used: "0 / 1", expires: "Без ограничений" }, ...current]); setKeyName(""); setKeyPassword(""); setShowKeyForm(false); }}>Сохранить этот код доступа</button>}
      <div className="two-columns access-no-policy">
        <Panel title="Ключи доступа" subtitle="Для регистрации новых участников">
          <div className="access-keys">
            {keys.map((key) => <div key={key.generated}><code>{key.generated}</code><span><strong>{key.role}</strong><small>Использовано {key.used} · до {key.expires}</small></span><button onClick={() => navigator.clipboard?.writeText(key.generated)}>Копировать</button><button className="row-action" aria-label={`Удалить ключ ${key.generated}`} onClick={() => { if (window.confirm("Точно хотите удалить?")) setKeys((current) => current.filter((item) => item.generated !== key.generated)); }}>×</button></div>)}
          </div>
        </Panel>
      </div>
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

function LeadJourney({ lead }: { lead: Lead }) {
  const [open, setOpen] = useState<string | null>("offers");
  const dir = lead.direction ?? "РКО";
  // Все офферы направления из каталога + фактические офферы лида. Те, что
  // лид ещё не начал, показываем как «Не оформлен».
  const offerByBank = new Map(lead.offers.map((offer) => [offer.bank, offer]));
  const catalogBanks = DIRECTION_CATALOG[dir] ?? [];
  const extraOffers = lead.offers.filter((offer) => !catalogBanks.includes(offer.bank));
  const rows: { bank: string; offer: OfferItem | null }[] = [
    ...catalogBanks.map((bank) => ({ bank, offer: offerByBank.get(bank) ?? null })),
    ...extraOffers.map((offer) => ({ bank: offer.bank, offer })),
  ];
  const total = rows.length;
  const formed = rows.filter((row) => row.offer && row.offer.status !== "Оформляется").length;
  const approved = rows.filter((row) => row.offer && row.offer.status === "Одобрен").length;
  const offersPct = total ? Math.round((formed / total) * 100) : 0;
  const cdPct = total ? Math.round((approved / total) * 100) : 0;
  const payoutSum = lead.offers.reduce((sum, offer) => sum + offer.payout, 0);
  const approvedSum = lead.offers
    .filter((offer) => offer.status === "Одобрен")
    .reduce((sum, offer) => sum + offer.payout, 0);

  const stages = [
    {
      key: "ip",
      title: "ИП на НПД",
      sub: "ИП без страховых взносов",
      pct: 100,
      done: true,
      empty: false,
      badge: "Оформлен",
      detail: (
        <div className="journey-detail-grid">
          <div><span>Дата оформления</span><strong>{lead.ipDate ?? "—"}</strong></div>
          <div><span>Режим</span><strong>НПД (без взносов)</strong></div>
          <div><span>Статус</span><strong>Активен</strong></div>
        </div>
      ),
    },
    {
      key: "offers",
      title: `${dir} · офферы`,
      sub: `${formed} из ${total} оформлено`,
      pct: offersPct,
      done: offersPct === 100,
      empty: total === 0,
      badge: `${offersPct}%`,
      detail: total ? (
        <div className="journey-offers">
          {rows.map((row, index) => (
            <div key={`${row.bank}-${index}`} className={`journey-offer-row ${row.offer ? "" : "is-pending"}`}>
              <strong>{row.bank}</strong>
              {row.offer ? <OfferStatusPill status={row.offer.status ?? "Оформляется"} /> : <span className="offer-status offer-status-none">Не оформлен</span>}
              <span className="muted">{row.offer ? row.offer.delivery : "Ещё не начат"}</span>
              <b>{row.offer ? money(row.offer.payout) : "—"}</b>
            </div>
          ))}
          <div className="journey-detail-grid">
            <div><span>Офферов в направлении</span><strong>{total}</strong></div>
            <div><span>Оформлено</span><strong>{formed}</strong></div>
            <div><span>Сумма по офферам</span><strong>{money(payoutSum)}</strong></div>
          </div>
        </div>
      ) : (
        <div className="empty-state">Офферы ещё не заведены.</div>
      ),
    },
    {
      key: "cd",
      title: "ЦД · целевые действия",
      sub: `${approved} из ${total} засчитано`,
      pct: cdPct,
      done: cdPct === 100 && total > 0,
      empty: total === 0,
      badge: `${cdPct}%`,
      detail: (
        <div className="journey-detail-grid">
          <div><span>Засчитано ЦД</span><strong>{approved}</strong></div>
          <div><span>Ожидают сверки</span><strong>{formed - approved}</strong></div>
          <div><span>Начислено по ЦД</span><strong>{money(approvedSum)}</strong></div>
        </div>
      ),
    },
    {
      key: "other",
      title: "Другое направление",
      sub: "Ещё не перешёл",
      pct: 0,
      done: false,
      empty: true,
      badge: "—",
      detail: (
        <div className="empty-state">
          Лид ещё не перешёл на другое направление. Данные появятся после первого
          оффера в новом направлении.
        </div>
      ),
    },
  ];

  return (
    <div className="journey">
      {stages.map((stage) => {
        const isOpen = open === stage.key;
        return (
          <div
            key={stage.key}
            className={`journey-stage ${stage.done ? "is-done" : ""} ${stage.empty ? "is-empty" : ""} ${isOpen ? "is-open" : ""}`}
          >
            <button
              className="journey-head"
              onClick={() => setOpen(isOpen ? null : stage.key)}
            >
              <span className="journey-node" />
              <span className="journey-titles">
                <strong>{stage.title}</strong>
                <small>{stage.sub}</small>
              </span>
              <span className="journey-badge">{stage.badge}</span>
              <span className="journey-caret">{isOpen ? "▾" : "▸"}</span>
            </button>
            {!stage.empty && (
              <div className="journey-bar">
                <i style={{ width: `${stage.pct}%` }} />
              </div>
            )}
            {isOpen && <div className="journey-detail">{stage.detail}</div>}
          </div>
        );
      })}
    </div>
  );
}

// Раскрывающаяся секция карточки («шкафчик»): свёрнута — видна подпись-итог,
// по клику разворачивается и добавляет подробности.
function Fold({
  title,
  badge,
  summary,
  defaultOpen = false,
  forceOpen = false,
  children,
}: {
  title: string;
  badge?: ReactNode;
  summary?: ReactNode;
  defaultOpen?: boolean;
  forceOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const isOpen = forceOpen || open;
  return (
    <div className={`drawer-section fold ${isOpen ? "is-open" : ""}`}>
      <button className="fold-head" onClick={() => setOpen((value) => !value)} aria-expanded={isOpen}>
        <h3>{title}</h3>
        {badge}
        {!isOpen && summary != null && <span className="fold-summary">{summary}</span>}
        <span className="fold-caret" aria-hidden>{isOpen ? "−" : "+"}</span>
      </button>
      {isOpen && <div className="fold-body">{children}</div>}
    </div>
  );
}

function LeadDrawer({
  lead,
  editing,
  setEditing,
  updateLead,
  updateOfferStatus,
  onClose,
  onSave,
}: {
  lead: Lead;
  editing: boolean;
  setEditing: (value: boolean) => void;
  updateLead: (field: keyof Lead, value: string | number) => void;
  updateOfferStatus: (offerIndex: number, status: OfferStatus) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<{ text: string; time: string }[]>([]);

  const addComment = () => {
    const text = commentText.trim();
    if (!text) return;
    setComments((current) => [{ text, time: "Только что · вы" }, ...current]);
    setCommentText("");
  };

  // Сводки для свёрнутых секций (совпадают с расчётами в «Пути лида»).
  const dir = lead.direction ?? "РКО";
  const catalogBanks = DIRECTION_CATALOG[dir] ?? [];
  const extraOffers = lead.offers.filter((offer) => !catalogBanks.includes(offer.bank));
  const jTotal = catalogBanks.length + extraOffers.length;
  const jFormed = lead.offers.filter((offer) => offer.status !== "Оформляется").length;
  const jApproved = lead.offers.filter((offer) => offer.status === "Одобрен").length;
  const offersPct = jTotal ? Math.round((jFormed / jTotal) * 100) : 0;
  const cdPct = jTotal ? Math.round((jApproved / jTotal) * 100) : 0;
  const balance = leadBalance(lead);
  const forecast = leadForecast(lead);

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

        <div className="drawer-section compact-facts">
          <div className="section-title"><h3>Данные о лиде</h3><span className="ai-score">AI {lead.ai}/100</span></div>
          <div className="lead-facts">
            <a href={`tel:${lead.phone}`}><span>Номер</span><strong>{lead.phone}</strong></a>
            <a href="#"><span>Telegram</span><strong>{lead.telegram}</strong></a>
            <div><span>Юзернейм</span><strong>{lead.username || "—"}</strong></div>
            <div><span>Трафик</span><strong>{lead.traffic ?? "—"}</strong></div>
            <div><span>Команда</span><strong>{lead.team}</strong></div>
            <div><span>Баланс</span><strong className="lime">{money(balance)}</strong></div>
          </div>
          {lead.description && <p className="lead-description">{lead.description}</p>}
        </div>

        <Fold
          title="Путь лида"
          badge={<DirectionPill direction={dir} />}
          summary={`${offersPct}% офферы · ${cdPct}% ЦД`}
        >
          <LeadJourney lead={lead} />
        </Fold>

        <Fold
          title="Офферы"
          badge={<span className="fold-count">{lead.offers.length}</span>}
          summary={`Баланс ${money(balance)} · прогноз ${money(forecast)}`}
        >
          <div className="offer-list">
            {lead.offers.map((offer, index) => (
              <article key={`${offer.bank}-${index}`}>
                <div className="offer-top"><span className="offer-index">0{index + 1}</span><div><strong>{offer.bank}</strong><p>{offer.product}</p></div>{editing ? <select className="offer-status-select" value={offer.status ?? "Оформляется"} onChange={(event) => updateOfferStatus(index, event.target.value as OfferStatus)}><option>Оформляется</option><option>Ждёт сверки</option><option>Одобрен</option></select> : <OfferStatusPill status={offer.status ?? "Оформляется"} />}</div>
                <div className="offer-meta"><div><span>Мы получаем</span><strong>{money(offerGross(offer))}</strong></div><div><span>Выплата агенту</span><strong>{money(offer.payout)}</strong></div><div><span>Наша прибыль</span><strong className="lime">{money(offerGross(offer) - offer.payout)}</strong></div></div>
                <p className="delivery">◷ {offer.delivery}</p>
              </article>
            ))}
            {!lead.offers.length && <div className="empty-state">Офферы ещё не добавлены.</div>}
          </div>
          {!!lead.offers.length && <div className="finance-total money-total"><span>Финансы по лиду</span><div><small>Баланс (заработано)</small><strong className="lime">{money(balance)}</strong></div><div><small>Прогноз (потенциал)</small><strong>{money(forecast)}</strong></div><div><small>Наша прибыль</small><strong className="lime">{money(leadProfit(lead))}</strong></div></div>}
        </Fold>

        <Fold
          title="Управление"
          badge={<StatusBadge status={lead.status} />}
          summary={editing ? "режим редактирования" : "статус, направление, данные"}
          forceOpen={editing}
        >
          <div className="edit-grid">
            <label><span>Направление</span>{editing ? <select value={lead.direction ?? "РКО"} onChange={(event) => updateLead("direction", event.target.value)}><option>РКО</option><option>Беттинг</option><option>МФО</option></select> : (lead.direction ? <DirectionPill direction={lead.direction} /> : <strong>—</strong>)}</label>
            <label><span>Трафик</span>{editing ? <select value={lead.traffic ?? "Онлайн"} onChange={(event) => updateLead("traffic", event.target.value)}><option>Онлайн</option><option>Оффлайн</option></select> : <strong>{lead.traffic ?? "—"}</strong>}</label>
            <label><span>ФИО</span>{editing ? <input value={lead.client} onChange={(event) => updateLead("client", event.target.value)} /> : <strong>{lead.client}</strong>}</label>
            <label><span>Номер</span>{editing ? <input value={lead.phone} onChange={(event) => updateLead("phone", event.target.value)} /> : <strong>{lead.phone}</strong>}</label>
            <label><span>Ник (Telegram)</span>{editing ? <input value={lead.telegram} onChange={(event) => updateLead("telegram", event.target.value)} /> : <strong>{lead.telegram}</strong>}</label>
            <label><span>Юзернейм</span>{editing ? <input value={lead.username ?? ""} onChange={(event) => updateLead("username", event.target.value)} /> : <strong>{lead.username || "—"}</strong>}</label>
            <label><span>Статус лида</span>{editing ? <select value={lead.status} onChange={(event) => updateLead("status", event.target.value)}><option>Новый</option><option>В работе</option><option>Успешно</option><option>Отказ</option></select> : <StatusBadge status={lead.status} />}</label>
          </div>
        </Fold>

        <Fold
          title="Комментарии и история"
          summary={`${comments.length + 3} в истории`}
        >
          <div className="comment-box">
            <textarea
              placeholder="Добавить комментарий…"
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              onKeyDown={(event) => {
                if ((event.ctrlKey || event.metaKey) && event.key === "Enter") addComment();
              }}
            />
            <button onClick={addComment}>Отправить</button>
          </div>
          <div className="timeline">
            {comments.map((comment, index) => (
              <div key={index}><i /><span><strong>{comment.text}</strong><small>{comment.time}</small></span></div>
            ))}
            <div><i /><span><strong>Статус изменён на «{lead.status}»</strong><small>Сегодня, 12:48 · {lead.manager}</small></span></div>
            <div><i /><span><strong>Данные лида обновлены</strong><small>Сегодня, 11:52 · система</small></span></div>
            <div><i /><span><strong>Лид создан из источника «{lead.source}»</strong><small>{lead.created}</small></span></div>
          </div>
        </Fold>
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
  showToast,
}: {
  user: User;
  leads: Lead[];
  onLead: (id: number) => void;
  onClose: () => void;
  onToggle: () => void;
  showToast: (message: string) => void;
}) {
  const [expandedStat, setExpandedStat] = useState<"revenue" | "leads" | "conversion" | "offer" | null>(null);
  const bySource = useMemo(() => {
    const map = new Map<string, { leads: number; earned: number; potential: number }>();
    leads.forEach((lead) => {
      const cur = map.get(lead.source) ?? { leads: 0, earned: 0, potential: 0 };
      cur.leads += 1;
      cur.earned += leadBalance(lead);
      cur.potential += leadForecast(lead);
      map.set(lead.source, cur);
    });
    return [...map.entries()].sort((a, b) => b[1].earned - a[1].earned);
  }, [leads]);
  const byOffer = useMemo(() => {
    const map = new Map<string, { leads: number; earned: number }>();
    leads.forEach((lead) => {
      const name = lead.direction ?? lead.product ?? "Без оффера";
      const current = map.get(name) ?? { leads: 0, earned: 0 };
      current.leads += 1;
      current.earned += leadBalance(lead);
      map.set(name, current);
    });
    return [...map.entries()].sort((a, b) => b[1].earned - a[1].earned);
  }, [leads]);
  const successfulLeads = leads.filter((lead) => lead.status === "Успешно").length;
  const setExpanded = (value: "revenue" | "leads" | "conversion" | "offer") =>
    setExpandedStat((current) => (current === value ? null : value));

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
          <button className={`hero-stat-btn ${expandedStat === "revenue" ? "is-open" : ""}`} onClick={() => setExpanded("revenue")}><span>Выручка ›</span><strong>{money(user.revenue)}</strong><small className="positive">+14,8%</small></button>
          <button className={`hero-stat-btn ${expandedStat === "leads" ? "is-open" : ""}`} onClick={() => setExpanded("leads")}><span>Лиды ›</span><strong>{user.leads}</strong><small>за месяц</small></button>
          <button className={`hero-stat-btn ${expandedStat === "conversion" ? "is-open" : ""}`} onClick={() => setExpanded("conversion")}><span>Конверсия ›</span><strong>{user.conversion}%</strong><small>топ 24%</small></button>
          <button className={`hero-stat-btn ${expandedStat === "offer" ? "is-open" : ""}`} onClick={() => setExpanded("offer")}><span>Топ оффер ›</span><strong>{user.topOffer}</strong><small>по доходу</small></button>
        </div>
        {expandedStat === "revenue" && (
          <div className="drawer-section">
            <div className="section-title"><h3>Откуда выручка</h3><span>по источникам лидов</span></div>
            <div className="revenue-breakdown">
              {bySource.map(([source, stat]) => (
                <div key={source} className="revenue-row">
                  <strong>{source}</strong>
                  <span className="muted">{stat.leads} {leadWord(stat.leads)}</span>
                  <span className="rev-earned">{money(stat.earned)}</span>
                  <span className="rev-potential">потенциал {money(stat.potential)}</span>
                </div>
              ))}
              {!bySource.length && <div className="empty-state">Нет данных по выручке.</div>}
            </div>
          </div>
        )}
        {expandedStat === "leads" && (
          <div className="drawer-section stat-detail-section">
            <div className="section-title"><h3>Подробно по лидам</h3><span>{leads.length} в текущей выборке</span></div>
            <div className="session-grid"><div><span>Всего лидов</span><strong>{user.leads}</strong></div><div><span>Успешно</span><strong>{successfulLeads}</strong></div><div><span>В работе</span><strong>{leads.filter((lead) => lead.status === "В работе").length}</strong></div><div><span>Отказ</span><strong>{leads.filter((lead) => lead.status === "Отказ").length}</strong></div></div>
            <div className="user-leads detail-leads-list">{leads.map((lead) => <button key={lead.id} onClick={() => onLead(lead.id)}><Avatar initials={lead.initials} /><span><strong>{lead.client}</strong><small>{lead.direction ?? lead.product} · {lead.source}</small></span><StatusBadge status={lead.status} /><b>{money(leadBalance(lead))}</b><i>›</i></button>)}</div>
          </div>
        )}
        {expandedStat === "conversion" && (
          <div className="drawer-section stat-detail-section">
            <div className="section-title"><h3>Конверсия по источникам</h3><span>успешные лиды / все лиды</span></div>
            <div className="revenue-breakdown">{bySource.map(([source, stat]) => { const sourceLeads = leads.filter((lead) => lead.source === source); const success = sourceLeads.filter((lead) => lead.status === "Успешно").length; const rate = sourceLeads.length ? Math.round((success / sourceLeads.length) * 100) : 0; return <div key={source} className="revenue-row"><strong>{source}</strong><span className="muted">{success} из {sourceLeads.length}</span><span className="rev-earned">{rate}%</span></div>; })}</div>
          </div>
        )}
        {expandedStat === "offer" && (
          <div className="drawer-section stat-detail-section">
            <div className="section-title"><h3>Распределение по офферам</h3><span>выручка и лиды</span></div>
            <div className="revenue-breakdown">{byOffer.map(([offer, stat]) => <div key={offer} className="revenue-row"><strong>{offer}</strong><span className="muted">{stat.leads} лидов</span><span className="rev-earned">{money(stat.earned)}</span></div>)}</div>
          </div>
        )}
        <div className="drawer-section">
          <div className="section-title"><h3>Активность</h3><span className="live-pill">● онлайн</span></div>
          <div className="session-grid"><div><span>Последний вход</span><strong>{user.lastLogin}</strong></div><div><span>Текущая сессия</span><strong>{user.session}</strong></div><div><span>Среднее в день</span><strong>3 ч 14 мин</strong></div><div><span>Входов за месяц</span><strong>86</strong></div></div>
          <BarChart compact values={[32, 47, 59, 42, 68, 76, 61]} labels={["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]} />
        </div>
        <div className="drawer-section">
          <div className="section-title"><h3>Лиды пользователя</h3><span>полный список · {leads.length} {leadWord(leads.length)}</span></div>
          <div className="user-leads">
            {leads.map((lead) => <button key={lead.id} onClick={() => onLead(lead.id)}><Avatar initials={lead.initials} /><span><strong>{lead.client}</strong><small>{lead.direction ?? lead.product} · {lead.source}</small></span><StatusBadge status={lead.status} /><b>{money(leadBalance(lead))}</b><i>›</i></button>)}
            {!leads.length && <div className="empty-state">Нет лидов у пользователя.</div>}
          </div>
        </div>
        <div className="drawer-section">
          <div className="section-title"><h3>Условия доступа</h3><button className="text-button" onClick={() => showToast("Редактирование условий доступа (демо)")}>Редактировать</button></div>
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
  openLead,
  drill,
  showToast,
}: {
  type: string;
  users: User[];
  leads: Lead[];
  onClose: () => void;
  openUser: (id: number) => void;
  openLead: (id: number) => void;
  drill: (type: string) => void;
  showToast: (message: string) => void;
}) {
  // Детализация по статусу лида: тип "status:Новый".
  const statusMatch = type.startsWith("status:") ? type.slice(7) : null;
  // Детализация по источнику выручки: тип "source:Авито".
  const sourceMatch = type.startsWith("source:") ? type.slice(7) : null;
  // Детализация по продукту распределения: тип "product:Дебет".
  const productMatch = type.startsWith("product:") ? type.slice(8) : null;
  // Лиды, оформленные сегодня: тип "today".
  const todayMatch = type === "today";

  const MAIN_PRODUCTS = ["Дебет", "РКО", "Кредит", "МФО", "Регбиз"];
  const productLeads = productMatch
    ? (productMatch === "HR и другие"
        ? leads.filter((lead) => !MAIN_PRODUCTS.includes(lead.product))
        : leads.filter((lead) => lead.product === productMatch))
    : [];
  const productPct = productMatch ? (productStats.find((p) => p.name === productMatch)?.value ?? 0) : 0;
  const productBySource = productMatch
    ? [...productLeads.reduce((map, lead) => map.set(lead.source, (map.get(lead.source) ?? 0) + 1), new Map<string, number>())].sort((a, b) => b[1] - a[1])
    : [];
  const todayLeads = todayMatch ? leads.filter((lead) => lead.created.startsWith("Сегодня")) : [];

  const titles: Record<string, [string, string]> = {
    leads: ["Кто принёс лидов", "Рейтинг по количеству за месяц"],
    revenue: ["Откуда приходит выручка", "Нажмите на источник — увидите лидов и потенциал"],
    conversion: ["Конверсия по источникам", "Это конверсия каждого канала, а не доля — суммироваться в 100% не должна"],
    users: ["Пользователи", "Нажмите, чтобы открыть личную статистику"],
    sessions: ["Входы сегодня", "Время входа и продолжительность сессии"],
    problems: ["Проблемные лиды", "Нажмите на лид — откроется карточка с деталями"],
    balance: ["Баланс", "Доступные к выводу начисления и выплаты"],
    invite: ["Пригласить пользователя", "Роль, команда и срок доступа"],
    key: ["Новый ключ доступа", "Создайте код для регистрации"],
    offer: ["Новый оффер", "Категория, выплата и стоимость ЦД"],
    withdraw: ["Заказать выплату", "Доступно 86 420 ₽"],
  };
  let [title, subtitle] = titles[type] ?? ["Действие", "Заполните данные"];
  if (statusMatch) [title, subtitle] = [`Лиды в статусе «${statusMatch}»`, "Нажмите на лид — откроется карточка"];
  if (sourceMatch) [title, subtitle] = [`Лиды из источника «${sourceMatch}»`, "Сколько принёс каждый и потенциал"];
  if (productMatch) [title, subtitle] = [`Продукт «${productMatch}»`, `${productPct}% всех лидов · откуда пришли и когда оформили`];
  if (todayMatch) [title, subtitle] = ["Лиды за сегодня", "Кто оформил сегодня — источник и время"];
  const simpleForm = ["invite", "key", "offer", "withdraw"].includes(type);
  const statusLeads = statusMatch ? leads.filter((lead) => lead.status === statusMatch) : [];
  const sourceLeads = sourceMatch ? leads.filter((lead) => lead.source === sourceMatch) : [];
  const [genKey, setGenKey] = useState<string | null>(null);
  // Статистические раскрытия относятся к профилю пользователя, а не к этому модальному окну.
  // Значение оставляем закрытым, чтобы старый фрагмент JSX не обращался к данным профиля.
  const expandedStat = null;
  const makeKey = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "MK-";
    for (let i = 0; i < 6; i += 1) code += chars[Math.floor(Math.random() * chars.length)];
    setGenKey(code);
  };
  return (
    <div className="modal-layer">
      <button className="modal-scrim" onClick={onClose} aria-label="Закрыть окно" />
      <div className="modal">
        {type === "conversion" && <div className="conversion-explainer"><strong>Как считается конверсия</strong><p>У каждого канала свой расчёт: успешные лиды ÷ все лиды канала × 100. Поэтому проценты не складываются в 100%.</p><small>Пример: 18 успешных из 58 лидов Авито = 31,0%.</small></div>}
        <div className="modal-head"><div><h2>{title}</h2><p>{subtitle}</p></div><button onClick={onClose}>×</button></div>
        {type === "leads" && <div className="metric-list leaderboard-list">{[...users].sort((a, b) => b.leads - a.leads).map((user, index) => <button key={user.id} className={`leaderboard-row place-${index + 1}`} onClick={() => openUser(user.id)}><span className="rank">{index + 1}</span><Avatar initials={user.initials} /><span><strong>{user.name}</strong><small>{user.team}</small></span><b>{user.leads} лидов</b><i>›</i></button>)}</div>}
        {type === "revenue" && <div className="metric-list sources">{sourceStats.map((source, index) => <button key={source.name} onClick={() => drill(`source:${source.name}`)}><span className="rank">{index + 1}</span><i style={{ background: source.color }} /><span><strong>{source.name}</strong><small>{source.leads} {leadWord(source.leads)}</small></span><b>{money(source.revenue)}</b><i className="chev">›</i></button>)}</div>}
        {(statusMatch || sourceMatch) && <div className="metric-list">{(statusMatch ? statusLeads : sourceLeads).map((lead) => <button key={lead.id} onClick={() => openLead(lead.id)}><Avatar initials={lead.initials} /><span><strong>{lead.client}</strong><small>{lead.direction ?? "—"} · {lead.source}</small></span><span className="metric-money"><b>{money(leadBalance(lead))}</b><small>потенциал {money(leadForecast(lead))}</small></span><i>›</i></button>)}{!(statusMatch ? statusLeads : sourceLeads).length && <div className="empty-state">Нет лидов.</div>}</div>}
        {type === "conversion" && <div className="metric-list sources">{sourceStats.sort((a, b) => b.conversion - a.conversion).map((source, index) => <div key={source.name}><span className="rank">{index + 1}</span><i style={{ background: source.color }} /><span><strong>{source.name}</strong><small>{source.leads} лидов</small></span><div className="progress"><span style={{ width: `${source.conversion * 2.5}%`, background: source.color }} /></div><b>{source.conversion}%</b></div>)}</div>}
        {type === "users" && <div className="metric-list">{users.map((user) => <button key={user.id} onClick={() => openUser(user.id)}><Avatar initials={user.initials} /><span><strong>{user.name}</strong><small>{user.role} · {user.team}</small></span><span className={`user-state ${user.status === "Активен" ? "is-active" : ""}`}>● {user.status}</span><i>›</i></button>)}</div>}
        {type === "sessions" && <div className="metric-list">{users.filter((user) => user.lastLogin.startsWith("Сегодня")).map((user) => <button key={user.id} onClick={() => openUser(user.id)}><Avatar initials={user.initials} /><span><strong>{user.name}</strong><small>Вход: {user.lastLogin.replace("Сегодня, ", "")}</small></span><b>{user.session}</b><i>›</i></button>)}</div>}
        {type === "problems" && <div className="metric-list">{leads.filter((lead) => lead.issue).map((lead) => <button key={lead.id} onClick={() => openLead(lead.id)}><Avatar initials={lead.initials} /><span><strong>{lead.client}</strong><small>{lead.issue} · {lead.manager}</small></span><span className="metric-money"><b className="pink">теряем {money(leadForecast(lead) - leadBalance(lead))}</b><small>потенциал {money(leadForecast(lead))}</small></span><i>›</i></button>)}</div>}
        {type === "balance" && (
          <div className="balance-modal-summary">
            <div><span>Доступно к выводу</span><strong>2 137 400 ₽</strong></div>
            <div><span>Начислено за период</span><b>2 881 600 ₽</b></div>
            <div><span>Выплачено</span><b>744 200 ₽</b></div>
            <button className="primary-button" onClick={() => { onClose(); showToast("Раздел выплат откроется в бухгалтерском учёте"); }}>Открыть выплаты</button>
          </div>
        )}
        {expandedStat === "leads" && (
          <div className="drawer-section stat-detail-section">
            <div className="section-title"><h3>Подробно по лидам</h3><span>{leads.length} в текущей выборке</span></div>
            <div className="session-grid"><div><span>Всего лидов</span><strong>{user.leads}</strong></div><div><span>Успешно</span><strong>{successfulLeads}</strong></div><div><span>В работе</span><strong>{leads.filter((lead) => lead.status === "В работе").length}</strong></div><div><span>Отказ</span><strong>{leads.filter((lead) => lead.status === "Отказ").length}</strong></div></div>
            <div className="user-leads detail-leads-list">{leads.map((lead) => <button key={lead.id} onClick={() => onLead(lead.id)}><Avatar initials={lead.initials} /><span><strong>{lead.client}</strong><small>{lead.direction ?? lead.product} · {lead.source}</small></span><StatusBadge status={lead.status} /><b>{money(leadBalance(lead))}</b><i>›</i></button>)}</div>
          </div>
        )}
        {expandedStat === "conversion" && (
          <div className="drawer-section stat-detail-section">
            <div className="section-title"><h3>Конверсия по источникам</h3><span>лид → успешно</span></div>
            <div className="revenue-breakdown">{bySource.map(([source, stat]) => { const sourceLeads = leads.filter((lead) => lead.source === source); const success = sourceLeads.filter((lead) => lead.status === "Успешно").length; const rate = sourceLeads.length ? Math.round((success / sourceLeads.length) * 100) : 0; return <div key={source} className="revenue-row"><strong>{source}</strong><span className="muted">{success} из {sourceLeads.length}</span><span className="rev-earned">{rate}%</span></div>; })}</div>
          </div>
        )}
        {expandedStat === "offer" && (
          <div className="drawer-section stat-detail-section">
            <div className="section-title"><h3>Распределение по офферам</h3><span>выручка и лиды</span></div>
            <div className="revenue-breakdown">{byOffer.map(([offer, stat]) => <div key={offer} className="revenue-row"><strong>{offer}</strong><span className="muted">{stat.leads} {leadWord(stat.leads)}</span><span className="rev-earned">{money(stat.earned)}</span></div>)}</div>
          </div>
        )}
        {productMatch && (
          <>
            {productBySource.length > 0 && (
              <div className="drill-summary">
                <span className="drill-summary-label">Откуда пришли</span>
                <div className="drill-chips">
                  {productBySource.map(([src, count]) => <span key={src}>{src} · {count} {leadWord(count)}</span>)}
                </div>
              </div>
            )}
            <div className="metric-list">
              {productLeads.map((lead) => <button key={lead.id} onClick={() => openLead(lead.id)}><Avatar initials={lead.initials} /><span><strong>{lead.client}</strong><small>{lead.source} · оформлен {lead.created}</small></span><span className="metric-money"><b>{money(leadBalance(lead))}</b><small>{lead.status}</small></span><i>›</i></button>)}
              {!productLeads.length && <div className="empty-state">По этому продукту лидов пока нет в базе.</div>}
            </div>
          </>
        )}
        {todayMatch && (
          <div className="metric-list">
            {todayLeads.map((lead) => <button key={lead.id} onClick={() => openLead(lead.id)}><Avatar initials={lead.initials} /><span><strong>{lead.client}</strong><small>{lead.product} · {lead.source}</small></span><span className="metric-money"><b>{lead.created.replace("Сегодня, ", "")}</b><small>{lead.status}</small></span><i>›</i></button>)}
            {!todayLeads.length && <div className="empty-state">Сегодня новых лидов пока нет.</div>}
          </div>
        )}
        {simpleForm && (
          <div className="modal-form">
            {type === "invite" && <><label><span>Имя пользователя</span><input placeholder="Иван Иванов" /></label><label><span>Роль</span><select><option>Lead Generator</option><option>Team Lead</option><option>Leader</option><option>Influencer</option><option>Администратор</option></select></label><label><span>Команда</span><select><option>Excellent</option><option>Северная</option><option>Вектор</option><option>Blogsphere</option></select></label></>}
            {type === "key" && <><label><span>Роль</span><select><option>Lead Generator</option><option>Team Lead</option><option>Leader</option><option>Influencer</option><option>Администратор</option></select></label><label><span>Максимум использований</span><input type="number" defaultValue="20" /></label><label><span>Действует до</span><input type="date" /></label></>}
            {type === "offer" && <><label><span>Категория</span><select><option>РКО</option><option>Дебет</option><option>Кредит</option><option>Регбиз</option><option>МФО</option><option>HR</option></select></label><label><span>Название / банк</span><input placeholder="Например, ВТБ" /></label><label><span>Выплата</span><input type="number" placeholder="6800" /></label><label><span>Стоимость ЦД</span><input type="number" placeholder="900" /></label></>}
            {type === "withdraw" && <><label><span>Сумма</span><input type="number" defaultValue="86420" /></label><label><span>Способ выплаты</span><select><option>СБП</option><option>Банковская карта</option><option>Расчётный счёт</option></select></label><label><span>Реквизиты</span><input placeholder="+7 ••• •••-••-••" /></label></>}
            {type === "key" && genKey && (
              <div className="gen-key">
                <span>Готово! Код доступа создан — передайте его новому участнику:</span>
                <code>{genKey}</code>
                <button className="secondary-button" onClick={() => { if (navigator.clipboard) navigator.clipboard.writeText(genKey).catch(() => {}); showToast("Код скопирован"); }}>Копировать код</button>
              </div>
            )}
            {type === "key" ? (
              genKey
                ? <button className="primary-button" onClick={onClose}>Готово</button>
                : <button className="primary-button" onClick={makeKey}>Создать ключ</button>
            ) : (
              <button className="primary-button" onClick={() => { onClose(); showToast("Действие сохранено в демо-режиме"); }}>Сохранить</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
