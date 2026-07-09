# REGISTRO SVILUPPO — Marsica Car Meet

> Registro del tempo dedicato allo sviluppo, per fase.
> Date ricavate dai commit git e dai documenti del progetto.
> Le prime fasi si sovrappongono su alcune giornate (vedi Totali).

| # | Fase | Periodo (dal → al) | Giorni | Note |
|---|------|--------------------|:------:|------|
| 1 | Discovery — raccolta requisiti e decisioni | 2026-07-06 | 1 | `REQUIREMENTS.md`, `DECISIONS.md` |
| 2 | Documentazione — creazione `/docs` | 2026-07-06 → 2026-07-07 | 2 | Documenti ufficiali del progetto |
| 3 | Analisi del codice (mockup) | 2026-07-07 | 1 | `CODE_ANALYSIS.md` |
| 4 | Fase 0 — Fondamenta (scaffold Next 16 + Tailwind + i18n) | 2026-07-07 → 2026-07-08 | 2 | Branch `feat/fase0-fondamenta`, mergiata in `main` |
| 5 | Fase 1A — Backend + Auth (schema DB, RLS, auth completa, 2FA) | 2026-07-08 → 2026-07-09 | 2 | Branch `feat/fase1a-backend-auth`, 13 task, mergiata in `main` |
| 6 | Collaudo 1A + fix (7 bug) + restyle UI auth | 2026-07-09 | 1 | Collaudo e2e, card auth, validazione live, navigazione loggato |
| 7 | Fase 1B — Profilo + Garage | *(prossima)* | — | Non ancora iniziata |

## Totali

- **Giorni di calendario:** **4** (dal 2026-07-06 al 2026-07-09).
- *Nota:* la somma dei "giorni" per riga è maggiore perché alcune fasi condividono le stesse giornate (es. il 07-07 copre analisi codice + avvio Fase 0).

---

### Come aggiornare

1. A fine fase, aggiungi la riga o completa il periodo `dal → al`.
2. Aggiorna i **Totali** (giorni di calendario dalla prima all'ultima data).
