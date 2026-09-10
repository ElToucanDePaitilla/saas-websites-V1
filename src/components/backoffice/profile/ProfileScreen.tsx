"use client";

import * as React from "react";

import { MediaUploadButton } from "@/components/backoffice/media/MediaUploadButton";
import { persistOwnerProfile } from "@/lib/persistence-client";
import { Switch } from "@/components/ui/switch";
import {
  communicationStyleLabels,
  communicationStyleOrder,
  grammaticalPersonLabels,
  grammaticalPersonOrder,
  useOwnerProfile,
  type CommunicationStyle,
  type GrammaticalPerson,
  type SocialLinks,
} from "@/lib/owner-profile";
import { ProfileSecuritySchema } from "@/lib/schemas/persistence";
import { cn } from "@/lib/utils";

import { HelpTip, SelectField, TextAreaField, TextField } from "../pages/modules/form-fields";

/** Titre d'une rubrique (4 sections du module Profil). */
function RubricTitle({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="grid gap-1">
      <h5 className="text-[13px] font-semibold text-foreground">{title}</h5>
      <p className="text-xs leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

/** Rangée « toggle + libellé » pour les champs à visibilité. */
function ToggleRow({
  id,
  label,
  tip,
  checked,
  onCheckedChange,
}: {
  id: string;
  label: string;
  tip: string;
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/60 p-3">
      <label
        htmlFor={id}
        className="flex items-center gap-2 text-xs font-semibold text-foreground"
      >
        {label}
        <HelpTip tip={tip} />
      </label>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
      />
    </div>
  );
}

const SOCIAL_FIELDS: Array<{ key: keyof SocialLinks; label: string }> = [
  { key: "instagram", label: "Instagram" },
  { key: "facebook", label: "Facebook" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "youtube", label: "YouTube" },
  { key: "tiktok", label: "TikTok" },
  { key: "x", label: "X (Twitter)" },
];

export function ProfileScreen() {
  const { profile, update } = useOwnerProfile();
  const [savedAt, setSavedAt] = React.useState<string | null>(null);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  // État du formulaire « Sécurité ».
  const [security, setSecurity] = React.useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    revokeOtherSessions: true,
  });
  const [securityError, setSecurityError] = React.useState<string | null>(null);
  const [securityOk, setSecurityOk] = React.useState<string | null>(null);

  // Documents complémentaires (multi-upload local — analyse IA ultérieure).
  const documentsInputRef = React.useRef<HTMLInputElement>(null);
  function handleAddDocuments(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) {
      return;
    }
    const names = files.map((file) => file.name);
    update({
      documents: Array.from(new Set([...profile.documents, ...names])),
    });
    if (documentsInputRef.current) {
      documentsInputRef.current.value = "";
    }
  }
  function removeDocument(name: string) {
    update({ documents: profile.documents.filter((doc) => doc !== name) });
  }

  function setSocial(key: keyof SocialLinks, value: string) {
    update({ socialLinks: { ...profile.socialLinks, [key]: value || undefined } });
  }

  /** Enregistre durablement (upsert BDD via PUT /api/profile). */
  async function save() {
    setSaving(true);
    setSaveError(null);
    try {
      // Le Provider persiste déjà en continu (débounce 400 ms) ; ce bouton
      // force un flush immédiat et retourne un état visible à l'utilisateur.
      await persistOwnerProfile(profile);
      setSavedAt(new Date().toLocaleTimeString("fr-FR"));
    } catch {
      // BDD indisponible / erreur API : fallback mémoire explicite (les emails
      // sont désormais en texte libre — plus de blocage par validation).
      setSavedAt(null);
      setSaveError(
        "Enregistrement impossible (base de données indisponible ou erreur " +
          "serveur). Le profil est conservé en mémoire pour cette session."
      );
    } finally {
      setSaving(false);
    }
  }

  function handleSecuritySubmit(event: React.FormEvent) {
    event.preventDefault();
    setSecurityError(null);
    setSecurityOk(null);
    const result = ProfileSecuritySchema.safeParse(security);
    if (!result.success) {
      const message = result.error.issues[0]?.message ?? "Vérifiez les champs.";
      setSecurityError(message);
      return;
    }
    // Endpoint réel (Supabase) dans une étape dédiée — MVP : alerte simulée.
    // TODO 8.1-sécurité : POST /api/profile/password puis email d'alerte.
    setSecurityOk(
      "Mot de passe mis à jour (démo). Un email d'alerte serait envoyé — connexion Supabase à configurer."
    );
    setSecurity({ currentPassword: "", newPassword: "", confirmPassword: "", revokeOtherSessions: true });
  }

  return (
    <div className="grid gap-6">
      {/* ---- En-tête ---- */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Profil
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Source de vérité de votre marque : injection automatique dans le
            Builder, mentions légales et contexte IA.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            void save();
          }}
          disabled={saving}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/85 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
      {savedAt ? (
        <p role="status" className="text-xs text-emerald-600">
          Profil enregistré dans la base de données à {savedAt}.
        </p>
      ) : null}
      {saveError ? (
        <p role="alert" className="text-xs text-destructive">
          {saveError}
        </p>
      ) : null}

      {/* ============ 1 — 🏢 Identité, Marque & Visuels ============ */}
      <section className="grid gap-3 rounded-lg border border-border bg-card p-4">
        <RubricTitle
          title="🏢 Identité, Marque & Visuels"
          description="Ces informations définissent l’image de votre marque et alimentent l’en-tête de votre site."
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField
            label="Prénom & Nom du propriétaire"
            value={profile.ownerName}
            tip="Usage interne et IA (ex. « Marie Dupont »)."
            onChange={(ownerName) => update({ ownerName })}
          />
          <TextField
            label="Nom de société / marque / artiste"
            value={profile.brandName}
            tip="S’affiche par défaut en haut à gauche de la barre de navigation."
            onChange={(brandName) => update({ brandName })}
          />
          <div className="grid gap-2 sm:col-span-2">
            <p className="text-xs font-semibold text-foreground">Logo principal</p>
            <div className="flex items-center gap-3">
              {profile.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.logoUrl}
                  alt="Logo"
                  className="h-12 w-12 rounded-md border border-border object-contain"
                />
              ) : null}
              <MediaUploadButton
                label="Uploader le logo (SVG/PNG transparent)"
                onUploaded={(url) => update({ logoUrl: url })}
              />
            </div>
          </div>
          <TextField
            label="Icône d’onglet (favicon 32×32)"
            value={profile.faviconUrl}
            tip="URL d’une icône carrée pour l’onglet du navigateur."
            onChange={(faviconUrl) => update({ faviconUrl })}
          />
          <TextAreaField
            label="Résumé de l’activité"
            value={profile.businessSummary}
            rows={3}
            tip="2-3 phrases exploitées par l’IA et les balises Meta SEO."
            onChange={(businessSummary) => update({ businessSummary })}
          />
          <TextField
            label="Secteur d’activité"
            value={profile.businessSector}
            placeholder="Photographie"
            onChange={(businessSector) => update({ businessSector })}
          />
          <TextField
            label="Zone d’intervention"
            value={profile.serviceArea}
            placeholder="Lyon et métropole"
            onChange={(serviceArea) => update({ serviceArea })}
          />
          <TextField
            label="Mots-clés principaux"
            value={profile.keywords}
            placeholder="mariage, portrait, corporate"
            tip="Séparés par des virgules."
            onChange={(keywords) => update({ keywords })}
          />
        </div>
      </section>

      {/* ============ 2 — 📍 Contacts & Adresses ============ */}
      <section className="grid gap-3 rounded-lg border border-border bg-card p-4">
        <RubricTitle
          title="📍 Contacts & Adresses"
          description="Gérez la visibilité de vos coordonnées publiques et la réception de vos messages."
        />
        <TextField
          label="Adresse professionnelle"
          value={profile.address}
          onChange={(address) => update({ address })}
        />
        <ToggleRow
          id="profile-show-address"
          label="Afficher l’adresse sur le site"
          tip="Affiche ou masque votre adresse professionnelle publiquement."
          checked={profile.showAddress}
          onCheckedChange={(showAddress) => update({ showAddress })}
        />
        <TextField
          label="Email de contact"
          value={profile.publicEmail}
          type="email"
          onChange={(publicEmail) => update({ publicEmail })}
        />
        <ToggleRow
          id="profile-show-email"
          label="Afficher l’email sur le site"
          tip="Affiche ou masque votre email de contact publiquement."
          checked={profile.showEmail}
          onCheckedChange={(showEmail) => update({ showEmail })}
        />
        <ToggleRow
          id="profile-same-email"
          label="Utiliser l’email pour recevoir les formulaires"
          tip="Si coché, le champ « email de réception des formulaires » est masqué et synchronisé sur l’email de contact."
          checked={profile.sameAsPublicEmail}
          onCheckedChange={(sameAsPublicEmail) => update({ sameAsPublicEmail })}
        />
        {!profile.sameAsPublicEmail ? (
          <TextField
            label="Email de réception des formulaires"
            value={profile.contactFormEmail}
            type="email"
            onChange={(contactFormEmail) => update({ contactFormEmail })}
          />
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          {SOCIAL_FIELDS.map((field) => (
            <TextField
              key={field.key}
              label={field.label}
              value={profile.socialLinks[field.key] ?? ""}
              placeholder="https://…"
              onChange={(value) => setSocial(field.key, value)}
            />
          ))}
        </div>
      </section>

      {/* ============ 3 — ⚖️ Légal & Ligne Éditoriale (IA) ============ */}
      <section className="grid gap-3 rounded-lg border border-border bg-card p-4">
        <RubricTitle
          title="⚖️ Légal & Ligne Éditoriale (IA)"
          description="Automatisez vos mentions légales et calibrez le style des textes générés par l’IA."
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField
            label="Forme juridique"
            value={profile.legalStatus}
            onChange={(legalStatus) => update({ legalStatus })}
          />
          <TextField
            label="SIRET / SIREN"
            value={profile.siret}
            onChange={(siret) => update({ siret })}
          />
          <TextField
            label="TVA intracommunautaire"
            value={profile.vatNumber}
            onChange={(vatNumber) => update({ vatNumber })}
          />
          <TextField
            label="Directeur de la publication"
            value={profile.publicationDirector}
            onChange={(publicationDirector) => update({ publicationDirector })}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <SelectField
            label="Personne grammaticale (IA)"
            value={profile.grammaticalPerson}
            options={grammaticalPersonOrder.map((value) => ({
              value,
              label: grammaticalPersonLabels[value],
            }))}
            onChange={(grammaticalPerson) =>
              update({ grammaticalPerson: grammaticalPerson as GrammaticalPerson })
            }
          />
          <SelectField
            label="Style de communication (IA)"
            value={profile.communicationStyle}
            options={communicationStyleOrder.map((value) => ({
              value,
              label: communicationStyleLabels[value],
            }))}
            onChange={(communicationStyle) =>
              update({ communicationStyle: communicationStyle as CommunicationStyle })
            }
          />
        </div>
        <TextAreaField
          label="Client idéal / Persona"
          value={profile.targetAudience}
          rows={2}
          tip="Décrivez votre client idéal (ex. « futures mariées de la région », « PME recherchant un photographe corporate ») : ce persona calibre les textes générés par l’IA."
          onChange={(targetAudience) => update({ targetAudience })}
        />
        {/* Téléchargements d’informations complémentaires (analysées par l’IA). */}
        <div className="grid gap-2">
          <span className="flex items-center gap-2 text-xs font-semibold text-foreground">
            Téléchargements d’informations complémentaires (Bio, CV, actualités…)
            <HelpTip tip="Formats : .doc, .pdf, .docx, .jpg, etc. Ces documents seront analysés plus tard par l’assistant IA." />
          </span>
          <input
            ref={documentsInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,image/*"
            className="hidden"
            onChange={handleAddDocuments}
          />
          <button
            type="button"
            onClick={() => documentsInputRef.current?.click()}
            className="justify-self-start rounded-md border border-input bg-background px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Choisir des fichiers à joindre
          </button>
          {profile.documents.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {profile.documents.map((doc) => (
                <li
                  key={doc}
                  className="flex items-center gap-2 rounded-md bg-muted px-2 py-1 text-xs text-foreground"
                >
                  {doc}
                  <button
                    type="button"
                    aria-label={`Retirer ${doc}`}
                    onClick={() => removeDocument(doc)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </section>

      {/* ============ 4 — 🔒 Sécurité ============ */}
      <section className="grid gap-3 rounded-lg border border-border bg-card p-4">
        <RubricTitle
          title="🔒 Sécurité & Mot de passe"
          description="Sécurisez l’accès à votre espace d’administration."
        />
        <form className="grid gap-3" onSubmit={handleSecuritySubmit}>
          <TextField
            label="Mot de passe actuel"
            value={security.currentPassword}
            type="password"
            tip="Obligatoire — protège contre les intrusions sur session restée ouverte."
            onChange={(currentPassword) =>
              setSecurity((s) => ({ ...s, currentPassword }))
            }
          />
          <TextField
            label="Nouveau mot de passe"
            value={security.newPassword}
            type="password"
            tip="8 caractères min, avec majuscule, chiffre et symbole."
            onChange={(newPassword) => setSecurity((s) => ({ ...s, newPassword }))}
          />
          <TextField
            label="Confirmer le nouveau mot de passe"
            value={security.confirmPassword}
            type="password"
            onChange={(confirmPassword) =>
              setSecurity((s) => ({ ...s, confirmPassword }))
            }
          />
          <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/60 p-3">
            <label
              htmlFor="profile-revoke-sessions"
              className="flex items-center gap-2 text-xs font-semibold text-foreground"
            >
              Déconnecter toutes les autres sessions ouvertes
            </label>
            <Switch
              id="profile-revoke-sessions"
              checked={security.revokeOtherSessions}
              onCheckedChange={(revokeOtherSessions) =>
                setSecurity((s) => ({ ...s, revokeOtherSessions }))
              }
            />
          </div>
          {securityError ? (
            <p role="alert" className="text-xs text-destructive">
              {securityError}
            </p>
          ) : null}
          {securityOk ? (
            <p role="status" className="text-xs text-emerald-600">
              {securityOk}
            </p>
          ) : null}
          <button
            type="submit"
            className={cn(
              "justify-self-start rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/85"
            )}
          >
            Modifier le mot de passe
          </button>
        </form>
      </section>
    </div>
  );
}
