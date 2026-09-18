"use client";

import * as React from "react";

import { ColorField } from "@/components/backoffice/shared/ColorField";
import { TopBannerBar } from "@/components/layout/TopBannerBar";
import {
  bannerThemeTokenLabels,
  bannerThemeTokenOrder,
  type BannerColorSettings,
  type BannerThemeToken,
} from "@/lib/pages";
import {
  TOP_BANNER_LIMITS,
  topBannerFontWeightLabels,
  topBannerFontWeightOrder,
  topBannerLetterSpacingLabels,
  topBannerLetterSpacingOrder,
  topBannerTextModeLabels,
  topBannerTextModeOrder,
  type TopBannerGapSetting,
  type TopBannerFontWeight,
  type TopBannerLetterSpacing,
  type TopBannerTextMode,
} from "@/lib/top-banner";
import { useTopBanner } from "@/lib/top-banner-store";

import { EditorSubZone, EditorZone } from "../pages/modules/EditorZone";
import {
  parseBounded,
  SelectField,
  TextField,
} from "../pages/modules/form-fields";
import { SwitchField } from "../pages/modules/gallery/fields";
import { LinkTargetSelect } from "../pages/modules/LinkTargetSelect";

/**
 * ============================================================================
 * ÉCRAN — « Mini-bandeau Alerte / Promo »
 * ----------------------------------------------------------------------------
 * Édition du **réglage global** au-dessus du Header public, branché sur le
 * store partagé `useTopBanner()`. La persistance est assurée par
 * `TopBannerProvider` (débounce 400 ms) : aucune sauvegarde manuelle.
 *
 * L'aperçu de la dernière zone réutilise `TopBannerBar` — le composant qui rend
 * le bandeau public — plutôt que de réécrire un rendu parallèle. Seule la
 * position `fixed` est neutralisée par la variante `top-banner--preview`.
 *
 * Les trois couleurs (fond, texte, gap) partagent le sélecteur du bandeau
 * message/CTA (`BannerColorSettings`) : jeton de thème qui suit la charte, ou
 * valeur libre (palette + pipette). Aucune seconde pipette n'est créée.
 * ============================================================================
 */

/** Sous-bloc de couleur — thème (jeton) ou valeur libre (palette/pipette). */
function ColorSettingFields({
  title,
  setting,
  onChange,
  ariaLabel,
}: {
  title: string;
  setting: BannerColorSettings;
  onChange: (next: BannerColorSettings) => void;
  ariaLabel: string;
}) {
  return (
    <EditorSubZone title={title}>
      <SelectField
        label="Origine de la couleur"
        value={setting.source}
        options={[
          { value: "theme", label: "Couleur du thème (recommandé)" },
          { value: "custom", label: "Couleur libre (palette ou pipette)" },
        ]}
        onChange={(source) =>
          onChange({ ...setting, source: source as "theme" | "custom" })
        }
        tip="Une couleur du thème suit automatiquement le thème du site ; une couleur libre reste figée."
      />
      {setting.source === "theme" ? (
        <SelectField<BannerThemeToken>
          label="Couleur du thème"
          value={setting.token}
          options={bannerThemeTokenOrder.map((value) => ({
            value,
            label: bannerThemeTokenLabels[value],
          }))}
          onChange={(token) => onChange({ ...setting, token })}
        />
      ) : (
        <ColorField
          label="Couleur"
          value={setting.value}
          fallback={setting.value}
          ariaLabel={ariaLabel}
          onChange={(value) => onChange({ ...setting, value })}
        />
      )}
    </EditorSubZone>
  );
}

/** Sous-bloc d'un gap : interrupteur + hauteur bornée (valeur conservée). */
function GapFields({
  title,
  setting,
  onChange,
}: {
  title: string;
  setting: TopBannerGapSetting;
  onChange: (next: TopBannerGapSetting) => void;
}) {
  return (
    <EditorSubZone title={title}>
      <SwitchField
        label="Activer ce gap"
        description="Réserve une bande de la couleur du gap entre la barre et le contenu."
        checked={setting.enabled}
        onChange={(enabled) => onChange({ ...setting, enabled })}
      />
      {/* Un réglage sans objet est un piège : la hauteur ne s'édite que si le
          gap est actif — la valeur, elle, est conservée pour la réactivation. */}
      <TextField
        label="Hauteur du gap (px)"
        type="number"
        value={String(setting.value)}
        disabled={!setting.enabled}
        onChange={(value) => {
          const parsed = parseBounded(value, 0, TOP_BANNER_LIMITS.gapMax);
          if (parsed !== null) {
            onChange({ ...setting, value: parsed });
          }
        }}
        hint="De 0 à 15 px. La valeur est conservée même si le gap est désactivé."
      />
    </EditorSubZone>
  );
}

export function TopBannerScreen() {
  const { topBanner, update } = useTopBanner();

  return (
    <div className="grid min-w-0 gap-6">
      {/* ---- En-tête ---- */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Bandeau d’alerte
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Message affiché en haut de toutes les pages du site, au-dessus du menu.
          Les modifications sont enregistrées automatiquement.
        </p>
      </div>

      {/* ---- Zone 1 — activation ---- */}
      <EditorZone
        tone="content"
        title="Activation"
        scope="Le bandeau n’apparaît sur le site que s’il est activé et qu’un message est saisi."
      >
        <SwitchField
          label="Afficher le bandeau"
          description="Affiche la barre en haut de toutes les pages publiques."
          checked={topBanner.enabled}
          onChange={(enabled) => update({ enabled })}
        />
      </EditorZone>

      {/* ---- Zone 2 — message & affichage ---- */}
      <EditorZone
        tone="content"
        title="Message et affichage"
        scope="Le texte du bandeau et la façon dont il se présente."
      >
        <TextField
          label="Message"
          value={topBanner.text}
          placeholder="Ex. Offre de rentrée : -20 % sur les séances portrait"
          hint="Un message vide masque le bandeau, même activé."
          onChange={(text) => update({ text })}
        />
        <SelectField<TopBannerTextMode>
          label="Mode d’affichage"
          value={topBanner.textMode}
          options={topBannerTextModeOrder.map((value) => ({
            value,
            label: topBannerTextModeLabels[value],
          }))}
          onChange={(textMode) => update({ textMode })}
        />
        {topBanner.textMode === "marquee" ? (
          <TextField
            label="Durée d’un cycle (secondes)"
            type="number"
            value={String(topBanner.durationSeconds)}
            onChange={(value) => {
              const parsed = parseBounded(
                value,
                TOP_BANNER_LIMITS.durationMin,
                TOP_BANNER_LIMITS.durationMax
              );
              if (parsed !== null) {
                update({ durationSeconds: parsed });
              }
            }}
            hint="20 à 60 s. Un message long semble défiler plus vite."
          />
        ) : null}
      </EditorZone>

      {/* ---- Zone 3 — typographie ---- */}
      <EditorZone
        tone="style"
        title="Typographie"
        scope="La taille, la graisse et l’espacement du message. La police est celle du corps du site."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField
            label="Taille du texte (px)"
            type="number"
            value={String(topBanner.fontSize)}
            onChange={(value) => {
              const parsed = parseBounded(
                value,
                TOP_BANNER_LIMITS.fontSizeMin,
                TOP_BANNER_LIMITS.fontSizeMax
              );
              if (parsed !== null) {
                update({ fontSize: parsed });
              }
            }}
            hint="De 11 à 16 px. Une barre de 15 px peut rogner une police de 16 px."
          />
          <SelectField<TopBannerFontWeight>
            label="Graisse"
            value={topBanner.fontWeight}
            options={topBannerFontWeightOrder.map((value) => ({
              value,
              label: topBannerFontWeightLabels[value],
            }))}
            onChange={(fontWeight) => update({ fontWeight })}
          />
        </div>
        <SelectField<TopBannerLetterSpacing>
          label="Espacement des lettres"
          value={topBanner.letterSpacing}
          options={topBannerLetterSpacingOrder.map((value) => ({
            value,
            label: topBannerLetterSpacingLabels[value],
          }))}
          onChange={(letterSpacing) => update({ letterSpacing })}
        />
      </EditorZone>

      {/* ---- Zone 4 — couleurs ---- */}
      <EditorZone
        tone="style"
        title="Couleurs"
        scope="Le fond de la barre, la couleur du texte et celle des gaps. Chaque couleur suit le thème ou reste figée."
      >
        <ColorSettingFields
          title="Fond de la barre"
          setting={topBanner.background}
          ariaLabel="Couleur de fond du bandeau d’alerte"
          onChange={(background) => update({ background })}
        />
        <ColorSettingFields
          title="Couleur du texte"
          setting={topBanner.textColor}
          ariaLabel="Couleur du texte du bandeau d’alerte"
          onChange={(textColor) => update({ textColor })}
        />
        <ColorSettingFields
          title="Couleur des gaps"
          setting={topBanner.gapColor}
          ariaLabel="Couleur des gaps du bandeau d’alerte"
          onChange={(gapColor) => update({ gapColor })}
        />
      </EditorZone>

      {/* ---- Zone 5 — dimensions & gaps ---- */}
      <EditorZone
        tone="style"
        title="Dimensions et gaps"
        scope="La hauteur de la barre et les bandes éventuelles au-dessus et en dessous."
      >
        <TextField
          label="Hauteur de la barre (px)"
          type="number"
          value={String(topBanner.height)}
          onChange={(value) => {
            const parsed = parseBounded(
              value,
              TOP_BANNER_LIMITS.heightMin,
              TOP_BANNER_LIMITS.heightMax
            );
            if (parsed !== null) {
              update({ height: parsed });
            }
          }}
          hint="De 15 à 50 px. La hauteur totale décalera d’autant le menu et le contenu."
        />
        <GapFields
          title="Gap supérieur"
          setting={topBanner.gapTop}
          onChange={(gapTop) => update({ gapTop })}
        />
        <GapFields
          title="Gap inférieur"
          setting={topBanner.gapBottom}
          onChange={(gapBottom) => update({ gapBottom })}
        />
      </EditorZone>

      {/* ---- Zone 6 — lien ---- */}
      <EditorZone
        tone="action"
        title="Lien"
        scope="La destination ouverte au clic sur le message. Le bouton de fermeture reste indépendant."
      >
        <SwitchField
          label="Rendre le bandeau cliquable"
          checked={topBanner.linkEnabled}
          onChange={(linkEnabled) => update({ linkEnabled })}
        />
        {topBanner.linkEnabled ? (
          <LinkTargetSelect
            label="Destination du bandeau"
            value={topBanner.linkHref}
            onChange={(linkHref) => update({ linkHref })}
          />
        ) : null}
      </EditorZone>

      {/* ---- Zone 7 — aperçu ---- */}
      <EditorZone
        tone="detail"
        title="Aperçu"
        scope="Rendu réel du bandeau avec les réglages en cours. La police et les jetons de thème sont ceux du site public."
        className="min-w-0"
      >
        {topBanner.text.trim() === "" ? (
          <p className="text-xs text-muted-foreground">
            Saisissez un message pour voir l’aperçu.
          </p>
        ) : (
          <TopBannerBar topBanner={topBanner} preview />
        )}
      </EditorZone>
    </div>
  );
}
