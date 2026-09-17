/**
 * ============================================================================
 * E-MAIL DE NOTIFICATION — nouveau message de contact (Étape 14.1)
 * ----------------------------------------------------------------------------
 * Prévient le propriétaire qu'un message vient d'être **enregistré en base**.
 *
 * Deux décisions :
 *   - **échec non bloquant** : la ligne existe déjà quand cet appel part, un
 *     e-mail refusé ne perd donc rien. On journalise et on continue ; la route
 *     répond 200 au visiteur quoi qu'il arrive.
 *   - **pas de SDK Resend** : un `fetch` suffit pour un envoi unique. Ajouter une
 *     dépendance (et sa surface de mise à jour) pour un appel HTTP serait
 *     disproportionné — même raisonnement que le widget Turnstile maison.
 * ============================================================================
 */

import { getResendConfig } from "@/lib/integrations";

/** Contenu du message à notifier. */
export interface ContactNotification {
  senderName: string;
  senderEmail: string;
  subject: string;
  message: string;
  /** Vrai si une pièce jointe a été déposée (jamais son URL en clair). */
  hasAttachment: boolean;
}

/** Corps texte de la notification (aucun HTML : rien à échapper). */
function notificationText(notification: ContactNotification): string {
  const lines = [
    `Nouveau message de ${notification.senderName} <${notification.senderEmail}>.`,
    "",
    notification.subject !== "" ? `Sujet : ${notification.subject}` : "Sujet : (non renseigné)",
    "",
    notification.message,
    "",
    notification.hasAttachment
      ? "Une pièce jointe est disponible dans le stockage du site."
      : "Aucune pièce jointe.",
  ];
  return lines.join("\n");
}

/**
 * Envoie la notification. Retourne `false` si Resend n'est pas configuré ou si
 * l'envoi échoue — l'erreur est journalisée, **jamais propagée**.
 */
export async function sendContactNotification(
  to: string,
  notification: ContactNotification
): Promise<boolean> {
  const config = getResendConfig();
  if (!config) {
    return false;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: config.from,
        to: [to],
        reply_to: notification.senderEmail,
        subject:
          notification.subject !== ""
            ? `${notification.subject} — message de ${notification.senderName}`
            : `Message de ${notification.senderName}`,
        text: notificationText(notification),
      }),
    });
    if (!response.ok) {
      console.error("Resend a refusé l'envoi :", response.status);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Notification de contact :", error);
    return false;
  }
}
