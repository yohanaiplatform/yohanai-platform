# AI_CONTEXT.md

Version: 1.9
Last Updated: 17 July 2026
Project: Yohan.AI Platform

---

# Project Identity

Project Name

Yohan.AI

Official Description

AI-powered Property Buyer Behavior Intelligence System.

Purpose

Yohan.AI is an enterprise AI platform designed for property professionals by combining CRM, Buyer Behavior Intelligence, Knowledge Base, Workflow Automation, WhatsApp Automation, and Multi-Agent Intelligence into a single intelligent platform.

Yohan.AI is **not** a chatbot platform.

The AI layer exists to understand buyer behaviour, assist decision making, and continuously improve sales performance.

---

# Current Development Status

Current Sprint

Sprint 007

Current Task

Task 003

Current Status

🟡 In Review / Platform Stabilization

Overall Platform Status

🟢 Stable Foundation

Next Objective

Complete Task 003 Runtime Validation

Task 004 has NOT started.

---

# Current Technology Stack

## Frontend

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS v4
- shadcn/ui
- Base UI
- Lucide React

---

## Backend

- Supabase
- PostgreSQL

---

## Authentication

- Supabase Auth

---

## Automation

- n8n
- WAHA
- WhatsApp API

---

## Deployment

- Vercel
- Cloudflare

---

## Repository

- GitHub

---

# Current Architecture

```
Browser

↓

Next.js App Router

↓

Server Components

↓

Supabase

↓

AI Layer

↓

Automation Layer

↓

WhatsApp
```

---

# Database Architecture

Schemas

- public
- core
- customer
- property
- chat
- workflow
- marketing
- ai
- knowledge
- reporting

Status

✅ Production Ready

---

# Migration Baseline

Migration History

001

↓

...

↓

021

Status

✅ PASS

Synchronization

✅ PASS

---

# Database Standard

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

# Generated Types

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

# Dashboard Architecture

Dashboard uses

- Server Components
- Promise.all()
- COUNT queries

Current KPI

- Total Leads
- Active Chats
- Properties
- Today's Leads

Status

✅ Stable

---

# Current Modules

| Module | Status |
|---------|--------|
| Authentication | ✅ Stable |
| Dashboard | ✅ Stable |
| CRM | 🟡 Scaffold |
| Property | 🟡 Scaffold |
| Sales | 🟡 Scaffold |
| Communication | 🟡 Scaffold |
| Settings | 🟡 Basic |
| AI Layer | 🔜 Planned |

---

# Current Build Status

Next.js Build

✅ PASS

TypeScript

✅ PASS

Production Build

✅ PASS

Runtime QA

🟡 In Review

---

# Runtime Validation

Validated

- Login
- Dashboard
- CRM
- Sales
- Properties
- Settings

Current Runtime Issue

Sidebar icon compatibility.

Severity

Low.

Task 003 remains open until runtime validation completes successfully.

---

# Architecture Decisions

ADR-001

Supabase is the primary database.

---

ADR-002

Server Components by default.

---

ADR-003

Dashboard uses Promise.all().

---

ADR-004

Dashboard KPI uses COUNT queries.

---

ADR-005

Generated database types are immutable.

---

ADR-006

Runtime QA is mandatory after Build PASS.

---

ADR-007

Architecture review precedes implementation.

---

# Development Workflow

Mandatory

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

Replace

↓

Build

↓

Runtime QA

↓

Documentation

↓

Sprint Close

---

# AI Collaboration

## ChatGPT

Role

- System Architect
- Technical Lead
- Architecture Reviewer
- Root Cause Analyst
- QA Lead
- Documentation Owner

Responsibilities

- Architecture
- Technical Review
- QA
- Documentation
- Sprint Planning
- Risk Analysis

Never responsible for production implementation.

---

## Qwen

Role

Implementation Engineer

Responsibilities

- UI Development
- React Components
- TypeScript
- Refactoring
- Runtime Fixes
- Build Fixes

Never responsible for architecture decisions.

---

# Current Technical Debt

Low Priority

- AI Insight Panel
- Dashboard Charts
- Lead Funnel
- Recent Leads
- Recent Activity

No critical architectural debt.

---

# Current Lessons Learned

1. Build PASS is not the end of QA.

2. Runtime validation is mandatory.

3. Navigation must always be validated.

4. Third-party library APIs must be verified before approval.

5. Architecture review significantly reduces regression risk.

---

# Immediate Next Target

Sprint 007

Task 003

Complete Runtime Review

Priority

1. Fix Sidebar icon compatibility.

2. Complete Runtime QA.

3. User approval.

4. Close Task 003.

5. Continue Task 004.

---

# Long-Term Vision

Continue evolving toward a Multi-Agent Property Intelligence Platform where every AI Agent has a dedicated responsibility while maintaining strict tenant isolation, modular architecture, and continuous learning.

---

End of AI_CONTEXT.md