import SiBehance from "@icons-pack/react-simple-icons/icons/SiBehance";
import SiFacebook from "@icons-pack/react-simple-icons/icons/SiFacebook";
import SiFlickr from "@icons-pack/react-simple-icons/icons/SiFlickr";
import SiInstagram from "@icons-pack/react-simple-icons/icons/SiInstagram";
import SiPinterest from "@icons-pack/react-simple-icons/icons/SiPinterest";
import SiTiktok from "@icons-pack/react-simple-icons/icons/SiTiktok";
import SiVimeo from "@icons-pack/react-simple-icons/icons/SiVimeo";
import SiX from "@icons-pack/react-simple-icons/icons/SiX";
import SiYoutube from "@icons-pack/react-simple-icons/icons/SiYoutube";
import type * as React from "react";

import { type ContactSocialNetwork } from "@/lib/pages";

/**
 * ============================================================================
 * ICÔNES DES RÉSEAUX SOCIAUX — table `réseau → composant` (Étape 14.1)
 * ----------------------------------------------------------------------------
 * **Un seul fichier** porte la correspondance : un renommage d'export dans la
 * bibliothèque se corrige donc ici, en une ligne, sans toucher au rendu.
 *
 * Import **par icône** (`…/icons/SiInstagram`), jamais le barrel : le barrel
 * référencerait les ~3000 marques du paquet, dont le bundler ne saurait pas
 * écarter l'inutile. C'est la seule garantie que le bundle ne grossisse pas de
 * plusieurs mégaoctets pour dix icônes.
 *
 * Exception assumée : **LinkedIn**. Simple Icons 13.x ne publie plus la marque
 * (retrait demandé par le détenteur), et Lucide v1 ne porte plus les marques.
 * Le glyphe officiel est donc défini ici en SVG local, à la même signature que
 * les icônes de la bibliothèque (`color`, `size`, `title`). La table reste le
 * point de correction unique.
 * ============================================================================
 */

/**
 * Signature minimale d'une icône de marque.
 *
 * On ne réutilise pas le type `IconType` du paquet : il n'est pas exposé par sa
 * carte d'exports (`./icons/*` seulement), et le paquet peut changer de type
 * sans que notre usage — trois props — ne change.
 */
export type BrandIconComponent = React.ComponentType<{
  color?: string;
  size?: number | string;
  className?: string;
  title?: string;
  "aria-hidden"?: boolean;
}>;

/** Glyphe LinkedIn local (absent de Simple Icons 13.x). */
function SiLinkedinLocal({
  color = "currentColor",
  size = 24,
  className,
  title = "LinkedIn",
  "aria-hidden": ariaHidden,
}: {
  color?: string;
  size?: number | string;
  className?: string;
  title?: string;
  "aria-hidden"?: boolean;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      className={className}
      aria-hidden={ariaHidden}
    >
      <title>{title}</title>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

/** Table **complète** du catalogue `CONTACT_SOCIAL_NETWORKS`. */
export const CONTACT_SOCIAL_ICONS: Record<
  ContactSocialNetwork,
  BrandIconComponent
> = {
  instagram: SiInstagram,
  facebook: SiFacebook,
  linkedin: SiLinkedinLocal,
  youtube: SiYoutube,
  tiktok: SiTiktok,
  x: SiX,
  pinterest: SiPinterest,
  vimeo: SiVimeo,
  behance: SiBehance,
  flickr: SiFlickr,
};
