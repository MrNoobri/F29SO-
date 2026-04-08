# MEDXI — Project TODO

This document tracks the state of MEDXI (Virtual Health Companion): what has been delivered, what is in progress, and what remains on the backlog. Items are grouped by theme rather than chronology so the overall picture stays easy to scan.

## Project Goals

- Deliver a role-based healthcare platform serving patients, providers, and administrators.
- Track health metrics over time and surface meaningful trends through an interactive dashboard.
- Provide secure authentication, protected routes, and role-aware access control.
- Support core clinical workflows including appointments, alerts, and direct messaging.
- Integrate wearable data sources and AI-assisted guidance to enrich the patient experience.

## Completed

### Foundation
- [x] Frontend scaffolded with React, Vite, and Tailwind CSS
- [x] Backend scaffolded with Express and MongoDB (Mongoose)
- [x] Environment configuration through `.env.example` for both client and server
- [x] Project start and stop scripts for local development

### Authentication and Accounts
- [x] Email and password authentication with JWT access and refresh tokens
- [x] Google OAuth login and signup flow
- [x] Password-setup flow for users who signed up through OAuth
- [x] Persisted theme and UI preferences on the user profile
- [x] Role-based access control across patient, provider, and admin roles

### Patient Experience
- [x] Patient dashboard with real-time metric cards and status indicators
- [x] Health metrics CRUD for heart rate, blood pressure, glucose, oxygen saturation, sleep, and steps
- [x] 7-day trend charts per metric using Recharts
- [x] Wearable device simulator that streams readings every 30 seconds
- [x] Google Fit integration with OAuth connection, manual sync, and disconnect
- [x] AI health assistant backed by Google Gemini 2.0
- [x] Personalized health insights derived from recent metrics
- [x] Recipe recommendations for dietary guidance

### Provider Experience
- [x] Multi-tab provider dashboard covering overview, calendar, patients, alerts, and messaging
- [x] Provider patient list and detailed metric snapshots
- [x] Appointment management and provider availability views
- [x] Alert acknowledgement workflow

### Administrator Experience
- [x] Admin dashboard for user management
- [x] User listing, update, and deletion endpoints

### Cross-Cutting Features
- [x] Direct messaging between users with unread counts and conversation history
- [x] Alerts system with read state and acknowledgement
- [x] Gamification layer with points, streaks, and a leaderboard
- [x] Audit logging of key user and system events

## In Progress

- [ ] Tighten metric thresholds and granularity for more accurate insights
- [ ] Expand Google Fit metric coverage and improve schema mapping
- [ ] Polish provider workflow transitions between tabs and detail panels

## Backlog

### Clinical and Product
- [ ] Configurable alert rules per patient and per metric
- [ ] Care plan authoring and assignment by providers
- [ ] Medication tracking and reminders
- [ ] Appointment reminders through email or in-app notification
- [ ] Export of patient health history as PDF or CSV

### Integrations
- [ ] Additional wearable providers beyond Google Fit
- [ ] Webhook ingestion for third-party metric sources
- [ ] Optional SMS notification channel

### Quality and Operations
- [ ] Automated test coverage for critical backend controllers
- [ ] Component and integration tests for dashboard flows
- [ ] Continuous integration pipeline for lint, test, and build
- [ ] Production deployment guide and hardening checklist
- [ ] Accessibility review across patient and provider dashboards

## Housekeeping

- [x] Keep generated files out of version control
- [x] Keep local environment files out of version control
- [x] Keep uploads and test artifacts out of version control

## Working Notes

- Prefer small, focused commits scoped to a single concern.
- Treat the README as the source of truth for installation and API surface; update it alongside any change that affects those areas.
- When introducing a new feature, add its task here first, then move it into **Completed** once shipped.
