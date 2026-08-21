import { prisma } from "@/lib/prisma";
import { criarReserva } from "@/lib/reservas";
import { gerarSenhaAleatoria, hashPassword } from "@/lib/password";
import type { TemplateVars } from "@/lib/whatsapp/send";
import { enviarTemplateBot } from "./enviar";
import { classificarIntencao } from "./classificar";
import { parseDataRelativa } from "./data";
import { horariosDisponiveisParaData, matchHorarioOfertado } from "./horarios";
import { listarBarbeirosAtivos, formatarListaBarbeiros, matchBarbeiro } from "./barbeiro";
import { listarServicosBarbeiro, formatarListaServicos, matchServico } from "./servico";
import { criarPedidoOnline, linkCheckout } from "./pagamento";

const HISTORICO_MAXIMO = 20;

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}

function matchPagamento(texto: string): "LOCAL" | "ONLINE" | null {
  const t = normalizar(texto);
  if (/\b(1|local|presencial|na hora|no salao)\b/.test(t)) return "LOCAL";
  if (/\b(2|online|pix|cartao|site|link)\b/.test(t)) return "ONLINE";
  return null;
}

// Limpa os campos temporários de uma reserva em andamento, mantendo o
// clienteId (o cliente não precisa se identificar de novo na próxima vez).
const CAMPOS_LIMPOS = {
  barbeiroId: null,
  dataEscolhida: null,
  horariosOfertados: null,
  horarioEscolhido: null,
  servicoEscolhidoId: null,
};

export async function processarMensagemBot(
  telefone: string,
  texto: string,
  instancia: string,
): Promise<void> {
  await prisma.botMensagem.create({ data: { telefone, role: "user", conteudo: texto } });

  const conversa = await prisma.botConversa.upsert({
    where: { telefone },
    update: {},
    create: { telefone },
  });

  const perfil = await prisma.perfilNegocio.findFirst();
  const barbearia = perfil?.nomeBarbearia ?? "a barbearia";

  const enviar = (templateId: string, vars: TemplateVars = {}) =>
    enviarTemplateBot(instancia, telefone, templateId, { barbearia, ...vars });

  switch (conversa.etapa) {
    case "AGUARDANDO_BARBEIRO": {
      const barbeiros = await listarBarbeirosAtivos();
      const escolhido = matchBarbeiro(texto, barbeiros);
      if (!escolhido) {
        await enviar("bot_barbeiroInvalido", { barbeiros: formatarListaBarbeiros(barbeiros) });
        break;
      }
      await prisma.botConversa.update({
        where: { telefone },
        data: { barbeiroId: escolhido.id, etapa: "AGUARDANDO_DATA" },
      });
      await enviar("bot_boasVindas");
      break;
    }

    case "AGUARDANDO_DATA": {
      if (!conversa.barbeiroId) {
        await prisma.botConversa.update({ where: { telefone }, data: { etapa: "INICIO" } });
        break;
      }
      const data = parseDataRelativa(texto);
      if (!data) {
        await enviar("bot_diaInvalido");
        break;
      }
      const horarios = await horariosDisponiveisParaData(conversa.barbeiroId, data);
      const dataFmt = data.toLocaleDateString("pt-BR");
      if (horarios.length === 0) {
        await enviar("bot_semHorarios", { data: dataFmt });
        break;
      }
      await prisma.botConversa.update({
        where: { telefone },
        data: {
          dataEscolhida: data.toISOString(),
          horariosOfertados: horarios.join(","),
          etapa: "AGUARDANDO_ESCOLHA_HORARIO",
        },
      });
      await enviar("bot_horariosDisponiveis", { data: dataFmt, horarios: horarios.join(", ") });
      break;
    }

    case "AGUARDANDO_ESCOLHA_HORARIO": {
      const ofertados = (conversa.horariosOfertados ?? "").split(",").filter(Boolean);
      const escolhido = matchHorarioOfertado(texto, ofertados);
      if (!escolhido) {
        await enviar("bot_horarioInvalido", { horarios: ofertados.join(", ") });
        break;
      }

      const proximaEtapa = conversa.clienteId ? "AGUARDANDO_SERVICO" : "AGUARDANDO_NOME";
      await prisma.botConversa.update({
        where: { telefone },
        data: { horarioEscolhido: escolhido, etapa: proximaEtapa },
      });

      if (conversa.clienteId && conversa.barbeiroId) {
        const servicos = await listarServicosBarbeiro(conversa.barbeiroId);
        await enviar("bot_escolhaServico", { servicos: formatarListaServicos(servicos) });
      } else {
        await enviar("bot_pedirNome");
      }
      break;
    }

    case "AGUARDANDO_NOME": {
      const nome = texto.trim();
      if (nome.length < 3) {
        await enviar("bot_pedirNome");
        break;
      }
      await prisma.botConversa.update({
        where: { telefone },
        data: { nomeTemp: nome, etapa: "AGUARDANDO_EMAIL" },
      });
      await enviar("bot_pedirEmail", { cliente: nome });
      break;
    }

    case "AGUARDANDO_EMAIL": {
      const email = texto.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        await enviar("bot_emailInvalido");
        break;
      }

      const existente = await prisma.cliente.findUnique({ where: { email } });
      let clienteId: string;
      let nomeCliente: string;

      if (existente) {
        clienteId = existente.id;
        nomeCliente = existente.nome;
        await enviar("bot_clienteReconhecido", { cliente: nomeCliente });
      } else {
        const senha = gerarSenhaAleatoria();
        const novo = await prisma.cliente.create({
          data: {
            nome: conversa.nomeTemp ?? "Cliente",
            telefone,
            email,
            senha: hashPassword(senha),
          },
        });
        clienteId = novo.id;
        nomeCliente = novo.nome;
        await enviar("bot_cadastroConcluido", { cliente: nomeCliente, email, senha });
      }

      await prisma.botConversa.update({
        where: { telefone },
        data: { clienteId, nomeTemp: null, emailTemp: null, etapa: "AGUARDANDO_SERVICO" },
      });

      if (conversa.barbeiroId) {
        const servicos = await listarServicosBarbeiro(conversa.barbeiroId);
        await enviar("bot_escolhaServico", { servicos: formatarListaServicos(servicos) });
      }
      break;
    }

    case "AGUARDANDO_SERVICO": {
      if (!conversa.barbeiroId) {
        await prisma.botConversa.update({ where: { telefone }, data: { etapa: "INICIO" } });
        break;
      }
      const servicos = await listarServicosBarbeiro(conversa.barbeiroId);
      const escolhido = matchServico(texto, servicos);
      if (!escolhido) {
        await enviar("bot_servicoInvalido", { servicos: formatarListaServicos(servicos) });
        break;
      }
      await prisma.botConversa.update({
        where: { telefone },
        data: { servicoEscolhidoId: escolhido.id, etapa: "AGUARDANDO_PAGAMENTO" },
      });
      await enviar("bot_escolhaPagamento");
      break;
    }

    case "AGUARDANDO_PAGAMENTO": {
      const metodo = matchPagamento(texto);
      if (!metodo) {
        await enviar("bot_pagamentoInvalido");
        break;
      }

      const [barbeiro, servico] = await Promise.all([
        conversa.barbeiroId ? prisma.barbeiro.findUnique({ where: { id: conversa.barbeiroId } }) : null,
        conversa.servicoEscolhidoId
          ? prisma.servico.findUnique({ where: { id: conversa.servicoEscolhidoId } })
          : null,
      ]);

      if (!barbeiro || !servico || !conversa.clienteId || !conversa.dataEscolhida || !conversa.horarioEscolhido) {
        await prisma.botConversa.update({
          where: { telefone },
          data: { etapa: "INICIO", ...CAMPOS_LIMPOS },
        });
        await enviar("bot_ajudaGenerica");
        break;
      }

      const dataFmt = new Date(conversa.dataEscolhida).toLocaleDateString("pt-BR");
      const servicoItem = { name: servico.nome, price: servico.preco, duration: servico.duracao };

      if (metodo === "LOCAL") {
        const reserva = await criarReserva({
          clienteId: conversa.clienteId,
          barbeiroId: barbeiro.id,
          dateIso: conversa.dataEscolhida,
          time: conversa.horarioEscolhido,
          services: [servicoItem],
          total: servico.preco,
          status: "CONFIRMADO",
        });
        await enviar("confirmacao", {
          cliente: reserva.cliente.nome,
          data: dataFmt,
          horario: conversa.horarioEscolhido,
        });
      } else {
        const ref = await criarPedidoOnline({
          clienteId: conversa.clienteId,
          barberName: barbeiro.nome,
          dateIso: conversa.dataEscolhida,
          time: conversa.horarioEscolhido,
          services: [servicoItem],
        });
        await enviar("bot_pedidoOnline", { link: linkCheckout(ref) });
      }

      await prisma.botConversa.update({
        where: { telefone },
        data: { etapa: "CONCLUIDO", ...CAMPOS_LIMPOS },
      });
      break;
    }

    default: {
      const intencao = await classificarIntencao(texto);

      if (intencao === "AGENDAR" || intencao === "HORARIOS") {
        const barbeiros = await listarBarbeirosAtivos();
        if (barbeiros.length === 0) {
          await enviar("bot_ajudaGenerica");
          break;
        }
        await prisma.botConversa.update({ where: { telefone }, data: { etapa: "AGUARDANDO_BARBEIRO" } });
        await enviar("bot_escolhaBarbeiro", { barbeiros: formatarListaBarbeiros(barbeiros) });
      } else if (intencao === "FORA_DO_ASSUNTO") {
        await enviar("bot_foraDoAssunto");
      } else {
        await enviar("bot_ajudaGenerica");
      }
      break;
    }
  }

  const todas = await prisma.botMensagem.findMany({
    where: { telefone },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  if (todas.length > HISTORICO_MAXIMO) {
    const idsParaExcluir = todas.slice(HISTORICO_MAXIMO).map((m) => m.id);
    await prisma.botMensagem.deleteMany({ where: { id: { in: idsParaExcluir } } });
  }
}
