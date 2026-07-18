# PROJECT_RULES.md

Version: 2.0
Last Updated: 2026-07-18
Status: ACTIVE

---

# Project

Yohan.AI

Property Buyer Behavior Intelligence System

---

# Objective

Seluruh pengembangan harus menghasilkan platform production-ready yang stabil, scalable, maintainable, dan mudah dikembangkan.

Prioritas utama:

1. Stability
2. Maintainability
3. Readability
4. Scalability
5. Performance

Jangan mengorbankan stabilitas hanya untuk mengejar kecepatan implementasi.

---

# Development Philosophy

Progress kecil tetapi stabil lebih baik daripada implementasi besar yang berisiko.

Setiap Sprint harus menghasilkan software yang dapat di-build, dijalankan, dan diuji.

Build yang PASS selalu lebih penting daripada fitur yang banyak.

---

# Development Workflow

Requirement

↓

Architecture Review (ChatGPT)

↓

Implementation (Qwen)

↓

Technical Review (ChatGPT)

↓

Minor Patch (ChatGPT)

↓

Build

↓

Runtime QA

↓

Documentation Update

↓

Next Task

---

# Role Definition

## ChatGPT

Berperan sebagai:

- System Architect
- Technical Reviewer
- QA Engineer
- Root Cause Analyst
- Documentation Lead
- Sprint Planner
- Technical Decision Maker

ChatGPT bertanggung jawab memastikan kualitas teknis sebelum kode dianggap selesai.

---

## Qwen

Berperan sebagai:

- Full Stack Developer
- UI Developer
- React Developer
- Refactoring
- Multi-file Implementation
- Feature Development

Qwen fokus menghasilkan implementasi kode.

---

# Code Review Standard

Semua kode WAJIB direview sebelum dianggap selesai.

Review mencakup:

- Architecture
- TypeScript
- React Pattern
- Next.js Pattern
- Performance
- Maintainability
- Regression Risk
- Runtime Risk

---

# Review Status

## 🟢 APPROVED

Code memenuhi standar.

Action:

Merge.

---

## 🟡 PATCHED

Perubahan kecil.

Contoh:

- typo
- import
- icon
- TypeScript kecil
- lint
- formatting
- props
- callback
- optional chaining
- missing interface
- syntax

Action:

ChatGPT langsung memperbaiki.

Tidak perlu kembali ke Qwen.

---

## 🟠 QWEN REVISION

Perubahan implementasi.

Contoh:

- Feature baru
- Refactor
- UI besar
- Multi-file
- Business Logic
- Database
- API
- State Management

Action:

Kembali ke Qwen.

---

## 🔴 REJECTED

Code tidak boleh di-merge.

Contoh:

- Regression besar
- Architecture rusak
- Build gagal
- Runtime crash
- Security issue
- Data corruption risk

Action:

Implementasi ulang.

---

# Patch Policy

ChatGPT diperbolehkan langsung mengubah kode apabila:

- revisi kecil
- tidak mengubah arsitektur
- tidak mengubah business logic
- tidak menambah dependency
- tidak mengubah flow aplikasi

Patch harus langsung diberikan dalam bentuk **file lengkap siap copy-paste**.

Tidak boleh meminta user menyisipkan potongan kode.

---

# Code Delivery Standard

Semua file revisi harus dikirim dalam bentuk:

- Full File
- Ready Copy
- Ready Paste
- Ready Replace
- Ready Save

Tidak diperbolehkan memberikan:

- potongan kode
- "sisipkan di baris..."
- "tambahkan setelah..."
- "ubah bagian..."

Kecuali diminta secara eksplisit.

---

# Build Rules

Setelah implementasi:

```bash
npx tsc --noEmit
```

Jika PASS

↓

```bash
npm run build
```

Jika PASS

↓

```bash
npm run dev
```

↓

Runtime QA

Tidak boleh melewati tahapan tersebut.

---

# Runtime QA Checklist

Desktop

- Login
- Dashboard
- Sidebar
- Navigation
- Header
- Footer
- Notification
- User Menu

Mobile

- Responsive
- Drawer
- Bottom Navigation
- Tablet Layout

Console

- No Runtime Error
- No Build Error
- No Crash

---

# Regression Policy

Tidak boleh:

- menghapus fitur tanpa alasan
- mengubah UI tanpa persetujuan
- mengubah struktur project
- mengubah routing
- mengubah architecture

Jika perubahan tersebut diperlukan, wajib dijelaskan terlebih dahulu.

---

# Documentation Rules

Setiap Sprint wajib memperbarui:

- SESSION_CONTEXT.md
- PROJECT_RULES.md (jika workflow berubah)
- QWEN_HANDOFF.md
- KNOWN_ISSUES.md
- AI_CONTEXT.md (jika arsitektur berubah)
- Daily Log
- Master Project Documentation

Tidak boleh ada perubahan penting yang hanya tersimpan di percakapan.

---

# Task Completion Criteria

Sebuah Task dinyatakan selesai apabila:

- Build PASS
- TypeScript PASS
- Runtime PASS
- QA PASS
- Tidak ada blocker
- Dokumentasi diperbarui

Baru setelah itu boleh lanjut ke task berikutnya.

---

# Engineering Principles

- Build bersih lebih penting daripada fitur banyak.
- Hindari refactor tanpa kebutuhan.
- Gunakan perubahan sekecil mungkin untuk memperbaiki bug.
- Dokumentasikan setiap keputusan teknis penting.
- Jangan mengubah sesuatu yang sudah stabil tanpa alasan yang jelas.
- Selalu prioritaskan kualitas dibanding kuantitas perubahan.

---

END OF PROJECT RULES