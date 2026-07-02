"use client";

import { motion } from "motion/react";

import type { BillingCycle } from "@/types/pricing";

type BillingToggleProps = {
  value: BillingCycle;
  onChange: (value: BillingCycle) => void;
};

type BillingOption = {
  label: string;
  value: BillingCycle;
  badge?: string;
};

const billingOptions: BillingOption[] = [
  {
    label: "Monthly",
    value: "monthly",
  },
  {
    label: "Annually",
    value: "annually",
    badge: "Save 20%",
  },
];

export function BillingToggle({
  value,
  onChange,
}: BillingToggleProps) {
  return (
    <div
      className="relative grid w-full max-w-[22rem] grid-cols-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-1.5 shadow-[var(--shadow-soft)] backdrop-blur-xl"
      role="group"
      aria-label="Choose a billing cycle"
    >
      {billingOptions.map((option) => {
        const isActive = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={isActive}
            className={[
              "relative isolate flex min-h-12 items-center justify-center gap-2 overflow-hidden rounded-xl px-3",
              "text-sm font-bold transition-colors duration-300",
              "focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]",
              isActive
                ? "text-[var(--foreground)]"
                : "text-[var(--muted)] hover:text-[var(--foreground)]",
            ].join(" ")}
          >
            {isActive && (
              <motion.span
                layoutId="billing-active-option"
                className="absolute inset-0 -z-10 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-strong)] shadow-[0_12px_35px_var(--primary-glow)]"
                initial={false}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 36,
                  mass: 0.8,
                }}
              />
            )}

            <span>{option.label}</span>

            {option.badge && (
              <span
                className={[
                  "rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide transition-all duration-300",
                  isActive
                    ? "bg-[var(--success)]/15 text-[var(--success)]"
                    : "bg-[var(--foreground)]/5 text-[var(--muted)]",
                ].join(" ")}
              >
                {option.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}