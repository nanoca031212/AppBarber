"use client";

import { createContext, useContext, useState } from "react";

export type Service = {
  id: number;
  name: string;
  description: string;
  duration: number;
  price: number;
  photo?: string;
};

export type Barber = {
  id: number;
  name: string;
  initials: string;
  description: string;
  serviceIds: number[];
  photo?: string;
};

type StoreCtx = {
  services: Service[];
  setServices: React.Dispatch<React.SetStateAction<Service[]>>;
  barbers: Barber[];
  setBarbers: React.Dispatch<React.SetStateAction<Barber[]>>;
};

const StoreContext = createContext<StoreCtx | null>(null);

export const DEFAULT_SERVICES: Service[] = [
  { id: 1, name: "Corte de Cabelo", description: "Corte masculino com máquina e tesoura", duration: 30, price: 50 },
  { id: 2, name: "Barba", description: "Aparar e modelar a barba", duration: 20, price: 35 },
  { id: 3, name: "Corte + Barba", description: "Combo completo corte e barba", duration: 45, price: 80 },
  { id: 4, name: "Pezinho", description: "Acabamento no contorno", duration: 15, price: 25 },
];

export const DEFAULT_BARBERS: Barber[] = [
  { id: 1, name: "Yvison", initials: "YV", description: "Especialista em cortes modernos e barba", serviceIds: [1, 2, 3, 4] },
];

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [services, setServices] = useState<Service[]>(DEFAULT_SERVICES);
  const [barbers, setBarbers] = useState<Barber[]>(DEFAULT_BARBERS);

  return (
    <StoreContext.Provider value={{ services, setServices, barbers, setBarbers }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
