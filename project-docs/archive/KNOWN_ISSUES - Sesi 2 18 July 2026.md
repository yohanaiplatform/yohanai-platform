# KNOWN_ISSUES.md

# Yohan.AI

Known Issues & Technical Debt

Last Updated

18 July 2026

---

# Purpose

Dokumen ini hanya mencatat issue yang **masih aktif**.

Issue yang sudah diperbaiki harus dihapus atau dipindahkan ke Daily Log.

---

# Current Status

Overall Project

🟢 Stable

TypeScript

✅ PASS

Production Build

✅ PASS

GitHub

✅ Synced

Dashboard Foundation

✅ Complete

---

# Active Issues

## ISSUE-001

### Profile Page Not Implemented

Priority

🔴 High

Status

Open

Description

Menu **Profile** pada User Menu sudah tersedia tetapi halaman:

```
/profile
```

belum dibuat sehingga masih menghasilkan:

```
404
```

Required

- Create Profile Page
- User Information
- Avatar
- Personal Settings
- Password Management (future)

Target Sprint

Sprint 008

---

## ISSUE-002

### Authentication Session Guard

Priority

🔴 High

Status

Open

Description

Saat ini logout sudah berfungsi.

Namun route protection belum lengkap.

Required

- Redirect guest ke Login
- Session persistence
- Protected Route
- Auto redirect jika session expired

Target Sprint

Sprint 008

---

## ISSUE-003

### Dashboard Real Data

Priority

🟠 Medium

Status

Open

Dashboard masih menggunakan placeholder.

Yang perlu dihubungkan:

- KPI
- Recent Leads
- Recent Activities
- AI Insight

Target Sprint

Sprint 008

---

## ISSUE-004

### CRM Data Integration

Priority

🟠 Medium

Status

Open

CRM page masih berupa UI Foundation.

Belum terhubung penuh ke Supabase.

Target Sprint

Sprint 008

---

## ISSUE-005

### AI Insight Engine

Priority

🟡 Medium

Status

Planned

Belum ada AI Recommendation Engine.

Target

- Lead Insight
- Buying Signal
- Follow-up Recommendation
- Sales Prediction

Target Sprint

Sprint 009

---

# Resolved Issues

Sprint 007 berhasil menyelesaikan:

- ✅ TypeScript Errors
- ✅ Production Build Errors
- ✅ Dashboard Repository
- ✅ Dashboard Service
- ✅ Dashboard Hooks
- ✅ Dashboard Types
- ✅ Skeleton Loading
- ✅ Date Utility
- ✅ Logout Functionality
- ✅ User Menu Navigation
- ✅ Git Synchronization

Issue di atas dianggap **closed** dan tidak perlu lagi masuk backlog aktif.

---

# Technical Debt

Saat ini technical debt berada pada level:

🟢 LOW

Karena:

- Build bersih.
- TypeScript bersih.
- Arsitektur repository dan service sudah terbentuk.
- Struktur project konsisten.

---

# Next Review

Dokumen ini harus diperbarui setiap akhir Sprint.

Issue yang sudah selesai harus dipindahkan ke Daily Log atau Master Documentation dan dihapus dari daftar Active Issues.