# PostgreSQL Schema v1.0

## Schemas

-   public
-   ai
-   workflow
-   marketing
-   knowledge
-   system

## Core Tables

public.customers public.properties public.inquiries public.chat_sessions
public.chat_messages public.property_media

ai.ai_queue ai.ai_analysis ai.ai_memory ai.ai_actions

workflow.tasks workflow.followups workflow.automation_logs

system.users system.roles system.permissions system.settings
system.audit_logs

## Standard Columns

id (UUID) created_at updated_at deleted_at created_by updated_by
