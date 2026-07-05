"use client";

import { usePathname, useRouter } from "next/navigation";
import { CalendarDays, Home, User } from "lucide-react";

const navItems = [
  { label: "Início", icon: Home, href: "/" },
  { label: "Agendamentos", icon: CalendarDays, href: "/agendamentos" },
  { label: "Perfil", icon: User, href: "/perfil" },
];

export default function ClientBottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const active = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t-2 border-[#F1f1f1] z-50">
      <div className="max-w-md mx-auto flex">
        {navItems.map(({ label, icon: Icon, href }) => {
          const isActive = active(href);
          return (
            <button
              key={href}
              type="button"
              onClick={() => router.push(href)}
              className={[
                "flex-1 flex flex-col items-center gap-1 py-3 transition-colors",
                isActive ? "text-black" : "text-[#656565]",
              ].join(" ")}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-semibold">{label}</span>
              {isActive && <div className="w-1 h-1 rounded-full bg-black" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
