"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useTheme } from "next-themes";

const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

export function ThemeToggle() {
  const mounted = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);

  const { resolvedTheme, setTheme } = useTheme();

  if (!mounted) {
    return (
      <div
        className="theme-button"
        aria-hidden="true"
      />
    );
  }

  const isDark = resolvedTheme === "dark";

  const handleThemeChange = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <motion.button
      type="button"
      className="theme-button"
      onClick={handleThemeChange}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.9 }}
      transition={{
        type: "spring",
        stiffness: 450,
        damping: 22,
      }}
      aria-label={
        isDark
          ? "Switch to light theme"
          : "Switch to dark theme"
      }
      title={
        isDark
          ? "Switch to light theme"
          : "Switch to dark theme"
      }
    >
      <span className="theme-button-glow" />

      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.span
            key="sun"
            initial={{
              opacity: 0,
              rotate: -90,
              scale: 0.5,
              y: 12,
            }}
            animate={{
              opacity: 1,
              rotate: 0,
              scale: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              rotate: 90,
              scale: 0.5,
              y: -12,
            }}
            transition={{
              type: "spring",
              stiffness: 420,
              damping: 24,
            }}
          >
            <Sun
              aria-hidden="true"
              className="h-5 w-5 text-amber-400"
            />
          </motion.span>
        ) : (
          <motion.span
            key="moon"
            initial={{
              opacity: 0,
              rotate: 90,
              scale: 0.5,
              y: 12,
            }}
            animate={{
              opacity: 1,
              rotate: 0,
              scale: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              rotate: -90,
              scale: 0.5,
              y: -12,
            }}
            transition={{
              type: "spring",
              stiffness: 420,
              damping: 24,
            }}
          >
            <Moon
              aria-hidden="true"
              className="h-5 w-5 text-violet-600 dark:text-violet-300"
            />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
