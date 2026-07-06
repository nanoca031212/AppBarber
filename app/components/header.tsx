"use client";

import {
  CalendarDays,
  Camera,
  Home,
  LogIn,
  Menu,
  Search,
  User,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useStore } from "@/app/context/store";

type IconButtonProps = {
  label: string;
  iconSrc: string;
  className?: string;
};

function IconButton({ label, iconSrc, className }: IconButtonProps) {
  return (
    <Button
      className={[
        "rounded-full py-5 gap-3 border-2 border-[#F1F1F1] bg-[#FAFAFA] text-black font-semibold text-lg",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <Image
        src={iconSrc}
        alt={label}
        width={24}
        height={24}
        className="w-6 h-6"
      />
      {label}
    </Button>
  );
}

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { services, user, setUser } = useStore();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const reader = new FileReader();
    reader.onload = (ev) =>
      setUser({ ...user!, photo: ev.target?.result as string });
    reader.readAsDataURL(file);
  }

  const quickButtons: IconButtonProps[] = [
    { label: "Cabelo", iconSrc: "/IconBotom/Corte.svg" },
    { label: "Barba", iconSrc: "/IconBotom/Barba.svg" },
    { label: "Pezinho", iconSrc: "/IconBotom/Pezinho.svg" },
    { label: "Cabelos", iconSrc: "/IconBotom/Corte.svg" },
    { label: "Barbas", iconSrc: "/IconBotom/Barba.svg" },
    { label: "Pezinhos", iconSrc: "/IconBotom/Pezinho.svg" },
  ];

  return (
    <>
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>YvisonBarber</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col   gap-1 px-4 pt-2">
            <div className="flex  items-center gap-4 py-6">
              {user ? (
                <>
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    className="relative  shrink-0"
                  >
                    <div className="w-12 h-12 rounded-full bg-black overflow-hidden flex items-center justify-center">
                      {user.photo ? (
                        <img
                          src={user.photo}
                          alt={user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Camera className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-white border-2 border-[#F1f1f1] flex items-center justify-center">
                      <Camera className="w-2.5 h-2.5 text-black" />
                    </div>
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoChange}
                    />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-base truncate">{user.name}</p>
                    <p className="text-sm text-[#656565] truncate">
                      {user.email}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <h1 className="flex-1 text-lg font-semibold">
                    Olá, faça seu login!
                  </h1>
                  <Button className="h-10 w-12">
                    <LogIn className="w-12 h-12" />
                  </Button>
                </>
              )}
            </div>
            <div className=" py-6 space-y-2 border-y-2 border-[#F1F1F1]">
              <div className="bg-black text-white p-2 px-6 rounded-lg flex items-center gap-3">
                <Home className="w-5 h-5 shrink-0" />
                <h1 className="text-base font-semibold">Inicio</h1>
              </div>
              <div className="p-2 px-6 rounded-lg flex items-center gap-3">
                <CalendarDays className="w-5 h-5 shrink-0" />
                <h1 className="text-base font-semibold">Agendamentos</h1>
              </div>
            </div>
            <div className="py-4 space-y-1">
              {services.map((service) => {
                const name = service.name.toLowerCase();
                const iconSrc =
                  name.includes("barba") && !name.includes("corte")
                    ? "/IconBotom/Barba.svg"
                    : name.includes("pezinho")
                      ? "/IconBotom/Pezinho.svg"
                      : "/IconBotom/Corte.svg";
                return (
                  <div
                    key={service.id}
                    className="flex items-center gap-3 p-2 px-6 rounded-lg hover:bg-[#F1F1F1] cursor-pointer"
                  >
                    <Image
                      src={iconSrc}
                      alt={service.name}
                      width={20}
                      height={20}
                      className="w-5 h-5 shrink-0"
                    />
                    <p className="text-base font-semibold">{service.name}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <div className="py-6  space-y-6 ">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-black">Barber</h1>
          </div>
          <div className="hidden lg:flex items-center gap-6">
            <Button
              onClick={() => router.push("/agendamentos")}
              className="rounded-full gap-2  bg-[#FAFAFA] text-black font-semibold hover:bg-[#F1F1F1]"
            >
              <CalendarDays className="w-5 h-5" />
              Agendamentos
            </Button>
            <Button
              onClick={() => router.push("/perfil")}
              className="rounded-xl px-3 py-4 gap-2 border-2 border-[#F1F1F1] bg-black text-white font-semibold hover:bg-[#F1F1F1]"
            >
              <User className="w-5 h-5" />
              Perfil
            </Button>
          </div>
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir menu"
            className="lg:hidden"
          >
            <Menu className="text-2xl" color="black" />
          </button>
        </div>
        <div className="lg:hidden">
          <Field orientation="horizontal" className="pb-4">
            <Input
              type="search"
              className="py-6 rounded-full"
              placeholder="Pesquise Serviços ou barbeiro"
            />
            <Button className="rounded-full h-12 w-12 flex items-center justify-center bg-black text-white hover:bg-zinc-900">
              <Search />
            </Button>
          </Field>
          <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory no-scrollbar">
            {quickButtons.map((button) => (
              <IconButton
                key={button.label}
                label={button.label}
                iconSrc={button.iconSrc}
                className="shrink-0 snap-start"
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;
