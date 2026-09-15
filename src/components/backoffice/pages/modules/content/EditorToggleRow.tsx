"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

import { EDITOR_TYPE } from "../editor-type";

/**
 * ============================================================================
 * LIGNE D'INTERRUPTEUR D'ÉDITEUR — composant partagé (Étape 12.2)
 * ----------------------------------------------------------------------------
 * Associe un **libellé** (N4 de l'échelle), une **aide facultative** (N5) et un
 * interrupteur. Extrait pour être consommé par plusieurs zones d'un même
 * éditeur — mise en page, en-tête — sans dupliquer ni le balisage ni les
 * classes.
 *
 * L'`id` est fourni par l'appelant : c'est lui qui sait à quoi l'interrupteur
 * se rapporte, et le `<Label htmlFor>` garantit le clic sur le texte.
 * ============================================================================
 */

type ToggleRowProps = {
  /** Identifiant du contrôle (associe le libellé à l'interrupteur). */
  id: string;
  /** Libellé du réglage — nomme ce que l'interrupteur commande. */
  label: string;
  /** Explication facultative, sous le libellé. */
  hint?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export function ToggleRow({
  id,
  label,
  hint,
  checked,
  onChange,
}: ToggleRowProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="grid gap-1">
        <Label htmlFor={id} className={EDITOR_TYPE.fieldLabel}>
          {label}
        </Label>
        {hint ? <p className={EDITOR_TYPE.hint}>{hint}</p> : null}
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
