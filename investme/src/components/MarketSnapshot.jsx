// "Marché — cotations" - the dense quotes table borrowed from the
// "Instrument de rando" design direction, adapted honestly: InvestMe only
// has a LIVE price feed for crypto (via CoinGecko). ETF/action rows show
// their historical 1-year performance instead of a fabricated live price,
// so nothing here claims to be real-time when it isn't.
import { useLiveCryptoPrices } from '../hooks/useLiveCryptoPrices.js'
import { ETFS } from '../data/etfs'
import { ACTIONS } from '../data/actions'
import { CRYPTOS } from '../data/cryptos'
import { formatCurrencyPrecise, formatPercent } from '../utils/formatters'

// The same 3 representative picks shown in the design mockup (CW8 = "ETF
// Monde", LVMH, Bitcoin) - a fixed, small sample, not the full database.
const SAMPLE_ETF = ETFS.find((e) => e.ticker === 'CW8')
const SAMPLE_ACTION = ACTIONS.find((a) => a.ticker === 'MC')
const SAMPLE_CRYPTO = CRYPTOS.find((c) => c.ticker === 'BTC')

export default function MarketSnapshot() {
  const { prices } = useLiveCryptoPrices()
  const liveBtc = SAMPLE_CRYPTO ? prices[SAMPLE_CRYPTO.coingeckoId] : null

  return (
    <div className="rounded-xl border border-app/8 bg-creme p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ardoise">Marché — un aperçu</p>
      <div className="divide-y divide-app/8">
        {SAMPLE_ETF && <QuoteRow name={SAMPLE_ETF.name} tag="ETF" perf1y={SAMPLE_ETF.perf_1y} />}
        {SAMPLE_ACTION && <QuoteRow name={SAMPLE_ACTION.name} tag="Action" perf1y={SAMPLE_ACTION.perf_1y} />}
        {SAMPLE_CRYPTO && (
          <QuoteRow
            name={SAMPLE_CRYPTO.name}
            tag="Crypto"
            livePrice={liveBtc?.eur}
            liveChange={liveBtc?.eur_24h_change}
            perf1y={SAMPLE_CRYPTO.perf_1y}
          />
        )}
      </div>
    </div>
  )
}

function QuoteRow({ name, tag, livePrice, liveChange, perf1y }) {
  const hasLive = typeof livePrice === 'number'

  return (
    <div className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
      <div>
        <p className="text-sm font-medium text-app">{name}</p>
        <p className="text-[11px] text-ardoise">{tag}</p>
      </div>
      {hasLive ? (
        <div className="text-right">
          <p className="text-sm font-medium text-app">{formatCurrencyPrecise(livePrice)}</p>
          {typeof liveChange === 'number' && (
            <p className={`text-xs ${liveChange >= 0 ? 'text-mousse' : 'text-grenat'}`}>
              {liveChange >= 0 ? '+' : ''}
              {liveChange.toFixed(1)} % (24h)
            </p>
          )}
        </div>
      ) : (
        <p className={`text-sm ${perf1y >= 0 ? 'text-mousse' : 'text-grenat'}`}>
          {formatPercent(perf1y)} <span className="text-ardoise">(1 an)</span>
        </p>
      )}
    </div>
  )
}
