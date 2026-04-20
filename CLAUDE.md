# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server at http://localhost:5173
npm run build      # Production build to dist/
npm run preview    # Serve production build at http://localhost:4173
npm run lint       # Run ESLint
```

No test suite is configured.

## Environment Setup

Copy `.env.example` to `.env` and fill in Firebase credentials:
- `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`
- Optional: `VITE_OPENAI_API_KEY` (AI study routine generation falls back to demo mode if absent)

## Architecture

**CampusCal** is a React 18 + Firebase SPA — a campus timetable and group scheduling tool with two user roles: `student` and `admin`.

### State Management

Three Context providers, composed in [main.jsx](src/main.jsx) → [App.jsx](src/App.jsx):

| Context | File | Provides |
|---|---|---|
| `AuthContext` | [src/context/AuthContext.jsx](src/context/AuthContext.jsx) | `user`, `role`, `isAdmin`, auth functions |
| `CalendarContext` | [src/context/CalendarContext.jsx](src/context/CalendarContext.jsx) | `collegeEvents`, `studentEvents`, `allEvents` |
| `ToastContext` | [src/context/ToastContext.jsx](src/context/ToastContext.jsx) | `toast.success/error/info()` |

`CalendarContext` merges two real-time Firestore `onSnapshot` streams and normalizes them to react-big-calendar's `{ id, title, start, end }` shape.

### Routing

React Router v6. All authenticated routes render inside `AppShell` (sidebar + topbar layout). Two guards wrap routes:
- `RequireAuth` — redirects unauthenticated users to `/login`
- `RequireRole role="admin"` — redirects non-admins to `/dashboard`

### Firestore Collections

- `users/{uid}` — profile + role (`student` | `admin`). Admin role auto-assigned if email/displayName contains "admin".
- `collegeEvents/{id}` — shared lectures/exams/assignments (admin-managed)
- `studentEvents/{id}` — personal events scoped by `studentId`

### Services Layer

[src/services/](src/services/) contains pure functions (no React/JSX):
- [firebase.js](src/services/firebase.js) — initializes app, exports `auth`, `db`, `googleProvider`
- [auth.js](src/services/auth.js) — signup/login, `getUserRole()`, `ensureUserDoc()`
- [collegeEvents.js](src/services/collegeEvents.js) — CRUD + real-time subscriber for college events
- [studentEvents.js](src/services/studentEvents.js) — CRUD + real-time subscriber for personal events; `batchCreateStudentEvents()` used by AI routine
- [aiService.js](src/services/aiService.js) — calls OpenAI GPT-3.5-turbo, falls back to demo generator

### Styling

Tailwind CSS with a custom Notion-inspired dark theme. Dark mode toggled via `class` strategy (`dark` on `<html>`). Custom colors are defined under `brand` and `notion` keys in [tailwind.config.js](tailwind.config.js). Global styles + react-big-calendar overrides live in [src/index.css](src/index.css).

### Build Notes

Vite splits the bundle into manual chunks: Firebase libraries and calendar libraries are separated to avoid a single large chunk. The warning threshold is set to 900 KB in [vite.config.js](vite.config.js). Deployed on Vercel — SPA rewrites configured in [vercel.json](vercel.json).
