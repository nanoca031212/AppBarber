import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { chamarGemini, type GeminiMessage } from "@/lib/gemini";
import { sendText } from "@/lib/evolution";

// Evolution API envia eventos de mensagem recebida
type EvolutionWebhook = {
  event: string;
  instance: string;
  data?: {
    key?: { remoteJid?: string; fromMe?: boolean };
    message?: { conversation?: string; extendedTextMessage?: { text?: string } };
    messageType?: string;
  };
};

function montarSystemPrompt(config: {
  identidade: string;
  contexto: string;
  instrucoes: string;
  restricoes: string;
}): string {
  const partes: string[] = [];

  if (config.identidade.trim())
    partes.push(`## Identidade\n${config.identidade}`);
  if (config.contexto.trim())
    partes.push(`## Contexto da Barbearia\n${config.contexto}`);
  if (config.instrucoes.trim())
    partes.push(`## Instruções\n${config.instrucoes}`);
  if (config.restricoes.trim())
    partes.push(`## Restrições\n${config.restricoes}`);

  partes.push(
    "## Regras gerais\n" +
      "- Responda sempre em português do Brasil.\n" +
      "- Seja breve e direto. Máximo 3 parágrafos curtos.\n" +
      "- Nunca invente informações que não foram fornecidas.",
  );

  return partes.join("\n\n");
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as EvolutionWebhook;

    // Só processa mensagens recebidas (não enviadas pelo bot)
    if (body.event !== "messages.upsert") return NextResponse.json({ ok: true });
    if (body.data?.key?.fromMe) return NextResponse.json({ ok: true });

    const jid = body.data?.key?.remoteJid ?? "";
    // Ignora grupos
    if (jid.includes("@g.us")) return NextResponse.json({ ok: true });

    const texto =
      body.data?.message?.conversation ??
      body.data?.message?.extendedTextMessage?.text ??
      "";

    if (!texto.trim()) return NextResponse.json({ ok: true });

    // Verifica se bot está ativo
    const botConfig = await prisma.botConfig.findUnique({ where: { id: "default" } });
    if (!botConfig?.ativo) return NextResponse.json({ ok: true });

    const telefone = jid.replace("@s.whatsapp.net", "");
    const instancia = body.instance;

    // Histórico dos últimos 10 turnos (20 mensagens)
    const historicoDB = await prisma.botMensagem.findMany({
      where: { telefone },
      orderBy: { createdAt: "asc" },
      take: 20,
    });

    const historico: GeminiMessage[] = historicoDB.map((m) => ({
      role: m.role as "user" | "model",
      parts: [{ text: m.conteudo }],
    }));

    const systemPrompt = montarSystemPrompt(botConfig);
    const resposta = await chamarGemini(systemPrompt, historico, texto);

    if (!resposta) return NextResponse.json({ ok: true });

    // Salva mensagens no histórico
    await prisma.botMensagem.createMany({
      data: [
        { telefone, role: "user", conteudo: texto },
        { telefone, role: "model", conteudo: resposta },
      ],
    });

    // Limpa histórico antigo (mantém só os últimos 20)
    const todos = await prisma.botMensagem.findMany({
      where: { telefone },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });
    if (todos.length > 20) {
      const idsParaExcluir = todos.slice(20).map((m) => m.id);
      await prisma.botMensagem.deleteMany({ where: { id: { in: idsParaExcluir } } });
    }

    // Envia resposta pelo WhatsApp
    await sendText(instancia, telefone, resposta);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[webhooks/evolution]", err);
    return NextResponse.json({ ok: true }); // sempre 200 para Evolution não retentar
  }
}
