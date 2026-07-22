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

export type HorarioOcupado = {
  horario: string;
  duracao: number;
};

export function generateTimeSlots(
  config: HorarioConfig,
  diaSemana?: number,
  options?: {
    duracao?: number;
    ocupados?: HorarioOcupado[];
  },
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

  // Duração do serviço selecionado — usada para não deixar um horário
  // "encostado" em outro (o agendamento inteiro precisa caber no intervalo).
  const duracao =
    options?.duracao && options.duracao > 0 ? options.duracao : step;

  const ocupados = (options?.ocupados ?? []).map((o) => {
    const inicio = toMinutes(o.horario);
    return { inicio, fim: inicio + (o.duracao > 0 ? o.duracao : step) };
  });

  const slots: string[] = [];
  for (let t = start; t < end; t += step) {
    const fim = t + duracao;

    // não cabe até o horário de fechamento
    if (fim > end) continue;

    // conflita com a pausa (ex: horário de almoço)
    if (pausaInicio !== null && pausaFim !== null && t < pausaFim && fim > pausaInicio) {
      continue;
    }

    // conflita com outro agendamento já existente — pula para o próximo
    // horário "redondo" em vez de deixar os agendamentos colados
    const conflita = ocupados.some((o) => t < o.fim && fim > o.inicio);
    if (conflita) continue;

    slots.push(toHHMM(t));
  }
  return slots;
}
