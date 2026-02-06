# Clean Architecture (DreamWeaver)

This folder documents how DreamWeaver applies Clean Architecture / Hexagonal Architecture in practice. It is meant to be shared with contributors and used as the reference when adding features.

## What “Clean” means in this repo
- Dependencies point inward: Presentation → Application → Domain. Infrastructure depends on Application/Domain via ports.
- Domain is framework-agnostic and contains the rules of the product.
- Application orchestrates workflows via use-cases and ports.
- Infrastructure adapts external systems (Supabase, Redis, AI providers, TTS, etc.).

## Start Here
- [01-repo-map.md](file:///d:/rouca/DVM/workPlace/DreamWeaver/.agent/skills/clean-architecture/docs/01-repo-map.md) — where each layer lives (backend + frontend).
- [02-rules-and-conventions.md](file:///d:/rouca/DVM/workPlace/DreamWeaver/.agent/skills/clean-architecture/docs/02-rules-and-conventions.md) — the rules we enforce and naming conventions.
- [03-feature-walkthrough.md](file:///d:/rouca/DVM/workPlace/DreamWeaver/.agent/skills/clean-architecture/docs/03-feature-walkthrough.md) — how to add a feature end-to-end.

