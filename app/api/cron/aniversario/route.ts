import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enviarMensagemTemplate } from "@/lib/whatsapp/send";

// Chamada por cron externo uma vez por dia (ex: todo dia às 9h)
// com o header Authorization: Bearer <CRON_SECRET>
export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const hoje = new Date();
  const dia = hoje.getDate();
  const mes = hoje.getMonth() + 1; // 1-12

  // Busca clientes que fazem aniversário hoje (mesmo dia e mês, qualquer ano)
  const clientes = await prisma.cliente.findMany({
    where: { dataNascimento: { not: null } },
  });

  const aniversariantes = clientes.filter((c) => {
    if (!c.dataNascimento) return false;
    const d = new Date(c.dataNascimento);
    return d.getDate() === dia && d.getMonth() + 1 === mes;
  });

  const perfil = await prisma.perfilNegocio.findFirst();
  const remetente = await prisma.barbeiro.findFirst({
    where: { ativo: true, whatsapp: { not: null } },
  });

  if (!remetente) {
    return NextResponse.json({ ok: true, enviados: 0, motivo: "Nenhum barbeiro com WhatsApp conectado" });
  }

  let enviados = 0;
  for (const cliente of aniversariantes) {
    if (!cliente.telefone) continue;
    const ok = await enviarMensagemTemplate(
      remetente.id,
      cliente.telefone,
      "aniversario",
      {
        cliente: cliente.nome,
        barbearia: perfil?.nomeBarbearia ?? "Barbearia",
      },
    );
    if (ok) enviados++;
  }

  return NextResponse.json({ ok: true, enviados, total: aniversariantes.length });
}
