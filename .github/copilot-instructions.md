# Equipment Tracker – Copilot Instructions

## Quick Facts

- Desktop app built with Electron 39 (main process in `electron/`) and React 19 + Vite 7 renderer.
- Typescript everywhere; strict mode on, moduleResolution "bundler", path alias `@ -> src`.
- UI copy is Russian; keep new strings localized similarly to existing components.
- Renderer runs in sandbox (nodeIntegration false); only communicate through the typed preload bridge.
- Data persists in SQLite (file under Electron `userData`); Knex handles schema, seeds, and queries.
- React Query powers all server state; mutations must invalidate the matching query key.

## Architecture Map

- `electron/main.ts` boots the app: singleton lock, database init, tray, auto-start, scheduler trigger.
- `electron/window.ts` manages the single BrowserWindow, window-state persistence, and CSP headers.
- `electron/ipc/*` host domain logic (requests, employee exits, backups) with Zod validation.
- `electron/database.ts` centralizes Knex setup, schema bootstrap, seeding, and backup helpers.
- `src/main.tsx` wires React Query provider and renders `App` into the Vite root.
- `src/App.tsx` swaps the three top-level views (dashboard, requests, employee exit) and modals.
- Shared UI primitives live in `src/components/ui/` (shadcn-style wrappers) and `src/index.css` defines theme tokens.
- Hooks inside `src/hooks/` encapsulate data access (`useRequests`, `useEmployeeExits`) and UX helpers.

## Electron Main Process

- Database lifecycle: `initDatabase()` runs before window creation; `closeDatabase()` called during `before-quit`.
- Windows and macOS stay resident in tray; window close hides instead of quitting—respect that behavior.
- Tray icon paths diverge between dev and packaged builds; do not hardcode new locations outside `build/`.
- Auto-start enabled via `app.setLoginItemSettings`; changes to startup should continue to call this once.
- Exit reminders use `startExitReminderScheduler`; keep the singleton alive and call `triggerCheck` after data changes.
- Auto-backup runs on shutdown by `createAutomaticBackup` (keeps last 5). Maintain this call when editing shutdown flow.
- CSP defined in `window.ts`; extend allowed sources there when loading remote assets (renderer will break otherwise).
- If you need new IPC handlers, register them before creating windows so preload calls are ready.

## Database & Migrations

- SQLite file lives at `app.getPath('userData')/equipment.db`; update helper functions if the location changes.
- Schema bootstrap happens in `ensureSchema`; add new tables/columns and indexes there for fresh installs.
- Existing schema: `requests`, `equipment_items`, `employee_exits`; ids auto-increment, timestamps stored as ISO strings.
- Keep referential integrity—foreign keys enforced via PRAGMA in the pool `afterCreate` hook.
- Seeds (`mockRequestSeeds`, `mockEmployeeExitSeeds`) provide realistic demo data; adjust cautiously to avoid bloating first run.
- Migrations live in `electron/migrations.ts`; follow the pattern in `migrateLegacyRequests` when rewriting legacy columns.
- When inserting booleans, cast to numeric 0/1 (DB uses integers) and supply ISO strings for date/time fields.
- Backup helpers (`ensureBackupsDirectory`, emergency restore) expect the schema to stay compatible; update both manual and auto paths together.

## IPC & Preload Contract

- Preload bridge (`electron/preload.ts`) exposes a single `window.electronAPI` object via contextBridge.
- Each IPC handler returns `ApiResponse` with `success`, optional `data`, `error`, and sometimes `id`; renderer assumes this shape.
- All payloads validated with Zod schemas in `src/types/ipc.ts`; add or adjust schemas before touching handlers.
- Any new preload API must be mirrored in `src/types/electron.d.ts` for renderer type safety.
- Keep handler logic pure and wrap DB mutations in Knex transactions when touching multiple tables.
- Use descriptive error messages (Russian) in catches; renderer surfaces them directly in toasts.
- For employee exit mutations, call `notifyChange()` so the scheduler can reevaluate reminders.
- CSV export (`export-employee-exits`) expects `equipment_list` as newline-separated items—update renderer before changing format.

## Renderer Patterns

- React Query query keys: `['requests']` in `useRequests`, `['employeeExits']` in `useEmployeeExits`; invalidate via helper functions only.
- Keep list screens using `SearchAndFilters` for consistent search, filter, density toggles, and quick-help UX.
- Local persistence uses `usePersistentState`; provide explicit serializers/deserializers for non-string values.
- Views rely on skeletons/spinners (`TableSkeleton`, inline loaders) before data resolves—reuse components for new lists.
- Mutations surface success/errors through `sonner` toasts; copy existing phrasing and durations.
- Requests list expects full `Request` objects including nested `equipment_items`; keep the restore flow working by returning deleted payloads.
- Employee exit list derives status states (pending/completed/overdue) and splits `equipment_list` by newline—sanitize data upstream.
- Dashboard aggregates stats from both queries and renders the calendar; when adding new fields update the derived counts.
- `App.tsx` stores current view and sidebar width in localStorage keys prefixed with `equipment-tracker:`; follow this convention for new persisted UI state.
- Sidebar toggles width via CSS variables; align new layouts with the same `--sidebar-width` adjustments.

## State & Hooks

- `useRequestFormState` centralizes request form validation, trimming, and payload shaping—extend it instead of branching in modals.
- `useKeyboardShortcut` handles global shortcuts (Ctrl+N, Ctrl+F); include new combos here to keep cleanup logic centralized.
- Debounced search comes from `useDebounce`; apply it to expensive filters to avoid UI thrash.
- When adding new TanStack Query hooks, replicate the `queryClient.invalidateQueries({ queryKey })` pattern for cache busting.
- Query client config lives in `src/main.tsx` (retry once, no window refetch); respect those defaults unless there’s a strong reason.
- Prefer optimistic UI via query invalidation plus toast messaging rather than manual local mutations.
- For clipboard or browser APIs (e.g., `navigator.clipboard` in exit table), guard failures and show `toast.error`; Electron may lack permissions on some hosts.

## UI & Styling

- Tailwind theme variables declared in `src/index.css`; update CSS variables when adding new semantic colors.
- shadcn-derived primitives (`Button`, `Dialog`, etc.) live under `src/components/ui/`; extend variants there to stay consistent.
- Global utility classes (surface cards, status pills) defined in `@layer components`; reuse rather than duplicating inline Tailwind.
- Animations referenced in components exist in `index.css` and `tailwind.config.js`; add keyframes in both spots.
- High-emphasis gradients and shadows defined as utilities (`shadow-brand`, `bg-gradient-primary`); apply them via class names instead of custom CSS.
- When introducing icons, rely on `lucide-react` to match the rest of the UI set.
- Dark mode depends on adding the `.dark` class to `html`; ensure new color choices read well in both themes.
- Keep content responsive—existing grids use Tailwind breakpoints (e.g., `md:grid-cols-2`); copy these patterns for new cards.

## Productivity Utilities

- `cn` helper merges Tailwind classes; import from `src/lib/utils.ts` instead of rolling your own.
- `TableSkeleton` provides consistent loading placeholders for tabular data—clone if a new resource needs similar shimmer.
- Quick-help tooltips in `SearchAndFilters` expect arrays of strings; always provide an `onDismiss` handler using persistent state.
- Toasts default to top-right via `<Toaster>` mounted in `App.tsx`; no need to add extra providers.
- Settings modal uses `createBackup`/`restoreBackup` IPC calls; show confirmation prompts before destructive actions.
- Confirm dialogs rely on native `window.confirm`; maintain this approach until a custom confirmation component exists.

## Build & Runbook

- Install dependencies with `npm install`; postinstall runs `electron-builder install-app-deps` for native modules.
- Renderer-only dev: `npm run dev`; full Electron dev with auto-reload: `npm run electron:dev` (Vite + wait-on + electron).
- Production bundle: `npm run build:bundle` (tsc + vite) feeds into electron-builder tasks.
- Platform builds: `npm run build:win|build:mac|build:linux`; the aggregate `npm run build` targets all three.
- CI-friendly headless build uses `npm run build:ci` (tsc --noEmit + vite build).
- Packaged artifacts land in `release/`; renderer output in `dist/`, main/preload bundle in `dist-electron/`.
- Electron Builder config lives in the build section of `package.json`; adjust artifact names or targets there, not ad hoc scripts.
- Icons pulled from `build/`; regenerate via instructions in `build/README.md` if updating artwork.
- Remember to set `GH_TOKEN` when publishing releases locally with electron-builder.

## Release & Updates

- Auto-updater (electron-updater) only runs when `app.isPackaged`; leave guard clauses intact if adding debug hooks.
- Update status messages propagate to renderer over `update-status` IPC; reuse this channel for new UI indicators.
- Release workflow increments version (see `AUTO_UPDATE.md` / `release.bat`) and pushes tags to trigger GitHub Actions.
- GitHub Actions assemble multi-platform artifacts; ensure new files are included via `build.files` or `extraResources`.
- Auto backups happen before quit; remind users in UI when restore is required (see `SettingsModal`).
- For macOS code signing/notarization tweaks, edit the `mac` stanza inside the build block of `package.json` and CI secrets.

## Quality & Linting

- ESLint flat config lives in `eslint.config.mjs`; obey React Hooks lint rules and avoid disabling unless necessary.
- Prettier runs through `npm run format`; lint-staged auto-checks staged files (eslint --fix + prettier --check).
- No automated tests yet—perform manual regression around requests CRUD, exit reminders, and backup/restore flows.
- Use TypeScript’s strictness; avoid `any` unless a schema guarantees structure (and suppress with justification).
- Before shipping, run `npm run lint` and whichever `npm run build[:target]` is relevant.
- Document notable release items alongside `CHANGELOG-MULTIPLATFORM.md` when updating pipelines.

## When Extending

- New sidebar views require updates to `App.tsx`, `Sidebar.tsx`, and the view type guard in `isAppView`.
- Add IPC channels in `electron/ipc`, expose them in `preload.ts`, and extend Zod schemas/types together.
- Ensure renderer forms send trimmed strings; reuse `useRequestFormState`/similar patterns for data hygiene.
- When adding DB columns, update `ensureSchema`, seeds (if needed), Zod record schemas, and React Query types.
- Guard long-running main-process work (e.g., exports) with async/await and informative `notifyChange` hooks.
- Keep scheduler-friendly data: `employee_exits.exit_date` should stay ISO `YYYY-MM-DD`; adjust parsers if format changes.
- Maintain the delete/undo workflow by returning the full restored payload from IPC deletions.
- For backup/restore enhancements, respect the emergency file fallback in `restore-backup` to avoid data loss.
- Update CSP when embedding remote content; otherwise renderer will load blank due to blocked scripts/styles.
- Coordinate UI copy and toasts with design tone—short, actionable, and in Russian.

## Reference Hotspots

- electron/main.ts
- electron/ipc/requests.ts
- electron/ipc/employeeExits.ts
- electron/ipc/backup.ts
- electron/notifications.ts
- src/App.tsx
- src/hooks/useRequests.ts
- src/hooks/useEmployeeExits.ts
- src/components/RequestsView.tsx
- src/components/EmployeeExitView.tsx
- src/components/SearchAndFilters.tsx
- src/components/SettingsModal.tsx
- tailwind.config.js

## Support Notes

- Application continues running even when window hidden; instruct users to quit via tray menu if needed.
- Scheduler shows reminders four times daily (09:00, 12:00, 15:00, 18:00); avoid overlapping notifications in new features.
- Backup directory stored under `userData/backups`; exposing this path in UI should use `getBackupPath` IPC if added.
- CSV exports prompt with Electron `dialog.showSaveDialog`; respect cancellation messages in renderer.
- After restoring a backup, renderer triggers `window.location.reload()`; keep this to ensure fresh DB connections.
