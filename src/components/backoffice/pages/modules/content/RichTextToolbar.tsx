"use client";

import * as React from "react";
import type { Editor } from "@tiptap/react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  Link2,
  List,
  ListOrdered,
  Underline,
  Unlink,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { EDITOR_TYPE } from "../editor-type";
import {
  RICH_TEXT_ALIGNMENTS,
  RICH_TEXT_SHORTCUTS,
  RICH_TEXT_STYLE_OPTIONS,
  type RichTextAlignment,
  type RichTextStyleValue,
} from "./rich-text-config";

/**
 * ============================================================================
 * BARRE D'OUTILS DU TEXTE RICHE (Étape 12.1, lot I)
 * ----------------------------------------------------------------------------
 * C'est la barre qui donne le « ressenti traitement de texte » : styles de bloc,
 * gras, italique, souligné, listes, alignements et lien.
 *
 * **Vocabulaire** : l'utilisateur ne voit jamais « H2 » ni « bloc » — il voit
 * « Texte normal », « Titre », « Sous-titre », « Petit titre » (P4, zéro
 * jargon). C'est exactement la liste déroulante de styles de Word.
 *
 * **Accessibilité** :
 *   - `role="toolbar"` + `aria-label` français sur le conteneur ;
 *   - `aria-pressed` sur chaque bascule, `aria-label` sur chaque bouton (jamais
 *     d'icône seule sans nom) ;
 *   - le raccourci clavier est rappelé dans l'info-bulle ;
 *   - `onMouseDown` est neutralisé : cliquer dans la barre **ne retire pas le
 *     focus** de l'éditeur, donc la sélection sur laquelle on applique la marque
 *     est conservée. Sans cela, « Gras » s'appliquerait à un curseur perdu ;
 *   - la barre reste utilisable au clavier (les boutons sont de vrais
 *     `<button>`, et les raccourcis natifs fonctionnent dans le texte).
 * ============================================================================
 */

/** Icône associée à chaque alignement. */
const ALIGN_ICONS: Record<RichTextAlignment, LucideIcon> = {
  left: AlignLeft,
  center: AlignCenter,
  right: AlignRight,
  justify: AlignJustify,
};

/** Bouton de la barre : icône **toujours** accompagnée d'un nom accessible. */
function ToolbarButton({
  label,
  shortcut,
  icon: Icon,
  active,
  disabled = false,
  onClick,
}: {
  label: string;
  shortcut?: string;
  icon: LucideIcon;
  /** Fourni uniquement pour les bascules (pose `aria-pressed`). */
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(
        "size-8 shrink-0",
        active &&
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
      )}
      aria-label={label}
      aria-pressed={active}
      title={shortcut ? `${label} (${shortcut})` : label}
      disabled={disabled}
      // Conserve la sélection dans l'éditeur (voir le commentaire d'en-tête).
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
    >
      <Icon aria-hidden="true" className="size-4" />
    </Button>
  );
}

/** Séparateur visuel entre deux groupes de boutons. */
function ToolbarSeparator() {
  return (
    <span
      aria-hidden="true"
      className="bg-border mx-0.5 h-5 w-px shrink-0"
    />
  );
}

export function RichTextToolbar({ editor }: { editor: Editor | null }) {
  const [, forceRender] = React.useReducer((count: number) => count + 1, 0);
  const [linkOpen, setLinkOpen] = React.useState(false);
  const [linkValue, setLinkValue] = React.useState("");
  const styleId = React.useId();
  const linkId = React.useId();

  /**
   * La barre doit refléter l'état courant (marque active, style du bloc,
   * alignement). On s'abonne **explicitement** aux transactions plutôt que de
   * dépendre du comportement de re-rendu de `useEditor` : c'est déterministe
   * quelle que soit la version de Tiptap.
   */
  React.useEffect(() => {
    if (!editor) {
      return;
    }
    const rerender = () => forceRender();
    editor.on("transaction", rerender);
    editor.on("selectionUpdate", rerender);
    return () => {
      editor.off("transaction", rerender);
      editor.off("selectionUpdate", rerender);
    };
  }, [editor]);

  if (!editor) {
    return null;
  }

  /** Style de bloc courant, ramené au vocabulaire de la liste déroulante. */
  const currentStyle: RichTextStyleValue = editor.isActive("heading", {
    level: 2,
  })
    ? "h2"
    : editor.isActive("heading", { level: 3 })
      ? "h3"
      : editor.isActive("heading", { level: 4 })
        ? "h4"
        : "paragraph";

  const applyStyle = (value: RichTextStyleValue) => {
    if (value === "paragraph") {
      editor.chain().focus().setParagraph().run();
      return;
    }
    const level = value === "h2" ? 2 : value === "h3" ? 3 : 4;
    editor.chain().focus().setHeading({ level }).run();
  };

  /** Un alignement est actif ; « à gauche » l'est aussi par défaut. */
  const alignmentActive = (value: RichTextAlignment): boolean => {
    if (value === "left") {
      return (
        editor.isActive({ textAlign: "left" }) ||
        (!editor.isActive({ textAlign: "center" }) &&
          !editor.isActive({ textAlign: "right" }) &&
          !editor.isActive({ textAlign: "justify" }))
      );
    }
    return editor.isActive({ textAlign: value });
  };

  const openLink = () => {
    const attributes = editor.getAttributes("link");
    const href = attributes.href;
    setLinkValue(typeof href === "string" ? href : "");
    setLinkOpen((previous) => !previous);
  };

  const applyLink = () => {
    const raw = linkValue.trim();
    if (raw === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      setLinkOpen(false);
      return;
    }
    // Une URL sans schéma, sans « / » ni « # » est une URL externe : on la
    // complète plutôt que de laisser le navigateur la traiter en chemin relatif.
    const isAbsolute = /^[a-z][a-z0-9+.-]*:/i.test(raw);
    const isInternal = raw.startsWith("/") || raw.startsWith("#");
    const href = isAbsolute || isInternal ? raw : `https://${raw}`;
    editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
    setLinkOpen(false);
  };

  return (
    <div
      role="toolbar"
      aria-label="Mise en forme du texte"
      className="grid gap-2"
    >
      <div className="flex flex-wrap items-center gap-0.5">
        {/* --- Style de bloc : la liste déroulante de Word ----------------- */}
        <label htmlFor={styleId} className="sr-only">
          Style de texte
        </label>
        <select
          id={styleId}
          value={currentStyle}
          onChange={(event) =>
            applyStyle(event.target.value as RichTextStyleValue)
          }
          className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-8 shrink-0 rounded-md border bg-transparent px-2 text-xs font-medium shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px]"
        >
          {RICH_TEXT_STYLE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <ToolbarSeparator />

        {/* --- Marques en ligne ------------------------------------------- */}
        <ToolbarButton
          label="Gras"
          shortcut={RICH_TEXT_SHORTCUTS.bold}
          icon={Bold}
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        />
        <ToolbarButton
          label="Italique"
          shortcut={RICH_TEXT_SHORTCUTS.italic}
          icon={Italic}
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        />
        <ToolbarButton
          label="Souligné"
          shortcut={RICH_TEXT_SHORTCUTS.underline}
          icon={Underline}
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        />

        <ToolbarSeparator />

        {/* --- Listes ------------------------------------------------------ */}
        <ToolbarButton
          label="Liste à puces"
          icon={List}
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        />
        <ToolbarButton
          label="Liste numérotée"
          icon={ListOrdered}
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        />

        <ToolbarSeparator />

        {/* --- Alignements -------------------------------------------------- */}
        {RICH_TEXT_ALIGNMENTS.map((alignment) => (
          <ToolbarButton
            key={alignment.value}
            label={alignment.label}
            icon={ALIGN_ICONS[alignment.value]}
            active={alignmentActive(alignment.value)}
            onClick={() =>
              editor.chain().focus().setTextAlign(alignment.value).run()
            }
          />
        ))}

        <ToolbarSeparator />

        {/* --- Lien --------------------------------------------------------- */}
        <ToolbarButton
          label={linkOpen ? "Fermer le champ du lien" : "Ajouter un lien"}
          shortcut={RICH_TEXT_SHORTCUTS.link}
          icon={Link2}
          active={editor.isActive("link")}
          onClick={openLink}
        />
        <ToolbarButton
          label="Retirer le lien"
          icon={Unlink}
          disabled={!editor.isActive("link")}
          onClick={() => editor.chain().focus().extendMarkRange("link").unsetLink().run()}
        />
      </div>

      {linkOpen ? (
        <div className="border-border bg-muted/40 flex flex-wrap items-center gap-2 rounded-md border p-2">
          <label htmlFor={linkId} className={EDITOR_TYPE.fieldLabel}>
            Adresse du lien
          </label>
          <input
            id={linkId}
            type="text"
            value={linkValue}
            placeholder="ex. https://… , /portfolio ou #contact"
            onChange={(event) => setLinkValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                applyLink();
              }
            }}
            className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-8 min-w-48 flex-1 rounded-md border bg-transparent px-2 text-xs shadow-xs outline-none focus-visible:ring-[3px]"
          />
          <Button type="button" size="sm" onClick={applyLink}>
            Appliquer
          </Button>
          <p className={cn(EDITOR_TYPE.hint, "w-full")}>
            Laissez vide et validez pour retirer le lien. Une adresse sans
            « https:// » est complétée automatiquement.
          </p>
        </div>
      ) : null}
    </div>
  );
}
