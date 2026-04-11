# Refactor Plan

## Goals
- Reduce duplicated logic and dead code.
- Separate backend concerns into smaller modules.
- Normalize frontend architecture around the active runtime flow.
- Improve test signal, maintainability, and safety.
- Remove overengineered or stale code paths that no longer match the product.

## Current State Summary
- The frontend has two parallel UI patterns: a newer chat-first flow and older legacy panels/components.
- The backend route file has grown into a monolith that mixes auth, profile, session persistence, export auditing, SSE streaming, and research orchestration.
- Auth/session logic is file-backed and mostly process-local.
- Several components and tests still target legacy UI paths.
- There is repeated request/auth plumbing across frontend services.

## Backend / Frontend Wiring Audit

### Fully Wired End-to-End
- Auth flow is connected across the stack: `AuthPage` uses `authApi.ts`, and `AuthContext` re-syncs the signed-in user from the backend profile endpoint after login.
- Research flow is connected end-to-end through the streaming path: `useResearch` -> `researchApi.ts` -> `GET /users/run_research_agent/stream`.
- Session persistence is connected end-to-end: `useSessions` -> `sessionsApi.ts` -> `GET /users/research_sessions` and `POST /users/research_sessions`.
- Export tracking is connected from the UI: `MessageBubble` calls `trackExportEvent()` for copy success and failure events, which targets `POST /users/export_events`.

### Backend Routes That Are Not Currently Used by the Frontend
- `GET /users/session` exists in `userRoute.py`, but there is no frontend caller.
- `PATCH /users/profile` exists in `userRoute.py`, but there is no profile-edit UI or API caller yet.
- `POST /users/run_research_agent` exists, but the frontend only uses the streaming research endpoint.
- `GET /users/export_events` exists, but the frontend does not currently render an export history or audit viewer.

### Wiring Quality Summary
- The core product loop is connected: auth, streaming research, session persistence, and export auditing all have active call paths.
- The main gaps are product gaps, not transport gaps: there is no UI for profile editing, no session validation bootstrap, and no export-history screen.
- The remaining backend work is mostly contract cleanup, route consolidation, and deciding whether unused endpoints should be implemented in the UI or retired.

## Highest Priority Findings
1. The frontend does not consume every backend route, so there are visible backend capabilities that the UI cannot reach yet.
2. `GET /users/session`, `PATCH /users/profile`, `POST /users/run_research_agent`, and `GET /users/export_events` are currently unrepresented in the UI.
3. The active product flow is healthy, but the contracts are spread across route handlers, service modules, hooks, and local storage fallbacks.
4. Backend route logic is still concentrated in one large file, which makes feature ownership and test coverage harder to reason about.
5. Legacy UI and test coverage still exist alongside the active chat-first flow.
6. Some current behaviors rely on silent fallback paths, especially in auth and session sync.

## Refactor Phases

### Audit Step 0: Confirm the target wiring
- Decide whether the backend-only routes should become active frontend features or be deprecated.
- Keep the already-wired flows as the baseline: auth, streaming research, session persistence, and export tracking.
- Document the expected frontend caller for each backend route before changing code.

### Audit Step 1: Close the missing UI/backend gaps
- Add a profile editing flow if `PATCH /users/profile` is meant to stay supported.
- Add a session validation/bootstrap call if `GET /users/session` should be part of app startup.
- Add an export history or audit view if `GET /users/export_events` is a real product requirement.
- Keep the streaming research path as the primary runtime path unless there is a concrete need for the non-streaming endpoint.

### Phase 0: Stabilize the baseline
- Remove duplicate app entry logic in `frontend/src/App.tsx`.
- Fix TypeScript/configuration issues so build and test feedback is reliable.
- Validate that the current chat-first flow still renders and routes correctly.

### Phase 1: Choose one frontend UX path
- Make the chat-first flow the canonical runtime path.
- Review legacy components in:
  - `frontend/src/components/MainArea.tsx`
  - `frontend/src/components/Sidebar/Sidebar.tsx`
  - `frontend/src/components/ResultViewer.tsx`
  - `frontend/src/components/FloatingActionBar.tsx`
- Decide which legacy components should be removed, adapted, or kept as shared primitives.
- Remove tests that only cover obsolete behavior.

### Phase 2: Extract a shared frontend API layer
- Create a single request helper for all frontend API modules.
- Centralize auth token retrieval and header injection.
- Standardize error parsing and response normalization.
- Refactor these modules to use the shared helper:
  - `frontend/src/services/authApi.ts`
  - `frontend/src/services/researchApi.ts`
  - `frontend/src/services/sessionsApi.ts`
  - `frontend/src/services/exportTrackingApi.ts`

### Phase 3: Simplify frontend state management
- Move session deduplication and persistence rules out of `Dashboard.tsx`.
- Make `useResearch` and `useSessions` responsible for clearer, narrower concerns.
- Reduce direct coupling between components and browser storage.
- Add a small state adapter layer if needed between backend DTOs and UI models.

### Phase 4: Break up the backend monolith
Split `fastApiBackend/api/routes/userRoute.py` into separate modules:
- Auth routes
- Profile routes
- Research streaming routes
- Session persistence routes
- Export tracking routes

Document the frontend callers beside each route while splitting the modules so the team can see which endpoints are live and which are still pending UI work.

Move the implementation details into dedicated backend services:
- Token creation and verification
- User profile storage
- Research session storage
- Export audit storage
- SSE stream formatting

### Phase 5: Harden backend persistence and security
- Replace plaintext password storage with hashed passwords.
- Replace in-memory session state with a persistent store.
- Move from ad-hoc file persistence to a real database if possible.
- Avoid token-in-query usage where a safer auth flow is possible.
- Add atomic write handling for file-backed stores if files remain in use.

Status update:
- Password storage now uses `pbkdf2_sha256` hashes with automatic migration for legacy plaintext records on successful login.
- File-backed stores now use atomic write replacement to reduce corruption risk during crashes/interrupted writes.
- Session validation and logout now require bearer auth headers (query-token fallback removed for these routes).
- SSE stream endpoint converted to fetch-based parsing with authorization headers; query-token support completely removed.
- All auth routes now enforce bearer-header-only auth.
- Session registry replaced in-memory dict with file-backed persistence (`active_sessions.json`) using atomic writes.
- Frontend research API now uses fetch-based SSE parsing with auth headers instead of EventSource query tokens.
- Added test ID support to chat components (Dashboard, ChatLayout, Sidebar) for better test coverage.
- Structured logging added: `logging_service.py` provides auth, session, research, and error event logging with JSON payloads.
- Route handlers instrumented with logging calls for signup, login, logout, session validation, profile updates, research start/complete, and export events.
- Request/response middleware added: `middleware.py` logs HTTP method, path, status, duration, client host, and request ID.

Remaining work (Phase 5 & 6):
- Add request ID propagation across async operations for better tracing.
- Consider database migration for production-grade persistence (currently file-backed).
- Further tighten tests around the active chat-first user journey.
- Performance tuning and caching for frequently accessed data (profiles, sessions).

### Phase 6: Remove dead code and stale tests
- Delete or consolidate legacy components that are no longer part of the runtime flow.
- Remove tests for deleted code.
- Rewrite or update tests for the current chat-first product flow.
- Make property-based tests focus on real user journeys instead of old component variants.

### Phase 7: Add clearer contracts and observability
- Define stable DTOs for:
  - auth/profile
  - research stream events
  - session persistence
  - export lifecycle events
- Centralize backend DTOs in a shared schemas module so routes and services do not redefine them.
- Add structured logging around backend failures.
- Make fallback behavior explicit and environment-aware.
- Add request identifiers if the backend grows further.

## Wiring Decisions To Make
- Keep or retire `GET /users/session`.
- Keep or retire `PATCH /users/profile`.
- Keep or retire the non-streaming research endpoint.
- Keep or retire `GET /users/export_events` until an export history UI exists.
- Decide whether auth/session bootstrap should remain local-storage driven or be validated by the backend on app load.

## Recommended Execution Order For This Audit
1. Confirm which backend-only routes are intended to stay.
2. Add frontend callers for the intended routes, starting with profile and session bootstrap.
3. Remove or deprecate routes that are not product requirements.
4. Split the backend route file after the contract decisions are frozen.
5. Add integration tests for the connected paths so the wiring stays stable.

## Suggested Order of Execution
1. Fix the frontend baseline.
2. Remove or consolidate legacy frontend UI paths.
3. Extract frontend API helpers.
4. Split backend route logic into modules.
5. Harden persistence and auth.
6. Clean up dead tests and stale code.
7. Add observability and contract documentation.

## Files Likely to Change First
- `frontend/src/App.tsx`
- `frontend/src/services/*.ts`
- `frontend/src/hooks/useResearch.ts`
- `frontend/src/hooks/useSessions.ts`
- `frontend/src/pages/Dashboard.tsx`
- `frontend/src/components/chat/*`
- `fastApiBackend/api/routes/userRoute.py`
- `fastApiBackend/services/*`
- `fastApiBackend/models/*`

## What To Remove Or Reassess
- Legacy UI components that are not used by the runtime app.
- Duplicate or near-duplicate test coverage.
- Overly defensive fallback behavior that hides backend failures.
- Empty placeholder files and unused imports.

## Risks
- Auth/session changes can break the entire app if done without a stable contract.
- Removing old UI paths before confirming the canonical flow could delete still-useful code.
- Backend file-based persistence is fragile under concurrency.
- Stream fallback logic can mask production failures if not monitored.

## Practical Recommendation
Start with a short cleanup sprint focused on:
- removing the duplicate app entry bug,
- deciding the canonical frontend UX,
- extracting shared frontend API helpers,
- and splitting the backend monolith into route/service layers.

After that, move persistence to a proper database and replace custom auth/session storage with hardened infrastructure.

## Refactor Progress
- Completed: removed the duplicate legacy `App` implementation.
- Completed: extracted shared frontend API helpers for URL building, auth headers, and JSON requests.
- Completed: split backend auth/profile/session/export/research logic into focused service modules.
- Completed: removed the legacy `MainArea` and old sidebar component tree.
- Completed: removed the remaining legacy input/log/error/result action components and their tests.
- Completed: pruned dead shared prop interfaces that only existed for deleted components.
- Completed: wired backend session validation into the frontend auth bootstrap flow.
- Completed: wired backend profile updates into the sidebar profile editor.
- Completed: wired backend export history into the sidebar as a recent activity panel.
- Completed: wired the non-streaming research endpoint as the SSE fallback path.
- Next: tighten the test suite around the active chat-first flow and add coverage for the refactored backend service boundaries.
