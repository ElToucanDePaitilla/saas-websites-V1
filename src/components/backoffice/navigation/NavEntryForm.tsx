"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  normalizeHref,
  type NavItemKind,
  type NavMenuEntry,
} from "@/lib/navigation";

/**
 * ============================================================================
 * FORMULAIRE — Item de menu « Navigation & Menus » (création & édition, 4.3)
 * ----------------------------------------------------------------------------
 * Client Component contrôlé, réutilisable en création (sans `initial`) et en
 * édition (avec `initial`). Champs :
 *   1. Libellé du lien (Input requis) ;
 *   2. Type de cible (Select) :
 *        - « Page du site » → `kind: "page"` (lien stable `pageId`) ;
 *        - « Lien personnalisé » → `kind: "custom"` (`pageId: null`) — ancre
 *          locale (`#contact`), chemin relatif + ancre (`/a-propos#equipe`) ou
 *          URL externe (`https://…`), normalisé par `normalizeHref` du modèle ;
 *   3. Cible — selon le type (Select des pages, ou champ libre préfixé « / ») ;
 *   4. « Rattachement » (Header uniquement) : racine du menu ou item de
 *      Niveau 1 du Header (choix du parent → sous-menu de Niveau 2).
 * Validation légère côté client (libellé + cible requis), sans bibliothèque
 * externe. Le formulaire est embarqué dans une Dialog par `NavigationManager`.
 *
 * Référence : plans/ROADMAP-4.3-navigation-advanced.md §1.6
 * ============================================================================
 */

/** Page disponible pour le choix de cible interne (liée par `pageId`). */
export type NavTargetPage = {
  id: string; // SitePage.id — lien stable Pages ↔ Navigation (4.2)
  menuTitle: string;
  href: string; // pageHref(slug), ex. "/portfolio"
};

/** Parent de Niveau 1 proposé pour le champ « Rattachement » (Header). */
export type NavParentOption = {
  id: string;
  label: string;
};

/** Données soumises par le formulaire. */
export type NavEntryFormData = {
  label: string;
  kind: NavItemKind;
  href: string;
  pageId: string | null;
  /** Parent visé (null = racine du menu). */
  parentId: string | null;
};

type NavEntryFormProps = {
  /** Item édité (absent → mode création). */
  initial?: NavMenuEntry;
  /** Pages du site proposées pour la cible « page ». */
  pages: NavTargetPage[];
  /** Items de Niveau 1 du Header proposés comme parent (vide sinon). */
  parentOptions: NavParentOption[];
  /** Parent courant de l'item (null = racine). */
  initialParentId?: string | null;
  /** true → affiche le champ « Rattachement » (Header uniquement). */
  showParent?: boolean;
  /** false → le choix de parent est verrouillé (racine). */
  parentEnabled?: boolean;
  /** Message affiché quand le choix de parent est verrouillé. */
  parentDisabledHint?: string;
  onSubmit: (data: NavEntryFormData) => void;
  onCancel: () => void;
  submitLabel?: string;
};

type FormErrors = Partial<Record<"label" | "href", string>>;

export function NavEntryForm({
  initial,
  pages,
  parentOptions,
  initialParentId = null,
  showParent = false,
  parentEnabled = true,
  parentDisabledHint = "",
  onSubmit,
  onCancel,
  submitLabel = "Enregistrer",
}: NavEntryFormProps) {
  const [label, setLabel] = React.useState(initial?.label ?? "");
  const [kind, setKind] = React.useState<NavItemKind>(initial?.kind ?? "page");
  const [href, setHref] = React.useState(initial?.href ?? "");
  const [parentId, setParentId] = React.useState<string | null>(
    initialParentId
  );
  const [errors, setErrors] = React.useState<FormErrors>({});

  /** Page sélectionnée (mode « page du site ») — valeur = id, null si custom. */
  const [selectedPageId, setSelectedPageId] = React.useState<string | null>(
    initial?.pageId ??
      (initial?.kind === "page" && pages.length > 0 ? pages[0].id : null)
  );

  /** Page sélectionnée courante (undefined si aucune / lien personnalisé). */
  const selectedPage = pages.find((page) => page.id === selectedPageId);

  /** Fait suivre `label` et `href` quand une page est choisie (si libellé non saisi). */
  function handleSelectPage(pageId: string) {
    setSelectedPageId(pageId);
    const page = pages.find((item) => item.id === pageId);
    if (!page) {
      return;
    }
    if (label.trim() === "" || kind !== "page") {
      setLabel(page.menuTitle);
    }
    setHref(page.href);
  }

  function handleChangeKind(nextKind: NavItemKind) {
    setKind(nextKind);
    if (nextKind === "page") {
      const page = pages[0];
      if (page) {
        setSelectedPageId(page.id);
        setHref(page.href);
      }
    } else {
      setSelectedPageId(null);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: FormErrors = {};
    const cleanLabel = label.trim();

    if (cleanLabel === "") {
      nextErrors.label = "Le libellé du lien est requis.";
    }

    const pageId =
      kind === "page" ? (selectedPage?.id ?? null) : null;
    const cleanHref =
      kind === "page"
        ? selectedPage?.href ?? ""
        : normalizeHref(href);

    if (cleanHref === "") {
      nextErrors.href =
        kind === "page"
          ? "Choisissez une page du site."
          : "Saisissez une ancre, un chemin ou une URL.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    onSubmit({ label: cleanLabel, kind, href: cleanHref, pageId, parentId });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-5">
      {/* ---- Libellé ---- */}
      <div className="grid gap-2">
        <Label htmlFor="nav-label">Libellé du lien</Label>
        <Input
          id="nav-label"
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          placeholder="Ex. Portfolio"
          aria-invalid={errors.label ? true : undefined}
          aria-describedby={errors.label ? "nav-label-error" : undefined}
          autoFocus
        />
        {errors.label ? (
          <p
            id="nav-label-error"
            role="alert"
            className="text-xs font-medium text-destructive"
          >
            {errors.label}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Nom affiché dans le menu (Header ou Footer).
          </p>
        )}
      </div>

      {/* ---- Type de cible ---- */}
      <div className="grid gap-2">
        <Label htmlFor="nav-kind">Type de lien</Label>
        <Select
          value={kind}
          onValueChange={(value) => handleChangeKind(value as NavItemKind)}
        >
          <SelectTrigger id="nav-kind" className="w-full">
            <SelectValue placeholder="Choisir un type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="page">Page du site</SelectItem>
            <SelectItem value="custom">
              Lien personnalisé (ancre / URL)
            </SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          « Page du site » pointe vers une page existante ; « Lien personnalisé »
          accepte une ancre, un chemin interne ou une URL externe.
        </p>
      </div>

      {/* ---- Cible ---- */}
      {kind === "page" ? (
        <div className="grid gap-2">
          <Label htmlFor="nav-page">Page cible</Label>
          <Select
            value={selectedPageId ?? ""}
            onValueChange={(value) => handleSelectPage(value)}
          >
            <SelectTrigger id="nav-page" className="w-full">
              <SelectValue placeholder="Choisir une page" />
            </SelectTrigger>
            <SelectContent>
              {pages.map((page) => (
                <SelectItem key={page.id} value={page.id}>
                  {page.menuTitle} · <span className="font-mono">{page.href}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.href ? (
            <p
              role="alert"
              className="text-xs font-medium text-destructive"
            >
              {errors.href}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Le lien cible la page choisie parmi celles du site.
            </p>
          )}
        </div>
      ) : (
        <div className="grid gap-2">
          <Label htmlFor="nav-href">Ancre, chemin ou URL</Label>
          <Input
            id="nav-href"
            value={href}
            onChange={(event) => setHref(event.target.value)}
            placeholder="#contact, /a-propos#equipe ou https://…"
            aria-invalid={errors.href ? true : undefined}
            aria-describedby={errors.href ? "nav-href-error" : undefined}
          />
          {errors.href ? (
            <p
              id="nav-href-error"
              role="alert"
              className="text-xs font-medium text-destructive"
            >
              {errors.href}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Formats acceptés : ancre locale (<span className="font-mono">#contact</span>),
              chemin relatif + ancre (<span className="font-mono">/a-propos#equipe</span>),
              URL externe complète (<span className="font-mono">https://…</span>).
            </p>
          )}
        </div>
      )}

      {/* ---- Rattachement (Header uniquement) ---- */}
      {showParent && (
        <div className="grid gap-2">
          <Label htmlFor="nav-parent">Rattachement</Label>
          {parentEnabled ? (
            <Select
              value={parentId ?? "root"}
              onValueChange={(value) =>
                setParentId(value === "root" ? null : value)
              }
            >
              <SelectTrigger id="nav-parent" className="w-full">
                <SelectValue placeholder="Choisir un emplacement" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="root">Racine du menu (Niveau 1)</SelectItem>
                {parentOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    Sous-menu de « {option.label} » (Niveau 2)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              id="nav-parent"
              value={parentId === null ? "Racine du menu" : "Verrouillé"}
              disabled
              className="disabled:opacity-70"
            />
          )}
          <p className="text-xs text-muted-foreground">
            {parentDisabledHint ||
              "Choisissez « Racine du menu » pour un lien de Niveau 1, ou un item du Header pour créer un sous-menu de Niveau 2."}
          </p>
        </div>
      )}

      {/* ---- Actions ---- */}
      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" className="sm:min-w-32">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
