# YohanAI Master Project Documentation
Version : v1.8
Status  : Active Development
Last Updated : 17 July 2026
Current Sprint : Sprint 007
Current Milestone : Task 002 Completed

---

# Executive Summary

Yohan.AI is an AI-powered Property Buyer Behavior Intelligence System designed specifically for the Indonesian property industry. The platform combines CRM, AI, WhatsApp Automation, Knowledge Base, Buyer Behavior Analytics, and Workflow Automation into a single multi-tenant platform capable of serving multiple property agents under one centralized administration.

Unlike conventional CRM systems, Yohan.AI continuously analyzes buyer behavior, conversation history, lead quality, and property data to assist agents in making faster and more accurate sales decisions.

---

# Vision

Build Indonesia's most intelligent AI platform for property professionals.

---

# Mission

- Centralize property operations.
- Automate repetitive sales activities.
- Increase conversion through AI.
- Build a continuously learning intelligence engine.
- Support multi-agent property businesses.

---

# Technology Stack

## Frontend

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS v4
- shadcn/ui
- Lucide React

## Backend

- Supabase

Database

Authentication

Storage

Realtime

RLS

## AI

OpenAI

GPT-5

Future Local LLM Support

## Automation

n8n

WAHA

WhatsApp API

Google Apps Script (Legacy Migration)

## Hosting

Vercel

Cloudflare

Supabase Cloud

GitHub

---

# Current Architecture

```

Browser

↓

Next.js App Router

↓

Server Components

↓

Supabase Client

↓

Multi Schema PostgreSQL

↓

AI Engine

↓

Automation Layer

↓

WhatsApp

```

---

# Current Database Architecture

Schemas

public

core

customer

property

chat

workflow

marketing

knowledge

ai

reporting

Total Schemas : 10

---

# Multi Schema Standard

All future database access MUST use:

```ts
supabase
    .schema("<schema>")
    .from("<table>")
```

Never use

```ts
.from("schema.table")
```

Reason

- Better typing
- Better IntelliSense
- Official Supabase approach
- Compatible with generated database types

---

# Database Type Generation Standard

Official Command

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

Expected Result

```
customer:{
property:{
chat:{
```

---

# Migration Status

Current

001_initial_schema

...

021_post_deployment_validation

Status

PASS

Verified

Local Database

Remote Database

Migration History

All synchronized.

---

# Verification Result

Extensions

5

Schemas

10

Tables

26

Functions

3

Triggers

31

Indexes

133

Row Level Security Policies

27

Status

PASS

---

# Current Folder Structure

```
yohanai-platform/

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

Replace Files

↓

Build

Never skip Review.

Never replace code before approval.

Every feature must successfully pass build before proceeding to the next task.

---

# Current Sprint

Sprint 007

Status

ACTIVE

Completed

Task 001

Task 002

Next

Task 003

Executive Intelligence Dashboard

---

# Sprint 007 Task 001

Completed

Major achievements

- Multi-schema verification
- Migration verification
- Database baseline established
- Type generation process standardized

---

# Sprint 007 Task 002

Completed

Objective

Create the first production-ready Executive Dashboard.

Implemented

Executive Dashboard

Statistics Cards

Quick Actions

Recent AI Insights Placeholder

Server Component Architecture

Promise.all loading

Schema-based queries

Optimized count queries

Build PASS

---

# Dashboard KPI Queries

Current implementation

- Total Leads
- Active Chats
- Properties
- Today's Leads

Optimization

Use

```ts
.select("id", {
    head: true,
    count: "exact"
})
```

instead of

```ts
.select("*")
```

Reason

Lower bandwidth

Faster execution

Better scalability

---

# Current Dashboard Components

Executive Header

Stat Cards

Quick Action Cards

AI Insight Placeholder

Responsive Layout

Mobile Friendly
---

# Architecture Decision Log

## ADR-001
Date : 2026-07-15

Decision

Adopt Progressive Migration Strategy.

Reason

Avoid downtime while migrating from Google Apps Script CRM into the new platform.

Status

Implemented

---

## ADR-002

Decision

Supabase becomes the Primary Database.

Legacy Google Sheets remain read-only until migration completes.

Status

Implemented

---

## ADR-003

Decision

Google Drive remains the Primary Media Storage.

Reason

Cost efficiency

Unlimited scalability

Existing media assets remain compatible

Status

Approved

---

## ADR-004

Decision

n8n becomes the Workflow Orchestrator.

Responsibilities

- AI Automation
- WhatsApp Automation
- CRM Automation
- Notification Engine
- Background Jobs

Status

Implemented

---

## ADR-005

Decision

Use App Router only.

Pages Router is prohibited.

Reason

Cleaner architecture

Server Components

Future scalability

---

## ADR-006

Decision

Server Components become the default rendering strategy.

Client Components are only used when necessary.

Examples

- Forms
- Interactive UI
- Local state
- Browser APIs

Everything else should remain Server Components.

---

## ADR-007

Decision

All dashboard KPI loading uses Promise.all()

Example

```ts
const [
    totalLeads,
    activeChats,
    totalListings,
    todayLeads
] = await Promise.all([
    ...
]);
```

Reason

Parallel execution

Lower latency

Better scalability

---

## ADR-008

Decision

All KPI cards use COUNT queries.

Standard

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

Much faster

Less bandwidth

Database optimized

---

## ADR-009

Decision

Use official multi-schema access.

Required

```ts
supabase
    .schema("customer")
    .from("leads")
```

Forbidden

```ts
.from("customer.leads")
```

Reason

Official SDK recommendation

Better typings

Future proof

---

## ADR-010

Decision

database.ts is always generated from Supabase CLI.

Never edit manually.

Official Command

```bash
supabase gen types typescript \
--linked \
--schema public,core,customer,property,chat,workflow,marketing,ai,knowledge,reporting \
> src/types/database.ts
```

---

# Build History

## Sprint 006

Migration

PASS

---

Database Verification

PASS

---

Schema Validation

PASS

---

Migration Synchronization

PASS

---

## Sprint 007 Task 001

Database Types

PASS

---

Migration Validation

PASS

---

CLI Verification

PASS

---

## Sprint 007 Task 002

Dashboard

PASS

---

TypeScript

PASS

---

Next.js Build

PASS

---

Production Routes

PASS

Generated Routes

```
/

/dashboard

/login

/crm

/properties

/sales

/communication

/settings

/api/health
```

---

# Component Registry

## Dashboard

DashboardPage

Purpose

Executive dashboard homepage.

Status

Production Ready

---

StatCard

Purpose

Display KPI metrics.

Status

Production Ready

---

QuickActionCard

Purpose

Shortcut navigation.

Status

Production Ready

---

SectionCard

Purpose

Reusable dashboard section wrapper.

Status

Production Ready

---

EmptyState

Purpose

Display placeholder state.

Status

Production Ready

---

AIInsightCard

Purpose

Future AI recommendation panel.

Current Status

Placeholder

Sprint 008 Enhancement

---

# UI Design System

Framework

shadcn/ui

Icons

Lucide React

Theme

Modern SaaS

Responsive

Yes

Mobile First

Yes

Design Principles

- Minimal
- Fast
- Clean
- High Information Density
- Enterprise Style

---

# Routing Registry

Current Routes

| Route | Status | Purpose |
|--------|--------|---------|
| / | Active | Landing |
| /login | Active | Authentication |
| /dashboard | Active | Executive Dashboard |
| /crm | Active | CRM Module |
| /properties | Active | Property Module |
| /sales | Active | Sales Module |
| /communication | Active | Communication Module |
| /settings | Active | Platform Settings |
| /api/health | Active | Health Check |

---

# Database Registry

## customer

Primary Tables

- leads
- customers
- activities

Purpose

Customer management.

---

## property

Primary Tables

- listings
- projects

Purpose

Property inventory.

---

## chat

Primary Tables

- conversations
- messages

Purpose

Communication history.

---

## workflow

Purpose

Automation execution.

---

## marketing

Purpose

Campaign management.

---

## ai

Purpose

AI engine data.

---

## knowledge

Purpose

Knowledge base.

---

## reporting

Purpose

Analytics and reporting.

---

# Coding Standards

Language

TypeScript Strict Mode

Formatting

ESLint

Next.js Convention

Naming

PascalCase

Components

camelCase

Functions

kebab-case

Routes

Async Server Components preferred.

---

# Development Rules

## Rule 001

Every code change must pass:

Review

↓

APPROVE

↓

Replace

↓

Build

Never bypass this workflow.

---

## Rule 002

Never modify production code blindly.

Every generated code must first be reviewed.

---

## Rule 003

Every Sprint must end with

- Build PASS
- Documentation Update
- Daily Log
- Handoff Document

before moving to the next Sprint.

---

## Rule 004

Never continue feature development while the current build is failing.

Fix build first.

---

## Rule 005

Database migrations are immutable.

Never edit an existing migration.

Always create a new migration.

---

## Rule 006

Never manually edit generated files.

Generated files include:

- database.ts
- Supabase generated types
- Build artifacts

Always regenerate.

---

## Rule 007

All production code must use TypeScript Strict Mode.

Avoid using:

```ts
any
```

unless absolutely necessary.

---

## Rule 008

Prefer reusable components over duplicated UI.

If a component is reused more than twice, extract it.

---

# Current Platform Modules

## Authentication

Status

Working

Technology

Supabase Auth

---

## Dashboard

Status

Production Ready (Initial Version)

Capabilities

- Executive KPIs
- Quick Actions
- Responsive Layout
- Server Components

---

## CRM

Status

Scaffold Ready

Planned Features

- Lead Management
- Customer Timeline
- Activity History
- AI Lead Scoring

---

## Property Module

Status

Scaffold Ready

Planned Features

- Listing Management
- Project Management
- Inventory Tracking
- Availability Status

---

## Sales Module

Status

Scaffold Ready

Planned Features

- Opportunity Pipeline
- Closing Tracking
- Revenue Analytics

---

## Communication Module

Status

Scaffold Ready

Future Integration

- WhatsApp
- Email
- AI Chat
- Templates

---

## Settings Module

Status

Basic Structure Available

Future

- User Management
- AI Settings
- Organization
- Integrations

---

# AI Roadmap

Phase 1

Dashboard Intelligence

Status

Next Sprint

---

Phase 2

Lead Intelligence

Features

- Lead Score
- Buying Probability
- Buyer Persona
- Motivation Detection

---

Phase 3

Conversation Intelligence

Features

- Sentiment Analysis
- Buying Signals
- Objection Detection
- AI Summary

---

Phase 4

Property Recommendation Engine

Features

- Smart Matching
- Alternative Recommendation
- Budget Optimization

---

Phase 5

Predictive Analytics

Features

- Closing Prediction
- Sales Forecast
- Team Performance
- Conversion Forecast

---

# Multi-Agent Architecture

Target Architecture

```
Platform

│

├── Admin Dashboard

│

├── Agent A

│     ├── Leads
│     ├── Listings
│     ├── Chats
│

├── Agent B

│     ├── Leads
│     ├── Listings
│     ├── Chats
│

├── Agent C

│

└── AI Intelligence Layer
```

Design Principles

Each agent owns:

- Customers
- Listings
- Conversations
- Reports

Administrator can monitor:

- Entire organization
- Cross-agent performance
- Overall analytics
- AI insights

AI continuously learns from aggregated interaction patterns while maintaining data isolation between agents.

---

# Security Principles

Authentication

Supabase Auth

Authorization

Row Level Security (RLS)

Tenant Isolation

Required

Soft Delete

Preferred

Audit Trail

Required

Environment Variables

Never commit secrets to Git.

---

# Git Workflow

Main Branch

main

Development

feature/*

Bug Fix

fix/*

Documentation

docs/*

Every merge should pass:

- Lint
- Type Check
- Build

---

# Known Working Patterns

### Pattern 1 — Server Component by Default

Prefer Server Components unless browser interaction is required.

---

### Pattern 2 — Promise.all()

Load independent resources concurrently.

---

### Pattern 3 — KPI Count Query

Use:

```ts
.select("id", {
    head: true,
    count: "exact"
})
```

Avoid fetching unnecessary rows.

---

### Pattern 4 — Multi Schema Access

Always:

```ts
supabase
    .schema("customer")
    .from("leads")
```

Never:

```ts
.from("customer.leads")
```

---

### Pattern 5 — Generated Types

Whenever migrations change:

1. Run migrations.
2. Regenerate `database.ts`.
3. Verify schemas exist.
4. Commit generated types.

---

# Lessons Learned

## Lesson 001

The default `supabase gen types --linked` command only generated the `public` schema.

Solution:

Explicitly specify all schemas using the `--schema` option.

---

## Lesson 002

Generated database types should never be assumed correct without verification.

Always confirm with:

```cmd
findstr /C:"customer:" src\types\database.ts
findstr /C:"property:" src\types\database.ts
findstr /C:"chat:" src\types\database.ts
```

---

## Lesson 003

Using `.schema()` provides cleaner code, official SDK compatibility, and stronger TypeScript support than embedding the schema name in `.from()`.

---

## Lesson 004

Dashboard KPI cards should count records instead of selecting complete datasets.

This significantly reduces bandwidth and query time.

---

## Lesson 005

Every completed task should conclude with:

- Successful build
- Documentation update
- Daily log
- Qwen handoff

This keeps development sessions independent and easy to resume.

---

# Sprint Status

## Sprint 007

### Task 001

Status

✅ Completed

---

### Task 002

Status

✅ Completed

Major Deliverables

- Multi-schema database baseline
- Generated TypeScript database types
- Executive Dashboard
- KPI cards
- Quick Actions
- Responsive dashboard
- Build PASS

---

### Task 003

Status

🟡 Planned

Objectives

- Recent Leads widget
- Recent Chat Activity
- Lead Funnel visualization
- AI Insight Panel
- Property Summary
- Executive Intelligence improvements

---

# Current Project Health

| Category | Status |
|----------|--------|
| Architecture | 🟢 Stable |
| Database | 🟢 Stable |
| Migrations | 🟢 Stable |
| Dashboard | 🟢 Stable |
| Authentication | 🟢 Stable |
| Build | 🟢 PASS |
| TypeScript | 🟢 PASS |
| Documentation | 🟡 In Progress |
| AI Intelligence | 🟡 Next Sprint |
| CRM Features | 🟡 Development |

---

# End of Document

**Document Version**

v1.8

**Last Updated**

17 July 2026

**Current Sprint**

Sprint 007

**Current Milestone**

Task 002 Completed

**Next Milestone**

Sprint 007 — Task 003: Executive Intelligence Dashboard

---
