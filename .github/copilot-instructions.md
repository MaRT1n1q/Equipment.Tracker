# Electron Equipment Tracker - Copilot Instructions

## Project Overview
Desktop application for tracking equipment requests using Electron + React + Vite + TypeScript + SQLite.

## Technologies
- **Electron 33** - Desktop application framework
- **React 18** - UI library  
- **Vite 5** - Build tool and dev server
- **TypeScript 5** - Type safety
- **SQLite** (better-sqlite3) - Local database
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **Sonner** - Toast notifications
- **Lucide React** - Icons

## Project Structure
```
equipment-tracker/
├── electron/          # Electron main and preload processes
│   ├── main.ts       # Main Electron process
│   └── preload.ts    # Preload script for IPC
├── src/              # React application
│   ├── components/   # React components
│   │   ├── ui/       # shadcn/ui components
│   │   ├── AddRequestModal.tsx
│   │   ├── RequestsTable.tsx
│   │   └── ThemeToggle.tsx
│   ├── lib/          # Utilities
│   ├── types/        # TypeScript types
│   ├── App.tsx       # Main component
│   ├── main.tsx      # React entry point
│   └── index.css     # Global styles
├── index.html        # HTML template
├── package.json      # Dependencies
├── vite.config.ts    # Vite configuration
└── tailwind.config.js # Tailwind configuration
```

## Development Commands
- `npm run electron:dev` - Run app in development mode
- `npm run dev` - Run Vite dev server only
- `npm run build` - Build for production
- `npm run electron` - Run production build

## Database Schema
SQLite database is created automatically at first launch in user's app data folder.

Table: `requests`
- id (INTEGER PRIMARY KEY AUTOINCREMENT)
- employee_name (TEXT)
- equipment_name (TEXT)
- serial_number (TEXT)
- created_at (TEXT)
- is_issued (INTEGER, 0 or 1)

## Features Implemented
✅ Create requests with auto-generated ID
✅ Store employee name, equipment name, serial number, date
✅ Table view of all requests
✅ Mark equipment as issued (checkbox)
✅ Delete requests
✅ Light and dark theme toggle
✅ Toast notifications
✅ Fully offline (no internet required)
✅ Modern Windows 11 Fluent Design style

## Progress Tracking
- [x] Create copilot-instructions.md file
- [x] Get project setup information
- [x] Create project structure
- [x] Configure project files
- [x] Set up SQLite database
- [x] Configure UI components
- [x] Create React components
- [x] Set up IPC communication
- [x] Install dependencies
- [x] Test and launch application

## Status
✅ **Project is complete and ready to use!**

The application successfully runs in development mode and is ready for building and distribution.
