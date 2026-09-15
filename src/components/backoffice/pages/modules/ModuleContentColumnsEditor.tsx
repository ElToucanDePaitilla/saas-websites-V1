"use client";

import {
  CONTENT_HEADER_WIDTH_CAP,
  contentContainerFractions,
  contentHeaderAlignLabels,
  contentHeaderAlignOrder,
  createContentContainer,
  type ContentBlock,
  type ContentColumnCount,
  type ContentColumnsContent,
  type ContentContainer,
  type ModuleContent,
} from "@/lib/pages";

import { EditorZone } from "./EditorZone";
import { ContentColumnsEditor } from "./content/ContentColumnsEditor";
import { ContentLayoutControls } from "./content/ContentLayoutControls";
import { ToggleRow } from "./content/EditorToggleRow";
import { SelectField, TextAreaField, TextField } from "./form-fields";

/**
 * ============================================================================
 * ÉDITEUR DU MODULE « CONTENU EN COLONNES » (Étape 12.1)
 * ----------------------------------------------------------------------------
 * Chef d'orchestre : deux `EditorZone` — « Mise en page » (comment le contenu
 * est réparti) puis « Le contenu de chaque colonne » (ce qui est écrit) — qui
 * nomment chacune leur **cible** et leur **portée**, conformément à l'échelle
 * typographique et aux principes P1/P2 de l'étape 11.17.
 *
 * **Changer le nombre de colonnes ne détruit rien.** Réduire de 4 à 2 colonnes
 * rattache les blocs des colonnes retirées à la dernière colonne conservée :
 * c'est moins « parfait » qu'un archivage, mais c'est **sans perte**, immédiat à
 * comprendre et sans état caché à maintenir. Bloquer la réduction parce qu'une
 * colonne n'est pas vide serait plus frustrant qu'utile pour un utilisateur non
 * technique qui veut simplement « passer à deux colonnes ».
 * ============================================================================
 */

type ModuleContentColumnsEditorProps = {
  content: Extract<ModuleContent, { type: "content" }>;
  onChangeContent: (content: Extract<ModuleContent, { type: "content" }>) => void;
};

export function ModuleContentColumnsEditor({
  content,
  onChangeContent,
}: ModuleContentColumnsEditorProps) {
  // ---------------------------------------------------------------------------
  // DIAGNOSTIC TEMPORAIRE (à retirer) — hypothèse à valider :
  // la donnée stockée en JSONB a été enregistrée AVANT l'étape 12.2 et ne porte
  // donc pas encore l'objet `header`. On affiche les clés réellement reçues.
  // ---------------------------------------------------------------------------
  const rawContent = content as unknown as Record<string, unknown>;
  console.warn("[diag-12.2] module `content` reçu par l’éditeur :", {
    keys: Object.keys(rawContent),
    header: rawContent.header,
    heading: rawContent.heading,
    containers: Array.isArray(rawContent.containers)
      ? rawContent.containers.length
      : rawContent.containers,
  });

  const { containers, layout } = content;
  const fractions = contentContainerFractions(containers, layout.sameWidth);

  const patchLayout = (patch: Partial<ContentColumnsContent["layout"]>) => {
    onChangeContent({ ...content, layout: { ...layout, ...patch } });
  };

  const patchHeader = (patch: Partial<ContentColumnsContent["header"]>) => {
    onChangeContent({ ...content, header: { ...content.header, ...patch } });
  };

  /**
   * Le texte du H2 reste `heading` — **source unique**, également lue par la
   * description de partage. L'éditeur ne le duplique donc pas dans `header`.
   */
  const setHeading = (heading: string) => {
    onChangeContent({ ...content, heading });
  };

  const setContainers = (next: ContentContainer[]) => {
    onChangeContent({ ...content, containers: next });
  };

  /** Change le nombre de colonnes — **sans jamais perdre de contenu**. */
  const setCount = (count: ContentColumnCount) => {
    if (count === containers.length) {
      return;
    }

    if (count > containers.length) {
      const added = Array.from({ length: count - containers.length }, () =>
        createContentContainer()
      );
      setContainers([...containers, ...added]);
      return;
    }

    const kept = containers.slice(0, count);
    const dropped = containers.slice(count);
    const lastIndex = kept.length - 1;
    const last = kept[lastIndex];
    if (last !== undefined && dropped.length > 0) {
      const merged = dropped.flatMap((container) => container.blocks);
      const nextKept = [...kept];
      nextKept[lastIndex] = { ...last, blocks: [...last.blocks, ...merged] };
      setContainers(nextKept);
      return;
    }
    setContainers(kept);
  };

  const setWeight = (containerId: string, weight: number) => {
    setContainers(
      containers.map((container) =>
        container.id === containerId ? { ...container, weight } : container
      )
    );
  };

  const setBlocks = (containerId: string, blocks: ContentBlock[]) => {
    setContainers(
      containers.map((container) =>
        container.id === containerId ? { ...container, blocks } : container
      )
    );
  };

  /** Réordonne une colonne — **dans les données**, jamais par `order:` CSS. */
  const moveContainer = (from: number, to: number) => {
    if (to < 0 || to >= containers.length) {
      return;
    }
    const next = [...containers];
    const moved = next.splice(from, 1)[0];
    if (moved === undefined) {
      return;
    }
    next.splice(to, 0, moved);
    setContainers(next);
  };

  return (
    <div className="grid gap-4">
      <EditorZone
        id="content-header"
        tone="detail"
        title="En-tête de la section"
        scope="Le titre, le sous-titre et le texte affichés au-dessus des colonnes, sur toute leur largeur. Chaque élément s’active séparément, et un élément laissé vide n’occupe aucune place."
      >
        <div className="grid gap-4">
          <div className="grid gap-3">
            <ToggleRow
              id="content-header-h2"
              label="Afficher un titre"
              hint={`Il ne dépasse jamais ${CONTENT_HEADER_WIDTH_CAP.h2} % de la largeur des colonnes.`}
              checked={content.header.showH2}
              onChange={(showH2) => patchHeader({ showH2 })}
            />
            {content.header.showH2 ? (
              <TextField
                label="Titre"
                value={content.heading}
                onChange={setHeading}
                placeholder="ex. Mes prestations"
                hint="Titre principal de la section, affiché en grand."
              />
            ) : null}
          </div>

          <div className="grid gap-3">
            <ToggleRow
              id="content-header-h3"
              label="Afficher un sous-titre"
              hint={`Il ne dépasse jamais ${CONTENT_HEADER_WIDTH_CAP.h3} % de la largeur des colonnes.`}
              checked={content.header.showH3}
              onChange={(showH3) => patchHeader({ showH3 })}
            />
            {content.header.showH3 ? (
              <TextField
                label="Sous-titre"
                value={content.header.h3}
                onChange={(h3) => patchHeader({ h3 })}
                placeholder="ex. Du portrait au reportage"
                hint="Affiché sous le titre, un cran plus petit."
              />
            ) : null}
          </div>

          <div className="grid gap-3">
            <ToggleRow
              id="content-header-text"
              label="Afficher un texte d’introduction"
              hint={`Il ne dépasse jamais ${CONTENT_HEADER_WIDTH_CAP.text} % de la largeur des colonnes.`}
              checked={content.header.showText}
              onChange={(showText) => patchHeader({ showText })}
            />
            {content.header.showText ? (
              <TextAreaField
                label="Texte d’introduction"
                value={content.header.text}
                onChange={(text) => patchHeader({ text })}
                rows={4}
                placeholder="Quelques lignes pour introduire la section…"
                hint="Les retours à la ligne sont conservés tels quels sur le site."
              />
            ) : null}
          </div>

          {/* ---- Alignement de l'ensemble de l'en-tête ---------------------- */}
          <SelectField
            label="Alignement de l’en-tête"
            value={content.header.align}
            options={contentHeaderAlignOrder.map((value) => ({
              value,
              label: contentHeaderAlignLabels[value],
            }))}
            onChange={(align) => patchHeader({ align })}
            hint="S’applique au titre, au sous-titre et au texte d’introduction, ensemble et d’un seul geste : aligné à gauche pour une lecture naturelle, centré pour mettre un titre en scène."
          />
        </div>
      </EditorZone>

      <EditorZone
        id="content-layout"
        tone="style"
        title="Mise en page"
        scope="Le nombre de colonnes, leur largeur et la façon dont elles s’empilent sur les petits écrans."
      >
        <ContentLayoutControls
          layout={layout}
          containers={containers}
          fractions={fractions}
          onLayoutChange={patchLayout}
          onCountChange={setCount}
          onWeightChange={setWeight}
        />
      </EditorZone>

      <EditorZone
        id="content-columns"
        tone="content"
        title="Le contenu de chaque colonne"
        scope="Écrivez, ajoutez des photos et des icônes dans chaque colonne. Le contenu d’une colonne ne déborde jamais dans la suivante."
      >
        <ContentColumnsEditor
          containers={containers}
          fractions={fractions}
          sameWidth={layout.sameWidth}
          onBlocksChange={setBlocks}
          onMoveContainer={moveContainer}
        />
      </EditorZone>
    </div>
  );
}
