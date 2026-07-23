# AI_CONTEXT.md

# Yohan.AI

Last Updated

18 July 2026

---

# Project Identity

Project Name

Yohan.AI

Project Type

Property Buyer Behavior Intelligence Platform

Main Purpose

AI-powered CRM dan Intelligence Platform untuk membantu agen properti Indonesia mengelola lead, komunikasi, pipeline penjualan, dan insight berbasis AI.

---

# Current Sprint

Sprint 007

Status

✅ COMPLETED

---

# Current Project Status

Overall

🟢 Stable

TypeScript

✅ PASS

Production Build

✅ PASS

GitHub

✅ Synced

---

# Current Architecture

Next.js 16

↓

React

↓

Service Layer

↓

Repository Layer

↓

Supabase

Semua layer utama telah berjalan.

---

# Technology Stack

Frontend

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Lucide React

Backend

- Supabase

Database

- PostgreSQL

Authentication

- Supabase Auth

Deployment

- Vercel

Documentation

- Mintlify

---

# Current Modules

Dashboard

🟢 Foundation Complete

CRM

🟡 UI Complete

Sales

🟡 UI Complete

Properties

🟡 UI Complete

Communication

🟡 UI Complete

Social

🟡 UI Complete

Settings

🟡 UI Complete

Authentication

🟡 Basic Complete

AI Engine

⚪ Not Started

---

# Current Navigation

Sidebar

- Dashboard
- CRM
- Properties
- Sales
- Communication
- Social
- Settings

Header

- Search
- Notifications
- User Menu

User Menu

- Profile
- Settings
- Logout

Logout hanya berada di User Menu.

---

# Coding Workflow (Mandatory)

Semua perubahan harus mengikuti urutan berikut:

```
Problem

↓

Identify Root Cause

↓

Replace Full File

↓

Run

npx tsc --noEmit

↓

Run

npm run build

↓

Git Commit

↓

Git Push
```

Patch parsial tidak digunakan kecuali benar-benar diperlukan.

---

# Development Rules

- Selalu kirim full file untuk perubahan penting.
- Hindari edit manual baris demi baris.
- Jangan menghasilkan solusi yang belum diverifikasi.
- Pastikan TypeScript bersih sebelum build.
- Build harus berhasil sebelum commit.

---

# Current Known Issues

- Profile page (`/profile`) belum tersedia.
- Dashboard masih menggunakan placeholder data.
- Session guard belum diimplementasikan.

---

# Next Sprint

Sprint 008

Prioritas:

1. Profile Page
2. Session Persistence
3. Route Guard
4. Dashboard Real Data
5. CRM Real Data
6. AI Insight Engine

---

# Latest Commit

```
f3bd648

fix: complete dashboard repository and achieve clean production build
```

---

# Current State

Project telah memasuki fase **Feature Development**.

Fase "Project Setup" dianggap selesai.

Fokus berikutnya adalah pengembangan fitur bisnis, bukan lagi penyelesaian fondasi teknis.