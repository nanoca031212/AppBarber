-- CreateTable
CREATE TABLE "HorarioDiaPersonalizado" (
    "diaSemana" INTEGER NOT NULL,
    "horaInicio" TEXT NOT NULL,
    "horaFim" TEXT NOT NULL,
    "pausaAtiva" BOOLEAN NOT NULL DEFAULT false,
    "pausaInicio" TEXT,
    "pausaFim" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HorarioDiaPersonalizado_pkey" PRIMARY KEY ("diaSemana")
);
