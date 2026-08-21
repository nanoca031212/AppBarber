import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { processarMensagemBot } from "@/lib/bot/flow";

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

    await processarMensagemBot(telefone, texto, body.instance);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[webhooks/evolution]", err);
    return NextResponse.json({ ok: true }); // sempre 200 para Evolution não retentar
  }
}
