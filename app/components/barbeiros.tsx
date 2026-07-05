"use client";

import Link from "next/link";
import { Clock } from "lucide-react";
import { useStore } from "@/app/context/store";
import { CarouselRow } from "./carousel-row";

function formatDuration(min: number) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h${m}min`;
}

const Barbeiros = () => {
  const { barbers, services } = useStore();

  return (
    <div className="py-6 space-y-6">
      <div>
        <div className="pb-3">
          <h1 className="font-semibold uppercase text-sm">Serviços</h1>
        </div>
        <CarouselRow showArrows={services.length >= 4}>
          {services.length === 0 && (
            <p className="text-sm text-[#999]">Nenhum serviço cadastrado.</p>
          )}
          {services.map((s) => (
            <div
              key={s.id}
              className="w-40 h-44 rounded-xl bg-[#FAFAFA] border-2 border-[#F1f1f1] shrink-0 snap-start flex flex-col justify-between p-3"
            >
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-black flex items-center justify-center shrink-0">
                {s.photo ? (
                  <img
                    src={s.photo}
                    alt={s.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white text-lg font-bold">✂</span>
                )}
              </div>
              <div>
                <p className="font-bold text-sm leading-tight">{s.name}</p>
                {s.description && (
                  <p className="text-xs text-[#656565] leading-snug mt-0.5 line-clamp-2">
                    {s.description}
                  </p>
                )}
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-[#656565] flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDuration(s.duration)}
                  </span>
                  <span className="text-sm font-bold">
                    R$ {s.price.toFixed(2).replace(".", ",")}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </CarouselRow>
      </div>
      <div>
        <div className="pb-3">
          <h1 className="font-semibold uppercase text-sm">Barbeiros</h1>
        </div>
        <CarouselRow showArrows={barbers.length >= 4}>
          {barbers.length === 0 && (
            <p className="text-sm text-[#999]">Nenhum barbeiro cadastrado.</p>
          )}
          {barbers.map((b) => (
            <Link
              key={b.id}
              href={`/barbeiro?id=${b.id}`}
              className="shrink-0 snap-start"
            >
              <div className="w-40 h-44 rounded-xl bg-[#afafaf] relative overflow-hidden flex flex-col justify-end">
                {b.photo ? (
                  <img
                    src={b.photo}
                    alt={b.name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-zinc-300">
                    <span className="text-3xl font-bold text-white">
                      {b.initials}
                    </span>
                  </div>
                )}
                <div className="relative bg-gradient-to-t from-black/70 to-transparent px-3 py-2">
                  <p className="text-white font-bold text-sm truncate">
                    {b.name}
                  </p>
                  {b.description && (
                    <p className="text-white/70 text-xs truncate">
                      {b.description}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </CarouselRow>
      </div>
    </div>
  );
};

export default Barbeiros;
