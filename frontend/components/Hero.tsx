import { mockHotels } from "@/lib/mockHotels";

export function Hero() {
  const heroImage = mockHotels[0];

  return (
    <section className="grid grid-cols-1 items-stretch gap-10 px-6 pb-14 pt-6 sm:px-10 lg:grid-cols-2 lg:gap-6">
      <div className="flex flex-col justify-center">
        <span className="inline-block w-fit rounded-full bg-brand-tint px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-tint-fg">
          Built on Stay22
        </span>
        <h1 className="mt-4 text-5xl font-extrabold leading-[1.05] tracking-tight text-fg sm:text-6xl">
          That Airbnb is
          <br />
          <span className="text-brand">overpriced.</span>
          <br />
          We can prove it.
        </h1>
        <p className="mt-5 max-w-md text-lg text-muted">
          Upload a video of any listing. Fairbnb uses vector embeddings to match it
          against <span className="text-brand">identical </span> looking hotels
          and tell you what it&apos;s actually worth
        </p>
      </div>

      <div className="relative min-h-64">
        <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-gradient-to-br from-brand-tint via-brand-tint/40 to-transparent" />
        <img
          src="fairbnb.png"
          alt={heroImage.name}
          className="h-full w-full rounded-[2rem] object-cover "
        />
      </div>
    </section>
  );
}
