# Release 1: Hello World

**Status**: `[x] DELIVERED`
**Goal**: A user can sign up, log in, and see a personalized welcome page.

---

## Acceptance Criteria

1.  User can navigate to `/signup` and create a new account.
2.  User can navigate to `/login` and authenticate.
3.  Authenticated user is redirected to `/dashboard`.
4.  Dashboard displays "Good Evening, {User's Name}".
5.  Unauthenticated access to `/dashboard` redirects to `/login`.

---

## Tasks

### Backend
- [x] Initialize Hono project in `api/`
- [x] Configure Vercel serverless deployment (`vercel.json`)
- [x] Create `/api/health` endpoint
- [x] Integrate Supabase Auth (JWT verification middleware)
- [x] Create `/api/user/me` endpoint (returns current user)

### Frontend
- [x] Initialize React + Vite project in `src/`
- [x] Set up TailwindCSS with Lullaby v2 palette
- [x] Create `AuthProvider` context (Supabase client)
- [x] Build `LoginPage` component
- [x] Build `SignupPage` component
- [x] Build `DashboardPage` component (protected route)
- [x] Implement `ProtectedRoute` wrapper

### Testing
- [ ] E2E: Signup flow (Playwright) — Planned for QA phase
- [ ] E2E: Login flow (Playwright) — Planned for QA phase
- [ ] E2E: Protected route redirect (Playwright) — Planned for QA phase

### DevOps
- [x] Set up `.env.local` and `.env.production`
- [x] First Vercel deployment

---

## Definition of Done

- [x] Core authentication flow implemented.
- [x] User can sign up, log in, and see dashboard.
- [x] Status in `README.md` updated to `[x] DELIVERED`.
