const DIAS_SEMANA: Record<string, number> = {
  domingo: 0,
  "segunda-feira": 1,
  segunda: 1,
  "terça-feira": 2,
  "terca-feira": 2,
  terca: 2,
  terça: 2,
  "quarta-feira": 3,
  quarta: 3,
  "quinta-feira": 4,
  quinta: 4,
  "sexta-feira": 5,
  sexta: 5,
  sabado: 6,
  sábado: 6,
};

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}

function comData(base: Date, dias: number): Date {
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  d.setDate(d.getDate() + dias);
  return d;
}

// Interpreta datas em linguagem natural (pt-BR) vindas de uma mensagem de WhatsApp.
// Retorna null quando não consegue identificar nenhuma data com confiança.
export function parseDataRelativa(texto: string, agora: Date = new Date()): Date | null {
  const t = normalizar(texto);

  if (/\bhoje\b/.test(t)) return comData(agora, 0);
  if (/depois\s+de\s+amanha/.test(t)) return comData(agora, 2);
  if (/\bamanha\b/.test(t)) return comData(agora, 1);

  const dataNumerica = t.match(/(\d{1,2})[\/\-.](\d{1,2})(?:[\/\-.](\d{2,4}))?/);
  if (dataNumerica) {
    const dia = Number(dataNumerica[1]);
    const mes = Number(dataNumerica[2]);
    let ano = dataNumerica[3] ? Number(dataNumerica[3]) : agora.getFullYear();
    if (ano < 100) ano += 2000;
    if (dia >= 1 && dia <= 31 && mes >= 1 && mes <= 12) {
      const data = new Date(ano, mes - 1, dia);
      if (data.getMonth() === mes - 1 && data.getDate() === dia) return data;
    }
    return null;
  }

  for (const [nome, diaSemana] of Object.entries(DIAS_SEMANA)) {
    const chave = normalizar(nome);
    if (t.includes(chave)) {
      const hojeSemana = agora.getDay();
      let diff = diaSemana - hojeSemana;
      if (diff < 0) diff += 7;
      return comData(agora, diff);
    }
  }

  return null;
}
