import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { Features } from "@/components/Features";
import { GamesSection } from "@/components/GamesSection";
import { CTASection } from "@/components/CTASection";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-page">
      <Nav />
      <Hero />
      <div className="my-[80px]"></div>
      <HowItWorks />
      <div className="my-[80px]"></div>
      <Features />
      <div className="my-[80px]"></div>
      <GamesSection />
      <CTASection />
      <div className="flex-1" />
      <Footer />
    </div>
  );
}
