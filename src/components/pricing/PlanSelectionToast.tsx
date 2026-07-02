"use client";

import { useEffect } from "react";
import { CheckCircle2, Sparkles, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

export type PlanSelectionNotice = {
  id: number;
  planName: string;
};

type PlanSelectionToastProps = {
  notice: PlanSelectionNotice | null;
  onClose: () => void;
};

export function PlanSelectionToast({
  notice,
  onClose,
}: PlanSelectionToastProps) {
  useEffect(() => {
    if (!notice) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      onClose();
    }, 4500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [notice, onClose]);

  return (
    <AnimatePresence>
      {notice && (
        <motion.div
          key={notice.id}
          initial={{
            opacity: 0,
            y: 40,
            scale: 0.92,
            filter: "blur(8px)",
          }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
            filter: "blur(0px)",
          }}
          exit={{
            opacity: 0,
            y: 25,
            scale: 0.94,
            filter: "blur(6px)",
          }}
          transition={{
            type: "spring",
            stiffness: 320,
            damping: 27,
          }}
          role="status"
          aria-live="polite"
          className="fixed bottom-5 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 sm:bottom-8"
        >
          <div className="relative overflow-hidden rounded-2xl border border-[var(--border-strong)] bg-[var(--surface-strong)] p-4 shadow-[var(--shadow-card)] backdrop-blur-2xl">
            <div
              aria-hidden="true"
              className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-[var(--primary-glow)] blur-3xl"
            />

            <div className="relative flex items-start gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[var(--success)]/10 text-[var(--success)]">
                <CheckCircle2
                  aria-hidden="true"
                  className="h-6 w-6"
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-display font-bold">
                    {notice.planName} selected
                  </p>

                  <Sparkles
                    aria-hidden="true"
                    className="h-4 w-4 text-[var(--primary)]"
                  />
                </div>

                <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                  Great choice. This action is ready to connect
                  with a signup or checkout flow.
                </p>
              </div>

              <motion.button
                type="button"
                onClick={onClose}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.9 }}
                aria-label="Close notification"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-[var(--muted)] transition-colors hover:bg-[var(--foreground)]/5 hover:text-[var(--foreground)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
              >
                <X
                  aria-hidden="true"
                  className="h-4 w-4"
                />
              </motion.button>
            </div>

            <motion.div
              aria-hidden="true"
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{
                duration: 4.5,
                ease: "linear",
              }}
              className="absolute bottom-0 left-0 h-1 w-full origin-left bg-gradient-to-r from-[var(--primary)] via-[var(--secondary)] to-[var(--accent)]"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}