"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useStore } from "@/app/context/store";
import { generateTimeSlots, type HorarioConfig } from "@/lib/horarios";

const defaultHorarioConfig: HorarioConfig = {
  horaInicio: "08:00",
  horaFim: "19:00",
  intervalo: 30,
  pausaAtiva: false,
  pausaInicio: null,
  pausaFim: null,
  diasFuncionamento: [1, 2, 3, 4, 5, 6],
};

type ActiveTab = "servicos" | "horario" | "barbeiro" | "reserva";

type BookingService = { name: string; price: number };

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

type CalendarProps = {
  selected: Date;
  onSelect: (date: Date) => void;
};

function Calendar({ selected, onSelect }: CalendarProps) {
  const todayStart = useMemo(() => startOfDay(new Date()), []);
  const currentMonthStart = useMemo(
    () => new Date(todayStart.getFullYear(), todayStart.getMonth(), 1),
    [todayStart],
  );

  const [month, setMonth] = useState(() => currentMonthStart);

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
                if (!disabled) onSelect(date);
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
    <div className="flex overflow-x-auto no-scrollbar gap-4 lg:flex-wrap lg:overflow-visible">
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

const BarbeiroContent = () => {
  const searchParams = useSearchParams();
  const { barbers, services, user } = useStore();

  const barberId = searchParams.get("id") ?? barbers[0]?.id;
  const barber = barbers.find((b) => b.id === barberId) ?? barbers[0];
  const barberServices = barber
    ? services.filter((s) => barber.serviceIds.includes(s.id))
    : services;

  const [activeTab, setActiveTab] = useState<ActiveTab>("servicos");
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(() =>
    startOfDay(new Date()),
  );
  const [selectedServices, setSelectedServices] = useState<Set<string>>(
    new Set(),
  );
  const [finalizando, setFinalizando] = useState(false);
  const [horarioConfig, setHorarioConfig] =
    useState<HorarioConfig>(defaultHorarioConfig);

  useEffect(() => {
    fetch("/api/configuracao-horario")
      .then((r) => r.json())
      .then((data) => setHorarioConfig((prev) => ({ ...prev, ...data })))
      .catch(() => {});
  }, []);

  const timeSlots = useMemo(
    () => generateTimeSlots(horarioConfig, selectedDate.getDay()),
    [horarioConfig, selectedDate],
  );

  const total = useMemo(() => {
    return barberServices
      .filter((s) => selectedServices.has(s.id))
      .reduce((acc, s) => acc + s.price, 0);
  }, [selectedServices, barberServices]);

  async function handleFinalizar() {
    setFinalizando(true);
    const selectedList: BookingService[] = barberServices
      .filter((s) => selectedServices.has(s.id))
      .map((s) => ({ name: s.name, price: s.price }));

    const date = selectedDate.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    localStorage.setItem(
      "pendingBooking",
      JSON.stringify({
        barberName: barber?.name ?? "Barbeiro",
        services: selectedList,
        dateIso: selectedDate.toISOString(),
        dateLabel: date,
        time: selectedSlot ?? "",
        total,
      }),
    );

    const res = await fetch("/api/checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        services: selectedList,
        barberName: barber?.name ?? "Barbeiro",
        date,
        time: selectedSlot ?? "",
        successUrl: user
          ? `${window.location.origin}/agendamentos?booked=1`
          : `${window.location.origin}/cadastro?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: window.location.href,
      }),
    });

    const { url } = await res.json();
    setFinalizando(false);
    if (url) window.location.href = url;
  }

  const tabClassName = (tab: ActiveTab) =>
    [
      "rounded-full font-semibold border-2 py-5 px-4 text-md",
      activeTab === tab
        ? "bg-black text-white border-black"
        : "bg-[#FAFAFA] text-black/50 border-[#F1f1f1]",
    ].join(" ");

  const showBottomBar =
    activeTab === "reserva" ||
    selectedServices.size > 0 ||
    selectedSlot !== null;

  return (
    <div className="relative">
      <div className="bg-[#505050] w-full z-0 h-[340px] lg:h-[430px]"></div>
      <Link href="/">
        <Button className="absolute top-4 left-4 rounded-full bg-white h-12 w-12 z-20 text-black">
          <ArrowLeftIcon />
        </Button>
      </Link>
      <div
        className={[
          "bg-white z-20 py-6 -mt-12 rounded-4xl lg:rounded-none",
          showBottomBar ? "pb-28" : "",
        ].join(" ")}
      >
        <div className="lg:max-w-7xl lg:mx-auto">
          <div className="pb-6 border-b border-[#f1f1f1]">
            <div className="px-5">
              <div className="flex items-center gap-3">
                {barber?.photo ? (
                  <img
                    src={barber.photo}
                    alt={barber?.name}
                    className="w-11 h-11 rounded-full object-cover"
                    style={{ objectPosition: barber.photoPosition }}
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-black flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {barber?.initials}
                    </span>
                  </div>
                )}
                <h1 className="text-xl font-bold">
                  {barber?.name ?? "Barbeiro"}
                </h1>
              </div>
              <div className="pt-3 lg:flex lg:flex-row lg:justify-between">
                <div className="pt-2 text-[#656565] flex items-center gap-2">
                  <img src="/Local.svg" alt="" className="w-5 h-5 text-black" />
                  <h1>Avenida São Sebastião, 357, São Paulo</h1>
                </div>
                <div className="pt-2 text-[#656565] flex items-center gap-2">
                  <img
                    src="/estrela.svg"
                    alt=""
                    className="w-5 h-5 text-black"
                  />
                  <h1>
                    <span className="text-black ">5,0</span> (889 avaliações)
                  </h1>
                </div>
              </div>
            </div>
          </div>

          <div className="py-6">
            {activeTab !== "reserva" && (
              <div className="pb-6 border-b border-[#f1f1f1]">
                <div className="px-5 flex overflow-x-auto no-scrollbar gap-3">
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
                    disabled={selectedServices.size === 0}
                    onClick={() => {
                      if (selectedServices.size > 0) {
                        setActiveTab("horario");
                        setSelectedSlot(null);
                      }
                    }}
                  >
                    Horario
                  </Button>
                  <Button
                    type="button"
                    className={tabClassName("barbeiro")}
                    disabled={
                      selectedServices.size === 0 || selectedSlot === null
                    }
                    onClick={() => {
                      if (selectedServices.size > 0 && selectedSlot !== null) {
                        setActiveTab("barbeiro");
                      }
                    }}
                  >
                    Barbeiro
                  </Button>
                </div>
              </div>
            )}

            <div className="px-5 pt-6">
              {activeTab === "servicos" ? (
                <div className="space-y-4 pt-3 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-4">
                  {barberServices.map((service) => {
                    const isSelected = selectedServices.has(service.id);
                    return (
                      <div
                        key={service.id}
                        className={[
                          "h-36 w-full flex gap-6 items-center border-2 px-3 rounded-md",
                          isSelected
                            ? "bg-black/5 border-black/15"
                            : "bg-[#FAFAFA] border-[#F1f1f1]",
                        ].join(" ")}
                      >
                        <div className="size-28 shrink-0 bg-black/15 rounded-md overflow-hidden flex items-center justify-center">
                          {service.photo ? (
                            <img
                              src={service.photo}
                              alt={service.name}
                              className="w-full h-full object-cover"
                              style={{ objectPosition: service.photoPosition }}
                            />
                          ) : (
                            <span className="text-3xl">✂</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div>
                            <h1 className="font-bold">{service.name}</h1>
                          </div>
                          <div className="pb-2 text-[#656565] text-sm leading-snug">
                            <h1>{service.description}</h1>
                          </div>
                          <div className="flex pt-1 items-center gap-3">
                            <div className="flex-1 min-w-0">
                              <h1 className="font-bold">
                                R$ {service.price.toFixed(2).replace(".", ",")}
                              </h1>
                            </div>
                            <Button
                              type="button"
                              onClick={() =>
                                setSelectedServices((prev) => {
                                  const next = new Set(prev);
                                  if (next.has(service.id))
                                    next.delete(service.id);
                                  else next.add(service.id);
                                  return next;
                                })
                              }
                              className={[
                                "rounded-full font-bold py-5 px-4 shrink-0",
                                isSelected
                                  ? "bg-black text-white border border-black"
                                  : "text-black bg-white border border-black/15",
                              ].join(" ")}
                            >
                              {isSelected ? "Selecionado" : "Selecionar"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : activeTab === "horario" ? (
                <div className="flex flex-col gap-4 lg:flex-row lg:gap-8">
                  <div className="lg:flex-1 lg:min-w-0">
                    <div>
                      <h1 className="text-md pt-3 font-semibold uppercase lg:pt-0">
                        Horários
                      </h1>
                    </div>
                    {timeSlots.length === 0 ? (
                      <p className="text-sm text-[#656565] mt-4">
                        Fechado neste dia. Escolha outra data.
                      </p>
                    ) : (
                      <div className="mt-4">
                        <TimeSlotList
                          slots={timeSlots}
                          selectedSlot={selectedSlot}
                          onSelect={setSelectedSlot}
                        />
                      </div>
                    )}
                  </div>
                  <div className="lg:w-80 lg:shrink-0">
                    <Calendar
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                    />
                  </div>
                </div>
              ) : activeTab === "barbeiro" ? (
                <div className="rounded-xl border-2 border-[#F1f1f1] bg-[#FAFAFA] p-4 text-[#656565]">
                  <h1 className="font-semibold text-black pb-1">
                    Sobre {barber?.name ?? "o barbeiro"}
                  </h1>
                  <p>{barber?.description || "Barbeiro profissional."}</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <h1 className="text-lg font-bold">Confirmar Reserva</h1>

                  <div className="flex flex-col gap-4 lg:grid lg:grid-cols-2">
                    <div className="rounded-xl border-2 border-[#F1f1f1] bg-[#FAFAFA] p-4 flex flex-col gap-1">
                      <p className="text-xs font-semibold text-[#656565] uppercase">
                        Barbearia
                      </p>
                      <p className="font-bold">{barber?.name ?? "Barbeiro"}</p>
                      <p className="text-sm text-[#656565]">
                        Avenida São Sebastião, 357, São Paulo
                      </p>
                    </div>

                    <div className="rounded-xl border-2 border-[#F1f1f1] bg-[#FAFAFA] p-4 flex flex-col gap-3">
                      <p className="text-xs font-semibold text-[#656565] uppercase">
                        Serviços
                      </p>
                      {selectedServices.size === 0 ? (
                        <p className="text-sm text-[#656565]">
                          Nenhum serviço selecionado.
                        </p>
                      ) : (
                        barberServices
                          .filter((s) => selectedServices.has(s.id))
                          .map((s) => (
                            <div
                              key={s.id}
                              className="flex items-center justify-between"
                            >
                              <p className="font-semibold">{s.name}</p>
                              <p className="font-semibold">
                                R$ {s.price.toFixed(2).replace(".", ",")}
                              </p>
                            </div>
                          ))
                      )}
                    </div>

                    <div className="rounded-xl border-2 border-[#F1f1f1] bg-[#FAFAFA] p-4 flex flex-col gap-1">
                      <p className="text-xs font-semibold text-[#656565] uppercase">
                        Data e Horário
                      </p>
                      <p className="font-semibold">
                        {selectedDate.toLocaleDateString("pt-BR", {
                          weekday: "long",
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })}
                        {selectedSlot ? ` • ${selectedSlot}` : ""}
                      </p>
                    </div>

                    <div className="rounded-xl border-2 border-[#F1f1f1] bg-[#FAFAFA] p-4 flex items-center justify-between">
                      <p className="font-bold text-base">Total</p>
                      <p className="font-bold text-base">
                        R${" "}
                        {total.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab("servicos")}
                    className="text-sm text-[#656565] font-bold underline text-center"
                  >
                    Editar reserva
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showBottomBar && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#f1f1f1] px-5 py-4">
          <div className="lg:max-w-3xl lg:mx-auto">
            <Button
              className="w-full rounded-full bg-black text-white font-semibold py-6 text-base disabled:opacity-50"
              disabled={
                (activeTab === "horario" && selectedSlot === null) ||
                finalizando
              }
              onClick={() => {
                if (activeTab === "servicos") {
                  setActiveTab("horario");
                } else if (activeTab === "horario" && selectedSlot !== null) {
                  setActiveTab("barbeiro");
                } else if (activeTab === "barbeiro") {
                  setActiveTab("reserva");
                } else if (activeTab === "reserva") {
                  handleFinalizar();
                }
              }}
            >
              {activeTab === "reserva"
                ? finalizando
                  ? "Redirecionando..."
                  : "Finalizar Reserva"
                : "Confirmar"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

const Barbeiro = () => (
  <Suspense>
    <BarbeiroContent />
  </Suspense>
);

export default Barbeiro;
