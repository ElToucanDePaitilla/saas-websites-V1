"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";

/**
 * ============================================================================
 * NAVLINK — Cible unifiée des liens publics (Étape 4.5)
 * ----------------------------------------------------------------------------
 * Client Component qui résout une cible de menu (`href` d'une `NavMenuEntry`)
 * vers le rendu et le comportement appropriés (plans/ROADMAP-4.5 §1) :
 *
 *   | Cible                        | Rendu         | Comportement
 *   |------------------------------|---------------|--------------------------
 *   | `https://…` / `http://…`     | `<a>`         | `target="_blank"` + `rel`
 *   | `/route` (sans ancre)        | Next `<Link>` | navigation App Router
 *   | `#ancre` (même page)         | `<a>`(Link)   | défilement lisse avec
 *   |                              |               | offset du Header fixe
 *   | `/route#ancre`               | Next `<Link>` | si déjà sur `/route` :
 *   |                              |               | défilement lisse ; sinon
 *   |                              |               | navigation puis défilement
 *   |                              |               | après changement de route
 *
 * - `onNavigate` : rappel optionnel fermant le menu mobile / dropdown après un
 *   clic (évite le voile bloquant après activation d'un lien).
 * - État actif optionnel : `aria-current="page"` posé quand la partie route de
 *   `href` correspond au chemin courant (`usePathname`).
 * - Respecte `prefers-reduced-motion` (défilement instantané si demandé).
 * - Zéro `any`, TypeScript strict, aucun style imposé (la classe vient de
 *   l'appelant).
 * ============================================================================
 */

/** Hauteur de compensation du Header fixe lors du défilement vers une ancre
 *  (barre `h-16` = 4rem + respiration du `pt-20` du `<main>`). */
const HEADER_OFFSET = 88;

/** Cible analysée (une cible externe n'a ni route, ni ancre applicables). */
type ParsedHref = {
  /** true → URL externe (http/https) : rendue en `<a target="_blank">`. */
  external: boolean;
  /** Partie route (`""` pour une ancre pure `#ancre`, sinon `/route`). */
  path: string;
  /** Fragment sans le `#` (`""` si absent). */
  hash: string;
};

/** Décompose un `href` en { external, path, hash }. */
function parseHref(href: string): ParsedHref {
  if (/^https?:\/\//i.test(href)) {
    return { external: true, path: href, hash: "" };
  }
  const hashIndex = href.indexOf("#");
  if (hashIndex === -1) {
    return { external: false, path: href, hash: "" };
  }
  return {
    external: false,
    path: href.slice(0, hashIndex),
    hash: href.slice(hashIndex + 1),
  };
}

/** true si l'utilisateur demande des animations réduites (accessibilité). */
function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Hauteur du bandeau global (mini-bandeau Alerte / Promo) lue sur
 * `document.documentElement` — un `<a>` ne voit pas la variable posée par le
 * wrapper du layout. `0` quand le bandeau est masqué ou absent.
 */
function topBannerOffset(): number {
  if (typeof document === "undefined") {
    return 0;
  }
  const raw = window
    .getComputedStyle(document.documentElement)
    .getPropertyValue("--top-banner-offset")
    .trim();
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Défile en douceur vers l'élément `#id`, en compensant la hauteur du Header
 * fixe. Retourne `false` si aucun élément ne porte cet id (rien à faire).
 */
function scrollToHashId(id: string): boolean {
  if (typeof document === "undefined") {
    return false;
  }
  const element = document.getElementById(id);
  if (!element) {
    return false;
  }
  const top =
    element.getBoundingClientRect().top +
    window.scrollY -
    HEADER_OFFSET -
    topBannerOffset();
  window.scrollTo({
    top: Math.max(top, 0),
    behavior: prefersReducedMotion() ? "auto" : "smooth",
  });
  return true;
}

export type NavLinkProps = {
  /** Cible unifiée : `/route`, `#ancre`, `/route#ancre` ou `https://…`. */
  href: string;
  children: React.ReactNode;
  /** Classes de style fournies par l'appelant (Header, Footer, dropdown…). */
  className?: string;
  /** Ferme le menu mobile / dropdown après activation d'un lien. */
  onNavigate?: () => void;
  /** Libellé d'accessibilité explicite (défaut : le texte enfant). */
  ariaLabel?: string;
};

export function NavLink({
  href,
  children,
  className,
  onNavigate,
  ariaLabel,
}: NavLinkProps) {
  const pathname = usePathname();
  const router = useRouter();
  const target = React.useMemo(() => parseHref(href), [href]);

  // Ancre d'une autre route : navigation puis défilement une fois la route posée
  // (l'élément cible peut n'être monté qu'après le rendu de la nouvelle page).
  const [pending, setPending] = React.useState<{
    path: string;
    hash: string;
  } | null>(null);

  React.useEffect(() => {
    if (!pending || pathname !== pending.path) {
      return;
    }
    // L'élément cible de la nouvelle page peut n'être monté qu'après le rendu :
    // on diffère donc le défilement (et le nettoyage) via `requestAnimationFrame`
    // — aucun `setState` synchrone dans l'effet (règle ESLint react-hooks).
    let cancelled = false;
    let attempts = 0;
    let frame = window.requestAnimationFrame(function attemptScroll() {
      if (cancelled) {
        return;
      }
      attempts += 1;
      // Deux tentatives au maximum, puis abandon (cible inexistante = lien simple).
      if (scrollToHashId(pending.hash) || attempts >= 2) {
        setPending(null);
        return;
      }
      frame = window.requestAnimationFrame(attemptScroll);
    });
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
    };
  }, [pathname, pending]);

  function closeMenu(): void {
    onNavigate?.();
  }

  function handleClick(event: React.MouseEvent<HTMLAnchorElement>): void {
    // URL externe : comportement natif (nouvel onglet) + fermeture du menu.
    if (target.external) {
      closeMenu();
      return;
    }

    // Ancre sur la page courante (`#ancre` pure ou `/route#ancre` déjà sur la
    // route) : défilement manuel avec offset — on court-circuite le saut natif.
    if (target.hash !== "" && (target.path === "" || target.path === pathname)) {
      event.preventDefault();
      scrollToHashId(target.hash);
      closeMenu();
      return;
    }

    // `/route#ancre` depuis une autre page : navigation App Router, puis
    // défilement une fois `pathname` synchronisé (géré par l'effet ci-dessus).
    if (target.hash !== "" && target.path !== pathname) {
      event.preventDefault();
      router.push(target.path);
      setPending({ path: target.path, hash: target.hash });
      closeMenu();
      return;
    }

    // Route simple : navigation native du `<Link>` (préchargement App Router).
    closeMenu();
  }

  if (target.external) {
    return (
      <a
        href={target.path}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        aria-label={ariaLabel}
        onClick={closeMenu}
      >
        {children}
      </a>
    );
  }

  const active = target.path !== "" && pathname === target.path;

  return (
    <Link
      href={href}
      className={className}
      aria-label={ariaLabel}
      aria-current={active ? "page" : undefined}
      onClick={handleClick}
    >
      {children}
    </Link>
  );
}
