import type { CSSProperties } from "react";
import { X } from "lucide-react";

import { NavLink } from "@/components/common/NavLink";
import { bannerColorCssValue } from "@/lib/banner-effects";
import {
  TOP_BANNER_LETTER_SPACING_VALUE,
  type TopBanner,
} from "@/lib/top-banner";
import { cn } from "@/lib/utils";

/**
 * ============================================================================
 * BARRE DU MINI-BANDEAU — rendu partagé public / aperçu éditeur
 * ----------------------------------------------------------------------------
 * Extrait de `TopBannerChrome` pour que l'aperçu de l'écran d'édition réutilise
 * **le même balisage et les mêmes variables CSS** que le public. Réécrire une
 * seconde fois le rendu (groupes, copies, lien, bouton) aurait produit deux
 * implémentations dont une seule aurait reçu les correctifs.
 *
 * `preview` neutralise uniquement `position: fixed` (classe
 * `top-banner--preview`) : sans cela, l'aperçu se superposerait au Back-Office.
 * Le reste — couleurs, typographie, gaps, défilement — est identique.
 * ============================================================================
 */

/** Variables CSS personnalisées posées en style inline (idiome `CardItem`). */
type CSSVars = CSSProperties & Record<`--${string}`, string>;

/** Largeur de référence à couvrir par un groupe du défilant (px). */
const TOP_BANNER_REFERENCE_WIDTH = 2560;

/** Plafond de répétitions : borne le DOM même pour un message très court. */
const TOP_BANNER_MAX_COPIES = 12;

/** Protocoles d'action rendus en `<a>` simple (jamais par `NavLink`). */
const ACTION_PROTOCOL_PATTERN = /^(mailto|tel):/i;

export function TopBannerBar({
  topBanner,
  onDismiss,
  preview = false,
}: {
  topBanner: TopBanner;
  /** Ferme le bandeau. Absent (aperçu) : le bouton est inerte et non focusable. */
  onDismiss?: () => void;
  /** true → rendu dans l'éditeur : la barre reste dans le flux. */
  preview?: boolean;
}) {
  // Estimation de largeur — non mesurable côté serveur. Le plafond de copies
  // borne le DOM si l'estimation est trop basse (filet du plan), et le second
  // groupe identique garantit la boucle sans raccord.
  const estimatedWidth = Math.max(
    120,
    topBanner.text.length * topBanner.fontSize * 0.62 + 48
  );
  const copies = Math.min(
    TOP_BANNER_MAX_COPIES,
    Math.max(1, Math.ceil(TOP_BANNER_REFERENCE_WIDTH / estimatedWidth))
  );

  const group = (ariaHidden: boolean) => (
    <div
      className={cn(
        "top-banner__group",
        ariaHidden && "top-banner__group--repeat"
      )}
      aria-hidden={ariaHidden || undefined}
    >
      {Array.from({ length: copies }, (_, copy) => (
        <span
          key={copy}
          className={cn(
            "top-banner__copy",
            copy > 0 && "top-banner__copy--repeat"
          )}
          aria-hidden={copy > 0 || undefined}
        >
          {topBanner.text}
        </span>
      ))}
    </div>
  );

  const href = topBanner.linkHref.trim();
  const linked = topBanner.linkEnabled && href !== "";
  const viewportClass = cn(
    "top-banner__viewport",
    linked && "top-banner__link--clickable"
  );
  const inner =
    topBanner.textMode === "marquee" ? (
      <>
        {group(false)}
        {group(true)}
      </>
    ) : (
      <span className="top-banner__static">{topBanner.text}</span>
    );

  const vars: CSSVars = {
    "--top-banner-height": `${topBanner.height}px`,
    "--top-banner-gap-top": `${topBanner.gapTop.enabled ? topBanner.gapTop.value : 0}px`,
    "--top-banner-gap-bottom": `${topBanner.gapBottom.enabled ? topBanner.gapBottom.value : 0}px`,
    "--top-banner-bg": bannerColorCssValue(topBanner.background),
    "--top-banner-gap-color": bannerColorCssValue(topBanner.gapColor),
    "--top-banner-text": bannerColorCssValue(topBanner.textColor),
    "--top-banner-font-size": `${topBanner.fontSize}px`,
    "--top-banner-font-weight": topBanner.fontWeight,
    "--top-banner-letter-spacing":
      TOP_BANNER_LETTER_SPACING_VALUE[topBanner.letterSpacing],
    "--top-banner-duration": `${topBanner.durationSeconds}s`,
  };

  return (
    <div
      className={cn("top-banner", preview && "top-banner--preview")}
      style={vars}
      role="region"
      aria-label="Bandeau d’information"
    >
      <div className="top-banner__bar">
        {linked ? (
          ACTION_PROTOCOL_PATTERN.test(href) ? (
            <a className={viewportClass} href={href}>
              {inner}
            </a>
          ) : (
            <NavLink className={viewportClass} href={href}>
              {inner}
            </NavLink>
          )
        ) : (
          <div className={viewportClass}>{inner}</div>
        )}
        <button
          type="button"
          className="top-banner__close"
          aria-label="Masquer le bandeau"
          disabled={onDismiss === undefined}
          aria-hidden={preview || undefined}
          tabIndex={preview ? -1 : undefined}
          onClick={onDismiss}
        >
          <X aria-hidden="true" className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
