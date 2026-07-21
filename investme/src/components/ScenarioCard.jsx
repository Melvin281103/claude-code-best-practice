// One card of the Simulateur's 3-scenario comparison (pessimiste /
// réaliste / optimiste). Pure presentation: all the math happens in
// Simulateur.jsx, this component just displays the numbers it's given.
import { formatCurrency, formatPercent } from '../utils/formatters'

export default function ScenarioCard({ title, colorClass, finalValue, contributions, gains, gainPercent, monthlyIncome }) {
  return (
    <div className="min-w-[220px] flex-1 rounded-xl bg-card p-4">
      <p className="text-sm text-slate-400">{title}</p>
      <p className={`mt-1 text-2xl font-bold ${colorClass}`}>{formatCurrency(finalValue)}</p>

      <dl className="mt-4 space-y-2 text-sm">
        <Row label="Versé au total" value={formatCurrency(contributions)} />
        <Row label="Gains" value={`${formatCurrency(gains)} (${formatPercent(gainPercent)})`} />
        <Row label="Revenu mensuel (règle des 4 %)" value={formatCurrency(monthlyIncome)} />
      </dl>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-slate-400">{label}</dt>
      <dd className="text-right text-slate-200">{value}</dd>
    </div>
  )
}
