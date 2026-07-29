import { NextResponse } from "next/server";
import { getPhone, getQr, getStatus } from "@/lib/whatsapp/socket";

export async function GET() {
  return NextResponse.json({
    status: getStatus(),
    hasQr: !!getQr(),
    phone: getPhone(),
  });
}
