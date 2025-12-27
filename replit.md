# replit.md

## Overview

This is a **School Lab Kiosk Management System** - a full-stack web application for managing computer lab usage in educational institutions. The system tracks student lab sessions, enforces time quotas, and provides administrative controls for monitoring and managing student access.

The project has two deployment targets:
1. **Web Application** - React frontend with Express backend for browser-based access
2. **Electron Kiosk App** - Standalone Windows desktop application for locked-down lab computers

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS v4 with custom theme variables
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript (ESM modules)
- **API Design**: RESTful JSON APIs under `/api/*` prefix
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Validation**: Zod with drizzle-zod integration

### Data Storage
- **Database**: PostgreSQL (configured via `DATABASE_URL` environment variable)
- **Schema Location**: `shared/schema.ts` - contains all table definitions
- **Key Tables**:
  - `students` - Student profiles with quota tracking (monthly minutes, used/extra minutes, ban/flag status)
  - `labEntries` - Session logs (student info, PC number, purpose, time range, overtime tracking)
  - `settings` - Application configuration key-value store

### Project Structure
```
├── client/           # React frontend (Vite)
│   └── src/
│       ├── components/ui/  # shadcn/ui components
│       ├── pages/          # Route components
│       ├── hooks/          # Custom React hooks
│       └── lib/            # Utilities and query client
├── server/           # Express backend
│   ├── index.ts      # Server entry point
│   ├── routes.ts     # API route definitions
│   ├── storage.ts    # Database operations
│   └── static.ts     # Static file serving
├── shared/           # Shared code between client/server
│   └── schema.ts     # Drizzle schema + Zod types
├── electron-kiosk/   # Standalone Windows kiosk app
└── migrations/       # Drizzle migration files
```

### Build System
- Development: `npm run dev` - runs Express server with Vite middleware for HMR
- Production: `npm run build` - builds client with Vite, bundles server with esbuild
- Database: `npm run db:push` - pushes schema changes to PostgreSQL

### Key Design Patterns
- **Shared Schema**: TypeScript types are derived from Drizzle schema using `drizzle-zod`, ensuring type safety between database, API, and frontend
- **API Client**: Uses a custom `apiRequest` helper with React Query for data fetching
- **Path Aliases**: `@/*` maps to client source, `@shared/*` maps to shared code

### Key Features
- **Student Autocomplete**: When entering student names in the lab entry form, the system shows suggestions from existing students. Clicking a suggestion auto-fills the student name and registration number. Uses debounced search via `/api/students/search` endpoint.

## External Dependencies

### Database
- **PostgreSQL** - Primary data store, connection via `DATABASE_URL` environment variable
- **Drizzle Kit** - Database migrations and schema management

### UI Framework
- **Radix UI** - Headless accessible component primitives (dialogs, dropdowns, forms, etc.)
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library
- **Framer Motion** - Animation library (used in ExamKiosk page)

### Development Tools
- **Vite** - Frontend build tool with HMR
- **esbuild** - Server bundling for production
- **TypeScript** - Type checking across the entire codebase

### Electron (Desktop App)
The `electron-kiosk/` folder contains a separate Electron application for Windows deployment with:
- Kiosk mode (fullscreen, locked)
- System shutdown capabilities
- Local file storage for offline operation
- Separate package.json and build process