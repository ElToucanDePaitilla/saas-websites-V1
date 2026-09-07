/**
 * ============================================================================
 * CONSTANTES BDD PARTAGÉES — tenant de démonstration (Étapes 5.1 → 5.2)
 * ----------------------------------------------------------------------------
 * Id et identité du profil « photographe de démo » utilisé par le seed et par
 * les repositories (multi-tenancy futur : chaque requête cible un
 * `photographer_id`). Un seul tenant en mode démo.
 * ============================================================================
 */

/** Id stable du profil « tenant de démo » (jamais l'utilisateur réel). */
export const DEMO_PROFILE_ID = "00000000-0000-0000-0000-000000000001";

/** Email du profil de démonstration. */
export const DEMO_EMAIL = "demo@exemple.fr";

/** Nom d'affichage du profil de démonstration. */
export const DEMO_DISPLAY_NAME = "Photographe Démo";
