import { useState } from "react";
import { Link } from "@tanstack/react-router";
import Icon from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { type Apartment, calcStay, isRangeFree, nightsWord, rub, toKey } from "@/lib/apartments";
import type { SearchState } from "./SearchBar";

export function PhotoSlider({ photos, alt, className, children }: { photos: string[]; alt: string; className?: string; children?: React.ReactNode }) {
  const [i, setI] = useState(0);
  const go = (e: React.MouseEvent, d: number) => {
    e.preventDefault();
    e.stopPropagation();
    setI((p) => (p + d + photos.length) % photos.length);
  };
  return (
    <div className={cn("group/slider relative overflow-hidden", className)}>
      <div className="flex h-full transition-transform duration-500 ease-out" style={{ transform: `translateX(-${i * 100}%)` }}>
        {photos.map((src, idx) => (
          <img
            key={idx}
            src={src}
            alt={`${alt} — фото ${idx + 1}`}
            loading="lazy"
            decoding="async"
            className="h-full w-full shrink-0 object-cover"
          />
        ))}
      </div>
      <button
        type="button"
        aria-label="Предыдущее фото"
        onClick={(e) => go(e, -1)}
        className="absolute left-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-card/85 text-foreground opacity-100 shadow transition md:opacity-0 md:group-hover/slider:opacity-100"
      >
        <Icon name="ChevronLeft" size={18} />
      </button>
      <button
        type="button"
        aria-label="Следующее фото"
        onClick={(e) => go(e, 1)}
        className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-card/85 text-foreground opacity-100 shadow transition md:opacity-0 md:group-hover/slider:opacity-100"
      >
        <Icon name="ChevronRight" size={18} />
      </button>
      <div className="absolute left-1/2 top-4 flex -translate-x-1/2 gap-1.5">
        {photos.map((_, idx) => (
          <span key={idx} className={cn("h-1.5 rounded-full bg-white/90 transition-all", idx === i ? "w-5" : "w-1.5 bg-white/55")} />
        ))}
      </div>
      {children}
    </div>
  );
}

export default function ApartmentCard({ apt, search, index = 0 }: { apt: Apartment; search: SearchState; index?: number }) {
  const [fav, setFav] = useState(false);
  const { from, to } = search.range ?? {};
  const stay = calcStay(apt, from, to);
  const free = isRangeFree(apt, from, to);
  const tooMany = search.adults + search.children > apt.guests;

  return (
    <article className="animate-rise min-w-0 overflow-hidden" style={{ animationDelay: `${index * 90}ms` }}>
      <Link
        to="/apartment/$id"
        params={{ id: apt.id }}
        search={{
          from: from ? toKey(from) : undefined,
          to: to ? toKey(to) : undefined,
          adults: search.adults,
          children: search.children,
        }}
        className="group block min-w-0 overflow-hidden"
      >
        <PhotoSlider photos={apt.photos} alt={apt.title} className="aspect-[4/5] rounded-card bg-muted w-full min-w-0">
          {apt.badge && (
            <span className="absolute left-4 top-4 rounded-full bg-card/90 px-3 py-1 text-xs font-medium text-foreground">
              {apt.badge}
            </span>
          )}
          <button
            type="button"
            aria-label="В избранное"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setFav((v) => !v);
            }}
            className="absolute right-4 top-3 grid h-9 w-9 place-items-center rounded-full text-white"
          >
            <Icon name="Heart" size={22} className={cn("drop-shadow transition", fav && "fill-gold text-gold")} />
          </button>
          <div className="glass-plate absolute inset-x-3 bottom-3 flex items-end justify-between gap-3 rounded-plate px-4 py-3 text-white">
            <div className="min-w-0">
              <div className="truncate text-[15px] font-medium">{apt.title}</div>
              <div className="truncate text-[12px] text-white/70">
                {apt.district} · {apt.guests} {apt.guests > 4 ? "гостей" : "гостя"}
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div className="text-[15px] font-medium">{rub(stay.avg)}</div>
              <div className="text-[11px] text-white/65">за сутки</div>
            </div>
          </div>
        </PhotoSlider>

        <div className="px-1 pt-4 min-w-0">
          <div className="flex items-center justify-between gap-2 text-[13px] text-muted-foreground min-w-0">
            <span className="flex items-center gap-1.5 truncate min-w-0 flex-1">
              <Icon name="MapPin" size={14} className="text-gold shrink-0" />
              <span className="truncate">{apt.address} · {apt.metro}</span>
            </span>
            <span className="flex shrink-0 items-center gap-1 text-foreground">
              <Icon name="Star" size={13} className="fill-gold text-gold" />
              {apt.rating.toFixed(2)} <span className="text-muted-foreground">({apt.reviews})</span>
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-foreground/80">
            <span className="flex items-center gap-1.5"><Icon name="Users" size={14} /> до {apt.guests}</span>
            <span className="flex items-center gap-1.5"><Icon name="BedDouble" size={14} /> {apt.beds}</span>
            <span className="flex items-center gap-1.5"><Icon name="Ruler" size={14} /> {apt.area} м²</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {apt.keyAmenities.map((a) => (
              <span key={a} className="rounded-full bg-secondary px-2.5 py-1 text-[12px] text-secondary-foreground">
                {a}
              </span>
            ))}
          </div>
          <div className="mt-4 flex items-end justify-between border-t border-foreground/10 pt-3 gap-2 min-w-0">
            <div className="min-w-0 flex-1 truncate text-[13px]">
              {!free ? (
                <span className="flex items-center gap-1.5 text-destructive truncate">
                  <Icon name="CalendarX" size={14} className="shrink-0" /> Занято на эти даты
                </span>
              ) : tooMany ? (
                <span className="text-destructive truncate">Вмещает до {apt.guests} гостей</span>
              ) : stay.nights > 0 ? (
                <span className="text-muted-foreground truncate">
                  {stay.nights} {nightsWord(stay.nights)} ·{" "}
                  <span className="text-[15px] font-medium text-foreground">{rub(stay.total)}</span>
                </span>
              ) : (
                <span className="text-muted-foreground truncate">Выберите даты</span>
              )}
            </div>
            <span className="flex shrink-0 items-center gap-1 text-[13px] font-medium text-primary transition group-hover:gap-2">
              Смотреть <Icon name="ArrowRight" size={14} />
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
