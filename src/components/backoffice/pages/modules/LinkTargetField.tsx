"use client";

import * as React from "react";
import { AlertCircle, ArrowRight } from "lucide-react";

import { usePagesStore } from "@/components/backoffice/PagesStoreProvider";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  collectAnchorTargets,
  collectPageTargets,
  describeLinkTarget,
  detectCtaTargetMode,
  isExternalHref,
  type AnchorTarget,
  type LinkTargetIndex,
} from "@/lib/link-targets";
import type { PageModule } from "@/lib/pages";
import { cn } from "@/lib/utils";

import { useCurrentPage } from "../CurrentPageContext";
import { HelpTip, LabelWithTip, TextField } from "./form-fields";

/**
 * ============================================================================
 * CHAMP « LIEN DU BOUTON » — sélecteur de cible (Étape 11.2)
 * ----------------------------------------------------------------------------
 * Remplace la saisie libre d'URL par **deux menus déroulants** + **un champ
 * libre conservé** (rétrocompatibilité : `https://…`, `mailto:`, `tel:` restent
 * possibles). Objectif : un photographe non technique n'a plus à connaître un
 * slug ni un identifiant d'ancre généré (`hero-1`, `gallery-2`).
 *
 * Principe clé (D-2) : **le mode de la cible est DÉRIVÉ de `href`**, jamais
 * stocké. L'exclusion mutuelle des deux menus en découle gratuitement — choisir
 * une page fait afficher « Aucune » au menu des sections, et inversement.
 * Aucun état local à synchroniser, donc aucun état incohérent possible.
 *
 * Libellés (D-10) : on nomme la **cible**, pas une hiérarchie. Le mot « ancre »
 * n'apparaît que dans l'infobulle — les termes « sous-page », « niveau 1 » et
 * « niveau 2 » sont proscrits (D-3 révisée : ce sont des positions dans un menu,
 * pas des pages).
 *
 * Aperçu (D-11) : sous les menus, une phrase en clair (« Vous serez emmené
 * vers : Portfolio › Galerie mariage ») évite de déchiffrer `/portfolio#mariages`
 * et signale une page brouillon ou une section masquée.
 *
 * Composant générique (aucune dépendance à la galerie) : réutilisable tel quel
 * pour le CTA de la rubrique Héro.
 *
 * Référence : plans/ROADMAP-11.16-galleries-albums-cta-linkpicker.md §2
 * ============================================================================
 */

/** Valeur sentinelle de l'option neutre — Radix refuse `value=""` et les valeurs hors options. */
const NONE_VALUE = "__none__";

type LinkTargetFieldProps = {
  /** `href` courant (source de vérité : le mode en est déduit). */
  value: string;
  onChange: (href: string) => void;
  /** Titre de la rubrique (défaut « Lien du bouton »). */
  label?: string;
  /** Explication affichée dans l'infobulle « i » du titre. */
  tip?: string;
  /** Aide affichée sous le champ. */
  hint?: string;
  className?: string;
};

/** Un groupe du menu des sections = une page hôte (ordre du helper conservé). */
type AnchorGroup = {
  pageId: string;
  pageTitle: string;
  isCurrentPage: boolean;
  targets: AnchorTarget[];
};

export function LinkTargetField({
  value,
  onChange,
  label = "Lien du bouton",
  tip,
  hint,
  className,
}: LinkTargetFieldProps) {
  const { pages, getModules } = usePagesStore();
  const { pageId: currentPageId } = useCurrentPage();
  const pageFieldId = React.useId();
  const anchorFieldId = React.useId();

  // Index des cibles connues : alimente les deux menus ET la dérivation du mode.
  const index = React.useMemo<LinkTargetIndex>(() => {
    const modulesByPage: Record<string, PageModule[]> = {};
    for (const page of pages) {
      modulesByPage[page.id] = getModules(page.id);
    }
    return {
      pages: collectPageTargets(pages),
      anchors: collectAnchorTargets(pages, modulesByPage, currentPageId),
    };
  }, [pages, getModules, currentPageId]);

  // Regroupement du menu 2 par page hôte (les cibles sont déjà triées
  // par page puis par libellé de section côté helper).
  const anchorGroups = React.useMemo<AnchorGroup[]>(() => {
    const groups: AnchorGroup[] = [];
    for (const target of index.anchors) {
      const last = groups[groups.length - 1];
      if (last !== undefined && last.pageId === target.pageId) {
        last.targets.push(target);
        continue;
      }
      groups.push({
        pageId: target.pageId,
        pageTitle: target.pageTitle,
        isCurrentPage: target.isCurrentPage,
        targets: [target],
      });
    }
    return groups;
  }, [index.anchors]);

  const mode = detectCtaTargetMode(value, index);
  const preview = React.useMemo(
    () => describeLinkTarget(value, index),
    [value, index]
  );

  // Le champ libre n'affiche que la valeur « personnalisée » : les menus
  // affichent « Aucune », chacun pour sa part.
  const freeFieldValue = mode === "custom" ? value : "";

  function handlePageSelect(next: string) {
    if (next !== NONE_VALUE) {
      onChange(next);
      return;
    }
    // « Aucune » sur le menu ACTIF vide la destination. Sur le menu inactif,
    // aucun effet : la cible courante n'est jamais détruite par surprise.
    if (mode === "page") {
      onChange("");
    }
  }

  function handleAnchorSelect(next: string) {
    if (next !== NONE_VALUE) {
      onChange(next);
      return;
    }
    if (mode === "anchor") {
      onChange("");
    }
  }

  return (
    <fieldset
      className={cn(
        "grid gap-3 rounded-md border border-dashed border-border bg-background/40 p-3",
        className
      )}
    >
      <legend className="flex items-center gap-1.5 px-1 text-xs font-medium text-foreground">
        {label}
        {tip ? <HelpTip tip={tip} /> : null}
      </legend>

      <div className="grid gap-3 sm:grid-cols-2">
        {/* ---- Menu 1 : pages du site (tri alphabétique) ---- */}
        <div className="grid gap-1.5">
          <LabelWithTip
            label="Aller vers une page du site"
            htmlFor={pageFieldId}
            tip="Choisissez une page existante du site : la destination restera juste tant que la page existe."
          />
          <Select
            value={mode === "page" ? value : NONE_VALUE}
            onValueChange={handlePageSelect}
            disabled={index.pages.length === 0}
          >
            <SelectTrigger id={pageFieldId} className="w-full">
              <SelectValue placeholder="— Aucune —" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE_VALUE}>— Aucune —</SelectItem>
              {index.pages.map((target) => (
                <SelectItem key={target.href} value={target.href}>
                  {target.draft ? `${target.label} (brouillon)` : target.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {index.pages.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Aucune page disponible pour l’instant.
            </p>
          ) : null}
        </div>

        {/* ---- Menu 2 : sections (ancres), groupées par page ---- */}
        <div className="grid gap-1.5">
          <LabelWithTip
            label="Aller vers une section de page"
            htmlFor={anchorFieldId}
            tip="Une section est une partie de votre page : bannière, galerie, tarifs… Son identifiant technique (appelé « ancre ») est réglé dans les paramètres de chaque section."
          />
          <Select
            value={mode === "anchor" ? value : NONE_VALUE}
            onValueChange={handleAnchorSelect}
            disabled={index.anchors.length === 0}
          >
            <SelectTrigger id={anchorFieldId} className="w-full">
              <SelectValue placeholder="— Aucune —" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE_VALUE}>— Aucune —</SelectItem>
              {anchorGroups.map((group) => (
                <SelectGroup key={group.pageId}>
                  <SelectLabel>
                    {group.isCurrentPage
                      ? `${group.pageTitle} (page en cours)`
                      : group.pageTitle}
                  </SelectLabel>
                  {group.targets.map((target) => (
                    <SelectItem key={target.href} value={target.href}>
                      {target.hidden
                        ? `${target.label} (masqué)`
                        : target.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
          {index.anchors.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Aucune section disponible pour l’instant.
            </p>
          ) : null}
        </div>
      </div>

      {/* ---- Porte de sortie : liens externes et protocoles ---- */}
      <TextField
        label="Ou collez un lien"
        value={freeFieldValue}
        onChange={onChange}
        placeholder="https://…, mailto:…, tel:…"
        hint={
          isExternalHref(value)
            ? "Le bouton s’ouvrira dans un nouvel onglet."
            : "Adresse d’un site externe, d’un e-mail ou d’un téléphone."
        }
        mono
      />

      {/* ---- Aperçu de la destination (D-11) ---- */}
      {value.trim() !== "" ? (
        <div className="grid gap-1">
          <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <ArrowRight
              aria-hidden="true"
              className="mt-0.5 size-3.5 shrink-0"
            />
            <span>{preview.text}</span>
          </p>
          {preview.warning !== null ? (
            <p className="flex items-start gap-1.5 text-xs text-orange-600">
              <AlertCircle
                aria-hidden="true"
                className="mt-0.5 size-3.5 shrink-0"
              />
              <span>{preview.warning}</span>
            </p>
          ) : null}
        </div>
      ) : null}

      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </fieldset>
  );
}
