import Image from "next/image";

export function Nav() {
  return (
    <header className="flex items-center px-6 py-5 sm:px-10">
      <a href="#" className="flex items-center gap-2">
        <Image
          src="/fairbnb.png"
          alt="FairBnb"
          width={32}
          height={32}
          className="h-8 w-8 rounded-md object-contain"
          priority
        />
        <span className="text-xl font-extrabold tracking-tight text-fg">
          Fair<span className="text-brand">Bnb</span>
        </span>
      </a>
    </header>
  );
}
