export const PLAN_PRICES = {
  investigator: {
    monthly: Number(process.env.NEXT_PUBLIC_PRICE_INVESTIGATOR_MONTHLY) || 300,
    yearly: Number(process.env.NEXT_PUBLIC_PRICE_INVESTIGATOR_YEARLY) || 2500,
  },
  pro: {
    monthly: Number(process.env.NEXT_PUBLIC_PRICE_PRO_MONTHLY) || 1000,
    yearly: Number(process.env.NEXT_PUBLIC_PRICE_PRO_YEARLY) || 12000,
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
