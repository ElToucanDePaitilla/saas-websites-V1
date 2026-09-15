import {
  BadgeDollarSign,
  CircleHelp,
  Columns3,
  LayoutGrid,
  Mail,
  Megaphone,
  Sparkles,
  User,
  type LucideIcon,
} from "lucide-react";

import type { PageModuleType } from "@/lib/pages";

/**
 * Mapping type de module → icône lucide.
 * Centralise l'import `lucide-react` (le modèle `src/lib/pages.ts` reste sans
 * dépendance UI). Le composant est stateless et réutilisé par le bandeau
 * `ModuleRow` et le catalogue `AddSectionSheet`.
 *
 * Référence : plans/ROADMAP-3.2-pagebuilder-dnd.md §1.8
 */
const moduleIcons: Record<PageModuleType, LucideIcon> = {
  hero: Sparkles,
  about: User,
  services: BadgeDollarSign,
  "cta-banner": Megaphone,
  gallery: LayoutGrid,
  faq: CircleHelp,
  contact: Mail,
  content: Columns3,
};

export function ModuleIcon({
  type,
  className,
}: {
  type: PageModuleType;
  className?: string;
}) {
  const Icon = moduleIcons[type];
  return <Icon className={className} aria-hidden="true" />;
}
