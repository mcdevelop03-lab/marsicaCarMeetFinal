# Template delle email di autenticazione

Le email che Supabase manda ai nostri utenti (conferma registrazione, reset password).
Di serie sono in **inglese**, senza logo e senza niente che ricordi il sito: chi si
registra riceve un messaggio anonimo che sembra spam.

## ⚠️ Perché questi file esistono

**I template vivono nel dashboard Supabase, non nel repo.** Non c'è nessuna migrazione che
li applichi e `db push` non li tocca. Questa cartella è **la copia di riferimento**: senza,
fra un mese nessuno saprebbe qual è la versione buona, e un ripristino del progetto
Supabase riporterebbe i template inglesi di serie senza che nessuno se ne accorga.

**Se modifichi il template nel dashboard, aggiorna anche il file qui.** Vale il contrario:
se modifichi il file, ricordati di reincollarlo nel dashboard, altrimenti non cambia nulla
per davvero.

## Come applicarli

Dashboard Supabase → **Authentication → Emails** → scheda del template:

| File | Template nel dashboard |
|---|---|
| `conferma-registrazione.html` | **Confirm signup** |
| `reset-password.html` | **Reset password** |

Incolla il contenuto nel campo del messaggio e salva. Conviene anche mettere un **oggetto**
in italiano al posto di quello inglese di serie:

- Confirm signup → `Conferma il tuo indirizzo — Marsica Car Meet`
- Reset password → `Reimposta la password — Marsica Car Meet`

Poi manda una email di prova vera (registrando un account) e **aprila da telefono**: è lì
che si vedono i disastri di impaginazione, non nell'anteprima del dashboard.

## Le variabili

`{{ .ConfirmationURL }}` è l'unica che usiamo, ed è Supabase a sostituirla. Punta al
`redirect` che l'app chiede in `auth/actions.ts`, **ma solo se quell'URL è nella allow-list**
di *Authentication → URL Configuration*: se non lo è, Supabase ripiega in silenzio sul Site
URL e il link porta altrove. È già successo (bug #2 del collaudo 1A).

## Cose da sapere, che non dipendono da questi file

- **Il footer "powered by Supabase / Opt out of these emails" non si toglie di qui.** Lo
  aggiunge il servizio di posta condiviso di Supabase, quello gratuito. Sparisce solo
  configurando un **SMTP nostro**, che è nella lista del go-live.
- **Limite di 2 email di autenticazione all'ora**, stessa origine. Anche questo cade con
  l'SMTP nostro.
- **Il logo è un URL assoluto** (`/email-logo.png` servito dal sito): nelle email non
  esistono percorsi relativi. Quando si passerà al dominio vero **va cambiato in tutti e
  due i file e nel dashboard**, altrimenti resterà appeso all'indirizzo di staging.
  `public/email-logo.png` è la riduzione a 240px del logo bianco: l'originale pesa 872 KB,
  improponibile in una email.
- **HTML da email, non da sito:** tabelle e stili in linea, niente flexbox, niente grid,
  niente CSS esterno. Sembra codice del 2005 ed è voluto: è ciò che Outlook e Gmail
  rendono in modo affidabile.
