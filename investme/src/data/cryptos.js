// Hardcoded crypto database - same principle as data/etfs.js: a static
// list you update by hand, not live market data. Crypto performance is
// extremely volatile, these figures are illustrative examples only.
export const CRYPTOS_LAST_UPDATED = '2026-06-01'

export const CRYPTOS = [
  {
    name: 'Bitcoin',
    ticker: 'BTC',
    categorie: 'Réserve de valeur',
    perf_1y: 0.45,
    perf_3y: 0.6,
    perf_5y: 3.5,
    volatilite: 'Élevée',
    courtiers: ['Trade Republic', 'XTB', 'Revolut'],
  },
  {
    name: 'Ethereum',
    ticker: 'ETH',
    categorie: 'Plateforme smart contracts',
    perf_1y: 0.3,
    perf_3y: 0.4,
    perf_5y: 2.8,
    volatilite: 'Élevée',
    courtiers: ['Trade Republic', 'XTB', 'Revolut'],
  },
  {
    name: 'Solana',
    ticker: 'SOL',
    categorie: 'Plateforme smart contracts',
    perf_1y: 0.6,
    perf_3y: 0.9,
    perf_5y: 5.0,
    volatilite: 'Très élevée',
    courtiers: ['XTB', 'Revolut'],
  },
  {
    name: 'XRP',
    ticker: 'XRP',
    categorie: 'Paiements',
    perf_1y: 0.25,
    perf_3y: -0.1,
    perf_5y: 0.8,
    volatilite: 'Élevée',
    courtiers: ['XTB', 'Revolut'],
  },
  {
    name: 'Cardano',
    ticker: 'ADA',
    categorie: 'Plateforme smart contracts',
    perf_1y: 0.1,
    perf_3y: -0.3,
    perf_5y: 0.5,
    volatilite: 'Très élevée',
    courtiers: ['XTB', 'Revolut'],
  },
  {
    name: 'Litecoin',
    ticker: 'LTC',
    categorie: 'Paiements',
    perf_1y: 0.05,
    perf_3y: -0.2,
    perf_5y: 0.3,
    volatilite: 'Élevée',
    courtiers: ['Revolut'],
  },
]
