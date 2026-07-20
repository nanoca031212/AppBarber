import Barbeiros from "./components/barbeiros";
import ClientBottomNav from "./components/client-bottom-nav";
import Header from "./components/header";
import HomeIntro from "./components/home-intro";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="bg-zinc-50 min-h-screen px-5 ">
      <div className="lg:max-w-6xl  lg:mx-auto">
        <Header />
        <div className="lg:flex lg:gap-8 lg:items-start">
          <Link
            href="/assinatura"
            className="w-[96%] mx-auto block lg:order-2 lg:w-2/5 lg:mx-0 lg:shrink-0"
          >
            <Image
              src="/Frame.png"
              alt="Cabelo"
              width={1200}
              height={600}
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="w-full h-auto"
            />
          </Link>
          <div className="lg:order-1 lg:flex-1 lg:min-w-0 lg:flex lg:flex-col lg:gap-6">
            <HomeIntro />
            <Barbeiros />
          </div>
        </div>
      </div>
      <ClientBottomNav />
    </div>
  );
}
