import Image from "next/image";
import Link from "next/link";
import { Prism, steps } from "./HowItWorks";

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative flex flex-col justify-center bg-black px-6 py-16 text-white sm:px-10">
        <Link
          href="/"
          className="absolute left-6 top-6 flex items-center gap-2 text-sm font-semibold text-white/60 transition hover:text-white sm:left-10 sm:top-8"
        >
          <Image
            src="/fairbnb.png"
            alt="FairBnb"
            width={24}
            height={24}
            className="h-6 w-6 rounded-md object-contain"
          />
          Back to home
        </Link>

        <div className="mx-auto w-full max-w-sm">{children}</div>
      </div>

      <div className="hidden flex-col items-center justify-center gap-20 bg-page px-10 py-16 lg:flex">
        <div className="flex items-center gap-2">
          <Image
            src="/fairbnb.png"
            alt="FairBnb"
            width={40}
            height={40}
            className="h-10 w-10 rounded-md object-contain"
            priority
          />
          <span className="text-3xl font-extrabold tracking-tight text-fg">
            Fair<span className="text-brand">Bnb</span>
          </span>
        </div>

        <div className="flex items-end">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="relative w-20 shrink-0"
              style={{
                marginLeft: index === 0 ? 0 : "0.5rem",
                transform: `translateY(${index * 10}px)`,
                zIndex: index + 1,
              }}
            >
              <div className="relative aspect-[200/190] w-full">
                <Prism highlight={step.highlight} />
                {step.logo ? (
                  <div className="absolute left-1/2 top-[26%] flex -translate-x-1/2 -translate-y-1/2 items-center justify-center">
                    <Image src={step.logo} alt={step.title} width={200} height={113} className="h-auto w-9" />
                  </div>
                ) : (
                  <div
                    className={`absolute left-1/2 top-[26%] flex -translate-x-1/2 -translate-y-1/2 items-center justify-center ${
                      step.highlight ? "text-brand" : "text-fg"
                    }`}
                    style={{ opacity: step.highlight ? 1 : 0.35 }}
                  >
                    <step.Icon className="h-4 w-4" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
