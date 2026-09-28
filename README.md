# 🌳 LearnTree

> A lightweight, zero-AI progress engine and spaced-repetition tracker that turns unstructured syllabus notes into interactive study trees.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Stack: Next.js](https://img.shields.io/badge/Stack-Next.js%2014-black)](https://nextjs.org/)
[![Styling: Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-blue)](https://tailwindcss.com/)

---

## 📌 The Problem

Self-directed learners, students, and developers save hundreds of bookmarks, YouTube playlists, documentation links, and PDFs, but struggle with:
* **Information Overload:** Losing track of what has been studied versus what was merely bookmarked.
* **Lack of Structure:** Having learning materials scattered across browser tabs and notes apps.
* **Forgetting Curve:** Lacking a structured review system, causing previously learned concepts to fade.

## 💡 The Solution

**LearnTree** solves information overload and retention issues with zero artificial intelligence overhead or API costs. Users paste simple indented text or Markdown lists, which are instantly parsed into a visual progress tree. Completing a topic automatically queues it into an integrated spaced-repetition engine to lock in long-term memory.

---

## ✨ Key Features

* **⚡ Instant Tree Parsing:** Paste raw Markdown or indented bullet points to automatically render collapsible nested syllabus trees.
* **📊 Visual Completion Metrics:** Track overall and section-by-section completion percentages dynamically.
* **🧠 Spaced Repetition Engine (SM-2):** Automated review scheduling based on active recall intervals (e.g., 3, 7, 14, 30 days) to optimize long-term retention.
* **🔒 100% Client-Side & Private:** All data persists locally in your browser (`localStorage`/IndexedDB). No servers, no trackable user accounts, and zero subscriptions.
* **🎯 Daily Active Recall Queue:** A dedicated review dashboard highlighting topics due for review today.

---

## 🚀 Tech Stack

* **Framework:** [Next.js](https://nextjs.org/) (React)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/)
* **Icons:** [Lucide React](https://lucide.dev/)
* **Persistence:** Browser `localStorage` / Client-side storage

---

## 🛠️ Local Development Setup

Follow these steps to run LearnTree locally:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/shivanchowdhry123/LearnTree.git
   cd LearnTree
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   Navigate to `http://localhost:3000` to view the app.

---

## 📋 How It Works

```text
[ Indented Text / Markdown Input ]
                │
                ▼
  [ Deterministic Client Parser ]
                │
                ▼
   [ Interactive Syllabus Tree ] ──► Ticking a Node ──► [ SM-2 Review Scheduler ]
                                                                 │
                                                                 ▼
                                                        [ Active Recall Queue ]
```

---

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.