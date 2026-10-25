import { useMemo, useState } from "react";
import Icon from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { isRangeFree, useApartments } from "@/lib/apartments";
import ApartmentCard from "./ApartmentCard";
import type { SearchState } from "./SearchBar";

const FILTERS = [
  { id: "all", label: "Все квартиры", icon: "LayoutGrid" },
  { id: "studio", label: "Студии", icon: "BedSingle" },
  { id: "two", label: "2+ комнаты", icon: "DoorOpen" },
  { id: "family", label: "Для семьи", icon: "Baby" },
  { id: "view", label: "С видом", icon: "Building2" },
] as const;

type FilterId = (typeof FILTERS)[number]["id"];

export default function Catalog({ search, onlyFree }: { search: SearchState; onlyFree: boolean }) {
  const apartments = useApartments();
  const [filter, setFilter] = useState<FilterId>("all");
  const [sort, setSort] = useState<"rating" | "cheap" | "expensive">("rating");

  const list = useMemo(() => {
    let l = apartments.filter((a) => {
      if (filter === "studio") return a.rooms === "Студия" || a.rooms === "Лофт";
      if (filter === "two") return a.rooms.includes("комнат");
      if (filter === "family") return a.guests >= 4;
      if (filter === "view") return a.keyAmenities.some((k) => k.includes("окна")) || a.badge === "Вид на реку";
      return true;
    });
    if (onlyFree) {
      l = l.filter((a) => isRangeFree(a, search.range?.from, search.range?.to) && a.guests >= search.adults + search.children);
    }
    return [...l].sort((a, b) =>
      sort === "cheap" ? a.price - b.price : sort === "expensive" ? b.price - a.price : b.rating - a.rating,
    );
  }, [apartments, filter, sort, onlyFree, search]);

  return (
    <section id="catalog" className="scroll-mt-6 w-full min-w-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between w-full min-w-0">
        <div className="w-full min-w-0 overflow-hidden">
          <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1 touch-pan-x">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-[13px] transition active:scale-95",
                  filter === f.id
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-foreground/15 bg-strip/60 text-foreground/80 hover:border-foreground/40",
                )}
              >
                <Icon name={f.icon} size={14} />
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-2 text-[13px] text-muted-foreground pt-1 sm:pt-0 shrink-0">
          <span className="text-[12px] sm:hidden text-muted-foreground">Сортировка:</span>
          <div className="flex items-center gap-1.5 rounded-full bg-secondary/80 px-3 py-1.5 border border-border/60">
            <Icon name="ArrowUpDown" size={13} className="text-gold" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              className="cursor-pointer bg-transparent text-foreground outline-none font-medium text-[13px]"
              aria-label="Сортировка"
            >
              <option value="rating">По рейтингу</option>
              <option value="cheap">Сначала дешевле</option>
              <option value="expensive">Сначала дороже</option>
            </select>
          </div>
        </div>
      </div>

      {onlyFree && (
        <p className="mt-4 text-[13px] text-muted-foreground">
          Свободно на выбранные даты: <span className="font-medium text-foreground">{list.length}</span> из {apartments.length}
        </p>
      )}

      {list.length === 0 ? (
        <div className="mt-6 rounded-card border border-dashed border-foreground/20 p-10 text-center">
          <Icon name="CalendarSearch" size={28} className="mx-auto text-gold" />
          <p className="mt-3 text-foreground">На эти даты всё занято</p>
          <p className="mt-1 text-[13px] text-muted-foreground">Попробуйте сдвинуть даты или напишите нам — подберём вариант вручную.</p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((a, i) => (
            <ApartmentCard key={a.id} apt={a} search={search} index={i} />
          ))}
        </div>
      )}
    </section>
  );
}
