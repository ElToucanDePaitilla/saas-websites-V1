import * as React from "react";

import type { RichTextDoc } from "@/lib/pages";

/**
 * ============================================================================
 * RENDU DU TEXTE RICHE — document ProseMirror → React (Étape 12.1, lot F)
 * ----------------------------------------------------------------------------
 * Le texte riche **n'est jamais stocké en HTML** : il vit sous forme d'arbre
 * JSON ProseMirror (`RichTextDoc`). Ce composant est la seule projection vers
 * le DOM, et il fonctionne par **liste blanche** : chaque type de nœud et chaque
 * marque est traduit explicitement, tout le reste est ignoré.
 *
 * Trois conséquences, qui sont exactement celles recherchées :
 *
 *   1. **Aucune surface d'injection.** Pas de `dangerouslySetInnerHTML`, donc
 *      pas de script ni d'attribut exotique possible, quel que soit le contenu
 *      du JSONB — y compris un contenu écrit à la main dans la base.
 *   2. **Aucun style sauvage.** Le HTML produit ne porte ni `style`, ni classe
 *      choisie par l'utilisateur : la mise en forme vient des jetons du thème.
 *   3. **Server Component.** Le site public reste statique/ISR ; aucun
 *      `contentEditable` n'est monté côté visiteur.
 *
 * Le rendu sémantique est volontairement conservateur : `<p>`, `<h2>` à `<h4>`,
 * `<ul>` / `<ol>` / `<li>`, `<blockquote>`, `<hr>`, `<pre><code>`, et les
 * marques en ligne `strong` / `em` / `u` / `s` / `code` / `a`.
 * ============================================================================
 */

/** Garde locale : objet simple non nul (le `isRecord` de `pages.ts` est privé). */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Lit une liste de nœuds en écartant tout ce qui n'est pas un objet. */
function readNodes(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const nodes: Record<string, unknown>[] = [];
  for (const entry of value) {
    if (isRecord(entry)) {
      nodes.push(entry);
    }
  }
  return nodes;
}

/** Lit un attribut texte d'un nœud (`attrs.href`, `attrs.level`…). */
function readAttr(node: Record<string, unknown>, key: string): unknown {
  const attrs = isRecord(node.attrs) ? node.attrs : {};
  return attrs[key];
}

/** Applique les marques en ligne à un fragment de texte. */
function renderText(node: Record<string, unknown>, key: string): React.ReactNode {
  const text = typeof node.text === "string" ? node.text : "";
  let element: React.ReactNode = text;

  for (const mark of readNodes(node.marks)) {
    switch (mark.type) {
      case "bold":
        element = <strong>{element}</strong>;
        break;
      case "italic":
        element = <em>{element}</em>;
        break;
      case "underline":
        element = <u>{element}</u>;
        break;
      case "strike":
        element = <s>{element}</s>;
        break;
      case "code":
        element = <code>{element}</code>;
        break;
      case "link": {
        const href = readAttr(mark, "href");
        const target = typeof href === "string" ? href : "";
        // Une URL absolue s'ouvre dans un nouvel onglet ; un lien interne ou une
        // ancre reste dans l'onglet courant. (Le défilement compensé sous le
        // Header fixe sera apporté par `NavLink` au lot I, avec l'édition de
        // lien — précédent : étape 11.26 pour les CTA de Héro et de bandeau.)
        const external = /^https?:\/\//i.test(target);
        element = (
          <a
            href={target}
            className="underline underline-offset-2"
            {...(external
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
          >
            {element}
          </a>
        );
        break;
      }
      default:
        break;
    }
  }

  return <React.Fragment key={key}>{element}</React.Fragment>;
}

/** Rend les enfants d'un nœud. */
function renderChildren(
  node: Record<string, unknown>,
  key: string
): React.ReactNode {
  const nodes = readNodes(node.content);
  if (nodes.length === 0) {
    return null;
  }
  return nodes.map((child, index) => renderNode(child, `${key}.${index}`));
}

/**
 * Contenu d'un bloc, avec le **retour à la ligne de remplissage** qui rend sa
 * hauteur à un bloc vide.
 *
 * C'est le cœur du correctif des « retours de chariot répétés ». Dans l'éditeur,
 * ProseMirror insère un `<br>` dans chaque bloc de texte vide (son *trailing
 * break*) : la ligne conserve alors sa hauteur, et appuyer deux fois sur Entrée
 * **descend réellement** le contenu suivant. Rendu en `<p></p>`, un bloc vide
 * n'a en revanche **aucune hauteur de contenu** — seul `margin-bottom` subsiste,
 * et les lignes vides s'effondrent : l'aperçu ne ressemblait plus à l'édition.
 *
 * On reproduit donc **le mécanisme de l'éditeur lui-même**, plutôt que d'en
 * inventer un autre (`white-space: pre-wrap` figerait les espaces accidentels
 * et exposerait au débordement horizontal). Une `<br>` explicite donne une
 * hauteur de ligne exacte, identique dans les deux contextes, sans toucher au
 * flux, à la mise en page responsive ni aux marges entre blocs — deux
 * paragraphes consécutifs ne portant qu'une marge basse, elles ne fusionnent
 * pas.
 */
function blockChildren(children: React.ReactNode): React.ReactNode {
  return children === null ? <br /> : children;
}

/** Rend un nœud (bloc ou texte) — **liste blanche** stricte. */
function renderNode(node: Record<string, unknown>, key: string): React.ReactNode {
  const type = node.type;

  if (type === "text") {
    return renderText(node, key);
  }
  if (type === "hardBreak") {
    return <br key={key} />;
  }

  const children = blockChildren(renderChildren(node, key));

  switch (type) {
    case "paragraph":
      return <p key={key}>{children}</p>;
    case "heading": {
      // Niveaux bornés à H2–H4 (le H1 appartient au Héro) ; tout autre niveau
      // retombe sur H3 plutôt que de produire une balise inattendue.
      const level = readAttr(node, "level");
      if (level === 2) {
        return <h2 key={key}>{children}</h2>;
      }
      if (level === 4) {
        return <h4 key={key}>{children}</h4>;
      }
      return <h3 key={key}>{children}</h3>;
    }
    case "bulletList":
      return <ul key={key}>{children}</ul>;
    case "orderedList":
      return <ol key={key}>{children}</ol>;
    case "listItem":
      return <li key={key}>{children}</li>;
    case "blockquote":
      return <blockquote key={key}>{children}</blockquote>;
    case "codeBlock":
      return (
        <pre key={key}>
          <code>{children}</code>
        </pre>
      );
    case "horizontalRule":
      return <hr key={key} />;
    default:
      // Nœud inconnu : ses enfants sont conservés, jamais son balisage.
      return <React.Fragment key={key}>{children}</React.Fragment>;
  }
}

/**
 * Portée de styles du contenu — **source unique**, définie dans
 * [`globals.css`](../../../app/globals.css) et partagée telle quelle par
 * l'éditeur riche du back-office (la classe est posée sur le `contentEditable`
 * lui-même, dans les deux cas).
 *
 * C'est ce partage qui rend le WYSIWYG crédible : l'aperçu et le site publié ne
 * peuvent pas diverger, puisqu'ils consomment la même déclaration.
 */
const RICH_TEXT_CLASS = "rich-content";

/** Rend un document de texte riche en HTML sémantique stylé. */
export function RichTextRenderer({
  doc,
  className,
}: {
  doc: RichTextDoc;
  className?: string;
}) {
  const nodes = readNodes(doc.content);
  if (nodes.length === 0) {
    return null;
  }
  return (
    <div className={className ? `${RICH_TEXT_CLASS} ${className}` : RICH_TEXT_CLASS}>
      {nodes.map((node, index) => renderNode(node, `n${index}`))}
    </div>
  );
}
