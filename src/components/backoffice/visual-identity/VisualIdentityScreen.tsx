"use client";

import * as React from "react";
import { Loader2, Pipette, UploadCloud } from "lucide-react";

import { isMediaDemoMode, uploadMedia } from "@/lib/media-client";
import { persistVisualIdentity } from "@/lib/persistence-client";
import { siteName } from "@/lib/site";
import {
  TEXT_LINE_PX,
  TEXT_SIZE_LETTER_SPACING,
  VISUAL_IDENTITY_ACCENTS,
  VISUAL_IDENTITY_LIMITS,
  VISUAL_IDENTITY_NEUTRALS,
  VISUAL_IDENTITY_PREVIEW_BG,
  fontWeightLabels,
  fontWeightOrder,
  isVisualIdentityEmpty,
  textSizeLabels,
  textSizeOrder,
  visualIdentityModeLabels,
  visualIdentityModeOrder,
  type VisualIdentityFontWeight,
  type VisualIdentityMode,
  type VisualIdentityTextLine,
  type VisualIdentityTextSize,
} from "@/lib/visual-identity";
import { useVisualIdentity } from "@/lib/visual-identity-store";
import { cn } from "@/lib/utils";

import { HelpTip, SelectField, TextField } from "../pages/modules/form-fields";

/**
 * ============================================================================
 * ÉCRAN — « Identité visuelle / Logo » (Étape 9.1 + amendement 9.1.a)
 * ----------------------------------------------------------------------------
 * Configuration **100 % manuelle** de l'espace marque du Header :
 *   - sélecteur de mode **Texte | Logo** (exclusifs) ;
 *   - mode Texte : **paramètres distincts par ligne** (valeur 35/45, couleur
 *     palette + Hex/RGBA, taille 3 positions, graisse 3 positions, espacement
 *     automatique) ;
 *   - mode Logo : upload contrôlé (.svg/.png/.jpg/.webp, ≤ 2 Mo) + altText ;
 *   - **aperçu en direct** sur fond **neutre médian** (ni blanc ni noir).
 *
 * Aucune valeur n'est extraite du module « Profil » (champs vierges par défaut).
 * ============================================================================
 */

const LOGO_ACCEPT =
  ".svg,.png,.jpg,.jpeg,.webp,image/svg+xml,image/png,image/jpeg,image/webp";
const LOGO_MIME = new Set([
  "image/svg+xml",
  "image/png",
  "image/jpeg",
  "image/webp",
]);

function RubricTitle({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="grid gap-1">
      <h5 className="text-[13px] font-semibold text-foreground">{title}</h5>
      <p className="text-xs leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

/** Contrôles typographiques d'UNE ligne (paramètres indépendants). */
function TextLineFields({
  title,
  description,
  line,
  maxLength,
  placeholder,
  tip,
  onPatch,
}: {
  title: string;
  description: string;
  line: VisualIdentityTextLine;
  maxLength: number;
  placeholder: string;
  tip: string;
  onPatch: (patch: Partial<VisualIdentityTextLine>) => void;
}) {
  const [pickError, setPickError] = React.useState<string | null>(null);

  /** Pipette **écran** (EyeDropper API) — prélève une couleur hors de l'onglet. */
  async function handlePickColor() {
    type EyeDropperResult = { sRGBHex: string };
    type EyeDropperCtor = new () => { open: () => Promise<EyeDropperResult> };
    const Impl = (
      window as unknown as { EyeDropper?: EyeDropperCtor }
    ).EyeDropper;
    if (!Impl) {
      setPickError(
        "Pipette non supportée par ce navigateur (fonctionne sur Chrome/Edge)."
      );
      return;
    }
    try {
      const result = await new Impl().open();
      onPatch({ color: result.sRGBHex });
      setPickError(null);
    } catch {
      // Annulé par l'utilisateur (Échap) → silencieux.
    }
  }

  return (
    <div className="grid gap-3 rounded-lg border border-border bg-background/60 p-3">
      <RubricTitle title={title} description={description} />
      <TextField
        label="Texte"
        value={line.value}
        placeholder={placeholder}
        tip={tip}
        onChange={(value) => onPatch({ value: value.slice(0, maxLength) })}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <SelectField
          label="Taille de la police"
          value={line.size}
          options={textSizeOrder.map((value: VisualIdentityTextSize) => ({
            value,
            label: textSizeLabels[value],
          }))}
          onChange={(size) => onPatch({ size: size as VisualIdentityTextSize })}
          tip="Espacement calculé automatiquement selon la taille."
        />
        <SelectField
          label="Graisse (font-weight)"
          value={line.weight}
          options={fontWeightOrder.map((value: VisualIdentityFontWeight) => ({
            value,
            label: fontWeightLabels[value],
          }))}
          onChange={(weight) =>
            onPatch({ weight: weight as VisualIdentityFontWeight })
          }
          tip="Normal 400 · Semi-gras 600 · Gras 700."
        />
      </div>
      <div className="grid gap-2">
        <span className="flex items-center gap-2 text-xs font-semibold text-foreground">
          Couleur du texte
          <HelpTip tip="Palette prédéfinie ou saisie libre Hex/RGBA (ex. #FFFFFF ou rgba(255,255,255,0.9))." />
        </span>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="color"
            aria-label={`Sélecteur de couleur — ${title}`}
            value={
              /^#[0-9a-fA-F]{6}$/.test(line.color) ? line.color : "#1E293B"
            }
            onChange={(event) => onPatch({ color: event.target.value })}
            className="h-9 w-12 cursor-pointer rounded border border-border bg-background"
          />
          <input
            type="text"
            value={line.color}
            onChange={(event) => onPatch({ color: event.target.value })}
            placeholder="#1E293B"
            className="w-40 rounded-md border border-input bg-background px-3 py-1.5 text-sm"
          />
          <button
            type="button"
            onClick={() => {
              void handlePickColor();
            }}
            title="Pipette — prélever une couleur n’importe où à l’écran (y compris hors de l’onglet)"
            className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-sm transition-colors hover:bg-accent"
          >
            <Pipette className="size-4" /> Pipette
          </button>
        </div>
        {/* Palette sur mesure — rangée neutres puis rangée accents. */}
        <div className="grid gap-1.5">
          {[VISUAL_IDENTITY_NEUTRALS, VISUAL_IDENTITY_ACCENTS].map(
            (row, index) => (
              <div key={index} className="flex flex-wrap gap-1.5">
                {row.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    title={preset}
                    aria-label={`Couleur ${preset}`}
                    onClick={() => onPatch({ color: preset })}
                    style={{ backgroundColor: preset }}
                    className={cn(
                      "size-6 rounded-full border",
                      line.color.toLowerCase() === preset.toLowerCase()
                        ? "border-primary ring-2 ring-primary/40"
                        : "border-border"
                    )}
                  />
                ))}
              </div>
            )
          )}
        </div>
        {pickError ? (
          <p role="alert" className="text-xs text-destructive">
            {pickError}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function VisualIdentityScreen() {
  const { visualIdentity, update } = useVisualIdentity();
  const [savedAt, setSavedAt] = React.useState<string | null>(null);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const { text, logo, mode } = visualIdentity;
  const configured = !isVisualIdentityEmpty(visualIdentity);
  const demo = isMediaDemoMode();

  function setTextLine(
    which: "line1" | "line2",
    patch: Partial<VisualIdentityTextLine>
  ) {
    update({ text: { ...text, [which]: { ...text[which], ...patch } } });
  }
  function setLogo(patch: Partial<typeof logo>) {
    update({ logo: { ...logo, ...patch } });
  }

  async function handleLogoFile(file: File | null | undefined) {
    if (!file) {
      return;
    }
    setUploadError(null);
    if (!LOGO_MIME.has(file.type)) {
      setUploadError("Format non supporté (utilisez .svg, .png, .jpg ou .webp).");
      return;
    }
    if (file.size > VISUAL_IDENTITY_LIMITS.logoMaxBytes) {
      setUploadError("Fichier trop lourd (2 Mo maximum).");
      return;
    }
    setUploading(true);
    try {
      const asset = await uploadMedia(file);
      update({
        logo: {
          url: asset.url,
          altText: logo.altText !== "" ? logo.altText : asset.filename,
        },
      });
    } catch (caught) {
      setUploadError(
        caught instanceof Error ? caught.message : "Upload impossible."
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function save() {
    setSaving(true);
    setSaveError(null);
    try {
      await persistVisualIdentity(visualIdentity);
      setSavedAt(new Date().toLocaleTimeString("fr-FR"));
    } catch {
      setSavedAt(null);
      setSaveError(
        "Enregistrement impossible (base de données indisponible ou erreur serveur)."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6">
      {/* ---- En-tête ---- */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Identité visuelle / Logo
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configurez manuellement l’espace marque de la barre de navigation
            principale (nom en deux lignes ou logo).
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            void save();
          }}
          disabled={saving}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/85 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
      {savedAt ? (
        <p role="status" className="text-xs text-emerald-600">
          Configuration enregistrée dans la base de données à {savedAt}.
        </p>
      ) : null}
      {saveError ? (
        <p role="alert" className="text-xs text-destructive">
          {saveError}
        </p>
      ) : null}

      {/* ============ Mode d'affichage (exclusif) ============ */}
      <section className="grid gap-3 rounded-lg border border-border bg-card p-4">
        <RubricTitle
          title="🎛️ Mode d’affichage"
          description="Choisissez entre un nom en deux lignes ou un logo image."
        />
        <div
          role="radiogroup"
          aria-label="Mode d’affichage de l’espace marque"
          className="inline-flex w-fit rounded-md border border-border bg-background/60 p-1"
        >
          {visualIdentityModeOrder.map((value: VisualIdentityMode) => {
            const active = mode === value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => update({ mode: value })}
                className={cn(
                  "rounded px-4 py-1.5 text-sm transition-colors",
                  active
                    ? "bg-primary font-medium text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {visualIdentityModeLabels[value]}
              </button>
            );
          })}
        </div>
      </section>

      {/* ============ Mode Texte — 2 lignes indépendantes ============ */}
      {mode === "text" ? (
        <section className="grid gap-3 rounded-lg border border-border bg-card p-4">
          <RubricTitle
            title="📝 Texte (saisie manuelle)"
            description="Chaque ligne possède ses propres paramètres (texte, couleur, taille, graisse) — ils sont indépendants."
          />
          <TextLineFields
            title="Ligne 1 (principale)"
            description="Jusqu’à 35 caractères."
            line={text.line1}
            maxLength={VISUAL_IDENTITY_LIMITS.line1Max}
            placeholder="Ex : Nom du propriétaire / Artiste / Société / Marque"
            tip="Obligatoire pour l’affichage texte. 35 caractères maximum."
            onPatch={(patch) => setTextLine("line1", patch)}
          />
          <TextLineFields
            title="Ligne 2 (secondaire)"
            description="Optionnelle — jusqu’à 45 caractères."
            line={text.line2}
            maxLength={VISUAL_IDENTITY_LIMITS.line2Max}
            placeholder="Ex : Qualité / Profession / Titre"
            tip="45 caractères maximum. Réglages indépendants de la ligne 1."
            onPatch={(patch) => setTextLine("line2", patch)}
          />
          <p className="text-xs text-muted-foreground">
            Police héritée de la charte graphique de l’application · Échelle 5
            niveaux (Petite → Énorme) · Ligne 1 : 14/18/22/25/30 px · Ligne 2 :
            12/15/18/21/25 px · « Moyenne » ≈ +25 % du texte du menu et ligne 1
            ≈ +20 % de la ligne 2 · Espacement automatique par ligne.
          </p>
        </section>
      ) : null}

      {/* ============ Mode Logo ============ */}
      {mode === "logo" ? (
        <section className="grid gap-3 rounded-lg border border-border bg-card p-4">
          <RubricTitle
            title="🖼️ Logo image"
            description="Formats .svg, .png, .jpg, .webp — 2 Mo maximum. Rendu contraint à 200 × 60 px (object-fit: contain)."
          />
          <div
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              void handleLogoFile(event.dataTransfer.files?.[0]);
            }}
            className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-background/60 p-6 text-center"
          >
            {demo ? (
              <p className="text-xs text-muted-foreground">
                Upload désactivé en mode démo (Supabase Storage non configuré).
              </p>
            ) : (
              <>
                <UploadCloud className="size-6 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  Glissez-déposez votre logo ici ou
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm transition-colors hover:bg-accent disabled:opacity-60"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Upload en cours…
                    </>
                  ) : (
                    "Choisir un fichier"
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={LOGO_ACCEPT}
                  className="hidden"
                  onChange={(event) =>
                    void handleLogoFile(event.target.files?.[0])
                  }
                />
                <p className="text-[11px] text-muted-foreground">
                  Conseil : privilégiez le format SVG (vectoriel, net à toute
                  taille).
                </p>
              </>
            )}
          </div>
          {uploadError ? (
            <p role="alert" className="text-xs text-destructive">
              {uploadError}
            </p>
          ) : null}
          <TextField
            label="Texte alternatif (alt)"
            value={logo.altText}
            placeholder="Ex : Logo de l’entreprise"
            tip="Décrit le logo pour l’accessibilité et le référencement."
            onChange={(altText) => setLogo({ altText })}
          />
          {logo.url !== "" ? (
            <div className="grid gap-1">
              <p className="text-xs font-semibold text-foreground">
                Logo actuel
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logo.url}
                alt={logo.altText || "Logo"}
                style={{
                  maxWidth: VISUAL_IDENTITY_LIMITS.logoMaxWidth,
                  maxHeight: VISUAL_IDENTITY_LIMITS.logoMaxHeight,
                  backgroundColor: VISUAL_IDENTITY_PREVIEW_BG,
                }}
                className="rounded border border-border object-contain p-1"
              />
            </div>
          ) : null}
        </section>
      ) : null}

      {/* ============ Aperçu en direct ============ */}
      <section className="grid gap-3 rounded-lg border border-border bg-card p-4">
        <RubricTitle
          title="👁️ Aperçu en direct"
          description="Fond neutre (ni blanc ni noir) pour vérifier la lisibilité d’un texte blanc, noir ou gris."
        />
        <div
          className="flex h-16 items-center rounded-lg px-4"
          style={{ backgroundColor: VISUAL_IDENTITY_PREVIEW_BG }}
        >
          {configured ? (
            mode === "logo" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logo.url}
                alt={logo.altText || siteName}
                style={{
                  maxWidth: VISUAL_IDENTITY_LIMITS.logoMaxWidth,
                  maxHeight: VISUAL_IDENTITY_LIMITS.logoMaxHeight,
                }}
                className="object-contain"
              />
            ) : (
              <span className="flex flex-col leading-tight">
                {text.line1.value !== "" ? (
                  <span
                    style={{
                      fontFamily: "var(--font-heading)",
                      color: text.line1.color,
                      fontSize: TEXT_LINE_PX.line1[text.line1.size],
                      letterSpacing: TEXT_SIZE_LETTER_SPACING[text.line1.size],
                      fontWeight: Number(text.line1.weight),
                    }}
                  >
                    {text.line1.value}
                  </span>
                ) : null}
                {text.line2.value !== "" ? (
                  <span
                    style={{
                      fontFamily: "var(--font-heading)",
                      color: text.line2.color,
                      fontSize: TEXT_LINE_PX.line2[text.line2.size],
                      letterSpacing: TEXT_SIZE_LETTER_SPACING[text.line2.size],
                      fontWeight: Number(text.line2.weight),
                    }}
                  >
                    {text.line2.value}
                  </span>
                ) : null}
              </span>
            )
          ) : (
            <span
              style={{
                fontFamily: "var(--font-heading)",
                color: "#111827",
              }}
              className="text-xl font-medium tracking-wide"
            >
              {siteName}
            </span>
          )}
        </div>
        {!configured ? (
          <p className="text-xs text-muted-foreground">
            Aucune configuration : le Header affiche le nom par défaut du site
            (« {siteName} ») en attendant.
          </p>
        ) : null}
      </section>
    </div>
  );
}
