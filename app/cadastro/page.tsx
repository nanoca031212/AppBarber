"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { ArrowLeftIcon, Eye, EyeOff } from "lucide-react";
import { useStore } from "@/app/context/store";

function CadastroForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, setUser } = useStore();

  useEffect(() => {
    // Se já logado e não veio do Stripe, manda pra agendamentos
    if (user && !searchParams.get("session_id")) {
      router.replace("/agendamentos");
    }
  }, [user, searchParams, router]);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (sessionId) {
      fetch(`/api/checkout-session/${sessionId}`)
        .then((r) => r.json())
        .then((data) => {
          setNome(data.name ?? "");
          setEmail(data.email ?? "");
          setTelefone(data.phone ?? "");
        })
        .catch(() => {});
      return;
    }

    const name = searchParams.get("name") ?? "";
    const emailParam = searchParams.get("email") ?? "";
    const phone = searchParams.get("phone") ?? "";

    if (name || emailParam || phone) {
      setNome(name);
      setEmail(emailParam);
      setTelefone(phone);
      return;
    }

    try {
      const stored = localStorage.getItem("stripeUserData");
      if (stored) {
        const data = JSON.parse(stored);
        setNome(data.nome ?? "");
        setEmail(data.email ?? "");
        setTelefone(data.telefone ?? "");
        localStorage.removeItem("stripeUserData");
      }
    } catch {}
  }, [searchParams]);

  function handleSubmit() {
    setErro(null);
    if (!nome.trim() || !email.trim() || !telefone.trim() || !senha) {
      setErro("Preencha todos os campos");
      return;
    }
    if (senha.length < 6) {
      setErro("A senha deve ter pelo menos 6 caracteres");
      return;
    }
    if (senha !== confirmarSenha) {
      setErro("As senhas não coincidem");
      return;
    }
    setLoading(true);
    fetch("/api/clientes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, email, telefone }),
    })
      .then((r) => r.json())
      .then(async (cliente) => {
        setUser({ id: cliente.id, name: nome, phone: telefone, email });

        const raw = localStorage.getItem("pendingBooking");
        if (raw) {
          try {
            const booking = JSON.parse(raw);
            await fetch("/api/reservas", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ clienteId: cliente.id, ...booking }),
            });
            localStorage.removeItem("pendingBooking");
          } catch {}
        }

        router.push("/agendamentos");
      })
      .catch(() => setErro("Erro ao criar conta. Tente novamente."))
      .finally(() => setLoading(false));
  }

  const inputClass =
    "w-full rounded-xl border-2 border-[#F1f1f1] bg-[#FAFAFA] px-4 py-3.5 text-sm focus:outline-none focus:border-black";

  return (
    <div className="flex h-screen flex-col  justify-center">
      <div className=" bg-white flex flex-col">
        <div className=" pt-8 pb-2 flex justify-center gap-3">
          <div>
            <h1 className="text-3xl text-center mb-6 font-bold">
              Yvison Barber
            </h1>
            <h1 className="text-xl text-center mb-2 font-bold">
              Seja Bem-vindo!
            </h1>
            <p className="text-sm text-[#656565] ">
              Confirme seus dados e escolha uma senha
            </p>
          </div>
        </div>

        <div className=" pt-6 px-4 pb-10 flex flex-col gap-4 flex-1">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#656565] uppercase">
              Nome completo
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Seu nome completo"
              className={inputClass}
            />
          </div>

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
              Telefone
            </label>
            <input
              type="tel"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              placeholder="(11) 99999-0000"
              className={inputClass}
            />
          </div>

          <div className="border-t border-[#F1f1f1] pt-4 mt-2">
            <p className="text-xs font-semibold text-[#656565] uppercase mb-3">
              Escolha sua senha
            </p>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#656565] uppercase">
                  Senha
                </label>
                <div className="relative">
                  <input
                    type={mostrarSenha ? "text" : "password"}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
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

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#656565] uppercase">
                  Confirmar senha
                </label>
                <div className="relative">
                  <input
                    type={mostrarConfirmar ? "text" : "password"}
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    placeholder="Repita a senha"
                    className={inputClass + " pr-12"}
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarConfirmar((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#656565]"
                  >
                    {mostrarConfirmar ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
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
            {loading ? "Criando conta..." : "Criar conta"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CadastroPage() {
  return (
    <Suspense>
      <CadastroForm />
    </Suspense>
  );
}
