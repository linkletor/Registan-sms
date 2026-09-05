# Registan SMS — Student Progress & Tutor Management System

A real, working web app for tracking student exam performance, topic-level
strengths/weaknesses, and attendance at a tutoring center — built for
Private School "Registan" (Fergana, Uzbekistan).

This is not a mockup. Every screen reads from and writes to a real
database through server-side logic with authentication and role checks.

## 1. Quick start

Requirements: Node.js 20+.

```bash
npm install
npm run db:migrate   # creates data/app.db and applies the schema
npm run db:seed       # loads demo data (4 groups, 68 students, 20 exams, attendance history)
npm run dev           # http://localhost:3000
```

If `.env` is missing, copy `.env.example` to `.env` first (a working `.env`
is already included for convenience, but you should generate a fresh
`AUTH_SECRET` for any real deployment — see the file for how).

Demo logins (seeded by `db:seed`):

| Role  | Email                | Password  |
|-------|-----------------------|-----------|
| Admin | admin@registan.uz     | admin123  |
| Tutor | tutor@registan.uz     | tutor123  |

To wipe and rebuild the demo data at any point: `npm run db:reset`.

For a production build: `npm run build && npm run start`.

## 2. What's included (MVP scope)

The full spec described 27 areas of functionality. Per the agreed plan,
this delivery is a **solid, fully functional MVP core** — every feature
below is real and working, and the database schema was designed up front
to support the rest of the spec without a redesign (see §6 Roadmap).

- **Auth & roles** — email/password login, two roles (Admin, Tutor).
  Admins see every group/student/exam; tutors only see their own groups.
  All server actions re-check this on every write, not just in the UI.
- **Student database** — full profile: basic info, parent/guardian info
  (father/mother name & phone, email, emergency contact), location
  (region/district/address), academic level, enrollment date, status,
  free-text notes with a timestamped notes log per student.
- **Groups** — grade + name + academic year + assigned tutor; students
  belong to one group at a time.
- **Exams** — created per group/subject with a custom list of topics and
  per-topic max points (so a single exam can mix e.g. "Algebra: 15 pts,
  Geometry: 10 pts, Word problems: 15 pts"). Total is computed
  automatically.
- **Bulk score entry** — a spreadsheet-style grid (one row per student,
  one column per topic) with keyboard navigation (Tab/Enter/arrows),
  paste-friendly numeric inputs, an "absent" toggle per student, and a
  single save that writes every row transactionally.
- **Automatic progress tracking** — every student profile shows an exam
  history table and a trend line chart of percentage score over time,
  with absences correctly excluded from averages/trends instead of being
  counted as 0%.
- **Topic-level performance analysis** — per student and per group:
  strong / weak / improving / declining topics, computed from actual
  topic-level scores across all exams (not just the latest one).
- **Attendance** — mark present/absent/late/excused per lesson with one
  click per student; a monthly attendance-rate breakdown and running
  history per student.
- **Tutor dashboard** — overview stats (student/group counts, average
  score, attendance rate), recent exams, and an automatically computed
  "students needing attention" list (declining trend, low attendance, a
  sharp drop vs. the previous exam, or a persistently weak topic).
- **Group view** — roster, group-wide score trend chart, and group-wide
  topic performance.
- **Printable student report** — a clean, print-optimized page per
  student (profile + exam history + topic performance + attendance) for
  handing to a parent.
- **Search & filtering** on the students list (name/code, group, status).
- **Audit log** — every create/update action is recorded with who did it
  and when.
- **Design** — sidebar navigation, desktop-first responsive layout,
  Recharts line/bar charts, a consistent education-dashboard visual style.

## 3. Tech stack (and where it deviates from the brief)

| Layer      | Choice                                   |
|------------|-------------------------------------------|
| Framework  | Next.js 16 (App Router, Server Actions)   |
| Language   | TypeScript                                |
| Styling    | Tailwind CSS v4                           |
| Database   | **SQLite** (file-based)                   |
| ORM        | **Drizzle ORM** (not Prisma)              |
| Auth       | NextAuth v5 (Credentials + JWT sessions)  |
| Charts     | Recharts                                  |

The brief suggested PostgreSQL + Prisma. Two deliberate substitutions were
made, both agreed with you up front:

1. **SQLite instead of PostgreSQL.** This app is delivered as a downloadable
   codebase rather than a hosted service, so a zero-configuration,
   file-based database that runs anywhere `npm install && npm run dev`
   runs is the right default. The schema is plain relational SQL with
   proper foreign keys and indexes — moving to Postgres later is a matter
   of swapping the Drizzle driver (`drizzle-orm/better-sqlite3` →
   `drizzle-orm/node-postgres`) and re-running migrations; the schema
   definitions and all query code stay the same.
2. **Drizzle instead of Prisma.** Prisma's engine binaries could not be
   downloaded in the environment this was built in. Drizzle has no such
   external binary dependency (it talks to SQLite directly via
   `better-sqlite3`), while still giving a fully-typed schema and query
   builder. This is a build-environment constraint, not a limitation of
   the delivered app — Prisma would work fine once you have unrestricted
   network access, but Drizzle is a solid, actively-maintained choice on
   its own merits and requires no change to use going forward.

## 4. Architecture

```
src/
  app/
    login/                    public login page
    (app)/                    authenticated app shell (sidebar + topbar)
      dashboard/
      students/  [id]/edit  [id]/report
      groups/    [id]/new
      exams/     [id]/new
      attendance/
      settings/               tutor account management (admin only)
    api/auth/[...nextauth]/   NextAuth route handler
  components/                 shared UI (forms, charts, layout chrome)
  db/
    schema.ts                 Drizzle schema — the single source of truth
    index.ts                  SQLite connection (WAL mode, FKs on)
    seed.ts                   demo data generator
  lib/
    auth.ts                   NextAuth config (Credentials provider)
    session.ts                requireUser() / requireAdmin() helpers
    scope.ts                  role-based data scoping (visibleGroupIds)
    actions.ts                all mutations ("use server"), each one
                               re-validates the caller's role/scope and
                               writes an audit log entry
    analytics.ts               progress/trend/topic-performance math
    data/                      read-only query modules per domain
  proxy.ts                    route protection (Next 16's replacement
                               for middleware.ts) — redirects unauthed
                               requests to /login
```

**Server Actions, not a REST/GraphQL API.** Every mutation (create
student, save exam scores, mark attendance, etc.) is a Next.js Server
Action — a plain async function that runs only on the server, callable
directly from a form or from client-side event handlers. This keeps the
app in one codebase with no separate API layer, while still being fully
server-authoritative: the browser never sees or trusts client-computed
data, and every action independently re-checks `requireUser()` /
`requireAdmin()` and the caller's group scope before touching the
database.

**Role-based data scoping.** `visibleGroupIds(user)` in `lib/scope.ts` is
the single choke point for "what can this user see": it returns `null`
for an Admin (no filter — sees everything) or an explicit list of group
IDs for a Tutor. Every list/detail query and every mutation passes
through this, so a Tutor cannot view or edit another tutor's students
even by guessing a URL.

## 5. Database design

The schema (`src/db/schema.ts`) is deliberately normalized and indexed to
support the full spec, not just the MVP screens:

- `users` — login + role (ADMIN/TUTOR)
- `parents` — one-to-one with a student; kept separate from `students` so
  parent-portal access (roadmap) can be added without touching student
  records
- `groups` — grade, name, academic year, assigned tutor
- `students` — profile fields + FK to `groups` and `parents`
- `subjects`, `topics` — topics belong to a subject, reused across exams
  so topic-level trends are comparable over time
- `exams` — one exam belongs to one group + subject
- `examTopics` — the topics *this* exam covers, with a max-points value
  per topic (an exam's topic list and weighting is custom per exam)
- `examResults` — one row per student per exam (total score, absent flag)
- `topicResults` — one row per student per exam-topic (the per-topic score
  behind the total) — this is what powers strong/weak/improving/declining
  topic analysis
- `lessons` — one row per group per calendar date attendance was taken
- `attendance` — one row per student per lesson (present/absent/late/excused)
- `teacherNotes` — timestamped free-text notes per student
- `auditLogs` — who did what, when, to which record

Every foreign key has a supporting index, and unique constraints prevent
duplicate exam results, duplicate attendance rows, and duplicate topics
per subject.

## 6. Roadmap — features designed for but not built in this MVP pass

These were explicitly deferred to ship a solid core first. The schema and
architecture already accommodate all of them without breaking changes:

- **Parent portal** — a read-only login for parents scoped to their own
  child; `parents` is already a separate table with its own contact
  fields, so this is mainly a new NextAuth role + scoped queries.
- **Telegram/SMS notifications** — e.g. weekly progress summaries or
  attendance alerts to parents; would hook into `examResults`/`attendance`
  writes.
- **Payments/billing tracking** — no schema for this yet; would be a new
  `invoices`/`payments` table linked to `students`.
- **AI-based insights** — natural-language summaries of a student's
  trend ("improving steadily in Algebra, needs support in Geometry");
  the `analytics.ts` module already computes the structured data an LLM
  prompt would need as input.
- **CSV/Excel import-export** for bulk student or score import.
- **Heatmap calendar view** for attendance (data already supports it;
  just a new chart component).
- **Multi-subject support in one dashboard view** (currently a group has
  students studying one subject; the schema supports multiple subjects,
  the UI would need a subject switcher).
- **Password reset / email verification flow.**

## 7. Security notes

- Passwords are hashed with bcrypt (never stored in plaintext).
- Sessions are JWT-based via NextAuth; the session cookie is the only
  auth credential — no tokens are exposed to client JS.
- `src/proxy.ts` blocks every route except `/login` for unauthenticated
  requests, at the framework level (not just a client-side redirect).
- Every Server Action independently calls `requireUser()` /
  `requireAdmin()` and checks group ownership — the UI hiding a button is
  never the only protection.
- All actions that create/modify data write an `auditLogs` row (actor,
  action, entity, timestamp).
- `AUTH_SECRET` in `.env` should be regenerated (not reused from the
  sample) for any real deployment — see `.env.example`.

## 8. Known limitations of this MVP

- SQLite is single-writer; fine for one tutoring center's traffic, but a
  move to Postgres (see §3) is recommended before multi-location scale.
- No automated test suite is included — the flows were verified manually
  and via scripted browser testing during development, but there are no
  checked-in unit/e2e tests yet.
- No file/photo upload for student profiles.
