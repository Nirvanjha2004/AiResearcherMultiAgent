# Frontend Features Not Backed by Current Backend

This document lists UI features that exist in the frontend but are not currently implemented by backend APIs in `fastApiBackend`.

## 1) Real-time SSE research streaming
- Status: implemented.
- Backend now exposes `GET /users/run_research_agent/stream?query=...` and streams JSON SSE messages.
- Frontend now consumes live stream events with `EventSource` and updates logs in real time.
- Fallback behavior: if SSE fails before any message arrives, deterministic simulated logs are used to preserve UX continuity.

## 2) Structured AgentState response contract
- Frontend capability: expects rich `AgentState` fields (`subqueries`, `raw_data`, `review_decision`, etc.).
- Backend reality: `run_research_agent` returns a generic result payload and does not guarantee full `AgentState` shape.
- Current frontend behavior: response is normalized into the UI `AgentState` model with safe defaults.

## 3) Token-based auth/session backend
- Frontend capability: stores a token and guards routes as if token auth exists.
- Backend reality: `/users/login` and `/users/signup` only return a text message; no JWT/session token endpoint.
- Current frontend behavior: uses backend login/signup for validation, then stores a synthetic client token for route-guard continuity.

## 4) Google OAuth login button
- Frontend capability: Google OAuth button is present in login and signup forms.
- Backend reality: no OAuth endpoints or provider flow implemented.
- Current frontend behavior: button is UI-only and does not call a backend OAuth flow.

## 5) Server-side session/history persistence
- Frontend capability: session list and active-session state exist in the dashboard.
- Backend reality: no endpoints for creating/listing/loading saved research sessions.
- Current frontend behavior: sessions are persisted only in browser `localStorage`.

## 6) File export/copy lifecycle tracking
- Frontend capability: copy-to-clipboard confirmation and markdown download actions.
- Backend reality: no backend endpoint for report file generation, export history, or audit trail.
- Current frontend behavior: entirely browser-side actions.

## 7) User profile model beyond username/password
- Frontend capability: UI works with `email` and profile display patterns.
- Backend reality: auth schema accepts only `username` and `password`, and persists to a flat file.
- Current frontend behavior: frontend maps `email` input to backend `username` field.
