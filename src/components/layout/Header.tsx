"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronDown, Menu } from "lucide-react";

import { useNavigationStore } from "@/components/backoffice/navigation/NavigationStoreProvider";
import { NavLink } from "@/components/common/NavLink";
import { useOwnerProfile } from "@/lib/owner-profile";
import {
  TEXT_LINE_PX,
  TEXT_SIZE_LETTER_SPACING,
  isVisualIdentityEmpty,
} from "@/lib/visual-identity";
import { useVisualIdentity } from "@/lib/visual-identity-store";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { NavMenuEntry } from "@/lib/navigation";
import { siteName } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * ============================================================================
 * HEADER FIXE — Front-Office dynamique (Étape 4.5)
 * ----------------------------------------------------------------------------
 * Client Component branché sur le **store Navigation partagé** (module
 * singleton + `useSyncExternalStore`, plans/ROADMAP-4.5 §0.1) : il rend la zone
 * `header` du menu administré dans `/admin/navigation` — les modifications et
 * Presets Onboarding du Back-Office sont donc **visibles immédiatement** sur le
 * site public au sein d'une même session.
 *
 * Rendu :
 *   - Desktop (`hidden md:flex`) : Niveau 1 ; les entrées racine portant un
 *     **sous-menu Niveau 2 visible** deviennent un « parent » avec chevron et un
 *     menu déroulant ouvert au survol/focus (`group-hover` / `group-focus-within`).
 *   - Mobile (sous `md`) : bouton burger ouvrant un **Sheet** Radix ; chaque
 *     racine visible sans enfant est un lien plein écran, chaque parent devient
 *     un **Accordion** (AccordionTrigger = libellé, AccordionContent = enfants).
 *     Le Sheet se ferme après activation d'un lien (`onNavigate`).
 *
 * Filtre `hidden !== true` appliqué à chaque niveau (racine + sous-menu) :
 * « masquer » ne supprime pas l'entrée, elle n'est simplement pas rendue (§0.3).
 * La marque (`siteName`) reste alimentée par `src/lib/site.ts`.
 *
 * Chrome (barre fixe `h-16`, glassmorphism nacré, CTA « Connexion ») conservé
 * à l'identique de l'Étape 2.1. SSR : Next.js effectue le SSR des Client
 * Components → balisage présent au premier chargement (pas de flash, §0.4).
 *
 * Références : plans/ROADMAP-4.5-front-navigation.md §2 —
 *              plans/ROADMAP-2.1-header.md (chrome) — spec §3.1 & §8.
 * ============================================================================
 */

/** Classes d'un lien de Niveau 1 (Desktop). */
const desktopLinkClass =
  "rounded-full px-3 py-2 text-sm font-medium text-foreground/70 transition-colors duration-200 hover:bg-accent/40 hover:text-foreground";

/** Évite l'affichage d'entrées dupliquées (même cible `href`). */
function dedupeHref(entries: NavMenuEntry[]): NavMenuEntry[] {
  const seen = new Set<string>();
  const result: NavMenuEntry[] = [];
  for (const entry of entries) {
    if (seen.has(entry.href)) {
      continue;
    }
    seen.add(entry.href);
    result.push(entry);
  }
  return result;
}

/**
 * Navigation Desktop — Niveau 1 + sous-menus Niveau 2.
 * Dropdown **contrôlé par état React** : ouvert au survol/focus, fermé à la
 * sortie du groupe, après activation d'un lien (parent OU enfant) ou si le
 * focus quitte le panneau — le sous-menu se referme donc bien après un clic.
 */
function DesktopNavMenu({ entries }: { entries: NavMenuEntry[] }) {
  const [openId, setOpenId] = React.useState<string | null>(null);

  /** Ferme après activation d'un lien (clic) — évite un menu resté ouvert. */
  function closeAfterNavigate() {
    setOpenId(null);
  }

  /** Ferme si le focus sort du groupe (clavier / clic ailleurs). */
  function handleBlur(
    event: React.FocusEvent<HTMLDivElement>,
    entryId: string
  ) {
    const next = event.relatedTarget as Node | null;
    if (!next || !event.currentTarget.contains(next)) {
      setOpenId((current) => (current === entryId ? null : current));
    }
  }

  return (
    <nav
      aria-label="Navigation principale"
      className="hidden items-center gap-1 md:flex"
    >
      {entries.map((entry) => {
        const children = dedupeHref(
          (entry.children ?? []).filter((child) => !child.hidden)
        );
        // Sans enfant visible → lien direct de Niveau 1.
        if (children.length === 0) {
          return (
            <NavLink key={entry.id} href={entry.href} className={desktopLinkClass}>
              {entry.label}
            </NavLink>
          );
        }
        // Parent avec sous-menu → dropdown piloté par état (hover/focus/clic).
        const isOpen = openId === entry.id;
        return (
          <div
            key={entry.id}
            className="relative"
            onMouseEnter={() => setOpenId(entry.id)}
            onMouseLeave={() => setOpenId(null)}
            onFocus={() => setOpenId(entry.id)}
            onBlur={(event) => handleBlur(event, entry.id)}
          >
            <NavLink
              href={entry.href}
              ariaLabel={`${entry.label} : sous-menu`}
              aria-expanded={isOpen}
              onNavigate={closeAfterNavigate}
              className={`inline-flex items-center gap-1 ${desktopLinkClass}`}
            >
              {entry.label}
              <ChevronDown
                aria-hidden="true"
                className={cn(
                  "size-3.5 transition-transform duration-200",
                  isOpen && "rotate-180"
                )}
              />
            </NavLink>
            {/* Panneau déroulant — visible quand le groupe est survolé/focusé. */}
            <div
              className={cn(
                "absolute left-0 top-full pt-3 transition-all duration-200",
                isOpen
                  ? "visible opacity-100"
                  : "pointer-events-none invisible opacity-0"
              )}
            >
              <div className="min-w-44 rounded-xl border border-[var(--border-color)] bg-card/95 p-2 shadow-lg backdrop-blur-sm">
                {children.map((child) => (
                  <NavLink
                    key={child.id}
                    href={child.href}
                    onNavigate={closeAfterNavigate}
                    className="block rounded-lg px-3 py-2 text-sm text-foreground/70 transition-colors duration-200 hover:bg-accent/40 hover:text-foreground"
                  >
                    {child.label}
                  </NavLink>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </nav>
  );
}

/**
 * Menu mobile (contenu du Sheet) — Accordéon pour les sous-menus Niveau 2.
 * `onNavigate` ferme le Sheet après activation d'un lien.
 */
function MobileNavMenu({
  entries,
  onNavigate,
}: {
  entries: NavMenuEntry[];
  onNavigate: () => void;
}) {
  return (
    <Accordion type="single" collapsible className="w-full">
      {entries.map((entry) => {
        const children = dedupeHref(
          (entry.children ?? []).filter((child) => !child.hidden)
        );
        // Sans enfant visible → lien pleine largeur.
        if (children.length === 0) {
          return (
            <NavLink
              key={entry.id}
              href={entry.href}
              onNavigate={onNavigate}
              className="block border-b border-[var(--border-color)] py-4 text-base text-foreground/80 transition-colors duration-200 hover:text-foreground"
            >
              {entry.label}
            </NavLink>
          );
        }
        // Parent avec sous-menu → Accordion (Trigger = libellé + chevron).
        return (
          <AccordionItem
            key={entry.id}
            value={entry.id}
            className="border-b border-[var(--border-color)] last:border-b-0"
          >
            <AccordionTrigger className="py-4 text-base text-foreground/80 hover:no-underline data-[state=open]:text-foreground">
              {entry.label}
            </AccordionTrigger>
            <AccordionContent className="pb-2">
              <ul className="space-y-1">
                {children.map((child) => (
                  <li key={child.id}>
                    <NavLink
                      href={child.href}
                      onNavigate={onNavigate}
                      className="block rounded-lg px-3 py-2 pl-4 text-sm text-foreground/60 transition-colors duration-200 hover:bg-accent/40 hover:text-foreground"
                    >
                      {child.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}

export default function Header() {
  const { getEntries } = useNavigationStore();
  const { profile } = useOwnerProfile();
  const { visualIdentity } = useVisualIdentity();
  const [menuOpen, setMenuOpen] = React.useState(false);

  // Espace marque : configuration « Identité visuelle / Logo » (Étape 9.1) —
  // repli `siteName` tant que rien n'est configuré (aucun lien avec Profil).
  const brandConfigured = !isVisualIdentityEmpty(visualIdentity);
  const { line1, line2 } = visualIdentity.text;

  // Entrées racine Header **visibles** uniquement (filtre `hidden !== true`).
  const entries = React.useMemo(
    () => dedupeHref(getEntries("header").filter((entry) => !entry.hidden)),
    [getEntries]
  );

  // Favicon alimenté par le Profil (si renseigné).
  React.useEffect(() => {
    if (profile.faviconUrl === "") {
      return;
    }
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = profile.faviconUrl;
  }, [profile.faviconUrl]);

  return (
    <header
      role="banner"
      className="glass fixed inset-x-0 top-0 z-50 border-b border-[var(--border-color)]/60"
      // Le bandeau global peut occuper le haut de l'écran : le Header se décale
      // de sa hauteur totale (variable posée par `TopBannerChrome`, 0 sinon).
      style={{ top: "var(--top-banner-offset, 0px)" }}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        {/* ---- Marque (gauche) : « Identité visuelle / Logo » (Étape 9.1).
             Mode texte → 2 lignes stylées ; mode logo → image ≤ 200×60 px
             `object-contain` ; sinon repli `siteName` (aucun lien avec Profil). ---- */}
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 transition-opacity duration-200 hover:opacity-75"
        >
          {brandConfigured ? (
            visualIdentity.mode === "logo" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={visualIdentity.logo.url}
                alt={visualIdentity.logo.altText || siteName}
                style={{ maxWidth: 200, maxHeight: 60 }}
                className="h-auto w-auto object-contain"
              />
            ) : (
              <span className="flex flex-col leading-tight">
                {line1.value !== "" ? (
                  <span
                    style={{
                      fontFamily: "var(--font-heading)",
                      color: line1.color,
                      fontSize: TEXT_LINE_PX.line1[line1.size],
                      letterSpacing: TEXT_SIZE_LETTER_SPACING[line1.size],
                      fontWeight: Number(line1.weight),
                    }}
                  >
                    {line1.value}
                  </span>
                ) : null}
                {line2.value !== "" ? (
                  <span
                    style={{
                      fontFamily: "var(--font-heading)",
                      color: line2.color,
                      fontSize: TEXT_LINE_PX.line2[line2.size],
                      letterSpacing: TEXT_SIZE_LETTER_SPACING[line2.size],
                      fontWeight: Number(line2.weight),
                    }}
                  >
                    {line2.value}
                  </span>
                ) : null}
              </span>
            )
          ) : (
            <span
              style={{ fontFamily: "var(--font-heading)" }}
              className="text-xl font-medium tracking-wide text-foreground"
            >
              {siteName}
            </span>
          )}
        </Link>

        {/* ---- Navigation principale — Desktop (Niveau 1 + sous-menus) ---- */}
        <DesktopNavMenu entries={entries} />

        {/* ---- CTA Connexion (desktop) + burger (mobile) ---- */}
        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="hidden md:inline-flex"
          >
            <Link href="/admin/login">Connexion</Link>
          </Button>

          {/* Menu burger — Sheet latéral + Accordion (mobile) */}
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="Ouvrir le menu"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="flex w-80 max-w-[85vw] flex-col gap-0 bg-card/95 p-0 backdrop-blur-md"
            >
              <SheetHeader className="border-b border-[var(--border-color)] px-5 py-4 pr-12">
                <SheetTitle
                  style={{ fontFamily: "var(--font-heading)" }}
                  className="text-xl font-medium tracking-wide text-foreground"
                >
                  {siteName}
                </SheetTitle>
              </SheetHeader>

              {/* Liste de navigation (défilement interne au Sheet) */}
              <div className="flex-1 overflow-y-auto px-5">
                <MobileNavMenu
                  entries={entries}
                  onNavigate={() => setMenuOpen(false)}
                />
              </div>

              {/* Pied : CTA Connexion */}
              <SheetFooter className="border-t border-[var(--border-color)] px-5 py-4">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <Link href="/admin/login" onClick={() => setMenuOpen(false)}>
                    Connexion
                  </Link>
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
