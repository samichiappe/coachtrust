# 📖 DEVBOOK - Plateforme Coach XRPL

> **Projet**: Plateforme décentralisée type "Uber pour coaches" sur XRPL  
> **Méthodologie**: Test Driven Development (TDD)  
> **Dernière mise à jour**: 16 juin 2025  
> **Statut global**: 🟡 En cours de développement

---

## 🎯 Vision du Projet

Une plateforme décentralisée permettant de réserver des coaches sportifs avec:
- ✅ Interface React déjà implémentée
- 🔄 Paiements sécurisés via XRPL Escrow
- 🔄 Authentification Xaman Wallet
- 🔄 Données mockées côté client (pas de backend)
- 🔄 Smart contracts XRPL pour les paiements

---

## 📊 Tableau de Bord des Progrès

| Phase | Statut | Progression | Étapes Complétées |
|-------|--------|-------------|-------------------|
| **Phase 1** - Fondations | 🟢 Terminé | 2/2 | 2 |
| **Phase 2** - Authentification | 🟢 Terminé | 2/2 | 2 |
| **Phase 3** - Paiements & Escrow | 🔴 À faire | 0/3 | 0 |
| **Phase 4** - Réservations | 🔴 À faire | 0/3 | 0 |
| **Phase 5** - Interface UI/UX | 🔴 À faire | 0/2 | 0 |
| **Phase 6** - Gestion États | 🔴 À faire | 0/2 | 0 |
| **Phase 7** - Fonctionnalités Avancées | 🔴 À faire | 0/2 | 0 |
| **Phase 8** - Déploiement | 🔴 À faire | 0/2 | 0 |

**Légende**: 🔴 À faire • 🟡 En cours • 🟢 Terminé

---

## 🏗️ PHASE 1: Fondations & Tests Infrastructure

### 📋 Étape 1.1: Configuration de l'environnement de test
**Statut**: 🟢 Terminé  
**Priorité**: Critique  

#### Tests à écrire:
- [x] Configuration Jest/Vitest pour tests unitaires
- [x] Configuration tests d'intégration XRPL testnet
- [x] Mocks pour les appels XRPL
- [x] Setup environnement de test isolé

#### Implémentation:
- [x] Installation dépendances: `@testing-library/react`, `jest`, `@jest/globals`
- [x] Fichier `jest.config.js`
- [x] Dossier `__tests__/setup.ts`
- [x] Variables d'environnement testnet

#### Critères d'acceptation:
- ✅ Tests lancent sans erreur avec `npm test`
- ✅ Mocks XRPL fonctionnels
- ✅ Coverage de test configuré

---

### 📋 Étape 1.2: Tests des utilitaires XRPL de base
**Statut**: 🟢 Terminé  
**Priorité**: Critique  

#### Tests à écrire:
- [x] Connexion au testnet XRPL
- [x] Création et validation de wallets
- [x] Conversion montants (XRP ↔ drops)
- [x] Validation d'adresses XRPL

#### Implémentation:
- [x] `lib/xrpl/client.ts` - Client XRPL configuré
- [x] `lib/xrpl/utils.ts` - Utilitaires de base
- [x] `lib/xrpl/types.ts` - Types TypeScript
- [x] Tests unitaires dans `__tests__/unit/xrpl/`

#### Critères d'acceptation:
- ✅ Connexion testnet stable
- ✅ Fonctions utilitaires testées à 100%
- ✅ Types TypeScript strictes

---

## 🔐 PHASE 2: Authentification Xaman Wallet

### 📋 Étape 2.1: Tests d'intégration Xaman
**Statut**: ✅ COMPLÉTÉ - ARCHITECTURE SÉCURISÉE ✅  
**Priorité**: Haute  

#### Tests à écrire:
- ✅ Connexion à Xaman Wallet
- ✅ Récupération adresse utilisateur
- ✅ Signature de transactions test
- ✅ Gestion des erreurs de connexion

#### Implémentation:
- ✅ **REFACTORING SÉCURITÉ**: Migration vers architecture backend-frontend sécurisée
- ✅ **Backend Service** (`lib/services/xaman-backend.ts`) - SDK Xaman côté serveur uniquement
- ✅ **API Routes** - Endpoints sécurisés (`/api/auth/xaman/*`, `/api/transactions/*`)
- ✅ **Frontend Hook** (`lib/hooks/useXamanWallet.ts`) - Communication API sécurisée
- ✅ **UI Components** (`components/XamanConnectButton.tsx`) - Interface améliorée
- ✅ **Crypto-Conditions** - Support escrow avec five-bells-condition
- ✅ **Tests Security** - Validation architecture sécurisée

#### Améliorations Sécurité:
- ✅ **Credentials Backend-Only**: XUMM_APIKEY/SECRET jamais exposés côté client
- ✅ **Universal Xaman SDK**: Migration vers package `xumm` (recommandé)
- ✅ **API Architecture**: Frontend → Backend API → Xaman SDK
- ✅ **Session Security**: Tokens utilisateur validés côté backend
- ✅ **Environment Isolation**: Variables sensibles séparées

#### Critères d'acceptation:
- ✅ Connexion Xaman fonctionnelle et sécurisée
- ✅ Récupération adresse utilisateur via API
- ✅ Gestion erreurs robuste
- ✅ Aucune exposition de credentials côté frontend
- ✅ Architecture conforme aux bonnes pratiques Xaman

**📝 Notes d'implémentation:**
- Architecture complètement refactorisée pour suivre les recommandations officielles Xaman
- Backend service sécurisé avec validation des variables d'environnement
- Frontend utilise polling pour vérifier le statut des transactions
- Support complet des crypto-conditions pour les paiements escrow
- Tests de sécurité validant l'absence d'exposition de credentials

---

### 📋 Étape 2.2: Tests de gestion d'état utilisateur
**Statut**: ✅ COMPLÉTÉ  
**Priorité**: Haute  

#### Tests à écrire:
- ✅ Persistance session utilisateur
- ✅ Déconnexion propre
- ✅ États de connexion (loading, connected, error)
- ✅ Récupération automatique de session

#### Implémentation:
- ✅ `contexts/XamanWalletProvider.tsx` - Context global
- ✅ États: `connecting`, `connected`, `disconnected`, `error`
- ✅ Persistance localStorage
- ✅ Hook `useWalletState`

#### Critères d'acceptation:
- ✅ Session persistante entre rechargements
- ✅ États UI cohérents
- ✅ Déconnexion propre

**📝 Notes d'implémentation:**
- Context Provider `XamanWalletProvider` pour état global
- Hook `useWalletState` pour accès depuis n'importe quel composant
- Gestion automatique de persistance avec localStorage
- États de connexion bien définis: `isConnecting`, `isConnected`, `error`
- Déconnexion propre avec nettoyage de l'état et du stockage local
- [ ] `contexts/XamanWalletProvider.tsx` - Context global
- [ ] États: `connecting`, `connected`, `disconnected`, `error`
- [ ] Persistance localStorage
- [ ] Hook `useWalletState`

#### Critères d'acceptation:
- ✅ Session persistante entre rechargements
- ✅ États UI cohérents
- ✅ Déconnexion propre

---

## 💰 PHASE 3: Système de Paiement & Escrow

### 📋 Étape 3.1: Tests de paiements directs
**Statut**: 🔴 À faire  
**Priorité**: Critique  

#### Tests à écrire:
- [ ] Création transaction paiement simple
- [ ] Validation et soumission paiement
- [ ] Vérification statut transaction
- [ ] Gestion des erreurs de paiement

#### Implémentation:
- [ ] `lib/services/paymentService.ts` - Service paiements
- [ ] Types `PaymentTransaction`, `PaymentStatus`
- [ ] Hook `usePayment` - Gestion des paiements
- [ ] Tests unitaires et d'intégration

#### Critères d'acceptation:
- ✅ Paiement XRP fonctionnel sur testnet
- ✅ Validation transactions
- ✅ Gestion erreurs complète

---

### 📋 Étape 3.2: Tests du système d'escrow
**Statut**: 🔴 À faire  
**Priorité**: Critique  

#### Tests à écrire:
- [ ] Création escrow avec condition temporelle
- [ ] Finalisation escrow après cours
- [ ] Annulation escrow en cas de problème
- [ ] Gestion crypto-conditions

#### Implémentation:
- [ ] `lib/services/escrowService.ts` - Service escrow
- [ ] Logique métier escrow (création, finalisation, annulation)
- [ ] Types `EscrowContract`, `EscrowCondition`
- [ ] Intégration avec Xaman pour signatures

#### Critères d'acceptation:
- ✅ Escrow créé et finalisé avec succès
- ✅ Conditions temporelles respectées
- ✅ Annulation sécurisée

---

### 📋 Étape 3.3: Tests d'intégration paiement + booking
**Statut**: 🔴 À faire  
**Priorité**: Haute  

#### Tests à écrire:
- [ ] Workflow complet: réservation → escrow → finalisation
- [ ] Gestion erreurs paiement
- [ ] Remboursement automatique si échec
- [ ] Synchronisation état UI/blockchain

#### Implémentation:
- [ ] Hook `useBookingPayment` - Orchestration complète
- [ ] Intégration UI avec formulaire de réservation
- [ ] Service `bookingPaymentOrchestrator.ts`
- [ ] Tests end-to-end

#### Critères d'acceptation:
- ✅ Workflow complet fonctionnel
- ✅ Remboursements automatiques
- ✅ UI synchronisée avec blockchain

---

## 📅 PHASE 4: Système de Réservation

### 📋 Étape 4.1: Tests de logique de calendrier
**Statut**: 🔴 À faire  
**Priorité**: Haute  

#### Tests à écrire:
- [ ] Génération créneaux disponibles
- [ ] Validation réservations (pas de conflit)
- [ ] Mise à jour disponibilités après réservation
- [ ] Gestion fuseaux horaires

#### Implémentation:
- [ ] `lib/services/availabilityService.ts` - Logique calendrier
- [ ] Types `TimeSlot`, `BookingSlot`, `Availability`
- [ ] Algorithme de détection de conflits
- [ ] Mock data pour disponibilités coaches

#### Critères d'acceptation:
- ✅ Créneaux générés correctement
- ✅ Pas de double réservation
- ✅ Disponibilités mises à jour

---

### 📋 Étape 4.2: Tests de réservation avec mocks
**Statut**: 🔴 À faire  
**Priorité**: Haute  

#### Tests à écrire:
- [ ] Sélection date/heure/terrain
- [ ] Validation données de réservation
- [ ] Calcul prix total
- [ ] Gestion des données mockées

#### Implémentation:
- [ ] Hook `useBooking` - Logique de réservation
- [ ] Composant `BookingWidget` - Interface réservation
- [ ] Service `mockDataService.ts` - Gestion mocks
- [ ] Types `Booking`, `Coach`, `Court`

#### Critères d'acceptation:
- ✅ Sélection créneaux intuitive
- ✅ Validation robuste
- ✅ Calculs de prix corrects

---

### 📋 Étape 4.3: Tests d'intégration complète
**Statut**: 🔴 À faire  
**Priorité**: Critique  

#### Tests à écrire:
- [ ] Workflow: sélection → validation → paiement escrow
- [ ] Confirmation de réservation
- [ ] Gestion erreurs de réservation
- [ ] Mise à jour de l'état global

#### Implémentation:
- [ ] Refactoring composant coach existant `app/coach/[id]/page.tsx`
- [ ] Intégration complète avec système XRPL
- [ ] Service `bookingOrchestrator.ts`
- [ ] Tests end-to-end complets

#### Critères d'acceptation:
- ✅ Workflow de bout en bout fonctionnel
- ✅ Intégration XRPL transparente
- ✅ UX fluide

---

## 🎨 PHASE 5: Interface Utilisateur & UX

### 📋 Étape 5.1: Tests des composants UI
**Statut**: 🔴 À faire  
**Priorité**: Moyenne  

#### Tests à écrire:
- [ ] Affichage correct informations coach
- [ ] Interaction avec calendrier
- [ ] États de chargement pendant transactions
- [ ] Messages d'erreur informatifs

#### Implémentation:
- [ ] Tests avec React Testing Library
- [ ] Composants de feedback utilisateur
- [ ] Loading states et spinners
- [ ] Toast notifications

#### Critères d'acceptation:
- ✅ Composants testés individuellement
- ✅ États UI cohérents
- ✅ Feedback utilisateur clair

---

### 📋 Étape 5.2: Tests de l'expérience de réservation
**Statut**: 🔴 À faire  
**Priorité**: Moyenne  

#### Tests à écrire:
- [ ] Workflow complet côté utilisateur
- [ ] Messages d'erreur informatifs
- [ ] Confirmations visuelles
- [ ] Performance et responsivité

#### Implémentation:
- [ ] Amélioration UX des formulaires
- [ ] Indicateurs de progression
- [ ] Confirmations visuelles des étapes
- [ ] Optimisations performance

#### Critères d'acceptation:
- ✅ UX intuitive et fluide
- ✅ Performance optimisée
- ✅ Accessibilité respectée

---

## 🔄 PHASE 6: Gestion des États & Données

### 📋 Étape 6.1: Tests de gestion d'état global
**Statut**: 🔴 À faire  
**Priorité**: Moyenne  

#### Tests à écrire:
- [ ] État des réservations utilisateur
- [ ] Cache des données coaches
- [ ] Synchronisation avec XRPL
- [ ] Performance du state management

#### Implémentation:
- [ ] Context pour l'état global `BookingProvider`
- [ ] Hook `useBookingHistory`
- [ ] Service de cache `cacheService.ts`
- [ ] Optimisations re-renders

#### Critères d'acceptation:
- ✅ État global cohérent
- ✅ Performance optimisée
- ✅ Synchronisation XRPL

---

### 📋 Étape 6.2: Tests de persistance locale
**Statut**: 🔴 À faire  
**Priorité**: Moyenne  

#### Tests à écrire:
- [ ] Sauvegarde réservations en cours
- [ ] Récupération après refresh
- [ ] Nettoyage données expirées
- [ ] Migration de données

#### Implémentation:
- [ ] Service `localStorageService.ts`
- [ ] Gestion du cache local
- [ ] Stratégies de nettoyage
- [ ] Versioning des données

#### Critères d'acceptation:
- ✅ Persistance fiable
- ✅ Récupération automatique
- ✅ Gestion des versions

---

## 📱 PHASE 7: Fonctionnalités Avancées

### 📋 Étape 7.1: Tests de notifications
**Statut**: 🔴 À faire  
**Priorité**: Basse  

#### Tests à écrire:
- [ ] Confirmation de réservation
- [ ] Rappels de cours
- [ ] Notifications de paiement
- [ ] Notifications d'erreur

#### Implémentation:
- [ ] Service de notifications `notificationService.ts`
- [ ] Intégration emails/push (optionnel)
- [ ] Composant `NotificationCenter`
- [ ] Gestion des préférences utilisateur

#### Critères d'acceptation:
- ✅ Notifications en temps réel
- ✅ Préférences utilisateur
- ✅ Fiabilité des notifications

---

### 📋 Étape 7.2: Tests de gestion des conflits
**Statut**: 🔴 À faire  
**Priorité**: Basse  

#### Tests à écrire:
- [ ] Double réservation simultanée
- [ ] Annulation de dernière minute
- [ ] Gestion des remboursements
- [ ] Résolution automatique de conflits

#### Implémentation:
- [ ] Logique de résolution de conflits
- [ ] Système de remboursement automatique
- [ ] Service `conflictResolutionService.ts`
- [ ] Algorithmes de priorité

#### Critères d'acceptation:
- ✅ Conflits résolus automatiquement
- ✅ Remboursements sécurisés
- ✅ Logs de résolution

---

## 🚀 PHASE 8: Déploiement & Monitoring

### 📋 Étape 8.1: Tests de performance
**Statut**: 🔴 À faire  
**Priorité**: Moyenne  

#### Tests à écrire:
- [ ] Temps de réponse XRPL
- [ ] Gestion de la charge
- [ ] Optimisation des appels API
- [ ] Tests de stress

#### Implémentation:
- [ ] Optimisations performance
- [ ] Lazy loading des composants
- [ ] Cache intelligent
- [ ] Bundle optimization

#### Critères d'acceptation:
- ✅ Performance optimisée
- ✅ Temps de chargement < 2s
- ✅ Bundle optimisé

---

### 📋 Étape 8.2: Tests de production
**Statut**: 🔴 À faire  
**Priorité**: Haute  

#### Tests à écrire:
- [ ] Basculement testnet → mainnet
- [ ] Monitoring des transactions
- [ ] Gestion des erreurs réseau
- [ ] Tests de déploiement

#### Implémentation:
- [ ] Configuration production
- [ ] Logging et monitoring
- [ ] Service de santé de l'app
- [ ] Documentation déploiement

#### Critères d'acceptation:
- ✅ Déploiement mainnet fonctionnel
- ✅ Monitoring en place
- ✅ Documentation complète

---

## 📁 Architecture de Fichiers

```
lib/
├── xrpl/
│   ├── client.ts              # ✅ Client XRPL configuré
│   ├── wallet.ts              # 🔄 Gestion Xaman Wallet
│   ├── payment.ts             # 🔄 Paiements directs
│   ├── escrow.ts              # 🔄 Système d'escrow
│   ├── types.ts               # 🔄 Types XRPL
│   └── utils.ts               # 🔄 Utilitaires XRPL
├── services/
│   ├── booking.ts             # 🔄 Logique de réservation
│   ├── availability.ts        # 🔄 Gestion des créneaux
│   ├── payment.ts             # 🔄 Service paiements
│   ├── escrow.ts              # 🔄 Service escrow
│   ├── notification.ts        # 🔄 Notifications
│   ├── cache.ts               # 🔄 Cache local
│   └── mockData.ts            # 🔄 Données mockées
├── hooks/
│   ├── useXamanWallet.ts      # 🔄 Hook Xaman
│   ├── useBooking.ts          # 🔄 Hook réservation
│   ├── usePayment.ts          # 🔄 Hook paiements
│   ├── useEscrow.ts           # 🔄 Hook escrow
│   └── useBookingHistory.ts   # 🔄 Historique réservations
├── contexts/
│   ├── XamanWalletProvider.tsx # 🔄 Provider Xaman
│   └── BookingProvider.tsx     # 🔄 Provider réservations
├── types/
│   ├── booking.ts             # 🔄 Types réservation
│   ├── coach.ts               # ✅ Types coach (existants)
│   ├── payment.ts             # 🔄 Types paiement
│   └── xrpl.ts                # 🔄 Types XRPL
├── components/
│   ├── XamanConnectButton.tsx # 🔄 Bouton connexion Xaman
│   ├── BookingWidget.tsx      # 🔄 Widget de réservation
│   ├── PaymentStatus.tsx      # 🔄 Statut paiement
│   └── NotificationCenter.tsx # 🔄 Centre notifications
└── __tests__/
    ├── unit/                  # 🔄 Tests unitaires
    ├── integration/           # 🔄 Tests d'intégration
    ├── e2e/                   # 🔄 Tests end-to-end
    └── setup.ts               # 🔄 Configuration tests
```

---

## 🎯 Métriques de Succès

### Métriques Techniques
- **Coverage de tests**: > 90%
- **Performance**: Temps de chargement < 2s
- **Fiabilité XRPL**: Taux de succès > 99%
- **Sécurité**: Aucune vulnérabilité critique

### Métriques Fonctionnelles
- **Workflow complet**: Réservation + Paiement + Confirmation
- **Gestion d'erreurs**: 100% des cas d'erreur couverts
- **UX**: Interface intuitive et responsive
- **Intégration**: Xaman Wallet fonctionnel

---

## 📝 Notes de Développement

### Prochaines Étapes Prioritaires
1. **Phase 1.1**: Configuration environnement de test
2. **Phase 1.2**: Utilitaires XRPL de base
3. **Phase 2.1**: Intégration Xaman Wallet

### Décisions Techniques
- **Tests**: Jest + React Testing Library
- **State Management**: React Context (pas de Redux)
- **XRPL**: Bibliothèque officielle `xrpl`
- **Wallet**: Xaman SDK

### Risques Identifiés
- **Réseau XRPL**: Latence et disponibilité
- **Xaman**: Dépendance externe
- **Complexité Escrow**: Gestion des conditions
- **Performance**: Nombreux appels XRPL

---

## 📚 Ressources & Documentation

### Documentation XRPL
- [XRPL Documentation](https://xrpl.org/docs.html)
- [XRPL.js Library](https://js.xrpl.org/)
- [Escrow Transactions](https://xrpl.org/escrow.html)

### Xaman Wallet
- [Xaman Developer Docs](https://docs.xaman.app/)
- [Xaman SDK](https://github.com/XRPL-Labs/Xaman-SDK)

### Testing
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)

---

**Dernière modification**: 16 juin 2025  
**Prochaine révision**: À définir selon les progrès

> 💡 **Note**: Ce DEVBOOK sera mis à jour régulièrement pour refléter l'avancement du projet et les nouvelles décisions techniques.
