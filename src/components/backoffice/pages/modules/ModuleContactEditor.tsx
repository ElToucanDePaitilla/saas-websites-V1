"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, ChevronDown, Copy, Plus, Trash2 } from "lucide-react";

import { ColorField } from "@/components/backoffice/shared/ColorField";
import { Button } from "@/components/ui/button";
import {
  CONTACT_ATTACHMENT_FORMATS,
  CONTACT_MAX_FILE_SIZE_MB,
  CONTACT_PRACTICAL_INFO_ENABLED,
  contactAlignLabels,
  contactAlignOrder,
  contactFrameColorTokenLabels,
  contactFrameColorTokenOrder,
  contactSocialAlignmentLabels,
  contactSocialAlignmentOrder,
  contactSocialColorModeLabels,
  contactSocialColorModeOrder,
  contactSocialNetworkLabels,
  contactSocialNetworkOrder,
  contactSocialShapeLabels,
  contactSocialShapeOrder,
  createContactContent,
  createContactSocialLink,
  resolveContactContent,
  type ContactAlign,
  type ContactContent,
  type ContactFormSettings,
  type ContactFrameColorToken,
  type ContactFrameSettings,
  type ContactInfoSettings,
  type ContactLayoutSettings,
  type ContactSocialAlignment,
  type ContactSocialColorMode,
  type ContactSocialLink,
  type ContactSocialNetwork,
  type ContactSocialShape,
  type ContactSocialStyle,
  type ContactStyleSettings,
  type ModuleContent,
} from "@/lib/pages";

import { EditorSubZone, EditorZone } from "./EditorZone";
import { parseBounded, SelectField, TextAreaField, TextField } from "./form-fields";
import { SwitchField } from "./gallery/fields";

/**
 * ============================================================================
 * ÉDITEUR DE CONTENU — Module « Contact & localisation » (Étape 14.1)
 * ----------------------------------------------------------------------------
 * Cinq `EditorZone` :
 *   1. 📝 Chapeau — titre, sous-titre, description, alignement ;
 *   2. 📇 Coordonnées & visibilité — un interrupteur **maître** puis huit
 *      interrupteurs de ligne. Un champ masqué reste **visible mais désactivé** :
 *      on doit pouvoir corriger une valeur sans devoir la réafficher d'abord ;
 *      la sous-zone « Informations pratiques » n'est plus rendue (D6) ;
 *   3. 📨 Formulaire — taille et formats de pièce jointe, case CGU et son lien ;
 *   4. 🖼️ Cadres des conteneurs — épaisseur, couleur de thème et arrondi du
 *      cadre partagé par les conteneurs 2 et 3 (14.1.c) ;
 *   5. 🔗 Réseaux sociaux — apparence de section puis liste ordonnée
 *      (ajout / duplication / suppression / montée / descente), à la manière de
 *      `ModuleCardsEditor`. Ni glisser-déposer, ni `react-hook-form`.
 *
 * Deux choix de présentation :
 *   - la **forme**, l'**alignement** et le **mode couleur** sont des réglages de
 *     **section**, donc posés au-dessus de la liste ; les répéter par lien
 *     laisserait croire qu'ils varient d'un réseau à l'autre ;
 *   - le `ColorField` n'apparaît qu'en mode `custom` : un réglage sans objet est
 *     un piège (précédent `ctaShow` / `ctaStyle`, étape 13.3).
 * ============================================================================
 */

/** Début de phrase (libellés d'accordéon). */
function excerpt(text: string, max = 48): string {
  if (text.length <= max) {
    return text;
  }
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

type ModuleContactEditorProps = {
  content: Extract<ModuleContent, { type: "contact" }>;
  onChangeContent: (content: ContactContent) => void;
};

export function ModuleContactEditor({
  content,
  onChangeContent,
}: ModuleContactEditorProps) {
  // Contenu **complet** avant édition : un contenu hérité (email / phone /
  // address à plat) ou tronqué ne doit pas faire apparaître d'`undefined`.
  const contact = React.useMemo<ContactContent>(
    // `keepEmptySocialNetworks` : en édition, un réseau tout juste ajouté n'a pas
    // encore d'adresse. Sans cette option, le résolveur l'écarterait au rendu
    // suivant et le bouton « Ajouter un réseau » semblerait sans effet.
    () => resolveContactContent(content, { keepEmptySocialNetworks: true }),
    [content]
  );

  const [openSocialId, setOpenSocialId] = React.useState<string>("");

  const { info, form, social, layout, style } = contact;
  const visibility = layout.visibility;
  /** Interrupteur maître fermé : tous les champs du container 2 sont verrouillés. */
  const masterOff = !visibility.showContainer2;
  const lock = (fieldVisible: boolean) => masterOff || !fieldVisible;

  type ContactPatch = Partial<{
    heading: string;
    subtitle: string;
    intro: string;
    info: ContactInfoSettings;
    form: ContactFormSettings;
    social: ContactSocialLink[];
    layout: ContactLayoutSettings;
    style: ContactStyleSettings;
  }>;

  function patch(next: ContactPatch) {
    onChangeContent({
      ...contact,
      // `??` et non `||` : un champ vidé doit rester vide.
      heading: next.heading ?? contact.heading,
      subtitle: next.subtitle ?? contact.subtitle,
      intro: next.intro ?? contact.intro,
      info: next.info ?? contact.info,
      form: next.form ?? contact.form,
      social: next.social ?? contact.social,
      layout: next.layout ?? contact.layout,
      style: next.style ?? contact.style,
    });
  }

  function patchVisibility(next: Partial<ContactLayoutSettings["visibility"]>) {
    patch({
      layout: {
        ...layout,
        visibility: { ...visibility, ...next },
      },
    });
  }

  function patchSocialStyle(next: Partial<ContactSocialStyle>) {
    // `...style` : depuis l'ajout du cadre, `style` porte aussi `frame` — écrire
    // `{ social }` seul effacerait le cadre à chaque réglage d'icône.
    patch({ style: { ...style, social: { ...style.social, ...next } } });
  }

  function patchFrameStyle(next: Partial<ContactFrameSettings>) {
    patch({ style: { ...style, frame: { ...style.frame, ...next } } });
  }

  function replaceSocial(transform: (list: ContactSocialLink[]) => ContactSocialLink[]) {
    patch({ social: transform(social) });
  }

  function addSocial() {
    // Premier réseau du catalogue non encore utilisé, sinon le premier tout court.
    const used = new Set(social.map((link) => link.network));
    const network =
      contactSocialNetworkOrder.find((candidate) => !used.has(candidate)) ??
      contactSocialNetworkOrder[0];
    const link = createContactSocialLink(network, "");
    replaceSocial((list) => [...list, link]);
    setOpenSocialId(link.id);
  }

  function duplicateSocial(id: string) {
    const index = social.findIndex((link) => link.id === id);
    const source = social[index];
    if (source === undefined) {
      return;
    }
    const copy: ContactSocialLink = { ...source, id: crypto.randomUUID() };
    replaceSocial((list) => {
      const next = [...list];
      next.splice(index + 1, 0, copy);
      return next;
    });
    setOpenSocialId(copy.id);
  }

  function removeSocial(id: string) {
    replaceSocial((list) => list.filter((link) => link.id !== id));
  }

  function moveSocial(id: string, direction: -1 | 1) {
    const index = social.findIndex((link) => link.id === id);
    const target = index + direction;
    if (index === -1 || target < 0 || target >= social.length) {
      return;
    }
    replaceSocial((list) => {
      const next = [...list];
      const [moved] = next.splice(index, 1);
      next.splice(target, 0, moved);
      return next;
    });
  }

  function updateSocial(id: string, next: Partial<ContactSocialLink>) {
    replaceSocial((list) =>
      list.map((link) => (link.id === id ? { ...link, ...next } : link))
    );
  }

  /** Active / désactive une extension autorisée (catalogue fermé). */
  function toggleExtension(extension: string, enabled: boolean) {
    const next = enabled
      ? [...form.allowedExtensions, extension]
      : form.allowedExtensions.filter((value) => value !== extension);
    patch({ form: { ...form, allowedExtensions: Array.from(new Set(next)) } });
  }

  return (
    <div className="grid gap-4">
      {/* ---- Zone 1 — le chapeau ---- */}
      <EditorZone
        tone="content"
        title="Chapeau"
        scope="Le titre, le sous-titre et la phrase d’introduction affichés au-dessus des coordonnées et du formulaire, sur le site public."
      >
        <TextField
          label="Titre de la section (H2)"
          value={contact.heading}
          placeholder="Ex. Contactez-moi"
          onChange={(heading) => patch({ heading })}
        />
        <TextField
          label="Sous-titre"
          value={contact.subtitle}
          placeholder="Ex. Une question, un projet ?"
          onChange={(subtitle) => patch({ subtitle })}
        />
        <TextAreaField
          label="Phrase d’introduction"
          value={contact.intro}
          rows={2}
          hint="Quelques mots d’accroche. Les retours à la ligne sont conservés."
          onChange={(intro) => patch({ intro })}
        />
        <SelectField<ContactAlign>
          label="Alignement du chapeau"
          value={layout.align}
          options={contactAlignOrder.map((value) => ({
            value,
            label: contactAlignLabels[value],
          }))}
          onChange={(align) => patch({ layout: { ...layout, align } })}
        />
      </EditorZone>

      {/* ---- Zone 2 — coordonnées et visibilité ---- */}
      <EditorZone
        tone="detail"
        title="Coordonnées & visibilité"
        scope="Ce que le visiteur voit, ligne par ligne. Un champ désactivé ici reste enregistré : le décocher le masque sur le site public, il ne l’efface pas."
      >
        <SwitchField
          label="Afficher le bloc coordonnées"
          description="Décoché, le formulaire occupe seul la largeur, centré."
          checked={visibility.showContainer2}
          onChange={(showContainer2) => patchVisibility({ showContainer2 })}
        />

        <EditorSubZone title="Identité">
          <SwitchField
            label="Afficher le nom"
            checked={visibility.showName}
            onChange={(showName) => patchVisibility({ showName })}
          />
          <TextField
            label="Nom affiché"
            value={info.name}
            disabled={lock(visibility.showName)}
            placeholder="Ex. Studio Lumière"
            onChange={(name) => patch({ info: { ...info, name } })}
          />
          <SwitchField
            label="Afficher le slogan"
            checked={visibility.showSlogan}
            onChange={(showSlogan) => patchVisibility({ showSlogan })}
          />
          <TextField
            label="Slogan"
            value={info.slogan}
            disabled={lock(visibility.showSlogan)}
            placeholder="Ex. Photographe portrait & mariage"
            onChange={(slogan) => patch({ info: { ...info, slogan } })}
          />
        </EditorSubZone>

        <EditorSubZone title="Adresse">
          <SwitchField
            label="Afficher l’adresse"
            description="Masque les six lignes de l’adresse d’un seul geste."
            checked={visibility.showAddressGroup}
            onChange={(showAddressGroup) => patchVisibility({ showAddressGroup })}
          />
          <TextField
            label="Raison sociale"
            value={info.address.proName}
            disabled={lock(visibility.showAddressGroup)}
            onChange={(proName) =>
              patch({ info: { ...info, address: { ...info.address, proName } } })
            }
          />
          <TextField
            label="Adresse (ligne 1)"
            value={info.address.address1}
            disabled={lock(visibility.showAddressGroup)}
            onChange={(address1) =>
              patch({ info: { ...info, address: { ...info.address, address1 } } })
            }
          />
          <TextField
            label="Adresse (ligne 2)"
            value={info.address.address2}
            disabled={lock(visibility.showAddressGroup)}
            onChange={(address2) =>
              patch({ info: { ...info, address: { ...info.address, address2 } } })
            }
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField
              label="Code postal"
              value={info.address.postalCode}
              disabled={lock(visibility.showAddressGroup)}
              onChange={(postalCode) =>
                patch({
                  info: { ...info, address: { ...info.address, postalCode } },
                })
              }
            />
            <TextField
              label="Ville"
              value={info.address.city}
              disabled={lock(visibility.showAddressGroup)}
              onChange={(city) =>
                patch({ info: { ...info, address: { ...info.address, city } } })
              }
            />
          </div>
          <TextField
            label="Pays"
            value={info.address.country}
            disabled={lock(visibility.showAddressGroup)}
            onChange={(country) =>
              patch({ info: { ...info, address: { ...info.address, country } } })
            }
          />
        </EditorSubZone>

        <EditorSubZone title="Téléphone & e-mail">
          <SwitchField
            label="Afficher le téléphone fixe"
            checked={visibility.showLandline}
            onChange={(showLandline) => patchVisibility({ showLandline })}
          />
          <TextField
            label="Téléphone fixe"
            type="tel"
            value={info.landline}
            disabled={lock(visibility.showLandline)}
            autoComplete="tel"
            onChange={(landline) => patch({ info: { ...info, landline } })}
          />
          <SwitchField
            label="Afficher le mobile"
            checked={visibility.showMobile}
            onChange={(showMobile) => patchVisibility({ showMobile })}
          />
          <TextField
            label="Mobile"
            type="tel"
            value={info.mobile}
            disabled={lock(visibility.showMobile)}
            autoComplete="tel"
            onChange={(mobile) => patch({ info: { ...info, mobile } })}
          />
          <SwitchField
            label="Afficher l’e-mail"
            checked={visibility.showEmail}
            onChange={(showEmail) => patchVisibility({ showEmail })}
          />
          <TextField
            label="E-mail public"
            type="email"
            value={info.email}
            disabled={lock(visibility.showEmail)}
            autoComplete="email"
            onChange={(email) => patch({ info: { ...info, email } })}
          />
        </EditorSubZone>

        {/* Rubrique retirée de la vue (D6), code conservé : le sous-bloc
            « Informations pratiques » a été jugé hors sujet dans le parcours de
            contact, mais ses champs, ses interrupteurs et sa donnée restent
            intacts — un seul booléen de domaine les réaffiche, par exemple le
            jour où ce bloc est réemployé dans un module « À propos ». Le
            supprimer aurait fait perdre la donnée des pages existantes. */}
        {CONTACT_PRACTICAL_INFO_ENABLED ? (
          <EditorSubZone title="Informations pratiques">
            <SwitchField
              label="Afficher les horaires"
              checked={visibility.showHours}
              onChange={(showHours) => patchVisibility({ showHours })}
            />
            <TextAreaField
              label="Horaires"
              value={info.hours}
              rows={2}
              disabled={lock(visibility.showHours)}
              hint="Texte libre : les retours à la ligne sont conservés."
              onChange={(hours) => patch({ info: { ...info, hours } })}
            />
            <SwitchField
              label="Afficher la zone d’intervention"
              checked={visibility.showServiceArea}
              onChange={(showServiceArea) => patchVisibility({ showServiceArea })}
            />
            <TextAreaField
              label="Zone d’intervention"
              value={info.serviceArea}
              rows={2}
              disabled={lock(visibility.showServiceArea)}
              onChange={(serviceArea) => patch({ info: { ...info, serviceArea } })}
            />
          </EditorSubZone>
        ) : null}
      </EditorZone>

      {/* ---- Zone 3 — le formulaire ---- */}
      <EditorZone
        tone="style"
        title="Formulaire"
        scope="Ce que le visiteur peut envoyer. Le destinataire, lui, n’est jamais réglé ici : il vient de votre profil (« E-mail du formulaire »)."
      >
        <TextField
          label="Taille maximale d’une pièce jointe (Mo)"
          type="number"
          value={String(form.maxFileSizeMB)}
          onChange={(value) => {
            const parsed = parseBounded(value, 1, CONTACT_MAX_FILE_SIZE_MB);
            if (parsed !== null) {
              patch({ form: { ...form, maxFileSizeMB: parsed } });
            }
          }}
          hint={`De 1 à ${CONTACT_MAX_FILE_SIZE_MB} Mo. Le serveur applique la même borne.`}
        />

        <div className="grid gap-2">
          <p className="text-[13px] font-semibold leading-snug text-foreground">
            Formats acceptés
          </p>
          <p className="text-[11px] leading-snug text-muted-foreground">
            Aucun format coché : le formulaire refuse toute pièce jointe. Le
            serveur vérifie aussi la signature réelle du fichier, pas seulement
            son extension.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {CONTACT_ATTACHMENT_FORMATS.map((format) => {
              const id = `contact-ext-${format.extension}`;
              return (
                <label
                  key={format.extension}
                  htmlFor={id}
                  className="flex items-center gap-2 text-xs text-foreground"
                >
                  <input
                    id={id}
                    type="checkbox"
                    checked={form.allowedExtensions.includes(format.extension)}
                    onChange={(event) =>
                      toggleExtension(format.extension, event.target.checked)
                    }
                  />
                  {format.label}
                </label>
              );
            })}
          </div>
        </div>

        <SwitchField
          label="Case « politique de confidentialité » obligatoire"
          description="Le visiteur doit cocher la case pour envoyer son message."
          checked={form.requireCGU}
          onChange={(requireCGU) => patch({ form: { ...form, requireCGU } })}
        />
        {/* Un réglage sans objet est un piège : le lien ne se règle que si la
            case est demandée. Les valeurs, elles, sont conservées. */}
        {form.requireCGU ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField
              label="Texte du lien"
              value={form.cguLinkText}
              onChange={(cguLinkText) => patch({ form: { ...form, cguLinkText } })}
            />
            <TextField
              label="Adresse du lien"
              value={form.cguLinkUrl}
              mono
              onChange={(cguLinkUrl) => patch({ form: { ...form, cguLinkUrl } })}
              hint="Adresse interne (/confidentialite) ou complète."
            />
          </div>
        ) : null}
      </EditorZone>

      {/* ---- Zone 4 — les cadres des conteneurs (14.1.c) ----
          Un **seul** jeu de réglages pour les conteneurs 2 et 3 (D7) : les deux
          cartes doivent « se faire écho », un cadre par carte les ferait
          diverger au premier oubli. La couleur est un **jeton de thème** et non
          une pipette (D2) : elle suit alors le mode clair/sombre du site, comme
          le catalogue de bandeau — un hex stocké figerait la teinte et
          casserait le mode sombre. */}
      <EditorZone
        tone="style"
        title="Cadres des conteneurs"
        scope="Ces réglages s’appliquent au bloc coordonnées ET au formulaire : les deux cartes doivent se faire écho."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField
            label="Épaisseur du trait (px)"
            type="number"
            value={String(style.frame.borderWidth)}
            onChange={(value) => {
              const parsed = parseBounded(value, 0, 8);
              if (parsed !== null) {
                patchFrameStyle({ borderWidth: parsed });
              }
            }}
            hint="0 = sans cadre."
          />
          <TextField
            label="Arrondi des angles (px)"
            type="number"
            value={String(style.frame.borderRadius)}
            onChange={(value) => {
              const parsed = parseBounded(value, 0, 24);
              if (parsed !== null) {
                patchFrameStyle({ borderRadius: parsed });
              }
            }}
            hint="2 px par défaut."
          />
        </div>
        <SelectField<ContactFrameColorToken>
          label="Couleur du trait"
          value={style.frame.borderColorToken}
          options={contactFrameColorTokenOrder.map((value) => ({
            value,
            label: contactFrameColorTokenLabels[value],
          }))}
          onChange={(borderColorToken) => patchFrameStyle({ borderColorToken })}
          hint="Couleur du thème : elle suit le mode clair/sombre."
        />
      </EditorZone>

      {/* ---- Zone 5 — les réseaux sociaux ---- */}
      <EditorZone
        tone="action"
        title="Réseaux sociaux"
        scope="Les liens affichés sous le formulaire, dans l’ordre de la liste. Seul un lien dont l’adresse est renseignée apparaît sur le site public."
      >
        <EditorSubZone title="Apparence des icônes">
          <SelectField<ContactSocialColorMode>
            label="Couleur des icônes"
            value={style.social.colorMode}
            options={contactSocialColorModeOrder.map((value) => ({
              value,
              label: contactSocialColorModeLabels[value],
            }))}
            onChange={(colorMode) => patchSocialStyle({ colorMode })}
            hint="« Couleur du thème » suit le mode clair/sombre du site. « Officielle » reprend la couleur de chaque marque."
          />
          {style.social.colorMode === "custom" ? (
            <ColorField
              label="Couleur personnalisée"
              value={style.social.customColor}
              fallback={style.social.customColor}
              ariaLabel="Couleur des icônes de réseaux sociaux"
              onChange={(customColor) => patchSocialStyle({ customColor })}
            />
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <SelectField<ContactSocialShape>
              label="Forme de l’icône"
              value={style.social.shape}
              options={contactSocialShapeOrder.map((value) => ({
                value,
                label: contactSocialShapeLabels[value],
              }))}
              onChange={(shape) => patchSocialStyle({ shape })}
            />
            <SelectField<ContactSocialAlignment>
              label="Alignement"
              value={style.social.alignment}
              options={contactSocialAlignmentOrder.map((value) => ({
                value,
                label: contactSocialAlignmentLabels[value],
              }))}
              onChange={(alignment) => patchSocialStyle({ alignment })}
            />
          </div>
        </EditorSubZone>

        <div className="flex items-center justify-between gap-3">
          <p className="text-[13px] font-semibold leading-snug text-foreground">
            Réseaux ({social.length})
          </p>
          <Button type="button" variant="outline" size="sm" onClick={addSocial}>
            <Plus />
            Ajouter un réseau
          </Button>
        </div>

        {social.map((link, index) => {
          const open = openSocialId === link.id;
          const label = contactSocialNetworkLabels[link.network];
          return (
            <div
              key={link.id}
              className="grid gap-3 rounded-md border border-dashed border-border bg-background/40 p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <button
                  type="button"
                  aria-expanded={open}
                  aria-label={open ? `Replier ${label}` : `Déplier ${label}`}
                  onClick={() => setOpenSocialId(open ? "" : link.id)}
                  className="flex min-w-0 flex-1 items-start gap-2 text-left"
                >
                  <ChevronDown
                    aria-hidden="true"
                    className={`mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                      open ? "rotate-180" : ""
                    }`}
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-semibold text-foreground">
                      Réseau {index + 1} — {label}
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
                      {link.url.trim() === "" ? "Aucune adresse" : excerpt(link.url)}
                    </span>
                  </span>
                </button>

                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    aria-label={`Monter ${label}`}
                    title="Monter ce réseau"
                    disabled={index === 0}
                    onClick={() => moveSocial(link.id, -1)}
                    className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-30"
                  >
                    <ArrowUp className="size-4" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Descendre ${label}`}
                    title="Descendre ce réseau"
                    disabled={index === social.length - 1}
                    onClick={() => moveSocial(link.id, 1)}
                    className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-30"
                  >
                    <ArrowDown className="size-4" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Dupliquer le réseau ${label}`}
                    title="Dupliquer ce réseau"
                    onClick={() => duplicateSocial(link.id)}
                    className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  >
                    <Copy className="size-4" />
                  </button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Supprimer le réseau ${label}`}
                    title="Supprimer ce réseau"
                    onClick={() => removeSocial(link.id)}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>

              {open ? (
                <div className="grid gap-3">
                  <SelectField<ContactSocialNetwork>
                    label="Réseau"
                    value={link.network}
                    options={contactSocialNetworkOrder.map((value) => ({
                      value,
                      label: contactSocialNetworkLabels[value],
                    }))}
                    onChange={(network) => updateSocial(link.id, { network })}
                  />
                  <TextField
                    label="Adresse du profil"
                    value={link.url}
                    mono
                    placeholder="https://…"
                    onChange={(url) => updateSocial(link.id, { url })}
                  />
                </div>
              ) : null}
            </div>
          );
        })}

        {social.length === 0 ? (
          <p className="rounded-md border border-dashed border-border bg-background/50 px-3 py-4 text-center text-xs text-muted-foreground">
            Aucun réseau. Cliquez sur « Ajouter un réseau » pour créer le premier.
          </p>
        ) : null}
      </EditorZone>

      <div className="flex justify-end border-t border-border pt-3">
        <button
          type="button"
          onClick={() => onChangeContent(createContactContent())}
          className="rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          Réinitialiser à la démonstration
        </button>
      </div>
    </div>
  );
}
