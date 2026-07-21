// Lets the user say "tell me if Bitcoin goes above/below X €" and fires
// a browser notification the moment the live price (from
// useLiveCryptoPrices) crosses that threshold. Persisted in localStorage
// so alerts survive a reload; each alert fires once, then stays marked
// as "triggered" until removed or re-armed.
import { useEffect } from 'react'
import { useLocalStorage } from './useLocalStorage'

export function usePriceAlerts(prices) {
  const [alerts, setAlerts] = useLocalStorage('investme_price_alerts', [])

  useEffect(() => {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return

    let changed = false
    const updated = alerts.map((alert) => {
      if (alert.triggered) return alert
      const current = prices[alert.coingeckoId]?.eur
      if (typeof current !== 'number') return alert

      const crossed = alert.direction === 'above' ? current >= alert.targetPrice : current <= alert.targetPrice
      if (!crossed) return alert

      new Notification('InvestMe - Alerte de prix', {
        body: `${alert.assetName} a ${alert.direction === 'above' ? 'dépassé' : 'chuté sous'} ${alert.targetPrice} €`,
        icon: '/icons/icon-192.png',
      })
      changed = true
      return { ...alert, triggered: true }
    })

    if (changed) setAlerts(updated)
    // Only re-check when the live prices actually change - not on every
    // render, and not when the alerts list itself changes (avoids a loop).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prices])

  function addAlert(coingeckoId, assetName, direction, targetPrice) {
    setAlerts([...alerts, { id: crypto.randomUUID(), coingeckoId, assetName, direction, targetPrice, triggered: false }])
  }

  function removeAlert(id) {
    setAlerts(alerts.filter((a) => a.id !== id))
  }

  return { alerts, addAlert, removeAlert }
}
