"use client";

import * as React from "react";
import { Pipette } from "lucide-react";

import {
  HelpTip,
} from "@/components/backoffice/pages/modules/form-fields";
import {
  VISUAL_IDENTITY_ACCENTS,
  VISUAL_IDENTITY_NEUTRALS,
} from "@/lib/visual-identity";
import { cn } from "@/lib/utils";

/**
 * ============================================================================
 * CHAMP COULEUR PARTAGÉ — palette, pipette, saisie libre (Étape 11.27)
 * ----------------------------------------------------------------------------
 * Extrait du panneau « Identité visuelle » (Étape 9.1), où il était **en ligne**
 * dans `VisualIdentityScreen`. Le bandeau message/CTA ayant besoin du même
 * service (choisir une couleur de fond), le dupliquer aurait créé deux pipettes
 * à maintenir — dont une seule aurait reçu les correctifs.
 *
 * Il réunit les trois façons de choisir une couleur :
 *   1. **sélecteur natif** (`<input type="color">`) ;
 *   2. **saisie libre** hexadécimale ou CSS (`#1E293B`, `rgba(...)`) ;
 *   3. **pipette écran** (API `EyeDropper`) — y compris hors de l'onglet, avec
 *      un message explicite quand le navigateur ne la supporte pas ;
 * plus la **palette maison** : une rangée de neutres, une rangée d'accents.
 *
 * Aucune dépendance nouvelle, aucun `any`. La palette vient de
 * `src/lib/visual-identity.ts` (source unique des couleurs presets).
 * ============================================================================
 */

/** Explication par défaut de l'infobulle « i ». */
const DEFAULT_TIP =
  "Palette prédéfinie ou saisie libre Hex/RGBA (ex. #FFFFFF ou rgba(255,255,255,0.9)).";

type ColorFieldProps = {
  /** Libellé du champ. */
  label: string;
  /** Couleur courante (hexadécimale ou valeur CSS libre). */
  value: string;
  onChange: (value: string) => void;
  /** Explication de l'infobulle « i » (défaut : palette + saisie libre). */
  tip?: string;
  /**
   * Couleur proposée par le sélecteur natif quand `value` n'est pas un
   * hexadécimal à 6 chiffres (l'attribut refuse toute autre forme).
   */
  fallback?: string;
  /** Libellé d'accessibilité du sélecteur natif, pour le distinguer des autres. */
  ariaLabel?: string;
  className?: string;
};

export function ColorField({
  label,
  value,
  onChange,
  tip = DEFAULT_TIP,
  fallback = "#1E293B",
  ariaLabel,
  className,
}: ColorFieldProps) {
  const [pickError, setPickError] = React.useState<string | null>(null);

  /** Pipette **écran** (EyeDropper API) — prélève une couleur hors de l'onglet. */
  async function handlePickColor() {
    type EyeDropperResult = { sRGBHex: string };
    type EyeDropperCtor = new () => { open: () => Promise<EyeDropperResult> };
    const Impl = (
      window as unknown as { EyeDropper?: EyeDropperCtor }
    ).EyeDropper;
    if (!Impl) {
      setPickError(
        "Pipette non supportée par ce navigateur (fonctionne sur Chrome/Edge)."
      );
      return;
    }
    try {
      const result = await new Impl().open();
      onChange(result.sRGBHex);
      setPickError(null);
    } catch {
      // Annulé par l'utilisateur (Échap) → silencieux.
    }
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <span className="flex items-center gap-2 text-xs font-semibold text-foreground">
        {label}
        <HelpTip tip={tip} />
      </span>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="color"
          aria-label={ariaLabel ?? `Sélecteur de couleur — ${label}`}
          value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : fallback}
          onChange={(event) => onChange(event.target.value)}
          className="h-9 w-12 cursor-pointer rounded border border-border bg-background"
        />
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={fallback}
          className="w-40 rounded-md border border-input bg-background px-3 py-1.5 text-sm"
        />
        <button
          type="button"
          onClick={() => {
            void handlePickColor();
          }}
          title="Pipette — prélever une couleur n’importe où à l’écran (y compris hors de l’onglet)"
          className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-sm transition-colors hover:bg-accent"
        >
          <Pipette className="size-4" /> Pipette
        </button>
      </div>

      {/* Palette maison — rangée neutres puis rangée accents. */}
      <div className="grid gap-1.5">
        {[VISUAL_IDENTITY_NEUTRALS, VISUAL_IDENTITY_ACCENTS].map(
          (row, index) => (
            <div key={`row-${index}`} className="flex flex-wrap gap-1.5">
              {row.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  title={preset}
                  aria-label={`Couleur ${preset}`}
                  onClick={() => onChange(preset)}
                  style={{ backgroundColor: preset }}
                  className={cn(
                    "size-6 rounded-full border",
                    value.toLowerCase() === preset.toLowerCase()
                      ? "border-primary ring-2 ring-primary/40"
                      : "border-border"
                  )}
                />
              ))}
            </div>
          )
        )}
      </div>

      {pickError ? (
        <p role="alert" className="text-xs text-destructive">
          {pickError}
        </p>
      ) : null}
    </div>
  );
}
