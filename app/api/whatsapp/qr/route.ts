import { NextResponse } from "next/server";
import qrcode from "qrcode";
import { getQr, getStatus } from "@/lib/whatsapp/socket";

export async function GET() {
  const qr = getQr();
  if (!qr) {
    return NextResponse.json({
      status: getStatus(),
      message: getStatus() === "open" ? "Já conectado" : "QR ainda não gerado, aguarde...",
    });
  }

  const png = await qrcode.toBuffer(qr, { type: "png", width: 300 });
  return new NextResponse(new Uint8Array(png), {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-store",
    },
  });
}
