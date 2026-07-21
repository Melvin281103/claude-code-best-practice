// Fetches a crypto's daily price history from CoinGecko's free public API
// (same "no key needed" endpoint family as useLiveCryptoPrices.js), but
// only ON DEMAND for one asset at a time - unlike the always-on live
// price poll, firing this for all 6 cryptos on every Comparateur visit
// would burn through the free tier's rate limit for no reason.
import { useEffect, useState } from 'react'

const HISTORY_DAYS = 30

export function useCryptoPriceHistory(coingeckoId, enabled) {
  const [history, setHistory] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Already fetched once for this asset, or not requested yet - do
    // nothing. Re-opening the chart after closing it reuses the cached
    // result instead of re-fetching.
    if (!enabled || !coingeckoId || history) return

    let cancelled = false
    setLoading(true)
    setError(null)

    fetch(`https://api.coingecko.com/api/v3/coins/${coingeckoId}/market_chart?vs_currency=eur&days=${HISTORY_DAYS}`)
      .then((response) => {
        if (!response.ok) throw new Error(`CoinGecko a répondu avec le statut ${response.status}`)
        return response.json()
      })
      .then((data) => {
        if (cancelled) return
        setHistory(data.prices.map(([timestamp, price]) => ({ date: timestamp, price })))
      })
      .catch((err) => {
        if (cancelled) return
        console.warn("InvestMe: impossible de récupérer l'historique de prix crypto", err)
        setError("Historique indisponible pour l'instant.")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [coingeckoId, enabled, history])

  return { history, loading, error }
}
