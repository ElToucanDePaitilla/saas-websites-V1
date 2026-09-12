"use client";

import * as React from "react";

import {
  resolveGalleryContent,
  type GalleryAlbum,
  type GalleryBaseShared,
  type GalleryContent,
  type GalleryLayoutOptions,
  type ModuleContent,
} from "@/lib/pages";

import { EditorSubZone, EditorZone } from "./EditorZone";
import { TextField } from "./form-fields";
import { AlbumCoverBadgePanel } from "./gallery/AlbumCoverBadgePanel";
import { AlbumEditorPanel } from "./gallery/AlbumEditorPanel";
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
 *   2. **Apparence** — réorganisée en 11.20.c en **deux sous-titres** :
 *      « **Disposition des couvertures des albums dans la galerie Portfolio** »
 *      (nombre de colonnes, écarts, format d'affichage) et « **Format des
 *      couvertures des albums** » (effet de finition, arrondi, encadrement,
 *      ombre portée, effets au survol, infos en pied de couverture) ;
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

  /**
   * Album ouvert dans la vue d'édition (11.20.a). L'état est porté **ici**, et
   * non plus dans la grille : la vue d'album doit être une `EditorZone`
   * **sœur** de la zone « Les albums », dotée de sa **propre couleur d'accent**
   * — c'est ce qui fait changer la couleur de la barre verticale au-dessus du
   * bouton de retour, au lieu de la prolonger à l'identique depuis les réglages
   * de galerie (constat de recette).
   *
   * `editingAlbum` est un **état dérivé** : si l'album disparaît (suppression),
   * il redevient `null` et la grille réapparaît seule — jamais d'écran vide, et
   * aucun `setState` dans un effet.
   */
  const [editingAlbumId, setEditingAlbumId] = React.useState<string | null>(null);
  const editingAlbum =
    editingAlbumId !== null && resolved.variant === "portfolio"
      ? resolved.albums.find((album) => album.id === editingAlbumId) ?? null
      : null;
  const editingAlbumIndex =
    editingAlbum !== null && resolved.variant === "portfolio"
      ? resolved.albums.findIndex((album) => album.id === editingAlbum.id)
      : -1;

  /** Patch d'**un album** : nom, description, couverture, photos (A-2). */
  function updateAlbum(albumId: string, patch: Partial<GalleryAlbum>) {
    const current = resolveGalleryContent(resolved);
    if (current.variant !== "portfolio") {
      return;
    }
    commit({
      ...current,
      albums: current.albums.map((album) =>
        album.id === albumId ? { ...album, ...patch } : album
      ),
    });
  }

  const navItems: ZoneNavItem[] = [
    {
      id: ZONE_IDS.photos,
      label: isPortfolio ? "Les albums de la Galerie Portfolio" : "Les photos",
    },
    {
      id: ZONE_IDS.appearance,
      label: isPortfolio ? "Apparence des Albums" : "Apparence des photos",
    },
    ...(hasSlideshow
      ? [{ id: ZONE_IDS.slideshow, label: "Agrandissement et diaporama" }]
      : []),
    { id: ZONE_IDS.action, label: "Bouton d’appel à l’action" },
  ];

  return (
    <div className="grid gap-4">
      {/* ---- En-tête affiché sur le site (non encadré, comme un titre) ---- */}
      <div className="grid gap-3">
        <p className="text-[13px] font-semibold leading-snug text-foreground">
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
        title={
          isPortfolio ? "Les albums de la Galerie Portfolio" : "Les photos"
        }
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
            editingAlbumId={editingAlbumId}
            onOpenAlbum={setEditingAlbumId}
          />
        ) : (
          <GalleryImagesPanel
            images={resolved.images}
            onChange={(images) => commit({ ...resolved, images })}
            folderLabel="Importer un dossier"
          />
        )}
      </EditorZone>

      {/* ---- VUE D'ALBUM : zone SŒUR, teinte distincte (11.20.a) -------------
          Rendue **hors** de la zone « Les albums », avec la teinte `detail` :
          la barre verticale change donc réellement de couleur au-dessus du
          bouton de retour, au lieu de se poursuivre à l'identique depuis les
          réglages de galerie (constat de recette — un simple bandeau imbriqué
          ne suffisait pas, la barre de la zone continuant de courir sur toute
          sa hauteur, en retrait du bandeau).
          Aucune route, aucune persistance supplémentaire (D-4) : la grille cède
          simplement la place. */}
      {isPortfolio && editingAlbum !== null && editingAlbumIndex >= 0 ? (
        <EditorZone
          tone="detail"
          title="Album en cours d’édition"
          scope={`Vous modifiez « ${
            editingAlbum.label.trim() !== ""
              ? editingAlbum.label.trim()
              : "un album sans nom"
          } » : son nom, sa description, sa photo de couverture et ses photos. Les réglages situés au-dessus portent sur la galerie entière et ne concernent pas cet album en particulier.`}
        >
          <AlbumEditorPanel
            album={editingAlbum}
            position={editingAlbumIndex}
            total={resolved.albums.length}
            onPatch={(patch) => updateAlbum(editingAlbum.id, patch)}
            onBack={() => setEditingAlbumId(null)}
          />
        </EditorZone>
      ) : null}

      {/* ---- ZONE 2 : l'aspect des vignettes de la galerie (11.20.c) --------
          Deux sous-titres seulement, et un seul objet :
            « Disposition… »  → où et comment les vignettes sont rangées ;
            « Format… »       → ce que chaque vignette devient (effet, arrondi,
                                encadrement, ombre, survol, infos en pied).
          L'arrondi a quitté « Disposition » pour rejoindre l'encadrement : c'est
          cette proximité qui manquait pour juger leur combinaison, et qui
          laissait croire à une incompatibilité entre les deux. */}
      <EditorZone
        id={ZONE_IDS.appearance}
        tone="style"
        title={
          isPortfolio
            ? "Apparence de la galerie d’Albums"
            : "Apparence de la galerie de photos"
        }
        scope={
          isPortfolio
            ? "Ces réglages valent pour toute la galerie d’albums — ils ne concernent jamais un album en particulier."
            : "Ces réglages valent pour toute la galerie — ils ne concernent jamais une photo en particulier."
        }
      >
        <EditorSubZone
          title={
            isPortfolio
              ? "Disposition des couvertures des albums dans la galerie Portfolio"
              : "Disposition des photos dans la galerie"
          }
        >
          <GalleryLayoutPanel layout={resolved.layout} onChange={updateLayout} />
        </EditorSubZone>

        {/* Ordre voulu : Effet de finition, Arrondi, Encadrement, Ombre portée
            (rendus par `EffectSettingsPanel`), puis Effets au survol, puis les
            infos en pied de couverture (portfolio). */}
        <EditorSubZone
          title={
            isPortfolio ? "Format des couvertures des albums" : "Format des photos"
          }
        >
          <EffectSettingsPanel
            effect={resolved.effect}
            layout={resolved.layout}
            variant={resolved.variant}
            onChangeEffect={(patch) =>
              updateShared({ effect: { ...resolved.effect, ...patch } })
            }
            onChangeLayout={updateLayout}
          />

          <GalleryHoverPanel
            layout={resolved.layout}
            variant={resolved.variant}
            onChange={updateLayout}
          />

          {isPortfolio ? (
            <AlbumCoverBadgePanel
              badge={resolved.badge}
              onChange={(patch) =>
                updateShared({ badge: { ...resolved.badge, ...patch } })
              }
            />
          ) : null}
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
