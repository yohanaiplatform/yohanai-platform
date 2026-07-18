# PROJECT_RULES.md
# Yohan.AI Platform
# Version 1.7
# Updated: 2026-07-16

---

# Purpose

Dokumen ini berisi aturan resmi pengembangan Yohan.AI.

Semua sprint, semua AI Agent, dan semua developer wajib mengikuti aturan ini.

Dokumen ini menjadi sumber kebenaran (Single Source of Truth) untuk workflow engineering.

---

# Rule 1

## Architecture First

Tidak boleh membuat kode sebelum:

- Architecture selesai
- Folder Structure disetujui
- Database Design disetujui
- Flow disetujui

---

# Rule 2

## One File Patch

Setiap task hanya boleh menghasilkan:

ONE FILE

Tidak boleh mengubah banyak file sekaligus kecuali benar-benar diperlukan.

---

# Rule 3

## ChatGPT Responsibility

ChatGPT bertugas:

- Architecture
- Technical Decision
- Prompt Engineering
- Code Review
- Quality Assurance
- Sprint Planning
- Documentation

ChatGPT bukan code generator utama.

---

# Rule 4

## Qwen Responsibility

Qwen hanya bertugas:

- Generate code
- Refactor code
- Update file

Qwen tidak menentukan arsitektur.

---

# Rule 5

## Human Responsibility

Project Owner bertugas:

- Menjalankan prompt ke Qwen
- Replace file
- Build
- Testing
- Git Commit
- Deployment

---

# Rule 6

## Review Before Replace

Semua output Qwen wajib:

Review

↓

Approve

↓

Replace

Tidak boleh langsung dipakai.

---

# Rule 7

## Production Build

Setelah setiap file selesai:

```bash
npm run build
```

Status wajib:

PASS

Jika gagal:

Task belum selesai.

---

# Rule 8

## Responsive Validation

Semua halaman wajib diuji.

Desktop

Tablet

Mobile

Minimal:

- iPhone 14 Pro
- Pixel 7

---

# Rule 9

## TypeScript

Tidak boleh ada:

- TypeScript Error
- ESLint Error

---

# Rule 10

## No Manual Coding

Edit manual di VS Code dihindari.

Seluruh perubahan source code berasal dari:

ChatGPT Prompt

↓

Qwen

↓

Review

↓

Approve

↓

Replace

---

# Rule 11

## No Temporary Code

Tidak boleh membuat:

- Temporary Component
- Temporary API
- Temporary Database
- Temporary Service

Semua implementasi harus siap production.

---

# Rule 12

## Build Once

Setelah satu batch selesai:

Build

↓

Testing

↓

Next Batch

---

# Rule 13

## Shared UI First

Sebelum membuat komponen baru:

cek

src/components/ui

Jika komponen sudah ada:

WAJIB reuse.

---

# Rule 14

## Design System

Seluruh UI wajib mengikuti standar.

Card

rounded-2xl

Shadow

shadow-sm

Spacing

space-y-6

Padding

p-6

Dark Mode

Supported

Mobile First

Required

---

# Rule 15

## Official Workflow

Requirement

↓

Architecture

↓

Prompt

↓

Qwen

↓

Generate ONE File

↓

Review

↓

Approve

↓

Replace

↓

Build

↓

Testing

↓

Commit

↓

Documentation

---

# Rule 16

## Sprint Completion

Sprint dianggap selesai apabila:

- Production Build PASS
- Desktop PASS
- Mobile PASS
- Review PASS
- Documentation Updated

Jika salah satu gagal:

Sprint belum selesai.

---

# Rule 17

## Dashboard Philosophy

Executive Dashboard adalah pusat platform.

Business Module harus mengikuti Design System Dashboard.

Dashboard menjadi acuan seluruh UI.

---

# Rule 18

## Component Philosophy

Reusable Component dibuat berdasarkan kebutuhan nyata.

Urutan pengembangan:

Executive Dashboard

↓

Reusable Components

↓

Design System

↓

CRM

↓

Property

↓

Communication

↓

AI

Bukan sebaliknya.

---

# Rule 19

## Placeholder Policy

Semua menu navigasi harus memiliki halaman.

Jika fitur belum selesai:

Gunakan

Coming Soon

atau

EmptyState

Tidak boleh menghasilkan:

404

---

# Rule 20

## Documentation

Setiap Sprint wajib memperbarui:

- Daily Log
- Master Project Documentation
- AI_CONTEXT.md
- AGENTS.md
- PROJECT_RULES.md
- KNOW_NISSUES.md
- QWEN_HANDOFF.md

Tidak boleh ada perubahan arsitektur yang tidak terdokumentasi.

---

# Golden Principles

Architecture before Coding.

Review before Replace.

Build before Commit.

Responsive before Release.

Documentation before Wrap-up.

Build Once.

Reuse Everywhere.

Every Build Must PASS.