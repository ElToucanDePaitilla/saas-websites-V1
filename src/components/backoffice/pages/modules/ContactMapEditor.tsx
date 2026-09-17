"use client";

import * as React from "react";

import { ColorField } from "@/components/backoffice/shared/ColorField";
import {
  contactAlignLabels,
  contactAlignOrder,
  contactFrameColorTokenLabels,
  contactFrameColorTokenOrder,
  contactMapBgVariantLabels,
  contactMapBgVariantOrder,
  contactMapFilterStyleLabels,
  contactMapFilterStyleOrder,
  contactMapOverlayIntensityLabels,
  contactMapOverlayIntensityOrder,
  contactMapPositionLabels,
  contactMapPositionOrder,
  contactMapTypeLabels,
  contactMapTypeOrder,
  createContactMapContent,
  resolveContactMapContent,
  type ContactAlign,
  type ContactFrameColorToken,
  type ContactFrameSettings,
  type ContactMapBgVariant,
  type ContactMapContent,
  type ContactMapFilterStyle,
  type ContactMapOverlayIntensity,
  type ContactMapPosition,
  type ContactMapStyleSettings,
  type ContactMapType,
  type ModuleContent,
} from "@/lib/pages";
import { useOwnerProfile } from "@/lib/owner-profile";

import { EditorSubZone, EditorZone } from "./EditorZone";
import {
  parseBounded,
  SelectField,
  TextAreaField,
  TextField,
} from "./form-fields";
import { SwitchField } from "./gallery/fields";

/**
 * ============================================================================
 * ÉDITEUR DE CONTENU — Module « Contact Map » (Étape 14.2)
 * ----------------------------------------------------------------------------
 * Cinq `EditorZone` :
 *   1. 📝 Chapeau — titre (H2), sous-titre (H3), paragraphe, alignement ;
 *   2. 🧭 Disposition — carte à gauche ou à droite (l'ordre des deux conteneurs) ;
 *   3. 📍 Adresse & carte — adresse (profil ou libre), zoom, type de plan ;
 *   4. ℹ️ Informations pratiques — parking, horaires, zone, bouton d'itinéraire ;
 *   5. 🎨 Apparence — fond de section, cadre partagé, filtre, voile.
 *
 * Trois partis pris :
 *   - **un seul cadre** pour les deux conteneurs (D6) : la couleur est un
 *     **jeton de thème** et non une pipette — un hex stocké figerait la teinte
 *     et casserait le mode sombre ;
 *   - l'adresse du profil est **lue au rendu** (D3) : l'éditeur se contente de
 *     montrer ce que le profil contient et de désactiver le champ libre, sans
 *     jamais recopier l'adresse dans le contenu — sinon la corriger dans le
 *     profil ne changerait plus la carte ;
 *   - `ColorField` n'apparaît qu'en fond `custom` : un réglage sans objet est un
 *     piège (précédent `ctaShow` / `social.colorMode`).
 * ============================================================================
 */

type ContactMapEditorProps = {
  content: Extract<ModuleContent, { type: "contact-map" }>;
  onChangeContent: (content: ContactMapContent) => void;
};

export function ContactMapEditor({
  content,
  onChangeContent,
}: ContactMapEditorProps) {
  // Contenu **complet** avant édition : un JSONB tronqué ne doit pas faire
  // apparaître d'`undefined` dans les champs.
  const map = React.useMemo<ContactMapContent>(
    () => resolveContactMapContent(content),
    [content]
  );

  const { profile } = useOwnerProfile();
  const profileAddress = profile.address.trim();

  type ContactMapPatch = Partial<Omit<ContactMapContent, "type">>;

  function patch(next: ContactMapPatch) {
    onChangeContent({
      ...map,
      // `??` et non `||` : un champ vidé doit rester vide.
      title: next.title ?? map.title,
      subtitle: next.subtitle ?? map.subtitle,
      description: next.description ?? map.description,
      headerAlignment: next.headerAlignment ?? map.headerAlignment,
      mapPosition: next.mapPosition ?? map.mapPosition,
      useOwnerAddress: next.useOwnerAddress ?? map.useOwnerAddress,
      customAddress: next.customAddress ?? map.customAddress,
      zoom: next.zoom ?? map.zoom,
      mapType: next.mapType ?? map.mapType,
      showAddressGroup: next.showAddressGroup ?? map.showAddressGroup,
      showParking: next.showParking ?? map.showParking,
      parkingText: next.parkingText ?? map.parkingText,
      showHoraires: next.showHoraires ?? map.showHoraires,
      horairesText: next.horairesText ?? map.horairesText,
      showZoneIntervention:
        next.showZoneIntervention ?? map.showZoneIntervention,
      zoneInterventionText:
        next.zoneInterventionText ?? map.zoneInterventionText,
      showDirectionsButton:
        next.showDirectionsButton ?? map.showDirectionsButton,
      style: next.style ?? map.style,
    });
  }

  function patchStyle(next: Partial<ContactMapStyleSettings>) {
    patch({ style: { ...map.style, ...next } });
  }

  function patchFrameStyle(next: Partial<ContactFrameSettings>) {
    patchStyle({ frame: { ...map.style.frame, ...next } });
  }

  return (
    <div className="grid gap-4">
      {/* ---- Zone 1 — le chapeau ---- */}
      <EditorZone
        tone="content"
        title="Chapeau"
        scope="Le titre, le sous-titre et la phrase d’introduction affichés au-dessus de la carte."
      >
        <TextField
          label="Titre de la section (H2)"
          value={map.title}
          placeholder="Ex. Nous trouver"
          onChange={(title) => patch({ title })}
        />
        <TextField
          label="Sous-titre (H3)"
          value={map.subtitle}
          placeholder="Ex. Le studio, le parking et les horaires"
          onChange={(subtitle) => patch({ subtitle })}
        />
        <TextAreaField
          label="Phrase d’introduction"
          value={map.description}
          rows={2}
          hint="Quelques mots d’accroche. Les retours à la ligne sont conservés."
          onChange={(description) => patch({ description })}
        />
        <SelectField<ContactAlign>
          label="Alignement du chapeau"
          value={map.headerAlignment}
          options={contactAlignOrder.map((value) => ({
            value,
            label: contactAlignLabels[value],
          }))}
          onChange={(headerAlignment) => patch({ headerAlignment })}
        />
      </EditorZone>

      {/* ---- Zone 2 — disposition des conteneurs ---- */}
      <EditorZone
        tone="content"
        title="Disposition"
        scope="L’ordre des deux conteneurs sur grand écran. Sur téléphone, ils s’empilent toujours dans cet ordre."
      >
        <SelectField<ContactMapPosition>
          label="Position de la carte"
          value={map.mapPosition}
          options={contactMapPositionOrder.map((value) => ({
            value,
            label: contactMapPositionLabels[value],
          }))}
          onChange={(mapPosition) => patch({ mapPosition })}
        />
      </EditorZone>

      {/* ---- Zone 3 — adresse et carte ---- */}
      <EditorZone
        tone="detail"
        title="Adresse & carte"
        scope="Ce que la carte affiche et jusqu’où elle est zoomée. L’adresse du profil reste dans votre profil : la modifier là-bas met à jour toutes les cartes."
      >
        <SwitchField
          label="Utiliser l’adresse de mon profil"
          description="Décoché, la carte utilise l’adresse personnalisée ci-dessous."
          checked={map.useOwnerAddress}
          onChange={(useOwnerAddress) => patch({ useOwnerAddress })}
        />
        <TextField
          label="Adresse personnalisée"
          value={map.customAddress}
          disabled={map.useOwnerAddress && profileAddress !== ""}
          placeholder="Ex. 12 rue des Lilas, 75011 Paris"
          hint={
            map.useOwnerAddress
              ? profileAddress !== ""
                ? `Adresse de votre profil : ${profileAddress}`
                : "Aucune adresse dans votre profil : cette adresse personnalisée est utilisée en repli."
              : "Utilisée telle quelle dans la carte et le lien d’itinéraire."
          }
          onChange={(customAddress) => patch({ customAddress })}
        />
        <SwitchField
          label="Afficher le bloc adresse"
          description="Masque l’adresse dans le conteneur d’informations, sans la retirer de la carte."
          checked={map.showAddressGroup}
          onChange={(showAddressGroup) => patch({ showAddressGroup })}
        />

        <EditorSubZone title="Carte">
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField
              label="Niveau de zoom"
              type="number"
              value={String(map.zoom)}
              onChange={(value) => {
                const parsed = parseBounded(value, 1, 20);
                if (parsed !== null) {
                  patch({ zoom: parsed });
                }
              }}
              hint="De 1 (monde) à 20 (rue). 15 = quartier."
            />
            <SelectField<ContactMapType>
              label="Type de plan"
              value={map.mapType}
              options={contactMapTypeOrder.map((value) => ({
                value,
                label: contactMapTypeLabels[value],
              }))}
              onChange={(mapType) => patch({ mapType })}
              hint="Le satellite est un affichage « au mieux » de Google, sans clé."
            />
          </div>
        </EditorSubZone>
      </EditorZone>

      {/* ---- Zone 4 — informations pratiques ---- */}
      <EditorZone
        tone="detail"
        title="Informations pratiques"
        scope="Les informations affichées à côté de la carte. Chaque rubrique se masque sans perdre son texte."
      >
        <SwitchField
          label="Afficher le parking"
          checked={map.showParking}
          onChange={(showParking) => patch({ showParking })}
        />
        <TextField
          label="Parking"
          value={map.parkingText}
          disabled={!map.showParking}
          placeholder="Ex. Parking Indigo Voltaire, à 150 mètres."
          onChange={(parkingText) => patch({ parkingText })}
        />

        <SwitchField
          label="Afficher les horaires"
          checked={map.showHoraires}
          onChange={(showHoraires) => patch({ showHoraires })}
        />
        <TextAreaField
          label="Horaires"
          value={map.horairesText}
          rows={2}
          disabled={!map.showHoraires}
          hint="Texte libre : les retours à la ligne sont conservés."
          onChange={(horairesText) => patch({ horairesText })}
        />

        <SwitchField
          label="Afficher la zone d’intervention"
          checked={map.showZoneIntervention}
          onChange={(showZoneIntervention) => patch({ showZoneIntervention })}
        />
        <TextAreaField
          label="Zone d’intervention"
          value={map.zoneInterventionText}
          rows={2}
          disabled={!map.showZoneIntervention}
          onChange={(zoneInterventionText) =>
            patch({ zoneInterventionText })
          }
        />

        <SwitchField
          label="Afficher le bouton « Obtenir l’itinéraire »"
          description="Le bouton n’apparaît que si une adresse est disponible."
          checked={map.showDirectionsButton}
          onChange={(showDirectionsButton) => patch({ showDirectionsButton })}
        />
      </EditorZone>

      {/* ---- Zone 5 — apparence ---- */}
      <EditorZone
        tone="style"
        title="Apparence"
        scope="Le fond de la section, le cadre des deux conteneurs, le filtre et le voile de la carte."
      >
        <EditorSubZone title="Fond de la section">
          <SelectField<ContactMapBgVariant>
            label="Fond"
            value={map.style.bgVariant}
            options={contactMapBgVariantOrder.map((value) => ({
              value,
              label: contactMapBgVariantLabels[value],
            }))}
            onChange={(bgVariant) => patchStyle({ bgVariant })}
          />
          {/* Un réglage sans objet est un piège : la couleur ne se règle que sur
              un fond personnalisé. La valeur, elle, est conservée. */}
          {map.style.bgVariant === "custom" ? (
            <ColorField
              label="Couleur du fond"
              value={map.style.customBgColor}
              fallback={map.style.customBgColor}
              ariaLabel="Couleur de fond de la section plan d’accès"
              onChange={(customBgColor) => patchStyle({ customBgColor })}
            />
          ) : null}
        </EditorSubZone>

        <EditorSubZone title="Cadre des conteneurs">
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField
              label="Épaisseur du trait (px)"
              type="number"
              value={String(map.style.frame.borderWidth)}
              onChange={(value) => {
                const parsed = parseBounded(value, 0, 8);
                if (parsed !== null) {
                  patchFrameStyle({ borderWidth: parsed });
                }
              }}
              hint="0 = sans cadre."
            />
            <TextField
              label="Arrondi des angles (px)"
              type="number"
              value={String(map.style.frame.borderRadius)}
              onChange={(value) => {
                const parsed = parseBounded(value, 0, 24);
                if (parsed !== null) {
                  patchFrameStyle({ borderRadius: parsed });
                }
              }}
              hint="2 px par défaut."
            />
          </div>
          <SelectField<ContactFrameColorToken>
            label="Couleur du trait"
            value={map.style.frame.borderColorToken}
            options={contactFrameColorTokenOrder.map((value) => ({
              value,
              label: contactFrameColorTokenLabels[value],
            }))}
            onChange={(borderColorToken) =>
              patchFrameStyle({ borderColorToken })
            }
            hint="Couleur du thème : elle suit le mode clair/sombre."
          />
        </EditorSubZone>

        <EditorSubZone title="Carte">
          <SelectField<ContactMapFilterStyle>
            label="Filtre"
            value={map.style.mapFilterStyle}
            options={contactMapFilterStyleOrder.map((value) => ({
              value,
              label: contactMapFilterStyleLabels[value],
            }))}
            onChange={(mapFilterStyle) => patchStyle({ mapFilterStyle })}
            hint="« Fondu au fond » n’agit qu’avec un voile non nul."
          />
          <SelectField<ContactMapOverlayIntensity>
            label="Voile"
            value={map.style.overlayIntensity}
            options={contactMapOverlayIntensityOrder.map((value) => ({
              value,
              label: contactMapOverlayIntensityLabels[value],
            }))}
            onChange={(overlayIntensity) => patchStyle({ overlayIntensity })}
            hint="Teinte le plan pour l’accorder à la charte."
          />
        </EditorSubZone>
      </EditorZone>

      <div className="flex justify-end border-t border-border pt-3">
        <button
          type="button"
          onClick={() => onChangeContent(createContactMapContent())}
          className="rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          Réinitialiser à la démonstration
        </button>
      </div>
    </div>
  );
}
