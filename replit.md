# replit.md

## Overview

TeaSpill is an anonymous social platform designed for sharing personal stories and gossip across different life categories. The application allows users to post anonymously about college, work, relationships, family, money, politics, and drama situations. It features a unique "Am I the Drama?" category where community members can vote on whether the poster was in the wrong, valid, or displaying iconic behavior. The platform emphasizes anonymous interaction through reaction systems (fire, cry, eyes, clown emojis) and community-driven content moderation.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client is built with React 18 using TypeScript and Vite as the build tool. The application follows a modern component-based architecture with:

- **UI Framework**: React with TypeScript for type safety
- **Build System**: Vite for fast development and optimized production builds
- **Component Library**: Custom components built on Radix UI primitives with shadcn/ui styling
- **Styling**: Tailwind CSS with custom CSS variables for theming, including purple/pink gradient themes for the TeaSpill brand
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation resolvers

### Backend Architecture
The server uses Express.js with TypeScript in a RESTful API design:

- **Web Framework**: Express.js with TypeScript for type-safe server development
- **Session Management**: Express session middleware for tracking anonymous users without authentication
- **API Design**: RESTful endpoints for posts, comments, reactions, and drama voting
- **Development Tools**: tsx for TypeScript execution in development, esbuild for production bundling

### Data Storage Solutions
The application uses a dual storage approach:

- **Database**: PostgreSQL with Drizzle ORM for production data persistence
- **Development Storage**: In-memory storage implementation for rapid development and testing
- **Database Provider**: Neon Database (PostgreSQL-compatible serverless database)
- **Schema Management**: Drizzle Kit for migrations and schema management

### Authentication and Authorization
The system implements session-based anonymous user tracking:

- **Anonymous Sessions**: Express session middleware generates unique session IDs for users
- **No Traditional Auth**: Users remain anonymous but can be tracked across sessions for reaction/voting consistency
- **Session Storage**: Session data persists user interactions without requiring login credentials

### External Dependencies

- **Database**: Neon Database (@neondatabase/serverless) for PostgreSQL hosting
- **ORM**: Drizzle ORM for type-safe database operations
- **UI Components**: Radix UI primitives for accessible component foundations
- **Validation**: Zod for runtime type validation and schema definition
- **Date Handling**: date-fns for time formatting and manipulation
- **Styling**: Tailwind CSS with class-variance-authority for component variants
- **Session Store**: connect-pg-simple for PostgreSQL session storage
- **Development**: Replit-specific plugins for development environment integration

The architecture prioritizes anonymous user interaction, real-time-feeling updates through optimistic UI patterns, and a mobile-first responsive design. Content is categorized and filtered with built-in moderation utilities, while the drama voting system provides unique community engagement mechanics.