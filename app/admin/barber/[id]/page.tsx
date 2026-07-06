"use client";

import { use, useState, useMemo } from "react";
import { useStore } from "@/app/context/store";
import {
  LayoutDashboard,
  CalendarDays,
  User,
  ArrowLeft,
  Clock,
  TrendingUp,
  Star,
  Scissors,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Camera,
  Plus,
  Check,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

type BarberTab = "dashboard" | "agenda" | "perfil";

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

const mockAppointments: Appointment[] = [
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
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const sizes = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-14 h-14 text-base",
    xl: "w-20 h-20 text-xl",
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

function getInitials(name: string) {
  return name
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

function Dashboard({ barberId }: { barberId: string }) {
  const { barbers, services } = useStore();
  const barber = barbers.find((b) => String(b.id) === barberId);

  const todayConfirmed = mockAppointments.filter(
    (a) => a.status === "confirmado",
  ).length;
  const todayDone = mockAppointments.filter(
    (a) => a.status === "concluido",
  ).length;
  const todayTotal = mockAppointments.filter(
    (a) => a.status !== "cancelado",
  ).length;
  const todayRevenue = mockAppointments
    .filter((a) => a.status === "concluido")
    .reduce(
      (acc, a) =>
        acc + parseFloat(a.price.replace("R$ ", "").replace(",", ".")),
      0,
    );

  const barberServices = barber
    ? services.filter((s) => barber.serviceIds.includes(s.id))
    : [];

  const popularServices = [
    { name: "Corte de Cabelo", count: 48, percent: 80 },
    { name: "Corte + Barba", count: 31, percent: 52 },
    { name: "Barba", count: 20, percent: 33 },
    { name: "Pezinho", count: 9, percent: 15 },
  ].filter((s) => barberServices.some((bs) => bs.name === s.name));

  if (!barber) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <p className="text-[#656565]">Barbeiro não encontrado.</p>
        <Link href="/admin" className="text-sm font-semibold underline">
          Voltar ao admin
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 ">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[#656565] text-sm">Terça-feira, 24 de junho</p>
          <h1 className="text-2xl font-bold">
            Olá, {barber.name.split(" ")[0]}
          </h1>
        </div>
        <Avatar initials={barber.initials} src={barber.photo} size="lg" />
      </div>

      <div className="grid grid-cols-2 gap-3">
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
              Receita hoje
            </span>
            <TrendingUp className="w-4 h-4 text-[#656565]" />
          </div>
          <p className="text-2xl font-bold">R$ {todayRevenue.toFixed(0)}</p>
          <p className="text-xs text-[#656565]">{todayDone} cortes feitos</p>
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
              Avaliação
            </span>
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
          {mockAppointments
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

      {barberServices.length > 0 && (
        <div>
          <h2 className="font-bold pb-3">Meus serviços</h2>
          <div className="flex flex-col gap-2">
            {popularServices.length > 0
              ? popularServices.map((s) => (
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
                ))
              : barberServices.map((s) => (
                  <div key={s.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#FAFAFA] border-2 border-[#F1f1f1] flex items-center justify-center shrink-0">
                      <Scissors className="w-3.5 h-3.5 text-[#656565]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{s.name}</p>
                      <p className="text-xs text-[#656565]">
                        {s.duration} min · R${" "}
                        {s.price.toFixed(2).replace(".", ",")}
                      </p>
                    </div>
                  </div>
                ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Agenda() {
  const [selectedDay, setSelectedDay] = useState(0);
  const [filterStatus, setFilterStatus] = useState<AppointmentStatus | "todos">(
    "todos",
  );

  const filtered = useMemo(() => {
    if (filterStatus === "todos") return mockAppointments;
    return mockAppointments.filter((a) => a.status === filterStatus);
  }, [filterStatus]);

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
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold">Minha Agenda</h1>

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
              <div
                className={`w-1.5 h-1.5 rounded-full ${selectedDay === i ? "bg-white" : "bg-black"}`}
              />
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
          <p className="text-center text-[#656565] py-8">
            Nenhum agendamento encontrado.
          </p>
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

function Perfil({ barberId }: { barberId: string }) {
  const { barbers, setBarbers, services } = useStore();
  const barber = barbers.find((b) => String(b.id) === barberId);

  const [form, setForm] = useState({
    name: barber?.name ?? "",
    description: barber?.description ?? "",
    photo: barber?.photo ?? "",
  });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!barber) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <p className="text-[#656565]">Barbeiro não encontrado.</p>
      </div>
    );
  }

  const barberServices = services.filter((s) =>
    barber.serviceIds.includes(s.id),
  );

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await fetch(`/api/barbeiros/${barber!.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: form.name.trim(),
          descricao: form.description.trim(),
          foto: form.photo,
        }),
      });
      setBarbers((prev) =>
        prev.map((b) =>
          b.id === barber!.id
            ? {
                ...b,
                name: form.name.trim(),
                initials: getInitials(form.name),
                description: form.description.trim(),
                photo: form.photo || undefined,
              }
            : b,
        ),
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {}
    setSaving(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Meu Perfil</h1>

      {/* Foto */}
      <div className="flex flex-col items-center gap-3">
        <label className="relative cursor-pointer">
          <div className="w-24 h-24 rounded-full bg-[#F1f1f1] border-2 border-[#E0E0E0] overflow-hidden flex items-center justify-center">
            {form.photo ? (
              <img
                src={form.photo}
                alt="foto"
                className="w-full h-full object-cover"
              />
            ) : (
              <Avatar
                initials={getInitials(form.name || barber.initials)}
                size="xl"
              />
            )}
          </div>
          <div className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-black border-2 border-white flex items-center justify-center">
            <Camera className="w-3.5 h-3.5 text-white" />
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
                setForm((p) => ({ ...p, photo: ev.target?.result as string }));
              reader.readAsDataURL(file);
            }}
          />
        </label>
        <p className="text-xs text-[#656565]">Toque para alterar a foto</p>
      </div>

      {/* Campos */}
      <div className="flex flex-col gap-4">
        <div>
          <label className="text-xs font-semibold text-[#656565] uppercase block pb-1">
            Nome
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="Seu nome"
            className="w-full rounded-xl border-2 border-[#F1f1f1] bg-[#FAFAFA] px-4 py-3 text-sm focus:outline-none focus:border-black"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-[#656565] uppercase block pb-1">
            Descrição
          </label>
          <textarea
            value={form.description}
            onChange={(e) =>
              setForm((p) => ({ ...p, description: e.target.value }))
            }
            placeholder="Fale um pouco sobre você..."
            rows={3}
            className="w-full rounded-xl border-2 border-[#F1f1f1] bg-[#FAFAFA] px-4 py-3 text-sm focus:outline-none focus:border-black resize-none"
          />
        </div>
      </div>

      {/* Serviços */}
      {barberServices.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-[#656565] uppercase pb-2">
            Serviços que realizo
          </p>
          <div className="flex flex-wrap gap-2">
            {barberServices.map((s) => (
              <span
                key={s.id}
                className="rounded-full bg-black text-white px-3 py-1.5 text-xs font-semibold"
              >
                {s.name}
              </span>
            ))}
          </div>
          <p className="text-xs text-[#656565] mt-2">
            Para alterar os serviços, acesse o painel admin.
          </p>
        </div>
      )}

      {/* Estatísticas rápidas */}
      <div>
        <p className="text-xs font-semibold text-[#656565] uppercase pb-2">
          Estatísticas
        </p>
        <div className="rounded-xl border-2 border-[#F1f1f1] bg-[#FAFAFA] overflow-hidden">
          {[
            { label: "Cortes este mês", value: "64" },
            { label: "Clientes atendidos", value: "142" },
            { label: "Avaliação média", value: "5,0 ★" },
            { label: "Taxa de retorno", value: "78%" },
          ].map((item, i, arr) => (
            <div
              key={item.label}
              className={[
                "flex items-center justify-between px-4 py-3.5",
                i < arr.length - 1 ? "border-b border-[#F1f1f1]" : "",
              ].join(" ")}
            >
              <p className="text-sm font-semibold">{item.label}</p>
              <p className="text-sm font-bold">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={!form.name.trim() || saving}
        className={[
          "w-full rounded-full py-4 text-sm font-semibold transition-colors",
          saved
            ? "bg-emerald-600 text-white"
            : "bg-black text-white disabled:opacity-40",
        ].join(" ")}
      >
        {saved ? (
          <span className="flex items-center justify-center gap-2">
            <Check className="w-4 h-4" />
            Salvo!
          </span>
        ) : saving ? (
          "Salvando..."
        ) : (
          "Salvar alterações"
        )}
      </button>
    </div>
  );
}

const navItems: Array<{
  tab: BarberTab;
  label: string;
  icon: React.ReactNode;
}> = [
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
  { tab: "perfil", label: "Perfil", icon: <User className="w-5 h-5" /> },
];

export default function BarberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [activeTab, setActiveTab] = useState<BarberTab>("dashboard");

  return (
    <div className="bg-zinc-50 min-h-screen">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-white border-b-2 border-[#F1f1f1]">
        <div className="max-w-md mx-auto flex items-center gap-3 px-5 py-4">
          <Link
            href="/admin"
            className="w-8 h-8 rounded-full border-2 border-[#F1f1f1] bg-[#FAFAFA] flex items-center justify-center shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <p className="font-bold text-sm">Painel do Barbeiro</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-5 pt-24 pb-28">
        {activeTab === "dashboard" && <Dashboard barberId={id} />}
        {activeTab === "agenda" && <Agenda />}
        {activeTab === "perfil" && <Perfil barberId={id} />}
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
}
