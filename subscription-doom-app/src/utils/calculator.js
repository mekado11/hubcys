/**
 * Future value of monthly contributions at a given annual interest rate.
 *
 * Formula: FV = PMT * ((1 + r)^n - 1) / r
 *   PMT = monthly payment
 *   r   = monthly interest rate (annualRate / 12)
 *   n   = number of months
 */
export function futureValue(monthlyAmount, years = 10, annualRate = 0.07) {
  if (monthlyAmount <= 0) return 0
  const r = annualRate / 12
  const n = years * 12
  const fv = monthlyAmount * ((Math.pow(1 + r, n) - 1) / r)
  return Math.round(fv)
}

export function formatCurrency(amount, compact = false) {
  if (compact && amount >= 1000) {
    return '$' + (amount / 1000).toFixed(0) + 'k'
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatMonthly(amount) {
  return `$${Math.round(amount).toLocaleString()}/mo`
}
