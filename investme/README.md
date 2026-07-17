# InvestMe

InvestMe est un assistant personnel d'aide à la décision d'investissement,
pensé pour un débutant qui investit sur le long terme (5+ ans) dans un mix
d'ETF, d'actions et de crypto. C'est une PWA (Progressive Web App) : pas de
compte, pas de backend, toutes tes données restent dans ton navigateur.

> ⚠️ InvestMe est un outil personnel d'aide à la décision. Il ne constitue
> pas un conseil en investissement au sens de la réglementation AMF. Voir
> la section [Avertissement légal](#avertissement-légal) en bas de page.

## Installation en 5 étapes

1. **Installe les dépendances**
   ```bash
   npm install
   ```
2. **Configure ta clé API (optionnel)** — copie le fichier d'exemple :
   ```bash
   cp .env.example .env
   ```
   puis ouvre `.env` et colle ta clé Claude après le `=` (voir la section
   suivante pour l'obtenir). Sans clé, tout le reste de l'app fonctionne
   normalement — seuls les boutons "Analyse IA" seront désactivés, avec un
   message d'avertissement dans la console du navigateur.
3. **Lance l'app en développement**
   ```bash
   npm run dev
   ```
4. **Ouvre l'app** — le terminal affiche une adresse du type
   `http://localhost:5173`, ouvre-la dans ton navigateur.
5. **(Optionnel) Génère une version de production**
   ```bash
   npm run build && npm run preview
   ```

## Obtenir une clé API Claude

Les fonctionnalités d'IA (analyse d'ETF, insights du journal, contexte
marché du DCA) appellent l'API Claude d'Anthropic. Anthropic offre
généralement quelques dollars de crédits gratuits à l'inscription.

1. Va sur **https://console.anthropic.com/**
2. Crée un compte (ou connecte-toi si tu en as déjà un)
3. Dans le menu de gauche, clique sur **"API Keys"**
4. Clique sur **"Create Key"**, donne-lui un nom (ex: "InvestMe")
5. Copie la clé générée (elle ne sera plus jamais affichée en entier)
6. Colle-la dans ton fichier `.env` :
   ```
   VITE_ANTHROPIC_KEY=sk-ant-xxxxxxxxxxxxxxxx
   ```
7. Redémarre `npm run dev` pour que la nouvelle variable soit prise en compte

> Note pédagogique : InvestMe appelle l'API Claude **directement depuis le
> navigateur** (pas de serveur backend). C'est pratique pour un projet
> personnel, mais ça veut dire que ta clé API circule dans les requêtes
> réseau que fait ton propre navigateur. Ne partage jamais ton fichier
> `.env`, et ne déploie pas ce projet tel quel pour d'autres utilisateurs
> que toi (dans ce cas, il faudrait un vrai backend qui garde la clé
> secrète).

## Installer InvestMe comme application (PWA)

Un bandeau "Installer InvestMe" apparaît automatiquement 30 secondes après
l'ouverture de l'app sur mobile. Tu peux aussi installer manuellement :

**Sur iPhone (Safari)**
1. Ouvre InvestMe dans Safari
2. Appuie sur l'icône **Partager** (le carré avec une flèche vers le haut)
3. Fais défiler et appuie sur **"Sur l'écran d'accueil"**
4. Appuie sur **"Ajouter"**

**Sur Android (Chrome)**
1. Ouvre InvestMe dans Chrome
2. Appuie sur le menu **⋮** en haut à droite
3. Appuie sur **"Installer l'application"** (ou utilise le bandeau qui
   apparaît automatiquement)
4. Confirme l'installation

Une fois installée, InvestMe s'ouvre en plein écran comme une vraie
application, et le service worker garde en cache les dernières données
consultées pour un fonctionnement hors-ligne partiel.

## Utiliser chaque module

### 👤 Mon Profil
Au premier lancement, réponds à 5 questions (épargne de précaution,
capacité d'épargne mensuelle, réaction face à une baisse de 30 %, objectif,
horizon en années). Exemple : 3000 € d'épargne, 150 €/mois, "j'en rachète",
"Retraite", 10 ans → profil **"Dynamique"** avec une répartition
50 % ETF / 30 % Actions / 20 % Crypto. Le bouton "Modifier mon profil"
permet de refaire le questionnaire.

### 📊 Simulateur
Règle le montant de départ, le versement mensuel, la durée et la
répartition ETF/Actions/Crypto (doit totaliser 100 %). Exemple : 500 € de
départ + 150 €/mois pendant 10 ans avec la répartition par défaut affiche
3 scénarios (pessimiste/réaliste/optimiste) et un graphique d'évolution.

### 🔍 Comparateur ETF
Parcours 10 ETF pré-enregistrés (PEA et CTO). Filtre par "PEA uniquement",
trie par frais/performance/encours, ou filtre par courtier (Trade
Republic, XTB, Fortuneo). Appuie sur une carte pour voir le détail et
l'ajouter à ta watchlist. Le mode "Comparer" permet de sélectionner
jusqu'à 3 ETF pour un tableau côte à côte. Le bouton "Analyse IA" (clé API
requise) résume l'ETF en langage simple.

### 📓 Journal
Enregistre chaque achat/vente avec la raison et ton émotion du moment
(ex: "Achat CW8, 5 unités à 45 €, raison: DCA mensuel, émotion: 😐
Neutre"). Le portefeuille agrégé, un graphique de répartition et un export
CSV (pour ta déclaration d'impôts) sont générés automatiquement. Le bouton
"Analyse mon journal" (clé API requise) détecte des biais de comportement.

### 🔔 DCA
Programme un montant mensuel par actif (ex: 100 € de CW8 le 5 du mois via
Trade Republic). Le tableau de bord affiche le compte à rebours avant le
prochain versement, permet de marquer un versement comme fait, et affiche
un historique en graphique. Le jour prévu d'un versement, une carte
"Contexte marché" (clé API requise) propose un résumé neutre du marché.

## Avertissement légal

InvestMe est un outil personnel d'aide à la décision, développé à des fins
éducatives. Il ne constitue **pas** un conseil en investissement au sens
de la réglementation AMF (Autorité des Marchés Financiers). Toutes les
projections du simulateur reposent sur des rendements **hypothétiques** :
les performances passées ne garantissent jamais les performances futures.
Les données ETF sont mises à jour manuellement et peuvent être obsolètes -
vérifie toujours les informations officielles (DIC/KIID, factsheet) avant
toute décision. Les analyses générées par IA sont informatives et peuvent
contenir des erreurs. Investir comporte un risque de perte en capital.
