import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { ExposeSection } from "@/components/ExposeSection";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-page">
      <Nav />
      <Hero />
      <div className="my-[80px]"></div>
      <HowItWorks />
      <div className="my-[80px]"></div>
              <div className="my-30 text-center">
          <span className="inline-block rounded-full  text-[60px] font-extrabold text-brand">
            Give it a Try!
          </span>
        </div>
      <ExposeSection />
      <div className="flex-1" />
      <Footer />
    </div>
  );
}
