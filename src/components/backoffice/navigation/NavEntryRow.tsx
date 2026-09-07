"use client";

import type { DraggableProvidedDragHandleProps } from "@hello-pangea/dnd";
import {
  Eye,
  EyeOff,
  GripVertical,
  ListTree,
  Pencil,
  Trash2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { NavMenuEntry } from "@/lib/navigation";
import { cn } from "@/lib/utils";

/**
 * ============================================================================
 * RANGÉE — Item de menu « Navigation & Menus » (Étapes 4.1 → 4.3)
 * ----------------------------------------------------------------------------
 * Bandeau compact d'un item de menu (Niveau 1 ou Niveau 2) :
 *   - poignée de glissement `GripVertical` (Drag & Drop — 4.3, seule zone
 *     draggable ; la poignée reçoit `dragHandleProps`) ;
 *   - libellé + badge du type (« Page » / « Lien ») + cible `href` (mono) ;
 *   - marqueur **« Sous-menu »** (indentation + icône) pour les items de
 *     Niveau 2 (4.3) et compteur de sous-liens pour un parent de Niveau 1 ;
 *   - Toggle Eye (masquer / afficher sans supprimer, spec §7.2-D) ;
 *   - édition (`Pencil`) → ouvre la Dialog du formulaire ;
 *   - suppression (`Trash2`) → ouvre la Dialog de confirmation (cascade du
 *     sous-menu pour un parent, 4.3).
 *
 * NB (4.3) : les boutons ↑ / ↓ (provisoires 4.1) sont **retirés** au profit du
 * réordonnancement par Drag & Drop. Le composant est **présentationnel** : le
 * `<li>`/ref du `Draggable` est posé par le conteneur (`MenuDndZone`).
 *
 * Références : plans/ROADMAP-4.1-navigation.md §1.4 —
 *              plans/ROADMAP-4.3-navigation-advanced.md §1.5
 * ============================================================================
 */

type NavEntryRowProps = {
  entry: NavMenuEntry;
  /** Niveau dans l'arborescence (1 = racine, 2 = sous-menu — Header). */
  level: 1 | 2;
  /** Nombre d'enfants d'un parent de Niveau 1 (0/absent sinon). */
  submenuCount?: number;
  /** Poignée du `Draggable` parent (posée sur le bouton grip). */
  dragHandleProps?: DraggableProvidedDragHandleProps | null;
  /** true pendant le glisser (style `snapshot.isDragging`). */
  snapshotIsDragging?: boolean;
  /** Bascule la visibilité : reçoit `entry.hidden` (valeur actuelle). */
  onToggleHidden: (id: string, hidden: boolean) => void;
  onEdit: (entry: NavMenuEntry) => void;
  onRemove: (entry: NavMenuEntry) => void;
};

export function NavEntryRow({
  entry,
  level,
  submenuCount = 0,
  dragHandleProps,
  snapshotIsDragging = false,
  onToggleHidden,
  onEdit,
  onRemove,
}: NavEntryRowProps) {
  const hidden = entry.hidden;

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-lg border border-border bg-card px-2 py-2 transition-[box-shadow,background-color]",
        level === 2 && "bg-muted/20",
        hidden && "bg-muted/30",
        snapshotIsDragging && "shadow-lg ring-2 ring-ring/40"
      )}
    >
      {/* Poignée de glissement (Drag & Drop — seule zone draggable) */}
      {dragHandleProps ? (
        <button
          type="button"
          {...dragHandleProps}
          aria-label={`Réordonner « ${entry.label} » par glisser-déposer`}
          title="Glisser pour réordonner ou imbriquer"
          className="cursor-grab rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground active:cursor-grabbing"
        >
          <GripVertical className="size-4" />
        </button>
      ) : null}

      {/* Libellé + badges + cible */}
      <div className="min-w-0 flex-1 px-1">
        <p className="flex items-center gap-2">
          {level === 2 && (
            <ListTree
              aria-hidden="true"
              className="size-3.5 shrink-0 text-muted-foreground"
            />
          )}
          <span
            className={cn(
              "truncate text-sm font-medium text-foreground",
              hidden && "text-muted-foreground"
            )}
          >
            {entry.label}
          </span>
          {level === 2 && (
            <Badge
              variant="outline"
              className="shrink-0 rounded-sm px-1.5 py-0 text-[10px] font-medium uppercase tracking-wide"
            >
              Sous-menu
            </Badge>
          )}
          {hidden && <Badge variant="outline">Masqué</Badge>}
        </p>
        <p className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
          <Badge
            variant="secondary"
            className="rounded-sm px-1.5 py-0 text-[10px] font-medium uppercase tracking-wide"
          >
            {entry.kind === "page" ? "Page" : "Lien"}
          </Badge>
          <span className="truncate font-mono">{entry.href}</span>
          {level === 1 && submenuCount > 0 && (
            <span className="shrink-0 text-[11px] text-muted-foreground">
              · {submenuCount} sous-lien{submenuCount > 1 ? "s" : ""}
            </span>
          )}
        </p>
      </div>

      {/* Toggle Eye — masquer / afficher */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-pressed={hidden}
        aria-label={
          hidden
            ? `Afficher « ${entry.label} » dans le menu`
            : `Masquer « ${entry.label} » du menu`
        }
        title={
          hidden
            ? "Afficher dans le menu (sans perdre le lien)"
            : "Masquer du menu (sans supprimer)"
        }
        onClick={() => onToggleHidden(entry.id, hidden)}
        className={cn(
          "text-muted-foreground hover:text-foreground",
          hidden && "text-foreground"
        )}
      >
        {hidden ? <EyeOff /> : <Eye />}
      </Button>

      {/* Édition */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={`Modifier le lien « ${entry.label} »`}
        title="Modifier le lien"
        onClick={() => onEdit(entry)}
      >
        <Pencil />
      </Button>

      {/* Suppression */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={`Supprimer le lien « ${entry.label} »`}
        title="Supprimer le lien"
        onClick={() => onRemove(entry)}
        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash2 />
      </Button>
    </div>
  );
}
