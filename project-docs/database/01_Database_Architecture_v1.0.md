# Database Architecture v1.0

**Sprint:** 002\
**Status:** Draft

# Core Schemas

## public

-   customers
-   properties
-   inquiries
-   property_media
-   chat_sessions
-   chat_messages

## ai

-   ai_queue
-   ai_analysis
-   ai_memory
-   ai_actions
-   ai_prompt_history

## workflow

-   tasks
-   followups
-   automation_logs
-   calendar_events

## marketing

-   campaigns
-   campaign_leads

## knowledge

-   faq
-   documents

## system

-   users
-   roles
-   permissions
-   settings
-   audit_logs

# Legacy Mapping

  Legacy          Target
  --------------- ---------------
  Input Data      customers
  Listing         properties
  Listing Inbox   inquiries
  Chat Log        chat_messages
  AI Queue        ai_queue
  AI Analysis     ai_analysis
  Config          settings

# Customer Domain

customers - id (UUID) - customer_code - full_name - phone - email -
lead_source - lead_status - created_at - updated_at - deleted_at

customer_followups customer_notes customer_tags customer_ai

# Property Domain

properties property_media property_prices property_documents

# Conversation Domain

chat_sessions chat_messages chat_ai_summary

# AI Domain

ai_queue ai_analysis ai_memory ai_actions

# Workflow

tasks followups automation_logs

# Global Standard

Semua tabel menggunakan:

-   UUID Primary Key
-   created_at
-   updated_at
-   deleted_at (soft delete)
-   created_by
-   updated_by

# Next Deliverable

1.  ERD
2.  PostgreSQL SQL Migration
3.  RLS Policy
4.  Seed Data
