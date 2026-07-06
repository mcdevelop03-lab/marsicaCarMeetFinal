# Documentazione — Marsica Car Meet

Documentazione ufficiale del progetto. **Sono documenti vivi**: ogni decisione importante
li aggiorna.

## Indice

| Documento | Contenuto |
|---|---|
| [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md) | Visione, obiettivi, scope, scelte principali. |
| [REQUIREMENTS.md](./REQUIREMENTS.md) | Requisiti funzionali e non funzionali (con priorità). |
| [USER_ROLES.md](./USER_ROLES.md) | Ruoli utente e matrice dei permessi. |
| [FEATURES.md](./FEATURES.md) | Funzionalità dettagliate per fase. |
| [USER_FLOWS.md](./USER_FLOWS.md) | Flussi utente principali. |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Architettura tecnica, stack, modello dati, ADR. |
| [ROADMAP.md](./ROADMAP.md) | Fasi di sviluppo incrementali. |
| [TODO.md](./TODO.md) | Attività operative e decisioni aperte. |

## Sintesi rapida

- **Cos'è:** piattaforma web per la community di appassionati d'auto della Marsica.
- **Stack:** Next.js 15 + Supabase + TailwindCSS, i18n IT/EN.
- **Deploy:** Cloudflare Pages + Supabase (free tier).
- **Stato:** Discovery e documentazione completate; prossimo passo = analisi del codice
  esistente, poi refactoring **solo dopo approvazione**.

## Convenzioni

- Ogni documento riporta la data dell'ultima modifica.
- Le decisioni architetturali sono registrate in [ARCHITECTURE.md](./ARCHITECTURE.md) §11.
- Le priorità: **P0** (MVP) · **P1** (importante) · **P2** (futuro).
