# Requirements Document

## Introduction

A production-ready frontend for a Multi-Agent AI Research Platform, built as a premium B2B SaaS experience. The UI connects to a FastAPI/LangGraph backend that orchestrates multiple AI agents to decompose a user's research query into subqueries, gather raw data, synthesize a final report, and review/revise it. The frontend must reflect the "calm, intelligent AI thinking in real-time" philosophy: minimal visual noise, subtle motion, high readability, and a clean component-based React architecture ready for real streaming API integration.

## Glossary

- **App**: The React single-page application as a whole.
- **Auth_Page**: The authentication screen with login and signup flows.
- **Dashboard**: The main application shell containing the Sidebar and Main_Area.
- **Sidebar**: The left navigation panel containing session history and user profile.
- **Main_Area**: The central content region of the Dashboard.
- **Query_Input**: The large textarea and submit button used to enter a research query.
- **Log_Panel**: The terminal-style streaming log display shown during agent execution.
- **Result_Viewer**: The markdown-rendered final report display.
- **Session**: A single research run, identified by a user query and its resulting output.
- **AgentState**: The backend state schema: `{ user_query, subqueries, raw_data, final_output, review_decision, review_feedback, revision_count }`.
- **Streaming_Endpoint**: The FastAPI SSE or WebSocket endpoint that emits agent log lines and the final markdown result.
- **Theme**: The active color scheme, either light or dark.
- **UI_State**: One of four application states: `idle`, `loading`, `success`, `error`.

---

## Requirements

### Requirement 1: Authentication Screen

**User Story:** As a new or returning user, I want a clean authentication screen with login and signup options, so that I can securely access the platform.

#### Acceptance Criteria

1. THE Auth_Page SHALL render a split layout with a branding/illustration panel on one side and a form panel on the other.
2. THE Auth_Page SHALL display two tabs: "Login" and "Sign Up", with the Login tab active by default.
3. WHEN the user switches between tabs, THE Auth_Page SHALL transition the form content with a fade animation of 150ms–200ms duration.
4. THE Auth_Page SHALL include an email input field and a password input field on both the Login and Sign Up forms.
5. WHERE the Sign Up tab is active, THE Auth_Page SHALL additionally display a confirm-password input field.
6. THE Auth_Page SHALL include a "Continue with Google" OAuth button on both forms.
7. WHEN the user submits a form with an empty required field, THE Auth_Page SHALL display an inline validation error message beneath the relevant field without submitting the form.
8. WHEN the Auth_Page mounts, THE Auth_Page SHALL animate in with a fade and upward translate (y: 10px → 0px) over 300ms ease-out.
9. IF the authentication request returns an error, THEN THE Auth_Page SHALL display the error message in a non-blocking inline alert within the form.

---

### Requirement 2: Dashboard Layout

**User Story:** As an authenticated user, I want a persistent dashboard shell with a sidebar and main content area, so that I can navigate between research sessions and start new ones.

#### Acceptance Criteria

1. THE Dashboard SHALL render a fixed Sidebar on the left and a Main_Area occupying the remaining width.
2. THE Sidebar SHALL contain a "+ New Research" button at the top, a scrollable list of past Sessions below it, and a user profile section at the bottom.
3. WHEN the user clicks "+ New Research", THE Dashboard SHALL reset the UI_State to `idle` and clear the Main_Area to show the Query_Input.
4. WHEN the user clicks a past Session in the Sidebar, THE Dashboard SHALL load that Session's result into the Result_Viewer and set UI_State to `success`.
5. WHEN the user hovers over a Sidebar Session item, THE Sidebar SHALL apply a scale transform of 1.02 and a background transition over 150ms ease-out.
6. THE Sidebar SHALL highlight the currently active Session item with a distinct background color transition over 200ms ease-in-out.
7. THE Dashboard SHALL display a dark mode toggle button that switches the Theme between light and dark using a class-based strategy on the root element.

---

### Requirement 3: Research Query Input (Idle State)

**User Story:** As an authenticated user, I want a focused input area to enter my research query, so that I can start a new research run.

#### Acceptance Criteria

1. WHILE UI_State is `idle`, THE Main_Area SHALL display the Query_Input centered vertically and horizontally.
2. THE Query_Input SHALL contain a multi-line textarea with a minimum height of 120px and a placeholder describing the expected input.
3. THE Query_Input SHALL contain a "Start Research" submit button below the textarea.
4. WHEN the Main_Area enters the `idle` state, THE Main_Area SHALL animate in with a fade and upward translate (y: 10px → 0px) over 300ms ease-out.
5. WHEN the user hovers over the "Start Research" button, THE Query_Input SHALL apply a scale transform of 1.02 and an elevated box-shadow over 150ms ease-out.
6. WHEN the user presses the "Start Research" button, THE Query_Input SHALL apply a scale transform of 0.97 for 100ms before transitioning to the `loading` state.
7. IF the user submits the Query_Input with an empty textarea, THEN THE Query_Input SHALL display an inline validation message and SHALL NOT transition to the `loading` state.

---

### Requirement 4: Agent Streaming Log Panel (Loading State)

**User Story:** As a user who has submitted a query, I want to see a real-time terminal-style log of agent activity, so that I can follow the research process as it unfolds.

#### Acceptance Criteria

1. WHILE UI_State is `loading`, THE Main_Area SHALL display the Log_Panel in place of the Query_Input.
2. THE Log_Panel SHALL use a monospace font, a slightly darker surface color than the page background, rounded-2xl corners, and a fixed maximum height with vertical overflow scroll.
3. WHEN a new log line is emitted by the Streaming_Endpoint, THE Log_Panel SHALL append the line and animate it in with a fade and downward translate (y: 5px → 0px) over 200ms–300ms ease-out.
4. WHEN a new log line is appended, THE Log_Panel SHALL auto-scroll to the bottom of the log container.
5. THE Log_Panel SHALL display a blinking cursor character at the end of the last log line while UI_State is `loading`.
6. THE Log_Panel SHALL display a thin indeterminate progress bar at the top of the panel while UI_State is `loading`.
7. THE Log_Panel SHALL simulate streaming by revealing log lines sequentially at timed intervals when a real Streaming_Endpoint is not connected, to enable UI development and testing.
8. WHEN the Streaming_Endpoint emits the final markdown result, THE Log_Panel SHALL set UI_State to `success` and pass the markdown content to the Result_Viewer.
9. IF the Streaming_Endpoint returns an error, THEN THE Log_Panel SHALL set UI_State to `error` and display the error message within the panel.

---

### Requirement 5: Research Result Viewer (Success State)

**User Story:** As a user whose research has completed, I want to read the final report in a clean markdown view, so that I can review and act on the AI-generated output.

#### Acceptance Criteria

1. WHILE UI_State is `success`, THE Main_Area SHALL display the Result_Viewer in place of the Log_Panel.
2. WHEN transitioning from `loading` to `success`, THE Main_Area SHALL crossfade the Log_Panel out and the Result_Viewer in over 300ms ease-in-out, with the Result_Viewer scaling from 0.98 to 1.0.
3. THE Result_Viewer SHALL render the `final_output` field from AgentState as formatted markdown, including headings, paragraphs, lists, code blocks, and inline code.
4. WHEN the Result_Viewer mounts, THE Result_Viewer SHALL stagger-animate its content blocks (headings first, then paragraphs) with a fade-in over 200ms–300ms ease-out, with a 50ms delay between each block.
5. THE Result_Viewer SHALL display a floating action bar containing three buttons: "Copy to Clipboard", "Download as Markdown", and "New Research".
6. WHEN the Result_Viewer mounts, THE floating action bar SHALL animate in with a fade and upward translate (y: 8px → 0px) over 250ms ease-out.
7. WHEN the user hovers over a floating action button, THE Result_Viewer SHALL apply a scale transform of 1.05 and an elevated box-shadow over 150ms ease-out.
8. WHEN the user clicks "Copy to Clipboard", THE Result_Viewer SHALL copy the raw markdown text to the system clipboard and display a transient confirmation indicator for 2000ms.
9. WHEN the user clicks "Download as Markdown", THE Result_Viewer SHALL trigger a browser file download of the markdown content as a `.md` file.
10. WHEN the user clicks "New Research", THE Dashboard SHALL reset UI_State to `idle` and display the Query_Input.

---

### Requirement 6: Error State

**User Story:** As a user whose research run has failed, I want a clear error message with a recovery option, so that I can understand what went wrong and try again.

#### Acceptance Criteria

1. WHILE UI_State is `error`, THE Main_Area SHALL display an error message panel describing the failure.
2. THE error message panel SHALL include a "Try Again" button that resets UI_State to `idle` and displays the Query_Input with the previous query text pre-filled.
3. WHEN the error panel mounts, THE error panel SHALL animate in with a fade and upward translate (y: 10px → 0px) over 300ms ease-out.

---

### Requirement 7: Design System and Theme

**User Story:** As a user, I want a consistent, polished visual design across the entire application, so that the platform feels professional and trustworthy.

#### Acceptance Criteria

1. THE App SHALL apply a neutral grayscale palette with an indigo/blue/violet accent color as the primary interactive color.
2. THE App SHALL use rounded-2xl (16px) border radius on all card and panel surfaces.
3. THE App SHALL use subtle borders (equivalent to Tailwind's `border-gray-200` in light mode) and soft box-shadows on elevated surfaces.
4. THE App SHALL use generous whitespace with consistent spacing scale derived from Tailwind's default spacing system.
5. THE App SHALL default to light mode on first load.
6. WHEN the user activates dark mode, THE App SHALL apply a `dark` class to the root HTML element and update all surface, text, and border colors accordingly via Tailwind's dark mode variants.
7. THE App SHALL use a system or Inter-style sans-serif font for all UI text and a monospace font exclusively within the Log_Panel.
8. THE App SHALL apply all motion with duration between 150ms and 300ms, using ease-out or ease-in-out easing, with no bounce or spring effects.
9. THE App SHALL never block user interaction during any animation.

---

### Requirement 8: API Integration Readiness

**User Story:** As a developer, I want the frontend to be structured for straightforward real API integration, so that connecting the FastAPI streaming backend requires minimal refactoring.

#### Acceptance Criteria

1. THE App SHALL encapsulate all API communication in a dedicated service module or custom React hook, separate from UI components.
2. THE App SHALL define a typed interface matching the AgentState schema (`user_query`, `subqueries`, `raw_data`, `final_output`, `review_decision`, `review_feedback`, `revision_count`).
3. THE App SHALL support receiving streaming log lines via Server-Sent Events (SSE) or WebSocket from the Streaming_Endpoint.
4. THE App SHALL expose a configuration constant for the base API URL so that switching between local development and production endpoints requires a single change.
5. WHEN the Streaming_Endpoint connection is unavailable, THE App SHALL fall back to the simulated streaming mode defined in Requirement 4.7 without throwing an unhandled error.
