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
    // Étape 11.17 : plus de boîte ni de titre propres — fournis par `EditorZone`.
    <div className="grid gap-3">
      <SwitchField
        label="Agrandir les photos au double-clic"
        description="Un premier double-clic agrandit, un deuxième agrandit davantage, un troisième revient à la taille normale. Déplacement au clic maintenu."
        checked={lightbox.zoomEnabled}
        onChange={(zoomEnabled) => onChange({ zoomEnabled })}
      />

      {lightbox.zoomEnabled ? (
        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="Agrandissement au 1er double-clic"
            type="number"
            value={String(lightbox.zoomLevel1)}
            onChange={(value) => {
              const parsed = Number.parseFloat(value);
              if (!Number.isNaN(parsed)) {
                onChange({ zoomLevel1: Math.min(Math.max(parsed, 1.1), 4) });
              }
            }}
            hint="Facteur d’agrandissement (1,5 = une fois et demie ; défaut 1,5)."
          />
          <TextField
            label="Agrandissement au 2e double-clic"
            type="number"
            value={String(lightbox.zoomLevel2)}
            onChange={(value) => {
              const parsed = Number.parseFloat(value);
              if (!Number.isNaN(parsed)) {
                onChange({ zoomLevel2: Math.min(Math.max(parsed, 1.1), 8) });
              }
            }}
            hint="Facteur d’agrandissement (défaut 2,5)."
          />
        </div>
      ) : null}

      <SwitchField
        label="Afficher les réglages de l’appareil photo"
        description="Focale, ouverture, vitesse et sensibilité — quand ces informations existent dans le fichier de la photo."
        checked={lightbox.showExif}
        onChange={(showExif) => onChange({ showExif })}
      />

      <SwitchField
        label="Afficher le titre et la description de la photo"
        description="S’affichent sous la photo agrandie."
        checked={lightbox.showCaption}
        onChange={(showCaption) => onChange({ showCaption })}
      />
    </div>
  );
}
