# QWEN_HANDOFF.md
# Yohan.AI Platform
# Version 1.7
# Updated: 2026-07-16

---

# IMPORTANT

Read this document BEFORE writing any code.

Do NOT make architecture decisions.

Your responsibility is IMPLEMENTATION ONLY.

---

# Current Project

Project

Yohan.AI

Type

Property Buyer Behavior Intelligence Platform

Current Sprint

Sprint 007

Current Status

Production Build PASS

Architecture Stable

---

# Technology Stack

Frontend

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS v4
- shadcn/ui

Backend

- Supabase

Automation

- n8n

Messaging

- WAHA

Deployment

- Vercel

---

# Current Folder

src/

app/

(auth)

(dashboard)

api/

components/

layout/

ui/

hooks/

lib/

services/

repositories/

types/

supabase/

project-docs/

---

# Existing Shared Components

Already completed.

Reuse them.

DO NOT recreate.

Components

- SectionCard
- StatCard
- EmptyState
- QuickActionCard
- AIInsightCard

These components are production-ready.

---

# Dashboard Status

Executive Dashboard v1

Completed.

Current Sections

- KPI Cards
- AI Recommendation
- Today's Follow Up
- Quick Actions

Current Data

Static

Purpose

Validate UI Architecture.

---

# Current Architecture

Executive Dashboard

↓

Reusable Components

↓

Design System

↓

Business Modules

↓

Supabase Integration

Never reverse this order.

---

# Current Coding Rules

Always

One File Patch

Never generate multiple files.

Always

Return COMPLETE file.

Never split output.

Never truncate.

If output becomes too large:

Return

OUTPUT TOO LONG

instead of splitting.

---

# Forbidden

Do NOT

- Change Architecture
- Rename folders
- Rename files
- Change database
- Change routing
- Modify multiple files
- Add dependencies unless requested
- Create mock API
- Create temporary code

---

# Required

Every file must be

Production Ready

TypeScript Strict

Responsive

Dark Mode Compatible

Reusable

Accessible

Next.js App Router Compatible

---

# Prompt Standard

Every prompt will contain

Role

Rules

Target File

Requirements

Output

Follow exactly.

---

# Current Design System

Cards

rounded-2xl

Shadow

shadow-sm

Spacing

space-y-6

Padding

p-6

Responsive

Mobile First

Dark Mode

Supported

---

# Current Workflow

ChatGPT

↓

Architecture

↓

Prompt

↓

Qwen

↓

Generate ONE File

↓

ChatGPT Review

↓

Approve

↓

Replace

↓

npm run build

↓

Testing

↓

Commit

Never skip review.

---

# Current Build Status

Production Build

PASS

TypeScript

PASS

Responsive

PASS

Desktop

PASS

Tablet

PASS

Mobile

PASS

---

# Current Technical Decisions

QuickActionCard

Presentational Component

No function props

Reason

Compatible with Next.js App Router.

SectionCard

Base layout component.

StatCard

Reusable KPI component.

EmptyState

Reusable placeholder component.

AIInsightCard

Reusable AI recommendation component.

---

# Sprint 007 Objectives

Priority 1

Remove Navigation 404.

Create placeholder pages:

- CRM
- Property
- Sales
- Communication
- Settings

Priority 2

Dashboard Supabase Integration.

Replace static KPI.

Priority 3

CRM Foundation.

Priority 4

Property Foundation.

Priority 5

Communication Foundation.

---

# Quality Checklist

Before returning code verify:

✓ One File Only

✓ TypeScript Strict

✓ Responsive

✓ Dark Mode

✓ No Build Error

✓ No Architecture Change

✓ No Unused Import

✓ No ESLint Warning

✓ No Mock API

✓ Production Ready

---

# Definition of Success

A task is COMPLETE only if:

Production Build PASS

Desktop PASS

Mobile PASS

ChatGPT APPROVED

Documentation Updated

Otherwise,

the task is NOT finished.