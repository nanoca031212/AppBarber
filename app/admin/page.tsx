"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useStore } from "@/app/context/store";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Settings,
  Search,
  ChevronRight,
  ChevronLeft,
  Star,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Phone,
  Scissors,
  BarChart2,
  Eye,
  MousePointerClick,
  Zap,
  ToggleLeft,
  ToggleRight,
  Copy,
  Check,
  Trash2,
  Plus,
  Pencil,
  X,
  UserPlus,
  Camera,
} from "lucide-react";

import { Input } from "@/components/ui/input";

type AdminTab = "dashboard" | "agenda" | "clientes" | "gestor" | "config";

import type { Service, Barber } from "@/app/context/store";

type AppointmentStatus = "confirmado" | "pendente" | "concluido" | "cancelado";

type Appointment = {
  id: number;
  client: string;
  initials: string;
  service: string;
  time: string;
  status: AppointmentStatus;
  price: string;
};

type Client = {
  id: number;
  name: string;
  initials: string;
  phone: string;
  lastVisit: string;
  totalVisits: number;
  totalSpent: string;
  isNew: boolean;
};

const appointments: Appointment[] = [
  {
    id: 1,
    client: "Lucas Souza",
    initials: "LS",
    service: "Corte + Barba",
    time: "08:00",
    status: "concluido",
    price: "R$ 80,00",
  },
  {
    id: 2,
    client: "Rafael Mendes",
    initials: "RM",
    service: "Corte de Cabelo",
    time: "09:00",
    status: "concluido",
    price: "R$ 50,00",
  },
  {
    id: 3,
    client: "João Pedro",
    initials: "JP",
    service: "Barba",
    time: "10:00",
    status: "confirmado",
    price: "R$ 35,00",
  },
  {
    id: 4,
    client: "Carlos Lima",
    initials: "CL",
    service: "Corte de Cabelo",
    time: "11:00",
    status: "confirmado",
    price: "R$ 50,00",
  },
  {
    id: 5,
    client: "Felipe Costa",
    initials: "FC",
    service: "Pezinho",
    time: "13:00",
    status: "pendente",
    price: "R$ 25,00",
  },
  {
    id: 6,
    client: "André Rocha",
    initials: "AR",
    service: "Corte + Barba",
    time: "14:00",
    status: "pendente",
    price: "R$ 80,00",
  },
  {
    id: 7,
    client: "Mateus Alves",
    initials: "MA",
    service: "Corte de Cabelo",
    time: "15:00",
    status: "cancelado",
    price: "R$ 50,00",
  },
  {
    id: 8,
    client: "Bruno Neves",
    initials: "BN",
    service: "Barba",
    time: "16:00",
    status: "confirmado",
    price: "R$ 35,00",
  },
];

const clients: Client[] = [
  {
    id: 1,
    name: "Lucas Souza",
    initials: "LS",
    phone: "(11) 99999-1111",
    lastVisit: "24/06/2026",
    totalVisits: 18,
    totalSpent: "R$ 1.440,00",
    isNew: false,
  },
  {
    id: 2,
    name: "Rafael Mendes",
    initials: "RM",
    phone: "(11) 99999-2222",
    lastVisit: "24/06/2026",
    totalVisits: 12,
    totalSpent: "R$ 600,00",
    isNew: false,
  },
  {
    id: 3,
    name: "João Pedro",
    initials: "JP",
    phone: "(11) 99999-3333",
    lastVisit: "20/06/2026",
    totalVisits: 7,
    totalSpent: "R$ 420,00",
    isNew: false,
  },
  {
    id: 4,
    name: "Carlos Lima",
    initials: "CL",
    phone: "(11) 99999-4444",
    lastVisit: "18/06/2026",
    totalVisits: 24,
    totalSpent: "R$ 1.920,00",
    isNew: false,
  },
  {
    id: 5,
    name: "Felipe Costa",
    initials: "FC",
    phone: "(11) 99999-5555",
    lastVisit: "15/06/2026",
    totalVisits: 3,
    totalSpent: "R$ 150,00",
    isNew: true,
  },
  {
    id: 6,
    name: "André Rocha",
    initials: "AR",
    phone: "(11) 99999-6666",
    lastVisit: "10/06/2026",
    totalVisits: 9,
    totalSpent: "R$ 720,00",
    isNew: false,
  },
  {
    id: 7,
    name: "Mateus Alves",
    initials: "MA",
    phone: "(11) 99999-7777",
    lastVisit: "05/06/2026",
    totalVisits: 2,
    totalSpent: "R$ 100,00",
    isNew: true,
  },
  {
    id: 8,
    name: "Bruno Neves",
    initials: "BN",
    phone: "(11) 99999-8888",
    lastVisit: "01/06/2026",
    totalVisits: 31,
    totalSpent: "R$ 2.480,00",
    isNew: false,
  },
];

const weekDays = [
  { label: "Ter", day: "24", isToday: true },
  { label: "Qua", day: "25", isToday: false },
  { label: "Qui", day: "26", isToday: false },
  { label: "Sex", day: "27", isToday: false },
  { label: "Sáb", day: "28", isToday: false },
  { label: "Dom", day: "29", isToday: false },
  { label: "Seg", day: "30", isToday: false },
];

const statusConfig: Record<
  AppointmentStatus,
  { label: string; color: string; icon: React.ReactNode }
> = {
  confirmado: {
    label: "Confirmado",
    color: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  pendente: {
    label: "Pendente",
    color: "bg-amber-50 text-amber-700 border border-amber-200",
    icon: <AlertCircle className="w-3 h-3" />,
  },
  concluido: {
    label: "Concluído",
    color: "bg-[#FAFAFA] text-[#656565] border border-[#F1f1f1]",
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  cancelado: {
    label: "Cancelado",
    color: "bg-red-50 text-red-600 border border-red-200",
    icon: <XCircle className="w-3 h-3" />,
  },
};

function StatusPill({ status }: { status: AppointmentStatus }) {
  const cfg = statusConfig[status];
  return (
    <span
      className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${cfg.color}`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

function Avatar({
  initials,
  src,
  size = "md",
}: {
  initials: string;
  src?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-14 h-14 text-base",
  };
  if (src) {
    return (
      <div className={`${sizes[size]} rounded-full overflow-hidden shrink-0`}>
        <img src={src} alt={initials} className="w-full h-full object-cover" />
      </div>
    );
  }
  return (
    <div
      className={`${sizes[size]} rounded-full bg-black text-white flex items-center justify-center font-bold shrink-0`}
    >
      {initials}
    </div>
  );
}

function Dashboard() {
  const todayConfirmed = appointments.filter(
    (a) => a.status === "confirmado",
  ).length;
  const todayTotal = appointments.length;

  return (
    <div className="flex flex-col gap-5 lg:max-w-4xl xl:max-w-7xl lg:mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[#656565] text-sm">Terça-feira, 24 de junho</p>
          <h1 className="text-2xl font-bold">Olá, Yvison</h1>
        </div>
        <Avatar initials="YV" size="lg" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border-2 border-[#F1f1f1] bg-[#FAFAFA] p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#656565] uppercase">
              Hoje
            </span>
            <CalendarDays className="w-4 h-4 text-[#656565]" />
          </div>
          <p className="text-2xl font-bold">{todayTotal}</p>
          <p className="text-xs text-[#656565]">{todayConfirmed} confirmados</p>
        </div>
        <div className="rounded-xl border-2 border-[#F1f1f1] bg-[#FAFAFA] p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#656565] uppercase">
              Mês
            </span>
            <TrendingUp className="w-4 h-4 text-[#656565]" />
          </div>
          <p className="text-2xl font-bold">R$ 3.200</p>
          <p className="text-xs text-emerald-600 font-semibold">
            +12% vs mês anterior
          </p>
        </div>
        <div className="rounded-xl border-2 border-[#F1f1f1] bg-[#FAFAFA] p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#656565] uppercase">
              Clientes
            </span>
            <Users className="w-4 h-4 text-[#656565]" />
          </div>
          <p className="text-2xl font-bold">142</p>
          <p className="text-xs text-[#656565]">8 novos este mês</p>
        </div>
        <div className="rounded-xl border-2 border-[#F1f1f1] bg-[#FAFAFA] p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#656565] uppercase">
              Avaliação
            </span>
            <Star className="w-4 h-4 text-[#656565]" />
          </div>
          <p className="text-2xl font-bold">5,0</p>
          <p className="text-xs text-[#656565]">889 avaliações</p>
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-2 lg:gap-6">
        <div>
          <div className="flex items-center justify-between pb-3">
            <h2 className="font-bold">Próximos agendamentos</h2>
          </div>
          <div className="flex flex-col gap-3">
            {appointments
              .filter(
                (a) => a.status === "confirmado" || a.status === "pendente",
              )
              .slice(0, 4)
              .map((apt) => (
                <div
                  key={apt.id}
                  className="flex items-center gap-3 rounded-xl border-2 border-[#F1f1f1] bg-[#FAFAFA] p-3"
                >
                  <Avatar initials={apt.initials} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{apt.client}</p>
                    <p className="text-xs text-[#656565]">{apt.service}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <div className="flex items-center gap-1 text-xs font-semibold text-[#656565]">
                      <Clock className="w-3 h-3" />
                      {apt.time}
                    </div>
                    <StatusPill status={apt.status} />
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="mt-5 lg:mt-0">
          <h2 className="font-bold pb-3">Serviços mais populares</h2>
          <div className="flex flex-col gap-2">
            {[
              { name: "Corte de Cabelo", count: 48, percent: 80 },
              { name: "Corte + Barba", count: 31, percent: 52 },
              { name: "Barba", count: 20, percent: 33 },
              { name: "Pezinho", count: 9, percent: 15 },
            ].map((s) => (
              <div key={s.name} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#FAFAFA] border-2 border-[#F1f1f1] flex items-center justify-center shrink-0">
                  <Scissors className="w-3.5 h-3.5 text-[#656565]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between mb-1">
                    <p className="text-sm font-semibold">{s.name}</p>
                    <p className="text-xs text-[#656565]">{s.count}x</p>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#F1f1f1]">
                    <div
                      className="h-1.5 rounded-full bg-black"
                      style={{ width: `${s.percent}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

type ReservaStatus = "PENDENTE" | "CONFIRMADO" | "CANCELADO" | "CONCLUIDO";

type ReservaApi = {
  id: string;
  data: string;
  horario: string;
  total: number;
  status: ReservaStatus;
  cliente: { nome: string };
  barbeiro: { nome: string };
  servicos: Array<{ servico: { nome: string; preco: number } }>;
};

function toAppointmentStatus(status: ReservaStatus): AppointmentStatus {
  return status.toLowerCase() as AppointmentStatus;
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfWeek(date: Date) {
  const d = startOfDay(date);
  const day = (d.getDay() + 6) % 7; // segunda-feira = 0
  d.setDate(d.getDate() - day);
  return d;
}

const weekDayLabels = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const monthLabels = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

function Agenda() {
  const today = useMemo(() => startOfDay(new Date()), []);
  const [reservas, setReservas] = useState<ReservaApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"semana" | "mes">("semana");
  const [weekAnchor, setWeekAnchor] = useState(() => startOfWeek(today));
  const [monthAnchor, setMonthAnchor] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selectedDate, setSelectedDate] = useState(today);
  const [filterStatus, setFilterStatus] = useState<AppointmentStatus | "todos">(
    "todos",
  );

  useEffect(() => {
    fetch("/api/reservas")
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setReservas(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const reservasByDay = useMemo(() => {
    const map = new Map<string, ReservaApi[]>();
    for (const r of reservas) {
      const key = startOfDay(new Date(r.data)).toDateString();
      const arr = map.get(key) ?? [];
      arr.push(r);
      map.set(key, arr);
    }
    return map;
  }, [reservas]);

  const weekDays = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekAnchor);
        d.setDate(d.getDate() + i);
        return d;
      }),
    [weekAnchor],
  );

  const monthGrid = useMemo(() => {
    const year = monthAnchor.getFullYear();
    const month = monthAnchor.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDate = new Date(year, month + 1, 0).getDate();
    const leading = (firstDay.getDay() + 6) % 7;
    const totalCells = Math.ceil((leading + lastDate) / 7) * 7;
    return Array.from({ length: totalCells }, (_, i) => {
      const dayNum = i - leading + 1;
      if (dayNum < 1 || dayNum > lastDate) return null;
      return new Date(year, month, dayNum);
    });
  }, [monthAnchor]);

  const dayReservas = useMemo(() => {
    const list = reservasByDay.get(selectedDate.toDateString()) ?? [];
    const sorted = [...list].sort((a, b) => a.horario.localeCompare(b.horario));
    if (filterStatus === "todos") return sorted;
    return sorted.filter((r) => toAppointmentStatus(r.status) === filterStatus);
  }, [reservasByDay, selectedDate, filterStatus]);

  async function updateStatus(id: string, status: ReservaStatus) {
    setReservas((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r)),
    );
    try {
      await fetch(`/api/reservas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
    } catch {}
  }

  function selectDay(d: Date) {
    setSelectedDate(d);
    setWeekAnchor(startOfWeek(d));
  }

  const statusFilters: Array<{
    value: AppointmentStatus | "todos";
    label: string;
  }> = [
    { value: "todos", label: "Todos" },
    { value: "confirmado", label: "Confirmados" },
    { value: "pendente", label: "Pendentes" },
    { value: "concluido", label: "Concluídos" },
  ];

  return (
    <div className="flex flex-col gap-5 lg:max-w-4xl xl:max-w-7xl lg:mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Agenda</h1>
        <div className="flex gap-2 rounded-full border-2 border-[#F1f1f1] p-1 shrink-0">
          <button
            type="button"
            onClick={() => setViewMode("semana")}
            className={[
              "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
              viewMode === "semana" ? "bg-black text-white" : "text-[#656565]",
            ].join(" ")}
          >
            Semana
          </button>
          <button
            type="button"
            onClick={() => setViewMode("mes")}
            className={[
              "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
              viewMode === "mes" ? "bg-black text-white" : "text-[#656565]",
            ].join(" ")}
          >
            Mês
          </button>
        </div>
      </div>

      {viewMode === "semana" ? (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              setWeekAnchor((w) => {
                const d = new Date(w);
                d.setDate(d.getDate() - 7);
                return d;
              })
            }
            className="w-8 h-8 rounded-full border-2 border-[#F1f1f1] bg-[#FAFAFA] flex items-center justify-center shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 flex-1">
            {weekDays.map((d, i) => {
              const isSelected = sameDay(d, selectedDate);
              const isToday = sameDay(d, today);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => selectDay(d)}
                  className={[
                    "flex flex-col items-center gap-1 rounded-xl border-2 px-3 py-2 shrink-0 min-w-[52px]",
                    isSelected
                      ? "bg-black text-white border-black"
                      : "bg-[#FAFAFA] text-black border-[#F1f1f1]",
                  ].join(" ")}
                >
                  <span className="text-xs font-semibold opacity-70">
                    {weekDayLabels[i]}
                  </span>
                  <span className="text-lg font-bold leading-none">
                    {d.getDate()}
                  </span>
                  {isToday && (
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white" : "bg-black"}`}
                    />
                  )}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() =>
              setWeekAnchor((w) => {
                const d = new Date(w);
                d.setDate(d.getDate() + 7);
                return d;
              })
            }
            className="w-8 h-8 rounded-full border-2 border-[#F1f1f1] bg-[#FAFAFA] flex items-center justify-center shrink-0"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="rounded-xl border-2 border-[#F1f1f1] bg-[#FAFAFA] p-3">
          <div className="flex items-center justify-between pb-2">
            <button
              type="button"
              onClick={() =>
                setMonthAnchor(
                  (m) => new Date(m.getFullYear(), m.getMonth() - 1, 1),
                )
              }
              className="w-8 h-8 rounded-full border-2 border-[#F1f1f1] bg-white flex items-center justify-center"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <p className="font-bold text-sm">
              {monthLabels[monthAnchor.getMonth()]} {monthAnchor.getFullYear()}
            </p>
            <button
              type="button"
              onClick={() =>
                setMonthAnchor(
                  (m) => new Date(m.getFullYear(), m.getMonth() + 1, 1),
                )
              }
              className="w-8 h-8 rounded-full border-2 border-[#F1f1f1] bg-white flex items-center justify-center"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 pb-1">
            {weekDayLabels.map((l) => (
              <div
                key={l}
                className="text-center text-xs font-semibold text-[#656565] py-1"
              >
                {l}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {monthGrid.map((d, i) => {
              if (!d) return <div key={i} />;
              const hasReservas = reservasByDay.has(d.toDateString());
              const isSelected = sameDay(d, selectedDate);
              const isToday = sameDay(d, today);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => selectDay(d)}
                  className={[
                    "aspect-square rounded-lg flex flex-col items-center justify-center gap-0.5 text-sm font-semibold",
                    isSelected
                      ? "bg-black text-white"
                      : isToday
                        ? "bg-white border-2 border-black"
                        : "bg-white text-black",
                  ].join(" ")}
                >
                  {d.getDate()}
                  <div
                    className={`w-1 h-1 rounded-full ${
                      hasReservas
                        ? isSelected
                          ? "bg-white"
                          : "bg-black"
                        : "bg-transparent"
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-[#656565]">
          {selectedDate.toLocaleDateString("pt-BR", {
            weekday: "long",
            day: "2-digit",
            month: "long",
          })}
        </p>
        {!sameDay(selectedDate, today) && (
          <button
            type="button"
            onClick={() => selectDay(today)}
            className="rounded-full border-2 px-4 py-2 text-xs font-semibold shrink-0 bg-[#FAFAFA] text-[#656565] border-[#F1f1f1]"
          >
            Voltar para hoje
          </button>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {statusFilters.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilterStatus(f.value)}
            className={[
              "rounded-full border-2 px-4 py-2 text-sm font-semibold shrink-0",
              filterStatus === f.value
                ? "bg-black text-white border-black"
                : "bg-[#FAFAFA] text-[#656565] border-[#F1f1f1]",
            ].join(" ")}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex flex-col gap-3 lg:grid lg:grid-cols-4 lg:gap-4">
          {dayReservas.length === 0 && (
            <p className="text-center text-[#656565] py-8 lg:col-span-4">
              Nenhum agendamento encontrado.
            </p>
          )}
          {dayReservas.map((apt) => {
            const status = toAppointmentStatus(apt.status);
            const serviceNames = apt.servicos
              .map((s) => s.servico.nome)
              .join(", ");
            return (
              <div
                key={apt.id}
                className="w-full h-full rounded-xl border-2 border-[#F1f1f1] bg-[#FAFAFA] p-4 flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-sm font-semibold text-[#656565]">
                    <Clock className="w-4 h-4" />
                    {apt.horario}
                  </div>
                  <StatusPill status={status} />
                </div>
                <div className="flex items-center gap-3">
                  <Avatar initials={getInitials(apt.cliente.nome)} />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate">{apt.cliente.nome}</p>
                    <p className="text-sm text-[#656565] truncate">
                      {serviceNames}
                    </p>
                  </div>
                  <p className="font-bold shrink-0">{formatPrice(apt.total)}</p>
                </div>
                {(status === "confirmado" || status === "pendente") && (
                  <div className="flex gap-2 pt-3 border-t border-[#F1f1f1] mt-auto">
                    <button
                      type="button"
                      onClick={() => updateStatus(apt.id, "CANCELADO")}
                      className="flex-1 rounded-full border-2 border-[#F1f1f1] bg-white py-2 text-sm font-semibold text-red-500"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => updateStatus(apt.id, "CONCLUIDO")}
                      className="flex-1 rounded-full bg-black text-white py-2 text-sm font-semibold"
                    >
                      Concluir
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Clientes() {
  const [search, setSearch] = useState("");
  const [dbClients, setDbClients] = useState<
    Array<{
      id: string;
      nome: string;
      telefone: string;
      email: string | null;
      createdAt: string;
    }>
  >([]);

  useEffect(() => {
    fetch("/api/clientes")
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setDbClients(data))
      .catch(() => {});
  }, []);

  const allClients = [
    ...dbClients.map((c) => ({
      id: c.id,
      name: c.nome,
      initials: c.nome
        .trim()
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((w: string) => w[0].toUpperCase())
        .join(""),
      phone: c.telefone,
      lastVisit: new Date(c.createdAt).toLocaleDateString("pt-BR"),
      totalVisits: 1,
      totalSpent: "–",
      isNew: true,
    })),
    ...clients.filter((c) => !dbClients.some((d) => d.telefone === c.phone)),
  ];

  const filtered = useMemo(() => {
    if (!search.trim()) return allClients;
    return allClients.filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase()),
    );
  }, [search, allClients]);

  const newClients = allClients.filter((c) => c.isNew).length;

  return (
    <div className="flex flex-col gap-5 lg:max-w-4xl xl:max-w-7xl lg:mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <div className="flex gap-2">
          <div className="rounded-full bg-[#FAFAFA] border-2 border-[#F1f1f1] px-3 py-1 text-xs font-semibold">
            {allClients.length} total
          </div>
          <div className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700">
            +{newClients} novos
          </div>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#656565]" />
        <Input
          type="search"
          placeholder="Buscar cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 rounded-full border-2 border-[#F1f1f1] bg-[#FAFAFA] py-5"
        />
      </div>

      <div className="flex flex-col gap-3 lg:grid lg:grid-cols-4 lg:gap-4">
        {filtered.length === 0 && (
          <p className="text-center text-[#656565] py-8 lg:col-span-2">
            Nenhum cliente encontrado.
          </p>
        )}
        {filtered.map((client) => (
          <div
            key={client.id}
            className="rounded-xl border-2 border-[#F1f1f1] bg-[#FAFAFA] p-4 flex flex-col gap-3"
          >
            <div className="flex items-center gap-3">
              <Avatar initials={client.initials} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold truncate">{client.name}</p>
                  {client.isNew && (
                    <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-xs font-semibold text-emerald-700 shrink-0">
                      Novo
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-[#656565]">
                  <Phone className="w-3 h-3" />
                  {client.phone}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#656565] shrink-0" />
            </div>
            <div className="flex justify-between pt-1 border-t border-[#F1f1f1]">
              <div className="text-center">
                <p className="text-xs text-[#656565]">Visitas</p>
                <p className="font-bold text-sm">{client.totalVisits}x</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-[#656565]">Total gasto</p>
                <p className="font-bold text-sm">{client.totalSpent}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-[#656565]">Última visita</p>
                <p className="font-bold text-sm">{client.lastVisit}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BottomSheet({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end lg:items-center lg:justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl flex flex-col max-h-[90vh] lg:rounded-2xl lg:w-full lg:max-w-md lg:max-h-[85vh]">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 shrink-0">
          <h2 className="font-bold text-lg">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-[#F1f1f1]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-5 pb-2">
          <div className="flex flex-col gap-3">{children}</div>
        </div>
        {footer && (
          <div className="px-5 pt-3 pb-24 shrink-0 border-t border-[#F1f1f1] bg-white lg:pb-5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

const DURATION_OPTIONS = [15, 20, 30, 45, 60, 90, 120];

function formatDuration(min: number) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h${m}min`;
}

function formatPrice(price: number) {
  return `R$ ${price.toFixed(2).replace(".", ",")}`;
}

function getInitials(name: string) {
  return name
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

function Config() {
  const { services, setServices, barbers, setBarbers } = useStore();

  const [horario, setHorario] = useState({
    horaInicio: "08:00",
    horaFim: "19:00",
    intervalo: 30,
    pausaAtiva: false,
    pausaInicio: "12:00",
    pausaFim: "13:00",
    diasFuncionamento: [1, 2, 3, 4, 5, 6] as number[],
  });
  const [savingHorario, setSavingHorario] = useState(false);
  const [horarioSaved, setHorarioSaved] = useState(false);

  useEffect(() => {
    fetch("/api/configuracao-horario")
      .then((r) => r.json())
      .then((data) =>
        setHorario((prev) => ({
          ...prev,
          ...data,
          pausaInicio: data.pausaInicio ?? prev.pausaInicio,
          pausaFim: data.pausaFim ?? prev.pausaFim,
        })),
      )
      .catch(() => {});
  }, []);

  async function saveHorario() {
    setSavingHorario(true);
    try {
      await fetch("/api/configuracao-horario", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...horario,
          pausaInicio: horario.pausaAtiva ? horario.pausaInicio : null,
          pausaFim: horario.pausaAtiva ? horario.pausaFim : null,
        }),
      });
      setHorarioSaved(true);
      setTimeout(() => setHorarioSaved(false), 2000);
    } catch {}
    setSavingHorario(false);
  }

  function toggleDiaFuncionamento(dia: number) {
    setHorario((p) => ({
      ...p,
      diasFuncionamento: p.diasFuncionamento.includes(dia)
        ? p.diasFuncionamento.filter((d) => d !== dia)
        : [...p.diasFuncionamento, dia].sort(),
    }));
  }

  const [serviceModal, setServiceModal] = useState<{
    open: boolean;
    editing: Service | null;
  }>({ open: false, editing: null });
  const [serviceForm, setServiceForm] = useState({
    name: "",
    description: "",
    duration: 30,
    price: "",
    photo: "",
  });

  const [barberModal, setBarberModal] = useState<{
    open: boolean;
    editing: Barber | null;
  }>({ open: false, editing: null });
  const [barberForm, setBarberForm] = useState({
    name: "",
    description: "",
    serviceIds: [] as number[],
    photo: "",
  });

  function openAddService() {
    setServiceForm({
      name: "",
      description: "",
      duration: 30,
      price: "",
      photo: "",
    });
    setServiceModal({ open: true, editing: null });
  }

  function openEditService(s: Service) {
    setServiceForm({
      name: s.name,
      description: s.description,
      duration: s.duration,
      price: String(s.price),
      photo: s.photo ?? "",
    });
    setServiceModal({ open: true, editing: s });
  }

  function saveService() {
    if (!serviceForm.name.trim()) return;
    const price = parseFloat(serviceForm.price.replace(",", ".")) || 0;
    if (serviceModal.editing) {
      setServices((prev) =>
        prev.map((s) =>
          s.id === serviceModal.editing!.id
            ? {
                ...s,
                name: serviceForm.name.trim(),
                description: serviceForm.description.trim(),
                duration: serviceForm.duration,
                price,
                photo: serviceForm.photo || undefined,
              }
            : s,
        ),
      );
    } else {
      const newId = Math.max(0, ...services.map((s) => s.id)) + 1;
      setServices((prev) => [
        ...prev,
        {
          id: newId,
          name: serviceForm.name.trim(),
          description: serviceForm.description.trim(),
          duration: serviceForm.duration,
          price,
          photo: serviceForm.photo || undefined,
        },
      ]);
    }
    setServiceModal({ open: false, editing: null });
  }

  function deleteService(id: number) {
    setServices((prev) => prev.filter((s) => s.id !== id));
    setBarbers((prev) =>
      prev.map((b) => ({
        ...b,
        serviceIds: b.serviceIds.filter((sid) => sid !== id),
      })),
    );
  }

  function openAddBarber() {
    setBarberForm({ name: "", description: "", serviceIds: [], photo: "" });
    setBarberModal({ open: true, editing: null });
  }

  function openEditBarber(b: Barber) {
    setBarberForm({
      name: b.name,
      description: b.description,
      serviceIds: b.serviceIds,
      photo: b.photo ?? "",
    });
    setBarberModal({ open: true, editing: b });
  }

  function toggleBarberService(sid: number) {
    setBarberForm((prev) => ({
      ...prev,
      serviceIds: prev.serviceIds.includes(sid)
        ? prev.serviceIds.filter((id) => id !== sid)
        : [...prev.serviceIds, sid],
    }));
  }

  function saveBarber() {
    if (!barberForm.name.trim()) return;
    if (barberModal.editing) {
      setBarbers((prev) =>
        prev.map((b) =>
          b.id === barberModal.editing!.id
            ? {
                ...b,
                name: barberForm.name.trim(),
                initials: getInitials(barberForm.name),
                description: barberForm.description.trim(),
                serviceIds: barberForm.serviceIds,
                photo: barberForm.photo || undefined,
              }
            : b,
        ),
      );
    } else {
      const newId = Math.max(0, ...barbers.map((b) => b.id)) + 1;
      setBarbers((prev) => [
        ...prev,
        {
          id: newId,
          name: barberForm.name.trim(),
          initials: getInitials(barberForm.name),
          description: barberForm.description.trim(),
          serviceIds: barberForm.serviceIds,
          photo: barberForm.photo || undefined,
        },
      ]);
    }
    setBarberModal({ open: false, editing: null });
  }

  function deleteBarber(id: number) {
    setBarbers((prev) => prev.filter((b) => b.id !== id));
  }

  return (
    <div className="flex flex-col gap-5 lg:max-w-4xl xl:max-w-7xl lg:mx-auto">
      <h1 className="text-2xl font-bold">Configurações</h1>

      <div className="flex flex-col items-center gap-3 py-4">
        <Avatar initials="YV" size="lg" />
        <div className="text-center">
          <p className="font-bold text-lg">Yvison</p>
          <p className="text-sm text-[#656565]">Barbeiro profissional</p>
        </div>
        <button
          type="button"
          className="rounded-full border-2 border-[#F1f1f1] bg-[#FAFAFA] px-5 py-2 text-sm font-semibold"
        >
          Editar perfil
        </button>
      </div>

      {/* Barbearia */}
      <div>
        <p className="text-xs font-semibold text-[#656565] uppercase pb-2">
          Barbearia
        </p>
        <div className="rounded-xl border-2 border-[#F1f1f1] bg-[#FAFAFA] overflow-hidden">
          {[
            { label: "Nome da barbearia", value: "YvisonBarber" },
            { label: "Endereço", value: "Av. São Sebastião, 357" },
            { label: "Telefone", value: "(11) 99999-0000" },
          ].map((item, i, arr) => (
            <div
              key={item.label}
              className={[
                "flex items-center justify-between px-4 py-3.5",
                i < arr.length - 1 ? "border-b border-[#F1f1f1]" : "",
              ].join(" ")}
            >
              <p className="font-semibold text-sm">{item.label}</p>
              <div className="flex items-center gap-2">
                <p className="text-sm text-[#656565]">{item.value}</p>
                <ChevronRight className="w-4 h-4 text-[#656565]" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Horário de funcionamento */}
      <div>
        <p className="text-xs font-semibold text-[#656565] uppercase pb-2">
          Horário de funcionamento
        </p>
        <div className="rounded-xl border-2 border-[#F1f1f1] bg-[#FAFAFA] p-4 flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-[#656565] uppercase block pb-2">
              Dias de funcionamento
            </label>
            <div className="flex gap-1.5">
              {["D", "S", "T", "Q", "Q", "S", "S"].map((letra, dia) => {
                const active = horario.diasFuncionamento.includes(dia);
                return (
                  <button
                    key={dia}
                    type="button"
                    onClick={() => toggleDiaFuncionamento(dia)}
                    className={[
                      "w-9 h-9 rounded-full text-xs font-bold shrink-0 border-2 transition-colors",
                      active
                        ? "bg-black text-white border-black"
                        : "bg-white text-[#656565] border-[#F1f1f1]",
                    ].join(" ")}
                  >
                    {letra}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#656565] uppercase block pb-1">
                Abre às
              </label>
              <input
                type="time"
                value={horario.horaInicio}
                onChange={(e) =>
                  setHorario((p) => ({ ...p, horaInicio: e.target.value }))
                }
                className="w-full rounded-xl border-2 border-[#F1f1f1] bg-white px-4 py-3 text-sm focus:outline-none focus:border-black"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#656565] uppercase block pb-1">
                Fecha às
              </label>
              <input
                type="time"
                value={horario.horaFim}
                onChange={(e) =>
                  setHorario((p) => ({ ...p, horaFim: e.target.value }))
                }
                className="w-full rounded-xl border-2 border-[#F1f1f1] bg-white px-4 py-3 text-sm focus:outline-none focus:border-black"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#656565] uppercase block pb-1">
              Intervalo entre horários
            </label>
            <select
              value={horario.intervalo}
              onChange={(e) =>
                setHorario((p) => ({ ...p, intervalo: Number(e.target.value) }))
              }
              className="w-full rounded-xl border-2 border-[#F1f1f1] bg-white px-4 py-3 text-sm focus:outline-none focus:border-black appearance-none"
            >
              {[15, 20, 30, 45, 60].map((min) => (
                <option key={min} value={min}>
                  {formatDuration(min)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-[#F1f1f1]">
            <div>
              <p className="font-semibold text-sm">Pausa no meio do dia</p>
              <p className="text-xs text-[#656565]">
                Ex: horário de almoço, sem agendamentos
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setHorario((p) => ({ ...p, pausaAtiva: !p.pausaAtiva }))
              }
            >
              {horario.pausaAtiva ? (
                <ToggleRight className="w-7 h-7 text-black" />
              ) : (
                <ToggleLeft className="w-7 h-7 text-[#656565]" />
              )}
            </button>
          </div>

          {horario.pausaAtiva && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-[#656565] uppercase block pb-1">
                  Pausa de
                </label>
                <input
                  type="time"
                  value={horario.pausaInicio}
                  onChange={(e) =>
                    setHorario((p) => ({ ...p, pausaInicio: e.target.value }))
                  }
                  className="w-full rounded-xl border-2 border-[#F1f1f1] bg-white px-4 py-3 text-sm focus:outline-none focus:border-black"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#656565] uppercase block pb-1">
                  Até
                </label>
                <input
                  type="time"
                  value={horario.pausaFim}
                  onChange={(e) =>
                    setHorario((p) => ({ ...p, pausaFim: e.target.value }))
                  }
                  className="w-full rounded-xl border-2 border-[#F1f1f1] bg-white px-4 py-3 text-sm focus:outline-none focus:border-black"
                />
              </div>
            </div>
          )}

          <div className="flex flex-row gap-5 pt-4">
            <button
              type="button"
              onClick={saveHorario}
              disabled={savingHorario}
              className="w-full rounded-full bg-black text-white py-3 text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {horarioSaved ? (
                <>
                  <Check className="w-4 h-4" />
                  Salvo
                </>
              ) : savingHorario ? (
                "Salvando..."
              ) : (
                "Salvar horário"
              )}
            </button>
            <button
              type="button"
              onClick={saveHorario}
              disabled={savingHorario}
              className="w-full rounded-full bg-white text-black/90 border-[#cccccc]/90 border py-3 text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
            >
              Personalizar
            </button>
          </div>
        </div>
      </div>

      {/* Serviços */}
      <div>
        <div className="flex items-center justify-between pb-2">
          <p className="text-xs font-semibold text-[#656565] uppercase">
            Serviços
          </p>
          <button
            type="button"
            onClick={openAddService}
            className="flex items-center gap-1 rounded-full bg-black text-white px-3 py-1.5 text-xs font-semibold"
          >
            <Plus className="w-3.5 h-3.5" />
            Novo
          </button>
        </div>
        <div className="flex flex-col gap-2 lg:grid lg:grid-cols-2 lg:gap-3">
          {services.length === 0 && (
            <p className="text-center text-[#656565] text-sm py-6 lg:col-span-2">
              Nenhum serviço cadastrado.
            </p>
          )}
          {services.map((s) => (
            <div
              key={s.id}
              className="rounded-xl border-2 border-[#F1f1f1] bg-[#FAFAFA] p-4 flex items-center gap-3"
            >
              <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0 bg-black flex items-center justify-center">
                {s.photo ? (
                  <img
                    src={s.photo}
                    alt={s.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Scissors className="w-4 h-4 text-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{s.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-[#656565] flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDuration(s.duration)}
                  </span>
                  <span className="text-xs font-semibold text-black">
                    {formatPrice(s.price)}
                  </span>
                </div>
                {s.description && (
                  <p className="text-xs text-[#656565] truncate mt-0.5">
                    {s.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => openEditService(s)}
                  className="w-8 h-8 rounded-full border-2 border-[#F1f1f1] bg-white flex items-center justify-center"
                >
                  <Pencil className="w-3.5 h-3.5 text-[#656565]" />
                </button>
                <button
                  type="button"
                  onClick={() => deleteService(s.id)}
                  className="w-8 h-8 rounded-full border-2 border-red-100 bg-red-50 flex items-center justify-center"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Equipe */}
      <div>
        <div className="flex items-center justify-between pb-2">
          <p className="text-xs font-semibold text-[#656565] uppercase">
            Equipe
          </p>
          <button
            type="button"
            onClick={openAddBarber}
            className="flex items-center gap-1 rounded-full bg-black text-white px-3 py-1.5 text-xs font-semibold"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Adicionar
          </button>
        </div>
        <div className="flex flex-col gap-2 lg:grid lg:grid-cols-2 lg:gap-3">
          {barbers.length === 0 && (
            <p className="text-center text-[#656565] text-sm py-6 lg:col-span-2">
              Nenhum barbeiro cadastrado.
            </p>
          )}
          {barbers.map((b) => (
            <div
              key={b.id}
              className="rounded-xl border-2 border-[#F1f1f1] bg-[#FAFAFA] p-4 flex flex-col gap-3"
            >
              <div className="flex items-center gap-3">
                <Avatar initials={b.initials} src={b.photo} />
                <div className="flex-1 min-w-0">
                  <p className="font-bold">{b.name}</p>
                  {b.description && (
                    <p className="text-xs text-[#656565] truncate">
                      {b.description}
                    </p>
                  )}
                  <p className="text-xs text-[#999] mt-0.5">
                    {b.serviceIds.length} serviço
                    {b.serviceIds.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/admin/barber/${b.id}`}
                    className="rounded-full border-2 border-[#F1f1f1] bg-[#FAFAFA] px-3 py-1.5 text-xs font-semibold flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Painel
                  </Link>
                  <button
                    type="button"
                    onClick={() => openEditBarber(b)}
                    className="w-8 h-8 rounded-full border-2 border-[#F1f1f1] bg-white flex items-center justify-center"
                  >
                    <Pencil className="w-3.5 h-3.5 text-[#656565]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteBarber(b.id)}
                    className="w-8 h-8 rounded-full border-2 border-red-100 bg-red-50 flex items-center justify-center"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  </button>
                </div>
              </div>
              {b.serviceIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1 border-t border-[#F1f1f1]">
                  {b.serviceIds.map((sid) => {
                    const svc = services.find((s) => s.id === sid);
                    return svc ? (
                      <span
                        key={sid}
                        className="rounded-full bg-black text-white px-2.5 py-1 text-xs font-semibold"
                      >
                        {svc.name}
                      </span>
                    ) : null;
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Notificações */}
      <div>
        <p className="text-xs font-semibold text-[#656565] uppercase pb-2">
          Notificações
        </p>
        <div className="rounded-xl border-2 border-[#F1f1f1] bg-[#FAFAFA] overflow-hidden">
          {[
            { label: "Novos agendamentos", value: "Ativado" },
            { label: "Cancelamentos", value: "Ativado" },
          ].map((item, i, arr) => (
            <div
              key={item.label}
              className={[
                "flex items-center justify-between px-4 py-3.5",
                i < arr.length - 1 ? "border-b border-[#F1f1f1]" : "",
              ].join(" ")}
            >
              <p className="font-semibold text-sm">{item.label}</p>
              <div className="flex items-center gap-2">
                <p className="text-sm text-[#656565]">{item.value}</p>
                <ChevronRight className="w-4 h-4 text-[#656565]" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        className="w-full rounded-full border-2 border-red-200 bg-red-50 py-4 text-sm font-semibold text-red-600 mt-2"
      >
        Sair da conta
      </button>

      {/* Modal: Serviço */}
      <BottomSheet
        open={serviceModal.open}
        onClose={() => setServiceModal({ open: false, editing: null })}
        title={serviceModal.editing ? "Editar serviço" : "Novo serviço"}
        footer={
          <button
            type="button"
            onClick={saveService}
            disabled={!serviceForm.name.trim()}
            className="w-full rounded-full bg-black text-white py-3.5 text-sm font-semibold disabled:opacity-40"
          >
            Finalizar
          </button>
        }
      >
        <div className="flex justify-center pb-1">
          <label className="relative cursor-pointer">
            <div className="w-20 h-20 rounded-xl bg-[#F1f1f1] border-2 border-[#E0E0E0] overflow-hidden flex items-center justify-center">
              {serviceForm.photo ? (
                <img
                  src={serviceForm.photo}
                  alt="foto"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Camera className="w-7 h-7 text-[#999]" />
              )}
            </div>
            <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-black border-2 border-white flex items-center justify-center">
              <Plus className="w-3 h-3 text-white" />
            </div>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) =>
                  setServiceForm((p) => ({
                    ...p,
                    photo: ev.target?.result as string,
                  }));
                reader.readAsDataURL(file);
              }}
            />
          </label>
        </div>
        <div>
          <label className="text-xs font-semibold text-[#656565] uppercase block pb-1">
            Nome
          </label>
          <input
            type="text"
            value={serviceForm.name}
            onChange={(e) =>
              setServiceForm((p) => ({ ...p, name: e.target.value }))
            }
            placeholder="Ex: Corte de Cabelo"
            className="w-full rounded-xl border-2 border-[#F1f1f1] bg-[#FAFAFA] px-4 py-3 text-sm focus:outline-none focus:border-black"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-[#656565] uppercase block pb-1">
            Descrição
          </label>
          <textarea
            value={serviceForm.description}
            onChange={(e) =>
              setServiceForm((p) => ({ ...p, description: e.target.value }))
            }
            placeholder="Breve descrição do serviço"
            rows={2}
            className="w-full rounded-xl border-2 border-[#F1f1f1] bg-[#FAFAFA] px-4 py-3 text-sm focus:outline-none focus:border-black resize-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-[#656565] uppercase block pb-1">
              Duração
            </label>
            <select
              value={serviceForm.duration}
              onChange={(e) =>
                setServiceForm((p) => ({
                  ...p,
                  duration: Number(e.target.value),
                }))
              }
              className="w-full rounded-xl border-2 border-[#F1f1f1] bg-[#FAFAFA] px-4 py-3 text-sm focus:outline-none focus:border-black appearance-none"
            >
              {DURATION_OPTIONS.map((d) => (
                <option key={d} value={d}>
                  {formatDuration(d)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-[#656565] uppercase block pb-1">
              Preço (R$)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={serviceForm.price}
              onChange={(e) =>
                setServiceForm((p) => ({ ...p, price: e.target.value }))
              }
              placeholder="0,00"
              className="w-full rounded-xl border-2 border-[#F1f1f1] bg-[#FAFAFA] px-4 py-3 text-sm focus:outline-none focus:border-black"
            />
          </div>
        </div>
      </BottomSheet>

      {/* Modal: Barbeiro */}
      <BottomSheet
        open={barberModal.open}
        onClose={() => setBarberModal({ open: false, editing: null })}
        title={barberModal.editing ? "Editar barbeiro" : "Adicionar barbeiro"}
        footer={
          <button
            type="button"
            onClick={saveBarber}
            disabled={!barberForm.name.trim()}
            className="w-full rounded-full bg-black text-white py-3.5 text-sm font-semibold disabled:opacity-40"
          >
            Finalizar
          </button>
        }
      >
        <div className="flex justify-center pb-1">
          <label className="relative cursor-pointer">
            <div className="w-20 h-20 rounded-full bg-[#F1f1f1] border-2 border-[#E0E0E0] overflow-hidden flex items-center justify-center">
              {barberForm.photo ? (
                <img
                  src={barberForm.photo}
                  alt="foto"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Camera className="w-7 h-7 text-[#999]" />
              )}
            </div>
            <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-black border-2 border-white flex items-center justify-center">
              <Plus className="w-3 h-3 text-white" />
            </div>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) =>
                  setBarberForm((p) => ({
                    ...p,
                    photo: ev.target?.result as string,
                  }));
                reader.readAsDataURL(file);
              }}
            />
          </label>
        </div>
        <div>
          <label className="text-xs font-semibold text-[#656565] uppercase block pb-1">
            Nome do barbeiro
          </label>
          <input
            type="text"
            value={barberForm.name}
            onChange={(e) =>
              setBarberForm((p) => ({ ...p, name: e.target.value }))
            }
            placeholder="Ex: Carlos Silva"
            className="w-full rounded-xl border-2 border-[#F1f1f1] bg-[#FAFAFA] px-4 py-3 text-sm focus:outline-none focus:border-black"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-[#656565] uppercase block pb-1">
            Descrição
          </label>
          <textarea
            value={barberForm.description}
            onChange={(e) =>
              setBarberForm((p) => ({ ...p, description: e.target.value }))
            }
            placeholder="Ex: Especialista em cortes modernos e barba"
            rows={2}
            className="w-full rounded-xl border-2 border-[#F1f1f1] bg-[#FAFAFA] px-4 py-3 text-sm focus:outline-none focus:border-black resize-none"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-[#656565] uppercase block pb-2">
            Serviços que realiza
          </label>
          {services.length === 0 && (
            <p className="text-sm text-[#656565]">
              Nenhum serviço cadastrado ainda.
            </p>
          )}
          <div className="flex flex-col gap-2">
            {services.map((s) => {
              const selected = barberForm.serviceIds.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleBarberService(s.id)}
                  className={[
                    "flex items-center justify-between rounded-xl border-2 px-4 py-3 text-left",
                    selected
                      ? "border-black bg-black text-white"
                      : "border-[#F1f1f1] bg-[#FAFAFA] text-black",
                  ].join(" ")}
                >
                  <div>
                    <p className="font-semibold text-sm">{s.name}</p>
                    <p
                      className={`text-xs ${selected ? "text-zinc-300" : "text-[#656565]"}`}
                    >
                      {formatDuration(s.duration)} · {formatPrice(s.price)}
                    </p>
                  </div>
                  {selected && <Check className="w-4 h-4 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}

type PixelId = "meta" | "ga4" | "tiktok" | "gtm";

type PixelConfig = {
  id: PixelId;
  name: string;
  detail: string;
  placeholder: string;
  color: string;
  abbr: string;
};

const pixelList: PixelConfig[] = [
  {
    id: "meta",
    name: "Meta Pixel",
    detail: "Facebook & Instagram Ads",
    placeholder: "Ex: 1234567890123456",
    color: "bg-blue-600",
    abbr: "M",
  },
  {
    id: "ga4",
    name: "Google Analytics 4",
    detail: "GA4 – Measurement ID",
    placeholder: "Ex: G-XXXXXXXXXX",
    color: "bg-orange-500",
    abbr: "G",
  },
  {
    id: "tiktok",
    name: "TikTok Pixel",
    detail: "TikTok Ads Manager",
    placeholder: "Ex: C4ABCDE12345",
    color: "bg-black",
    abbr: "T",
  },
  {
    id: "gtm",
    name: "Google Tag Manager",
    detail: "Gerenciador de tags",
    placeholder: "Ex: GTM-XXXXXXX",
    color: "bg-blue-400",
    abbr: "GT",
  },
];

const recentEvents = [
  {
    name: "page_view",
    desc: "Visitou a página do Yvison",
    time: "2 min atrás",
  },
  {
    name: "schedule_start",
    desc: "Iniciou um agendamento",
    time: "5 min atrás",
  },
  {
    name: "schedule_complete",
    desc: "Concluiu agendamento – Corte",
    time: "8 min atrás",
  },
  {
    name: "page_view",
    desc: "Visitou a página do Yvison",
    time: "12 min atrás",
  },
  { name: "click_whatsapp", desc: "Clicou no WhatsApp", time: "18 min atrás" },
  {
    name: "schedule_start",
    desc: "Iniciou um agendamento",
    time: "25 min atrás",
  },
];

function Gestor() {
  const [enabled, setEnabled] = useState<Record<PixelId, boolean>>({
    meta: true,
    ga4: false,
    tiktok: false,
    gtm: true,
  });
  const [ids, setIds] = useState<Record<PixelId, string>>({
    meta: "1234567890123456",
    ga4: "",
    tiktok: "",
    gtm: "GTM-ABC1234",
  });
  const [expanded, setExpanded] = useState<PixelId | null>(null);
  const [copied, setCopied] = useState(false);

  function handleCopy(value: string) {
    navigator.clipboard.writeText(value).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const trafficSources = [
    { label: "Instagram", percent: 38, color: "bg-pink-500" },
    { label: "Direto", percent: 30, color: "bg-black" },
    { label: "Google", percent: 20, color: "bg-orange-400" },
    { label: "TikTok", percent: 12, color: "bg-[#656565]" },
  ];

  return (
    <div className="flex flex-col gap-6 lg:max-w-4xl xl:max-w-7xl lg:mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Gestor</h1>
        <p className="text-sm text-[#656565]">Pixels de rastreio e métricas</p>
      </div>

      {/* Métricas */}
      <div>
        <p className="text-xs font-semibold text-[#656565] uppercase pb-3">
          Métricas — últimos 30 dias
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              label: "Visualizações",
              value: "1.247",
              icon: <Eye className="w-4 h-4 text-[#656565]" />,
              sub: "+18% vs mês ant.",
            },
            {
              label: "Agendamentos",
              value: "89",
              icon: <CheckCircle2 className="w-4 h-4 text-[#656565]" />,
              sub: "via link",
            },
            {
              label: "Taxa de conv.",
              value: "7,1%",
              icon: <TrendingUp className="w-4 h-4 text-[#656565]" />,
              sub: "vis. → agend.",
            },
            {
              label: "Cliques",
              value: "234",
              icon: <MousePointerClick className="w-4 h-4 text-[#656565]" />,
              sub: "WhatsApp / CTA",
            },
          ].map((m) => (
            <div
              key={m.label}
              className="rounded-xl border-2 border-[#F1f1f1] bg-[#FAFAFA] p-4 flex flex-col gap-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#656565] uppercase">
                  {m.label}
                </span>
                {m.icon}
              </div>
              <p className="text-2xl font-bold">{m.value}</p>
              <p className="text-xs text-[#656565]">{m.sub}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-2 lg:gap-6">
        {/* Origem do tráfego */}
        <div>
          <p className="text-xs font-semibold text-[#656565] uppercase pb-3">
            Origem do tráfego
          </p>
          <div className="rounded-xl border-2 border-[#F1f1f1] bg-[#FAFAFA] p-4 flex flex-col gap-3">
            {trafficSources.map((s) => (
              <div key={s.label} className="flex items-center gap-3">
                <span className="text-sm font-semibold w-16 shrink-0">
                  {s.label}
                </span>
                <div className="flex-1 h-2 rounded-full bg-[#F1f1f1]">
                  <div
                    className={`h-2 rounded-full ${s.color}`}
                    style={{ width: `${s.percent}%` }}
                  />
                </div>
                <span className="text-sm font-bold w-9 text-right shrink-0">
                  {s.percent}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Eventos recentes */}
        <div className="mt-6 lg:mt-0">
          <p className="text-xs font-semibold text-[#656565] uppercase pb-3">
            Eventos recentes
          </p>
          <div className="rounded-xl border-2 border-[#F1f1f1] bg-[#FAFAFA] overflow-hidden">
            {recentEvents.map((ev, i) => (
              <div
                key={i}
                className={[
                  "flex items-center gap-3 px-4 py-3",
                  i < recentEvents.length - 1
                    ? "border-b border-[#F1f1f1]"
                    : "",
                ].join(" ")}
              >
                <div className="w-7 h-7 rounded-full bg-black flex items-center justify-center shrink-0">
                  <Zap className="w-3 h-3 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold font-mono text-[#656565]">
                    {ev.name}
                  </p>
                  <p className="text-sm font-semibold truncate">{ev.desc}</p>
                </div>
                <p className="text-xs text-[#656565] shrink-0">{ev.time}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pixels */}
      <div>
        <p className="text-xs font-semibold text-[#656565] uppercase pb-3">
          Pixels instalados
        </p>
        <div className="flex flex-col gap-3 lg:grid lg:grid-cols-2 lg:gap-4">
          {pixelList.map((pixel) => {
            const isExpanded = expanded === pixel.id;
            const isOn = enabled[pixel.id];
            return (
              <div
                key={pixel.id}
                className="rounded-xl border-2 border-[#F1f1f1] bg-[#FAFAFA] overflow-hidden"
              >
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setExpanded(isExpanded ? null : pixel.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setExpanded(isExpanded ? null : pixel.id);
                    }
                  }}
                  className="w-full flex items-center gap-3 p-4 text-left"
                >
                  <div
                    className={`w-9 h-9 rounded-lg ${pixel.color} flex items-center justify-center shrink-0`}
                  >
                    <span className="text-white text-xs font-bold">
                      {pixel.abbr}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm">{pixel.name}</p>
                    <p className="text-xs text-[#656565]">{pixel.detail}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-xs font-semibold ${isOn ? "text-emerald-600" : "text-[#656565]"}`}
                    >
                      {isOn ? "Ativo" : "Inativo"}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEnabled((prev) => ({
                          ...prev,
                          [pixel.id]: !prev[pixel.id],
                        }));
                      }}
                    >
                      {isOn ? (
                        <ToggleRight className="w-6 h-6 text-black" />
                      ) : (
                        <ToggleLeft className="w-6 h-6 text-[#656565]" />
                      )}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-[#F1f1f1] pt-3 flex flex-col gap-3">
                    <div>
                      <label className="text-xs font-semibold text-[#656565] uppercase block pb-1">
                        ID do Pixel
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={ids[pixel.id]}
                          onChange={(e) =>
                            setIds((prev) => ({
                              ...prev,
                              [pixel.id]: e.target.value,
                            }))
                          }
                          placeholder={pixel.placeholder}
                          className="flex-1 rounded-full border-2 border-[#F1f1f1] bg-white px-4 py-2 text-sm font-mono focus:outline-none focus:border-black"
                        />
                        <button
                          type="button"
                          onClick={() => handleCopy(ids[pixel.id])}
                          className="w-10 h-10 rounded-full border-2 border-[#F1f1f1] bg-white flex items-center justify-center shrink-0"
                        >
                          {copied ? (
                            <Check className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Copy className="w-4 h-4 text-[#656565]" />
                          )}
                        </button>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="w-full rounded-full bg-black text-white py-2.5 text-sm font-semibold"
                    >
                      Salvar
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const navItems: Array<{ tab: AdminTab; label: string; icon: React.ReactNode }> =
  [
    {
      tab: "dashboard",
      label: "Início",
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      tab: "agenda",
      label: "Agenda",
      icon: <CalendarDays className="w-5 h-5" />,
    },
    { tab: "clientes", label: "Clientes", icon: <Users className="w-5 h-5" /> },
    { tab: "gestor", label: "Gestor", icon: <BarChart2 className="w-5 h-5" /> },
    { tab: "config", label: "Config", icon: <Settings className="w-5 h-5" /> },
  ];

const Admin = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");

  return (
    <div className="bg-zinc-50 min-h-screen lg:flex">
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 border-r-2 border-[#F1f1f1] bg-white px-4 py-6">
        <div className="flex items-center gap-2 px-2 pb-8">
          <Avatar initials="YV" />
          <div className="min-w-0">
            <p className="font-bold text-sm truncate">YvisonBarber</p>
            <p className="text-xs text-[#656565] truncate">Painel admin</p>
          </div>
        </div>
        <nav className="flex flex-col gap-1">
          {navItems.map(({ tab, label, icon }) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={[
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                activeTab === tab
                  ? "bg-black text-white"
                  : "text-[#656565] hover:bg-[#FAFAFA]",
              ].join(" ")}
            >
              {icon}
              {label}
            </button>
          ))}
        </nav>
      </aside>

      <div className="max-w-md mx-auto px-5 pt-10 pb-28 lg:max-w-none lg:mx-0 lg:ml-64 lg:px-10 lg:pt-10 lg:pb-10">
        {activeTab === "dashboard" && <Dashboard />}
        {activeTab === "agenda" && <Agenda />}
        {activeTab === "clientes" && <Clientes />}
        {activeTab === "gestor" && <Gestor />}
        {activeTab === "config" && <Config />}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-[#F1f1f1] z-50 lg:hidden">
        <div className="max-w-md mx-auto flex">
          {navItems.map(({ tab, label, icon }) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={[
                "flex-1 flex flex-col items-center gap-1 py-3 transition-colors",
                activeTab === tab ? "text-black" : "text-[#656565]",
              ].join(" ")}
            >
              {icon}
              <span
                className={[
                  "text-xs font-semibold",
                  activeTab === tab ? "text-black" : "text-[#656565]",
                ].join(" ")}
              >
                {label}
              </span>
              {activeTab === tab && (
                <div className="w-1 h-1 rounded-full bg-black" />
              )}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default Admin;
