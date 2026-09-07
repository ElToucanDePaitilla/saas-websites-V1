"use client";

/**
 * ============================================================================
 * CLIENT MÉDIAS — appels API + état (Étape 6.1)
 * ----------------------------------------------------------------------------
 * Hook `useMediaAssets` + fonctions d'appel pour la Media Library et le
 * MediaPicker. **Fallback démo** : quand Supabase Storage n'est pas configuré,
 * une liste d'images d'exemple (lecture seule) est fournie — aucun appel API.
 * ============================================================================
 */

import * as React from "react";

import { isStorageConfigured } from "@/lib/supabase/demo";

/** Actif média (miroir côté client du repository serveur). */
export interface MediaAsset {
  id: string;
  url: string;
  filename: string;
  size: number;
  mimeType: string;
  width: number | null;
  height: number | null;
  exifData: unknown;
  blurDataUrl: string | null;
  createdAt: string;
}

/** Jeu de démonstration (lecture seule, mode démo). */
const DEMO_MEDIA: MediaAsset[] = [
  {
    id: "demo-1",
    url: "https://picsum.photos/seed/portfolio1/800/600",
    filename: "mariage-demo.jpg",
    size: 0,
    mimeType: "image/jpeg",
    width: 800,
    height: 600,
    exifData: { focale: "50 mm", ouverture: "f/1.8", vitesse: "1/200 s", iso: 100 },
    blurDataUrl: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: "demo-2",
    url: "https://picsum.photos/seed/portfolio2/800/600",
    filename: "portrait-demo.jpg",
    size: 0,
    mimeType: "image/jpeg",
    width: 800,
    height: 600,
    exifData: { focale: "85 mm", ouverture: "f/2.0", vitesse: "1/250 s", iso: 200 },
    blurDataUrl: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: "demo-3",
    url: "https://picsum.photos/seed/portfolio3/800/600",
    filename: "corporate-demo.jpg",
    size: 0,
    mimeType: "image/jpeg",
    width: 800,
    height: 600,
    exifData: { focale: "35 mm", ouverture: "f/4.0", vitesse: "1/125 s", iso: 400 },
    blurDataUrl: null,
    createdAt: new Date().toISOString(),
  },
];

/** true si le contexte courant est le mode démo (aucun appel API). */
export function isMediaDemoMode(): boolean {
  return !isStorageConfigured();
}

/** Charge la liste des médias (API ou jeu de démo). */
export async function fetchMedia(): Promise<MediaAsset[]> {
  if (isMediaDemoMode()) {
    return DEMO_MEDIA;
  }
  const response = await fetch("/api/media", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Impossible de charger la médiathèque.");
  }
  const payload: { items: MediaAsset[] } = await response.json();
  return payload.items;
}

/** Upload d'un fichier image → nouvel actif. */
export async function uploadMedia(file: File): Promise<MediaAsset> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch("/api/media", {
    method: "POST",
    body: formData,
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(payload?.error ?? "Upload impossible.");
  }
  const payload: { asset: MediaAsset } = await response.json();
  return payload.asset;
}

/** Supprime un média (ne rien faire en mode démo). */
export async function deleteMediaRequest(id: string): Promise<void> {
  if (isMediaDemoMode()) {
    return;
  }
  const response = await fetch(`/api/media/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Suppression impossible.");
  }
}

/** Hook : liste des médias + états (chargement, erreur, mode démo). */
export function useMediaAssets(): {
  assets: MediaAsset[];
  loading: boolean;
  error: string | null;
  demo: boolean;
  refresh: () => Promise<void>;
} {
  const [assets, setAssets] = React.useState<MediaAsset[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const demo = isMediaDemoMode();

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await fetchMedia();
      setAssets(items);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const items = await fetchMedia();
        if (!cancelled) {
          setAssets(items);
        }
      } catch (caught) {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : "Erreur inconnue");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { assets, loading, error, demo, refresh };
}
