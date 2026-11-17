export const PLAN_PRICES = {
  investigator: {
    monthly: Number(process.env.NEXT_PUBLIC_PRICE_INVESTIGATOR_MONTHLY || process.env.INVESTIGATOR_MONTHLY) || 0,
    yearly: Number(process.env.NEXT_PUBLIC_PRICE_INVESTIGATOR_YEARLY || process.env.INVESTIGATOR_YEARLY) || 0,
  },
  pro: {
    monthly: Number(process.env.NEXT_PUBLIC_PRICE_PRO_MONTHLY || process.env.PRICE_PRO_MONTHLY) || 0,
    yearly: Number(process.env.NEXT_PUBLIC_PRICE_PRO_YEARLY || process.env.PRICE_PRO_YEARLY) || 0,
  },
  free: {
    monthly: 0,
    yearly: 0,
  },
} as const

export function getPlanPrice(planName: string, period: "monthly" | "yearly"): number {
  const normalized = planName.toLowerCase()
  if (normalized === "investigator") {
    return period === "monthly" ? PLAN_PRICES.investigator.monthly : PLAN_PRICES.investigator.yearly
  }
  if (normalized === "pro") {
    return period === "monthly" ? PLAN_PRICES.pro.monthly : PLAN_PRICES.pro.yearly
  }
  return 0
}
