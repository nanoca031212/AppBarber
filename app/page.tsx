import Barbeiros from "./components/barbeiros";
import ClientBottomNav from "./components/client-bottom-nav";
import Header from "./components/header";
import HomeIntro from "./components/home-intro";
import Image from "next/image";
import Link from "next/link";
import { Instrument_Serif } from "next/font/google";
import { Button } from "@/components/ui/button";

const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
});

export default function Home() {
  return (
    <div className="bg-zinc-50 min-h-screen md:h-screen px-5 ">
      <div className="lg:max-w-6xl  lg:mx-auto">
        <Header />

        <div className="lg:flex lg:gap-8 lg:items-start  relative">
          <div className="w-[96%] mx-auto lg:order-2 lg:w-2/5 lg:mx-0 lg:shrink-0 relative transition-transform duration-300 lg:hover:scale-105 max-lg:animate-in max-lg:zoom-in-95 max-lg:duration-700">
            <div className="absolute top-75 md:top-105 left-5 md:left-7 flex flex-col md:gap-2 items-start gap-1">
              <h1
                className={`${instrumentSerif.className}  text-white md:text-4xl text-4xl font-bold`}
              >
                Pagamento Mensal
              </h1>
              <Button
                render={<Link href="/assinatura" />}
                nativeButton={false}
                className=" bg-white text-black px-6 py-5 text-md mt-1 font-semibold rounded-full lg:h-12 lg:px-6 lg:text-base"
              >
                Assinar Agora!
              </Button>
            </div>
            <Link href="/assinatura" className="block">
              <Image
                src="/nanoca.png"
                alt="Cabelo"
                width={1200}
                height={600}
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="w-full h-auto"
              />
            </Link>
          </div>
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
