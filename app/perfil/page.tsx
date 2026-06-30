"use client";

import { useRouter } from "next/navigation";
import { ArrowLeftIcon, Camera, Check, LogOut, Pencil, User, X } from "lucide-react";
import { useRef, useState } from "react";
import { useStore } from "@/app/context/store";
import ClientBottomNav from "@/app/components/client-bottom-nav";

export default function PerfilPage() {
  const router = useRouter();
  const { user, setUser } = useStore();
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [editing, setEditing] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const reader = new FileReader();
    reader.onload = (ev) =>
      setUser({ ...user, photo: ev.target?.result as string });
    reader.readAsDataURL(file);
  }

  function startEditing() {
    if (!user) return;
    setNome(user.name);
    setEmail(user.email);
    setTelefone(user.phone);
    setErro(null);
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
    setErro(null);
  }

  function saveEditing() {
    if (!user) return;
    if (!nome.trim() || !email.trim()) {
      setErro("Nome e email são obrigatórios");
      return;
    }
    setUser({ ...user, name: nome.trim(), email: email.trim(), phone: telefone.trim() });
    setEditing(false);
    setErro(null);
  }

  const inputClass =
    "w-full rounded-xl border-2 border-[#F1f1f1] bg-[#FAFAFA] px-4 py-3.5 text-sm focus:outline-none focus:border-black";

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex flex-col pb-24">
        <ClientBottomNav />
        <div className="px-5 pt-8 pb-4 flex items-center gap-3 border-b border-[#F1f1f1]">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="w-10 h-10 rounded-full bg-[#F1f1f1] flex items-center justify-center"
          >
            <ArrowLeftIcon className="w-4 h-4" />
          </button>
          <h1 className="text-xl font-bold">Perfil</h1>
        </div>
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center px-5">
          <div className="w-16 h-16 rounded-full bg-[#F1f1f1] flex items-center justify-center">
            <User className="w-8 h-8 text-[#656565]" />
          </div>
          <div>
            <p className="font-bold text-lg">Você não está logado</p>
            <p className="text-sm text-[#656565] mt-1">
              Faça login ou crie uma conta para acessar seu perfil.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/cadastro")}
            className="rounded-full bg-black text-white px-8 py-3.5 text-sm font-semibold"
          >
            Criar conta / Entrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col pb-24">
      <ClientBottomNav />

      <div className="px-5 pt-8 pb-4 flex items-center gap-3 border-b border-[#F1f1f1]">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="w-10 h-10 rounded-full bg-[#F1f1f1] flex items-center justify-center"
        >
          <ArrowLeftIcon className="w-4 h-4" />
        </button>
        <h1 className="text-xl font-bold">Perfil</h1>
      </div>

      {/* Foto + nome */}
      <div className="flex flex-col items-center gap-4 px-5 pt-8 pb-6 border-b border-[#F1f1f1]">
        <button
          type="button"
          onClick={() => photoInputRef.current?.click()}
          className="relative"
        >
          <div className="w-24 h-24 rounded-full bg-black overflow-hidden flex items-center justify-center">
            {user.photo ? (
              <img src={user.photo} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <Camera className="w-8 h-8 text-white" />
            )}
          </div>
          <div className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-white border-2 border-[#F1f1f1] flex items-center justify-center">
            <Camera className="w-3.5 h-3.5 text-black" />
          </div>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoChange}
          />
        </button>
        <div className="text-center">
          <p className="font-bold text-xl">{user.name}</p>
          <p className="text-sm text-[#656565] mt-0.5">{user.email}</p>
          {user.phone && <p className="text-sm text-[#656565]">{user.phone}</p>}
        </div>
      </div>

      <div className="px-5 pt-6 flex flex-col gap-3">
        {/* Editar informações */}
        {editing ? (
          <div className="rounded-2xl border-2 border-black/10 bg-[#FAFAFA] p-4 flex flex-col gap-4">
            <p className="font-bold text-sm">Editar informações</p>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#656565] uppercase">Nome</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className={inputClass}
                placeholder="Seu nome completo"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#656565] uppercase">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                placeholder="seu@email.com"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#656565] uppercase">Telefone</label>
              <input
                type="tel"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                className={inputClass}
                placeholder="(11) 99999-0000"
              />
            </div>

            {erro && <p className="text-red-500 text-sm font-medium">{erro}</p>}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={cancelEditing}
                className="flex-1 flex items-center justify-center gap-2 rounded-full border-2 border-[#F1f1f1] bg-white py-3 text-sm font-semibold"
              >
                <X className="w-4 h-4" />
                Cancelar
              </button>
              <button
                type="button"
                onClick={saveEditing}
                className="flex-1 flex items-center justify-center gap-2 rounded-full bg-black text-white py-3 text-sm font-semibold"
              >
                <Check className="w-4 h-4" />
                Salvar
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={startEditing}
            className="w-full flex items-center gap-3 p-4 rounded-2xl border-2 border-[#F1f1f1] bg-[#FAFAFA] text-left"
          >
            <Pencil className="w-4 h-4 text-[#656565]" />
            <span className="font-semibold">Editar informações</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => router.push("/agendamentos")}
          className="w-full flex items-center gap-3 p-4 rounded-2xl border-2 border-[#F1f1f1] bg-[#FAFAFA] text-left"
        >
          <span className="font-semibold">Meus agendamentos</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setUser(null);
            router.push("/");
          }}
          className="w-full flex items-center gap-3 p-4 rounded-2xl border-2 border-red-100 bg-red-50 text-red-600 text-left"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-semibold">Sair da conta</span>
        </button>
      </div>
    </div>
  );
}
