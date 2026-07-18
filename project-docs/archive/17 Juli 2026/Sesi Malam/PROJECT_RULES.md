# PROJECT_RULES.md

Version: 1.9
Last Updated: 17 July 2026

---

# Purpose

This document defines the mandatory engineering standards for developing the Yohan.AI Platform.

These rules apply to every contributor, AI assistant, development session, and future engineering work.

The objective is simple:

- Stable Architecture
- Predictable Development
- Maintainable Code
- Production Quality

---

# Core Principles

The project always prioritizes

- Architecture before implementation
- Stability before new features
- Review before replacement
- Runtime before release
- Documentation before Sprint closure

---

# Rule 1 — Mandatory Development Workflow

Every task must follow this sequence.

```
Requirement

↓

Architecture Review
(ChatGPT)

↓

Technical Review
(ChatGPT)

↓

APPROVE

↓

Implementation
(Qwen)

↓

Replace Files

↓

Build

↓

Runtime QA

↓

Documentation

↓

User Approval

↓

Sprint Complete
```

No stage may be skipped.

---

# Rule 2 — Architecture First

No implementation begins before architecture is reviewed.

Architecture includes

- Scope
- Constraints
- Acceptance Criteria
- Risks
- Dependencies

Owner

ChatGPT

---

# Rule 3 — Review Before Replace

Generated code is NEVER copied directly into the project.

Workflow

1. Review
2. Discuss improvements
3. APPROVE
4. Replace
5. Build

---

# Rule 4 — Build Is NOT The Finish Line

A successful build does NOT mean the task is complete.

Every implementation must also pass

- Runtime Validation
- Navigation Validation
- Browser Console Validation

Only after those checks may documentation begin.

---

# Rule 5 — Runtime QA Is Mandatory

Minimum Runtime QA

- Login
- Dashboard
- Navigation
- Sidebar
- Browser Console
- Critical Pages

Every Runtime QA result must be recorded.

---

# Rule 6 — Documentation Is Part Of Development

Every completed task must update

- Master Project Documentation
- Daily Log
- AI_CONTEXT.md
- AGENTS.md
- PROJECT_RULES.md
- KNOWN_ISSUES.md
- QWEN_HANDOFF.md

Documentation is part of the Definition of Done.

---

# Rule 7 — Database Rules

Never edit an existing migration.

Always create a new migration.

Migration history is immutable.

---

Always use

```ts
supabase
.schema("<schema>")
.from("<table>")
```

Never

```ts
.from("schema.table")
```

---

Never manually edit

```
src/types/database.ts
```

Always regenerate.

Official command

```bash
supabase gen types typescript \
--linked \
--schema public,core,customer,property,chat,workflow,marketing,ai,knowledge,reporting \
> src/types/database.ts
```

---

# Rule 8 — Coding Standards

Language

TypeScript Strict Mode

Preferred

- Async/Await
- Functional Components
- Server Components
- Reusable Components

Avoid

- any
- duplicated logic
- dead code
- unused imports

---

# Rule 9 — Component Standards

Reusable UI must become shared components.

Naming

Components

PascalCase

Functions

camelCase

Routes

kebab-case

---

# Rule 10 — Rendering Strategy

Default

Server Components.

Use Client Components only when browser interaction requires them.

---

# Rule 11 — Dashboard Standards

Dashboard KPI queries always use

```ts
.select("id",{
    head:true,
    count:"exact"
})
```

Never

```ts
.select("*")
```

Reason

- Faster
- Smaller payload
- Better scalability

---

# Rule 12 — Parallel Loading

Independent database queries should use

```ts
Promise.all()
```

Avoid sequential loading whenever possible.

---

# Rule 13 — Build Rules

Every merge must pass

- TypeScript
- Build
- Runtime QA

Build PASS alone is insufficient.

---

# Rule 14 — Security

Never commit

- API Keys
- Tokens
- Passwords
- Secrets
- .env.local

Environment variables only.

---

# Rule 15 — Authentication

Authentication

Supabase Auth

Authorization

RLS

Tenant Isolation

Mandatory.

---

# Rule 16 — Logging

Major engineering work must include

- What changed
- Why
- Files affected
- Build Result
- Runtime Result
- Remaining Issues

---

# Rule 17 — AI Collaboration

## ChatGPT

Responsibilities

- Architecture
- Technical Review
- Root Cause Analysis
- QA
- Documentation
- Sprint Planning
- Engineering Standards

Never responsible for production implementation.

---

## Qwen

Responsibilities

- Production Code
- UI
- React
- TypeScript
- Refactoring
- Runtime Fixes
- Build Fixes

Never responsible for architecture.

---

# Rule 18 — Quality Gate

Before any Sprint task is closed, the following checklist must be satisfied.

Architecture Review

✅

Implementation

✅

Build PASS

✅

TypeScript PASS

✅

Runtime QA PASS

✅

Documentation Updated

✅

User Approval

✅

Only after every item is complete may the Sprint task be marked COMPLETE.

---

# Rule 19 — Error Handling

Every async operation should use proper error handling.

Preferred

```ts
try {

}
catch(error){

}
```

Errors should be meaningful and useful during debugging.

---

# Rule 20 — Continuous Improvement

Every Sprint must leave the project in a better condition than before.

At Sprint completion

- Record Lessons Learned
- Update Documentation
- Reduce Technical Debt
- Improve Standards

---

# Definition of Done

A Sprint task is considered COMPLETE only if

- Requirements completed
- Architecture approved
- Code reviewed
- Files replaced
- Build PASS
- Runtime QA PASS
- Documentation updated
- User approval received

If one item fails,

the Sprint remains OPEN.

---

# Engineering Philosophy

Yohan.AI always prioritizes

- Stability over speed
- Architecture over shortcuts
- Quality over quantity
- Maintainability over cleverness
- Documentation over assumptions

Every engineering decision should make the platform easier to maintain, easier to scale, and safer to develop.

---

End of PROJECT_RULES.md