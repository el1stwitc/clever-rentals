import { Link } from "@tanstack/react-router";
import Icon from "@/components/ui/icon";
import { LOGO_URL, PHONE, PHONE_HREF, TELEGRAM_HREF, WHATSAPP_HREF } from "@/lib/apartments";

export default function Footer() {
  return (
    <footer className="px-4 pb-24 lg:pb-8 pt-12 sm:px-[58px]">
      <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <img src={LOGO_URL} alt="Клевер — гостевые квартиры" loading="lazy" className="h-20 w-[142px] rounded-plate object-cover" />
          <p className="mt-4 max-w-xs text-[14px] text-muted-foreground">
            Сеть гостевых квартир с прямой бронью. Чисто, тихо, бесконтактно — как дома, только лучше.
          </p>
        </div>
        <div className="space-y-2 text-[14px]">
          <div className="mb-3 text-[12px] uppercase tracking-[0.22em] text-gold">Гостям</div>
          <a href="/#catalog" className="block hover:text-gold">Все квартиры</a>
          <a href="/#map" className="block hover:text-gold">Квартиры на карте</a>
          <Link to="/bookings" className="block hover:text-gold">Мои бронирования</Link>
          <Link to="/admin" className="block text-muted-foreground hover:text-gold">Панель управления</Link>
        </div>
        <div className="space-y-3 text-[14px]">
          <div className="mb-3 text-[12px] uppercase tracking-[0.22em] text-gold">Связь 24/7</div>
          <a href={PHONE_HREF} className="flex items-center gap-2 hover:text-gold"><Icon name="Phone" size={15} /> {PHONE}</a>
          <a href={WHATSAPP_HREF} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-gold"><Icon name="MessageCircle" size={15} /> WhatsApp</a>
          <a href={TELEGRAM_HREF} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-gold"><Icon name="Send" size={15} /> Telegram</a>
        </div>
      </div>
      <div className="mt-10 flex flex-col gap-2 border-t border-border pt-6 text-[12px] text-muted-foreground sm:flex-row sm:justify-between">
        <span>© 2026 Клевер · Гостевые квартиры</span>
        <span>Прямая бронь без посредников</span>
      </div>
    </footer>
  );
}
