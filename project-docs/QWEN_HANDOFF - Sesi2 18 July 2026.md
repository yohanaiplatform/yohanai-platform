# QWEN_HANDOFF.md

# Yohan.AI

Implementation Handoff

Last Updated

18 July 2026

---

# Purpose

Dokumen ini menjadi referensi utama bagi AI implementasi (Qwen atau AI coding lainnya) sebelum mulai mengerjakan perubahan pada project Yohan.AI.

Dokumen ini **bukan** tempat menyimpan riwayat diskusi, tetapi berisi kondisi terkini project, aturan implementasi, dan target pekerjaan berikutnya.

---

# Current Project Status

Sprint

```
Sprint 007
```

Status

```
COMPLETED
```

Platform

```
Stable
```

TypeScript

```
PASS
```

Production Build

```
PASS
```

GitHub

```
Synced
```

Latest Commit

```
f3bd648

fix: complete dashboard repository and achieve clean production build
```

---

# Current Architecture

```
UI

↓

Hooks

↓

Services

↓

Repositories

↓

Supabase
```

Architecture di atas harus dipertahankan.

Jangan melakukan shortcut langsung dari UI ke database.

---

# Technology Stack

- Next.js 16
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Lucide React
- Supabase
- PostgreSQL
- Vercel

---

# Mandatory Development Workflow

Semua implementasi harus mengikuti urutan berikut:

```
Requirement

↓

Implementation

↓

TypeScript Validation

↓

Production Build

↓

Git Commit

↓

Git Push
```

Jika TypeScript gagal atau build gagal, pekerjaan dianggap belum selesai.

---

# File Update Policy

Untuk perubahan pada file yang sudah ada:

- Utamakan memberikan **full replacement file**.
- Hindari patch kecil yang mengharuskan edit manual.
- Jangan mengubah file yang tidak terkait dengan task.

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

Logout hanya berada pada User Menu.

---

# Current Open Tasks

Priority 1

## Profile Page

Target

- `/profile`
- User Information
- Avatar
- Personal Preferences

---

Priority 2

## Session Management

Target

- Session Persistence
- Protected Routes
- Auto Redirect
- Session Expiration Handling

---

Priority 3

## Dashboard

Hubungkan komponen dashboard dengan data nyata dari Supabase:

- KPI
- Recent Leads
- Recent Activities
- Notifications
- AI Insight

---

Priority 4

## CRM Module

Integrasikan:

- Lead List
- Lead Detail
- Search
- Filter
- Pagination
- CRUD

---

Priority 5

## AI Intelligence

Belum dimulai.

Fokus awal:

- Lead Score
- Buying Signal
- Follow-up Recommendation
- AI Insight

---

# Coding Standards

- Gunakan TypeScript secara ketat.
- Ikuti struktur folder yang ada.
- Gunakan Repository Pattern.
- Gunakan Service Layer.
- Pisahkan UI dari Business Logic.
- Hindari duplikasi kode.

---

# Definition of Done

Task dianggap selesai jika:

- Requirement terpenuhi.
- TypeScript PASS.
- Production Build PASS.
- Tidak ada runtime error.
- Dokumentasi diperbarui.
- Git commit berhasil.
- Git push berhasil.

---

# Notes for AI Implementer

- Jangan mengubah arsitektur tanpa persetujuan.
- Jangan menghapus fitur yang sudah stabil.
- Jangan memperkenalkan dependency baru tanpa alasan kuat.
- Selalu prioritaskan stabilitas platform.

---

# Next Sprint

Sprint 008

Target utama:

1. Profile Page
2. Session Persistence
3. Route Guard
4. Dashboard Real Data
5. CRM Integration
6. AI Insight Foundation

---

# Handoff Summary

Project telah melewati fase setup dan fondasi teknis.

Fokus implementasi selanjutnya adalah membangun fitur bisnis di atas arsitektur yang sudah stabil, menjaga kualitas kode, serta memastikan setiap perubahan lolos validasi TypeScript dan production build sebelum digabungkan ke branch utama.