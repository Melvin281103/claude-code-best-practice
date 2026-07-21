// Export/Import all of InvestMe's data as one JSON file.
// Everything lives only in this browser's localStorage - no account, no
// server - so if the user clears their browser data, switches devices,
// or reinstalls, this is the only way to keep their profile, trades,
// DCA plans and watchlist. Generic on purpose: it copies every
// "investme_"-prefixed key without needing to know each feature's exact
// key name, so new features stay covered automatically.
import { useState } from 'react'

const KEY_PREFIX = 'investme_'

function collectBackupData() {
  const data = {}
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key.startsWith(KEY_PREFIX)) {
      data[key] = localStorage.getItem(key)
    }
  }
  return data
}

export default function DataBackup() {
  const [importError, setImportError] = useState(null)
  const [importedOk, setImportedOk] = useState(false)

  function handleExport() {
    const data = collectBackupData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `investme-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  function handleImport(event) {
    const file = event.target.files?.[0]
    if (!file) return
    setImportError(null)
    setImportedOk(false)

    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result)
        const keys = Object.keys(data).filter((key) => key.startsWith(KEY_PREFIX))
        if (keys.length === 0) {
          throw new Error("Ce fichier ne contient aucune donnée InvestMe reconnue.")
        }
        for (const key of keys) {
          localStorage.setItem(key, data[key])
        }
        setImportedOk(true)
        // Every page reads its data from localStorage only once, on
        // mount (via useLocalStorage) - reloading is the simplest way
        // to make sure every screen picks up the restored data.
        setTimeout(() => window.location.reload(), 800)
      } catch (err) {
        setImportError('Fichier invalide ou corrompu. Vérifie que tu as bien sélectionné une sauvegarde InvestMe.')
      }
    }
    reader.readAsText(file)
    event.target.value = '' // allow re-selecting the same file later
  }

  return (
    <div className="topo-texture rounded-xl bg-card p-4">
      <p className="text-sm font-medium text-papier">💾 Sauvegarde de tes données</p>
      <p className="mt-1 text-xs text-brume">
        Tout est stocké uniquement dans ce navigateur. Exporte régulièrement un fichier de secours pour ne rien
        perdre si tu changes d'appareil ou vides ton cache.
      </p>

      <div className="mt-3 flex gap-2">
        <button onClick={handleExport} className="flex-1 rounded-lg border border-accent py-2 text-sm font-medium text-accent">
          Exporter mes données
        </button>
        <label className="flex-1 cursor-pointer rounded-lg border border-brume/30 py-2 text-center text-sm font-medium text-brume">
          Importer
          <input type="file" accept="application/json" onChange={handleImport} className="hidden" />
        </label>
      </div>

      {importError && <p className="mt-2 text-xs text-grenat">{importError}</p>}
      {importedOk && <p className="mt-2 text-xs text-sentier">Import réussi, rechargement en cours...</p>}
    </div>
  )
}
