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
  {
    id: "bot_escolhaBarbeiro",
    nome: "bot_escolhaBarbeiro",
    mensagem:
      "Olá! 👋 Bem-vindo(a) à {{barbearia}}! Com qual barbeiro você quer marcar?\n{{barbeiros}}\nMe responde com o número ou o nome.",
  },
  {
    id: "bot_barbeiroInvalido",
    nome: "bot_barbeiroInvalido",
    mensagem: "Não encontrei esse barbeiro 🤔 Escolha um da lista:\n{{barbeiros}}",
  },
  {
    id: "bot_boasVindas",
    nome: "bot_boasVindas",
    mensagem:
      "Perfeito! Pra qual dia você quer vir? (ex: hoje, amanhã, 20/08)",
  },
  {
    id: "bot_diaInvalido",
    nome: "bot_diaInvalido",
    mensagem: "Não entendi essa data 🤔 Pode me mandar assim: hoje, amanhã ou 20/08?",
  },
  {
    id: "bot_semHorarios",
    nome: "bot_semHorarios",
    mensagem: "Poxa, não tem horário livre em {{data}} 😕 Quer tentar outro dia?",
  },
  {
    id: "bot_horariosDisponiveis",
    nome: "bot_horariosDisponiveis",
    mensagem: "Horários disponíveis em {{data}}: {{horarios}}. Me diz qual você prefere!",
  },
  {
    id: "bot_horarioInvalido",
    nome: "bot_horarioInvalido",
    mensagem: "Não achei esse horário na lista 🤔 Escolha um destes: {{horarios}}",
  },
  {
    id: "bot_pedirNome",
    nome: "bot_pedirNome",
    mensagem: "Legal! Antes de confirmar, preciso criar seu cadastro. Qual seu nome completo?",
  },
  {
    id: "bot_pedirEmail",
    nome: "bot_pedirEmail",
    mensagem: "Prazer, {{cliente}}! Agora me manda seu e-mail, por favor.",
  },
  {
    id: "bot_emailInvalido",
    nome: "bot_emailInvalido",
    mensagem: "Esse e-mail não parece válido 🤔 Pode conferir e mandar de novo?",
  },
  {
    id: "bot_clienteReconhecido",
    nome: "bot_clienteReconhecido",
    mensagem: "Que bom te ver de novo, {{cliente}}! 🙌",
  },
  {
    id: "bot_cadastroConcluido",
    nome: "bot_cadastroConcluido",
    mensagem:
      "Cadastro criado, {{cliente}}! 🎉 Seu acesso ao site:\ne-mail: {{email}}\nsenha: {{senha}}\nGuarde em um lugar seguro.",
  },
  {
    id: "bot_escolhaServico",
    nome: "bot_escolhaServico",
    mensagem: "Qual serviço você quer?\n{{servicos}}\nMe responde com o número ou o nome.",
  },
  {
    id: "bot_servicoInvalido",
    nome: "bot_servicoInvalido",
    mensagem: "Não entendi o serviço 🤔 Escolha um da lista:\n{{servicos}}",
  },
  {
    id: "bot_escolhaPagamento",
    nome: "bot_escolhaPagamento",
    mensagem:
      "Como você prefere pagar?\n1️⃣ No local (na hora do atendimento)\n2️⃣ Online (Pix ou cartão)\nMe responde com o número ou local/online.",
  },
  {
    id: "bot_pagamentoInvalido",
    nome: "bot_pagamentoInvalido",
    mensagem: "Não entendi 🤔 Responde com *local* ou *online*.",
  },
  {
    id: "bot_pedidoOnline",
    nome: "bot_pedidoOnline",
    mensagem:
      "Show! Gerei seu pedido 🧾 Pra confirmar o pagamento é só acessar: {{link}}\nAssim que o pagamento cair, seu horário fica garantido ✅",
  },
  {
    id: "bot_foraDoAssunto",
    nome: "bot_foraDoAssunto",
    mensagem:
      "Isso não é um assunto que eu consigo resolver por aqui 🙏 Posso te ajudar a marcar um horário de corte — é só me chamar!",
  },
  {
    id: "bot_ajudaGenerica",
    nome: "bot_ajudaGenerica",
    mensagem: "Posso te ajudar a marcar um horário na {{barbearia}} 💈 Me diga se quer agendar um corte!",
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

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();

  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "id é obrigatório" }, { status: 400 });
  }

  await prisma.whatsappTemplate.deleteMany({ where: { id } });

  return NextResponse.json({ ok: true });
}
