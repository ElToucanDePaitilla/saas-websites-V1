"use client";

import { AlertCircle } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  moduleAnimationLabels,
  moduleAnimationOrder,
  type ModuleAnimation,
  type PageModule,
} from "@/lib/pages";

import { TextField } from "./form-fields";

/**
 * ============================================================================
 * RÉGLAGES TECHNIQUES D'UN MODULE (Étape 3.4 — révisé en 11.17)
 * ----------------------------------------------------------------------------
 * Édite les trois champs **scalaires techniques** d'un `PageModule` :
 *   1. `title`     — nom de la section **dans le back-office** (vérifié en 11.17 :
 *                    jamais rendu sur le site public, il n'alimente que le
 *                    bandeau d'accordéon et les dialogues de suppression) ;
 *   2. `anchorId`  — identifiant HTML utilisé par les liens internes ;
 *   3. `animation` — animation d'apparition du bloc.
 *
 * Étape 11.17 : ce formulaire n'est plus affiché en tête de l'éditeur. Les trois
 * champs sont regroupés dans une zone **« Réglages avancés » repliée**, en fin de
 * formulaire : ils ne concernent pas le contenu que le photographe compose
 * (principes P4/P5 de plans/ROADMAP-11.17-editor-zones-ux.md §1).
 *
 * Retirés en 11.17 :
 *   - le réglage « Animation au survol de la photo », **dupliqué** avec celui de
 *     `GalleryLayoutPanel` — deux contrôles écrivaient la même valeur
 *     `layout.hoverAnimation` (plan 11.17 §0.4 et §3.2) ;
 *   - le rappel « Module visible / masqué », redondant avec le Toggle Eye et le
 *     badge « Masquée » du bandeau (`ModuleRow`).
 *
 * Aucun bouton d'enregistrement : chaque frappe persiste instantanément.
 *
 * Références : plans/ROADMAP-3.4-crud-expanded.md §1.3.1 —
 *              plans/ROADMAP-11.17-editor-zones-ux.md §2 et §3.2
 * ============================================================================
 */

type ModuleSettingsFormProps = {
  module: PageModule;
  /** true si l'ancre courante est déjà utilisée par un autre module de la page. */
  duplicateAnchor: boolean;
  /** Applique un patch scalaire au module (→ updateModule). */
  onChange: (patch: Partial<PageModule>) => void;
};

/** Caractères autorisés pour une ancre HTML (vide autorisé). */
const ANCHOR_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9-]*$/;

export function ModuleSettingsForm({
  module,
  duplicateAnchor,
  onChange,
}: ModuleSettingsFormProps) {
  const anchorInvalid =
    module.anchorId.length > 0 && !ANCHOR_PATTERN.test(module.anchorId);

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          label="Nom de la section dans le back-office"
          value={module.title}
          hint="N’apparaît pas sur le site public : sert à reconnaître la section dans la liste de l’éditeur."
          onChange={(title) => onChange({ title })}
        />

        {/* Identifiant HTML — le mot « ancre » est conservé dans l'aide (P4). */}
        <div className="grid gap-1.5">
          <label className="text-xs font-medium text-foreground" htmlFor="module-anchor">
            Identifiant de la section pour les liens
          </label>
          <div className="flex items-center">
            <span
              aria-hidden="true"
              className="border-input bg-muted/50 text-muted-foreground flex h-9 items-center rounded-l-md border border-r-0 px-2.5 font-mono text-sm"
            >
              #
            </span>
            <input
              id="module-anchor"
              type="text"
              value={module.anchorId}
              placeholder="ex. prestations-mariage"
              aria-invalid={anchorInvalid || duplicateAnchor}
              aria-describedby={
                anchorInvalid || duplicateAnchor ? "module-anchor-help" : undefined
              }
              onChange={(event) => onChange({ anchorId: event.target.value })}
              className="border-input focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive flex h-9 min-w-0 flex-1 rounded-r-md border bg-transparent px-3 font-mono text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px]"
            />
          </div>
          {anchorInvalid || duplicateAnchor ? (
            <p
              id="module-anchor-help"
              role="alert"
              className="flex items-center gap-1.5 text-xs text-destructive"
            >
              <AlertCircle aria-hidden="true" className="size-3.5 shrink-0" />
              {anchorInvalid
                ? "Lettres, chiffres et tirets uniquement (sans espaces ni accents)."
                : "Cette ancre est déjà utilisée dans la page."}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Cet identifiant (appelé « ancre ») permet à un bouton ou à un lien
              de menu de pointer directement vers cette section.
            </p>
          )}
        </div>

        {/* Animation d'apparition — pour la famille Héro statique, elle se règle
            dans la rubrique « Animations & Effets » du contenu (7.1, source
            unique du scalaire `module.animation`). */}
        {module.content.type === "hero" && module.content.variant === "static" ? (
          <div className="grid gap-1.5">
            <p className="text-xs text-muted-foreground">
              L’animation d’apparition de cette section se règle dans la rubrique
              « Animations & Effets » de son contenu.
            </p>
          </div>
        ) : (
          <div className="grid gap-1.5">
            <label
              className="text-xs font-medium text-foreground"
              htmlFor="module-animation"
            >
              Animation d’apparition du bloc
            </label>
            <Select
              value={module.animation}
              onValueChange={(value) =>
                onChange({ animation: value as ModuleAnimation })
              }
            >
              <SelectTrigger id="module-animation" className="w-full">
                <SelectValue placeholder="Choisir une animation" />
              </SelectTrigger>
              <SelectContent>
                {moduleAnimationOrder.map((animation) => (
                  <SelectItem key={animation} value={animation}>
                    {moduleAnimationLabels[animation]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Comment cette section apparaît lorsque le visiteur arrive sur la
              page.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
