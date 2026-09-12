"use client";

import {
  galleryHoverAnimationLabels,
  galleryHoverAnimationOrder,
  galleryItemWording,
  type GalleryHoverAnimation,
  type GalleryLayoutOptions,
  type GalleryModuleVariant,
} from "@/lib/pages";

import { SelectField, TextField } from "../form-fields";
import { SwitchField } from "./fields";

/**
 * ============================================================================
 * BLOC « AU SURVOL DES COUVERTURES » — Galeries (11.17, famille d'effets 11.23)
 * ----------------------------------------------------------------------------
 * Deux familles **indépendantes** :
 *
 *   1. **Effets de survol** — l'interrupteur général (`layout.hoverAnimation`)
 *      puis, quand il est actif, une **famille d'effets optionnels et
 *      cumulables** (`layout.hoverEffects`) :
 *        · **Zoom** — réglage fin, en pourcentage ;
 *        · **Élévation** — réglage fin, en pixels ;
 *        · **Parallaxe** — l'image glisse dans son cadre ;
 *        · **Brillance** — reflet diagonal discret ;
 *        · **Saturation et contraste** — couleurs ravivées ;
 *        · **Bordure lumineuse** — liseré à la couleur d'accent du thème.
 *      Chacun s'active **indépendamment** et se **cumule** aux autres.
 *
 *   2. **Accentuation de la lisibilité** (`layout.hoverOverlay`) — au survol,
 *      l'image s'assombrit **du bas vers le haut** pour que le texte posé sur la
 *      couverture reste lisible. **Découplée** de l'interrupteur général : elle
 *      reste utile quand aucun effet de mouvement n'est activé, et se cumule.
 *
 * Réglages affichés **seulement quand l'interrupteur général est actif** : des
 * contrôles sans effet seraient un piège (l'utilisateur croirait régler quelque
 * chose).
 *
 * Accessibilité : les effets ne se déclenchent que sur un appareil à **survol
 * réel**, le **focus clavier** produit les mêmes effets, et sous
 * `prefers-reduced-motion: reduce` ils sont **supprimés** (voir `globals.css`).
 *
 * Historique : ce panneau avait supprimé un doublon réel en 11.17 —
 * `hoverAnimation` était exposé **deux fois** (`ModuleSettingsForm` et
 * `GalleryLayoutPanel`), les deux écrivant la même valeur. Le voile de lisibilité
 * reste indisponible sur la variante **dynamic** (aucun voile sombre au survol
 * du diaporama, choix de conception de la Phase 11).
 *
 * Références : plans/ROADMAP-11.17-editor-zones-ux.md §4.3 — Étape 11.23.
 * ============================================================================
 */

type GalleryHoverPanelProps = {
  layout: GalleryLayoutOptions;
  variant: GalleryModuleVariant;
  onChange: (patch: Partial<GalleryLayoutOptions>) => void;
};

/**
 * Convertit une saisie en entier **borné** (retourne `null` si invalide).
 * Le bornage est répété côté domaine (`resolveGalleryHoverEffects`) : l'éditeur
 * empêche une saisie absurde, la lecture protège d'une donnée héritée.
 */
function parseBounded(value: string, min: number, max: number): number | null {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    return null;
  }
  return Math.min(Math.max(parsed, min), max);
}

export function GalleryHoverPanel({
  layout,
  variant,
  onChange,
}: GalleryHoverPanelProps) {
  const dynamic = variant === "dynamic";
  const isPortfolio = variant === "portfolio";
  const active = layout.hoverAnimation === "active";
  // Vocabulaire selon la variante : « couvertures d'albums » en portfolio,
  // « photos » sur static / dynamic (zone partagée par les trois).
  const { singular, plural } = galleryItemWording(variant);
  const effects = layout.hoverEffects;

  /** Patch partiel de la famille d'effets : les autres réglages sont préservés. */
  function updateEffects(patch: Partial<GalleryLayoutOptions["hoverEffects"]>) {
    onChange({ hoverEffects: { ...effects, ...patch } });
  }

  return (
    <div className="grid gap-3">
      {/* ---- 1. Interrupteur général ------------------------------------- */}
      <SelectField<GalleryHoverAnimation>
        label={`Effet au survol des ${plural}`}
        value={layout.hoverAnimation}
        options={galleryHoverAnimationOrder.map((value) => ({
          value,
          label: galleryHoverAnimationLabels[value],
        }))}
        onChange={(hoverAnimation) => onChange({ hoverAnimation })}
        hint={`Interrupteur général : commande tous les effets de survol des ${plural}.`}
      />

      {active ? (
        <div className="grid gap-3 rounded-md border border-dashed border-border bg-background/40 p-3">
          <p className="text-[13px] font-semibold leading-snug text-foreground">
            Effets cumulables
          </p>
          <p className="text-xs text-muted-foreground">
            Chaque effet s’active indépendamment des autres et se cumule avec
            eux. Ils ne se déclenchent que sur un appareil doté d’une souris — et
            lorsque le visiteur survole ou sélectionne au clavier la vignette — et
            sont automatiquement neutralisés si le système du visiteur demande de
            limiter les animations.
          </p>

          {/* Réglages fins : les trois seules valeurs chiffrées de la famille. */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <TextField
              label="Zoom (%)"
              type="number"
              value={String(effects.zoom)}
              onChange={(value) => {
                const parsed = parseBounded(value, 100, 118);
                if (parsed !== null) {
                  updateEffects({ zoom: parsed });
                }
              }}
              hint="100 = aucun zoom (100 à 118)."
            />
            <TextField
              label="Élévation (px)"
              type="number"
              value={String(effects.lift)}
              onChange={(value) => {
                const parsed = parseBounded(value, 0, 16);
                if (parsed !== null) {
                  updateEffects({ lift: parsed });
                }
              }}
              hint="Soulèvement de la vignette (0 à 16)."
            />
            <TextField
              label="Parallaxe (px)"
              type="number"
              value={String(effects.parallax)}
              onChange={(value) => {
                const parsed = parseBounded(value, 0, 12);
                if (parsed !== null) {
                  updateEffects({ parallax: parsed });
                }
              }}
              hint="L’image glisse dans son cadre (0 à 12)."
            />
          </div>

          {/* Effets d'ambiance : autonomes et cumulables. */}
          <SwitchField
            label="Brillance discrète"
            description="Un reflet diagonal traverse la vignette."
            checked={effects.shine}
            onChange={(shine) => updateEffects({ shine })}
          />
          <SwitchField
            label="Saturation et contraste"
            description="Les couleurs se ravivent légèrement."
            checked={effects.saturate}
            onChange={(saturate) => updateEffects({ saturate })}
          />
          <SwitchField
            label="Bordure lumineuse"
            description="Un liseré à la couleur d’accent du thème souligne la vignette."
            checked={effects.glow}
            onChange={(glow) => updateEffects({ glow })}
          />
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Aucun effet de survol n’est appliqué : les réglages ci-dessous restent
          sans objet tant que l’interrupteur général est sur « Aucun effet ».
        </p>
      )}

      {/* ---- 2. Lisibilité du texte sur la couverture --------------------- */}
      {dynamic ? (
        <p className="text-xs text-muted-foreground">
          Cette variante n’applique aucune accentuation de lisibilité au survol
          (choix de conception).
        </p>
      ) : (
        <SwitchField
          label="Accentuation de la lisibilité"
          description={
            isPortfolio
              ? "Lors du survol de la couverture de l'album, assombrit l'image depuis le bas de la couverture vers le haut pour améliorer la lisibilité du texte."
              : `Lors du survol d’une ${singular}, assombrit l’image depuis le bas vers le haut pour améliorer la lisibilité du texte.`
          }
          checked={layout.hoverOverlay}
          onChange={(hoverOverlay) => onChange({ hoverOverlay })}
        />
      )}
    </div>
  );
}
