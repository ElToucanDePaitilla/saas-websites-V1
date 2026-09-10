"use client";

import * as React from "react";
import { RefreshCw } from "lucide-react";

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
import { Switch } from "@/components/ui/switch";
import {
  slugFromTitle,
  type PageMetadataDraft,
  type PageStatus,
  type SitePage,
} from "@/lib/pages";

/**
 * ============================================================================
 * FORMULAIRE — Métadonnées de Page (création & édition)
 * ----------------------------------------------------------------------------
 * Client Component contrôlé, réutilisable en création (sans `initial`) et en
 * édition (avec `initial`). Champs :
 *   1. Titre de la page (H1 / SEO)     → Input requis ;
 *   2. Nom dans le menu (MenuTitle)    → Input requis (nom abrégé) ;
 *   3. Slug URL                        → Input éditable + bouton « Régénérer »,
 *      auto-suggéré depuis le titre tant qu'il n'a pas été saisi à la main ;
 *   4. Statut                          → Select « Brouillon » / « Publié ».
 * Validation légère côté client (requis + unicité du slug), sans bibliothèque
 * externe.
 *
 * Référence : plans/ROADMAP-3.1-pagemetadata.md §1.5
 * ============================================================================
 */

type PageMetadataFormProps = {
  /** Page éditée (absent → mode création). */
  initial?: SitePage;
  /** Slugs des AUTRES pages (hors page en édition) — pour l'unicité. */
  existingSlugs: string[];
  onSubmit: (data: PageMetadataDraft) => void;
  onCancel: () => void;
  submitLabel?: string;
};

type FormErrors = Partial<Record<"title" | "menuTitle" | "slug", string>>;

const MAX_MENU_TITLE_LENGTH = 28;

export function PageMetadataForm({
  initial,
  existingSlugs,
  onSubmit,
  onCancel,
  submitLabel = "Enregistrer",
}: PageMetadataFormProps) {
  const [title, setTitle] = React.useState(initial?.title ?? "");
  const [menuTitle, setMenuTitle] = React.useState(initial?.menuTitle ?? "");
  const [slug, setSlug] = React.useState(initial?.slug ?? "");
  const [status, setStatus] = React.useState<PageStatus>(
    initial?.status ?? "draft"
  );
  // Rattachement automatique au menu par défaut (désactivable) : une nouvelle
  // page apparaît dans le Header sauf si le photographe décoche l'option.
  const [inMenu, setInMenu] = React.useState(initial?.inMenu ?? true);
  const [errors, setErrors] = React.useState<FormErrors>({});

  /** Le slug suit automatiquement le titre tant qu'il n'a pas été saisi à la main. */
  const [slugFollowsTitle, setSlugFollowsTitle] = React.useState(
    initial === undefined
  );

  /** Page d'accueil désignée (Étape 10.1) : le slug vide reste autorisé (`/`). */
  const isHome = initial?.isHome === true;

  /** Slug actuel déjà occupé par une autre page (indication temps réel). */
  const slugTaken =
    slug.trim() !== "" && existingSlugs.includes(slug.trim());

  function handleTitleChange(value: string) {
    setTitle(value);
    if (slugFollowsTitle) {
      setSlug(slugFromTitle(value));
    }
  }

  function handleRegenerateSlug() {
    setSlug(slugFromTitle(title));
    setSlugFollowsTitle(true);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: FormErrors = {};

    const cleanTitle = title.trim();
    const cleanMenuTitle = menuTitle.trim();
    const cleanSlug = slug.trim();

    if (cleanTitle === "") {
      nextErrors.title = "Le titre de la page est requis.";
    }
    if (cleanMenuTitle === "") {
      nextErrors.menuTitle = "Le nom dans le menu est requis.";
    }
    if (cleanSlug === "" && !isHome) {
      nextErrors.slug = "Le slug URL est requis.";
    }
    if (cleanSlug !== "" && existingSlugs.includes(cleanSlug)) {
      nextErrors.slug = `Le slug « /${cleanSlug} » est déjà utilisé par une autre page.`;
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    onSubmit({
      title: cleanTitle,
      menuTitle: cleanMenuTitle,
      slug: cleanSlug,
      status,
      inMenu,
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-5">
      {/* ---- Titre H1 / SEO ---- */}
      <div className="grid gap-2">
        <Label htmlFor="page-title">Titre de la page (H1 / SEO)</Label>
        <Input
          id="page-title"
          value={title}
          onChange={(event) => handleTitleChange(event.target.value)}
          placeholder="Ex. Portfolio photographique"
          aria-invalid={errors.title ? true : undefined}
          aria-describedby={errors.title ? "page-title-error" : undefined}
          autoFocus
        />
        {errors.title ? (
          <p id="page-title-error" role="alert" className="text-xs font-medium text-destructive">
            {errors.title}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Affiché en titre de la page et utilisé pour le référencement (SEO).
          </p>
        )}
      </div>

      {/* ---- Nom dans le menu (MenuTitle) ---- */}
      <div className="grid gap-2">
        <Label htmlFor="page-menu-title">Nom dans le menu</Label>
        <Input
          id="page-menu-title"
          value={menuTitle}
          onChange={(event) => setMenuTitle(event.target.value)}
          placeholder="Ex. Portfolio"
          maxLength={MAX_MENU_TITLE_LENGTH}
          aria-invalid={errors.menuTitle ? true : undefined}
          aria-describedby={
            errors.menuTitle ? "page-menu-title-error" : "page-menu-title-hint"
          }
        />
        {errors.menuTitle ? (
          <p
            id="page-menu-title-error"
            role="alert"
            className="text-xs font-medium text-destructive"
          >
            {errors.menuTitle}
          </p>
        ) : (
          <p id="page-menu-title-hint" className="text-xs text-muted-foreground">
            Nom abrégé affiché dans la navigation ({menuTitle.length}/
            {MAX_MENU_TITLE_LENGTH}).
          </p>
        )}
      </div>

      {/* ---- Slug URL ---- */}
      <div className="grid gap-2">
        <Label htmlFor="page-slug">Slug URL</Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span
              aria-hidden="true"
              className="border-input text-muted-foreground pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm"
            >
              /
            </span>
            <Input
              id="page-slug"
              value={slug}
              onChange={(event) => {
                setSlug(event.target.value);
                setSlugFollowsTitle(false);
              }}
              placeholder={isHome ? "page d’accueil (racine /)" : "ex. portfolio"}
              className="pl-6"
              aria-invalid={errors.slug || slugTaken ? true : undefined}
              aria-describedby={
                errors.slug || slugTaken ? "page-slug-error" : "page-slug-hint"
              }
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleRegenerateSlug}
            title="Régénérer le slug depuis le titre"
          >
            <RefreshCw />
            <span className="hidden sm:inline">Régénérer</span>
          </Button>
        </div>
        {errors.slug || slugTaken ? (
          <p
            id="page-slug-error"
            role="alert"
            className="text-xs font-medium text-destructive"
          >
            {errors.slug ??
              `Ce slug est déjà utilisé par une autre page. Choisissez-en un autre ou régénérez-le.`}
          </p>
        ) : (
          <p id="page-slug-hint" className="text-xs text-muted-foreground">
            URL canonique, générée automatiquement depuis le titre.
            {isHome ? " La page d’accueil vit à la racine « / »." : ""}
          </p>
        )}
      </div>

      {/* ---- Statut de publication ---- */}
      <div className="grid gap-2">
        <Label htmlFor="page-status">Statut</Label>
        <Select
          value={status}
          onValueChange={(value) => setStatus(value as PageStatus)}
        >
          <SelectTrigger id="page-status" className="w-full">
            <SelectValue placeholder="Choisir un statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Brouillon</SelectItem>
            <SelectItem value="published">Publié</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Une page « Brouillon » est masquée du site public.
        </p>
      </div>

      {/* ---- Ajout au menu principal (rattachement auto Navigation ↔ Pages) ---- */}
      <div className="grid gap-2">
        <div className="flex items-center justify-between gap-4 rounded-md border border-border bg-muted/30 px-3 py-2.5">
          <div>
            <Label htmlFor="page-in-menu" className="text-sm">
              Ajouter au menu principal
            </Label>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Ajoute une entrée dans le menu du Header (nom abrégé ci-dessus).
            </p>
          </div>
          <Switch
            id="page-in-menu"
            checked={inMenu}
            onCheckedChange={setInMenu}
            aria-label="Ajouter automatiquement cette page au menu principal"
          />
        </div>
      </div>

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
