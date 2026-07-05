"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";

type CarouselRowProps = {
  children: React.ReactNode;
  showArrows: boolean;
};

export function CarouselRow({ children, showArrows }: CarouselRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  function scroll(dir: 1 | -1) {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;

    if (dir === 1 && el.scrollLeft >= maxScroll - 4) {
      el.scrollTo({ left: 0, behavior: "smooth" });
    } else if (dir === -1 && el.scrollLeft <= 4) {
      el.scrollTo({ left: maxScroll, behavior: "smooth" });
    } else {
      el.scrollBy({ left: dir * 320, behavior: "smooth" });
    }
  }

  return (
    <div className="relative">
      {showArrows && (
        <>
          <button
            type="button"
            onClick={() => scroll(-1)}
            aria-label="Anterior"
            className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 w-9 h-9 rounded-full bg-white border-2 border-[#F1F1F1] items-center justify-center shadow-sm hover:bg-[#F1F1F1]"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => scroll(1)}
            aria-label="Próximo"
            className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 w-9 h-9 rounded-full bg-white border-2 border-[#F1F1F1] items-center justify-center shadow-sm hover:bg-[#F1F1F1]"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </>
      )}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-1"
      >
        {children}
      </div>
    </div>
  );
}
