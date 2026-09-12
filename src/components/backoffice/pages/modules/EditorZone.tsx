"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

import { EDITOR_INDENT, EDITOR_TYPE } from "./editor-type";

/**
 * ============================================================================
 * ZONE D'ÉDITION — bloc de regroupement des formulaires de modules (11.17)
 * ----------------------------------------------------------------------------
 * Répond à la cause racine n°1 du plan `plans/ROADMAP-11.17-editor-zones-ux.md` :
 * les éditeurs empilaient quatre **échelles** différentes (le bloc, la galerie,
 * les albums, la photo) dans un même flux vertical, sans aucun marqueur de
 * niveau. L'utilisateur ne pouvait pas savoir « à quoi s'applique ce que je
 * lis ».
 *
 * Chaque zone impose donc deux textes obligatoires :
 *   - `title` — nomme explicitement sa **cible** (« Disposition des photos ») ;
 *   - `scope` — dit sa **portée** (« Ces réglages s'appliquent à toutes les
 *     photos… »), ce qui répond mécaniquement à tous les « de quoi ? ».
 *
 * Principes appliqués : P1 (nommer la cible), P2 (dire la portée), P3 (une
 * couleur = une question utilisateur, quatre au maximum) et P4 (zéro jargon).
 *
 * Choix techniques :
 *   - **Composant purement présentationnel** : aucun accès au store, aucune
 *     logique métier ;
 *   - **aucune dépendance nouvelle** : `@radix-ui/react-collapsible` n'est pas
 *     installé et imbriquer un `Accordion` Radix dans l'accordéon des modules
 *     créerait deux mécanismes d'affichage concurrents. Le repli est donc un
 *     simple état local avec `aria-expanded` / `aria-controls` ;
 *   - la teinte sert d'**accent** (bordure gauche + pastille + titre), jamais de
 *     fond plein : le contraste texte/fond reste celui des surfaces du thème ;
 *   - le bouton de repli est un **frère** du titre, jamais son parent — un
 *     `<h5>` n'est pas autorisé dans un `<button>`.
 *
 * Référence : plans/ROADMAP-11.17-editor-zones-ux.md §4.1
 * ============================================================================
 */

/**
 * Teinte d'accent — une par **question** utilisateur, quatre au maximum (P3).
 * Les noms sont volontairement génériques : les mêmes quatre accents servent
 * tous les éditeurs de modules (une galerie, une FAQ, un contact…), la teinte
 * n'ayant de sens que par opposition aux trois autres.
 */
export type EditorZoneTone = "content" | "style" | "detail" | "action";

/** Variable CSS portée par chaque teinte (déclarée dans `globals.css`). */
const TONE_VARIABLES: Record<EditorZoneTone, string> = {
  content: "var(--zone-content)",
  style: "var(--zone-style)",
  detail: "var(--zone-detail)",
  action: "var(--zone-action)",
};

type EditorZoneProps = {
  /** Identifiant du bloc, utilisé par la barre d'ancres (`id` HTML). */
  id?: string;
  /** Titre : nomme la cible de la zone (« Disposition des photos »). */
  title: string;
  /** Phrase de portée, obligatoire : « Ces réglages s'appliquent à… ». */
  scope: string;
  /** Teinte d'accent (P3). */
  tone: EditorZoneTone;
  /** true → la zone est repliable (utilisé pour les réglages avancés). */
  collapsible?: boolean;
  /** État initial du repli (défaut : false — une zone standard reste ouverte). */
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
};

export function EditorZone({
  id,
  title,
  scope,
  tone,
  collapsible = false,
  defaultOpen = false,
  children,
  className,
}: EditorZoneProps) {
  const generatedId = React.useId();
  const contentId = `${id ?? generatedId}-content`;
  const titleId = `${id ?? generatedId}-title`;
  const scopeId = `${id ?? generatedId}-scope`;
  const toneColor = TONE_VARIABLES[tone];

  // Une zone non repliable est toujours ouverte ; l'état n'est créé que pour
  // les zones repliables (défaut : repliée, cf. « Réglages avancés »).
  const [open, setOpen] = React.useState(defaultOpen || !collapsible);

  return (
    <section
      id={id}
      aria-labelledby={titleId}
      className={cn(
        "grid gap-3 rounded-r-md border border-l-4 border-border bg-background/50 p-3",
        className
      )}
      style={{ borderLeftColor: toneColor }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="grid gap-1.5">
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="h-4 w-1 shrink-0 rounded-full"
              style={{ backgroundColor: toneColor }}
            />
            {/* N1 de l'échelle des éditeurs (voir `editor-type.ts`) : le plus
                haut niveau DANS le formulaire, sous le nom du module (N0). */}
            <h5 id={titleId} className={EDITOR_TYPE.zoneTitle}>
              {title}
            </h5>
          </div>
          <p id={scopeId} className={EDITOR_TYPE.zoneScope}>
            {scope}
          </p>
        </div>

        {collapsible ? (
          <button
            type="button"
            aria-expanded={open}
            aria-controls={contentId}
            aria-label={open ? `Replier « ${title} »` : `Déplier « ${title} »`}
            title={open ? "Replier cette rubrique" : "Déplier cette rubrique"}
            onClick={() => setOpen((previous) => !previous)}
            className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <ChevronDown
              aria-hidden="true"
              className={cn(
                "size-4 transition-transform duration-200",
                open && "rotate-180"
              )}
            />
          </button>
        ) : null}
      </div>

      <div
        id={contentId}
        role={collapsible ? "region" : undefined}
        aria-labelledby={collapsible ? titleId : undefined}
        hidden={collapsible && !open}
        className={cn(
          "grid gap-3",
          // La **géométrie** double la typographie : le contenu de la zone est
          // décalé d'un cran, donc l'imbrication se lit sans comparer les tailles.
          EDITOR_INDENT.zoneContent,
          !open && "hidden"
        )}
      >
        {children}
      </div>
    </section>
  );
}

/**
 * ----------------------------------------------------------------------------
 * SOUS-BLOC D'UNE ZONE — `EditorSubZone`
 * ----------------------------------------------------------------------------
 * Boîte en **pointillés**, qui signale un niveau **imbriqué** dans une zone.
 * C'est la convention visuelle de tout le back-office :
 *
 *   - bordure **pleine + accent coloré** → une `EditorZone` (niveau 1) ;
 *   - bordure **en pointillés**          → un sous-bloc (niveau 2).
 *
 * Un sous-bloc porte un titre court mais **pas** de phrase de portée : la
 * portée est déjà annoncée par la zone parente (P2). Il est utilisé pour
 * regrouper des réglages qui se décident ensemble — par exemple « Disposition
 * de la grille », « Cadre et finition » et « Au survol des photos » à
 * l'intérieur de la zone « Apparence des photos ».
 * ============================================================================
 */
export function EditorSubZone({
  title,
  children,
  className,
}: {
  /** Titre court du sous-bloc (le sujet des réglages qu'il contient). */
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid gap-3 rounded-md border border-dashed border-border bg-background/40 p-3",
        className
      )}
    >
      {/* N3 de l'échelle : nettement au-dessus du libellé de champ (N4), dont
          il partageait auparavant taille, graisse ET couleur. */}
      <p className={EDITOR_TYPE.subTitle}>{title}</p>
      <div className={cn("grid gap-3", EDITOR_INDENT.subZoneContent)}>
        {children}
      </div>
    </div>
  );
}
