# KNOWN_ISSUES.md

Version: 1.8  
Last Updated: 17 July 2026

---

# Purpose

This document records all known issues, resolved issues, technical debt, workarounds, risks, and lessons learned throughout the development of the Yohan.AI Platform.

Its purpose is to prevent repeating the same mistakes and to accelerate troubleshooting during future development.

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
| Documentation | 🟢 Updated |
| Technical Debt | 🟡 Low |
| Critical Bugs | 🟢 None |

---

# Resolved Issues

---

## ISSUE-001

### Title

Supabase generated types only contained the `public` schema.

### Status

✅ Resolved

### Impact

Custom schemas such as:

- customer
- property
- chat

were unavailable in TypeScript.

### Root Cause

The default command:

```bash
supabase gen types typescript --linked
```

only exports the **public** schema.

### Solution

Use:

```bash
supabase gen types typescript \
--linked \
--schema public,core,customer,property,chat,workflow,marketing,ai,knowledge,reporting \
> src/types/database.ts
```

### Prevention

Always regenerate using the full schema list.

---

## ISSUE-002

### Title

Unable to verify generated database types.

### Status

✅ Resolved

### Root Cause

Generated file was assumed correct without validation.

### Solution

Always verify:

```cmd
findstr /C:"customer:" src\types\database.ts
findstr /C:"property:" src\types\database.ts
findstr /C:"chat:" src\types\database.ts
```

Expected:

```
customer:{
property:{
chat:{
```

---

## ISSUE-003

### Title

Incorrect multi-schema query syntax.

### Status

✅ Resolved

### Incorrect

```ts
.from("customer.leads")
```

### Correct

```ts
supabase
    .schema("customer")
    .from("leads")
```

### Reason

Official SDK recommendation.

Improved TypeScript support.

---

## ISSUE-004

### Title

Dashboard build failure caused by unsupported Button property.

### Status

✅ Resolved

### Error

```tsx
<Button asChild>
```

Current project Button component did not support the `asChild` prop.

### Solution

Wrap the Button with Link.

```tsx
<Link href="/dashboard">
    <Button>
        Dashboard
    </Button>
</Link>
```

### Result

Production build successful.

---

## ISSUE-005

### Title

Dashboard KPI queries fetched unnecessary data.

### Status

✅ Resolved

### Previous

```ts
.select("*")
```

### Current Standard

```ts
.select("id",{
    head:true,
    count:"exact"
})
```

### Benefit

- Faster queries
- Reduced bandwidth
- Better scalability

---

# Open Issues

At the time of this document:

## Critical

None.

---

## High Priority

None.

---

## Medium Priority

Dashboard enhancements.

Pending:

- Recent Leads
- Recent Chat Activity
- Lead Funnel
- AI Insight Panel
- Property Summary

Planned Sprint

Sprint 007 Task 003

---

## Low Priority

Future visual enhancements.

Examples

- Charts
- Animations
- Dashboard customization

---

# Technical Debt

## TD-001

Dashboard currently displays placeholder content for AI Insights.

Priority

Medium

Planned

Sprint 007 Task 003

---

## TD-002

Reporting module has scaffold only.

Priority

Low

---

## TD-003

Communication module requires WhatsApp integration.

Priority

Medium

---

## TD-004

Property recommendation engine not implemented.

Priority

Medium

---

## TD-005

Conversation Intelligence module pending.

Priority

Medium

---

# Risk Register

---

## Risk 001

Manual editing of generated files.

Risk

High

Mitigation

Never edit generated files manually.

Always regenerate.

---

## Risk 002

Schema inconsistency.

Risk

Medium

Mitigation

Run migration verification before development.

---

## Risk 003

Documentation falling behind implementation.

Risk

Medium

Mitigation

Documentation is mandatory at the end of every Sprint.

---

## Risk 004

Large components becoming monolithic.

Risk

Medium

Mitigation

Extract reusable components when reused more than twice.

---

## Risk 005

Sequential database queries.

Risk

Low

Mitigation

Prefer:

```ts
Promise.all()
```

---

# Workarounds

## Database Types

If custom schemas disappear:

1. Regenerate types.
2. Verify schemas.
3. Commit updated file.

---

## Build Failure

If build fails after UI changes:

1. Review component API.
2. Verify shadcn compatibility.
3. Replace unsupported props.
4. Rebuild.

---

## Dashboard Performance

If dashboard becomes slow:

- Replace row queries with count queries.
- Use parallel loading.
- Avoid unnecessary client rendering.

---

# Lessons Learned

1. Never assume generated code is correct.
2. Verify generated artifacts before committing.
3. Architecture decisions should be documented immediately.
4. Complete documentation at the end of every Sprint.
5. A green build is the minimum requirement before moving forward.

---

# Future Improvements

Short Term

- Executive Intelligence Dashboard
- AI Insight Panel
- Recent Leads
- Recent Chat Activity

Medium Term

- CRM Intelligence
- Conversation Intelligence
- Property Recommendation Engine

Long Term

- Predictive Analytics
- Multi-Agent Intelligence
- AI Sales Coach
- Business Forecasting

---

# Escalation Guide

If a blocking issue occurs:

1. Reproduce the issue.
2. Identify the root cause.
3. Document findings.
4. Implement the smallest safe fix.
5. Rebuild.
6. Update this document if the issue is new.

---

# Current Stability Assessment

Overall Status

🟢 Stable

Production Build

🟢 PASS

Migration

🟢 PASS

Database

🟢 PASS

Architecture

🟢 Stable

Documentation

🟢 Updated

Recommendation

Proceed with Sprint 007 – Task 003.

---

End of KNOWN_ISSUES.md