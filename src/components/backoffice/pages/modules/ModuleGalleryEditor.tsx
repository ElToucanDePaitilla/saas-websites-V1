"use client";

import {
  resolveGalleryContent,
  type GalleryBaseShared,
  type GalleryContent,
  type GalleryLayoutOptions,
  type ModuleContent,
} from "@/lib/pages";

import { EditorSubZone, EditorZone } from "./EditorZone";
import { TextField } from "./form-fields";
import { AlbumManagerPanel } from "./gallery/AlbumManagerPanel";
import { EffectSettingsPanel } from "./gallery/EffectSettingsPanel";
import { GalleryCtaPanel } from "./gallery/GalleryCtaPanel";
import { GalleryHoverPanel } from "./gallery/GalleryHoverPanel";
import { GalleryImagesPanel } from "./gallery/GalleryImagesPanel";
import { GalleryLayoutPanel } from "./gallery/GalleryLayoutPanel";
import { LightboxSettingsPanel } from "./gallery/LightboxSettingsPanel";

/**
 * ============================================================================
 * ÉDITEUR DE CONTENU — Rubrique « Galeries & Portfolio » (Phase 11 / 11.17)
 * ----------------------------------------------------------------------------
 * Aiguillage par variante :
 *   - static    : photos + apparence + CTA (aucun diaporama) ;
 *   - dynamic   : photos + apparence + diaporama + CTA ;
 *   - portfolio : albums + apparence + diaporama + CTA.
 *
 * **Étape 11.17 — refonte ergonomique.** Le formulaire empilait auparavant une
 * dizaine de blocs à plat, mêlant quatre échelles différentes (le bloc, la
 * galerie, les albums, la photo) sans aucun marqueur de niveau : l'utilisateur
 * ne pouvait pas savoir à quoi s'appliquait ce qu'il lisait
 * (plans/ROADMAP-11.17-editor-zones-ux.md §0.1). Il est désormais organisé en
 * **zones** portant chacune un titre qui nomme sa cible et une phrase qui dit sa
 * portée :
 *
 *   1. **Les albums** (ou « Les photos ») — ce que le visiteur parcourt ;
 *   2. **Apparence des photos** — disposition, cadre et finition, survol ;
 *   3. **Agrandissement et diaporama** — absent en variante `static` ;
 *   4. **Bouton d'appel à l'action**.
 *
 * Une **barre d'ancres** en tête permet de sauter directement à une zone : c'est
 * le bénéfice des onglets (se repérer, sauter) sans leurs inconvénients — les
 * onglets ont été écartés car le formulaire est déjà dans un accordéon et parce
 * qu'ils cacheraient les valeurs par défaut, qu'il faut pouvoir reconnaître d'un
 * coup d'œil (§4.4).
 *
 * Les panneaux enfants ne portent plus leur propre cadre ni leur titre : la
 * boîte pleine est celle de la `EditorZone`, la boîte en **pointillés** signale
 * un sous-bloc imbriqué (`EditorSubZone`).
 *
 * Le contenu JSONB reste normalisé (`resolveGalleryContent`) : les variantes
 * anciennes (masonry legacy) sont lues sans rupture. Aucun champ n'a été ajouté
 * ni retiré — seuls les regroupements et les libellés ont changé.
 *
 * Références : plans/ROADMAP-11.17-editor-zones-ux.md §4.2 et §4.3
 * ============================================================================
 */

type GalleryContentValue = Extract<ModuleContent, { type: "gallery" }>;

type ModuleGalleryEditorProps = {
  content: GalleryContentValue;
  onChangeContent: (content: GalleryContentValue) => void;
};

/** Identifiants d'ancrage des zones (cibles de la barre de navigation). */
const ZONE_IDS = {
  photos: "gallery-zone-photos",
  appearance: "gallery-zone-appearance",
  slideshow: "gallery-zone-slideshow",
  action: "gallery-zone-action",
} as const;

/** Une entrée de la barre d'ancres. */
type ZoneNavItem = {
  id: string;
  label: string;
};

/**
 * Barre d'ancres des rubriques. Liens natifs (`#id`) : le défilement lissé est
 * déjà global (`html { scroll-behavior: smooth }` dans `globals.css`), donc
 * aucun JavaScript n'est nécessaire.
 */
function ZoneNav({ items }: { items: ZoneNavItem[] }) {
  return (
    <nav
      aria-label="Aller à une rubrique du formulaire"
      className="sticky top-2 z-10 flex gap-1 overflow-x-auto rounded-md border border-border bg-background/95 px-2 py-1.5 shadow-xs backdrop-blur"
    >
      {items.map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          className="shrink-0 rounded-md px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
}

export function ModuleGalleryEditor({
  content,
  onChangeContent,
}: ModuleGalleryEditorProps) {
  const resolved = resolveGalleryContent(content);
  const isPortfolio = resolved.variant === "portfolio";
  const hasSlideshow = resolved.variant !== "static";

  /** Commit d'un contenu galerie complet. */
  function commit(next: GalleryContent) {
    onChangeContent({ type: "gallery", ...next });
  }

  /** Patch du socle commun (mise en page, effets, CTA, Lightbox, badge…). */
  function updateShared(patch: Partial<GalleryBaseShared>) {
    commit({ ...resolved, ...patch });
  }

  /** Patch de la mise en page. */
  function updateLayout(patch: Partial<GalleryLayoutOptions>) {
    updateShared({ layout: { ...resolved.layout, ...patch } });
  }

  const navItems: ZoneNavItem[] = [
    { id: ZONE_IDS.photos, label: isPortfolio ? "Les albums" : "Les photos" },
    { id: ZONE_IDS.appearance, label: "Apparence des photos" },
    ...(hasSlideshow
      ? [{ id: ZONE_IDS.slideshow, label: "Agrandissement et diaporama" }]
      : []),
    { id: ZONE_IDS.action, label: "Bouton d’appel à l’action" },
  ];

  return (
    <div className="grid gap-4">
      {/* ---- En-tête affiché sur le site (non encadré, comme un titre) ---- */}
      <div className="grid gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Ce que le visiteur voit en haut de la galerie
        </p>
        <TextField
          label="Titre affiché sur le site"
          value={resolved.heading}
          onChange={(heading) => updateShared({ heading })}
          hint="Titre visible au-dessus de la galerie, sur le site public."
        />
        <TextField
          label="Sous-titre affiché sous le titre (facultatif)"
          value={resolved.subheading}
          onChange={(subheading) => updateShared({ subheading })}
        />
      </div>

      <ZoneNav items={navItems} />

      {/* ---- ZONE 1 : ce que le visiteur parcourt ---- */}
      <EditorZone
        id={ZONE_IDS.photos}
        tone="content"
        title={isPortfolio ? "Les albums" : "Les photos"}
        scope={
          isPortfolio
            ? "Chaque album regroupe des photos autour d’un thème. La couverture de l’album ouvre son propre diaporama."
            : "Les photos de la galerie, dans l’ordre où elles apparaîtront sur le site."
        }
      >
        {isPortfolio ? (
          <AlbumManagerPanel
            albums={resolved.albums}
            onChange={(albums) => commit({ ...resolved, albums })}
            badge={resolved.badge}
            onChangeBadge={(patch) =>
              updateShared({ badge: { ...resolved.badge, ...patch } })
            }
          />
        ) : (
          <GalleryImagesPanel
            images={resolved.images}
            onChange={(images) => commit({ ...resolved, images })}
            folderLabel="Importer un dossier"
          />
        )}
      </EditorZone>

      {/* ---- ZONE 2 : l'aspect des photos ---- */}
      <EditorZone
        id={ZONE_IDS.appearance}
        tone="style"
        title="Apparence des photos"
        scope="S’applique à toutes les photos de la galerie : disposition de la grille, effet de présentation, ombre, encadrement et réaction au survol de la souris."
      >
        <EditorSubZone title="Disposition de la grille">
          <GalleryLayoutPanel layout={resolved.layout} onChange={updateLayout} />
        </EditorSubZone>

        <EditorSubZone title="Cadre et finition">
          <EffectSettingsPanel
            effect={resolved.effect}
            layout={resolved.layout}
            onChangeEffect={(patch) =>
              updateShared({ effect: { ...resolved.effect, ...patch } })
            }
            onChangeLayout={updateLayout}
          />
        </EditorSubZone>

        <EditorSubZone title="Au survol des photos">
          <GalleryHoverPanel
            layout={resolved.layout}
            variant={resolved.variant}
            onChange={updateLayout}
          />
        </EditorSubZone>
      </EditorZone>

      {/* ---- ZONE 3 : agrandissement (absente en variante static) ---- */}
      {hasSlideshow ? (
        <EditorZone
          id={ZONE_IDS.slideshow}
          tone="detail"
          title="Agrandissement et diaporama"
          scope="S’applique quand un visiteur agrandit une photo : zoom, réglages de l’appareil et titre de la photo."
        >
          <LightboxSettingsPanel
            lightbox={resolved.lightbox}
            onChange={(patch) =>
              updateShared({ lightbox: { ...resolved.lightbox, ...patch } })
            }
          />
        </EditorZone>
      ) : null}

      {/* ---- ZONE 4 : le bouton ---- */}
      <EditorZone
        id={ZONE_IDS.action}
        tone="action"
        title="Bouton d’appel à l’action"
        scope="Le bouton affiché sous la galerie : son libellé, son style et la page ou la section vers laquelle il emmène le visiteur."
      >
        <GalleryCtaPanel
          cta={resolved.cta}
          onChange={(patch) =>
            updateShared({ cta: { ...resolved.cta, ...patch } })
          }
        />
      </EditorZone>
    </div>
  );
}
