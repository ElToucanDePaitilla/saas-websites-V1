/**
 * ============================================================================
 * ÉCHELLE TYPOGRAPHIQUE DES ÉDITEURS DE MODULES — source unique (Étape 11.21)
 * ----------------------------------------------------------------------------
 * Constat de recette : « il est difficile de distinguer les titres des
 * sous-titres et des libellés » — et le constat était **exact**, mesuré dans le
 * code avant cette étape :
 *
 *   AVANT (relevé réel)
 *     valeur saisie / placeholder .... 16 px (mobile) / 14 px (bureau)
 *     titre de zone .................. 13 px / 600
 *     sous-titre de sous-zone ........ 12 px / 500  ← identique au libellé
 *     libellé de champ ............... 12 px / 500  ← identique au sous-titre
 *     aide ........................... 12 px / 400
 *
 *   ⇒ quatre rôles partageaient 12 px, et le **titre était plus petit que le
 *     texte saisi** : la hiérarchie était inversée.
 *
 * APRÈS — une seule échelle, où **chaque niveau se distingue par au moins deux
 * critères** (taille, graisse, couleur) : un écart d'un seul pixel ne se perçoit
 * pas, alors qu'un écart de graisse **et** de couleur se lit sans mesurer.
 *
 *   N0  nom du module (accordéon) ... 15 px / 600   (déjà en place, ModuleRow)
 *   N1  titre de zone ............... 14 px / 600   + barre d'accent colorée
 *   N2  portée de la zone ........... 12 px / 400   gris
 *   N3  sous-titre de sous-zone ..... 13 px / 600   + pastille colorée
 *   N4  libellé de champ ............ 12 px / 600   plein
 *   N5  aide / explication .......... 11 px / 400   gris
 *   ML  micro-libellé (compteur) .... 11 px / 500   capitales espacées, gris
 *   C   contenu saisi ............... 14 px (16 px sur mobile) — INCHANGÉ
 *
 * **Cette échelle n'est pas une invention** : N0 = 15 px / 600 et le second
 * niveau de l'accordéon = 13 px sont **déjà** les valeurs de [`ModuleRow`]. Le
 * formulaire s'en écartait ; il s'y aligne. Un nouvel éditeur ne choisit plus
 * ses tailles : il prend un **niveau**.
 *
 * Deux décisions assumées :
 *   - **C reste à 16 px sur mobile.** En dessous de 16 px, iOS zoome la page dès
 *     qu'un champ reçoit le focus : ce serait un défaut pire que l'inversion
 *     corrigée. C'est la seule exception, et elle ne touche que le *contenu* ;
 *   - **ML est hors échelle** : il ne nomme pas un niveau de structure mais une
 *     **annotation** (compteur d'albums, en-tête de tableau, groupe de menus).
 *     Ses capitales le distinguent de N5 sans ambiguïté.
 * ============================================================================
 */

/** Échelle typographique des éditeurs — consommer un niveau, jamais une taille. */
export const EDITOR_TYPE = {
  /** N1 — titre de zone : le plus haut niveau **dans** le formulaire. */
  zoneTitle: "text-sm font-semibold leading-snug text-foreground",
  /** N2 — phrase de portée, sous le titre de zone. */
  zoneScope: "text-xs leading-relaxed text-muted-foreground",
  /** N3 — titre de sous-zone (sous-bloc). */
  subTitle: "text-[13px] font-semibold leading-snug text-foreground",
  /** N4 — libellé de champ. */
  fieldLabel: "text-xs font-semibold leading-snug text-foreground",
  /** N5 — aide, description, explication sous un champ. */
  hint: "text-[11px] leading-snug text-muted-foreground",
  /**
   * ML — micro-libellé d'annotation (compteur, en-tête de tableau, groupe de
   * navigation). Hors échelle : capitales pour ne pas se confondre avec N5.
   * Réservé aux étiquettes **courtes** (deux ou trois mots).
   */
  microLabel:
    "text-[11px] font-medium uppercase tracking-wider text-muted-foreground",
  /**
   * ML-b — même niveau que `microLabel`, mais **sans capitales** : pour une
   * annotation rédigée en **phrase** (« Nombre d'albums actuellement créés : 3 »),
   * qu'un affichage en capitales espacées rendrait pénible à lire. Se distingue
   * de N5 (`hint`) par la graisse (500 contre 400).
   */
  annotation: "text-[11px] font-medium leading-snug text-muted-foreground",
} as const;

/**
 * Indentation d'un niveau. La **taille** est un signal fragile (zoom, fatigue
 * visuelle, rendu) ; la **géométrie** ne l'est pas — un bloc décalé se lit comme
 * imbriqué sans qu'on ait à comparer quoi que ce soit. Second marqueur de la
 * hiérarchie, en plus de l'échelle typographique.
 */
export const EDITOR_INDENT = {
  /** Contenu d'une zone : décale les sous-zones et les champs d'un cran. */
  zoneContent: "pl-3",
  /** Contenu d'une sous-zone : décale ses champs d'un cran de plus. */
  subZoneContent: "pl-3",
} as const;
