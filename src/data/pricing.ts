import type { PricingPlan } from "@/types/pricing";

export const pricingPlans: PricingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    description:
      "Everything you need to launch your first project and explore the platform.",
    prices: {
      monthly: 0,
      annually: 0,
    },
    ctaLabel: "Start for free",
    features: [
      "Up to 3 active projects",
      "5 GB secure storage",
      "Basic analytics",
      "Community support",
      "Core integrations",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    description:
      "Advanced tools, automation and collaboration features for growing teams.",
    prices: {
      monthly: 25,
      annually: 20,
    },
    ctaLabel: "Start Pro trial",
    badge: "Most Popular",
    featured: true,
    features: [
      "Unlimited active projects",
      "100 GB secure storage",
      "Advanced analytics",
      "Team collaboration",
      "Priority email support",
      "Custom integrations",
      "AI-powered workflows",
    ],
  },
  {
    id: "business",
    name: "Business",
    description:
      "Enterprise-grade control, security and support for scaling organizations.",
    prices: {
      monthly: 75,
      annually: 60,
    },
    ctaLabel: "Choose Business",
    features: [
      "Everything in Pro",
      "Unlimited storage",
      "Advanced security controls",
      "Role-based permissions",
      "Single sign-on support",
      "Dedicated success manager",
      "24/7 priority support",
    ],
  },
];