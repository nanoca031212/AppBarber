"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/app/context/store";

type ServiceItem = { name: string; price: number };

type DadosReserva = {
  services: ServiceItem[];
  barberName: string;
  date: string;
  time: string;
  clienteId: string | null;
};

type OrderData = {
  status: string;
  nome: string;
  email: string;
  phone: string;
  dadosReserva: DadosReserva | null;
};

type Step = "loading" | "form" | "pix" | "success" | "error";

function fmt(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function inputCls() {
  return "w-full rounded-xl border-2 border-[#F1f1f1] bg-white px-4 py-3.5 text-sm focus:outline-none focus:border-black transition-colors";
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref");
  const { user } = useStore();

  const [step, setStep] = useState<Step>("loading");
  const [order, setOrder] = useState<OrderData | null>(null);
  const [barbearia, setBarbearia] = useState("");

  // Dados do cliente
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cep, setCep] = useState("");
  const [numeroEndereco, setNumeroEndereco] = useState("");

  // Pagamento
  const [metodo, setMetodo] = useState<"PIX" | "CREDIT_CARD">("PIX");
  const [cpf, setCpf] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardMonth, setCardMonth] = useState("");
  const [cardYear, setCardYear] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  // PIX
  const [pixImage, setPixImage] = useState("");
  const [pixPayload, setPixPayload] = useState("");
  const [pixCopied, setPixCopied] = useState(false);

  // UI
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const total =
    order?.dadosReserva?.services.reduce((sum, s) => sum + s.price, 0) ?? 0;

  // Carrega dados do pedido + perfil da barbearia
  useEffect(() => {
    if (!ref) { setStep("error"); return; }

    Promise.all([
      fetch(`/api/checkout-session/${ref}`).then((r) => r.json()),
      fetch("/api/perfil").then((r) => r.json()).catch(() => ({})),
    ]).then(([orderData, perfilData]: [OrderData, { nomeBarbearia?: string }]) => {
      if (!orderData.dadosReserva) { setStep("error"); return; }
      setOrder(orderData);
      setBarbearia(perfilData?.nomeBarbearia ?? "");
      if (user) {
        setNome(user.name ?? "");
        setEmail(user.email ?? "");
        setTelefone(user.phone ?? "");
      } else if (orderData.nome) {
        setNome(orderData.nome);
        setEmail(orderData.email);
        setTelefone(orderData.phone);
      }
      if (orderData.status === "PAID") { setStep("success"); return; }
      setStep("form");
    }).catch(() => setStep("error"));
  }, [ref, user]);

  // Poll status quando esperando PIX
  useEffect(() => {
    if (step !== "pix" || !ref) return;
    pollRef.current = setInterval(async () => {
      try {
        const data: OrderData = await fetch(`/api/checkout-session/${ref}`).then((r) => r.json());
        if (data.status === "PAID") {
          clearInterval(pollRef.current!);
          setStep("success");
        }
      } catch {}
    }, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [step, ref]);

  async function pay() {
    if (!nome.trim() || !email.trim() || !telefone.trim() || !cep.trim() || !numeroEndereco.trim()) {
      setPayError("Preencha todos os campos obrigatórios.");
      return;
    }
    setPaying(true);
    setPayError(null);

    try {
      const body: Record<string, unknown> = { ref, nome, email, telefone, cep, numeroEndereco, metodo };
      if (metodo === "CREDIT_CARD") {
        if (!cpf.trim()) { setPayError("CPF é obrigatório para cartão."); setPaying(false); return; }
        body.cpf = cpf;
        body.creditCard = {
          holderName: cardHolder,
          number: cardNumber.replace(/\s/g, ""),
          expiryMonth: cardMonth,
          expiryYear: cardYear,
          ccv: cardCvv,
        };
      }

      const res = await fetch("/api/checkout-session/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        setPayError(data.error ?? "Erro ao processar pagamento.");
        return;
      }

      if (metodo === "PIX") {
        setPixImage(data.qrCodeImage);
        setPixPayload(data.qrCodeText);
        setStep("pix");
      } else {
        setStep(data.paid ? "success" : "error");
      }
    } catch {
      setPayError("Erro de conexão. Tente novamente.");
    } finally {
      setPaying(false);
    }
  }

  function copyPix() {
    navigator.clipboard.writeText(pixPayload).then(() => {
      setPixCopied(true);
      setTimeout(() => setPixCopied(false), 2000);
    });
  }

  const dados = order?.dadosReserva;

  // ── LOADING ────────────────────────────────────────────────────────────────
  if (step === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── ERROR ──────────────────────────────────────────────────────────────────
  if (step === "error" || !order || !dados) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-4 px-8 text-center">
        <p className="text-lg font-bold">Link inválido ou expirado.</p>
        <Link
          href="/"
          className="rounded-full bg-black text-white px-6 py-3 text-sm font-semibold"
        >
          Voltar para o início
        </Link>
      </div>
    );
  }

  // ── SUCCESS ────────────────────────────────────────────────────────────────
  if (step === "success") {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 gap-5">
        <div className="w-16 h-16 rounded-full bg-black flex items-center justify-center">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold">Pagamento confirmado!</h1>
          <p className="text-[#656565] mt-1 text-sm">Seu agendamento está garantido.</p>
        </div>
        <div className="w-full max-w-sm rounded-xl border-2 border-[#F1f1f1] bg-[#FAFAFA] p-4 flex flex-col gap-2">
          {barbearia && <p className="font-bold text-sm">{barbearia}</p>}
          {dados.barberName && <p className="text-sm text-[#656565]">{dados.barberName}</p>}
          {dados.date && dados.time && (
            <p className="text-sm text-[#656565]">{dados.date} às {dados.time}</p>
          )}
          <div className="border-t border-[#F1f1f1] pt-2 mt-1 flex flex-col gap-1">
            {dados.services.map((s, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span>{s.name}</span>
                <span>{fmt(s.price)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-[#F1f1f1] pt-2 flex justify-between">
            <span className="font-semibold text-sm">Total</span>
            <span className="font-bold">{fmt(total)}</span>
          </div>
        </div>
        <div className="flex flex-col gap-3 w-full max-w-sm">
          {user ? (
            <Link href="/" className="w-full text-center rounded-full bg-black text-white py-3 text-sm font-semibold">
              Voltar ao início
            </Link>
          ) : (
            <Link
              href={`/cadastro?name=${encodeURIComponent(nome)}&email=${encodeURIComponent(email)}&phone=${encodeURIComponent(telefone)}`}
              className="w-full text-center rounded-full bg-black text-white py-3 text-sm font-semibold"
            >
              Criar conta
            </Link>
          )}
        </div>
      </div>
    );
  }

  // ── PIX QR CODE ────────────────────────────────────────────────────────────
  if (step === "pix") {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center py-10 px-4 gap-5">
        <div className="w-full max-w-sm flex flex-col items-center gap-5">
          <div className="text-center">
            <h1 className="text-xl font-bold">Escaneie o QR Code PIX</h1>
            <p className="text-sm text-[#656565] mt-1">
              Abra o app do seu banco e aponte a câmera.
            </p>
          </div>

          {pixImage && (
            <img
              src={pixImage}
              alt="QR Code PIX"
              className="w-56 h-56 rounded-xl border-2 border-[#F1f1f1]"
            />
          )}

          <div className="w-full">
            <p className="text-xs text-[#656565] mb-2 text-center">Ou use o código copia e cola:</p>
            <div className="rounded-xl border-2 border-[#F1f1f1] bg-[#FAFAFA] p-3 mb-3">
              <p className="text-xs text-[#656565] break-all select-all font-mono">{pixPayload}</p>
            </div>
            <button
              type="button"
              onClick={copyPix}
              className="w-full rounded-full border-2 border-[#F1f1f1] bg-white py-3 text-sm font-semibold"
            >
              {pixCopied ? "✓ Copiado!" : "Copiar código PIX"}
            </button>
          </div>

          <div className="flex items-center gap-2 text-sm text-[#656565]">
            <div className="w-4 h-4 border-2 border-[#656565] border-t-transparent rounded-full animate-spin" />
            Aguardando confirmação...
          </div>

          <div className="w-full rounded-xl border-2 border-[#F1f1f1] bg-[#FAFAFA] p-3 text-center">
            <p className="font-bold text-lg">{fmt(total)}</p>
            <p className="text-xs text-[#656565] mt-0.5">valor a pagar via PIX</p>
          </div>
        </div>
      </div>
    );
  }

  // ── FORM (checkout principal) ──────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white pb-12">
      <div className="max-w-sm mx-auto px-4">

        {/* Header */}
        <div className="py-6 text-center">
          {barbearia && <p className="text-xs text-[#656565] uppercase tracking-widest mb-1">{barbearia}</p>}
          <h1 className="text-xl font-bold">Finalizar agendamento</h1>
        </div>

        {/* Resumo do pedido */}
        <div className="rounded-xl border-2 border-[#F1f1f1] bg-[#FAFAFA] p-4 mb-4">
          <p className="text-xs font-semibold text-[#656565] uppercase tracking-wide mb-3">Resumo</p>
          <div className="flex flex-col gap-1.5 mb-3">
            {dados.services.map((s, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span>{s.name}</span>
                <span className="font-medium">{fmt(s.price)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-[#F1f1f1] pt-3 flex justify-between items-center">
            <span className="font-semibold text-sm">Total</span>
            <span className="text-xl font-bold">{fmt(total)}</span>
          </div>
          {(dados.barberName || dados.date) && (
            <div className="border-t border-[#F1f1f1] pt-2 mt-2 text-xs text-[#656565] flex flex-col gap-0.5">
              {dados.barberName && <span>Barbeiro: {dados.barberName}</span>}
              {dados.date && dados.time && <span>{dados.date} às {dados.time}</span>}
            </div>
          )}
        </div>

        {/* Dados do cliente */}
        <div className="rounded-xl border-2 border-[#F1f1f1] bg-[#FAFAFA] p-4 mb-4">
          <p className="text-xs font-semibold text-[#656565] uppercase tracking-wide mb-3">Seus dados</p>
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs text-[#656565] mb-1 block">Nome completo</label>
              <input className={inputCls()} placeholder="João Silva" value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-[#656565] mb-1 block">Email</label>
              <input type="email" className={inputCls()} placeholder="joao@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-[#656565] mb-1 block">Telefone / WhatsApp</label>
              <input type="tel" className={inputCls()} placeholder="(11) 99999-9999" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs text-[#656565] mb-1 block">CEP</label>
                <input
                  className={inputCls()}
                  placeholder="00000-000"
                  maxLength={9}
                  value={cep}
                  onChange={(e) =>
                    setCep(
                      e.target.value
                        .replace(/\D/g, "")
                        .replace(/^(\d{5})(\d)/, "$1-$2")
                        .slice(0, 9),
                    )
                  }
                />
              </div>
              <div className="w-28">
                <label className="text-xs text-[#656565] mb-1 block">Número</label>
                <input
                  className={inputCls()}
                  placeholder="123"
                  value={numeroEndereco}
                  onChange={(e) => setNumeroEndereco(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Forma de pagamento */}
        <div className="rounded-xl border-2 border-[#F1f1f1] bg-[#FAFAFA] p-4 mb-4">
          <p className="text-xs font-semibold text-[#656565] uppercase tracking-wide mb-3">Pagamento</p>

          <div className="flex gap-2 mb-4">
            {(["PIX", "CREDIT_CARD"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMetodo(m)}
                className={[
                  "flex-1 rounded-full border-2 py-2.5 text-sm font-semibold transition-colors",
                  metodo === m
                    ? "bg-black text-white border-black"
                    : "bg-white text-[#656565] border-[#F1f1f1]",
                ].join(" ")}
              >
                {m === "PIX" ? "PIX" : "Cartão"}
              </button>
            ))}
          </div>

          {metodo === "PIX" && (
            <div className="rounded-xl bg-[#F0FFF4] border border-[#BBF7D0] p-3 text-sm text-[#166534]">
              Pagamento instantâneo. Um QR Code será gerado após clicar em confirmar.
            </div>
          )}

          {metodo === "CREDIT_CARD" && (
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-[#656565] mb-1 block">CPF do titular</label>
                <input
                  className={inputCls()}
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-[#656565] mb-1 block">Nome no cartão</label>
                <input
                  className={inputCls()}
                  placeholder="NOME COMO NO CARTÃO"
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                />
              </div>
              <div>
                <label className="text-xs text-[#656565] mb-1 block">Número do cartão</label>
                <input
                  className={inputCls()}
                  placeholder="0000 0000 0000 0000"
                  maxLength={19}
                  value={cardNumber}
                  onChange={(e) =>
                    setCardNumber(
                      e.target.value
                        .replace(/\D/g, "")
                        .replace(/(.{4})/g, "$1 ")
                        .trim(),
                    )
                  }
                />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-[#656565] mb-1 block">Mês</label>
                  <input
                    className={inputCls()}
                    placeholder="MM"
                    maxLength={2}
                    value={cardMonth}
                    onChange={(e) => setCardMonth(e.target.value.replace(/\D/g, ""))}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-[#656565] mb-1 block">Ano</label>
                  <input
                    className={inputCls()}
                    placeholder="AAAA"
                    maxLength={4}
                    value={cardYear}
                    onChange={(e) => setCardYear(e.target.value.replace(/\D/g, ""))}
                  />
                </div>
                <div className="w-20">
                  <label className="text-xs text-[#656565] mb-1 block">CVV</label>
                  <input
                    className={inputCls()}
                    placeholder="123"
                    maxLength={4}
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ""))}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {payError && (
          <p className="text-sm text-red-500 text-center mb-3 px-1">{payError}</p>
        )}

        <button
          type="button"
          disabled={paying}
          onClick={pay}
          className="w-full rounded-full bg-black text-white py-4 text-sm font-semibold disabled:opacity-50 transition-opacity"
        >
          {paying
            ? "Processando..."
            : metodo === "PIX"
              ? `Gerar PIX — ${fmt(total)}`
              : `Pagar ${fmt(total)}`}
        </button>

        <p className="text-xs text-[#656565] text-center mt-4">
          Pagamento processado com segurança ✓
        </p>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutContent />
    </Suspense>
  );
}
