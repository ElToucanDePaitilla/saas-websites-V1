import {
  Aperture,
  Award,
  Baby,
  BookOpen,
  Briefcase,
  Cake,
  Calendar,
  Camera,
  Clock,
  Coffee,
  Crown,
  Dog,
  Gem,
  Gift,
  Globe,
  Heart,
  Image as ImageIcon,
  Images,
  Leaf,
  Mail,
  MapPin,
  MessageCircle,
  Mountain,
  Music,
  Palette,
  PenLine,
  Phone,
  Plane,
  Quote,
  Send,
  ShieldCheck,
  Smile,
  Sparkles,
  Star,
  Sun,
  ThumbsUp,
  Truck,
  Users,
  Video,
  Zap,
  type LucideIcon,
} from "lucide-react";

/**
 * ============================================================================
 * CATALOGUE D'ICÔNES PAR NOM (Étape 12.1)
 * ----------------------------------------------------------------------------
 * Une icône insérée dans du contenu est stockée par **nom** (`"Camera"`), jamais
 * par son balisage SVG. Trois raisons, dans cet ordre :
 *
 *   1. **Sécurité** — stocker du SVG brut ouvrirait exactement la surface
 *      d'injection que le stockage en JSON ProseMirror a fermée ;
 *   2. **Poids** — le JSONB ne transporte que quelques octets par icône ;
 *   3. **Thème** — l'icône hérite de `currentColor`, donc de la couleur du
 *      texte : elle suit le thème du site sans réglage.
 *
 * Le catalogue est **explicite** (et non un accès dynamique à toute la
 * bibliothèque) : les icônes réellement importées sont les seules embarquées
 * dans le bundle, et le choix proposé reste court, donc utilisable.
 *
 * Les libellés sont en français et décrivent l'usage (« Prestation »,
 * « Lieu »), pas le nom technique du dessin : un utilisateur non technique
 * cherche par usage, pas par forme.
 * ============================================================================
 */

type IconEntry = {
  /** Libellé français affiché dans le sélecteur et lu par les lecteurs d'écran. */
  label: string;
  Icon: LucideIcon;
};

/** Catalogue ordonné : nom stable → { libellé français, composant }. */
const ICON_ENTRIES: Record<string, IconEntry> = {
  Camera: { label: "Appareil photo", Icon: Camera },
  Aperture: { label: "Ouverture", Icon: Aperture },
  Image: { label: "Photo", Icon: ImageIcon },
  Images: { label: "Photos", Icon: Images },
  Palette: { label: "Palette", Icon: Palette },
  Sparkles: { label: "Éclat", Icon: Sparkles },
  Star: { label: "Étoile", Icon: Star },
  Heart: { label: "Cœur", Icon: Heart },
  Sun: { label: "Soleil", Icon: Sun },
  Crown: { label: "Couronne", Icon: Crown },
  Gem: { label: "Pierre précieuse", Icon: Gem },
  Award: { label: "Récompense", Icon: Award },
  ThumbsUp: { label: "Recommandation", Icon: ThumbsUp },
  Smile: { label: "Sourire", Icon: Smile },
  Users: { label: "Clients", Icon: Users },
  Baby: { label: "Bébé", Icon: Baby },
  Dog: { label: "Animal", Icon: Dog },
  Cake: { label: "Événement", Icon: Cake },
  Gift: { label: "Cadeau", Icon: Gift },
  Quote: { label: "Citation", Icon: Quote },
  PenLine: { label: "Signature", Icon: PenLine },
  BookOpen: { label: "Livre", Icon: BookOpen },
  Briefcase: { label: "Prestation", Icon: Briefcase },
  ShieldCheck: { label: "Garantie", Icon: ShieldCheck },
  Clock: { label: "Durée", Icon: Clock },
  Calendar: { label: "Date", Icon: Calendar },
  MapPin: { label: "Lieu", Icon: MapPin },
  Mail: { label: "E-mail", Icon: Mail },
  Phone: { label: "Téléphone", Icon: Phone },
  Send: { label: "Envoi", Icon: Send },
  Globe: { label: "Site web", Icon: Globe },
  MessageCircle: { label: "Message", Icon: MessageCircle },
  Music: { label: "Musique", Icon: Music },
  Video: { label: "Vidéo", Icon: Video },
  Mountain: { label: "Nature", Icon: Mountain },
  Plane: { label: "Voyage", Icon: Plane },
  Truck: { label: "Livraison", Icon: Truck },
  Coffee: { label: "Pause", Icon: Coffee },
  Leaf: { label: "Écologie", Icon: Leaf },
  Zap: { label: "Rapidité", Icon: Zap },
};

/** Une entrée du catalogue, aplatie pour l'affichage en grille. */
export type CatalogIcon = {
  /** Nom stable persisté dans le contenu (`ContentIconBlock.name`). */
  name: string;
  /** Libellé français (affiché et lu par les lecteurs d'écran). */
  label: string;
  Icon: LucideIcon;
};

/** Catalogue ordonné des icônes proposées dans le sélecteur. */
export const contentIconCatalog: CatalogIcon[] = Object.entries(
  ICON_ENTRIES
).map(([name, entry]) => ({ name, label: entry.label, Icon: entry.Icon }));

/** Libellé français d'un nom d'icône (repli : le nom technique). */
export function contentIconLabel(name: string): string {
  return ICON_ENTRIES[name]?.label ?? name;
}

/**
 * Rend l'icône portant ce nom, ou `null` si le nom est inconnu.
 *
 * Le repli silencieux est délibéré : une icône retirée du catalogue ne doit pas
 * casser le rendu d'une page publiée, elle doit simplement disparaître.
 * L'icône est décorative (`aria-hidden`) — c'est le texte qui porte le sens ;
 * si elle était porteuse d'information, le libellé exact est disponible via
 * `contentIconLabel` pour l'écrire à côté.
 */
export function IconByName({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const entry = ICON_ENTRIES[name];
  if (!entry) {
    return null;
  }
  const { Icon } = entry;
  return <Icon className={className} aria-hidden="true" />;
}
