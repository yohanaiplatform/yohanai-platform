# 02_Database_ERD_v1.0

## Domain Relationship

``` text
customers
    │
    ├──────────────┐
    │              │
    ▼              ▼
inquiries     customer_followups
    │
    ▼
properties
    │
    ├──────────────┐
    ▼              ▼
property_media  property_documents

customers
    │
    ▼
chat_sessions
    │
    ▼
chat_messages
    │
    ▼
chat_ai_summary
    │
    ▼
ai_analysis
    │
    ▼
ai_actions

customers
    │
    ▼
tasks
    │
    ▼
automation_logs
```

# Primary Entities

## customers

PK: id

Relationship - 1:N inquiries - 1:N chat_sessions - 1:N followups - 1:N
tasks

## properties

PK: id

Relationship - 1:N property_media - 1:N property_documents - 1:N
inquiries

## inquiries

Bridge antara customer dan property.

## chat_sessions

Satu customer dapat memiliki banyak sesi.

## chat_messages

Satu sesi memiliki banyak pesan.

## ai_analysis

Analisis AI terhadap customer dan percakapan.

## tasks

Follow up dan workflow internal.

# Entity List

-   customers
-   customer_followups
-   customer_notes
-   customer_tags
-   properties
-   property_media
-   property_documents
-   inquiries
-   chat_sessions
-   chat_messages
-   chat_ai_summary
-   ai_queue
-   ai_analysis
-   ai_actions
-   tasks
-   automation_logs
-   users
-   roles
-   permissions
-   settings
-   audit_logs

# Next Deliverable

03_PostgreSQL_Schema_v1.0.md 04_SQL_Migration_v1.0.sql
