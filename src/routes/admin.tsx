import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import Icon from "@/components/ui/icon";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/site/Header";
import { formatRange } from "@/components/site/SearchBar";
import {
  type Apartment,
  type Booking,
  BOOKINGS_KEY,
  DEFAULT_PHOTOS,
  NOVY_URENGOY_DISTRICTS,
  fromKey,
  getApartment,
  getStoredApartments,
  resetStoredApartments,
  rub,
  saveStoredApartments,
  useApartments,
} from "@/lib/apartments";
import { cn } from "@/lib/utils";

/**
 * Сжимает загруженное пользователем изображение в легкий JPEG через Canvas (~80-120KB),
 * чтобы в localStorage сохранялись десятки фото без превышения лимитов квоты браузера.
 */
const compressImageFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        const maxDim = 1200;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
        resolve(dataUrl);
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({ meta: [{ title: "Панель управления — Клевер" }, { name: "robots", content: "noindex" }] }),
  component: Admin,
});

const AUTH_KEY = "klever-admin-v2";

const SOURCES = [
  { name: "Avito", color: "bg-[hsl(200_70%_45%)]" },
  { name: "Суточно.ру", color: "bg-[hsl(14_80%_52%)]" },
  { name: "Островок", color: "bg-[hsl(45_90%_50%)]" },
];

const SEASONS = [
  { id: "low", name: "Низкий сезон", period: "15 окт — 20 дек, 15 янв — 30 апр", k: 0 },
  { id: "summer", name: "Лето", period: "1 июня — 31 авг", k: 20 },
  { id: "ny", name: "Новый год", period: "20 дек — 10 янв", k: 30 },
];

const WEEK = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

const POPULAR_AMENITIES = [
  "Wi-Fi",
  "Кондиционер",
  "Бесконтактное заселение",
  "Стиральная машина",
  "Посудомоечная машина",
  "Панорамные окна",
  "Рабочее место",
  "Отчётные документы",
  "Детская кроватка",
  "Парковка",
  "Кофемашина",
  "Шторы blackout",
  "Ортопедический матрас",
  "Smart TV",
  "Тёплый пол",
  "Высокие потолки",
];

function Admin() {
  const [authed, setAuthed] = useState(false);
  const [ready, setReady] = useState(false);
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    setAuthed(localStorage.getItem(AUTH_KEY) === "1");
    setReady(true);
  }, []);

  if (!ready) return null;

  if (!authed) {
    return (
      <div className="grid min-h-screen place-items-center bg-stage px-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (pass === "123456") {
              localStorage.setItem(AUTH_KEY, "1");
              setAuthed(true);
            } else {
              setErr("Неверный пароль");
            }
          }}
          className="w-full max-w-sm rounded-card bg-card p-8 shadow-xl border border-border"
        >
          <Logo />
          <h1 className="mt-8 text-[24px] font-normal text-foreground">Панель управления</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">Пароль по умолчанию: 123456</p>
          <Input
            type="password"
            value={pass}
            onChange={(e) => {
              setPass(e.target.value);
              setErr("");
            }}
            placeholder="Введите пароль"
            className="mt-5 h-12 rounded-plate bg-background border-border text-foreground"
          />
          {err && <p className="mt-2 text-[13px] text-destructive">{err}</p>}
          <button
            type="submit"
            className="mt-5 h-12 w-full rounded-full bg-primary text-primary-foreground font-medium transition hover:bg-primary/90 active:scale-95"
          >
            Войти в панель
          </button>
          <Link
            to="/"
            className="mt-4 block text-center text-[13px] text-muted-foreground hover:text-foreground transition"
          >
            ← Вернуться на сайт
          </Link>
        </form>
      </div>
    );
  }

  return (
    <Dashboard
      onLogout={() => {
        localStorage.removeItem(AUTH_KEY);
        setAuthed(false);
      }}
    />
  );
}

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const { toast } = useToast();
  const apartments = useApartments();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [synced, setSynced] = useState<Record<string, string>>({
    Avito: "12 мин назад",
    "Суточно.ру": "18 мин назад",
    Островок: "25 мин назад",
  });
  const [season, setSeason] = useState(SEASONS.map((s) => s.k));
  const [week, setWeek] = useState([0, 0, 0, 0, 15, 15, 0]);
  const [aptId, setAptId] = useState<string>(() => apartments[0]?.id || "studiya-u-parka");
  const [notify, setNotify] = useState({ wa: true, tg: true, guest: true });

  // Apartment Editing & Deletion state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isNewApt, setIsNewApt] = useState(false);
  const [editingApt, setEditingApt] = useState<Apartment | null>(null);
  const [newPhotoUrl, setNewPhotoUrl] = useState("");
  const [customAmenity, setCustomAmenity] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    try {
      setBookings(JSON.parse(localStorage.getItem(BOOKINGS_KEY) || "[]"));
    } catch {
      setBookings([]);
    }
  }, []);

  useEffect(() => {
    if (apartments.length > 0 && !apartments.some((a) => a.id === aptId)) {
      setAptId(apartments[0].id);
    }
  }, [apartments, aptId]);

  const activeBookings = bookings.filter((b) => b.status !== "cancelled");
  const revenue = activeBookings.reduce((s, b) => s + b.total, 0);

  const sync = (src: string) => {
    setSyncing(src);
    setTimeout(() => {
      setSyncing(null);
      const timeStr = new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
      setSynced((p) => ({ ...p, [src]: timeStr }));
      toast({
        title: `Канал ${src} синхронизирован`,
        description: `Календари и тарифы обновлены в ${timeStr}`,
      });
    }, 900);
  };

  const updateStatus = (id: string, status: Booking["status"]) => {
    const next = bookings.map((b) => (b.id === id ? { ...b, status } : b));
    setBookings(next);
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(next));
    toast({ title: "Статус бронирования изменён", description: `Бронь ${id}: ${status}` });
  };

  // CRUD actions for apartments
  const handleCreateNew = () => {
    setIsNewApt(true);
    setNewPhotoUrl("");
    setCustomAmenity("");
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    setEditingApt({
      id: `kvartira-${randomSuffix}`,
      title: "",
      address: "мкр. Мирный, д. 2",
      district: "мкр. Мирный",
      metro: "ТРЦ «Гудзон»",
      metroMin: 4,
      guests: 2,
      beds: "1 двуспальная кровать",
      rooms: "Студия",
      area: 32,
      floor: "4 из 9",
      price: 3500,
      rating: 5.0,
      reviews: 0,
      photos: [DEFAULT_PHOTOS[0].url, DEFAULT_PHOTOS[1].url, DEFAULT_PHOTOS[2].url],
      keyAmenities: ["Wi-Fi", "Кондиционер", "Бесконтактное заселение"],
      badge: "Новинка",
      map: { x: 50, y: 50 },
      coords: [66.0886, 76.6775],
      description: "Уютная и светлая квартира в Новом Уренгое с современным дизайнерским ремонтом, бесконтактным заселением 24/7 и полным набором комфортных удобств.",
      blocked: [],
    });
    setDialogOpen(true);
  };

  const handleStartEdit = (apt: Apartment) => {
    setIsNewApt(false);
    setNewPhotoUrl("");
    setCustomAmenity("");
    setEditingApt({
      ...apt,
      photos: [...apt.photos],
      keyAmenities: [...apt.keyAmenities],
      map: { ...apt.map },
      coords: [...apt.coords],
      blocked: [...(apt.blocked || [])],
    });
    setDialogOpen(true);
  };

  const handleSaveApt = () => {
    if (!editingApt) return;
    if (!editingApt.title.trim()) {
      toast({ title: "Ошибка", description: "Укажите название квартиры", variant: "destructive" });
      return;
    }
    if (!editingApt.address.trim()) {
      toast({ title: "Ошибка", description: "Укажите адрес квартиры в Новом Уренгое", variant: "destructive" });
      return;
    }
    if (editingApt.photos.length === 0) {
      toast({ title: "Ошибка", description: "Добавьте хотя бы одну фотографию квартиры", variant: "destructive" });
      return;
    }

    const current = getStoredApartments();
    let updated: Apartment[];

    if (isNewApt) {
      let cleanId = editingApt.id.trim().toLowerCase().replace(/[^a-z0-9а-яё\-]/gi, "-");
      if (!cleanId || current.some((a) => a.id === cleanId)) {
        cleanId = "kvartira-" + Date.now().toString(36);
      }
      const newObj: Apartment = {
        ...editingApt,
        id: cleanId,
        price: Number(editingApt.price) || 3000,
        area: Number(editingApt.area) || 30,
        guests: Number(editingApt.guests) || 2,
        metroMin: Number(editingApt.metroMin) || 5,
        rating: Number(editingApt.rating) || 5.0,
        reviews: Number(editingApt.reviews) || 0,
      };
      updated = [newObj, ...current];
      toast({
        title: "Квартира добавлена",
        description: `«${newObj.title}» успешно добавлена в каталог и на карту`,
      });
    } else {
      updated = current.map((a) =>
        a.id === editingApt.id
          ? {
              ...editingApt,
              price: Number(editingApt.price) || 3000,
              area: Number(editingApt.area) || 30,
              guests: Number(editingApt.guests) || 2,
              metroMin: Number(editingApt.metroMin) || 5,
            }
          : a,
      );
      toast({
        title: "Изменения сохранены",
        description: `Данные квартиры «${editingApt.title}» обновлены`,
      });
    }

    saveStoredApartments(updated);
    setDialogOpen(false);
    setEditingApt(null);
  };

  const handleDeleteApt = (id: string) => {
    const current = getStoredApartments();
    const target = current.find((a) => a.id === id);
    const updated = current.filter((a) => a.id !== id);
    saveStoredApartments(updated);
    setDeleteConfirmId(null);
    toast({
      title: "Квартира удалена",
      description: target ? `«${target.title}» удалена из каталога` : "Объявление удалено",
    });
  };

  const handleResetDefaults = () => {
    if (window.confirm("Восстановить исходный список из 6 квартир сети Клевер? Все изменения будут сброшены.")) {
      resetStoredApartments();
      toast({
        title: "Каталог сброшен",
        description: "Восстановлены исходные 6 квартир сети Клевер",
      });
    }
  };

  const toggleAmenity = (amenity: string) => {
    if (!editingApt) return;
    const exists = editingApt.keyAmenities.includes(amenity);
    const next = exists
      ? editingApt.keyAmenities.filter((a) => a !== amenity)
      : [...editingApt.keyAmenities, amenity];
    setEditingApt({ ...editingApt, keyAmenities: next });
  };

  const addCustomAmenity = () => {
    if (!editingApt || !customAmenity.trim()) return;
    const trimmed = customAmenity.trim();
    if (!editingApt.keyAmenities.includes(trimmed)) {
      setEditingApt({ ...editingApt, keyAmenities: [...editingApt.keyAmenities, trimmed] });
    }
    setCustomAmenity("");
  };

  const addPhotoUrl = (url: string) => {
    if (!editingApt || !url.trim()) return;
    setEditingApt({ ...editingApt, photos: [...editingApt.photos, url.trim()] });
  };

  const removePhoto = (index: number) => {
    if (!editingApt) return;
    const next = editingApt.photos.filter((_, i) => i !== index);
    setEditingApt({ ...editingApt, photos: next });
  };

  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !editingApt) return;

    setUploadingPhotos(true);
    try {
      const addedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith("image/")) continue;
        const compressed = await compressImageFile(file);
        addedUrls.push(compressed);
      }

      if (addedUrls.length > 0) {
        setEditingApt({
          ...editingApt,
          photos: [...editingApt.photos, ...addedUrls],
        });
        toast({
          title: "Фотографии добавлены",
          description: `Успешно загружено ${addedUrls.length} фото из галереи / файла`,
        });
      }
    } catch (err) {
      console.error("Failed to upload files:", err);
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось обработать некоторые файлы",
        variant: "destructive",
      });
    } finally {
      setUploadingPhotos(false);
      e.target.value = "";
    }
  };

  const makePhotoCover = (index: number) => {
    if (!editingApt || index === 0) return;
    const target = editingApt.photos[index];
    const remaining = editingApt.photos.filter((_, i) => i !== index);
    setEditingApt({
      ...editingApt,
      photos: [target, ...remaining],
    });
    toast({
      title: "Главное фото обновлено",
      description: "Выбранная фотография установлена на обложку",
    });
  };

  return (
    <div className="min-h-screen bg-stage text-foreground px-3 py-5 sm:px-8 sm:py-7">
      {/* Top Header */}
      <div className="mx-auto max-w-6xl flex flex-wrap items-center justify-between gap-4 border-b border-border/80 pb-6">
        <div className="flex items-center gap-4">
          <Logo />
          <div className="hidden sm:block h-6 w-px bg-border" />
          <div className="text-[14px] text-muted-foreground">
            <span className="font-medium text-foreground">Админ-панель</span> · Новый Уренгой
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="inline-flex h-10 items-center gap-1.5 rounded-full border border-border bg-card px-4 text-[13px] font-medium transition hover:border-gold hover:text-gold"
          >
            <Icon name="Eye" size={15} /> На сайт
          </Link>
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-secondary px-4 text-[13px] font-medium text-muted-foreground transition hover:text-destructive"
          >
            <Icon name="LogOut" size={15} /> Выйти
          </button>
        </div>
      </div>

      {/* Quick Metrics Bar */}
      <div className="mx-auto max-w-6xl mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <div className="rounded-card bg-card p-4 border border-border/60">
          <div className="text-[12px] text-muted-foreground">Общая выручка</div>
          <div className="mt-1 text-[20px] sm:text-[24px] font-semibold text-foreground">{rub(revenue)}</div>
        </div>
        <div className="rounded-card bg-card p-4 border border-border/60">
          <div className="text-[12px] text-muted-foreground">Всего броней</div>
          <div className="mt-1 text-[20px] sm:text-[24px] font-semibold text-foreground">{bookings.length}</div>
        </div>
        <div className="rounded-card bg-card p-4 border border-border/60">
          <div className="text-[12px] text-muted-foreground">Активных заселений</div>
          <div className="mt-1 text-[20px] sm:text-[24px] font-semibold text-emerald-600 dark:text-emerald-400">
            {activeBookings.length}
          </div>
        </div>
        <div className="rounded-card bg-card p-4 border border-border/60">
          <div className="text-[12px] text-muted-foreground">Квартир в сети</div>
          <div className="mt-1 text-[20px] sm:text-[24px] font-semibold text-gold">{apartments.length}</div>
        </div>
      </div>

      {/* Main Tabs Workspace */}
      <div className="mx-auto max-w-6xl mt-8">
        <Tabs defaultValue="apartments">
          <TabsList className="mb-6 flex flex-nowrap overflow-x-auto no-scrollbar gap-2 bg-transparent p-0 justify-start h-auto w-full pb-1 touch-pan-x shrink-0">
            <TabsTrigger
              value="apartments"
              className="shrink-0 rounded-full border border-border bg-card px-5 py-2.5 text-[14px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary"
            >
              Квартиры ({apartments.length})
            </TabsTrigger>
            <TabsTrigger
              value="bookings"
              className="shrink-0 rounded-full border border-border bg-card px-5 py-2.5 text-[14px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary"
            >
              Бронирования ({bookings.length})
            </TabsTrigger>
            <TabsTrigger
              value="channels"
              className="shrink-0 rounded-full border border-border bg-card px-5 py-2.5 text-[14px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary"
            >
              Синхронизация каналов
            </TabsTrigger>
            <TabsTrigger
              value="prices"
              className="shrink-0 rounded-full border border-border bg-card px-5 py-2.5 text-[14px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary"
            >
              Тарифы и сезоны
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="shrink-0 rounded-full border border-border bg-card px-5 py-2.5 text-[14px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary"
            >
              Уведомления и замки
            </TabsTrigger>
          </TabsList>

          {/* Tab: Apartments Management (CRUD) */}
          <TabsContent value="apartments" className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-card bg-card p-4 sm:p-6 border border-border">
              <div>
                <h2 className="text-[18px] sm:text-[20px] font-medium text-foreground">Управление каталогом квартир</h2>
                <p className="mt-1 text-[13px] text-muted-foreground">
                  Добавляйте новые квартиры, редактируйте описания, фото, цены и удаляйте объекты. Изменения моментально видны на сайте и на карте города.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="inline-flex h-10 sm:h-11 items-center gap-1.5 rounded-full border border-border bg-background px-3.5 sm:px-4 text-[12px] sm:text-[13px] font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition"
                  title="Восстановить исходные 6 квартир сети"
                >
                  <Icon name="RotateCcw" size={14} /> Сбросить к исходным
                </button>
                <button
                  type="button"
                  onClick={handleCreateNew}
                  className="inline-flex h-10 sm:h-11 items-center gap-2 rounded-full bg-primary px-5 sm:px-6 text-[13px] sm:text-[14px] font-medium text-primary-foreground hover:bg-primary/90 transition shadow-sm active:scale-95"
                >
                  <Icon name="Plus" size={16} /> Добавить квартиру
                </button>
              </div>
            </div>

            {/* List of Apartments */}
            {apartments.length === 0 ? (
              <div className="rounded-card bg-card p-12 text-center border border-dashed border-border">
                <Icon name="Building2" size={36} className="mx-auto text-gold" />
                <h3 className="mt-3 text-[18px] font-medium">Квартир пока нет</h3>
                <p className="mt-1 text-[13px] text-muted-foreground">
                  Все квартиры удалены. Вы можете добавить новую или восстановить базовый набор.
                </p>
                <div className="mt-5 flex justify-center gap-3">
                  <button
                    onClick={handleResetDefaults}
                    className="inline-flex h-10 items-center rounded-full bg-secondary px-5 text-[13px] font-medium"
                  >
                    Восстановить 6 квартир
                  </button>
                  <button
                    onClick={handleCreateNew}
                    className="inline-flex h-10 items-center rounded-full bg-primary px-5 text-[13px] font-medium text-primary-foreground"
                  >
                    Создать объявление
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid gap-4">
                {apartments.map((a) => (
                  <div
                    key={a.id}
                    className="flex flex-col gap-4 rounded-card bg-card p-4 sm:p-5 border border-border/80 lg:flex-row lg:items-center lg:justify-between transition hover:border-foreground/20"
                  >
                    {/* Apartment media & info */}
                    <div className="flex flex-col sm:flex-row gap-4 flex-1 min-w-0">
                      <div className="relative shrink-0 overflow-hidden rounded-plate aspect-[16/10] sm:aspect-square sm:h-28 sm:w-28 bg-muted">
                        <img
                          src={a.photos?.[0] || DEFAULT_PHOTOS[0].url}
                          alt={a.title}
                          className="h-full w-full object-cover"
                        />
                        <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                          {a.photos?.length || 0} фото
                        </span>
                        {a.badge && (
                          <span className="absolute top-1 left-1 rounded bg-gold/90 px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground shadow-sm">
                            {a.badge}
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-[17px] font-medium text-foreground truncate">{a.title}</h3>
                          <span className="rounded bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                            #{a.id}
                          </span>
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted-foreground">
                          <span className="flex items-center gap-1 text-foreground">
                            <Icon name="MapPin" size={13} className="text-gold" />
                            {a.address}
                          </span>
                          <span>·</span>
                          <span>{a.district}</span>
                          <span>·</span>
                          <span>{a.metro} ({a.metroMin} мин)</span>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] text-muted-foreground">
                          <span className="rounded-full bg-secondary px-2.5 py-0.5 font-medium text-foreground">
                            {a.rooms}
                          </span>
                          <span className="rounded-full bg-secondary px-2.5 py-0.5">
                            {a.area} м²
                          </span>
                          <span className="rounded-full bg-secondary px-2.5 py-0.5">
                            Этаж {a.floor}
                          </span>
                          <span className="rounded-full bg-secondary px-2.5 py-0.5">
                            до {a.guests} гостей
                          </span>
                          <span className="flex items-center gap-1 text-foreground font-medium ml-1">
                            <Icon name="Star" size={13} className="fill-gold text-gold" />
                            {a.rating?.toFixed(2) || "5.0"} ({a.reviews || 0})
                          </span>
                        </div>

                        {a.keyAmenities && a.keyAmenities.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {a.keyAmenities.slice(0, 4).map((amenity) => (
                              <span
                                key={amenity}
                                className="rounded px-1.5 py-0.5 text-[11px] bg-background text-foreground/80 border border-border/60"
                              >
                                {amenity}
                              </span>
                            ))}
                            {a.keyAmenities.length > 4 && (
                              <span className="text-[11px] text-muted-foreground self-center">
                                +{a.keyAmenities.length - 4} ещё
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Price & Action buttons */}
                    <div className="flex flex-wrap items-center justify-between lg:flex-col lg:items-end lg:justify-center gap-3 border-t border-border/50 pt-3 lg:border-t-0 lg:pt-0 shrink-0">
                      <div className="text-left lg:text-right">
                        <div className="text-[18px] sm:text-[20px] font-semibold text-foreground">
                          {rub(a.price)}
                          <span className="text-[12px] font-normal text-muted-foreground"> / сутки</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          to="/apartment/$id"
                          params={{ id: a.id }}
                          target="_blank"
                          className="inline-flex h-9 items-center gap-1 rounded-full border border-border bg-background px-3 text-[12px] font-medium text-muted-foreground hover:text-foreground hover:border-gold transition shrink-0"
                          title="Открыть карточку на сайте в новой вкладке"
                        >
                          <Icon name="ExternalLink" size={13} /> На сайт
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleStartEdit(a)}
                          className="inline-flex h-9 items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-3.5 text-[12px] font-medium text-primary hover:bg-primary hover:text-primary-foreground transition shrink-0"
                        >
                          <Icon name="Edit3" size={13} /> Редактировать
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(a.id)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-muted-foreground hover:border-destructive hover:bg-destructive/10 hover:text-destructive transition shrink-0"
                          title="Удалить объявление"
                        >
                          <Icon name="Trash2" size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Tab 2: Bookings List */}
          <TabsContent value="bookings" className="space-y-4">
            {bookings.length === 0 ? (
              <div className="rounded-card bg-card p-12 text-center border border-border">
                <Icon name="Inbox" size={32} className="mx-auto text-gold" />
                <p className="mt-3 text-[17px] font-medium">Новых броней пока нет</p>
                <p className="mt-1 text-[13px] text-muted-foreground">
                  Когда гость оформит бронь через сайт, она моментально появится здесь со всеми контактами.
                </p>
              </div>
            ) : (
              bookings.map((b) => {
                const a = getApartment(b.aptId);
                return (
                  <div
                    key={b.id}
                    className="flex flex-col gap-4 rounded-card bg-card p-5 border border-border/80 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-start gap-4">
                      {a?.photos?.[0] && (
                        <img
                          src={a.photos[0]}
                          alt={a.title}
                          className="h-16 w-24 shrink-0 rounded-plate object-cover hidden sm:block"
                        />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[12px] font-semibold text-gold">#{b.id}</span>
                          <span className="text-[15px] font-medium text-foreground">{a?.title ?? "Квартира"}</span>
                        </div>
                        <div className="mt-1 text-[13px] text-muted-foreground">
                          Гость: <strong className="text-foreground">{b.name}</strong> · {b.phone}
                        </div>
                        <div className="mt-1 text-[12px] text-muted-foreground">
                          Даты: {formatRange({ from: fromKey(b.from), to: fromKey(b.to) })} · Прибытие: {b.arrival}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 border-t border-border/50 pt-3 sm:border-t-0 sm:pt-0">
                      <div className="text-right">
                        <div className="text-[16px] font-semibold text-foreground">{rub(b.total)}</div>
                        <div className="text-[11px] text-muted-foreground uppercase">
                          {b.payment === "online" ? "Предоплата 30%" : "При заселении"}
                        </div>
                      </div>

                      <select
                        value={b.status}
                        onChange={(e) => updateStatus(b.id, e.target.value as Booking["status"])}
                        className="rounded-full border border-border bg-background px-3 py-1.5 text-[13px] font-medium text-foreground outline-none cursor-pointer"
                      >
                        <option value="confirmed">Подтверждена</option>
                        <option value="pending">Ждёт подтверждения</option>
                        <option value="cancelled">Отменена</option>
                      </select>
                    </div>
                  </div>
                );
              })
            )}
          </TabsContent>

          {/* Tab 3: Channel Sync */}
          <TabsContent value="channels">
            <div className="rounded-card bg-card p-6 border border-border space-y-6">
              <div>
                <h2 className="text-[20px] font-medium">Синхронизация с площадками</h2>
                <p className="mt-1 text-[13px] text-muted-foreground">
                  Двусторонняя синхронизация через iCal и API защищает от овербукинга при одновременных заказах.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {SOURCES.map((src) => (
                  <div key={src.name} className="rounded-plate border border-border p-4 bg-background/50 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={cn("h-2.5 w-2.5 rounded-full", src.color)} />
                          <span className="font-medium text-[15px]">{src.name}</span>
                        </div>
                        <span className="text-[11px] text-emerald-600 font-medium">Активен</span>
                      </div>
                      <div className="mt-3 text-[12px] text-muted-foreground">
                        Синхронизировано: {synced[src.name] ?? "Недавно"}
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={syncing === src.name}
                      onClick={() => sync(src.name)}
                      className="mt-4 flex h-9 items-center justify-center gap-1.5 rounded-full border border-border bg-card text-[12px] font-medium text-foreground hover:border-gold hover:text-gold active:scale-95 transition disabled:opacity-50"
                    >
                      <Icon name="RefreshCw" size={13} className={cn(syncing === src.name && "animate-spin text-gold")} />
                      {syncing === src.name ? "Синхронизация…" : "Обновить сейчас"}
                    </button>
                  </div>
                ))}
              </div>

              <div className="rounded-plate border border-gold/30 bg-gold/5 p-4 text-[13px]">
                <div className="flex items-center gap-2 font-medium text-gold">
                  <Icon name="Info" size={16} /> iCal Ссылка на общий календарь
                </div>
                <p className="mt-1 text-foreground/80">
                  Вставьте эту ссылку в Avito и Суточно.ру для моментального блокирования дат:
                </p>
                <code className="mt-2 block rounded bg-background p-2 font-mono text-[12px] text-muted-foreground select-all">
                  https://clever-rentals.poehali.dev/api/ical/feed.ics
                </code>
              </div>
            </div>
          </TabsContent>

          {/* Tab 4: Dynamic Pricing */}
          <TabsContent value="prices">
            <div className="rounded-card bg-card p-6 border border-border space-y-6">
              <div>
                <h2 className="text-[20px] font-medium">Динамическое ценообразование</h2>
                <p className="mt-1 text-[13px] text-muted-foreground">
                  Настройте сезонные коэффициенты и наценку на выходные дни для всех квартир сети.
                </p>
              </div>

              <div>
                <label className="text-[14px] font-medium text-foreground">Выберите квартиру для настройки:</label>
                <select
                  value={aptId}
                  onChange={(e) => setAptId(e.target.value)}
                  className="mt-2 block w-full max-w-md rounded-plate border border-border bg-background p-2.5 text-[14px] text-foreground outline-none cursor-pointer"
                >
                  {apartments.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.title} ({a.address}) — базовый тариф {rub(a.price)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="border-t border-border pt-6">
                <h3 className="text-[16px] font-medium">Сезонные надбавки</h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  {SEASONS.map((s, idx) => (
                    <div key={s.id} className="rounded-plate border border-border p-4 bg-background/50">
                      <div className="font-medium text-[14px]">{s.name}</div>
                      <div className="text-[11px] text-muted-foreground">{s.period}</div>
                      <div className="mt-3 flex items-center gap-2">
                        <Input
                          type="number"
                          value={season[idx]}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setSeason((p) => {
                              const n = [...p];
                              n[idx] = val;
                              return n;
                            });
                          }}
                          className="h-9 w-20 rounded-md bg-card"
                        />
                        <span className="text-[13px] text-muted-foreground">% надбавки</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-border pt-6">
                <h3 className="text-[16px] font-medium">Выходные дни (Пт, Сб)</h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  {WEEK.map((d, i) => (
                    <div key={d} className="flex flex-col items-center gap-1 rounded-plate border border-border p-2.5 bg-background/50 w-14">
                      <span className="text-[12px] font-medium">{d}</span>
                      <Input
                        type="number"
                        value={week[i]}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setWeek((p) => {
                            const n = [...p];
                            n[i] = val;
                            return n;
                          });
                        }}
                        className="h-8 w-12 text-center p-0 rounded text-[12px] bg-card"
                      />
                      <span className="text-[10px] text-muted-foreground">%</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => toast({ title: "Тарифы сохранены", description: "Новые цены применены ко всем свободным датам" })}
                className="mt-2 inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-[14px] font-medium text-primary-foreground hover:bg-primary/90 transition active:scale-95"
              >
                Сохранить тарифы
              </button>
            </div>
          </TabsContent>

          {/* Tab 5: Notifications & Smart Locks */}
          <TabsContent value="settings">
            <div className="rounded-card bg-card p-6 border border-border space-y-6">
              <div>
                <h2 className="text-[20px] font-medium">Уведомления и умные замки</h2>
                <p className="mt-1 text-[13px] text-muted-foreground">
                  Автоматизация коммуникации с гостями и управление электронными замками Нового Уренгоя.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-plate border border-border p-4 bg-background/50">
                  <div>
                    <div className="text-[15px] font-medium">Оповещения в WhatsApp администратору</div>
                    <div className="text-[13px] text-muted-foreground">Мгновенное сообщение при поступлении новой брони</div>
                  </div>
                  <Switch checked={notify.wa} onCheckedChange={(v) => setNotify((p) => ({ ...p, wa: v }))} />
                </div>

                <div className="flex items-center justify-between rounded-plate border border-border p-4 bg-background/50">
                  <div>
                    <div className="text-[15px] font-medium">Оповещения в Telegram-бот</div>
                    <div className="text-[13px] text-muted-foreground">Дублирование броней и чеков в рабочий чат управляющих</div>
                  </div>
                  <Switch checked={notify.tg} onCheckedChange={(v) => setNotify((p) => ({ ...p, tg: v }))} />
                </div>

                <div className="flex items-center justify-between rounded-plate border border-border p-4 bg-background/50">
                  <div>
                    <div className="text-[15px] font-medium">Автогенерация PIN-кода для гостя</div>
                    <div className="text-[13px] text-muted-foreground">Отправка индивидуального кода электронного замка в день заселения</div>
                  </div>
                  <Switch checked={notify.guest} onCheckedChange={(v) => setNotify((p) => ({ ...p, guest: v }))} />
                </div>
              </div>

              <div className="border-t border-border pt-6">
                <h3 className="text-[16px] font-medium">Безопасность</h3>
                <div className="mt-3 flex items-center gap-3">
                  <Input type="password" value="••••••" disabled className="h-10 max-w-xs rounded-plate bg-background" />
                  <button
                    type="button"
                    onClick={() => toast({ title: "Текущий пароль: 123456", description: "Вы можете изменить его в коде или настройках" })}
                    className="inline-flex h-10 items-center rounded-full border border-border px-4 text-[13px] font-medium hover:border-gold hover:text-gold"
                  >
                    Показать пароль
                  </button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Apartment Create / Edit Dialog Modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-[22px] font-medium text-foreground">
              {isNewApt ? "Добавить новую квартиру" : `Редактирование: ${editingApt?.title || "Квартира"}`}
            </DialogTitle>
            <DialogDescription className="text-[13px] text-muted-foreground">
              Заполните данные квартиры. Все поля сохраняются в локальном хранилище и сразу обновляются на сайте и карте.
            </DialogDescription>
          </DialogHeader>

          {editingApt && (
            <div className="space-y-6 py-4">
              {/* 1. Основная информация */}
              <div className="space-y-3">
                <h4 className="text-[14px] font-semibold text-foreground uppercase tracking-wider text-gold">
                  1. Основные параметры
                </h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="text-[12px] font-medium text-muted-foreground">
                      Название объявления *
                    </label>
                    <Input
                      value={editingApt.title}
                      onChange={(e) => setEditingApt({ ...editingApt, title: e.target.value })}
                      placeholder="Например: Студия у ТРЦ Гудзон"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-[12px] font-medium text-muted-foreground">
                      Идентификатор / URL-слаг (ID)
                    </label>
                    <Input
                      value={editingApt.id}
                      disabled={!isNewApt}
                      onChange={(e) => setEditingApt({ ...editingApt, id: e.target.value })}
                      placeholder="studiya-u-parka"
                      className="mt-1 font-mono text-[13px]"
                    />
                    <span className="text-[10px] text-muted-foreground">
                      Ссылка на сайте: /apartment/{editingApt.id || "slug"}
                    </span>
                  </div>

                  <div>
                    <label className="text-[12px] font-medium text-muted-foreground">
                      Базовая цена за сутки (₽) *
                    </label>
                    <Input
                      type="number"
                      value={editingApt.price}
                      onChange={(e) => setEditingApt({ ...editingApt, price: Number(e.target.value) })}
                      placeholder="3500"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-[12px] font-medium text-muted-foreground">
                      Бейдж / плашка (опционально)
                    </label>
                    <Input
                      value={editingApt.badge || ""}
                      onChange={(e) => setEditingApt({ ...editingApt, badge: e.target.value })}
                      placeholder="Например: Выбор гостей, Новинка, Панорамный вид"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-[12px] font-medium text-muted-foreground">
                      Тип / комнаты *
                    </label>
                    <select
                      value={editingApt.rooms}
                      onChange={(e) => setEditingApt({ ...editingApt, rooms: e.target.value })}
                      className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-[14px] text-foreground focus-visible:outline-none"
                    >
                      <option value="Студия">Студия</option>
                      <option value="1 комната">1 комната</option>
                      <option value="2 комнаты">2 комнаты</option>
                      <option value="Евро-двушка">Евро-двушка</option>
                      <option value="Лофт">Лофт</option>
                      <option value="3 комнаты">3 комнаты</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 2. Адрес и локация */}
              <div className="space-y-3 border-t border-border pt-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[14px] font-semibold text-foreground uppercase tracking-wider text-gold">
                    2. Адрес и привязка к карте (Новый Уренгой)
                  </h4>
                  <span className="text-[11px] text-muted-foreground">Координаты определяют метку на карте</span>
                </div>

                {/* Quick District Picker with automatic coordinates */}
                <div className="rounded-plate bg-background/80 p-3 border border-gold/30">
                  <label className="text-[12px] font-medium text-gold flex items-center gap-1.5">
                    <Icon name="Compass" size={13} /> Быстрый выбор района Нового Уренгоя (авто-привязка к карте):
                  </label>
                  <select
                    onChange={(e) => {
                      const selected = NOVY_URENGOY_DISTRICTS.find((d) => d.name === e.target.value);
                      if (selected && editingApt) {
                        setEditingApt({
                          ...editingApt,
                          district: selected.name,
                          metro: selected.metro,
                          coords: [...selected.coords],
                        });
                        toast({
                          title: "Район выбран",
                          description: `Координаты привязаны к району ${selected.name} [${selected.coords.join(", ")}]`,
                        });
                      }
                    }}
                    defaultValue=""
                    className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-[13px] text-foreground cursor-pointer outline-none"
                  >
                    <option value="" disabled>-- Выберите район для автоматических координат --</option>
                    {NOVY_URENGOY_DISTRICTS.map((d) => (
                      <option key={d.name} value={d.name}>
                        {d.name} · {d.metro} [{d.coords[0]}, {d.coords[1]}]
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="text-[12px] font-medium text-muted-foreground">
                      Точный адрес *
                    </label>
                    <Input
                      value={editingApt.address}
                      onChange={(e) => setEditingApt({ ...editingApt, address: e.target.value })}
                      placeholder="мкр. Мирный, д. 1/1"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-[12px] font-medium text-muted-foreground">
                      Район города
                    </label>
                    <Input
                      value={editingApt.district}
                      onChange={(e) => setEditingApt({ ...editingApt, district: e.target.value })}
                      placeholder="мкр. Мирный, Северная часть, Южная часть..."
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-[12px] font-medium text-muted-foreground">
                      Ближайший ориентир / ТРЦ
                    </label>
                    <Input
                      value={editingApt.metro}
                      onChange={(e) => setEditingApt({ ...editingApt, metro: e.target.value })}
                      placeholder="ТРЦ «Гудзон», Солнечный, озеро Молодёжное..."
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-[12px] font-medium text-muted-foreground">
                      Минут пешком до ориентира
                    </label>
                    <Input
                      type="number"
                      value={editingApt.metroMin}
                      onChange={(e) => setEditingApt({ ...editingApt, metroMin: Number(e.target.value) })}
                      placeholder="3"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-[12px] font-medium text-muted-foreground">
                      Этаж
                    </label>
                    <Input
                      value={editingApt.floor}
                      onChange={(e) => setEditingApt({ ...editingApt, floor: e.target.value })}
                      placeholder="5 из 9"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Вместимость и площадь */}
              <div className="space-y-3 border-t border-border pt-4">
                <h4 className="text-[14px] font-semibold text-foreground uppercase tracking-wider text-gold">
                  3. Характеристики и спальные места
                </h4>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="text-[12px] font-medium text-muted-foreground">
                      Площадь (м²)
                    </label>
                    <Input
                      type="number"
                      value={editingApt.area}
                      onChange={(e) => setEditingApt({ ...editingApt, area: Number(e.target.value) })}
                      placeholder="32"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-[12px] font-medium text-muted-foreground">
                      Максимум гостей
                    </label>
                    <Input
                      type="number"
                      value={editingApt.guests}
                      onChange={(e) => setEditingApt({ ...editingApt, guests: Number(e.target.value) })}
                      placeholder="2"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-[12px] font-medium text-muted-foreground">
                      Спальные места
                    </label>
                    <Input
                      value={editingApt.beds}
                      onChange={(e) => setEditingApt({ ...editingApt, beds: e.target.value })}
                      placeholder="1 двуспальная кровать"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Фотографии */}
              <div className="space-y-4 border-t border-border pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-[14px] font-semibold text-foreground uppercase tracking-wider text-gold">
                      4. Фотографии ({editingApt.photos.length})
                    </h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Первое фото в списке автоматически становится главной обложкой карточки
                    </p>
                  </div>
                  {uploadingPhotos && (
                    <span className="flex items-center gap-1.5 text-[12px] text-gold animate-pulse">
                      <Icon name="Loader2" size={13} className="animate-spin" /> Обработка фото…
                    </span>
                  )}
                </div>

                {/* Direct File & Phone Gallery Upload Dropzone */}
                <label
                  htmlFor="admin-photo-file-upload"
                  className={cn(
                    "flex flex-col items-center justify-center gap-2.5 rounded-card border-2 border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 p-6 text-center cursor-pointer transition hover:border-primary active:scale-[0.99]",
                    uploadingPhotos && "opacity-50 pointer-events-none"
                  )}
                >
                  <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/15 text-primary">
                    <Icon name="UploadCloud" size={24} />
                  </div>
                  <div>
                    <div className="font-medium text-[15px] text-foreground">
                      Нажмите, чтобы выбрать фото из галереи телефона или файлов компьютера
                    </div>
                    <div className="mt-1 text-[12px] text-muted-foreground">
                      Поддерживаются JPG, PNG, WEBP. Можно выделить сразу несколько фотографий.
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-[12px] font-medium text-primary-foreground shadow-sm">
                    <Icon name="ImagePlus" size={14} /> Выбрать из галереи / файла
                  </span>
                  <input
                    id="admin-photo-file-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>

                {/* Photo Previews with Reorder & Remove */}
                {editingApt.photos.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-[12px] font-medium text-muted-foreground">
                      Загруженные фотографии квартиры:
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                      {editingApt.photos.map((url, idx) => (
                        <div
                          key={idx}
                          className="group relative aspect-[4/3] overflow-hidden rounded-plate border border-border bg-muted shadow-sm"
                        >
                          <img src={url} alt={`Фото ${idx + 1}`} className="h-full w-full object-cover" />
                          
                          {/* Remove button */}
                          <button
                            type="button"
                            onClick={() => removePhoto(idx)}
                            className="absolute top-1.5 right-1.5 grid h-6 w-6 place-items-center rounded-full bg-black/75 text-white hover:bg-destructive transition shadow z-10"
                            title="Удалить фото"
                          >
                            <Icon name="X" size={13} />
                          </button>

                          {/* Cover badge / Set as cover button */}
                          {idx === 0 ? (
                            <span className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded bg-gold px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground shadow z-10">
                              <Icon name="Star" size={10} className="fill-current" /> Обложка
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => makePhotoCover(idx)}
                              className="absolute bottom-1.5 left-1.5 rounded bg-black/75 px-1.5 py-0.5 text-[10px] font-medium text-white hover:bg-gold hover:text-primary-foreground transition opacity-90 group-hover:opacity-100 z-10"
                              title="Сделать главной обложкой"
                            >
                              Сделать обложкой
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Optional Stock Photos & URL Adder */}
                <div className="rounded-plate bg-background/50 p-3.5 border border-border/60 space-y-3">
                  <div>
                    <div className="text-[11px] font-medium text-muted-foreground mb-1.5">
                      Или быстро добавить готовые фото интерьера:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {DEFAULT_PHOTOS.map((p) => (
                        <button
                          key={p.label}
                          type="button"
                          onClick={() => addPhotoUrl(p.url)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] text-foreground hover:border-gold hover:text-gold transition active:scale-95"
                        >
                          <Icon name="Image" size={12} className="text-gold" />
                          + {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-border/40 pt-2.5">
                    <div className="text-[11px] font-medium text-muted-foreground mb-1.5">
                      Или вставить интернет-ссылку на фото (URL):
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={newPhotoUrl}
                        onChange={(e) => setNewPhotoUrl(e.target.value)}
                        placeholder="https://..."
                        className="flex-1 text-[12px] h-9"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newPhotoUrl) {
                            addPhotoUrl(newPhotoUrl);
                            setNewPhotoUrl("");
                          }
                        }}
                        className="inline-flex h-9 items-center gap-1 rounded-md bg-secondary px-3 text-[12px] font-medium text-foreground hover:bg-secondary/80 transition"
                      >
                        <Icon name="Plus" size={13} /> Добавить
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. Удобства */}
              <div className="space-y-3 border-t border-border pt-4">
                <h4 className="text-[14px] font-semibold text-foreground uppercase tracking-wider text-gold">
                  5. Главные удобства (ключевые фишки)
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_AMENITIES.map((amenity) => {
                    const active = editingApt.keyAmenities.includes(amenity);
                    return (
                      <button
                        key={amenity}
                        type="button"
                        onClick={() => toggleAmenity(amenity)}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-medium transition active:scale-95",
                          active
                            ? "border-primary bg-primary text-primary-foreground shadow-sm"
                            : "border-border bg-background text-foreground/80 hover:border-foreground/30",
                        )}
                      >
                        {active && <Icon name="Check" size={12} />}
                        {amenity}
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-2 pt-1">
                  <Input
                    value={customAmenity}
                    onChange={(e) => setCustomAmenity(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addCustomAmenity();
                      }
                    }}
                    placeholder="Добавить другое удобство (например: Джакузи)"
                    className="flex-1 text-[13px]"
                  />
                  <button
                    type="button"
                    onClick={addCustomAmenity}
                    className="inline-flex items-center gap-1 rounded-md bg-secondary px-3 text-[13px] font-medium text-foreground hover:bg-secondary/80 transition"
                  >
                    <Icon name="Plus" size={14} /> Добавить
                  </button>
                </div>
              </div>

              {/* 6. Положение на карте */}
              <div className="space-y-3 border-t border-border pt-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[14px] font-semibold text-foreground uppercase tracking-wider text-gold">
                    6. Географические координаты на карте Нового Уренгоя
                  </h4>
                  <span className="text-[11px] text-muted-foreground">
                    Метка с ценой будет точно привязана к зданию на карте
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-[12px] font-medium text-muted-foreground">
                      Широта (Latitude, например 66.0886)
                    </label>
                    <Input
                      type="number"
                      step="0.0001"
                      value={editingApt.coords?.[0] ?? 66.0886}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setEditingApt({
                          ...editingApt,
                          coords: [val, editingApt.coords?.[1] ?? 76.6775],
                        });
                      }}
                      className="mt-1 font-mono text-[13px]"
                    />
                  </div>

                  <div>
                    <label className="text-[12px] font-medium text-muted-foreground">
                      Долгота (Longitude, например 76.6775)
                    </label>
                    <Input
                      type="number"
                      step="0.0001"
                      value={editingApt.coords?.[1] ?? 76.6775}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setEditingApt({
                          ...editingApt,
                          coords: [editingApt.coords?.[0] ?? 66.0886, val],
                        });
                      }}
                      className="mt-1 font-mono text-[13px]"
                    />
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground">
                  Координаты можно автоматически заполнить при выборе района выше (в пункте 2). Кнопка с ценой этой квартиры будет всегда точно отображаться на этом доме на интерактивной карте города и перемещаться вместе с ней при зуме.
                </p>
              </div>

              {/* 7. Описание */}
              <div className="space-y-3 border-t border-border pt-4">
                <h4 className="text-[14px] font-semibold text-foreground uppercase tracking-wider text-gold">
                  7. Подробное описание
                </h4>
                <textarea
                  rows={4}
                  value={editingApt.description}
                  onChange={(e) => setEditingApt({ ...editingApt, description: e.target.value })}
                  placeholder="Опишите преимущества, спальные места, технику, инфраструктуру рядом и правила..."
                  className="w-full rounded-md border border-input bg-background p-3 text-[13px] text-foreground placeholder:text-muted-foreground focus-visible:outline-none"
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-row justify-end gap-2 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => {
                setDialogOpen(false);
                setEditingApt(null);
              }}
              className="inline-flex h-10 items-center justify-center rounded-full border border-border px-4 text-[13px] font-medium text-foreground hover:bg-secondary transition"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={handleSaveApt}
              className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-6 text-[13px] font-medium text-primary-foreground hover:bg-primary/90 transition shadow-sm"
            >
              {isNewApt ? "Создать квартиру" : "Сохранить изменения"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert Dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-[18px] font-medium text-foreground">
              Удалить квартиру из каталога?
            </DialogTitle>
            <DialogDescription className="text-[13px] text-muted-foreground mt-2">
              Объявление будет удалено из каталога сайта и с интерактивной карты города. Вы всегда сможете восстановить исходный каталог кнопкой «Сбросить к исходным».
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex flex-row justify-end gap-2">
            <button
              type="button"
              onClick={() => setDeleteConfirmId(null)}
              className="inline-flex h-10 items-center rounded-full border border-border px-4 text-[13px] font-medium"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={() => deleteConfirmId && handleDeleteApt(deleteConfirmId)}
              className="inline-flex h-10 items-center rounded-full bg-destructive px-5 text-[13px] font-medium text-destructive-foreground hover:bg-destructive/90 transition"
            >
              Удалить
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
