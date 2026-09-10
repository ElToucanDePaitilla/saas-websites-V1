"use client";

import * as React from "react";

import type { ModuleAnimation } from "@/lib/pages";
import { cn } from "@/lib/utils";

/**
 * ============================================================================
 * REVEAL HERO — animation d'entrée du bloc texte/CTA du Héro (Étape 7.1)
 * ----------------------------------------------------------------------------
 * Client Component (feuille). Applique l'animation d'entrée **branchée sur
 * `module.animation`** (source unique — cf. plans/ROADMAP-7.1 D-3) :
 *   - `default` / `none` : aucun effet (le module est rendu visible d'emblée) ;
 *   - `fade-up`  : translateY(20px) → 0 + opacité ;
 *   - `fade-in`  : opacité ;
 *   - `scale-in` : scale(0.98) → 1 + opacité.
 * Rendu GPU uniquement (`opacity` / `transform` + `will-change-transform`) et
 * respect strict de `@media (prefers-reduced-motion)` (directive .kilorules §3).
 * ============================================================================
 */

type RevealHeroProps = {
  animation: ModuleAnimation;
  children: React.ReactNode;
};

/** Classes initiales (état caché) de chaque animation d'entrée. */
function hiddenClassFor(animation: ModuleAnimation): string | undefined {
  switch (animation) {
    case "fade-up":
      return "opacity-0 translate-y-5";
    case "fade-in":
      return "opacity-0";
    case "scale-in":
      return "opacity-0 scale-[0.98]";
    default:
      // "default" | "none" : aucune animation → jamais masqué.
      return undefined;
  }
}

export function RevealHero({ animation, children }: RevealHeroProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  // Dès le rendu si l'animation est désactivée (default / none).
  const animated = animation !== "default" && animation !== "none";
  const [visible, setVisible] = React.useState(!animated);

  React.useEffect(() => {
    if (!animated) {
      return;
    }
    const node = ref.current;
    if (!node) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            // Mise à jour dans un rappel externe (observer) — aucune cascade.
            setVisible(true);
            observer.disconnect();
          }
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [animated]);

  return (
    <div
      ref={ref}
      className={cn(
        "will-change-transform transition-[opacity,transform] duration-700 ease-silk",
        // prefers-reduced-motion : l'état caché est neutralisé par CSS.
        !visible && "motion-reduce:translate-y-0 motion-reduce:scale-100 motion-reduce:opacity-100 motion-reduce:transition-none",
        visible
          ? "translate-y-0 scale-100 opacity-100"
          : hiddenClassFor(animation)
      )}
    >
      {children}
    </div>
  );
}
