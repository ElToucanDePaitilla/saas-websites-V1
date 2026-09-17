"use client";

import * as React from "react";

/**
 * ============================================================================
 * WIDGET TURNSTILE — composant maison (Étape 14.1)
 * ----------------------------------------------------------------------------
 * Cloudflare Turnstile en **rendu explicite** (`api.js?render=explicit`).
 *
 * Pourquoi pas `@marsidev/react-turnstile` : ce serait une quatrième
 * dépendance pour ~40 lignes, avec le risque de peer React 19 qu'on vient
 * précisément d'écarter ailleurs. Le script est chargé **une seule fois** par
 * page (promesse partagée au niveau module), même si deux formulaires coexistent
 * (la page de démonstration en monte deux).
 *
 * Le composant ne décide **jamais** de la validité : il remonte un jeton, et le
 * serveur seul vérifie (`siteverify`). Sans jeton, la route refuse.
 * ============================================================================
 */

const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

interface TurnstileApi {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": () => void;
    }
  ) => string;
  remove: (widgetId: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptPromise: Promise<void> | null = null;

/** Charge (une fois) le script Turnstile et résout quand l'API est prête. */
function loadTurnstile(): Promise<void> {
  if (window.turnstile) {
    return Promise.resolve();
  }
  if (scriptPromise) {
    return scriptPromise;
  }
  scriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Script Turnstile illisible."));
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export function TurnstileWidget({
  siteKey,
  onToken,
}: {
  siteKey: string;
  onToken: (token: string) => void;
}) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  // La callback peut changer à chaque rendu : on la lit via une ref, sinon on
  // recréerait le widget à chaque frappe du formulaire.
  const onTokenRef = React.useRef(onToken);

  React.useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  React.useEffect(() => {
    let widgetId: string | null = null;
    let cancelled = false;

    void loadTurnstile()
      .then(() => {
        const container = containerRef.current;
        const api = window.turnstile;
        if (cancelled || !container || !api) {
          return;
        }
        widgetId = api.render(container, {
          sitekey: siteKey,
          callback: (token) => onTokenRef.current(token),
          "expired-callback": () => onTokenRef.current(""),
          "error-callback": () => onTokenRef.current(""),
        });
      })
      .catch(() => {
        // Script indisponible : le formulaire reste utilisable, le serveur
        // refusera la soumission — c'est lui qui garde la porte.
      });

    return () => {
      cancelled = true;
      if (widgetId && window.turnstile) {
        window.turnstile.remove(widgetId);
      }
    };
  }, [siteKey]);

  return <div ref={containerRef} className="contact-form__turnstile" />;
}
