import { AppearanceScreen } from "@/components/backoffice/appearance/AppearanceScreen";

/**
 * Route `/admin/apparence` — sélection de la palette du site public.
 * Écran client : 7 cartes (Nacre + 6 presets), aperçu en direct, enregistrement.
 */
export default function AdminAppearancePage() {
  return <AppearanceScreen />;
}
