const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const GEMINI_MODEL = "gemini-3.6-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

export type GeminiMessage = { role: "user" | "model"; parts: [{ text: string }] };

export async function chamarGemini(
  systemPrompt: string,
  historico: GeminiMessage[],
  mensagemAtual: string,
  generationConfig?: { temperature?: number; maxOutputTokens?: number },
): Promise<string> {
  const contents: GeminiMessage[] = [
    ...historico,
    { role: "user", parts: [{ text: mensagemAtual }] },
  ];

  const res = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 512,
        ...generationConfig,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}
