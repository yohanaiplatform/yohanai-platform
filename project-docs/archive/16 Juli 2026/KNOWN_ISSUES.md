# KNOWN_ISSUES.md
# Yohan.AI Platform
# Version 1.7
# Updated: 2026-07-16

---

# Purpose

Dokumen ini mencatat seluruh issue yang diketahui selama proses development.

Issue dibagi menjadi:

- Active
- Planned
- Resolved

Issue yang sudah selesai **tidak dihapus**, tetapi dipindahkan ke bagian **Resolved** agar histori teknis tetap terdokumentasi.

---

# ACTIVE ISSUES

## ISSUE-001

Title

Dashboard masih menggunakan Static Data.

Status

OPEN

Priority

High

Description

Executive Dashboard masih menggunakan data statis untuk:

- KPI
- AI Recommendation
- Follow Up
- Quick Actions

Impact

Tidak mempengaruhi build.

Hanya mempengaruhi fungsi bisnis.

Planned Sprint

Sprint 007

---

## ISSUE-002

Title

Business Modules belum dibuat.

Status

OPEN

Priority

High

Modules

- CRM
- Property
- Sales
- Communication
- Settings

Current Behaviour

Menu masih mengarah ke placeholder.

Planned Sprint

Sprint 007

---

## ISSUE-003

Title

Navigation masih menghasilkan beberapa 404.

Status

OPEN

Priority

Medium

Affected Routes

- /crm
- /properties
- /sales
- /communication
- /settings

Root Cause

Halaman belum dibuat.

Resolution Plan

Minimal membuat halaman "Coming Soon" atau menggunakan `EmptyState`.

Target Sprint

Sprint 007

---

## ISSUE-004

Title

Dashboard belum menggunakan Supabase.

Status

OPEN

Priority

High

Current

Static Data

Future

Realtime Dashboard

Target Sprint

Sprint 007

---

## ISSUE-005

Title

Charts belum tersedia.

Status

OPEN

Priority

Low

Future Components

- Sales Chart
- Lead Funnel
- Property Performance
- Activity Timeline

Target Sprint

Sprint 008

---

# PLANNED IMPROVEMENTS

## UI Enhancement

Status

PLANNED

Items

- Tinggi KPI Card dibuat lebih ringkas.
- Ikon Quick Action diperbesar.
- AI Recommendation dibuat lebih informatif.
- Konsistensi spacing seluruh halaman.
- EmptyState dengan ilustrasi ringan (opsional).

---

## Dashboard Enhancement

Status

PLANNED

Items

- AI Daily Brief
- Lead Summary
- Today's Follow Up
- Property Summary
- Recent Activity
- KPI Realtime

---

## Design System Enhancement

Status

PLANNED

Items

- Semantic Color Tokens
- Shared PageHeader
- Shared PageContainer
- Shared Badge Variants
- Shared Loading Components
- Shared Skeleton Components

---

# RESOLVED ISSUES

---

## RESOLVED-001

Title

Supabase Authentication gagal redirect.

Status

RESOLVED

Resolution

Konfigurasi Auth diverifikasi dan login berhasil menggunakan akun admin.

Completed

Sprint 006

---

## RESOLVED-002

Title

Badge Component tidak ditemukan.

Status

RESOLVED

Root Cause

Komponen `badge.tsx` belum tersedia.

Resolution

Menambahkan komponen Badge dari shadcn/ui.

Completed

Sprint 006

---

## RESOLVED-003

Title

QuickActionCard menyebabkan Build Error.

Status

RESOLVED

Error

Event handlers cannot be passed to Client Component props.

Root Cause

Komponen menerima function props (`onClick`) yang tidak sesuai untuk Server Component pada Next.js App Router.

Resolution

QuickActionCard diubah menjadi **Presentational Component** tanpa function props.

Completed

Sprint 006

---

## RESOLVED-004

Title

Production Build gagal.

Status

RESOLVED

Resolution

Perbaikan pada QuickActionCard dan dependency Badge.

Result

Production Build PASS.

Completed

Sprint 006

---

## RESOLVED-005

Title

Responsive Dashboard Validation.

Status

RESOLVED

Desktop

PASS

Tablet

PASS

Mobile

PASS

Validated Using

Chrome DevTools

Devices

- iPhone 14 Pro
- Pixel 7

Completed

Sprint 006

---

# PROJECT HEALTH

Infrastructure

PASS

Authentication

PASS

AppShell

PASS

Shared UI

PASS

Executive Dashboard

PASS

Production Build

PASS

Responsive

PASS

---

# NEXT REVIEW

Sprint 007

Focus

- Remove Navigation 404
- Dashboard Supabase Integration
- CRM Foundation
- Property Foundation
- Communication Foundation

---

# Notes

Rule:

Issue yang sudah selesai **tidak dihapus**.

Semua issue dipindahkan ke bagian **Resolved** agar histori teknis proyek tetap lengkap dan dapat ditelusuri di masa mendatang.