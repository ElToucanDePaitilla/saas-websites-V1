"use client";

import * as React from "react";

import { MediaUploadButton } from "@/components/backoffice/media/MediaUploadButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { MediaField } from "@/lib/pages";
import { cn } from "@/lib/utils";

/**
 * ============================================================================
 * CHAMPS DE FORMULAIRE PARTAGÉS — Édition de modules (Étapes 3.4 & 7.1)
 * ----------------------------------------------------------------------------
 * Petits composants contrôlés (Client) qui associent un `Label` accessible à un
 * champ (id généré via `useId`) pour homogénéiser les formulaires des modules.
 * Chaque champ est **contrôlé par le store** : `value` + `onChange(next)` — le
 * parent (éditeur de module) reconstruit l'objet `content` (immuable) puis le
 * commit via `updateModule` (réactivité immédiate, zéro rechargement).
 *
 * Ajouts 7.1 (rubrique Héro « no-tech ») :
 *   - `HelpTip` / `LabelWithTip` : icône « i » + tooltip explicatif accessible ;
 *   - prop `tip` sur `TextField`/`TextAreaField` ;
 *   - `SelectField` générique (options typées + tooltip + aide).
 *
 * - `TextField` : input texte sur une ligne.
 * - `TextAreaField` : zone de texte multi-lignes.
 * - `MediaFields` : paire URL + Alt SEO d'un média (réutilisée par hero/about).
 *
 * Référence : plans/ROADMAP-3.4-crud-expanded.md §1.3 —
 *             plans/ROADMAP-7.1-hero-static-basehero.md §3
 * ============================================================================
 */

/* --------------------------------------------------------------------------
   Tooltip explicatif « i » (aucune dépendance Radix — CSS pur accessible)
   -------------------------------------------------------------------------- */

type HelpTipProps = {
  tip: string;
};

/** Icône « i » qui révèle une explication au survol / focus clavier. */
export function HelpTip({ tip }: HelpTipProps) {
  return (
    <span className="group relative inline-flex">
      <span
        tabIndex={0}
        role="button"
        aria-label={tip}
        className="inline-flex size-3.5 cursor-help items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground ring-1 ring-inset ring-border transition-colors group-hover:bg-accent group-hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        i
      </span>
      <span
        role="tooltip"
        className="pointer-events-none absolute top-full left-1/2 z-20 mt-1.5 w-60 -translate-x-1/2 rounded-md bg-foreground px-2.5 py-1.5 text-xs font-normal leading-snug text-background opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {tip}
      </span>
    </span>
  );
}

type LabelWithTipProps = {
  label: string;
  htmlFor: string;
  tip?: string;
};

/** Label accessible + tooltip « i » optionnel. */
export function LabelWithTip({ label, htmlFor, tip }: LabelWithTipProps) {
  return (
    <div className="flex items-center gap-1.5">
      <Label htmlFor={htmlFor} className="text-xs font-medium text-foreground">
        {label}
      </Label>
      {tip ? <HelpTip tip={tip} /> : null}
    </div>
  );
}

/* --------------------------------------------------------------------------
   Textes
   -------------------------------------------------------------------------- */

type TextFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  /** Explication affichée dans le tooltip « i » du label. */
  tip?: string;
  type?: string;
  mono?: boolean;
  autoComplete?: string;
  className?: string;
};

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  tip,
  type = "text",
  mono = false,
  autoComplete,
  className,
}: TextFieldProps) {
  const id = React.useId();
  return (
    <div className={cn("grid gap-1.5", className)}>
      <LabelWithTip label={label} tip={tip} htmlFor={id} />
      <Input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        className={cn(mono && "font-mono")}
      />
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

type TextAreaFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  tip?: string;
  rows?: number;
  className?: string;
};

export function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  tip,
  rows,
  className,
}: TextAreaFieldProps) {
  const id = React.useId();
  return (
    <div className={cn("grid gap-1.5", className)}>
      <LabelWithTip label={label} tip={tip} htmlFor={id} />
      <Textarea
        id={id}
        value={value}
        placeholder={placeholder}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
      />
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

/* --------------------------------------------------------------------------
   Select générique typé
   -------------------------------------------------------------------------- */

type SelectOption<T extends string> = {
  value: T;
  label: string;
};

type SelectFieldProps<T extends string> = {
  label: string;
  value: T;
  options: readonly SelectOption<T>[];
  onChange: (value: T) => void;
  tip?: string;
  hint?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
  tip,
  hint,
  placeholder,
  disabled = false,
  className,
}: SelectFieldProps<T>) {
  const id = React.useId();
  return (
    <div className={cn("grid gap-1.5", className)}>
      <LabelWithTip label={label} tip={tip} htmlFor={id} />
      <Select
        value={value}
        disabled={disabled}
        onValueChange={(next) => onChange(next as T)}
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

/* --------------------------------------------------------------------------
   Média simple (URL + Alt SEO)
   -------------------------------------------------------------------------- */

type MediaFieldsProps = {
  labelUrl?: string;
  labelAlt?: string;
  value: MediaField;
  onChange: (media: MediaField) => void;
  className?: string;
};

/** Édition d'un média : URL + texte alternatif (SEO). */
export function MediaFields({
  labelUrl = "URL de l’image",
  labelAlt = "Texte alternatif (SEO)",
  value,
  onChange,
  className,
}: MediaFieldsProps) {
  return (
    <div className={cn("grid gap-3", className)}>
      {/* Upload local direct — pré-remplit url (+ alt par défaut). */}
      <MediaUploadButton
        onUploaded={(url, alt) =>
          onChange({ ...value, url, alt: value.alt || alt })
        }
      />
      <TextField
        label={labelUrl}
        value={value.url}
        placeholder="https://…"
        hint="Collez une URL d’image (WebP recommandé, 80 %)."
        onChange={(url) => onChange({ ...value, url })}
      />
      <TextField
        label={labelAlt}
        value={value.alt}
        placeholder="Description de l’image"
        hint="Décrivez l’image pour le référencement et l’accessibilité."
        onChange={(alt) => onChange({ ...value, alt })}
      />
    </div>
  );
}
