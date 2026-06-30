"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon, CalendarDays, Clock, Scissors, X } from "lucide-react";
import { useStore } from "@/app/context/store";
import ClientBottomNav from "@/app/components/client-bottom-nav";

type Agendamento = {
  id: string;
  data: string;
  horario: string;
  total: number;
  status: "PENDENTE" | "CONFIRMADO" | "CANCELADO" | "CONCLUIDO";
  barbeiro: { nome: string };
  servicos: Array<{ servico: { nome: string; preco: number } }>;
};

const statusLabel: Record<Agendamento["status"], string> = {
  PENDENTE: "Pendente",
  CONFIRMADO: "Confirmado",
  CANCELADO: "Cancelado",
  CONCLUIDO: "Concluído",
};

const statusColor: Record<Agendamento["status"], string> = {
  PENDENTE: "bg-amber-50 text-amber-700 border border-amber-200",
  CONFIRMADO: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  CANCELADO: "bg-red-50 text-red-600 border border-red-200",
  CONCLUIDO: "bg-[#FAFAFA] text-[#656565] border border-[#F1f1f1]",
};

const cancelable = (status: Agendamento["status"]) =>
  status === "PENDENTE" || status === "CONFIRMADO";

export default function AgendamentosPage() {
  const router = useRouter();
  const { user } = useStore();
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  const fetchAgendamentos = useCallback((clienteId: string) => {
    fetch(`/api/reservas?clienteId=${clienteId}`)
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setAgendamentos(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user) {
      router.replace("/cadastro");
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const booked = params.get("booked");

    if (booked === "1") {
      const raw = localStorage.getItem("pendingBooking");
      if (raw) {
        try {
          const booking = JSON.parse(raw);
          fetch("/api/reservas", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ clienteId: user.id, ...booking }),
          })
            .then(() => {
              localStorage.removeItem("pendingBooking");
              router.replace("/agendamentos");
              fetchAgendamentos(user.id);
            })
            .catch(() => fetchAgendamentos(user.id));
          return;
        } catch {}
      }
    }

    fetchAgendamentos(user.id);
  }, [user, router, fetchAgendamentos]);

  async function handleCancel(id: string) {
    setCancelingId(id);
    try {
      await fetch(`/api/reservas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELADO" }),
      });
      setAgendamentos((prev) =>
        prev.map((ag) => (ag.id === id ? { ...ag, status: "CANCELADO" } : ag)),
      );
    } catch {}
    setCancelingId(null);
    setConfirmingId(null);
  }

  const confirmingAgendamento = agendamentos.find((ag) => ag.id === confirmingId);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-white flex flex-col pb-24">
      <ClientBottomNav />

      <div className="px-5 pt-8 pb-4 flex items-center gap-3 border-b border-[#F1f1f1]">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="w-10 h-10 rounded-full bg-[#F1f1f1] flex items-center justify-center"
        >
          <ArrowLeftIcon className="w-4 h-4" />
        </button>
        <h1 className="text-xl font-bold">Meus agendamentos</h1>
      </div>

      <div className="flex-1 px-5 py-6">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
          </div>
        ) : agendamentos.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-[#F1f1f1] flex items-center justify-center">
              <CalendarDays className="w-8 h-8 text-[#656565]" />
            </div>
            <div>
              <p className="font-bold text-lg">Nenhum agendamento ainda</p>
              <p className="text-sm text-[#656565] mt-1">
                Seus agendamentos aparecerão aqui após a confirmação.
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="mt-2 rounded-full bg-black text-white px-8 py-3.5 text-sm font-semibold"
            >
              Agendar agora
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {agendamentos.map((ag) => (
              <div
                key={ag.id}
                className="rounded-2xl border-2 border-[#F1f1f1] bg-[#FAFAFA] p-4 flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <p className="font-bold text-base">{ag.barbeiro.nome}</p>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColor[ag.status]}`}
                    >
                      {statusLabel[ag.status]}
                    </span>
                    {cancelable(ag.status) && (
                      <button
                        type="button"
                        onClick={() => setConfirmingId(ag.id)}
                        className="w-7 h-7 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-red-500 hover:bg-red-100 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  {ag.servicos.map(({ servico }) => (
                    <div key={servico.nome} className="flex items-center gap-2 text-sm">
                      <Scissors className="w-3.5 h-3.5 text-[#656565] shrink-0" />
                      <span className="font-semibold">{servico.nome}</span>
                      <span className="text-[#656565] ml-auto">
                        R$ {servico.preco.toFixed(2).replace(".", ",")}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-[#F1f1f1] pt-3 flex items-center gap-4 text-sm text-[#656565]">
                  <div className="flex items-center gap-1.5">
                    <CalendarDays className="w-3.5 h-3.5" />
                    {new Date(ag.data).toLocaleDateString("pt-BR", {
                      weekday: "short",
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                  {ag.horario && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {ag.horario}
                    </div>
                  )}
                  <span className="ml-auto font-bold text-black">
                    R$ {ag.total.toFixed(2).replace(".", ",")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Overlay de confirmação */}
      {confirmingId && confirmingAgendamento && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center pb-8 px-5"
          onClick={() => setConfirmingId(null)}
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl p-6 flex flex-col gap-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                <X className="w-6 h-6 text-red-500" />
              </div>
              <button
                type="button"
                onClick={() => setConfirmingId(null)}
                className="w-8 h-8 rounded-full bg-[#F1f1f1] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <p className="font-bold text-lg">Cancelar agendamento?</p>
              <p className="text-sm text-[#656565] mt-1">
                Você está prestes a cancelar o agendamento com{" "}
                <span className="font-semibold text-black">
                  {confirmingAgendamento.barbeiro.nome}
                </span>{" "}
                — {confirmingAgendamento.servicos.map((s) => s.servico.nome).join(", ")}.
                Esta ação não pode ser desfeita.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmingId(null)}
                className="flex-1 rounded-full border-2 border-[#F1f1f1] bg-white py-3.5 text-sm font-semibold"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={() => handleCancel(confirmingId)}
                disabled={cancelingId === confirmingId}
                className="flex-1 rounded-full bg-red-500 text-white py-3.5 text-sm font-semibold disabled:opacity-60"
              >
                {cancelingId === confirmingId ? "Cancelando..." : "Sim, cancelar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
