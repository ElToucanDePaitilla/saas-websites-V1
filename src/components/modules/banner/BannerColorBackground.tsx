import { bannerColorCssValue } from "@/lib/banner-effects";
import type { BannerColorSettings } from "@/lib/pages";

/**
 * ============================================================================
 * FOND COULEUR UNIE DU BANDEAU — Étape 11.27
 * ----------------------------------------------------------------------------
 * Server Component (aucun état). La couleur provient soit d'un **jeton du
 * thème** (`var(--accent-color)` — la teinte suit alors le thème, y compris le
 * mode sombre et les futurs presets), soit d'une **valeur libre** choisie dans
 * la palette ou à la pipette.
 *
 * Aucune image n'est affichée : c'est ce qui rend ce fond utile comme valeur de
 * **repli** quand le fond média choisi n'a pas encore de visuel renseigné.
 * ============================================================================
 */

type BannerColorBackgroundProps = {
  color: BannerColorSettings;
};

export function BannerColorBackground({ color }: BannerColorBackgroundProps) {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0"
      style={{ backgroundColor: bannerColorCssValue(color) }}
    />
  );
}
