"use client";

import * as React from "react";

import { persistVisualIdentity } from "@/lib/persistence-client";
import {
  DEFAULT_SITE_THEME,
  SITE_THEME_IDS,
  siteThemeLabels,
  siteThemeModes,
  siteThemeWrapperClasses,
  type SiteThemeId,
} from "@/lib/site-theme";
import { useVisualIdentity } from "@/lib/visual-identity-store";
import { cn } from "@/lib/utils";

/**
 * ============================================================================
 * ÉCRAN — « Apparence » (Paramètres › Apparence)
 * ----------------------------------------------------------------------------
 * Sélection de la palette du **site public** parmi les 7 thèmes : « Nacre &
 * Éditorial » (défaut, `:root`) et les 6 presets `.theme-<id>` de `globals.css`.
 * La valeur vit dans `visualIdentity.theme` (JSONB `site_visual_identity`) : le
 * provider + le store existants la persistent (débounce 400 ms) et
 * `(front-office)/layout.tsx` l'applique côté serveur.
 *
 * L'aperçu (cartes + mockup) utilise les **jetons produit** (`var(--bg-color)`,
 * `var(--accent-color)`…) plutôt que les alias shadcn : la page vit sous
 * `.admin`, qui surcharge `--primary` en anthracite. Passer par `bg-primary`
 * afficherait un bouton anthracite pour Nacre, alors que son vrai CTA est rosé.
 * Les rôles produit échappent à cette surcharge (sauf `--surface-color`, écart
 * imperceptible) et restent la définition exacte d'une palette.
 *
 * Limite assumée : le site public est rendu au chargement ; un changement de
 * thème n'y est visible qu'après rechargement.
 * ============================================================================
 */

function RubricTitle({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="grid gap-1">
      <h5 className="text-[13px] font-semibold text-foreground">{title}</h5>
      <p className="text-xs leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

/** Vignette d'une palette : 4 pastilles produit rendues dans son propre wrapper. */
function ThemeSwatch({ id }: { id: SiteThemeId }) {
  return (
    <div
      className={cn(
        siteThemeWrapperClasses(id),
        "flex h-10 overflow-hidden rounded-md border border-[var(--border-color)]"
      )}
      aria-hidden="true"
    >
      <span className="flex-1 bg-[var(--bg-color)]" />
      <span className="flex-1 bg-[var(--surface-color)]" />
      <span className="flex-1 bg-[var(--accent-color)]" />
      <span className="flex-1 bg-[var(--text-color)]" />
    </div>
  );
}

export function AppearanceScreen() {
  const { visualIdentity, update } = useVisualIdentity();
  const [savedAt, setSavedAt] = React.useState<string | null>(null);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  const theme = visualIdentity.theme;

  async function save() {
    setSaving(true);
    setSaveError(null);
    try {
      await persistVisualIdentity(visualIdentity);
      setSavedAt(new Date().toLocaleTimeString("fr-FR"));
    } catch {
      setSavedAt(null);
      setSaveError(
        "Enregistrement impossible (base de données indisponible ou erreur serveur)."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6">
      {/* ---- En-tête ---- */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Apparence
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Choisissez la palette du site public. Elle s’applique à tout le site
            (Header, contenu, Footer) au prochain chargement d’une page.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            void save();
          }}
          disabled={saving}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/85 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
      {savedAt ? (
        <p role="status" className="text-xs text-emerald-600">
          Apparence enregistrée dans la base de données à {savedAt}.
        </p>
      ) : null}
      {saveError ? (
        <p role="alert" className="text-xs text-destructive">
          {saveError}
        </p>
      ) : null}

      {/* ============ Choix de la palette ============ */}
      <section className="grid gap-3 rounded-lg border border-border bg-card p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <RubricTitle
            title="🎨 Palette du site"
            description="Sept ambiances prêtes à l’emploi — la sélection est enregistrée pour ce photographe."
          />
          {theme !== DEFAULT_SITE_THEME ? (
            <button
              type="button"
              onClick={() => update({ theme: DEFAULT_SITE_THEME })}
              className="rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent"
            >
              Réinitialiser (Nacre)
            </button>
          ) : null}
        </div>

        <div
          role="radiogroup"
          aria-label="Palette du site public"
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          {SITE_THEME_IDS.map((id) => {
            const active = theme === id;
            const dark = siteThemeModes[id] === "dark";
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => update({ theme: id })}
                className={cn(
                  "grid gap-3 rounded-lg border bg-card p-3 text-left transition-colors",
                  active
                    ? "border-primary ring-2 ring-primary"
                    : "border-border hover:border-primary/50"
                )}
              >
                <ThemeSwatch id={id} />
                <span className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {siteThemeLabels[id]}
                  </span>
                  <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                    {dark ? "Sombre" : "Clair"}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ============ Aperçu en direct ============ */}
      <section className="grid gap-3 rounded-lg border border-border bg-card p-4">
        <RubricTitle
          title="👁️ Aperçu en direct"
          description="Rendu miniature du site public avec la palette sélectionnée."
        />
        <div
          className={cn(
            siteThemeWrapperClasses(theme),
            "rounded-lg border border-[var(--border-color)] bg-[var(--bg-color)] p-4"
          )}
        >
          {/* Barre type Header */}
          <div className="flex items-center justify-between rounded-md bg-[var(--surface-color)] px-3 py-2">
            <span className="text-sm font-semibold text-[var(--text-color)]">
              Nom du site
            </span>
            <span className="text-xs text-[var(--text-color)]">
              Menu · Contact
            </span>
          </div>
          {/* Contenu type */}
          <div className="mt-4 grid gap-2">
            <p className="text-xl font-semibold text-[var(--text-color)]">
              Titre de section
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              Sous-titre et texte secondaire d’une page publique.
            </p>
            <div>
              <span className="inline-block rounded-md bg-[var(--accent-color)] px-3 py-1.5 text-xs font-semibold text-[var(--accent-foreground)]">
                Bouton principal
              </span>
            </div>
          </div>
          {/* Carte type */}
          <div className="mt-4 rounded-md border border-[var(--border-color)] bg-[var(--surface-color)] p-3 text-xs text-[var(--text-color)]">
            Carte de contenu — surface, bordure et texte.
          </div>
        </div>
        {theme === DEFAULT_SITE_THEME ? (
          <p className="text-xs text-muted-foreground">
            « Nacre &amp; Éditorial » est la palette par défaut du site : aucune
            classe n’est posée sur le wrapper public.
          </p>
        ) : null}
      </section>
    </div>
  );
}
