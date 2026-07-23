# KNOWN_ISSUES.md

# Yohan.AI Platform

Known Issues & Technical Debt

Last Updated

2026-07-23

Current Sprint

Sprint 008

---

# Status Summary

| Priority | Count |
|----------|------:|
| Critical | 0 |
| High | 1 |
| Medium | 1 |
| Low | 1 |

---

# HIGH PRIORITY

## KI-001

### Profile Route Not Implemented

Status

Open

Current Behaviour

```
GET /profile → 404
```

Impact

- User Menu contains a Profile entry.
- Clicking the menu produces a 404 page.

Decision

Create Profile Module in Sprint 008 Task 001.

Target

- Create `/profile`
- Reuse Dashboard layout
- Dummy user data only
- No backend integration

Owner

Sprint 008

---

# MEDIUM PRIORITY

## KI-002

### Property Summary Placeholder

Status

Open

Current Behaviour

Dashboard Property Summary returns placeholder values.

Reason

Production table:

```
property.listings
```

does not contain:

```
status
```

Previous implementation assumed:

- available
- booked
- sold
- hold

These columns/values are not represented in the current production schema.

Current Implementation

```
src/lib/dashboard/getPropertySummary.ts
```

returns:

```
available = 0
booked = 0
sold = 0
hold = 0
```

Decision

Keep placeholder.

Do not recreate old implementation.

Required Before Fix

- Final property schema
- Status strategy confirmed
- Supabase migration
- Regenerate database.ts

Owner

Property Module Sprint

---

# LOW PRIORITY

## KI-003

### Dashboard Insights Still Static

Status

Open

Current Behaviour

Dashboard Insights uses dummy data.

Reason

AI Intelligence Engine has not been connected yet.

Impact

No production issue.

Future Plan

Replace static insights with:

- AI Lead Intelligence
- Buying Signal Analysis
- Workflow Intelligence
- CRM Activity Analysis

Priority

Low

Target Sprint

AI Intelligence Sprint

---

# RESOLVED ISSUES

## 2026-07-23

✅ Dashboard helper schema mismatch

Resolved by:

- Regenerate database.ts
- Refactor dashboard helpers
- Use `SupabaseClient<Database>`

---

✅ TypeScript dashboard errors

Resolved.

Build PASS.

---

✅ Runtime QA

Completed successfully.

---

✅ Production Build

PASS.

---

# Verification Checklist

Current Project Status

- ✅ Build PASS
- ✅ TypeScript PASS
- ✅ Runtime PASS
- ✅ Git Clean
- ✅ GitHub Synced
- ✅ Supabase Connected

---

# Notes

Only record issues that are:

- reproducible,
- still active,
- or accepted as technical debt.

Resolved issues should be moved to the **Resolved Issues** section to keep this document concise.

---

**End of KNOWN_ISSUES.md**