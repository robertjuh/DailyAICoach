# Dagelijkse Routine App

**Technische Specificatie**

- **Datum:** 17 maart 2026
- **Versie:** 1.0
- **Status:** Draft
- **Gebaseerd op:** Functionele Spec v1.0

---

## Scope van dit document

Dit document beschrijft de technische architectuur, technologiekeuzes, database-ontwerp, API-structuur, AI-integratie en deployment-strategie voor de **Dagelijkse Routine App**.

- **Primary AI:** OpenAI API (gpt-5.4-mini)
- **Toekomstige uitbreiding:** Anthropic Claude API voor aanvullende functionaliteit

---

# 1. Technologie Stack

## 1.1 Overzicht

| Laag | Keuze |
|---|---|
| Frontend | Next.js 15 (React 19) + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Backend | Next.js API Routes (serverless) — later uitbreidbaar naar aparte Node.js service |
| Database | PostgreSQL via Supabase (auth + realtime + storage inbegrepen) |
| ORM | Prisma |
| AI — primair | OpenAI API (gpt-5.4-mini) |
| AI — toekomst | Anthropic Claude API (claude-sonnet-4-6) voor aanvullende functionaliteit |
| Auth | Supabase Auth (e-mail/wachtwoord + Google OAuth + Apple OAuth) |
| Push notif. | Web Push API (browser) + Firebase Cloud Messaging (iOS/Android via PWA) |
| Deployment | Vercel (frontend + API) + Supabase (DB + Auth) |
| Monitoring | Vercel Analytics + Sentry (errors) + PostHog (events) |

## 1.2 Motivatie technologiekeuzes

### Next.js + Supabase
Next.js combineert frontend en backend in één project, wat iteratiesnelheid maximaliseert voor een klein team. Supabase biedt PostgreSQL, Auth, Realtime en Storage als managed service — geen aparte servers nodig in de beginfase.

### OpenAI API (GPT-4o) als primaire AI
GPT-4o biedt de beste balans tussen redeneersnelheid, kosten en multimodaliteit. De OpenAI API is goed gedocumenteerd en breed ingezet. Structured Outputs (JSON mode) maakt betrouwbare parsing van AI-responses mogelijk.

### Geheugenlaag (intern) i.p.v. lange context
LLMs hebben een beperkt contextvenster. In plaats van volledige gesprekshistorie mee te sturen, bouwen we een lichtgewicht geheugenlaag in de database. Bij elke AI-call worden alleen relevante fragmenten als context ingeladen. Dit is goedkoper, sneller en schaalbaarder.

### Toekomstige uitbreiding: Claude API
Anthropic Claude kan later worden ingezet voor specifieke taken zoals diepgaande routineanalyse, het genereren van wekelijkse samenvattingen of als alternatief AI-model. De architectuur is zo opgezet dat meerdere AI-providers verwisselbaar zijn via een abstractielaag.

---

# 2. Systeemarchitectuur

## 2.1 High-level diagram

De app bestaat uit vier hoofdlagen die via duidelijke grenzen communiceren.

| Laag | Componenten | Verantwoordelijkheid |
|---|---|---|
| Client (browser/PWA) | Next.js React app, Service Worker | UI rendering, offline caching, push notificaties ontvangen |
| API laag | Next.js API Routes (`/api/**`) | Authenticatie, business logica, AI-orchestratie, DB-toegang |
| AI Service laag | OpenAI Client, Memory Builder, Prompt Manager | Contextopbouw, API calls, response parsing, geheugenopslag |
| Data laag | PostgreSQL (Supabase), Prisma ORM | Persistente opslag van gebruikers, routines, logs, geheugen |

## 2.2 Request flow — AI coach gesprek

Stap-voor-stap verloop van een gebruikersbericht naar de AI coach en terug.

| Stap | Actie | Component |
|---|---|---|
| 1 | Gebruiker stuurt bericht via chat UI | Next.js Client |
| 2 | `POST /api/chat` — JWT gevalideerd, `user_id` geëxtraheerd | API Route (middleware) |
| 3 | Relevante herinneringen ophalen uit `memory_entries` tabel | Memory Service |
| 4 | Actieve routine, doelen en recente logs ophalen uit DB | Context Builder |
| 5 | System prompt samenstellen: persoonlijkheid + geheugen + context | Prompt Manager |
| 6 | OpenAI API aanroepen met samengestelde `messages` array | AI Service |
| 7 | Response parsen; eventuele acties uitvoeren (routine-update, log opslaan) | Action Handler |
| 8 | Nieuw geheugenitem opslaan als bericht relevant is voor lange termijn | Memory Service |
| 9 | Antwoord streamen naar client via Server-Sent Events | API Route (stream) |

---

# 3. Database Ontwerp

## 3.1 Entiteiten overzicht

De database bestaat uit de volgende kerntabellen. Alle tabellen hebben standaard `created_at` en `updated_at` timestamps.

| Tabel | Beschrijving | Gekoppeld aan |
|---|---|---|
| `users` | Gebruikersprofiel, voorkeuren, notificatie-instellingen | Supabase Auth (`auth.users`) |
| `routines` | Routine definitie met naam, type, status (actief/archief) | `users` |
| `routine_items` | Individuele routine-blokken: naam, duur, volgorde | `routines` |
| `daily_logs` | Dagelijkse voltooiing van routine-items (ja/nee + tijdstip) | `users`, `routine_items` |
| `check_ins` | Dagelijkse check-in: energie, focus, stemming (1-5 schaal) | `users` |
| `memory_entries` | Geheugenlaag: samengevatte kennis over de gebruiker | `users` |
| `conversations` | Gespreksthread met AI coach (één per gebruiker per dag) | `users` |
| `messages` | Individuele berichten in een gesprek (user + assistant) | `conversations` |
| `goals` | Lange-termijndoelen van de gebruiker (persistent) | `users` |
| `weekly_summaries` | Automatisch gegenereerde weeksamenvatting | `users` |
| `push_tokens` | FCM/Web Push tokens per apparaat | `users` |
| `admin_prompts` | Beheersbare system prompts en routinesjablonen | (geen FK, globaal) |

## 3.2 Prisma schema (vereenvoudigd)

```prisma
// prisma/schema.prisma

model User {
  id                String          @id @default(cuid())
  supabase_id       String          @unique   // koppeling met auth.users
  name              String
  email             String          @unique
  timezone          String          @default("Europe/Amsterdam")
  onboarding_done   Boolean         @default(false)
  notif_enabled     Boolean         @default(true)
  notif_time        String?         // bijv. "07:30"
  routines          Routine[]
  daily_logs        DailyLog[]
  check_ins         CheckIn[]
  memory_entries    MemoryEntry[]
  conversations     Conversation[]
  goals             Goal[]
  push_tokens       PushToken[]
  weekly_summaries  WeeklySummary[]
  created_at        DateTime        @default(now())
  updated_at        DateTime        @updatedAt
}

model Routine {
  id          String        @id @default(cuid())
  user_id     String
  name        String        // bijv. "Ochtendroutine"
  type        RoutineType   // MORNING | EVENING | CUSTOM
  is_active   Boolean       @default(true)
  items       RoutineItem[]
  user        User          @relation(fields: [user_id], references: [id])
}

model RoutineItem {
  id           String   @id @default(cuid())
  routine_id   String
  name         String   // bijv. "Mediteren"
  duration_min Int      // duur in minuten
  order        Int      // volgorde binnen routine
  routine      Routine  @relation(fields: [routine_id], references: [id])
  daily_logs   DailyLog[]
}

model DailyLog {
  id              String      @id @default(cuid())
  user_id         String
  routine_item_id String
  date            DateTime    @db.Date
  completed       Boolean
  completed_at    DateTime?
  user            User        @relation(fields: [user_id], references: [id])
  routine_item    RoutineItem @relation(fields: [routine_item_id], references: [id])
  @@unique([user_id, routine_item_id, date])
}

model CheckIn {
  id         String   @id @default(cuid())
  user_id    String
  date       DateTime @db.Date
  energy     Int      // 1-5
  focus      Int      // 1-5
  mood       Int      // 1-5
  note       String?
  user       User     @relation(fields: [user_id], references: [id])
  @@unique([user_id, date])
}

model MemoryEntry {
  id           String     @id @default(cuid())
  user_id      String
  category     MemoryCat  // GOAL | PREFERENCE | PATTERN | MILESTONE | CONTEXT
  content      String     // samengevatte tekst voor AI context
  relevance    Float      @default(1.0)  // daalt over tijd (decay)
  source       String?    // bijv. "conversation", "weekly_summary"
  expires_at   DateTime?  // optionele vervaldatum
  user         User       @relation(fields: [user_id], references: [id])
  created_at   DateTime   @default(now())
}

model Goal {
  id          String   @id @default(cuid())
  user_id     String
  title       String   // bijv. "Piano leren"
  description String?
  is_active   Boolean  @default(true)
  user        User     @relation(fields: [user_id], references: [id])
}

model Conversation {
  id         String    @id @default(cuid())
  user_id    String
  date       DateTime  @db.Date
  messages   Message[]
  user       User      @relation(fields: [user_id], references: [id])
  @@unique([user_id, date])
}

model Message {
  id              String       @id @default(cuid())
  conversation_id String
  role            MessageRole  // USER | ASSISTANT
  content         String
  created_at      DateTime     @default(now())
  conversation    Conversation @relation(fields: [conversation_id], references: [id])
}
```

---

# 4. API Ontwerp

## 4.1 Basisprincipes

- Alle endpoints beginnen met `/api/v1/`
- Authenticatie via Supabase JWT Bearer token in `Authorization` header
- Requests en responses in JSON
- Foutresponses volgen RFC 7807 (`application/problem+json`)
- Rate limiting:
  - `60 req/min` per gebruiker op standaard endpoints
  - `20 req/min` op AI endpoints

## 4.2 Endpoints per module

### Auth (afgehandeld door Supabase Auth — geen custom endpoints nodig)

| Endpoint | Methode | Beschrijving |
|---|---|---|
| `/auth/v1/signup` | POST | Registratie via Supabase Auth SDK |
| `/auth/v1/token` | POST | Login (e-mail/wachtwoord of OAuth) |
| `/auth/v1/recover` | POST | Wachtwoordherstel e-mail |
| `/auth/v1/user` | GET | Huidig ingelogde gebruiker |

### Gebruiker & Onboarding

| Endpoint | Methode | Beschrijving | Body / Params |
|---|---|---|---|
| `/api/v1/users/me` | GET | Eigen profiel ophalen | — |
| `/api/v1/users/me` | PATCH | Profiel bijwerken (naam, timezone, notif.) | `{ name, timezone, notif_time }` |
| `/api/v1/onboarding` | POST | Onboarding voltooien: doelen + routinepunten opslaan | `{ goals[], routine_items[] }` |

### Routines

| Endpoint | Methode | Beschrijving | Body / Params |
|---|---|---|---|
| `/api/v1/routines` | GET | Alle routines van gebruiker | `?type=MORNING` |
| `/api/v1/routines` | POST | Nieuwe routine aanmaken | `{ name, type, items[] }` |
| `/api/v1/routines/:id` | GET | Specifieke routine ophalen | — |
| `/api/v1/routines/:id` | PUT | Routine bijwerken (incl. items) | `{ name, items[] }` |
| `/api/v1/routines/:id` | DELETE | Routine archiveren | — |
| `/api/v1/routines/active` | GET | Actieve routine van vandaag ophalen | — |

### Dagelijkse Logs & Check-ins

| Endpoint | Methode | Beschrijving | Body / Params |
|---|---|---|---|
| `/api/v1/logs` | GET | Logs ophalen (filter op datum) | `?from=&to=` |
| `/api/v1/logs` | POST | Routine-item voltooiing registreren | `{ routine_item_id, date, completed }` |
| `/api/v1/logs/batch` | POST | Meerdere voltooiingen tegelijk opslaan | `{ items: [{...}] }` |
| `/api/v1/checkins` | GET | Check-in history ophalen | `?from=&to=` |
| `/api/v1/checkins` | POST | Dagelijkse check-in opslaan | `{ energy, focus, mood, note }` |
| `/api/v1/checkins/today` | GET | Check-in van vandaag (als die bestaat) | — |

### AI Coach (Chat)

| Endpoint | Methode | Beschrijving | Opmerkingen |
|---|---|---|---|
| `/api/v1/chat` | POST | Stuur bericht naar AI coach; response via SSE stream | `Content-Type: text/event-stream` |
| `/api/v1/chat/history` | GET | Gesprekshistorie van vandaag ophalen | `?date=YYYY-MM-DD` |
| `/api/v1/chat/suggestions` | GET | Proactieve AI-aanbevelingen ophalen | Max 3 per dag; gecached |

### Voortgang & Statistieken

| Endpoint | Methode | Beschrijving | Params |
|---|---|---|---|
| `/api/v1/progress/streak` | GET | Huidige streak berekenen | — |
| `/api/v1/progress/weekly` | GET | Wekelijkse consistentiescore + top-items | `?week=YYYY-Www` |
| `/api/v1/progress/summary` | POST | Wekelijkse AI-samenvatting genereren | `{ week }` — max 1x/week |
| `/api/v1/progress/export` | GET | Maandoverzicht exporteren als PDF | `?month=YYYY-MM` |

### Notificaties

| Endpoint | Methode | Beschrijving | Body |
|---|---|---|---|
| `/api/v1/notifications/subscribe` | POST | Push token registreren voor apparaat | `{ token, platform }` |
| `/api/v1/notifications/settings` | PATCH | Notificatievoorkeur bijwerken | `{ enabled, time }` |

### Admin

| Endpoint | Methode | Beschrijving | Rol vereist |
|---|---|---|---|
| `/api/v1/admin/users` | GET | Gebruikersoverzicht + statistieken | ADMIN |
| `/api/v1/admin/prompts` | GET | Alle AI-prompts ophalen | ADMIN |
| `/api/v1/admin/prompts/:id` | PUT | Prompt aanpassen | ADMIN |
| `/api/v1/admin/templates` | GET | Routinesjablonen ophalen | ADMIN |
| `/api/v1/admin/templates` | POST | Nieuw sjabloon aanmaken | ADMIN |
| `/api/v1/admin/templates/:id` | PUT | Sjabloon bijwerken / publiceren | ADMIN |

---

# 5. AI-integratie

## 5.1 OpenAI API configuratie

| Onderdeel | Waarde |
|---|---|
| Model (primair) | `gpt-4o` |
| Model (snel/goedkoop) | `gpt-4o-mini` (voor check-in analyse, triage) |
| Output format | JSON mode (Structured Outputs) voor acties; streaming text voor chat |
| Max tokens | 1024 voor coaching responses; 2048 voor wekelijkse samenvattingen |
| Temperature | 0.7 voor coaching chat; 0.3 voor planning en analyses |
| Streaming | Server-Sent Events (SSE) via Next.js Edge Runtime |

## 5.2 Geheugenlaag — architectuur

De geheugenlaag is de kern van de AI-personalisatie. In plaats van volledige gesprekshistorie te sturen, bewaren we samengevatte, categorische kennis over de gebruiker.

### Geheugencategorieën (`MemoryCat`)

| Categorie | Beschrijving | Voorbeeldinhoud | Vervaltijd |
|---|---|---|---|
| GOAL | Lange-termijndoelen van de gebruiker | "Wil piano leren, streeft naar 20 min/dag" | Nooit |
| PREFERENCE | Persoonlijke voorkeuren en stijl | "Houdt van korte, directe adviezen. Niet van jargon" | 1 jaar |
| PATTERN | Waargenomen gedragspatronen | "Mist routines op maandagochtend. Energiedip rond 14:00" | 90 dagen |
| MILESTONE | Bereikte mijlpalen en successen | "14-daagse streak behaald op 12 maart" | 6 maanden |
| CONTEXT | Tijdelijke relevante context | "Geeft aan gestrest te zijn door werk deze week" | 7 dagen |

### Context samenstelling per AI call

```ts
// lib/ai/context-builder.ts

async function buildContext(userId: string): Promise<string> {
  const [user, goals, memories, activeRoutine, recentLogs, todayCheckin] =
    await Promise.all([
      db.user.findUnique({ where: { id: userId } }),
      db.goal.findMany({ where: { user_id: userId, is_active: true } }),
      db.memoryEntry.findMany({
        where: { user_id: userId },
        orderBy: { relevance: 'desc' },
        take: 10,  // Top 10 meest relevante herinneringen
      }),
      getActiveRoutine(userId),
      getRecentLogs(userId, 7),     // Laatste 7 dagen
      getTodayCheckin(userId),
    ]);

  return `
GEBRUIKERSPROFIEL:
Naam: ${user.name} | Tijdzone: ${user.timezone}

DOELEN (lang termijn):
${goals.map(g => `- ${g.title}`).join('\n')}

GEHEUGEN (relevante feiten):
${memories.map(m => `[${m.category}] ${m.content}`).join('\n')}

ACTIEVE OCHTENDROUTINE:
${activeRoutine?.items.map(i => `- ${i.name} (${i.duration_min} min)`).join('\n') ?? 'Geen actieve routine'}

VOORTGANG AFGELOPEN 7 DAGEN:
${formatRecentLogs(recentLogs)}

VANDAAG CHECK-IN:
${todayCheckin ? `Energie: ${todayCheckin.energy}/5, Focus: ${todayCheckin.focus}/5, Stemming: ${todayCheckin.mood}/5` : 'Nog niet ingevoerd'}
  `.trim();
}
```

### System prompt structuur

```ts
// lib/ai/prompts/coach-system.ts

export function buildSystemPrompt(context: string, adminPrompt: string): string {
  return `
Je bent een persoonlijke dagelijkse routinecoach. Je helpt de gebruiker om
consistente gewoonten op te bouwen die aansluiten bij hun doelen en levensstijl.

KARAKTER:
- Warm, bemoedigend maar eerlijk
- Kort en praktisch — geen lange lezingen
- Stel nooit meer dan één vraag tegelijk
- Sla nooit de positieve voortgang over, hoe klein ook

${adminPrompt}

GEBRUIKERSCONTEXT:
${context}

INSTRUCTIES:
- Gebruik altijd de naam van de gebruiker
- Verwijs naar specifieke routine-items en doelen als dat relevant is
- Als de gebruiker iets nieuws deelt dat je moet onthouden, eindig je
  antwoord dan met: [MEMORY: <categorie>: <samenvatting in max 1 zin>]
- Antwoord altijd in het Nederlands
  `.trim();
}
```

### Geheugen opslaan na AI response

```ts
// lib/ai/memory-service.ts

const MEMORY_REGEX = /\[MEMORY:\s*(\w+):\s*(.+?)\]/g;

async function extractAndSaveMemories(userId: string, response: string) {
  const matches = [...response.matchAll(MEMORY_REGEX)];
  for (const match of matches) {
    const [, category, content] = match;
    await db.memoryEntry.create({
      data: {
        user_id:  userId,
        category: category as MemoryCat,
        content:  content.trim(),
        source:   'conversation',
      }
    });
  }
}

// Dagelijkse cron: relevantie laten 'vervagen' voor oude herinneringen
async function decayMemoryRelevance() {
  await db.$executeRaw`
    UPDATE memory_entries
    SET relevance = relevance * 0.95
    WHERE created_at < NOW() - INTERVAL '7 days'
    AND expires_at IS NULL
  `;
}
```

## 5.3 Toekomstige Claude API integratie

De AI-servicelaag is gebouwd als een abstractie. Elke AI-provider implementeert dezelfde interface, waardoor Claude API eenvoudig naast of in plaats van OpenAI kan worden ingezet.

```ts
// lib/ai/providers/base.ts
interface AIProvider {
  chat(messages: Message[], options: ChatOptions): Promise<ReadableStream>;
  complete(prompt: string, options: CompletionOptions): Promise<string>;
}

// lib/ai/providers/openai.ts — huidige implementatie
export class OpenAIProvider implements AIProvider { ... }

// lib/ai/providers/anthropic.ts — toekomstige implementatie
// Gebruik: claude-sonnet-4-6 voor wekelijkse samenvattingen en diepgaande analyse
export class AnthropicProvider implements AIProvider { ... }

// Selectie op basis van taaktype:
const provider = task === 'weekly_summary'
  ? new AnthropicProvider()   // Claude voor complexe langere outputs
  : new OpenAIProvider();     // GPT-4o voor dagelijkse chat
```

### Claude API — aanbevolen use cases

- Wekelijkse samenvattingen genereren (meer nuance, langere output)
- Diepgaande routineanalyse over meerdere weken
- A/B test als alternatief coaching-model
- Verwerking van lange gespreksgeschiedenissen waarbij context extra belangrijk is

---

# 6. Authenticatie & Autorisatie

## 6.1 Supabase Auth flow

```ts
// Registratie
const { data, error } = await supabase.auth.signUp({
  email, password,
  options: { emailRedirectTo: `${SITE_URL}/auth/confirm` }
});

// OAuth (Google / Apple)
await supabase.auth.signInWithOAuth({
  provider: 'google',  // of 'apple'
  options: { redirectTo: `${SITE_URL}/auth/callback` }
});

// JWT validatie in API middleware
// middleware.ts
const token = request.headers.get('Authorization')?.replace('Bearer ', '');
const { data: { user } } = await supabase.auth.getUser(token);
if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
```

## 6.2 Rollen

### USER
Standaard gebruikersrol. Toegang tot eigen data via `/api/v1/**`.

### ADMIN
Toegang tot `/api/v1/admin/**`. Opgeslagen als custom claim in Supabase JWT.

## 6.3 Row Level Security (RLS)

Supabase RLS policies zorgen dat gebruikers uitsluitend hun eigen data kunnen lezen en schrijven, ook bij directe database-toegang.

```sql
-- Voorbeeld RLS policy voor daily_logs
CREATE POLICY "users_own_logs" ON daily_logs
  FOR ALL USING (user_id = auth.uid()::text);

-- Voorbeeld RLS policy voor memory_entries
CREATE POLICY "users_own_memory" ON memory_entries
  FOR ALL USING (user_id = auth.uid()::text);
```

---

# 7. Push Notificaties

## 7.1 Architectuur

| Platform / onderdeel | Implementatie |
|---|---|
| Browser (desktop) | Web Push API via Service Worker. Token opgeslagen in `push_tokens` tabel. |
| iOS / Android | Firebase Cloud Messaging (FCM) via PWA manifest. Zelfde FCM SDK voor beide platformen. |
| Verzending | Vercel Cron Job roept `/api/v1/cron/notifications` aan op het ingestelde tijdstip per gebruiker. |

## 7.2 Notificatietypes

| Type | Trigger | Inhoud |
|---|---|---|
| Ochtendroutine | Cron op gebruikersingesteld tijdstip | "Goedemorgen {naam}, je routine staat klaar!" |
| Check-in herinnering | Cron om 20:00 als geen check-in vandaag | "Vergeet je dagelijkse check-in niet." |
| Streakwaarschuwing | Als huidige streak ≥ 3 en vandaag nog niet gelogged | "Je {n}-daagse streak staat op het spel!" |
| Wekelijkse samenvatting | Cron elke zondag 18:00 | "Je weekoverzicht is klaar — bekijk je voortgang." |
| AI aanbeveling | Proactief gegenereerd op basis van patroondetectie | Persoonlijk advies van AI coach |

---

# 8. Beveiliging

## 8.1 Maatregelen

| Risico | Maatregel |
|---|---|
| Ongeautoriseerde API-toegang | JWT vereist op alle endpoints; Supabase RLS als tweede vangnet |
| AI prompt injection | User input wordt gesanitized; system prompt gescheiden van user input via roles |
| OpenAI API kosten overschrijding | Rate limiting per user (20 req/min AI); `max_tokens` hard beperkt; alert bij hoog gebruik |
| Persoonsgegevens in AI calls | Gebruikersnaam en e-mail worden **NIET** meegestuurd naar OpenAI. Alleen `user_id` als referentie. |
| AVG / GDPR compliance | Data opgeslagen in EU (Supabase EU region). Gebruiker kan account + data verwijderen via `/api/v1/users/me DELETE`. |
| XSS / CSRF | Next.js server components; geen client-side token opslag in `localStorage`; `SameSite` cookies |
| SQL injection | Prisma parameterized queries; geen raw SQL met user input |

---

# 9. Deployment & Infrastructuur

## 9.1 Omgevingen

| Omgeving | Platform | Branch | Doel |
|---|---|---|---|
| Development | Lokaal + Supabase local | `feature/*` | Lokale ontwikkeling |
| Staging | Vercel Preview | `develop` | Testen vóór release; QA |
| Production | Vercel + Supabase Cloud | `main` | Live gebruikers |

## 9.2 Environment variabelen

```bash
# .env.local (nooit committen!)

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...         # Alleen server-side

# OpenAI
OPENAI_API_KEY=sk-...

# Anthropic (toekomstig)
ANTHROPIC_API_KEY=sk-ant-...

# Firebase (push notificaties)
FIREBASE_PROJECT_ID=dagelijkse-routine
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----...
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@...
NEXT_PUBLIC_FIREBASE_VAPID_KEY=BJU...

# App
NEXT_PUBLIC_SITE_URL=https://app.dagelijkserouting.nl
CRON_SECRET=random-secret-voor-cron-beveiliging
```

## 9.3 Cron jobs (Vercel)

| Job | Schedule | Actie |
|---|---|---|
| Ochtendroutine notificatie | `0 5 * * *` (UTC) | Per gebruiker: push sturen op ingesteld tijdstip |
| Check-in herinnering | `0 18 * * *` (UTC) | Push als geen check-in vandaag |
| Wekelijkse samenvatting | `0 16 * * 0` (UTC) | AI-samenvatting genereren + push sturen |
| Memory relevance decay | `0 2 * * *` (UTC) | `relevance * 0.95` voor herinneringen ouder dan 7 dgn |
| Streak berekening | `0 3 * * *` (UTC) | Streak-counters bijwerken voor alle gebruikers |

---

# 10. Projectstructuur

```text
dagelijkse-routine-app/
├── app/                         # Next.js App Router
│   ├── (auth)/                  # Login, registratie, onboarding pagina's
│   ├── (dashboard)/             # Beschermde pagina's: dashboard, routine, voortgang
│   ├── admin/                   # Admin paneel (rol-beschermd)
│   └── api/                     # API routes
│       └── v1/
│           ├── chat/
│           ├── routines/
│           ├── logs/
│           ├── checkins/
│           ├── progress/
│           ├── notifications/
│           ├── admin/
│           └── cron/
├── lib/
│   ├── ai/
│   │   ├── providers/           # openai.ts, anthropic.ts (toekomst)
│   │   ├── context-builder.ts   # Contextopbouw voor AI calls
│   │   ├── memory-service.ts    # Geheugenlaag lezen/schrijven
│   │   └── prompts/             # System prompts (coach, analyse, samenvatting)
│   ├── db/
│   │   ├── client.ts            # Prisma client singleton
│   │   └── queries/             # Herbruikbare DB-queries per domein
│   ├── auth/
│   │   ├── middleware.ts        # JWT validatie helper
│   │   └── supabase.ts          # Supabase client factory (server/browser)
│   └── notifications/
│       ├── web-push.ts
│       └── fcm.ts
├── components/                  # React componenten (shadcn/ui + custom)
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── public/
│   ├── manifest.json            # PWA manifest
│   └── sw.js                    # Service Worker
└── tests/
    ├── unit/
    └── integration/
```

---

# 11. Ontwikkelvolgorde (Fasen)

## Fase 1 — Fundament (week 1–2)

- Supabase project aanmaken + Prisma schema migreren
- Next.js project scaffolden met TypeScript + Tailwind + shadcn/ui
- Auth flow: registratie, inloggen, Google OAuth, sessie
- Basis API middleware (JWT validatie, foutafhandeling)
- Onboarding flow: doelen + routine-items opslaan (US01 + US02)

## Fase 2 — Kern routine & logging (week 3–4)

- Routine builder UI + API (US02)
- Dagelijkse check-in scherm + API (US04)
- Routine voltooiing loggen (`DailyLog`) + API
- Basis voortgangsdashboard: streak, voltooiingspercentage (US06)

## Fase 3 — AI Coach (week 5–6)

- OpenAI API integratie + streaming chat
- Context builder + memory service implementeren (US05)
- Chat UI in dashboard
- Geheugenparsing uit AI responses + opslaan
- Proactieve aanbevelingen genereren (US03)

## Fase 4 — Notificaties & Samenvattingen (week 7–8)

- PWA configuratie: manifest + service worker
- Web Push + FCM integratie
- Cron jobs voor notificaties
- Wekelijkse samenvattingen genereren (AI) (US06)
- PDF export van maandoverzicht

## Fase 5 — Admin & Afwerking (week 9–10)

- Admin dashboard: gebruikersstatistieken
- Contentbeheer: routinesjablonen beheren (US07)
- Prompt management systeem
- Performance optimalisatie + foutafhandeling
- Sentry + PostHog integratie

---

_Dagelijkse Routine App · Technische Specificatie v1.0 · Intern document_
