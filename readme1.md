# 🌳 LearnTree

> A lightweight, zero-AI progress engine and spaced-repetition tracker that turns unstructured syllabus notes into interactive study trees.

## 📌 The Problem

Self-directed learners, students, and developers save hundreds of bookmarks, YouTube playlists, documentation links, and PDFs, but struggle with:

* **Information Overload:** Losing track of what has been studied versus what was merely bookmarked.

* **Lack of Structure:** Having learning materials scattered across browser tabs and notes apps.

* **Forgetting Curve:** Lacking a structured review system, causing previously learned concepts to fade.

## 💡 The Solution

**LearnTree** solves information overload and retention issues with zero artificial intelligence overhead or API costs. Users paste simple indented text or Markdown lists, which are instantly parsed into a visual progress tree. Completing a topic automatically queues it into an integrated spaced-repetition engine to lock in long-term memory.

## ✨ Key Features

* **⚡ Instant Tree Parsing:** Paste raw Markdown or indented bullet points to automatically render collapsible nested syllabus trees.

* **📊 Visual Completion Metrics:** Track overall and section-by-section completion percentages dynamically.

* **🧠 Spaced Repetition Engine (SM-2):** Automated review scheduling based on active recall intervals (e.g., 3, 7, 14, 30 days) to optimize long-term retention.

* **🔒 100% Client-Side & Private:** All data persists locally in your browser (`localStorage`/IndexedDB). No servers, no trackable user accounts, and zero subscriptions.

* **🎯 Daily Active Recall Queue:** A dedicated review dashboard highlighting topics due for review today.

## 🚀 Tech Stack

* **Framework:** [Next.js](https://nextjs.org/?utm_source=gemini) (React)

* **Styling:** [Tailwind CSS](https://tailwindcss.com/?utm_source=gemini)

* **Icons:** [Lucide React](https://lucide.dev/?utm_source=gemini)

* **Persistence:** Browser `localStorage` / Client-side storage

## 🛠️ Local Development Setup

Follow these steps to run LearnTree locally:

1. **Clone the repository:**

   ```
   git clone https://github.com/shivanchowdhry123/LearnTree.git
   cd LearnTree
   
   
   ```

2. **Install dependencies:**

   ```
   npm install
   
   
   ```

3. **Start the development server:**

   ```
   npm run dev
   
   
   ```

4. **Open in browser:**
   Navigate to `http://localhost:3000` to view the app.

## 📋 How It Works

```
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

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.