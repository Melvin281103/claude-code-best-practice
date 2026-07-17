// "Add to Home Screen" banner. Shows up 30 seconds after the app opens,
// so it doesn't interrupt the user immediately - only once they've had
// a moment to look around.
//
// Android/Chrome fires a "beforeinstallprompt" event we can hook into to
// trigger the native install popup. iOS Safari has no such event, so we
// show manual instructions instead (Share -> "Sur l'écran d'accueil").
import { useEffect, useState } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'

const SHOW_AFTER_MS = 30000

function isRunningStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
  )
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent)
}

export default function InstallBanner() {
  const [dismissed, setDismissed] = useLocalStorage('investme_install_dismissed', false)
  const [visible, setVisible] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState(null)

  // Capture the browser's install prompt so we can trigger it later,
  // on our own schedule, instead of letting Chrome show it immediately.
  useEffect(() => {
    function handleBeforeInstallPrompt(event) {
      event.preventDefault()
      setDeferredPrompt(event)
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  }, [])

  // Wait 30 seconds, then reveal the banner (unless already installed/dismissed).
  useEffect(() => {
    if (dismissed || isRunningStandalone()) return
    const timer = setTimeout(() => setVisible(true), SHOW_AFTER_MS)
    return () => clearTimeout(timer)
  }, [dismissed])

  if (!visible || dismissed) return null

  async function handleInstallClick() {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      await deferredPrompt.userChoice
      setDeferredPrompt(null)
    }
    setDismissed(true)
  }

  return (
    <div className="fixed bottom-16 left-0 right-0 z-30 mx-3 rounded-lg border border-accent/40 bg-card px-4 py-3 shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div className="text-sm">
          <p className="font-semibold text-slate-100">Installer InvestMe</p>
          {isIOS() ? (
            <p className="mt-1 text-slate-400">
              Appuie sur <span className="font-medium">Partager</span> puis{' '}
              <span className="font-medium">"Sur l'écran d'accueil"</span> pour un accès rapide.
            </p>
          ) : (
            <p className="mt-1 text-slate-400">
              Ajoute InvestMe à ton écran d'accueil pour y accéder comme une vraie appli.
            </p>
          )}
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-slate-500 hover:text-slate-300"
          aria-label="Fermer"
        >
          ✕
        </button>
      </div>
      {!isIOS() && (
        <button
          onClick={handleInstallClick}
          className="mt-3 w-full rounded-md bg-accent py-2 text-sm font-medium text-white"
        >
          Installer
        </button>
      )}
    </div>
  )
}
