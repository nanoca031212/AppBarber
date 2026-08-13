import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULT_TEMPLATES = [
  {
    id: "confirmacao",
    nome: "confirmacao",
    mensagem:
      "Olá {{cliente}}! Seu horário na {{barbearia}} foi confirmado para {{data}} às {{horario}}. Até lá! ✂️",
  },
  {
    id: "lembrete",
    nome: "lembrete",
    mensagem:
      "Oi {{cliente}}, passando para lembrar do seu horário amanhã, {{data}} às {{horario}}, na {{barbearia}}.",
  },
  {
    id: "cancelamento",
    nome: "cancelamento",
    mensagem:
      "Olá {{cliente}}, seu horário do dia {{data}} às {{horario}} foi cancelado. Qualquer dúvida, chama a gente por aqui.",
  },
  {
    id: "cancelamento_barbearia",
    nome: "cancelamento_barbearia",
    mensagem:
      "Olá {{cliente}}, infelizmente precisamos cancelar seu horário do dia {{data}} às {{horario}} na {{barbearia}}. Pedimos desculpas pelo inconveniente. O estorno será processado em até 5 minutos. Entre em contato para reagendar. 🙏",
  },
  {
    id: "aniversario",
    nome: "aniversario",
    mensagem:
      "Feliz aniversário, {{cliente}}! 🎉 Passe na {{barbearia}} essa semana e ganhe um desconto especial.",
  },
  {
    id: "catalogo",
    nome: "catalogo",
    mensagem:
      "Olá {{cliente}}! Aqui está o catálogo de serviços da {{barbearia}} 💈 Dá uma olhada e me diz qual você quer agendar.",
  },
  {
    id: "servico",
    nome: "servico",
    mensagem:
      "O serviço {{servico}} na {{barbearia}} leva {{duracao}} e custa {{preco}}. Quer que eu agende um horário pra você?",
  },
  {
    id: "agendamento",
    nome: "agendamento",
    mensagem:
      "Olá {{cliente}}! Para agendar seu horário na {{barbearia}}, é só acessar: {{link}}",
  },
  {
    id: "pesquisaSatisfacao",
    nome: "pesquisaSatisfacao",
    mensagem:
      "Olá {{cliente}}! Tudo bem? Como foi sua visita na {{barbearia}} no dia {{data}}? Sua opinião é muito importante pra gente! ⭐",
  },
  {
    id: "equipe_novoAgendamento",
    nome: "equipe_novoAgendamento",
    mensagem:
      "📅 Novo agendamento!\nCliente: {{cliente}}\nData: {{data}} às {{horario}}\nServiço: {{servico}}",
  },
  {
    id: "equipe_cancelamento",
    nome: "equipe_cancelamento",
    mensagem:
      "❌ Cancelamento\nO cliente {{cliente}} cancelou o agendamento do dia {{data}} às {{horario}}.",
  },
  {
    id: "barbearia_pagamento",
    nome: "barbearia_pagamento",
    mensagem:
      "💰 Pagamento recebido!\nCliente: {{cliente}}\nData: {{data}} às {{horario}}\nValor: {{preco}}",
  },
  {
    id: "barbearia_novoCliente",
    nome: "barbearia_novoCliente",
    mensagem:
      "🆕 Novo cliente cadastrado!\nNome: {{cliente}}\nTelefone: {{horario}}",
  },
];

export async function GET() {
  // Garante que todos os templates padrão existam no banco
  await Promise.all(
    DEFAULT_TEMPLATES.map((t) =>
      prisma.whatsappTemplate.upsert({
        where: { id: t.id },
        update: {},
        create: { id: t.id, nome: t.nome, mensagem: t.mensagem, updatedAt: new Date() },
      }),
    ),
  );

  const templates = await prisma.whatsappTemplate.findMany({
    orderBy: { id: "asc" },
  });

  return NextResponse.json(templates);
}

export async function PUT(req: NextRequest) {
  const { id, mensagem } = await req.json();

  if (!id || typeof mensagem !== "string") {
    return NextResponse.json({ error: "id e mensagem são obrigatórios" }, { status: 400 });
  }

  const template = await prisma.whatsappTemplate.upsert({
    where: { id },
    update: { mensagem, updatedAt: new Date() },
    create: {
      id,
      nome: id,
      mensagem,
      updatedAt: new Date(),
    },
  });

  return NextResponse.json(template);
}
