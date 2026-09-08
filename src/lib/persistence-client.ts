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
import type { SiteNavigation } from "./navigation";
import type { PageMetadataDraft } from "./pages";

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
    // Remonte le message d'erreur du serveur (diagnostic).
    const payload = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
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
