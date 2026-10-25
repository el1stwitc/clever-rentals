import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import Header from "@/components/site/Header";
import SearchBar, { type SearchState } from "@/components/site/SearchBar";
import Catalog from "@/components/site/Catalog";
import CityMap from "@/components/site/CityMap";
import HowItWorks from "@/components/site/HowItWorks";
import Footer from "@/components/site/Footer";
import { DEFAULT_FROM, DEFAULT_TO, fromKey } from "@/lib/apartments";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const [search, setSearch] = useState<SearchState>({
    range: { from: fromKey(DEFAULT_FROM), to: fromKey(DEFAULT_TO) },
    adults: 2,
    children: 0,
  });
  const [onlyFree, setOnlyFree] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash;
      const q = window.location.search;
      const targetId = (hash === "#map" || q.includes("focus=map")) ? "map" : (hash === "#catalog" || q.includes("focus=catalog")) ? "catalog" : null;
      if (targetId) {
        setTimeout(() => {
          const el = document.getElementById(targetId);
          if (el) {
            const y = el.getBoundingClientRect().top + window.scrollY - 10;
            window.scrollTo({ top: y, behavior: "instant" });
          }
        }, 200);
      }
    }
  }, []);

  const submit = () => {
    setOnlyFree(true);
    document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-strip overflow-x-hidden">
      <div className="px-4 py-2.5 text-center text-[12px] text-foreground/80 sm:text-[13px]">
        Прямая бронь без комиссий агрегаторов · заселение 24/7
      </div>
      <main className="mx-2 rounded-stage bg-stage px-3 pb-12 pt-5 sm:mx-[18px] sm:px-8 sm:pt-6 lg:px-10 overflow-x-hidden">
        <Header />
        <div className="mt-8 flex flex-col gap-6 lg:mt-6 lg:flex-row lg:items-end lg:justify-between">
          <h1 className="animate-rise text-[34px] sm:text-[50px] lg:text-[60px] font-normal leading-[1.05] tracking-[-0.03em] text-foreground">
            Своя квартира.
            <br />
            <span className="font-serif text-[38px] sm:text-[56px] lg:text-[66px] italic tracking-[-0.01em] text-gold">Ключ — у вас.</span>
          </h1>
          <SearchBar
            value={search}
            onChange={setSearch}
            onSubmit={submit}
            className="animate-rise lg:mb-2 w-full lg:max-w-[580px] xl:max-w-[650px] [animation-delay:150ms]"
          />
        </div>
        <div className="mt-8">
          <Catalog search={search} onlyFree={onlyFree} />
        </div>
        <CityMap search={search} />
        <HowItWorks />
      </main>
      <Footer />
    </div>
  );
}
