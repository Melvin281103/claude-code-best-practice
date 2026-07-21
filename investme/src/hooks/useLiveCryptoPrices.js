// Fetches REAL, live crypto prices from CoinGecko's free public API -
// no API key needed (unlike the Claude features), so this works for
// everyone out of the box. Fetches once on load, then again every hour,
// for as long as the Comparateur's Crypto tab stays mounted.
import { useCallback, useEffect, useState } from 'react'
import { CRYPTOS } from '../data/cryptos'

const REFRESH_INTERVAL_MS = 60 * 60 * 1000 // 1 hour
const COINGECKO_IDS = CRYPTOS.map((c) => c.coingeckoId).join(',')
const API_URL = `https://api.coingecko.com/api/v3/simple/price?ids=${COINGECKO_IDS}&vs_currencies=eur&include_24hr_change=true`

export function useLiveCryptoPrices() {
  // Keyed by coingeckoId: { bitcoin: { eur: 42350, eur_24h_change: 1.2 }, ... }
  const [prices, setPrices] = useState({})
  const [lastUpdated, setLastUpdated] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchPrices = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(API_URL)
      if (!response.ok) {
        throw new Error(`CoinGecko a répondu avec le statut ${response.status}`)
      }
      const data = await response.json()
      setPrices(data)
      setLastUpdated(new Date())
    } catch (err) {
      console.warn('InvestMe: impossible de récupérer les prix crypto en direct', err)
      setError("Prix en direct indisponibles pour l'instant - les données historiques restent affichées.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPrices()
    const intervalId = setInterval(fetchPrices, REFRESH_INTERVAL_MS)
    return () => clearInterval(intervalId)
  }, [fetchPrices])

  return { prices, lastUpdated, loading, error, refetch: fetchPrices }
}
