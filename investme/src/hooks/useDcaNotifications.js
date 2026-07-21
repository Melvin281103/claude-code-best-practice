// Fires a browser notification for any DCA plan due TODAY, once per day,
// the moment the app is opened. This only works while InvestMe is
// actually loaded in a tab/installed app - there is no backend to send
// a push while the app is closed, so it's a reminder-on-open, not a
// true background alert.
import { useEffect } from 'react'

const LAST_NOTIFIED_KEY = 'investme_dca_last_notified'

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function useDcaNotifications() {
  useEffect(() => {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return

    const todayISO = new Date().toISOString().slice(0, 10)
    if (localStorage.getItem(LAST_NOTIFIED_KEY) === todayISO) return // already notified today

    const plans = readJson('investme_dca_plans', [])
    const log = readJson('investme_dca_log', [])
    const today = new Date()
    const monthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`

    const duePlans = plans.filter(
      (plan) =>
        Number(plan.day) === today.getDate() &&
        !log.some((entry) => entry.planId === plan.id && entry.month === monthKey)
    )

    if (duePlans.length === 0) return

    for (const plan of duePlans) {
      new Notification('InvestMe - DCA du jour', {
        body: `N'oublie pas : ${plan.asset} - ${plan.amount} € via ${plan.courtier}`,
        icon: '/icons/icon-192.png',
      })
    }
    localStorage.setItem(LAST_NOTIFIED_KEY, todayISO)
  }, [])
}
