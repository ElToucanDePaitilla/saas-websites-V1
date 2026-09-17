"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  contactAttachmentRejection,
  type ContactFileRejection,
  type ContactFormSettings,
} from "@/lib/pages";

import { TurnstileWidget } from "./TurnstileWidget";

/**
 * ============================================================================
 * CONTAINER 3 — FORMULAIRE DE CONTACT (Étape 14.1)
 * ----------------------------------------------------------------------------
 * Le **premier chemin d'écriture non authentifié** du projet. Trois principes :
 *
 *   1. **Composants contrôlés natifs** (D3) : pas de `react-hook-form`, alignés
 *      sur `LoginForm` / `NavEntryForm`. L'état vit dans le composant.
 *   2. **Le client ne protège rien** : il vérifie taille et extension d'une
 *      pièce jointe pour le confort (éviter un aller-retour inutile), mais le
 *      serveur revalide tout, y compris la signature binaire du fichier.
 *   3. **Rien d'identitaire dans le payload** : ni destinataire, ni identifiant
 *      de photographe. Le serveur les déduit de `pageSlug` (page publiée).
 *
 * Le champ piège `_gotcha` est **visuellement masqué mais présent** (position
 * hors écran, jamais `display: none`) : un robot qui remplit tous les champs le
 * remplit, un humain ne le voit pas. Rempli, la route répond 200 sans rien
 * enregistrer ni envoyer — un rejet silencieux (D8).
 * ============================================================================
 */

/** Clé publique du widget — absente, le widget n'est pas monté (mode démo). */
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

type FormStatus = "idle" | "submitting" | "success" | "error";

/** Message affiché pour chaque motif de refus d'une pièce jointe. */
const REJECTION_MESSAGE: Record<ContactFileRejection, string> = {
  size: "La pièce jointe est vide ou dépasse la taille autorisée.",
  extension: "Ce format de pièce jointe n’est pas accepté.",
  signature: "Le contenu du fichier ne correspond pas à son format.",
};

const GENERIC_ERROR =
  "L’envoi n’a pas abouti. Réessayez dans quelques instants ou écrivez-moi directement par e-mail.";

export function ContactForm({
  settings,
  pageSlug,
}: {
  settings: ContactFormSettings;
  pageSlug: string;
}) {
  const [senderName, setSenderName] = React.useState("");
  const [senderEmail, setSenderEmail] = React.useState("");
  const [subject, setSubject] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [acceptedCgu, setAcceptedCgu] = React.useState(false);
  const [attachment, setAttachment] = React.useState<File | null>(null);
  const [gotcha, setGotcha] = React.useState("");
  const [turnstileToken, setTurnstileToken] = React.useState("");
  const [status, setStatus] = React.useState<FormStatus>("idle");
  const [error, setError] = React.useState("");

  // Identifiants uniques par instance : deux formulaires peuvent cohabiter sur
  // une même page (la démonstration en monte deux), et des `id` dupliqués
  // casseraient le lien `label`/`for` — donc l'accessibilité.
  const uid = React.useId().replace(/:/g, "");
  const fieldId = (name: string) => `contact-${name}-${uid}`;

  const accept = settings.allowedExtensions
    .map((extension) => `.${extension}`)
    .join(",");
  const maxMo = settings.maxFileSizeMB;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (settings.requireCGU && !acceptedCgu) {
      setStatus("error");
      setError("Merci d’accepter la politique de confidentialité pour envoyer.");
      return;
    }

    if (attachment) {
      const rejection = contactAttachmentRejection(
        { name: attachment.name, size: attachment.size },
        settings
      );
      if (rejection) {
        setStatus("error");
        setError(REJECTION_MESSAGE[rejection]);
        return;
      }
    }

    setStatus("submitting");

    const body = new FormData();
    body.set("senderName", senderName);
    body.set("senderEmail", senderEmail);
    body.set("subject", subject);
    body.set("message", message);
    body.set("acceptedCgu", acceptedCgu ? "true" : "false");
    body.set("pageSlug", pageSlug);
    body.set("_gotcha", gotcha);
    if (turnstileToken !== "") {
      body.set("turnstileToken", turnstileToken);
    }
    if (attachment) {
      body.set("attachment", attachment);
    }

    try {
      const response = await fetch("/api/contact", { method: "POST", body });
      const payload: unknown = await response.json().catch(() => null);
      const ok =
        response.ok &&
        typeof payload === "object" &&
        payload !== null &&
        "ok" in payload &&
        (payload as { ok?: unknown }).ok === true;

      if (!ok) {
        setStatus("error");
        const serverMessage =
          typeof payload === "object" &&
          payload !== null &&
          "error" in payload &&
          typeof (payload as { error?: unknown }).error === "string"
            ? (payload as { error: string }).error
            : GENERIC_ERROR;
        setError(serverMessage);
        return;
      }

      setStatus("success");
      setSenderName("");
      setSenderEmail("");
      setSubject("");
      setMessage("");
      setAcceptedCgu(false);
      setAttachment(null);
      setGotcha("");
      setTurnstileToken("");
    } catch {
      setStatus("error");
      setError(GENERIC_ERROR);
    }
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      <div className="contact-form__row">
        <div className="contact-form__field">
          <Label htmlFor={fieldId("name")}>Nom</Label>
          <Input
            id={fieldId("name")}
            name="senderName"
            value={senderName}
            autoComplete="name"
            required
            onChange={(event) => setSenderName(event.target.value)}
          />
        </div>
        <div className="contact-form__field">
          <Label htmlFor={fieldId("email")}>E-mail</Label>
          <Input
            id={fieldId("email")}
            name="senderEmail"
            type="email"
            value={senderEmail}
            autoComplete="email"
            required
            onChange={(event) => setSenderEmail(event.target.value)}
          />
        </div>
      </div>

      <div className="contact-form__field">
        <Label htmlFor={fieldId("subject")}>Sujet (facultatif)</Label>
        <Input
          id={fieldId("subject")}
          name="subject"
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
        />
      </div>

      <div className="contact-form__field contact-form__field--message">
        <Label htmlFor={fieldId("message")}>Message</Label>
        <Textarea
          id={fieldId("message")}
          name="message"
          rows={6}
          value={message}
          required
          onChange={(event) => setMessage(event.target.value)}
        />
      </div>

      <div className="contact-form__field">
        <Label htmlFor={fieldId("attachment")}>
          Pièce jointe (facultative)
        </Label>
        <input
          id={fieldId("attachment")}
          name="attachment"
          type="file"
          accept={accept}
          className="contact-form__file"
          onChange={(event) => setAttachment(event.target.files?.[0] ?? null)}
        />
        <p className="contact-form__hint">
          {settings.allowedExtensions.join(", ")} — {maxMo} Mo maximum.
        </p>
      </div>

      <div className="contact-form__consent">
        <input
          id={fieldId("cgu")}
          name="acceptedCgu"
          type="checkbox"
          checked={acceptedCgu}
          required={settings.requireCGU}
          onChange={(event) => setAcceptedCgu(event.target.checked)}
        />
        <Label htmlFor={fieldId("cgu")}>
          J’accepte la{" "}
          <a href={settings.cguLinkUrl || "/confidentialite"}>
            {settings.cguLinkText || "politique de confidentialité"}
          </a>
          .
        </Label>
      </div>

      {/* Champ piège — masqué à l'œil, jamais `display: none`. */}
      <div className="contact-form__gotcha" aria-hidden="true">
        <label htmlFor={fieldId("gotcha")}>Ne pas remplir</label>
        <input
          id={fieldId("gotcha")}
          name="_gotcha"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={gotcha}
          onChange={(event) => setGotcha(event.target.value)}
        />
      </div>

      {TURNSTILE_SITE_KEY !== "" ? (
        <TurnstileWidget siteKey={TURNSTILE_SITE_KEY} onToken={setTurnstileToken} />
      ) : null}

      <Button type="submit" disabled={status === "submitting"}>
        {status === "submitting" ? "Envoi…" : "Envoyer"}
      </Button>

      {status === "success" ? (
        <p role="status" aria-live="polite" className="contact-form__success">
          Merci, votre message a bien été envoyé.
        </p>
      ) : null}
      {status === "error" && error !== "" ? (
        <p role="alert" className="contact-form__error">
          {error}
        </p>
      ) : null}
    </form>
  );
}
