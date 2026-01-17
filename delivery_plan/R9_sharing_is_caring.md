# Release 9: Sharing is Caring

**Status**: `[ ] PENDING`
**Goal**: Parents can share moments with Grandma securely.

---

## Acceptance Criteria

1.  User can click "Share" on a Memory Card.
2.  A secure link is generated (48h expiry, 3 view limit).
3.  Grandma can view the moment without logging in.
4.  Weekly Time Capsule email is sent on Sundays.

---

## Tasks

### Backend
- [ ] Create `application/use-cases/CreateShareLinkUseCase.ts`
- [ ] Implement secure token generation (crypto)
- [ ] Create API route `GET /api/share/:token` (public)
- [ ] Implement view count tracking and expiry
- [ ] Set up email service (SendGrid/Resend)
- [ ] Create `application/use-cases/SendWeeklyDigestUseCase.ts`

### Frontend
- [ ] Build `ShareModal` component (email input, options)
- [ ] Build `GrandmaViewerPage` (public, no auth)
- [ ] Add "Share" button to `MemoryCard`

### Testing
- [ ] Unit: Secure link generation/validation
- [ ] E2E: Share link works, expires after 3 views

---

## Definition of Done

- [ ] All tasks above are checked.
- [ ] Grandma Mode is functional.
- [ ] Status in `README.md` updated to `[x] DELIVERED`.
