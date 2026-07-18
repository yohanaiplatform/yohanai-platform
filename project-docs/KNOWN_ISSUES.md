# KNOWN_ISSUES.md

Version: 2.0
Last Updated: 2026-07-18
Status: ACTIVE

---

# Purpose

Dokumen ini mencatat seluruh bug, technical debt, limitation, dan improvement yang diketahui.

Hanya issue yang belum selesai yang boleh berada di dokumen ini.

Issue yang sudah selesai harus dipindahkan ke Master Documentation atau Daily Log.

---

# Summary

| Severity | Count |
|----------|------:|
| Critical | 0 |
| High | 0 |
| Medium | 1 |
| Low | 4 |

Platform saat ini berada pada kondisi **Stable Build**.

Tidak ada blocker yang menghambat pengembangan Sprint berikutnya.

---

# Open Issues

---

## ISSUE-001

Title

Sidebar UI Simplification

Status

OPEN

Priority

Medium

Category

UI / UX

Description

Untuk menyelesaikan blocker Build pada Sprint 007, Sidebar diimplementasikan menggunakan versi yang lebih sederhana.

Versi ini berfungsi dengan baik tetapi belum menggunakan seluruh komponen UI yang telah tersedia.

Komponen yang belum digunakan:

- NavigationRail
- SidebarGroup
- SidebarItem
- NotificationMenu
- UserMenu

Impact

Tidak mempengaruhi fungsi platform.

Hanya mempengaruhi kualitas tampilan dan pengalaman pengguna.

Recommendation

Lakukan restorasi Sidebar pada Sprint UI Polish setelah seluruh fitur inti selesai.

---

## ISSUE-002

Title

Dashboard Data

Status

OPEN

Priority

Low

Category

Backend Integration

Description

Dashboard masih menggunakan placeholder.

Belum mengambil data dari Supabase.

Affected

- KPI Cards
- Recent Leads
- Recent Conversation
- Analytics

Recommendation

Integrasikan dengan Supabase setelah CRM Module selesai.

---

## ISSUE-003

Title

Recent Leads

Status

OPEN

Priority

Low

Category

UI Placeholder

Description

Widget masih menampilkan placeholder.

Recommendation

Hubungkan ke database.

---

## ISSUE-004

Title

Recent Conversations

Status

OPEN

Priority

Low

Category

UI Placeholder

Description

Belum menggunakan data WhatsApp.

Recommendation

Integrasikan setelah WAHA dan Chat Engine selesai.

---

## ISSUE-005

Title

Social Module

Status

OPEN

Priority

Low

Category

Future Module

Description

Saat ini hanya tersedia halaman placeholder "Coming Soon".

Belum ada implementasi fitur.

Recommendation

Mulai implementasi pada Sprint Social Module.

---

# Resolved Issues

---

## FIX-001

Sprint 007

Lucide Facebook Icon

Status

RESOLVED

Description

Icon Facebook tidak tersedia pada versi lucide-react yang digunakan.

Resolution

Diganti menggunakan Share2.

---

## FIX-002

Sprint 007

Sidebar Compile Error

Status

RESOLVED

Description

Sidebar mengalami compile failure.

Resolution

Perbaikan struktur komponen dan kompatibilitas.

---

## FIX-003

Sprint 007

AppShell Compatibility

Status

RESOLVED

Description

Sidebar tidak menerima props mobile.

Resolution

Menambahkan dukungan props `isMobile` dan `onClose`.

---

## FIX-004

Sprint 007

TypeScript Error

Status

RESOLVED

Description

Terjadi ketidaksesuaian tipe antara AppShell dan Sidebar.

Resolution

Interface diperbaiki hingga TypeScript PASS.

---

## FIX-005

Sprint 007

Production Build Failure

Status

RESOLVED

Description

Build gagal akibat kombinasi compile error dan TypeScript error.

Resolution

Semua blocker berhasil diperbaiki.

Status akhir:

- Build PASS
- Runtime PASS
- Production PASS

---

## FIX-006

Sprint 007

Social Route 404

Status

RESOLVED

Description

Menu Social menghasilkan 404.

Resolution

Menambahkan halaman placeholder "Coming Soon".

---

# Current Health

Build

✅ PASS

TypeScript

✅ PASS

Runtime

✅ PASS

Production

✅ PASS

Critical Bug

0

High Priority Bug

0

Platform Status

STABLE

---

END OF KNOWN ISSUES