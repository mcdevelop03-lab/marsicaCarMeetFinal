# USER FLOWS — Marsica Car Meet

> Documento vivo. Ultima modifica: 2026-07-07.
> Scelte di scope in [`DECISIONS.md`](./DECISIONS.md).

Descrizione dei flussi principali. I diagrammi usano una notazione testuale semplice.

## 1. Registrazione nuovo membro

```
Visitatore → /registrati
  → email + password  (oppure "Continua con Google")
  → verifica anti-bot Cloudflare Turnstile
  → (invio) → creazione account (Supabase Auth)
  → creato profilo `member` collegato
  → email di conferma OBBLIGATORIA → l'account si attiva solo dopo la conferma
  → al primo login → /dashboard
```

Errori gestiti: email già usata, password debole, email non confermata, captcha fallito.

## 2. Login

```
Visitatore → /login
  → email + password  (oppure "Continua con Google")  + Turnstile
  → SE 2FA attiva → richiesta codice app authenticator (TOTP)
  → sessione creata → redirect a pagina richiesta o /dashboard
  → (link) "Password dimenticata?" → reset via email
```

## 3. Aggiunta di un'auto al garage

```
Membro → /garage → "Aggiungi auto"
  → compila marca, modello, anno (obbligatori) + categoria/descrizione/specifiche (opzionali)
  → carica foto (Storage, obbligatoria)
  → salva → auto visibile nel proprio garage e agli altri membri loggati (sola lettura)
```

## 4. Scoperta e partecipazione a un evento (flusso centrale)

```
Utente → /eventi (elenco, filtrabile per stato)
  → seleziona evento → /eventi/[slug]
  → vede descrizione, luogo, data, posti disponibili
  → SE non loggato → invito a login/registrazione
  → SE loggato (Membro):
       → clic "Partecipa" (RSVP)
       → SE posti esauriti → RSVP bloccato / lista attesa (futuro)
       → seleziona una o più auto dal proprio garage da portare
       → conferma → iscrizione registrata
  → può annullare la partecipazione
```

## 5. Creazione evento (Admin)

```
Admin → /admin/eventi → "Nuovo evento"
  → compila titolo, descrizione, luogo (+ link mappa), data/ora, capienza, tipo
  → carica cover
  → salva come bozza o pubblica
  → evento appare nell'elenco pubblico
  → Admin monitora partecipanti e auto iscritte
  → A RADUNO CONCLUSO: Admin carica l'album foto/video → pubblico nella pagina evento
```

## 6. Pubblicazione news (Admin) — *Fase 2*

```
Admin → /admin/news → "Nuovo articolo"
  → titolo, corpo, copertina
  → bozza → pubblica
  → articolo visibile in /news
```

## 7. Album foto/video di un evento (Admin) — *Fase 1*

```
Admin → /admin/eventi/[slug] → "Carica media" (dopo la conclusione)
  → seleziona foto/video (o link video esterno)
  → salva → media pubblicati direttamente nella pagina evento (nessuna moderazione)
Utente/Visitatore → /eventi/[slug] → vede l'album dell'evento
```

## 8. Consultazione luogo evento — *MVP (mappa dedicata in Fase 2)*

```
MVP:
Utente → /eventi/[slug] → sezione "Luogo" → link/embed a mappa esterna (Google/OSM)

Fase 2:
Utente → /mappa → mappa interattiva con tutti i raduni → clic → dettaglio evento
```

## 9. Cambio lingua — *EN attivo dalla Fase 3*

```
Al lancio: interfaccia in Italiano (/it). Il selettore lingua è predisposto ma con
la sola voce IT; l'Inglese (/en) si attiva in Fase 3 senza modifiche strutturali.
```

## 10. Gestione consenso cookie (GDPR)

```
Primo accesso → cookie banner
  → utente accetta / rifiuta / personalizza
  → preferenza salvata
  → cookie non essenziali attivati solo se acconsentito
```

## 11. Percorsi di permesso (guardie)

- Accesso ad area membro senza login → redirect a `/login` con ritorno alla pagina richiesta.
- Accesso ad area admin senza ruolo `admin` → 403 / redirect alla home.
- Tentativo di modificare risorsa non propria → bloccato da RLS lato DB.
