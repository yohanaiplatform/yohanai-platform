# AI_CONTEXT.md
# Yohan.AI Platform
# Updated: 2026-07-16
# Version: Sprint 006

---

# Project Identity

Project Name:

Yohan.AI

Project Type:

Property Buyer Behavior Intelligence Platform

This is NOT a chatbot.

This is NOT merely a CRM.

The platform's objective is to become an AI Operating Platform for the property business.

---

# Mission

Provide one integrated platform that combines:

- CRM
- Property Listing
- AI Recommendation
- Buyer Behavior Intelligence
- WhatsApp Automation
- Sales Intelligence
- Executive Dashboard
- Business Analytics

---

# Current Architecture

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

Hosting

- Vercel

Documentation

- Mintlify

---

# Current Development Status

Infrastructure

COMPLETE

Supabase

COMPLETE

Authentication

COMPLETE

AppShell

COMPLETE

Shared UI Foundation

COMPLETE

Executive Dashboard

COMPLETE

Business Modules

NOT STARTED

AI Intelligence

NOT STARTED

---

# Completed Components

SectionCard

Reusable Layout Card

PASS

StatCard

Reusable KPI Component

PASS

EmptyState

Reusable Empty Content Component

PASS

QuickActionCard

Reusable Presentational Component

PASS

AIInsightCard

Reusable AI Recommendation Component

PASS

---

# Executive Dashboard

Current Version

v1.0

Sections

- KPI Cards
- AI Recommendation
- Today's Follow Up
- Quick Actions

Current Data

Static

Purpose

Validate Design System

Validate Layout

Validate Responsive Behavior

---

# Current UI Standard

Cards

rounded-2xl

Shadow

shadow-sm

Spacing

space-y-6

Padding

p-6

Mobile First

YES

Dark Mode Ready

YES

---

# Official Workflow

ChatGPT

↓

Architecture

↓

Prompt Engineering

↓

Qwen

↓

Code Generation

↓

Architecture Review

↓

Approve

↓

Replace File

↓

Production Build

↓

Testing

↓

Commit

No manual coding whenever possible.

---

# Coding Rules

One File Patch

Always

Build PASS

Always

Review before Replace

Always

Desktop Testing

Required

Mobile Testing

Required

---

# Current Known Issues

Business Modules not created.

Dashboard still uses static data.

No Supabase data integration.

Placeholder routes return 404.

Charts not implemented.

---

# Architecture Decisions

Executive Dashboard is the primary UI.

Reusable components are created from real business needs.

Design System evolves from Dashboard.

Business Modules reuse Dashboard components.

---

# Current Priority

Sprint 007

1.

Create placeholder pages

CRM

Property

Sales

Communication

Settings

2.

Remove all navigation 404.

3.

Connect Dashboard to Supabase.

4.

Replace static KPI values.

5.

Start CRM Module.

---

# Current Project Health

Build

PASS

Authentication

PASS

Responsive

PASS

Desktop

PASS

Tablet

PASS

Mobile

PASS

Architecture

Stable

Ready for Sprint 007.