# AI_CONTEXT.md

Version: 1.8  
Last Updated: 17 July 2026  
Project: Yohan.AI Platform

---

# Project Identity

Project Name

Yohan.AI

Official Description

AI-powered Property Buyer Behavior Intelligence System.

Purpose

Yohan.AI is an intelligent property platform that combines CRM, Artificial Intelligence, WhatsApp Automation, Buyer Behavior Analytics, Knowledge Base, and Workflow Automation into a single enterprise platform.

The platform is designed to help property agents and agencies understand buyer behavior rather than simply managing customer records.

---

# Current Development Status

Current Sprint

Sprint 007

Current Task

Task 002

Status

✅ Completed

Next Task

Sprint 007 Task 003

Executive Intelligence Dashboard

Overall Project Status

🟢 Stable Foundation

---

# Current Technology Stack

## Frontend

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS v4
- shadcn/ui
- Lucide React

## Backend

- Supabase
- PostgreSQL

## Authentication

- Supabase Auth

## Storage

- Supabase Storage
- Google Drive (Legacy Assets)

## Deployment

- Vercel

## DNS

- Cloudflare

## Repository

- GitHub

## Automation

- n8n
- WAHA
- WhatsApp API

---

# Current Architecture

```
Browser

↓

Next.js

↓

Server Components

↓

Supabase Client

↓

PostgreSQL

↓

AI Layer

↓

Automation Layer

↓

WhatsApp
```

---

# Current Database

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

Production Ready

---

# Current Database Baseline

Migration

001

↓

...

↓

021

Status

PASS

Verification

PASS

Synchronization

PASS

---

# Type Generation Standard

Always regenerate after migration.

Official command

```bash
supabase gen types typescript \
--linked \
--schema public,core,customer,property,chat,workflow,marketing,ai,knowledge,reporting \
> src/types/database.ts
```

Verification

```cmd
findstr /C:"customer:" src\types\database.ts

findstr /C:"property:" src\types\database.ts

findstr /C:"chat:" src\types\database.ts
```

Expected

```
customer:{
property:{
chat:{
```

Never manually edit

```
database.ts
```

---

# Current Coding Standard

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

# Dashboard Standard

Dashboard is implemented as a Server Component.

KPI queries use

```ts
.select("id",{
    head:true,
    count:"exact"
})
```

All KPI queries execute using

```ts
Promise.all()
```

---

# Current Dashboard

Completed

- Executive Header
- KPI Cards
- Quick Actions
- AI Insight Placeholder
- Responsive Layout

Current KPI

- Total Leads
- Active Chats
- Properties
- Today's Leads

Status

Production Ready (Version 1)

---

# Project Modules

Authentication

Status

✅ Working

---

Dashboard

Status

✅ Production Ready

---

CRM

Status

🟡 Scaffold Ready

---

Property

Status

🟡 Scaffold Ready

---

Sales

Status

🟡 Scaffold Ready

---

Communication

Status

🟡 Scaffold Ready

---

Settings

Status

🟡 Basic Structure

---

# Current Folder Structure

```
src/

app/

components/

hooks/

lib/

types/

styles/

supabase/

migrations/

docs/

project-docs/

public/
```

---

# Development Workflow

Mandatory Workflow

Review

↓

APPROVE

↓

Replace

↓

Build

Every completed task must end with

- Successful Build
- Documentation Update
- Daily Log
- Handoff Document

---

# Current Build Status

Next.js

✅ PASS

TypeScript

✅ PASS

Production Build

✅ PASS

Current Routes

- /
- /dashboard
- /login
- /crm
- /properties
- /sales
- /communication
- /settings
- /api/health

---

# Architecture Decisions

## ADR-001

Supabase becomes primary database.

---

## ADR-002

Google Drive remains primary media storage.

---

## ADR-003

n8n becomes workflow orchestrator.

---

## ADR-004

Server Components by default.

---

## ADR-005

Use Promise.all() for dashboard loading.

---

## ADR-006

Use COUNT queries instead of selecting complete datasets.

---

## ADR-007

Always use `.schema()` for multi-schema access.

---

## ADR-008

Generated database types must never be edited manually.

---

# Known Working Patterns

Pattern 1

Server Components first.

Pattern 2

Parallel loading.

Pattern 3

Generated database types.

Pattern 4

Multi-schema architecture.

Pattern 5

Count-based dashboard queries.

---

# Current Technical Debt

Low Priority

- Dashboard charts
- AI widgets
- Lead funnel visualization
- Recent activity widgets
- AI recommendations

No critical blocking issues.

---

# Next Development Target

Sprint 007

Task 003

Executive Intelligence Dashboard

Planned Features

- Recent Leads
- Recent Chat Activity
- Lead Funnel
- Property Summary
- AI Insights
- Executive Analytics

---

# Long-Term Roadmap

Phase 1

Dashboard Foundation

✅ Complete

Phase 2

CRM Intelligence

🟡 In Progress

Phase 3

Conversation Intelligence

🔜 Planned

Phase 4

Property Recommendation Engine

🔜 Planned

Phase 5

Predictive Analytics

🔜 Planned

Phase 6

Multi-Agent Intelligence Platform

🔜 Planned

---

# Development Philosophy

The platform should always prioritize:

- Simplicity
- Performance
- Scalability
- Maintainability
- AI-first Architecture

Every new feature should strengthen the intelligence layer instead of increasing unnecessary complexity.

---

End of AI_CONTEXT.md