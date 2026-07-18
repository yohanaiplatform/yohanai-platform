# PROJECT_RULES.md

# Yohan.AI

Development Rules

Last Updated

18 July 2026

---

# Purpose

Dokumen ini mendefinisikan aturan resmi dalam pengembangan platform Yohan.AI agar kualitas kode, arsitektur, dan dokumentasi tetap konsisten.

---

# Core Principles

1. Stability First
2. Architecture Before Code
3. Simplicity Over Complexity
4. Production Ready
5. Documentation is Part of Development

---

# Development Workflow

Semua task wajib mengikuti urutan berikut:

```
Requirement

↓

Analysis

↓

Architecture

↓

Implementation

↓

TypeScript Validation

↓

Production Build

↓

Testing

↓

Git Commit

↓

Git Push

↓

Documentation Update
```

Tidak boleh melewati langkah validasi.

---

# File Modification Rules

## Rule 1

Prioritaskan **full file replacement** dibanding patch parsial.

Tujuan:

- mengurangi konflik
- menghindari perubahan yang tidak lengkap
- mempermudah review

---

## Rule 2

Satu task sebaiknya hanya menyentuh file yang benar-benar diperlukan.

---

## Rule 3

Jangan mengubah arsitektur project tanpa persetujuan Project Owner.

---

## Rule 4

Semua perubahan harus bisa dijelaskan alasannya.

---

# Code Quality Rules

Sebelum commit:

```
npx tsc --noEmit
```

harus menghasilkan:

```
PASS
```

Kemudian:

```
npm run build
```

harus menghasilkan:

```
PASS
```

Jika salah satu gagal:

❌ Tidak boleh commit.

---

# Git Workflow

Setelah build berhasil:

```
git status

↓

git add .

↓

git commit

↓

git push
```

GitHub menjadi source of truth utama.

---

# Documentation Rules

Setiap Sprint wajib memperbarui:

- DAILY_LOG.md
- YohanAI_Master_Project_Documentation_v1.5.md
- AI_CONTEXT.md
- AGENTS.md
- PROJECT_RULES.md
- KNOWN_ISSUES.md
- QWEN_HANDOFF.md
- START_HERE.md (jika ada perubahan struktur atau milestone)

Dokumentasi bukan pekerjaan tambahan; dokumentasi adalah bagian dari Definition of Done.

---

# Debugging Rules

Saat terjadi error:

1. Identifikasi akar masalah.
2. Tentukan file yang menjadi sumber masalah.
3. Berikan solusi dalam bentuk **full file** bila memungkinkan.
4. Jalankan validasi TypeScript.
5. Jalankan production build.
6. Commit hanya setelah semua langkah berhasil.

---

# User Experience Rules

- Sidebar hanya untuk navigasi.
- Account actions (Profile, Settings, Logout) berada di User Menu.
- Hindari duplikasi fungsi pada dua lokasi berbeda.
- Setiap fitur baru harus mengikuti pola UI yang konsisten.

---

# Definition of Done

Sebuah task dinyatakan selesai jika memenuhi semua poin berikut:

- Requirement terpenuhi.
- TypeScript PASS.
- Production Build PASS.
- Tidak ada runtime error.
- UI konsisten.
- Dokumentasi diperbarui.
- Git commit berhasil.
- Git push berhasil.

---

# Current Project Phase

Feature Development

Fokus utama saat ini adalah pengembangan fitur bisnis di atas fondasi teknis yang sudah stabil.

---

# Sprint 008 Priorities

1. Profile Page
2. Session Persistence
3. Route Guard
4. Dashboard Real Data
5. CRM Module
6. AI Insight Engine

---

# Closing Statement

Setiap perubahan harus membuat project lebih stabil, lebih mudah dipelihara, dan lebih dekat dengan visi Yohan.AI sebagai **Property Buyer Behavior Intelligence Platform**.