"use client";

import { useCallback, useRef } from "react";

type FocalPointPickerProps = {
  src: string;
  value: string;
  onChange: (value: string) => void;
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function FocalPointPicker({ src, value, onChange }: FocalPointPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const [xStr, yStr] = value.split(" ");
  const x = clamp(parseFloat(xStr) || 50, 0, 100);
  const y = clamp(parseFloat(yStr) || 50, 0, 100);

  const updateFromPoint = useCallback(
    (clientX: number, clientY: number) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const nx = clamp(((clientX - rect.left) / rect.width) * 100, 0, 100);
      const ny = clamp(((clientY - rect.top) / rect.height) * 100, 0, 100);
      onChange(`${nx.toFixed(0)}% ${ny.toFixed(0)}%`);
    },
    [onChange],
  );

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    updateFromPoint(e.clientX, e.clientY);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (e.buttons !== 1) return;
    updateFromPoint(e.clientX, e.clientY);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-semibold text-[#656565] uppercase">
        Destaque da foto
      </p>
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        className="relative w-full aspect-video rounded-xl overflow-hidden bg-black/5 cursor-crosshair touch-none select-none"
      >
        <img
          src={src}
          alt=""
          draggable={false}
          className="w-full h-full object-cover pointer-events-none"
          style={{ objectPosition: value }}
        />
        <div
          className="absolute w-5 h-5 -ml-2.5 -mt-2.5 rounded-full border-2 border-white bg-black/60 shadow pointer-events-none"
          style={{ left: `${x}%`, top: `${y}%` }}
        />
      </div>
      <p className="text-[11px] text-[#999]">
        Toque ou arraste sobre a foto para marcar o ponto em destaque.
      </p>
    </div>
  );
}
