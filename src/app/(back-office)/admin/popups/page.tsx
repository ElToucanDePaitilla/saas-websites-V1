import { PopUpsManager } from "@/components/backoffice/popups/PopUpsManager";

/**
 * Route `/admin/popups` — liste des pop-ups (création, activation, suppression).
 * L'édition complète se fait dans `/admin/popups/[id]`.
 */
export default function AdminPopUpsPage() {
  return <PopUpsManager />;
}
