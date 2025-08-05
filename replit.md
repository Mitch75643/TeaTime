# replit.md

## Overview
Tfess is an anonymous social platform for sharing personal stories and gossip across various life categories, including a unique "Am I in the Wrong?" feature for community voting. It emphasizes anonymous interaction through reaction systems and community-driven content moderation, aiming to provide a space for candid sharing and engagement. The platform's vision includes fostering a vibrant community around shared experiences and opinions.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
### Frontend
The client is built with React 18, TypeScript, and Vite, utilizing a component-based architecture. It employs Radix UI primitives with shadcn/ui styling, Tailwind CSS for theming, TanStack Query for server state management, Wouter for routing, and React Hook Form with Zod for form handling. The design is mobile-first and responsive, incorporating optimistic UI patterns for real-time feeling updates.

### Backend
The server uses Express.js with TypeScript, following a RESTful API design. It manages anonymous user sessions without traditional authentication, handling posts, comments, reactions, and drama voting. tsx and esbuild are used for development and production bundling, respectively.

### Data Storage
A dual storage approach is used: PostgreSQL with Drizzle ORM for production persistence (via Neon Database) and an in-memory implementation for development. Drizzle Kit manages database migrations and schemas.

### Authentication and Authorization
The system relies on session-based anonymous user tracking using Express session middleware. Users remain anonymous, with unique session IDs for tracking interactions and maintaining consistency without requiring login credentials.

### Key Features and Design Decisions
The architecture prioritizes anonymous user interaction, real-time-feeling updates through optimistic UI patterns, and a mobile-first responsive design. Content is categorized and filtered with built-in moderation utilities, and a unique drama voting system encourages community engagement. Features include:
- **Avatar Customization System**: Allows users to select from custom SVG avatars across multiple categories (Masked, Emotions, Characters, Animals, Abstract) for identity expression while maintaining anonymity. Avatars persist using localStorage and are displayed consistently across the application with enhanced caching to prevent visual flashing.
- **Random Fun Username System**: Automatically generates gossip-themed usernames, which can be selected and persist across sessions, replacing "Anonymous User" in interactions.
- **Community Topic Enhancements**: Provides specialized components and interactive elements for various community topics like "Celebrity Tea," "Story Time," "Hot Topics," "Daily Debate," and "Tea Experiments," each with unique animations and styling.
- **Home Page UI/UX**: Enhanced modal UX, branding, mobile responsiveness, and category filtering with visual active states.
- **AI Moderation & Mental Health Safety**: Integrates OpenAI moderation API for real-time content scanning with a severity-based flagging system. It includes UI components for displaying mental health resources and crisis intervention information, prioritizing user anonymity.
- **Automated Content Rotation System**: A comprehensive in-memory system for automatically rotating daily prompts, weekly themes, trending feeds, and leaderboards without manual intervention. It includes configurable rotation intervals, multi-type content support, dynamic leaderboard generation based on engagement metrics, and a privacy-preserving scoring algorithm.
- **Push Notification System**: Complete web-push integration that automatically sends notifications when Daily Prompts and Daily Debates rotate every 24 hours. Features centralized Settings page control with user-friendly toggle, VAPID key security, service worker implementation, and maintains complete user anonymity by tying notifications only to anonymous sessions.
- **Daily Prompt Streak Tracking**: Comprehensive streak tracking system that monitors consecutive daily prompt submissions within time windows (12:00 AM to 11:59 PM). Features include proper database schema (userDailyStreaks, dailyPromptSubmissions), backend storage methods, API endpoints, frontend hook integration, and automatic streak calculation with validation. Shows appropriate messages when streaks break ("😲 You missed a day. Your streak has reset.") and celebrates achievements.

## External Dependencies
- **Database**: Neon Database (@neondatabase/serverless) for PostgreSQL hosting.
- **ORM**: Drizzle ORM for type-safe database operations.
- **UI Components**: Radix UI primitives, shadcn/ui, Tailwind CSS, class-variance-authority.
- **Validation**: Zod for runtime type validation.
- **Date Handling**: date-fns for time formatting.
- **Session Store**: connect-pg-simple for PostgreSQL session storage.
- **AI Moderation**: OpenAI moderation API.