import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import Icon from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import PageShell from "@/components/site/PageShell";
import { formatGuests, formatRange } from "@/components/site/SearchBar";
import { BOOKINGS_KEY, type Booking, calcStay, fromKey, getApartment, isRangeFree, nightsWord, rub } from "@/lib/apartments";
import { cn } from "@/lib/utils";

type CheckoutSearch = { apt?: string; from?: string; to?: string; adults?: number; children?: number };

export const Route = createFileRoute("/checkout")({
  validateSearch: (s: Record<string, unknown>): CheckoutSearch => ({
    apt: typeof s.apt === "string" ? s.apt : undefined,
    from: typeof s.from === "string" ? s.from : undefined,
    to: typeof s.to === "string" ? s.to : undefined,
    adults: Number(s.adults) || undefined,
    children: Number(s.children) || undefined,
  }),
  head: () => ({ meta: [{ title: "Оформление брони — Клевер" }, { name: "robots", content: "noindex" }] }),
  component: Checkout,
});

const STEPS = ["Гость", "Заезд", "Оплата"];
const ARRIVALS = ["14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00", "После 22:00"];

function Checkout() {
  const s = Route.useSearch();
  const navigate = useNavigate();
  const apt = s.apt ? getApartment(s.apt) : undefined;
  const from = s.from ? fromKey(s.from) : undefined;
  const to = s.to ? fromKey(s.to) : undefined;
  const adults = s.adults ?? 2;
  const kids = s.children ?? 0;

  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ name: "", phone: "", email: "", arrival: "15:00", comment: "", payment: "online" as "online" | "onsite", agree: false, messenger: "whatsapp" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);

  if (!apt || !from || !to || !isRangeFree(apt, from, to)) {
    return (
      <PageShell>
        <div className="mx-auto max-w-md py-24 text-center">
          <Icon name="CalendarSearch" size={36} className="mx-auto text-gold" />
          <h1 className="mt-4 text-[28px] font-normal">Даты не выбраны</h1>
          <p className="mt-2 text-muted-foreground">Выберите квартиру и свободные даты, чтобы оформить бронь.</p>
          <Link to="/" className="mt-6 inline-flex h-11 items-center rounded-full bg-primary px-6 text-primary-foreground">К квартирам</Link>
        </div>
      </PageShell>
    );
  }

  const stay = calcStay(apt, from, to);
  const prepay = Math.round(stay.total * 0.3);

  const validate = (st: number) => {
    const e: Record<string, string> = {};
    if (st === 0) {
      if (form.name.trim().split(/\s+/).length < 2) e.name = "Укажите фамилию и имя";
      if (form.phone.replace(/\D/g, "").length < 11) e.phone = "Телефон в формате +7 900 000-00-00";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Проверьте email";
    }
    if (st === 2 && !form.agree) e.agree = "Нужно согласие с правилами";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (validate(step)) setStep((v) => v + 1);
  };

  const submit = () => {
    if (!validate(2)) return;
    setSending(true);
    const booking: Booking = {
      id: "KL-" + Math.floor(100000 + Math.random() * 900000),
      aptId: apt.id,
      from: s.from!,
      to: s.to!,
      adults,
      children: kids,
      name: form.name.trim(),
      phone: form.phone,
      email: form.email,
      arrival: form.arrival,
      payment: form.payment,
      total: stay.total,
      status: form.payment === "online" ? "confirmed" : "pending",
      createdAt: new Date().toISOString(),
    };
    try {
      const list: Booking[] = JSON.parse(localStorage.getItem(BOOKINGS_KEY) || "[]");
      localStorage.setItem(BOOKINGS_KEY, JSON.stringify([booking, ...list]));
    } catch {
      /* ignore */
    }
    setTimeout(() => navigate({ to: "/bookings", search: { new: booking.id } }), 700);
  };

  const set = (k: keyof typeof form, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <PageShell>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0">
          <Link to="/apartment/$id" params={{ id: apt.id }} search={{ from: s.from, to: s.to, adults, children: kids }} className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground">
            <Icon name="ArrowLeft" size={14} /> Назад к квартире
          </Link>
          <h1 className="mt-3 text-[34px] font-normal tracking-[-0.02em] sm:text-[44px]">
            Оформление <span className="font-serif italic text-gold">брони</span>
          </h1>

          <ol className="mt-6 flex items-center gap-2">
            {STEPS.map((t, i) => (
              <li key={t} className="flex flex-1 items-center gap-2">
                <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-full text-[13px] transition", i < step ? "bg-gold text-accent-foreground" : i === step ? "bg-primary text-primary-foreground" : "bg-strip text-muted-foreground")}>
                  {i < step ? <Icon name="Check" size={14} /> : i + 1}
                </span>
                <span className={cn("text-[14px]", i === step ? "text-foreground" : "text-muted-foreground")}>{t}</span>
                {i < STEPS.length - 1 && <span className="mx-1 hidden h-px flex-1 bg-border sm:block" />}
              </li>
            ))}
          </ol>

          <div key={step} className="mt-8 animate-rise rounded-card bg-card p-5 sm:p-8">
            {step === 0 && (
              <div className="space-y-5">
                <h2 className="text-[20px] font-medium">Данные гостя</h2>
                <Field label="ФИО" error={errors.name}>
                  <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Иванова Анна Сергеевна" className="h-12 rounded-plate" />
                </Field>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Телефон" error={errors.phone}>
                    <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+7 900 000-00-00" inputMode="tel" className="h-12 rounded-plate" />
                  </Field>
                  <Field label="Email" error={errors.email}>
                    <Input value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="anna@mail.ru" inputMode="email" className="h-12 rounded-plate" />
                  </Field>
                </div>
                <div>
                  <Label className="text-[13px] text-muted-foreground">Куда прислать подтверждение и код от двери</Label>
                  <div className="mt-2 flex gap-2">
                    {[{ id: "whatsapp", l: "WhatsApp", i: "MessageCircle" }, { id: "telegram", l: "Telegram", i: "Send" }].map((m) => (
                      <button key={m.id} type="button" onClick={() => set("messenger", m.id)} className={cn("flex items-center gap-2 rounded-full border px-4 py-2 text-[14px] transition", form.messenger === m.id ? "border-primary bg-primary text-primary-foreground" : "border-border")}>
                        <Icon name={m.i} size={15} /> {m.l}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {step === 1 && (
              <div className="space-y-5">
                <h2 className="text-[20px] font-medium">Время заезда</h2>
                <p className="text-[14px] text-muted-foreground">Заселение бесконтактное, с 14:00. Подскажите, во сколько примерно приедете — подготовим квартиру.</p>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {ARRIVALS.map((t) => (
                    <button key={t} type="button" onClick={() => set("arrival", t)} className={cn("rounded-plate border py-3 text-[14px] transition", form.arrival === t ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-foreground/40")}>
                      {t}
                    </button>
                  ))}
                </div>
                <Field label="Пожелания (необязательно)">
                  <Input value={form.comment} onChange={(e) => set("comment", e.target.value)} placeholder="Детская кроватка, ранний заезд…" className="h-12 rounded-plate" />
                </Field>
              </div>
            )}
            {step === 2 && (
              <div className="space-y-5">
                <h2 className="text-[20px] font-medium">Способ оплаты</h2>
                <RadioGroup value={form.payment} onValueChange={(v) => set("payment", v)} className="gap-3">
                  {[
                    { id: "online", t: "Предоплата онлайн", d: `Сейчас ${rub(prepay)} (30%), остальное при заселении. Бронь подтверждается сразу.`, i: "CreditCard" },
                    { id: "onsite", t: "Оплата при заселении", d: "Администратор подтвердит бронь в течение 15 минут.", i: "Wallet" },
                  ].map((o) => (
                    <Label key={o.id} htmlFor={o.id} className={cn("flex cursor-pointer items-start gap-4 rounded-plate border p-4 transition", form.payment === o.id ? "border-primary bg-secondary/50" : "border-border")}>
                      <RadioGroupItem id={o.id} value={o.id} className="mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-[15px] font-medium"><Icon name={o.i} size={16} className="text-gold" /> {o.t}</div>
                        <div className="mt-1 text-[13px] font-normal text-muted-foreground">{o.d}</div>
                      </div>
                    </Label>
                  ))}
                </RadioGroup>
                <label className="flex items-start gap-3 text-[14px]">
                  <Checkbox checked={form.agree} onCheckedChange={(v) => set("agree", v === true)} className="mt-0.5" />
                  <span>Согласен с правилами дома: не курить, без вечеринок, залог 3 000 ₽ возвращается при выезде.</span>
                </label>
                {errors.agree && <p className="text-[13px] text-destructive">{errors.agree}</p>}
              </div>
            )}

            <div className="mt-8 flex items-center justify-between gap-3">
              {step > 0 ? (
                <button type="button" onClick={() => setStep((v) => v - 1)} className="flex items-center gap-1.5 text-[14px] text-muted-foreground hover:text-foreground">
                  <Icon name="ArrowLeft" size={14} /> Назад
                </button>
              ) : <span />}
              {step < 2 ? (
                <button type="button" onClick={next} className="flex h-12 items-center gap-2 rounded-full bg-primary px-7 text-[15px] font-medium text-primary-foreground hover:bg-primary/90">
                  Далее <Icon name="ArrowRight" size={15} />
                </button>
              ) : (
                <button type="button" onClick={submit} disabled={sending} className="flex h-12 items-center gap-2 rounded-full bg-primary px-7 text-[15px] font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
                  {sending ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="Lock" size={15} />}
                  {form.payment === "online" ? `Оплатить ${rub(prepay)}` : "Забронировать"}
                </button>
              )}
            </div>
          </div>
        </div>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="overflow-hidden rounded-card bg-card">
            <img src={apt.photos[0]} alt={apt.title} className="aspect-[16/9] w-full object-cover" />
            <div className="space-y-3 p-5 text-[14px]">
              <div className="text-[18px] font-medium">{apt.title}</div>
              <div className="text-muted-foreground">{apt.address} · {apt.district}</div>
              <div className="flex justify-between border-t border-border pt-3"><span className="text-muted-foreground">Даты</span><span>{formatRange({ from, to })}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Гости</span><span>{formatGuests(adults, kids)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{stay.nights} {nightsWord(stay.nights)}</span><span>{rub(stay.stay)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Уборка</span><span>{rub(stay.cleaning)}</span></div>
              <div className="flex justify-between border-t border-border pt-3 text-[16px] font-medium"><span>Итого</span><span>{rub(stay.total)}</span></div>
            </div>
          </div>
        </aside>
      </div>
    </PageShell>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[13px] text-muted-foreground">{label}</Label>
      {children}
      {error && <p className="text-[12px] text-destructive">{error}</p>}
    </div>
  );
}
