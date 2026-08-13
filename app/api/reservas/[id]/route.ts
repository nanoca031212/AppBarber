import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { refundPayment } from "@/lib/asaas";
import { enviarMensagemTemplate } from "@/lib/whatsapp/send";

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const { status, canceladoPor } = await req.json();

  const reserva = await prisma.reserva.update({
    where: { id },
    data: {
      status,
      ...(canceladoPor ? { canceladoPor } : {}),
    },
    include: {
      cliente: { omit: { senha: true } },
      barbeiro: true,
    },
  });

  if (status === "CANCELADO") {
    // Estorno — sempre imediato, devolve pelo mesmo método
    const checkout = await prisma.asaasCheckout.findFirst({
      where: { reservaId: id, status: "PAID", paymentId: { not: null } },
    });

    if (checkout?.paymentId) {
      try {
        await refundPayment(checkout.paymentId);
        await prisma.asaasCheckout.update({
          where: { id: checkout.id },
          data: { status: "REFUNDED" },
        });
      } catch (err) {
        console.error("[reservas] Falha ao estornar pagamento:", err);
      }
    }

    // WhatsApp de cancelamento — sempre notifica o cliente se tiver telefone
    if (reserva.cliente.telefone) {
      const perfil = await prisma.perfilNegocio.findFirst();
      const vars = {
        cliente: reserva.cliente.nome,
        barbearia: perfil?.nomeBarbearia ?? "Barbearia",
        data: reserva.data.toLocaleDateString("pt-BR"),
        horario: reserva.horario,
      };

      // "barbearia" = admin/barbeiro cancelou; qualquer outro valor = cliente cancelou
      const templateId =
        canceladoPor === "barbearia" ? "cancelamento_barbearia" : "cancelamento";

      const remetente = await prisma.barbeiro.findFirst({
        where: { ativo: true, whatsapp: { not: null } },
      });

      if (remetente) {
        await enviarMensagemTemplate(
          remetente.id,
          reserva.cliente.telefone,
          templateId,
          vars,
        ).catch((err) =>
          console.error("[reservas] Falha ao enviar WhatsApp de cancelamento:", err),
        );
      }
    }
  }

  if (status === "CONCLUIDO") {
    const config = await prisma.whatsappNotificacaoConfig.findUnique({
      where: { id: "default" },
    });

    if (reserva.cliente.telefone) {
      const perfil = await prisma.perfilNegocio.findFirst();
      const vars = {
        cliente: reserva.cliente.nome,
        barbearia: perfil?.nomeBarbearia ?? "Barbearia",
        data: reserva.data.toLocaleDateString("pt-BR"),
        horario: reserva.horario,
      };

      const remetente = await prisma.barbeiro.findFirst({
        where: { ativo: true, whatsapp: { not: null } },
      });

      if (remetente) {
        await enviarMensagemTemplate(
          remetente.id,
          reserva.cliente.telefone,
          "pesquisaSatisfacao",
          vars,
        ).catch((err) =>
          console.error("[reservas] Falha ao enviar pesquisa de satisfação:", err),
        );
      }
    }
  }

  const { cliente: _c, barbeiro: _b, ...reservaSemRelacoes } = reserva;
  return NextResponse.json(reservaSemRelacoes);
}
