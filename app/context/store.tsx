"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export type Service = {
  id: number;
  name: string;
  description: string;
  duration: number;
  price: number;
  photo?: string;
};

export type Barber = {
  id: string;
  name: string;
  initials: string;
  description: string;
  serviceIds: number[];
  photo?: string;
};

type BarbeiroApi = {
  id: string;
  nome: string;
  descricao: string | null;
  foto: string | null;
};

function getInitials(name: string) {
  return name
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

export type User = {
  id: string;
  name: string;
  phone: string;
  email: string;
  photo?: string;
};

type StoreCtx = {
  services: Service[];
  setServices: React.Dispatch<React.SetStateAction<Service[]>>;
  barbers: Barber[];
  setBarbers: React.Dispatch<React.SetStateAction<Barber[]>>;
  user: User | null;
  setUser: (u: User | null) => void;
};

const StoreContext = createContext<StoreCtx | null>(null);

export const DEFAULT_SERVICES: Service[] = [
  { id: 1, name: "Corte de Cabelo", description: "Corte masculino com máquina e tesoura", duration: 30, price: 50 },
  { id: 2, name: "Barba", description: "Aparar e modelar a barba", duration: 20, price: 35 },
  { id: 3, name: "Corte + Barba", description: "Combo completo corte e barba", duration: 45, price: 80 },
  { id: 4, name: "Pezinho", description: "Acabamento no contorno", duration: 15, price: 25 },
];

export const DEFAULT_BARBERS: Barber[] = [
  { id: "default-yvison", name: "Yvison", initials: "YV", description: "Especialista em cortes modernos e barba", serviceIds: [1, 2, 3, 4] },
];

function loadUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("user");
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [services, setServices] = useState<Service[]>(DEFAULT_SERVICES);
  const [barbers, setBarbers] = useState<Barber[]>(DEFAULT_BARBERS);
  const [user, setUserState] = useState<User | null>(loadUser);

  useEffect(() => {
    fetch("/api/barbeiros")
      .then((r) => r.json())
      .then((data: BarbeiroApi[]) => {
        if (!Array.isArray(data) || data.length === 0) return;
        setBarbers((prev) =>
          data.map((b) => {
            const existing = prev.find((p) => p.id === b.id);
            return {
              id: b.id,
              name: b.nome,
              initials: getInitials(b.nome),
              description: b.descricao ?? "",
              photo: b.foto ?? undefined,
              serviceIds: existing?.serviceIds ?? services.map((s) => s.id),
            };
          }),
        );
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setUser = useCallback((u: User | null) => {
    setUserState(u);
    if (u === null) {
      localStorage.removeItem("user");
    } else {
      localStorage.setItem("user", JSON.stringify(u));
    }
  }, []);

  return (
    <StoreContext.Provider value={{ services, setServices, barbers, setBarbers, user, setUser }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
