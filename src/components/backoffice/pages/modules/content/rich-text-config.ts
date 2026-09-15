import TextAlign from "@tiptap/extension-text-align";
import StarterKit from "@tiptap/starter-kit";

/**
 * ============================================================================
 * CONFIGURATION UNIQUE DE L'ÉDITEUR RICHE (Étape 12.1, lot G)
 * ----------------------------------------------------------------------------
 * **Une seule déclaration des fonctionnalités autorisées**, consommée par la
 * barre d'outils et par l'éditeur. Ajouter le souligné demain, c'est une ligne
 * ici — impossible de désynchroniser l'édition de ce qui est proposé.
 *
 * Choix de périmètre, tous délibérés :
 *
 *   - **Titres limités à H2, H3 et H4.** Le `<h1>` appartient au Héro (même
 *     contrainte que le bandeau CTA, étape 11.27). L'utilisateur, lui, ne voit
 *     jamais « H2 » : il voit « Titre », « Sous-titre », « Petit titre ».
 *   - **Aucun code, aucun bloc de code, aucun trait horizontal**, retirés du
 *     StarterKit : ils ne font pas partie du besoin et n'apparaissent pas dans
 *     la barre. Le rendu public sait malgré tout les afficher (tolérance de
 *     lecture pour un contenu écrit plus tard), mais l'éditeur ne les produit
 *     pas.
 *   - **Aucun style libre** : ni couleur, ni police, ni taille de police. La
 *     mise en forme vient des jetons du thème ; c'est ce qui garantit les
 *     contrastes et l'identité visuelle.
 *
 * ⚠️ **Vérifié sur `StarterKit` v3** : le kit inclut *déjà* `bold`, `italic`,
 * `underline`, `link`, `heading`, `bulletList`, `orderedList`, `blockquote`,
 * `strike`, `hardBreak` et `undoRedo`. On les **configure** donc via
 * `StarterKit.configure()` — les réimporter séparément provoquerait un
 * avertissement d'extension dupliquée.
 * ============================================================================
 */

/**
 * Classe de la portée de styles du contenu.
 *
 * Définie dans [`globals.css`](../../../../app/globals.css) et posée **aussi
 * bien** sur le `contentEditable` de l'éditeur que sur le rendu public : c'est
 * la condition du WYSIWYG, l'aperçu et le site publié ne pouvant pas diverger.
 */
export const RICH_TEXT_CONTENT_CLASS = "rich-content";

/** Libellé et attributs de l'extension Link, partagés éditeur / rendu. */
const LINK_OPTIONS = {
  /** Le clic dans l'éditeur ne navigue pas : on édite, on ne navigue pas. */
  openOnClick: false,
  /** Une URL tapée devient un lien automatiquement (confort « traitement de texte »). */
  autolink: true,
  defaultProtocol: "https" as const,
  HTMLAttributes: {
    rel: "noopener noreferrer",
  },
};

/**
 * Crée la liste des extensions autorisées.
 * Fonction (et non constante) : `configure()` retourne un objet à état, qu'il ne
 * faut pas partager entre deux éditeurs montés simultanément (un par bloc texte).
 */
export function createRichTextExtensions() {
  return [
    StarterKit.configure({
      heading: { levels: [2, 3, 4] },
      link: LINK_OPTIONS,
      // Hors périmètre : retirés du kit pour que ni la barre d'outils ni les
      // raccourcis ne puissent les produire.
      code: false,
      codeBlock: false,
      horizontalRule: false,
      strike: false,
    }),
    TextAlign.configure({
      types: ["heading", "paragraph"],
      alignments: ["left", "center", "right", "justify"],
      defaultAlignment: "left",
    }),
  ];
}

/** Alignement tel que stocké dans le document. */
export type RichTextAlignment = "left" | "center" | "right" | "justify";

/**
 * Styles de texte proposés — **vocabulaire de traitement de texte**, jamais
 * `H2` / `H3` / `H4` (principe P4 : zéro jargon).
 */
export const RICH_TEXT_STYLE_OPTIONS = [
  { value: "paragraph", label: "Texte normal" },
  { value: "h2", label: "Titre" },
  { value: "h3", label: "Sous-titre" },
  { value: "h4", label: "Petit titre" },
] as const;

/** Valeur de style de bloc (`paragraph` ou un niveau de titre). */
export type RichTextStyleValue =
  (typeof RICH_TEXT_STYLE_OPTIONS)[number]["value"];

/** Alignements proposés, avec leur libellé accessible. */
export const RICH_TEXT_ALIGNMENTS: ReadonlyArray<{
  value: RichTextAlignment;
  label: string;
}> = [
  { value: "left", label: "Aligner à gauche" },
  { value: "center", label: "Centrer" },
  { value: "right", label: "Aligner à droite" },
  { value: "justify", label: "Justifier" },
];

/**
 * Raccourcis clavier actifs **sans code supplémentaire** (fournis par
 * StarterKit, exactement ceux d'un traitement de texte) :
 *
 *   Ctrl/Cmd + B → gras · Ctrl/Cmd + I → italique · Ctrl/Cmd + U → souligné
 *   Ctrl/Cmd + Z → annuler · Ctrl/Cmd + Maj + Z → rétablir
 *   Ctrl/Cmd + Alt + 0 → texte normal · + 2 / 3 / 4 → titre / sous-titre / petit titre
 *
 * Ils sont documentés ici pour être affichés dans les info-bulles de la barre.
 */
export const RICH_TEXT_SHORTCUTS = {
  bold: "Ctrl+B",
  italic: "Ctrl+I",
  underline: "Ctrl+U",
  link: "Ctrl+K",
} as const;
