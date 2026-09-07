# Spécifications Techniques et Fonctionnelles – SaaS Portfolio Photographes Pro
*(Version Complète, Consolidée, Numérotée & Augmentée)*

---

## 0. Directive Cadrage pour Kilo Code (Avertissement de Portée & Méthodologie)

> **NOTE DE CADRAGE IMPORTANTE POUR KILO CODE :**
> Ce projet global comporte deux volets indissociables :
> 1. **Volet 1 – SaaS Multi-tenants (Gestion Plateforme)** : Landing page commerciale (offres, tarifs, abonnements, paiements) et Dashboard global SaaS (gestion des clients photographes, facturation SaaS, abonnements, codes promo, etc.).
> 2. **Volet 2 – Portfolio & Application Photographe (Produit Cœur)** : Sites web publics du photographe, espaces clients privés, e-commerce de tirages, module de devis/réservation, et Dashboard Back-Office d'administration du photographe.
>
> **RÈGLE EXÉCUTIVE D'AMORÇAGE :**
> - **Vision BDD globale** : La base de données Supabase (tables, clés étrangères `tenant_id` / `photographer_id`, règles RLS multi-tenants) définie dans `ARCHITECTURE.md` doit être conçue pour **supporter les deux volets dès l'initialisation**.
> - **Priorité de développement** : Nous travaillons **dans un premier temps TOUT EXCLUSIVEMENT sur le Volet 2 (Portfolio & Application Photographe)**. La construction de la couche commerciale et de la gestion multi-tenants (Volet 1) interviendra uniquement une fois le produit cœur fully functional.

---

## 1. Vision et Objectifs du Produit

### 1.1 Cadre Stratégique des Deux Volets
* **Volet 1 – SaaS Central B2B (Plateforme Mère)** :
  * Plateforme de commercialisation et de souscription d'abonnements pour photographes professionnels.
  * Vitrine publique présentant les offres, grilles tarifaires et boutons d'achat direct.
  * Dashboard d'administration centrale gérant le parc client, l'état des souscriptions, l'émission des factures SaaS, la gestion des codes promo et le contrôle des accès.
* **Volet 2 – Application Portfolio Photographe (Produit B2B/B2C – *Périmètre de travail prioritaire*)** :
  * Solution clé en main permettant aux photographes abonnés de créer, personnaliser et administrer leur site web portfolio public.
  * Outil de commercialisation des services (shooting, événements, mariages).
  * Espace privé sécurisé e-commerce pour la commande de tirages photos haute résolution et l'interaction avec leurs clients/prospects (devis, réservation, téléchargements).

### 1.2 Philosophie UX/UI & Responsive Design
* **Dashboard Photographe (Back-Office Admin Photographe)** : Conçu selon une approche **Desktop-first** pour une productivité et une gestion d'administration optimales.
* **Site Web Public & Espaces Clients Privés (Front-Office)** : Conception totalement responsive et adaptative, optimisée aussi bien pour les très grands écrans (haute résolution pour mettre en valeur les visuels HD) que pour les mobiles très étroits (< 350 px).

---

## 2. Fonctionnalités Cœurs, Règles d'Upload & Modules d'IA

### 2.1 Traitement et Optimisation Générale des Images (Règle de Gestion)
* **Format et Compression d'Import** : Tous les uploads d'images sur la plateforme (portfolios publics, galeries privées, éléments de design) subissent automatiquement une conversion et une optimisation au format **WebP avec un taux de compression/qualité de 80%** pour garantir un chargement ultra-rapide.

### 2.2 Indexation et Recherche Intelligente d'Images par IA
* **Tagging Automatique** : Chaque image importée est analysée par une IA qui génère automatiquement 15 tags et mots-clés contextuels.
* **Moteur de Recherche Avancé** :
  * Recherche textuelle et filtrage instantané par mots-clés / tags.
  * Recherche visuelle / Reconnaissance faciale : Permet de retrouver des photos associées à une personne spécifique ou un animal d'après une photo de référence.

### 2.3 Assistants Génératifs Intégrés & Suite Marketing Automation
* **Assistant de Rédaction de Contenu** : Générateur IA dédié à la rédaction textuelle (« À propos », descriptions des cartes shooting, prestations, citations, bannières parallax, reformulation du brief).
* **Assistant SEO et Méta-tags** : Suggestion automatique par IA pour le remplissage des balises Meta SEO (Title, Description, Open Graph / OG tags).
* **Assistante Sélection & Curation ("Best of")** : Tri assisté des RAW/JPEGs (détection du flou, yeux fermés, doublons) pré-sélectionnant le "Top 3 / Top 10" soumis à validation express du photographe.
* **Générateur "Teaser / Reel" Réseaux Sociaux** : Export automatique au format vidéo vertical (9:16) ou horizontal d'un diaporama animé dynamique avec musique sous licence et branding discret (filigrane) pour partage Instagram/TikTok.
* **Prospection & Communication B2B (n8n + Google Maps)** : Module d'extraction/scraping d'entreprises locales (hôtels, restaurants, agences) couplé à des séquences d'e-mailing automatisées via n8n.

### 2.4 Moteur d'Animations & Micro-Interactions Discrètes
* **Garde-fous Techniques & UX/UI** :
  * **Architecture à haute performance** : Aucune bibliothèque JavaScript lourde au scroll. L'exécution repose sur une unique instance d'`IntersectionObserver` nativement intégrée au navigateur (0 overhead CPU).
  * **Rendu GPU à 60 FPS** : Animations restreintes exclusivement aux propriétés CSS d'opacité et de transformation (`opacity`, `transform`) afin de garantir zéro recalcul de mise en page (*layout shift*).
  * **Contrôle d'accessibilité** : Respect strict de la règle d'accessibilité via la media query `@media (prefers-reduced-motion: reduce)`.
  * **Déclenchement au scroll** : Exécution unique à l'entrée du module dans le champ de vision (seuil d'apparition / *viewport threshold* à 15-20%).
* **Typologies d'Effets Minimalistes Pré-paramétrés** :
  * **Fade-Up Minimal** : Transition d'opacité (0 à 1) combinée à un glissement vertical ultra-discret (`translateY(20px)` à `0px`).
  * **Cascade / Stagger** : Apparition échelonnée des éléments enfants d'un module avec un délai progressif (50ms à 100ms) pour les cartes et grilles.
  * **Subtle Scale / Léger Zoom d'Entrée** : Révélation d'image passant d'une échelle de 1.02 (ou 1.05) à 1.0.
  * **Fade In Pur** : Transition d'opacité pure de 0 à 100% sans aucun mouvement de translation.

---

## 3. Architecture du Site Web Public (Front-Office Photographe)

### 3.1 Structure Commune à Toutes les Pages
* **En-tête (Header / Navigation Horizontale Contextuelle)** :
  * La barre de navigation adopte une disposition horizontale avec **5 Presets de Style** au choix :
    1. *Glassmorphism* : Translucide / Flouté sur fond d'image Hero HD.
    2. *Minimaliste Transparent* : Transparence totale s'opacifiant au scroll.
    3. *Opaque Sticky* : Fixe avec couleur pleine de la palette et bordure inférieure fine.
    4. *Centré Artiste* : Logo/Nom au-dessus du menu horizontal centré.
    5. *Floating Pill Nav* : Barre flottante détachée aux coins arrondis.
  * Éléments du Header : Nom du photographe (avec typographie dédiée) ou logo à gauche ; menu horizontal au centre ; bouton CTA « Connexion / Login » à droite.
  * Adaptation Mobile : Basculement automatique en Menu Hamburger latéral épuré.
* **Pied de Page (Footer)** :
  * Bandeau supérieur (optionnel) : Galerie défilante de miniatures de photos d'une hauteur fixe de 100 px.
  * Section Contact & Localisation : Coordonnées (Adresse, Tél, E-mail, WhatsApp), zone d'intervention, formulaire direct et carte interactive Google Maps.
  * Zone d'informations (3 colonnes) :
    * *Colonne Gauche* : Nom du photographe et rappel des spécialités.
    * *Colonne Centre 1 (Prestations)* : Liens vers les services et accès rapide au devis en ligne.
    * *Colonne Centre 2 (Menu)* : Liens principaux (Portfolio, Galeries privées, Actualités, Contact).
    * *Colonne Droite (Mentions)* : Liens juridiques (Mentions légales, CGU/CGV, Confidentialité, Cookies) affichés sous forme de modales.
  * Ligne de séparation basse : Copyright 2026 Nom du photographe + Lien discret vers la plateforme SaaS.

### 3.2 Structuration des Pages
* **Page d'Accueil** : Bâtie à partir d'un Preset de Page de Garde (parmi une vingtaine d'architectures prédéfinies) puis personnalisable par empilement de modules.
* **Page « Portfolio »** : Galerie Masonry interactive. Titre minimaliste au survol en bas à gauche. Diaporama modale plein écran sans distraction (fermeture rapide Échap ou bouton X).
* **Pages « Prestations » (Pages Dédiées)** : Pages dynamiques générées à partir des cartes de services, structurées avec Header/Footer communs et sections modulaires CRUD.
* **Page « Expos / Actualités »** : Cartes cliquables (photo, titre, texte) avec liens externes/articles et boutons de partage rapide (E-mail, WhatsApp, Instagram, Copie de lien).

---

## 4. Système d'Authentification et Gestion des Rôles

Le système s'appuie sur une modale d'authentification centralisée accessible depuis le Header. L'inscription ("Sign Up") intervient de façon contextuelle en fin de tunnel (devis, réservation, commande).

### 4.1 Structure de la Modale d'Authentification Centralisée
1. **Masque Principal de Connexion (Utilisateurs Enregistrés)** : Identifiant (E-mail) / Mot de passe, Google OAuth et « Mot de passe oublié ? ».
2. **Accès Dédié aux Visiteurs Privés (2/3 bas du formulaire)** :
   * Texte cliquable discret : « Vous venez visiter une galerie privée ? Cliquez ici ».
   * Basculement dynamique : Transformation de la modale en masque épuré demandant le code ou mot de passe d'accès unique (ex: `MARIAGE-JULIE-2026`).
   * Gestion multi-codes : Champ acceptant la saisie de plusieurs mots de passe séparés par un espace ou une virgule pour déverrouiller simultanément plusieurs galeries.
   * Bouton direct : « Accéder aux galeries » (sans inscription obligatoire) + Lien de retour vers le masque principal.

### 4.2 Les 3 Rôles Distincts et Redirections
1. **Administrateur / Photographe Pro** : Connexion via masque principal $\rightarrow$ Redirection vers le Dashboard Back-Office.
2. **Client/Prospect Inscrit** : Connexion via masque principal / Google OAuth $\rightarrow$ Redirection vers l'Espace Compte Client (devis, factures, galeries autorisées).
3. **Visiteur Privé (Invité / Famille)** : Saisie du code privé $\rightarrow$ Déverrouillage immédiat des galeries associées sans création de compte.

---

## 5. Galeries Privées, E-Commerce & Facturation

### 5.1 Consultation & Commande de Tirages
* Accès protégé par code d'accès.
* Sélection visuelle des photos favorites et bouton « Passer commande ».
* Création/connexion client au moment de valider le panier.
* Formulaire pré-chargé : Sélection du format d'impression, type de papier, quantité et possibilité d'ajouter des lignes multi-formats pour la même photo.
* Calcul en temps réel des prix unitaires HT, total HT et application du taux de TVA configurable pour afficher le total TTC.

### 5.2 Workflow Commercial et Financier
* **Génération & Validation de Devis** : Envoi automatique du devis au format PDF. Validation directe ou signature électronique.
* **Conversion Automatique** : Passage du Devis en Bon de commande puis en Facture dès validation.
* **Acomptes & Paiements en Ligne** : Intégration Stripe/PayPal pour exiger un acompte (ex. 30%) à la réservation.
* **Relances Automatisées** : Séquences d'e-mails pour devis et factures en attente.

---

## 6. Espace Compte Clients / Prospects (Back-Office Client)

Interface personnalisée centralisée permettant au client de :
* Consulter le récapitulatif de ses devis, factures et bons de commande avec suivi des statuts.
* Retrouver l'ensemble de ses accès et mots de passe pour ses galeries privées déverrouillées.

---

## 7. Dashboard Photographe (Back-Office Administrateur)

### 7.1 Personnalisation du Style et Design System (Style System à Presets)
Plutôt que d'exposer des règles CSS individuelles sujettes à des erreurs de rendu, le système repose sur un choix de Combinaisons Préréglées (Presets) :

#### A. Paires Typographiques
Choix parmi des duos de polices Google Fonts pré-validés (Titre H1-H4 + Corps de texte) :
* *Élégant / Artiste* : Serif classique + Sans-Serif moderne.
* *Minimaliste / Studio* : Modern Sans-Serif + Neutral Text.
* *Industriel / Corporate* : Geometric Sans + Roboto.
* *Romantique / Mariage* : Script / Display + Serif épuré.
* *Typographie Dédiée* : Police spécifique pour le nom/logo du photographe (Nav & Hero).

#### B. Palettes de Couleurs & Smart Contraste
Choix parmi 15 palettes harmonieuses de 4 couleurs (Fond, Texte, Accent/CTA, Surface) avec contrôle automatique du contraste WCAG :
* *Galerie Sombre & Luxe* (Carbon, Gold, Off-White).
* *Épuré & Minimalist* (Pure White, Deep Black, Neutral Gray).
* *Naturel & Warm* (Terracotta, Cream, Espresso).

#### C. Paramétrage des Boutons CTA & Sécurité
* Dimensions, bordures (radius, width) et effets d'état hover/active.
* Bouton Réinitialiser : Option permanente de remise à zéro vers le thème initial par défaut.

#### D. Paramétrage Global des Animations d'Entrée
* **Interrupteur Général** : Toggle principal d'activation ou de désactivation globale des animations d'entrée sur l'ensemble du site public.
* **Preset d'Intensité Visuelle** :
  * *Ultra-Clean* : Transitions basées uniquement sur le Fade In (opacité pure).
  * *Subtil (Par défaut)* : Combinaison équilibrée de Fade-Up et de Stagger court.
  * *Dynamique* : Mouvements légèrement plus soutenus intégrant l'effet Subtle Scale.

> **Nota Ergonomie Back-Office :**
> * **Aperçu visuel immédiat (Cards)** : Dans le Back-Office, au lieu de simples listes déroulantes texte, chaque paire est présentée sous forme de vignette visuelle avec un échantillon de la typographie et des pastilles de couleur.
> * **Application instantanée** : Lorsque le photographe clique sur l'une des paires, l'aperçu du site (Split-Screen) se met à jour instantanément sans recharger la page.
> * **Le bouton "Réinitialiser"** : Option permanente permettant de revenir à la paire initiale du thème par défaut en un clic s'il s'est trompé dans ses essais.

### 7.2 Structuration et Layout des Pages

#### A. Processus d'Onboarding & Choix de la Structure de Départ
Lors de la création d'une page ou du lancement du site, le photographe suit un workflow guidé en 3 étapes :
1. **Choix de la Structure / Page de Garde (20 Presets disponibles)** :
   * *Preset 1* : Monopage Hero Parallax classique + 10 déclinaisons de bandeaux.
   * *Preset 2* : Entrée par Modale / Splash screen minimaliste avec bouton d'accès.
   * *Preset 3* : Accueil axé 100% Portfolio Masonry + déclinaisons d'en-tête.
   * *Preset 4* : Accueil Biographique / Storytelling + déclinaisons.
   * *Presets 5 à 20* : Déclinaisons combinant vidéo background, grilles tarifaires ou bannières promotionnelles.
2. **Sélection des Paires de Style (Polices + Couleurs)** : Appliquées instantanément sur l'ensemble de la structure choisie.
3. **Édition par Blocs Modulaires (Accordéon)** : Ajustement des contenus.

#### B. Constructeur de Pages à Blocs Modulaires (Page Builder en Accordéon Compact)
* **Canvas Vierge** : Zone centrale encadrée par le Header et le Footer fixes.
* **Menu Déroulant « + Ajouter une section »** : Accès au catalogue complet de modules préformatés.
* **Gestionnaire Accordéon Compact & Drag & Drop** :
  * *Vue Compacte (Accordéon Fermé)* : Liste sous forme de bandeaux horizontaux compacts avec poignée de glissement (Drag Handle) pour réordonner l'affichage vertical par simple Drag & Drop, libellé du module, switch d'activation/masquage (Toggle Eye) et bouton de suppression.
  * *Vue Dépliée (Accordéon Ouvert - CRUD)* : Formulaire d'édition complet du module (champs textuels avec Assistant IA, gestion des médias avec balises Alt SEO, configuration des CTA).
  * *Sélecteur de Variantes (Layout Switcher)* : Dans chaque bloc ouvert, un sélecteur rapide permet de basculer l'agencement interne du module (ex: [Photo Gauche / Texte Droite] vers [Photo Droite / Texte Gauche]) sans perdre les textes ou médias déjà saisis.
* **Gestion des Animations au niveau Module** :
  * *Sélecteur d'Animation d'Entrée* : Menu déroulant pour surcharger le comportement du bloc (Par défaut du thème, Fade-Up, Fade-In, Scale-In, Aucune).
  * *Option Décalage (Delay)* : Interrupteur binaire pour retarder l'apparition d'un module spécifique au défilement.

#### C. Gestion des Ancres, Boutons CTA et Liens Textuels
* **Identifiant d'Ancre HTML** : Généré automatiquement (ex: `id="a-propos"`) et modifiable.
* **Boutons Call-to-Action (CTA)** : Choix du nombre (0, 1 ou 2), de la disposition (Horizontale côte-à-côte ou Verticale empilée) et du style (Primary, Secondary, Textual).
* **Lien Textuel** : Insertion de lien ciblant une ancre interne, une page du site ou une URL externe.

#### D. Gestionnaire de Navigation & Presets Onboarding
* **Champs Création de Page** : Titre SEO/H1, MenuTitle (nom abrégé pour le menu) et emplacement.
* **Écran Navigation & Menus (Back-Office)** : Arborescence en Drag & Drop pour organiser les liens du menu horizontal principal (Niveau 1) et des sous-menus (Niveau 2).
* **Option Afficher/Masquer (Toggle Eye)** : Masque une page du menu sans la supprimer ni affecter ses performances.
* **Presets de Navigation Onboarding** :
  * *Profil Artiste / Auteur* : Portfolio | Séries | À Propos | Contact | Connexion.
  * *Profil Photographe Pro / Commercial* : Accueil | Prestations (Mariage, Portrait, Corporate) | Tarifs | À Propos | RDV / Contact (Bouton CTA) | Connexion.
  * *Profil Passionné / Semi-Pro* : Accueil | Galeries | Contact | Connexion.

### 7.3 Administration du Portfolio, Galeries Privées, Clients et Devis
* **Galeries Publiques (Portfolio)** : Upload d'images (individuel, multi-sélection, dossier entier), tagging IA automatique et reconnaissance faciale.
* **Galeries Privées** : Interface de création et génération de codes d'accès.
* **Gestion Clients** : Module CRUD complet et filtres (Shooting vs Tirage).
* **Gestion des Devis & Brief Shooting** : Suivi des devis, génération de « lien magique » (questionnaire interactif IA) ou saisie du brief en direct.

### 7.4 Paramètres Généraux du Site
* **SEO & Méta-données** : Formulaire Meta/OG tags avec assistant IA d'auto-remplissage et infobulles (tooltips).
* **Grilles Tarifaires & TVA** : Formulaires CRUD des tarifs shootings/tirages et paramétrage de la TVA.
* **Formulaires & Intégrations** : E-mail de réception et clés d'API (FormSubmit.co, n8n).
* **Réseaux Sociaux** : Liens sociaux et association d'icônes Material-UI (MUI).
* **Textes Juridiques** : Éditeurs pour Mentions Légales, CGU/CGV, Confidentialité et Cookies.

---

## 8. Catalogue des Templates de Sections Préformatées

Le Dashboard permet au photographe d'ajouter, réordonner et configurer les types de sections suivants :

* **Navigation & En-tête** :
  * Barre de navigation horizontale contextuelle (5 Presets: Glassmorphism, Transparent, Sticky Opaque, Centré, Floating Pill) avec sous-menus déroulants.
* **Hero & Accroche** :
  * Parallax Hero (Titres H1/H2/H3, textes et boutons CTA).
  * Vidéo Hero Background (Arrière-plan vidéo fluide avec superposition textuelle).
  * Bandeau Appel à l'action / Réservation rapide (CTA Banner).
* **Présentation & À Propos** :
  * À propos Photo Gauche / Texte Droite.
  * À propos Photo Droite / Texte Gauche.
  * Chronologie / Mon Processus de travail (Steps 1, 2, 3, 4).
* **Services, Tarifs & Conversion** :
  * Cartes shooting & Cartes prestations dynamiques.
  * Cartes minimalistes & Médaillons thématiques.
  * Grille comparative de tarifs / Packs (3 colonnes avec mise en avant visuelle).
  * Simulateur / Calculateur de Tarif indicatif.
  * Calendrier de disponibilité / Séances de saison.
* **Bannières, Réassurance & Preuve Sociale** :
  * Bandeau galerie défilante & Bandeau avis clients défilant.
  * Bandeau Parallax Citation & Bandeau 3 colonnes.
  * Bandeau Chiffres Clés / Statistiques animées.
  * Grille de Logos / Distinctions & Publications presse.
  * Foire Aux Questions (FAQ Accordéon).
* **Galeries & Expériences Visuelles** :
  * Galerie photo Masonry Cliquable (Diaporama plein écran / Lightbox interactif avec zoom).
  * Galerie photo Masonry Non-cliquable.
  * Galerie Portfolio thématique.
  * Slider interactif "Avant / Après Retouche" (RAW vs Retouché).
* **Réseaux Sociaux, Contact & Cartographie** :
  * Bloc Infos contact & Formulaire de contact direct.
  * Intégration Flux Instagram Live Grid.
  * Formulaire de capture d'e-mail / Newsletter.
  * Bandeau interactif Google Maps.

### Modules Dédiés : Prise de RDV et Visioconférence

#### A. Bloc Modulaire : "Prise de RDV sur Agenda"
* **En mode fermé (Back-Office)** : Représenté par son bandeau compact réorganisable par Drag & Drop : `[ Module RDV ] "Prendre un rendez-vous"`.
* **En mode ouvert (CRUD Back-Office)** : Le photographe personnalise le contenu du bloc :
  * Titre et sous-titre de la section (ex: "Un projet photo ? Discutons-en ensemble !").
  * Texte du bouton CTA déclencheur (ex: "Réserver un créneau (15 min)").
  * Style du bouton (Primary, Secondary, etc.).
* **Côté site public (Front-Office)** : La section affiche le texte et le bouton CTA. Un clic sur le bouton déclenche la Modale interactive contenant le composant calendrier (`shadcn/ui` + Supabase) prêt à l'emploi.

#### B. Bloc Modulaire : "Appel Vidéo / Salle de Réunion"
* **En mode fermé (Back-Office)** : Bandeau compact `[ Module Visio ] "Rejoindre la visio"`.
* **En mode ouvert (CRUD Back-Office)** : Le photographe configure :
  * Titre et consigne (ex: "Accès à votre séance de présentation en direct").
  * Libellé du bouton (ex: "Accéder à la salle virtuelle").
* **Côté site public (Front-Office)** :
  * Le bouton ouvre une Modale Visioconférence plein écran.
  * Si le client arrive via son lien magique, le composant vidéo LiveKit/Daily.co s'affiche directement dans la modale avec la gestion automatique de la salle d'attente (synchronisation via Supabase Realtime).

> **Avantage clé avec shadcn/ui et Tailwind CSS :**
> Grâce à la stack technique Tailwind CSS + `shadcn/ui` :
> * Les modales (`Dialog` ou `Sheet` de `shadcn/ui`) sont déjà pré-stylisées, légères et entièrement accessibles (fermeture touche Échap, gestion du focus, adaptation mobile).
> * L'insertion et l'ouverture de ces modales ne demandent que quelques lignes de code React (composants Client légers) sans alourdir le temps de chargement statique (ISR) des pages publiques du portfolio.

---

## 9. Stack Technique du Projet

### 9.1 Core Framework & Frontend
* **Framework Principal** : Next.js (App Router, React 19)
  * *Raison d'être* : Exploitation du Server-Side Rendering (SSR) et de l'Incremental Static Regeneration (ISR) pour garantir des temps de chargement ultra-rapides et une optimisation SEO maximale sur le Front-Office.
  * *Dashboard* : Utilisation de Client Components isolés pour la réactivité du Dashboard et du Page Builder en accordéon.
* **Langage** : TypeScript (Mode Strict)
  * *Raison d'être* : Sécurité de typage de bout en bout (des requêtes PostgreSQL jusqu'à l'UI), prévenant les erreurs de manipulation des rôles et des données de facturation.
* **Design System & Styling** : Tailwind CSS + shadcn/ui
  * *Raison d'être* : Approche basée sur des variables CSS globales (`:root`) facilitant la gestion dynamique des 15 palettes de couleurs et paires typographiques. Aucun surcoût de style en runtime CSS-in-JS.
  * *Unification UI* : Unification du Front-Office et du Back-Office. Tous les composants UI doivent être injectés directement en code source local dans le projet (approche `shadcn/ui` native) sans dépendance UI externe fermée.
* **Animations & Micro-interactions** : Intersection Observer API (native) + Framer Motion
  * *Raison d'être* : Rendu GPU fluide à 60 FPS restreint aux propriétés `opacity` et `transform` sans surcharge CPU au scroll, intégrant le support natif de `@media (prefers-reduced-motion)`.
* **Glisser-Déplacer (Drag & Drop)** : `@hello-pangea/dnd` (ou `@dnd-kit`)
  * *Raison d'être* : Gestion fluide de l'ordonnancement des modules du Page Builder et des menus de navigation dans le Back-Office.

### 9.2 Backend, Base de Données & Multi-Tenancy
* **BaaS / Base de Données** : Supabase (PostgreSQL)
  * *Row Level Security (RLS)* : Isolation stricte des données entre photographes, clients et visiteurs invités au niveau du moteur PostgreSQL.
  * *Stockage Vectoriel (`pgvector`)* : Stockage et recherche par similarité des embeddings générés par les modèles d'IA (recherche visuelle / reconnaissance faciale).
  * *Realtime Engine* : Mises à jour en direct des statuts de devis, signatures et réservations.
* **ORM / Query Builder** : Drizzle ORM
  * *Raison d'être* : Gestion flexible et légère des requêtes SQL typées avec auto-complétion TypeScript et gestion transparente des migrations.

### 9.3 Traitement Médias, Pipeline Image & Modèles d'IA
* **Stockage d'Objets** : Cloudflare R2
  * *Raison d'être* : Stockage S3-compatible sans frais d'extraction de données (*egress fees*), essentiel pour la gestion de volumétries élevées d'images HD.
* **Traitement et Conversion d'Images** : Sharp (Node.js) + Pipeline Edge
  * *Raison d'être* : Exécution automatisée du redimensionnement, du filigranage dynamique et de la conversion systématique vers le format WebP avec 80% de compression.
* **Moteur d'IA Généraliste & Vision** : Google Gemini API (Gemini 1.5 Flash & Pro)
  * *Gemini 1.5 Flash* : Génération automatique des 15 tags contextuels par image, assistance SEO/Meta-tags et pré-sélection esthétique "Best Of".
  * *Gemini 1.5 Pro* : Génération et reformulation des briefs clients, rédaction des textes de présentation et contenus marketing.
* **Recherche Visuelle & Reconnaissance Faciale** : Embeddings Visuels + `pgvector`
  * *Raison d'être* : Extraction d'empreintes vectorielles légères pour la comparaison instantanée de visages ou d'animaux d'après une photo de référence.
* **Analyse de Netteté & Flou** : Micro-fonction Algorithmique (OpenCV / Variance de Laplacian)
  * *Raison d'être* : Évaluation mathématique précise et locale de la mise au point et du flou de bougé sans coût d'API.

### 9.4 Authentification, Paiements & Orchestration
* **Gestionnaire d'Identités** : Supabase Auth
  * *Raison d'être* : Prise en charge native de la connexion par e-mail/mot de passe, Google OAuth et gestion des tokens de session anonymes pour les galeries privées à code d'accès.
* **Paiements & Facturation** : Stripe API (Stripe Connect & Billing)
  * *Raison d'être* : Encaissement des acomptes (ex. 30%), paiement des commandes de tirages avec calcul de TVA et gestion des abonnements SaaS des photographes.
* **Automation, Scraping & Workflow B2B** : n8n (Instance dédiée)
  * *Raison d'être* : Séquences automatisées de relances de devis/factures, envois d'e-mails transactionnels et module de prospection/extraction B2B via Google Maps API.

### 9.5 Agenda & Prise de Rendez-vous
* **Interface & Ingestion** : Composant Calendar d'UI (`shadcn/ui` / Tailwind CSS) associé aux tables PostgreSQL (via Drizzle ORM / Supabase) pour la gestion et le filtrage dynamique des créneaux.
* **Orchestration & Invitations** : Envoi d'e-mails transactionnels via l'API Resend générant automatiquement des pièces jointes au format d'invitation universel (`.ics`) pour Google Calendar, Apple Calendar et Outlook.

### 9.6 Visioconférence HD & Synchronisation Realtime
* **Moteur Audio/Vidéo (WebRTC)** : Intégration du SDK React de LiveKit Cloud (ou Daily.co) pour l'établissement de salles virtuelles sécurisées, le partage d'écran et la gestion multi-participants sans serveur tiers à maintenir.
* **Salle d'Attente & Signalisation** : Utilisation du moteur Supabase Realtime pour la mise à jour instantanée des statuts de la room et l'entrée automatique du client dès l'ouverture de la session par le photographe.

---

## 10. Thème Initial et Direction Artistique (« Éclat Minéral & Nacre »)

### 10.1 Intention Visuelle & Positionnement
Le thème par défaut du SaaS adopte une esthétique épurée, minimaliste et ultra-premium ("Style Galerie d'Art Contemporaine"). Le sentiment de richesse visuelle ne repose pas sur une surcharge d'éléments ou de couleurs vives, mais sur un travail fin de la profondeur, de la réfraction de la lumière et de micro-interactions fluides au scroll/hover.

### 10.2 Déclinaison de la Palette de Couleurs (Variables CSS Root)
Au lieu d'un gris neutre ou d'un blanc plat, le thème s'appuie sur une palette de 4 rôles fondamentaux aux teintes chaudes et très légèrement rosées/nacrées :
* **Background (`--bg-color`)** : `#FFFFFF` (Blanc Pur - apporte clarté et respiration).
* **Surface (`--surface-color`)** : `#FAF8F8` (Blanc Nacre / Rose voilé - détache subtilement les cartes et modales du fond).
* **Text (`--text-color`)** : `#1A1A1A` (Anthracite doux - lisibilité optimale sans l'agressivité du noir pur).
* **Accent / CTA (`--accent-color`)** : `#E8D8D7` ou `#D8C3C2` (Rose Nacré Chaud / Bronze très doux).

#### Nuances Fonctionnelles Automatiques (Générées par Moteur CSS) :
* **Bordures (`--border-color`)** : `#EAE5E5` (Perle irisée en 1px pour un découpage chirurgical).
* **Text Muted (`--text-muted`)** : `rgba(26, 26, 26, 0.6)` (Gris perle foncé pour sous-titres et dates).

### 10.3 Duo Typographique (Preset « Éditorial & Luxe »)
* **Titres (`--font-heading`)** : *Cormorant Garamond* ou *Playfair Display* (Serif raffiné, graisses *Light* ou *Regular*).
* **Corps de Texte (`--font-body`)** : *Plus Jakarta Sans* ou *Inter* (Sans-Serif géométrique ultra-lisible, `letter-spacing: 0.02em`).

### 10.4 Spécifications des Effets Visuels (Signature Premium)
* **Ombre Nacre (Soft Pearlescent Glow)** :
  Utiliser des ombres très diffusément teintées plutôt que du noir :
  `box-shadow: 0 20px 40px -15px rgba(220, 200, 200, 0.25);`
* **Réfraction Glassmorphism (Header & Modales)** :
  `backdrop-filter: blur(12px);`
  `background: rgba(255, 255, 255, 0.75);`
  `border: 1px solid rgba(234, 229, 229, 0.6);`
* **Micro-Animations (Moteur Intersection Observer)** :
  * *Au scroll* : Transition **Fade-Up Minimal** (translation de 20px vers 0, opacité 0 à 100%, courbe `cubic-bezier(0.16, 1, 0.3, 1)` sur 400ms).
  * *Au survol (Hover)* : Élévation de `-4px` sur l'axe Y + intensification progressive de l'ombre nacre (`transition: all 0.3s ease`).