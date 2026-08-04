# COSTI — Marsica Car Meet

> Documento vivo. Prima stesura: **2026-08-04**, alla chiusura della Fase 1E (staging).
> Serve a rispondere a due domande distinte: **quanto costa andare online adesso** e
> **quanto costano i miglioramenti**, che sono cose diverse e vanno decise separatamente.

## 💰 Il vincolo di budget, che viene prima di tutto il resto

**Il budget è limitato e le spese ricorrenti vanno evitate in fase iniziale.** In particolare
**una spesa da ~25 $/mese non è sostenibile adesso**, ed è un vincolo dichiarato dall'utente, non
una preferenza da bilanciare con altre.

**Conseguenza pratica su come leggere questo file:** la **Parte A** è l'unica che riguarda il
presente, e la sua risposta è **il dominio e basta**. La **Parte B** è materiale per decidere
**più avanti**, quando ci sarà un motivo concreto e magari un budget diverso — non è una lista
della spesa e **niente lì dentro va comprato ora**.

Dove un piano a pagamento risolve un problema vero, questo file indica anche **come affrontare
lo stesso problema a costo zero**. Nella maggior parte dei casi si può.

## ✅ Stato delle cifre

**I listini sono stati verificati il 2026-08-04** sui siti dei fornitori (Supabase, Netlify,
Resend). Le voci verificate non hanno il simbolo ⚠️; quelle ancora stimate — dominio,
validazione legale, servizi non ancora scelti — ce l'hanno.

🚨 **I listini cambiano, e su questo progetto è già successo due volte in corso d'opera:** Vercel
ha vietato l'uso commerciale sul piano gratuito, e Supabase ha bloccato la personalizzazione dei
template email sul free. **Netlify ha cambiato modello a settembre 2025 e di nuovo ad aprile
2026**, passando ai "credits". Ricontrolla prima di attivare qualcosa; i link sono in fondo.

Le cifre sono **IVA esclusa** e quasi tutte in **dollari**: il costo reale dipende anche dal
cambio.

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

*Verificato il 2026-08-04.* ⚠️ **Netlify ha cambiato modello due volte** (settembre 2025 e aprile
2026): i piani nuovi vanno a **"credits"** invece che a limiti separati.

| Piano | Costo | Cosa dà |
|---|---|---|
| **Free** (attuale) | **0** | **300 credits/mese**, equivalenti a ~100 GB di banda, 300 minuti di build, 125.000 invocazioni di function e 1 milione di edge function. Dominio personalizzato e HTTPS inclusi |
| **Personal** | **9 $/mese** | Più credits; superamento banda ~20 credits/GB |

**Il gratuito basta, e con margine.** Le foto **non passano da qui**: stanno su Supabase Storage e
pesano sul suo egress (A.3), non sulla banda Netlify. Da Netlify passano solo pagine e
JavaScript, che sono leggeri. I minuti di build si consumano solo quando si pubblica codice nuovo.

🚨 **Una cosa da sapere, però, ed è severa:** se un sito supera i limiti del piano Free,
**viene sospeso per il resto del mese solare**. Non rallentato: sospeso. Netlify manda avvisi al
50%, 75%, 90% e 100% — **vanno letti**, non archiviati.

⚠️ **Da controllare sul nostro account:** questo sito è nato a luglio 2026, quindi dovrebbe essere
già sul modello a credits. Vale la pena aprire una volta la sezione consumi del dashboard per
vedere a che ritmo si consumano davvero.

**Cosa accetti restando gratis:** nessun supporto, e la **protezione con password** degli ambienti
di prova resta a pagamento — l'abbiamo già incontrata durante lo staging, quando avremmo voluto
dare al cliente un link protetto.

## A.3 — Database e login (Supabase) 🟡 **gratis funziona, ma un limite va tenuto d'occhio**

*Numeri verificati sul listino il 2026-08-04.*

| | **Free** (attuale) | **Pro** — 25 $/mese |
|---|---|---|
| Database | **500 MB** | 8 GB, poi 0,125 $/GB |
| Foto (storage) | **1 GB** | 100 GB, poi 0,0213 $/GB |
| 🚨 **Traffico in uscita (egress)** | **5 GB/mese** | 250 GB, poi 0,09 $/GB |
| Utenti attivi al mese | 50.000 | 100.000 |
| Pausa per inattività | dopo **1 settimana** | **mai** |
| Backup | **nessuno** | 7 giorni |
| Storico dei log | **1 ora** | 7 giorni |

🚨 **Sul piano free i limiti sono FISSI: non esiste il pagamento a consumo.** Non si rischia una
bolletta a sorpresa — si rischia che **il servizio si fermi**. È una differenza importante: il
danno non è economico, è il sito che smette di funzionare.

### 🔢 Il numero che conta davvero: **5 GB di traffico al mese**

**Non è lo spazio a essere stretto, è il traffico.** Sono due cose diverse e vengono confuse
sempre: lo spazio lo consumi **una volta** quando carichi una foto; il traffico lo consumi **ogni
volta che qualcuno la guarda**.

Facendo i conti con le misure reali di questo progetto — una foto compressa pesa **150-190 KB**,
misurato in collaudo (4,1 MB → 186 KB; 6,75 MB → 158 KB) — ecco **quanto spazio c'è prima del
limite**, usando 175 KB come media:

| Limite | Quanto ci sta | Verdetto |
|---|---|---|
| **Spazio foto (1 GB)** | circa **5.800 foto** ≈ 190 album da 30 | 🟢 **lontanissimo** |
| **Database (500 MB)** | decine di migliaia di eventi, iscrizioni e profili (sono solo testo) | 🟢 **irrilevante** |
| **Traffico (5 GB/mese)** | ~**975** album da 30 foto guardati per intero, **oppure** ~**4.900** aperture di `/eventi` con 6 copertine, **oppure** ~**9.700** aperture della home | 🟡 **è questo il collo di bottiglia** |

**Quindi la risposta alla domanda "quando servirà il Pro?" è: non per lo spazio — semmai per il
traffico.** E il traffico non dipende da quanto carichi, ma da **quanto il sito viene guardato**.

**Cosa significa in pratica:** per un club locale, con qualche centinaio di visite al mese, 5 GB
bastano. Il momento di rischio è **un album di un raduno riuscito che gira sui social**: qualche
centinaio di persone che aprono la stessa galleria possono consumare il mese in pochi giorni.

⚠️ **Un fattore che gioca a favore e che non ho quantificato:** le foto stanno dietro una CDN e i
browser le tengono in cache, quindi chi torna sul sito non le riscarica. I conti qui sopra sono
quindi **prudenti** — il consumo reale sarà più basso. Di quanto, non lo so senza misurarlo.

### ✅ E si allarga gratis: **mancano le miniature**

🔎 **Trovato guardando il codice:** [`compress.ts:7`](../src/lib/images/compress.ts) genera **una
sola misura**, 1600 px sul lato lungo. Non esistono miniature. Vuol dire che la **griglia**
dell'album, le **copertine** degli eventi e gli **avatar** scaricano ogni volta l'immagine
**intera** da 175 KB, anche quando sul display occupa 300 px.

**Generando anche una miniatura al momento del caricamento** (stessa funzione, un secondo passaggio
a ~400 px, indicativamente 20-30 KB) il traffico delle griglie **calerebbe di circa 6-8 volte**.
Quelle ~4.900 aperture di `/eventi` diventerebbero **decine di migliaia**.

**È lavoro di sviluppo, non una spesa**, e vale più del piano Pro: allontana il limite di quasi un
ordine di grandezza a **costo zero**. Se un giorno il traffico diventasse un problema, **questa è
la prima cosa da fare, non l'abbonamento.**

### La pausa a 7 giorni

Non è il problema che sembra, una volta pubblici: scatta per *inattività*, e un sito vivo con
visitatori non si ferma mai. Era un problema sullo **staging**, dove passavano giorni senza che
nessuno lo aprisse — ed è ancora il caso finché è solo il cliente a guardarlo ogni tanto.

**Il problema vero del piano free è un altro: non ci sono backup.** Se qualcosa cancella i dati —
un errore, una migrazione sbagliata, un guaio del fornitore — **non c'è modo di tornare
indietro**. Finché ci sono tre eventi demo non importa niente. Quando ci saranno i profili veri
dei soci, le loro auto e gli album dei raduni, quel rischio cambia natura: **sono contenuti che
le persone non possono ricreare**.

### ✅ E si risolve senza pagare: il backup costa zero

**Il piano Pro non è l'unico modo di avere dei backup, ed è il più caro.** La Supabase CLI —
che il progetto ha già installato come dipendenza — sa esportare tutto:

```bash
npx supabase db dump --db-url "<connection string>" -f backup-AAAA-MM-GG.sql
```

Le **foto** stanno nei bucket dello Storage e si scaricano a parte, sempre da CLI o con uno
script.

Si può fare **a mano** (un promemoria mensile) oppure **automatizzare gratis** con una GitHub
Action pianificata: il piano gratuito di GitHub include minuti più che sufficienti per un dump
settimanale.

🚨 **Attenzione a dove finisce il file, però: un dump contiene i dati personali dei soci.**
**Non committarlo nel repository** — nemmeno privato: resterebbe nella cronologia git per
sempre, e sarebbe difficile da cancellare davvero se qualcuno chiedesse la rimozione dei propri
dati. Meglio un artifact con scadenza, o un archivio cifrato fuori dal repo.

**Quindi:** il piano free **va benissimo**, e i backup si fanno lo stesso. Il Pro si valuta solo
se un giorno il lavoro manuale diventa un peso o servono davvero le risorse maggiori — vedi
Parte B, dove è **materiale per il futuro, non una spesa da fare ora**.

## A.4 — Email di autenticazione (SMTP) 🟡 **gratis, ma solo col dominio**

*Resend verificato il 2026-08-04.*

| Opzione | Costo | Limiti |
|---|---|---|
| **Servizio Supabase incluso** (attuale) | **0** | 🚨 **2 email/ora**, template **inglesi bloccati**, footer "powered by Supabase" |
| **Resend**, piano gratuito | **0** | **3.000 email/mese**, max **100 al giorno**, **1 dominio** verificabile |
| Resend Pro | 20 $/mese (50.000 email) | Molto oltre il necessario |
| Altri provider (Brevo, Mailgun…) | 0 su piani base ⚠️ | Da confrontare se Resend non convince |

**3.000 email al mese e 100 al giorno sono abbondanti**: sono email di *autenticazione*, cioè una
per registrazione e una per reset password. Cento al giorno vorrebbe dire cento nuovi soci in un
giorno solo.

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

⚠️ **Ma va fatto DOPO il dominio, non prima.** Il piano gratuito verifica **1 dominio**, e senza
un dominio verificato i provider email limitano pesantemente i destinatari — in genere si può
spedire solo a sé stessi, il che qui sarebbe inutile. La pagina del listino non lo dettaglia, ma
è la regola comune del settore: **le due voci sono legate e vanno in quest'ordine.**

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

> 🚨 **Niente di tutto questo serve, e niente di tutto questo va comprato ora.** Sono scelte da
> valutare **più avanti**, quando il sito è vivo, si vede come viene usato davvero, e magari il
> budget è diverso. Dato il vincolo dichiarato in cima al file, l'ordine qui sotto parte da
> **ciò che si ottiene gratis**.

## B.1 — 🥇 Le due cose gratis che valgono più di quelle a pagamento

**Costano zero e coprono i due rischi reali della fase iniziale.**

**a) Backup fatti da noi — 0 €.** Vedi il riquadro in A.3: `supabase db dump` da CLI, a mano o
automatizzato con una GitHub Action. Chiude il **solo** vero motivo per cui si guarderebbe al
piano Pro. ⚠️ Il dump contiene dati personali: non finisce nel repository.

**b) Monitoraggio degli errori — 0 €.** Oggi, se un socio incontra un errore, **nessuno lo viene
a sapere**: lo si scopre solo se si lamenta con qualcuno. Strumenti come Sentry hanno un piano
gratuito che per questa scala è quasi certamente sufficiente ⚠️. Si paga **solo** se il volume
cresce, e a quel punto vorrà dire che il sito è usato davvero.

**Se dovessi fare una cosa sola dopo il go-live, farei queste due, e non spenderei niente.**

## B.2 — Supabase Pro — **25 $/mese** · 🔕 *non ora*

**Cosa dà:** 8 GB di database, 100 GB di foto, **250 GB di traffico**, backup di 7 giorni, niente
pausa.

**Perché NON serve adesso**, con i numeri verificati:
- **I backup** si fanno gratis col dump da CLI (B.1a). Era l'unico argomento davvero forte.
- **La pausa a 7 giorni** non riguarda un sito pubblico con visitatori.
- **Lo spazio non è il problema**: 1 GB sono ~5.800 foto, cioè ~190 album da 30. Lontanissimo.
- **Il traffico è l'unica cosa da guardare**, e prima di pagare c'è **una mossa gratuita che vale
  6-8 volte tanto**: generare le miniature (vedi A.3).

### 🎯 La soglia concreta, così non è più un'ipotesi

**Riparlarne quando il consumo di traffico supera stabilmente il 75% dei 5 GB** — cioè ~3,7 GB al
mese per due mesi di fila. Si legge nel dashboard Supabase, alla voce dei consumi.

**E anche allora, nell'ordine:** ⑴ prima le **miniature**, che costano zero e spostano il limite
di quasi un ordine di grandezza; ⑵ solo se il traffico continua a crescere **dopo** quella
modifica, il Pro diventa la scelta giusta — e a quel punto vorrà dire che il sito è usato
davvero, il che è una bella notizia.

**Da non fare:** attivarlo "per stare tranquilli". Sono 300 $ l'anno per risolvere un problema
che oggi non esiste e che, quando esisterà, si affronta prima gratis.

## B.3 — Statistiche di visita — **0 → ~10 €/mese** ⚠️

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

## B.5 — Netlify Personal — **9 $/mese**

**Cosa risolve:** più credits (banda, build, function) e la protezione con password degli
ambienti di prova.

**Quando ha senso:** **non presto.** Le foto non passano da Netlify, quindi la banda qui resta
bassa. L'unico motivo plausibile è volere link privati protetti da password per far rivedere
qualcosa al cliente — comodità, non necessità. 🚨 Tenere però d'occhio gli avvisi di consumo: sul
piano Free il superamento **sospende il sito** fino a fine mese.

## B.6 — Resend Pro — **20 $/mese** (50.000 email)

Serve solo superando **3.000 email/mese o 100 al giorno** del piano gratuito. Per un club della
Marsica è uno scenario **molto improbabile**: sono email di autenticazione, una per iscrizione.

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

**Nessuna spesa ricorrente è necessaria**, e questo vale anche dopo il go-live.

**Sulla domanda "quando servirà Supabase Pro?", ora la risposta è precisa: non per lo spazio.**
Lo spazio foto (1 GB) regge circa **5.800 foto**, cioè ~190 album da 30: è lontanissimo. L'unico
limite che si può toccare davvero è il **traffico in uscita, 5 GB al mese** — che non dipende da
quanto carichi, ma da **quanto il sito viene guardato**.

**E prima di pagare c'è una mossa gratuita che vale di più:** oggi il progetto genera **una sola
misura** delle immagini (1600 px), quindi anche le griglie e gli avatar scaricano il file intero.
Aggiungere le **miniature** ridurrebbe il traffico di **6-8 volte** — molto più di quanto serva.
È sviluppo, non spesa.

**Soglia da tenere d'occhio:** consumo di traffico stabilmente sopra il **75% dei 5 GB** per due
mesi. Prima le miniature, e solo se non basta, il Pro.

⚠️ **Un'ultima cosa da tenere a mente:** i piani gratuiti sono gratuiti **finché il fornitore
decide che lo siano**. È già successo che cambino le condizioni proprio su ciò che ci serviva —
Vercel col divieto di uso commerciale, Supabase coi template email. Non è un motivo per non
usarli, è un motivo per **non costruirci sopra una promessa al cliente** che non possiamo
mantenere da soli.

---

## 🔗 Da verificare prima di attivare qualunque cosa

| Cosa | Dove | Verificato |
|---|---|---|
| Listino Supabase | https://supabase.com/pricing | ✅ 2026-08-04 |
| Listino Netlify | https://www.netlify.com/pricing/ | ✅ 2026-08-04 |
| Listino Resend | https://resend.com/pricing | ✅ 2026-08-04 |
| Prezzi dominio `.it` | confrontare più registrar | ⚠️ stimato |
| Validazione legale | professionista o consulente del club | ⚠️ stimato |
| Termini d'uso commerciale | **rileggere sempre**: è la clausola che ha già escluso Vercel | — |

**Controllare in particolare:** che l'uso commerciale resti permesso sul piano gratuito scelto, e
se il registrar del dominio include la privacy WHOIS o la fa pagare a parte.

## 📈 Cosa guardare, e ogni quanto

| Cosa | Dove | Soglia d'allarme |
|---|---|---|
| **Traffico Supabase** | dashboard Supabase, sezione consumi | **oltre 3,7 GB/mese** (75% di 5 GB) → prima le miniature |
| Spazio foto Supabase | idem | oltre 750 MB (75% di 1 GB) |
| **Consumi Netlify** | dashboard Netlify | leggere gli avvisi al 50/75/90%: al 100% **il sito viene sospeso** |
| Email inviate | dashboard del provider | oltre 75 al giorno (su 100) |

**Una volta al mese basta.** Il rischio non è la bolletta — sui piani gratuiti non c'è addebito a
consumo — **è il servizio che si ferma**.
