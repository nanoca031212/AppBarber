import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enviarMensagemTemplate } from "@/lib/whatsapp/send";

// Chamada por cron externo (ex: EasyPanel scheduler, cron-job.org)
// com o header Authorization: Bearer <CRON_SECRET>
// Recomendado: executar a cada hora.
export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const config = await prisma.whatsappNotificacaoConfig.findUnique({
    where: { id: "default" },
  });

  if (!config?.lembreteAgendamento) {
    return NextResponse.json({ ok: true, enviados: 0 });
  }

  const horas = config.horasAntesLembrete ?? 24;

  const agora = new Date();
  const inicio = new Date(agora.getTime() + horas * 60 * 60 * 1000);
  const fim = new Date(inicio.getTime() + 60 * 60 * 1000); // janela de 1h

  const reservas = await prisma.reserva.findMany({
    where: {
      status: "CONFIRMADO",
      data: { gte: inicio, lt: fim },
    },
    include: {
      cliente: { omit: { senha: true } },
      barbeiro: true,
    },
  });

  const perfil = await prisma.perfilNegocio.findFirst();
  const remetente = await prisma.barbeiro.findFirst({
    where: { ativo: true, whatsapp: { not: null } },
  });

  if (!remetente) {
    return NextResponse.json({ ok: true, enviados: 0, motivo: "Nenhum barbeiro com WhatsApp conectado" });
  }

  let enviados = 0;
  for (const reserva of reservas) {
    if (!reserva.cliente.telefone) continue;
    const ok = await enviarMensagemTemplate(
      remetente.id,
      reserva.cliente.telefone,
      "lembrete",
      {
        cliente: reserva.cliente.nome,
        barbearia: perfil?.nomeBarbearia ?? "Barbearia",
        data: reserva.data.toLocaleDateString("pt-BR"),
        horario: reserva.horario,
      },
    );
    if (ok) enviados++;
  }

  return NextResponse.json({ ok: true, enviados });
}
