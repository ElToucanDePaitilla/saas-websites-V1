"use client";

import * as React from "react";

/**
 * ============================================================================
 * MODULE « PROFIL » (site_owner_profile) — source de vérité du propriétaire
 * ----------------------------------------------------------------------------
 * TypeScript strict (zéro `any`), zéro dépendance UI. Porte :
 *   - le type `OwnerProfile` (miroir du schéma Zod de persistance) ;
 *   - les valeurs par défaut + constantes de Select ;
 *   - un **store partagé au niveau module** (même pattern que la Navigation,
 *     Étape 4.5) consommé côté client via `useOwnerProfile()` ;
 *   - `getAIContextPrompt(profile)` : contexte rédactionnel pour les assistants IA.
 *
 * Persistance réelle : colonnes BDD `site_owner_profile` (extension future si
 * Supabase configuré). En mode démo (défaut), l'état vit en mémoire (session).
 * ============================================================================
 */

export type GrammaticalPerson = "vouvoyer" | "tutoyer";
export type CommunicationStyle = "formal" | "warm" | "creative" | "dynamic";

/** Réseaux sociaux (URL libres). */
export interface SocialLinks {
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  youtube?: string;
  tiktok?: string;
  x?: string;
}

/** Profil complet du propriétaire / de la marque. */
export interface OwnerProfile {
  // --- Identité & visuels ---
  ownerName: string;
  brandName: string;
  logoUrl: string;
  faviconUrl: string;
  businessSummary: string;
  businessSector: string;
  serviceArea: string;
  keywords: string;
  // --- Contacts & adresses ---
  address: string;
  showAddress: boolean;
  publicEmail: string;
  showEmail: boolean;
  contactFormEmail: string;
  sameAsPublicEmail: boolean;
  socialLinks: SocialLinks;
  // --- Légal & ligne éditoriale (IA) ---
  legalStatus: string;
  siret: string;
  vatNumber: string;
  publicationDirector: string;
  grammaticalPerson: GrammaticalPerson;
  communicationStyle: CommunicationStyle;
  targetAudience: string;
  /** Documents complémentaires (Bio, CV, actualités…) analysés par l'IA. */
  documents: string[];
}

/** Valeurs par défaut du profil (mode démo / premier chargement). */
export const DEFAULT_OWNER_PROFILE: OwnerProfile = {
  ownerName: "",
  brandName: "",
  logoUrl: "",
  faviconUrl: "",
  businessSummary: "",
  businessSector: "Photographie",
  serviceArea: "",
  keywords: "",
  address: "",
  showAddress: true,
  publicEmail: "",
  showEmail: true,
  contactFormEmail: "",
  sameAsPublicEmail: true,
  socialLinks: {},
  legalStatus: "Auto-entrepreneur",
  siret: "",
  vatNumber: "",
  publicationDirector: "",
  grammaticalPerson: "vouvoyer",
  communicationStyle: "warm",
  targetAudience: "",
  documents: [],
};

/** Ordre + libellés de la personne grammaticale. */
export const grammaticalPersonOrder: GrammaticalPerson[] = [
  "vouvoyer",
  "tutoyer",
];
export const grammaticalPersonLabels: Record<GrammaticalPerson, string> = {
  vouvoyer: "Vouvoiement (« Vous »)",
  tutoyer: "Tutoiement (« Tu »)",
};

/** Ordre + libellés du style de communication. */
export const communicationStyleOrder: CommunicationStyle[] = [
  "formal",
  "warm",
  "creative",
  "dynamic",
];
export const communicationStyleLabels: Record<CommunicationStyle, string> = {
  formal: "Professionnel & formel",
  warm: "Chaleureux & accessible",
  creative: "Créatif & premium",
  dynamic: "Dynamique & moderne",
};

/**
 * Contexte rédactionnel IA : chaîne formatée (activité + persona + ton) à
 * injecter dans les prompts des assistants (rédaction, SEO, prospection…).
 */
export function getAIContextPrompt(profile: OwnerProfile): string {
  const lines = [
    profile.ownerName ? `Propriétaire : ${profile.ownerName}` : "",
    profile.brandName ? `Marque : ${profile.brandName}` : "",
    profile.businessSector
      ? `Secteur d'activité : ${profile.businessSector}`
      : "",
    profile.businessSummary
      ? `Résumé de l'activité : ${profile.businessSummary}`
      : "",
    profile.serviceArea ? `Zone d'intervention : ${profile.serviceArea}` : "",
    profile.targetAudience
      ? `Client idéal (persona) : ${profile.targetAudience}`
      : "",
    `Personne grammaticale : ${
      profile.grammaticalPerson === "tutoyer" ? "tutoiement" : "vouvoiement"
    }`,
    `Style de communication : ${
      communicationStyleLabels[profile.communicationStyle]
    }`,
    profile.keywords
      ? `Mots-clés : ${profile.keywords}`
      : "",
  ].filter(Boolean);
  return lines.length > 0 ? lines.join("\n") : "";
}

/** État partagé du module. */
export type OwnerProfileSnapshot = { profile: OwnerProfile };

let snapshot: OwnerProfileSnapshot = { profile: DEFAULT_OWNER_PROFILE };
const listeners = new Set<() => void>();

/** Applique une mutation au profil partagé puis notifie les abonnés. */
export function setOwnerProfile(
  updater: (previous: OwnerProfile) => OwnerProfile
): void {
  snapshot = { profile: updater(snapshot.profile) };
  for (const listener of listeners) {
    listener();
  }
}

/**
 * Hydrate le store avec un profil chargé côté serveur (Étape 8.2) : remplace le
 * snapshot en une seule fois et notifie les abonnés (Header/Footer, écran
 * `/admin/profile`). Appelé une fois par session par `OwnerProfileProvider`.
 */
export function hydrateOwnerProfile(profile: OwnerProfile): void {
  snapshot = { profile: { ...DEFAULT_OWNER_PROFILE, ...profile } };
  for (const listener of listeners) {
    listener();
  }
}

export function getOwnerProfileSnapshot(): OwnerProfileSnapshot {
  return snapshot;
}

/**
 * Snapshot « serveur » pour `useSyncExternalStore` : requis par React pour tout
 * rendu SSR d'un Client Component (Header/Footer montés dans le layout serveur
 * front-office). Retourne l'état par défaut — stable et déterministe côté
 * serveur (les mutations de session n'existent que côté client).
 */
export function getOwnerProfileServerSnapshot(): OwnerProfileSnapshot {
  return snapshot;
}

/** Abonnement au store (utilisé par `useSyncExternalStore`). */
export function subscribeOwnerProfile(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Hook client : expose le profil courant et une action `update(patch)`.
 * Utilisé par le Dashboard (`/admin/profile`) et les composants du Builder
 * (Header, Footer…) pour consommer la source de vérité.
 */
export function useOwnerProfile(): {
  profile: OwnerProfile;
  update: (patch: Partial<OwnerProfile>) => void;
} {
  const current = React.useSyncExternalStore(
    subscribeOwnerProfile,
    getOwnerProfileSnapshot,
    getOwnerProfileServerSnapshot
  );
  const update = React.useCallback((patch: Partial<OwnerProfile>) => {
    setOwnerProfile((previous) => ({ ...previous, ...patch }));
  }, []);
  return { profile: current.profile, update };
}
