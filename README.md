# CampusCal

> A Notion-style campus calendar that solves three real problems for students on a multi-section campus.

**End-term project** — Building Web Applications with React (Batch 2029).

---

## The three problems it solves

| Problem | How CampusCal solves it |
|---|---|
| **"What's next?"** — Students forget their schedule, which room, which instructor. | A dashboard showing the current class, the next class, and a live countdown. |
| **"Where can I study right now?"** — Rooms sit empty during other sections' class hours, but nobody knows which ones. | A room finder that computes which rooms are free and how long until they're booked. |
| **"When are we all free?"** — Friends in different sections have disjoint schedules. | Create a group, share an invite code, and the app intersects everyone's calendars to find common free time. |

Each is a daily friction point for every student on campus. Unlike a to-do app, these problems **require the multi-user, multi-section structure of real timetable data** — they cannot be solved by a solo tool.

---

## Features

- **Email/password + Google sign-in** (Firebase Auth)
- **Timetable import** — upload an `.xlsx` or `.csv` of your college timetable; the app parses it into recurring events. 15-min rows get automatically consolidated into 1.5h–2h class blocks.
- **Week & Day calendar views** — Notion-style grid, color-coded by subject, with a live "now" line and overlap-lane layout for concurrent events.
- **What's Next dashboard** — current / upcoming class with live countdown, plus a today-timeline that marks past classes as done and the current one as LIVE.
- **Free Right Now** — pick a time (or use now); see every known room and whether it's free / in use, with "until" time.
- **Groups & common free slots** — invite-code joining; green bands on a week grid show when every selected member is simultaneously free.
- **CRUD on events** — add / edit / delete any event. Single real-time Firestore subscription shared across the app.
- **Responsive** — sidebar on desktop, bottom nav on mobile.

---

## Demo data

There's a [sample-timetable.csv](sample-timetable.csv) at the repo root — a full Mon–Fri schedule with 6 subjects across 6 rooms. After signing up, go to **Calendar → Import**, pick that file, and hit import. You'll get **17 events** automatically consolidated from 30 fifteen-minute rows. Every feature (dashboard, rooms, free slots) works immediately.

---

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **React 18** | Hooks-first, course requirement |
| Build tool | **Vite** | Faster HMR than CRA; CRA is deprecated |
| Language | **JavaScript** | Keeps the viva scope on React, not TypeScript |
| Styling | **Tailwind CSS** | Utility-first, ships only used classes |
| Routing | **React Router v6** | Data routers, nested routes, protected-route pattern |
| Auth + DB | **Firebase** (Auth + Firestore) | Zero backend code, real-time subscriptions |
| File parsing | **SheetJS (`xlsx`)** | De-facto standard for browser spreadsheet parsing |
| State | **Context API + custom hooks** | No Redux — scope doesn't justify it |
| Deployment | **Vercel** | Zero-config for Vite projects |

---

## Quick start

```bash
npm install
cp .env.example .env           # fill in your Firebase credentials
npm run dev                    # http://localhost:5173
```

See **[Firebase setup](#firebase-setup)** below for the console steps you'll need to do once.

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the Vite dev server on port 5173 |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the built bundle on port 4173 |

---

## Project structure

```
src/
├── components/
│   ├── auth/          RequireAuth (protected-route wrapper)
│   ├── calendar/      WeekGrid, DayColumn, EventBlock, NowLine, EventForm
│   ├── dashboard/     NextClassCard, TodayList
│   ├── groups/        CommonSlotGrid
│   ├── layout/        AppShell, Sidebar, TopBar
│   └── ui/            Button, Modal, Spinner
├── pages/             One file per route (Login, Dashboard, CalendarPage, ImportPage, RoomsPage, GroupsPage, GroupDetailPage, SettingsPage, NotFound)
├── hooks/             useAuth, useEvents, useNow, useRoomBookings, useMyGroups, useGroupMembersEvents
├── context/           AuthContext, CalendarContext
├── services/          firebase.js (init), auth.js, events.js, groups.js, importer.js
├── utils/             time.js, colors.js, layout.js, freeSlots.js, rooms.js
├── App.jsx            Route table with React.lazy per page
└── main.jsx           Entry point — wraps App in <BrowserRouter> + <AuthProvider>
```

**Separation of concerns:**
- `services/` talks to Firebase — no React, no JSX. Pure functions that return promises or subscriptions.
- `hooks/` adapts those services into React state.
- `utils/` is pure logic — no React, no Firebase. This is where the interesting algorithms live (`freeSlots.js`, `layout.js`).
- `components/` and `pages/` render things and call hooks.

---

## Routes

| Path | Protected | Purpose |
|---|---|---|
| `/` | — | Redirects to `/dashboard` or `/login` |
| `/login`, `/signup` | No | Email/password + Google auth |
| `/dashboard` | Yes | "What's Next" view |
| `/calendar` | Yes | Week/Day grid, `?view=day\|week&date=YYYY-MM-DD` |
| `/calendar/import` | Yes | Upload timetable |
| `/rooms` | Yes | Free Right Now |
| `/groups` | Yes | My groups list |
| `/groups/new`, `/groups/join` | Yes | Create / join by invite code |
| `/groups/:id` | Yes | Common free-slot grid |
| `/settings` | Yes | Account + danger zone |
| `*` | — | 404 |

Protected routes wrap in a `<RequireAuth>` component that reads from `AuthContext` and either shows a spinner (while loading), redirects to `/login`, or renders the matched route via `<Outlet>`.

---

## How the clever bits work

### Timetable consolidation (`services/importer.js`)

College timetables are usually stored as 15-minute slots, but a class that runs 9:00–10:30 fills six consecutive rows with identical text. The importer walks each day column top-to-bottom and, whenever the current cell text matches the previous non-empty cell in the same column and the previous end time equals the current start time, extends the active event's end time instead of creating a new one. When the text changes or the column goes empty, it commits the active event. Result: 30 rows → 17 events.

### Common free-slot intersection (`utils/freeSlots.js`)

For each weekday, start with a single free interval `[day_start, day_end]`. For each member, subtract their busy intervals from the current free list. Subtraction is a straightforward splitting of each free interval around each busy interval. Whatever remains after processing every member is the common free time. Memoized on `[events, members]` so toggling members in the UI doesn't recompute the whole week.

### Overlap-lane layout (`utils/layout.js`)

When two events overlap on the same day, they need to render side-by-side instead of on top of each other. The algorithm sorts events by start time, groups them into "clusters" of mutually-overlapping events, and assigns each one the lowest unused lane number in its cluster. The calendar then renders each event at `left: lane * (100/lanes)%` with `width: (100/lanes)%`.

### Privacy-minimized room data (`services/events.js`)

When a user creates an event, the app also writes a stripped-down document to `roomBookings/{eventId}` containing only `{location, dayOfWeek, startTime, endTime, recurrence}` — no title, no owner, no instructor. The Rooms page reads this collection, so the feature works across users without leaking anyone's private schedule.

---

## React concept coverage

Required concepts from the course brief, mapped to where they live in this codebase.

| Concept | Where |
|---|---|
| Functional components | Every file in `components/` and `pages/` |
| Props & composition | `EventBlock` inside `DayColumn` inside `WeekGrid` |
| `useState` | Every form (`Login`, `Signup`, `EventForm`, `ImportPage`), every modal |
| `useEffect` | `AuthContext` (onAuthStateChanged), `useEvents` (onSnapshot), `useNow` (setInterval), `Modal` (Escape-key listener) |
| Conditional rendering | Loading / error / empty states on every page; `RequireAuth`'s three branches |
| Lists & Keys | Event lists, room cards, group members, preview table |
| Lifting state up | Events live in `CalendarContext`, consumed by Dashboard, CalendarPage, and (indirectly via room bookings) RoomsPage |
| Controlled components | Every form field in the app |
| React Router | `App.jsx` route table, `RequireAuth` + `<Outlet>`, `useParams` in GroupDetailPage, `useSearchParams` in CalendarPage |
| Context API | `AuthContext`, `CalendarContext` |
| `useMemo` | overlap-lane layout (`DayColumn`), events-by-day grouping (`WeekGrid`), common-free computation (`CommonSlotGrid`), room status (`RoomsPage`), week-date array |
| `useCallback` | picked-time handler on RoomsPage |
| `useRef` | file input on ImportPage, scroll-to-8am on WeekGrid mount |
| `React.lazy` + `Suspense` | Every non-shared route in `App.jsx` — check the Vercel network tab and you'll see e.g. `ImportPage-*.js` only loads when you navigate to `/calendar/import` |
| Performance | Lazy routes, manual chunks (firebase + xlsx split out in `vite.config.js`), memoization, single subscription per collection via context |

---

## Firestore data model

```
users/{uid}
  displayName, email, photoURL, createdAt

events/{id}
  ownerUid, calendarId, title, location, instructor,
  dayOfWeek (0–6) or date ("YYYY-MM-DD"),
  startTime, endTime, recurrence ("weekly"|"once"), color, createdAt

roomBookings/{eventId}         — shadow of events, minus private fields
  location, dayOfWeek, date, startTime, endTime, recurrence

groups/{id}
  name, inviteCode, ownerUid, memberUids[], createdAt
```

**Design decisions worth defending in viva:**

- **Why `dayOfWeek` + `startTime` as strings, not a single `Date`?** Recurring events aren't tied to a calendar date. Storing a day-index + wall-clock time avoids timezone bugs when a user's browser timezone differs from where the class runs.
- **Why denormalize `ownerUid` onto events?** Firestore can't do joins. To list "all events where ownerUid == X", it must be on the event doc.
- **Why `memberUids` array on group, instead of a subcollection?** Max group size is small (tens, not thousands). An array supports `array-contains` queries for "groups I'm in" in one round-trip.
- **Why `roomBookings` as a separate collection?** Data minimization — it holds only location + time info, so it's safe to expose to all authenticated users. Events stay owner-private.

---

## Firebase setup

One-time setup in the Firebase Console (<https://console.firebase.google.com>).

### 1. Enable authentication providers
**Authentication → Sign-in method**: enable **Email/Password** and **Google**.

### 2. Create the Firestore database
**Firestore Database → Create database** → pick a region → start in **test mode** for development. Paste the rules below before submission.

### 3. Authorized domains
**Authentication → Settings → Authorized domains**: add `localhost` (already there), plus your Vercel domain(s) after deploying. Google sign-in won't open on a domain that isn't on this list.

### 4. Suggested Firestore security rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /users/{uid} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == uid;
    }

    match /events/{id} {
      allow read, write: if request.auth != null &&
        (resource.data.ownerUid == request.auth.uid ||
         request.resource.data.ownerUid == request.auth.uid);
    }

    match /roomBookings/{id} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }

    match /groups/{id} {
      allow read: if request.auth != null;
      allow create: if request.auth.uid == request.resource.data.ownerUid;
      allow update: if request.auth != null &&
        request.resource.data.memberUids.hasAny([request.auth.uid]);
    }
  }
}
```

---

## Deployment (Vercel)

`vercel.json` is already configured — Vite preset + SPA rewrites so React Router survives a page refresh on deep links.

### Deploy from GitHub

1. Push this repo to GitHub (`.gitignore` keeps `.env`, `api.txt`, and `node_modules` out).
2. On Vercel: **New Project → Import** this repo. Framework is auto-detected as Vite.
3. Expand **Environment Variables** and paste all six `VITE_FIREBASE_*` keys (same names/values as your local `.env`).
4. Click **Deploy**.
5. Copy the deployed URL back into **Firebase → Auth → Authorized domains**.

### Deploy with Vercel CLI

```bash
npm i -g vercel
vercel                                           # first deploy
vercel env add VITE_FIREBASE_API_KEY production   # repeat for each key
vercel --prod                                    # redeploy with env vars
```

### Local build check

```bash
npm run build
npm run preview     # http://localhost:4173
```

---

## Known limitations

- Room finding depends on events having a parseable location string. Free-text locations ("see group chat") won't contribute to occupancy — a warning is logged during import.
- Free-slot computation only considers weekly-recurring events. One-off events are ignored intentionally.
- Drag-to-reschedule is out of scope.
- Group size is capped at 30 members (Firestore `in` query limit).
- No push reminders or `.ics` export (descoped in favor of the three core features).

## Future work

- Drag-to-reschedule on the week grid
- Push reminders via Firebase Cloud Messaging
- `.ics` export
- Dark mode
- Unit tests for `freeSlots.js` and `importer.js`

---

## Attribution

Course: *Building Web Applications with React*, Batch 2029.
