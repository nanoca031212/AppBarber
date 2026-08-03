import { NextResponse } from "next/server";
import { getPhone, getQr, getStatus, isStarted } from "@/lib/whatsapp/socket";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ barbeiroId: string }> },
) {
  const { barbeiroId } = await params;
  return NextResponse.json({
    started: isStarted(barbeiroId),
    status: getStatus(barbeiroId),
    hasQr: !!getQr(barbeiroId),
    phone: getPhone(barbeiroId),
  });
}
