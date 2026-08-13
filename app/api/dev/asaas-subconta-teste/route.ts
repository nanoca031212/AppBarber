import { NextResponse } from "next/server";
import { createSubaccount } from "@/lib/asaas";

// Rota de uso interno para validar o fluxo de criação de subconta (BaaS) no
// Asaas sandbox, ponta a ponta, com dados fictícios. Não usar em produção —
// bloqueada fora de desenvolvimento.
export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Disponível apenas em desenvolvimento" }, { status: 403 });
  }

  try {
    const suffix = Date.now();

    const subaccount = await createSubaccount({
      name: "Barbeiro Teste Sandbox",
      email: `barbeiro.teste.${suffix}@example.com`,
      cpfCnpj: "11222333000181",
      companyType: "MEI",
      mobilePhone: "11999999999",
      incomeValue: 3000.0,
      address: "Avenida Paulista",
      addressNumber: "1000",
      province: "Bela Vista",
      postalCode: "01310100",
    });

    return NextResponse.json({ ok: true, subaccount });
  } catch (err) {
    console.error("[asaas-subconta-teste] Falha ao criar subconta:", err);
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
