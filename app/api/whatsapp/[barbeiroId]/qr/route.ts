import { NextResponse } from "next/server";
import { connectInstance, getConnectionState, instanceName } from "@/lib/evolution";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ barbeiroId: string }> },
) {
  const { barbeiroId } = await params;
  const instancia = instanceName(barbeiroId);

  try {
    const state = await getConnectionState(instancia).catch(() => null);

    if (state?.instance?.state === "open") {
      return NextResponse.json({ status: "open", message: "Já conectado" });
    }

    // Busca QR code da instância
    const data = await connectInstance(instancia);

    if (!data?.base64) {
      return NextResponse.json({
        status: state?.instance?.state ?? "close",
        message: "QR ainda não gerado, aguarde...",
      });
    }

    // base64 vem como "data:image/png;base64,..." — extrai só o buffer
    const base64Data = data.base64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Erro ao buscar QR code", detail: String(err) },
      { status: 500 },
    );
  }
}
