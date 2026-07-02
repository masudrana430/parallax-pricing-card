export type BillingCycle = "monthly" | "annually";

export type PricingPlan = {
  id: string;
  name: string;
  description: string;
  prices: Record<BillingCycle, number>;
  features: string[];
  ctaLabel: string;
  badge?: string;
  featured?: boolean;
};