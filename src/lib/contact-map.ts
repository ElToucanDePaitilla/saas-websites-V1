import type { ContactMapContent, ContactMapType } from "./pages";

/**
 * ============================================================================
 * CONTACT MAP — logique pure du module (Étape 14.2)
 * ----------------------------------------------------------------------------
 * Trois fonctions sans état, testables sans DOM, isolées de `pages.ts` : le
 * domaine porte les *formes* et les bornes, ce fichier porte les *règles de
 * composition* (quelle adresse gagne, quelle URL en découle).
 *
 * L'iframe Maps est un **embed sans clé** (D5) : `output=embed` évite toute
 * variable d'environnement et toute facturation, au prix d'un rendu « best
 * effort » (le fond satellite `t=k` n'est pas documenté en embed sans clé — à
 * vérifier en recette, cf. §11 du plan).
 * ============================================================================
 */

/**
 * Adresse effective du module : profil si demandé **et renseigné**, sinon
 * adresse libre.
 *
 * Le repli est ici, au rendu, et non dans le résolveur (D3) : un même contenu
 * enregistré peut ainsi basculer d'une adresse de profil à l'adresse de repli
 * sans qu'aucune donnée ne soit réécrite. Un profil vide ne doit jamais laisser
 * la carte sans adresse.
 */
export function contactMapAddress(
  content: ContactMapContent,
  ownerAddress: string
): string {
  if (content.useOwnerAddress) {
    const fromProfile = ownerAddress.trim();
    if (fromProfile !== "") {
      return fromProfile;
    }
  }
  return content.customAddress.trim();
}

/**
 * URL d'embed Google Maps sans clé (D5).
 *
 * L'adresse est bornée côté domaine (`zoom` 1..20) : la fonction ne re-borne
 * rien, elle encode seulement. `mapType` se traduit en paramètre `t`
 * (`m` = plan, `k` = satellite).
 */
export function contactMapEmbedUrl(
  address: string,
  zoom: number,
  mapType: ContactMapType
): string {
  const t = mapType === "satellite" ? "k" : "m";
  return `https://www.google.com/maps?q=${encodeURIComponent(
    address
  )}&z=${zoom}&t=${t}&output=embed`;
}

/**
 * URL d'itinéraire — ouvre l'application Maps native ou le web.
 *
 * Passer par le lien officiel `dir/?api=1` plutôt que par la même URL que
 * l'iframe : le visiteur doit pouvoir lancer la navigation, pas seulement voir
 * le point sur un plan.
 */
export function contactMapDirectionsUrl(address: string): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    address
  )}`;
}
