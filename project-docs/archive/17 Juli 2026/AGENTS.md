# AGENTS.md

Version: 1.8  
Last Updated: 17 July 2026

---

# Yohan.AI Agent Architecture

## Purpose

This document defines every AI Agent inside the Yohan.AI Platform, including their responsibilities, boundaries, communication patterns, and collaboration rules.

Yohan.AI is **not** a chatbot platform.

It is an **AI-powered Property Buyer Behavior Intelligence System** where multiple specialized AI Agents collaborate to assist property professionals.

---

# High-Level Architecture

```
                    Platform Administrator
                            │
                            ▼
                 Executive Intelligence Layer
                            │
    ┌─────────────┬──────────────┬──────────────┐
    ▼             ▼              ▼
 CRM AI      Property AI     Marketing AI
    │             │              │
    ├──────┐      │      ┌───────┤
    ▼      ▼      ▼      ▼
Chat AI Workflow AI Knowledge AI
            │
            ▼
      Automation Engine
            │
            ▼
      WhatsApp / Email / API
```

---

# Core Principles

Every AI Agent has:

- A single responsibility.
- Clear ownership.
- Defined inputs and outputs.
- Shared intelligence through the platform.
- No overlapping responsibilities.

---

# Agent 01 — Executive Intelligence Agent

## Purpose

Provide organization-wide intelligence.

Responsibilities

- Executive dashboard
- KPI aggregation
- Business performance
- Forecast support
- Cross-module analytics

Input

- CRM
- Property
- Chat
- Marketing
- Reporting

Output

- Executive insights
- Dashboard metrics
- Alerts
- Recommendations

Priority

★★★★★

---

# Agent 02 — CRM Intelligence Agent

## Purpose

Understand customer behavior.

Responsibilities

- Lead management
- Customer profiling
- Lead scoring
- Opportunity tracking
- Follow-up suggestions

Input

Customer data.

Conversation history.

Activities.

Output

- Hot/Warm/Cold classification
- Lead score
- Buyer intent
- Follow-up recommendation

Priority

★★★★★

---

# Agent 03 — Property Intelligence Agent

## Purpose

Understand inventory and matching.

Responsibilities

- Listing analysis
- Property recommendation
- Availability monitoring
- Matching buyer requirements

Output

Recommended properties.

Alternative properties.

Inventory insights.

Priority

★★★★★

---

# Agent 04 — Conversation Intelligence Agent

## Purpose

Analyze communication quality.

Responsibilities

- Sentiment analysis
- Buying signal detection
- Objection detection
- Conversation summarization

Output

Conversation insights.

Risk indicators.

Recommended next actions.

Priority

★★★★★

---

# Agent 05 — Marketing Intelligence Agent

## Purpose

Measure marketing effectiveness.

Responsibilities

- Campaign analytics
- Lead source analysis
- Conversion tracking
- ROI monitoring

Output

Marketing dashboard.

Campaign recommendations.

Priority

★★★★☆

---

# Agent 06 — Knowledge Agent

## Purpose

Central knowledge repository.

Responsibilities

- Company knowledge
- SOP retrieval
- FAQ
- Sales playbooks
- Product knowledge

Output

Relevant contextual knowledge.

Priority

★★★★★

---

# Agent 07 — Workflow Agent

## Purpose

Automation orchestration.

Responsibilities

- Workflow execution
- Background jobs
- Event handling
- Integration triggers

Platform

n8n

Priority

★★★★★

---

# Agent 08 — Notification Agent

## Purpose

Deliver notifications.

Channels

- WhatsApp
- Email
- Internal alerts

Responsibilities

- Reminder
- Follow-up
- Assignment
- Escalation

Priority

★★★★☆

---

# Agent 09 — Reporting Agent

## Purpose

Generate reports.

Responsibilities

- Sales reports
- KPI reports
- Performance reports
- Export data

Priority

★★★★☆

---

# Agent 10 — Learning Agent

## Purpose

Continuously improve platform intelligence.

Responsibilities

- Learn communication patterns
- Improve recommendations
- Improve lead prediction
- Improve AI prompts

Important

The Learning Agent improves models and recommendation logic.

It **must not** expose one agent's private customer data to another agent.

---

# Multi-Agent Rules

Each property agent owns:

- Customers
- Listings
- Conversations
- Activities

Each organization's data is isolated.

Executive Intelligence only aggregates authorized information.

---

# AI Collaboration

```
Customer Message

↓

Conversation Agent

↓

CRM Agent

↓

Knowledge Agent

↓

Property Agent

↓

Recommendation

↓

Workflow Agent

↓

WhatsApp Reply
```

---

# Platform Roles

## Administrator

Access

- Everything

Capabilities

- User management
- Reports
- AI monitoring
- Configuration

---

## Property Agent

Access

Own data only.

Capabilities

- CRM
- Listings
- Chats
- Dashboard

---

## Team Leader

Access

Own team.

Capabilities

- Performance
- Coaching
- Reports

---

# Development Agents

## ChatGPT

Primary Role

System Architect.

Responsibilities

- Architecture
- Technical review
- Documentation
- Planning
- Decision validation
- Quality assurance
- Sprint planning
- Knowledge management

ChatGPT does **not** directly modify production code.

Its role is to review, validate, and document.

---

## Qwen

Primary Role

Implementation Engineer.

Responsibilities

- Generate code
- Refactor code
- UI implementation
- TypeScript fixes
- React components
- Next.js implementation
- Build fixes

Qwen is responsible for producing implementation-ready code after architecture has been reviewed.

---

# Collaboration Workflow

```
Requirement

↓

Architecture Design (ChatGPT)

↓

Technical Review

↓

APPROVE

↓

Implementation (Qwen)

↓

Replace Files

↓

Build

↓

Testing

↓

Documentation

↓

Sprint Complete
```

This workflow is mandatory.

No implementation should skip the review stage.

---

# Communication Rules

Every implementation request should contain:

- Objective
- Scope
- Constraints
- Expected output
- Acceptance criteria

Every completed implementation should include:

- Summary
- Modified files
- Build status
- Remaining issues

---

# Decision Authority

| Area | Owner |
|-------|-------|
| System Architecture | ChatGPT |
| Database Design | ChatGPT |
| Development Strategy | ChatGPT |
| Documentation | ChatGPT |
| UI Implementation | Qwen |
| Component Development | Qwen |
| Bug Fixes | Qwen |
| Build Verification | Shared |
| Final Approval | User |

---

# Agent Design Principles

Every AI Agent must be:

- Modular
- Independent
- Reusable
- Observable
- Secure
- Scalable

No agent should become a monolith.

---

# Long-Term Vision

Future versions of Yohan.AI will support:

- Multiple organizations
- Multiple property agencies
- Hundreds of agents
- Millions of conversations
- AI-assisted sales coaching
- Predictive business intelligence

The AI layer should evolve continuously while preserving tenant isolation, security, and maintainability.

---

End of AGENTS.md