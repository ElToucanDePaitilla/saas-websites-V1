"use client";

import * as React from "react";

import { LightboxModal } from "@/components/modules/gallery/LightboxModal";
import type { GalleryImage, GalleryLightboxSettings } from "@/lib/pages";

/**
 * ============================================================================
 * VISIONNEUSE DES AFFICHES « news » — frontière client de la section (Étape 14.5)
 * ----------------------------------------------------------------------------
 * Un **seul** Client Component pour toute la famille : il porte la liste des
 * cartes (rendues côté serveur, reçues en `children`) et remplace l'ancien zoom
 * sur place (D5 révisé) par une **modale plein écran**.
 *
 * Pourquoi la **délégation d'événements** plutôt que des cartes clientes ou un
 * contexte React : `NewsModule` et `NewsCard` restent des Server Components
 * (aucune donnée interactive ne descend dans la carte), et le bouton
 * d'agrandissement reste un vrai `<button>` rendu par le serveur — donc
 * focalisable et atteignable au lecteur d'écran, ce que le double-clic n'est
 * pas. `data-news-open` (bouton) et `data-news-media` (boîte photo) sont deux
 * attributs **distincts** : les fusionner ferait qu'un simple clic sur l'affiche
 * ouvrirait la modale, alors que la carte n'est jamais cliquable.
 *
 * La modale est **montée à l'ouverture** (patron `GalleryManager`), jamais
 * pilotée par `open` : `LightboxModal` capture `initialIndex` via `useState` au
 * montage, un montage permanent figerait donc l'index sur le premier item.
 * ============================================================================
 */

/**
 * Réglages de la visionneuse — **figés volontairement** (M5) : ce n'est pas un
 * réglage d'éditeur, rien n'est persisté dans `NewsStyleSettings`. `showExif`
 * est explicitement `false` : le défaut de `DEFAULT_GALLERY_LIGHTBOX` est `true`
 * (métadonnées d'objectif), sans objet pour une affiche.
 */
const NEWS_LIGHTBOX_SETTINGS: GalleryLightboxSettings = {
  zoomEnabled: true,
  zoomLevel1: 1.5,
  zoomLevel2: 2.5,
  showExif: false,
  showCaption: true,
};

type NewsLightboxProps = {
  /** Affiches rendues, dans l'ordre d'affichage (index alignés sur les cartes). */
  images: GalleryImage[];
  /** Titre de section : préfixe le compteur et nomme la modale. */
  title: string;
  children: React.ReactNode;
};

export function NewsLightbox({ images, title, children }: NewsLightboxProps) {
  const [openIndex, setOpenIndex] = React.useState<number | null>(null);

  /**
   * Lit l'index porté par l'élément le plus proche de la cible. `event.target`
   * n'est pas un `Element` en toute généralité (nœud texte) : on teste
   * `instanceof` avant `closest`, sinon `.closest` exploserait à l'exécution.
   */
  const indexFrom = (
    target: EventTarget | null,
    selector: string
  ): number | null => {
    const el =
      target instanceof Element
        ? target.closest<HTMLElement>(selector)
        : null;
    if (el === null) {
      return null;
    }
    const value = Number(el.dataset.newsOpen ?? el.dataset.newsMedia);
    return Number.isInteger(value) && value >= 0 && value < images.length
      ? value
      : null;
  };

  return (
    <div
      className="news-list"
      onClick={(event) => {
        const index = indexFrom(event.target, "[data-news-open]");
        if (index !== null) {
          setOpenIndex(index);
        }
      }}
      onDoubleClick={(event) => {
        const index = indexFrom(event.target, "[data-news-media]");
        if (index !== null) {
          setOpenIndex(index);
        }
      }}
    >
      {children}

      {openIndex !== null && images.length > 0 ? (
        <LightboxModal
          open
          images={images}
          initialIndex={openIndex}
          settings={NEWS_LIGHTBOX_SETTINGS}
          title={title}
          restoreFocus
          onClose={() => setOpenIndex(null)}
        />
      ) : null}
    </div>
  );
}
