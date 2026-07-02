import { Sparkles } from "lucide-react";

import { Footer } from "@/components/layout/Footer";
import { PricingSection } from "@/components/pricing/PricingSection";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export default function HomePage() {
  return (
    <div className="page-shell">
      <div
        aria-hidden="true"
        className="ambient-orb orb-primary"
      />

      <div
        aria-hidden="true"
        className="ambient-orb orb-secondary"
      />

      <div
        aria-hidden="true"
        className="ambient-orb orb-accent"
      />

      <header className="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-6 sm:px-8 lg:px-12">
        <a
          href="#pricing"
          className="group flex items-center gap-3 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--primary)]"
          aria-label="Go to pricing section"
        >
          <div className="relative grid h-11 w-11 place-items-center overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-soft)] backdrop-blur-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary-glow)] to-[var(--secondary-glow)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

            <Sparkles
              aria-hidden="true"
              className="relative h-5 w-5 text-[var(--primary)] transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110"
            />
          </div>

          <div>
            <p className="font-display text-base font-bold tracking-tight">
              Parallax
            </p>

            <p className="text-xs text-[var(--muted)]">
              Premium pricing
            </p>
          </div>
        </a>

        <ThemeToggle />
      </header>

      <main>
        <PricingSection />
      </main>

      <Footer />
    </div>
  );
}