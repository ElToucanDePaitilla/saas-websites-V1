"use client";

import * as React from "react";
import { AlertCircle, ArrowRight } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  buildLinkTargetOptions,
  describeLinkTarget,
  detectCtaTargetMode,
  LINK_TARGET_CUSTOM_VALUE,
  LINK_TARGET_NONE_VALUE,
  isExternalHref,
  type LinkTargetIndex,
} from "@/lib/link-targets";
import { cn } from "@/lib/utils";

import { LabelWithTip, TextField } from "./form-fields";
import { useLinkTargetIndex } from "./useLinkTargetIndex";

/**
 * ============================================================================
 * SÉLECTEUR DE LIEN COMPACT — variante « un seul contrôle » (Étape 11.21-D4)
 * ----------------------------------------------------------------------------
 * Même intelligence que `LinkTargetField` (mode **dérivé** de `href`, aucune
 * donnée persistée, cibles réelles issues des `anchorId`), mais dans **un seul
 * menu** : les pages et les sections cohabitent grâce aux en-têtes de groupe
 * (`SelectLabel`), ce qui supprime le choix exclusif à comprendre entre deux
 * menus et ne peut pas produire d'état incohérent.
 *
 * Pourquoi une variante ? L'étape 11.17 a explicitement lutté contre
 * l'empilement de contrôles. Un `LinkTargetField` complet (≈ 5 lignes) répété
 * **par diapositive** du slider serait intenable : ici, chaque bouton n'ajoute
 * qu'une ligne, plus — seulement si nécessaire — le champ libre.
 *
 * Ordre des options (construit par `buildLinkTargetOptions`) :
 *  1. « — Aucune — » ;
 *  2. **Pages** du site ;
 *  3. **Sections de cette page** (le cas le plus fréquent, remonté en tête) ;
 *  4. **Autres sections**, préfixées du titre de leur page ;
 *  5. **« Autre lien (externe)… »** — révèle le champ libre + l'aperçu.
 *
 * Rétrocompatibilité (11.21-D2) : un `href` déjà stocké (`/portfolio`, `#galerie`,
 * `https://…`, orphelin) s'ouvre **déjà positionné** sur la bonne option.
 *
 * Référence : plans/ROADMAP-11.21-cta-link-picker-generalise.md §4.2
 * ============================================================================
 */

/** Explication par défaut du contrôle unique (sections comprises). */
const DEFAULT_TIP =
  "Choisissez une page du site ou l'une de ses sections. Une section est une partie de la page (bannière, galerie, tarifs…) ; son identifiant technique est réglé dans les paramètres de la section.";

type LinkTargetSelectProps = {
  /** `href` courant (source de vérité : le mode en est déduit). */
  value: string;
  onChange: (href: string) => void;
  /** Titre du contrôle (défaut « Destination du bouton »). */
  label?: string;
  /** Explication affichée dans l'infobulle « i » du titre. */
  tip?: string;
  /** Aide affichée sous le contrôle. */
  hint?: string;
  /** Identifiant du `Select` (défaut : généré) — pour un `label` externe. */
  fieldId?: string;
  className?: string;
  /**
   * Index des cibles déjà construit par l'appelant (facultatif). Indispensable
   * au slider : il le calcule **une fois** pour toutes ses diapositives.
   */
  index?: LinkTargetIndex;
};

export function LinkTargetSelect({
  value,
  onChange,
  label = "Destination du bouton",
  tip = DEFAULT_TIP,
  hint,
  fieldId,
  className,
  index: providedIndex,
}: LinkTargetSelectProps) {
  const generatedId = React.useId();
  const selectId = fieldId ?? generatedId;

  const index = useLinkTargetIndex(providedIndex);
  const mode = detectCtaTargetMode(value, index);

  const sections = React.useMemo(() => buildLinkTargetOptions(index), [index]);
  const preview = React.useMemo(
    () => describeLinkTarget(value, index),
    [value, index]
  );

  // Le champ libre est révélé soit parce que la valeur courante est **libre**
  // (externe, protocole, cible orpheline), soit parce que l'auteur vient de
  // choisir « Autre lien (externe)… » — auquel cas `href` peut encore être vide.
  // Sans ce drapeau, `onChange("")` masquerait aussitôt le champ à remplir.
  const [customChosen, setCustomChosen] = React.useState(false);
  const showFreeField = customChosen || mode === "custom";

  // Radix refuse `value=""` : l'absence de destination et la saisie libre ont
  // chacune une valeur sentinelle, jamais stockée (11.21-D2).
  const selectValue =
    mode === "page" || mode === "anchor"
      ? value
      : showFreeField
        ? LINK_TARGET_CUSTOM_VALUE
        : LINK_TARGET_NONE_VALUE;

  function handleSelect(next: string) {
    if (next === LINK_TARGET_NONE_VALUE) {
      setCustomChosen(false);
      onChange("");
      return;
    }
    if (next === LINK_TARGET_CUSTOM_VALUE) {
      setCustomChosen(true);
      // Une destination structurée est effacée avant la saisie libre : le champ
      // doit partir vide, et le mode étant dérivé de `href`, conserver la
      // valeur ferait réafficher l'option précédente.
      if (mode !== "custom") {
        onChange("");
      }
      return;
    }
    setCustomChosen(false);
    onChange(next);
  }

  return (
    <div className={cn("grid gap-1.5", className)}>
      <LabelWithTip label={label} htmlFor={selectId} tip={tip} />

      <Select value={selectValue} onValueChange={handleSelect}>
        <SelectTrigger id={selectId} className="w-full">
          <SelectValue placeholder="— Aucune —" />
        </SelectTrigger>
        <SelectContent>
          {sections.map((section) => (
            <SelectGroup key={section.id}>
              {section.label !== null ? (
                <SelectLabel>{section.label}</SelectLabel>
              ) : null}
              {section.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>

      {showFreeField ? (
        <TextField
          label="Adresse du lien"
          value={value}
          onChange={(next) => {
            setCustomChosen(true);
            onChange(next);
          }}
          placeholder="https://…, mailto:…, tel:…"
          hint={
            isExternalHref(value)
              ? "Le bouton s'ouvrira dans un nouvel onglet."
              : "Adresse d'un site externe, d'un e-mail ou d'un téléphone."
          }
          mono
        />
      ) : null}

      {/* Aperçu : masqué tant que le champ libre n'est pas révélé (D4). */}
      {showFreeField && value.trim() !== "" ? (
        <div className="grid gap-1">
          <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <ArrowRight
              aria-hidden="true"
              className="mt-0.5 size-3.5 shrink-0"
            />
            <span>{preview.text}</span>
          </p>
          {preview.warning !== null ? (
            <p className="flex items-start gap-1.5 text-xs text-orange-600">
              <AlertCircle
                aria-hidden="true"
                className="mt-0.5 size-3.5 shrink-0"
              />
              <span>{preview.warning}</span>
            </p>
          ) : null}
        </div>
      ) : null}

      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
