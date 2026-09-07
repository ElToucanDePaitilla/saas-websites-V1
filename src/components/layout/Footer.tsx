"use client";

import Link from "next/link";
import * as React from "react";
import { ArrowUpRight } from "lucide-react";

import { useNavigationStore } from "@/components/backoffice/navigation/NavigationStoreProvider";
import { NavLink } from "@/components/common/NavLink";
import { legalLinks, siteName, socialLinks } from "@/lib/site";

/**
 * ============================================================================
 * FOOTER — Front-Office dynamique (Étape 4.5)
 * ----------------------------------------------------------------------------
 * Client Component branché sur le **store Navigation partagé** (module singleton
 * + `useSyncExternalStore`, plans/ROADMAP-4.5 §0.1) : la colonne **« Navigation »**
 * liste les entrées **visibles** (`hidden !== true`) de la zone `footer` via
 * `<NavLink>` — les modifications du Back-Office sont donc reflétées sur le site
 * public au sein d'une même session.
 *
 * Les blocs **marque + réseaux sociaux** et **mentions légales** restent
 * alimentés par la config `src/lib/site.ts` (`socialLinks`, `legalLinks`) : ils
 * ne sont pas gérés par le store navigation (hors périmètre, §0.5).
 *
 * Fond surface nacrée (`var(--surface-color)`) + bordure haute perle, marque en
 * Cormorant Garamond (`var(--font-heading)`), textes secondaires en Plus Jakarta
 * Sans (`var(--font-body)`). Copyright : année dynamique calculée au rendu.
 *
 * Références : plans/ROADMAP-4.5-front-navigation.md §3 —
 *              plans/ROADMAP-2.2-footer.md (chrome) — spec §3.1.
 * ============================================================================
 */

const columnTitleStyle = { fontFamily: "var(--font-body)" } as const;

export default function Footer() {
  const { getEntries } = useNavigationStore();

  // Entrées Footer **visibles** uniquement (filtre `hidden !== true`, §0.3).
  const navEntries = React.useMemo(
    () => getEntries("footer").filter((entry) => !entry.hidden),
    [getEntries]
  );

  const year = new Date().getFullYear();

  return (
    <footer
      role="contentinfo"
      className="border-t border-[var(--border-color)] bg-[var(--surface-color)]"
    >
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        {/* ---- Blocs d'information (marque / navigation / légal) ---- */}
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-[1.6fr_1fr_1fr]">
          {/* Marque + réseau sociaux */}
          <div>
            <Link
              href="/"
              style={{ fontFamily: "var(--font-heading)" }}
              className="inline-block text-2xl font-medium tracking-wide text-foreground transition-opacity duration-200 hover:opacity-75"
            >
              {siteName}
            </Link>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-[var(--text-muted)]">
              Photographe professionnel — galeries privées, prestations et
              tirages sur mesure.
            </p>
            <ul
              className="mt-6 flex items-center gap-6"
              aria-label="Réseaux sociaux"
            >
              {socialLinks.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm font-medium text-foreground/70 transition-colors duration-200 hover:text-foreground"
                  >
                    {item.label}
                    <ArrowUpRight className="size-3.5" aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Navigation principale — dynamique (store partagé) */}
          <nav aria-label="Liens du pied de page">
            <h2
              style={columnTitleStyle}
              className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]"
            >
              Navigation
            </h2>
            <ul className="mt-5 space-y-3">
              {navEntries.map((entry) => (
                <li key={entry.id}>
                  <NavLink
                    href={entry.href}
                    className="text-sm text-foreground/70 transition-colors duration-200 hover:text-foreground"
                  >
                    {entry.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          {/* Mentions légales — config site.ts (hors store navigation) */}
          <div>
            <h2
              style={columnTitleStyle}
              className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]"
            >
              Informations
            </h2>
            <ul className="mt-5 space-y-3">
              {legalLinks.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-foreground/70 transition-colors duration-200 hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ---- Ligne de séparation basse : copyright ---- */}
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-[var(--border-color)] pt-6 sm:flex-row">
          <p className="text-xs text-[var(--text-muted)]">
            © {year} {siteName}. Tous droits réservés.
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            Portfolio & galeries privées
          </p>
        </div>
      </div>
    </footer>
  );
}
