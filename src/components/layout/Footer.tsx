import {
  Code2,
  GitBranch,
  Layers3,
  Sparkles,
} from "lucide-react";

const technologies = [
  "Next.js",
  "TypeScript",
  "Tailwind CSS",
  "Motion",
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-8 sm:px-8 lg:px-12">
      <div className="border-t border-[var(--border)] py-8">
        <div className="flex flex-col gap-7 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-soft)] backdrop-blur-xl">
              <Sparkles
                aria-hidden="true"
                className="h-5 w-5 text-[var(--primary)]"
              />
            </div>

            <div>
              <p className="font-display font-bold">
                Parallax Pricing
              </p>

              <p className="mt-1 text-sm text-[var(--muted)]">
                Interactive frontend screening project.
              </p>
            </div>
          </div>

          <div
            className="flex flex-wrap gap-2"
            aria-label="Technologies used"
          >
            {technologies.map((technology) => (
              <span
                key={technology}
                className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-bold text-[var(--muted)] backdrop-blur-xl"
              >
                {technology}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-4 border-t border-[var(--border)] pt-6 text-sm text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {currentYear} Masud Rana. Built with attention
            to accessibility and performance.
          </p>

          <div className="flex items-center gap-5">
            <span className="flex items-center gap-2">
              <Code2
                aria-hidden="true"
                className="h-4 w-4"
              />

              Responsive
            </span>

            <span className="flex items-center gap-2">
              <Layers3
                aria-hidden="true"
                className="h-4 w-4"
              />

              Reusable
            </span>

            <span className="flex items-center gap-2">
              <GitBranch
                aria-hidden="true"
                className="h-4 w-4"
              />

              Open source
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}