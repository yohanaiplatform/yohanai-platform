# KNOWN_ISSUES.md

Version: 1.9
Last Updated: 17 July 2026

---

# Purpose

This document records every known issue, resolved issue, technical debt, workaround, engineering lesson, and risk discovered during development of the Yohan.AI Platform.

The objective is to ensure the same mistakes are never repeated and future troubleshooting becomes faster.

---

# Current Project Health

| Category | Status |
|-----------|--------|
| Architecture | 🟢 Stable |
| Database | 🟢 Stable |
| Authentication | 🟢 Stable |
| Dashboard | 🟢 Stable |
| Build | 🟢 PASS |
| TypeScript | 🟢 PASS |
| Runtime | 🟡 Minor Issue |
| Documentation | 🟢 Updated |
| Technical Debt | 🟡 Low |

---

# Resolved Issues

---

## ISSUE-001

Title

Supabase generated types only contained the public schema.

Status

✅ RESOLVED

Solution

Generate types using the complete schema list.

---

## ISSUE-002

Title

Generated database types were not verified.

Status

✅ RESOLVED

Solution

Always validate generated schemas before committing.

---

## ISSUE-003

Title

Incorrect multi-schema query syntax.

Status

✅ RESOLVED

Correct Standard

```ts
supabase
.schema("customer")
.from("leads")
```

---

## ISSUE-004

Title

Dashboard build failure caused by unsupported Button property.

Status

✅ RESOLVED

Solution

Replace

```tsx
<Button asChild>
```

with

```tsx
<Link>
    <Button>
```

---

## ISSUE-005

Title

Dashboard KPI fetched unnecessary data.

Status

✅ RESOLVED

Current Standard

```ts
.select("id",{
    head:true,
    count:"exact"
})
```

---

# Newly Discovered Issues

---

## ISSUE-006

Title

Lucide React icon compatibility.

Status

🟡 OPEN

Priority

Low

Problem

The Sidebar imported

```ts
Facebook
```

from

```ts
lucide-react
```

The installed Lucide version does not export this icon.

Result

Application failed during runtime.

Root Cause

Assumption that every brand icon exists.

Prevention

Always verify icon exports before approving implementation.

---

## ISSUE-007

Title

Build PASS did not guarantee Runtime PASS.

Status

🟡 OPEN

Priority

Medium

Problem

The application compiled successfully.

TypeScript also passed.

However, runtime testing exposed UI compatibility issues.

Lesson

Build validation alone is insufficient.

Required

- Runtime QA
- Navigation QA
- Browser Console Review

---

# Open Issues

## High Priority

None.

---

## Medium Priority

Runtime validation completion.

Remaining work

- Sidebar icon compatibility
- Final navigation verification

Sprint

Sprint 007 Task 003

---

## Low Priority

Future Dashboard Enhancements

- Charts
- Animations
- Theme customization

---

# Technical Debt

---

## TD-001

AI Insight Panel still uses placeholder content.

Priority

Medium

Planned

Sprint 007

---

## TD-002

CRM module still scaffold only.

Priority

Medium

---

## TD-003

Communication module still requires WhatsApp integration.

Priority

Medium

---

## TD-004

Property Recommendation Engine not implemented.

Priority

Medium

---

## TD-005

Conversation Intelligence pending.

Priority

Medium

---

# Risk Register

---

## Risk-001

Manual editing of generated files.

Risk

High

Mitigation

Always regenerate.

Never edit manually.

---

## Risk-002

Schema inconsistency.

Risk

Medium

Mitigation

Run migration verification before development.

---

## Risk-003

Documentation falling behind implementation.

Risk

Medium

Mitigation

Documentation is mandatory before Sprint closure.

---

## Risk-004

Large UI components becoming monolithic.

Risk

Medium

Mitigation

Extract reusable components whenever reused.

---

## Risk-005

Sequential database loading.

Risk

Low

Mitigation

Always prefer

```ts
Promise.all()
```

---

## Risk-006

Approving implementation without runtime validation.

Risk

Medium

Mitigation

Runtime QA is now mandatory before Sprint completion.

---

# Workarounds

## Generated Types

If schemas disappear

1. Run migrations.
2. Regenerate database.ts.
3. Verify schemas.
4. Commit regenerated file.

---

## UI Build Failure

If Build fails

1. Verify component API.
2. Check library compatibility.
3. Replace unsupported properties.
4. Build again.

---

## Runtime Failure

If Build PASS but runtime fails

1. Run application.
2. Open Browser Console.
3. Review Sidebar.
4. Review Navigation.
5. Review imports.
6. Fix smallest possible issue.

---

# Lessons Learned

1. Build PASS does not guarantee runtime stability.

2. Runtime QA must become part of every Sprint.

3. Verify third-party APIs before approving implementation.

4. Architecture review reduces regression risk.

5. Root Cause Analysis is more valuable than repeatedly replacing files.

6. User approval is the final quality gate.

---

# Future Improvements

Short Term

- Complete Runtime QA
- Executive Dashboard Task 003
- AI Insight Panel

Medium Term

- CRM Intelligence
- Conversation Intelligence
- Property Recommendation Engine

Long Term

- Predictive Analytics
- AI Sales Coach
- Multi-Agent Intelligence
- Organization Analytics

---

# Escalation Guide

When a blocking issue occurs

1. Reproduce the issue.
2. Find Root Cause.
3. Document findings.
4. Implement smallest safe fix.
5. Build.
6. Runtime QA.
7. Update documentation.

---

# Current Stability Assessment

| Area | Status |
|------|--------|
| Architecture | 🟢 Stable |
| Database | 🟢 Stable |
| Build | 🟢 PASS |
| TypeScript | 🟢 PASS |
| Runtime | 🟡 Minor Issue |
| Documentation | 🟢 Updated |

Recommendation

Continue Sprint 007 Task 003.

Do NOT begin Task 004 until Runtime QA is fully completed and approved.

---

End of KNOWN_ISSUES.md