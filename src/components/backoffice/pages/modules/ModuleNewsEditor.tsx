"use client";

import * as React from "react";
import {
  ArrowDown,
  ArrowDownUp,
  ArrowUp,
  ChevronDown,
  Copy,
  Plus,
  Trash2,
} from "lucide-react";

import { ColorField } from "@/components/backoffice/shared/ColorField";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  createNewsItem,
  galleryShadowLabels,
  galleryShadowOrder,
  heroCtaStyleLabels,
  heroCtaStyleOrder,
  newsDateLabel,
  newsFrameToneLabels,
  newsFrameToneOrder,
  newsKindLabels,
  newsKindOrder,
  newsPosterFitLabels,
  newsPosterFitOrder,
  resolveNewsContent,
  type GalleryShadowLevel,
  type HeroCtaStyle,
  type ModuleContent,
  type NewsContent,
  type NewsFrameTone,
  type NewsItem,
  type NewsKind,
  type NewsPosterFit,
} from "@/lib/pages";
import { cn } from "@/lib/utils";

import { ArtSourceField } from "./ArtSourceField";
import { EditorZone } from "./EditorZone";
import { LinkTargetSelect } from "./LinkTargetSelect";
import {
  parseBounded,
  SelectField,
  TextAreaField,
  TextField,
} from "./form-fields";
import { SwitchField } from "./gallery/fields";

/**
 * ============================================================================
 * ÉDITEUR DE CONTENU — Module « Actualités & expositions » (Étape 14.5)
 * ----------------------------------------------------------------------------
 * Trois `EditorZone` :
 *   1. 🧾 Le chapeau — titre, sous-titre, introduction ;
 *   2. 📰 Les actualités — liste réordonnable, avec ajout, duplication,
 *      suppression et tri par date ;
 *   3. 🎨 Apparence — fond du cadre, cadrage de l'affiche, arrondi, ombre,
 *      filet et boutons.
 *
 * Le contenu est **normalisé** (`resolveNewsContent`) avant édition : un JSONB
 * tronqué ne doit pas faire apparaître d'`undefined` dans les champs.
 *
 * Deux partis pris de l'éditeur :
 *   - **l'ordre du tableau EST l'ordre d'affichage** (D6). Il n'y a donc aucun
 *     tri automatique : « la plus récente en haut » est une convention d'édition,
 *     servie par l'insertion **en tête** et par le bouton de tri explicite ;
 *   - **la date est un affichage**, jamais un ordre. Le champ le rappelle pour
 *     éviter le contresens « j'ai saisi une date, elle va se ranger ».
 * ============================================================================
 */

type ModuleNewsEditorProps = {
  content: Extract<ModuleContent, { type: "news" }>;
  onChangeContent: (content: NewsContent) => void;
};

export function ModuleNewsEditor({
  content,
  onChangeContent,
}: ModuleNewsEditorProps) {
  // Contenu **complet** avant édition : un JSONB tronqué ne doit pas faire
  // apparaître d'`undefined` dans les champs.
  const news = React.useMemo<NewsContent>(
    () => resolveNewsContent(content),
    [content]
  );

  /** Item ouvert dans l'accordéon (un seul à la fois : l'écran reste court). */
  const [openItemId, setOpenItemId] = React.useState<string>("");
  /** Item dont la suppression attend confirmation (plusieurs items en jeu). */
  const [pendingRemoveId, setPendingRemoveId] = React.useState<string | null>(
    null
  );

  const items = news.items;

  type NewsPatch = Partial<Omit<NewsContent, "type">>;

  function patch(next: NewsPatch) {
    onChangeContent({
      ...news,
      // `??` et non `||` : un champ vidé doit le rester (jamais de texte
      // ressuscité depuis la fabrique).
      heading: next.heading ?? news.heading,
      subtitle: next.subtitle ?? news.subtitle,
      intro: next.intro ?? news.intro,
      items: next.items ?? news.items,
      style: next.style ?? news.style,
    });
  }

  function updateItem(itemId: string, next: Partial<NewsItem>) {
    patch({
      items: items.map((item) =>
        item.id === itemId ? { ...item, ...next } : item
      ),
    });
  }

  function removeItem(itemId: string) {
    patch({ items: items.filter((item) => item.id !== itemId) });
    setOpenItemId((current) => (current === itemId ? "" : current));
  }

  /**
   * Suppression protégée : tant qu'il reste plusieurs items, on demande
   * confirmation — une liste est un travail d'édition, pas une ligne de table.
   * Sur le dernier item, la suppression est directe : il n'y a rien à perdre.
   */
  function requestRemove(itemId: string) {
    if (items.length > 1) {
      setPendingRemoveId(itemId);
      return;
    }
    removeItem(itemId);
  }

  /** Duplique un item juste après l'original (objets imbriqués copiés). */
  function duplicateItem(itemId: string) {
    const index = items.findIndex((item) => item.id === itemId);
    const source = items[index];
    if (source === undefined) {
      return;
    }
    const copy: NewsItem = {
      ...source,
      id: crypto.randomUUID(),
      media: { ...source.media },
      cta: { ...source.cta },
    };
    const next = [...items];
    next.splice(index + 1, 0, copy);
    patch({ items: next });
    setOpenItemId(copy.id);
  }

  /** Déplace un item d'un cran (le tableau EST l'ordre d'affichage). */
  function moveItem(itemId: string, direction: -1 | 1) {
    const index = items.findIndex((item) => item.id === itemId);
    const target = index + direction;
    if (index === -1 || target < 0 || target >= items.length) {
      return;
    }
    const next = [...items];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    patch({ items: next });
  }

  /**
   * Ajoute un item **en tête** (D6) : la convention « la plus récente en haut »
   * n'est tenue par aucun tri du résolveur, elle l'est par ce geste.
   */
  function addItem() {
    // L'index ne sert qu'au choix de l'exemple ; au-delà des modèles, la
    // fabrique reprend le premier (seed stable).
    const item = createNewsItem(items.length);
    patch({ items: [item, ...items] });
    setOpenItemId(item.id);
  }

  /**
   * Tri **ponctuel** par date décroissante, à la demande (D6).
   *
   * Les items **sans date** restent en fin, dans leur ordre relatif : ils ne
   * sont pas « anciens », ils sont sans date — les remonter serait un contresens.
   * Le format `YYYY-MM-DD` se compare comme du texte, aucune conversion n'est
   * nécessaire ; le tri est stable, deux items de même date gardent leur ordre.
   */
  function sortByDateDesc() {
    const dated = items.filter((item) => item.publishedAt.trim() !== "");
    const undated = items.filter((item) => item.publishedAt.trim() === "");
    const sorted = [...dated].sort((a, b) =>
      b.publishedAt.localeCompare(a.publishedAt)
    );
    patch({ items: [...sorted, ...undated] });
  }

  const pendingRemove = pendingRemoveId
    ? items.find((item) => item.id === pendingRemoveId)
    : undefined;

  return (
    <div className="grid gap-4">
      {/* ---- Zone 1 — le chapeau ---- */}
      <EditorZone
        tone="content"
        title="Le chapeau de la section"
        scope="Le titre, le sous-titre et la phrase d’introduction affichés au-dessus des actualités. Chacun est facultatif : un champ laissé vide ne laisse ni blanc ni marge."
      >
        <TextField
          label="Titre de la section (H2)"
          value={news.heading}
          placeholder="Ex. Actualités & expositions"
          onChange={(heading) => patch({ heading })}
          hint="Titre visible au-dessus de la liste."
        />
        <TextField
          label="Sous-titre"
          value={news.subtitle}
          placeholder="Ex. Les prochains rendez-vous"
          onChange={(subtitle) => patch({ subtitle })}
        />
        <TextAreaField
          label="Phrase d’introduction"
          value={news.intro}
          rows={3}
          hint="Quelques mots d’accroche. Les retours à la ligne sont conservés."
          onChange={(intro) => patch({ intro })}
        />
      </EditorZone>

      {/* ---- Zone 2 — les items ---- */}
      <EditorZone
        tone="action"
        title="Actualités & expositions"
        scope="Chaque annonce présentée au visiteur : son affiche, sa nature, son titre, son texte et son bouton. Leur ordre est celui de la liste ci-dessous. Sans aucun item avec affiche, la section n’apparaît pas sur le site."
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[13px] font-semibold leading-snug text-foreground">
            Annonces ({items.length})
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={items.length < 2}
              onClick={sortByDateDesc}
              title="Ranger les annonces de la plus récente à la plus ancienne ; celles sans date restent à la fin."
            >
              <ArrowDownUp />
              Trier par date décroissante
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus />
              Ajouter une actualité
            </Button>
          </div>
        </div>

        {items.map((item, itemIndex) => {
          const open = openItemId === item.id;
          const label = item.title.trim() || "sans titre";
          const dateLabel = newsDateLabel(item.publishedAt);
          return (
            <div
              key={item.id}
              className="grid gap-3 rounded-md border border-dashed border-border bg-background/40 p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <button
                  type="button"
                  aria-expanded={open}
                  aria-label={
                    open
                      ? `Replier l’annonce ${itemIndex + 1}`
                      : `Déplier l’annonce ${itemIndex + 1}`
                  }
                  onClick={() => setOpenItemId(open ? "" : item.id)}
                  className="flex min-w-0 flex-1 items-start gap-2 text-left"
                >
                  <ChevronDown
                    aria-hidden="true"
                    className={cn(
                      "mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform duration-200",
                      open && "rotate-180"
                    )}
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-semibold text-foreground">
                      Annonce {itemIndex + 1} — {label}
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
                      {newsKindLabels[item.kind]}
                      {dateLabel !== "" ? ` · ${dateLabel}` : ""}
                    </span>
                  </span>
                </button>

                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    aria-label={`Monter l’annonce ${itemIndex + 1}`}
                    title="Monter cette annonce"
                    disabled={itemIndex === 0}
                    onClick={() => moveItem(item.id, -1)}
                    className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-30"
                  >
                    <ArrowUp className="size-4" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Descendre l’annonce ${itemIndex + 1}`}
                    title="Descendre cette annonce"
                    disabled={itemIndex === items.length - 1}
                    onClick={() => moveItem(item.id, 1)}
                    className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-30"
                  >
                    <ArrowDown className="size-4" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Dupliquer l’annonce « ${label} »`}
                    title="Dupliquer cette annonce"
                    onClick={() => duplicateItem(item.id)}
                    className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  >
                    <Copy className="size-4" />
                  </button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Supprimer l’annonce « ${label} »`}
                    title="Supprimer cette annonce"
                    onClick={() => requestRemove(item.id)}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>

              {open ? (
                <div className="grid gap-3">
                  <SelectField<NewsKind>
                    label="Nature"
                    value={item.kind}
                    options={newsKindOrder.map((value) => ({
                      value,
                      label: newsKindLabels[value],
                    }))}
                    onChange={(kind) => updateItem(item.id, { kind })}
                    tip="Ne change que la pastille affichée sur l’affiche : le rendu de la carte est identique."
                  />
                  <ArtSourceField
                    label="Affiche"
                    ratio="2:3"
                    value={item.media}
                    tip="Format recommandé : 2:3 (portrait), par exemple 900 × 1350 px. La carte applique ce ratio de toute façon."
                    note="En mode « Recadré » (voir « Apparence »), une affiche qui n’est pas en 2:3 est rognée ; en mode « Entier », elle est affichée en totalité."
                    onChange={(media) => updateItem(item.id, { media })}
                  />
                  <TextField
                    label="Titre de l’annonce"
                    value={item.title}
                    placeholder="Ex. Exposition « Lumière minérale »"
                    onChange={(title) => updateItem(item.id, { title })}
                    hint="Affiché sous l’affiche. Laisser vide pour ne pas en afficher."
                  />
                  <TextAreaField
                    label="Texte"
                    value={item.text}
                    rows={3}
                    placeholder="Quelques lignes pour présenter l’annonce…"
                    onChange={(text) => updateItem(item.id, { text })}
                  />
                  <TextField
                    label="Date affichée (facultatif)"
                    type="date"
                    value={item.publishedAt}
                    onChange={(publishedAt) =>
                      updateItem(item.id, { publishedAt })
                    }
                    hint="Affichage seul : cette date ne range pas la liste. Pour mettre la plus récente en haut, utilisez « Trier par date décroissante » ou les flèches."
                  />
                  <div className="grid gap-3 rounded-md border border-dashed border-border bg-background/40 p-3">
                    <p className="text-[13px] font-semibold leading-snug text-foreground">
                      Bouton de l’annonce
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Le bouton n’apparaît que si un libellé et une destination
                      sont renseignés — et si l’affichage des boutons est actif
                      (voir « Apparence »).
                    </p>
                    <TextField
                      label="Libellé"
                      value={item.cta.label}
                      placeholder="Ex. En savoir plus"
                      onChange={(label) =>
                        updateItem(item.id, { cta: { ...item.cta, label } })
                      }
                    />
                    <LinkTargetSelect
                      value={item.cta.href}
                      onChange={(href) =>
                        updateItem(item.id, { cta: { ...item.cta, href } })
                      }
                      hint="Une adresse en https:// s’ouvre dans un nouvel onglet ; une page du site s’ouvre dans le même onglet."
                    />
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}

        {items.length === 0 ? (
          <p className="rounded-md border border-dashed border-border bg-background/50 px-3 py-4 text-center text-xs text-muted-foreground">
            Aucune annonce. Cliquez sur « Ajouter une actualité » pour créer la
            première.
          </p>
        ) : null}
      </EditorZone>

      {/* ---- Zone 3 — l'apparence ---- */}
      <EditorZone
        tone="detail"
        title="Apparence"
        scope="Le fond du cadre, la façon dont l’affiche occupe son format 2:3, et l’habillage du cadre et des boutons — pour toutes les annonces de la section."
      >
        <SelectField<NewsFrameTone>
          label="Fond du cadre"
          value={news.style.frameTone}
          options={newsFrameToneOrder.map((value) => ({
            value,
            label: newsFrameToneLabels[value],
          }))}
          onChange={(frameTone) =>
            patch({ style: { ...news.style, frameTone } })
          }
          tip="Le fond suit les jetons du thème : il s’adapte automatiquement au mode clair ou sombre."
        />
        <SelectField<NewsPosterFit>
          label="Affichage de l’affiche"
          value={news.style.posterFit}
          options={newsPosterFitOrder.map((value) => ({
            value,
            label: newsPosterFitLabels[value],
          }))}
          onChange={(posterFit) =>
            patch({ style: { ...news.style, posterFit } })
          }
          tip="Recadré : l’affiche remplit le cadre (une affiche qui n’est pas en 2:3 est rognée). Entier : l’affiche est montrée en totalité, le fond du cadre apparaît sur les côtés."
        />
        <TextField
          label="Arrondi du cadre (px)"
          type="number"
          value={String(news.style.radius)}
          onChange={(value) => {
            const parsed = parseBounded(value, 0, 40);
            if (parsed !== null) {
              patch({ style: { ...news.style, radius: parsed } });
            }
          }}
          hint="De 0 à 40 px."
        />
        <SelectField<GalleryShadowLevel>
          label="Ombre portée"
          value={news.style.shadow}
          options={galleryShadowOrder.map((value) => ({
            value,
            label: galleryShadowLabels[value],
          }))}
          onChange={(shadow) => patch({ style: { ...news.style, shadow } })}
        />
        <SwitchField
          label="Filet autour du cadre"
          description="Un trait fin souligne le cadre ; son épaisseur et sa couleur se règlent ci-dessous."
          checked={news.style.border.enabled}
          onChange={(enabled) =>
            patch({ style: { ...news.style, border: { ...news.style.border, enabled } } })
          }
        />
        {news.style.border.enabled ? (
          <>
            <TextField
              label="Épaisseur du filet (px)"
              type="number"
              value={String(news.style.border.width)}
              onChange={(value) => {
                const parsed = parseBounded(value, 0, 24);
                if (parsed !== null) {
                  patch({
                    style: {
                      ...news.style,
                      border: { ...news.style.border, width: parsed },
                    },
                  });
                }
              }}
              hint="De 0 à 24 px."
            />
            <ColorField
              label="Couleur du filet"
              value={news.style.border.color}
              onChange={(color) =>
                patch({
                  style: {
                    ...news.style,
                    border: { ...news.style.border, color },
                  },
                })
              }
            />
          </>
        ) : null}
        <SelectField<HeroCtaStyle>
          label="Style des boutons"
          value={news.style.ctaStyle}
          options={heroCtaStyleOrder.map((value) => ({
            value,
            label: heroCtaStyleLabels[value],
          }))}
          onChange={(ctaStyle) =>
            patch({ style: { ...news.style, ctaStyle } })
          }
          hint="S’applique aux boutons de toutes les annonces de cette section."
        />
        <SwitchField
          label="Afficher les boutons"
          description="Masquer les boutons ne supprime ni leurs libellés ni leurs destinations : les réactiver les fait réapparaître tels quels."
          checked={news.style.ctaShow}
          onChange={(ctaShow) => patch({ style: { ...news.style, ctaShow } })}
        />
      </EditorZone>

      {/* Confirmation de suppression — seulement quand plusieurs items sont en
          jeu (voir `requestRemove`). */}
      <Dialog
        open={pendingRemoveId !== null}
        onOpenChange={(open) => !open && setPendingRemoveId(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Supprimer cette annonce ?</DialogTitle>
            <DialogDescription>
              « {pendingRemove?.title.trim() || "sans titre"} » sera retirée de la
              section. Cette action ne peut pas être annulée.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPendingRemoveId(null)}
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (pendingRemoveId !== null) {
                  removeItem(pendingRemoveId);
                }
                setPendingRemoveId(null);
              }}
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
