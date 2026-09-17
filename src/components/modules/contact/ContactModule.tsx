import {
  resolveContactContent,
  type PageModule,
} from "@/lib/pages";
import { cn } from "@/lib/utils";

import { ContactForm } from "./ContactForm";
import { ContactInfoBlock, hasVisibleContactInfo } from "./ContactInfoBlock";
import { contactFrameCssVars } from "./contactFrame";

/**
 * ============================================================================
 * MODULE « CONTACT » — rendu public, trois containers (Étapes 14.1 & 14.1.d)
 * ----------------------------------------------------------------------------
 *   C1 chapeau (titre `h2`, sous-titre, paragraphe) ;
 *   C2 coordonnées       } côte à côte sur grand écran, empilés sur téléphone ;
 *   C3 formulaire        }
 *
 * Les **réseaux sociaux** ne forment plus un container à part : la barre est
 * rendue par `ContactInfoBlock`, en dernière ligne de C2 (14.1.d).
 *
 * Le contenu passe par `resolveContactContent` : le rendu ne lit jamais de JSONB
 * brut, un contenu tronqué ou hérité (email / phone / address à plat) reste
 * lisible.
 *
 * Le chapeau n'émet **aucun `h1`** : le titrage est décidé par la page
 * (`PublicModulesList`). Il n'y a pas non plus de style de champ back-office
 * dans le formulaire public.
 *
 * Si le container 2 est masqué — ou ne contient rien de visible — le formulaire
 * occupe seul la largeur, centré (`max-w-2xl mx-auto`), au lieu de flotter dans
 * une grille à deux colonnes dont la première serait vide.
 *
 * **Cadres (14.1.c)** : coordonnées et formulaire partagent le cadre du module
 * (`content.style.frame`, D7) — le formulaire est encadré **même quand C2 est
 * masqué**, sinon la page n'aurait plus qu'un seul bloc encadré et l'écho entre
 * les deux cartes serait rompu.
 * ============================================================================
 */
export function ContactModule({
  module,
  pageSlug,
}: {
  module: PageModule;
  pageSlug: string;
}) {
  const raw = module.content.type === "contact" ? module.content : null;
  if (raw === null) {
    return null;
  }

  const content = resolveContactContent(raw);
  const { visibility, align } = content.layout;
  // Les réseaux comptent comme contenu de C2 (14.1.d) : un bloc qui n'aurait
  // que des icônes doit rester affiché.
  const showInfo = hasVisibleContactInfo(
    content.info,
    visibility,
    content.social.length > 0
  );
  const centered = align === "center";

  const hasHeader =
    content.heading.trim() !== "" ||
    content.subtitle.trim() !== "" ||
    content.intro.trim() !== "";

  return (
    <section
      id={module.anchorId}
      className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8"
    >
      {hasHeader ? (
        <div className={cn("max-w-2xl", centered && "mx-auto text-center")}>
          {content.heading.trim() !== "" ? (
            <h2 className="module-h2">{content.heading}</h2>
          ) : null}
          {content.subtitle.trim() !== "" ? (
            <p className="contact-section__subtitle">{content.subtitle}</p>
          ) : null}
          {content.intro.trim() !== "" ? (
            <p className="contact-section__intro">{content.intro}</p>
          ) : null}
        </div>
      ) : null}

      <div
        className={cn(
          "mt-12",
          showInfo ? "grid gap-10 lg:grid-cols-2" : "mx-auto max-w-2xl"
        )}
      >
        {showInfo ? (
          <ContactInfoBlock
            info={content.info}
            visibility={visibility}
            frame={content.style.frame}
            social={content.social}
            socialStyle={content.style.social}
          />
        ) : null}
        <div
          className="contact-frame contact-frame--form"
          style={contactFrameCssVars(content.style.frame)}
        >
          <ContactForm settings={content.form} pageSlug={pageSlug} />
        </div>
      </div>
    </section>
  );
}
