import * as React from "react";

import { IconByName } from "@/components/common/IconByName";
import { MediaImage } from "@/components/common/MediaImage";
import {
  resolveContentColumnsContent,
  type ContentBlock,
  type ContentGap,
  type ContentIconSize,
  type ContentTextAlign,
  type PageModule,
} from "@/lib/pages";
import { cn } from "@/lib/utils";

import { RichTextRenderer } from "./RichTextRenderer";

/**
 * ============================================================================
 * MODULE PUBLIC — « Contenu en colonnes » (Étape 12.1)
 * ----------------------------------------------------------------------------
 * Rendu vitrine d'une section de contenu libre : un titre optionnel, puis 1 à 4
 * **conteneurs indépendants** côte à côte — et **empilés** sous le seuil choisi
 * dans l'éditeur.
 *
 * **Server Component** : aucune interactivité, donc aucun JavaScript expédié au
 * visiteur et un rendu ISR préservé.
 *
 * Répartition des responsabilités (patron du projet) :
 *   - le composant transmet la RÉPARTITION en variables CSS et les jetons en
 *     `data-*` ;
 *   - [`globals.css`](../../../app/globals.css) porte la MÉCANIQUE — point de
 *     rupture, empilement, séparateur, gouttière. C'est ce qui garantit
 *     l'empilement **sans JavaScript** et en un seul endroit.
 *
 * `min-w-0` sur chaque conteneur : sans lui, un enfant large (image, mot
 * insécable) empêcherait la colonne de se réduire et déborderait la grille.
 * ============================================================================
 */

/** Taille d'une icône (jeton → classe). */
const ICON_SIZE_CLASS: Record<ContentIconSize, string> = {
  sm: "size-5",
  md: "size-7",
  lg: "size-10",
};

/** Hauteur d'un bloc d'espacement (jeton → classe). */
const SPACER_CLASS: Record<ContentGap, string> = {
  sm: "h-2",
  md: "h-6",
  lg: "h-12",
};

/**
 * Alignement horizontal d'un bloc autonome (image, icône).
 * `justify` n'a pas de sens pour un bloc : il retombe sur l'alignement à gauche.
 */
const BLOCK_JUSTIFY: Record<ContentTextAlign, string> = {
  left: "justify-start",
  center: "justify-center",
  right: "justify-end",
  justify: "justify-start",
};

/** Rendu d'un bloc de contenu — **aiguillage exhaustif** par `kind`. */
function ContentBlockView({ block }: { block: ContentBlock }) {
  switch (block.kind) {
    case "rich-text":
      return <RichTextRenderer doc={block.doc} />;
    case "image":
      return (
        <figure className={cn("flex", BLOCK_JUSTIFY[block.align])}>
          <MediaImage
            src={block.media.url}
            alt={block.media.alt}
            width={1600}
            height={1067}
            quality={80}
            className={cn(
              "h-auto rounded-lg object-cover",
              block.width === "full" ? "w-full" : "w-auto max-w-full"
            )}
          />
        </figure>
      );
    case "icon":
      return (
        <div className={cn("flex", BLOCK_JUSTIFY[block.align])}>
          <IconByName
            name={block.name}
            className={cn(
              ICON_SIZE_CLASS[block.size],
              "text-[var(--accent-color)]"
            )}
          />
        </div>
      );
    case "spacer":
      return <div aria-hidden="true" className={SPACER_CLASS[block.size]} />;
  }
}

/** Section « Contenu en colonnes ». */
export function ContentColumnsModule({ module }: { module: PageModule }) {
  const raw = module.content.type === "content" ? module.content : null;
  if (raw === null) {
    return null;
  }

  // Le rendu ne lit jamais le contenu brut : le résolveur rétablit les défauts
  // et les invariants (1 à 4 conteneurs, poids positifs, blocs connus).
  const content = resolveContentColumnsContent(raw);
  const { containers, layout } = content;
  if (containers.length === 0) {
    return null;
  }

  // Répartition : colonnes d'égale largeur (« Largeur identique ») ou poids
  // relatifs. `minmax(0, …fr)` est indispensable — `1fr` seul laisserait une
  // longue URL élargir sa colonne et casser la grille.
  const template = layout.sameWidth
    ? `repeat(${containers.length}, minmax(0, 1fr))`
    : containers
        .map((container) =>
          `minmax(0, ${container.weight > 0 ? container.weight : 1}fr)`
        )
        .join(" ");

  /**
   * Zone d'en-tête : **rendue uniquement si elle porte réellement quelque
   * chose**. On teste l'interrupteur **et** la présence de texte — un titre
   * activé mais vide ne doit pas produire de conteneur vide ni de marge
   * résiduelle. Le rendu s'abstient (aucun nœud émis) plutôt que de masquer en
   * CSS : c'est la seule façon de garantir l'absence de décalage.
   */
  const showH2 = content.header.showH2 && content.heading.trim() !== "";
  const showH3 = content.header.showH3 && content.header.h3.trim() !== "";
  const showText = content.header.showText && content.header.text.trim() !== "";
  const hasHeader = showH2 || showH3 || showText;

  return (
    <section
      id={module.anchorId}
      className="content-section mx-auto px-4 py-20 sm:px-6 lg:px-8"
      data-width={layout.maxWidth}
    >
      {hasHeader ? (
        <div
          className="content-header"
          data-stack={layout.stackAt}
          data-align={content.header.align}
        >
          {showH2 ? (
            <h2 className="content-header__h2">{content.heading}</h2>
          ) : null}
          {showH3 ? (
            <h3 className="content-header__h3">{content.header.h3}</h3>
          ) : null}
          {showText ? (
            <p className="content-header__text">{content.header.text}</p>
          ) : null}
        </div>
      ) : null}

      <div
        className="content-cols"
        data-gap={layout.gap}
        data-stack={layout.stackAt}
        data-separator={layout.separator ? "true" : "false"}
        data-valign={layout.verticalAlign}
        style={{ "--content-template": template } as React.CSSProperties}
      >
        {containers.map((container) => (
          // `content-col` porte la garde anti-débordement (`min-width: 0`) :
          // sans elle, un mot insécable ou une image élargirait la piste.
          <div
            key={container.id}
            className="content-col grid content-start gap-4"
          >
            {container.blocks.map((block) => (
              <ContentBlockView key={block.id} block={block} />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
