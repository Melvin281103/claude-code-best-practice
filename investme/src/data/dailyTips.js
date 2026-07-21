// Pool of hand-written tips for the Profil page's "Conseil du jour" card.
// A different one is picked automatically each day (see getTipOfTheDay in
// utils/calculations.js) so the recommendation feels alive over time,
// without ever calling any API - this list works even with zero setup.
export const DAILY_TIPS = [
  {
    category: 'ETF',
    text: "Un seul ETF World suffit pour démarrer : il couvre déjà plus de 1500 entreprises dans 23 pays développés.",
  },
  {
    category: 'Diversification',
    text: "Vérifie que ta poche crypto ne dépasse pas la part recommandée pour ton profil - c'est la classe la plus volatile.",
  },
  {
    category: 'Discipline',
    text: "Le DCA (investissement programmé) fonctionne surtout parce qu'il t'évite d'essayer de deviner le bon moment.",
  },
  {
    category: 'Fiscalité',
    text: "En France, le PEA devient plus avantageux fiscalement après 5 ans de détention - pense au temps, pas qu'au rendement.",
  },
  {
    category: 'Administratif',
    text: "Avant d'investir plus, vérifie que ton épargne de précaution (3-6 mois de dépenses) est toujours complète.",
  },
  {
    category: 'Actions',
    text: "Une action individuelle peut faire faillite ; un ETF World, non - c'est pour ça qu'on les traite différemment dans un portefeuille.",
  },
  {
    category: 'Discipline',
    text: "Relis tes raisons d'achat dans le Journal de temps en temps : c'est le meilleur moyen de repérer tes propres biais.",
  },
  {
    category: 'Diversification',
    text: "Deux ETF qui suivent tous les deux le S&P 500 ne diversifient pas ton portefeuille - regarde l'indice sous-jacent, pas juste le nom.",
  },
  {
    category: 'Crypto',
    text: "La crypto est expérimentale et volatile : la plupart des investisseurs long terme la limitent à une petite part satellite du portefeuille.",
  },
  {
    category: 'Frais',
    text: "Un TER de 0,5 % au lieu de 0,1 % peut représenter des milliers d'euros en moins sur 20 ans - compare toujours les frais avant de choisir un ETF.",
  },
  {
    category: 'Discipline',
    text: "Une baisse de marché n'efface pas tes gains tant que tu ne vends pas - le papier ne devient réel qu'à la revente.",
  },
  {
    category: 'Administratif',
    text: "Vérifie de temps en temps que ton courtier propose toujours les ETF de ta watchlist aux meilleures conditions.",
  },
  {
    category: 'Éducation',
    text: "Le rendement composé a besoin de temps pour vraiment agir : les premières années semblent souvent lentes, c'est normal.",
  },
  {
    category: 'Diversification',
    text: "Réponds honnêtement : si ta répartition actuelle s'éloigne de ta cible, c'est peut-être le moment d'orienter tes prochains versements différemment.",
  },
]
