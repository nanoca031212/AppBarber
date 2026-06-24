import { Menu, Search } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

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
  const quickButtons: IconButtonProps[] = [
    { label: "Cabelo", iconSrc: "/IconBotom/Corte.svg" },
    { label: "Barba", iconSrc: "/IconBotom/Barba.svg" },
    { label: "Pezinho", iconSrc: "/IconBotom/Pezinho.svg" },
    { label: "Cabelos", iconSrc: "/IconBotom/Corte.svg" },
    { label: "Barbas", iconSrc: "/IconBotom/Barba.svg" },
    { label: "Pezinhos", iconSrc: "/IconBotom/Pezinho.svg" },
  ];

  return (
    <div className="py-6 space-y-6">
      <div className="flex justify-between items-center ">
        <div>
          <h1 className="text-3xl font-bold text-black">YvisonBarber</h1>
        </div>
        <div>
          <Menu className="text-2xl" color="black" />
        </div>
      </div>
      <div>
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
  );
};

export default Header;
