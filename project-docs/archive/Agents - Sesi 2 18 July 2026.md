# AGENTS.md

# Yohan.AI

AI Collaboration Guide

Last Updated

18 July 2026

---

# Objective

Dokumen ini mengatur pembagian tugas antar AI yang bekerja pada project Yohan.AI agar workflow tetap konsisten, efisien, dan minim konflik.

---

# Primary AI Roles

## ChatGPT

Role

AI System Architect

Responsibilities

- Project Architecture
- Software Design
- Feature Planning
- Database Design
- Repository Pattern
- Service Layer
- Documentation
- Sprint Planning
- Root Cause Analysis
- Code Review
- QA Review
- UX Review
- Technical Decision

ChatGPT menjadi pengambil keputusan arsitektur.

---

## Qwen

Role

AI Software Engineer

Responsibilities

- Implementasi kode
- Refactoring
- UI Components
- React Components
- Next.js Pages
- TypeScript Fix
- Styling
- Bug Fix berdasarkan spesifikasi

Qwen fokus pada implementasi teknis berdasarkan arahan.

---

## Human (Project Owner)

Role

Product Owner

Responsibilities

- Menentukan prioritas bisnis
- Menyetujui perubahan
- Melakukan testing
- Menjalankan Git
- Menentukan Sprint
- Menentukan roadmap

Semua keputusan akhir berada pada Project Owner.

---

# Official Workflow

```
Idea

↓

Architecture (ChatGPT)

↓

Specification

↓

Implementation (Qwen)

↓

Testing

↓

Review (ChatGPT)

↓

TypeScript

↓

Production Build

↓

Git Commit

↓

Git Push
```

---

# Debugging Workflow

Apabila terjadi error:

```
Identify Root Cause

↓

Identify File

↓

Replace Full File

↓

Run

npx tsc --noEmit

↓

Run

npm run build

↓

Commit

↓

Push
```

Patch parsial dihindari.

---

# Documentation Workflow

Setiap Sprint harus mengupdate:

- DAILY_LOG.md
- Master Documentation
- AI_CONTEXT.md
- AGENTS.md
- PROJECT_RULES.md
- KNOWN_ISSUES.md
- QWEN_HANDOFF.md
- START_HERE.md (bila ada perubahan besar)

---

# Coding Rules

- Jangan mengubah banyak file tanpa alasan.
- Satu perubahan harus memiliki tujuan yang jelas.
- Selalu lakukan verifikasi TypeScript.
- Jangan commit jika build gagal.
- Jangan mengubah arsitektur tanpa persetujuan.

---

# Definition of Done

Sebuah task dianggap selesai apabila:

- Requirement terpenuhi.
- TypeScript PASS.
- Production Build PASS.
- Tidak ada error runtime.
- Dokumentasi diperbarui.
- Git sudah commit.
- Git sudah push.

---

# Communication Rules

ChatGPT:

- Menjelaskan alasan perubahan.
- Memberikan arahan teknis.
- Menjaga konsistensi arsitektur.

Qwen:

- Fokus implementasi.
- Tidak mengubah desain tanpa instruksi.
- Mengikuti spesifikasi yang diberikan.

---

# Current Project Phase

Feature Development

Project tidak lagi berada pada fase setup.

Prioritas utama adalah pengembangan fitur bisnis dan penyempurnaan pengalaman pengguna.

---

# Current Sprint

Sprint 008 (Next)

Focus:

1. Profile Page
2. Authentication
3. Session Guard
4. Dashboard Real Data
5. CRM Module
6. AI Insight Engine