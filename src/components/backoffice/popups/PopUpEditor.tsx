"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, RotateCcw, Trash2 } from "lucide-react";

import { usePagesStore } from "@/components/backoffice/PagesStoreProvider";
import { usePopUps } from "@/components/backoffice/popups/PopUpProvider";
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
  clearPopUpFrequencyStorage,
  POPUP_LIMITS,
  popUpContentKindLabels,
  popUpContentKindOrder,
  popUpFrequencyLabels,
  popUpFrequencyOrder,
  popUpLayoutLabels,
  popUpLayoutOrder,
  popUpScopeLabels,
  popUpScopeOrder,
  popUpSlidePositionLabels,
  popUpSlidePositionOrder,
  popUpTargetingModeLabels,
  popUpTargetingModeOrder,
  type PopUp,
  type PopUpContentKind,
  type PopUpFrequencyMode,
  type PopUpLayout,
  type PopUpScope,
  type PopUpSlidePosition,
  type PopUpTargetingMode,
} from "@/lib/popup";
import {
  heroCtaStyleLabels,
  heroCtaStyleOrder,
  moduleAnimationLabels,
  moduleAnimationOrder,
  type HeroCtaStyle,
  type ModuleAnimation,
} from "@/lib/pages";

import { ArtSourceField } from "../pages/modules/ArtSourceField";
import { EditorSubZone, EditorZone } from "../pages/modules/EditorZone";
import {
  parseBounded,
  SelectField,
  TextAreaField,
  TextField,
} from "../pages/modules/form-fields";
import { SwitchField } from "../pages/modules/gallery/fields";
import { LinkTargetSelect } from "../pages/modules/LinkTargetSelect";
import { PopUpPreview } from "./PopUpPreview";

/**
 * ============================================================================
 * ÉDITEUR — une pop-up (`/admin/popups/[id]`)
 * ----------------------------------------------------------------------------
 * Toutes les modifications sont appliquées au store (`updatePopUp`) et
 * persistées automatiquement par `PopUpProvider` (débounce + reprise). Aucun
 * bouton « Enregistrer » : il n'y a rien à perdre.
 *
 * Rubriques (une question utilisateur par zone, cf. `EditorZone`) :
 *   Contenu · Déclencheurs · Fréquence & ergonomie · Disposition & animation ·
 *   Ciblage · Aperçu.
 *
 * Le mode `lead` reste hors de l'UI tant que la destination des e-mails n'est
 * pas tranchée (décision produit du Lot C) ; un contenu `lead` hérité reste
 * éditable dans son libellé mais se rend publiquement comme un message.
 * ============================================================================
 */

export function PopUpEditor({ popupId }: { popupId: string }) {
  const router = useRouter();
  const { getPopUp, updatePopUp, deletePopUp } = usePopUps();
  const { pages } = usePagesStore();
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [resetDone, setResetDone] = React.useState(false);

  const found = getPopUp(popupId);

  if (!found) {
    return (
      <div className="grid gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Pop-up introuvable
        </h1>
        <p className="text-sm text-muted-foreground">
          Cette pop-up n’existe plus (elle a peut-être été supprimée).
        </p>
        <div>
          <Button variant="outline" onClick={() => router.push("/admin/popups")}>
            <ArrowLeft />
            Retour à la liste
          </Button>
        </div>
      </div>
    );
  }

  // Alias non optionnel : les fonctions ci-dessous capturent `popup` au lieu de
  // dépendre du rétrécissement de type, que TypeScript ne conserve pas au-delà
  // d'une frontière de fonction.
  const popup = found;

  const patch = (next: Partial<PopUp>): void => updatePopUp(popup.id, next);

  const contentKindOptions = popUpContentKindOrder.filter(
    (kind) => kind !== "lead" || popup.contentKind === "lead"
  );

  function resetDisplay(): void {
    clearPopUpFrequencyStorage(popup.id);
    setResetDone(true);
    window.setTimeout(() => setResetDone(false), 3000);
  }

  function toggleTargetPage(pageId: string): void {
    const selected = popup.targeting.pageIds.includes(pageId);
    patch({
      targeting: {
        ...popup.targeting,
        pageIds: selected
          ? popup.targeting.pageIds.filter((id) => id !== pageId)
          : [...popup.targeting.pageIds, pageId],
      },
    });
  }

  return (
    <div className="grid min-w-0 gap-6">
      {/* ---- En-tête ---- */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 mb-1"
            onClick={() => router.push("/admin/popups")}
          >
            <ArrowLeft />
            Pop-ups
          </Button>
          <h1 className="truncate text-2xl font-semibold tracking-tight text-foreground">
            {popup.name.trim() !== "" ? popup.name : "Pop-up sans nom"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Les modifications sont enregistrées automatiquement.
          </p>
        </div>
        <Button
          variant="ghost"
          onClick={() => setDeleteOpen(true)}
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 />
          Supprimer
        </Button>
      </div>

      {/* ---- Zone 1 — activation & nom ---- */}
      <EditorZone
        tone="content"
        title="Activation et nom"
        scope="Le nom sert uniquement à vous repérer dans l’administration ; il n’apparaît jamais sur le site."
      >
        <TextField
          label="Nom de la pop-up"
          value={popup.name}
          placeholder="Ex. Promo rentrée"
          onChange={(name) => patch({ name })}
        />
        <SwitchField
          label="Activer la pop-up"
          description="Une pop-up désactivée ne s’affiche jamais, même via un lien."
          checked={popup.enabled}
          onChange={(enabled) => patch({ enabled })}
        />
      </EditorZone>

      {/* ---- Zone 2 — contenu ---- */}
      <EditorZone
        tone="content"
        title="Contenu"
        scope="Ce que le visiteur lit dans la pop-up."
      >
        <SelectField<PopUpContentKind>
          label="Type de contenu"
          value={popup.contentKind}
          options={contentKindOptions.map((kind) => ({
            value: kind,
            label: popUpContentKindLabels[kind],
          }))}
          onChange={(contentKind) => patch({ contentKind })}
          hint="La capture d’e-mail sera disponible dans une prochaine étape."
        />
        <TextField
          label="Titre"
          value={popup.heading}
          placeholder="Ex. -20 % sur les séances portrait"
          onChange={(heading) => patch({ heading })}
        />
        <TextAreaField
          label="Texte"
          value={popup.body}
          rows={4}
          placeholder="Quelques mots pour accompagner le titre…"
          onChange={(body) => patch({ body })}
        />

        {popup.contentKind === "promo" ? (
          <TextField
            label="Code promotionnel"
            value={popup.promoCode}
            placeholder="Ex. RENTREE20"
            hint="Le visiteur pourra le copier d’un clic."
            onChange={(promoCode) => patch({ promoCode })}
          />
        ) : null}

        <EditorSubZone title="Illustration (optionnelle)">
          <SwitchField
            label="Afficher une image"
            checked={popup.media !== null}
            onChange={(on) => patch({ media: on ? { url: "", alt: "" } : null })}
          />
          {popup.media !== null ? (
            <ArtSourceField
              label="Image de la pop-up"
              ratio="16:9"
              value={popup.media}
              onChange={(media) => patch({ media })}
            />
          ) : null}
        </EditorSubZone>

        <EditorSubZone title="Bouton d’action (optionnel)">
          <SwitchField
            label="Afficher un bouton"
            checked={popup.cta.show}
            onChange={(show) => patch({ cta: { ...popup.cta, show } })}
          />
          {popup.cta.show ? (
            <>
              <TextField
                label="Libellé du bouton"
                value={popup.cta.label}
                placeholder="Ex. Voir les prestations"
                onChange={(label) => patch({ cta: { ...popup.cta, label } })}
              />
              <LinkTargetSelect
                label="Destination du bouton"
                value={popup.cta.href}
                onChange={(href) => patch({ cta: { ...popup.cta, href } })}
              />
              <SelectField<HeroCtaStyle>
                label="Style du bouton"
                value={popup.cta.style}
                options={heroCtaStyleOrder.map((style) => ({
                  value: style,
                  label: heroCtaStyleLabels[style],
                }))}
                onChange={(style) => patch({ cta: { ...popup.cta, style } })}
              />
            </>
          ) : null}
        </EditorSubZone>
      </EditorZone>

      {/* ---- Zone 3 — déclencheurs ---- */}
      <EditorZone
        tone="action"
        title="Déclencheurs"
        scope="Quand la pop-up s’ouvre d’elle-même. Sans aucun déclencheur, seule un lien manuel peut l’ouvrir."
      >
        <EditorSubZone title="Minuterie">
          <SwitchField
            label="Ouvrir après un délai"
            checked={popup.triggers.timer.enabled}
            onChange={(enabled) =>
              patch({
                triggers: {
                  ...popup.triggers,
                  timer: { ...popup.triggers.timer, enabled },
                },
              })
            }
          />
          <TextField
            label="Délai (secondes)"
            type="number"
            disabled={!popup.triggers.timer.enabled}
            value={String(popup.triggers.timer.delaySeconds)}
            onChange={(value) => {
              const parsed = parseBounded(
                value,
                POPUP_LIMITS.timerMin,
                POPUP_LIMITS.timerMax
              );
              if (parsed !== null) {
                patch({
                  triggers: {
                    ...popup.triggers,
                    timer: { ...popup.triggers.timer, delaySeconds: parsed },
                  },
                });
              }
            }}
            hint="De 0 à 120 secondes."
          />
        </EditorSubZone>

        <EditorSubZone title="Intention de sortie">
          <SwitchField
            label="Ouvrir quand la souris remonte vers le haut"
            description="Déclencheur classique de fin de visite. Sans effet sur téléphone et tablette."
            checked={popup.triggers.exitIntent.enabled}
            onChange={(enabled) =>
              patch({
                triggers: {
                  ...popup.triggers,
                  exitIntent: { ...popup.triggers.exitIntent, enabled },
                },
              })
            }
          />
        </EditorSubZone>

        <EditorSubZone title="Profondeur de défilement">
          <SwitchField
            label="Ouvrir après un défilement"
            checked={popup.triggers.scrollDepth.enabled}
            onChange={(enabled) =>
              patch({
                triggers: {
                  ...popup.triggers,
                  scrollDepth: { ...popup.triggers.scrollDepth, enabled },
                },
              })
            }
          />
          <TextField
            label="Pourcentage de la page parcouru"
            type="number"
            disabled={!popup.triggers.scrollDepth.enabled}
            value={String(popup.triggers.scrollDepth.percent)}
            onChange={(value) => {
              const parsed = parseBounded(
                value,
                POPUP_LIMITS.scrollMin,
                POPUP_LIMITS.scrollMax
              );
              if (parsed !== null) {
                patch({
                  triggers: {
                    ...popup.triggers,
                    scrollDepth: {
                      ...popup.triggers.scrollDepth,
                      percent: parsed,
                    },
                  },
                });
              }
            }}
            hint="De 10 à 100 %."
          />
        </EditorSubZone>

        <EditorSubZone title="Ouverture manuelle">
          <SwitchField
            label="Autoriser un lien « popup » à l’ouvrir"
            description="Un bouton dont la destination est cette pop-up l’ouvre au clic, même si la fréquence bloque l’ouverture automatique."
            checked={popup.triggers.click.enabled}
            onChange={(enabled) =>
              patch({
                triggers: {
                  ...popup.triggers,
                  click: { ...popup.triggers.click, enabled },
                },
              })
            }
          />
        </EditorSubZone>
      </EditorZone>

      {/* ---- Zone 4 — fréquence & ergonomie ---- */}
      <EditorZone
        tone="detail"
        title="Fréquence et ergonomie"
        scope="À quelle fréquence la pop-up revient, et son comportement sur téléphone."
      >
        <SelectField<PopUpFrequencyMode>
          label="Réapparition"
          value={popup.frequency.mode}
          options={popUpFrequencyOrder.map((mode) => ({
            value: mode,
            label: popUpFrequencyLabels[mode],
          }))}
          onChange={(mode) =>
            patch({ frequency: { ...popup.frequency, mode } })
          }
        />
        {popup.frequency.mode === "days" ? (
          <TextField
            label="Nombre de jours"
            type="number"
            value={String(popup.frequency.days)}
            onChange={(value) => {
              const parsed = parseBounded(
                value,
                POPUP_LIMITS.daysMin,
                POPUP_LIMITS.daysMax
              );
              if (parsed !== null) {
                patch({ frequency: { ...popup.frequency, days: parsed } });
              }
            }}
            hint="De 1 à 365 jours."
          />
        ) : null}
        <SwitchField
          label="Ouvrir automatiquement sur téléphone"
          description="Désactivé par défaut : les déclencheurs automatiques (minuterie, défilement, intention de sortie) ne se lancent pas sur téléphone. Le clic manuel reste actif."
          checked={popup.mobileAutoOpen}
          onChange={(mobileAutoOpen) => patch({ mobileAutoOpen })}
        />
        <SwitchField
          label="Ne plus afficher après une inscription"
          description="S’applique au formulaire de capture d’e-mail (à venir)."
          checked={popup.frequency.suppressAfterSubmit}
          onChange={(suppressAfterSubmit) =>
            patch({ frequency: { ...popup.frequency, suppressAfterSubmit } })
          }
        />

        <EditorSubZone title="Réinitialiser l’affichage">
          <p className="text-xs text-muted-foreground">
            Si vous ne voyez plus votre pop-up alors qu’elle est active, c’est
            souvent la fréquence (déjà vue dans cette session ou ces derniers
            jours). Ce bouton efface la mémoire d’affichage de cette pop-up sur
            votre navigateur.
          </p>
          <Button type="button" variant="outline" onClick={resetDisplay}>
            <RotateCcw />
            Réinitialiser l’affichage
          </Button>
          {resetDone ? (
            <p role="status" className="text-xs text-emerald-600">
              Mémoire d’affichage effacée. Rechargez votre site pour revoir la
              pop-up.
            </p>
          ) : null}
        </EditorSubZone>
      </EditorZone>

      {/* ---- Zone 5 — disposition & animation ---- */}
      <EditorZone
        tone="style"
        title="Disposition et animation"
        scope="La forme de la pop-up et son apparition."
      >
        <SelectField<PopUpLayout>
          label="Format"
          value={popup.layout}
          options={popUpLayoutOrder.map((layout) => ({
            value: layout,
            label: popUpLayoutLabels[layout],
          }))}
          onChange={(layout) => patch({ layout })}
        />
        {popup.layout === "slide-in" ? (
          <SelectField<PopUpSlidePosition>
            label="Position du panneau"
            value={popup.slidePosition}
            options={popUpSlidePositionOrder.map((position) => ({
              value: position,
              label: popUpSlidePositionLabels[position],
            }))}
            onChange={(slidePosition) => patch({ slidePosition })}
          />
        ) : (
          <>
            <SwitchField
              label="Assombrir la page derrière la pop-up"
              checked={popup.overlay}
              onChange={(overlay) => patch({ overlay })}
            />
            <SwitchField
              label="Fermer au clic sur le fond sombre"
              description="La croix et la touche Échap fonctionnent toujours."
              checked={popup.dismissOnOverlay}
              onChange={(dismissOnOverlay) => patch({ dismissOnOverlay })}
            />
          </>
        )}
        <SelectField<ModuleAnimation>
          label="Animation d’apparition"
          value={popup.animation}
          options={moduleAnimationOrder.map((animation) => ({
            value: animation,
            label: moduleAnimationLabels[animation],
          }))}
          onChange={(animation) => patch({ animation })}
        />
      </EditorZone>

      {/* ---- Zone 6 — ciblage ---- */}
      <EditorZone
        tone="detail"
        title="Ciblage"
        scope="Où la pop-up peut apparaître. Une pop-up de page est choisie depuis la page concernée (« Pages › Modifier la page »)."
      >
        <SelectField<PopUpScope>
          label="Portée"
          value={popup.scope}
          options={popUpScopeOrder.map((scope) => ({
            value: scope,
            label: popUpScopeLabels[scope],
          }))}
          onChange={(scope) => patch({ scope })}
          hint="Une pop-up « de page » se rattache depuis la fiche de la page."
        />
        {popup.scope === "global" ? (
          <>
            <SelectField<PopUpTargetingMode>
              label="Pages concernées"
              value={popup.targeting.mode}
              options={popUpTargetingModeOrder.map((mode) => ({
                value: mode,
                label: popUpTargetingModeLabels[mode],
              }))}
              onChange={(mode) =>
                patch({ targeting: { ...popup.targeting, mode } })
              }
            />
            {popup.targeting.mode === "pages" ? (
              <EditorSubZone title="Pages choisies">
                {pages.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Aucune page disponible.
                  </p>
                ) : (
                  <ul className="grid max-h-56 gap-1 overflow-y-auto">
                    {pages.map((page) => (
                      <li key={page.id}>
                        <label className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted">
                          <input
                            type="checkbox"
                            checked={popup.targeting.pageIds.includes(page.id)}
                            onChange={() => toggleTargetPage(page.id)}
                          />
                          <span className="min-w-0 truncate">
                            {page.title.trim() !== ""
                              ? page.title
                              : page.menuTitle}
                          </span>
                          {page.isHome ? (
                            <span className="text-xs text-muted-foreground">
                              (accueil)
                            </span>
                          ) : null}
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
              </EditorSubZone>
            ) : null}
          </>
        ) : (
          <p className="text-xs text-muted-foreground">
            Rattachez cette pop-up à une page depuis « Pages › Modifier la page
            › Pop-up de cette page ».
          </p>
        )}
      </EditorZone>

      {/* ---- Zone 7 — aperçu ---- */}
      <EditorZone
        tone="detail"
        title="Aperçu"
        scope="Rendu réel de la pop-up, avec la palette du site. L’aperçu ignore la fréquence : il s’affiche toujours."
        className="min-w-0"
      >
        <PopUpPreview popup={popup} />
      </EditorZone>

      {/* ---- Suppression ---- */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Supprimer cette pop-up ?</DialogTitle>
            <DialogDescription>
              Cette action est définitive. Les pages qui la portaient restent en
              ligne, simplement sans pop-up.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                deletePopUp(popup.id);
                router.push("/admin/popups");
              }}
            >
              <Trash2 />
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
