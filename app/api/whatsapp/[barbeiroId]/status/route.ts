import { NextResponse } from "next/server";
import { getConnectionState, instanceName, createInstance } from "@/lib/evolution";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ barbeiroId: string }> },
) {
  const { barbeiroId } = await params;
  const instancia = instanceName(barbeiroId);

  try {
    const data = await getConnectionState(instancia);
    const state = data?.instance?.state ?? "close";

    return NextResponse.json({
      started: state !== "close",
      status: state,
      hasQr: state === "connecting",
      phone: null,
    });
  } catch {
    // Instância ainda não existe — retorna desconectado
    return NextResponse.json({
      started: false,
      status: "close",
      hasQr: false,
      phone: null,
    });
  }
}
