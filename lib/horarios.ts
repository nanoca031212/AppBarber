export type HorarioConfig = {
  horaInicio: string;
  horaFim: string;
  intervalo: number;
  pausaAtiva: boolean;
  pausaInicio: string | null;
  pausaFim: string | null;
  diasFuncionamento: number[];
};

function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function toHHMM(minutes: number) {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

export function isDiaFuncionamento(config: HorarioConfig, diaSemana: number) {
  return config.diasFuncionamento.includes(diaSemana);
}

export function generateTimeSlots(
  config: HorarioConfig,
  diaSemana?: number,
): string[] {
  if (diaSemana !== undefined && !isDiaFuncionamento(config, diaSemana)) {
    return [];
  }

  const start = toMinutes(config.horaInicio);
  const end = toMinutes(config.horaFim);
  const step = config.intervalo > 0 ? config.intervalo : 30;
  const pausaInicio =
    config.pausaAtiva && config.pausaInicio ? toMinutes(config.pausaInicio) : null;
  const pausaFim =
    config.pausaAtiva && config.pausaFim ? toMinutes(config.pausaFim) : null;

  const slots: string[] = [];
  for (let t = start; t < end; t += step) {
    if (pausaInicio !== null && pausaFim !== null && t >= pausaInicio && t < pausaFim) {
      continue;
    }
    slots.push(toHHMM(t));
  }
  return slots;
}
