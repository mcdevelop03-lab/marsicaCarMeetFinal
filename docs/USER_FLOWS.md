# USER FLOWS — Marsica Car Meet

> Documento vivo. Ultima modifica: 2026-07-06.

Descrizione dei flussi principali. I diagrammi usano una notazione testuale semplice.

## 1. Registrazione nuovo membro

```
Visitatore → /registrati
  → compila email + password
  → (invio) → creazione account (Supabase Auth)
  → creato profilo `member` collegato
  → email di conferma (Fase 1/2)
  → login automatico → /dashboard
```

Errori gestiti: email già usata, password debole, email non confermata.

## 2. Login

```
Visitatore → /login
  → email + password
  → sessione creata → redirect a pagina richiesta o /dashboard
  → (link) "Password dimenticata?" → reset via email
```

## 3. Aggiunta di un'auto al garage

```
Membro → /garage → "Aggiungi auto"
  → compila marca, modello, anno, classe, specifiche
  → carica foto (Storage)
  → salva → auto visibile nel proprio garage e nel profilo pubblico
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
  → compila titolo, descrizione, luogo, coordinate, data/ora, capienza, tipo
  → carica cover
  → salva come bozza o pubblica
  → evento appare nell'elenco pubblico
  → Admin monitora partecipanti e auto iscritte
```

## 6. Pubblicazione news (Admin) — *Fase 2*

```
Admin → /admin/news → "Nuovo articolo"
  → titolo, corpo, copertina
  → bozza → pubblica
  → articolo visibile in /news
```

## 7. Caricamento in gallery con moderazione — *Fase 2*

```
Membro → /gallery → "Carica"
  → seleziona foto/video (o link video)
  → invio → stato "in attesa di moderazione"
Admin → /admin/gallery
  → approva o rifiuta
  → se approvato → visibile pubblicamente
```

## 8. Consultazione mappa raduni — *Fase 2*

```
Utente → /mappa
  → vede hotspot con stato e partecipanti
  → clic su hotspot → dettaglio evento collegato
```

## 9. Cambio lingua

```
Utente → selettore lingua (header/footer)
  → passa tra IT ed EN
  → URL aggiornato (/it/... ↔ /en/...) mantenendo la pagina
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
