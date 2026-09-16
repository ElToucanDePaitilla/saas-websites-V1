/**
 * ============================================================================
 * URL D'IMAGE — transformations servies par le CDN Supabase (Étape 6.1)
 * ----------------------------------------------------------------------------
 * Les photos du portfolio sont stockées dans Supabase Storage et pèsent
 * plusieurs mégaoctets (mesuré sur une photo réelle du portfolio : **2,81 Mo**).
 * Confier le redimensionnement à l'optimiseur de Next revient à **télécharger
 * l'original entier, côté serveur**, une fois par largeur demandée (640, 750,
 * 828, 1080…), puis à le ré-encoder : sur une liaison ordinaire ce
 * téléchargement dépasse le délai interne de l'optimiseur (7 s) et **toutes les
 * images répondent 500** (« upstream image response timed out »).
 *
 * Supabase le fait déjà, en périphérie : `/storage/v1/render/image/…` renvoie la
 * même photo en **WebP 640 px pour 252 Ko** au lieu de 2,81 Mo. On lui demande
 * donc directement la taille voulue et on sert **cette** URL — c'est le montage
 * prévu par le plan du stockage média : « URL CDN Supabase avec transformations
 * → `next/image` ne retravaille pas les octets ».
 *
 * Ces deux fonctions sont **pures** : elles sont appelées par le loader déclaré
 * dans `next.config.ts` ([`image-loader.ts`](./image-loader.ts)), qui les fait
 * servir à **toutes** les images du site. Un `loader` passé en prop serait
 * refusé — `next/image` est un composant client, une fonction ne franchit pas
 * la frontière serveur → client.
 * ============================================================================
 */

const SUPABASE_PUBLIC_MARKER = "/storage/v1/object/public/";
const SUPABASE_RENDER_MARKER = "/storage/v1/render/image/public/";

/**
 * Largeur maximale demandée au CDN. Next propose des variantes jusqu'à 3840 px
 * (écrans 4K / très haute densité) : au-delà de ~2560, le WebP produit pèse
 * plusieurs mégaoctets pour un gain invisible à l'œil — on plafonne, et
 * plusieurs entrées du `srcset` pointent alors vers la même variante.
 */
const MAX_TRANSFORM_WIDTH = 2560;

/** L'URL est-elle une image publique de Supabase Storage (donc transformable) ? */
export function isSupabaseStorageUrl(src: string): boolean {
  return src.includes("supabase.co") && src.includes(SUPABASE_PUBLIC_MARKER);
}

/**
 * URL servie par le CDN Supabase : largeur demandée, format WebP, qualité.
 * Une URL qui n'est pas une image Supabase est renvoyée **telle quelle** — les
 * visuels de démonstration (picsum) continuent donc de fonctionner à l'identique.
 * La largeur est plafonnée à `MAX_TRANSFORM_WIDTH` (voir plus haut).
 */
export function supabaseImageUrl(
  src: string,
  { width, quality }: { width: number; quality?: number }
): string {
  if (!isSupabaseStorageUrl(src)) {
    return src;
  }
  const base = src.replace(SUPABASE_PUBLIC_MARKER, SUPABASE_RENDER_MARKER);
  const separator = base.includes("?") ? "&" : "?";
  const targetWidth = Math.min(width, MAX_TRANSFORM_WIDTH);
  const params = [`width=${targetWidth}`, "format=webp"];
  if (quality !== undefined) {
    params.push(`quality=${quality}`);
  }
  return `${base}${separator}${params.join("&")}`;
}
