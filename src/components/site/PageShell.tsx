import type { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";

export default function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-strip overflow-x-hidden">
      <div className="px-4 py-2.5 text-center text-[12px] text-foreground/80 sm:text-[13px]">
        Прямая бронь без комиссий агрегаторов · заселение 24/7
      </div>
      <main className="mx-2 rounded-stage bg-stage px-3 pb-12 pt-5 sm:mx-[18px] sm:px-8 sm:pt-6 lg:px-10 overflow-hidden">
        <Header />
        {children}
      </main>
      <Footer />
    </div>
  );
}
