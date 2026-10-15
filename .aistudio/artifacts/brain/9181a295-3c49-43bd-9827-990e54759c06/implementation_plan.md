# Syllabex Multi-User Architecture & Production Backend Roadmap

Transform Syllabex from a client-side prototype into a resilient, multi-user production platform powered by PocketBase for authentication, structured collections, optimistic local-first state synchronization with conflict resolution, and sanitized shareable syllabus links.

### User Review & Critical Decisions

> [!IMPORTANT]
> The architectural directions below were confirmed in Phase 1 clarification and revised with high-value refinements:
> - **Backend & Persistence**: PocketBase backend for authentication and collections.
> - **Sync Model**: Optimistic local-first cache with background server sync, Last-Write-Wins (LWW) revision vectors, and per-node SM-2 progress merging.
> - **Collaboration Scope**: Personal workspaces with public syllabus sharing links.
> - **Performance & Security**: Denormalized SM-2 due counters for instant dashboard rendering, plus client-side sanitization on public shares.

- **Confirmed Decision 1**: PocketBase provides user identity, session management, and JSON/relational collections (`users`, `repositories`, `study_logs`).
- **Confirmed Decision 2**: Optimistic UI mutations ensure instant response times with an asynchronous queue pushing changes to PocketBase and reconciling server timestamps with smart progress merging.
- **Confirmed Decision 3**: Each syllabus repository can be marked private or public with an automated privacy scrubber removing private notes and personal study metrics before publishing.
- **Confirmed Decision 4**: Top-level repository metadata contains denormalized counters (`due_reviews_count`, `next_due_date`, `mastered_count`, `total_nodes`) enabling lightning-fast cross-syllabus dashboard queries without downloading heavy JSON blobs.

---

### 1. Overview & Core Concept

- **What It Does**: Upgrades Syllabex from an in-memory / local storage demo to a persistent multi-user web application where students and professionals create accounts, log in across devices, manage multiple syllabi with full SM-2 spaced repetition tracking, and share study paths via public links.
- **Target Audience / Persona**: Self-directed learners, computer science students, researchers, and professional cert candidates who require reliable cross-device progress tracking and frictionless syllabus sharing.
- **Key Value**: Instant, zero-latency local-first interaction combined with cloud persistence, multi-device conflict resolution, and secure user authentication without over-engineering or vendor lock-in.

---

### 2. User Experience & Visual Design

- **Key User Flows**:
  1. *Authentication & Onboarding*: User clicks "Sign In / Register" in the top bar. A clean, focused dialog offers email/password authentication or quick demo exploration. Existing local demo data is seamlessly migrated to their new cloud account upon signup.
  2. *Workspace Navigation & Multi-Device Continuity*: Top navigation displays the authenticated user identity (avatar, email/display name, and cloud sync status). Edits made on one device (e.g. laptop) synchronize cleanly with another (e.g. phone) without losing review repetitions.
  3. *Cloud Sync & Conflict Indicators*: A quiet, non-distracting sync status indicator (`Synced`, `Syncing...`, `Merged`, `Offline Cached`) in the top bar provides clear visibility without modal interruptions.
  4. *Sanitized Public Sharing & Cloning*: Repository settings feature a "Share" modal with a toggle: "Public Link". When enabled, the client scrubs personal notes, study logs, and user tokens, generating a permalink (e.g. `/s/:shareSlug`). Visitors can view the interactive tree graph and curriculum table in read-only mode or click "Clone into My Syllabex" to fork the clean syllabus blueprint into their personal workspace.

- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Refined, dark-slate technical workbench tailored for focused study.
  - *Color Palette & Tokens*:
    - Canvas: `#0a0c10` (deep space slate)
    - Structural Panels: `#12151f` and `#1a1e2e` with subtle `#2d3246` hairlines
    - Accent: `#6366f1` (indigo) and `#06b6d4` (cyan) for focused actions
    - Status Indicators: `#10b981` (emerald for synced/mastered), `#f59e0b` (amber for due/syncing), `#ef4444` (rose for offline retry)
  - *Typography & Hierarchy*:
    - Display / Section Headings: `Plus Jakarta Sans` with `text-wrap: balance`
    - Body Prose: `DM Sans` for clean, readable scannability
    - Metrics & Timers: `font-mono tabular-nums` (`JetBrains Mono`) for elapsed time, retention metrics, and SM-2 factors
  - *Top Bar Contract*:
    - Zone 1: `Syllabex` wordmark (single unboxed brand element)
    - Zone 2: Navigation links (`Dashboard`, `Curriculum`, `Review Queue`, `Daily Goal`)
    - Zone 3: Sync pill status + User profile avatar & dropdown with "Sign Out" and "Account Settings"

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: PocketBase as the Embedded Backend Service**
  - *Chosen Approach*: PocketBase REST API integration paired with an Express full-stack proxy in `server.ts` to manage environment configurations, token validation, and client routing.
  - *Why*: Single lightweight service, native SQLite speed, built-in PB auth token verification, simple JSON document fields for nested tree nodes, and instant zero-config schema migrations.
  - *Alternatives Considered*: PostgreSQL with complex ORM migrations (excessive operational overhead for syllabus trees) vs. pure Firebase (adds vendor lock-in and complex firestore pricing rules).

- **Decision 2: Optimistic Local-First Sync Engine with Last-Write-Wins (LWW) & Progress Merging**
  - *Chosen Approach*: In-memory and local storage caching as primary read/write layer. Mutations instantly mutate React state and write to an offline mutation queue (`sync_queue`). During sync, the engine compares record `updated` timestamps. If a collision occurs (e.g. laptop syllabus edits vs. mobile study reviews), it performs a non-destructive per-node merge: keeps structural changes while taking the higher SM-2 repetition/latest review timestamp for study progress.
  - *Why*: Eliminates loading spinners and prevents learners from losing spaced repetition progress when switching between mobile and desktop devices.
  - *Alternatives Considered*: Naive full-blob overwrites (causes data loss if editing on one device while reviewing on another).

- **Decision 3: Denormalized SM-2 Due Counters on Repository Records**
  - *Chosen Approach*: Along with the full `nodes_data` JSON payload, store computed top-level integers: `due_reviews_count`, `next_due_date`, `mastered_count`, and `total_nodes` on each repository record.
  - *Why*: Allows the global Dashboard and header cards to compute due reviews and mastery across all syllabi in a single lightweight SQL query without downloading and deserializing multi-megabyte JSON trees.
  - *Alternatives Considered*: Client-side fetching of all syllabus JSON trees on initial load (causes bandwidth waste and noticeable lag on larger accounts).

- **Decision 4: Client-Side Sanitization Pipeline for Public Shares**
  - *Chosen Approach*: Before a syllabus record is published or updated with `is_public: true`, a sanitization utility scrubs user-private fields: `notes`, `personal_tags`, `reviewHistory`, `localUserTokens`, and resets SM-2 state to clean unstarted baselines.
  - *Why*: Guarantees zero leakage of private learner notes or study habits, delivering a pristine, reusable curriculum template for other users.
  - *Alternatives Considered*: Server-side filtering rules (riskier if fields drift; client-side scrub guarantees what leaves the user's browser is already clean).

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CLIENT VIEWPORT (React 19)                      │
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │ TopNavbar: Brand · View Links · Sync Status · User Menu        │   │
│   └────────────────────────────────────────────────────────────────┘   │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │ Dashboard: Daily Goal Widget · Fast Metric Cards (Denormalized)│   │
│   └────────────────────────────────────────────────────────────────┘   │
│   ┌──────────────────────────────┐  ┌──────────────────────────────┐   │
│   │ SyllabusTreeView (Curriculum)│  │ SyllabusTreeGraph (D3)       │   │
│   └──────────────────────────────┘  └──────────────────────────────┘   │
│                                ▲                                       │
│                                │ Reactive State Updates                │
│   ┌────────────────────────────┴───────────────────────────────────┐   │
│   │           Local State, Sync Engine & Sanitizer                 │   │
│   │  - AuthStore (JWT, User Profile, Session Expiry)               │   │
│   │  - RepoStore (Active Repo, Optimistic Mutations)               │   │
│   │  - SyncEngine (LWW Revision Check + SM-2 Progress Merger)      │   │
│   │  - ShareSanitizer (Scrubs private notes & resets SM-2 metrics) │   │
│   └────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────┬──────────────────────────────────────┘
                                  │ HTTPS / REST API
                                  ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      SERVER RUNTIME (server.ts)                        │
│                                                                        │
│   ┌─────────────────────────────┐    ┌─────────────────────────────┐   │
│   │ Vite Dev / Static Serve     │    │ /api/proxy/* & Healthcheck  │   │
│   └─────────────────────────────┘    └─────────────────────────────┘   │
│                                  │                                     │
│                                  ▼                                     │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │                      PocketBase Service                        │   │
│   │  - /api/collections/users/auth-with-password                   │   │
│   │  - /api/collections/repositories/records                       │   │
│   │    * Denormalized columns: due_reviews_count, next_due_date    │   │
│   │    * Sanitized public payloads for /api/collections/.../share  │   │
│   │  - /api/collections/study_logs/records                         │   │
│   │  - Built-in SQLite Data Engine & Realtime Hooks                │   │
│   └────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

#### A. Data Collections & Schemas (PocketBase)

1. **`users` (System Auth Collection)**:
   - `id`: string (UUID)
   - `email`: string (unique, required)
   - `name`: string
   - `avatar`: file / string
   - `daily_target_minutes`: number (default: 30)

2. **`repositories` (Syllabus Workspaces with Denormalized Review Stats)**:
   - `id`: string (record ID)
   - `user`: relation -> `users.id`
   - `title`: string
   - `description`: string
   - `category`: string
   - `is_public`: boolean (default: false)
   - `share_slug`: string (unique index for public links)
   - `nodes_data`: json (full recursive `SyllabusNode[]` structure)
   - `due_reviews_count`: number (denormalized for fast header queries)
   - `next_due_date`: string (ISO date or empty string)
   - `mastered_count`: number
   - `total_nodes_count`: number
   - `revision`: number (monotonic client mutation counter)
   - `updated`: timestamp

3. **`study_logs` (Daily Tracking & Analytics)**:
   - `id`: string
   - `user`: relation -> `users.id`
   - `repository`: relation -> `repositories.id`
   - `date`: string (`YYYY-MM-DD`)
   - `minutes_spent`: number
   - `nodes_reviewed`: number

#### B. Implementation Phases & Step-by-Step Execution

1. **Phase 1: Backend Setup & Server Integration**
   - Configure full-stack `server.ts` with Express running on port 3000.
   - Set up PocketBase client SDK (`pocketbase`) or lightweight HTTP client adapter in `/src/lib/pocketbase.ts`.
   - Provide fallback configuration and environment variables (`POCKETBASE_URL`).

2. **Phase 2: Authentication System & Session Management**
   - Create `AuthModal.tsx` for Email/Password Login, Signup, and Demo account upgrade.
   - Implement `useAuth` hook and persistent session management with automatic token refresh.
   - Update `TopNavbar.tsx` and `MobileTopBar.tsx` with user profile trigger, login button, and logout action.

3. **Phase 3: Optimistic Local-First Sync Engine with Conflict Resolution & Denormalized Stats**
   - Create `syncEngine.ts`:
     - Tracks local state changes with revision timestamps and monotonic counters.
     - Queues pending mutations in local storage when offline or network fluctuates.
     - Implements **Conflict Resolution**: on server timestamp mismatch, performs non-destructive node-level merge (preserves structural node hierarchy while taking the highest SM-2 repetition / most recent review timestamp).
     - Automatically recalculates and pushes denormalized fields (`due_reviews_count`, `next_due_date`, `mastered_count`) alongside `nodes_data`.
     - Emits sync events (`synced`, `syncing`, `merged`, `error`) to drive the status UI.

4. **Phase 4: Client-Side Sanitization, Public Sharing & Repository Forking**
   - Create `shareSanitizer.ts`:
     - Recursively traverses `SyllabusNode[]` tree before public link creation.
     - Scrubs private user notes, custom user tokens, and personal tags.
     - Resets SM-2 repetition parameters to fresh unreviewed state (`interval: 0, repetitions: 0, easeFactor: 2.5, status: 'unstarted'`).
   - Add `ShareModal.tsx` allowing users to toggle syllabus visibility and copy public share URLs (`/s/:shareSlug`).
   - Implement read-only public viewer route when loading a syllabus via `share_slug`.
   - Add "Clone to My Workspace" action for authenticated visitors to fork the sanitized syllabus.

5. **Phase 5: Verification & End-to-End Testing**
   - Test login/logout lifecycle, session persistence across page reload, offline edits, background sync reconciliation, multi-device review merge, fast denormalized metrics queries, and sanitized public link access.
