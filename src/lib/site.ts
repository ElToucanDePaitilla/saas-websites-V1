/**
 * ============================================================================
 * CONFIGURATION PARTAGÉE DU SITE — Front-Office
 * ----------------------------------------------------------------------------
 * Source unique et découplée du nom de marque et de la navigation, réutilisable
 * par le Header (Étape 2.1) puis par le Footer (Étape 2.2).
 *
 * Référence : plans/ROADMAP-2.1-header.md §1.1
 * ============================================================================
 */

/**
 * Nom du photographe affiché dans la marque (Header / Footer).
 * TODO : à brancher sur les réglages du photographe (Back-Office Phase 4+).
 */
export const siteName = "Prénom Nom";

/** Item de navigation : libellé visible + cible (href). */
export type NavItem = {
  label: string;
  href: string;
};

/**
 * Navigation principale du Header.
 * NB : les routes liées seront créées dans les phases ultérieures ; en
 * attendant, les liens pointent vers leurs futurs slugs (le Header reste
 * fonctionnel).
 */
export const mainNav: NavItem[] = [
  { label: "Accueil", href: "/" },
  { label: "Portfolio", href: "/portfolio" },
  { label: "Prestations", href: "/prestations" },
  { label: "À propos", href: "/a-propos" },
  { label: "Contact", href: "/contact" },
];

/**
 * Liens de réseaux sociaux du photographe (Footer).
 * TODO : à brancher sur les réglages du photographe (profils réels).
 */
export const socialLinks: NavItem[] = [
  { label: "Instagram", href: "https://instagram.com/" },
  { label: "Pinterest", href: "https://pinterest.com/" },
];

/**
 * Liens juridiques / mentions du pied de page (Footer).
 * NB : conformément à la spec §3.1, ces mentions seront affichées sous forme de
 * modales dans une phase ultérieure ; en attendant, les liens pointent vers
 * leurs futurs slugs (le Footer reste fonctionnel).
 */
export const legalLinks: NavItem[] = [
  { label: "Mentions légales", href: "/mentions-legales" },
  { label: "Politique de confidentialité", href: "/confidentialite" },
  { label: "CGU / CGV", href: "/cgu-cgv" },
  { label: "Gestion des cookies", href: "/cookies" },
];
