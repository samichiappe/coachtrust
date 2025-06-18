# CoachTrust 🎾⚡

[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=flat&logo=vercel)](https://xrpl-coach-booking.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat&logo=next.js)](https://nextjs.org/)
[![XRPL](https://img.shields.io/badge/XRPL-Testnet-blue?style=flat&logo=ripple)](https://xrpl.org/)
[![Xaman](https://img.shields.io/badge/Wallet-Xaman-orange?style=flat)](https://xaman.app/)

**CoachTrust** est une marketplace décentralisée qui connecte les coaches sportifs certifiés et les clients via la blockchain XRP Ledger. Rapide, sécurisée et accessible partout, la plateforme permet de réserver un coach en quelques clics pour des sports comme le tennis, le padel ou le squash, avec des paiements transparents et garantis par escrow.


## ✨ Fonctionnalités

### 🎯 Pour les clients
- **Connexion Xaman** : Connexion sécurisée via wallet Xaman
- **Recherche de coaches** : Filtrage par sport, localisation et disponibilité
- **Réservation instantanée** : Système de booking en temps réel
- **Paiement escrow XRPL** : Sécurisation des fonds jusqu'à validation du cours
- **Historique transparent** : Suivi de toutes les transactions sur XRPL

### 🏆 Pour les coaches
- **Profil vérifié** : Certifications et évaluations clients
- **Gestion d'agenda** : Disponibilités en temps réel
- **Paiements garantis** : Libération automatique après validation
- **Tarification flexible** : Prix personnalisés par session

### 🔒 Sécurité blockchain
- **Smart contracts XRPL** : Escrow automatisé pour la protection des fonds
- **Transactions transparentes** : Toutes les opérations visibles sur XRPL
- **Crypto-conditions** : Mécanisme de validation sécurisé
- **Wallet non-custodial** : Les utilisateurs gardent le contrôle de leurs fonds

## 🛠 Technologies

### Frontend
- **Next.js 14** - Framework React avec App Router
- **TypeScript** - Typage statique
- **Tailwind CSS** - Styling moderne et responsive
- **Shadcn/ui** - Composants UI réutilisables
- **Lucide React** - Icônes modernes

### Blockchain & Wallets
- **XRPL (XRP Ledger)** - Blockchain rapide et écologique
- **Xaman (ex-XUMM)** - Wallet mobile pour signature de transactions
- **xrpl.js** - SDK officiel XRPL
- **Escrow smart contracts** - Protection des paiements

### Backend & APIs
- **Next.js API Routes** - API serverless
- **Vercel** - Déploiement et hosting
- **RESTful APIs** - Architecture moderne

## 📋 Prérequis

- **Node.js** 18+ 
- **npm** 8+
- **Wallet Xaman** installé sur mobile
- **Compte XRPL Testnet** avec des XRP de test

## 🔧 Installation

### 1. Cloner le repository
```bash
git clone https://github.com/votre-username/xrpl-final-project.git
cd xrpl-final-project
```

### 2. Installer les dépendances
```bash
npm install
# ou
yarn install
# ou
pnpm install
# ou
bun install
```

### 3. Configurer les variables d'environnement
Renommez le fichier `.env.local.example` en `.env.local` et remplissez les valeurs nécessaires, y compris vos identifiants API Xaman et les paramètres XRPL.

### 4. Lancer le serveur de développement
```bash
npm run dev
# ou
yarn dev
# ou
pnpm dev
# ou
bun dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur pour voir le résultat.

## 🧪 Tester les Transactions XRPL

Visitez `/xrpl-test` pour comparer les transactions XRPL simulées et réelles et comprendre l'implémentation actuelle.

## 📖 Documentation

- [Solution de Transaction XRPL](./docs/XRPL_TRANSACTION_SOLUTION.md) - Explication détaillée des transactions simulées et réelles
- [Guide d'Intégration Xaman](./docs/XAMAN_INTEGRATION.md) - Comment s'intégrer à Xaman pour des transactions réelles

Vous pouvez commencer à modifier la page en modifiant `app/page.tsx`. La page se met à jour automatiquement lorsque vous modifiez le fichier.

Ce projet utilise [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) pour optimiser et charger automatiquement [Geist](https://vercel.com/font), une nouvelle famille de polices pour Vercel.

## En Savoir Plus

Pour en savoir plus sur Next.js, consultez les ressources suivantes:

- [Documentation Next.js](https://nextjs.org/docs) - en savoir plus sur les fonctionnalités et l'API de Next.js.
- [Apprendre Next.js](https://nextjs.org/learn) - un tutoriel interactif Next.js.

Vous pouvez consulter [le dépôt GitHub de Next.js](https://github.com/vercel/next.js) - vos retours et contributions sont les bienvenus!

## Déployer sur Vercel

Le moyen le plus simple de déployer votre application Next.js est d'utiliser la [plateforme Vercel](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) des créateurs de Next.js.

Consultez notre [documentation sur le déploiement Next.js](https://nextjs.org/docs/app/building-your-application/deploying) pour plus de détails.
