# Implementation Tasks: Multi-Agent Research Platform UI

## Task List

- [ ] 1. Project Scaffolding and Configuration
  - [ ] 1.1 Initialize Vite + React + TypeScript project
  - [ ] 1.2 Install and configure Tailwind CSS with `darkMode: 'class'`
  - [ ] 1.3 Install shadcn/ui, Lucide React, Framer Motion, react-router-dom, react-markdown, fast-check
  - [ ] 1.4 Create `src/config/api.ts` with `API_BASE_URL` constant from `VITE_API_BASE_URL` env var
  - [ ] 1.5 Create `src/lib/animations.ts` with all Framer Motion variant definitions
  - [ ] 1.6 Create `src/types/index.ts` with `UIState`, `AgentState`, `Session`, `StreamEvent` interfaces

- [ ] 2. API Service Layer
  - [ ] 2.1 Create `src/services/researchApi.ts` with `streamResearch(query, callbacks)` function using SSE (EventSource)
  - [ ] 2.2 Implement mock streaming fallback in `researchApi.ts` that emits `MOCK_LOG_LINES` at 400ms intervals when SSE connection fails
  - [ ] 2.3 Write unit test `researchApi.test.ts` — SSE failure triggers fallback, mock sequence completes with `onComplete`
  - [ ] 2.4 Write PBT `researchApi.pbt.test.ts` — Property 8: any SSE event sequence routes correctly to callbacks

- [ ] 3. Global Context Providers
  - [ ] 3.1 Create `src/context/AuthContext.tsx` with user, token, login, logout; reads/writes `localStorage`
  - [ ] 3.2 Create `src/context/ThemeContext.tsx` with theme state, toggle; applies/removes `dark` class on `document.documentElement`; persists to `localStorage`

- [ ] 4. Custom Hooks
  - [ ] 4.1 Create `src/hooks/useResearch.ts` implementing `UseResearchReturn` interface — owns `uiState`, `logLines`, `agentState`, `currentQuery`, `startResearch`, `resetToIdle`, `loadSession`
  - [ ] 4.2 Create `src/hooks/useSessions.ts` — manages session list in `localStorage`, exposes `sessions`, `addSession`, `activeSessionId`, `setActiveSessionId`

- [ ] 5. Authentication Page
  - [ ] 5.1 Create `src/pages/AuthPage.tsx` with split layout (BrandingPanel + AuthFormPanel)
  - [ ] 5.2 Implement tab switcher (Login / Sign Up) with 150ms fade transition via Framer Motion
  - [ ] 5.3 Implement LoginForm with email, password fields and Google OAuth button
  - [ ] 5.4 Implement SignUpForm with email, password, confirm-password fields and Google OAuth button
  - [ ] 5.5 Implement per-field inline validation (empty field check) that blocks form submission
  - [ ] 5.6 Implement auth error inline alert display
  - [ ] 5.7 Apply mount animation: `fadeUpVariant` (y: 10px → 0, 300ms ease-out)
  - [ ] 5.8 Write unit test `AuthPage.test.tsx` — tab switching, field presence, error alert
  - [ ] 5.9 Write PBT `AuthPage.pbt.test.tsx` — Property 1: any empty required field combination blocks submission

- [ ] 6. Dashboard Shell
  - [ ] 6.1 Create `src/pages/Dashboard.tsx` with fixed Sidebar + MainArea layout
  - [ ] 6.2 Create `src/components/ThemeToggle.tsx` using `ThemeContext`
  - [ ] 6.3 Write unit test `Dashboard.test.tsx` — layout structure, dark mode toggle, active session highlight

- [ ] 7. Sidebar
  - [ ] 7.1 Create `src/components/Sidebar/Sidebar.tsx` with NewResearchButton, SessionList, UserProfile sections
  - [ ] 7.2 Create `src/components/Sidebar/SessionItem.tsx` with active highlight (200ms ease-in-out) and hover scale (1.02, 150ms)
  - [ ] 7.3 Wire "+ New Research" button to `resetToIdle` from `useResearch`
  - [ ] 7.4 Wire session item click to `loadSession` from `useResearch` and `setActiveSessionId` from `useSessions`
  - [ ] 7.5 Write PBT `Sidebar.pbt.test.tsx` — Property 4: clicking any session item shows that session's result

- [ ] 8. Main Area State Machine
  - [ ] 8.1 Create `src/components/MainArea.tsx` that renders the correct child based on `uiState`, wrapped in `AnimatePresence` for exit/enter transitions

- [ ] 9. Query Input (Idle State)
  - [ ] 9.1 Create `src/components/QueryInput.tsx` with multi-line textarea (min-height 120px, placeholder) and "Start Research" button
  - [ ] 9.2 Implement empty/whitespace validation with inline error message
  - [ ] 9.3 Apply button hover (scale 1.02, 150ms) and tap (scale 0.97, 100ms) animations via Framer Motion `whileHover`/`whileTap`
  - [ ] 9.4 Apply mount animation: `fadeUpVariant` (300ms ease-out)
  - [ ] 9.5 Write PBT `QueryInput.pbt.test.tsx` — Property 2: any whitespace-only string is rejected

- [ ] 10. Log Panel (Loading State)
  - [ ] 10.1 Create `src/components/LogPanel.tsx` with monospace font, `bg-gray-100 dark:bg-gray-800`, `rounded-2xl`, fixed max-height, overflow-y-scroll
  - [ ] 10.2 Render each log line as a `motion.div` with `logLineVariant` (y: 5px → 0, 200ms)
  - [ ] 10.3 Implement auto-scroll to bottom on new line append using `useEffect` + `scrollTop = scrollHeight`
  - [ ] 10.4 Render blinking cursor element after last line while `isLoading` is true
  - [ ] 10.5 Render indeterminate progress bar at top of panel while `isLoading` is true
  - [ ] 10.6 Write unit test `LogPanel.test.tsx` — progress bar, cursor, mock streaming fallback, SSE error → error state
  - [ ] 10.7 Write PBT `LogPanel.pbt.test.tsx` — Property 5: any sequence of log lines appears in order

- [ ] 11. Result Viewer (Success State)
  - [ ] 11.1 Create `src/components/ResultViewer.tsx` that renders `markdown` prop via `react-markdown`
  - [ ] 11.2 Apply mount animation: `scaleInVariant` (0.98 → 1.0, 300ms ease-in-out)
  - [ ] 11.3 Stagger-animate content blocks with `staggerContainer` + `fadeUpVariant` (50ms delay between blocks)
  - [ ] 11.4 Create `src/components/FloatingActionBar.tsx` with Copy, Download, New Research buttons
  - [ ] 11.5 Apply FloatingActionBar mount animation: `fadeUpVariant` (y: 8px → 0, 250ms)
  - [ ] 11.6 Apply action button hover: scale 1.05, elevated box-shadow, 150ms ease-out
  - [ ] 11.7 Implement "Copy to Clipboard" using `navigator.clipboard.writeText`, show 2000ms confirmation indicator
  - [ ] 11.8 Implement "Download as Markdown" using `URL.createObjectURL` + `<a>` click with `.md` filename
  - [ ] 11.9 Wire "New Research" to `resetToIdle`
  - [ ] 11.10 Write unit test `ResultViewer.test.tsx` — action bar buttons, clipboard copy, download trigger
  - [ ] 11.11 Write PBT `ResultViewer.pbt.test.tsx` — Property 6: any markdown string renders correct HTML elements

- [ ] 12. Error Panel (Error State)
  - [ ] 12.1 Create `src/components/ErrorPanel.tsx` with error message display and "Try Again" button
  - [ ] 12.2 "Try Again" resets `uiState` to `idle` and pre-fills `currentQuery` in QueryInput
  - [ ] 12.3 Apply mount animation: `fadeUpVariant` (y: 10px → 0, 300ms ease-out)
  - [ ] 12.4 Write unit test `ErrorPanel.test.tsx` — error message display, Try Again button presence
  - [ ] 12.5 Write PBT `ErrorPanel.pbt.test.tsx` — Property 7: any previous query is restored on Try Again

- [ ] 13. Routing and App Entry
  - [ ] 13.1 Create `src/App.tsx` wrapping providers (AuthContext, ThemeContext) and Router with `/auth` and `/` routes
  - [ ] 13.2 Implement route guards: redirect unauthenticated users to `/auth`, redirect authenticated users away from `/auth`
  - [ ] 13.3 Write unit test `Dashboard.pbt.test.tsx` — Property 3: New Research from any UI_State resets to idle

- [ ] 14. Design System Polish
  - [ ] 14.1 Verify all card/panel surfaces use `rounded-2xl`, `border-gray-200 dark:border-gray-700`, and soft box-shadow
  - [ ] 14.2 Verify Log_Panel uses monospace font class and all other UI text uses sans-serif
  - [ ] 14.3 Verify all animation durations are within 150ms–300ms range and no spring/bounce easing is used
  - [ ] 14.4 Verify dark mode variants are applied consistently across all components
