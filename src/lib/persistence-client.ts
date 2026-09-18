/**
 * ============================================================================
 * CLIENT DE PERSISTANCE — appels API des stores (Étape 5.3)
 * ----------------------------------------------------------------------------
 * Fonctions clientes appelées par les Providers après chaque mutation locale
 * (optimiste) lorsque la persistance BDD est activée (`persistenceEnabled`,
 * transmise par les layouts quand la BDD est disponible).
 *
 * Chaque fonction lève une erreur si la réponse n'est pas `ok` — les appelants
 * journalisent (fire-and-forget) ; l'état local reste la source de vérité
 * immédiate de l'UI (aucune régression hors-BDD).
 *
 * Référence : plans/ROADMAP-5.3-crud-persistence.md §2.C
 * ============================================================================
 */

import type { SitePage } from "./pages";
import type { NavPresetId, SiteNavigation } from "./navigation";
import type { PageMetadataDraft } from "./pages";
import type { OwnerProfile } from "./owner-profile";
import type { TopBanner } from "./top-banner";
import type { VisualIdentity } from "./visual-identity";

/** Corps JSON typé des modules (content ouvert à la frontière API). */
type PersistModule = {
  id: string;
  type: string;
  title: string;
  hidden: boolean;
  animation: string;
  anchorId: string;
  layoutVariant?: string;
  content: unknown;
};

async function send(request: Request): Promise<void> {
  const response = await fetch(request);
  if (!response.ok) {
    // DIAGNOSTIC (temporaire) — discrimine l'origine d'un échec :
    //   - `contentType` HTML  ⇒ réponse du **routeur** Next (route absente ou en
    //     cours de recompilation : serveur de développement redémarré, ou
    //     `.next` écrasé par un `next build` lancé pendant que `next dev` tourne) ;
    //   - `contentType` JSON  ⇒ réponse du **gestionnaire** de route, qui porte
    //     alors un message exploitable (`error`).
    // La route `PUT /api/pages/[pageId]/modules` ne renvoie jamais 404 : un 404
    // HTML désigne donc toujours le routeur, jamais le code métier.
    const contentType = response.headers.get("content-type") ?? "";
    const isJson = contentType.includes("application/json");
    const payload = isJson
      ? ((await response.json().catch(() => null)) as { error?: string } | null)
      : null;

    console.warn("[persistance] échec de l'écriture", {
      method: request.method,
      url: request.url,
      status: response.status,
      contentType,
      /** true ⇒ le gestionnaire a répondu ; false ⇒ c'est le routeur Next. */
      reponseDuGestionnaire: isJson,
    });

    const detail = payload?.error ?? response.statusText;
    throw new Error(`Persistance BDD refusée (HTTP ${response.status}): ${detail}`);
  }
}

function jsonRequest(
  url: string,
  method: "POST" | "PATCH" | "PUT" | "DELETE",
  body?: unknown
): Request {
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

/** Crée une page (métadonnées + id). */
export async function persistCreatePage(page: SitePage): Promise<void> {
  await send(jsonRequest("/api/pages", "POST", page));
}

/** Met à jour les métadonnées d'une page. */
export async function persistUpdatePage(
  pageId: string,
  draft: PageMetadataDraft
): Promise<void> {
  const { title, menuTitle, slug, status, inMenu } = draft;
  await send(
    jsonRequest(`/api/pages/${encodeURIComponent(pageId)}`, "PATCH", {
      id: pageId,
      title,
      menuTitle,
      slug,
      status,
      inMenu,
    })
  );
}

/** Supprime une page (cascade modules + navigation liée). */
export async function persistDeletePage(pageId: string): Promise<void> {
  await send(
    jsonRequest(`/api/pages/${encodeURIComponent(pageId)}`, "DELETE")
  );
}

/** Désigne la page d'accueil du site (Étape 10.1 — transaction serveur). */
export async function persistSetHomePage(pageId: string): Promise<void> {
  await send(
    jsonRequest(`/api/pages/${encodeURIComponent(pageId)}/home`, "POST")
  );
}

/** Remplace la liste complète des modules d'une page. */
export async function persistUpdateModules(
  pageId: string,
  modules: PersistModule[]
): Promise<void> {
  await send(
    jsonRequest(
      `/api/pages/${encodeURIComponent(pageId)}/modules`,
      "PUT",
      { modules }
    )
  );
}

/** Remplace la navigation Header/Footer complète. */
export async function persistNavigation(
  navigation: SiteNavigation
): Promise<void> {
  await send(jsonRequest("/api/navigation", "PUT", navigation));
}

/**
 * Applique un **modèle de navigation** Onboarding (Étape 4.4) : transaction
 * serveur atomique (recalcule `is_in_menu` des pages + remplace le Header).
 * Utilisé par l'écran de bienvenue (site vierge), où aucun store n'est monté.
 */
export async function persistApplyPreset(presetId: NavPresetId): Promise<void> {
  await send(jsonRequest("/api/navigation/presets", "POST", { presetId }));
}

/** Upsert du profil propriétaire complet (Étape 8.2). */
export async function persistOwnerProfile(
  profile: OwnerProfile
): Promise<void> {
  await send(jsonRequest("/api/profile", "PUT", profile));
}

/** Upsert de l'identité visuelle du Header (Étape 9.1). */
export async function persistVisualIdentity(
  visualIdentity: VisualIdentity
): Promise<void> {
  await send(jsonRequest("/api/visual-identity", "PUT", visualIdentity));
}

/** Upsert du mini-bandeau global (réglage au-dessus du Header). */
export async function persistTopBanner(topBanner: TopBanner): Promise<void> {
  await send(jsonRequest("/api/top-banner", "PUT", topBanner));
}
