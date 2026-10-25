import { useState } from "react";
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import type { DateRange } from "react-day-picker";
import Icon from "@/components/ui/icon";
import PageShell from "@/components/site/PageShell";
import Gallery from "@/components/apartment/Gallery";
import BookingWidget, { AvailabilityCalendar } from "@/components/apartment/BookingWidget";
import { formatRange } from "@/components/site/SearchBar";
import { AMENITY_GROUPS, HOUSE_RULES, calcStay, fromKey, getApartment, isRangeFree, nightsWord, rub, toKey } from "@/lib/apartments";
import { parseStaySearch } from "@/lib/search";

export const Route = createFileRoute("/apartment/$id")({
  validateSearch: parseStaySearch,
  loader: ({ params }) => {
    const apt = getApartment(params.id);
    if (!apt) throw notFound();
    return { apt };
  },
  head: ({ loaderData }) => {
    const title = loaderData ? `${loaderData.apt.title} — Клевер, гостевые квартиры` : "Квартира — Клевер";
    const desc = loaderData ? `${loaderData.apt.rooms}, ${loaderData.apt.area} м², м. ${loaderData.apt.metro}. Прямая бронь без комиссий.` : "";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        ...(loaderData ? [{ property: "og:image", content: loaderData.apt.photos[0] }] : []),
      ],
    };
  },
  component: ApartmentPage,
});

function ApartmentPage() {
  const { apt } = Route.useLoaderData();
  const s = Route.useSearch();
  const navigate = useNavigate();
  const [range, setRange] = useState<DateRange | undefined>(
    s.from && s.to ? { from: fromKey(s.from), to: fromKey(s.to) } : undefined,
  );
  const [adults, setAdults] = useState(s.adults ?? 2);
  const [kids, setKids] = useState(s.children ?? 0);

  const stay = calcStay(apt, range?.from, range?.to);
  const free = isRangeFree(apt, range?.from, range?.to);
  const tooMany = adults + kids > apt.guests;
  const ready = stay.nights > 0 && free && !tooMany;

  return (
    <PageShell>
      <div className="mt-6 sm:mt-8">
        <Link to="/" className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground active:scale-95 transition">
          <Icon name="ArrowLeft" size={14} /> Все квартиры
        </Link>
        <div className="mt-2.5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <h1 className="text-[26px] sm:text-[34px] lg:text-[48px] font-normal leading-tight tracking-[-0.02em]">{apt.title}</h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] sm:text-[14px] text-muted-foreground">
            <span className="flex items-center gap-1 text-foreground font-medium"><Icon name="Star" size={14} className="fill-gold text-gold" /> {apt.rating.toFixed(2)} · {apt.reviews} отзывов</span>
            <span className="flex items-center gap-1"><Icon name="MapPin" size={14} className="text-gold" /> {apt.address} · {apt.metro}</span>
            <span>{apt.district}</span>
          </div>
        </div>
      </div>

      <div className="mt-5 sm:mt-6">
        <Gallery photos={apt.photos} title={apt.title} />
      </div>

      <div className="mt-8 sm:mt-10 grid gap-10 lg:grid-cols-[1fr_380px] pb-24 lg:pb-0">
        <div className="min-w-0 space-y-10 sm:space-y-12">
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 sm:grid-cols-4">
            {[
              { i: "Users", t: `до ${apt.guests} гостей` },
              { i: "BedDouble", t: apt.beds },
              { i: "DoorOpen", t: apt.rooms },
              { i: "Ruler", t: `${apt.area} м² · этаж ${apt.floor}` },
            ].map((f) => (
              <div key={f.i} className="rounded-plate bg-strip/70 p-3.5 sm:p-4">
                <Icon name={f.i} size={18} className="text-gold sm:h-5 sm:w-5" />
                <div className="mt-1.5 sm:mt-2 text-[13px] sm:text-[14px] leading-snug">{f.t}</div>
              </div>
            ))}
          </div>

          <section>
            <h2 className="text-[22px] sm:text-[24px] font-normal">О квартире</h2>
            <p className="mt-3 max-w-2xl leading-relaxed text-foreground/80 text-[14px] sm:text-[15px]">{apt.description}</p>
            <div className="mt-4 sm:mt-5 flex items-start gap-3 rounded-plate border border-gold/40 bg-gold/5 p-3.5 sm:p-4 text-[13px] sm:text-[14px]">
              <Icon name="KeyRound" size={18} className="mt-0.5 shrink-0 text-gold" />
              <span>Бесконтактное заселение: код от электронного замка придёт в WhatsApp или Telegram в день заезда.</span>
            </div>
          </section>

          <section id="availability-calendar" className="scroll-mt-10">
            <h2 className="text-[22px] sm:text-[24px] font-normal">Календарь занятости</h2>
            <p className="mt-1 text-[13px] sm:text-[14px] text-muted-foreground">Выберите даты заезда и выезда — цена пересчитается сразу.</p>
            <div className="mt-4">
              <AvailabilityCalendar apt={apt} range={range} setRange={setRange} />
            </div>
          </section>

          <section>
            <h2 className="text-[22px] sm:text-[24px] font-normal">Удобства</h2>
            <div className="mt-4 sm:mt-5 grid gap-5 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {AMENITY_GROUPS.map((g) => (
                <div key={g.title}>
                  <div className="flex items-center gap-2 text-[14px] sm:text-[15px] font-medium">
                    <Icon name={g.icon} size={17} className="text-gold" /> {g.title}
                  </div>
                  <ul className="mt-2 space-y-1.5 text-[13px] sm:text-[14px] text-foreground/75">
                    {g.items.map((it) => (
                      <li key={it} className="flex items-center gap-2"><Icon name="Check" size={13} className="text-primary" /> {it}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-[22px] sm:text-[24px] font-normal">Правила дома</h2>
            <div className="mt-4 sm:mt-5 grid gap-2.5 sm:gap-3 sm:grid-cols-2">
              {HOUSE_RULES.map((r) => (
                <div key={r.title} className="flex gap-3 rounded-plate bg-strip/70 p-3.5 sm:p-4">
                  <Icon name={r.icon} size={18} className="mt-0.5 shrink-0 text-gold sm:h-5 sm:w-5" />
                  <div>
                    <div className="text-[14px] sm:text-[15px] font-medium">{r.title}</div>
                    <div className="text-[12px] sm:text-[13px] text-muted-foreground">{r.text}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside id="booking-section" className="scroll-mt-10 lg:sticky lg:top-6 lg:self-start">
          <BookingWidget
            apt={apt}
            range={range}
            setRange={setRange}
            adults={adults}
            childrenCount={kids}
            setGuests={(a, c) => {
              setAdults(a);
              setKids(c);
            }}
          />
        </aside>
      </div>

      {/* Мобильная фиксированная панель бронирования */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between gap-3 border-t border-border bg-card/95 px-4 py-2.5 backdrop-blur-md lg:hidden shadow-[0_-8px_25px_rgba(0,0,0,0.12)]">
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-1">
            <span className="text-[17px] sm:text-[18px] font-semibold text-foreground">{rub(stay.avg)}</span>
            <span className="text-[11px] text-muted-foreground">/ сутки</span>
          </div>
          <div className="truncate text-[11px] sm:text-[12px]">
            {ready ? (
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                {stay.nights} {nightsWord(stay.nights)} · {rub(stay.total)}
              </span>
            ) : range?.from && range?.to ? (
              <span className="text-muted-foreground">{formatRange(range)}</span>
            ) : (
              <span className="text-muted-foreground">Выберите даты</span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            if (ready && range?.from && range?.to) {
              navigate({
                to: "/checkout",
                search: { apt: apt.id, from: toKey(range.from), to: toKey(range.to), adults, children: kids },
              });
            } else {
              const el = document.getElementById("availability-calendar") || document.getElementById("booking-section");
              el?.scrollIntoView({ behavior: "smooth", block: "center" });
            }
          }}
          className="flex h-10 sm:h-11 shrink-0 items-center justify-center gap-1.5 sm:gap-2 rounded-full bg-primary px-4 sm:px-5 text-[13px] sm:text-[14px] font-medium text-primary-foreground shadow-md transition hover:bg-primary/90 active:scale-95 whitespace-nowrap"
        >
          <span>{ready ? "Забронировать" : "Выбрать даты"}</span>
          <Icon name={ready ? "Check" : "Calendar"} size={14} />
        </button>
      </div>
    </PageShell>
  );
}
