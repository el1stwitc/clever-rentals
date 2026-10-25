import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export default function Gallery({ photos, title }: { photos: string[]; title: string }) {
  const [open, setOpen] = useState(false);
  const [i, setI] = useState(0);
  const show = (idx: number) => {
    setI(idx);
    setOpen(true);
  };
  const step = (d: number) => setI((p) => (p + d + photos.length) % photos.length);

  return (
    <>
      <div className="grid h-[300px] grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-card sm:h-[440px]">
        {photos.slice(0, 5).map((src, idx) => (
          <button
            key={idx}
            onClick={() => show(idx)}
            className={cn(
              "group relative overflow-hidden bg-muted",
              idx === 0 ? "col-span-4 row-span-2 sm:col-span-2" : "hidden sm:block",
            )}
          >
            <img src={src} alt={`${title} — фото ${idx + 1}`} loading={idx === 0 ? "eager" : "lazy"} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
          </button>
        ))}
        {photos.length < 5 &&
          Array.from({ length: 5 - photos.length }).map((_, k) => (
            <button key={`r${k}`} onClick={() => show(k)} className="relative hidden overflow-hidden bg-muted sm:block">
              <img src={photos[k]} alt="" loading="lazy" className="h-full w-full object-cover opacity-90" />
            </button>
          ))}
      </div>
      <button
        onClick={() => show(0)}
        className="glass-light -mt-14 ml-auto mr-4 relative flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium text-foreground"
      >
        <Icon name="Images" size={15} /> Все фото
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-5xl border-none bg-primary p-2 sm:p-3 text-primary-foreground sm:rounded-card">
          <DialogTitle className="sr-only">{title} — фотогалерея</DialogTitle>
          <div className="relative">
            <img src={photos[i]} alt={`${title} — фото ${i + 1}`} className="max-h-[60vh] sm:max-h-[75vh] w-full rounded-plate object-contain sm:object-cover" />
            <button onClick={() => step(-1)} aria-label="Назад" className="absolute left-2 sm:left-3 top-1/2 grid h-10 w-10 sm:h-11 sm:w-11 -translate-y-1/2 place-items-center rounded-full bg-card/90 text-foreground active:scale-95 transition">
              <Icon name="ChevronLeft" size={20} />
            </button>
            <button onClick={() => step(1)} aria-label="Вперёд" className="absolute right-2 sm:right-3 top-1/2 grid h-10 w-10 sm:h-11 sm:w-11 -translate-y-1/2 place-items-center rounded-full bg-card/90 text-foreground active:scale-95 transition">
              <Icon name="ChevronRight" size={20} />
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto pt-2 no-scrollbar touch-pan-x">
            {photos.map((p, idx) => (
              <button key={idx} onClick={() => setI(idx)} className={cn("h-14 w-20 sm:h-16 sm:w-24 shrink-0 overflow-hidden rounded-md border-2 transition active:scale-95", idx === i ? "border-gold" : "border-transparent opacity-60")}>
                <img src={p} alt="" loading="lazy" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
