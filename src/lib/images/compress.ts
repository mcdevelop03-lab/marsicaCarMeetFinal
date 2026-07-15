// Compressione lato client, senza librerie: il browser sa già ridimensionare e
// ricomprimere (createImageBitmap + canvas + toBlob).
//
// È solo un'ottimizzazione: un client ostile può aggirarla. Il limite di 2 MB e i
// MIME ammessi stanno sul BUCKET (migrazioni 0005 e 0007), dove non si aggirano.

const LATO_MAX = 1600; // px sul lato lungo
const TARGET_BYTES = 500 * 1024; // sotto questa soglia ci si ferma
const QUALITA = [0.82, 0.7, 0.6];

/**
 * Ridimensiona a un lato lungo massimo di 1600px e riscrive in WebP.
 * Una foto da telefono (~4 MB) scende tipicamente sotto i 300 KB.
 *
 * Non peggiora mai: se il risultato fosse più grande dell'originale, torna
 * l'originale. Se il browser non sa decodificare il file, torna l'originale
 * (sarà il bucket a respingerlo, se non ammesso).
 */
export async function comprimiImmagine(file: File): Promise<File> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file;
  }

  const scala = Math.min(1, LATO_MAX / Math.max(bitmap.width, bitmap.height));
  const larghezza = Math.round(bitmap.width * scala);
  const altezza = Math.round(bitmap.height * scala);

  const canvas = document.createElement("canvas");
  canvas.width = larghezza;
  canvas.height = altezza;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, larghezza, altezza);
  bitmap.close();

  let migliore: Blob | null = null;
  for (const qualita of QUALITA) {
    const blob = await new Promise<Blob | null>((risolvi) =>
      canvas.toBlob(risolvi, "image/webp", qualita),
    );
    if (!blob) continue;
    migliore = blob;
    if (blob.size <= TARGET_BYTES) break;
  }

  if (!migliore || migliore.size >= file.size) return file;

  const nome = file.name.replace(/\.[^.]+$/, "") + ".webp";
  return new File([migliore], nome, { type: "image/webp" });
}
