"use client";

import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

import { MediaImage } from "@/components/common/MediaImage";
import { Button } from "@/components/ui/button";
import { exifChipsFromData } from "@/lib/media-exif";
import { supabaseImageUrl } from "@/lib/media-url";
import type { GalleryImage, GalleryLightboxSettings } from "@/lib/pages";
import { cn } from "@/lib/utils";

/**
 * ============================================================================
 * LIGHTBOX GÉNÉRIQUE — `LightboxModal` (Phase 11)
 * ----------------------------------------------------------------------------
 * Composant UNIQUE partagé par Gallery Dynamic et Gallery Portfolio :
 *   - Dynamic   → reçoit TOUTES les images de la galerie ;
 *   - Portfolio → reçoit UNIQUEMENT les images de l'album cliqué.
 *
 * Fonctionnalités :
 *   - navigation Précédent/Suivant (boutons + flèches ← →) et Échap pour fermer ;
 *   - **focus trap** (Tab cyclique), `role="dialog"`, `aria-modal`, `aria-live`
 *     sur le compteur, scroll verrouillé, restauration du focus **uniquement**
 *     quand l'ouverture vient du clavier (évite l'anneau après un clic souris) ;
 *   - **Zoom HD** et **plein écran** (Fullscreen API) ;
 *   - **cycle de zoom au double-clic** : fit → niveau 1 (1,5×) → niveau 2 (2,5×)
 *     → fit ;
 *   - **déplacement au clic maintenu** (pointer events + écouteurs fenêtre),
 *     borné aux limites de l'image, **sans scroll** (molette neutralisée) ;
 *   - **préchargement de la photo suivante** (une seule, servie par le CDN de
 *     transformation) pour une navigation fluide, et qualité d'image explicite
 *     (80).
 * ============================================================================
 */

type LightboxModalProps = {
  open: boolean;
  images: GalleryImage[];
  initialIndex: number;
  settings: GalleryLightboxSettings;
  /** Titre affiché (ex. nom de l'album). */
  title?: string;
  exifByUrl?: Record<string, unknown>;
  /** Restaure le focus sur l'élément déclencheur (ouvertures clavier). */
  restoreFocus?: boolean;
  onClose: () => void;
};

/** Niveau de zoom courant : 0 = fit (100 %), 1 = niveau 1, 2 = niveau 2. */
type ZoomLevel = 0 | 1 | 2;

/** Borne une valeur dans `[min, max]`. */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Largeur annoncée de la photo affichée (`sizes`). Au-delà, l'œil ne voit plus
 * la différence, et le CDN produirait des WebP de plusieurs mégaoctets.
 */
const LIGHTBOX_IMAGE_SIZES = "(max-width: 1024px) 100vw, 1600px";

/**
 * Largeur demandée pour la photo **suivante**. 1920 est la première largeur que
 * `next/image` propose au-dessus de 1600 px : c'est donc celle que le navigateur
 * choisit pour l'image affichée, et précharger **exactement cette variante**
 * fait qu'à la navigation suivante elle est déjà dans le cache.
 */
const LIGHTBOX_PRELOAD_WIDTH = 1920;

/** Délai avant de précharger la suivante (ms) : l'image affichée passe d'abord. */
const LIGHTBOX_PRELOAD_DELAY_MS = 200;

export function LightboxModal({
  open,
  images,
  initialIndex,
  settings,
  title,
  exifByUrl,
  restoreFocus = true,
  onClose,
}: LightboxModalProps) {
  const [index, setIndex] = React.useState(initialIndex);
  const [zoom, setZoom] = React.useState<ZoomLevel>(0);
  const [offset, setOffset] = React.useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [dragging, setDragging] = React.useState(false);
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  const dialogRef = React.useRef<HTMLDivElement>(null);
  const panRef = React.useRef<HTMLDivElement>(null);
  const closeButtonRef = React.useRef<HTMLButtonElement>(null);
  const previousFocusRef = React.useRef<HTMLElement | null>(null);
  const dragRef = React.useRef<{
    pointerId: number;
    x: number;
    y: number;
    ox: number;
    oy: number;
  } | null>(null);
  const cleanupDragRef = React.useRef<(() => void) | null>(null);
  // Horodatage d'ouverture : ignore un clic « résiduel » du double-clic d'ouverture.
  const openedAtRef = React.useRef<number>(0);

  const total = images.length;
  const safeIndex = total > 0 ? clamp(index, 0, total - 1) : 0;
  const active = total > 0 ? images[safeIndex] : null;
  const zoomFactor =
    zoom === 0 ? 1 : zoom === 1 ? settings.zoomLevel1 : settings.zoomLevel2;

  /** Réinitialise le zoom et le déplacement. */
  const resetZoom = React.useCallback(() => {
    setZoom(0);
    setOffset({ x: 0, y: 0 });
  }, []);

  /** Change d'image (navigation circulaire) et réinitialise le zoom. */
  const go = React.useCallback(
    (delta: number) => {
      if (total === 0) {
        return;
      }
      setIndex((current) => (current + delta + total) % total);
      resetZoom();
    },
    [total, resetZoom]
  );

  /** Cycle du zoom au double-clic : fit → 1 → 2 → fit. */
  const cycleZoom = React.useCallback(() => {
    if (!settings.zoomEnabled) {
      return;
    }
    setZoom((current) => {
      const next = ((current + 1) % 3) as ZoomLevel;
      if (next === 0) {
        setOffset({ x: 0, y: 0 });
      }
      return next;
    });
  }, [settings.zoomEnabled]);

  /**
   * Verrouille le scroll de la page et gère le focus (entrée + restitution).
   * Le parent monte la Lightbox à l'ouverture : l'index initial provient
   * directement du `useState` (aucune synchronisation d'état en effet).
   */
  React.useEffect(() => {
    if (!open) {
      return;
    }
    openedAtRef.current = Date.now();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      // Restaure le focus sur la vignette UNIQUEMENT si l'ouverture est clavier
      // (sinon l'anneau de focus s'afficherait après un simple clic souris).
      if (restoreFocus) {
        previousFocusRef.current?.focus();
      }
    };
  }, [open, restoreFocus]);

  /** Nettoie les écouteurs de glissement si la Lightbox est démontée en plein pan. */
  React.useEffect(
    () => () => {
      cleanupDragRef.current?.();
    },
    []
  );

  /** Écoute le plein écran (mise à jour de l'icône). */
  React.useEffect(() => {
    function onChange() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  /** Clavier : Échap, flèches, Tab (focus trap). */
  React.useEffect(() => {
    if (!open) {
      return;
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === "ArrowRight") {
        go(1);
        return;
      }
      if (event.key === "ArrowLeft") {
        go(-1);
        return;
      }
      if (event.key === "Tab") {
        const root = dialogRef.current;
        if (!root) {
          return;
        }
        const focusables = root.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) {
          return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const activeEl = document.activeElement;
        if (event.shiftKey && activeEl === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && activeEl === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, go, onClose]);

  /**
   * Précharge la photo **suivante** dès que l'index change : la navigation du
   * diaporama est ainsi quasi instantanée.
   *
   * Deux défauts de la version précédente sont corrigés ici, et c'est eux qui
   * faisaient « figer » le diaporama :
   *   - elle préchargeait **les deux voisines** (n−1 *et* n+1) : la précédente
   *     ne sert à rien quand on avance, et deux téléchargements simultanés
   *     disputaient la connexion à l'image affichée ;
   *   - elle utilisait l'URL **d'origine** de la photo (`images[…].url`), soit
   *     **2,81 Mo** pièce : chaque appui sur une flèche déclenchait ~5,6 Mo de
   *     téléchargements, saturait la liaison et donnait l'impression que le
   *     diaporama se bloquait. On passe désormais par le **CDN de
   *     transformation** (`supabaseImageUrl`), qui sert le WebP à la largeur
   *     d'affichage — quelques centaines de Ko.
   *
   * Le délai laisse partir l'image affichée en premier : le préchargement ne
   * doit jamais lui prendre sa bande passante.
   */
  React.useEffect(() => {
    if (!open || total <= 1) {
      return;
    }
    const nextImage = images[(safeIndex + 1) % total];
    if (!nextImage?.url) {
      return;
    }
    const timer = window.setTimeout(() => {
      const preload = new window.Image();
      preload.decoding = "async";
      // Une URL qui n'est pas une image Supabase (visuel de démonstration)
      // ressort inchangée de `supabaseImageUrl`.
      preload.src = supabaseImageUrl(nextImage.url, {
        width: LIGHTBOX_PRELOAD_WIDTH,
        quality: 80,
      });
    }, LIGHTBOX_PRELOAD_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [open, safeIndex, total, images]);

  /** Neutralise la molette en mode zoomé (déplacement au clic, pas au scroll). */
  React.useEffect(() => {
    const el = panRef.current;
    if (!open || !el) {
      return;
    }
    function onWheel(event: WheelEvent) {
      if (zoom > 0) {
        event.preventDefault();
      }
    }
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [open, zoom]);

  /** Déplacement borné aux limites de l'image zoomée. */
  function boundedOffset(next: { x: number; y: number }): {
    x: number;
    y: number;
  } {
    const el = panRef.current;
    const width = el?.clientWidth ?? 0;
    const height = el?.clientHeight ?? 0;
    const maxX = Math.max(0, (width * (zoomFactor - 1)) / 2);
    const maxY = Math.max(0, (height * (zoomFactor - 1)) / 2);
    return { x: clamp(next.x, -maxX, maxX), y: clamp(next.y, -maxY, maxY) };
  }

  /**
   * Démarre un glissement : l'état de drag est armé AVANT toute capture, puis
   * des écouteurs **fenêtre** pilotent le déplacement (robuste même si la
   * capture de pointeur échoue ou sort du cadre).
   */
  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (zoom === 0 || event.button !== 0) {
      return;
    }
    const base = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      ox: offset.x,
      oy: offset.y,
    };
    dragRef.current = base;
    setDragging(true);

    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // La capture peut échouer (navigateur/pointeur) : les écouteurs fenêtre
      // ci-dessous suffisent au bon fonctionnement du glissement.
    }

    function onMove(moveEvent: PointerEvent) {
      const current = dragRef.current;
      if (!current || current.pointerId !== moveEvent.pointerId) {
        return;
      }
      setOffset(
        boundedOffset({
          x: current.ox + (moveEvent.clientX - current.x),
          y: current.oy + (moveEvent.clientY - current.y),
        })
      );
    }

    function finish(upEvent?: PointerEvent) {
      if (
        upEvent &&
        dragRef.current &&
        dragRef.current.pointerId !== upEvent.pointerId
      ) {
        return;
      }
      dragRef.current = null;
      setDragging(false);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", finish);
      cleanupDragRef.current = null;
    }

    cleanupDragRef.current = () => finish();
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", finish);
  }

  /** Bascule Zoom HD : fit ↔ niveau 2. */
  function toggleZoomHd() {
    if (zoom === 0) {
      setZoom(2);
    } else {
      resetZoom();
    }
  }

  /** Bascule plein écran (Fullscreen API). */
  function toggleFullscreen() {
    const el = dialogRef.current;
    if (!el) {
      return;
    }
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else if (el.requestFullscreen) {
      void el.requestFullscreen();
    }
  }

  /** Fermeture par l'arrière-plan, en ignorant le clic résiduel d'ouverture. */
  function handleBackdropClick() {
    if (Date.now() - openedAtRef.current < 300) {
      return;
    }
    onClose();
  }

  if (!open || !active) {
    return null;
  }

  const chips = settings.showExif
    ? exifChipsFromData(exifByUrl?.[active.url] ?? null)
    : [];

  return (
    <div
      className="fixed inset-0 z-50 flex bg-black/95 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title || active.title || active.alt || "Diaporama"}
        className="relative flex h-full w-full flex-col"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Barre supérieure : compteur + actions + fermeture. */}
        <div className="flex items-center justify-between gap-2 p-3 text-white">
          <p
            className="min-w-0 flex-1 truncate px-2"
            style={{ fontSize: "clamp(0.8rem, 2.4vw, 0.95rem)" }}
            aria-live="polite"
          >
            {title ? `${title} — ` : ""}
            {safeIndex + 1} / {total}
            {active.title ? ` — ${active.title}` : ""}
          </p>

          <div className="flex shrink-0 items-center gap-1">
            {settings.zoomEnabled ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10 hover:text-white"
                onClick={toggleZoomHd}
                aria-label={zoom === 0 ? "Zoom HD" : "Réduire le zoom"}
                title={zoom === 0 ? "Zoom HD" : "Réduire le zoom"}
              >
                {zoom === 0 ? (
                  <ZoomIn className="size-5" />
                ) : (
                  <ZoomOut className="size-5" />
                )}
              </Button>
            ) : null}

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10 hover:text-white"
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? "Quitter le plein écran" : "Plein écran"}
              title={isFullscreen ? "Quitter le plein écran" : "Plein écran"}
            >
              {isFullscreen ? (
                <Minimize2 className="size-5" />
              ) : (
                <Maximize2 className="size-5" />
              )}
            </Button>

            <Button
              ref={closeButtonRef}
              type="button"
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10 hover:text-white"
              onClick={onClose}
              aria-label="Fermer"
            >
              <X className="size-5" />
            </Button>
          </div>
        </div>

        {/* Zone image : navigation + pan (clic maintenu) + double-clic zoom. */}
        <div className="relative flex min-h-0 flex-1 items-center">
          {total > 1 ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute left-2 z-10 text-white hover:bg-white/10 hover:text-white sm:left-3"
              onClick={() => go(-1)}
              aria-label="Image précédente"
            >
              <ChevronLeft className="size-8" />
            </Button>
          ) : null}

          <div
            ref={panRef}
            className="relative flex h-full w-full select-none items-center justify-center overflow-hidden px-2 sm:px-14"
            style={{
              touchAction: zoom > 0 ? "none" : "auto",
              overscrollBehavior: "contain",
              cursor: zoom > 0 ? (dragging ? "grabbing" : "grab") : "zoom-in",
            }}
            onDoubleClick={cycleZoom}
            onPointerDown={handlePointerDown}
          >
            <div
              className={cn("relative h-full w-full", !dragging && "transition-transform duration-200 ease-out")}
              style={{
                transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${zoomFactor})`,
                transformOrigin: "center center",
                willChange: dragging ? "transform" : undefined,
              }}
            >
              <MediaImage
                src={active.url}
                alt={active.alt || active.title || "Photo"}
                fill
                priority
                quality={80}
                sizes={LIGHTBOX_IMAGE_SIZES}
                className="pointer-events-none select-none object-contain"
              />
            </div>
          </div>

          {total > 1 ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-2 z-10 text-white hover:bg-white/10 hover:text-white sm:right-3"
              onClick={() => go(1)}
              aria-label="Image suivante"
            >
              <ChevronRight className="size-8" />
            </Button>
          ) : null}
        </div>

        {/* Pied : légende, EXIF et aide clavier. */}
        <div className="flex flex-col items-center gap-2 p-4 text-center text-xs text-white/80">
          {settings.showCaption && (active.title || active.description) ? (
            <div className="max-w-2xl">
              {active.title ? (
                <p
                  className="text-sm font-medium"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {active.title}
                </p>
              ) : null}
              {active.description ? (
                <p className="mt-0.5 text-white/80">{active.description}</p>
              ) : null}
            </div>
          ) : null}

          {chips.length > 0 ? (
            <div className="flex flex-wrap items-center justify-center gap-2">
              {chips.map((chip) => (
                <span key={chip} className="rounded-full bg-white/15 px-3 py-1">
                  {chip}
                </span>
              ))}
            </div>
          ) : null}

          <p className="text-white/50">
            {settings.zoomEnabled
              ? "Double-clic : zoom · Clic maintenu : déplacer · Échap : fermer"
              : "Échap : fermer"}
          </p>
        </div>
      </div>
    </div>
  );
}
