import {
  CONTACT_PRACTICAL_INFO_ENABLED,
  type ContactFrameSettings,
  type ContactInfoSettings,
  type ContactSocialLink,
  type ContactSocialStyle,
  type ContactVisibilitySettings,
} from "@/lib/pages";

import { contactFrameCssVars } from "./contactFrame";
import { SocialLinks } from "./SocialLinks";

/**
 * ============================================================================
 * CONTAINER 2 — COORDONNÉES (Étape 14.1)
 * ----------------------------------------------------------------------------
 * Server Component : aucune interaction, uniquement de la lecture.
 *
 * Masquage à **deux niveaux** : le maître `showContainer2` décide de la présence
 * du container, chaque `show*` masque sa ligne. Le flag `showAddressGroup`
 * masque les six lignes d'adresse **d'un bloc** — c'est un groupe, pas six
 * réglages indépendants.
 *
 * Titrage : le **chapeau** (C1) porte le `h2`/`h3` de la section ; le bloc
 * **Identité** porte en plus son propre `h2` (le nom, à l'échelle `.module-h2`)
 * et son `h3` (le slogan). Les coordonnées, elles, restent des `dt`/`dd` : une
 * ligne de téléphone n'est pas un titre de document.
 *
 * Conséquence assumée : quand le chapeau et le nom sont tous deux remplis, la
 * section contient **deux `h2`**. L'invariant du site reste « un seul `h1` »
 * (décidé par `PublicModulesList`), et l'ordre des niveaux est valide
 * (h2, h2, h3) — le nom a été promu au rang de titre de section à la demande
 * du photographe, pas par accident.
 *
 * **Cadre (14.1.c)** : la racine porte `contact-frame` et **reçoit `frame` en
 * prop** — ce composant ne lit jamais `content`. Le cadre est traduit en
 * variables CSS (`contactFrameCssVars`) ; la règle `border` et ses replis
 * vivent dans `globals.css`, comme pour les cartes.
 *
 * **Informations pratiques (D6)** : Horaires et Zone d'intervention ne sont
 * plus rendus (drapeau `CONTACT_PRACTICAL_INFO_ENABLED`), mais leur code, leur
 * visibilité et leur donnée restent en place pour un réemploi dans un autre
 * module. Le `<dl>` n'est donc rendu **que s'il lui reste au moins une ligne**
 * (téléphone / mobile / e-mail) : sans cette garde, un `<dl>` vide
 * apparaîtrait sur un contenu qui ne renseignait que des horaires.
 *
 * **Réseaux sociaux (14.1.d)** : la barre d'icônes est la **dernière ligne** du
 * container 2, sous les coordonnées — le container 4 autonome est supprimé. Elle
 * ne porte aucune marge : l'espacement vient du `gap-12` de la grille, soit la
 * même valeur que celle séparant Adresse et Téléphone. Conséquence assumée :
 * masquer le container 2 (`showContainer2`) masque aussi les réseaux, qui en
 * font désormais partie.
 * ============================================================================
 */

/** `tel:` sans espaces ni ponctuation — le navigateur recompose l'affichage. */
export function telHref(value: string): string {
  return `tel:${value.replace(/[^+0-9]/g, "")}`;
}

/**
 * Vrai s'il reste au moins une donnée visible à afficher dans le container 2.
 *
 * `hasSocial` : la barre de réseaux compte comme du contenu (14.1.d) — un bloc
 * qui ne porterait que des icônes doit rester affiché, sinon la barre
 * disparaîtrait silencieusement.
 */
export function hasVisibleContactInfo(
  info: ContactInfoSettings,
  visibility: ContactVisibilitySettings,
  hasSocial = false
): boolean {
  if (!visibility.showContainer2) {
    return false;
  }
  return (
    hasSocial ||
    (visibility.showName && info.name.trim() !== "") ||
    (visibility.showSlogan && info.slogan.trim() !== "") ||
    (visibility.showAddressGroup && hasAddress(info)) ||
    (visibility.showLandline && info.landline.trim() !== "") ||
    (visibility.showMobile && info.mobile.trim() !== "") ||
    (visibility.showEmail && info.email.trim() !== "") ||
    // Horaires / zone ne comptent que si la rubrique est réactivée (D6) : sans
    // cette garde, un contenu qui ne renseignait qu'eux ferait afficher un cadre
    // quasi vide — le bloc serait « visible » selon cette fonction mais sans
    // aucune ligne à peindre.
    (CONTACT_PRACTICAL_INFO_ENABLED &&
      visibility.showHours &&
      info.hours.trim() !== "") ||
    (CONTACT_PRACTICAL_INFO_ENABLED &&
      visibility.showServiceArea &&
      info.serviceArea.trim() !== "")
  );
}

/** Vrai si l'adresse porte au moins une ligne renseignée. */
function hasAddress(info: ContactInfoSettings): boolean {
  const { proName, address1, address2, postalCode, city, country } =
    info.address;
  return [proName, address1, address2, postalCode, city, country].some(
    (line) => line.trim() !== ""
  );
}

export function ContactInfoBlock({
  info,
  visibility,
  frame,
  social,
  socialStyle,
}: {
  info: ContactInfoSettings;
  visibility: ContactVisibilitySettings;
  /** Cadre du module — passé en prop, ce composant ne lit jamais le contenu. */
  frame: ContactFrameSettings;
  /** Réseaux affichés en dernière ligne du container (14.1.d). */
  social: ContactSocialLink[];
  socialStyle: ContactSocialStyle;
}) {
  if (!hasVisibleContactInfo(info, visibility, social.length > 0)) {
    return null;
  }

  const address = info.address;
  const cityLine = [address.postalCode.trim(), address.city.trim()]
    .filter((part) => part !== "")
    .join(" ");

  const showName = visibility.showName && info.name.trim() !== "";
  const showSlogan = visibility.showSlogan && info.slogan.trim() !== "";
  const showLandline = visibility.showLandline && info.landline.trim() !== "";
  const showMobile = visibility.showMobile && info.mobile.trim() !== "";
  const showEmail = visibility.showEmail && info.email.trim() !== "";
  // Horaires / zone ne sont plus rendus (D6), mais leurs conditions restent
  // écrites derrière le drapeau : un seul booléen les réactive.
  const showHours =
    CONTACT_PRACTICAL_INFO_ENABLED &&
    visibility.showHours &&
    info.hours.trim() !== "";
  const showServiceArea =
    CONTACT_PRACTICAL_INFO_ENABLED &&
    visibility.showServiceArea &&
    info.serviceArea.trim() !== "";
  // Le `<dl>` ne se rend que s'il lui reste au moins une ligne : sinon il
  // serait vide et laisserait un trou dans l'empilement du container.
  const hasLines =
    showLandline || showMobile || showEmail || showHours || showServiceArea;

  // `gap-12` (1,5 → 3 rem) : Identité, Adresse et Coordonnées sont trois blocs
  // distincts, l'air entre eux doit dépasser l'air interne.
  return (
    <div
      className="contact-info contact-frame grid gap-12"
      style={contactFrameCssVars(frame)}
    >
      {/* Identité = un seul bloc (nom + slogan). L'écart nom/slogan vient du
          `gap-1` du conteneur, et non d'un `margin-top` négatif sur le slogan :
          le négatif dépendait de la présence du nom (il le chevauchait quand
          seul le slogan était affiché) et du style du titre au-dessus de lui. */}
      {showName || showSlogan ? (
        <div className="grid gap-1">
          {showName ? <h2 className="module-h2">{info.name}</h2> : null}
          {showSlogan ? (
            <h3 className="contact-info__slogan">{info.slogan}</h3>
          ) : null}
        </div>
      ) : null}

      {visibility.showAddressGroup && hasAddress(info) ? (
        <address className="contact-info__address not-italic">
          {address.proName.trim() !== "" ? <span>{address.proName}</span> : null}
          {address.address1.trim() !== "" ? <span>{address.address1}</span> : null}
          {address.address2.trim() !== "" ? <span>{address.address2}</span> : null}
          {cityLine !== "" ? <span>{cityLine}</span> : null}
          {address.country.trim() !== "" ? <span>{address.country}</span> : null}
        </address>
      ) : null}

      {hasLines ? (
        <dl className="contact-info__lines">
          {showLandline ? (
            <div>
              <dt>Téléphone</dt>
              <dd>
                <a href={telHref(info.landline)}>{info.landline.trim()}</a>
              </dd>
            </div>
          ) : null}
          {showMobile ? (
            <div>
              <dt>Mobile</dt>
              <dd>
                <a href={telHref(info.mobile)}>{info.mobile.trim()}</a>
              </dd>
            </div>
          ) : null}
          {showEmail ? (
            <div>
              <dt>E-mail</dt>
              <dd>
                <a href={`mailto:${info.email.trim()}`}>{info.email.trim()}</a>
              </dd>
            </div>
          ) : null}
          {showHours ? (
            <div>
              <dt>Horaires</dt>
              <dd className="contact-info__preline">{info.hours.trim()}</dd>
            </div>
          ) : null}
          {showServiceArea ? (
            <div>
              <dt>Zone d’intervention</dt>
              <dd className="contact-info__preline">
                {info.serviceArea.trim()}
              </dd>
            </div>
          ) : null}
        </dl>
      ) : null}

      {/* Réseaux sociaux — dernière ligne du container (14.1.d). Aucune marge :
          le `gap-12` de la grille fournit l'espace, la même valeur que celle
          séparant Adresse et Téléphone. */}
      <SocialLinks links={social} style={socialStyle} />
    </div>
  );
}
