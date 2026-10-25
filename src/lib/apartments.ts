import { useEffect, useState } from "react";

export const LOGO_URL = `${(import.meta.env.BASE_URL || "/").replace(/\/?$/, "/")}images/logo.png?v=2`;
export const PHONE = "+7 900 000-00-00";
export const PHONE_HREF = "tel:+79000000000";
export const WHATSAPP_HREF = "https://wa.me/79000000000";
export const TELEGRAM_HREF = "https://t.me/klever_kvartiry";

export const IMG = {
  bedroom: "https://cdn.poehali.dev/projects/8926c5b5-4e99-462c-9b85-451dea50d30c/files/1fd2cf39-a08a-4b5e-a4bd-ae95788787cd.jpg",
  living: "https://cdn.poehali.dev/projects/8926c5b5-4e99-462c-9b85-451dea50d30c/files/9cb47687-12aa-4016-9ee9-c2fa9c52169d.jpg",
  kitchen: "https://cdn.poehali.dev/projects/8926c5b5-4e99-462c-9b85-451dea50d30c/files/a39cb01c-a411-473f-af0d-b2a4f81c5375.jpg",
  bath: "https://cdn.poehali.dev/projects/8926c5b5-4e99-462c-9b85-451dea50d30c/files/e76dfd97-76be-436f-9588-e6b7ed639556.jpg",
  view: "https://cdn.poehali.dev/projects/8926c5b5-4e99-462c-9b85-451dea50d30c/files/dc5613ae-9cc5-4346-b9fd-ef2fa3a116a2.jpg",
};

export const DEFAULT_PHOTOS = [
  { label: "Спальня", url: IMG.bedroom },
  { label: "Гостиная", url: IMG.living },
  { label: "Кухня", url: IMG.kitchen },
  { label: "Ванная комната", url: IMG.bath },
  { label: "Панорамный вид", url: IMG.view },
];

export const NOVY_URENGOY_DISTRICTS = [
  { name: "мкр. Мирный", coords: [66.0886, 76.6775] as [number, number], metro: "ТРЦ «Гудзон»" },
  { name: "мкр. Юбилейный", coords: [66.0964, 76.6835] as [number, number], metro: "озеро Молодёжное" },
  { name: "мкр. Советский", coords: [66.0912, 76.6961] as [number, number], metro: "парк «Дружба»" },
  { name: "мкр. Оптимистов", coords: [66.0748, 76.6812] as [number, number], metro: "сквер «Белые ночи»" },
  { name: "Южная часть", coords: [66.0792, 76.6698] as [number, number], metro: "ТРЦ «Проспект»" },
  { name: "Деловой центр", coords: [66.0825, 76.6852] as [number, number], metro: "БЦ «Ямал» / Газпром" },
  { name: "мкр. Дружба", coords: [66.0945, 76.6912] as [number, number], metro: "ТРЦ «Солнечный»" },
  { name: "мкр. Восточный", coords: [66.0872, 76.7125] as [number, number], metro: "СШ «Контакт»" },
  { name: "мкр. Строителей", coords: [66.0715, 76.6742] as [number, number], metro: "ДС «Звёздный»" },
  { name: "Северная часть", coords: [66.0935, 76.6710] as [number, number], metro: "ТЦ «Вертолёт»" },
];

export type AmenityGroup = { title: string; icon: string; items: string[] };

export type Apartment = {
  id: string;
  title: string;
  address: string;
  district: string;
  metro: string;
  metroMin: number;
  guests: number;
  beds: string;
  rooms: string;
  area: number;
  floor: string;
  price: number;
  rating: number;
  reviews: number;
  photos: string[];
  keyAmenities: string[];
  badge?: string;
  /** позиция метки на карте, в процентах */
  map: { x: number; y: number };
  /** географические координаты дома [широта, долгота] в Новом Уренгое */
  coords: [number, number];
  description: string;
  /** занятые даты в формате YYYY-MM-DD */
  blocked: string[];
};

const range = (from: string, nights: number) => {
  const out: string[] = [];
  const d = new Date(from + "T12:00:00");
  for (let i = 0; i < nights; i++) {
    out.push(toKey(d));
    d.setDate(d.getDate() + 1);
  }
  return out;
};

export const toKey = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const fromKey = (k: string) => new Date(k + "T12:00:00");

export const DEFAULT_APARTMENTS: Apartment[] = [
  {
    id: "studiya-u-parka",
    title: "Студия у ТРЦ Гудзон",
    address: "мкр. Мирный, д. 1/1",
    district: "мкр. Мирный",
    metro: "ТРЦ «Гудзон»",
    metroMin: 3,
    guests: 2,
    beds: "1 двуспальная кровать",
    rooms: "Студия",
    area: 32,
    floor: "5 из 9",
    price: 3200,
    rating: 4.97,
    reviews: 128,
    photos: [IMG.bedroom, IMG.kitchen, IMG.bath, IMG.living],
    keyAmenities: ["Wi-Fi", "Кондиционер", "Бесконтактное заселение"],
    badge: "Выбор гостей",
    map: { x: 42, y: 38 },
    coords: [66.0886, 76.6775],
    description:
      "Уютная и светлая студия в мкр. Мирный в трёх минутах от ТРЦ «Гудзон». Ортопедический двуспальный матрас, шторы blackout, кофемашина, тихий двор. Идеально для командированных сотрудников и гостей Нового Уренгоя.",
    blocked: [...range("2026-10-28", 3), ...range("2026-11-06", 4), ...range("2026-11-21", 2), ...range("2026-12-30", 5)],
  },
  {
    id: "evro-dvushka",
    title: "Евро-двушка на Ленинградском",
    address: "пр-кт Ленинградский, д. 10",
    district: "Южная часть",
    metro: "ТРЦ «Проспект»",
    metroMin: 4,
    guests: 4,
    beds: "1 двуспальная + диван-кровать",
    rooms: "2 комнаты",
    area: 48,
    floor: "11 из 16",
    price: 4600,
    rating: 4.92,
    reviews: 86,
    photos: [IMG.living, IMG.bedroom, IMG.kitchen, IMG.bath],
    keyAmenities: ["Wi-Fi", "Кондиционер", "Стиральная машина"],
    map: { x: 34, y: 64 },
    coords: [66.0792, 76.6698],
    description:
      "Просторная евро-двушка на центральном Ленинградском проспекте: отдельная спальня и гостиная с кухней-столовой. Рядом ДС «Звёздный», ТРЦ «Проспект», кофейни и удобный выезд во все районы города.",
    blocked: [...range("2026-10-25", 2), ...range("2026-11-12", 3), ...range("2026-11-27", 3)],
  },
  {
    id: "loft-s-vidom",
    title: "Лофт в мкр. Юбилейный",
    address: "мкр. Юбилейный, д. 2/4",
    district: "мкр. Юбилейный",
    metro: "озеро Молодёжное",
    metroMin: 5,
    guests: 3,
    beds: "1 двуспальная + кресло-кровать",
    rooms: "Лофт",
    area: 41,
    floor: "18 из 24",
    price: 5100,
    rating: 4.98,
    reviews: 64,
    photos: [IMG.view, IMG.kitchen, IMG.living, IMG.bath],
    keyAmenities: ["Wi-Fi", "Панорамные окна", "Бесконтактное заселение"],
    badge: "Панорамный вид",
    map: { x: 58, y: 24 },
    coords: [66.0964, 76.6835],
    description:
      "Панорамные окна в пол с потрясающим видом на северное небо и город. Островная кухня, кирпичная кладка, проектор для просмотра кино. Рядом озеро Молодёжное и благоустроенный парк.",
    blocked: [...range("2026-11-01", 3), ...range("2026-11-14", 2), ...range("2026-12-24", 4)],
  },
  {
    id: "kvartira-na-arbate",
    title: "Апартаменты на Сибирской",
    address: "ул. Сибирская, д. 26",
    district: "Деловой центр",
    metro: "БЦ «Ямал» / Газпром",
    metroMin: 2,
    guests: 4,
    beds: "2 двуспальные кровати",
    rooms: "2 комнаты",
    area: 56,
    floor: "3 из 5",
    price: 5600,
    rating: 4.95,
    reviews: 102,
    photos: [IMG.bedroom, IMG.living, IMG.bath, IMG.kitchen],
    keyAmenities: ["Wi-Fi", "Высокие потолки", "Бесконтактное заселение"],
    map: { x: 62, y: 52 },
    coords: [66.0825, 76.6852],
    description:
      "Двухкомнатная квартира в самом сердце Нового Уренгоя. В двух минутах пешком офисы градообразующих предприятий («Газпром добыча Уренгой»), БЦ «Ямал», администрация и рестораны.",
    blocked: [...range("2026-10-30", 4), ...range("2026-11-18", 3)],
  },
  {
    id: "studiya-business",
    title: "Студия для командировок",
    address: "мкр. Советский, д. 5/1",
    district: "мкр. Советский",
    metro: "парк «Дружба»",
    metroMin: 4,
    guests: 2,
    beds: "1 двуспальная кровать",
    rooms: "Студия",
    area: 28,
    floor: "9 из 25",
    price: 2900,
    rating: 4.9,
    reviews: 141,
    photos: [IMG.kitchen, IMG.bedroom, IMG.bath, IMG.view],
    keyAmenities: ["Wi-Fi 500 Мбит", "Рабочее место", "Отчётные документы"],
    map: { x: 74, y: 34 },
    coords: [66.0912, 76.6961],
    description:
      "Современная студия в мкр. Советский для деловых поездок. Оборудованное рабочее место, монитор, высокоскоростной интернет, гладильная доска и утюг. Предоставляем полный пакет командировочных документов с кассовым чеком с QR-кодом.",
    blocked: [...range("2026-11-02", 5), ...range("2026-11-16", 2)],
  },
  {
    id: "semeynaya-trehkomnatnaya",
    title: "Семейная трёшка в мкр. Оптимистов",
    address: "мкр. Оптимистов, д. 4/1",
    district: "мкр. Оптимистов",
    metro: "сквер «Белые ночи»",
    metroMin: 5,
    guests: 6,
    beds: "2 двуспальные + 2 односпальные",
    rooms: "3 комнаты",
    area: 74,
    floor: "4 из 10",
    price: 6900,
    rating: 4.94,
    reviews: 57,
    photos: [IMG.living, IMG.view, IMG.bedroom, IMG.kitchen],
    keyAmenities: ["Wi-Fi", "Детская кроватка", "Парковка"],
    badge: "Для семьи",
    map: { x: 52, y: 76 },
    coords: [66.0748, 76.6812],
    description:
      "Большая трехкомнатная квартира для семьи или коллег в мкр. Оптимистов. Три изолированные спальни, два санузла, большая кухня-гостиная. Детская площадка во дворе, удобная парковка.",
    blocked: [...range("2026-11-08", 3), ...range("2026-12-29", 6)],
  },
];

export const AMENITY_GROUPS: AmenityGroup[] = [
  { title: "Спальня", icon: "BedDouble", items: ["Ортопедический матрас", "Шторы blackout", "Гипоаллергенные подушки", "Свежее бельё"] },
  { title: "Кухня", icon: "CookingPot", items: ["Кофемашина", "Индукционная плита", "Посудомоечная машина", "Чай и кофе"] },
  { title: "Ванная", icon: "Bath", items: ["Фен", "Полотенца", "Косметика", "Тёплый пол"] },
  { title: "Технологии", icon: "Wifi", items: ["Wi-Fi от 300 Мбит", "Smart TV", "Кондиционер", "Электронный замок"] },
  { title: "Безопасность", icon: "ShieldCheck", items: ["Видеодомофон", "Датчик дыма", "Аптечка", "Огнетушитель"] },
  { title: "Быт", icon: "Shirt", items: ["Стиральная машина", "Утюг", "Сушилка", "Пылесос"] },
];

export const HOUSE_RULES = [
  { icon: "LogIn", title: "Заезд", text: "с 14:00, бесконтактно по коду" },
  { icon: "LogOut", title: "Выезд", text: "до 12:00, ранний и поздний — по запросу" },
  { icon: "Wallet", title: "Залог", text: "3 000 ₽, возвращаем в день выезда" },
  { icon: "CigaretteOff", title: "Не курим", text: "в квартире и на балконе" },
  { icon: "PartyPopper", title: "Без вечеринок", text: "тишина с 22:00 до 08:00" },
  { icon: "PawPrint", title: "Питомцы", text: "по согласованию с администратором" },
];

export const APARTMENTS_KEY = "klever-apartments-v1";

export const getStoredApartments = (): Apartment[] => {
  if (typeof window === "undefined") return DEFAULT_APARTMENTS;
  try {
    const raw = localStorage.getItem(APARTMENTS_KEY);
    if (!raw) return DEFAULT_APARTMENTS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (e) {
    console.error("Failed to parse stored apartments", e);
  }
  return DEFAULT_APARTMENTS;
};

export const saveStoredApartments = (apartments: Apartment[]): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(APARTMENTS_KEY, JSON.stringify(apartments));
    window.dispatchEvent(new CustomEvent("klever-apartments-updated", { detail: apartments }));
  } catch (e) {
    console.error("Failed to save apartments to localStorage", e);
  }
};

export const resetStoredApartments = (): Apartment[] => {
  if (typeof window !== "undefined") {
    localStorage.removeItem(APARTMENTS_KEY);
    window.dispatchEvent(new CustomEvent("klever-apartments-updated", { detail: DEFAULT_APARTMENTS }));
  }
  return DEFAULT_APARTMENTS;
};

export function useApartments(): Apartment[] {
  const [apartments, setApartments] = useState<Apartment[]>(() => getStoredApartments());

  useEffect(() => {
    setApartments(getStoredApartments());

    const handleUpdate = () => {
      setApartments(getStoredApartments());
    };

    window.addEventListener("klever-apartments-updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener("klever-apartments-updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  return apartments;
}

export const APARTMENTS: Apartment[] = DEFAULT_APARTMENTS;

export const getApartment = (id: string) => {
  const list = getStoredApartments();
  return list.find((a) => a.id === id);
};

export const nightsBetween = (from?: Date, to?: Date) => {
  if (!from || !to) return 0;
  const a = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const b = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.max(0, Math.round((b - a) / 86400000));
};

/** Коэффициенты: сезоны и дни недели */
export const nightPrice = (base: number, d: Date) => {
  let k = 1;
  const day = d.getDay();
  if (day === 5 || day === 6) k *= 1.15; // ночи пятницы и субботы
  const m = d.getMonth();
  const date = d.getDate();
  if ((m === 11 && date >= 20) || (m === 0 && date <= 10)) k *= 1.3; // новогодний сезон
  else if (m >= 5 && m <= 7) k *= 1.2; // лето
  return Math.round((base * k) / 10) * 10;
};

export const calcStay = (apt: Apartment, from?: Date, to?: Date) => {
  const nights = nightsBetween(from, to);
  let total = 0;
  if (from && nights > 0) {
    const d = new Date(from);
    for (let i = 0; i < nights; i++) {
      total += nightPrice(apt.price, d);
      d.setDate(d.getDate() + 1);
    }
  }
  const cleaning = nights > 0 ? 800 : 0;
  return { nights, stay: total, cleaning, total: total + cleaning, avg: nights ? Math.round(total / nights) : apt.price };
};

export const isRangeFree = (apt: Apartment, from?: Date, to?: Date) => {
  const n = nightsBetween(from, to);
  if (!from || n === 0) return true;
  const set = new Set(apt.blocked);
  const d = new Date(from);
  for (let i = 0; i < n; i++) {
    if (set.has(toKey(d))) return false;
    d.setDate(d.getDate() + 1);
  }
  return true;
};

export const rub = (n: number) => n.toLocaleString("ru-RU").replace(/,/g, " ") + " ₽";

export const nightsWord = (n: number) => {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return "ночь";
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return "ночи";
  return "ночей";
};

export const guestsWord = (n: number) => {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return "гость";
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return "гостя";
  return "гостей";
};

export const DEFAULT_FROM = "2026-11-14";
export const DEFAULT_TO = "2026-11-17";

export type Booking = {
  id: string;
  aptId: string;
  from: string;
  to: string;
  adults: number;
  children: number;
  name: string;
  phone: string;
  email: string;
  arrival: string;
  payment: "online" | "onsite";
  total: number;
  status: "confirmed" | "pending" | "cancelled";
  createdAt: string;
};

export const BOOKINGS_KEY = "klever-bookings";
