import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    /**
     * **Loader d'images du site** : les photos du portfolio sont demandées
     * *déjà redimensionnées* au CDN de transformation Supabase
     * ([`src/lib/image-loader.ts`](src/lib/image-loader.ts)) au lieu d'être
     * téléchargées en original par l'optimiseur de Next.
     *
     * Mesure qui a motivé ce montage : une photo du portfolio pèse **2,81 Mo** ;
     * l'optimiseur la téléchargeait entièrement, **par largeur demandée**, puis
     * la ré-encodait — au-delà de son délai interne (7 s) il abandonnait et
     * répondait **500** sur *toutes* les photos (« upstream image response timed
     * out »). La même photo servie par Supabase en WebP 640 px ne pèse plus que
     * **252 Ko**.
     *
     * Déclaré ici, et non passé en prop : `next/image` est un composant client,
     * une fonction ne peut donc pas lui être transmise depuis un composant
     * serveur. `loaderFile` est le mécanisme prévu — il vaut pour **toutes** les
     * images du site, back-office compris, sans exception à maintenir.
     */
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",
    /**
     * Conservés pour la documentation et pour un éventuel retour au loader
     * intégré : avec un loader personnalisé, Next ne valide plus ni les hôtes
     * ni la qualité (il ne télécharge plus rien lui-même).
     */
    remotePatterns: [
      // URLs publiques Supabase Storage (bucket portfolio-media).
      { protocol: "https", hostname: "*.supabase.co" },
      // Images de démonstration (mode démo).
      { protocol: "https", hostname: "picsum.photos" },
    ],
    qualities: [75, 80],
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
