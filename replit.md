# Transportation Registry System

## Overview

This is a logistics management system designed for Kazakhstan, built as a full-stack web application. The system manages transportation requests with a role-based workflow that includes five different user roles: Прораб (Foreman), Логист (Logistician), Руководитель СМТ (SMT Manager), Финансовый директор (Financial Director), and Генеральный директор (General Director). The application facilitates the creation, approval, and tracking of transportation requests through a multi-stage approval process.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **Forms**: React Hook Form with Zod validation
- **Charts**: Chart.js for data visualization
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Authentication**: Replit Auth with OpenID Connect integration
- **Session Management**: Express sessions with PostgreSQL storage
- **API Design**: RESTful API with role-based access control

### Database Architecture
- **Database**: PostgreSQL (configured for Neon Database)
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Connection**: Neon serverless PostgreSQL with WebSocket support

## Key Components

### Authentication System
- Replit Auth integration with OpenID Connect
- Session-based authentication using PostgreSQL session store
- Role-based access control with five distinct user roles
- Automatic user creation and profile management

### Transportation Request Management
- Multi-stage approval workflow based on user roles
- Request creation, editing, and status tracking
- Comments system for request collaboration
- Automatic request numbering and categorization

### Dashboard and Analytics
- Real-time statistics and metrics
- Monthly transportation trends
- Status distribution charts
- Recent requests overview

### Internationalization
- Multi-language support (Russian, Kazakh, English)
- Localized city names, cargo types, and transport options
- Role-based UI text translation

## Data Flow

1. **Request Creation**: Прораб creates transportation requests with basic cargo information
2. **Logistics Review**: Логист reviews and adds logistics details (transport type, carrier, scheduling)
3. **Management Approval**: Руководитель СМТ reviews and approves/rejects requests
4. **Financial Review**: Финансовый директор adds cost information and final approval
5. **Executive Oversight**: Генеральный директор has full system access and override capabilities

### Role-Based Permissions
- **Прораб**: Create and edit own requests in "created" status
- **Логист**: Process requests in "created" status, move to "logistics"
- **Руководитель СМТ**: Review "logistics" status requests, approve/reject
- **Финансовый директор**: Handle "manager" approved requests, add financial data
- **Генеральный директор**: Full access to all requests and system functions

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL connection
- **drizzle-orm**: Type-safe ORM for database operations
- **@radix-ui/**: Complete UI component primitives
- **@tanstack/react-query**: Server state management
- **express-session**: Session management middleware
- **connect-pg-simple**: PostgreSQL session store

### Development Tools
- **Vite**: Frontend build tool and development server
- **TypeScript**: Type safety across the entire stack
- **Tailwind CSS**: Utility-first CSS framework
- **ESBuild**: Fast JavaScript bundler for production

### Authentication
- **openid-client**: OpenID Connect client implementation
- **passport**: Authentication middleware framework
- **memoizee**: Function memoization for performance

## Deployment Strategy

### Environment Configuration
- **Development**: Local development with Vite dev server and TypeScript compilation
- **Production**: Optimized builds with Vite for frontend and ESBuild for backend
- **Database**: Neon PostgreSQL with automatic scaling
- **Session Storage**: PostgreSQL-backed session management

### Build Process
1. Frontend assets compiled with Vite to `dist/public`
2. Backend TypeScript compiled with ESBuild to `dist/index.js`
3. Static assets served from Express in production
4. Database migrations handled via Drizzle Kit

### Replit Integration
- Configured for Replit deployment with autoscale
- Environment variables for database and session configuration
- Integrated development workflow with live reloading
- Port configuration for external access

## Changelog

Changelog:
- June 27, 2025. Initial setup - Created multi-role transportation registry system
- June 27, 2025. User role updated to генеральный директор for full system access
- January 3, 2025. Added logistics management tools:
  - Carrier Management: Database of transport companies with ratings and contact info
  - Route Optimization: Route planning and optimization tools
  - Cost Calculator: Transportation cost calculation with detailed breakdown
  - Tracking System: Real-time shipment tracking and monitoring
- January 3, 2025. Migration from Replit Agent to Replit environment completed
- January 3, 2025. Added Super Admin functionality:
  - Super Admin role (супер_админ) with complete system access
  - Comprehensive admin panel for managing users, requests, carriers, routes, and system data
  - Role-based navigation hiding super admin features from regular users
  - Full CRUD operations for all system entities

## User Preferences

Preferred communication style: Simple, everyday language.