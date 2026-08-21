import { prisma } from "@/lib/prisma";
import { generateTimeSlots, type HorarioConfig } from "@/lib/horarios";

export async function horariosDisponiveisParaData(
  barbeiroId: string,
  data: Date,
): Promise<string[]> {
  const diaSemana = data.getDay();

  const [configBase, configDia] = await Promise.all([
    prisma.horarioFuncionamento.findFirst(),
    prisma.horarioDiaPersonalizado.findUnique({ where: { diaSemana } }),
  ]);

  const config: HorarioConfig = {
    horaInicio: configDia?.horaInicio ?? configBase?.horaInicio ?? "08:00",
    horaFim: configDia?.horaFim ?? configBase?.horaFim ?? "19:00",
    intervalo: configBase?.intervalo ?? 30,
    pausaAtiva: configDia?.pausaAtiva ?? configBase?.pausaAtiva ?? false,
    pausaInicio: configDia?.pausaInicio ?? configBase?.pausaInicio ?? null,
    pausaFim: configDia?.pausaFim ?? configBase?.pausaFim ?? null,
    diasFuncionamento: configBase?.diasFuncionamento ?? [1, 2, 3, 4, 5, 6],
  };

  const reservas = await prisma.reserva.findMany({
    where: { barbeiroId, status: { not: "CANCELADO" } },
    select: {
      data: true,
      horario: true,
      servicos: { select: { servico: { select: { duracao: true } } } },
    },
  });

  const ocupados = reservas
    .filter(
      (r) =>
        r.data.getFullYear() === data.getFullYear() &&
        r.data.getMonth() === data.getMonth() &&
        r.data.getDate() === data.getDate(),
    )
    .map((r) => ({
      horario: r.horario,
      duracao: r.servicos.reduce((sum, s) => sum + s.servico.duracao, 0) || 30,
    }));

  return generateTimeSlots(config, diaSemana, { ocupados });
}

// Casa a resposta do cliente (horário digitado ou número da lista mostrada)
// com um dos horários que foram oferecidos na mensagem anterior.
export function matchHorarioOfertado(texto: string, ofertados: string[]): string | null {
  const t = texto.trim();

  const horaMatch = t.match(/(\d{1,2})[:h]?(\d{2})?/);
  if (horaMatch) {
    const h = horaMatch[1].padStart(2, "0");
    const m = (horaMatch[2] ?? "00").padStart(2, "0");
    const candidato = `${h}:${m}`;
    if (ofertados.includes(candidato)) return candidato;
  }

  const indiceMatch = t.match(/^\D*(\d{1,2})\D*$/);
  if (indiceMatch) {
    const indice = Number(indiceMatch[1]) - 1;
    if (indice >= 0 && indice < ofertados.length) return ofertados[indice];
  }

  return null;
}
