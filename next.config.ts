import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // URLs publiques Supabase Storage (bucket portfolio-media).
      { protocol: "https", hostname: "*.supabase.co" },
      // Images de démonstration (mode démo).
      { protocol: "https", hostname: "picsum.photos" },
    ],
  },
  experimental: {
    /**
     * Cache persistant Turbopack **en développement**.
     *
     * Désactivé volontairement ici : sur cet environnement Windows, le dossier
     * `.next/dev/cache/turbopack` s'est retrouvé verrouillé (écriture et
     * suppression refusées : « os error 5 »), ce qui faisait échouer la
     * persistance à chaque `next dev` :
     *   « Persisting failed: Unable to write meta file … Accès refusé ».
     *
     * Sans cache, `next dev` démarre de façon déterministe et n'écrit plus dans
     * ce dossier. Valeur par défaut de Next.js : `true`. À réactiver une fois
     * le dossier `.next` purgé et le verrou disparu.
     */
    turbopackFileSystemCacheForDev: false,
  },
};

export default nextConfig;
