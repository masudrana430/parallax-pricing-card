"use client";

import { useCallback, useState } from "react";
import { BadgePercent, ShieldCheck, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { BillingToggle } from "@/components/pricing/BillingToggle";
import { PricingCard } from "@/components/pricing/PricingCard";
import { pricingPlans } from "@/data/pricing";
import type { BillingCycle, PricingPlan } from "@/types/pricing";
import {
  PlanSelectionToast,
  type PlanSelectionNotice,
} from "@/components/pricing/PlanSelectionToast";

export function PricingSection() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("annually");

  const [selectionNotice, setSelectionNotice] =
    useState<PlanSelectionNotice | null>(null);

  const handlePlanSelect = (plan: PricingPlan) => {
    setSelectionNotice({
      id: Date.now(),
      planName: plan.name,
    });
  };

  const closeSelectionNotice = useCallback(() => {
    setSelectionNotice(null);
  }, []);

  const isAnnual = billingCycle === "annually";

  return (
    <section
      id="pricing"
      className="relative mx-auto w-full max-w-7xl px-5 pb-24 pt-14 sm:px-8 sm:pb-32 sm:pt-20 lg:px-12"
    >
      <motion.div
        initial={{
          opacity: 0,
          y: 30,
          filter: "blur(8px)",
        }}
        animate={{
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
        }}
        transition={{
          duration: 0.75,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="mx-auto flex max-w-4xl flex-col items-center text-center"
      >
        <motion.div
          initial={{
            opacity: 0,
            scale: 0.85,
          }}
          animate={{
            opacity: 1,
            scale: 1,
          }}
          transition={{
            delay: 0.15,
            type: "spring",
            stiffness: 260,
            damping: 22,
          }}
          className="mb-7 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-bold text-[var(--primary)] shadow-[var(--shadow-soft)] backdrop-blur-xl"
        >
          <Sparkles aria-hidden="true" className="h-4 w-4" />
          Flexible plans for every stage
        </motion.div>

        <h1 className="font-display max-w-4xl text-5xl font-bold leading-[1.05] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
          Choose a plan that
          <span className="gradient-text block">grows with your vision.</span>
        </h1>

        <p className="mt-7 max-w-2xl text-base leading-8 text-[var(--muted)] sm:text-lg">
          Start small, scale confidently and switch plans whenever your team
          needs more power.
        </p>

        <motion.div
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 0.35,
            duration: 0.55,
          }}
          className="mt-10 flex w-full flex-col items-center"
        >
          <BillingToggle value={billingCycle} onChange={setBillingCycle} />

          <div className="mt-4 min-h-7">
            <AnimatePresence mode="wait" initial={false}>
              <motion.p
                key={billingCycle}
                initial={{
                  opacity: 0,
                  y: 8,
                  filter: "blur(4px)",
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  filter: "blur(0px)",
                }}
                exit={{
                  opacity: 0,
                  y: -8,
                  filter: "blur(4px)",
                }}
                transition={{
                  duration: 0.22,
                }}
                className="flex items-center justify-center gap-2 text-sm font-semibold text-[var(--muted)]"
                aria-live="polite"
              >
                {isAnnual ? (
                  <>
                    <BadgePercent
                      aria-hidden="true"
                      className="h-4 w-4 text-[var(--success)]"
                    />
                    Pay yearly and save 20% on every plan.
                  </>
                ) : (
                  <>No commitment. Pay month by month.</>
                )}
              </motion.p>
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>

      <div className="pricing-grid mt-16 grid items-stretch gap-6 lg:grid-cols-3">
        {pricingPlans.map((plan, index) => (
          <PricingCard
            key={plan.id}
            plan={plan}
            billingCycle={billingCycle}
            index={index}
            onSelect={handlePlanSelect}
          />
        ))}
      </div>

      <motion.div
        initial={{
          opacity: 0,
          y: 15,
        }}
        whileInView={{
          opacity: 1,
          y: 0,
        }}
        viewport={{
          once: true,
        }}
        transition={{
          delay: 0.45,
          duration: 0.5,
        }}
        className="mt-10 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 text-sm font-semibold text-[var(--muted)]"
      >
        <span className="flex items-center gap-2">
          <ShieldCheck
            aria-hidden="true"
            className="h-4 w-4 text-[var(--success)]"
          />
          14-day money-back guarantee
        </span>

        <span>No setup fees</span>

        <span>Cancel anytime</span>
      </motion.div>

      <PlanSelectionToast
        notice={selectionNotice}
        onClose={closeSelectionNotice}
      />
    </section>
  );
}
