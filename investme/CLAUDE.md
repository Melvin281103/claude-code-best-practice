# CLAUDE.md — InvestMe

Ce fichier guide Claude Code lors du travail dans `investme/`. Il se charge
automatiquement dès qu'une session touche un fichier de ce dossier, en plus
du CLAUDE.md racine du repo.

## Vue d'ensemble

InvestMe est une PWA (Progressive Web App) d'aide à la décision
d'investissement pour un débutant, sans backend : toutes les données
vivent dans le `localStorage` du navigateur. PR de développement : #1 sur
`Melvin281103/claude-code-best-practice`, branche
`claude/investme-pwa-build-46yseg`, toujours ouverte.

## Stack

Vite + React 18, Tailwind CSS via CDN (**pas de build step Tailwind**),
Recharts pour les graphiques, React Router pour la navigation, aucune
dépendance backend. Fonctionnalités IA via appel direct à l'API Claude
depuis le navigateur (`src/hooks/useClaudeAPI.js`), clé dans
`.env` (`VITE_ANTHROPIC_KEY`).

## Identité visuelle — "Le Sentier d'Investissement"

Thème sombre uniquement (actuellement actif) :

| Nom | Hex | Usage |
|---|---|---|
| Nuit de Sapin | `#10201A` | fond |
| Écorce | `#1B2E24` | cartes |
| Sentier | `#4C9A6A` | vert accent principal |
| Glacier | `#3E7CA6` | bleu, profil Équilibré |
| Grenat | `#8C3B4A` | bordeaux, profil Dynamique / pertes |
| Ambre | `#D99A3E` | échéances / alertes |
| Papier | `#F2EDE3` | texte |
| Brume | `#8FA396` | texte secondaire |

- Polices : Fraunces (titres/chiffres clés) + Work Sans (texte courant),
  via Google Fonts CDN
- Badge de profil de risque façon difficulté de piste : cercle vert
  (Prudent) / carré bleu (Équilibré) / losange grenat (Dynamique) —
  composant `RiskBadge.jsx`
- Texture topo (lignes de niveau, 4% opacité) sur les cartes — classe CSS
  `.topo-texture`
- Layout "sentier" sur Profil : ligne pointillée verticale + points
  "waypoint" reliant les cartes de recommandation (`TrailPath`/`Waypoint`
  dans `Profil.jsx`)
- Feuille de style d'impression (`@media print`) : bouton
  "🖨️ Exporter / imprimer" sur Profil → `window.print()`, rendu
  clair/papier, nav et boutons interactifs masqués via `print:hidden`

**IMPORTANT** : une variante thème clair "Carte de jour" (fond parchemin) a
été construite puis explicitement **annulée par `git revert`** à la
demande de l'utilisateur ("j'aime pas, je veux revenir à la version
d'avant"). Ne pas la reproposer sans qu'il le redemande explicitement.

## Les 5 modules

1. **Mon Profil** (`Profil.jsx`) — questionnaire d'onboarding 5 questions
   → profil Prudent/Équilibré/Dynamique + répartition ETF/Actions/Crypto.
   Confirmation avant reset. Tableau de bord (valeur + P&L + prochain
   DCA), calculateur de répartition en €, barre de progression
   d'objectif, conseil du jour, sauvegarde/export JSON, export PDF.
2. **Simulateur** (`Simulateur.jsx`) — projections
   pessimiste/réaliste/optimiste, pré-rempli depuis le profil, peut tester
   un ETF/action/crypto précis, historique des 4 dernières simulations.
3. **Comparateur** (`ComparateurETF.jsx`) — 3 onglets ETF (10)/Actions
   (8)/Crypto (6, prix en direct CoinGecko, actualisé toutes les heures,
   alertes de seuil). Watchlist unifiée avec filtre. Glossaire intégré.
   Projection hypothétique par actif précis (non prédictive).
4. **Journal** (`Journal.jsx`) — trades achat/vente avec émotion+raison,
   export CSV, analyse IA, vérification allocation réelle vs recommandée.
   Crypto : saisie en € convertie en quantité au prix réel en direct.
5. **DCA** (`DCA.jsx`) — plan d'investissement programmé, historique,
   contexte marché IA, rappels de DCA (notification navigateur),
   rappel de rééquilibrage tous les 3 mois (`useRebalanceReminder.js`,
   indépendant des trades).

## Contrainte légale (non-négociable)

Jamais de conseil d'achat/vente explicite. Tout est présenté comme
"hypothétique"/informatif. Disclaimer AMF partout (footer de chaque page +
`Disclaimer.jsx` sur Simulateur/Journal/DCA). Les projections par actif
précis sont des extrapolations du passé, jamais des prédictions.

## Limites connues (architecture délibérément simple)

Ces choix sont adaptés à un usage **personnel mono-utilisateur** — à
revoir si la finalité change un jour (partage, déploiement public,
multi-appareils) :

- **Pas de sauvegarde automatique** — tout vit dans le `localStorage` de
  ce navigateur précis. Vider le cache, changer de navigateur ou de
  machine efface tout sans avertissement. `DataBackup.jsx` (export/import
  JSON) est la seule protection, mais c'est une action manuelle.
- **Tailwind via CDN, pas de build** — pratique pour un projet perso,
  mais pas de purge du CSS inutilisé et dépendance à un script externe
  qui doit se charger à chaque visite (sans lui, l'app s'affiche sans
  style).
- **Clé API exposée côté navigateur** — `VITE_ANTHROPIC_KEY` est visible
  dans les requêtes réseau du navigateur (inspectable via DevTools).
  Acceptable en usage strictement personnel local ; ne jamais déployer
  tel quel sur un site public sans passer par un vrai backend qui garde
  la clé secrète.

## Problème connu (non résolu côté app)

Le compte Anthropic Console de l'utilisateur n'arrive pas à ajouter de
crédit (2 paiements par carte différente refusés, côté Anthropic/Stripe,
pas un bug de l'app). En attendant : toutes les fonctionnalités IA
(Analyse ETF, Analyse journal, Contexte marché DCA, Conseil du jour IA)
sont désactivées, mais le reste de l'app fonctionne à 100%. `useClaudeAPI.js`
affiche le vrai message d'erreur d'Anthropic (pas juste le code HTTP). Ne
pas essayer de "corriger" ça côté code — c'est un problème de facturation
externe, pas applicatif.

## Profil utilisateur

Débutant complet en développement. PowerShell sur Windows. Donner des
instructions ultra-simples, étape par étape (copier/coller, quelle touche
appuyer). Workflow de mise à jour :
1. `Ctrl+C` dans le terminal où `npm run dev` tourne
2. `git pull`
3. `npm run dev`
4. Actualiser le navigateur sur `http://localhost:5173/`

## Méthode de travail établie

Pour chaque fonctionnalité :
1. Écrire le code
2. `npm run build` pour vérifier
3. Tester dans un vrai navigateur headless (Playwright + Chromium local —
   **pas** le MCP playwright, qui échoue dans ce sandbox faute de channel
   "chrome")
4. Captures d'écran pour vérifier visuellement
5. Un commit séparé **par fichier** (règle du repo racine — jamais de
   commit groupé), message descriptif
6. Push sur la branche

Note sandbox : le CDN Tailwind et l'API CoinGecko sont bloqués par la
politique réseau de l'environnement de dev (pas un bug — tout fonctionne
normalement chez l'utilisateur avec un internet classique).
