"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useStore } from "@/app/context/store";

export default function EntrarPage() {
  const router = useRouter();
  const { user, setUser } = useStore();

  useEffect(() => {
    if (user) {
      router.replace("/agendamentos");
    }
  }, [user, router]);

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleSubmit() {
    setErro(null);
    if (!email.trim() || !senha) {
      setErro("Preencha email e senha");
      return;
    }
    setLoading(true);
    fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), senha }),
    })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) {
          setErro(data.error ?? "Não foi possível entrar");
          return;
        }
        setUser({
          id: data.id,
          name: data.nome,
          phone: data.telefone,
          email: data.email,
        });

        const raw = localStorage.getItem("pendingBooking");
        if (raw) {
          try {
            const booking = JSON.parse(raw);
            await fetch("/api/reservas", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ clienteId: data.id, ...booking }),
            });
            localStorage.removeItem("pendingBooking");
          } catch {}
        }

        router.push("/agendamentos");
      })
      .catch(() => setErro("Erro ao entrar. Tente novamente."))
      .finally(() => setLoading(false));
  }

  const inputClass =
    "w-full rounded-xl border-2 border-[#F1f1f1] bg-[#FAFAFA] px-4 py-3.5 text-sm focus:outline-none focus:border-black";

  return (
    <div className="flex h-screen flex-col justify-center">
      <div className="bg-white flex flex-col">
        <div className="pt-8 pb-2 flex justify-center gap-3">
          <div>
            <h1 className="text-3xl text-center mb-6 font-bold">Barber</h1>
            <h1 className="text-xl text-center mb-2 font-bold">
              Bem-vindo de volta!
            </h1>
            <p className="text-sm text-[#656565]">
              Entre com seu email e senha
            </p>
          </div>
        </div>

        <div className="pt-6 px-4 pb-10 flex flex-col gap-4 flex-1">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#656565] uppercase">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#656565] uppercase">
              Senha
            </label>
            <div className="relative">
              <input
                type={mostrarSenha ? "text" : "password"}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Sua senha"
                className={inputClass + " pr-12"}
              />
              <button
                type="button"
                onClick={() => setMostrarSenha((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#656565]"
              >
                {mostrarSenha ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {erro && (
            <p className="text-red-500 text-sm font-medium text-center">
              {erro}
            </p>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="w-full rounded-full bg-black text-white py-4 text-sm font-semibold disabled:opacity-50 mt-2"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>

          <button
            type="button"
            onClick={() => router.push("/cadastro")}
            className="w-full text-center text-sm text-[#656565] font-semibold mt-2"
          >
            Não tem conta? Criar conta
          </button>
        </div>
      </div>
    </div>
  );
}
