import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import Icon from "@/components/ui/icon";
import PageShell from "@/components/site/PageShell";
import { formatGuests, formatRange } from "@/components/site/SearchBar";
import { BOOKINGS_KEY, type Booking, fromKey, getApartment, rub, TELEGRAM_HREF, WHATSAPP_HREF } from "@/lib/apartments";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/bookings")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>): { new?: string } => ({ new: typeof s.new === "string" ? s.new : undefined }),
  head: () => ({ meta: [{ title: "Мои бронирования — Клевер" }, { name: "robots", content: "noindex" }] }),
  component: Bookings,
});

const STATUS: Record<Booking["status"], { t: string; c: string }> = {
  confirmed: { t: "Подтверждена", c: "bg-primary text-primary-foreground" },
  pending: { t: "Ждёт подтверждения", c: "bg-gold text-accent-foreground" },
  cancelled: { t: "Отменена", c: "bg-muted text-muted-foreground" },
};

function Bookings() {
  const { new: fresh } = Route.useSearch();
  const [list, setList] = useState<Booking[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      setList(JSON.parse(localStorage.getItem(BOOKINGS_KEY) || "[]"));
    } catch {
      setList([]);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(BOOKINGS_KEY, JSON.stringify(list));
  }, [list, loaded]);

  const cancel = (id: string) => setList((l) => l.map((b) => (b.id === id ? { ...b, status: "cancelled" } : b)));

  return (
    <PageShell>
      <div className="mt-8">
        <h1 className="text-[34px] font-normal tracking-[-0.02em] sm:text-[48px]">
          Мои <span className="font-serif italic text-gold">бронирования</span>
        </h1>

        {fresh && (
          <div className="mt-6 flex animate-rise items-start gap-4 rounded-card bg-primary p-5 text-primary-foreground sm:p-6">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gold text-accent-foreground">
              <Icon name="Check" size={20} />
            </span>
            <div>
              <div className="text-[18px] font-medium">Бронь {fresh} оформлена</div>
              <p className="mt-1 text-[14px] text-primary-foreground/75">
                Подтверждение и инструкция по заселению придут в мессенджер. Код от двери — в день заезда.
              </p>
            </div>
          </div>
        )}

        {loaded && list.length === 0 && (
          <div className="mt-8 rounded-card border border-dashed border-foreground/20 p-10 text-center">
            <Icon name="CalendarHeart" size={32} className="mx-auto text-gold" />
            <p className="mt-3 text-[18px]">Пока нет бронирований</p>
            <p className="mt-1 text-muted-foreground">Выберите квартиру и даты — оформление займёт пару минут.</p>
            <Link to="/" className="mt-6 inline-flex h-11 items-center rounded-full bg-primary px-6 text-primary-foreground">Найти квартиру</Link>
          </div>
        )}

        <div className="mt-8 space-y-4">
          {list.map((b) => {
            const apt = getApartment(b.aptId);
            if (!apt) return null;
            const st = STATUS[b.status];
            return (
              <div key={b.id} className={cn("flex flex-col overflow-hidden rounded-card bg-card sm:flex-row", b.status === "cancelled" && "opacity-60")}>
                <img src={apt.photos[0]} alt={apt.title} loading="lazy" className="aspect-[16/9] w-full object-cover sm:aspect-auto sm:w-64" />
                <div className="flex flex-1 flex-col gap-3 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-[18px] font-medium">{apt.title}</div>
                    <span className={cn("rounded-full px-3 py-1 text-[12px]", st.c)}>{st.t}</span>
                  </div>
                  <div className="grid gap-x-6 gap-y-1 text-[14px] text-muted-foreground sm:grid-cols-2">
                    <span className="flex items-center gap-2"><Icon name="Calendar" size={14} className="text-gold" /> {formatRange({ from: fromKey(b.from), to: fromKey(b.to) })}</span>
                    <span className="flex items-center gap-2"><Icon name="Users" size={14} className="text-gold" /> {formatGuests(b.adults, b.children)}</span>
                    <span className="flex items-center gap-2"><Icon name="Clock" size={14} className="text-gold" /> Заезд около {b.arrival}</span>
                    <span className="flex items-center gap-2"><Icon name="MapPin" size={14} className="text-gold" /> {apt.address}</span>
                  </div>
                  <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
                    <span className="text-[14px]">
                      № {b.id} · <span className="font-medium">{rub(b.total)}</span>{" "}
                      <span className="text-muted-foreground">{b.payment === "online" ? "· предоплата онлайн" : "· оплата при заселении"}</span>
                    </span>
                    <div className="flex gap-2">
                      <a href={WHATSAPP_HREF} target="_blank" rel="noreferrer" className="grid h-9 w-9 place-items-center rounded-full border border-border hover:border-gold" aria-label="WhatsApp"><Icon name="MessageCircle" size={15} /></a>
                      <a href={TELEGRAM_HREF} target="_blank" rel="noreferrer" className="grid h-9 w-9 place-items-center rounded-full border border-border hover:border-gold" aria-label="Telegram"><Icon name="Send" size={15} /></a>
                      {b.status !== "cancelled" && (
                        <button onClick={() => cancel(b.id)} className="h-9 rounded-full border border-border px-4 text-[13px] hover:border-destructive hover:text-destructive">Отменить</button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </PageShell>
  );
}
