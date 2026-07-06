# ARCHITECTURE — Marsica Car Meet

> Documento vivo. Ultima modifica: 2026-07-06.
> Ogni scelta architetturale va motivata e registrata qui.

## 1. Principi guida

1. **Semplicità gestibile da un solo sviluppatore** (affiancato dall'AI).
2. **Managed services** per ridurre il codice di backend e la manutenzione.
3. **Sicurezza a due livelli**: controllo server-side + Row Level Security nel DB.
4. **Modularità**: componenti riutilizzabili, responsabilità isolate, TypeScript.
5. **Pronto a crescere** da locale a regionale senza riscritture.
6. **Costo iniziale €0** con free tier; nessun lock-in critico.

## 2. Stack tecnologico

| Livello | Tecnologia | Motivazione |
|---|---|---|
| Framework | **Next.js 15 (App Router)** + React 19 + TypeScript | Pagine SSR (SEO), Server Components, routing integrato, un solo codebase. |
| Styling | **TailwindCSS 4** | Riuso diretto del design del mockup. |
| i18n | **next-intl** | Routing per locale IT/EN, integrato con App Router. |
| Auth | **Supabase Auth** | Registrazione/login/reset pronti, gestione sessione, ruoli. |
| Database | **Supabase Postgres** | DB relazionale gestito, RLS integrata. |
| Storage | **Supabase Storage** | Avatar, foto auto, media gallery. |
| Icone/anim. | **lucide-react**, **motion** | Già usati nel mockup. |
| Deploy app | **Cloudflare Pages** | Gratis, uso commerciale consentito, scalabile. |
| Deploy backend | **Supabase (managed)** | Free tier con uso commerciale/produzione consentito. |

> **Nota deploy:** Vercel Hobby è escluso perché il suo free tier vieta l'uso commerciale;
> il progetto include una vetrina shop, quindi si è scelto Cloudflare Pages per evitare
> ambiguità legali. La scelta resta cambiabile.

## 3. Diagramma dei livelli

```
┌───────────────────────────────────────────────┐
│  BROWSER — React 19 UI, Tailwind, i18n IT/EN   │
└───────────────────────┬───────────────────────┘
                        │ HTTP / RSC
┌───────────────────────▼───────────────────────┐
│  NEXT.JS (App Router) — Cloudflare Pages       │
│  • Pagine pubbliche SSR (SEO)                  │
│  • Server Components + Server Actions          │
│  • Middleware: sessione, ruoli, locale         │
│  • Route groups: (public) (auth) (admin)       │
└───────────────────────┬───────────────────────┘
                        │ @supabase/ssr (server + client)
┌───────────────────────▼───────────────────────┐
│  SUPABASE (managed backend)                    │
│  • Postgres (schema relazionale)               │
│  • Auth (email/password, sessioni)             │
│  • Storage (avatar, foto auto, gallery)        │
│  • Row Level Security (policy per tabella)     │
└────────────────────────────────────────────────┘
```

## 4. Struttura delle cartelle (target)

```
src/
  app/
    [locale]/
      (public)/
        page.tsx               # home
        eventi/                # elenco + [slug]
        news/                  # elenco + [slug]
        gallery/
        mappa/
        shop/                  # vetrina + [id]
        login/  registrati/
        privacy/  cookie/
      (auth)/
        dashboard/
        garage/                # elenco + nuovo/[id]
        profilo/  impostazioni/
      (admin)/
        admin/                 # eventi, news, gallery, utenti, contenuti
      layout.tsx
      not-found.tsx
    api/                       # route handler dove servono
  components/
    ui/                        # bottoni, card, input, badge (riutilizzabili)
    layout/                    # header, footer, nav, mobile-menu
    features/                  # eventi/, garage/, gallery/, shop/, events/
  lib/
    supabase/                  # client.ts, server.ts, middleware.ts
    auth/                      # helper ruoli/permessi
    utils/
  i18n/                        # config + messaggi it.json / en.json
  types/                       # tipi condivisi (evoluzione di src/types.ts)
  styles/                      # global.css / tailwind
supabase/
  migrations/                  # schema SQL versionato
  seed.sql                     # dati iniziali (primo admin, ecc.)
docs/                          # questa documentazione
```

## 5. Modello dati (schema relazionale)

> Notazione: PK = chiave primaria, FK = chiave esterna. Campi indicativi, rifiniti in fase di implementazione.

### `profiles`
| Campo | Tipo | Note |
|---|---|---|
| id | uuid PK | = `auth.users.id` |
| name | text | |
| tag | text | handle univoco |
| avatar_url | text | Storage |
| role | enum(`member`,`organizer`,`admin`) | default `member` |
| bio | text | |
| license_type / license_status | text | richiamo estetico mockup |
| created_at | timestamptz | |

### `vehicles`
| Campo | Tipo | Note |
|---|---|---|
| id | uuid PK | |
| owner_id | uuid FK → profiles | |
| make / model | text | |
| year | int | |
| class | text | |
| image_url | text | Storage |
| specs | jsonb | potenza, peso, trazione, motore, 0–100 |
| created_at | timestamptz | |

### `events`
| Campo | Tipo | Note |
|---|---|---|
| id | uuid PK | |
| slug | text unique | URL leggibile |
| title / description | text | |
| location | text | |
| coords | jsonb / point | lat/lng per mappa |
| starts_at / ends_at | timestamptz | |
| capacity | int | posti massimi |
| status | enum(`upcoming`,`ongoing`,`completed`,`canceled`) | |
| type | text | Rally, Meet, Track Day… |
| cover_url | text | Storage |
| created_by | uuid FK → profiles | |

### `event_registrations`
| Campo | Tipo | Note |
|---|---|---|
| id | uuid PK | |
| event_id | uuid FK → events | |
| user_id | uuid FK → profiles | unique(event_id, user_id) |
| status | enum(`going`,`waitlist`,`canceled`) | |
| created_at | timestamptz | |

### `event_vehicles`
| Campo | Tipo | Note |
|---|---|---|
| id | uuid PK | |
| registration_id | uuid FK → event_registrations | |
| vehicle_id | uuid FK → vehicles | auto portata all'evento |

### `posts` (news/blog) — *Fase 2*
| Campo | Tipo | Note |
|---|---|---|
| id | uuid PK | |
| slug | text unique | |
| title / body | text | |
| cover_url | text | |
| author_id | uuid FK → profiles | |
| status | enum(`draft`,`published`) | |
| published_at | timestamptz | |

### `gallery_media` — *Fase 2*
| Campo | Tipo | Note |
|---|---|---|
| id | uuid PK | |
| event_id | uuid FK → events (nullable) | |
| uploader_id | uuid FK → profiles | |
| type | enum(`image`,`video`) | |
| url | text | Storage o link esterno |
| caption | text | |
| approved | bool | moderazione |

### `products` (vetrina merch) — *Fase 3*
| Campo | Tipo | Note |
|---|---|---|
| id | uuid PK | |
| name / tagline / description | text | |
| price | numeric | solo visualizzazione |
| image_url / gallery | text / jsonb | |
| category | text | |
| is_limited / stock | bool / int | |

### `hotspots` — *Fase 2* (oppure derivati dagli eventi con coordinate)
| Campo | Tipo | Note |
|---|---|---|
| id | uuid PK | |
| name / description | text | |
| type | enum(`meet`,`run`,`hangout`) | |
| coords | jsonb | |
| status | enum(`active`,`packed`,`quiet`) | |
| event_id | uuid FK → events (nullable) | |

## 6. Sicurezza (Row Level Security)

- RLS abilitata su tutte le tabelle.
- Lettura pubblica per contenuti pubblici (events, posts published, gallery approved, products).
- Scrittura ristretta: l'utente modifica solo le proprie risorse (`owner_id = auth.uid()`);
  operazioni admin richiedono `profiles.role = 'admin'`.
- Doppio controllo: Server Actions/Route verificano il ruolo prima di chiamare il DB.

## 7. Internazionalizzazione

- `next-intl` con segmento `[locale]` nell'URL (`/it`, `/en`).
- File messaggi `i18n/it.json`, `i18n/en.json`.
- Contenuti dinamici (eventi, news): al lancio in lingua singola; strategia multilingua
  dei contenuti (campi tradotti) valutata in fase successiva.

## 8. Deploy & ambienti

| Ambiente | App | Backend |
|---|---|---|
| Sviluppo | `next dev` locale | progetto Supabase dev |
| Produzione | Cloudflare Pages | progetto Supabase prod |

- Variabili d'ambiente: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY` (solo server).
- Migrazioni DB versionate in `supabase/migrations/`.

## 9. Migrazione dal mockup (Vite → Next.js)

- I componenti React del mockup (`DashboardView`, `GarageView`, `ShopView`, ecc.) vengono
  riportati come componenti riutilizzabili sotto `components/features/`.
- La navigazione a `useState` di `App.tsx` viene sostituita dal **routing di Next**.
- I dati finti di `data.ts` vengono sostituiti da query a Supabase.
- Il design/stile Tailwind viene mantenuto e ribrandizzato (VELOCITY → Marsica Car Meet).

## 10. Decisioni aperte / da confermare

| # | Tema | Stato |
|---|---|---|
| D-1 | Upload video diretto vs solo embed esterno | Rimandato a Fase 2 |
| D-2 | Strategia contenuti multilingua (eventi/news tradotti) | Da definire in Fase 2 |
| D-3 | Attivazione ruolo Organizzatore | Fase 3+ |
| D-4 | Provider e-commerce (se/quando) | Fase 4 |

## 11. Registro delle decisioni (ADR sintetico)

| Data | Decisione | Motivazione |
|---|---|---|
| 2026-07-06 | Stack Next.js + Supabase | Professionale e scalabile, gestibile da solo dev, requisiti (DB relazionale, auth+ruoli, storage) coperti da managed services. |
| 2026-07-06 | Deploy su Cloudflare Pages (no Vercel Hobby) | Uso commerciale consentito, evita zona grigia ToS di Vercel per la vetrina shop. |
| 2026-07-06 | i18n IT/EN dall'inizio | Richiesta esplicita; struttura predisposta subito. |
| 2026-07-06 | GDPR predisposto da subito | Raccolta dati personali di utenti UE. |
| 2026-07-06 | E-commerce come sola vetrina | Nessun pagamento al lancio; checkout rimandato. |
| 2026-07-06 | Rimozione dipendenza AI/Gemini | Non necessaria al lancio; reintroducibile in futuro. |
