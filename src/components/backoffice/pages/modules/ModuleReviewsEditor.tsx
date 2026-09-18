"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  heroAutoplaySpeedLabels,
  heroAutoplaySpeedOrder,
  resolveReviewsContent,
  reviewProviderLabels,
  reviewProviderOrder,
  type HeroAutoplaySpeed,
  type ModuleContent,
  type ReviewItem,
  type ReviewProvider,
  type ReviewsContent,
} from "@/lib/pages";

import { EditorZone } from "./EditorZone";
import { SelectField, TextAreaField, TextField } from "./form-fields";
import { SwitchField } from "./gallery/fields";

/**
 * ============================================================================
 * ÉDITEUR DE CONTENU — Module « Avis clients » (Étape 14.4)
 * ----------------------------------------------------------------------------
 * Trois `EditorZone` :
 *   1. 🧾 En-tête et fournisseur — titre, logo, mot d'accroche, note et légende ;
 *   2. 💬 Avis — liste ajout / suppression (patron de la FAQ) ;
 *   3. 🎞️ Défilement — vitesse (celles du Héro) et pause au survol.
 *
 * Le contenu est **normalisé** (`resolveReviewsContent`) avant édition : un JSONB
 * tronqué ne doit pas faire apparaître d'`undefined` dans les champs.
 *
 * La note est saisie au champ, comme partout dans le projet (aucun `RangeField`
 * n'existe) ; `parseBounded` ne convient pas ici car il arrondit à l'entier, d'où
 * le parser décimal local.
 * ============================================================================
 */

type ModuleReviewsEditorProps = {
  content: Extract<ModuleContent, { type: "reviews" }>;
  onChangeContent: (content: ReviewsContent) => void;
};

/** Convertit une saisie en note décimale bornée (`null` si invalide). */
function parseScore(value: string, min: number, max: number): number | null {
  // La virgule est acceptée : le champ est en `type="number"`, mais un clavier
  // français peut produire « 4,5 » selon le navigateur.
  const parsed = Number.parseFloat(value.replace(",", "."));
  if (Number.isNaN(parsed)) {
    return null;
  }
  return Math.min(Math.max(parsed, min), max);
}

export function ModuleReviewsEditor({
  content,
  onChangeContent,
}: ModuleReviewsEditorProps) {
  // Contenu **complet** avant édition : un JSONB tronqué ne doit pas faire
  // apparaître d'`undefined` dans les champs.
  const reviews = React.useMemo<ReviewsContent>(
    () => resolveReviewsContent(content),
    [content]
  );

  type ReviewsPatch = Partial<Omit<ReviewsContent, "type">>;

  function patch(next: ReviewsPatch) {
    onChangeContent({
      ...reviews,
      // `??` et non `||` : un champ vidé (textes) doit rester vide.
      heading: next.heading ?? reviews.heading,
      provider: next.provider ?? reviews.provider,
      summaryWord: next.summaryWord ?? reviews.summaryWord,
      overallScore: next.overallScore ?? reviews.overallScore,
      totalReviewsText: next.totalReviewsText ?? reviews.totalReviewsText,
      reviews: next.reviews ?? reviews.reviews,
      autoplaySpeedMs: next.autoplaySpeedMs ?? reviews.autoplaySpeedMs,
      pauseOnHover: next.pauseOnHover ?? reviews.pauseOnHover,
    });
  }

  function updateItem(itemId: string, next: Partial<ReviewItem>) {
    patch({
      reviews: reviews.reviews.map((item) =>
        item.id === itemId ? { ...item, ...next } : item
      ),
    });
  }

  function removeItem(itemId: string) {
    patch({
      reviews: reviews.reviews.filter((item) => item.id !== itemId),
    });
  }

  function addItem() {
    patch({
      reviews: [
        ...reviews.reviews,
        {
          id: crypto.randomUUID(),
          author: "Nom du client",
          initial: "",
          timeAgo: "",
          rating: 5,
          comment: "Rédigez le commentaire…",
          isVerified: true,
        },
      ],
    });
  }

  return (
    <div className="grid gap-4">
      {/* ---- Zone 1 — en-tête et fournisseur ---- */}
      <EditorZone
        tone="content"
        title="En-tête et fournisseur"
        scope="Le titre de la section, le logo du fournisseur d’avis et la note de synthèse affichés sur le site public."
      >
        <TextField
          label="Titre affiché sur le site"
          value={reviews.heading}
          placeholder="Ex. Ils me font confiance"
          hint="Laissez vide pour masquer le titre."
          onChange={(heading) => patch({ heading })}
        />
        <SelectField<ReviewProvider>
          label="Fournisseur d’avis"
          value={reviews.provider}
          options={reviewProviderOrder.map((value) => ({
            value,
            label: reviewProviderLabels[value],
          }))}
          onChange={(provider) => patch({ provider })}
          tip="Ne change que le logo affiché : les avis sont saisis à la main, aucun compte n’est connecté."
        />
        <TextField
          label="Mot d’accroche"
          value={reviews.summaryWord}
          placeholder="Ex. EXCELLENT"
          onChange={(summaryWord) => patch({ summaryWord })}
        />
        <TextField
          label="Note globale (sur 5)"
          type="number"
          value={String(reviews.overallScore)}
          onChange={(value) => {
            const parsed = parseScore(value, 0, 5);
            if (parsed !== null) {
              patch({ overallScore: parsed });
            }
          }}
          hint="De 0 à 5. Une décimale est autorisée (ex. 4,5)."
        />
        <TextField
          label="Légende du nombre d’avis"
          value={reviews.totalReviewsText}
          placeholder="Ex. Basé sur 10 avis"
          onChange={(totalReviewsText) => patch({ totalReviewsText })}
        />
      </EditorZone>

      {/* ---- Zone 2 — les avis ---- */}
      <EditorZone
        tone="content"
        title="Avis"
        scope="Les avis affichés dans le carrousel : auteur, ancienneté, note et commentaire. Sans aucun avis, la section n’apparaît pas sur le site."
      >
        <div className="grid gap-3">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-semibold leading-snug text-foreground">
              Avis ({reviews.reviews.length})
            </p>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus />
              Ajouter un avis
            </Button>
          </div>

          {reviews.reviews.map((item, itemIndex) => (
            <div
              key={item.id}
              className="grid gap-3 rounded-md border border-dashed border-border bg-background/40 p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-muted-foreground">
                  Avis {itemIndex + 1}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Supprimer l’avis de « ${item.author || "sans nom"} »`}
                  title="Supprimer cet avis"
                  onClick={() => removeItem(item.id)}
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 />
                </Button>
              </div>
              <TextField
                label="Nom du client"
                value={item.author}
                placeholder="Ex. Camille D."
                onChange={(author) => updateItem(item.id, { author })}
              />
              <TextField
                label="Initiale affichée (facultatif)"
                value={item.initial}
                placeholder="Laisser vide pour la première lettre du nom"
                onChange={(initial) => updateItem(item.id, { initial })}
              />
              <TextField
                label="Ancienneté"
                value={item.timeAgo}
                placeholder="Ex. il y a 2 semaines"
                onChange={(timeAgo) => updateItem(item.id, { timeAgo })}
              />
              <TextField
                label="Note (sur 5)"
                type="number"
                value={String(item.rating)}
                onChange={(value) => {
                  const parsed = parseScore(value, 0, 5);
                  if (parsed !== null) {
                    updateItem(item.id, { rating: parsed });
                  }
                }}
                hint="De 0 à 5. Une décimale est autorisée (ex. 3,5)."
              />
              <TextAreaField
                label="Commentaire"
                value={item.comment}
                rows={3}
                placeholder="Le texte de l’avis…"
                onChange={(comment) => updateItem(item.id, { comment })}
              />
              <SwitchField
                label="Avis vérifié"
                description="Affiche la pastille « Avis vérifié » sur la carte."
                checked={item.isVerified}
                onChange={(isVerified) =>
                  updateItem(item.id, { isVerified })
                }
              />
            </div>
          ))}

          {reviews.reviews.length === 0 ? (
            <p className="rounded-md border border-dashed border-border bg-background/50 px-3 py-4 text-center text-xs text-muted-foreground">
              Aucun avis. Cliquez sur « Ajouter un avis » pour créer le premier.
            </p>
          ) : null}
        </div>
      </EditorZone>

      {/* ---- Zone 3 — le défilement ---- */}
      <EditorZone
        tone="detail"
        title="Défilement"
        scope="La vitesse du carrousel et son comportement au survol ou au focus clavier."
      >
        <SelectField
          label="Vitesse de défilement"
          value={String(reviews.autoplaySpeedMs)}
          options={heroAutoplaySpeedOrder.map((value) => ({
            value: String(value),
            label: heroAutoplaySpeedLabels[value],
          }))}
          onChange={(speed) =>
            patch({ autoplaySpeedMs: Number(speed) as HeroAutoplaySpeed })
          }
          tip="Le défilement s’arrête automatiquement si le visiteur préfère limiter les animations."
        />
        <SwitchField
          label="Mettre en pause au survol"
          description="Le carrousel s’arrête quand le curseur le survole ou que le clavier le parcourt, et repart ensuite."
          checked={reviews.pauseOnHover}
          onChange={(pauseOnHover) => patch({ pauseOnHover })}
        />
      </EditorZone>
    </div>
  );
}
