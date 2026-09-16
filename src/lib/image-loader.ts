import type { ImageLoaderProps } from "next/image";

import { supabaseImageUrl } from "@/lib/media-url";

/**
 * ============================================================================
 * LOADER D'IMAGES DU SITE — déclaré dans `next.config.ts` (`images.loaderFile`)
 * ----------------------------------------------------------------------------
 * Déclaré **ici et non passé en prop** : `next/image` est un composant client, et
 * une fonction ne peut pas franchir la frontière serveur → client (« Functions
 * cannot be passed directly to Client Components »). Un `loaderFile` est le
 * mécanisme prévu pour cela — Next l'intègre à son propre bundle, les composants
 * serveur n'ont plus rien à transmettre, et **toutes** les images du site en
 * héritent sans exception.
 *
 * Rôle : demander à Supabase Storage l'image **déjà redimensionnée** en WebP
 * (`/storage/v1/render/image/…?width=…&format=webp&quality=…`) au lieu de faire
 * télécharger l'original par l'optimiseur de Next — une photo du portfolio pèse
 * 2,81 Mo, la même en 640 px WebP en fait 252 Ko. Les URL d'autres hôtes
 * (visuels de démonstration picsum) sont renvoyées telles quelles.
 * ============================================================================
 */

export default function imageLoader({
  src,
  width,
  quality,
}: ImageLoaderProps): string {
  return supabaseImageUrl(src, { width, quality });
}
