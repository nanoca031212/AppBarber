import { createInstance, getConnectionState, connectInstance } from "@/lib/evolution";

const BOT_INSTANCE = "barbearia-bot";

export async function GET() {
  try {
    const status = await getConnectionState(BOT_INSTANCE);
    const state = status.instance.state;

    if (state === "open") {
      return Response.json({ state: "open", qr: null });
    }

    // Se não conectado, tenta gerar QR
    const conn = await connectInstance(BOT_INSTANCE);
    return Response.json({ state, qr: conn.base64 ?? null });
  } catch (err: unknown) {
    // Instância não existe ainda — cria e retorna QR
    try {
      const created = await createInstance(BOT_INSTANCE);
      const qr = created.qrcode?.base64 ?? null;
      return Response.json({ state: "connecting", qr });
    } catch {
      return Response.json({ state: "error", qr: null }, { status: 500 });
    }
  }
}

export async function POST() {
  try {
    const conn = await connectInstance(BOT_INSTANCE);
    return Response.json({ state: "connecting", qr: conn.base64 ?? null });
  } catch {
    return Response.json({ error: "Erro ao conectar" }, { status: 500 });
  }
}
