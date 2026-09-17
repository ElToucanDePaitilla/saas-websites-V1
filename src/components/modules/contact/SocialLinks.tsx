import type * as React from "react";

import {
  contactSocialNetworkLabels,
  type ContactSocialLink,
  type ContactSocialStyle,
} from "@/lib/pages";
import { cn } from "@/lib/utils";

import { CONTACT_SOCIAL_ICONS } from "./socialIcons";

/**
 * ============================================================================
 * RÉSEAUX SOCIAUX — barre intégrée au container 2 (Étapes 14.1 & 14.1.d)
 * ----------------------------------------------------------------------------
 * Liste **ordonnée** de liens. Server Component : aucun état, l'ordre est
 * celui du contenu, et chaque lien est une cible explicite (`<a>`).
 *
 * **Plus un container autonome** : la barre est rendue par `ContactInfoBlock`
 * comme dernière ligne du bloc coordonnées, sous Téléphone / Mobile / E-mail.
 * Elle n'ajoute donc **aucune marge haute** : l'espacement vient du `gap-12` de
 * la grille `.contact-info`, la même valeur que celle séparant Adresse et
 * Téléphone. Un `margin-top` se cumulerait avec ce `gap`.
 *
 * Deux axes de réglage strictement séparés :
 *   - la **forme** est un habillage neutre (`--surface-color` + filet) ;
 *   - le **mode couleur** ne règle que la couleur du glyphe.
 *
 * Le mode `theme` n'emploie **pas** `--primary` (qui vaut `--accent-color`, un
 * rose très clair) : un glyphe de 18 px dans cette teinte sur une surface nacrée
 * serait quasi illisible. On utilise `--text-color` — l'encre du thème — et
 * l'accent reste porté par le survol et le filet.
 * ============================================================================
 */

const ALIGNMENT_CLASS: Record<ContactSocialStyle["alignment"], string> = {
  left: "justify-start",
  center: "justify-center",
  right: "justify-end",
};

export function SocialLinks({
  links,
  style,
}: {
  links: ContactSocialLink[];
  style: ContactSocialStyle;
}) {
  if (links.length === 0) {
    return null;
  }

  const usesCustomColor = style.colorMode === "custom";

  return (
    <ul
      className={cn(
        "contact-social flex flex-wrap items-center gap-3",
        ALIGNMENT_CLASS[style.alignment]
      )}
      style={
        {
          // Une seule variable pilote la couleur du glyphe ; la passer par le
          // style évite d'inventer une classe par valeur hexadécimale.
          "--contact-social-color": usesCustomColor
            ? style.customColor
            : "var(--text-color)",
        } as React.CSSProperties
      }
    >
      {links.map((link) => {
        const Icon = CONTACT_SOCIAL_ICONS[link.network];
        const label = contactSocialNetworkLabels[link.network];
        return (
          <li key={link.id}>
            <a
              href={link.url}
              target="_blank"
              // `noopener` : la page ouverte ne doit pas pouvoir manipuler la
              // nôtre ; `me` : le lien appartient à l'identité du site.
              rel="noopener noreferrer me"
              aria-label={`${label} (nouvel onglet)`}
              title={label}
              className={cn(
                "contact-social__link",
                `contact-social__link--${style.shape}`
              )}
            >
              <Icon
                aria-hidden={true}
                className="contact-social__icon"
                size={18}
                // `default` active la couleur officielle de la marque ; le mode
                // `theme`/`custom` laisse le glyphe hériter de la variable CSS.
                color={style.colorMode === "official" ? "default" : "currentColor"}
              />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
