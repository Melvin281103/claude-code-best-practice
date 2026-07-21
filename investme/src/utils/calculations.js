// Pure math functions used across InvestMe: compound interest projections,
// portfolio profile scoring, and DCA average price. "Pure" means: given the
// same inputs, they always return the same output, with no side effects.
// This makes them easy to test and reuse from any page.

// Hardcoded hypothetical annual returns, as required by the spec.
// These are NOT predictions - just simplified historical averages used
// to illustrate how compounding works.
export const HYPOTHETICAL_RATES = {
  etf: 0.08, // ETF World historique
  actions: 0.08, // Actions en direct (hypothèse)
  crypto: 0.15, // Crypto (hypothèse) - très volatile
}

// Turns a 0-100 allocation split into one weighted average annual return.
// Example: 70% ETF + 20% Actions + 10% Crypto -> 0.70*8% + 0.20*8% + 0.10*15%
export function weightedAnnualReturn(allocationPercent) {
  const { etf, actions, crypto } = allocationPercent
  return (
    (etf / 100) * HYPOTHETICAL_RATES.etf +
    (actions / 100) * HYPOTHETICAL_RATES.actions +
    (crypto / 100) * HYPOTHETICAL_RATES.crypto
  )
}

// Projects portfolio value year by year, with a starting amount plus a
// fixed monthly contribution, compounded monthly at "annualRate".
// Returns an array like [{ year: 0, value, contributions }, { year: 1, ... }, ...]
// which is exactly the shape Recharts wants for a line/area chart.
export function simulateGrowth({ startAmount, monthlyContribution, years, annualRate }) {
  // Converting an annual rate to a monthly rate this way (instead of just
  // dividing by 12) correctly accounts for compounding within the year.
  const monthlyRate = Math.pow(1 + annualRate, 1 / 12) - 1

  let balance = startAmount
  let totalContributions = startAmount
  const points = [{ year: 0, value: round(balance), contributions: round(totalContributions) }]

  for (let year = 1; year <= years; year++) {
    for (let month = 0; month < 12; month++) {
      balance = balance * (1 + monthlyRate) + monthlyContribution
      totalContributions += monthlyContribution
    }
    points.push({ year, value: round(balance), contributions: round(totalContributions) })
  }

  return points
}

// The "4% rule": a commonly cited rough estimate of how much you could
// withdraw per year from a portfolio without depleting it too fast.
// Divided by 12 here to show a monthly income figure.
export function monthlyIncomeFromWithdrawalRule(finalValue, withdrawalRate = 0.04) {
  return (finalValue * withdrawalRate) / 12
}

// Module 1 scoring: combines the "market crash reaction" quiz score (1-3)
// with the investment horizon (years) to pick a risk profile + allocation.
//
// Both inputs are first reduced to a 1-3 scale, then averaged and rounded.
// This guarantees the three examples from the spec line up exactly
// (score 1 + <5y -> Prudent, score 2 + 5-10y -> Équilibré,
//  score 3 + 10y+ -> Dynamique) while still giving a sensible answer for
// every other combination (e.g. a cautious score with a long horizon).
export function getInvestorProfile(score, years) {
  const horizonScore = years < 5 ? 1 : years <= 10 ? 2 : 3
  const combined = Math.round((score + horizonScore) / 2)

  if (combined <= 1) {
    return { name: 'Prudent', allocation: { etf: 70, actions: 20, crypto: 10 } }
  }
  if (combined === 2) {
    return { name: 'Équilibré', allocation: { etf: 60, actions: 25, crypto: 15 } }
  }
  return { name: 'Dynamique', allocation: { etf: 50, actions: 30, crypto: 20 } }
}

// Picks one entry from a list deterministically based on today's date, so
// everyone (and every reload) sees the SAME tip on a given day, and it
// automatically rotates to the next one tomorrow - no state, no backend,
// no API call needed.
export function getTipOfTheDay(tips, date = new Date()) {
  const startOfYear = new Date(date.getFullYear(), 0, 0)
  const dayOfYear = Math.floor((date - startOfYear) / (1000 * 60 * 60 * 24))
  return tips[dayOfYear % tips.length]
}

// Module 5 helper: average price paid per unit across a list of "Achat"
// trades for one asset - the classic DCA "average cost basis" figure.
export function averagePurchasePrice(trades) {
  const totalQuantity = trades.reduce((sum, t) => sum + t.quantity, 0)
  const totalCost = trades.reduce((sum, t) => sum + t.quantity * t.unitPrice, 0)
  return totalQuantity > 0 ? totalCost / totalQuantity : 0
}

function round(value) {
  return Math.round(value * 100) / 100
}
