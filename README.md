# Syllabex 🌳🧠

> **Systematic Syllabus & Active Recall Spaced Repetition Platform**  
> Transform unstructured curricula, technical roadmaps, and research papers into interactive hierarchical trees powered by the SuperMemo SM-2 algorithm and multi-user cloud synchronization.

---

## 🚀 Overview

**Syllabex** is a production-grade, local-first learning engineering application designed for developers, researchers, and students mastering complex technical domains. It eliminates shallow note-taking by combining:

1. **Hierarchical Knowledge Trees** — File-system-style curricula with DAG dependencies, depth levels, and markdown notes.
2. **SuperMemo SM-2 Spaced Repetition** — Dynamic interval scheduling, ease factor calculations, and daily review queues.
3. **Multi-User Cloud Sync** — PocketBase-compatible backend with encrypted user sessions, optimistic local caching, and revision conflict resolution.
4. **Public Sharing & Cloning** — Instant read-only syllabus links that teammates and study groups can fork into their personal workspace.

---

## ✨ Features

- **Real User Authentication**: Pure email & password signup and login backed by PocketBase. No demo or pre-configured accounts—every learner has an isolated cloud workspace.
- **Interactive Tree & Graph Views**: Seamlessly switch between a nested outline tree view and an interactive 2D Canvas DAG graph with dependency lines and status indicators.
- **SM-2 Active Recall Engine**: Grade cards from 0 (Blackout) to 5 (Effortless) with automatic calculation of intervals, repetition counts, and memory stability curves.
- **Streak & Study Tracking**: Daily study minute goals, consecutive streak counters, and Ebbinghaus retention metrics.
- **Markdown Importer**: Parse standard indented markdown outlines and GitHub README checklists directly into interactive syllabi in seconds.
- **Offline-First Resilience**: Full offline functionality with optimistic updates and automatic background synchronization upon network reconnection.

---

## 🛠️ Architecture & Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend UI** | React 19, TypeScript, Vite, Tailwind CSS |
| **Icons & Design** | Lucide React, JetBrains Mono & Inter typography, dark slate theme |
| **State & Sync** | Custom Optimistic Sync Engine with Revision Vectors & LWW Conflict Resolution |
| **Backend & Auth** | Node.js / Express proxy + PocketBase authentication & record collections |
| **Persistence** | LocalStorage client cache + PocketBase encrypted JSON store (`.data/pocketbase_store.json`) |
| **Graph Visualization**| Canvas 2D rendering with dynamic layout calculation and node hit detection |

---

## 📂 Project Structure

```text
├── index.html                   # HTML entry point with metadata
├── package.json                 # Dependencies and build scripts
├── server.ts                    # Full-stack Express server with PocketBase compatibility
├── vite.config.ts               # Vite configuration with React plugin
├── src/
│   ├── main.tsx                 # Client application bootstrap
│   ├── App.tsx                  # Root application router & state manager
│   ├── index.css                # Global Tailwind CSS and styling variables
│   ├── types/
│   │   ├── syllabus.ts          # SyllabusNode, SM2State, and ReviewRating types
│   │   ├── repo.ts              # SyllabusRepo and repository metadata interfaces
│   │   └── user.ts              # UserProfile and session schemas
│   ├── lib/
│   │   ├── pocketbase.ts        # PocketBase SDK client, auth, and remote repo helpers
│   │   ├── syncEngine.ts        # Background sync queue with revision merge logic
│   │   ├── sm2.ts               # SuperMemo-2 spaced repetition implementation
│   │   ├── parser.ts            # Markdown tree parser and outline generator
│   │   └── userStore.ts         # User repository, streak, and local storage operations
│   └── components/
│       ├── AuthPage.tsx         # Full-page Sign In & Account Registration screen
│       ├── TopNavbar.tsx        # Breadcrumb, search, cloud sync status, and user profile menu
│       ├── Sidebar.tsx           # Syllabus repository drawer, filters, and study goal bar
│       ├── DashboardHeader.tsx  # Key telemetry: due reviews, completion rate, daily minutes
│       ├── SyllabusTreeView.tsx # Hierarchical node tree with inline editing and SM-2 badges
│       ├── SyllabusTreeGraph.tsx# Interactive 2D Canvas dependency graph
│       ├── ReviewDrawer.tsx     # SuperMemo flashcard review session drawer
│       ├── ShareModal.tsx       # Public link generator and sharing modal
│       ├── NodeModal.tsx        # Add/edit vertex title, tags, resources, and notes
│       ├── SettingsModal.tsx    # System settings, storage metrics, and shortcuts
│       └── ProfileSettingsModal.tsx # Student account details, JSON export, and deletion
└── .data/
    └── pocketbase_store.json    # Server-side encrypted multi-user store
```

---

## 🔐 Authentication & Session Flow

1. **Unauthenticated Visits**:
   - If no valid session is found in `pb.authStore`, the app directly renders `AuthPage.tsx`.
   - Users can toggle between **Sign In** and **Create Account**.
   - No mock accounts or default demo profiles are used.
2. **Account Registration**:
   - New users supply their **Name**, **Email**, **Password** (min 6 characters), and their **Primary Focus Area** (e.g. *Distributed Systems*, *Systems Programming*, *Machine Learning*).
   - Upon registration, an avatar color is generated and starter curricula matching their focus area are initialized in their private cloud workspace.
3. **Session Persistence**:
   - PocketBase JWT tokens are securely maintained in browser local storage.
   - Returning visits automatically restore the active profile and sync remote syllabi in the background.
4. **Log Out**:
   - Clicking **Log Out** in the profile dropdown immediately clears the session and returns to the Sign In / Sign Up screen.

---

## 📡 API Reference

The backend exposes a standard PocketBase REST API on port `3000`:

### Authentication
- `POST /api/collections/users/auth-with-password`
  - Body: `{ identity: string, password: string }`
  - Returns: `{ token: string, record: UserProfile }`
- `POST /api/collections/users/records`
  - Body: `{ email, password, name, focusArea, avatarColor, avatarInitials }`
  - Returns: `UserProfile`

### Repositories (Curricula)
- `GET /api/collections/repositories/records?filter=user="<id>"`
  - Returns list of syllabi belonging to the user.
- `POST /api/collections/repositories/records`
  - Creates or updates a syllabus record.
- `GET /api/collections/repositories/records?filter=share_slug="<slug>"`
  - Fetches a public syllabus for read-only preview and forking.

### System Health
- `GET /api/health`
  - Returns server status, uptime, user count, and repository count.

---

## 🚦 Getting Started

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** or **bun**

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/your-username/syllabex.git
cd syllabex

# Install project dependencies
npm install
```

### 3. Running in Development
```bash
# Start both the full-stack server and Vite client
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Building for Production
```bash
# Compile client assets and check TypeScript types
npm run build

# Start production server
npm start
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| <kbd>⌘</kbd> + <kbd>K</kbd> | Focus global search across all syllabus nodes |
| <kbd>⌘</kbd> + <kbd>R</kbd> | Open SuperMemo SM-2 Active Recall Review drawer |
| <kbd>⌘</kbd> + <kbd>I</kbd> | Open Markdown Outline Import modal |
| <kbd>Esc</kbd> | Close active modal or drawer |

---

## 📄 License

MIT © [Syllabex Team](https://syllabex.dev)
