# CAHIER DES CHARGES & DIRECTION ARTISTIQUE

## 1. Vision et Objectifs du Produit
* **Produit :** Plateforme SaaS B2B/B2C permettant aux photographes professionnels de créer, personnaliser et gérer leur site web portfolio public, de commercialiser leurs services, d'interagir avec leurs prospects et de proposer un espace privé de commande de tirages pour leurs clients.
* **Philosophie UX/UI :**
  * **Dashboard Photographe :** Conçu selon une approche Desktop-first pour une productivité et une gestion d'administration optimales.
  * **Site Web Public & Espaces Clients :** Conception totalement responsive et adaptative, optimisée aussi bien pour les très grands écrans (haute résolution pour mettre en valeur le travail des photographes pros) que pour les mobiles très étroits (jusqu'à une largeur inférieure à 350 px).

---

## 2. Direction Artistique du Front-Office (« Éclat Minéral & Nacre »)
> **Portée :** Cette direction artistique s'applique exclusivement au Front-Office (Site Web Public du Photographe et Espaces Galeries Clients). Le Dashboard Back-Office adopte quant à lui une interface d'administration épurée et hautement contrastée basée sur des standards UI/UX de productivité (shadcn/ui).

* **Style Général :** Minimalisme d'une galerie d'art contemporaine allié à une sensation tactile et luxueuse. L'aspect « riche » provient du travail sur la profondeur, la lumière, la réfraction et les micro-interactions physiques.
* **Palette CSS Root (`src/app/globals.css`) :**
  * `--bg-color`: `#FFFFFF` (Blanc Pur) — apporte la clarté et l'espace respirant.
  * `--surface-color`: `#FAF8F8` ou `#FBF7F6` (Blanc Nacre / Rose voilé) — détache subtilement les cartes ou sections du fond blanc.
  * `--border-color`: `#EAE5E5` (Perle irisée) — bordures d'une extrême finesse (1px) pour découper l'espace de manière chirurgicale.
  * `--text-color`: `#1A1A1A` ou `#222222` (Anthracite doux) — évite le noir pur agressif pour maintenir une douceur haut de gamme.
  * `--accent-color`: `#E8D8D7` ou `#D8C3C2` (Rose Nacré Chaud / Bronze très doux).
* **Convention des jetons de thème (`src/app/globals.css`)** — à respecter avant toute retouche de couleur :
  * **Quatre rôles source.** `--bg-color` (fond de page), `--text-color` (texte principal), `--accent-color` (accent/CTA, jamais du texte courant) et `--surface-color` (cartes, modales, bandeaux) portent la charte ; leurs dérivés (`--accent-color-strong`, `--border-color`, `--text-muted`, `--primary-foreground`, `--accent-foreground`) en découlent. Trois portées déclarent ces rôles : `:root` (site public clair), `.dark` (variante sombre) et `.admin` (back-office zinc, où `--primary` est un anthracite distinct de `--accent-color` — écart volontaire, ne pas « corriger »).
  * **Règle du texte de CTA.** Le texte d'un bouton vient de `--primary-foreground` / `--accent-foreground` : accent clair → texte sombre, accent foncé → texte blanc, toujours ≥ 4,5:1. On ne pose jamais `--text-color` sur `--accent-color`.
  * **Seuils.** Texte ≥ 4,5:1 (WCAG 2.1 AA, 1.4.3) ; éléments non textuels et anneau de focus ≥ 3:1 (1.4.11).
  * **Frontière anti-hex.** Les valeurs hex/rgba vivent uniquement dans les jetons de `globals.css` ; un composant consomme un utilitaire (`bg-primary`, `text-primary-foreground`, `border-border`…) ou `var(--…)`. Seule exception : le texte posé sur photo (Héro, bandeaux), qui doit rester lisible quelle que soit l'image.
  * **Garde automatique.** `npm run check:contrast` (script `scripts/check-contrast.ts`) vérifie les paires de jetons des trois thèmes et sort en code 1 si une paire obligatoire passe sous son seuil.
  * **Presets opt-in (dormants).** Six palettes alternatives vivent en CSS sous `.theme-<id>` dans `globals.css` : `corporate`, `tech-minimaliste`, `terre-atelier`, `sauge-cabinet` (clairs), `galerie-luxe` (sombre, à coupler avec `.dark` pour que les variantes `dark:` se déclenchent) et `girly-baby` (clair). Aucun mécanisme de sélection n'existe encore : ces classes ne s'appliquent pas tant qu'un lot ultérieur ne les pose pas, le thème par défaut restant `:root`. Contrat d'application : **le même élément que `:root`, soit `<html>`** (`src/app/layout.tsx`) — appliquées à un wrapper, les alias shadcn résolus dans `:root` (`--primary`, `--ring`, `--background`…) resteraient par défaut. `npm run check:contrast` mesure aussi leurs paires.
* **Typographies :**
  * **Titres (`--font-heading`) :** Serif à haut contraste, type Cormorant Garamond ou Playfair Display (graisse Light ou Regular).
  * **Corps (`--font-body`) :** Sans-Serif géométrique ultra-lisible, type Plus Jakarta Sans ou Inter (avec `letter-spacing: 0.02em`).
* **Effets Riches & Micro-Interactions :**
  * **Ombre Nacre (Soft Pearlescent Glow) :** `box-shadow: 0 20px 40px -15px rgba(220, 200, 200, 0.25);`
  * **Glassmorphism Refraction :** `backdrop-filter: blur(12px); background: rgba(255, 255, 255, 0.75);` avec bordure 1px translucide.
  * **Survol (Hover) :** Légère élévation (`translateY(-4px)`) associée à l'apparition progressive de l'ombre nacre.
  * **Scroll :** Transitions Fade-Up Minimal (glissement de 20px et opacité à 100% via `cubic-bezier(0.16, 1, 0.3, 1)`).

---

## 3. Back-Office Page Builder (Constructeur de Pages)
* **Architecture Canvas :** Zone centrale d'édition encadrée par le Header et le Footer fixes.
* **Gestionnaire en Accordéons Compacts & Drag & Drop :**
  * **Vue Compacte (Accordéon Fermé) :** Bandeau horizontal avec poignée Drag Handle (`@hello-pangea/dnd` ou `@dnd-kit`), libellé du module, switch d'activation/masquage (Toggle Eye) et bouton de suppression.
  * **Vue Dépliée (Accordéon Ouvert - CRUD) :** Formulaire d'édition complet du module (champs textuels avec Assistant IA, gestion des médias avec balises Alt SEO, configuration des CTA).
  * **Sélecteur de Variantes (Layout Switcher) :** Permet de basculer l'agencement interne du module (ex: Photo Gauche / Texte Droite vers Photo Droite / Texte Gauche) sans perdre le contenu saisi.
  * **Animations du Module :** Sélecteur d'animation d'entrée (Fade-Up, Fade-In, Scale-In, Aucune) et interrupteur de décalage (Delay).
* **Ancres & Boutons CTA :** Identifiants d'ancres HTML générés automatiquement et modifiables, choix de 0 à 2 boutons CTA (Primary, Secondary, Textual) et gestion des liens internes/externes.
* **Arborescence & Navigation :**
  * Gestion du menu principal (Niveau 1) et sous-menus (Niveau 2) en Drag & Drop.
  * Masquage de page via Toggle Eye sans suppression de données.
  * Presets Onboarding (Profil Artiste/Auteur, Profil Photographe Commercial, Profil Passionné).

---

## 4. Fonctionnalités Cœurs & Modules IA
* **Indexation et Recherche Intelligente d'Images par IA :**
  * **Tagging Automatique :** Génération automatique de 15 tags contextuels par image (via Google Gemini 1.5 Flash).
  * **Moteur de Recherche Avancé :** Recherche textuelle et filtrage instantané par tags.
  * **Recherche Visuelle / Reconnaissance Faciale :** Recherche de personnes ou animaux via photo de référence (via Embeddings Visuels & `pgvector`).
  * **Curation & Tri Intelligent :** Détection des doublons, des yeux fermés, du flou de bougé (Variance de Laplacian) et recommandation du Top 3 / Top 10 Best Of.
* **Assistants Génératifs Intégrés :**
  * **Assistant Rédactionnel :** Générateur IA (Gemini 1.5 Pro) pour les textes (« À propos », cartes shooting, prestations, banners).
  * **Assistant SEO :** Suggestions automatiques des balises Meta SEO (Title, Description, OG tags).
* **Galeries Privées, Clients & Devis :**
  * Création de galeries privées à code d'accès / token anonyme avec filigrane dynamique anti-vol et export WebP.
  * Suivi des devis, génération de « lien magique » (questionnaire interactif IA) ou saisie du brief en direct.

---

## 5. Modules Complémentaires (Agenda & Visio)
* **Agenda & Prise de Rendez-vous :** Composant Calendar UI (shadcn/ui) relié à PostgreSQL/Supabase avec génération d'invitations universelles (.ics) expédiées via Resend (Google Calendar, Apple, Outlook).
* **Visioconférence HD & Live Sync :** SDK LiveKit Cloud (WebRTC) pour les salons virtuels et le partage d'écran, synchronisé en temps réel via Supabase Realtime pour la salle d'attente.