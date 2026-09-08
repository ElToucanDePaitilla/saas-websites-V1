"use client";

import * as React from "react";

import { MediaUploadButton } from "@/components/backoffice/media/MediaUploadButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { MediaField } from "@/lib/pages";
import { cn } from "@/lib/utils";

/**
 * ============================================================================
 * CHAMPS DE FORMULAIRE PARTAGÉS — Édition de modules (Étape 3.4)
 * ----------------------------------------------------------------------------
 * Petits composants contrôlés (Client) qui associent un `Label` accessible à un
 * champ (id généré via `useId`) pour homogénéiser les formulaires des modules.
 * Chaque champ est **contrôlé par le store** : `value` + `onChange(next)` — le
 * parent (éditeur de module) reconstruit l'objet `content` (immuable) puis le
 * commit via `updateModule` (réactivité immédiate, zéro rechargement).
 *
 * - `TextField` : input texte sur une ligne.
 * - `TextAreaField` : zone de texte multi-lignes.
 * - `MediaFields` : paire URL + Alt SEO d'un média (réutilisée par hero/about).
 *
 * Référence : plans/ROADMAP-3.4-crud-expanded.md §1.3
 * ============================================================================
 */

type TextFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
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
  type = "text",
  mono = false,
  autoComplete,
  className,
}: TextFieldProps) {
  const id = React.useId();
  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label htmlFor={id} className="text-xs font-medium text-foreground">
        {label}
      </Label>
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
  rows?: number;
  className?: string;
};

export function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  rows,
  className,
}: TextAreaFieldProps) {
  const id = React.useId();
  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label htmlFor={id} className="text-xs font-medium text-foreground">
        {label}
      </Label>
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
