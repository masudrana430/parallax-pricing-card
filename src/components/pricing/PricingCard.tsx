"use client";

import type { PointerEvent as ReactPointerEvent } from "react";
import { Check, Sparkles } from "lucide-react";
import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";

import { cn } from "@/lib/utils";
import type { BillingCycle, PricingPlan } from "@/types/pricing";

type PricingCardProps = {
  plan: PricingPlan;
  billingCycle: BillingCycle;
  index: number;
  onSelect: (plan: PricingPlan) => void;
};

export function PricingCard({
  plan,
  billingCycle,
  index,
  onSelect,
}: PricingCardProps) {
  const shouldReduceMotion = useReducedMotion();

  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);

  const normalizedX = useMotionValue(0);
  const normalizedY = useMotionValue(0);

  const rawRotateX = useTransform(normalizedY, [-0.5, 0.5], [6, -6]);

  const rawRotateY = useTransform(normalizedX, [-0.5, 0.5], [-6, 6]);

  const rotateX = useSpring(rawRotateX, {
    stiffness: 220,
    damping: 26,
    mass: 0.65,
  });

  const rotateY = useSpring(rawRotateY, {
    stiffness: 220,
    damping: 26,
    mass: 0.65,
  });

  const spotlightBackground = useMotionTemplate`
    radial-gradient(
      360px circle at ${pointerX}px ${pointerY}px,
      var(--primary-glow),
      transparent 72%
    )
  `;

  const currentPrice = plan.prices[billingCycle];
  const isFree = currentPrice === 0;
  const isAnnual = billingCycle === "annually";

  const annualTotal = currentPrice * 12;

  const billingDescription = isFree
    ? "Free forever. No credit card required."
    : isAnnual
      ? `Billed as $${annualTotal} per year.`
      : "Billed monthly. Cancel anytime.";

  const handlePointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    if (shouldReduceMotion || event.pointerType === "touch") {
      return;
    }

    const card = event.currentTarget;
    const rect = card.getBoundingClientRect();

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    pointerX.set(x);
    pointerY.set(y);

    normalizedX.set(x / rect.width - 0.5);
    normalizedY.set(y / rect.height - 0.5);
  };

  const handlePointerLeave = () => {
    normalizedX.set(0);
    normalizedY.set(0);
  };

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 55,
        scale: 0.96,
        filter: "blur(10px)",
      }}
      whileInView={{
        opacity: 1,
        y: 0,
        scale: 1,
        filter: "blur(0px)",
      }}
      viewport={{
        once: true,
        amount: 0.2,
      }}
      transition={{
        duration: 0.65,
        delay: index * 0.12,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="h-full"
    >
      <motion.article
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        whileHover={
          shouldReduceMotion
            ? undefined
            : {
                y: -10,
                scale: plan.featured ? 1.015 : 1.01,
              }
        }
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 24,
        }}
        style={{
          rotateX: shouldReduceMotion ? 0 : rotateX,
          rotateY: shouldReduceMotion ? 0 : rotateY,
          transformPerspective: 1100,
        }}
        className={cn("pricing-card", plan.featured && "pricing-card-featured")}
      >
        <div aria-hidden="true" className="pricing-card-shine" />

        <motion.div
          aria-hidden="true"
          className="pricing-card-spotlight"
          style={{
            background: shouldReduceMotion
              ? "transparent"
              : spotlightBackground,
          }}
        />

        {plan.badge && (
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.7,
              y: -8,
            }}
            whileInView={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            viewport={{ once: true }}
            transition={{
              delay: 0.45,
              type: "spring",
              stiffness: 300,
              damping: 20,
            }}
            className="absolute right-5 top-5 z-20 inline-flex items-center gap-1.5 rounded-full border border-[var(--border-strong)] bg-[var(--primary-glow)] px-3 py-1.5 text-xs font-extrabold text-[var(--primary)]"
          >
            <Sparkles aria-hidden="true" className="h-3.5 w-3.5" />

            {plan.badge}
          </motion.div>
        )}

        <div className="pricing-card-content relative z-10 flex h-full flex-col">
          <div>
            <p className="font-display text-xl font-bold tracking-tight">
              {plan.name}
            </p>

            <p className="mt-3 min-h-[4.5rem] text-sm leading-6 text-[var(--muted)]">
              {plan.description}
            </p>
          </div>

          <div className="mt-8" aria-live="polite" aria-atomic="true">
            <div className="flex min-h-[5.5rem] items-end">
              <span className="mb-2 mr-1 text-xl font-bold text-[var(--muted)]">
                $
              </span>

              <div className="relative overflow-hidden">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={`${plan.id}-${billingCycle}`}
                    initial={{
                      opacity: 0,
                      y: 34,
                      filter: "blur(8px)",
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      filter: "blur(0px)",
                    }}
                    exit={{
                      opacity: 0,
                      y: -34,
                      filter: "blur(8px)",
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 340,
                      damping: 27,
                      mass: 0.8,
                    }}
                    className="font-display block text-6xl font-bold tracking-[-0.065em] text-[var(--foreground)]"
                  >
                    {currentPrice}
                  </motion.span>
                </AnimatePresence>
              </div>

              <span className="mb-2 ml-2 text-sm font-semibold text-[var(--muted)]">
                / month
              </span>
            </div>

            <AnimatePresence mode="wait" initial={false}>
              <motion.p
                key={`${plan.id}-description-${billingCycle}`}
                initial={{
                  opacity: 0,
                  y: 5,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  y: -5,
                }}
                transition={{
                  duration: 0.2,
                }}
                className="mt-2 min-h-6 text-sm font-medium text-[var(--muted)]"
              >
                {billingDescription}
              </motion.p>
            </AnimatePresence>
          </div>

          <motion.button
            type="button"
            onClick={() => onSelect(plan)}
            aria-label={`Select the ${plan.name} plan`}
            whileHover={{
              scale: 1.02,
            }}
            whileTap={{
              scale: 0.97,
            }}
            transition={{
              type: "spring",
              stiffness: 420,
              damping: 24,
            }}
            className={cn(
              "pricing-cta mt-8",
              plan.featured ? "pricing-cta-featured" : "pricing-cta-secondary",
            )}
          >
            <span className="relative z-10">{plan.ctaLabel}</span>

            {plan.featured && (
              <span aria-hidden="true" className="pricing-cta-shimmer" />
            )}
          </motion.button>

          <div className="my-8 h-px bg-gradient-to-r from-transparent via-[var(--border-strong)] to-transparent" />

          <div className="flex-1">
            <p className="text-sm font-extrabold text-[var(--foreground)]">
              Everything included:
            </p>

            <ul className="mt-5 space-y-4">
              {plan.features.map((feature, featureIndex) => (
                <motion.li
                  key={feature}
                  initial={{
                    opacity: 0,
                    x: -12,
                  }}
                  whileInView={{
                    opacity: 1,
                    x: 0,
                  }}
                  viewport={{
                    once: true,
                  }}
                  transition={{
                    delay: index * 0.1 + featureIndex * 0.055 + 0.3,
                    duration: 0.35,
                  }}
                  className="flex items-start gap-3 text-sm leading-6 text-[var(--foreground-soft)]"
                >
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[var(--success)]/10 text-[var(--success)]">
                    <Check
                      aria-hidden="true"
                      strokeWidth={3}
                      className="h-3.5 w-3.5"
                    />
                  </span>

                  <span>{feature}</span>
                </motion.li>
              ))}
            </ul>
          </div>
        </div>
      </motion.article>
    </motion.div>
  );
}
