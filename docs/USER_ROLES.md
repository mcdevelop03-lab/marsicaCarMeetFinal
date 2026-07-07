# USER ROLES & PERMISSIONS — Marsica Car Meet

> Documento vivo. Ultima modifica: 2026-07-07.
> Scelte di scope in [DECISIONS.md](./DECISIONS.md).

## 1. Ruoli

| Ruolo | Chiave (`role`) | Descrizione | Stato al lancio |
|---|---|---|---|
| Visitatore | `guest` (non autenticato) | Utente non registrato. Consulta contenuti pubblici. | Attivo |
| Membro | `member` | Utente registrato. Profilo, garage, RSVP agli eventi. | Attivo |
| Amministratore | `admin` | Staff del club. Gestisce eventi, contenuti e utenti. | Attivo |
| Organizzatore | `organizer` | Potrà creare/gestire eventi propri senza essere admin. | **Predisposto ma disattivo** |

> Nota: al lancio **solo l'Admin crea eventi**. Il ruolo `organizer` esiste nel modello
> dati (enum) ma non viene assegnato finché non lo attiveremo (fase futura).

## 2. Modello di assegnazione ruoli

- Alla registrazione ogni utente riceve automaticamente il ruolo `member`.
- Il ruolo è memorizzato nella tabella `profiles.role`.
- Solo un `admin` può promuovere/retrocedere un utente (es. `member` → `admin`).
- Il primo admin viene impostato manualmente (seed) in fase di setup.

## 3. Matrice dei permessi

| Azione | Visitatore | Membro | Organizzatore* | Admin |
|---|:---:|:---:|:---:|:---:|
| Visualizzare **home, eventi, foto eventi** (pubblici) | ✅ | ✅ | ✅ | ✅ |
| Visualizzare **profili e garage dei membri** | ❌ | ✅ | ✅ | ✅ |
| Registrarsi / effettuare login | ✅ | — | — | — |
| Creare e gestire il proprio profilo | ❌ | ✅ | ✅ | ✅ |
| Gestire il proprio garage (CRUD auto) | ❌ | ✅ | ✅ | ✅ |
| Fare RSVP a un evento (+ associare le proprie auto) | ❌ | ✅ | ✅ | ✅ |
| Creare / modificare / eliminare eventi | ❌ | ❌ | ✅ (propri)* | ✅ (tutti) |
| Vedere elenco partecipanti a un evento | ❌ | ❌ | ✅ (propri)* | ✅ |
| Caricare **foto/video di un evento** (album per-evento) | ❌ | ❌ | ✅ (propri)* | ✅ |
| Pubblicare / gestire news *(Fase 2)* | ❌ | ❌ | ❌ | ✅ |
| Gestire utenti (ruoli, sospensioni) *(Fase 2)* | ❌ | ❌ | ❌ | ✅ |
| Accedere al pannello Admin | ❌ | ❌ | ❌ | ✅ |

\* Colonna Organizzatore = comportamento previsto quando il ruolo verrà attivato.

## 4. Applicazione dei permessi (difesa a due livelli)

1. **Server-side (Next.js):** middleware e Server Components verificano sessione e ruolo
   prima di renderizzare pagine/azioni protette. Redirect al login se non autorizzato.
2. **Database (Supabase Row Level Security):** ogni tabella ha policy RLS che impediscono
   accesso/modifica non autorizzati **anche se** una richiesta arrivasse direttamente al DB.

Esempi di policy RLS:
- `vehicles`: un utente può leggere tutte le auto pubbliche ma modificare/eliminare solo
  quelle dove `owner_id = auth.uid()`.
- `events`: lettura pubblica; insert/update/delete solo se `profiles.role = 'admin'`.
- `event_registrations`: un utente gestisce solo le proprie iscrizioni.

## 5. Aree dell'applicazione per ruolo

| Area | Percorso | Ruolo minimo |
|---|---|---|
| Sito pubblico | `/[locale]/(public)/...` | Visitatore |
| Area membro | `/[locale]/(auth)/...` | Membro |
| Pannello admin | `/[locale]/(admin)/...` | Admin |
