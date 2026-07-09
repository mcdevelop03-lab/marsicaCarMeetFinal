// Contenitore condiviso delle pagine auth: sfondo "racing" a tutta pagina
// (griglia + alone rosso), centraggio orizzontale/verticale e card.
// Il contenuto della pagina (form + Google + link) viene mostrato dentro la card.
export default function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[70vh] flex-1 items-center justify-center py-4">
      {/* Sfondo a tutta viewport, dietro il contenuto */}
      <div className="fixed inset-0 -z-10 pointer-events-none" aria-hidden>
        <div className="absolute inset-0 racing-grid" />
        <div className="absolute inset-0 auth-aura" />
      </div>

      <div className="w-full max-w-md border border-white/10 border-t-2 border-t-accent-red bg-surface-card p-8 shadow-2xl shadow-black/60">
        {children}
      </div>
    </div>
  );
}
