// Form to log one trade (buy or sell) into the Journal. The amount is
// auto-calculated from quantity x price, and the "why" question is
// required on purpose - it forces a moment of reflection before logging.
import { useState } from 'react'
import { ETFS } from '../data/etfs'
import { ACTIONS } from '../data/actions'
import { CRYPTOS } from '../data/cryptos'
import { useLiveCryptoPrices } from '../hooks/useLiveCryptoPrices.js'
import { todayISO, formatCurrencyPrecise } from '../utils/formatters'

// Datalist suggestions show "TICKER - Name" - this turns that (or a plain
// name/ticker typed by hand) back into the matching crypto entry, so we
// know which live price to use.
function findMatchedCrypto(name) {
  const raw = name.split(' - ')[0].trim().toLowerCase()
  const full = name.trim().toLowerCase()
  return CRYPTOS.find((c) => c.ticker.toLowerCase() === raw || c.name.toLowerCase() === raw || c.name.toLowerCase() === full)
}

export const EMOTIONS = [
  { value: 'peur', emoji: '😨', label: 'Peur' },
  { value: 'neutre', emoji: '😐', label: 'Neutre' },
  { value: 'confiant', emoji: '😊', label: 'Confiant' },
  { value: 'euphorique', emoji: '🤑', label: 'Euphorique' },
]

const EMPTY_TRADE = {
  type: 'Achat',
  assetClass: 'ETF',
  name: '',
  date: todayISO(),
  quantity: '',
  unitPrice: '',
  reason: '',
  emotion: 'neutre',
}

export default function TradeForm({ onAdd, onCancel }) {
  const [trade, setTrade] = useState(EMPTY_TRADE)
  const [investAmount, setInvestAmount] = useState('')
  const { prices: livePrices } = useLiveCryptoPrices()

  const quantity = Number(trade.quantity) || 0
  const unitPrice = Number(trade.unitPrice) || 0
  const totalAmount = quantity * unitPrice
  const canSubmit = trade.name.trim() !== '' && quantity > 0 && unitPrice > 0 && trade.reason.trim() !== ''

  const matchedCrypto = trade.assetClass === 'Crypto' ? findMatchedCrypto(trade.name) : null
  const liveCryptoPrice = matchedCrypto ? livePrices[matchedCrypto.coingeckoId]?.eur : null
  const investAmountNum = Number(investAmount) || 0
  const impliedQuantity = liveCryptoPrice && investAmountNum > 0 ? investAmountNum / liveCryptoPrice : null

  function useLivePriceAmount() {
    if (!liveCryptoPrice || !impliedQuantity) return
    setTrade({ ...trade, quantity: impliedQuantity.toFixed(8), unitPrice: liveCryptoPrice.toFixed(2) })
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return
    onAdd({
      id: crypto.randomUUID(),
      ...trade,
      quantity,
      unitPrice,
      totalAmount,
    })
    setTrade(EMPTY_TRADE)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl bg-card p-4">
      <div className="flex gap-2">
        {['Achat', 'Vente'].map((type) => (
          <button
            type="button"
            key={type}
            onClick={() => setTrade({ ...trade, type })}
            className={`flex-1 rounded-lg py-2 text-sm font-medium ${
              trade.type === type ? 'bg-accent text-white' : 'bg-slate-700/50 text-slate-300'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      <Field label="Classe d'actif">
        <select
          value={trade.assetClass}
          onChange={(e) => setTrade({ ...trade, assetClass: e.target.value })}
          className="w-full rounded-lg border border-slate-700 bg-app px-3 py-2 text-white"
        >
          <option value="ETF">ETF</option>
          <option value="Action">Action</option>
          <option value="Crypto">Crypto</option>
        </select>
      </Field>

      <Field label="Nom / Ticker">
        <input
          type="text"
          list="etf-suggestions"
          value={trade.name}
          onChange={(e) => setTrade({ ...trade, name: e.target.value })}
          placeholder="ex: CW8, Bitcoin, Apple..."
          className="w-full rounded-lg border border-slate-700 bg-app px-3 py-2 text-white"
        />
        <datalist id="etf-suggestions">
          {ETFS.map((etf) => (
            <option key={etf.isin} value={`${etf.ticker} - ${etf.name}`} />
          ))}
          {ACTIONS.map((a) => (
            <option key={a.ticker} value={`${a.ticker} - ${a.name}`} />
          ))}
          {CRYPTOS.map((c) => (
            <option key={c.ticker} value={`${c.ticker} - ${c.name}`} />
          ))}
        </datalist>
      </Field>

      {/* Crypto-only helper: type how much money you want to put in, and
          this fills in the quantity/price for you from the live price -
          much more natural than knowing your exact BTC quantity by heart. */}
      {trade.assetClass === 'Crypto' && matchedCrypto && (
        <div className="rounded-lg border border-accent/30 bg-app px-3 py-2">
          {liveCryptoPrice ? (
            <>
              <p className="text-xs text-slate-400">
                Prix actuel de {matchedCrypto.name} : <span className="text-white">{formatCurrencyPrecise(liveCryptoPrice)}</span>
              </p>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={investAmount}
                  onChange={(e) => setInvestAmount(e.target.value)}
                  placeholder="Montant à investir (€)"
                  className="w-full rounded-lg border border-slate-700 bg-card px-3 py-2 text-white"
                />
                <button
                  type="button"
                  onClick={useLivePriceAmount}
                  disabled={!impliedQuantity}
                  className="shrink-0 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white disabled:opacity-40"
                >
                  Utiliser
                </button>
              </div>
              {impliedQuantity && (
                <p className="mt-1 text-xs text-slate-500">≈ {impliedQuantity.toFixed(8)} {matchedCrypto.ticker}</p>
              )}
            </>
          ) : (
            <p className="text-xs text-slate-500">
              Prix en direct indisponible pour {matchedCrypto.name} - entre la quantité et le prix manuellement ci-dessous.
            </p>
          )}
        </div>
      )}

      <Field label="Date">
        <input
          type="date"
          value={trade.date}
          onChange={(e) => setTrade({ ...trade, date: e.target.value })}
          className="w-full rounded-lg border border-slate-700 bg-app px-3 py-2 text-white"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Quantité">
          <input
            type="number"
            min="0"
            step="any"
            value={trade.quantity}
            onChange={(e) => setTrade({ ...trade, quantity: e.target.value })}
            className="w-full rounded-lg border border-slate-700 bg-app px-3 py-2 text-white"
          />
        </Field>
        <Field label="Prix unitaire (€)">
          <input
            type="number"
            min="0"
            step="any"
            value={trade.unitPrice}
            onChange={(e) => setTrade({ ...trade, unitPrice: e.target.value })}
            className="w-full rounded-lg border border-slate-700 bg-app px-3 py-2 text-white"
          />
        </Field>
      </div>

      <div className="rounded-lg bg-app px-3 py-2 text-sm text-slate-400">
        Montant total : <span className="font-medium text-white">{totalAmount.toFixed(2)} €</span>
      </div>

      <Field label="Pourquoi j'achète">
        <textarea
          value={trade.reason}
          onChange={(e) => setTrade({ ...trade, reason: e.target.value })}
          rows={3}
          placeholder="Ta raison, pour te relire plus tard..."
          className="w-full rounded-lg border border-slate-700 bg-app px-3 py-2 text-white"
        />
      </Field>

      <div>
        <p className="mb-2 text-sm text-slate-400">Émotion au moment de l'achat</p>
        <div className="flex gap-2">
          {EMOTIONS.map((e) => (
            <button
              type="button"
              key={e.value}
              onClick={() => setTrade({ ...trade, emotion: e.value })}
              className={`flex-1 rounded-lg py-2 text-center text-xl ${
                trade.emotion === e.value ? 'bg-accent/20 ring-2 ring-accent' : 'bg-slate-700/50'
              }`}
              title={e.label}
            >
              {e.emoji}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 rounded-lg border border-slate-700 py-2 text-slate-300">
          Annuler
        </button>
        <button type="submit" disabled={!canSubmit} className="flex-1 rounded-lg bg-accent py-2 font-medium text-white disabled:opacity-40">
          Enregistrer
        </button>
      </div>
    </form>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <p className="mb-1 text-sm text-slate-400">{label}</p>
      {children}
    </div>
  )
}
