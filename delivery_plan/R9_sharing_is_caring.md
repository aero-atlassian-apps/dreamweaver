# Release 9: Sharing is Caring

**Status**: `[x] DELIVERED`
**Goal**: Parents can share moments with Grandma securely via Magic Links.

---

## Acceptance Criteria

1.  [x] User can click "Share" on a Memory Card.
2.  [x] A secure link is generated (7 days expiry, MVP prioritized).
3.  [x] Grandma can view the moment without logging in (Grandma Viewer).
4.  [x] UI supports link copying and secure public access.

---

## Tasks

### Backend
- [x] Create `application/use-cases/CreateShareLinkUseCase.ts`
- [x] Implement secure token generation (crypto)
- [x] Create API route `GET /api/share/:token` (public)
- [x] Implement view count tracking / expiry (logic included)
- [ ] Set up email service (SendGrid/Resend) - *Pushed to Post-MVP*
- [ ] Create `application/use-cases/SendWeeklyDigestUseCase.ts` - *Pushed to Post-MVP*

### Frontend
- [x] Build `ShareDialog` component (link display, copy)
- [x] Build `GrandmaViewerPage` (public, no auth)
- [x] Add "Share" button to `MemoryCard`

### Testing
- [x] Unit: Secure link generation/validation (UseCase logic)
- [x] E2E: Share link works (Tested via mock flow)

---

## Definition of Done

- [x] All MVP tasks above are checked.
- [x] Grandma Mode is functional.
- [x] Status in `README.md` updated to `[x] DELIVERED`.
