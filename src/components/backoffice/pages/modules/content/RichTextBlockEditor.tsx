"use client";

import * as React from "react";
import { EditorContent, useEditor } from "@tiptap/react";

import type { RichTextDoc, RichTextNode } from "@/lib/pages";

import { EDITOR_TYPE } from "../editor-type";
import {
  createRichTextExtensions,
  RICH_TEXT_CONTENT_CLASS,
} from "./rich-text-config";
import { RichTextToolbar } from "./RichTextToolbar";

/**
 * ============================================================================
 * ÉDITEUR D'UN BLOC DE TEXTE — Tiptap (Étape 12.1, lot H)
 * ----------------------------------------------------------------------------
 * Éditeur **riche** (Tiptap / ProseMirror) : styles de bloc, gras, italique,
 * souligné, listes, alignements et lien, avec la barre d'outils de
 * [`RichTextToolbar`](./RichTextToolbar.tsx).
 *
 * **Le contrat avec le store est inchangé** — c'est celui qui compte, et le
 * remplacer par Tiptap ne l'a pas modifié d'une ligne :
 *
 *   1. **état local** — la frappe ne remonte jamais au store. `PagesStoreProvider`
 *      réagit à tout changement d'état par une comparaison `JSON.stringify` de
 *      l'ensemble des modules de la page, une réécriture du contexte (donc un
 *      re-render de tout l'arbre consommateur) et un `PUT` de la page entière :
 *      parfait pour un champ de 40 caractères, inadapté à la frappe continue ;
 *   2. **commit différé** (~500 ms d'inactivité) — une seule écriture par salve ;
 *   3. **flush sur `blur`** — quitter le champ enregistre immédiatement ;
 *   4. **flush au démontage** — replier l'accordéon du module n'égare rien.
 *
 * Deux précautions propres à l'éditeur riche :
 *   - **le fond et le texte sont ceux du site public** (`rich-content-surface`
 *     dans [`globals.css`](../../../../app/globals.css)) : l'aperçu ne peut pas
 *     diverger du site, et le contraste reste garanti quelle que soit la palette ;
 *   - **la synchronisation externe n'écrase jamais une saisie en attente**, et
 *     ne recharge pas un document identique — sans quoi le curseur sauterait à
 *     chaque commit provoqué par l'éditeur lui-même.
 * ============================================================================
 */

/** Délai d'inactivité avant remontée au store (ms). */
const COMMIT_DELAY_MS = 500;

/** Garde locale : objet simple non nul. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Convertit la sortie JSON de Tiptap en `RichTextDoc` du domaine.
 * Les nœuds non conformes sont écartés plutôt que propagés au store : la
 * frontière est explicite, et le type du domaine reste garanti.
 */
function toRichTextDoc(json: unknown): RichTextDoc {
  if (!isRecord(json) || json.type !== "doc") {
    return { type: "doc", content: [] };
  }
  const rawContent: unknown = json.content;
  const nodes: RichTextNode[] = [];
  if (Array.isArray(rawContent)) {
    for (const node of rawContent) {
      if (isRecord(node)) {
        nodes.push(node);
      }
    }
  }
  return { type: "doc", content: nodes };
}

type RichTextBlockEditorProps = {
  /** Document de référence (issu du store). */
  doc: RichTextDoc;
  /** Remonte le document — appelé uniquement aux points de commit. */
  onChange: (doc: RichTextDoc) => void;
  /** Nom accessible de la zone d'édition (ex. « Colonne 2 — texte »). */
  label: string;
};

export function RichTextBlockEditor({
  doc,
  onChange,
  label,
}: RichTextBlockEditorProps) {
  /**
   * `onChange` le plus récent, lu depuis les phases différées (minuterie,
   * démontage) dont la closure est figée. Mis à jour **dans un effet** : écrire
   * une référence pendant le rendu est proscrit par React.
   */
  const onChangeRef = React.useRef(onChange);
  React.useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const timerRef = React.useRef<number | null>(null);
  /** Document en attente de commit ; `null` = rien à remonter. */
  const pendingRef = React.useRef<RichTextDoc | null>(null);

  const commitPending = React.useCallback(() => {
    const pending = pendingRef.current;
    if (pending !== null) {
      pendingRef.current = null;
      onChangeRef.current(pending);
    }
  }, []);

  const clearTimer = React.useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  /** Programme un commit (ou le reporte si une frappe suit). */
  const scheduleCommit = React.useCallback(
    (next: RichTextDoc) => {
      pendingRef.current = next;
      clearTimer();
      timerRef.current = window.setTimeout(() => {
        timerRef.current = null;
        commitPending();
      }, COMMIT_DELAY_MS);
    },
    [clearTimer, commitPending]
  );

  React.useEffect(
    () => () => {
      // Démontage (repli de l'accordéon, changement de module) : rien n'est perdu.
      clearTimer();
      commitPending();
    },
    [clearTimer, commitPending]
  );

  /**
   * Identifiant du texte d'aide, référencé par `aria-describedby` : un lecteur
   * d'écran annonce ainsi **comment** se servir de la zone (barre d'outils,
   * raccourcis), et pas seulement son nom.
   */
  const hintId = React.useId();

  const editor = useEditor({
    extensions: createRichTextExtensions(),
    content: doc,
    // Rendu différé : évite toute divergence d'hydratation en Next.js.
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: RICH_TEXT_CONTENT_CLASS,
        "aria-label": label,
        "aria-describedby": hintId,
        role: "textbox",
        "aria-multiline": "true",
      },
    },
    onUpdate: ({ editor: instance }) => {
      scheduleCommit(toRichTextDoc(instance.getJSON()));
    },
    onBlur: () => {
      clearTimer();
      commitPending();
    },
  });

  /**
   * Synchronisation **externe** (contenu rechargé, résolveur, annulation).
   * Deux garde-fous : on n'écrase jamais une saisie en attente, et on ne
   * recharge pas un document identique — sinon le curseur serait réinitialisé à
   * chaque commit déclenché par la propre frappe de l'utilisateur.
   */
  React.useEffect(() => {
    if (!editor || pendingRef.current !== null) {
      return;
    }
    if (JSON.stringify(editor.getJSON()) === JSON.stringify(doc)) {
      return;
    }
    editor.commands.setContent(doc, { emitUpdate: false });
  }, [editor, doc]);

  return (
    <div className="grid gap-2">
      <RichTextToolbar editor={editor} />
      <div className="rich-content-surface">
        <EditorContent editor={editor} />
      </div>
      <p id={hintId} className={EDITOR_TYPE.hint}>
        Sélectionnez du texte puis utilisez la barre ci-dessus. Raccourcis :
        Ctrl+B (gras), Ctrl+I (italique), Ctrl+U (souligné).
      </p>
    </div>
  );
}
