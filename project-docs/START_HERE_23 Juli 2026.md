# START_HERE.md

# Yohan.AI Platform

## Project Documentation Index

**Version**
1.0

**Last Updated**
2026-07-23

**Current Sprint**
Sprint 008

**Project Status**

🟢 Stable Baseline Established

---

# Read This First

Jika membuka project di chat baru, bacalah dokumen berikut secara berurutan.

---

## 1. SESSION_CONTEXT.md ⭐⭐⭐⭐⭐

Wajib dibaca pertama.

Berisi:

- status project
- status sprint
- architecture decisions
- technical debt
- next task

Tujuan:

Memberikan konteks tercepat sebelum mulai bekerja.

---

## 2. PROJECT_RULES.md ⭐⭐⭐⭐⭐

Berisi aturan kerja proyek.

Contoh:

- review rules
- approval rules
- coding principles
- workflow ChatGPT ↔ QWEN
- build requirements
- runtime QA requirements

Dokumen ini menjadi "aturan main" seluruh project.

---

## 3. YohanAI_Master_Project_Documentation.md ⭐⭐⭐⭐⭐

Dokumen utama.

Berisi:

- product vision
- architecture
- roadmap
- module
- infrastructure
- database
- workflow
- AI architecture

Semua keputusan besar dicatat di sini.

---

## 4. Yohan.AI_Daily_Log_YYYY-MM-DD.md ⭐⭐⭐⭐☆

Berisi aktivitas harian.

Gunakan untuk mengetahui:

- apa yang dikerjakan
- apa yang selesai
- masalah yang ditemukan
- keputusan yang dibuat

---

## 5. QWEN_HANDOFF.md ⭐⭐⭐⭐☆

Dokumen komunikasi dengan QWEN.

Berisi:

- task berikutnya
- acceptance criteria
- review checklist
- technical constraint

---

## 6. KNOWN_ISSUES.md ⭐⭐⭐☆☆

Daftar:

- bug
- technical debt
- pending migration
- backlog teknis

Update hanya jika memang ada issue aktif.

---

## 7. AI_CONTEXT.md ⭐⭐⭐☆☆

Berisi konteks AI.

Contoh:

- AI architecture
- prompt strategy
- intelligence layer
- automation flow

---

# Current Project Status

Sprint 007

✅ Completed

Sprint 008

🟡 Ready

---

# Current Baseline

Build

✅ PASS

TypeScript

✅ PASS

Runtime QA

✅ PASS

GitHub

✅ Clean

Supabase

✅ Connected

Vercel

✅ Connected

Mintlify

✅ Connected

---

# Current Technical Debt

## Property Summary

Status

Placeholder

Reason

Production schema belum memiliki kolom status pada property.listings.

Implementasi akan dilakukan setelah migration property selesai.

---

## Profile Module

Status

Belum dibuat.

Target

Sprint 008 Task 001.

---

# Development Workflow

ChatGPT

- System Architect
- Reviewer
- Documentation
- Sprint Planning
- QA Review
- Architecture

QWEN

- Code Generation
- UI Development
- Refactoring
- Implementation

---

# Review Workflow

Semua perubahan wajib melalui:

1.

Build

```
npm run build
```

2.

Runtime

```
npm run dev
```

3.

QA

- Login
- Dashboard
- CRM
- Properties
- Sales
- Communication
- Social
- Settings

4.

Git

Working Tree harus Clean.

---

# Definition of Done

Sebuah task dianggap selesai apabila:

- Build PASS
- TypeScript PASS
- Runtime PASS
- Tidak ada crash
- Git Clean
- Dokumentasi diperbarui

Jika salah satu belum terpenuhi, task belum selesai.

---

# Next Task

Sprint 008

Task 001

Profile Module Foundation

Target:

Menghilangkan 404 pada route `/profile` dan menyiapkan fondasi User Management.

---

# Notes

Selalu ikuti Production Database sebagai sumber kebenaran.

Jangan mengasumsikan struktur tabel.

Regenerate `database.ts` setiap ada perubahan schema Supabase.

---

**End of START_HERE.md**