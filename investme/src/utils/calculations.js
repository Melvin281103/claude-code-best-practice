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
// "rates" defaults to the generic category assumptions, but the
// Simulateur can pass a specific asset's own annualized rate instead
// (e.g. swap "ETF: 8%" for "CW8: 11.8%") to test one real fund/stock/coin.
export function weightedAnnualReturn(allocationPercent, rates = HYPOTHETICAL_RATES) {
  const { etf, actions, crypto } = allocationPercent
  return (etf / 100) * rates.etf + (actions / 100) * rates.actions + (crypto / 100) * rates.crypto
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

// Converts a cumulative multi-year return (e.g. perf_5y = 3.5, meaning
// +350% over 5 years) into the equivalent constant annual rate (CAGR) -
// the same "per year" shape simulateGrowth expects. Clamped so the base
// (1 + rate) never goes to zero/negative, which would make the fractional
// power below produce NaN.
export function annualizedRateFromCumulative(cumulativeReturn, numberOfYears) {
  const safeCumulative = Math.max(cumulativeReturn, -0.99)
  return Math.pow(1 + safeCumulative, 1 / numberOfYears) - 1
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

// Module 4 helper: groups raw trades into net positions per asset - how
// many units are still held, and how much money went into that position
// (Achat - Vente). Shared between the Journal and the Profil dashboard.
export function buildPositions(trades) {
  const byName = {}
  for (const t of trades) {
    if (!byName[t.name]) byName[t.name] = { name: t.name, assetClass: t.assetClass, quantity: 0, invested: 0 }
    const sign = t.type === 'Achat' ? 1 : -1
    byName[t.name].quantity += sign * t.quantity
    byName[t.name].invested += sign * t.totalAmount
  }
  return Object.values(byName).filter((p) => p.quantity > 0)
}

// Module 5 helpers: shared between the DCA page and the Profil page's
// dashboard summary, so "days until the next DCA" is computed identically
// in both places instead of two copies drifting apart.
export function currentMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

// How many days until the next occurrence of "day" (1-28) in the current
// or next month. Returns 0 if it's today.
export function daysUntilDay(day, today) {
  const target = new Date(today.getFullYear(), today.getMonth(), day)
  if (target < today) target.setMonth(target.getMonth() + 1)
  const diffMs = target.setHours(0, 0, 0, 0) - new Date(today).setHours(0, 0, 0, 0)
  return Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)))
}

// The single soonest-due, not-yet-done DCA plan across the whole month.
export function computeNextDca(plans, log, today) {
  const monthKey = currentMonthKey(today)
  const pending = plans.filter((p) => !log.some((l) => l.planId === p.id && l.month === monthKey))
  if (pending.length === 0) return null

  let best = null
  for (const plan of pending) {
    const daysLeft = daysUntilDay(plan.day, today)
    if (!best || daysLeft < best.daysLeft) best = { asset: plan.asset, daysLeft }
  }
  return best
}

function round(value) {
  return Math.round(value * 100) / 100
}

// Module 4 helper: pure local statistics over the emotion tagged on each
// trade - no API call, so this stays useful even when Claude API credits
// are unavailable. Only raises a flag once there are enough trades of
// that type for the ratio to mean something rather than be noise.
const MIN_TRADES_FOR_FLAG = 3

export function analyzeTradingBehavior(trades) {
  const emotionCounts = { peur: 0, neutre: 0, confiant: 0, euphorique: 0 }
  let sellsTotal = 0
  let sellsUnderFear = 0
  let buysTotal = 0
  let buysUnderEuphoria = 0

  for (const t of trades) {
    if (emotionCounts[t.emotion] !== undefined) emotionCounts[t.emotion]++
    if (t.type === 'Vente') {
      sellsTotal++
      if (t.emotion === 'peur') sellsUnderFear++
    } else {
      buysTotal++
      if (t.emotion === 'euphorique') buysUnderEuphoria++
    }
  }

  const flags = []
  if (sellsTotal >= MIN_TRADES_FOR_FLAG && sellsUnderFear / sellsTotal >= 0.5) {
    flags.push(
      `${Math.round((sellsUnderFear / sellsTotal) * 100)} % de tes ventes ont été faites sous l'émotion "Peur" - vendre dans la panique verrouille souvent une perte qui aurait pu se résorber.`
    )
  }
  if (buysTotal >= MIN_TRADES_FOR_FLAG && buysUnderEuphoria / buysTotal >= 0.5) {
    flags.push(
      `${Math.round((buysUnderEuphoria / buysTotal) * 100)} % de tes achats ont été faits sous l'émotion "Euphorique" - acheter dans l'euphorie revient souvent à acheter après une forte hausse.`
    )
  }

  return { emotionCounts, sellsTotal, sellsUnderFear, buysTotal, buysUnderEuphoria, flags }
}

// Module 4 helper: flags when a single real position dominates the
// portfolio - "60% in one crypto" is a concentration risk regardless of
// which asset it is, and this needs no AI call or market data to compute.
const CONCENTRATION_THRESHOLD = 0.4

export function concentrationScore(positionValues) {
  const total = positionValues.reduce((sum, p) => sum + p.value, 0)
  if (total <= 0 || positionValues.length === 0) return null

  const largest = positionValues.reduce((max, p) => (p.value > max.value ? p : max))
  const percent = largest.value / total
  return { name: largest.name, percent, flagged: percent >= CONCENTRATION_THRESHOLD }
}

// Module 4 helper: XIRR (time-weighted internal rate of return) from raw
// trade cash flows plus the portfolio's current value "today". Unlike
// the simple P&L%, this accounts for WHEN money went in - investing
// 1000€ then getting +10% next week is a much higher annualized return
// than the same +10% over 5 years, and XIRR captures that difference.
// Solved numerically (Newton's method) since there's no closed-form
// formula for irregular cash flows.
function xnpv(rate, cashFlows) {
  const t0 = cashFlows[0].date
  return cashFlows.reduce((sum, cf) => {
    const years = (cf.date - t0) / (1000 * 60 * 60 * 24 * 365)
    return sum + cf.amount / Math.pow(1 + rate, years)
  }, 0)
}

export function calculateXIRR(trades, currentValue, asOfDate = new Date()) {
  if (trades.length === 0 || currentValue <= 0) return null

  // Achats = money leaving your pocket (negative), Ventes = money coming
  // back (positive), and the current portfolio value counts as one final
  // positive cash flow "as of today" (as if you sold everything now).
  const cashFlows = trades
    .map((t) => ({
      date: new Date(t.date),
      amount: t.type === 'Achat' ? -t.totalAmount : t.totalAmount,
    }))
    .concat({ date: asOfDate, amount: currentValue })
    .sort((a, b) => a.date - b.date)

  // Newton's method: start at a reasonable guess and refine. Falls back
  // to null if it doesn't converge (e.g. pathological cash flow shapes)
  // rather than showing a nonsense number.
  let rate = 0.1
  for (let i = 0; i < 100; i++) {
    const npv = xnpv(rate, cashFlows)
    const derivative = (xnpv(rate + 1e-5, cashFlows) - npv) / 1e-5
    if (Math.abs(derivative) < 1e-10) return null
    const nextRate = rate - npv / derivative
    if (Math.abs(nextRate - rate) < 1e-6) return nextRate
    rate = nextRate
  }
  return null
}
