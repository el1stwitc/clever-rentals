import { useState } from "react";
import { Link } from "@tanstack/react-router";
import Icon from "@/components/ui/icon";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { LOGO_URL, PHONE, PHONE_HREF, TELEGRAM_HREF, WHATSAPP_HREF } from "@/lib/apartments";

const base = import.meta.env.BASE_URL || "/";
const NAV = [
  { href: `${base}#catalog`, label: "Квартиры" },
  { href: `${base}#map`, label: "На карте" },
  { href: `${base}#rules`, label: "Как заселиться" },
];

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 sm:gap-4 shrink-0 group" aria-label="Клевер — на главную">
      <span className="block h-9 w-[56px] sm:h-10 sm:w-[68px] overflow-hidden rounded-plate bg-primary shadow-sm shrink-0">
        <img src={LOGO_URL} alt="Клевер" className="h-full w-full object-cover" />
      </span>
      <span className="flex flex-col leading-none">
        <span className="tracking-logo text-[13px] sm:text-[15px] font-semibold sm:font-normal text-foreground">КЛЕВЕР</span>
        <span className="mt-1 text-[8px] sm:text-[10px] uppercase tracking-[0.16em] sm:tracking-[0.22em] text-gold font-medium">гостевые квартиры</span>
      </span>
    </Link>
  );
}

export default function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="flex items-center justify-between gap-2 sm:gap-4 w-full">
      <Logo />
      <nav className="hidden lg:flex items-center gap-8 text-[14px] text-muted-foreground">
        {NAV.map((n) => (
          <a key={n.href} href={n.href} className="transition-colors hover:text-foreground">
            {n.label}
          </a>
        ))}
        <a href={PHONE_HREF} className="transition-colors hover:text-foreground">
          {PHONE}
        </a>
      </nav>
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <a
          href={WHATSAPP_HREF}
          target="_blank"
          rel="noreferrer"
          aria-label="Написать в WhatsApp"
          className="grid h-9 w-9 sm:h-11 sm:w-11 place-items-center rounded-full border border-emerald-600/20 bg-emerald-500/10 text-emerald-600 transition hover:bg-emerald-500/20 active:scale-95"
        >
          <Icon name="MessageCircle" size={17} />
        </a>
        <a
          href={TELEGRAM_HREF}
          target="_blank"
          rel="noreferrer"
          aria-label="Написать в Telegram"
          className="hidden sm:grid h-11 w-11 place-items-center rounded-full border border-foreground/10 text-foreground/70 transition hover:border-gold hover:text-gold"
        >
          <Icon name="Send" size={17} />
        </a>
        <Link
          to="/bookings"
          className="hidden md:inline-flex h-11 items-center rounded-full bg-primary px-6 text-[14px] font-medium text-primary-foreground transition hover:bg-primary/90"
        >
          Мои бронирования
        </Link>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              aria-label="Меню"
              className="grid h-9 w-9 sm:h-11 sm:w-11 place-items-center rounded-full bg-primary text-primary-foreground lg:hidden active:scale-95"
            >
              <Icon name="Menu" size={18} />
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="bg-background w-[86vw] max-w-sm flex flex-col justify-between p-6">
            <div>
              <div className="flex items-center gap-3">
                <span className="block h-9 w-[56px] overflow-hidden rounded-plate bg-primary shadow-sm">
                  <img src={LOGO_URL} alt="Клевер" className="h-full w-full object-cover" />
                </span>
                <div className="flex flex-col leading-none">
                  <SheetTitle className="tracking-logo text-[14px] font-semibold text-foreground">КЛЕВЕР</SheetTitle>
                  <span className="mt-1 text-[9px] uppercase tracking-[0.2em] text-gold font-medium">гостевые квартиры</span>
                </div>
              </div>
              <div className="mt-8 flex flex-col gap-1.5">
                {NAV.map((n) => (
                  <a
                    key={n.href}
                    href={n.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between rounded-plate px-4 py-3 text-[16px] font-medium text-foreground hover:bg-secondary active:bg-secondary"
                  >
                    <span>{n.label}</span>
                    <Icon name="ChevronRight" size={16} className="text-muted-foreground" />
                  </a>
                ))}
                <Link
                  to="/bookings"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between rounded-plate px-4 py-3 text-[16px] font-medium text-foreground hover:bg-secondary active:bg-secondary"
                >
                  <span>Мои бронирования</span>
                  <Icon name="ChevronRight" size={16} className="text-muted-foreground" />
                </Link>
              </div>
            </div>

            <div className="space-y-3 border-t border-border pt-6">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Прямая связь 24/7</div>
              <a href={PHONE_HREF} className="flex items-center gap-3 text-[15px] font-medium text-foreground hover:text-gold">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-primary">
                  <Icon name="Phone" size={16} />
                </span>
                {PHONE}
              </a>
              <a
                href={WHATSAPP_HREF}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 text-[15px] font-medium text-emerald-600 hover:opacity-80"
              >
                <span className="grid h-9 w-9 place-items-center rounded-full bg-emerald-500/15 text-emerald-600">
                  <Icon name="MessageCircle" size={16} />
                </span>
                Написать в WhatsApp
              </a>
              <a
                href={TELEGRAM_HREF}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 text-[15px] font-medium text-[#229ED9] hover:opacity-80"
              >
                <span className="grid h-9 w-9 place-items-center rounded-full bg-[#229ED9]/15 text-[#229ED9]">
                  <Icon name="Send" size={16} />
                </span>
                Написать в Telegram
              </a>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
