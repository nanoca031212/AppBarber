import Barbeiros from "./components/barbeiros";
import ClientBottomNav from "./components/client-bottom-nav";
import Header from "./components/header";
import Image from "next/image";

export default function Home() {
  return (
    <div className="bg-zinc-50 min-h-screen px-5 pb-24">
      <Header />
      <Image
        src="/Frame.png"
        alt="Cabelo"
        width={1200}
        height={600}
        sizes="100vw"
        className="w-[96%] h-auto mx-auto"
      />
      <Barbeiros />
      <ClientBottomNav />
    </div>
  );
}
