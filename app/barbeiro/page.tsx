"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { useMemo, useState } from "react";

type ActiveTab = "servicos" | "horario" | "barbeiro";

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function Calendar() {
  const todayStart = useMemo(() => startOfDay(new Date()), []);
  const currentMonthStart = useMemo(
    () => new Date(todayStart.getFullYear(), todayStart.getMonth(), 1),
    [todayStart],
  );

  const [month, setMonth] = useState(() => currentMonthStart);
  const [selected, setSelected] = useState<Date>(() => todayStart);

  const { monthLabel, weekdayLabels, cells } = useMemo(() => {
    const weekdayLabelsLocal = [
      "Seg",
      "Ter",
      "Qua",
      "Qui",
      "Sex",
      "Sáb",
      "Dom",
    ];

    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const firstDay = new Date(year, monthIndex, 1);
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const startIndex = (firstDay.getDay() + 6) % 7;

    const cellDates: Array<Date | null> = [];
    for (let i = 0; i < startIndex; i++) cellDates.push(null);
    for (let day = 1; day <= daysInMonth; day++) {
      cellDates.push(new Date(year, monthIndex, day));
    }
    while (cellDates.length % 7 !== 0) cellDates.push(null);

    const label = firstDay.toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    });
    const formattedLabel = label[0]?.toUpperCase()
      ? label[0].toUpperCase() + label.slice(1)
      : label;

    return {
      monthLabel: formattedLabel,
      weekdayLabels: weekdayLabelsLocal,
      cells: cellDates,
    };
  }, [month]);

  const monthStart = useMemo(
    () => new Date(month.getFullYear(), month.getMonth(), 1),
    [month],
  );
  const prevDisabled = monthStart.getTime() <= currentMonthStart.getTime();

  return (
    <div className="rounded-xl border-2 border-[#F1f1f1] bg-[#FAFAFA] p-4">
      <div className="flex items-center justify-between pb-3">
        <Button
          className="h-10 w-10 rounded-full bg-white text-black border-2 border-[#F1f1f1] disabled:opacity-50"
          disabled={prevDisabled}
          onClick={() =>
            setMonth((current) => {
              const prev = addMonths(current, -1);
              const prevStart = new Date(
                prev.getFullYear(),
                prev.getMonth(),
                1,
              );
              return prevStart.getTime() < currentMonthStart.getTime()
                ? currentMonthStart
                : prevStart;
            })
          }
          type="button"
        >
          <span className="text-lg leading-none">{"<"}</span>
        </Button>
        <h2 className="font-bold">{monthLabel}</h2>
        <Button
          className="h-10 w-10 rounded-full bg-white text-black border-2 border-[#F1f1f1]"
          onClick={() => setMonth((current) => addMonths(current, 1))}
          type="button"
        >
          <span className="text-lg leading-none">{">"}</span>
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-2 pb-2">
        {weekdayLabels.map((label) => (
          <div
            key={label}
            className="text-center text-xs font-semibold text-[#656565]"
          >
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {cells.map((date, index) => {
          if (!date) return <div key={index} className="h-10" />;

          const selectedDay = selected && isSameDay(date, selected);
          const disabled = date.getTime() < todayStart.getTime();

          return (
            <button
              key={date.toISOString()}
              type="button"
              disabled={disabled}
              onClick={() => {
                if (!disabled) setSelected(date);
              }}
              className={[
                "h-10 w-10 rounded-full text-sm font-semibold",
                selectedDay
                  ? "bg-black text-white"
                  : disabled
                    ? "bg-white text-black/30 border-2 border-[#F1f1f1] opacity-60 cursor-not-allowed"
                    : "bg-white text-black border-2 border-[#F1f1f1] hover:bg-black/10",
              ].join(" ")}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

type TimeSlotListProps = {
  slots: string[];
  selectedSlot: string | null;
  onSelect: (slot: string) => void;
};

function TimeSlotList({ slots, selectedSlot, onSelect }: TimeSlotListProps) {
  return (
    <div className="flex overflow-x-auto no-scrollbar gap-4">
      {slots.map((slot) => (
        <Button
          key={slot}
          type="button"
          onClick={() => onSelect(slot)}
          className={[
            "rounded-full font-semibold border-2 py-5 px-4 text-md shrink-0",
            selectedSlot === slot
              ? "bg-black text-white border-black"
              : "bg-[#FAFAFA] text-black border-[#F1f1f1]",
          ].join(" ")}
        >
          {slot}
        </Button>
      ))}
    </div>
  );
}

const Barbeiro = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>("servicos");
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const timeSlots = useMemo(
    () => ["08:00", "08:30", "09:00", "09:30", "10:00"],
    [],
  );

  const tabClassName = (tab: ActiveTab) =>
    [
      "rounded-full font-semibold border-2 py-5 px-4 text-md",
      activeTab === tab
        ? "bg-black text-white border-black"
        : "bg-[#FAFAFA] text-black border-[#F1f1f1]",
    ].join(" ");

  return (
    <div className="relative">
      <div className="bg-[#505050]  w-full z-0 h-[360px]"></div>
      <Link href="/">
        <Button className="absolute top-4 left-4 rounded-full bg-white h-12 w-12 z-20 text-black">
          <ArrowLeftIcon />
        </Button>
      </Link>
      <div className="bg-white z-20   py-6 -mt-12 rounded-4xl">
        <div className=" pb-6 border-b border-[#E5E5E5]">
          <div className="px-5">
            <div className=" flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-black"></div>
              <h1 className="text-xl font-bold">Barbeiro</h1>
            </div>
            <div className="pt-3">
              <div className="pt-2 text-[#656565] flex items-center gap-2">
                <img src="/Local.svg" alt="" className="w-5 h-5 text-black" />
                <h1>Avenida São Sebastião, 357, São Paulo</h1>
              </div>
              <div className="pt-2 text-[#656565] flex items-center gap-2">
                <img src="/estrela.svg" alt="" className="w-5 h-5 text-black" />
                <h1>5,0 (889 avaliações)</h1>
              </div>
            </div>
          </div>
        </div>
        <div className="py-6">
          <div className="pb-6 border-b border-[#E5E5E5]">
            <div className="px-5 flex gap-3 ">
              <Button
                type="button"
                className={tabClassName("servicos")}
                onClick={() => {
                  setActiveTab("servicos");
                  setSelectedSlot(null);
                }}
              >
                Serviços
              </Button>
              <Button
                type="button"
                className={tabClassName("horario")}
                onClick={() => {
                  setActiveTab("horario");
                  setSelectedSlot(null);
                }}
              >
                Horario
              </Button>
              <Button
                type="button"
                className={tabClassName("barbeiro")}
                onClick={() => {
                  setActiveTab("barbeiro");
                  setSelectedSlot(null);
                }}
              >
                Barbeiro
              </Button>
            </div>
          </div>
          <div className="px-5 pt-6">
            {activeTab === "servicos" ? (
              <div className=" space-y-4 pt-3">
                <div className="h-36 w-full flex gap-6 items-center bg-[#FAFAFA] border-2  px-3 border-[#F1f1f1] rounded-md ">
                  <div className="size-28 shrink-0 bg-black/15 rounded-md"></div>
                  <div className="flex-1 min-w-0">
                    <div>
                      <h1 className="font-bold">Corte de Cabelo</h1>
                    </div>
                    <div className="pb-2 text-[#656565] text-sm leading-snug">
                      <h1>Estilo personalizado com as últimas tendências.</h1>
                    </div>
                    <div className="flex pt-1 items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <h1 className="font-bold">R$ 50,00</h1>
                      </div>
                      <Button className="rounded-full font-semibold py-5 px-4 shrink-0">
                        Selecionar
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="h-36 w-full flex gap-6 items-center bg-[#FAFAFA] border-2 px-3 border-[#F1f1f1] rounded-md">
                  <div className="size-28 shrink-0 bg-black/15 rounded-md"></div>
                  <div className="flex-1 min-w-0">
                    <div>
                      <h1 className="font-bold">Corte de Cabelo</h1>
                    </div>
                    <div className="pb-2 text-[#656565] text-sm leading-snug">
                      <h1>Estilo personalizado com as últimas tendências.</h1>
                    </div>
                    <div className="flex pt-1 items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <h1 className="font-bold">R$ 50,00</h1>
                      </div>
                      <Button className="rounded-full font-semibold px-4 py-5 shrink-0">
                        Selecionar
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="h-36 w-full flex gap-6 items-center bg-[#FAFAFA] border-2 px-3 border-[#F1f1f1] rounded-md ">
                  <div className="size-28 shrink-0 bg-black/15 rounded-md"></div>
                  <div className="flex-1 min-w-0">
                    <div>
                      <h1 className="font-bold">Corte de Cabelo</h1>
                    </div>
                    <div className="pb-2 text-[#656565] text-sm leading-snug">
                      <h1>Estilo personalizado com as últimas tendências.</h1>
                    </div>
                    <div className="flex pt-1 items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <h1 className="font-bold">R$ 50,00</h1>
                      </div>
                      <Button className="rounded-full font-semibold px-4 py-5 shrink-0">
                        Selecionar
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="h-36 w-full flex  gap-6 items-center bg-[#FAFAFA] border-2 px-3  border-[#F1f1f1] rounded-md ">
                  <div className="size-28 shrink-0 bg-black/15 rounded-md"></div>
                  <div className="flex-1 min-w-0">
                    <div>
                      <h1 className="font-bold">Corte de Cabelo</h1>
                    </div>
                    <div className="pb-2 text-[#656565] text-sm leading-snug">
                      <h1>Estilo personalizado com as últimas tendências.</h1>
                    </div>
                    <div className="flex pt-1 items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <h1 className="font-bold">R$ 50,00</h1>
                      </div>
                      <Button className="rounded-full font-semibold px-4 py-5 shrink-0">
                        Selecionar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : activeTab === "horario" ? (
              <div className="flex flex-col gap-4 ">
                <div>
                  <h1 className="text-md pt-3 font-semibold uppercase">
                    Horários
                  </h1>
                </div>
                <TimeSlotList
                  slots={timeSlots}
                  selectedSlot={selectedSlot}
                  onSelect={setSelectedSlot}
                />
                <Calendar />
              </div>
            ) : (
              <div className="rounded-xl border-2 border-[#F1f1f1] bg-[#FAFAFA] p-4 text-[#656565]">
                <h1 className="font-semibold text-black pb-1">
                  Sobre o barbeiro
                </h1>
                <p>Informações do barbeiro vão aqui.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Barbeiro;
