"use client";

import type { GalleryLightboxSettings } from "@/lib/pages";

import { TextField } from "../form-fields";
import { SwitchField } from "./fields";

/**
 * ============================================================================
 * PANNEAU LIGHTBOX / DIAPORAMA (Phase 11)
 * ----------------------------------------------------------------------------
 * Réglages du diaporama des variantes **dynamic** et **portfolio** : cycle de
 * zoom au double-clic (niveau 1 / niveau 2), zoom HD, EXIF et légendes.
 * ============================================================================
 */

type LightboxSettingsPanelProps = {
  lightbox: GalleryLightboxSettings;
  onChange: (patch: Partial<GalleryLightboxSettings>) => void;
};

export function LightboxSettingsPanel({
  lightbox,
  onChange,
}: LightboxSettingsPanelProps) {
  return (
    <div className="grid gap-3 rounded-md border border-border bg-background/50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Diaporama (Lightbox)
      </p>

      <SwitchField
        label="Zoom HD et double-clic"
        description="Double-clic : niveau 1, puis niveau 2, puis taille originale. Déplacement au clic maintenu."
        checked={lightbox.zoomEnabled}
        onChange={(zoomEnabled) => onChange({ zoomEnabled })}
      />

      {lightbox.zoomEnabled ? (
        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="Zoom niveau 1"
            type="number"
            value={String(lightbox.zoomLevel1)}
            onChange={(value) => {
              const parsed = Number.parseFloat(value);
              if (!Number.isNaN(parsed)) {
                onChange({ zoomLevel1: Math.min(Math.max(parsed, 1.1), 4) });
              }
            }}
            hint="Facteur du 1er double-clic (défaut 1,5)."
          />
          <TextField
            label="Zoom niveau 2"
            type="number"
            value={String(lightbox.zoomLevel2)}
            onChange={(value) => {
              const parsed = Number.parseFloat(value);
              if (!Number.isNaN(parsed)) {
                onChange({ zoomLevel2: Math.min(Math.max(parsed, 1.1), 8) });
              }
            }}
            hint="Facteur du 2e double-clic (défaut 2,5)."
          />
        </div>
      ) : null}

      <SwitchField
        label="Afficher les informations EXIF"
        description="Focale, ouverture, vitesse et sensibilité si disponibles."
        checked={lightbox.showExif}
        onChange={(showExif) => onChange({ showExif })}
      />

      <SwitchField
        label="Afficher la légende"
        description="Titre et description de la photo dans le diaporama."
        checked={lightbox.showCaption}
        onChange={(showCaption) => onChange({ showCaption })}
      />
    </div>
  );
}
