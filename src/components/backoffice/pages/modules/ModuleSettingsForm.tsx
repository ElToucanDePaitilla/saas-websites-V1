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
import { cn } from "@/lib/utils";

import { TextField } from "./form-fields";

/**
 * ============================================================================
 * RÉGLAGES GÉNÉRAUX D'UN MODULE (Étape 3.4)
 * ----------------------------------------------------------------------------
 * Formulaire contrôlé par le store (réactivité immédiate) éditant les champs
 * scalaires partagés d'un `PageModule` :
 *   1. Titre d'affichage (`title` — mis à jour en direct dans le bandeau 3.3) ;
 *   2. Ancre `#id` (`anchorId` — validation légère + alerte doublon) ;
 *   3. Animation d'entrée (`animation` — `Select`).
 * Chaque champ appelle `onChange(patch)` → l'action store `updateModule`.
 *
 * Aucun bouton d'enregistrement : chaque frappe persiste instantanément.
 *
 * Référence : plans/ROADMAP-3.4-crud-expanded.md §1.3.1
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
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <TextField
          label="Titre d’affichage"
          value={module.title}
          hint="Libellé visible dans le bandeau et le menu du site."
          onChange={(title) => onChange({ title })}
        />

        {/* Ancre #id */}
        <div className="grid gap-1.5">
          <label className="text-xs font-medium text-foreground" htmlFor="module-anchor">
            Ancre #id
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
              Identifiant HTML utilisé pour les liens internes.
            </p>
          )}
        </div>

        {/* Animation d'entrée */}
        <div className="grid gap-1.5">
          <label
            className="text-xs font-medium text-foreground"
            htmlFor="module-animation"
          >
            Animation d’entrée
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
            Surcharge l’animation d’entrée du thème pour ce bloc.
          </p>
        </div>
      </div>

      {/* Petit rappel visuel de l'état (non bloquant) */}
      <p
        className={cn(
          "rounded-md border border-dashed border-border bg-background/50 px-3 py-2 text-xs text-muted-foreground",
          module.hidden && "border-destructive/40 text-destructive"
        )}
      >
        {module.hidden
          ? "Module actuellement masqué sur le site public (Toggle Eye)."
          : "Module visible sur le site public."}
      </p>
    </div>
  );
}
