# AGENTS.md
# Yohan.AI Platform
# Version 1.7
# Updated: 2026-07-16

---

# Purpose

Dokumen ini mendefinisikan peran setiap AI Agent yang terlibat dalam pengembangan Yohan.AI agar proses development tetap konsisten, scalable, dan minim technical debt.

---

# Agent Architecture

```
Human
   │
   ▼
ChatGPT
(System Architect)
   │
   ▼
Qwen
(Implementation Engineer)
   │
   ▼
VS Code
(Local Development)
   │
   ▼
Build
   │
   ▼
Review
   │
   ▼
GitHub
```

---

# Agent 1

## ChatGPT

Role

System Architect

Primary Responsibility

- Menentukan arsitektur sistem
- Menentukan folder structure
- Menentukan Design System
- Menentukan Database Architecture
- Menentukan API Architecture
- Membuat Prompt Engineering
- Code Review
- Quality Assurance
- Sprint Planning
- Documentation
- Technical Decision

ChatGPT TIDAK bertugas menulis kode produksi secara langsung.

Semua implementasi dilakukan melalui Qwen.

---

# Agent 2

## Qwen

Role

Implementation Engineer

Primary Responsibility

- Generate source code
- Generate component
- Generate page
- Generate service
- Generate repository
- Generate hook
- Generate utility
- Generate migration
- Refactor sesuai arahan ChatGPT

Qwen tidak membuat keputusan arsitektur.

Qwen hanya mengimplementasikan spesifikasi.

---

# Agent 3

## Human

Role

Project Owner

Responsibilities

- Menjalankan prompt ke Qwen
- Melakukan replace file
- Menjalankan build
- Menjalankan testing
- Commit ke Git
- Deployment

---

# Official Workflow

```
Requirement

↓

Architecture Review

↓

ChatGPT

↓

Prompt Engineering

↓

Qwen

↓

Generate ONE File

↓

Review

↓

APPROVE

↓

Replace File

↓

npm run build

↓

Testing

↓

Git Commit

↓

Next Task
```

---

# Golden Rules

## Rule 1

One File Patch

Satu prompt hanya boleh menghasilkan satu file.

---

## Rule 2

No Manual Coding

Human tidak melakukan edit source code manual kecuali keadaan darurat.

Semua perubahan berasal dari Qwen.

---

## Rule 3

Architecture First

Tidak boleh coding sebelum struktur arsitektur disetujui.

---

## Rule 4

Review First

Semua kode dari Qwen wajib direview ChatGPT sebelum digunakan.

---

## Rule 5

Build Always

Setiap file yang selesai:

```
npm run build
```

harus PASS.

---

## Rule 6

Desktop Test

Setiap milestone wajib diuji di Desktop.

---

## Rule 7

Mobile Test

Setiap milestone wajib diuji menggunakan Chrome Responsive Mode.

Minimal:

- iPhone 14 Pro
- Pixel 7

---

## Rule 8

No Build Error

Sprint dianggap gagal apabila Production Build tidak PASS.

---

## Rule 9

Production First

Seluruh kode harus siap production.

Tidak boleh membuat kode sementara.

---

## Rule 10

Reuse Before Create

Sebelum membuat komponen baru:

- cek reusable component
- cek Design System
- cek Shared UI

Jika bisa reuse, jangan membuat komponen baru.

---

# Prompt Standard

Seluruh prompt Qwen wajib memiliki:

- Role
- Rules
- Target File
- Requirements
- Constraints
- Output

---

# Review Checklist

Sebelum APPROVE

ChatGPT wajib memeriksa:

- Architecture
- TypeScript
- Reusability
- Accessibility
- Responsive
- Dark Mode
- Production Readiness
- Next.js Compatibility

---

# Design System Rules

Current Standard

Card Radius

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

# Current Shared Components

Completed

- SectionCard
- StatCard
- EmptyState
- QuickActionCard
- AIInsightCard

Semua business module wajib menggunakan komponen ini terlebih dahulu.

---

# Sprint Workflow

Sprint

↓

Architecture

↓

Component

↓

Build

↓

Testing

↓

Documentation

↓

Next Sprint

---

# Definition of Done

Suatu task dianggap selesai apabila:

- Production Build PASS
- TypeScript PASS
- Responsive PASS
- Desktop PASS
- Mobile PASS
- ChatGPT APPROVE
- Dokumentasi diperbarui

---

# Next Sprint

Sprint 007

Target

- Remove 404 Routes
- Create Module Placeholder Pages
- Dashboard Supabase Integration
- CRM Foundation
- Property Foundation
- Communication Foundation

---

# Project Philosophy

Build Once.

Reuse Everywhere.

Architecture before Coding.

Quality before Speed.

Production before Demo.

Every Build Must Pass.