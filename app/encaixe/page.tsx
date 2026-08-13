"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AlertTriangle, ArrowLeftIcon, Clock } from "lucide-react";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useStore } from "@/app/context/store";
import {
  generateTimeSlots,
  isHorarioDisponivel,
  toMinutes,
  toHHMM,
  type HorarioConfig,
  type HorarioOcupado,
} from "@/lib/horarios";

const defaultHorarioConfig: HorarioConfig = {
  horaInicio: "08:00",
  horaFim: "19:00",
  intervalo: 30,
  pausaAtiva: false,
  pausaInicio: null,
  pausaFim: null,
  diasFuncionamento: [1, 2, 3, 4, 5, 6],
};

type ActiveTab = "servicos" | "confirmar";
type BookingService = { name: string; price: number; duration: number };

type DiaPersonalizado = {
  diaSemana: number;
  horaInicio: string;
  horaFim: string;
  pausaAtiva: boolean;
  pausaInicio: string | null;
  pausaFim: string | null;
};

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

const EncaixeContent = () => {
  const searchParams = useSearchParams();
  const { barbers, services, user, perfil } = useStore();

  const barberId = searchParams.get("id") ?? barbers[0]?.id;
  const barber = barbers.find((b) => b.id === barberId) ?? barbers[0];
  const barberServices = barber
    ? services.filter((s) => barber.serviceIds.includes(s.id))
    : services;

  const [activeTab, setActiveTab] = useState<ActiveTab>("servicos");
  const [selectedServices, setSelectedServices] = useState<Set<string>>(
    new Set(),
  );
  const [finalizando, setFinalizando] = useState(false);
  const [horarioConfig, setHorarioConfig] =
    useState<HorarioConfig>(defaultHorarioConfig);
  const [ocupados, setOcupados] = useState<HorarioOcupado[]>([]);
  const [diasPersonalizados, setDiasPersonalizados] = useState<
    Record<number, DiaPersonalizado>
  >({});
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    fetch("/api/configuracao-horario")
      .then((r) => r.json())
      .then((data) => setHorarioConfig((prev) => ({ ...prev, ...data })))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/configuracao-horario/dias")
      .then((r) => r.json())
      .then((data: DiaPersonalizado[]) => {
        const map: Record<number, DiaPersonalizado> = {};
        data.forEach((d) => {
          map[d.diaSemana] = d;
        });
        setDiasPersonalizados(map);
      })
      .catch(() => {});
  }, []);

  const today = useMemo(() => startOfDay(now), [now]);

  const effectiveHorarioConfig = useMemo(() => {
    const override = diasPersonalizados[today.getDay()];
    if (!override) return horarioConfig;
    return {
      ...horarioConfig,
      horaInicio: override.horaInicio,
      horaFim: override.horaFim,
      pausaAtiva: override.pausaAtiva,
      pausaInicio: override.pausaInicio,
      pausaFim: override.pausaFim,
    };
  }, [horarioConfig, diasPersonalizados, today]);

  useEffect(() => {
    if (!barber?.name) return;
    let cancelled = false;
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    fetch(
      `/api/reservas/disponibilidade?barberName=${encodeURIComponent(barber.name)}&data=${year}-${month}-${day}`,
    )
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setOcupados(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setOcupados([]);
      });
    return () => {
      cancelled = true;
    };
  }, [barber?.name, today]);

  const selectedDuration = useMemo(() => {
    return barberServices
      .filter((s) => selectedServices.has(s.id))
      .reduce((acc, s) => acc + s.duration, 0);
  }, [selectedServices, barberServices]);

  const total = useMemo(() => {
    return barberServices
      .filter((s) => selectedServices.has(s.id))
      .reduce((acc, s) => acc + s.price, 0);
  }, [selectedServices, barberServices]);

  const timeSlots = useMemo(
    () =>
      generateTimeSlots(effectiveHorarioConfig, today.getDay(), {
        duracao: selectedDuration,
        ocupados,
      }),
    [effectiveHorarioConfig, today, selectedDuration, ocupados],
  );

  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const disponivelAgora = useMemo(
    () =>
      isHorarioDisponivel(
        effectiveHorarioConfig,
        today.getDay(),
        nowMinutes,
        selectedDuration,
        ocupados,
      ),
    [effectiveHorarioConfig, today, nowMinutes, selectedDuration, ocupados],
  );

  const proximoHorario = useMemo(
    () => timeSlots.find((slot) => toMinutes(slot) >= nowMinutes) ?? null,
    [timeSlots, nowMinutes],
  );

  const assignedTime = disponivelAgora ? toHHMM(nowMinutes) : proximoHorario;
  const semHorarioHoje = !disponivelAgora && !proximoHorario;

  async function handleFinalizar() {
    if (!assignedTime) return;
    setFinalizando(true);
    const selectedList: BookingService[] = barberServices
      .filter((s) => selectedServices.has(s.id))
      .map((s) => ({ name: s.name, price: s.price, duration: s.duration }));

    const dateLabel = today.toLocaleDateString("pt-BR", {
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
        dateIso: today.toISOString(),
        dateLabel,
        time: assignedTime,
        total,
      }),
    );

    const res = await fetch("/api/checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        services: selectedList,
        barberName: barber?.name ?? "Barbeiro",
        date: dateLabel,
        time: assignedTime,
        clienteId: user?.id ?? null,
      }),
    });

    const { ref } = await res.json();
    setFinalizando(false);
    if (ref) window.location.href = `/checkout?ref=${ref}`;
  }

  const tabClassName = (tab: ActiveTab) =>
    [
      "rounded-full font-semibold border-2 py-5 px-4 text-md",
      activeTab === tab
        ? "bg-black text-white border-black"
        : "bg-[#FAFAFA] text-black/50 border-[#F1f1f1]",
    ].join(" ");

  const showBottomBar = activeTab === "confirmar" || selectedServices.size > 0;

  return (
    <div className="relative">
      <div className="relative bg-[#505050] w-full -z-10 h-[220px] overflow-hidden">
        {(perfil.capaFoto || perfil.capaFotoDesktop) && (
          <img
            src={perfil.capaFoto || perfil.capaFotoDesktop}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: perfil.capaFotoPosicao || "50% 50%" }}
          />
        )}
      </div>
      <Link href="/">
        <Button className="absolute top-4 left-4 rounded-full bg-white h-12 w-12 z-20 text-black">
          <ArrowLeftIcon />
        </Button>
      </Link>
      <div
        className={[
          "bg-white z-20 py-6 -mt-12 rounded-4xl",
          showBottomBar ? "pb-28" : "",
        ].join(" ")}
      >
        <div className="lg:max-w-3xl lg:mx-auto">
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
                <div>
                  <h1 className="text-xl font-bold">
                    {barber?.name ?? "Barbeiro"}
                  </h1>
                  <p className="text-sm text-[#656565] flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Encaixe sem hora marcada
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="py-6">
            {activeTab !== "confirmar" && (
              <div className="pb-6 border-b border-[#f1f1f1]">
                <div className="px-5 flex overflow-x-auto no-scrollbar gap-3">
                  <Button
                    type="button"
                    className={tabClassName("servicos")}
                  >
                    Serviços
                  </Button>
                  <Button
                    type="button"
                    className={tabClassName("confirmar")}
                    disabled={selectedServices.size === 0}
                    onClick={() => {
                      if (selectedServices.size > 0) setActiveTab("confirmar");
                    }}
                  >
                    Confirmar
                  </Button>
                </div>
              </div>
            )}

            <div className="px-5 pt-6">
              {activeTab === "servicos" ? (
                <div className="space-y-4 pt-3">
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
              ) : (
                <div className="flex flex-col gap-4">
                  <h1 className="text-lg font-bold">Confirmar Encaixe</h1>

                  <div className="flex flex-col gap-4">
                    <div className="rounded-xl border-2 border-[#F1f1f1] bg-[#FAFAFA] p-4 flex flex-col gap-1">
                      <p className="text-xs font-semibold text-[#656565] uppercase">
                        Barbearia
                      </p>
                      <p className="font-bold">{barber?.name ?? "Barbeiro"}</p>
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
                        Horário
                      </p>
                      {semHorarioHoje ? (
                        <p className="font-semibold text-red-600 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          Sem horários disponíveis hoje.
                        </p>
                      ) : disponivelAgora ? (
                        <p className="font-semibold">Agora • {assignedTime}</p>
                      ) : (
                        <p className="font-semibold text-amber-700 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          Ocupado agora — você será encaixado às {assignedTime}
                        </p>
                      )}
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

                  {semHorarioHoje && (
                    <p className="text-sm text-[#656565] text-center">
                      Não há mais vagas para hoje.{" "}
                      <Link href="/barbeiro" className="font-bold underline">
                        Agende para outro dia
                      </Link>
                      .
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={() => setActiveTab("servicos")}
                    className="text-sm text-[#656565] font-bold underline text-center"
                  >
                    Editar encaixe
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
              disabled={finalizando || (activeTab === "confirmar" && semHorarioHoje)}
              onClick={() => {
                if (activeTab === "servicos") {
                  setActiveTab("confirmar");
                } else {
                  handleFinalizar();
                }
              }}
            >
              {activeTab === "confirmar"
                ? finalizando
                  ? "Redirecionando..."
                  : "Pagar e confirmar"
                : "Continuar"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

const Encaixe = () => (
  <Suspense>
    <EncaixeContent />
  </Suspense>
);

export default Encaixe;
