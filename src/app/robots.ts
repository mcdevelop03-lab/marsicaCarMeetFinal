import type { MetadataRoute } from "next";

// Staging: nessun motore di ricerca deve indicizzare questo ambiente (contenuti demo e
// policy legali ancora in bozza). DA RIMUOVERE al go-live pubblico.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", disallow: "/" },
  };
}
