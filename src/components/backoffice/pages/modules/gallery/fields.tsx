"use client";

import * as React from "react";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

import { HelpTip } from "../form-fields";
import { EDITOR_TYPE } from "../editor-type";

/**
 * ============================================================================
 * CHAMPS PARTAGÉS DES PANNEAUX GALERIE (Phase 11)
 * ----------------------------------------------------------------------------
 * Deux petits champs contrôlés réutilisés par les panneaux de réglages :
 *   - `ColorField`  : sélecteur de couleur (natif) + saisie hexadécimale ;
 *   - `SwitchField` : interrupteur décrit (label + aide), aligné à droite.
 * ============================================================================
 */

type ColorFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  className?: string;
};

export function ColorField({
  label,
  value,
  onChange,
  hint,
  className,
}: ColorFieldProps) {
  const id = React.useId();
  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label htmlFor={id} className={EDITOR_TYPE.fieldLabel}>
        {label}
      </Label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="size-9 shrink-0 cursor-pointer rounded-md border border-border bg-transparent p-0.5"
        />
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-9 min-w-0 flex-1 rounded-md border bg-transparent px-3 font-mono text-sm outline-none focus-visible:ring-[3px]"
        />
      </div>
      {hint ? <p className={EDITOR_TYPE.hint}>{hint}</p> : null}
    </div>
  );
}

type SwitchFieldProps = {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  tip?: string;
  className?: string;
};

export function SwitchField({
  label,
  description,
  checked,
  onChange,
  tip,
  className,
}: SwitchFieldProps) {
  const id = React.useId();
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-md border border-dashed border-border bg-background/40 px-3 py-2",
        className
      )}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <Label htmlFor={id} className={EDITOR_TYPE.fieldLabel}>
            {label}
          </Label>
          {tip ? <HelpTip tip={tip} /> : null}
        </div>
        {description ? (
          <p className={cn("mt-0.5", EDITOR_TYPE.hint)}>{description}</p>
        ) : null}
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
