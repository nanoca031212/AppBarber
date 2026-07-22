"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeftIcon, CheckIcon } from "lucide-react";
import { useState } from "react";
import { useStore } from "@/app/context/store";

const beneficios = [
  "3 cortes por semana",
  "Pague menos por mês",
  "Prioridade nos horários",
  "Cancele quando quiser",
];

const Assinatura = () => {
  const { user } = useStore();
  const [loading, setLoading] = useState(false);

  async function handleAssinar() {
    setLoading(true);
    const res = await fetch("/api/assinatura-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        successUrl: user
          ? `${window.location.origin}/agendamentos?assinado=1`
          : `${window.location.origin}/cadastro?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: window.location.href,
      }),
    });

    const { url } = await res.json();
    setLoading(false);
    if (url) window.location.href = url;
  }

  return (
    <div className="relative min-h-screen bg-white">
      <div className="bg-[#505050] w-full z-0 h-[220px]"></div>
      <Link href="/">
        <Button className="absolute top-4 left-4 rounded-full bg-white h-12 w-12 z-20 text-black">
          <ArrowLeftIcon />
        </Button>
      </Link>

      <div className="bg-white z-20 py-6 -mt-12 rounded-4xl px-5 max-w-md mx-auto">
        <h1 className="text-xl font-bold">Assinatura Mensal</h1>
        <p className="text-sm text-[#656565] mt-1">
          3 cortes por semana, todo mês.
        </p>

        <div className="mt-6 rounded-xl border-2 border-[#F1f1f1] bg-[#FAFAFA] p-5 flex flex-col gap-4">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold">R$ 99,90</span>
            <span className="text-[#656565] text-sm">/mês</span>
          </div>

          <ul className="flex flex-col gap-2">
            {beneficios.map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm">
                <CheckIcon className="w-4 h-4 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <Button
          type="button"
          disabled={loading}
          onClick={handleAssinar}
          className="w-full rounded-full bg-black text-white font-semibold py-6 text-base disabled:opacity-50 mt-6"
        >
          {loading ? "Redirecionando..." : "Assinar"}
        </Button>
      </div>
    </div>
  );
};

export default Assinatura;
