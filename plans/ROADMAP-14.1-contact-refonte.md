# ROADMAP 14.1 — Refonte du module « Contact & Localisation »

**Objectif :** remplacer le module Contact minimaliste (20 lignes) par une structure à
**4 containers** — chapeau, infos, formulaire BDD-First + Resend, réseaux sociaux —
avec masquage granulaire, pièces jointes validées, sécurisation anti-spam et
**tolérance totale au mode démo**.

**Référence d'audit :** les six points bloquants A1–A6 et les addenda 1–2 ont été
mesurés dans le code, pas supposés. Les invariants qui en découlent sont en §2.

---

## 1. Décisions fermées

| # | Sujet | Décision |
|---|---|---|
| D1 | Écriture visiteur & RLS | Client Supabase **`service_role`** créé **exclusivement** dans `/api/contact` (contourne l'absence de session visiteur). Politique `contact_submissions_owner_read` pour la lecture propriétaire. |
| D2 | Consultation des messages | **Aucune UI** dans ce lot. Lecture via Supabase Studio / SQL. La politique RLS est posée pour la suite, mais ne sera **pas exercée** ici (Studio utilise le service_role, qui la contourne). |
| D3 | Formulaires | **Pas de `react-hook-form`.** Composants contrôlés natifs, alignés sur `LoginForm` / `NavEntryForm`. |
| D4 | Mode démo | Gardes `isContactMailConfigured()` / `isTurnstileConfigured()` dans `src/lib/integrations.ts`. `/demo` doit rendre **200** sans aucune variable d'environnement. |
| D5 | Pièces jointes | 5 Mo par défaut, extensions `.pdf .png .jpg .jpeg .webp .docx`, stockage du **`path` relatif** sous `contact-attachments/{photographerId}/…`. Jamais d'URL signée en base (elle expire). |
| D6 | Validation MIME | Taille + **signature binaire** (magic bytes) côté serveur, sur un catalogue **extension → MIME** fermé, jamais `file.type` seul. |
| D7 | Case CGU | Obligatoire par défaut (`requireCGU: true`), intitulé **et** lien paramétrables, repli propre sur `/confidentialite`. |
| D8 | Champ piège | `_gotcha`. Rempli ⇒ **rejet silencieux** (200, aucune insertion, aucun e-mail). |
| D9 | Sujet | Facultatif (`subject` en base : `""`, jamais `null`). |
| D10 | Couleur personnalisée | Défaut `#1a1a1a`. |
| D11 | Préremplissage | `contactPrefillFromProfile(profile)` (module pur) mappe `OwnerProfile.socialLinks` → catalogue `ContactSocialNetwork`. |
| D12 | Addendum 1 — anti-relais | Le payload ne transporte **jamais** de destinataire. Le serveur résout `photographer_id` puis l'adresse depuis `site_owner_profile.contact_form_email` (repli `public_email`) ; **422** si absente. |
| D13 | Addendum 2 — tenancy | Le formulaire transmet `pageSlug` (champ caché) ; le serveur vérifie que la page est **publiée** et en déduit `page_id` + `photographer_id`. Limite à documenter : la résolution par slug suppose **un seul tenant public** (état actuel du routage). |
| D14 | Horaires / adresses | Texte libre multiligne (`white-space: pre-line`). |

### Micro-décisions complémentaires (tranchées ici pour ne pas bloquer l'exécution)

- **Widget Turnstile : composant maison** (~40 lignes, script `api.js?render=explicit`) — pas de 4ᵉ dépendance, pas de risque de peer React 19. Alternative écartée : `@marsidev/react-turnstile`.
- **Plafond serveur de la pièce jointe** : `min(maxFileSizeMB, 10)` — un réglage d'éditeur ne doit pas pouvoir ouvrir un puits de stockage.
- **Limitation de débit** : contrôle en base (`count` des soumissions du même `ip_hash` pour ce tenant sur 10 minutes, plafond 5) plutôt qu'un compteur mémoire (faux en serverless). Colonne indexée pour ça.
- **Surface des icônes** : la forme (`circle`/`square`/`rounded`) est un **habillage neutre** (`--surface-color` + filet `--border-color`) ; le mode couleur ne règle **que** la couleur de l'icône. Un fond couleur officielle avec l'icône officielle serait invisible.
- **`publicDescription`** : une section contact alimente la description de partage par son **chapeau** (sous-titre, à défaut titre), jamais par les données du formulaire — précédent : sections `content` et `cards`.
- **Rétention RGPD** : `ip_hash` salé (`CONTACT_IP_SALT`), purge documentée (suppression de la ligne ⇒ suppression de l'objet Storage par la même action serveur), pas d'automatisation dans ce lot.

---

## 2. Invariants à ne pas casser (issus de l'audit)

1. **A1 — `pages.ts` n'importe jamais `owner-profile.ts`.** Ce dernier est un module `"use client"` ; l'importer depuis du code serveur casse le build. Le préremplissage passe par un **objet pur** `ContactPrefill`, construit au point d'appel client.
2. **A2 — la route `/api/contact` est le premier chemin d'écriture non authentifié du projet.** Service_role côté serveur uniquement, jamais exposé au client ; destinataire résolu serveur (D12) ; aucun identifiant de tenant accepté du client (D13).
3. **A3 — vocabulaire et colonnes du projet** : `photographer_id` (jamais `tenant_id`), FK `→ profiles.id ON DELETE CASCADE`, `accepted_cgu DEFAULT false`.
4. **A4 — `is_read` sans lecteur** : assumé (D2), signalé dans le CHANGELOG.
5. **A5 — démo d'abord** : toute intégration externe (Resend, Turnstile, Storage) est **optionnelle au rendu** ; son absence masque un widget, elle ne casse pas la page.
6. **A6 — le contenu de module est persisté en `content: z.unknown()`** (`src/lib/schemas/persistence.ts:459`) : un `contactContentSchema` est un **miroir documentaire**. La robustesse réelle vit dans `resolveContactContent` (jamais l'inverse de ce qu'on a fait pour les Cards : ici aucun 400 n'est possible).
7. **Titrage** : `h1` réservé au premier Héro (`PublicModules.tsx:332-338`). Le chapeau émet `h2` (`module-h2`) + `h3` (`module-h3`), jamais de `h1`, jamais de style de champ back-office sur la page publique.
8. **`module_type`** contient déjà `contact` : **aucune migration d'énumération**, aucune modification de `moduleTypeSchema`.

---

## 3. Modèle de domaine (cible)

Fichier : `src/lib/pages.ts`, section Cards/Contact après les rubriques existantes
(le bloc contact actuel est en fin de fichier : `ModuleContent` ~3168,
`moduleCatalog` ~4808, `createModuleContent` case `contact` ~4925).

```ts
export type ContactAlign = "left" | "center";
export type ContactSocialAlignment = "left" | "center" | "right";
export type ContactSocialShape = "minimal" | "circle" | "square" | "rounded";
export type ContactSocialColorMode = "theme" | "official" | "custom";

export interface ContactAddressSettings {
  proName: string; address1: string; address2: string;
  postalCode: string; city: string; country: string;
}
export interface ContactInfoSettings {
  name: string; slogan: string; address: ContactAddressSettings;
  landline: string; mobile: string; email: string;
  hours: string; serviceArea: string;
}
/** 9 booléens : master du container 2 + 8 champs (D14 : tous affichés par défaut). */
export interface ContactVisibilitySettings {
  showContainer2: boolean; showName: boolean; showSlogan: boolean;
  showAddressGroup: boolean; showLandline: boolean; showMobile: boolean;
  showEmail: boolean; showHours: boolean; showServiceArea: boolean;
}
export interface ContactFormSettings {
  maxFileSizeMB: number;            // défaut 5, borné 1..10 côté domaine ET serveur
  allowedExtensions: string[];      // sous-ensemble de CONTACT_ATTACHMENT_FORMATS
  requireCGU: boolean;              // défaut true
  cguLinkText: string; cguLinkUrl: string; // repli "/confidentialite"
}
export interface ContactSocialLink { id: string; network: ContactSocialNetwork; url: string }
export interface ContactSocialStyle {
  colorMode: ContactSocialColorMode; customColor: string; // défaut #1a1a1a
  shape: ContactSocialShape; alignment: ContactSocialAlignment;
}
export interface ContactLayoutSettings {
  align: ContactAlign;                 // alignement du chapeau
  visibility: ContactVisibilitySettings;
}
export interface ContactStyleSettings { social: ContactSocialStyle }
export interface ContactContent {
  type: "contact";
  heading: string; subtitle: string; intro: string;   // chapeau (C1)
  info: ContactInfoSettings;                          // C2
  form: ContactFormSettings;                          // C3
  social: ContactSocialLink[];                        // C4 (liste ordonnée)
  layout: ContactLayoutSettings;
  style: ContactStyleSettings;
}
/** Objet **pur** de préremplissage (A1) — aucune dépendance client. */
export interface ContactPrefill {
  name?: string; slogan?: string; email?: string; serviceArea?: string;
  address?: Partial<ContactAddressSettings>;
  socialLinks?: ContactSocialLink[];
}
```

**Catalogues et gardes** (mêmes conventions que `cardsVariantLabels` etc.) :
`CONTACT_SOCIAL_NETWORKS` (instagram, facebook, linkedin, youtube, tiktok, x,
pinterest, vimeo, behance, flickr) + `contactSocialNetworkLabels` + `isContactSocialNetwork` ;
`contactSocialShapeOrder/Labels`, `contactSocialColorModeOrder/Labels`,
`contactSocialAlignmentOrder/Labels`, `contactAlignOrder/Labels`,
`CONTACT_ATTACHMENT_FORMATS` (`{ extension, label, mime, signature }`) + gardes
`isContactSocialShape`, `isContactAlign`, `isContactSocialColorMode`, `isContactAttachmentExtension` ;
`isContactFormFileAllowed(file, settings)` (helper pur, partagé client/serveur :
taille + extension, **le client ne fait que du confort**, le serveur revalide).

**Fabriques et résolveur :**

- `createContactSocialLink(network)` — `id: crypto.randomUUID()`.
- `createContactContent(prefill?: ContactPrefill)` — 3 réseaux d'exemple seulement si
  `prefill.socialLinks` est absent (aucun `OwnerProfile` lu ici, invariant A1).
- `resolveContactContent(raw)` — **total**, jamais de contenu de démonstration
  ressuscité :
  - **rétro-compatibilité** : `email` → `info.email`, `phone` → `info.landline`,
    `address` (ligne unique) → `info.address.address1` ;
  - `layout.visibility` complété sur les 9 booléens (défaut `true`) ;
    `form` complété (5 Mo, extensions par défaut, `requireCGU: true`,
    lien CGU `/confidentialite`) ; `style.social` complété ;
  - `social` : entrées invalides écartées (réseau hors catalogue, url vide non
    conservée) ; `allowedExtensions` filtré sur le catalogue fermé.
- `contactPrefillFromProfile(profile: OwnerProfile): ContactPrefill` — **nouveau
  fichier** `src/lib/contact-prefill.ts`, avec `import type { OwnerProfile }`
  uniquement (effacé à la compilation : aucun couplage runtime, invariant A1).
  Mappage `socialLinks` : `instagram → instagram`, `x → x`, etc. ; URL vide ignorée.
- `createModuleContent` case `contact` → `createContactContent()` ;
  `moduleCatalog` : description de l'entrée mise à jour (« coordonnées, formulaire
  et réseaux sociaux »).
- `ModuleContent` : la branche inline contact devient `| ContactContent`.
- `publicDescription` : ajouter la lecture du chapeau contact (cf. micro-décision).

---

## 4. Lots

### LOT 1 — Domaine (`src/lib/pages.ts`, `src/lib/contact-prefill.ts`)

- [ ] Types, catalogues, gardes et helpers de §3.
- [ ] `createContactContent(prefill?)`, `createContactSocialLink`.
- [ ] `resolveContactContent` avec la reprise des trois champs legacy.
- [ ] `contactPrefillFromProfile` (`import type` seulement).
- [ ] `createModuleContent` + `moduleCatalog` + branche `ModuleContent`.
- [ ] `publicDescription` : chapeau contact.
- [ ] `tsc` doit rester à **0** à ce palier : l'ancien `ContactModule` inline compile
      toujours (`resolveContactContent` n'est pas encore appelé par le rendu).

### LOT 2 — Base de données (`src/db/schema.ts`, `drizzle/`)

- [ ] `contactSubmissions` dans `src/db/schema.ts` (après `pages`, ~ligne 141) :

```ts
export const contactSubmissions = pgTable(
  "contact_submissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    photographerId: uuid("photographer_id").notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    pageId: uuid("page_id").references(() => pages.id, { onDelete: "set null" }),
    senderName: text("sender_name").notNull(),
    senderEmail: text("sender_email").notNull(),
    subject: text("subject").notNull().default(""),
    message: text("message").notNull(),
    attachmentPath: text("attachment_path"),   // chemin relatif, jamais d'URL signée
    acceptedCgu: boolean("accepted_cgu").notNull().default(false),
    isRead: boolean("is_read").notNull().default(false),
    ipHash: text("ip_hash"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("contact_submissions_tenant_created_idx")
      .on(table.photographerId, table.createdAt),
  ]
);
```

- [ ] `npm run db:generate` → `drizzle/0008_*.sql` (prochain index du journal : 8).
- [ ] Migration de politiques **écrite à la main** (précédent `0001_auth_rls.sql`),
      via `npx drizzle-kit generate --custom --name contact_rls` ou édition du
      journal comme en 0001 :

```sql
ALTER TABLE "contact_submissions" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contact_submissions_owner_read" ON "contact_submissions"
  FOR SELECT USING (photographer_id = auth.uid());
CREATE POLICY "contact_submissions_owner_delete" ON "contact_submissions"
  FOR DELETE USING (photographer_id = auth.uid());
-- Aucune politique INSERT : l'insertion passant par le service_role (D1).
```

- [ ] Repository `src/db/repositories/contact-submissions.repository.ts` :
      `createContactSubmission(...)`, `findPublishedPageBySlug(slug)` (D13),
      `countRecentSubmissionsByIpHash(...)` (limitation de débit),
      `getContactRecipientEmail(photographerId)` (D12).
- [ ] Reporter la table dans `-----PourMémoSQLeditor-CreationTable.md`.

### LOT 3 — Rendu public (`src/components/modules/contact/`)

- [ ] `ContactModule.tsx` (serveur) : 4 containers.
      · C1 chapeau : `module-h2` / `module-h3` / paragraphe, alignement
        `left|center` depuis `layout.align`.
      · Grille C2/C3 : `lg:grid-cols-2` ; **si `showContainer2 === false`** →
        C3 seul avec `max-w-2xl mx-auto`. Ordre mobile : C2 puis C3.
      · C4 pleine largeur.
- [ ] `ContactInfoBlock.tsx` (serveur) : masquage par champ **et** par groupe
      (`showAddressGroup` masque les 6 lignes d'adresse) ; `tel:`/`mailto:`
      construits sur les valeurs **trimées** ; `white-space: pre-line` sur
      horaires et adresses ; nom/slogan émis en `p`/`span` (pas de titre : le
      chapeau porte les niveaux).
- [ ] `ContactForm.tsx` (`"use client"`) : champs contrôlés natifs, `_gotcha`
      (visuellement masqué, `tabIndex={-1}`, `autoComplete="off"`), case CGU
      (lien paramétrable, repli `/confidentialite`), accept d'upload dérivé de
      `form.allowedExtensions`, contrôle taille/extension **côté client pour le
      confort uniquement**, widget Turnstile **conditionnel**, champ caché
      `pageSlug`, états « envoi / succès / erreur » annoncés (`aria-live`).
      Aucun token Turnstile ⇒ soumission refusée côté serveur, pas côté client.
- [ ] `SocialLinks.tsx` (serveur) : `@icons-pack/react-simple-icons` **import par
      icône** (`…/icons/si-instagram` ou équivalent vérifié à l'installation,
      jamais le barrel), table `network → composant` dans **un seul fichier** pour
      qu'un renommage d'export soit une correction d'une ligne.
      Mode couleur : `theme` → `currentColor` (`--primary`, déjà alias de
      `--accent-color`), `official` → `color="default"`, `custom` → hex.
      Formes : `minimal` (aucun habillage), `circle|square|rounded` (habillage
      `--surface-color` + filet, padding). Alignement : `justify-start|center|end`.
- [ ] Plomberie du slug (Addendum 2) : `pageSlug` ajouté à
      `PublicModulesList` → `PageModuleRenderer` → `ContactModule` → `ContactForm`,
      et fourni par `src/app/(front-office)/[slug]/page.tsx` +
      `src/app/(front-office)/page.tsx`.
- [ ] `PublicModules.tsx` : l'ancien `ContactModule` inline (~ligne 208) est
      supprimé au profit de l'import du nouveau dossier.

### LOT 4 — Éditeur (`src/components/backoffice/pages/modules/ModuleContactEditor.tsx`)

- [ ] Zone 1 « Chapeau » : titre, sous-titre, description, alignement.
- [ ] Zone 2 « Coordonnées & visibilité » : `SwitchField` master C2 puis 8 toggles ;
      les champs masqués restent **visibles mais désactivés/grisés** (on doit
      pouvoir corriger une valeur sans la réafficher).
- [ ] Zone 3 « Formulaire » : poids max (1–10 Mo, `parseBounded`), extensions
      (cases à cocher sur `CONTACT_ATTACHMENT_FORMATS`), `requireCGU`, texte et
      URL du lien CGU.
- [ ] Zone 4 « Réseaux sociaux » : liste ordonnée (ajout / duplication /
      suppression / montée / descente — précédent `ModuleCardsEditor`),
      `SelectField` de réseau, URL, mode couleur (le `ColorField` n'apparaît
      qu'en mode `custom`, précédent `ctaStyle`/`ctaShow`), forme, alignement.
- [ ] `PagesStoreProvider.addModule` : pour `type === "contact"`, appliquer
      `contactPrefillFromProfile(profile)` (le provider est client, il a le profil).

### LOT 5 — API (`src/app/api/contact/route.ts`, `src/lib/integrations.ts`)

- [ ] `src/lib/integrations.ts` : `isContactMailConfigured()`,
      `isTurnstileConfigured()`, `isContactStorageConfigured()` — même esprit que
      `getSupabaseEnv()` (`src/lib/supabase/demo.ts`) : les valeurs factices de
      `.env.example` comptent comme absentes.
- [ ] Client service_role (`src/lib/supabase/admin.ts`) : créé à la demande,
      **jamais importé hors route serveur**, `null` si non configuré.
- [ ] `POST /api/contact` dans cet ordre : honeypot → Zod (dont `acceptedCgu`
      exigé si `requireCGU`) → Turnstile (`siteverify`, si configuré) →
      résolution de la page publiée par `pageSlug` (D13) → récipiendaire serveur
      (D12, 422 si absent) → limitation de débit (`ip_hash`) → contrôle taille +
      extension + **signature binaire** (D6) → `uploadAttachment()` → insertion →
      Resend (`sendContactNotification`, si configuré) → `200 { ok: true }`.
      En l'absence de Supabase configuré : `503` explicite (précédent `/api/media`).
- [ ] `src/lib/supabase/storage.ts` : `uploadAttachment(client, photographerId, file, mime)`
      sous `contact-attachments/{photographerId}/{uuid}.{ext}` — **`extensionFromMime`
      ne connaît ni `pdf` ni `docx` et renverrait `bin`** : soit l'étendre, soit
      résoudre l'extension depuis `CONTACT_ATTACHMENT_FORMATS`. Retourne le `path`.
      **Bucket** : réutiliser `portfolio-media` (`MEDIA_BUCKET`, seul bucket créé par
      la migration 0002) avec ce préfixe dédié ; un bucket séparé imposerait une
      migration Storage + ses politiques, sans bénéfice ici (l'insertion passe par
      le service_role). Les objets ne polluent pas la médiathèque : celle-ci liste
      les lignes de la table `media`, pas les objets du bucket.
- [ ] `src/lib/emails/contact-notification.ts` (Resend, `RESEND_API_KEY`,
      `RESEND_FROM_EMAIL`) : échec d'e-mail **non bloquant** (ligne déjà en base,
      le message n'est pas perdu) ; l'erreur est journalisée.
- [ ] `.env.example` : `RESEND_API_KEY`, `RESEND_FROM_EMAIL`,
      `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, `CONTACT_IP_SALT`.

### LOT 6 — CSS, démo, recette

- [ ] `globals.css` : section `/* MODULE « CONTACT » */` (grille C2/C3, chapeau,
      champs publics sur `--border-color`/`--text-color`/`--surface-color`,
      horaires en `pre-line`, habillages d'icônes + alignements, `focus-visible`
      visible, neutralisation `prefers-reduced-motion` si transition ajoutée).
- [ ] `/demo` : helper `demoContactModule(sequence, { hideContainer2 })` et **deux**
      instances — une complète, une avec C2 masqué (preuve du `max-w-2xl mx-auto`)
      et les 4 formes d'icônes visibles.
- [ ] `npx tsc --noEmit` → 0 ; `npm run lint` → 0 erreur / 0 avertissement.
- [ ] Assertions `/demo` (serveur arrêté pour `npm run build` seulement) :
      présence des 4 containers, `tel:`/`mailto:`, `_gotcha` présent **1 fois par
      formulaire**, images/icônes SVG par forme, `max-w-2xl` présent sur la seule
      instance à C2 masqué, aucun `h1` dans les sections contact, un seul `h1` sur
      la page.
- [ ] CSS compilé : règles contact émises, formes et alignements présents
      (`:is()`/spécificité : les utilitaires Tailwind priment sur `globals.css`
      hors `@layer` — vérifier l'ordre réel comme en 13.3).
- [ ] CHANGELOG daté, avec la mention explicite : **soumission non exercée** sans
      clés (vérifiée par relecture), et `is_read` sans lecteur (D2).

---

## 5. Ordre d'exécution conseillé

1. Lot 1 (domaine) — `tsc` 0, l'ancien rendu continue de fonctionner.
2. Lot 3 (rendu + slug) — `/demo` toujours 200, section visible et cliquable.
3. Lot 4 (éditeur + préremplissage).
4. Lot 6 partiel (CSS + démo + vérifications + CHANGELOG).
5. Lot 2 (Drizzle + RLS) puis Lot 5 (route + Resend + Turnstile) — **indépendants**
   du rendu, donc livrables après validation visuelle.

## 6. Risques et points de vigilance

| Risque | Réponse |
|---|---|
| Relais de spam via la clé Resend | D12 : destinataire serveur uniquement ; jamais de champ `to` accepté |
| Injection d'un message chez un autre tenant | D13 : `photographer_id` dérivé de la page publiée, jamais du payload |
| `service_role` exposé | Client créé dans la route seule, jamais réexporté, jamais `NEXT_PUBLIC_` |
| Pièce jointe malveillante | Taille bornée serveur (10 Mo max), catalogue fermé, magic bytes, nom de fichier **généré** (UUID) et jamais réutilisé |
| Bots avec token Turnstile valide | Limitation de débit en base ; Turnstile optionnel assumé en démo |
| `@icons-pack/react-simple-icons` : peer React 19 / noms d'exports | Import par icône, table de correspondance isolée, vérification à l'installation ; en cas de blocage, repli sur `lucide-react` pour les 10 marques (décision de repli, pas un choix par défaut) |
| Blocage de `/demo` sans variables d'env | D4 : gardes d'intégration, widget masqué, soumission `503` gérée par le client |
| Contenu existant perdant ses coordonnées | Reprise legacy dans `resolveContactContent` (email/phone/address) |

## 7. Hors périmètre

- Aucune UI de consultation des messages (D2) ; `is_read` non exploité.
- Pas de `react-hook-form`, pas de bibliothèque de validation partagée client.
- Pas d'envoi d'e-mail de confirmation au visiteur, pas de double opt-in.
- Pas d'automatisation de purge RGPD (règle documentée seulement).
- Pas de conversion des sections contact existantes : elles restent lisibles grâce
  à la reprise legacy, sans réécriture de leur contenu.
