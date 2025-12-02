# GDASH - Renewable Energy Monitoring System

## Overview

GDASH is a full-stack web application for monitoring renewable energy generation, specifically focused on photovoltaic (solar) systems. The application collects weather data that impacts solar energy production and provides insights through an intuitive dashboard interface. It includes user management, real-time weather monitoring, data visualization, and export capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React 18 with TypeScript for type-safe component development
- Vite as the build tool and development server for fast iteration
- Wouter for lightweight client-side routing
- TanStack Query (React Query) for server state management and caching
- Tailwind CSS with shadcn/ui component library for consistent, modern UI
- Recharts for data visualization (weather charts)

**Design Decisions:**
- Component-based architecture using shadcn/ui components ensures consistency and maintainability
- React Query handles all API communication with built-in caching, eliminating manual state management complexity
- Wouter provides minimal routing overhead compared to React Router
- Custom Layout component with responsive sidebar navigation using Sheet for mobile
- Form validation using React Hook Form with Zod schema validation for type-safe forms

**Client Structure:**
- `/client/src/pages` - Route components (Dashboard, Login, Users, Explore)
- `/client/src/components` - Reusable UI components (Layout, shadcn/ui)
- `/client/src/lib` - Utility functions, API client, and query configuration
- `/client/src/hooks` - Custom React hooks (toast notifications, mobile detection)

### Backend Architecture

**Technology Stack:**
- Express.js for REST API server
- TypeScript for type safety across the stack
- Drizzle ORM with PostgreSQL (Neon serverless) for database operations
- JWT for stateless authentication
- bcrypt for password hashing

**Design Decisions:**
- RESTful API design with clear route separation in `server/routes.ts`
- Repository pattern via `storage.ts` abstraction layer for database operations
- JWT-based authentication allows stateless, scalable auth without session storage
- Middleware-based request authentication using Bearer tokens
- Separation of concerns: auth logic, database operations, business logic (insights), and data export in dedicated modules

**Server Structure:**
- `server/index.ts` - Express server setup and middleware configuration
- `server/routes.ts` - API route definitions and handlers
- `server/auth.ts` - Authentication utilities (JWT, bcrypt, middleware)
- `server/storage.ts` - Database abstraction layer with TypeScript interfaces
- `server/db.ts` - Database connection and Drizzle configuration
- `server/insights.ts` - Business logic for generating weather insights
- `server/export.ts` - CSV/XLSX data export functionality

### Database Schema

**PostgreSQL with Drizzle ORM:**
- Users table: Authentication and role-based access control (id, name, email, password, role, status, timestamps)
- Weather logs table: Time-series weather data (id, timestamp, location, temperature, humidity, wind speed, condition, precipitation)
- Insights table: Generated insights from weather analysis (id, type, title, description, severity, timestamp)

**Schema Location:** `shared/schema.ts` contains table definitions and Zod validation schemas

**Design Decisions:**
- Shared schema directory allows both client and server to use the same TypeScript types
- Drizzle provides type-safe query building with minimal runtime overhead
- Zod schemas validate API inputs and ensure type safety at runtime
- Serial IDs for simplicity; timestamps track creation and updates

### Authentication and Authorization

**JWT-based Authentication:**
- Login endpoint validates credentials and returns JWT token
- Token contains user ID, email, and role
- 7-day token expiration for reasonable security/UX balance
- Bearer token authentication via middleware on protected routes

**Design Decisions:**
- Stateless authentication allows horizontal scaling without shared session storage
- bcrypt with 10 salt rounds balances security and performance
- Role-based access control via user.role field (User, Admin)
- Password validation happens server-side only for security

### Data Collection Architecture

**Python Weather Collector Service:**
- Standalone Python service fetches weather data from Open-Meteo API (free, no API key)
- Publishes weather data to Redis queue for async processing
- Runs on configurable interval (default: 1 hour)
- Location: São Paulo, Brazil coordinates

**Node.js Worker Service:**
- TypeScript worker consumes messages from Redis queue
- Posts weather data to main API for database persistence
- Retry logic for failed API requests
- Polls Redis queue every 5 seconds

**Design Decisions:**
- Decoupled architecture: collector, queue, worker, API allows independent scaling
- Redis as message broker provides reliable async communication
- Python chosen for collector due to excellent HTTP library support
- Worker handles API failures gracefully with retry logic
- Open-Meteo API chosen as free, reliable weather data source

### Build and Deployment

**Build Process:**
- Client built with Vite to `dist/public`
- Server bundled with esbuild to `dist/index.cjs`
- Production build includes select dependencies bundled for faster cold starts
- Express serves static files from dist/public in production

**Development Setup:**
- Vite dev server with HMR for client development
- tsx for TypeScript execution without compilation during development
- Separate dev commands for client and server

**Design Decisions:**
- Single production build reduces deployment complexity
- Bundling key dependencies reduces file system calls and improves cold start times
- Static file serving from Express simplifies deployment (single process)
- Vite plugins for Replit-specific features (error overlay, cartographer, dev banner)

## External Dependencies

### Third-Party Services

**Neon PostgreSQL Database:**
- Serverless PostgreSQL database
- WebSocket-based connection using `@neondatabase/serverless`
- Connection pooling via Neon's built-in pool
- DATABASE_URL environment variable for configuration

**Open-Meteo Weather API:**
- Free weather forecast API (no authentication required)
- Provides temperature, humidity, wind speed, precipitation data
- Used by Python collector service

**Redis Message Queue:**
- Message broker between Python collector and Node.js worker
- ioredis client library for Node.js worker
- redis-py client for Python collector
- Configured via REDIS_HOST and REDIS_PORT environment variables

### NPM Dependencies

**Core Framework:**
- express, react, react-dom, vite, drizzle-orm

**Authentication:**
- jsonwebtoken, bcryptjs

**Validation:**
- zod, drizzle-zod, @hookform/resolvers

**UI Components:**
- All @radix-ui components for accessible primitives
- lucide-react for icons
- tailwindcss for styling

**Data Visualization:**
- recharts for charts

**Data Export:**
- xlsx for Excel file generation

**Development:**
- typescript, tsx, esbuild for build tooling

### Environment Variables

Required configuration:
- `DATABASE_URL` - PostgreSQL connection string (Neon)
- `JWT_SECRET` - Secret key for JWT signing (defaults to development key)
- `REDIS_HOST` - Redis server host (default: localhost)
- `REDIS_PORT` - Redis server port (default: 6379)
- `API_URL` - API endpoint for worker (default: http://localhost:5000)

### Integration Points

**Python to Redis:** Weather collector publishes JSON messages to Redis queue
**Worker to API:** Worker POSTs weather data to `/api/weather-logs` endpoint
**Client to API:** React app communicates via REST API with JWT authentication
**Database:** All services interact with PostgreSQL via connection string