"use client";

import { useState, useMemo } from "react";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Settings,
  Search,
  ChevronRight,
  Star,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Phone,
  Scissors,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AdminTab = "dashboard" | "agenda" | "clientes" | "config";

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
  { id: 1, client: "Lucas Souza", initials: "LS", service: "Corte + Barba", time: "08:00", status: "concluido", price: "R$ 80,00" },
  { id: 2, client: "Rafael Mendes", initials: "RM", service: "Corte de Cabelo", time: "09:00", status: "concluido", price: "R$ 50,00" },
  { id: 3, client: "João Pedro", initials: "JP", service: "Barba", time: "10:00", status: "confirmado", price: "R$ 35,00" },
  { id: 4, client: "Carlos Lima", initials: "CL", service: "Corte de Cabelo", time: "11:00", status: "confirmado", price: "R$ 50,00" },
  { id: 5, client: "Felipe Costa", initials: "FC", service: "Pezinho", time: "13:00", status: "pendente", price: "R$ 25,00" },
  { id: 6, client: "André Rocha", initials: "AR", service: "Corte + Barba", time: "14:00", status: "pendente", price: "R$ 80,00" },
  { id: 7, client: "Mateus Alves", initials: "MA", service: "Corte de Cabelo", time: "15:00", status: "cancelado", price: "R$ 50,00" },
  { id: 8, client: "Bruno Neves", initials: "BN", service: "Barba", time: "16:00", status: "confirmado", price: "R$ 35,00" },
];

const clients: Client[] = [
  { id: 1, name: "Lucas Souza", initials: "LS", phone: "(11) 99999-1111", lastVisit: "24/06/2026", totalVisits: 18, totalSpent: "R$ 1.440,00", isNew: false },
  { id: 2, name: "Rafael Mendes", initials: "RM", phone: "(11) 99999-2222", lastVisit: "24/06/2026", totalVisits: 12, totalSpent: "R$ 600,00", isNew: false },
  { id: 3, name: "João Pedro", initials: "JP", phone: "(11) 99999-3333", lastVisit: "20/06/2026", totalVisits: 7, totalSpent: "R$ 420,00", isNew: false },
  { id: 4, name: "Carlos Lima", initials: "CL", phone: "(11) 99999-4444", lastVisit: "18/06/2026", totalVisits: 24, totalSpent: "R$ 1.920,00", isNew: false },
  { id: 5, name: "Felipe Costa", initials: "FC", phone: "(11) 99999-5555", lastVisit: "15/06/2026", totalVisits: 3, totalSpent: "R$ 150,00", isNew: true },
  { id: 6, name: "André Rocha", initials: "AR", phone: "(11) 99999-6666", lastVisit: "10/06/2026", totalVisits: 9, totalSpent: "R$ 720,00", isNew: false },
  { id: 7, name: "Mateus Alves", initials: "MA", phone: "(11) 99999-7777", lastVisit: "05/06/2026", totalVisits: 2, totalSpent: "R$ 100,00", isNew: true },
  { id: 8, name: "Bruno Neves", initials: "BN", phone: "(11) 99999-8888", lastVisit: "01/06/2026", totalVisits: 31, totalSpent: "R$ 2.480,00", isNew: false },
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

const statusConfig: Record<AppointmentStatus, { label: string; color: string; icon: React.ReactNode }> = {
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
    <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${cfg.color}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

function Avatar({ initials, size = "md" }: { initials: string; size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-14 h-14 text-base" };
  return (
    <div className={`${sizes[size]} rounded-full bg-black text-white flex items-center justify-center font-bold shrink-0`}>
      {initials}
    </div>
  );
}

function Dashboard() {
  const todayConfirmed = appointments.filter((a) => a.status === "confirmado").length;
  const todayTotal = appointments.length;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[#656565] text-sm">Terça-feira, 24 de junho</p>
          <h1 className="text-2xl font-bold">Olá, Yvison</h1>
        </div>
        <Avatar initials="YV" size="lg" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border-2 border-[#F1f1f1] bg-[#FAFAFA] p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#656565] uppercase">Hoje</span>
            <CalendarDays className="w-4 h-4 text-[#656565]" />
          </div>
          <p className="text-2xl font-bold">{todayTotal}</p>
          <p className="text-xs text-[#656565]">{todayConfirmed} confirmados</p>
        </div>
        <div className="rounded-xl border-2 border-[#F1f1f1] bg-[#FAFAFA] p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#656565] uppercase">Mês</span>
            <TrendingUp className="w-4 h-4 text-[#656565]" />
          </div>
          <p className="text-2xl font-bold">R$ 3.200</p>
          <p className="text-xs text-emerald-600 font-semibold">+12% vs mês anterior</p>
        </div>
        <div className="rounded-xl border-2 border-[#F1f1f1] bg-[#FAFAFA] p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#656565] uppercase">Clientes</span>
            <Users className="w-4 h-4 text-[#656565]" />
          </div>
          <p className="text-2xl font-bold">142</p>
          <p className="text-xs text-[#656565]">8 novos este mês</p>
        </div>
        <div className="rounded-xl border-2 border-[#F1f1f1] bg-[#FAFAFA] p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#656565] uppercase">Avaliação</span>
            <Star className="w-4 h-4 text-[#656565]" />
          </div>
          <p className="text-2xl font-bold">5,0</p>
          <p className="text-xs text-[#656565]">889 avaliações</p>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between pb-3">
          <h2 className="font-bold">Próximos agendamentos</h2>
        </div>
        <div className="flex flex-col gap-3">
          {appointments
            .filter((a) => a.status === "confirmado" || a.status === "pendente")
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

      <div>
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
  );
}

function Agenda() {
  const [selectedDay, setSelectedDay] = useState(0);
  const [filterStatus, setFilterStatus] = useState<AppointmentStatus | "todos">("todos");

  const filtered = useMemo(() => {
    if (filterStatus === "todos") return appointments;
    return appointments.filter((a) => a.status === filterStatus);
  }, [filterStatus]);

  const statusFilters: Array<{ value: AppointmentStatus | "todos"; label: string }> = [
    { value: "todos", label: "Todos" },
    { value: "confirmado", label: "Confirmados" },
    { value: "pendente", label: "Pendentes" },
    { value: "concluido", label: "Concluídos" },
  ];

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold">Agenda</h1>

      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {weekDays.map((d, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setSelectedDay(i)}
            className={[
              "flex flex-col items-center gap-1 rounded-xl border-2 px-3 py-2 shrink-0 min-w-[52px]",
              selectedDay === i
                ? "bg-black text-white border-black"
                : "bg-[#FAFAFA] text-black border-[#F1f1f1]",
            ].join(" ")}
          >
            <span className="text-xs font-semibold opacity-70">{d.label}</span>
            <span className="text-lg font-bold leading-none">{d.day}</span>
            {d.isToday && (
              <div className={`w-1.5 h-1.5 rounded-full ${selectedDay === i ? "bg-white" : "bg-black"}`} />
            )}
          </button>
        ))}
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

      <div className="flex flex-col gap-3">
        {filtered.length === 0 && (
          <p className="text-center text-[#656565] py-8">Nenhum agendamento encontrado.</p>
        )}
        {filtered.map((apt) => (
          <div
            key={apt.id}
            className="rounded-xl border-2 border-[#F1f1f1] bg-[#FAFAFA] p-4 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-sm font-semibold text-[#656565]">
                <Clock className="w-4 h-4" />
                {apt.time}
              </div>
              <StatusPill status={apt.status} />
            </div>
            <div className="flex items-center gap-3">
              <Avatar initials={apt.initials} />
              <div className="flex-1 min-w-0">
                <p className="font-bold">{apt.client}</p>
                <p className="text-sm text-[#656565]">{apt.service}</p>
              </div>
              <p className="font-bold shrink-0">{apt.price}</p>
            </div>
            {(apt.status === "confirmado" || apt.status === "pendente") && (
              <div className="flex gap-2 pt-1 border-t border-[#F1f1f1]">
                <button
                  type="button"
                  className="flex-1 rounded-full border-2 border-[#F1f1f1] bg-white py-2 text-sm font-semibold text-red-500"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="flex-1 rounded-full bg-black text-white py-2 text-sm font-semibold"
                >
                  Concluir
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Clientes() {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return clients;
    return clients.filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase()),
    );
  }, [search]);

  const newClients = clients.filter((c) => c.isNew).length;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <div className="flex gap-2">
          <div className="rounded-full bg-[#FAFAFA] border-2 border-[#F1f1f1] px-3 py-1 text-xs font-semibold">
            {clients.length} total
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

      <div className="flex flex-col gap-3">
        {filtered.length === 0 && (
          <p className="text-center text-[#656565] py-8">Nenhum cliente encontrado.</p>
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

function Config() {
  return (
    <div className="flex flex-col gap-5">
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

      {[
        {
          section: "Barbearia",
          items: [
            { label: "Nome da barbearia", value: "YvisonBarber" },
            { label: "Endereço", value: "Av. São Sebastião, 357" },
            { label: "Telefone", value: "(11) 99999-0000" },
          ],
        },
        {
          section: "Serviços",
          items: [
            { label: "Gerenciar serviços", value: "4 ativos" },
            { label: "Horário de funcionamento", value: "08:00 – 18:00" },
          ],
        },
        {
          section: "Notificações",
          items: [
            { label: "Novos agendamentos", value: "Ativado" },
            { label: "Cancelamentos", value: "Ativado" },
          ],
        },
      ].map((group) => (
        <div key={group.section}>
          <p className="text-xs font-semibold text-[#656565] uppercase pb-2">
            {group.section}
          </p>
          <div className="rounded-xl border-2 border-[#F1f1f1] bg-[#FAFAFA] overflow-hidden">
            {group.items.map((item, i) => (
              <div
                key={item.label}
                className={[
                  "flex items-center justify-between px-4 py-3.5",
                  i < group.items.length - 1 ? "border-b border-[#F1f1f1]" : "",
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
      ))}

      <button
        type="button"
        className="w-full rounded-full border-2 border-red-200 bg-red-50 py-4 text-sm font-semibold text-red-600 mt-2"
      >
        Sair da conta
      </button>
    </div>
  );
}

const navItems: Array<{ tab: AdminTab; label: string; icon: React.ReactNode }> = [
  { tab: "dashboard", label: "Início", icon: <LayoutDashboard className="w-5 h-5" /> },
  { tab: "agenda", label: "Agenda", icon: <CalendarDays className="w-5 h-5" /> },
  { tab: "clientes", label: "Clientes", icon: <Users className="w-5 h-5" /> },
  { tab: "config", label: "Config", icon: <Settings className="w-5 h-5" /> },
];

const Admin = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");

  return (
    <div className="bg-zinc-50 min-h-screen">
      <div className="max-w-md mx-auto px-5 pt-10 pb-28">
        {activeTab === "dashboard" && <Dashboard />}
        {activeTab === "agenda" && <Agenda />}
        {activeTab === "clientes" && <Clientes />}
        {activeTab === "config" && <Config />}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-[#F1f1f1] z-50">
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
