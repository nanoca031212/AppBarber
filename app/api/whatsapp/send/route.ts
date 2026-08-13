import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enviarMensagemTemplate, TemplateVars } from "@/lib/whatsapp/send";

// Envio manual de mensagem WhatsApp para um agendamento específico
// body: { reservaId, templateId, barbeiroId }
export async function POST(req: NextRequest) {
  const { reservaId, templateId, barbeiroId } = await req.json();

  if (!reservaId || !templateId || !barbeiroId) {
    return NextResponse.json(
      { error: "reservaId, templateId e barbeiroId são obrigatórios" },
      { status: 400 },
    );
  }

  const reserva = await prisma.reserva.findUnique({
    where: { id: reservaId },
    include: {
      cliente: { omit: { senha: true } },
      barbeiro: true,
      servicos: { include: { servico: true } },
    },
  });

  if (!reserva) {
    return NextResponse.json({ error: "Agendamento não encontrado" }, { status: 404 });
  }

  if (!reserva.cliente.telefone) {
    return NextResponse.json({ error: "Cliente sem telefone cadastrado" }, { status: 422 });
  }

  const perfil = await prisma.perfilNegocio.findFirst();

  const vars: TemplateVars = {
    cliente: reserva.cliente.nome,
    barbearia: perfil?.nomeBarbearia ?? "Barbearia",
    data: new Date(reserva.data).toLocaleDateString("pt-BR"),
    horario: reserva.horario,
    servico: reserva.servicos.map((s) => s.servico.nome).join(", "),
  };

  const ok = await enviarMensagemTemplate(
    barbeiroId,
    reserva.cliente.telefone,
    templateId,
    vars,
  );

  if (!ok) {
    return NextResponse.json(
      { error: "Falha ao enviar mensagem. Verifique se o WhatsApp está conectado." },
      { status: 503 },
    );
  }

  return NextResponse.json({ ok: true });
}
