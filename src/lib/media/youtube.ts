// Estrae l'id a 11 caratteri di un video YouTube da un URL, o null se non è un link
// YouTube valido. Logica pura (nessun I/O): è l'unico pezzo con logica non banale
// della fase 1C-3, quindi è coperto da test (vitest).
//
// Accetta le forme comuni (protocollo e "www." facoltativi):
//   youtube.com/watch?v=ID  (con parametri extra: &t=, &list=)
//   youtu.be/ID
//   youtube.com/embed/ID
//   youtube.com/shorts/ID

const ID_VALIDO = /^[A-Za-z0-9_-]{11}$/;

function analizzaUrl(s: string): URL | null {
  // Un link YouTube condiviso ha sempre lo schema; ma se l'admin incolla "youtu.be/ID"
  // senza "https://", riproviamo aggiungendolo invece di rifiutarlo.
  try {
    return new URL(s);
  } catch {
    /* riprova sotto */
  }
  try {
    return new URL("https://" + s);
  } catch {
    return null;
  }
}

export function estraiIdYouTube(url: string): string | null {
  const grezzo = url.trim();
  if (!grezzo) return null;

  const u = analizzaUrl(grezzo);
  if (!u) return null;

  const host = u.hostname.replace(/^www\./, "").toLowerCase();

  let id: string | null = null;
  if (host === "youtu.be") {
    id = u.pathname.slice(1).split("/")[0] || null;
  } else if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
    if (u.pathname === "/watch") {
      id = u.searchParams.get("v");
    } else {
      const m = u.pathname.match(/^\/(?:embed|shorts)\/([^/?#]+)/);
      if (m) id = m[1];
    }
  }

  return id && ID_VALIDO.test(id) ? id : null;
}
