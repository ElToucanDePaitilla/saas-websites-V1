import Image from "next/image";

/**
 * ============================================================================
 * MEDIA IMAGE — wrapper `next/image` (Étape 6.1)
 * ----------------------------------------------------------------------------
 * Optimisation WebP/AVIF + placeholder (`blurDataURL`) optionnel. Affiche un
 * `<img>` natif pour les URL non autorisées (dégradation sûre — jamais
 * bloquante). Zéro `any`.
 *
 * Usage : conteneur parent dimensionné + `fill`, OU `width`/`height`
 * intrinsèques.
 * ============================================================================
 */

type MediaImageProps = {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  priority?: boolean;
  blurDataUrl?: string | null;
};

/** Hôtes distants autorisés par `next.config` (sinon `<img>` natif). */
const ALLOWED_HOST_SUFFIXES = [".supabase.co", "picsum.photos"];

function canUseNextImage(src: string): boolean {
  try {
    const { hostname } = new URL(src);
    return ALLOWED_HOST_SUFFIXES.some((suffix) => hostname.endsWith(suffix));
  } catch {
    return false;
  }
}

export function MediaImage({
  src,
  alt,
  className,
  sizes,
  fill = false,
  width,
  height,
  priority = false,
  blurDataUrl,
}: MediaImageProps) {
  if (!canUseNextImage(src)) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className={className} />;
  }

  return (
    <Image
      src={src}
      alt={alt}
      className={className}
      sizes={sizes}
      fill={fill}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      priority={priority}
      placeholder={blurDataUrl ? "blur" : "empty"}
      blurDataURL={blurDataUrl ?? undefined}
    />
  );
}
