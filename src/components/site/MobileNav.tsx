import { Link, useLocation } from "@tanstack/react-router";
import Icon from "@/components/ui/icon";
import { WHATSAPP_HREF } from "@/lib/apartments";
import { cn } from "@/lib/utils";

export default function MobileNav() {
  const { pathname } = useLocation();
  const base = import.meta.env.BASE_URL || "/";

  // Hide mobile bottom nav on apartment detail page (which has its own sticky booking action bar) and checkout
  if (pathname.startsWith("/apartment/") || pathname.startsWith("/checkout")) {
    return null;
  }

  const isHome = pathname === "/" || pathname === "" || pathname === base;
  const isBookings = pathname === "/bookings";

  const handleNavClick = (hashId: string) => (e: React.MouseEvent) => {
    if (isHome) {
      e.preventDefault();
      const el = document.getElementById(hashId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  return (
    <nav
      aria-label="Мобильная навигация"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/80 bg-card/95 px-2 py-1.5 backdrop-blur-lg lg:hidden shadow-[0_-8px_24px_rgba(0,0,0,0.08)]"
    >
      <div className="grid grid-cols-4 items-center">
        <a
          href={`${base}#catalog`}
          onClick={handleNavClick("catalog")}
          className={cn(
            "flex flex-col items-center gap-1 py-1 text-[11px] font-medium transition active:scale-95",
            isHome ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground",
          )}
        >
          <div className={cn("grid h-7 w-7 place-items-center rounded-full", isHome && "bg-primary/10 text-primary")}>
            <Icon name="Home" size={17} />
          </div>
          <span>Квартиры</span>
        </a>

        <a
          href={`${base}#map`}
          onClick={handleNavClick("map")}
          className="flex flex-col items-center gap-1 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition active:scale-95"
        >
          <div className="grid h-7 w-7 place-items-center rounded-full hover:bg-secondary">
            <Icon name="MapPin" size={17} className="text-gold" />
          </div>
          <span>На карте</span>
        </a>

        <Link
          to="/bookings"
          className={cn(
            "flex flex-col items-center gap-1 py-1 text-[11px] font-medium transition active:scale-95",
            isBookings ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground",
          )}
        >
          <div className={cn("grid h-7 w-7 place-items-center rounded-full", isBookings ? "bg-primary/10 text-primary" : "hover:bg-secondary")}>
            <Icon name="CalendarCheck" size={17} />
          </div>
          <span>Брони</span>
        </Link>

        <a
          href={WHATSAPP_HREF}
          target="_blank"
          rel="noreferrer"
          className="flex flex-col items-center gap-1 py-1 text-[11px] font-medium text-emerald-600 transition active:scale-95"
        >
          <div className="grid h-7 w-7 place-items-center rounded-full bg-emerald-500/15 text-emerald-600">
            <Icon name="MessageCircle" size={17} />
          </div>
          <span>WhatsApp</span>
        </a>
      </div>
    </nav>
  );
}
