import { useEffect, useState } from "react";
import type { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import Icon from "@/components/ui/icon";
import { cn } from "@/lib/utils";

export type SearchState = {
  range: DateRange | undefined;
  adults: number;
  children: number;
};

export const formatRange = (r?: DateRange) => {
  if (!r?.from) return "Выберите даты";
  if (!r.to) return format(r.from, "d MMMM", { locale: ru }) + " – …";
  const sameMonth = r.from.getMonth() === r.to.getMonth();
  return sameMonth
    ? `${format(r.from, "d", { locale: ru })} – ${format(r.to, "d MMMM", { locale: ru })}`
    : `${format(r.from, "d MMM", { locale: ru })} – ${format(r.to, "d MMM", { locale: ru })}`;
};

export const formatGuests = (a: number, c: number) => {
  const ad = a === 1 ? "1 взрослый" : `${a} взрослых`;
  if (!c) return ad;
  return `${ad}, ${c} ${c === 1 ? "ребёнок" : c < 5 ? "ребёнка" : "детей"}`;
};

function Counter({ label, hint, value, min, max, onChange }: { label: string; hint: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between gap-6 py-3">
      <div>
        <div className="text-[15px] font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{hint}</div>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={`Меньше: ${label}`}
          disabled={value <= min}
          onClick={() => onChange(value - 1)}
          className="grid h-9 w-9 place-items-center rounded-full border border-border transition hover:border-foreground disabled:opacity-30 active:scale-95"
        >
          <Icon name="Minus" size={14} />
        </button>
        <span className="w-5 text-center tabular-nums">{value}</span>
        <button
          type="button"
          aria-label={`Больше: ${label}`}
          disabled={value >= max}
          onClick={() => onChange(value + 1)}
          className="grid h-9 w-9 place-items-center rounded-full border border-border transition hover:border-foreground disabled:opacity-30 active:scale-95"
        >
          <Icon name="Plus" size={14} />
        </button>
      </div>
    </div>
  );
}

export default function SearchBar({
  value,
  onChange,
  onSubmit,
  className,
}: {
  value: SearchState;
  onChange: (s: SearchState) => void;
  onSubmit: () => void;
  className?: string;
}) {
  const [datesOpen, setDatesOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 640);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div
      className={cn(
        "flex w-full flex-col gap-1 rounded-[24px] bg-strip/95 p-1.5 shadow-[0_10px_30px_-18px_hsl(var(--primary)/0.45)] border border-border/40 sm:flex-row sm:items-center sm:rounded-full",
        className,
      )}
    >
      <Popover open={datesOpen} onOpenChange={setDatesOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex-1 min-w-0 rounded-full px-4 sm:pl-5 sm:pr-3 py-2 sm:py-2.5 text-left transition hover:bg-secondary/70 active:bg-secondary/70"
          >
            <div className="text-[11px] text-muted-foreground truncate">Заезд — выезд</div>
            <div className="whitespace-nowrap text-[14px] sm:text-[15px] font-medium text-foreground truncate">{formatRange(value.range)}</div>
          </button>
        </PopoverTrigger>
        <PopoverContent align={isMobile ? "center" : "start"} className="w-auto max-w-[calc(100vw-24px)] rounded-card border-border bg-card p-2 shadow-2xl">
          <Calendar
            mode="range"
            locale={ru}
            numberOfMonths={isMobile ? 1 : 2}
            selected={value.range}
            defaultMonth={value.range?.from}
            disabled={{ before: today }}
            onSelect={(r) => {
              onChange({ ...value, range: r });
              if (r?.from && r?.to && r.from.getTime() !== r.to.getTime()) setDatesOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
      <span className="hidden h-8 w-px shrink-0 bg-border/80 sm:block" />
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex-1 min-w-0 rounded-full px-4 sm:px-3 py-2 sm:py-2.5 text-left transition hover:bg-secondary/70 active:bg-secondary/70"
          >
            <div className="text-[11px] text-muted-foreground truncate">Гости</div>
            <div className="whitespace-nowrap text-[14px] sm:text-[15px] font-medium text-foreground truncate">{formatGuests(value.adults, value.children)}</div>
          </button>
        </PopoverTrigger>
        <PopoverContent align={isMobile ? "center" : "end"} className="w-[calc(100vw-24px)] sm:w-80 rounded-card border-border bg-card px-5 py-3 shadow-2xl">
          <Counter label="Взрослые" hint="от 14 лет" value={value.adults} min={1} max={8} onChange={(v) => onChange({ ...value, adults: v })} />
          <div className="h-px bg-border" />
          <Counter label="Дети" hint="до 14 лет" value={value.children} min={0} max={4} onChange={(v) => onChange({ ...value, children: v })} />
        </PopoverContent>
      </Popover>
      <button
        type="button"
        onClick={onSubmit}
        className="flex h-11 sm:h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-5 sm:px-5 text-[13px] sm:text-[14px] font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90 active:scale-98"
      >
        <Icon name="Search" size={16} className="shrink-0" />
        <span className="whitespace-nowrap hidden sm:inline lg:hidden xl:inline">Найти свободные квартиры</span>
        <span className="whitespace-nowrap hidden lg:inline xl:hidden">Найти квартиры</span>
        <span className="whitespace-nowrap inline sm:hidden">Найти свободные квартиры</span>
      </button>
    </div>
  );
}
