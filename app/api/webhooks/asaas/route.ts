import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCustomer } from "@/lib/asaas";
import { enviarMensagemTemplate } from "@/lib/whatsapp/send";

type ServiceItem = { name: string; price: number; duration?: number };

type DadosReserva = {
  services: ServiceItem[];
  barberName: string;
  date: string;
  time: string;
  clienteId: string | null;
};

type CheckoutEvent = {
  event: string;
  checkout?: {
    id: string;
    customer?: string;
    customerData?: {
      name?: string;
      email?: string;
      phone?: string;
      mobilePhone?: string;
    } | null;
    payment?: {
      id?: string;
    };
  };
  // Pagamentos diretos (PIX / cartão via POST /payments)
  payment?: {
    id: string;
    externalReference?: string;
    status?: string;
    customer?: string;
  };
};

async function resolveCliente(
  clienteId: string | null,
  nome: string | undefined,
  email: string | undefined,
  telefone: string | undefined,
) {
  if (clienteId) {
    const existing = await prisma.cliente.findUnique({ where: { id: clienteId } });
    if (existing) return existing;
  }

  if (!nome || !telefone) return null;

  if (email) {
    return prisma.cliente.upsert({
      where: { email },
      update: { nome, telefone },
      create: { nome, telefone, email },
    });
  }

  const byPhone = await prisma.cliente.findFirst({ where: { telefone } });
  if (byPhone) return byPhone;

  return prisma.cliente.create({ data: { nome, telefone, email: null } });
}

async function criarReserva(record: {
  dadosReserva: unknown;
  nome: string | null;
  email: string | null;
  telefone: string | null;
}) {
  const dados = record.dadosReserva as DadosReserva | null;
  if (!dados) return null;

  const { services, barberName, date, time, clienteId } = dados;
  if (!barberName || !time) return null;

  const cliente = await resolveCliente(
    clienteId,
    record.nome ?? undefined,
    record.email ?? undefined,
    record.telefone ?? undefined,
  );
  if (!cliente) return null;

  const barbeiro =
    (await prisma.barbeiro.findFirst({ where: { nome: barberName } })) ??
    (await prisma.barbeiro.create({ data: { nome: barberName } }));

  const total = services.reduce((sum, s) => sum + s.price, 0);

  const reserva = await prisma.reserva.create({
    data: {
      clienteId: cliente.id,
      barbeiroId: barbeiro.id,
      data: date ? new Date(date) : new Date(),
      horario: time,
      total,
      status: "CONFIRMADO",
      servicos: {
        create: await Promise.all(
          services.map(async (s) => {
            const duracao = s.duration && s.duration > 0 ? s.duration : 30;
            const servico =
              (await prisma.servico.findFirst({ where: { nome: s.name } })) ??
              (await prisma.servico.create({
                data: { nome: s.name, preco: s.price, duracao },
              }));
            return { servicoId: servico.id };
          }),
        ),
      },
    },
    include: {
      cliente: { omit: { senha: true } },
      servicos: { include: { servico: true } },
      barbeiro: true,
    },
  });

  return reserva;
}

export async function POST(req: NextRequest) {
  const token = req.headers.get("asaas-access-token");
  if (token !== process.env.ASAAS_WEBHOOK_TOKEN) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as CheckoutEvent;

  // Pagamentos diretos (PIX / cartão via API) — PAYMENT_CONFIRMED, PAYMENT_RECEIVED
  if (body.payment) {
    await handlePaymentEvent(body);
    return NextResponse.json({ ok: true });
  }

  const checkout = body.checkout;
  if (!checkout) {
    return NextResponse.json({ ok: true });
  }

  const record = await prisma.asaasCheckout.findFirst({
    where: { checkoutId: checkout.id },
  });
  if (!record) {
    return NextResponse.json({ ok: true });
  }

  switch (body.event) {
    case "CHECKOUT_CREATED": {
      let nome = checkout.customerData?.name;
      let email = checkout.customerData?.email;
      let telefone =
        checkout.customerData?.phone ?? checkout.customerData?.mobilePhone;

      if ((!nome || !email) && checkout.customer) {
        const customer = await getCustomer(checkout.customer);
        nome ??= customer.name;
        email ??= customer.email ?? undefined;
        telefone ??= customer.phone ?? customer.mobilePhone ?? undefined;
      }

      await prisma.asaasCheckout.update({
        where: { id: record.id },
        data: { customerId: checkout.customer, nome, email, telefone },
      });
      break;
    }

    case "CHECKOUT_PAID": {
      const paymentId = checkout.payment?.id ?? null;

      await prisma.asaasCheckout.update({
        where: { id: record.id },
        data: { status: "PAID", paymentId },
      });

      if (record.tipo === "SERVICO") {
        try {
          const reserva = await criarReserva(record);
          if (reserva) {
            await prisma.asaasCheckout.update({
              where: { id: record.id },
              data: { reservaId: reserva.id },
            });

            const config = await prisma.whatsappNotificacaoConfig.findUnique({
              where: { id: "default" },
            });
            const perfil = await prisma.perfilNegocio.findFirst();
            const vars = {
              cliente: reserva.cliente.nome,
              barbearia: perfil?.nomeBarbearia ?? "Barbearia",
              data: reserva.data.toLocaleDateString("pt-BR"),
              horario: reserva.horario,
            };

            // Confirmação para o cliente
            if (config?.confirmacaoAgendamento && reserva.cliente.telefone) {
              const barbeiros = await prisma.barbeiro.findMany({
                where: { ativo: true, whatsapp: { not: null } },
              });
              const remetente = barbeiros[0];
              if (remetente) {
                await enviarMensagemTemplate(
                  remetente.id,
                  reserva.cliente.telefone,
                  "confirmacao",
                  vars,
                );
              }
            }

            // Aviso de novo agendamento para o barbeiro
            if (reserva.barbeiro.notificarNovoAgendamento && reserva.barbeiro.whatsapp) {
              const remetente = await prisma.barbeiro.findFirst({
                where: { ativo: true, whatsapp: { not: null } },
              });
              if (remetente) {
                await enviarMensagemTemplate(
                  remetente.id,
                  reserva.barbeiro.whatsapp,
                  "confirmacao",
                  vars,
                );
              }
            }
          }
        } catch (err) {
          console.error("[webhook] Falha ao criar reserva após pagamento:", err);
        }
      }

      if (record.tipo === "ASSINATURA") {
        try {
          const cliente = await resolveCliente(
            null,
            record.nome ?? undefined,
            record.email ?? undefined,
            record.telefone ?? undefined,
          );
          if (cliente) {
            const agora = new Date();
            const fimVigencia = new Date(agora);
            fimVigencia.setMonth(fimVigencia.getMonth() + 1);

            await prisma.assinatura.upsert({
              where: { clienteId: cliente.id },
              update: {
                status: "ATIVA",
                creditosUsados: 0,
                inicioVigencia: agora,
                fimVigencia,
                asaasCheckoutId: record.id,
              },
              create: {
                clienteId: cliente.id,
                status: "ATIVA",
                creditosUsados: 0,
                inicioVigencia: agora,
                fimVigencia,
                asaasCheckoutId: record.id,
              },
            });
          }
        } catch (err) {
          console.error("[webhook] Falha ao ativar assinatura:", err);
        }
      }
      break;
    }

    case "CHECKOUT_EXPIRED":
      await prisma.asaasCheckout.update({
        where: { id: record.id },
        data: { status: "EXPIRED" },
      });
      break;

    case "CHECKOUT_CANCELED":
      await prisma.asaasCheckout.update({
        where: { id: record.id },
        data: { status: "CANCELED" },
      });
      break;
  }

  return NextResponse.json({ ok: true });
}

// Handler separado para pagamentos diretos (PIX / cartão via POST /payments)
async function handlePaymentEvent(body: CheckoutEvent): Promise<boolean> {
  const payment = body.payment;
  if (!payment) return false;

  if (
    body.event !== "PAYMENT_CONFIRMED" &&
    body.event !== "PAYMENT_RECEIVED"
  ) {
    return false;
  }

  const record = await prisma.asaasCheckout.findFirst({
    where: {
      OR: [
        { paymentId: payment.id },
        { externalRef: payment.externalReference ?? "__none__" },
      ],
    },
  });

  if (!record) return false;
  if (record.status === "PAID") return true; // idempotência

  await prisma.asaasCheckout.update({
    where: { id: record.id },
    data: { status: "PAID", paymentId: payment.id },
  });

  if (record.tipo === "SERVICO") {
    try {
      const reserva = await criarReserva(record);
      if (reserva) {
        await prisma.asaasCheckout.update({
          where: { id: record.id },
          data: { reservaId: reserva.id },
        });

        const config = await prisma.whatsappNotificacaoConfig.findUnique({
          where: { id: "default" },
        });
        const perfil = await prisma.perfilNegocio.findFirst();
        const vars = {
          cliente: reserva.cliente.nome,
          barbearia: perfil?.nomeBarbearia ?? "Barbearia",
          data: reserva.data.toLocaleDateString("pt-BR"),
          horario: reserva.horario,
        };

        if (config?.confirmacaoAgendamento && reserva.cliente.telefone) {
          const remetente = await prisma.barbeiro.findFirst({
            where: { ativo: true, whatsapp: { not: null } },
          });
          if (remetente) {
            await enviarMensagemTemplate(
              remetente.id,
              reserva.cliente.telefone,
              "confirmacao",
              vars,
            );
          }
        }

        if (reserva.barbeiro.notificarNovoAgendamento && reserva.barbeiro.whatsapp) {
          const remetente = await prisma.barbeiro.findFirst({
            where: { ativo: true, whatsapp: { not: null } },
          });
          if (remetente) {
            await enviarMensagemTemplate(
              remetente.id,
              reserva.barbeiro.whatsapp,
              "confirmacao",
              vars,
            );
          }
        }
      }
    } catch (err) {
      console.error("[webhook] Falha ao criar reserva após PAYMENT_CONFIRMED:", err);
    }
  }

  return true;
}
