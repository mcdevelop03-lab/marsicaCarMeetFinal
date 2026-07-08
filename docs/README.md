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
| [CODE_ANALYSIS.md](./CODE_ANALYSIS.md) | Analisi del codice esistente (mockup VELOCITY): forze, problemi, riuso. |
| [DECISIONS.md](./DECISIONS.md) | Registro delle decisioni di prodotto/scope (con ID citabili). |
| [ROADMAP.md](./ROADMAP.md) | Fasi di sviluppo incrementali. |
| [TODO.md](./TODO.md) | Attività operative e decisioni aperte. |
| [SETUP.md](./SETUP.md) | Guida passo-passo per configurare il progetto da zero su un nuovo dispositivo. |

## Sintesi rapida

- **Cos'è:** piattaforma web per la community di appassionati d'auto della Marsica.
- **Stack:** Next.js 15 + Supabase + TailwindCSS; italiano al lancio, struttura pronta per EN.
- **Deploy:** Cloudflare Pages + Supabase (free tier).
- **Stato:** Discovery, documentazione e **analisi del codice** completate
  ([CODE_ANALYSIS.md](./CODE_ANALYSIS.md)); prossimo passo = refactoring **solo dopo approvazione**.

## Convenzioni

- Ogni documento riporta la data dell'ultima modifica.
- Le decisioni **di prodotto/scope** sono in [DECISIONS.md](./DECISIONS.md) (ID `D-1xx`); quelle
  **architetturali** in [ARCHITECTURE.md](./ARCHITECTURE.md) §11.
- Le priorità: **P0** (MVP) · **P1** (importante) · **P2** (futuro).
