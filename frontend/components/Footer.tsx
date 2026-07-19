import Image from "next/image";

export function Footer() {
  return (
    <footer className="border-t border-border px-6 py-8 sm:px-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-muted sm:flex-row">
        <div className="flex items-center gap-2">
          <Image
            src="/fairbnb.png"
            alt="FairBnb"
            width={20}
            height={20}
            className="h-5 w-5 rounded-md object-contain"
          />
          <span className="font-bold text-fg">FairBnb</span>
        </div>
        <p>Powered by Stay22 &middot; not affiliated with Airbnb</p>
      </div>
    </footer>
  );
}
