# Mission Control (MC) Dashboard

Mission Control is my custom UI for easier looking at files and data that I like to view to learn and investigate. It runs on the OpenClaw computer, and the port can be accessed from across the network.

It was vibe-coded with 🦾Darvis in a single day while I watched TV, which was an amazing experience! Whenever I think of another "Tool" to add to the left pane, I prompt and he builds. It aggregates data from Google Sheets (Tasks), Google Calendar, local session logs (Sessions), and workspace documentation.

## Tech Stack

- **[Next.js](https://nextjs.org/docs)** (App Router): The core framework providing server-side rendering and client-side interactivity.
- **[React](https://react.dev/)**: Used for building the UI components.
- **[Tailwind CSS](https://tailwindcss.com/docs)**: Used for styling (Linear-inspired dark mode theme).
- **[Lucide React](https://lucide.dev/guide/packages/lucide-react)**: Icon library for the sidebar and UI elements.
- **[TypeScript](https://www.typescriptlang.org/docs/)**: Ensures type safety across the project.

## 🏗️ Layout Structure

The application follows a three-column layout pattern:

1.  **Global Sidebar (Left):** Manages the `activeTab` state, allowing the user to switch between different tools (Docs, Memory, Jobs, etc.). It also displays global system health and OpenClaw status.
2.  **Tool List (Middle):** Dynamically renders the "Left" component of the active tool. This column usually contains a filterable list or a navigation tree.
3.  **Detail View (Right):** Dynamically renders the "Right" component of the active tool. This is where file content, logs, or detailed data objects are displayed.

## 🧩 Modularization & Component Reuse

To improve maintainability and prevent single points of failure, the tools have been extracted from the once-monolithic `page.tsx` into `app/components/tools/`.

### Reusable Components

We maximize code efficiency by reusing specialized components across multiple tools:

*   **`FileViewerRight` (`app/components/tools/FileViewer.tsx`):**
    *   This is the primary component for viewing and editing files.
    *   It features Markdown rendering (via `react-markdown`), syntax highlighting for code, and a "Find in File" search bar.
    *   **Shared by:** Docs, Memory, Specs, Scripts, Code, System, and Old tools.
*   **`SessionsToolLeft` (`app/components/tools/SessionsTool.tsx`):**
    *   Handles the display of session/log entries with status indicators and relative timestamps.
    *   **Shared by:** Sessions and History tools.
*   **`renderFileTree` (Core utility in `page.tsx`):**
    *   A recursive function that handles the rendering of hierarchical folder structures. It supports collapsible branches and virtual grouping (like grouping by extension in the Old tool).
    *   **Shared by:** All file-based tools.

### Individual Tool Modules

*   **`JobsTool`:** Manages cron jobs and scheduled tasks.
*   **`TasksTool`:** Interfaces with the Task Prioritization spreadsheet.
*   **`CmdTool`:** A persistent terminal emulator with "Favorites" support (persisted in `cmd_favorites.json`).
*   **`GitTool`:** Interactive Git client for staging, committing, and viewing diffs.
*   **`LogsTool`:** Direct stream of the system health JSONL logs.
*   **`SkillsTool` / `CalendarTool` / `HelpTool`:** Specialized modules for agent capabilities, scheduling, and documentation.

## 🛠️ Development & Safety

*   **State Management:** Global UI state (selection, navigation, search) is maintained in `app/page.tsx` and passed to tool components via props.
*   **Error Isolation:** By moving implementation details into separate files, a syntax error in one tool's UI code will only prevent that specific component from rendering, rather than crashing the entire Mission Control dashboard.

## File Map (Where to Edit)

### Frontend (The UI Shell)
- **`app/page.tsx`**: The "Shell" of the app. It contains the sidebar layout, the tab logic, and the global state management.
- **`app/components/tools/`**: Contains the individual implementation for every tool (Tasks, Sessions, Git, etc.).
- **`app/globals.css`**: Global styles and Tailwind directives.

### Backend (The Data Handlers)
The app uses **Next.js Route Handlers** to talk to the machine. These are located in `app/api/`:
- **`app/api/tasks/route.ts`**: Fetches the Google Sheets "TODO" list using the `gog` CLI.
- **`app/api/jobs/route.ts`**: Lists OpenClaw jobs and execution metadata.
- **`app/api/sessions/route.ts`**: Lists OpenClaw sessions.
- **`app/api/files/route.ts`**: Scans the workspace directory to build file trees.

## How to Launch

Mission Control runs on port **3000** by default. You can launch it using the helper script in the root directory:

1. **Launch from the root:**
   ```bash
   cd ~/.openclaw
   ./mc.sh
   ```

2. **Manual Start (Advanced):**
   ```bash
   cd ~/.openclaw/tools/mc
   npm run dev
   ```
   *Note: If the port is already in use, you can clear it with: `fuser -k 3000/tcp`*

## Data Collection Features

### 🌡️ Activity Thermal Layer
Files and sessions feature real-time color-coded relative timestamps to visualize the "heatmap" of system activity.

#### Middle Column Color Logic (General Navigation):
*   **RED:** Modified < 30 mins ago.
*   **YELLOW:** Modified < 2 hours ago.
*   **GREEN:** Modified < 6 hours ago.
*   **WHITE:** Everything else from today.
*   **LIGHT GRAY:** Modified < 1 week ago.
*   **DARK GRAY:** Older than 1 week.

#### Right Column Color Logic (Session Log Detail):
*   **RED (Extra Bold/Bright):** Logged < 1 minute ago.
*   **YELLOW (Extra Bold/Bright):** Logged < 5 minutes ago.
*   **GREEN (Extra Bold/Bright):** Logged < 10 minutes ago.
*   **LIGHT GRAY (Bold):** Everything else.

### 🔍 Search & Highlighting
Integrated search in the detail view for files. It highlights instances using high-contrast yellow backgrounds and includes a result counter with automatic scrolling.

### 📜 History Tool Indicators
The History tab uses specific color-coded indicators to distinguish between different session log states:

- **BLUE Left Border + RESET Tag:** Sessions that were cleared using `/reset`.
- **RED Left Border + DELETED Tag:** Sessions that were manually removed via `/delete`.
- **YELLOW Left Border + ARCHIVE Tag:** Sessions that have been moved to the historical archive.

#### Session Type Icons
- **Pulsing Dot (Green/Yellow):** Indicates the main, interactive user session. Green means active in the last hour, yellow means older.
- **Clock Icon:** Represents a session initiated by a cron job (an automated, scheduled task).
- **MessagesSquare Icon:** A general-purpose icon for all other session types, such as sub-agents or other system processes.

### 📜 Sessions & History Viewer
The `SessionsToolRight` component provides an advanced interface for inspecting Large Language Model (LLM) interaction logs and session history.

#### ⚡ Header-Integrated Controls
- **Row 1 (Metadata):** Shows the session label/ID, real-time "stale" indicator (if new activity is detected), file size, and the last update timestamp.
- **Row 2 (Active Controls):** Houses the search input and the visibility selection UI.

#### 🔍 Real-Time Search & Filtering
- **Dynamic Filtering:** As you type in the search bar, the UI instantly filters for matching log entries.
- **Match Counter:** When a search is active, a yellow "X MATCHES" indicator appears, showing how many total entries in the file contain your query.
- **Persistent Visibility:** The "Showing" limit you select (e.g., 10 or 20) remains consistent even as you search, ensuring the UI doesn't jump around unexpectedly.

#### 📂 Log Loading & Visibility
- **Full Content Loading:** Sessions now load the entire `.jsonl` file context immediately upon selection, while only rendering a subset for performance.
- **Row Selection Dropdown:** Choose exactly how many recent entries to display (10, 20, 50, 100, 500, or ALL).
- **"Load All" Shortcut:** The total entry count (e.g., `/ 25 Entries`) is interactive. Clicking it instantly expands the view to reveal the full session history and automatically scrolls to the beginning of the log (the bottom of the list).

#### 🧠 Intelligence Indicators
- **Model Highlighting:** Models using **Gemini Pro** are highlighted in **BOLD PURPLE** for easy identification within the session logs.
