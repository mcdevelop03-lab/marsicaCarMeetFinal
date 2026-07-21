import { redirect } from "@/i18n/navigation";

// La gestione eventi non è più una rotta a sé: vive in fondo a `/eventi` per gli admin
// (principio "niente rotte parallele" — vedi docs/STATO-LAVORI.md e il componente
// `EventiGestione`). Questa rotta resta solo come redirect di cortesia per vecchi
// segnalibri. Il layout `(admin)` ha già respinto i non-admin prima di arrivare qui.
export default async function AdminEventiPage() {
  redirect({ href: "/eventi", locale: "it" });
}
