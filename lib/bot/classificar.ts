import { chamarGemini } from "@/lib/gemini";

export type Intencao = "AGENDAR" | "HORARIOS" | "FORA_DO_ASSUNTO" | "OUTRO";

const CATEGORIAS: Intencao[] = ["AGENDAR", "HORARIOS", "FORA_DO_ASSUNTO", "OUTRO"];

const PROMPT = `Você é um classificador de intenção para o WhatsApp de uma barbearia.
Classifique a mensagem do cliente em UMA destas categorias e responda APENAS com a palavra da categoria, sem pontuação e sem explicações:

AGENDAR - o cliente quer marcar um horário, cortar cabelo, ou é uma saudação inicial pedindo atendimento
HORARIOS - o cliente está perguntando quais dias ou horários estão disponíveis
FORA_DO_ASSUNTO - qualquer assunto sem relação com marcar um horário na barbearia
OUTRO - tem relação com a barbearia (preço, serviços, endereço, etc) mas não é AGENDAR nem HORARIOS`;

export async function classificarIntencao(mensagem: string): Promise<Intencao> {
  try {
    const resposta = await chamarGemini(PROMPT, [], mensagem, {
      temperature: 0,
      maxOutputTokens: 8,
    });
    const categoria = resposta.trim().toUpperCase().replace(/[^A-Z_]/g, "");
    if (CATEGORIAS.includes(categoria as Intencao)) return categoria as Intencao;
    return "OUTRO";
  } catch (err) {
    console.error("[bot/classificar] Falha ao classificar intenção:", err);
    return "OUTRO";
  }
}
