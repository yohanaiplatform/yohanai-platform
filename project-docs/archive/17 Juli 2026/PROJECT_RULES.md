# PROJECT_RULES.md

Version: 1.8  
Last Updated: 17 July 2026

---

# Purpose

This document defines the mandatory engineering rules for developing the Yohan.AI Platform.

Every contributor, AI assistant, and development session must follow these standards to ensure consistency, maintainability, scalability, and production quality.

---

# Rule 1 — Development Workflow

The mandatory workflow is:

```
Requirement

↓

Architecture Review

↓

Technical Review

↓

APPROVE

↓

Implementation

↓

Replace Files

↓

Build

↓

Testing

↓

Documentation

↓

Sprint Complete
```

This workflow **must never be skipped**.

---

# Rule 2 — Build First

A new feature **must not** begin while the project is in a failing build state.

Required before continuing:

- TypeScript PASS
- Next.js Build PASS
- No blocking errors

---

# Rule 3 — Review Before Replace

Never overwrite project files immediately.

Workflow:

1. Review generated code.
2. Discuss improvements.
3. User approves.
4. Replace files.
5. Run build.

---

# Rule 4 — Documentation is Mandatory

Every completed Sprint or significant task must update:

- Master Project Documentation
- Daily Log
- AI_CONTEXT.md
- AGENTS.md
- PROJECT_RULES.md
- KNOWN_ISSUES.md
- QWEN_HANDOFF.md

Documentation is part of the Definition of Done.

---

# Rule 5 — Database Rules

## Migrations

Never modify an existing migration.

Always create a new migration.

Migration history is immutable.

---

## Multi-Schema Access

Always use:

```ts
supabase
    .schema("<schema>")
    .from("<table>")
```

Never use:

```ts
.from("schema.table")
```

---

## Generated Types

Never manually edit:

```
src/types/database.ts
```

Always regenerate after schema changes.

Official command:

```bash
supabase gen types typescript \
--linked \
--schema public,core,customer,property,chat,workflow,marketing,ai,knowledge,reporting \
> src/types/database.ts
```

Verify generated schemas before committing.

---

# Rule 6 — Coding Standards

Language

- TypeScript (Strict Mode)

Preferred

- Async/Await
- Functional Components
- Server Components
- Reusable Components

Avoid

- `any`
- Duplicate logic
- Unused imports
- Dead code

---

# Rule 7 — Component Standards

If UI is reused more than twice:

Extract it into a reusable component.

Naming:

Components

```
PascalCase
```

Functions

```
camelCase
```

Routes

```
kebab-case
```

---

# Rule 8 — Server Components

Default rendering strategy:

Server Components.

Use Client Components only when required.

Examples:

- Browser APIs
- Local state
- Forms
- Interactive widgets

---

# Rule 9 — Dashboard Standards

Dashboard KPI queries must use:

```ts
.select("id", {
    head: true,
    count: "exact"
})
```

Avoid:

```ts
.select("*")
```

Reason:

- Better performance
- Lower bandwidth
- Faster execution

---

# Rule 10 — Parallel Loading

Whenever possible, independent queries should execute using:

```ts
Promise.all()
```

Avoid sequential database calls unless dependencies exist.

---

# Rule 11 — Git Standards

Branch naming:

Feature

```
feature/*
```

Bug fix

```
fix/*
```

Documentation

```
docs/*
```

Main

```
main
```

Every merge should pass:

- Lint
- TypeScript
- Build

---

# Rule 12 — Security

Never commit:

- API Keys
- Access Tokens
- Passwords
- Secrets
- `.env.local`

Use environment variables only.

---

# Rule 13 — Authentication

Authentication provider:

Supabase Auth

Authorization:

Row Level Security (RLS)

Tenant isolation is mandatory.

---

# Rule 14 — Logging

Major changes should be logged.

Include:

- What changed
- Why
- Files affected
- Build result
- Known impact

---

# Rule 15 — Sprint Completion

A Sprint task is considered complete only when all of the following are true:

- Feature implemented
- Build PASS
- TypeScript PASS
- Documentation updated
- Daily Log completed
- Handoff completed
- User approval received

---

# Rule 16 — AI Collaboration

## ChatGPT Responsibilities

- Architecture
- Technical review
- Documentation
- Quality assurance
- Planning
- Risk analysis

## Qwen Responsibilities

- Code implementation
- UI development
- Refactoring
- Build fixes
- TypeScript fixes

Neither role should bypass the other.

---

# Rule 17 — Performance

Always prefer:

- Server-side rendering
- Parallel execution
- Lightweight queries
- Lazy loading when appropriate
- Component reuse

Avoid unnecessary database reads.

---

# Rule 18 — Maintainability

Every new feature should be:

- Modular
- Testable
- Documented
- Scalable

Avoid monolithic components.

---

# Rule 19 — Error Handling

All asynchronous operations should handle failures gracefully.

Prefer:

```ts
try {
    ...
} catch (error) {
    ...
}
```

Log meaningful errors during development.

---

# Rule 20 — Continuous Improvement

After every Sprint:

1. Review lessons learned.
2. Record architecture decisions.
3. Update documentation.
4. Reduce technical debt where practical.

The project should become easier to maintain after every Sprint.

---

# Definition of Done (DoD)

A task is complete only if:

- Requirements satisfied.
- Code reviewed.
- User approved.
- Files replaced.
- Build passed.
- Documentation updated.
- No critical blockers remain.

---

# Project Principles

Yohan.AI development prioritizes:

- Simplicity over complexity.
- Performance over unnecessary abstraction.
- Reusability over duplication.
- Documentation over assumption.
- Architecture before implementation.
- Stability before new features.

---

# Guiding Philosophy

Every technical decision should answer at least one of these questions:

- Does it make the platform easier to scale?
- Does it improve maintainability?
- Does it improve developer productivity?
- Does it improve user experience?
- Does it strengthen the AI intelligence layer?

If the answer is **no**, reconsider the implementation.

---

End of PROJECT_RULES.md