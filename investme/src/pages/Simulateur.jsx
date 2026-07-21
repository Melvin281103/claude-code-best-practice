// MODULE 2 - Simulateur d'Investissement.
// Lets the user play with starting amount / monthly contribution /
// duration / asset allocation, and see 3 hypothetical growth scenarios.
import { useMemo, useState } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import Disclaimer from '../components/Disclaimer.jsx'
import ScenarioCard from '../components/ScenarioCard.jsx'
import {
  simulateGrowth,
  weightedAnnualReturn,
  monthlyIncomeFromWithdrawalRule,
  annualizedRateFromCumulative,
  HYPOTHETICAL_RATES,
} from '../utils/calculations'
import { formatCurrency, formatPercent } from '../utils/formatters'
import { ETFS } from '../data/etfs'
import { ACTIONS } from '../data/actions'
import { CRYPTOS } from '../data/cryptos'

const SIMULATEUR_DISCLAIMER =
  "Ces projections sont basées sur des rendements hypothétiques historiques. Les performances passées ne garantissent pas les performances futures. Ce simulateur est informatif uniquement et ne constitue pas un conseil en investissement au sens de la réglementation AMF."

// For each allocation category, the list of specific real assets the
// user can plug in instead of the generic category average - each one
// carries its own historical perf_5y, annualized the same way the
// Comparateur's "projection hypothétique" does.
const ASSET_OPTIONS = {
  etf: ETFS.map((e) => ({ value: e.isin, label: `${e.name} (${e.ticker})`, perf_5y: e.perf_5y })),
  actions: ACTIONS.map((a) => ({ value: a.ticker, label: `${a.name} (${a.ticker})`, perf_5y: a.perf_5y })),
  crypto: CRYPTOS.map((c) => ({ value: c.ticker, label: `${c.name} (${c.ticker})`, perf_5y: c.perf_5y })),
}

export default function Simulateur() {
  const [startAmount, setStartAmount] = useState(500)
  const [monthlyContribution, setMonthlyContribution] = useState(150)
  const [years, setYears] = useState(10)
  const [allocation, setAllocation] = useState({ etf: 70, actions: 20, crypto: 10 })
  // "" for a category means "use the generic historical average" - pick a
  // specific ETF/action/crypto isin/ticker to test that asset instead.
  const [assetChoice, setAssetChoice] = useState({ etf: '', actions: '', crypto: '' })

  const totalAllocation = allocation.etf + allocation.actions + allocation.crypto
  const allocationValid = totalAllocation === 100

  // Swap in a specific asset's own annualized rate for any category
  // where one was picked, falling back to the generic assumption.
  const effectiveRates = useMemo(() => {
    const rates = { ...HYPOTHETICAL_RATES }
    for (const category of ['etf', 'actions', 'crypto']) {
      const chosen = ASSET_OPTIONS[category].find((o) => o.value === assetChoice[category])
      if (chosen) rates[category] = annualizedRateFromCumulative(chosen.perf_5y, 5)
    }
    return rates
  }, [assetChoice])

  // Recompute the whole simulation only when an input actually changes.
  const scenarios = useMemo(() => {
    const baseRate = weightedAnnualReturn(allocation, effectiveRates)
    const rates = {
      pessimiste: Math.max(baseRate - 0.03, 0),
      realiste: baseRate,
      optimiste: baseRate + 0.03,
    }

    const series = {}
    for (const [key, rate] of Object.entries(rates)) {
      series[key] = simulateGrowth({ startAmount, monthlyContribution, years, annualRate: rate })
    }
    return { rates, series }
  }, [startAmount, monthlyContribution, years, allocation, effectiveRates])

  // Merge the 3 series into one array per year, the shape Recharts wants
  // for drawing 3 areas on the same chart: [{ year, pessimiste, realiste, optimiste }]
  const chartData = scenarios.series.realiste.map((point, i) => ({
    year: point.year,
    pessimiste: scenarios.series.pessimiste[i].value,
    realiste: scenarios.series.realiste[i].value,
    optimiste: scenarios.series.optimiste[i].value,
  }))

  function scenarioProps(key) {
    const points = scenarios.series[key]
    const finalValue = points[points.length - 1].value
    const contributions = points[points.length - 1].contributions
    const gains = finalValue - contributions
    const gainPercent = contributions > 0 ? gains / contributions : 0
    return {
      finalValue,
      contributions,
      gains,
      gainPercent,
      monthlyIncome: monthlyIncomeFromWithdrawalRule(finalValue),
    }
  }

  return (
    <div className="px-4 py-6">
      <h1 className="mb-4 text-2xl font-bold text-white">Simulateur</h1>

      <div className="space-y-5 rounded-xl bg-card p-4">
        <SliderInput
          label="Montant de départ"
          value={startAmount}
          onChange={setStartAmount}
          min={0}
          max={10000}
          step={50}
          format={formatCurrency}
        />
        <SliderInput
          label="Versement mensuel"
          value={monthlyContribution}
          onChange={setMonthlyContribution}
          min={0}
          max={2000}
          step={10}
          format={formatCurrency}
        />
        <SliderInput
          label="Durée"
          value={years}
          onChange={setYears}
          min={1}
          max={40}
          step={1}
          format={(v) => `${v} ans`}
        />

        <div>
          <p className="mb-2 text-sm text-slate-400">Répartition</p>

          <AllocationSlider label="ETF" value={allocation.etf} onChange={(v) => setAllocation({ ...allocation, etf: v })} />
          <AssetPicker
            categoryLabel="ETF"
            options={ASSET_OPTIONS.etf}
            value={assetChoice.etf}
            onChange={(v) => setAssetChoice({ ...assetChoice, etf: v })}
            defaultRate={HYPOTHETICAL_RATES.etf}
          />

          <AllocationSlider
            label="Actions"
            value={allocation.actions}
            onChange={(v) => setAllocation({ ...allocation, actions: v })}
          />
          <AssetPicker
            categoryLabel="Actions"
            options={ASSET_OPTIONS.actions}
            value={assetChoice.actions}
            onChange={(v) => setAssetChoice({ ...assetChoice, actions: v })}
            defaultRate={HYPOTHETICAL_RATES.actions}
          />

          <AllocationSlider
            label="Crypto"
            value={allocation.crypto}
            onChange={(v) => setAllocation({ ...allocation, crypto: v })}
          />
          <AssetPicker
            categoryLabel="Crypto"
            options={ASSET_OPTIONS.crypto}
            value={assetChoice.crypto}
            onChange={(v) => setAssetChoice({ ...assetChoice, crypto: v })}
            defaultRate={HYPOTHETICAL_RATES.crypto}
          />

          <p className={`mt-1 text-sm ${allocationValid ? 'text-slate-500' : 'text-red-400'}`}>
            Total : {totalAllocation} % {!allocationValid && '- doit faire 100 %'}
          </p>
        </div>

        <div className="text-sm text-slate-400">
          Rendement pondéré utilisé (réaliste) :{' '}
          <span className="font-medium text-accent">{formatPercent(scenarios.rates.realiste)}</span> /an
        </div>
      </div>

      <div className="mt-5 flex gap-3 overflow-x-auto pb-1">
        <ScenarioCard title="Pessimiste" colorClass="text-red-400" {...scenarioProps('pessimiste')} />
        <ScenarioCard title="Réaliste" colorClass="text-accent" {...scenarioProps('realiste')} />
        <ScenarioCard title="Optimiste" colorClass="text-green-400" {...scenarioProps('optimiste')} />
      </div>

      <div className="mt-5 rounded-xl bg-card p-4">
        <p className="mb-3 text-sm text-slate-400">Évolution du portefeuille</p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="year" stroke="#94a3b8" tickFormatter={(y) => `${y}a`} />
              <YAxis stroke="#94a3b8" tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
              <Tooltip
                formatter={(value) => formatCurrency(value)}
                labelFormatter={(year) => `Année ${year}`}
                contentStyle={{ background: '#1e293b', border: '1px solid #334155' }}
              />
              <Area type="monotone" dataKey="pessimiste" stroke="#f87171" fill="#f87171" fillOpacity={0.15} />
              <Area type="monotone" dataKey="realiste" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} />
              <Area type="monotone" dataKey="optimiste" stroke="#4ade80" fill="#4ade80" fillOpacity={0.15} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-5">
        <Disclaimer message={SIMULATEUR_DISCLAIMER} />
      </div>
    </div>
  )
}

function SliderInput({ label, value, onChange, min, max, step, format }) {
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span className="text-slate-400">{label}</span>
        <span className="font-medium text-white">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full accent-accent"
      />
    </div>
  )
}

// Lets the user swap a category's generic assumption (ex: "ETF: 8%/an")
// for one specific real asset's own historical rate, so they can test
// "what if it's actually CW8" instead of just the broad average.
function AssetPicker({ categoryLabel, options, value, onChange, defaultRate }) {
  const chosen = options.find((o) => o.value === value)
  const rate = chosen ? annualizedRateFromCumulative(chosen.perf_5y, 5) : defaultRate

  return (
    <div className="mb-3">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-700 bg-app px-2 py-1.5 text-xs text-slate-400"
      >
        <option value="">{categoryLabel} - moyenne historique ({formatPercent(defaultRate)}/an)</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {chosen && (
        <p className="mt-1 text-[11px] text-accent">
          → {formatPercent(rate)}/an, basé sur la performance historique 5 ans de {chosen.label}
        </p>
      )}
    </div>
  )
}

function AllocationSlider({ label, value, onChange }) {
  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs">
        <span className="text-slate-400">{label}</span>
        <span className="text-slate-300">{value} %</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-accent"
      />
    </div>
  )
}
