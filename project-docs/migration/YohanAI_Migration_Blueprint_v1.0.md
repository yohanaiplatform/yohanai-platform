# Yohan.AI Migration Blueprint v1.0

**Version:** v1.0
**Date:** 2026-07-13
**Status:** Draft – Architecture Baseline

## 1. Executive Summary
Yohan.AI adalah proyek migrasi dari Google Workspace (Google Form, Google Spreadsheet, Google Apps Script, dan Google Apps Script API) menuju platform modern berbasis Next.js 16 dan Supabase PostgreSQL. Strategi migrasi menggunakan Progressive Migration agar sistem lama tetap berjalan selama transisi.

## 2. Migration Objectives
- Zero Data Loss
- Zero Business Logic Loss
- Progressive Migration
- Cloud Native Architecture
- AI First Platform
- Minimal Downtime
- Easy Rollback

## 3. Legacy Architecture
Google Form -> Google Spreadsheet -> Google Apps Script -> Google Apps Script API -> WAHA/n8n -> CRM & Dashboard

## 4. Target Architecture
Next.js 16 -> Supabase PostgreSQL -> Next.js API Route -> AI Engine -> Dashboard

## 5. Legacy Asset Inventory
### Spreadsheet
- CRM Database
- Listing Database
- Listing Inbox
- Chat Log
- System Config

### Google Apps Script
- AI Processor
- Decision Engine
- CRM Engine
- Dashboard
- Automation
- Property Matching

### Google API
- Customer API
- Inbox API
- Chat Log API
- AI Update API

## 6. Module Inventory
- CRM
- Property Listing
- Listing Inbox
- Chat Log
- AI Queue
- AI Analysis
- Decision Engine
- Workflow Automation
- Dashboard
- Document Generator

## 7. Database Mapping
| Legacy | PostgreSQL |
|---|---|
| Input Data | customers |
| Listing | properties |
| Listing Inbox | inquiries |
| Chat Log | chat_logs |
| AI Queue | ai_queue |
| AI Analysis | ai_analysis |
| Config | system_config |

## 8. API Mapping
| Legacy API | Next.js API |
|---|---|
| customer | /api/customers |
| createCustomer | /api/customers |
| createInboxLead | /api/inquiries |
| createChatLog | /api/chatlogs |
| updateCustomerAI | /api/ai/customers |

## 9. Migration Strategy
- Progressive Migration
- Blue-Green Deployment
- Legacy tetap aktif selama migrasi
- Validasi setiap modul
- Rollback setiap fase

## 10. Risk Analysis
- Backup Spreadsheet sebelum migrasi
- Mapping business logic sebelum implementasi
- Parallel validation API
- Cut-over bertahap

## 11. Sprint Roadmap
Sprint 001
- Infrastructure
- Supabase Foundation
- Migration Blueprint

Sprint 002
- Database Schema
- CRM Foundation
- Property Module

Sprint 003
- AI Engine
- Workflow
- Dashboard

Sprint 004
- Production Migration

## 12. Architecture Decisions
- GitHub = Source of Truth
- Mintlify = Official Documentation
- Supabase = Primary Backend
- PostgreSQL = Primary Database
- Next.js = Frontend
- ChatGPT = Architect & Reviewer
- Qwen = Code Generator

## 13. Current Status
Completed:
- Infrastructure
- Next.js
- GitHub
- Vercel
- Cloudflare
- Mintlify
- Supabase Project
- Supabase Foundation

Next:
- Database Schema
- ERD
- CRM Foundation
