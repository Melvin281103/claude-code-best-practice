// "Projection hypothétique" - the legal, non-predictive alternative to a
// "future price estimate". It never claims to know what will happen: it
// only extrapolates an asset's OWN past average return forward in time,
// the same way the Simulateur does for a whole portfolio, and says so
// explicitly. This is a projection of the past, not a prediction of the
// future.
import { useMemo, useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { simulateGrowth } from '../utils/calculations'
import { formatCurrency, formatPercent } from '../utils/formatters'

const ILLUSTRATIVE_AMOUNT = 1000

export default function HypotheticalProjection({ annualReturn }) {
  const [years, setYears] = useState(10)

  const scenarios = useMemo(() => {
    const rates = {
      pessimiste: Math.max(annualReturn - 0.03, -0.95),
      realiste: annualReturn,
      optimiste: annualReturn + 0.03,
    }
    const series = {}
    for (const [key, rate] of Object.entries(rates)) {
      series[key] = simulateGrowth({ startAmount: ILLUSTRATIVE_AMOUNT, monthlyContribution: 0, years, annualRate: rate })
    }
    return series
  }, [annualReturn, years])

  const chartData = scenarios.realiste.map((point, i) => ({
    year: point.year,
    pessimiste: scenarios.pessimiste[i].value,
    realiste: scenarios.realiste[i].value,
    optimiste: scenarios.optimiste[i].value,
  }))
  const finalRealiste = scenarios.realiste[scenarios.realiste.length - 1].value

  return (
    <div className="mt-4 border-t border-slate-700 pt-4">
      <p className="text-sm font-medium text-white">📈 Projection hypothétique</p>
      <p className="mt-1 text-xs text-slate-500">
        Basée sur le rendement historique annualisé de cet actif ({formatPercent(annualReturn)}/an sur 5 ans). Ce
        n'est pas une prédiction.
      </p>

      <div className="mt-3">
        <div className="flex justify-between text-xs text-slate-400">
          <span>Durée</span>
          <span>{years} ans</span>
        </div>
        <input
          type="range"
          min={1}
          max={20}
          value={years}
          onChange={(e) => setYears(Number(e.target.value))}
          className="w-full accent-accent"
        />
      </div>

      <p className="mt-2 text-sm text-slate-300">
        Une mise hypothétique de {formatCurrency(ILLUSTRATIVE_AMOUNT)} vaudrait environ{' '}
        <span className="font-semibold text-accent">{formatCurrency(finalRealiste)}</span> dans {years} an
        {years > 1 ? 's' : ''}, si ce rendement historique se maintenait à l'identique.
      </p>

      <div className="mt-3 h-40">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="year" stroke="#94a3b8" tickFormatter={(y) => `${y}a`} />
            <YAxis stroke="#94a3b8" tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
            <Tooltip
              formatter={(value) => formatCurrency(value)}
              labelFormatter={(y) => `Année ${y}`}
              contentStyle={{ background: '#1e293b', border: '1px solid #334155' }}
            />
            <Area type="monotone" dataKey="pessimiste" stroke="#f87171" fill="#f87171" fillOpacity={0.15} />
            <Area type="monotone" dataKey="realiste" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} />
            <Area type="monotone" dataKey="optimiste" stroke="#4ade80" fill="#4ade80" fillOpacity={0.15} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-2 text-xs italic text-red-300">
        Projection hypothétique basée sur la performance passée. Les performances passées ne garantissent pas les
        performances futures. Ceci n'est pas un conseil en investissement au sens de la réglementation AMF.
      </p>
    </div>
  )
}
