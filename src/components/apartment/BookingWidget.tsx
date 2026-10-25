import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import type { DateRange } from "react-day-picker";
import { ru } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import Icon from "@/components/ui/icon";
import { type Apartment, calcStay, fromKey, isRangeFree, nightsWord, rub, toKey } from "@/lib/apartments";
import { formatGuests, formatRange } from "@/components/site/SearchBar";

export default function BookingWidget({
  apt,
  range,
  setRange,
  adults,
  childrenCount,
  setGuests,
}: {
  apt: Apartment;
  range: DateRange | undefined;
  setRange: (r: DateRange | undefined) => void;
  adults: number;
  childrenCount: number;
  setGuests: (a: number, c: number) => void;
}) {
  const navigate = useNavigate();
  const stay = calcStay(apt, range?.from, range?.to);
  const free = isRangeFree(apt, range?.from, range?.to);
  const tooMany = adults + childrenCount > apt.guests;
  const ready = stay.nights > 0 && free && !tooMany;

  const book = () => {
    if (!ready || !range?.from || !range?.to) return;
    navigate({
      to: "/checkout",
      search: { apt: apt.id, from: toKey(range.from), to: toKey(range.to), adults, children: childrenCount },
    });
  };

  return (
    <div className="rounded-card bg-card p-5 shadow-[0_30px_60px_-40px_hsl(var(--primary)/0.5)] sm:p-6">
      <div className="flex items-baseline justify-between">
        <div>
          <span className="text-[26px] font-medium">{rub(stay.avg)}</span>
          <span className="text-muted-foreground"> / сутки</span>
        </div>
        <span className="flex items-center gap-1 text-[13px]">
          <Icon name="Zap" size={14} className="text-gold" /> Мгновенная бронь
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 overflow-hidden rounded-plate border border-border text-left">
        <div className="border-r border-border p-3">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Даты</div>
          <div className="text-[14px]">{formatRange(range)}</div>
        </div>
        <div className="p-3">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Гости</div>
          <div className="flex items-center justify-between gap-1 text-[14px]">
            <span className="truncate">{formatGuests(adults, childrenCount)}</span>
          </div>
        </div>
      </div>
      <div className="mt-2 flex gap-2 text-[12px]">
        <div className="flex flex-1 items-center justify-between rounded-plate bg-secondary px-3 py-2">
          Взрослые
          <span className="flex items-center gap-2">
            <button aria-label="Меньше взрослых" disabled={adults <= 1} onClick={() => setGuests(adults - 1, childrenCount)} className="disabled:opacity-30"><Icon name="Minus" size={14} /></button>
            <span className="w-3 text-center">{adults}</span>
            <button aria-label="Больше взрослых" disabled={adults >= 8} onClick={() => setGuests(adults + 1, childrenCount)} className="disabled:opacity-30"><Icon name="Plus" size={14} /></button>
          </span>
        </div>
        <div className="flex flex-1 items-center justify-between rounded-plate bg-secondary px-3 py-2">
          Дети
          <span className="flex items-center gap-2">
            <button aria-label="Меньше детей" disabled={childrenCount <= 0} onClick={() => setGuests(adults, childrenCount - 1)} className="disabled:opacity-30"><Icon name="Minus" size={14} /></button>
            <span className="w-3 text-center">{childrenCount}</span>
            <button aria-label="Больше детей" disabled={childrenCount >= 4} onClick={() => setGuests(adults, childrenCount + 1)} className="disabled:opacity-30"><Icon name="Plus" size={14} /></button>
          </span>
        </div>
      </div>

      {stay.nights > 0 && free && (
        <div className="mt-5 space-y-2 text-[14px]">
          <div className="flex justify-between text-muted-foreground">
            <span>{rub(stay.avg)} × {stay.nights} {nightsWord(stay.nights)}</span>
            <span className="text-foreground">{rub(stay.stay)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Уборка</span>
            <span className="text-foreground">{rub(stay.cleaning)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Сервисный сбор</span>
            <span className="text-gold">0 ₽</span>
          </div>
          <div className="flex justify-between border-t border-border pt-3 text-[16px] font-medium">
            <span>Итого</span>
            <span>{rub(stay.total)}</span>
          </div>
        </div>
      )}

      {!free && (
        <p className="mt-4 flex items-center gap-2 rounded-plate bg-destructive/10 px-3 py-2 text-[13px] text-destructive">
          <Icon name="CalendarX" size={15} /> В выбранном периоде есть занятые даты
        </p>
      )}
      {tooMany && (
        <p className="mt-4 rounded-plate bg-destructive/10 px-3 py-2 text-[13px] text-destructive">Квартира вмещает до {apt.guests} гостей</p>
      )}

      <button
        onClick={book}
        disabled={!ready}
        className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-[15px] font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {stay.nights === 0 ? "Выберите даты в календаре" : "Забронировать"}
      </button>
      <p className="mt-3 text-center text-[12px] text-muted-foreground">Деньги не списываются до подтверждения</p>
    </div>
  );
}

export function AvailabilityCalendar({ apt, range, setRange }: { apt: Apartment; range: DateRange | undefined; setRange: (r: DateRange | undefined) => void }) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const blocked = apt.blocked.map(fromKey);
  return (
    <div className="rounded-card bg-card p-3 sm:p-5">
      <Calendar
        mode="range"
        locale={ru}
        numberOfMonths={isMobile ? 1 : 2}
        selected={range}
        onSelect={setRange}
        defaultMonth={range?.from ?? today}
        disabled={[{ before: today }, ...blocked]}
        modifiers={{ booked: blocked }}
        modifiersClassNames={{ booked: "line-through decoration-destructive/70" }}
        className="p-0"
        classNames={{ months: "flex flex-col md:flex-row gap-6 md:gap-10", month: "space-y-4 w-full" }}
      />
      <div className="mt-4 flex flex-wrap gap-4 border-t border-border pt-4 text-[12px] text-muted-foreground">
        <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm bg-primary" /> Ваши даты</span>
        <span className="flex items-center gap-2"><span className="text-[13px] line-through decoration-destructive">14</span> Занято</span>
        <span className="flex items-center gap-2"><Icon name="RefreshCw" size={12} className="text-gold" /> Синхронизировано с Avito и Суточно.ру</span>
      </div>
    </div>
  );
}
