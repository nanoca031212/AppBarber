import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { uploadToR2 } from "@/lib/r2";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Arquivo é obrigatório" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const folder = process.env.R2_FOLDER ? `${process.env.R2_FOLDER}/` : "";
  const key = `${folder}${randomUUID()}.${ext}`;

  const url = await uploadToR2(buffer, key, file.type || "image/jpeg");

  return NextResponse.json({ url });
}
