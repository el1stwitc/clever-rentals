import Icon from "@/components/ui/icon";
import { HOUSE_RULES } from "@/lib/apartments";

const STEPS = [
  { icon: "CalendarCheck", title: "Выберите даты", text: "Календарь показывает только реально свободные ночи — он синхронизирован с Avito и Суточно.ру." },
  { icon: "CreditCard", title: "Забронируйте напрямую", text: "Онлайн-предоплата или оплата при заселении. Без комиссий агрегаторов — цена ниже на 10–15%." },
  { icon: "MessageCircle", title: "Получите код", text: "Подтверждение и инструкция по заезду приходят в WhatsApp или Telegram." },
  { icon: "KeyRound", title: "Заселяйтесь сами", text: "Бесконтактно, в любое время после 14:00 — электронный замок откроется по вашему коду." },
];

export default function HowItWorks() {
  return (
    <section id="rules" className="scroll-mt-6 pt-20">
      <div className="overflow-hidden rounded-card bg-primary p-6 text-primary-foreground sm:p-10">
        <p className="text-[12px] uppercase tracking-[0.28em] text-gold">Как заселиться</p>
        <h2 className="mt-3 max-w-2xl text-[32px] font-normal leading-tight tracking-[-0.02em] sm:text-[40px]">
          Четыре шага до <span className="font-serif italic text-gold">своих ключей</span>
        </h2>
        <div className="mt-10 grid gap-px overflow-hidden rounded-plate bg-primary-foreground/10 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <div key={s.title} className="bg-primary p-6">
              <div className="flex items-center justify-between">
                <Icon name={s.icon} size={24} className="text-gold" />
                <span className="font-serif text-[28px] italic text-primary-foreground/30">0{i + 1}</span>
              </div>
              <div className="mt-6 text-[17px] font-medium">{s.title}</div>
              <p className="mt-2 text-[14px] leading-relaxed text-primary-foreground/70">{s.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[280px_1fr]">
          <div>
            <h3 className="text-[22px] font-normal">Правила дома</h3>
            <p className="mt-2 text-[14px] text-primary-foreground/70">Одинаковые во всех квартирах сети — чтобы каждому гостю было спокойно и уютно.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {HOUSE_RULES.map((r) => (
              <div key={r.title} className="flex gap-3 rounded-plate border border-primary-foreground/10 p-4">
                <Icon name={r.icon} size={20} className="mt-0.5 shrink-0 text-gold" />
                <div>
                  <div className="text-[15px] font-medium">{r.title}</div>
                  <div className="text-[13px] text-primary-foreground/65">{r.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
