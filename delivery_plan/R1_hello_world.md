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
- [ ] Initialize Hono project in `api/`
- [ ] Configure Vercel serverless deployment (`vercel.json`)
- [ ] Create `/api/health` endpoint
- [ ] Integrate Supabase Auth (JWT verification middleware)
- [ ] Create `/api/user/me` endpoint (returns current user)

### Frontend
- [ ] Initialize React + Vite project in `src/`
- [ ] Set up TailwindCSS with Lullaby v2 palette
- [ ] Create `AuthProvider` context (Supabase client)
- [ ] Build `LoginPage` component
- [ ] Build `SignupPage` component
- [ ] Build `DashboardPage` component (protected route)
- [ ] Implement `ProtectedRoute` wrapper

### Testing
- [ ] E2E: Signup flow (Playwright)
- [ ] E2E: Login flow (Playwright)
- [ ] E2E: Protected route redirect (Playwright)

### DevOps
- [ ] Set up `.env.local` and `.env.production`
- [ ] First Vercel deployment

---

## Definition of Done

- [ ] All tasks above are checked.
- [ ] E2E tests pass in CI.
- [ ] App is deployed and accessible at `https://dreamweaver-dev.vercel.app`.
- [ ] Status in `README.md` updated to `[x] DELIVERED`.
