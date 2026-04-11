# Frontend Features Not Backed by Current Backend

This document lists UI features that exist in the frontend but are not currently implemented by backend APIs in `fastApiBackend`.

## 1) Real-time SSE research streaming
- Status: implemented.
- Backend now exposes `GET /users/run_research_agent/stream?query=...` and streams JSON SSE messages.
- Frontend now consumes live stream events with `EventSource` and updates logs in real time.
- Fallback behavior: if SSE fails before any message arrives, deterministic simulated logs are used to preserve UX continuity.

## 2) Structured AgentState response contract
- Status: implemented.
- Backend now normalizes and validates `AgentState` for both `POST /users/run_research_agent` and SSE `complete` events.
- Contract guarantees these fields: `user_query`, `subqueries`, `raw_data`, `final_output`, `review_decision`, `review_feedback`, `revision_count`.
- Frontend normalization remains in place as a defensive fallback for transient/non-conforming payloads.

## 3) Token-based auth/session backend
- Status: implemented.
- Backend `POST /users/signup` and `POST /users/login` now return signed bearer tokens and session metadata.
- Backend provides `GET /users/session` for token/session validation and `POST /users/logout` for session invalidation.
- Research endpoints now require a valid token-backed session.
- Frontend stores and uses the real backend-issued token (no synthetic token fallback).

## 4) Google OAuth login button
- Status: removed from frontend.
- Google OAuth button and UI-only OAuth affordances are no longer rendered in login/signup forms.
- Backend OAuth endpoints remain not implemented.

## 5) Server-side session/history persistence
- Status: implemented.
- Backend now provides authenticated session persistence endpoints:
	- `GET /users/research_sessions` to list saved sessions for the signed-in user.
	- `POST /users/research_sessions` to create/update saved sessions.
- Frontend now syncs dashboard sessions with backend persistence and keeps `localStorage` as a cache fallback when sync is unavailable.

## 6) File export/copy lifecycle tracking
- Status: implemented.
- Backend now provides authenticated export lifecycle audit endpoints:
	- `POST /users/export_events` to record copy/download success or failure.
	- `GET /users/export_events` to retrieve per-user export/copy history.
- Frontend now records copy/download lifecycle events from action controls and chat message copy actions, while preserving existing browser-side copy/download UX.

## 7) User profile model beyond username/password
- Frontend capability: UI works with `email` and profile display patterns.
- Backend reality: auth schema accepts only `username` and `password`, and persists to a flat file.
- Current frontend behavior: frontend maps `email` input to backend `username` field.
