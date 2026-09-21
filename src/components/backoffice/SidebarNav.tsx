"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AppWindow,
  ClipboardList,
  FileText,
  Image as ImageIcon,
  Images,
  LayoutTemplate,
  Megaphone,
  Menu,
  Palette,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * ============================================================================
 * NAVIGATION LATÉRALE — Dashboard `/admin` (Étape 4.1)
 * ----------------------------------------------------------------------------
 * Client Component (isolé pour `usePathname`) : calcule l'entrée **active** selon
 * la route courante et rend la liste de la barre latérale du Back-Office.
 * Permet au Layout `/admin` de rester un **Server Component** (aucun hook client).
 *
 * Entrées : « Pages » (`/admin/pages`), « Navigation » (`/admin/navigation`,
 * activée en 4.1) — les autres restent désactivées (« À venir », tooltip).
 *
 * Référence : plans/ROADMAP-4.1-navigation.md §1.6
 * ============================================================================
 */

type SidebarNavItem = {
  label: string;
  href?: string;
  icon: LucideIcon;
  disabled?: boolean;
};

type SidebarSection = {
  label: string;
  items: SidebarNavItem[];
};

/**
 * Sections purement **présentatrices** : les URLs restent à plat
 * (`/admin/profile`, `/admin/identite-visuelle`, `/admin/apparence`), pour ne
 * pas casser les liens existants, `isActive` ni les références documentaires.
 */
const sidebarSections: SidebarSection[] = [
  {
    label: "Contenu",
    items: [
      { label: "Pages", href: "/admin/pages", icon: FileText },
      { label: "Navigation", href: "/admin/navigation", icon: Menu },
      {
        label: "Bandeau d’alerte",
        href: "/admin/bandeau-alerte",
        icon: Megaphone,
      },
      { label: "Médias", href: "/admin/media", icon: Images },
      { label: "Modules", icon: LayoutTemplate, disabled: true },
      { label: "Portfolio", icon: Images, disabled: true },
      { label: "Clients", icon: Users, disabled: true },
      { label: "Devis", icon: ClipboardList, disabled: true },
    ],
  },
  {
    label: "Interaction & Conversion",
    items: [
      { label: "Pop-ups", href: "/admin/popups", icon: AppWindow },
    ],
  },
  {
    label: "Paramètres",
    items: [
      { label: "Profil", href: "/admin/profile", icon: UserRound },
      {
        label: "Identité visuelle / Logo",
        href: "/admin/identite-visuelle",
        icon: ImageIcon,
      },
      { label: "Apparence", href: "/admin/apparence", icon: Palette },
    ],
  },
];

/** Une entrée (lien actif, lien inactif ou entrée désactivée « À venir »). */
function NavEntry({ item, active }: { item: SidebarNavItem; active: boolean }) {
  const Icon = item.icon;
  const inner = (
    <>
      <Icon className="size-4 shrink-0" />
      <span className="truncate">{item.label}</span>
    </>
  );

  if (item.disabled) {
    return (
      <span
        title="Prochaines étapes"
        aria-disabled="true"
        className="flex cursor-not-allowed items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground opacity-50 transition-colors"
      >
        {inner}
      </span>
    );
  }

  return (
    <Link
      href={item.href!}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
        active
          ? "bg-primary font-medium text-primary-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      {inner}
    </Link>
  );
}

export function SidebarNav() {
  const pathname = usePathname();

  /** Vrai si la route courante correspond à l'entrée (racine exacte ou sous-route). */
  function isActive(href: string): boolean {
    if (href === "/admin/pages") {
      return pathname === "/admin/pages" || pathname.startsWith("/admin/pages/");
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <nav
      aria-label="Navigation du tableau de bord"
      className="flex flex-1 flex-col gap-1 overflow-y-auto p-3"
    >
      {sidebarSections.map((section) => (
        <div key={section.label} className="grid gap-1 pt-2">
          <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {section.label}
          </p>
          {section.items.map((item) => (
            <NavEntry
              key={item.label}
              item={item}
              active={item.href !== undefined && isActive(item.href)}
            />
          ))}
        </div>
      ))}
    </nav>
  );
}
