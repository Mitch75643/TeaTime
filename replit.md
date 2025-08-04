# replit.md

## Overview

Tfess is an anonymous social platform designed for sharing personal stories and gossip across various life categories, including college, work, relationships, family, money, politics, and drama. A core feature is the "Am I in the Wrong?" category, where the community votes on posts. The platform emphasizes anonymous interaction through reaction systems and community-driven content moderation, aiming to provide a space for expression while maintaining user privacy and fostering engagement.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client is built with React 18, TypeScript, and Vite. It features a component-based architecture utilizing Radix UI primitives with shadcn/ui styling, Tailwind CSS for theming, TanStack Query for server state management, Wouter for routing, and React Hook Form with Zod for form handling. UI/UX decisions include an orange gradient theme and a mobile-first responsive design.

### Backend Architecture
The server uses Express.js with TypeScript in a RESTful API design. It employs Express session middleware for anonymous user tracking without traditional authentication, offering endpoints for posts, comments, reactions, and drama voting.

### Data Storage Solutions
The application uses PostgreSQL with Drizzle ORM for production data persistence, hosted on Neon Database. An in-memory storage implementation is used for development. Drizzle Kit manages schema and migrations.

### Authentication and Authorization
The system implements session-based anonymous user tracking through Express session middleware, generating unique session IDs. There is no traditional authentication, but user interactions are tracked for consistency. Biometric authentication (WebAuthn) is integrated for optional cross-device data access, with a strict privacy-first design ensuring biometric data remains on the user's device.

### Feature Specifications
The platform supports an avatar customization system with 17 custom SVG avatars and a random fun username system, both persisting selections via localStorage. Community topic features include specialized components for celebrity tea, story time, hot topics, daily debates, and tea experiments, each with unique interactive elements and themed styling. Content moderation uses OpenAI's API for real-time scanning with a severity-based flagging system, and integrates mental health support components for crisis prevention. A 3-day trending reset system dynamically calculates post popularity based on reactions and comments, resetting scores periodically to ensure new content visibility. Home page UI is optimized for mobile responsiveness with enhanced modal UX and category filtering. Post submission includes category-specific, weekly theme, and community topic celebration animations.

## External Dependencies

- **Database**: Neon Database (@neondatabase/serverless) for PostgreSQL hosting
- **ORM**: Drizzle ORM for type-safe database operations
- **UI Components**: Radix UI primitives, shadcn/ui
- **Validation**: Zod
- **Date Handling**: date-fns
- **Styling**: Tailwind CSS, class-variance-authority
- **Session Store**: connect-pg-simple (for PostgreSQL session storage)
- **AI Moderation**: OpenAI moderation API