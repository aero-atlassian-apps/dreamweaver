---
name: concise-planning
description: Create actionable, step-by-step checklists for complex coding tasks. Use when asked to "plan", "roadmap", or "break down" a feature.
---

# Concise Planning

## Purpose
To transform abstract requirements into concrete, executable technical plans.

## Workflow

1.  **Analyze Requirements**: content, constraints, user intent.
2.  **Identify Components**: Which files/systems need to change?
3.  **Break Down Steps**: Atomic, testable units of work.
4.  **Format**: Use Markdown checklists `[ ]`.

## Output Template

```markdown
# Implementation Plan: [Feature Name]

## Phase 1: Core Logic
- [ ] Create domain entities in `src/domain/...`
- [ ] Implement use case tests in `src/application/...`
- [ ] Implement use case logic

## Phase 2: Infrastructure
- [ ] Create Supabase adapter
- [ ] Add API endpoint

## Phase 3: UI
- [ ] Build React component
- [ ] Integrate with API
```
