import type { CSSProperties } from "react";

import { RevealHero } from "@/components/modules/hero/RevealHero";
import { contactFrameCssVars } from "@/components/modules/contact/contactFrame";
import {
  contactMapAddress,
  contactMapDirectionsUrl,
  contactMapEmbedUrl,
} from "@/lib/contact-map";
import {
  resolveContactMapContent,
  type ContactMapBgVariant,
  type ContactMapContent,
  type ContactMapOverlayIntensity,
  type ContactMapStyleSettings,
  type PageModule,
} from "@/lib/pages";
import { cn } from "@/lib/utils";

/**
 * ============================================================================
 * MODULE « CONTACT MAP » — rendu public (Étape 14.2)
 * ----------------------------------------------------------------------------
 * Chapeau (H2/H3/paragraphe) puis **deux conteneurs de hauteur égale** :
 *   - la carte Google Maps embarquée ;
 *   - les informations pratiques (adresse, parking, horaires, zone, itinéraire).
 *
 * L'ordre des deux conteneurs est permutable (`content.mapPosition`, réglage de
 * module) : c'est le tableau ordonné qui décide, pas une seconde variante de
 * rendu — deux composants jumeaux auraient doublé chaque correctif.
 *
 * L'adresse vient du profil **au rendu** (D3) via la prop `ownerAddress`, avec
 * repli sur `customAddress` (`contactMapAddress`). Une adresse vide n'ouvre
 * **jamais** d'iframe : Maps afficherait le monde entier, un cadre vide et muet
 * pour le visiteur ; on préfère un placeholder explicite et l'absence du bouton
 * d'itinéraire — un réglage sans objet est un piège.
 *
 * Le module n'émet **aucun `h1`** (invariant de titrage de `PublicModulesList`).
 * L'iframe porte un `title`, l'overlay est `aria-hidden`, et l'itinéraire
 * s'ouvre en nouvel onglet avec `rel="noopener noreferrer"`.
 *
 * Cadres (D6) : les deux conteneurs partagent le même réglage que le module
 * contact (`contactFrameCssVars`) — mêmes variables, même classe de base
 * `.contact-map__frame`. Le fond de section (D7) est une **couleur unie**
 * seulement : aucun média, aucun effet de survol, contrairement aux bandeaux.
 * ============================================================================
 */

/** Variables CSS personnalisées posées en style inline (idiome CardItem). */
type CSSVars = CSSProperties & Record<`--${string}`, string>;

/** Voile posé sur l'iframe, par intensité — 0 reste une valeur légitime. */
const OVERLAY_OPACITY: Record<ContactMapOverlayIntensity, string> = {
  none: "0",
  light: "0.15",
  medium: "0.35",
  strong: "0.55",
};

/** Fonds de section non personnalisés (le cas `custom` est traité à part). */
const BG_FALLBACK: Record<
  Exclude<ContactMapBgVariant, "custom">,
  { bg: string; text: string }
> = {
  default: { bg: "var(--bg-color)", text: "var(--text-color)" },
  surface: { bg: "var(--surface-color)", text: "var(--text-color)" },
  // « Contraste » inverse encre et fond : le texte doit suivre le fond peint,
  // sinon la section serait noire sur noire en mode clair.
  contrast: { bg: "var(--text-color)", text: "var(--bg-color)" },
};

/**
 * Traduit le fond de section en variables CSS.
 *
 * Le texte suit le fond : en variante « contraste », peindre l'encre du thème
 * sans inverser la couleur du texte rendrait la section illisible (même
 * mécanique que le ton de texte des bandeaux).
 */
function contactMapCssVars(style: ContactMapStyleSettings): CSSVars {
  const overlay = OVERLAY_OPACITY[style.overlayIntensity];
  if (style.bgVariant === "custom") {
    return {
      "--contact-map-bg": style.customBgColor,
      "--contact-map-text": "var(--text-color)",
      "--contact-map-overlay": overlay,
    };
  }
  const { bg, text } = BG_FALLBACK[style.bgVariant];
  return {
    "--contact-map-bg": bg,
    "--contact-map-text": text,
    "--contact-map-overlay": overlay,
  };
}

/** Carte embarquée — iframe, ou placeholder si aucune adresse n'est résolue. */
function MapFrame({
  address,
  content,
}: {
  address: string;
  content: ContactMapContent;
}) {
  const hasAddress = address !== "";
  return (
    <div className="contact-map__frame contact-map__frame--map">
      <div
        className={cn(
          "contact-map__map",
          !hasAddress && "contact-map__map--empty"
        )}
      >
        {hasAddress ? (
          <>
            <iframe
              className={cn(
                "contact-map__iframe",
                `contact-map__iframe--${content.style.mapFilterStyle}`
              )}
              src={contactMapEmbedUrl(address, content.zoom, content.mapType)}
              title="Plan d’accès"
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
            />
            <div className="contact-map__overlay" aria-hidden="true" />
          </>
        ) : (
          <p>Adresse non renseignée</p>
        )}
      </div>
    </div>
  );
}

/** Informations pratiques — adresse, lignes masquables et bouton d'itinéraire. */
function InfoFrame({
  address,
  content,
}: {
  address: string;
  content: ContactMapContent;
}) {
  const showAddress = content.showAddressGroup && address !== "";
  const showParking =
    content.showParking && content.parkingText.trim() !== "";
  const showHoraires =
    content.showHoraires && content.horairesText.trim() !== "";
  const showZone =
    content.showZoneIntervention && content.zoneInterventionText.trim() !== "";
  const hasLines = showParking || showHoraires || showZone;

  return (
    <div className="contact-map__frame contact-map__info">
      {showAddress ? (
        <address className="contact-map__address not-italic">{address}</address>
      ) : null}

      {/* Le `<dl>` n'existe que s'il lui reste une ligne : un `<dl>` vide
          laisserait un trou dans le cadre (même garde que le module contact). */}
      {hasLines ? (
        <dl className="contact-map__lines">
          {showParking ? (
            <div>
              <dt>Parking</dt>
              <dd className="contact-map__preline">
                {content.parkingText.trim()}
              </dd>
            </div>
          ) : null}
          {showHoraires ? (
            <div>
              <dt>Horaires</dt>
              <dd className="contact-map__preline">
                {content.horairesText.trim()}
              </dd>
            </div>
          ) : null}
          {showZone ? (
            <div>
              <dt>Zone d’intervention</dt>
              <dd className="contact-map__preline">
                {content.zoneInterventionText.trim()}
              </dd>
            </div>
          ) : null}
        </dl>
      ) : null}

      {/* Bouton masqué sans adresse : une destination vide ouvrirait un
          itinéraire vers nulle part. */}
      {content.showDirectionsButton && address !== "" ? (
        <a
          className="contact-map__directions"
          href={contactMapDirectionsUrl(address)}
          target="_blank"
          rel="noopener noreferrer"
        >
          Obtenir l’itinéraire
        </a>
      ) : null}
    </div>
  );
}

export function ContactMapModule({
  module,
  ownerAddress = "",
}: {
  module: PageModule;
  /**
   * Adresse du profil, résolue par le loader serveur **uniquement** si un
   * module `contact-map` la demande (D3). Absente sur les pages qui n'ouvrent
   * pas de lecture profil (démonstration) : le repli `customAddress` s'applique.
   */
  ownerAddress?: string;
}) {
  const raw = module.content.type === "contact-map" ? module.content : null;
  if (raw === null) {
    return null;
  }

  const content = resolveContactMapContent(raw);
  const address = contactMapAddress(content, ownerAddress);
  const centered = content.headerAlignment === "center";

  const hasHeader =
    content.title.trim() !== "" ||
    content.subtitle.trim() !== "" ||
    content.description.trim() !== "";
  const hasInfo =
    (content.showAddressGroup && address !== "") ||
    (content.showParking && content.parkingText.trim() !== "") ||
    (content.showHoraires && content.horairesText.trim() !== "") ||
    (content.showZoneIntervention &&
      content.zoneInterventionText.trim() !== "") ||
    (content.showDirectionsButton && address !== "");

  const mapFrame = <MapFrame key="map" address={address} content={content} />;
  const infoFrame = <InfoFrame key="info" address={address} content={content} />;

  return (
    <section
      id={module.anchorId}
      className={cn(
        "contact-map py-20",
        `contact-map--bg-${content.style.bgVariant}`,
        // Le fondu au thème a besoin de la classe : le voile passe en `multiply`
        // pour épouser le fond, et n'agit que sous ce filtre (cf. globals.css).
        content.style.mapFilterStyle === "theme-blend" && "contact-map--blend"
      )}
      style={{
        ...contactFrameCssVars(content.style.frame),
        ...contactMapCssVars(content.style),
      }}
    >
      <RevealHero animation={module.animation}>
        {/* Le fond de section est **pleine largeur** (D7), le contenu reste
            borné à la largeur éditoriale du site : sans ce conteneur, la
            grille carte/infos s'étalerait sur toute la fenêtre. */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {hasHeader ? (
            <div className={cn("max-w-2xl", centered && "mx-auto text-center")}>
              {content.title.trim() !== "" ? (
                <h2 className="module-h2">{content.title}</h2>
              ) : null}
              {content.subtitle.trim() !== "" ? (
                <h3 className="module-h3 mt-3">{content.subtitle}</h3>
              ) : null}
              {content.description.trim() !== "" ? (
                <p className="mt-5 text-[var(--text-muted)]">
                  {content.description}
                </p>
              ) : null}
            </div>
          ) : null}

          {hasInfo ? (
            <div className="contact-map__grid mt-12">
              {/* L'ordre du tableau est le seul réglage de disposition : la
                  carte à gauche (conteneur 2) ou à droite (conteneur 3). */}
              {content.mapPosition === "container2"
                ? [mapFrame, infoFrame]
                : [infoFrame, mapFrame]}
            </div>
          ) : null}
        </div>
      </RevealHero>
    </section>
  );
}
