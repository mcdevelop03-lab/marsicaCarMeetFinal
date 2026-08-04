# COSTI — Marsica Car Meet

> Documento vivo. Prima stesura: **2026-08-04**, alla chiusura della Fase 1E (staging).
> Serve a rispondere a due domande distinte: **quanto costa andare online adesso** e
> **quanto costano i miglioramenti**, che sono cose diverse e vanno decise separatamente.

## ⚠️ Come leggere le cifre di questo file

**Nessun prezzo qui dentro è stato verificato sul sito del fornitore il giorno in cui scrivo.**
Vengono dalla mia conoscenza dei listini, che ha qualche mese: servono a darti l'**ordine di
grandezza** per ragionare, non a firmare un contratto.

🚨 **Prima di attivare qualunque servizio a pagamento, controlla il listino aggiornato.** I
fornitori cloud cambiano i piani spesso, e più di una volta hanno cambiato proprio le condizioni
che ci interessano (Vercel ha vietato l'uso commerciale sul piano gratuito, Supabase ha
modificato cosa si può personalizzare in quello free). I link sono in fondo.

Le cifre sono **IVA esclusa** dove non diversamente indicato, e in **euro o dollari** a seconda
del fornitore: quasi tutti fatturano in dollari, quindi il costo reale dipende anche dal cambio.

---

## 📍 Dove siamo adesso: **il progetto costa zero**

Tutto ciò che è stato costruito finora gira su piani gratuiti, e **è stata una scelta
deliberata**, non un ripiego: il vincolo dato era *nessuna spesa finché il cliente non approva*.

| Servizio | Piano | Costo | A cosa serve |
|---|---|---|---|
| **Netlify** | Starter (gratuito) | **0** | Ospita il sito. Scelto perché **permette esplicitamente l'uso commerciale** sul piano gratuito |
| **Supabase** | Free | **0** | Database, autenticazione, storage delle foto |
| **Cloudflare Turnstile** | gratuito | **0** | Anti-bot su login e registrazione |
| **GitHub** | gratuito | **0** | Codice e cronologia |
| **Dominio** | — | **0** | Non c'è: si usa `polite-moxie-8dc031.netlify.app` |

⚠️ **Vercel è escluso**, e non per gusto: il piano Hobby gratuito **vieta l'uso commerciale** nei
termini, e questo sito è per un cliente. È il motivo per cui si è scelta Netlify.

---

# PARTE A — Cosa serve per andare online **adesso**

> Cioè: il sito raggiungibile al pubblico, con un indirizzo decente, che funziona davvero.

## La risposta breve, e forse sorprendente

**L'unica spesa tecnica obbligatoria è il dominio: circa 10-20 € l'anno.**

Tutto il resto **può partire gratis** senza barare. Sotto c'è il perché, servizio per servizio, e
soprattutto **cosa si accetta** scegliendo il gratuito — perché ogni scelta gratuita ha un prezzo
che non è in euro.

C'è però una spesa **non tecnica** che pesa più del dominio, ed è l'ultima riga della tabella.

## A.1 — Il dominio 🔴 **obbligatorio**

| Voce | Stima annua | Note |
|---|---|---|
| Dominio `.it` | **~10-15 €/anno** ⚠️ | Il più naturale per un club italiano |
| Dominio `.com` | **~12-20 €/anno** ⚠️ | Se si vuole un nome internazionale |
| Privacy WHOIS | spesso **inclusa** | Alcuni registrar la fanno pagare a parte: verificalo, senza, nome e indirizzo dell'intestatario diventano pubblici |

**Perché è obbligatorio e non un vezzo:** oggi l'indirizzo è `polite-moxie-8dc031.netlify.app`.
Un club che stampa quello su una locandina non lo stampa. E ci sono due conseguenze tecniche:
senza dominio proprio **non si può avere un SMTP serio** (i provider chiedono un dominio
verificato per farti spedire a chiunque) e le email partirebbero da un indirizzo altrui.

⚠️ **Il dominio si paga tutti gli anni.** Se scade, il sito diventa irraggiungibile e qualcun
altro può registrarlo. **Attiva il rinnovo automatico** e tieni la carta aggiornata.

⚠️ **Cambiare dominio tocca tre punti oltre al DNS**, e dimenticarne uno rompe qualcosa in
silenzio: gli URL di redirect di Supabase, l'hostname del widget Turnstile, e l'URL del logo nei
template email. È annotato in `SETUP.md`.

## A.2 — Hosting del sito (Netlify) 🟢 **gratis può bastare**

| Piano | Costo | Cosa dà |
|---|---|---|
| **Starter** (attuale) | **0** | 100 GB di banda/mese, 300 minuti di build/mese ⚠️, uso commerciale permesso, dominio personalizzato e HTTPS inclusi |
| Pro | **~19 $/mese per membro** ⚠️ | Più banda e build, protezione con password, supporto |

**Il gratuito basta all'avvio.** Per un sito di club, 100 GB di banda al mese sono tantissimi: le
foto sono compresse in WebP e servite da Supabase Storage, quindi non pesano nemmeno su questa
voce. I 300 minuti di build si consumano solo quando si pubblica codice nuovo.

**Cosa accetti restando gratis:** nessun supporto, e se un giorno servisse mettere il sito dietro
password (per una revisione privata) quella funzione è **solo a pagamento** — l'abbiamo già
incontrata durante lo staging.

## A.3 — Database e login (Supabase) 🟡 **gratis funziona, ma senza rete di sicurezza**

| Piano | Costo | Cosa cambia |
|---|---|---|
| **Free** (attuale) | **0** | Database e storage limitati ⚠️, **nessun backup**, progetto **in pausa dopo 7 giorni di inattività** |
| Pro | **~25 $/mese** ⚠️ | Backup giornalieri, niente pausa, risorse molto più ampie |

**La pausa a 7 giorni non è il problema che sembra, una volta pubblici.** Scatta per
*inattività*: un sito vivo, con visitatori, non si ferma mai. Era un problema sullo **staging**,
dove passavano giorni senza che nessuno lo aprisse.

🚨 **Il problema vero del piano free è un altro: non ci sono backup.** Se qualcosa cancella i
dati — un errore, una migrazione sbagliata, un guaio del fornitore — **non c'è modo di tornare
indietro**. Finché ci sono tre eventi demo non importa niente. Quando ci saranno i profili veri
dei soci, le loro auto e gli album dei raduni, quel rischio cambia natura: **sono contenuti che
le persone non possono ricreare**.

**Il mio consiglio onesto:** parti gratis e **passa al Pro quando entrano i primi contenuti veri
del club**, non prima. Il momento giusto non è il go-live: è il primo raduno vero con le foto
dentro. Nel frattempo si può fare un export manuale ogni tanto, che è meglio di niente ma dipende
da qualcuno che si ricorda di farlo.

## A.4 — Email di autenticazione (SMTP) 🟡 **gratis, ma solo col dominio**

| Opzione | Costo | Limiti |
|---|---|---|
| **Servizio Supabase incluso** (attuale) | **0** | 🚨 **2 email/ora**, template **inglesi bloccati**, footer "powered by Supabase" |
| **Resend**, piano gratuito | **0** ⚠️ | Richiede il **dominio verificato**; qualche migliaio di email al mese ⚠️ |
| Altri provider (Brevo, Mailgun, SendGrid…) | **0** su piani base ⚠️ | Condizioni diverse, da confrontare |
| Piani a pagamento | **da ~20 $/mese** ⚠️ | Solo se i volumi crescono molto — improbabile per un club |

**Perché serve davvero, e non è una rifinitura.** Con il servizio incluso di Supabase oggi
succedono tre cose insieme, che hanno **la stessa causa** e si risolvono **tutte con lo stesso
intervento**:

1. 🚨 **Massimo 2 email di autenticazione all'ora.** Non è un limite di utenti — è un limite di
   *frequenza*. Il giorno in cui il club annuncia il sito e dieci persone si registrano nella
   stessa sera, **otto non ricevono l'email di conferma** e restano fuori. È il rischio più
   concreto di tutta questa lista.
2. **I template italiani già scritti non si possono applicare.** Sono pronti in
   `supabase/email-templates/`, ma il dashboard li rifiuta finché il mittente è quello condiviso.
   Chi si registra riceve una email **in inglese**, anonima.
3. **Il footer "powered by Supabase"** in fondo a ogni messaggio.

**Costo reale: zero**, con un piano gratuito di un provider email + il dominio della voce A.1.
L'unica spesa è il tempo di configurarlo.

⚠️ **Ma va fatto DOPO il dominio, non prima.** Senza un dominio verificato, **Resend in modalità
test spedisce solo al titolare dell'account**: sarebbe inutile. Le due voci sono legate.

## A.5 — Anti-bot, OAuth, codice 🟢 **gratis, e restano gratis**

| Voce | Costo | Note |
|---|---|---|
| Cloudflare Turnstile | **0** | Gratuito senza limiti pratici per questa scala |
| Login con Google | **0** | Configurare il provider OAuth non costa nulla |
| GitHub | **0** | Repo privato incluso nel piano gratuito |

## A.6 — 🔴 La spesa che si dimentica sempre: **i contenuti legali**

**Questa non è una voce tecnica, ed è probabilmente la più cara della Parte A.**

Le pagine `/privacy` e `/cookie` esistono e sono complete nella struttura, ma **dichiarano
onestamente di essere una bozza** e contengono `[DA COMPILARE]` al posto dei dati reali del
Titolare del trattamento (denominazione, sede, email), più un `[DA VERIFICARE]` sulle garanzie di
trasferimento dei dati fuori dall'Unione Europea.

| Voce | Stima | Note |
|---|---|---|
| Dati del Titolare | **0** | Li fornisce il cliente: denominazione, sede, email di contatto |
| **Validazione legale dei testi** | **~100-500 €** ⚠️ una tantum | Un professionista che li riveda. La forchetta è larga perché dipende molto da chi si sceglie |

**Perché non è rimandabile.** Il sito raccoglie dati personali di persone reali — nome, email,
paese, foto, profili social. Da quel momento il club è **Titolare del trattamento** e ha obblighi
veri. Una privacy policy con dei `[DA COMPILARE]` dentro, su un sito pubblico che raccoglie
iscrizioni, non è una svista grafica: è il documento che dice alle persone cosa succede ai loro
dati, e va scritto da chi sa cosa sta scrivendo.

⚠️ **Va deciso col cliente**, perché è lui il Titolare e la responsabilità è sua, non nostra.
Alcune associazioni hanno già un commercialista o un consulente che se ne occupa: in quel caso il
costo può essere vicino a zero.

⚠️ **C'è anche una promessa già scritta nella policy da mantenere:** la **cancellazione
dell'account e dei dati**, che oggi **non è implementata** (è in Fase 2). Non costa soldi, costa
sviluppo — ma è promessa in un documento legale, quindi non è opzionale a tempo indefinito.

## 📊 Totale Parte A — andare online adesso

| | Primo anno | Dal secondo anno |
|---|---|---|
| **Minimo tecnico** (solo dominio) | **~10-20 €** | **~10-20 €/anno** |
| **Con la validazione legale** | **~110-520 €** ⚠️ | **~10-20 €/anno** |

**In pratica: con qualche decina di euro il sito è online e funzionante.** La voce che fa la
differenza è quella legale, che è una tantum e dipende da chi la fa.

---

# PARTE B — Miglioramenti, e quanto costano

> Nessuno di questi serve per andare online. Sono scelte da fare **dopo**, quando il sito è vivo
> e si vede come viene usato davvero. Li ho messi in ordine di quanto li consiglio.

## B.1 — 🥇 Supabase Pro — **~25 $/mese** ⚠️ · *il primo che consiglierei*

**Cosa risolve:** backup automatici giornalieri, niente pausa per inattività, risorse molto più
ampie.

**Quando ha senso:** **non al go-live, ma al primo contenuto vero che nessuno può ricreare.** Il
giorno in cui ci sono le foto di un raduno vero e i profili dei soci, l'assenza di backup smette
di essere un dettaglio tecnico e diventa un rischio sulle persone.

**È il più importante della lista** perché è l'unico che protegge da un danno **irreversibile**.
Tutti gli altri migliorano qualcosa; questo evita di perdere qualcosa.

## B.2 — 🥈 Monitoraggio degli errori — **0 → ~26 $/mese** ⚠️

**Cosa risolve:** oggi, se un utente incontra un errore, **nessuno lo viene a sapere**. Non
arriva nessuna notifica: lo scopriamo solo se quella persona si lamenta con qualcuno.

**Opzioni:** strumenti come Sentry hanno un piano gratuito che per un sito di questa scala è
probabilmente sufficiente ⚠️. Si parte da zero e si paga solo se il volume cresce.

**Perché è alto in classifica:** costa poco o niente e cambia il modo in cui si scoprono i
problemi — da "un socio si lamenta" a "lo sappiamo prima di lui".

## B.3 — 🥉 Statistiche di visita — **0 → ~10 €/mese** ⚠️

**Cosa risolve:** sapere quante persone visitano, quali raduni interessano, se il sito viene
usato dai telefoni. Al cliente questi numeri di solito interessano parecchio.

⚠️ **Attenzione al costo nascosto, che non è in euro:** Google Analytics comporta **cookie di
profilazione**, quindi va aggiunto al banner dei consensi e alla cookie policy — cioè lavoro in
più e un'esperienza peggiore per chi visita. Le alternative *privacy-friendly* (Plausible,
Fathom, o le analytics di Netlify) **non usano cookie**, non richiedono consenso e non toccano il
banner: costano una decina di euro al mese ma **fanno risparmiare complicazioni legali**.

**Consiglio:** se si vogliono le statistiche, prendere quelle senza cookie. La versione "gratis"
di Google costa in complessità legale più di quanto risparmi.

## B.4 — Dominio email del club — **~0-5 €/mese** ⚠️

**Cosa risolve:** avere `info@nomedelclub.it` invece di un indirizzo Gmail. Una volta comprato il
dominio, alcune soluzioni sono gratuite (inoltro semplice verso una casella esistente), altre
costano pochi euro al mese (casella vera con Google Workspace o simili).

Utile soprattutto perché nella privacy policy va indicato **un indirizzo di contatto del
Titolare**, e un indirizzo personale lì dentro fa una figura diversa.

## B.5 — Netlify Pro — **~19 $/mese per membro** ⚠️

**Cosa risolve:** più banda e minuti di build, protezione con password degli ambienti di prova,
supporto.

**Quando ha senso:** francamente, **non presto**. I limiti del piano gratuito sono lontanissimi
per un sito di club. Da riconsiderare solo se il sito cresce molto o se serve far rivedere al
cliente delle anteprime private.

## B.6 — Piano email a pagamento — **da ~20 $/mese** ⚠️

Serve solo se le registrazioni superano i volumi del piano gratuito del provider scelto. Per un
club della Marsica è uno scenario **improbabile**: qualche migliaio di email al mese sono tante.

## B.7 — Spese che NON sono di infrastruttura

Le metto perché in un preventivo vero compaiono, e vengono sempre dimenticate:

| Voce | Stima | Note |
|---|---|---|
| **Fotografo / foto di qualità** | variabile | Il sito vive di immagini. Le foto brutte si vedono più di qualunque dettaglio tecnico |
| **Logo professionale** | variabile | Oggi ce n'è uno; se il club vuole crescere, un rifacimento è una spesa tipica |
| **Sviluppo della Fase 2** | tempo | News, mappa dei raduni, gestione utenti, cancellazione account |

---

## 🧭 In sintesi: la risposta alla tua domanda

**Per andare online adesso ti serve comprare una cosa sola: il dominio, ~10-20 € l'anno.**
Tutto il resto del funzionamento — hosting, database, login, anti-bot, email — **parte
legittimamente da zero**, senza trucchi e senza violare i termini di nessuno.

La spesa che invece va messa in conto sul serio è **la validazione legale delle pagine privacy e
cookie**, perché il sito raccoglie dati di persone vere e quel documento oggi è dichiaratamente
una bozza. È una tantum, e va decisa col cliente perché il Titolare è lui.

**Poi, quando il sito sarà vivo e con contenuti veri**, la prima spesa ricorrente che consiglierei
è **Supabase Pro (~25 $/mese)** — non per le prestazioni, ma perché è l'unica che protegge da una
perdita di dati **irreversibile**.

⚠️ **Un'ultima cosa da tenere a mente:** i piani gratuiti sono gratuiti **finché il fornitore
decide che lo siano**. È già successo che cambino le condizioni proprio su ciò che ci serviva —
Vercel col divieto di uso commerciale, Supabase coi template email. Non è un motivo per non
usarli, è un motivo per **non costruirci sopra una promessa al cliente** che non possiamo
mantenere da soli.

---

## 🔗 Da verificare prima di attivare qualunque cosa

| Cosa | Dove |
|---|---|
| Listino Supabase | https://supabase.com/pricing |
| Listino Netlify | https://www.netlify.com/pricing/ |
| Listino Resend | https://resend.com/pricing |
| Prezzi dominio `.it` | confrontare più registrar |
| Termini d'uso commerciale | **rileggere sempre**: è la clausola che ha già escluso Vercel |

**Controllare in particolare:** che l'uso commerciale resti permesso sul piano gratuito scelto,
quante email al mese include davvero il piano email, e se il registrar del dominio include la
privacy WHOIS o la fa pagare a parte.
