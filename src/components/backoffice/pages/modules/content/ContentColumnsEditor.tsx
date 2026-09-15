"use client";

import * as React from "react";
import {
  ArrowDown,
  ArrowUp,
  MoveVertical,
  Trash2,
  Type,
  type LucideIcon,
} from "lucide-react";

import { contentIconCatalog } from "@/components/common/IconByName";
import { Button } from "@/components/ui/button";
import {
  contentGapLabels,
  contentGapOrder,
  contentIconSizeLabels,
  contentIconSizeOrder,
  contentTextAlignLabels,
  createContentRichTextBlock,
  type ContentBlock,
  type ContentContainer,
} from "@/lib/pages";
import { cn } from "@/lib/utils";

import { EDITOR_TYPE } from "../editor-type";
import { EditorSubZone } from "../EditorZone";
import { MediaFields, SelectField } from "../form-fields";
import { RichTextBlockEditor } from "./RichTextBlockEditor";

/**
 * ============================================================================
 * ÉDITEUR DES COLONNES ET DE LEURS ÉLÉMENTS — section « Contenu » (Étape 12.1)
 * ----------------------------------------------------------------------------
 * Chaque **colonne est un conteneur indépendant** : on y écrit, on y ajoute des
 * respirations, et on réordonne ses éléments **sans que le texte coule d'une
 * colonne à l'autre** — c'est la différence assumée avec les « colonnes » de
 * Word, et la seule façon d'affecter un contenu à une colonne précise.
 *
 * Trois décisions d'ergonomie, toutes issues d'un constat d'usage :
 *
 *   1. **Le type par défaut d'une colonne est le texte.** Une colonne naît donc
 *      avec un champ de saisie prêt — et non avec un choix de type à faire. Les
 *      boutons « Texte / Photo / Icône » n'apportaient rien : ils demandaient de
 *      choisir *avant* d'écrire. Seul « Ajouter un espacement » subsiste, car il
 *      n'est pas un type de contenu mais une **respiration**.
 *   2. **Un élément dit toujours où il se trouve.** Chaque sous-rubrique annonce
 *      son rang (« 2ᵉ élément sur 3 ») et sa colonne : ajouter un espacement ne
 *      laisse plus deviner à quel endroit du document il se rattache.
 *   3. **Le réordonnancement est expliqué, pas seulement disponible.** Les
 *      flèches ↑ / ↓ sont précédées d'une légende qui dit ce qu'elles changent :
 *      l'ordre d'affichage. Il existe au clavier et ne dépend d'aucun
 *      glisser-déposer.
 *
 * (L'indentation des colonnes a été **retirée** : ce réglage demandait de
 * comprendre la mécanique de la grille pour un gain visuel rare. Le rendu public
 * n'en tient plus compte, et un contenu qui en portait reprend simplement toute
 * sa largeur.)
 * ============================================================================
 */

/** Libellé français d'un type de bloc. */
const BLOCK_KIND_LABELS: Record<ContentBlock["kind"], string> = {
  "rich-text": "Texte",
  image: "Photo",
  icon: "Icône",
  spacer: "Espacement vertical",
};

/** Alignement d'un bloc autonome — « justifié » n'a pas de sens ici. */
const BLOCK_ALIGN_OPTIONS = (["left", "center", "right"] as const).map(
  (value) => ({ value, label: contentTextAlignLabels[value] })
);

/** Identifiant stable d'un nouveau bloc (mock : UUID v4). */
function newBlockId(): string {
  return crypto.randomUUID();
}

/**
 * Nouvel espacement vertical.
 *
 * Hauteur moyenne par défaut : une respiration visible mais qui ne sépare pas
 * deux blocs au point de rompre la lecture de la colonne.
 */
function createSpacerBlock(): ContentBlock {
  return { id: newBlockId(), kind: "spacer", size: "md" };
}

/** Déplace un élément d'un cran (retourne le tableau inchangé si impossible). */
function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (to < 0 || to >= items.length || from === to) {
    return items;
  }
  const next = [...items];
  const moved = next.splice(from, 1)[0];
  if (moved === undefined) {
    return items;
  }
  next.splice(to, 0, moved);
  return next;
}

/** Bouton d'action carré, doté d'un libellé accessible (jamais d'icône seule). */
function ActionButton({
  label,
  icon: Icon,
  onClick,
  disabled = false,
  destructive = false,
}: {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(
        "size-7",
        destructive && "text-muted-foreground hover:text-destructive"
      )}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
    >
      <Icon aria-hidden="true" className="size-3.5" />
    </Button>
  );
}

/** Sélecteur d'icône — n'enregistre que le **nom**, jamais le dessin. */
function IconPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (name: string) => void;
}) {
  return (
    <div className="grid gap-1.5">
      <p className={EDITOR_TYPE.fieldLabel}>Icône</p>
      <div
        role="listbox"
        aria-label="Choisir une icône"
        className="grid max-h-44 grid-cols-8 gap-1 overflow-y-auto rounded-md border border-border p-1.5"
      >
        {contentIconCatalog.map((entry) => {
          const selected = entry.name === value;
          return (
            <button
              key={entry.name}
              type="button"
              role="option"
              aria-selected={selected}
              aria-label={entry.label}
              title={entry.label}
              onClick={() => onChange(entry.name)}
              className={cn(
                "flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors",
                "hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
                selected &&
                  "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
              )}
            >
              <entry.Icon className="size-4" aria-hidden="true" />
            </button>
          );
        })}
      </div>
      <p className={EDITOR_TYPE.hint}>
        Bibliothèque libre. L’icône suit la couleur du texte : elle s’adapte au
        thème sans réglage.
      </p>
    </div>
  );
}

type ContentColumnsEditorProps = {
  containers: ContentContainer[];
  /** Parts relatives (0–1) de chaque colonne — affichées dans le titre. */
  fractions: number[];
  sameWidth: boolean;
  onBlocksChange: (containerId: string, blocks: ContentBlock[]) => void;
  onMoveContainer: (from: number, to: number) => void;
};

export function ContentColumnsEditor({
  containers,
  fractions,
  sameWidth,
  onBlocksChange,
  onMoveContainer,
}: ContentColumnsEditorProps) {
  return (
    <div className="grid gap-4">
      {containers.map((container, containerIndex) => {
        const label = `Colonne ${containerIndex + 1}`;
        const share = Math.round((fractions[containerIndex] ?? 0) * 100);
        const blockCount = container.blocks.length;

        /** Remplace un bloc par sa nouvelle version. */
        const replaceBlock = (index: number, next: ContentBlock) => {
          const blocks = [...container.blocks];
          blocks[index] = next;
          onBlocksChange(container.id, blocks);
        };

        return (
          <EditorSubZone
            key={container.id}
            title={sameWidth ? label : `${label} — ${share} %`}
          >
            <div className="flex items-center justify-between gap-3">
              <p className={EDITOR_TYPE.hint}>
                {blockCount === 0
                  ? "Cette colonne est vide : ajoutez un texte ou un espacement."
                  : `${blockCount} élément${blockCount > 1 ? "s" : ""} dans cette colonne, dans cet ordre.`}
              </p>
              {/* La légende nomme l'effet des flèches : elles déplacent la
                  colonne dans l'ordre d'affichage de la section. */}
              <div className="flex shrink-0 items-center gap-2">
                <span className={EDITOR_TYPE.annotation}>Ordre d’affichage :</span>
                <div className="flex items-center gap-0.5">
                  <ActionButton
                    label={`Placer « ${label} » avant la précédente — change l’ordre d’affichage`}
                    icon={ArrowUp}
                    disabled={containerIndex === 0}
                    onClick={() =>
                      onMoveContainer(containerIndex, containerIndex - 1)
                    }
                  />
                  <ActionButton
                    label={`Placer « ${label} » après la suivante — change l’ordre d’affichage`}
                    icon={ArrowDown}
                    disabled={containerIndex === containers.length - 1}
                    onClick={() =>
                      onMoveContainer(containerIndex, containerIndex + 1)
                    }
                  />
                </div>
              </div>
            </div>

            {container.blocks.map((block, blockIndex) => {
              const isSpacer = block.kind === "spacer";
              /** Intitulé explicite de la sous-rubrique (jamais un seul mot). */
              const blockTitle = isSpacer
                ? "Espacement vertical"
                : BLOCK_KIND_LABELS[block.kind];

              return (
                <div
                  key={block.id}
                  className={cn(
                    "grid gap-3 rounded-md border p-3",
                    isSpacer
                      ? "border-dashed border-border bg-muted/30"
                      : "border-border bg-background/60"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className={EDITOR_TYPE.annotation}>{blockTitle}</p>
                      {/* Rattachement explicite : rang dans la colonne + colonne. */}
                      <p className="text-muted-foreground text-xs">
                        {blockIndex + 1}
                        {blockIndex === 0 ? "ᵉʳ" : "ᵉ"} élément sur {blockCount} ·{" "}
                        {label}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-0.5">
                      <ActionButton
                        label={`Remonter « ${blockTitle} » d’un cran dans ${label}`}
                        icon={ArrowUp}
                        disabled={blockIndex === 0}
                        onClick={() =>
                          onBlocksChange(
                            container.id,
                            moveItem(
                              container.blocks,
                              blockIndex,
                              blockIndex - 1
                            )
                          )
                        }
                      />
                      <ActionButton
                        label={`Descendre « ${blockTitle} » d’un cran dans ${label}`}
                        icon={ArrowDown}
                        disabled={blockIndex === blockCount - 1}
                        onClick={() =>
                          onBlocksChange(
                            container.id,
                            moveItem(
                              container.blocks,
                              blockIndex,
                              blockIndex + 1
                            )
                          )
                        }
                      />
                      <ActionButton
                        label={`Supprimer « ${blockTitle} » de ${label}`}
                        icon={Trash2}
                        destructive
                        onClick={() =>
                          onBlocksChange(
                            container.id,
                            container.blocks.filter(
                              (_, index) => index !== blockIndex
                            )
                          )
                        }
                      />
                    </div>
                  </div>

                  {block.kind === "rich-text" ? (
                    <RichTextBlockEditor
                      doc={block.doc}
                      label={`${label} — texte`}
                      onChange={(doc) =>
                        replaceBlock(blockIndex, { ...block, doc })
                      }
                    />
                  ) : null}

                  {block.kind === "image" ? (
                    <div className="grid gap-3">
                      <MediaFields
                        value={block.media}
                        onChange={(media) =>
                          replaceBlock(blockIndex, { ...block, media })
                        }
                      />
                      <div className="grid gap-3 sm:grid-cols-2">
                        <SelectField
                          label="Largeur"
                          value={block.width}
                          options={[
                            { value: "full", label: "Toute la colonne" },
                            { value: "auto", label: "Largeur de l’image" },
                          ]}
                          onChange={(width) =>
                            replaceBlock(blockIndex, { ...block, width })
                          }
                        />
                        <SelectField
                          label="Placement"
                          value={block.align}
                          options={BLOCK_ALIGN_OPTIONS}
                          onChange={(align) =>
                            replaceBlock(blockIndex, { ...block, align })
                          }
                        />
                      </div>
                    </div>
                  ) : null}

                  {block.kind === "icon" ? (
                    <div className="grid gap-3">
                      <IconPicker
                        value={block.name}
                        onChange={(name) =>
                          replaceBlock(blockIndex, { ...block, name })
                        }
                      />
                      <div className="grid gap-3 sm:grid-cols-2">
                        <SelectField
                          label="Taille"
                          value={block.size}
                          options={contentIconSizeOrder.map((value) => ({
                            value,
                            label: contentIconSizeLabels[value],
                          }))}
                          onChange={(size) =>
                            replaceBlock(blockIndex, { ...block, size })
                          }
                        />
                        <SelectField
                          label="Placement"
                          value={block.align}
                          options={BLOCK_ALIGN_OPTIONS}
                          onChange={(align) =>
                            replaceBlock(blockIndex, { ...block, align })
                          }
                        />
                      </div>
                    </div>
                  ) : null}

                  {block.kind === "spacer" ? (
                    <div className="grid gap-3">
                      {/* L'aide dit *où* agit l'espacement et *à quoi* il sert,
                          plutôt que de laisser deviner entre quels blocs il
                          s'est glissé. */}
                      <p className={EDITOR_TYPE.hint}>
                        Respiration insérée entre l’élément du dessus et celui du
                        dessous, dans « {label} ». Ajustez sa hauteur ci-dessous,
                        ou déplacez-la avec les flèches pour choisir l’endroit
                        exact.
                      </p>
                      <SelectField
                        label="Hauteur de l’espace"
                        value={block.size}
                        options={contentGapOrder.map((value) => ({
                          value,
                          label: contentGapLabels[value],
                        }))}
                        onChange={(size) =>
                          replaceBlock(blockIndex, { ...block, size })
                        }
                      />
                    </div>
                  ) : null}
                </div>
              );
            })}

            <div className="grid gap-1.5">
              <div className="flex flex-wrap gap-2">
                {/* Une colonne vidée retrouve un champ de saisie : sans cela la
                    suppression du dernier élément rendrait la colonne
                    définitivement muette. */}
                {blockCount === 0 ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      onBlocksChange(container.id, [
                        createContentRichTextBlock(),
                      ])
                    }
                  >
                    <Type aria-hidden="true" />
                    Ajouter du texte
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    onBlocksChange(container.id, [
                      ...container.blocks,
                      createSpacerBlock(),
                    ])
                  }
                >
                  <MoveVertical aria-hidden="true" />
                  Ajouter un espacement
                </Button>
              </div>
              <p className={EDITOR_TYPE.hint}>
                L’espacement s’ajoute <strong>à la fin de « {label} »</strong>,
                après le dernier élément : il crée une respiration entre deux
                contenus. Déplacez-le ensuite avec les flèches pour le placer
                exactement où vous le souhaitez.
              </p>
            </div>
          </EditorSubZone>
        );
      })}
    </div>
  );
}
