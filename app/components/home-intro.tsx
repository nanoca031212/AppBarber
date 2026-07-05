"use client";

import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useStore } from "@/app/context/store";

function formatToday() {
  const text = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return text.charAt(0).toUpperCase() + text.slice(1);
}

const HomeIntro = () => {
  const { user } = useStore();
  const [today, setToday] = useState(formatToday());

  useEffect(() => {
    const id = setInterval(() => setToday(formatToday()), 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="hidden lg:flex lg:flex-col lg:gap-6">
      <div>
        <h1 className="text-2xl font-bold text-black">
          {user ? `Olá, ${user.name}!` : "Olá, Faça seu login!"}
        </h1>
        <p className="text-sm text-[#656565] mt-1">{today}</p>
      </div>
      <Field orientation="horizontal">
        <Input
          type="search"
          className="py-6 rounded-full"
          placeholder="Pesquise Serviços ou barbeiro"
        />
        <Button className="rounded-full h-12 w-12 flex items-center justify-center bg-black text-white hover:bg-zinc-900">
          <Search />
        </Button>
      </Field>
    </div>
  );
};

export default HomeIntro;
