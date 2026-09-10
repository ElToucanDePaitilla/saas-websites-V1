import { ProfileScreen } from "@/components/backoffice/profile/ProfileScreen";

/**
 * Route `/admin/profile` — module « Profil » (site_owner_profile, Étape 8.1).
 * Écran client : 4 rubriques (Identité, Contacts, Légal & IA, Sécurité).
 */
export default function AdminProfilePage() {
  return <ProfileScreen />;
}
