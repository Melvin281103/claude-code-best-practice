// Small formatting helpers so every page displays numbers, percentages
// and dates the same way (French locale, euro currency).

// 1234.5 -> "1 234,50 €"
export function formatCurrency(value) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value)
}

// 1234.5 -> "1 234,50 €" but keeping the cents (useful for unit prices)
export function formatCurrencyPrecise(value) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  }).format(value)
}

// 0.0823 -> "8,2 %"
export function formatPercent(decimalValue, digits = 1) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'percent',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(decimalValue)
}

// "2026-07-17" -> "17/07/2026"
export function formatDate(isoDateString) {
  const date = new Date(isoDateString)
  return new Intl.DateTimeFormat('fr-FR').format(date)
}

// Today's date as "YYYY-MM-DD", the format <input type="date"> expects.
export function todayISO() {
  return new Date().toISOString().slice(0, 10)
}
