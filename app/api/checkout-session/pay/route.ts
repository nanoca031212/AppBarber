import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createAsaasCustomer,
  createPixPayment,
  getPixQrCode,
  createCreditCardPayment,
  type CreditCard,
} from "@/lib/asaas";

type ServiceItem = { name: string; price: number };

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export async function POST(req: NextRequest) {
  try {
    const { ref, nome, email, telefone, cep, numeroEndereco, metodo, cpf, creditCard } =
      await req.json();

    if (!ref || !nome || !metodo) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

    const record = await prisma.asaasCheckout.findUnique({
      where: { externalRef: ref },
    });
    if (!record) {
      return NextResponse.json({ error: "Sessão não encontrada" }, { status: 404 });
    }
    if (record.status === "PAID") {
      return NextResponse.json({ error: "Pagamento já realizado" }, { status: 409 });
    }

    const dados = record.dadosReserva as {
      services: ServiceItem[];
      barberName: string;
      date: string;
      time: string;
    } | null;

    const total = Number(
      (dados?.services?.reduce((sum, s) => sum + s.price, 0) ?? 0).toFixed(2),
    );

    if (total <= 0) {
      return NextResponse.json({ error: "Valor inválido" }, { status: 400 });
    }

    // Cria cliente no Asaas
    const customer = await createAsaasCustomer({
      name: nome,
      email: email || undefined,
      phone: telefone?.replace(/\D/g, "") || undefined,
      cpfCnpj: cpf?.replace(/\D/g, "") || undefined,
    });

    // Salva dados do cliente no registro
    await prisma.asaasCheckout.update({
      where: { externalRef: ref },
      data: { customerId: customer.id, nome, email, telefone },
    });

    const description = `Agendamento${dados?.barberName ? ` - ${dados.barberName}` : ""}`;

    if (metodo === "PIX") {
      const payment = await createPixPayment({
        customer: customer.id,
        value: total,
        dueDate: todayStr(),
        externalReference: ref,
        description,
      });

      const qrCode = await getPixQrCode(payment.id);

      await prisma.asaasCheckout.update({
        where: { externalRef: ref },
        data: { paymentId: payment.id },
      });

      return NextResponse.json({
        type: "PIX",
        paymentId: payment.id,
        qrCodeImage: `data:image/png;base64,${qrCode.encodedImage}`,
        qrCodeText: qrCode.payload,
        expiresAt: qrCode.expirationDate,
      });
    }

    if (metodo === "CREDIT_CARD") {
      if (!cpf) {
        return NextResponse.json(
          { error: "CPF é obrigatório para pagamento com cartão" },
          { status: 400 },
        );
      }

      const remoteIp =
        req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
        req.headers.get("x-real-ip") ??
        "127.0.0.1";

      const payment = await createCreditCardPayment({
        customer: customer.id,
        value: total,
        dueDate: todayStr(),
        externalReference: ref,
        description,
        creditCard: creditCard as CreditCard,
        creditCardHolderInfo: {
          name: nome,
          email: email ?? "",
          cpfCnpj: cpf.replace(/\D/g, ""),
          phone: telefone?.replace(/\D/g, "") || undefined,
          postalCode: cep?.replace(/\D/g, "") || undefined,
          addressNumber: numeroEndereco || undefined,
        },
        remoteIp,
      });

      const paid = payment.status === "CONFIRMED" || payment.status === "RECEIVED";

      await prisma.asaasCheckout.update({
        where: { externalRef: ref },
        data: {
          paymentId: payment.id,
          ...(paid ? { status: "PAID" } : {}),
        },
      });

      return NextResponse.json({ type: "CREDIT_CARD", status: payment.status, paid });
    }

    return NextResponse.json({ error: "Método inválido" }, { status: 400 });
  } catch (err) {
    console.error("[checkout-session/pay]", err);
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
