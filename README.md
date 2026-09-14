# Day Log

A fast, local, keyboard-first daily task app. Built for capturing tasks during meetings: open the app, type, press Enter, keep typing.

## Run it

```bash
npm install
npm run dev        # development, http://localhost:3001
```

or for everyday use:

```bash
npm run build
npm run start       # http://localhost:3001
```

All data lives in a single SQLite file at `data/tasks.db` — back that file up and you've backed up everything. It's excluded from git via `.gitignore` since it's your personal data.

## How it works

- **Today's log** is created automatically with the current date the first time you open the app each day. Recurring tasks (weekday standups etc.) are seeded into it.
- **Carry-over**: if the previous day left unfinished tasks, a banner offers to move them into today. Carried tasks keep their order, land at the top, and are marked with `»`.
- **Containers**: day logs plus three fixed collections — Work, Personal, Backlog. Move tasks between them from the row menu. Past days with unfinished tasks stay on the dashboard as "Open days"; fully finished days drop into the collapsed Archive.
- **Notes**: click a task (or press `Enter`/`e` on a focused row) to open a rich-text editor — bold, italic, bullet and numbered lists. Notes save automatically.
- **Copy as text**: copies a day or list as `✓` / `○` plain text for pasting into chat or meeting notes.
- **History**: the heatmap shows the last 17 weeks — green days fully done, amber days with leftovers. Cells link to that day's log.

## Keyboard

| Key | Action |
|---|---|
| `Enter` in the entry field | Add task, keep typing (pasting multi-line text adds one task per line) |
| `/` | Focus the entry field |
| `⌘K` / `Ctrl+K` | Command palette — search everything, jump to any list, or add straight to Today |
| `↑` `↓` on a task row | Move focus between tasks |
| `Space` or `x` | Toggle done |
| `Enter` or `e` | Open notes editor (`Esc` closes) |
| `Alt+↑` / `Alt+↓` | Reorder task |
| `Delete` / `Backspace` | Delete task |

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS 4 · SQLite via better-sqlite3 · Tiptap editor · dnd-kit drag & drop

## Running as a standalone app (Chrome)

The app ships a web manifest (`app/manifest.ts`), so Chrome can install it as a windowed app with its own icon and no browser chrome — tabs, address bar, etc. are hidden.

**Option A — Install via Chrome's menu**

1. Start the server (`npm run start`) and open `http://localhost:3001` in Chrome.
2. Click the install icon at the right of the address bar (or Chrome menu → **Cast, save and share** → **Install Day Log…**).
3. Chrome creates an app shortcut in Launchpad / Applications that opens in its own window.

**Option B — Manual app-mode shortcut**

If you'd rather not use Chrome's install prompt, you can launch it in app mode directly:

```bash
open -na "Google Chrome" --args --app="http://localhost:3001" --user-data-dir="$HOME/Library/Application Support/Google/Chrome/DayLogApp"
```

Wrap that in a shell script or an Automator app / `.command` file and drop it in the Dock for a one-click launch. Using a separate `--user-data-dir` keeps it isolated from your regular Chrome profile.

## Auto-starting the server at login (macOS LaunchAgent)

To have the server running automatically whenever you log in (so the app is just there when you open it), register a `launchd` agent.

1. Build once so `npm run start` has something to serve, and note the full path to `npm` — `launchd` doesn't read your shell profile, so it needs an absolute path (this matters especially if you manage Node with `nvm`, `fnm`, etc., since there's no version manager shim to resolve):

   ```bash
   cd /path/to/day-log
   npm install
   npm run build
   which npm     # e.g. /Users/you/.nvm/versions/node/v22.14.0/bin/npm — copy this
   ```

2. Create `~/Library/LaunchAgents/com.yourname.daylog.plist`, filling in the paths from step 1 (`WorkingDirectory` is the repo path; both `npm` entries under `ProgramArguments`/`PATH` use the directory holding the `npm` binary from `which npm`):

   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
   <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
     "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
   <plist version="1.0">
   <dict>
     <key>Label</key>
     <string>com.yourname.daylog</string>

     <key>ProgramArguments</key>
     <array>
       <string>/path/to/npm/bin/npm</string>
       <string>run</string>
       <string>start</string>
     </array>

     <key>WorkingDirectory</key>
     <string>/path/to/day-log</string>

     <key>EnvironmentVariables</key>
     <dict>
       <key>PATH</key>
       <string>/path/to/npm/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
     </dict>

     <key>RunAtLoad</key>
     <true/>
     <key>KeepAlive</key>
     <true/>

     <key>StandardOutPath</key>
     <string>/tmp/daylog.out.log</string>
     <key>StandardErrorPath</key>
     <string>/tmp/daylog.err.log</string>
   </dict>
   </plist>
   ```

   > If you use a Node version manager, revisit this file whenever you upgrade Node — the pinned path will stop resolving otherwise.

3. Load it:

   ```bash
   launchctl load ~/Library/LaunchAgents/com.yourname.daylog.plist
   ```

   The server now starts at every login and `launchd` restarts it if it crashes (`KeepAlive`). Check `/tmp/daylog.out.log` / `daylog.err.log` if it doesn't come up.

4. Useful commands:

   ```bash
   launchctl unload ~/Library/LaunchAgents/com.yourname.daylog.plist   # stop + disable
   launchctl load ~/Library/LaunchAgents/com.yourname.daylog.plist     # re-enable
   launchctl list | grep daylog                                        # check it's running
   ```

Combine this with the Chrome app-mode shortcut above (Option B, in your Login Items, or just pinned to the Dock) and Day Log behaves like a native app that's always running in the background.
