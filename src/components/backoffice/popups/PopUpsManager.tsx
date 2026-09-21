"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";

import { usePopUps } from "@/components/backoffice/popups/PopUpProvider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  popUpFrequencyLabels,
  popUpLayoutLabels,
  popUpScopeLabels,
  popUpTargetingModeLabels,
  hasAnyTrigger,
  type PopUp,
} from "@/lib/popup";

/**
 * ============================================================================
 * ÉCRAN — Gestion des Pop-ups (liste)
 * ----------------------------------------------------------------------------
 * Client Component branché sur `PopUpProvider`. On y crée (la pop-up est créée
 * dans le store, puis on navigue vers son éditeur — c'est là que tout se règle),
 * on active/désactive, on supprime (confirmation) et on ouvre l'éditeur.
 *
 * La colonne « Déclenchement » résume les triggers actifs et signale une pop-up
 * activée mais **sans aucun déclencheur** : elle ne s'ouvrirait jamais d'elle-
 * même (seul un lien manuel `popup:<id>` pourrait l'ouvrir) — c'est la première
 * cause d'« elle ne s'affiche pas ».
 * ============================================================================
 */

/** Résumé lisible des déclencheurs automatiques actifs. */
function triggerSummary(popup: PopUp): string {
  const parts: string[] = [];
  if (popup.triggers.timer.enabled) {
    parts.push(`Après ${popup.triggers.timer.delaySeconds} s`);
  }
  if (popup.triggers.exitIntent.enabled) {
    parts.push("Intention de sortie");
  }
  if (popup.triggers.scrollDepth.enabled) {
    parts.push(`À ${popup.triggers.scrollDepth.percent} % de défilement`);
  }
  if (popup.triggers.click.enabled) {
    parts.push("Au clic (lien)");
  }
  if (parts.length === 0) {
    return "Aucun déclencheur";
  }
  return parts.join(" · ");
}

export function PopUpsManager() {
  const router = useRouter();
  const { popups, createPopUp, updatePopUp, deletePopUp } = usePopUps();
  const [deleteTarget, setDeleteTarget] = React.useState<PopUp | null>(null);

  const enabledCount = popups.filter((popup) => popup.enabled).length;

  function handleCreate() {
    const created = createPopUp();
    router.push(`/admin/popups/${created.id}`);
  }

  function confirmDelete() {
    if (!deleteTarget) {
      return;
    }
    deletePopUp(deleteTarget.id);
    setDeleteTarget(null);
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Pop-ups
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {popups.length} pop-up{popups.length > 1 ? "s" : ""} ·{" "}
            {enabledCount} activée{enabledCount > 1 ? "s" : ""} · une seule
            s’affiche par page
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus />
          Nouvelle pop-up
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[52rem] border-collapse text-left text-sm">
            <caption className="sr-only">
              Liste des pop-ups du site.
            </caption>
            <thead>
              <tr className="border-b border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <th scope="col" className="px-4 py-3 font-semibold">
                  Pop-up
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Portée
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Format
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Déclenchement
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Fréquence
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Active
                </th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {popups.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    Aucune pop-up pour le moment. Créez votre première pop-up.
                  </td>
                </tr>
              ) : (
                popups.map((popup) => {
                  const noTrigger =
                    !hasAnyTrigger(popup.triggers) &&
                    !popup.triggers.click.enabled;
                  return (
                    <tr
                      key={popup.id}
                      className="border-b border-border last:border-b-0 hover:bg-muted/30"
                    >
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => router.push(`/admin/popups/${popup.id}`)}
                          className="text-left font-medium text-foreground underline-offset-4 hover:underline"
                        >
                          {popup.name.trim() !== ""
                            ? popup.name
                            : "Pop-up sans nom"}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge variant="secondary">
                            {popUpScopeLabels[popup.scope]}
                          </Badge>
                          {popup.scope === "global" ? (
                            <span className="text-xs text-muted-foreground">
                              {popUpTargetingModeLabels[popup.targeting.mode]}
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {popUpLayoutLabels[popup.layout]}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            noTrigger
                              ? "text-xs font-medium text-destructive"
                              : "text-xs text-muted-foreground"
                          }
                        >
                          {triggerSummary(popup)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {popUpFrequencyLabels[popup.frequency.mode]}
                      </td>
                      <td className="px-4 py-3">
                        <Switch
                          checked={popup.enabled}
                          onCheckedChange={(enabled) =>
                            updatePopUp(popup.id, { enabled })
                          }
                          aria-label={`Activer la pop-up « ${
                            popup.name.trim() !== ""
                              ? popup.name
                              : "sans nom"
                          } »`}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              router.push(`/admin/popups/${popup.id}`)
                            }
                            aria-label={`Modifier la pop-up « ${
                              popup.name.trim() !== ""
                                ? popup.name
                                : "sans nom"
                            } »`}
                            title="Modifier"
                          >
                            <Pencil />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteTarget(popup)}
                            aria-label={`Supprimer la pop-up « ${
                              popup.name.trim() !== ""
                                ? popup.name
                                : "sans nom"
                            } »`}
                            title="Supprimer"
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Supprimer cette pop-up ?</DialogTitle>
            <DialogDescription>
              La pop-up «{" "}
              {deleteTarget !== null && deleteTarget.name.trim() !== ""
                ? deleteTarget.name
                : "sans nom"}{" "}
              » sera définitivement supprimée. Les pages qui la portaient
              restent en ligne, simplement sans pop-up.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              <Trash2 />
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
