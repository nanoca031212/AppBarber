import Link from "next/link";

const Barbeiros = () => {
  return (
    <div className="py-6 space-y-6">
      <div>
        <div className="pb-1">
          <h1 className=" font-semibold uppercase text-sm">barbeiros</h1>
        </div>
        <div className="flex gap-2 overflow-x-auto snap-x snap-mandatory no-scrollbar">
          <Link href="/barbeiro">
            <div className="h-36 w-62 bg-[#afafaf] rounded-md shrink-0 snap-start"></div>
          </Link>
          <Link href="/barbeiro">
            <div className="h-36 w-62 bg-[#afafaf] rounded-md shrink-0 snap-start"></div>
          </Link>
          <Link href="/barbeiro">
            <div className="h-36 w-62 bg-[#afafaf] rounded-md shrink-0 snap-start"></div>
          </Link>
        </div>
      </div>
      <div>
        <div className="pb-1">
          <h1 className=" font-semibold uppercase text-sm">serviços</h1>
        </div>
        <div className="flex gap-2 overflow-x-auto snap-x snap-mandatory no-scrollbar">
          <div className="h-36 w-62 bg-[#afafaf] rounded-md shrink-0 snap-start"></div>

          <div className="h-36 w-62 bg-[#afafaf] rounded-md shrink-0 snap-start"></div>
          <div className="h-36 w-62 bg-[#afafaf] rounded-md shrink-0 snap-start"></div>
        </div>
      </div>
    </div>
  );
};

export default Barbeiros;
