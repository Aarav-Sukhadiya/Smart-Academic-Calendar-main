# CampusCal — End-Term Build Prompt

> **A Notion-style campus calendar that solves three real problems: knowing what's next, finding an empty room, and finding time that works for everyone.**

---

## 0. Read Me First (Viva Mindset)

This document is both the build plan and your viva prep. Every phase lists the **React concepts it demonstrates** and the **questions the evaluator is likely to ask**. Build the feature, then read the viva points, then move on. If you can't answer a viva point, you don't understand your own code — go back.

Working name: **CampusCal**. You can rename.

---

## 1. Problem Statement

**Who is the user?**
A student at SST (or any multi-section campus) who needs to navigate a rotating weekly schedule, coordinate with classmates in other sections, and find unoccupied classrooms.

**What three problems does it solve?**

1. **"What's next?"** — Students forget their schedule, which instructor, which room, and what to bring. Currently solved by squinting at a screenshot of a spreadsheet.
2. **"Where can I study right now?"** — Rooms sit empty during others' class hours, but nobody knows which ones. Currently solved by walking floor-to-floor.
3. **"When are we all free?"** — Groups A, B, and C have disjoint schedules. Finding a slot where three friends across sections are simultaneously free is currently a manual screenshot comparison.

**Why it matters.** Every one of these is a daily friction point for every student on campus. Unlike a to-do app, these problems **require the multi-user, multi-section structure of real timetable data** — they cannot be solved by a solo tool.

**The Notion-Calendar angle.** Users don't just consume a fixed schedule — they **import their own calendar** (upload a timetable file, parse it, edit it), layer personal events on top, and share subsets with friend groups. The calendar is theirs, not the college's.

---

## 2. Feature Scope

### MVP (must ship for submission)

1. **Auth** — Email/password + Google sign-in via Firebase.
2. **Calendar import** — User uploads an `.xlsx` or `.csv` timetable; the app parses it into recurring events. Manual add/edit/delete also supported.
3. **Week & Day views** — Notion-Calendar-style grid with time axis, color-coded events, current-time indicator line.
4. **"What's Next" dashboard** — Home screen shows current class, next class with live countdown, today's remaining schedule.
5. **"Free Right Now" room finder** — Given the current time (or a picked time), shows rooms that are free and for how long.
6. **"When Are We Free?" common slot finder** — User creates a group, shares an invite code, and the app computes the intersection of all members' free time.
7. **CRUD on events** — Add, edit, delete personal events.
8. **Protected routes** — Unauthenticated users are redirected to login.
9. **Responsive UI** — Works on mobile and desktop.

### Nice-to-haves (if time permits)

- `.ics` export of your calendar
- Dark mode
- Push/email reminders before class
- Search events

### Out of scope (explicitly)

- Real-time collaboration on events (Notion-style live cursors)
- Native mobile apps
- Admin panel for professors

Scope discipline is a viva question. When asked "why didn't you build X?", the correct answer is "it was explicitly descoped because Y had higher user impact in the timebox."

---

## 3. Tech Stack (Locked — Do Not Substitute)

| Layer | Choice | Defense |
|---|---|---|
| Framework | **React 18** | Hooks-first, course requirement |
| Language | **JavaScript (not TS)** | Keeps viva scope on React, not type system |
| Build tool | **Vite** | Faster HMR than CRA, modern default |
| Styling | **Tailwind CSS** | Utility-first, no CSS file sprawl, ships only used classes |
| Routing | **React Router v6** | Data router API, nested routes, protected-route pattern |
| Auth + DB | **Firebase (Auth + Firestore)** | Zero backend code, free tier enough, real-time subscriptions |
| File parsing | **SheetJS (`xlsx`)** | De-facto standard for browser spreadsheet parsing |
| Date math | **`date-fns`** | Tree-shakeable, immutable, simpler than moment |
| Deployment | **Vercel** | Zero-config, preview deployments per PR |
| State | **Context API + hooks** | Course requirement; no Redux needed at this scale |

**Not using Redux / Zustand / React Query** — scope doesn't justify them, and the rubric explicitly rewards Context API usage.

---

## 4. Data Model (Firestore)

```
users/{uid}
  displayName: string
  email: string
  photoURL: string | null
  defaultCalendarId: string
  createdAt: timestamp

calendars/{calendarId}
  ownerUid: string
  name: string                    // "My Timetable", "Side Project Meetings"
  source: "manual" | "uploaded"
  color: string                   // hex, drives default event color
  createdAt: timestamp

events/{eventId}
  calendarId: string
  ownerUid: string                // denormalized for queries
  title: string                   // "Fundamental DSA"
  location: string | null         // "Class A - 2nd Floor"
  instructor: string | null       // "Utkarsh"
  dayOfWeek: 0..6 | null          // 0=Sun; null if one-off
  date: "YYYY-MM-DD" | null       // set if one-off, null if recurring
  startTime: "HH:MM"              // 24h
  endTime: "HH:MM"
  color: string | null            // overrides calendar color
  recurrence: "weekly" | "once"
  createdAt: timestamp

rooms/{roomId}
  name: string                    // "Class A - 2nd Floor"
  floor: string                   // "2F"
  building: string | null

groups/{groupId}
  name: string                    // "DSA Squad"
  inviteCode: string              // short random, e.g. "K7X9QM"
  ownerUid: string
  memberUids: string[]            // includes owner
  createdAt: timestamp
```

**Key design decisions (viva gold):**

- **Why `dayOfWeek` + `startTime` as strings, not a single `Date`?** Recurring events aren't tied to a calendar date. Storing a day-index + wall-clock time avoids timezone bugs when a user's browser timezone differs from where the class runs.
- **Why denormalize `ownerUid` onto events?** Firestore can't do joins. To list "all events where ownerUid == X", it must be on the event doc.
- **Why `memberUids` array on group, instead of a subcollection?** Max group size is small (tens, not thousands). An array supports `array-contains` queries for "groups I'm in" in one round-trip.
- **Why a separate `rooms` collection?** Room is extracted from the timetable string during import and deduplicated so "Free Right Now" can iterate a finite list.

---

## 5. Routes (React Router v6)

```
/                     → redirect to /dashboard if auth, else /login
/login                → public
/signup               → public
/dashboard            → protected, "What's Next" view
/calendar             → protected, week/day grid
/calendar/import      → protected, upload UI
/rooms                → protected, "Free Right Now"
/groups               → protected, list of groups
/groups/new           → protected, create group
/groups/join          → protected, enter invite code
/groups/:id           → protected, "When Are We Free" for this group
/settings             → protected
*                     → 404
```

Protected routes use a `<RequireAuth>` wrapper component that reads from `AuthContext`. If no user, it `<Navigate to="/login" state={{ from: location }} />` so you bounce back after login.

---

## 6. Folder Structure

```
src/
├── components/
│   ├── calendar/
│   │   ├── WeekGrid.jsx
│   │   ├── DayColumn.jsx
│   │   ├── EventBlock.jsx
│   │   └── NowLine.jsx
│   ├── dashboard/
│   │   ├── NextClassCard.jsx
│   │   └── TodayList.jsx
│   ├── rooms/
│   │   └── RoomList.jsx
│   ├── groups/
│   │   └── CommonSlotGrid.jsx
│   ├── layout/
│   │   ├── Sidebar.jsx
│   │   └── TopBar.jsx
│   └── ui/
│       ├── Button.jsx
│       ├── Modal.jsx
│       └── Spinner.jsx
├── pages/
│   ├── Login.jsx
│   ├── Signup.jsx
│   ├── Dashboard.jsx
│   ├── CalendarPage.jsx
│   ├── ImportPage.jsx
│   ├── RoomsPage.jsx
│   ├── GroupsPage.jsx
│   ├── GroupDetailPage.jsx
│   └── NotFound.jsx
├── hooks/
│   ├── useAuth.js
│   ├── useEvents.js
│   ├── useRooms.js
│   ├── useGroupMembersEvents.js
│   └── useNow.js                 // ticking "current time" hook
├── context/
│   ├── AuthContext.jsx
│   └── CalendarContext.jsx
├── services/
│   ├── firebase.js               // init
│   ├── auth.js                   // login/logout/signup wrappers
│   ├── events.js                 // CRUD wrappers
│   ├── groups.js
│   └── importer.js               // xlsx/csv parsing
├── utils/
│   ├── time.js                   // HH:MM arithmetic
│   ├── freeSlots.js              // slot intersection logic
│   └── colors.js
├── App.jsx
├── main.jsx
└── routes.jsx
```

---

## 7. Phased Build Plan

Each phase is a session's worth of focused work. Do them in order. After each phase, the app should run without errors, even if features are incomplete.

### Phase 0 — Project Scaffolding

**Goal:** Working Vite + React + Tailwind app, with Firebase initialized.

**Tasks:**
1. `npm create vite@latest campuscal -- --template react`
2. Install Tailwind per their Vite guide.
3. Install: `react-router-dom firebase date-fns xlsx`
4. Create a Firebase project, enable Email/Password and Google auth, create a Firestore database in test mode.
5. `src/services/firebase.js` — initialize and export `auth` and `db`.
6. Commit: "Phase 0: scaffold".

**Viva points:**
- Why Vite over CRA? *Faster cold start and HMR via native ESM; CRA is deprecated.*
- What's in `firebase.js`? *Just `initializeApp(config)` + `getAuth` + `getFirestore`. Imports are lazy at usage sites so tree-shaking works.*

---

### Phase 1 — Auth & Protected Routes

**Goal:** Users can sign up, log in, log out. Logged-in users land on `/dashboard`; everyone else gets bounced to `/login`.

**Tasks:**
1. `AuthContext.jsx` — wraps app, exposes `{ user, loading, login, signup, logout, loginWithGoogle }`. Uses `onAuthStateChanged` in a `useEffect` and sets `loading: false` after the first callback.
2. `useAuth.js` — thin hook that reads `AuthContext`.
3. `Login.jsx`, `Signup.jsx` — controlled forms, error handling, loading states.
4. `RequireAuth.jsx` — route wrapper. If `loading`, show spinner; if no user, `<Navigate>`; else `<Outlet />`.
5. `routes.jsx` — wire it all up.
6. On signup, write a `users/{uid}` document.

**React concepts demonstrated:**
- Context API, `useEffect` cleanup, controlled components, conditional rendering, `useState`.

**Viva points:**
- Why a `loading` flag? *Without it, on first paint `user` is `null`, so protected routes flash the login page before Firebase resolves — a known "auth flicker" bug.*
- Where does `onAuthStateChanged` unsubscribe? *The function it returns is the cleanup returned from `useEffect`. If we skipped this, hot-reload would stack listeners and fire duplicate state updates.*

---

### Phase 2 — Data Model & Event CRUD

**Goal:** Users can manually add, edit, delete events. Events persist in Firestore.

**Tasks:**
1. `services/events.js` — `createEvent`, `updateEvent`, `deleteEvent`, `subscribeToUserEvents(uid, cb)` using `onSnapshot`.
2. On user signup, create a default calendar document (`name: "My Timetable"`, `source: "manual"`).
3. `useEvents.js` — hook that subscribes to the user's events and returns `{ events, loading }`.
4. `CalendarContext.jsx` — wraps `useEvents` so all views share the same subscription (avoids multiple read costs).
5. An "Add Event" modal with form: title, location, instructor, day, start, end, recurrence.

**React concepts demonstrated:**
- Lifting state up (events live in context, consumed by multiple pages), Lists & Keys, controlled inputs, `useEffect` for subscription cleanup.

**Viva points:**
- Why `onSnapshot` instead of `getDocs`? *Real-time updates — if you delete an event on mobile, desktop updates instantly. Also avoids refetching on route changes.*
- Why centralize the subscription in Context? *If every component called `useEvents` directly, each mount would open a new Firestore listener. Firebase bills per read; consolidating is both a perf and a cost decision.*
- What does the `keys` prop do on your event list? *Tells React which DOM nodes to reuse across renders. Without stable keys (using index or Math.random), editing one event causes the whole list to remount and any local state in children is lost.*

---

### Phase 3 — Calendar Views (Day & Week)

**Goal:** Render a Notion-Calendar-style grid. Event blocks are positioned by time, sized by duration.

**Tasks:**
1. `WeekGrid.jsx` — horizontal axis = 7 days, vertical axis = hours (say 7 AM to 10 PM). Grid drawn with CSS grid or absolutely positioned divs inside a relative container.
2. `EventBlock.jsx` — absolutely positioned. Top = `(startMinutesFromDayStart / totalMinutes) * 100%`. Height = duration ratio. Color from event or calendar.
3. `NowLine.jsx` — a horizontal red line at the current time. Re-renders every minute via `useNow()`.
4. `DayColumn.jsx` — single-day view, same logic, one column.
5. Route `/calendar` → `<CalendarPage>` with a Day/Week toggle (stored in URL search params so refresh preserves state).
6. Click an event → edit modal. Drag is out of scope.

**React concepts demonstrated:**
- `useMemo` to avoid recomputing "events for this week" every render. `useRef` to auto-scroll to 8 AM on mount. Lazy loading the week grid with `React.lazy` + `Suspense`.

**Viva points:**
- Why `useMemo` here? *Grouping events by day is O(n) but runs on every parent re-render. Memoizing on `[events]` skips recomputation when only an unrelated piece of state changes (e.g. the "add event" modal opening).*
- Why store view mode in URL params? *Shareable URLs and survives refresh. Also: `useState` would reset on unmount when the user navigates away.*
- How is overlap handled? *For MVP: overlapping events render side-by-side within the same time-column using flex. A naive approach, but I documented it as a known limitation. A production approach would use an interval-graph coloring algorithm.*

---

### Phase 4 — Timetable Import

**Goal:** Upload an `.xlsx` or `.csv` of a timetable, map columns, and create recurring events in one click.

**Tasks:**
1. `services/importer.js` — uses `xlsx` (SheetJS) to parse a `File` into a 2D array.
2. `ImportPage.jsx` — drag-and-drop zone (use `useRef` on the input), preview the parsed grid.
3. **Column mapper UI** — user selects: which column is the time-slot column; which columns correspond to Monday–Friday; what group/person this calendar is for.
4. **Cell parser** — for each non-empty cell, extract `title`, `location` (bracketed), `instructor` (bracketed). The sheet you already have uses the format `Subject [Instructor] [Room]` — parse with a regex, fall back to plain text.
5. **Time-slot consolidation** — the source sheet has 15-min rows. When consecutive rows have the same event text, collapse into one event spanning the range. This is the most interesting algorithm in the project — document it.
6. Write events to Firestore in a batch (`writeBatch`).

**React concepts demonstrated:**
- `useRef` for file input, `useMemo` for the expensive parse step, controlled mapping UI, error boundaries around the preview.

**Viva points:**
- Why client-side parsing instead of a Cloud Function? *No backend cost, no file-upload round-trip, works offline. Tradeoff: large files block the main thread — for a class timetable (< 1000 rows) it's a non-issue.*
- How does consolidation work? *Walk rows in order; if the current cell matches the previous non-empty cell in the same column, extend the active event's `endTime`; otherwise close the previous event and start a new one.*
- What about malformed input? *The mapper UI forces the user to confirm columns before we commit. If parsing throws mid-import, no partial writes happen because of the batch.*

---

### Phase 5 — "What's Next" Dashboard

**Goal:** Home screen that answers "what am I supposed to be doing right now?"

**Tasks:**
1. `NextClassCard.jsx` — reads events from context, filters to "today", finds the next event whose `startTime > now`. Shows title, room, instructor, live countdown.
2. `useNow.js` — returns current `Date`, re-renders every 60 seconds via `setInterval` in a `useEffect`.
3. `TodayList.jsx` — remaining events for the day.
4. Empty states: "No more classes today 🎉", "Free day".

**React concepts demonstrated:**
- Custom hooks, `useEffect` cleanup (clear the interval), `useMemo` for the "next event" computation, conditional rendering for empty states.

**Viva points:**
- Why 60-second tick, not 1-second? *Countdown displayed in minutes; per-second re-renders would waste cycles. If I needed seconds I'd raise the frequency.*
- Why not just use `setInterval` directly in the component? *Extracted to `useNow` so it's reusable (the `NowLine` on the calendar grid uses it too), and so the cleanup logic lives in one place.*

---

### Phase 6 — "Free Right Now" Room Finder

**Goal:** Given a time, list rooms that are unoccupied and say when they'll next be used.

**Tasks:**
1. Room catalog — either seed a `rooms/` collection at import time (auto-dedupe locations from events) or let admins add them. For the project, auto-seeding is fine.
2. `useRooms.js` — subscribes to the rooms collection.
3. **Public event visibility** — for room-finding to work across users, events need a `location` that's queryable even if the user isn't friends with the owner. Use Firestore rules to allow read of just `{location, startTime, endTime, dayOfWeek}` on events — or simpler: maintain a separate `roomBookings/` aggregate collection that's readable by all authenticated users and writable only on event create/update.
4. `RoomList.jsx` — for each room, find the first event today at/after the current time. If none, free for the rest of the day. If one starts now, occupied. Else free until that start time.
5. Time picker at top — defaults to now, user can pick arbitrary time.

**React concepts demonstrated:**
- `useMemo` heavily (the computation is O(rooms × events), memoize on `[events, rooms, pickedTime]`), `useCallback` for the time-picker handler, lazy-load the page.

**Viva points:**
- **Privacy design:** *The roomBookings collection contains no title, no owner, no instructor — only anonymized slot info. This is a deliberate data-minimization decision.*
- Why not query per-room on demand? *Firestore charges per read. One bulk subscription to today's bookings (≈ low hundreds of docs) is cheaper than N separate queries per render.*
- Tradeoff of test-mode rules? *In the current build, rules are open for dev. Before submission, tighten to: users can read their own events and the public roomBookings collection, and write only their own events.*

---

### Phase 7 — Groups & "When Are We Free?"

**Goal:** Users create groups, share invite codes, and the app visualizes the intersection of members' free time.

**Tasks:**
1. `services/groups.js` — `createGroup`, `joinByCode`, `getGroup`, `listMyGroups`. Group invite code = 6 chars, uppercase alphanumeric, generated client-side + collision-checked.
2. `GroupsPage.jsx` — list "My Groups", "Create", "Join".
3. `GroupDetailPage.jsx` — shows members, and a week grid with color bands where everyone is free.
4. `useGroupMembersEvents.js` — fetches events for each `memberUid` in parallel, returns a flat array plus an index by uid. Must respect a Firestore read limit per group (cap members at, say, 20).
5. `utils/freeSlots.js` — **the interesting algorithm.** For each day of week:
   - Start with the full day as a single interval `[day_start, day_end]`.
   - Subtract every member's busy intervals from it.
   - Return the remaining intervals that are common to all members.
6. Visualization: week grid with green bands over common free time, grey otherwise. Click a band to see the exact range.

**React concepts demonstrated:**
- `useMemo` (intersection is expensive, memoize on events), `useCallback` on member toggles (so `<MemberChip>` doesn't re-render when a sibling changes), `useContext` for auth, React Router params (`useParams` for `groupId`).

**Viva points:**
- Why compute intersection client-side? *Scope-appropriate — group sizes are small. Server-side (Cloud Function) would add deploy complexity and latency for no real gain at this scale. If groups grew to hundreds, I'd move it.*
- **Algorithm complexity:** *O(days × members × events) per compute. With weekly recurrence and a timetable-sized dataset (< 200 events per user, 5 days, < 20 members), this is instant. Memoized on `[events, members]` so toggling members doesn't re-parse the whole week.*
- Privacy within a group? *When you join, only your event **times** are shared — titles and locations stay private by default. There's a per-calendar toggle "Share details with groups" if you want full visibility.*

---

### Phase 8 — Polish, Optimize, Deploy

**Tasks:**
1. **Lazy routes:** wrap every non-dashboard page in `React.lazy` + `<Suspense fallback={<Spinner/>}/>`. Check with Chrome devtools that the initial bundle shrinks.
2. **`useCallback` pass:** identify handlers passed as props to memoized children; stabilize them.
3. **Error boundaries** around each top-level route.
4. **Loading skeletons** instead of spinners on the calendar grid.
5. **Empty states** for every list.
6. **Firestore rules** tightened (see Phase 6).
7. **Mobile pass** — week view becomes day view below 768px. Sidebar becomes a bottom nav.
8. **README** with screenshots, problem statement, setup instructions, architecture diagram, known limitations.
9. **Demo video** script — 3 min: problem (30s), three features (45s each), tech choices (15s).
10. **Deploy to Vercel.** Add production Firebase config as env vars. Test the deployed URL end-to-end.

**Viva points:**
- Show the network tab and point to a chunk that only loads when you navigate to `/rooms` — proves lazy loading works.
- Show the React DevTools profiler and point to a memoized component that doesn't re-render on unrelated state changes.

---

## 8. React Concept Coverage Matrix

Every required concept from the course guideline maps to at least one concrete use. Bring this to viva.

| Concept | Where |
|---|---|
| Functional components | Everywhere |
| Props & composition | `<EventBlock>` inside `<DayColumn>` inside `<WeekGrid>` |
| `useState` | Every form, toggles, modals |
| `useEffect` | Auth subscription, Firestore listeners, `useNow` interval |
| Conditional rendering | Loading/error/empty states on every page |
| Lists & Keys | Event list, room list, group list |
| Lifting state up | Events in `CalendarContext` shared across Dashboard/Calendar/Rooms |
| Controlled components | Every form field |
| React Router | `routes.jsx`, `<RequireAuth>`, `useParams`, `useSearchParams` |
| Context API | `AuthContext`, `CalendarContext` |
| `useMemo` | Week-events grouping, free-slot intersection, room occupancy |
| `useCallback` | Handlers passed to memoized children (group member chips, event blocks) |
| `useRef` | File upload input, calendar auto-scroll on mount |
| `React.lazy` + `Suspense` | All non-dashboard routes |
| Perf | Lazy routes, memoization, a single Firestore subscription per collection |

---

## 9. Rubric Alignment (100 marks)

| Criterion | Marks | How this project earns them |
|---|---|---|
| Problem Statement & Idea | 15 | Three linked real problems, grounded in actual timetable data, defensible against "why not a toy app" |
| React Fundamentals | 20 | Full matrix above covered |
| Advanced React Usage | 15 | `useMemo`/`useCallback` defended per site; lazy routes; custom hooks (`useNow`, `useEvents`, `useGroupMembersEvents`) |
| Backend Integration | 15 | Firebase Auth (email + Google), Firestore with multiple collections, real-time subscriptions, security rules, batched writes |
| UI/UX | 10 | Tailwind, responsive, loading skeletons, empty states, mobile bottom nav |
| Code Quality | 10 | Folder structure as specified, services layer separates Firebase from React, utils layer for pure functions |
| Functionality | 10 | MVP checklist green |
| Demo & Explanation | 5 | Script prepared per Phase 8 |

---

## 10. Viva Cheat Sheet (Likely Questions)

1. **"Why Context instead of Redux?"** — Scope. Two global slices (auth, events). Redux's reducer/action/middleware boilerplate is overhead without benefit until you have 5+ slices or complex async flows.
2. **"Walk me through a re-render."** — Pick the `<NextClassCard>`: `useNow` ticks → context doesn't change → component re-renders, but its memoized children (say, event blocks) don't because their props are stable.
3. **"How do you prevent infinite re-renders in `useEffect`?"** — Dependency array is minimal and stable. Object/array deps are memoized or split into primitive deps.
4. **"What happens if Firestore is down?"** — Firestore has an offline cache. Reads served from cache, writes queued. I show a banner using `onSnapshotsInSync`.
5. **"Show me where you prevent unnecessary re-renders."** — Open DevTools profiler, demonstrate.
6. **"How are you sure the free-slot algorithm is correct?"** — Unit test it (even a single `utils/freeSlots.test.js` with a handful of cases scores points).
7. **"What's your biggest technical limitation?"** — Room-finding assumes every class has a parseable location. If a user imports a sheet where the location is a free-text comment ("see group chat"), that event won't contribute to room occupancy. I log a warning during import.
8. **"If you had one more week, what would you add?"** — Drag-to-reschedule on the calendar grid, or push reminders via Firebase Cloud Messaging.

---

## 11. Commit Hygiene

One logical change per commit. Prefixes: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`. No `"final final v2"` commits — evaluators scroll your history.

Tag each completed phase: `phase-0`, `phase-1`, etc., so if something regresses later you can `git diff` against a known-working point.

---

## 12. How to Use This Doc with Claude Code

Open Claude Code in the project root. For each phase, paste the phase section (not the whole doc) into the prompt. After the phase completes, run the app, verify the viva points, then move on. Do not skip ahead — Phase 6 depends on Phase 4's room extraction.

If Claude Code writes code that you can't explain after reading it, stop. Ask it to explain each line, then rewrite in your own words as a commit message. The viva is about *your* understanding, not the commit graph's.

---

*End of prompt.*