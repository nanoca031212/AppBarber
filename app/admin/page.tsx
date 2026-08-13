"use client";

import { useState, useMemo, useEffect, useRef } from "react";
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
  ChevronDown,
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
  Loader2,
  MessageCircle,
  QrCode,
  Smartphone,
  UserCog,
  FileText,
  Bell,
  Gift,
  Star,
  Store,
  Sparkles,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { FocalPointPicker } from "@/app/components/focal-point-picker";
import { uploadPhoto } from "@/lib/upload-photo";

type AdminTab =
  | "dashboard"
  | "agenda"
  | "clientes"
  | "whatsapp"
  | "gestor"
  | "config";

import type { Service, Barber } from "@/app/context/store";

type AppointmentStatus = "confirmado" | "pendente" | "concluido" | "cancelado";

type ClienteApi = {
  id: string;
  nome: string;
  telefone: string;
  email: string | null;
  createdAt: string;
};

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
  position,
  size = "md",
}: {
  initials: string;
  src?: string;
  position?: string;
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
        <img
          src={src}
          alt={initials}
          className="w-full h-full object-cover"
          style={{ objectPosition: position }}
        />
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
  const { services } = useStore();
  const today = useMemo(() => startOfDay(new Date()), []);
  const [reservas, setReservas] = useState<ReservaApi[]>([]);
  const [dbClients, setDbClients] = useState<ClienteApi[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/reservas").then((r) => r.json()),
      fetch("/api/clientes").then((r) => r.json()),
    ])
      .then(([reservasData, clientesData]) => {
        if (Array.isArray(reservasData)) setReservas(reservasData);
        if (Array.isArray(clientesData)) setDbClients(clientesData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const todayReservas = useMemo(
    () => reservas.filter((r) => sameDay(new Date(r.data), today)),
    [reservas, today],
  );
  const todayConfirmed = todayReservas.filter(
    (r) => r.status === "CONFIRMADO",
  ).length;

  const monthRevenue = useMemo(() => {
    return reservas
      .filter(
        (r) => r.status === "CONCLUIDO" && sameMonth(new Date(r.data), today),
      )
      .reduce((sum, r) => sum + r.total, 0);
  }, [reservas, today]);

  const prevMonthRevenue = useMemo(() => {
    const prevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    return reservas
      .filter(
        (r) =>
          r.status === "CONCLUIDO" && sameMonth(new Date(r.data), prevMonth),
      )
      .reduce((sum, r) => sum + r.total, 0);
  }, [reservas, today]);

  const revenueChangePercent =
    prevMonthRevenue > 0
      ? Math.round(((monthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100)
      : null;

  const newClientsThisMonth = dbClients.filter((c) =>
    sameMonth(new Date(c.createdAt), today),
  ).length;

  const pendentesHoje = todayReservas.filter(
    (r) => r.status === "PENDENTE",
  ).length;

  const popularServices = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of reservas) {
      if (r.status === "CANCELADO") continue;
      for (const s of r.servicos) {
        counts.set(s.servico.nome, (counts.get(s.servico.nome) ?? 0) + 1);
      }
    }
    const withCounts = services.map((s) => ({
      name: s.name,
      count: counts.get(s.name) ?? 0,
    }));
    const sorted = withCounts.sort((a, b) => b.count - a.count);
    const max = Math.max(1, sorted[0]?.count ?? 0);
    return sorted
      .slice(0, 4)
      .map((s) => ({ ...s, percent: (s.count / max) * 100 }));
  }, [reservas, services]);

  const proximosAgendamentos = useMemo(
    () =>
      todayReservas
        .filter((r) => r.status === "CONFIRMADO" || r.status === "PENDENTE")
        .sort((a, b) => a.horario.localeCompare(b.horario))
        .slice(0, 4),
    [todayReservas],
  );

  return (
    <div className="flex flex-col gap-5 lg:max-w-4xl xl:max-w-7xl lg:mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[#656565] text-sm capitalize">
            {today.toLocaleDateString("pt-BR", {
              weekday: "long",
              day: "2-digit",
              month: "long",
            })}
          </p>
          <h1 className="text-2xl font-bold">Olá, Barber</h1>
        </div>
        <Avatar initials="YV" size="lg" />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="rounded-xl border-2 border-[#F1f1f1] bg-[#FAFAFA] p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#656565] uppercase">
                  Hoje
                </span>
                <CalendarDays className="w-4 h-4 text-[#656565]" />
              </div>
              <p className="text-2xl font-bold">{todayReservas.length}</p>
              <p className="text-xs text-[#656565]">
                {todayConfirmed} confirmados
              </p>
            </div>
            <div className="rounded-xl border-2 border-[#F1f1f1] bg-[#FAFAFA] p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#656565] uppercase">
                  Mês
                </span>
                <TrendingUp className="w-4 h-4 text-[#656565]" />
              </div>
              <p className="text-2xl font-bold">{formatPrice(monthRevenue)}</p>
              <p className="text-xs text-[#656565]">
                {revenueChangePercent === null ? (
                  "sem dados do mês anterior"
                ) : (
                  <span
                    className={
                      revenueChangePercent >= 0
                        ? "text-emerald-600 font-semibold"
                        : "text-red-500 font-semibold"
                    }
                  >
                    {revenueChangePercent >= 0 ? "+" : ""}
                    {revenueChangePercent}% vs mês anterior
                  </span>
                )}
              </p>
            </div>
            <div className="rounded-xl border-2 border-[#F1f1f1] bg-[#FAFAFA] p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#656565] uppercase">
                  Clientes
                </span>
                <Users className="w-4 h-4 text-[#656565]" />
              </div>
              <p className="text-2xl font-bold">{dbClients.length}</p>
              <p className="text-xs text-[#656565]">
                {newClientsThisMonth} novos este mês
              </p>
            </div>
            <div className="rounded-xl border-2 border-[#F1f1f1] bg-[#FAFAFA] p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#656565] uppercase">
                  Pendentes
                </span>
                <AlertCircle className="w-4 h-4 text-[#656565]" />
              </div>
              <p className="text-2xl font-bold">{pendentesHoje}</p>
              <p className="text-xs text-[#656565]">hoje</p>
            </div>
          </div>

          <div className="lg:grid lg:grid-cols-2 lg:gap-6">
            <div>
              <div className="flex items-center justify-between pb-3">
                <h2 className="font-bold">Próximos agendamentos</h2>
              </div>
              <div className="flex flex-col gap-3">
                {proximosAgendamentos.length === 0 && (
                  <p className="text-sm text-[#656565] py-4">
                    Nenhum agendamento para hoje.
                  </p>
                )}
                {proximosAgendamentos.map((apt) => (
                  <div
                    key={apt.id}
                    className="flex items-center gap-3 rounded-xl border-2 border-[#F1f1f1] bg-[#FAFAFA] p-3"
                  >
                    <Avatar initials={getInitials(apt.cliente.nome)} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">
                        {apt.cliente.nome}
                      </p>
                      <p className="text-xs text-[#656565] truncate">
                        {apt.servicos.map((s) => s.servico.nome).join(", ")}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <div className="flex items-center gap-1 text-xs font-semibold text-[#656565]">
                        <Clock className="w-3 h-3" />
                        {apt.horario}
                      </div>
                      <StatusPill status={toAppointmentStatus(apt.status)} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 lg:mt-0">
              <h2 className="font-bold pb-3">Serviços mais populares</h2>
              <div className="flex flex-col gap-2">
                {popularServices.length === 0 && (
                  <p className="text-sm text-[#656565] py-4">
                    Ainda não há serviços registrados.
                  </p>
                )}
                {popularServices.map((s) => (
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
        </>
      )}
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
  cliente: { id: string; nome: string; telefone: string };
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

function sameMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
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
  const { barbers } = useStore();
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
  const [sendingMsg, setSendingMsg] = useState<string | null>(null);
  const [msgFeedback, setMsgFeedback] = useState<Record<string, "ok" | "err">>({});

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
        body: JSON.stringify({
          status,
          ...(status === "CANCELADO" ? { canceladoPor: "barbearia" } : {}),
        }),
      });
    } catch {}
  }

  async function enviarMensagem(reservaId: string, templateId: string) {
    const remetente = barbers[0];
    if (!remetente) return;
    setSendingMsg(`${reservaId}-${templateId}`);
    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservaId, templateId, barbeiroId: remetente.id }),
      });
      setMsgFeedback((prev) => ({ ...prev, [reservaId]: res.ok ? "ok" : "err" }));
      setTimeout(
        () => setMsgFeedback((prev) => { const n = { ...prev }; delete n[reservaId]; return n; }),
        3000,
      );
    } catch {
      setMsgFeedback((prev) => ({ ...prev, [reservaId]: "err" }));
    } finally {
      setSendingMsg(null);
    }
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
                  <div className="flex flex-col gap-2 pt-3 border-t border-[#F1f1f1] mt-auto">
                    <div className="flex gap-2">
                      {status === "pendente" && (
                        <button
                          type="button"
                          onClick={() => updateStatus(apt.id, "CONFIRMADO")}
                          className="flex-1 rounded-full border-2 border-black bg-white py-2 text-sm font-semibold text-black"
                        >
                          Confirmar
                        </button>
                      )}
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
                    <button
                      type="button"
                      disabled={sendingMsg === `${apt.id}-confirmacao`}
                      onClick={() => enviarMensagem(apt.id, "confirmacao")}
                      className="w-full rounded-full border-2 border-[#F1f1f1] bg-white py-2 text-sm font-semibold text-[#25D366] disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      <MessageCircle className="w-4 h-4" />
                      {sendingMsg === `${apt.id}-confirmacao`
                        ? "Enviando..."
                        : msgFeedback[apt.id] === "ok"
                          ? "✓ Mensagem enviada"
                          : msgFeedback[apt.id] === "err"
                            ? "✗ Falha ao enviar"
                            : "Enviar confirmação WhatsApp"}
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
  const [dbClients, setDbClients] = useState<ClienteApi[]>([]);
  const [reservas, setReservas] = useState<ReservaApi[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/clientes").then((r) => r.json()),
      fetch("/api/reservas").then((r) => r.json()),
    ])
      .then(([clientesData, reservasData]) => {
        if (Array.isArray(clientesData)) setDbClients(clientesData);
        if (Array.isArray(reservasData)) setReservas(reservasData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

  const allClients = useMemo(() => {
    return dbClients.map((c) => {
      const clientReservas = [...reservas]
        .filter((r) => r.cliente.id === c.id)
        .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
      const concluidas = clientReservas.filter((r) => r.status === "CONCLUIDO");
      const lastConcluida = concluidas[0];
      return {
        id: c.id,
        name: c.nome,
        initials: getInitials(c.nome),
        phone: c.telefone,
        email: c.email,
        createdAt: c.createdAt,
        reservas: clientReservas,
        lastVisit: lastConcluida
          ? new Date(lastConcluida.data).toLocaleDateString("pt-BR")
          : null,
        totalVisits: concluidas.length,
        totalSpent: formatPrice(
          concluidas.reduce((sum, r) => sum + r.total, 0),
        ),
        isNew: Date.now() - new Date(c.createdAt).getTime() < THIRTY_DAYS_MS,
      };
    });
  }, [dbClients, reservas]);

  const [selectedClientId, setSelectedClientId] = useState<string | null>(
    null,
  );
  const selectedClient =
    allClients.find((c) => c.id === selectedClientId) ?? null;

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

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex flex-col gap-3 lg:grid lg:grid-cols-4 lg:gap-4">
          {filtered.length === 0 && (
            <p className="text-center text-[#656565] py-8 lg:col-span-2">
              Nenhum cliente encontrado.
            </p>
          )}
          {filtered.map((client) => (
            <div
              key={client.id}
              onClick={() => setSelectedClientId(client.id)}
              className="rounded-xl border-2 border-[#F1f1f1] bg-[#FAFAFA] p-4 flex flex-col gap-3 cursor-pointer hover:border-black/20 transition-colors"
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
                  <p className="font-bold text-sm">
                    {client.lastVisit ?? "Nunca"}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <BottomSheet
        open={Boolean(selectedClient)}
        onClose={() => setSelectedClientId(null)}
        title={selectedClient?.name ?? "Cliente"}
      >
        {selectedClient && (
          <>
            <div className="flex items-center gap-3">
              <Avatar initials={selectedClient.initials} size="lg" />
              <div className="min-w-0">
                <p className="font-bold text-lg truncate">
                  {selectedClient.name}
                </p>
                <div className="flex items-center gap-1 text-sm text-[#656565]">
                  <Phone className="w-3.5 h-3.5 shrink-0" />
                  {selectedClient.phone}
                </div>
                {selectedClient.email && (
                  <p className="text-sm text-[#656565] truncate">
                    {selectedClient.email}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-between rounded-xl border-2 border-[#F1f1f1] bg-[#FAFAFA] p-3">
              <div className="text-center flex-1">
                <p className="text-xs text-[#656565]">Visitas</p>
                <p className="font-bold text-sm">
                  {selectedClient.totalVisits}x
                </p>
              </div>
              <div className="text-center flex-1 border-x border-[#F1f1f1]">
                <p className="text-xs text-[#656565]">Total gasto</p>
                <p className="font-bold text-sm">
                  {selectedClient.totalSpent}
                </p>
              </div>
              <div className="text-center flex-1">
                <p className="text-xs text-[#656565]">Última visita</p>
                <p className="font-bold text-sm">
                  {selectedClient.lastVisit ?? "Nunca"}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-[#656565] uppercase pb-2">
                Histórico de agendamentos
              </p>
              {selectedClient.reservas.length === 0 ? (
                <p className="text-sm text-[#656565] py-4 text-center">
                  Nenhum agendamento ainda.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {selectedClient.reservas.map((r) => (
                    <div
                      key={r.id}
                      className="rounded-xl border-2 border-[#F1f1f1] bg-[#FAFAFA] p-3 flex flex-col gap-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-sm">
                          {new Date(r.data).toLocaleDateString("pt-BR")}
                          {r.horario ? ` • ${r.horario}` : ""}
                        </p>
                        <StatusPill status={toAppointmentStatus(r.status)} />
                      </div>
                      <p className="text-xs text-[#656565]">
                        {r.barbeiro.nome} •{" "}
                        {r.servicos.map((s) => s.servico.nome).join(", ")}
                      </p>
                      <p className="text-sm font-bold">
                        {formatPrice(r.total)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </BottomSheet>
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

type PerfilData = {
  nomeBarbearia: string;
  endereco: string;
  telefone: string;
  barbeiroNome: string;
  barbeiroDescricao: string;
  barbeiroFoto: string;
  capaFoto: string;
  capaFotoPosicao: string;
  capaFotoDesktop: string;
  capaFotoPosicaoDesktop: string;
};

const DEFAULT_PERFIL: PerfilData = {
  nomeBarbearia: "",
  endereco: "",
  telefone: "",
  barbeiroNome: "",
  barbeiroDescricao: "",
  barbeiroFoto: "",
  capaFoto: "",
  capaFotoPosicao: "50% 50%",
  capaFotoDesktop: "",
  capaFotoPosicaoDesktop: "50% 50%",
};

function Config() {
  const { services, setServices, barbers, setBarbers } = useStore();

  const [perfil, setPerfil] = useState<PerfilData>(DEFAULT_PERFIL);

  useEffect(() => {
    fetch("/api/perfil")
      .then((r) => r.json())
      .then((data) =>
        setPerfil({
          nomeBarbearia: data.nomeBarbearia ?? DEFAULT_PERFIL.nomeBarbearia,
          endereco: data.endereco ?? "",
          telefone: data.telefone ?? "",
          barbeiroNome: data.barbeiroNome ?? DEFAULT_PERFIL.barbeiroNome,
          barbeiroDescricao: data.barbeiroDescricao ?? "",
          barbeiroFoto: data.barbeiroFoto ?? "",
          capaFoto: data.capaFoto ?? "",
          capaFotoPosicao: data.capaFotoPosicao ?? "50% 50%",
          capaFotoDesktop: data.capaFotoDesktop ?? "",
          capaFotoPosicaoDesktop: data.capaFotoPosicaoDesktop ?? "50% 50%",
        }),
      )
      .catch(() => {});
  }, []);

  async function savePerfil(next: PerfilData) {
    setPerfil(next);
    try {
      await fetch("/api/perfil", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
    } catch {}
  }

  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    nome: "",
    descricao: "",
    foto: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingProfile, setUploadingProfile] = useState(false);

  function openEditProfile() {
    setProfileForm({
      nome: perfil.barbeiroNome,
      descricao: perfil.barbeiroDescricao,
      foto: perfil.barbeiroFoto,
    });
    setProfileModalOpen(true);
  }

  async function saveProfile() {
    if (!profileForm.nome.trim()) return;
    setSavingProfile(true);
    await savePerfil({
      ...perfil,
      barbeiroNome: profileForm.nome.trim(),
      barbeiroDescricao: profileForm.descricao.trim(),
      barbeiroFoto: profileForm.foto,
    });
    setSavingProfile(false);
    setProfileModalOpen(false);
  }

  const [capaModalOpen, setCapaModalOpen] = useState(false);
  const [capaTab, setCapaTab] = useState<"mobile" | "desktop">("mobile");
  const [capaForm, setCapaForm] = useState({
    foto: "",
    fotoPosicao: "50% 50%",
    fotoDesktop: "",
    fotoPosicaoDesktop: "50% 50%",
  });
  const [savingCapa, setSavingCapa] = useState(false);
  const [uploadingCapaMobile, setUploadingCapaMobile] = useState(false);
  const [uploadingCapaDesktop, setUploadingCapaDesktop] = useState(false);

  function openEditCapa() {
    setCapaForm({
      foto: perfil.capaFoto,
      fotoPosicao: perfil.capaFotoPosicao || "50% 50%",
      fotoDesktop: perfil.capaFotoDesktop,
      fotoPosicaoDesktop: perfil.capaFotoPosicaoDesktop || "50% 50%",
    });
    setCapaTab("mobile");
    setCapaModalOpen(true);
  }

  async function saveCapa() {
    setSavingCapa(true);
    await savePerfil({
      ...perfil,
      capaFoto: capaForm.foto,
      capaFotoPosicao: capaForm.foto ? capaForm.fotoPosicao : "50% 50%",
      capaFotoDesktop: capaForm.fotoDesktop,
      capaFotoPosicaoDesktop: capaForm.fotoDesktop
        ? capaForm.fotoPosicaoDesktop
        : "50% 50%",
    });
    setSavingCapa(false);
    setCapaModalOpen(false);
  }

  const [barbeariaModalOpen, setBarbeariaModalOpen] = useState(false);
  const [barbeariaForm, setBarbeariaForm] = useState({
    nome: "",
    endereco: "",
    telefone: "",
  });
  const [savingBarbearia, setSavingBarbearia] = useState(false);

  function openEditBarbearia() {
    setBarbeariaForm({
      nome: perfil.nomeBarbearia,
      endereco: perfil.endereco,
      telefone: perfil.telefone,
    });
    setBarbeariaModalOpen(true);
  }

  async function saveBarbearia() {
    if (!barbeariaForm.nome.trim()) return;
    setSavingBarbearia(true);
    await savePerfil({
      ...perfil,
      nomeBarbearia: barbeariaForm.nome.trim(),
      endereco: barbeariaForm.endereco.trim(),
      telefone: barbeariaForm.telefone.trim(),
    });
    setSavingBarbearia(false);
    setBarbeariaModalOpen(false);
  }

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

  type DiaPersonalizado = {
    diaSemana: number;
    horaInicio: string;
    horaFim: string;
    pausaAtiva: boolean;
    pausaInicio: string | null;
    pausaFim: string | null;
  };

  const [diasPersonalizados, setDiasPersonalizados] = useState<
    Record<number, DiaPersonalizado>
  >({});

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

  const [personalizarModalOpen, setPersonalizarModalOpen] = useState(false);
  const [personalizarDia, setPersonalizarDia] = useState<number | null>(null);
  const [personalizarForm, setPersonalizarForm] = useState({
    horaInicio: "08:00",
    horaFim: "19:00",
    pausaAtiva: false,
    pausaInicio: "12:00",
    pausaFim: "13:00",
  });
  const [savingPersonalizado, setSavingPersonalizado] = useState(false);

  function openPersonalizar() {
    setPersonalizarDia(null);
    setPersonalizarModalOpen(true);
  }

  function selectPersonalizarDia(dia: number) {
    setPersonalizarDia(dia);
    const existing = diasPersonalizados[dia];
    setPersonalizarForm({
      horaInicio: existing?.horaInicio ?? horario.horaInicio,
      horaFim: existing?.horaFim ?? horario.horaFim,
      pausaAtiva: existing?.pausaAtiva ?? horario.pausaAtiva,
      pausaInicio: existing?.pausaInicio ?? horario.pausaInicio,
      pausaFim: existing?.pausaFim ?? horario.pausaFim,
    });
  }

  async function savePersonalizado() {
    if (personalizarDia === null) return;
    setSavingPersonalizado(true);
    try {
      const res = await fetch("/api/configuracao-horario/dias", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          diaSemana: personalizarDia,
          horaInicio: personalizarForm.horaInicio,
          horaFim: personalizarForm.horaFim,
          pausaAtiva: personalizarForm.pausaAtiva,
          pausaInicio: personalizarForm.pausaAtiva
            ? personalizarForm.pausaInicio
            : null,
          pausaFim: personalizarForm.pausaAtiva
            ? personalizarForm.pausaFim
            : null,
        }),
      });
      const saved: DiaPersonalizado = await res.json();
      setDiasPersonalizados((prev) => ({ ...prev, [personalizarDia]: saved }));
      setPersonalizarModalOpen(false);
      setPersonalizarDia(null);
    } catch {}
    setSavingPersonalizado(false);
  }

  async function removePersonalizado() {
    if (personalizarDia === null) return;
    setSavingPersonalizado(true);
    try {
      await fetch(
        `/api/configuracao-horario/dias?diaSemana=${personalizarDia}`,
        { method: "DELETE" },
      );
      setDiasPersonalizados((prev) => {
        const next = { ...prev };
        delete next[personalizarDia];
        return next;
      });
      setPersonalizarModalOpen(false);
      setPersonalizarDia(null);
    } catch {}
    setSavingPersonalizado(false);
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
    photoPosition: "50% 50%",
  });

  const [barberModal, setBarberModal] = useState<{
    open: boolean;
    editing: Barber | null;
  }>({ open: false, editing: null });
  const [barberForm, setBarberForm] = useState({
    name: "",
    description: "",
    serviceIds: [] as string[],
    photo: "",
    photoPosition: "50% 50%",
  });
  const [savingBarber, setSavingBarber] = useState(false);
  const [savingService, setSavingService] = useState(false);
  const [uploadingService, setUploadingService] = useState(false);
  const [uploadingBarber, setUploadingBarber] = useState(false);

  function openAddService() {
    setServiceForm({
      name: "",
      description: "",
      duration: 30,
      price: "",
      photo: "",
      photoPosition: "50% 50%",
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
      photoPosition: s.photoPosition ?? "50% 50%",
    });
    setServiceModal({ open: true, editing: s });
  }

  async function saveService() {
    if (!serviceForm.name.trim()) return;
    const price = parseFloat(serviceForm.price.replace(",", ".")) || 0;
    setSavingService(true);
    try {
      const editingId = serviceModal.editing?.id;
      const isPlaceholder = editingId?.startsWith("default-");
      if (editingId && !isPlaceholder) {
        const res = await fetch(`/api/servicos/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nome: serviceForm.name.trim(),
            descricao: serviceForm.description.trim(),
            preco: price,
            duracao: serviceForm.duration,
            foto: serviceForm.photo,
            fotoPosicao: serviceForm.photo ? serviceForm.photoPosition : null,
          }),
        });
        if (!res.ok) throw new Error("Falha ao salvar serviço");
        setServices((prev) =>
          prev.map((s) =>
            s.id === editingId
              ? {
                  ...s,
                  name: serviceForm.name.trim(),
                  description: serviceForm.description.trim(),
                  duration: serviceForm.duration,
                  price,
                  photo: serviceForm.photo || undefined,
                  photoPosition: serviceForm.photo
                    ? serviceForm.photoPosition
                    : undefined,
                }
              : s,
          ),
        );
      } else {
        // No real DB record yet — either adding a new service, or editing
        // one of the client-side placeholders shown when the list is empty.
        const res = await fetch("/api/servicos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nome: serviceForm.name.trim(),
            descricao: serviceForm.description.trim(),
            preco: price,
            duracao: serviceForm.duration,
            foto: serviceForm.photo,
            fotoPosicao: serviceForm.photo ? serviceForm.photoPosition : null,
          }),
        });
        if (!res.ok) throw new Error("Falha ao criar serviço");
        const created = await res.json();
        setServices((prev) => [
          ...prev.filter((s) => s.id !== editingId),
          {
            id: created.id,
            name: serviceForm.name.trim(),
            description: serviceForm.description.trim(),
            duration: serviceForm.duration,
            price,
            photo: serviceForm.photo || undefined,
            photoPosition: serviceForm.photo
              ? serviceForm.photoPosition
              : undefined,
          },
        ]);
        if (editingId) {
          setBarbers((prev) =>
            prev.map((b) =>
              b.serviceIds.includes(editingId)
                ? {
                    ...b,
                    serviceIds: [
                      ...b.serviceIds.filter((sid) => sid !== editingId),
                      created.id,
                    ],
                  }
                : b,
            ),
          );
        }
      }
      setServiceModal({ open: false, editing: null });
    } catch {}
    setSavingService(false);
  }

  async function deleteService(id: string) {
    setServices((prev) => prev.filter((s) => s.id !== id));
    setBarbers((prev) =>
      prev.map((b) => ({
        ...b,
        serviceIds: b.serviceIds.filter((sid) => sid !== id),
      })),
    );
    if (id.startsWith("default-")) return;
    try {
      await fetch(`/api/servicos/${id}`, { method: "DELETE" });
    } catch {}
  }

  function openAddBarber() {
    setBarberForm({
      name: "",
      description: "",
      serviceIds: [],
      photo: "",
      photoPosition: "50% 50%",
    });
    setBarberModal({ open: true, editing: null });
  }

  function openEditBarber(b: Barber) {
    setBarberForm({
      name: b.name,
      description: b.description,
      serviceIds: b.serviceIds,
      photo: b.photo ?? "",
      photoPosition: b.photoPosition ?? "50% 50%",
    });
    setBarberModal({ open: true, editing: b });
  }

  function toggleBarberService(sid: string) {
    setBarberForm((prev) => ({
      ...prev,
      serviceIds: prev.serviceIds.includes(sid)
        ? prev.serviceIds.filter((id) => id !== sid)
        : [...prev.serviceIds, sid],
    }));
  }

  async function saveBarber() {
    if (!barberForm.name.trim()) return;
    setSavingBarber(true);
    try {
      // Serviços que ainda são placeholders locais (nunca salvos no banco)
      // não têm um registro real para vincular — não enviamos esses ids.
      const serviceIds = barberForm.serviceIds.filter(
        (id) => !id.startsWith("default-"),
      );
      const editingId = barberModal.editing?.id;
      const isPlaceholder = editingId?.startsWith("default-");
      if (editingId && !isPlaceholder) {
        const res = await fetch(`/api/barbeiros/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nome: barberForm.name.trim(),
            descricao: barberForm.description.trim(),
            foto: barberForm.photo,
            fotoPosicao: barberForm.photo ? barberForm.photoPosition : null,
            serviceIds,
          }),
        });
        if (!res.ok) throw new Error("Falha ao salvar barbeiro");
        setBarbers((prev) =>
          prev.map((b) =>
            b.id === editingId
              ? {
                  ...b,
                  name: barberForm.name.trim(),
                  initials: getInitials(barberForm.name),
                  description: barberForm.description.trim(),
                  serviceIds: barberForm.serviceIds,
                  photo: barberForm.photo || undefined,
                  photoPosition: barberForm.photo
                    ? barberForm.photoPosition
                    : undefined,
                }
              : b,
          ),
        );
      } else {
        // No real DB record yet — either adding a new barber, or editing
        // the client-side placeholder shown when the team is empty.
        const res = await fetch("/api/barbeiros", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nome: barberForm.name.trim(),
            descricao: barberForm.description.trim(),
            foto: barberForm.photo,
            fotoPosicao: barberForm.photo ? barberForm.photoPosition : null,
            serviceIds,
          }),
        });
        if (!res.ok) throw new Error("Falha ao criar barbeiro");
        const created = await res.json();
        setBarbers((prev) => [
          ...prev.filter((b) => b.id !== editingId),
          {
            id: created.id,
            name: barberForm.name.trim(),
            initials: getInitials(barberForm.name),
            description: barberForm.description.trim(),
            serviceIds: barberForm.serviceIds,
            photo: barberForm.photo || undefined,
            photoPosition: barberForm.photo
              ? barberForm.photoPosition
              : undefined,
          },
        ]);
      }
      setBarberModal({ open: false, editing: null });
    } catch {}
    setSavingBarber(false);
  }

  async function deleteBarber(id: string) {
    setBarbers((prev) => prev.filter((b) => b.id !== id));
    if (id.startsWith("default-")) return;
    try {
      await fetch(`/api/barbeiros/${id}`, { method: "DELETE" });
    } catch {}
  }

  return (
    <div className="flex flex-col gap-5 lg:max-w-4xl xl:max-w-7xl lg:mx-auto">
      <h1 className="text-2xl font-bold">Configurações</h1>

      <div className="flex flex-col items-center gap-3 py-4">
        <Avatar
          initials={getInitials(perfil.barbeiroNome)}
          src={perfil.barbeiroFoto || undefined}
          size="lg"
        />
        <div className="text-center">
          <p className="font-bold text-lg">{perfil.barbeiroNome}</p>
          <p className="text-sm text-[#656565]">
            {perfil.barbeiroDescricao || "Barbeiro profissional"}
          </p>
        </div>
        <button
          type="button"
          onClick={openEditProfile}
          className="rounded-full border-2 border-[#F1f1f1] bg-[#FAFAFA] px-5 py-2 text-sm font-semibold"
        >
          Editar perfil
        </button>
      </div>

      {/* Foto de capa */}
      <div>
        <p className="text-xs font-semibold text-[#656565] uppercase pb-2">
          Foto de capa
        </p>
        <button
          type="button"
          onClick={openEditCapa}
          className="relative w-full h-32 rounded-xl border-2 border-[#F1f1f1] bg-[#505050] overflow-hidden flex items-center justify-center"
        >
          {perfil.capaFoto ? (
            <img
              src={perfil.capaFoto}
              alt="Capa"
              className="w-full h-full object-cover"
              style={{ objectPosition: perfil.capaFotoPosicao }}
            />
          ) : (
            <Camera className="w-7 h-7 text-white/70" />
          )}
          <span className="absolute bottom-2 right-2 rounded-full bg-black/70 text-white text-xs font-semibold px-3 py-1.5">
            Editar
          </span>
        </button>
      </div>

      {/* Barbearia */}
      <div>
        <p className="text-xs font-semibold text-[#656565] uppercase pb-2">
          Barbearia
        </p>
        <div className="rounded-xl border-2 border-[#F1f1f1] bg-[#FAFAFA] overflow-hidden">
          {[
            { label: "Nome da barbearia", value: perfil.nomeBarbearia },
            { label: "Endereço", value: perfil.endereco || "Não informado" },
            { label: "Telefone", value: perfil.telefone || "Não informado" },
          ].map((item, i, arr) => (
            <button
              type="button"
              key={item.label}
              onClick={openEditBarbearia}
              className={[
                "w-full flex items-center justify-between px-4 py-3.5 text-left",
                i < arr.length - 1 ? "border-b border-[#F1f1f1]" : "",
              ].join(" ")}
            >
              <p className="font-semibold text-sm">{item.label}</p>
              <div className="flex items-center gap-2">
                <p className="text-sm text-[#656565]">{item.value}</p>
                <ChevronRight className="w-4 h-4 text-[#656565]" />
              </div>
            </button>
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
                const personalizado = Boolean(diasPersonalizados[dia]);
                return (
                  <button
                    key={dia}
                    type="button"
                    onClick={() => toggleDiaFuncionamento(dia)}
                    className={[
                      "w-9 h-9 rounded-full text-xs font-bold shrink-0 border-2 transition-colors",
                      personalizado
                        ? "bg-yellow-400 text-black border-yellow-400"
                        : active
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
              onClick={openPersonalizar}
              className="w-full rounded-full bg-white text-black/90 border-[#cccccc]/90 border py-3 text-sm font-semibold flex items-center justify-center gap-2"
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
                    style={{ objectPosition: s.photoPosition }}
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
                <Avatar
                  initials={b.initials}
                  src={b.photo}
                  position={b.photoPosition}
                />
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
            disabled={
              !serviceForm.name.trim() || savingService || uploadingService
            }
            className="w-full rounded-full bg-black text-white py-3.5 text-sm font-semibold disabled:opacity-40"
          >
            {savingService ? "Salvando..." : "Finalizar"}
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
                  style={{ objectPosition: serviceForm.photoPosition }}
                />
              ) : (
                <Camera className="w-7 h-7 text-[#999]" />
              )}
              {uploadingService && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-black" />
                </div>
              )}
            </div>
            <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-black border-2 border-white flex items-center justify-center">
              <Plus className="w-3 h-3 text-white" />
            </div>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setUploadingService(true);
                try {
                  const url = await uploadPhoto(file);
                  setServiceForm((p) => ({
                    ...p,
                    photo: url,
                    photoPosition: "50% 50%",
                  }));
                } catch {
                } finally {
                  setUploadingService(false);
                }
              }}
            />
          </label>
        </div>
        {serviceForm.photo && (
          <FocalPointPicker
            src={serviceForm.photo}
            value={serviceForm.photoPosition}
            onChange={(v) =>
              setServiceForm((p) => ({ ...p, photoPosition: v }))
            }
          />
        )}
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
            disabled={
              !barberForm.name.trim() || savingBarber || uploadingBarber
            }
            className="w-full rounded-full bg-black text-white py-3.5 text-sm font-semibold disabled:opacity-40"
          >
            {savingBarber ? "Salvando..." : "Finalizar"}
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
                  style={{ objectPosition: barberForm.photoPosition }}
                />
              ) : (
                <Camera className="w-7 h-7 text-[#999]" />
              )}
              {uploadingBarber && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-full">
                  <Loader2 className="w-5 h-5 animate-spin text-black" />
                </div>
              )}
            </div>
            <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-black border-2 border-white flex items-center justify-center">
              <Plus className="w-3 h-3 text-white" />
            </div>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setUploadingBarber(true);
                try {
                  const url = await uploadPhoto(file);
                  setBarberForm((p) => ({
                    ...p,
                    photo: url,
                    photoPosition: "50% 50%",
                  }));
                } catch {
                } finally {
                  setUploadingBarber(false);
                }
              }}
            />
          </label>
        </div>
        {barberForm.photo && (
          <FocalPointPicker
            src={barberForm.photo}
            value={barberForm.photoPosition}
            onChange={(v) => setBarberForm((p) => ({ ...p, photoPosition: v }))}
          />
        )}
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

      {/* Modal: Perfil do barbeiro */}
      <BottomSheet
        open={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        title="Editar perfil"
        footer={
          <button
            type="button"
            onClick={saveProfile}
            disabled={
              !profileForm.nome.trim() || savingProfile || uploadingProfile
            }
            className="w-full rounded-full bg-black text-white py-3.5 text-sm font-semibold disabled:opacity-40"
          >
            {savingProfile ? "Salvando..." : "Salvar"}
          </button>
        }
      >
        <div className="flex justify-center pb-1">
          <label className="relative cursor-pointer">
            <div className="w-20 h-20 rounded-full bg-[#F1f1f1] border-2 border-[#E0E0E0] overflow-hidden flex items-center justify-center">
              {profileForm.foto ? (
                <img
                  src={profileForm.foto}
                  alt="foto"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Camera className="w-7 h-7 text-[#999]" />
              )}
              {uploadingProfile && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-full">
                  <Loader2 className="w-5 h-5 animate-spin text-black" />
                </div>
              )}
            </div>
            <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-black border-2 border-white flex items-center justify-center">
              <Plus className="w-3 h-3 text-white" />
            </div>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setUploadingProfile(true);
                try {
                  const url = await uploadPhoto(file);
                  setProfileForm((p) => ({ ...p, foto: url }));
                } catch {
                } finally {
                  setUploadingProfile(false);
                }
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
            value={profileForm.nome}
            onChange={(e) =>
              setProfileForm((p) => ({ ...p, nome: e.target.value }))
            }
            placeholder="Ex: Fabio"
            className="w-full rounded-xl border-2 border-[#F1f1f1] bg-[#FAFAFA] px-4 py-3 text-sm focus:outline-none focus:border-black"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-[#656565] uppercase block pb-1">
            Descrição
          </label>
          <input
            type="text"
            value={profileForm.descricao}
            onChange={(e) =>
              setProfileForm((p) => ({ ...p, descricao: e.target.value }))
            }
            placeholder="Ex: Barbeiro profissional"
            className="w-full rounded-xl border-2 border-[#F1f1f1] bg-[#FAFAFA] px-4 py-3 text-sm focus:outline-none focus:border-black"
          />
        </div>
      </BottomSheet>

      {/* Modal: Foto de capa */}
      <BottomSheet
        open={capaModalOpen}
        onClose={() => setCapaModalOpen(false)}
        title="Foto de capa"
        footer={
          <button
            type="button"
            onClick={saveCapa}
            disabled={savingCapa || uploadingCapaMobile || uploadingCapaDesktop}
            className="w-full rounded-full bg-black text-white py-3.5 text-sm font-semibold disabled:opacity-40"
          >
            {savingCapa ? "Salvando..." : "Salvar"}
          </button>
        }
      >
        <div className="flex gap-2 rounded-full border-2 border-[#F1f1f1] p-1 self-start">
          <button
            type="button"
            onClick={() => setCapaTab("mobile")}
            className={[
              "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
              capaTab === "mobile" ? "bg-black text-white" : "text-[#656565]",
            ].join(" ")}
          >
            Celular
          </button>
          <button
            type="button"
            onClick={() => setCapaTab("desktop")}
            className={[
              "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
              capaTab === "desktop" ? "bg-black text-white" : "text-[#656565]",
            ].join(" ")}
          >
            Computador
          </button>
        </div>

        {capaTab === "mobile" ? (
          <>
            <label className="relative cursor-pointer block">
              <div className="w-full h-32 rounded-xl bg-[#F1f1f1] border-2 border-[#E0E0E0] overflow-hidden flex items-center justify-center">
                {capaForm.foto ? (
                  <img
                    src={capaForm.foto}
                    alt="Capa (celular)"
                    className="w-full h-full object-cover"
                    style={{ objectPosition: capaForm.fotoPosicao }}
                  />
                ) : (
                  <Camera className="w-7 h-7 text-[#999]" />
                )}
                {uploadingCapaMobile && (
                  <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 animate-spin text-black" />
                  </div>
                )}
              </div>
              <div className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-black border-2 border-white flex items-center justify-center">
                <Plus className="w-4 h-4 text-white" />
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setUploadingCapaMobile(true);
                  try {
                    const url = await uploadPhoto(file);
                    setCapaForm((p) => ({
                      ...p,
                      foto: url,
                      fotoPosicao: "50% 50%",
                    }));
                  } catch {
                  } finally {
                    setUploadingCapaMobile(false);
                  }
                }}
              />
            </label>
            {capaForm.foto && (
              <FocalPointPicker
                key="mobile"
                src={capaForm.foto}
                value={capaForm.fotoPosicao}
                onChange={(v) =>
                  setCapaForm((p) => ({ ...p, fotoPosicao: v }))
                }
                aspectRatio="390 / 340"
                label="Destaque no celular"
              />
            )}
          </>
        ) : (
          <>
            <label className="relative cursor-pointer block">
              <div className="w-full h-32 rounded-xl bg-[#F1f1f1] border-2 border-[#E0E0E0] overflow-hidden flex items-center justify-center">
                {capaForm.fotoDesktop || capaForm.foto ? (
                  <img
                    src={capaForm.fotoDesktop || capaForm.foto}
                    alt="Capa (computador)"
                    className="w-full h-full object-cover"
                    style={{ objectPosition: capaForm.fotoPosicaoDesktop }}
                  />
                ) : (
                  <Camera className="w-7 h-7 text-[#999]" />
                )}
                {uploadingCapaDesktop && (
                  <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 animate-spin text-black" />
                  </div>
                )}
              </div>
              <div className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-black border-2 border-white flex items-center justify-center">
                <Plus className="w-4 h-4 text-white" />
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setUploadingCapaDesktop(true);
                  try {
                    const url = await uploadPhoto(file);
                    setCapaForm((p) => ({
                      ...p,
                      fotoDesktop: url,
                      fotoPosicaoDesktop: "50% 50%",
                    }));
                  } catch {
                  } finally {
                    setUploadingCapaDesktop(false);
                  }
                }}
              />
            </label>
            {!capaForm.fotoDesktop && capaForm.foto && (
              <p className="text-[11px] text-[#999]">
                Usando a mesma foto do celular. Envie uma foto para usar
                só no computador.
              </p>
            )}
            {capaForm.fotoDesktop && (
              <button
                type="button"
                onClick={() =>
                  setCapaForm((p) => ({
                    ...p,
                    fotoDesktop: "",
                    fotoPosicaoDesktop: "50% 50%",
                  }))
                }
                className="self-start text-xs font-semibold text-[#656565] underline"
              >
                Usar a mesma foto do celular
              </button>
            )}
            {(capaForm.fotoDesktop || capaForm.foto) && (
              <FocalPointPicker
                key="desktop"
                src={capaForm.fotoDesktop || capaForm.foto}
                value={capaForm.fotoPosicaoDesktop}
                onChange={(v) =>
                  setCapaForm((p) => ({ ...p, fotoPosicaoDesktop: v }))
                }
                aspectRatio="1440 / 430"
                label="Destaque no computador"
              />
            )}
          </>
        )}
      </BottomSheet>

      {/* Modal: Barbearia */}
      <BottomSheet
        open={barbeariaModalOpen}
        onClose={() => setBarbeariaModalOpen(false)}
        title="Editar barbearia"
        footer={
          <button
            type="button"
            onClick={saveBarbearia}
            disabled={!barbeariaForm.nome.trim() || savingBarbearia}
            className="w-full rounded-full bg-black text-white py-3.5 text-sm font-semibold disabled:opacity-40"
          >
            {savingBarbearia ? "Salvando..." : "Salvar"}
          </button>
        }
      >
        <div>
          <label className="text-xs font-semibold text-[#656565] uppercase block pb-1">
            Nome da barbearia
          </label>
          <input
            type="text"
            value={barbeariaForm.nome}
            onChange={(e) =>
              setBarbeariaForm((p) => ({ ...p, nome: e.target.value }))
            }
            placeholder="Ex: Fabio Barber"
            className="w-full rounded-xl border-2 border-[#F1f1f1] bg-[#FAFAFA] px-4 py-3 text-sm focus:outline-none focus:border-black"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-[#656565] uppercase block pb-1">
            Endereço
          </label>
          <input
            type="text"
            value={barbeariaForm.endereco}
            onChange={(e) =>
              setBarbeariaForm((p) => ({ ...p, endereco: e.target.value }))
            }
            placeholder="Ex: Av. São Sebastião, 357"
            className="w-full rounded-xl border-2 border-[#F1f1f1] bg-[#FAFAFA] px-4 py-3 text-sm focus:outline-none focus:border-black"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-[#656565] uppercase block pb-1">
            Telefone
          </label>
          <input
            type="text"
            value={barbeariaForm.telefone}
            onChange={(e) =>
              setBarbeariaForm((p) => ({ ...p, telefone: e.target.value }))
            }
            placeholder="Ex: (11) 99999-0000"
            className="w-full rounded-xl border-2 border-[#F1f1f1] bg-[#FAFAFA] px-4 py-3 text-sm focus:outline-none focus:border-black"
          />
        </div>
      </BottomSheet>

      {/* Modal: Personalizar dia */}
      <BottomSheet
        open={personalizarModalOpen}
        onClose={() => setPersonalizarModalOpen(false)}
        title="Personalizar dia"
        footer={
          personalizarDia !== null ? (
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={savePersonalizado}
                disabled={savingPersonalizado}
                className="w-full rounded-full bg-black text-white py-3.5 text-sm font-semibold disabled:opacity-40"
              >
                {savingPersonalizado ? "Salvando..." : "Salvar horário do dia"}
              </button>
              {diasPersonalizados[personalizarDia] && (
                <button
                  type="button"
                  onClick={removePersonalizado}
                  disabled={savingPersonalizado}
                  className="w-full rounded-full bg-white border-2 border-[#F1f1f1] text-red-500 py-3 text-sm font-semibold disabled:opacity-40"
                >
                  Restaurar horário padrão
                </button>
              )}
            </div>
          ) : undefined
        }
      >
        <div>
          <label className="text-xs font-semibold text-[#656565] uppercase block pb-2">
            Escolha o dia
          </label>
          <div className="flex gap-1.5">
            {["D", "S", "T", "Q", "Q", "S", "S"].map((letra, dia) => {
              const isSelected = personalizarDia === dia;
              const personalizado = Boolean(diasPersonalizados[dia]);
              return (
                <button
                  key={dia}
                  type="button"
                  onClick={() => selectPersonalizarDia(dia)}
                  className={[
                    "w-9 h-9 rounded-full text-xs font-bold shrink-0 border-2 transition-colors",
                    isSelected
                      ? "bg-yellow-400 text-black border-yellow-400"
                      : personalizado
                        ? "bg-yellow-100 text-black border-yellow-300"
                        : "bg-white text-[#656565] border-[#F1f1f1]",
                  ].join(" ")}
                >
                  {letra}
                </button>
              );
            })}
          </div>
        </div>

        {personalizarDia !== null && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-[#656565] uppercase block pb-1">
                  Abre às
                </label>
                <input
                  type="time"
                  value={personalizarForm.horaInicio}
                  onChange={(e) =>
                    setPersonalizarForm((p) => ({
                      ...p,
                      horaInicio: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl border-2 border-[#F1f1f1] bg-[#FAFAFA] px-4 py-3 text-sm focus:outline-none focus:border-black"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#656565] uppercase block pb-1">
                  Fecha às
                </label>
                <input
                  type="time"
                  value={personalizarForm.horaFim}
                  onChange={(e) =>
                    setPersonalizarForm((p) => ({
                      ...p,
                      horaFim: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl border-2 border-[#F1f1f1] bg-[#FAFAFA] px-4 py-3 text-sm focus:outline-none focus:border-black"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-[#F1f1f1]">
              <div>
                <p className="font-semibold text-sm">Pausa no meio do dia</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setPersonalizarForm((p) => ({
                    ...p,
                    pausaAtiva: !p.pausaAtiva,
                  }))
                }
              >
                {personalizarForm.pausaAtiva ? (
                  <ToggleRight className="w-7 h-7 text-black" />
                ) : (
                  <ToggleLeft className="w-7 h-7 text-[#656565]" />
                )}
              </button>
            </div>

            {personalizarForm.pausaAtiva && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#656565] uppercase block pb-1">
                    Pausa de
                  </label>
                  <input
                    type="time"
                    value={personalizarForm.pausaInicio}
                    onChange={(e) =>
                      setPersonalizarForm((p) => ({
                        ...p,
                        pausaInicio: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border-2 border-[#F1f1f1] bg-[#FAFAFA] px-4 py-3 text-sm focus:outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#656565] uppercase block pb-1">
                    Até
                  </label>
                  <input
                    type="time"
                    value={personalizarForm.pausaFim}
                    onChange={(e) =>
                      setPersonalizarForm((p) => ({
                        ...p,
                        pausaFim: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border-2 border-[#F1f1f1] bg-[#FAFAFA] px-4 py-3 text-sm focus:outline-none focus:border-black"
                  />
                </div>
              </div>
            )}
          </>
        )}
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
    desc: "Visitou a página do Fabio",
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
    desc: "Visitou a página do Fabio",
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

type WhatsappSection = "conexoes" | "equipe" | "templates" | "notificacoes";

const whatsappSections: Array<{
  value: WhatsappSection;
  label: string;
  icon: React.ReactNode;
}> = [
  {
    value: "conexoes",
    label: "Conexões",
    icon: <QrCode className="w-4 h-4" />,
  },
  {
    value: "equipe",
    label: "Configurações de Equipe",
    icon: <UserCog className="w-4 h-4" />,
  },
  {
    value: "templates",
    label: "Templates",
    icon: <FileText className="w-4 h-4" />,
  },
  {
    value: "notificacoes",
    label: "Notificações",
    icon: <Bell className="w-4 h-4" />,
  },
];

type WhatsappStatusResponse = {
  started: boolean;
  status: "connecting" | "open" | "close";
  hasQr: boolean;
  phone: string | null;
  offline?: boolean;
};

const DEFAULT_WHATSAPP_STATUS: WhatsappStatusResponse = {
  started: false,
  status: "close",
  hasQr: false,
  phone: null,
};

function formatWhatsappPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length <= 11) return `+${digits}`;
  return `+${digits.slice(0, 2)} ${digits.slice(2)}`;
}

// Cada barbeiro conecta seu próprio número — uma instância do WhatsApp por
// barbeiro, cada uma com seu ciclo de conectar/QR/desconectar independente.
function WhatsappConexoes() {
  const { barbers } = useStore();
  const realBarbers = barbers.filter((b) => !b.id.startsWith("default-"));

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-[#656565]">
        Conecte o WhatsApp principal da barbearia e o de cada barbeiro da
        equipe.
      </p>
      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-2 lg:gap-4">
        <WhatsappInstanceCard
          instanceId="barbearia"
          name="Barbearia"
          icon={
            <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center shrink-0">
              <Store className="w-4 h-4" />
            </div>
          }
        />
        {realBarbers.map((b) => (
          <WhatsappInstanceCard
            key={b.id}
            instanceId={b.id}
            name={b.name}
            icon={
              <Avatar
                initials={b.initials}
                src={b.photo}
                position={b.photoPosition}
                size="sm"
              />
            }
          />
        ))}
      </div>
      {realBarbers.length === 0 && (
        <p className="text-center text-[#656565] py-2">
          Cadastre um barbeiro em Config para conectar o WhatsApp dele
          também.
        </p>
      )}
    </div>
  );
}

function WhatsappInstanceCard({
  instanceId,
  name,
  icon,
}: {
  instanceId: string;
  name: string;
  icon: React.ReactNode;
}) {
  const [data, setData] = useState<WhatsappStatusResponse>(
    DEFAULT_WHATSAPP_STATUS,
  );
  const [qrTick, setQrTick] = useState(0);
  const [connecting, setConnecting] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [connectMode, setConnectMode] = useState<"qr" | "phone">("qr");
  const [phoneInput, setPhoneInput] = useState("");
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [pairingLoading, setPairingLoading] = useState(false);
  const [pairingError, setPairingError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch(`/api/whatsapp/${instanceId}/status`, {
          cache: "no-store",
        });
        const json: WhatsappStatusResponse = await res.json();
        if (cancelled) return;
        setData(json);
        setQrTick((t) => t + 1);
        if (json.status === "open") setPairingCode(null);
      } catch {
        if (!cancelled) setData({ ...DEFAULT_WHATSAPP_STATUS, offline: true });
      }
    }

    poll();
    const interval = setInterval(poll, 4000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [instanceId]);

  async function handleConnect() {
    setConnecting(true);
    try {
      await fetch(`/api/whatsapp/${instanceId}/connect`, { method: "POST" });
    } catch {}
    setConnecting(false);
  }

  async function handleLogout() {
    setLoggingOut(true);
    setPairingCode(null);
    try {
      await fetch(`/api/whatsapp/${instanceId}/logout`, { method: "POST" });
    } catch {}
    setLoggingOut(false);
  }

  async function handlePairingCode() {
    if (!phoneInput.trim()) return;
    setPairingLoading(true);
    setPairingError(null);
    setPairingCode(null);
    try {
      const res = await fetch(`/api/whatsapp/${instanceId}/pairing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telefone: phoneInput }),
      });
      const json = await res.json();
      if (!res.ok) {
        setPairingError(json.detail ?? json.error ?? "Erro ao gerar código");
      } else {
        setPairingCode(json.code);
      }
    } catch {
      setPairingError("Erro de conexão");
    }
    setPairingLoading(false);
  }

  const connected = data.status === "open";

  return (
    <div className="rounded-xl border-2 border-[#F1f1f1] bg-[#FAFAFA] p-5 flex flex-col items-center gap-3 text-center">
      <div className="flex items-center gap-2">
        {icon}
        <p className="font-bold text-sm">{name}</p>
      </div>

      <div
        className={[
          "w-14 h-14 rounded-full flex items-center justify-center border-2",
          connected
            ? "bg-emerald-50 border-emerald-200"
            : "bg-white border-[#F1f1f1]",
        ].join(" ")}
      >
        <Smartphone
          className={`w-6 h-6 ${connected ? "text-emerald-600" : "text-[#656565]"}`}
        />
      </div>
      <div>
        <p className="font-bold">
          {data.offline
            ? "Não foi possível verificar a conexão"
            : connected
              ? "WhatsApp conectado"
              : data.started
                ? "WhatsApp desconectado"
                : "Ainda não conectado"}
        </p>
        <p className="text-sm text-[#656565]">
          {data.offline
            ? "Tente recarregar a página em instantes"
            : connected
              ? data.phone
                ? formatWhatsappPhone(data.phone)
                : "Número conectado"
              : data.started
                ? "Escaneie o QR code abaixo para conectar"
                : `Conecte um número exclusivo para ${name}`}
        </p>
      </div>

      {connected && (
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="rounded-full border-2 border-[#F1f1f1] bg-white px-5 py-2.5 text-sm font-semibold text-red-500 disabled:opacity-60"
        >
          {loggingOut ? "Desconectando..." : "Desconectar"}
        </button>
      )}

      {!data.started && !connected && !data.offline && (
        <button
          type="button"
          onClick={handleConnect}
          disabled={connecting}
          className="rounded-full bg-black text-white px-5 py-2.5 text-sm font-semibold disabled:opacity-60"
        >
          {connecting ? "Iniciando..." : "Conectar"}
        </button>
      )}

      {data.started && !connected && !data.offline && (
        <div className="rounded-xl border-2 border-dashed border-[#F1f1f1] bg-white p-4 flex flex-col items-center gap-3 text-center w-full">
          {/* Toggle QR / Número */}
          <div className="flex gap-1 bg-[#F1f1f1] rounded-full p-1 w-full">
            {(["qr", "phone"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setConnectMode(m); setPairingCode(null); setPairingError(null); }}
                className={[
                  "flex-1 rounded-full py-1.5 text-xs font-semibold transition-colors",
                  connectMode === m ? "bg-white text-black shadow-sm" : "text-[#656565]",
                ].join(" ")}
              >
                {m === "qr" ? "QR Code" : "Número"}
              </button>
            ))}
          </div>

          {connectMode === "qr" && (
            <>
              {data.hasQr ? (
                <img
                  key={qrTick}
                  src={`/api/whatsapp/${instanceId}/qr?t=${qrTick}`}
                  alt={`QR code do WhatsApp de ${name}`}
                  className="w-48 h-48 rounded-lg border-2 border-[#F1f1f1]"
                />
              ) : (
                <div className="w-48 h-48 rounded-lg bg-[#FAFAFA] border-2 border-[#F1f1f1] flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-[#656565] animate-spin" />
                </div>
              )}
              <p className="text-xs text-[#656565] max-w-[240px]">
                Abra o WhatsApp no celular de {name}, toque em Aparelhos
                conectados e escaneie o código para conectar
              </p>
            </>
          )}

          {connectMode === "phone" && (
            <div className="flex flex-col gap-3 w-full">
              <p className="text-xs text-[#656565]">
                Digite o número do WhatsApp com DDI e DDD (ex: 5511999999999)
              </p>
              <input
                type="tel"
                placeholder="5511999999999"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, ""))}
                className="w-full rounded-xl border-2 border-[#F1f1f1] bg-[#FAFAFA] px-4 py-3 text-sm focus:outline-none focus:border-black"
              />
              <button
                type="button"
                onClick={handlePairingCode}
                disabled={pairingLoading || !phoneInput.trim()}
                className="w-full rounded-full bg-black text-white py-2.5 text-sm font-semibold disabled:opacity-50"
              >
                {pairingLoading ? "Gerando..." : "Gerar código"}
              </button>
              {pairingError && (
                <p className="text-xs text-red-500 text-center">{pairingError}</p>
              )}
              {pairingCode && (
                <div className="rounded-xl bg-[#F0FFF4] border border-[#BBF7D0] p-4 flex flex-col items-center gap-1">
                  <p className="text-xs text-[#166534] font-medium">Código de vinculação</p>
                  <p className="text-2xl font-bold tracking-[0.2em] text-[#166534]">{pairingCode}</p>
                  <p className="text-xs text-[#166534] text-center mt-1">
                    No WhatsApp, vá em Aparelhos conectados → Conectar com número de telefone e insira o código acima
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {connected && (
        <div className="rounded-xl border-2 border-[#F1f1f1] bg-white p-4 flex items-center gap-3 w-full">
          <div className="w-9 h-9 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="font-semibold text-sm">Sessão ativa</p>
            <p className="text-xs text-[#656565]">
              Recebendo e enviando mensagens automaticamente
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function WhatsappEquipe() {
  const [catalogoAtivo, setCatalogoAtivo] = useState(true);
  const [agendamentoAtivo, setAgendamentoAtivo] = useState(true);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-[#656565]">
        Configure o que o WhatsApp responde automaticamente aos clientes.
      </p>

      <div className="rounded-xl border-2 border-[#F1f1f1] bg-[#FAFAFA] p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-white border-2 border-[#F1f1f1] flex items-center justify-center shrink-0">
          <FileText className="w-4 h-4 text-[#656565]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">Catálogo de serviços</p>
          <p className="text-xs text-[#656565]">
            Envia a lista de serviços e preços quando o cliente pedir,
            usando o template &quot;Catálogo&quot;
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCatalogoAtivo((v) => !v)}
          className="shrink-0"
        >
          {catalogoAtivo ? (
            <ToggleRight className="w-7 h-7 text-black" />
          ) : (
            <ToggleLeft className="w-7 h-7 text-[#656565]" />
          )}
        </button>
      </div>

      <div className="rounded-xl border-2 border-[#F1f1f1] bg-[#FAFAFA] p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-white border-2 border-[#F1f1f1] flex items-center justify-center shrink-0">
          <CalendarDays className="w-4 h-4 text-[#656565]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">Agendamento via WhatsApp</p>
          <p className="text-xs text-[#656565]">
            Envia o link de agendamento para o cliente marcar o horário
            direto pelo chat, usando o template &quot;Agendamento&quot;
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAgendamentoAtivo((v) => !v)}
          className="shrink-0"
        >
          {agendamentoAtivo ? (
            <ToggleRight className="w-7 h-7 text-black" />
          ) : (
            <ToggleLeft className="w-7 h-7 text-[#656565]" />
          )}
        </button>
      </div>
    </div>
  );
}

type WhatsappTemplate = {
  id: string;
  titulo: string;
  descricao: string;
  mensagem: string;
  gatilho?: string;
  custom?: boolean;
};

const GATILHOS: Array<{ value: string; label: string; icon: string; descricao: string }> = [
  { value: "agendamento_criado",    label: "Novo agendamento",        icon: "📅", descricao: "Bot envia automaticamente quando o cliente agenda um horário" },
  { value: "agendamento_cancelado", label: "Agendamento cancelado",   icon: "❌", descricao: "Bot envia automaticamente quando um agendamento é cancelado"  },
  { value: "agendamento_concluido", label: "Agendamento concluído",   icon: "✅", descricao: "Bot envia automaticamente quando o serviço é concluído"       },
  { value: "lembrete_24h",          label: "Lembrete 24h antes",      icon: "⏰", descricao: "Bot envia automaticamente 24h antes do horário marcado"       },
  { value: "pagamento_confirmado",  label: "Pagamento confirmado",    icon: "💳", descricao: "Bot envia automaticamente quando o pagamento é aprovado"      },
  { value: "aniversario",           label: "Aniversário do cliente",  icon: "🎂", descricao: "Bot envia automaticamente no aniversário do cliente"          },
  { value: "novo_cliente",          label: "Novo cliente cadastrado", icon: "👤", descricao: "Bot envia automaticamente quando um novo cliente se cadastra" },
];

const DEFAULT_WHATSAPP_TEMPLATES: WhatsappTemplate[] = [
  {
    id: "confirmacao",
    titulo: "Confirmação de agendamento",
    descricao: "Enviada assim que o cliente agenda um horário",
    gatilho: "agendamento_criado",
    mensagem:
      "Olá {{cliente}}! Seu horário na {{barbearia}} foi confirmado para {{data}} às {{horario}}. Até lá! ✂️",
  },
  {
    id: "lembrete",
    titulo: "Lembrete 24h antes",
    descricao: "Enviada um dia antes do horário marcado",
    gatilho: "lembrete_24h",
    mensagem:
      "Oi {{cliente}}, passando para lembrar do seu horário amanhã, {{data}} às {{horario}}, na {{barbearia}}.",
  },
  {
    id: "cancelamento",
    titulo: "Cancelamento",
    descricao: "Enviada quando um agendamento é cancelado",
    gatilho: "agendamento_cancelado",
    mensagem:
      "Olá {{cliente}}, seu horário do dia {{data}} às {{horario}} foi cancelado. Qualquer dúvida, chama a gente por aqui.",
  },
  {
    id: "aniversario",
    titulo: "Aniversário",
    descricao: "Enviada no aniversário do cliente",
    gatilho: "aniversario",
    mensagem:
      "Feliz aniversário, {{cliente}}! 🎉 Passe na {{barbearia}} essa semana e ganhe um desconto especial.",
  },
  {
    id: "catalogo",
    titulo: "Catálogo",
    descricao: "Envia a lista de serviços e preços da barbearia",
    gatilho: "novo_cliente",
    mensagem:
      "Olá {{cliente}}! Aqui está o catálogo de serviços da {{barbearia}} 💈 Dá uma olhada e me diz qual você quer agendar.",
  },
  {
    id: "servico",
    titulo: "Serviço",
    descricao: "Enviada com os detalhes de um serviço específico",
    gatilho: "agendamento_criado",
    mensagem:
      "O serviço {{servico}} na {{barbearia}} leva {{duracao}} e custa {{preco}}. Quer que eu agende um horário pra você?",
  },
  {
    id: "agendamento",
    titulo: "Link de agendamento",
    descricao: "Enviada com o link para o cliente marcar um horário",
    gatilho: "novo_cliente",
    mensagem:
      "Olá {{cliente}}! Para agendar seu horário na {{barbearia}}, é só acessar: {{link}}",
  },
];

const TEMPLATE_VARIABLES = [
  "{{cliente}}",
  "{{barbearia}}",
  "{{data}}",
  "{{horario}}",
  "{{servico}}",
  "{{duracao}}",
  "{{preco}}",
  "{{link}}",
];

// ─── Bot Canvas (Obsidian-style) ───────────────────────────────────────────────

type BotConfig = {
  ativo: boolean;
  identidade: string;
  contexto: string;
  instrucoes: string;
  restricoes: string;
};

type CanvasNodeDef = {
  id: string;
  label: string;
  icon: string;
  accent: string;
  configKey?: keyof Omit<BotConfig, "ativo">;
  placeholder?: string;
  fixed?: boolean;
  isOutput?: boolean;
};

const NODE_W = 300;

const CANVAS_NODE_DEFS: CanvasNodeDef[] = [
  {
    id: "trigger",
    label: "Trigger — Mensagem recebida",
    icon: "⚡",
    accent: "#6366f1",
    fixed: true,
  },
  {
    id: "identidade",
    label: "Identidade",
    icon: "🤖",
    accent: "#8b5cf6",
    configKey: "identidade",
    placeholder:
      "Ex: Você é o Barber, assistente da Barbearia do João. Tom amigável. Ajuda clientes a agendar e tirar dúvidas.",
  },
  {
    id: "contexto",
    label: "Contexto da barbearia",
    icon: "🏪",
    accent: "#3b82f6",
    configKey: "contexto",
    placeholder:
      "Ex: Funcionamos de segunda a sábado, 9h–19h. Rua das Flores, 123. Corte R$35, Barba R$25, Combo R$55.",
  },
  {
    id: "instrucoes",
    label: "Instruções",
    icon: "📋",
    accent: "#10b981",
    configKey: "instrucoes",
    placeholder:
      "Ex: Quando quiser agendar, envie: https://seusite.com. Pergunte o nome ao iniciar.",
  },
  {
    id: "restricoes",
    label: "Restrições",
    icon: "🚫",
    accent: "#ef4444",
    configKey: "restricoes",
    placeholder:
      "Ex: Não ofereça descontos. Não agende fora do horário. Foque apenas na barbearia.",
  },
  {
    id: "output",
    label: "Resposta — Gemini IA",
    icon: "✨",
    accent: "#f59e0b",
    fixed: true,
    isOutput: true,
  },
];

const DEFAULT_POSITIONS: Record<string, { x: number; y: number }> = {
  trigger:    { x: 80, y: 40 },
  identidade: { x: 80, y: 220 },
  contexto:   { x: 80, y: 480 },
  instrucoes: { x: 80, y: 740 },
  restricoes: { x: 80, y: 1000 },
  output:     { x: 80, y: 1240 },
};

const EDGES: [string, string][] = [
  ["trigger", "identidade"],
  ["identidade", "contexto"],
  ["contexto", "instrucoes"],
  ["instrucoes", "restricoes"],
  ["restricoes", "output"],
];

function BotCanvas({
  botConfig,
  setBotConfig,
  loading,
  templates,
}: {
  botConfig: BotConfig;
  setBotConfig: React.Dispatch<React.SetStateAction<BotConfig>>;
  loading: boolean;
  templates: WhatsappTemplate[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const netCanvasRef = useRef<HTMLCanvasElement>(null);
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>(DEFAULT_POSITIONS);
  const [viewport, setViewport] = useState({ x: 40, y: 30, zoom: 0.72 });
  const nodeRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const dragRef = useRef<{
    type: "node" | "canvas";
    id?: string;
    startMx: number;
    startMy: number;
    startX: number;
    startY: number;
  } | null>(null);
  const [edges, setEdges] = useState<[string, string][]>([...EDGES]);
  const [customNodes, setCustomNodes] = useState<Array<{ id: string; label: string; accent: string; content: string; templateId?: string }>>([]);
  const [addPanel, setAddPanel] = useState(false);
  const [addTab, setAddTab] = useState<"bloco" | "mensagem">("bloco");
  const [newNodeForm, setNewNodeForm] = useState({ label: "", accent: "#6366f1", content: "" });
  // WhatsApp bot connection state
  const [waState, setWaState] = useState<"loading" | "open" | "connecting" | "close" | "error">("loading");
  const [waQr, setWaQr] = useState<string | null>(null);
  const [waConnecting, setWaConnecting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function checkStatus() {
      try {
        const res = await fetch("/api/bot/whatsapp");
        const data = await res.json();
        if (cancelled) return;
        setWaState(data.state ?? "error");
        setWaQr(data.qr ?? null);
      } catch {
        if (!cancelled) setWaState("error");
      }
    }
    checkStatus();
    const id = setInterval(checkStatus, 8000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  async function connectBotWa() {
    setWaConnecting(true);
    try {
      const res = await fetch("/api/bot/whatsapp", { method: "POST" });
      const data = await res.json();
      setWaState(data.state ?? "connecting");
      setWaQr(data.qr ?? null);
    } finally {
      setWaConnecting(false);
    }
  }

  const connectRef = useRef<{ fromId: string; x1: number; y1: number } | null>(null);
  const [connectLine, setConnectLine] = useState<{ x1: number; y1: number; mx: number; my: number } | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);

  function onCanvasMouseDown(e: React.MouseEvent) {
    if ((e.target as HTMLElement).closest("[data-node]")) return;
    dragRef.current = {
      type: "canvas",
      startMx: e.clientX,
      startMy: e.clientY,
      startX: viewport.x,
      startY: viewport.y,
    };
  }

  function onNodeMouseDown(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    if ((e.target as HTMLElement).closest("textarea,button,input")) return;
    dragRef.current = {
      type: "node",
      id,
      startMx: e.clientX,
      startMy: e.clientY,
      startX: positions[id]?.x ?? 0,
      startY: positions[id]?.y ?? 0,
    };
  }

  function onMouseMove(e: React.MouseEvent) {
    if (connectRef.current) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const mx = (e.clientX - rect.left - viewport.x) / viewport.zoom;
      const my = (e.clientY - rect.top - viewport.y) / viewport.zoom;
      setConnectLine((l) => l ? { ...l, mx, my } : null);
      return;
    }
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.startMx;
    const dy = e.clientY - d.startMy;
    if (d.type === "canvas") {
      setViewport((v) => ({ ...v, x: d.startX + dx, y: d.startY + dy }));
    } else if (d.id) {
      setPositions((p) => ({
        ...p,
        [d.id!]: { x: d.startX + dx / viewport.zoom, y: d.startY + dy / viewport.zoom },
      }));
    }
  }

  function onMouseUp(e: React.MouseEvent) {
    if (connectRef.current) {
      const portEl = (e.target as HTMLElement).closest("[data-port-in]") as HTMLElement | null;
      if (portEl) {
        const toId = portEl.dataset.portIn!;
        const fromId = connectRef.current.fromId;
        if (fromId !== toId) {
          setEdges((prev) => {
            const exists = prev.some(([a, b]) => a === fromId && b === toId);
            return exists ? prev : [...prev, [fromId, toId]];
          });
        }
      }
      connectRef.current = null;
      setConnectLine(null);
      return;
    }
    dragRef.current = null;
  }

  function cancelDrag() {
    dragRef.current = null;
    connectRef.current = null;
    setConnectLine(null);
  }

  function onPortMouseDown(e: React.MouseEvent, nodeId: string) {
    e.stopPropagation();
    const pos = positions[nodeId] ?? { x: 0, y: 0 };
    const el = nodeRefs.current[nodeId];
    const h = el?.offsetHeight ?? 80;
    const x1 = pos.x + NODE_W / 2;
    const y1 = pos.y + h;
    connectRef.current = { fromId: nodeId, x1, y1 };
    setConnectLine({ x1, y1, mx: x1, my: y1 });
  }

  function addCustomNode() {
    if (!newNodeForm.label.trim()) return;
    const id = `custom_${Date.now()}`;
    const cx = (containerRef.current?.clientWidth ?? 600) / 2;
    const cy = (containerRef.current?.clientHeight ?? 400) / 2;
    setCustomNodes((prev) => [...prev, { id, label: newNodeForm.label, accent: newNodeForm.accent, content: newNodeForm.content }]);
    setPositions((prev) => ({
      ...prev,
      [id]: { x: (cx - viewport.x) / viewport.zoom - NODE_W / 2, y: (cy - viewport.y) / viewport.zoom - 40 },
    }));
    setNewNodeForm({ label: "", accent: "#6366f1", content: "" });
    setAddPanel(false);
  }

  function linkTemplate(tpl: WhatsappTemplate) {
    const id = `tpl_${tpl.id}_${Date.now()}`;
    const cx = (containerRef.current?.clientWidth ?? 600) / 2;
    const cy = (containerRef.current?.clientHeight ?? 400) / 2;
    const gatilho = GATILHOS.find((g) => g.value === tpl.gatilho);
    setCustomNodes((prev) => [...prev, {
      id,
      label: tpl.titulo,
      accent: "#10b981",
      content: tpl.mensagem,
      templateId: tpl.id,
    }]);
    setPositions((prev) => ({
      ...prev,
      [id]: { x: (cx - viewport.x) / viewport.zoom - NODE_W / 2, y: (cy - viewport.y) / viewport.zoom - 40 },
    }));
    setAddPanel(false);
  }

  function deleteCustomNode(id: string) {
    setCustomNodes((prev) => prev.filter((n) => n.id !== id));
    setPositions((prev) => { const p = { ...prev }; delete p[id]; return p; });
    setEdges((prev) => prev.filter(([a, b]) => a !== id && b !== id));
  }

  function deleteEdge(fromId: string, toId: string) {
    setEdges((prev) => prev.filter(([a, b]) => !(a === fromId && b === toId)));
  }

  function onWheel(e: React.WheelEvent) {
    if (!e.ctrlKey) return;
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    setViewport((v) => ({
      ...v,
      zoom: Math.min(2, Math.max(0.25, v.zoom * factor)),
    }));
  }

  function resetView() {
    setViewport({ x: 40, y: 30, zoom: 0.72 });
    setPositions(DEFAULT_POSITIONS);
  }

  // Animated particle network globe background
  useEffect(() => {
    const canvas = netCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const COLORS = ["#6366f1","#8b5cf6","#3b82f6","#10b981","#ef4444","#f59e0b","#ec4899","#14b8a6","#a1a1aa"];
    const N = 110;
    const RADIUS = 200;
    const LINK_DIST = 95;

    // Fibonacci sphere distribution
    const pts: { phi: number; theta: number; color: string; size: number; speed: number }[] = [];
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const phi = i * golden;
      pts.push({
        phi,
        theta: Math.asin(Math.max(-1, Math.min(1, y))),
        color: COLORS[i % COLORS.length],
        size: 2 + Math.random() * 3.5,
        speed: 0.00018 + Math.random() * 0.00012,
      });
    }

    let angle = 0;
    let animId: number;
    let w = 0, h = 0;

    function resize() {
      const container = containerRef.current;
      if (!container || !canvas) return;
      w = container.clientWidth;
      h = container.clientHeight;
      canvas.width = w;
      canvas.height = h;
    }

    function project(phi: number, theta: number) {
      const x3 = Math.cos(theta) * Math.sin(phi + angle);
      const y3 = Math.sin(theta);
      const z3 = Math.cos(theta) * Math.cos(phi + angle);
      const depth = (z3 + 1) / 2; // 0..1
      return {
        x: w / 2 + x3 * RADIUS,
        y: h / 2 + y3 * RADIUS,
        depth,
        visible: z3 > -0.25,
      };
    }

    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, w, h);

      const projected = pts.map((p) => ({ ...p, ...project(p.phi, p.theta) }));

      // Draw links
      for (let i = 0; i < projected.length; i++) {
        if (!projected[i].visible) continue;
        for (let j = i + 1; j < projected.length; j++) {
          if (!projected[j].visible) continue;
          const dx = projected[i].x - projected[j].x;
          const dy = projected[i].y - projected[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < LINK_DIST) {
            const alpha = (1 - dist / LINK_DIST) * 0.35 * ((projected[i].depth + projected[j].depth) / 2);
            ctx.beginPath();
            ctx.moveTo(projected[i].x, projected[i].y);
            ctx.lineTo(projected[j].x, projected[j].y);
            ctx.strokeStyle = `rgba(160,160,200,${alpha.toFixed(3)})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      // Draw dots
      for (const p of projected) {
        if (!p.visible) continue;
        const sz = p.size * (0.5 + p.depth * 0.7);
        const alpha = 0.4 + p.depth * 0.6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, sz, 0, Math.PI * 2);
        ctx.fillStyle = p.color + Math.round(alpha * 255).toString(16).padStart(2, "0");
        ctx.fill();
      }

      angle += 0.0025;
      animId = requestAnimationFrame(draw);
    }

    resize();
    draw();

    const observer = new ResizeObserver(resize);
    if (containerRef.current) observer.observe(containerRef.current);

    return () => {
      cancelAnimationFrame(animId);
      observer.disconnect();
    };
  }, []);

  // Build edges as SVG bezier paths
  function buildEdgePath(fromId: string, toId: string) {
    const from = positions[fromId];
    const to = positions[toId];
    if (!from || !to) return "";
    const fromEl = nodeRefs.current[fromId];
    const fromH = fromEl?.offsetHeight ?? 80;
    const x1 = from.x + NODE_W / 2;
    const y1 = from.y + fromH;
    const x2 = to.x + NODE_W / 2;
    const y2 = to.y;
    const cy = (y1 + y2) / 2;
    return `M ${x1} ${y1} C ${x1} ${cy}, ${x2} ${cy}, ${x2} ${y2}`;
  }

  function getEdgeMid(fromId: string, toId: string) {
    const from = positions[fromId];
    const to = positions[toId];
    if (!from || !to) return null;
    const fromEl = nodeRefs.current[fromId];
    const fromH = fromEl?.offsetHeight ?? 80;
    const x1 = from.x + NODE_W / 2;
    const y1 = from.y + fromH;
    const x2 = to.x + NODE_W / 2;
    const y2 = to.y;
    return { x: (x1 + x2) / 2, y: (y1 + y2) / 2 };
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-2xl overflow-hidden select-none"
      style={{ height: 560, background: "#111113", cursor: dragRef.current ? "grabbing" : "grab" }}
      onMouseDown={onCanvasMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={cancelDrag}
      onWheel={onWheel}
    >
      {/* Dot grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, #2a2a2e 1.5px, transparent 1.5px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Animated particle globe network */}
      <canvas
        ref={netCanvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 1, opacity: 0.75 }}
      />

      {/* Viewport transform */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          transformOrigin: "0 0",
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
        }}
      >
        {/* SVG edges */}
        <svg style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }}>
          <defs>
            <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill="#3f3f46" />
            </marker>
            <marker id="arrow-hover" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill="#ef4444" />
            </marker>
          </defs>
          {edges.map(([a, b]) => {
            const key = `${a}-${b}`;
            const hovered = hoveredEdge === key;
            const mid = getEdgeMid(a, b);
            return (
              <g key={key} style={{ pointerEvents: "all" }}>
                {/* fat invisible hit area */}
                <path
                  d={buildEdgePath(a, b)}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={14}
                  style={{ cursor: "pointer" }}
                  onMouseEnter={() => setHoveredEdge(key)}
                  onMouseLeave={() => setHoveredEdge(null)}
                  onClick={() => deleteEdge(a, b)}
                />
                {/* visual path */}
                <path
                  d={buildEdgePath(a, b)}
                  fill="none"
                  stroke={hovered ? "#ef4444" : "#3f3f46"}
                  strokeWidth={hovered ? 2.5 : 2}
                  strokeDasharray="6 4"
                  markerEnd={hovered ? "url(#arrow-hover)" : "url(#arrow)"}
                  style={{ pointerEvents: "none", transition: "stroke 0.15s" }}
                />
                {/* disconnect button at midpoint */}
                {hovered && mid && (
                  <g
                    style={{ cursor: "pointer", pointerEvents: "all" }}
                    onMouseEnter={() => setHoveredEdge(key)}
                    onMouseLeave={() => setHoveredEdge(null)}
                    onClick={() => deleteEdge(a, b)}
                  >
                    <circle cx={mid.x} cy={mid.y} r={10} fill="#18181b" stroke="#ef4444" strokeWidth={1.5} />
                    <text x={mid.x} y={mid.y + 4} textAnchor="middle" fill="#ef4444" fontSize={12} fontWeight="bold" style={{ userSelect: "none" }}>×</text>
                  </g>
                )}
              </g>
            );
          })}
          {connectLine && (
            <path
              d={`M ${connectLine.x1} ${connectLine.y1} C ${connectLine.x1} ${(connectLine.y1 + connectLine.my) / 2}, ${connectLine.mx} ${(connectLine.y1 + connectLine.my) / 2}, ${connectLine.mx} ${connectLine.my}`}
              fill="none"
              stroke="#6366f1"
              strokeWidth={2}
              strokeDasharray="5 3"
              opacity={0.8}
            />
          )}
        </svg>

        {/* Nodes — built-in */}
        {CANVAS_NODE_DEFS.map((def) => {
          const pos = positions[def.id] ?? { x: 0, y: 0 };
          const val = def.configKey ? botConfig[def.configKey] : "";
          return (
            <div
              key={def.id}
              data-node={def.id}
              ref={(el) => { nodeRefs.current[def.id] = el; }}
              style={{ position: "absolute", left: pos.x, top: pos.y, width: NODE_W, cursor: "grab" }}
              onMouseDown={(e) => onNodeMouseDown(e, def.id)}
            >
              {/* Input port (top) */}
              {def.id !== "trigger" && (
                <div
                  data-port-in={def.id}
                  style={{
                    position: "absolute", top: -7, left: "50%", transform: "translateX(-50%)",
                    width: 14, height: 14, borderRadius: "50%",
                    background: "#27272a", border: `2px solid ${def.accent}`,
                    cursor: "crosshair", zIndex: 2,
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                />
              )}
              <div style={{ borderRadius: 14, overflow: "hidden", border: "1.5px solid #27272a" }}>
                {/* Header */}
                <div style={{ background: "#1c1c1f", borderBottom: `2px solid ${def.accent}`, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 16 }}>{def.icon}</span>
                  <span style={{ color: "#e4e4e7", fontSize: 12, fontWeight: 600, flex: 1 }}>{def.label}</span>
                  {def.id === "trigger" && (
                    <button type="button" onMouseDown={(e) => e.stopPropagation()} onClick={() => setBotConfig((p) => ({ ...p, ativo: !p.ativo }))} style={{ flexShrink: 0, lineHeight: 0 }}>
                      {botConfig.ativo ? <ToggleRight style={{ width: 26, height: 26, color: "#6366f1" }} /> : <ToggleLeft style={{ width: 26, height: 26, color: "#52525b" }} />}
                    </button>
                  )}
                </div>

                {/* WhatsApp status (trigger only) */}
                {def.id === "trigger" && (
                  <div style={{ background: "#111113", borderBottom: "1px solid #27272a", padding: "10px 14px" }}>
                    {/* Status row */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{
                        width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                        background: waState === "open" ? "#22c55e" : waState === "connecting" ? "#f59e0b" : waState === "loading" ? "#52525b" : "#ef4444",
                        boxShadow: waState === "open" ? "0 0 6px #22c55e" : waState === "connecting" ? "0 0 6px #f59e0b" : "none",
                      }} />
                      <span style={{ color: "#a1a1aa", fontSize: 11, flex: 1 }}>
                        {waState === "open" ? "WhatsApp conectado"
                          : waState === "connecting" ? "Aguardando leitura do QR..."
                          : waState === "loading" ? "Verificando conexão..."
                          : "WhatsApp desconectado"}
                      </span>
                      {waState !== "open" && waState !== "loading" && (
                        <button
                          type="button"
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={connectBotWa}
                          disabled={waConnecting}
                          style={{
                            background: "#25d366", border: "none", borderRadius: 6,
                            color: "#fff", fontSize: 10, fontWeight: 700, padding: "3px 8px",
                            cursor: "pointer", opacity: waConnecting ? 0.6 : 1,
                          }}
                        >
                          {waConnecting ? "..." : "Conectar"}
                        </button>
                      )}
                    </div>

                    {/* QR Code */}
                    {waQr && waState !== "open" && (
                      <div style={{ marginTop: 10, textAlign: "center" }}>
                        <p style={{ color: "#71717a", fontSize: 10, marginBottom: 6 }}>
                          Escaneie com o WhatsApp da barbearia
                        </p>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={waQr}
                          alt="QR Code WhatsApp"
                          style={{ width: 180, height: 180, borderRadius: 8, display: "block", margin: "0 auto" }}
                          onMouseDown={(e) => e.stopPropagation()}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Body */}
                {def.configKey && !loading && (
                  <div style={{ background: "#18181b", padding: "10px 14px" }}>
                    <textarea value={val} placeholder={def.placeholder} rows={4} onMouseDown={(e) => e.stopPropagation()} onChange={(e) => setBotConfig((p) => ({ ...p, [def.configKey!]: e.target.value }))} style={{ width: "100%", background: "transparent", border: "none", outline: "none", color: "#a1a1aa", fontSize: 12, lineHeight: 1.6, resize: "none", fontFamily: "inherit" }} />
                  </div>
                )}
                {def.isOutput && (
                  <div style={{ background: "#18181b", padding: "10px 14px", color: "#71717a", fontSize: 12 }}>
                    Gera e envia a resposta via WhatsApp
                  </div>
                )}
                {loading && def.configKey && (
                  <div style={{ background: "#18181b", padding: "14px", display: "flex", justifyContent: "center" }}>
                    <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid #3f3f46", borderTopColor: def.accent, animation: "spin 1s linear infinite" }} />
                  </div>
                )}
              </div>
              {/* Output port (bottom) */}
              {!def.isOutput && (
                <div
                  style={{
                    position: "absolute", bottom: -7, left: "50%", transform: "translateX(-50%)",
                    width: 14, height: 14, borderRadius: "50%",
                    background: def.accent, border: "2px solid #111113",
                    cursor: "crosshair", zIndex: 2,
                  }}
                  onMouseDown={(e) => onPortMouseDown(e, def.id)}
                />
              )}
            </div>
          );
        })}

        {/* Nodes — custom */}
        {customNodes.map((node) => {
          const pos = positions[node.id] ?? { x: 0, y: 0 };
          const linkedTpl = node.templateId ? templates.find((t) => t.id === node.templateId) : null;
          const gatilho = linkedTpl ? GATILHOS.find((g) => g.value === linkedTpl.gatilho) : null;
          return (
            <div
              key={node.id}
              data-node={node.id}
              ref={(el) => { nodeRefs.current[node.id] = el; }}
              style={{ position: "absolute", left: pos.x, top: pos.y, width: NODE_W, cursor: "grab" }}
              onMouseDown={(e) => onNodeMouseDown(e, node.id)}
            >
              {/* Input port */}
              <div
                data-port-in={node.id}
                style={{
                  position: "absolute", top: -7, left: "50%", transform: "translateX(-50%)",
                  width: 14, height: 14, borderRadius: "50%",
                  background: "#27272a", border: `2px solid ${node.accent}`,
                  cursor: "crosshair", zIndex: 2,
                }}
                onMouseDown={(e) => e.stopPropagation()}
              />
              <div style={{ borderRadius: 14, overflow: "hidden", border: `1.5px solid ${node.accent}44` }}>
                {/* Header */}
                <div style={{ background: "#1c1c1f", borderBottom: `2px solid ${node.accent}`, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 14 }}>{gatilho ? gatilho.icon : "✦"}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: "#e4e4e7", fontSize: 12, fontWeight: 600 }}>{node.label}</div>
                    {gatilho && (
                      <div style={{ fontSize: 10, color: "#10b981", marginTop: 2 }}>⚡ {gatilho.label}</div>
                    )}
                  </div>
                  <button
                    type="button"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={() => deleteCustomNode(node.id)}
                    style={{ background: "none", border: "none", color: "#52525b", cursor: "pointer", lineHeight: 1, padding: 0, fontSize: 14 }}
                  >✕</button>
                </div>
                {/* Body */}
                <div style={{ background: "#18181b", padding: "10px 14px" }}>
                  {linkedTpl ? (
                    <p style={{ color: "#71717a", fontSize: 12, lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>
                      {linkedTpl.mensagem}
                    </p>
                  ) : (
                    <textarea
                      value={node.content}
                      placeholder="Conteúdo do bloco..."
                      rows={4}
                      onMouseDown={(e) => e.stopPropagation()}
                      onChange={(e) => setCustomNodes((prev) => prev.map((n) => n.id === node.id ? { ...n, content: e.target.value } : n))}
                      style={{ width: "100%", background: "transparent", border: "none", outline: "none", color: "#a1a1aa", fontSize: 12, lineHeight: 1.6, resize: "none", fontFamily: "inherit" }}
                    />
                  )}
                </div>
                {linkedTpl && (
                  <div style={{ background: "#111113", padding: "6px 14px", display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 10, color: "#52525b" }}>Vinculado ao template</span>
                    <span style={{ fontSize: 10, color: "#10b981", fontWeight: 600 }}>{linkedTpl.titulo}</span>
                  </div>
                )}
              </div>
              {/* Output port */}
              <div
                style={{
                  position: "absolute", bottom: -7, left: "50%", transform: "translateX(-50%)",
                  width: 14, height: 14, borderRadius: "50%",
                  background: node.accent, border: "2px solid #111113",
                  cursor: "crosshair", zIndex: 2,
                }}
                onMouseDown={(e) => onPortMouseDown(e, node.id)}
              />
            </div>
          );
        })}
      </div>

      {/* Add node panel */}
      {addPanel && (
        <div
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            position: "absolute", bottom: 54, right: 12, zIndex: 20,
            background: "#1c1c1f", border: "1px solid #3f3f46", borderRadius: 14,
            padding: 14, display: "flex", flexDirection: "column", gap: 10, width: 260,
            boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
          }}
        >
          {/* Tabs */}
          <div style={{ display: "flex", gap: 4, background: "#111113", borderRadius: 8, padding: 3 }}>
            {(["bloco", "mensagem"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setAddTab(tab)}
                style={{
                  flex: 1, padding: "5px 0", borderRadius: 6, border: "none",
                  background: addTab === tab ? "#2a2a2e" : "none",
                  color: addTab === tab ? "#e4e4e7" : "#71717a",
                  fontSize: 12, fontWeight: addTab === tab ? 600 : 400, cursor: "pointer",
                }}
              >
                {tab === "bloco" ? "✦ Bloco" : "💬 Mensagem"}
              </button>
            ))}
          </div>

          {/* Bloco livre */}
          {addTab === "bloco" && (
            <>
              <input
                autoFocus
                placeholder="Nome do bloco"
                value={newNodeForm.label}
                onChange={(e) => setNewNodeForm((p) => ({ ...p, label: e.target.value }))}
                onKeyDown={(e) => { if (e.key === "Enter") addCustomNode(); if (e.key === "Escape") setAddPanel(false); }}
                style={{ background: "#111113", border: "1px solid #3f3f46", borderRadius: 7, padding: "6px 10px", color: "#e4e4e7", fontSize: 12, outline: "none" }}
              />
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: "#71717a", fontSize: 11 }}>Cor</span>
                {["#6366f1","#3b82f6","#10b981","#ef4444","#f59e0b","#ec4899","#14b8a6"].map((c) => (
                  <div key={c} onClick={() => setNewNodeForm((p) => ({ ...p, accent: c }))} style={{ width: 16, height: 16, borderRadius: "50%", background: c, cursor: "pointer", outline: newNodeForm.accent === c ? `2px solid ${c}` : "none", outlineOffset: 2 }} />
                ))}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button type="button" onClick={() => setAddPanel(false)} style={{ flex: 1, background: "none", border: "1px solid #3f3f46", borderRadius: 7, color: "#71717a", fontSize: 12, padding: "5px 0", cursor: "pointer" }}>Cancelar</button>
                <button type="button" onClick={addCustomNode} style={{ flex: 1, background: "#6366f1", border: "none", borderRadius: 7, color: "#fff", fontSize: 12, fontWeight: 600, padding: "5px 0", cursor: "pointer" }}>Criar</button>
              </div>
            </>
          )}

          {/* Vincular mensagem */}
          {addTab === "mensagem" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 280, overflowY: "auto" }}>
              {templates.length === 0 ? (
                <p style={{ color: "#71717a", fontSize: 12, textAlign: "center", padding: "12px 0" }}>Nenhum template criado ainda</p>
              ) : templates.map((tpl) => {
                const gatilho = GATILHOS.find((g) => g.value === tpl.gatilho);
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => linkTemplate(tpl)}
                    style={{
                      background: "#18181b", border: "1px solid #27272a", borderRadius: 10,
                      padding: "10px 12px", cursor: "pointer", textAlign: "left",
                      display: "flex", flexDirection: "column", gap: 4,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#10b981")}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#27272a")}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 14 }}>{gatilho?.icon ?? "💬"}</span>
                      <span style={{ color: "#e4e4e7", fontSize: 12, fontWeight: 600, flex: 1 }}>{tpl.titulo}</span>
                    </div>
                    {gatilho && (
                      <span style={{ fontSize: 10, color: "#10b981", background: "#052e16", borderRadius: 4, padding: "1px 6px", alignSelf: "flex-start" }}>
                        ⚡ {gatilho.label}
                      </span>
                    )}
                    <p style={{ color: "#71717a", fontSize: 11, lineHeight: 1.4, margin: 0, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                      {tpl.mensagem}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Toolbar */}
      <div style={{ position: "absolute", bottom: 12, right: 12, display: "flex", gap: 6, zIndex: 10 }}>
        <button
          type="button"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={() => setAddPanel((p) => !p)}
          style={{
            height: 30, padding: "0 10px", borderRadius: 8,
            background: addPanel ? "#4f46e5" : "#1c1c1f",
            border: `1px solid ${addPanel ? "#6366f1" : "#27272a"}`,
            color: addPanel ? "#fff" : "#a1a1aa", fontSize: 12, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 5,
          }}
        >
          <span style={{ fontSize: 14 }}>+</span> Novo card
        </button>
        {[
          { label: "+", action: () => setViewport((v) => ({ ...v, zoom: Math.min(2, v.zoom * 1.2) })) },
          { label: "−", action: () => setViewport((v) => ({ ...v, zoom: Math.max(0.25, v.zoom * 0.8) })) },
          { label: "⌂", action: resetView },
        ].map((btn) => (
          <button
            key={btn.label}
            type="button"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={btn.action}
            style={{
              width: 30, height: 30, borderRadius: 8,
              background: "#1c1c1f", border: "1px solid #27272a",
              color: "#a1a1aa", fontSize: 14, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Status pill */}
      <div
        style={{
          position: "absolute",
          top: 12,
          left: 12,
          background: botConfig.ativo ? "#14532d" : "#27272a",
          border: `1px solid ${botConfig.ativo ? "#16a34a" : "#3f3f46"}`,
          borderRadius: 20,
          padding: "3px 10px",
          color: botConfig.ativo ? "#86efac" : "#71717a",
          fontSize: 11,
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          gap: 5,
        }}
      >
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: botConfig.ativo ? "#22c55e" : "#52525b",
          }}
        />
        {botConfig.ativo ? "Bot ativo" : "Bot desativado"}
      </div>
    </div>
  );
}

function WhatsappTemplates() {
  const [view, setView] = useState<"bot" | "mensagens">("bot");

  // ── Bot state ───────────────────────────────────────────────────────────────
  const [botConfig, setBotConfig] = useState<BotConfig>({
    ativo: false,
    identidade: "",
    contexto: "",
    instrucoes: "",
    restricoes: "",
  });
  const [botLoading, setBotLoading] = useState(true);
  const [botSaving, setBotSaving] = useState(false);
  const [botSaved, setBotSaved] = useState(false);

  useEffect(() => {
    fetch("/api/bot/config")
      .then((r) => r.json())
      .then((data: BotConfig) => setBotConfig(data))
      .catch(() => {})
      .finally(() => setBotLoading(false));
  }, []);

  async function saveBotConfig() {
    setBotSaving(true);
    await fetch("/api/bot/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(botConfig),
    });
    setBotSaving(false);
    setBotSaved(true);
    setTimeout(() => setBotSaved(false), 2500);
  }

  // ── Templates state ─────────────────────────────────────────────────────────
  const [templates, setTemplates] = useState(DEFAULT_WHATSAPP_TEMPLATES);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [createPanel, setCreatePanel] = useState(false);
  const [newTpl, setNewTpl] = useState({ titulo: "", gatilho: "", mensagem: "" });
  const [gatilhoOpen, setGatilhoOpen] = useState(false);
  const [draftGatilhos, setDraftGatilhos] = useState<Record<string, string>>({});
  const [editGatilhoOpen, setEditGatilhoOpen] = useState<string | null>(null);

  function startEdit(t: WhatsappTemplate) {
    setDrafts((prev) => ({ ...prev, [t.id]: prev[t.id] ?? t.mensagem }));
    setDraftGatilhos((prev) => ({ ...prev, [t.id]: prev[t.id] ?? t.gatilho ?? "manual" }));
    setExpanded((prev) => (prev === t.id ? null : t.id));
    setEditGatilhoOpen(null);
  }

  function saveTemplate(id: string) {
    setTemplates((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, mensagem: drafts[id] ?? t.mensagem, gatilho: draftGatilhos[id] ?? t.gatilho }
          : t,
      ),
    );
    setExpanded(null);
    setEditGatilhoOpen(null);
  }

  function createTemplate() {
    if (!newTpl.titulo.trim() || !newTpl.mensagem.trim()) return;
    const id = `custom_${Date.now()}`;
    const gatilhoInfo = GATILHOS.find((g) => g.value === newTpl.gatilho);
    setTemplates((prev) => [
      ...prev,
      {
        id,
        titulo: newTpl.titulo,
        descricao: gatilhoInfo ? gatilhoInfo.descricao : "Template personalizado",
        mensagem: newTpl.mensagem,
        gatilho: newTpl.gatilho || "manual",
        custom: true,
      },
    ]);
    setNewTpl({ titulo: "", gatilho: "", mensagem: "" });
    setCreatePanel(false);
  }

  function deleteTemplate(id: string) {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    if (expanded === id) setExpanded(null);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Sub-tabs */}
      <div className="flex gap-2">
        {(["bot", "mensagens"] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            className={[
              "flex items-center gap-1.5 rounded-full border-2 px-4 py-2 text-sm font-semibold transition-colors",
              view === v
                ? "bg-black text-white border-black"
                : "bg-[#FAFAFA] text-[#656565] border-[#F1f1f1]",
            ].join(" ")}
          >
            {v === "bot" ? (
              <><Sparkles className="w-3.5 h-3.5" /> Bot IA</>
            ) : (
              <><FileText className="w-3.5 h-3.5" /> Mensagens</>
            )}
          </button>
        ))}
      </div>

      {/* ── Bot canvas ─────────────────────────────────────────────────────────── */}
      {view === "bot" && (
        <div className="flex flex-col gap-3">
          <BotCanvas
            botConfig={botConfig}
            setBotConfig={setBotConfig}
            loading={botLoading}
            templates={templates}
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={saveBotConfig}
              disabled={botSaving || botLoading}
              className="flex-1 rounded-full bg-black text-white py-3.5 text-sm font-semibold disabled:opacity-50"
            >
              {botSaving ? "Salvando..." : botSaved ? "Salvo ✓" : "Salvar configurações"}
            </button>
          </div>
          <p className="text-xs text-[#656565] text-center">
            Webhook Evolution API →{" "}
            <span className="font-mono bg-[#F1f1f1] px-1 rounded">/api/webhooks/evolution</span>
          </p>
        </div>
      )}

      {/* ── Mensagens ──────────────────────────────────────────────────────────── */}
      {view === "mensagens" && (
        <div className="flex flex-col gap-3">

          {/* Header row */}
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[#111]">Templates de mensagem</p>
            <button
              type="button"
              onClick={() => { setCreatePanel((p) => !p); setGatilhoOpen(false); }}
              className={[
                "flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold border-2 transition-colors",
                createPanel ? "bg-black text-white border-black" : "bg-[#FAFAFA] text-[#111] border-[#F1f1f1]",
              ].join(" ")}
            >
              <Plus className="w-4 h-4" /> Novo template
            </button>
          </div>

          {/* Create panel */}
          {createPanel && (
            <div className="rounded-2xl border-2 border-[#F1f1f1] bg-[#FAFAFA] p-4 flex flex-col gap-4">
              <p className="font-bold text-sm">Novo template</p>

              {/* Nome */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#656565]">Nome do template</label>
                <input
                  value={newTpl.titulo}
                  onChange={(e) => setNewTpl((p) => ({ ...p, titulo: e.target.value }))}
                  placeholder="Ex: Pós-atendimento, Promoção..."
                  className="rounded-xl border-2 border-[#F1f1f1] bg-white px-4 py-2.5 text-sm focus:outline-none focus:border-black"
                />
              </div>

              {/* Gatilho */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#656565]">Gatilho — quando enviar</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setGatilhoOpen((p) => !p)}
                    className="w-full flex items-center justify-between rounded-xl border-2 border-[#F1f1f1] bg-white px-4 py-2.5 text-sm focus:outline-none focus:border-black text-left"
                  >
                    {newTpl.gatilho ? (
                      <span className="flex items-center gap-2">
                        <span>{GATILHOS.find((g) => g.value === newTpl.gatilho)?.icon}</span>
                        <span className="font-medium">{GATILHOS.find((g) => g.value === newTpl.gatilho)?.label}</span>
                      </span>
                    ) : (
                      <span className="text-[#656565]">Selecione um gatilho...</span>
                    )}
                    <ChevronDown className="w-4 h-4 text-[#656565]" />
                  </button>
                  {gatilhoOpen && (
                    <div className="absolute z-20 mt-1 w-full rounded-xl border-2 border-[#F1f1f1] bg-white shadow-lg overflow-hidden">
                      {newTpl.gatilho && (
                        <button
                          type="button"
                          onClick={() => { setNewTpl((p) => ({ ...p, gatilho: "" })); setGatilhoOpen(false); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-red-50 transition-colors border-b border-[#F1f1f1] text-red-500"
                        >
                          <X className="w-4 h-4" />
                          <span className="text-sm font-medium">Remover gatilho</span>
                        </button>
                      )}
                      {GATILHOS.map((g) => (
                        <button
                          key={g.value}
                          type="button"
                          onClick={() => { setNewTpl((p) => ({ ...p, gatilho: g.value })); setGatilhoOpen(false); }}
                          className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-[#FAFAFA] transition-colors border-b border-[#F1f1f1] last:border-0"
                        >
                          <span className="text-lg leading-none mt-0.5">{g.icon}</span>
                          <div className="flex-1">
                            <p className="text-sm font-semibold">{g.label}</p>
                            <p className="text-xs text-[#656565]">{g.descricao}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Mensagem */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#656565]">Mensagem</label>
                <textarea
                  value={newTpl.mensagem}
                  onChange={(e) => setNewTpl((p) => ({ ...p, mensagem: e.target.value }))}
                  placeholder="Olá {{cliente}}! ..."
                  rows={4}
                  className="w-full rounded-xl border-2 border-[#F1f1f1] bg-white px-4 py-3 text-sm focus:outline-none focus:border-black resize-none"
                />
                <div className="flex flex-wrap gap-1.5">
                  {TEMPLATE_VARIABLES.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setNewTpl((p) => ({ ...p, mensagem: p.mensagem + v }))}
                      className="rounded-full bg-white border border-[#F1f1f1] px-2 py-1 text-xs font-mono text-[#656565] hover:border-black transition-colors"
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button type="button" onClick={() => setCreatePanel(false)} className="flex-1 rounded-full border-2 border-[#F1f1f1] py-2.5 text-sm font-semibold text-[#656565]">Cancelar</button>
                <button type="button" onClick={createTemplate} disabled={!newTpl.titulo.trim() || !newTpl.mensagem.trim()} className="flex-1 rounded-full bg-black text-white py-2.5 text-sm font-semibold disabled:opacity-40">Criar template</button>
              </div>
            </div>
          )}

          {/* Template list */}
          {templates.map((t) => {
            const isExpanded = expanded === t.id;
            const gatilhoInfo = GATILHOS.find((g) => g.value === t.gatilho);
            return (
              <div key={t.id} className="rounded-xl border-2 border-[#F1f1f1] bg-[#FAFAFA] overflow-hidden">
                <div className="w-full flex items-center gap-3 p-4">
                  <button
                    type="button"
                    onClick={() => startEdit(t)}
                    className="flex items-center gap-3 flex-1 min-w-0 text-left"
                  >
                    <div className="w-9 h-9 rounded-lg bg-black flex items-center justify-center shrink-0 text-lg leading-none">
                      {gatilhoInfo ? gatilhoInfo.icon : <FileText className="w-4 h-4 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-sm">{t.titulo}</p>
                        {gatilhoInfo && (
                          <span className="rounded-full px-2 py-0.5 text-xs font-semibold flex items-center gap-1 bg-green-50 border border-green-200 text-green-700">
                            ⚡ {gatilhoInfo.label}
                          </span>
                        )}
                        {t.custom && (
                          <span className="rounded-full bg-indigo-50 border border-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-600">
                            Personalizado
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#656565] truncate mt-0.5">{t.descricao}</p>
                    </div>
                  </button>
                  <div className="flex items-center gap-1 shrink-0">
                    <button type="button" onClick={() => startEdit(t)} className="p-1.5 rounded-lg hover:bg-[#F1f1f1] transition-colors">
                      <Pencil className="w-4 h-4 text-[#656565]" />
                    </button>
                    {t.custom && (
                      <button type="button" onClick={() => deleteTemplate(t.id)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    )}
                  </div>
                </div>
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-[#F1f1f1] pt-3 flex flex-col gap-3">
                    {/* Gatilho editável */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-[#656565]">Gatilho — quando enviar</label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setEditGatilhoOpen((p) => p === t.id ? null : t.id)}
                          className="w-full flex items-center justify-between rounded-xl border-2 border-[#F1f1f1] bg-white px-3 py-2.5 text-sm focus:outline-none focus:border-black text-left"
                        >
                          {(() => {
                            const g = GATILHOS.find((g) => g.value === (draftGatilhos[t.id] ?? t.gatilho ?? "manual"));
                            return g ? (
                              <span className="flex items-center gap-2">
                                <span>{g.icon}</span>
                                <span className="font-medium">{g.label}</span>
                              </span>
                            ) : <span className="text-[#656565]">Selecione...</span>;
                          })()}
                          <ChevronDown className="w-4 h-4 text-[#656565]" />
                        </button>
                        {editGatilhoOpen === t.id && (
                          <div className="absolute z-20 mt-1 w-full rounded-xl border-2 border-[#F1f1f1] bg-white shadow-lg overflow-hidden">
                            {(draftGatilhos[t.id] ?? t.gatilho) && (
                              <button
                                type="button"
                                onClick={() => {
                                  setDraftGatilhos((prev) => ({ ...prev, [t.id]: "" }));
                                  setEditGatilhoOpen(null);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-red-50 transition-colors border-b border-[#F1f1f1] text-red-500"
                              >
                                <X className="w-4 h-4" />
                                <span className="text-sm font-medium">Remover gatilho</span>
                              </button>
                            )}
                            {GATILHOS.map((g) => {
                              const isSelected = (draftGatilhos[t.id] ?? t.gatilho ?? "") === g.value;
                              return (
                                <button
                                  key={g.value}
                                  type="button"
                                  onClick={() => {
                                    setDraftGatilhos((prev) => ({ ...prev, [t.id]: g.value }));
                                    setEditGatilhoOpen(null);
                                  }}
                                  className={[
                                    "w-full flex items-start gap-3 px-4 py-3 text-left transition-colors border-b border-[#F1f1f1] last:border-0",
                                    isSelected ? "bg-black/5" : "hover:bg-[#FAFAFA]",
                                  ].join(" ")}
                                >
                                  <span className="text-lg leading-none mt-0.5">{g.icon}</span>
                                  <div className="flex-1">
                                    <p className="text-sm font-semibold">{g.label}</p>
                                    <p className="text-xs text-[#656565]">{g.descricao}</p>
                                  </div>
                                  {isSelected && <Check className="w-4 h-4 text-black mt-1 shrink-0" />}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                    <textarea
                      value={drafts[t.id] ?? t.mensagem}
                      onChange={(e) => setDrafts((prev) => ({ ...prev, [t.id]: e.target.value }))}
                      rows={4}
                      className="w-full rounded-xl border-2 border-[#F1f1f1] bg-white px-4 py-3 text-sm focus:outline-none focus:border-black resize-none"
                    />
                    <div className="flex flex-wrap gap-1.5">
                      {TEMPLATE_VARIABLES.map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setDrafts((prev) => ({ ...prev, [t.id]: (prev[t.id] ?? t.mensagem) + v }))}
                          className="rounded-full bg-white border border-[#F1f1f1] px-2 py-1 text-xs font-mono text-[#656565] hover:border-black transition-colors"
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => saveTemplate(t.id)}
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
      )}
    </div>
  );
}

type NotificationToggleId =
  | "confirmacaoAgendamento"
  | "lembrete24h"
  | "avisoCancelamento"
  | "aniversario"
  | "pesquisaSatisfacao"
  | "novoAgendamento"
  | "cancelamentoEquipe"
  | "pagamentoRecebido"
  | "novoCliente";

type NotifItem = {
  id: NotificationToggleId;
  label: string;
  description: string;
  icon: React.ReactNode;
  templateId?: string;
};

type NotificationGroup = {
  titulo: string;
  subtitulo?: string;
  items: NotifItem[];
};

const NOTIFICATION_GROUPS: NotificationGroup[] = [
  {
    titulo: "Notificações clientes",
    items: [
      {
        id: "confirmacaoAgendamento",
        label: "Confirmação de agendamento",
        description: "Envia confirmação ao cliente assim que o horário é marcado",
        icon: <CheckCircle2 className="w-4 h-4 text-[#656565]" />,
        templateId: "confirmacao",
      },
      {
        id: "lembrete24h",
        label: "Lembrete 24h antes",
        description: "Lembrete automático enviado ao cliente no dia anterior",
        icon: <Clock className="w-4 h-4 text-[#656565]" />,
        templateId: "lembrete",
      },
      {
        id: "avisoCancelamento",
        label: "Aviso de cancelamento",
        description: "Notifica o cliente quando um agendamento é cancelado",
        icon: <XCircle className="w-4 h-4 text-[#656565]" />,
        templateId: "cancelamento_barbearia",
      },
      {
        id: "aniversario",
        label: "Aniversário",
        description: "Mensagem automática de parabéns no dia do aniversário",
        icon: <Gift className="w-4 h-4 text-[#656565]" />,
        templateId: "aniversario",
      },
      {
        id: "pesquisaSatisfacao",
        label: "Pesquisa de satisfação",
        description: "Enviada ao cliente após o atendimento ser concluído",
        icon: <Star className="w-4 h-4 text-[#656565]" />,
        templateId: "pesquisaSatisfacao",
      },
    ],
  },
  {
    titulo: "Notificações equipe",
    subtitulo: "Enviadas pelo número cadastrado como barbearia",
    items: [
      {
        id: "novoAgendamento",
        label: "Novo agendamento",
        description: "Avisa o barbeiro responsável quando um cliente agenda",
        icon: <CalendarDays className="w-4 h-4 text-[#656565]" />,
        templateId: "equipe_novoAgendamento",
      },
      {
        id: "cancelamentoEquipe",
        label: "Cancelamento pelo cliente",
        description: "Avisa o barbeiro quando um cliente cancela o horário",
        icon: <XCircle className="w-4 h-4 text-[#656565]" />,
        templateId: "equipe_cancelamento",
      },
    ],
  },
  {
    titulo: "Notificações barbearia",
    subtitulo: "Enviadas pelo número cadastrado como barbearia",
    items: [
      {
        id: "pagamentoRecebido",
        label: "Pagamento recebido",
        description: "Avisa a barbearia quando um pagamento é aprovado",
        icon: <CheckCircle2 className="w-4 h-4 text-[#656565]" />,
        templateId: "barbearia_pagamento",
      },
      {
        id: "novoCliente",
        label: "Novo cliente cadastrado",
        description: "Avisa quando um novo cliente cria conta na plataforma",
        icon: <Star className="w-4 h-4 text-[#656565]" />,
        templateId: "barbearia_novoCliente",
      },
    ],
  },
];

const TEMPLATE_VARS_HINT = ["{{cliente}}", "{{barbearia}}", "{{data}}", "{{horario}}", "{{servico}}", "{{preco}}"];

function NotificationToggleRow({
  item,
  last,
  enabled,
  onToggle,
  templateText,
  onSaveTemplate,
}: {
  item: NotifItem;
  last: boolean;
  enabled: boolean;
  onToggle: () => void;
  templateText: string;
  onSaveTemplate: (text: string) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState(templateText);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setDraft(templateText); }, [templateText]);

  async function handleSave() {
    setSaving(true);
    await onSaveTemplate(draft);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className={!last ? "border-b border-[#F1f1f1]" : ""}>
      <div className="flex items-center gap-3 p-4">
        <div className="w-9 h-9 rounded-lg bg-white border-2 border-[#F1f1f1] flex items-center justify-center shrink-0">
          {item.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">{item.label}</p>
          <p className="text-xs text-[#656565]">{item.description}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {item.templateId && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="w-8 h-8 rounded-full bg-white border-2 border-[#F1f1f1] flex items-center justify-center text-[#656565]"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
          <button type="button" onClick={onToggle}>
            {enabled ? (
              <ToggleRight className="w-7 h-7 text-black" />
            ) : (
              <ToggleLeft className="w-7 h-7 text-[#656565]" />
            )}
          </button>
        </div>
      </div>

      {expanded && item.templateId && (
        <div className="px-4 pb-4 flex flex-col gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={4}
            className="w-full rounded-xl border-2 border-[#F1f1f1] bg-white px-4 py-3 text-sm focus:outline-none focus:border-black resize-none"
          />
          <div className="flex flex-wrap gap-1">
            {TEMPLATE_VARS_HINT.map((v) => (
              <span key={v} className="rounded-full bg-white border border-[#F1f1f1] px-2 py-0.5 text-xs font-mono text-[#656565]">
                {v}
              </span>
            ))}
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-full bg-black text-white py-2.5 text-sm font-semibold disabled:opacity-50"
          >
            {saving ? "Salvando..." : saved ? "Salvo ✓" : "Salvar mensagem"}
          </button>
        </div>
      )}
    </div>
  );
}

function WhatsappNotificacoes() {
  const [enabled, setEnabled] = useState<Record<NotificationToggleId, boolean>>({
    confirmacaoAgendamento: true,
    lembrete24h: true,
    avisoCancelamento: true,
    aniversario: false,
    pesquisaSatisfacao: false,
    novoAgendamento: true,
    cancelamentoEquipe: true,
    pagamentoRecebido: false,
    novoCliente: false,
  });
  const [templates, setTemplates] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/whatsapp/templates")
      .then((r) => r.json())
      .then((data: Array<{ id: string; mensagem: string }>) => {
        const map: Record<string, string> = {};
        data.forEach((t) => { map[t.id] = t.mensagem; });
        setTemplates(map);
      })
      .catch(() => {});
  }, []);

  async function saveTemplate(templateId: string, mensagem: string) {
    await fetch("/api/whatsapp/templates", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: templateId, mensagem }),
    });
    setTemplates((prev) => ({ ...prev, [templateId]: mensagem }));
  }

  function toggle(id: NotificationToggleId) {
    setEnabled((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div className="flex flex-col gap-5">
      {NOTIFICATION_GROUPS.map((group) => (
        <div key={group.titulo}>
          <div className="mb-2 px-1">
            <p className="text-xs font-semibold text-[#656565] uppercase tracking-wide">{group.titulo}</p>
            {group.subtitulo && (
              <p className="text-xs text-[#656565] mt-0.5">{group.subtitulo}</p>
            )}
          </div>
          <div className="rounded-xl border-2 border-[#F1f1f1] bg-[#FAFAFA] overflow-hidden">
            {group.items.map((item, i) => (
              <NotificationToggleRow
                key={item.id}
                item={item}
                last={i === group.items.length - 1}
                enabled={enabled[item.id]}
                onToggle={() => toggle(item.id)}
                templateText={item.templateId ? (templates[item.templateId] ?? "") : ""}
                onSaveTemplate={(text) => item.templateId ? saveTemplate(item.templateId, text) : Promise.resolve()}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function Whatsapp() {
  const [section, setSection] = useState<WhatsappSection>("conexoes");

  return (
    <div className="flex flex-col gap-5 lg:max-w-4xl xl:max-w-7xl lg:mx-auto">
      <div>
        <h1 className="text-2xl font-bold">WhatsApp</h1>
        <p className="text-sm text-[#656565]">
          Conexão, equipe, templates e notificações automáticas
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {whatsappSections.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => setSection(s.value)}
            className={[
              "flex items-center gap-1.5 rounded-full border-2 px-4 py-2 text-sm font-semibold shrink-0",
              section === s.value
                ? "bg-black text-white border-black"
                : "bg-[#FAFAFA] text-[#656565] border-[#F1f1f1]",
            ].join(" ")}
          >
            {s.icon}
            {s.label}
          </button>
        ))}
      </div>

      {section === "conexoes" && <WhatsappConexoes />}
      {section === "equipe" && <WhatsappEquipe />}
      {section === "templates" && <WhatsappTemplates />}
      {section === "notificacoes" && <WhatsappNotificacoes />}
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
    {
      tab: "whatsapp",
      label: "WhatsApp",
      icon: <MessageCircle className="w-5 h-5" />,
    },
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
            <p className="font-bold text-sm truncate">Barber</p>
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
        {activeTab === "whatsapp" && <Whatsapp />}
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
