import { NextResponse } from "next/server";
import { startSocket } from "@/lib/whatsapp/socket";

// Inicia a sessão do WhatsApp de um barbeiro sob demanda (primeira conexão).
// Sessões já conectadas antes são retomadas automaticamente no boot do
// servidor (veja instrumentation.ts) — esta rota só é necessária para ligar
// uma instância nova pela primeira vez.
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ barbeiroId: string }> },
) {
  const { barbeiroId } = await params;
  startSocket(barbeiroId).catch((err) => {
    console.error(`[whatsapp:${barbeiroId}] Falha ao iniciar conexão:`, err);
  });
  return NextResponse.json({ ok: true });
}
