# replit.md

## Overview
Postyn (formerly Tfess) is an anonymous social platform for sharing personal stories and gossip across various life categories, including a unique "Am I in the Wrong?" feature for community voting. It emphasizes anonymous interaction through reaction systems and community-driven content moderation, aiming to provide a space for candid sharing and engagement. The platform's vision includes fostering a vibrant community around shared experiences and opinions.

## Recent Changes
- **Complete Rebrand from Tfess to Postyn** (Aug 2025): Successfully completed comprehensive rebrand across entire codebase, including:
  - Updated all user-facing text and branding elements (HTML titles, welcome messages, headers)
  - Renamed localStorage keys from "tfess_*" to "postyn_*" (anon_id, user_data, device_fp, etc.)
  - Updated biometric storage prefixes and VAPID email configuration
  - Changed logo variable names from "tfessLogo" to "postynLogo"
  - Updated fingerprinting text and service comments
  - Maintained backward compatibility with legacy key cleanup

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
The system relies on session-based anonymous user tracking using Express session middleware with device fingerprint-based user identity synchronization. Users remain anonymous while maintaining consistent identity across devices through secure device fingerprint matching. This ensures the same username, avatar, and profile persist when accessing the app from different devices, providing seamless cross-device experience without requiring login credentials.

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
- **Smart Anti-Spam System**: Updated spam prevention allowing 4 posts before triggering a 5-minute cooldown (previously 10 posts per 15 minutes). System tracks posts across all pages per user session, provides friendly messaging when limits are reached, and includes comprehensive spam detection for content similarity, keyword patterns, and link spam. Features whitelisting for high-engagement users and escalating warnings for repeat violations.
- **"Other" Category Submission Effect**: Unique visual and audio effect exclusively for "Other" category posts featuring pencil-and-paper animation, soft scribble sound followed by gentle chime (1.5 seconds total), gray particles floating upward, and "Your thoughts shared" message. Effect triggers only upon successful submission, maintaining the calm, expressive nature of uncategorized anonymous posts.
- **Tea Experiments Integration**: Removed separate Community Results card and integrated tea experiments functionality into the main Community feed. When users create experiments through the Tea Experiments features, they now create real poll posts that appear in both Community and Your Posts feeds, ensuring proper data persistence and real-time updates.
- **Cross-Device User Identity Synchronization**: Comprehensive device fingerprint-based system that maintains consistent usernames, avatars, and profiles across all devices. When users access the app from different devices, the system automatically recognizes them through secure device fingerprinting and preserves their anonymous identity, ensuring posts, comments, and interactions display the correct username consistently. Fixed infinite loop issues in drama voting component and resolved localStorage conflicts for reliable cross-device experience.
- **Real-Time WebSocket System**: Complete WebSocket infrastructure enabling instant live updates across all user interactions. Features include real-time post reactions, comment additions, drama voting, poll/debate voting, and post view tracking. All interactions broadcast immediately to connected users without refresh, creating seamless collaborative experience. Supports poll voting with options A/B, debate voting with up/down, and comprehensive message subscription system for component-level real-time updates.
- **Username Uniqueness System**: Comprehensive database-wide username validation ensuring no duplicate usernames across the entire platform. Features intelligent username generation with variations (e.g., MaskedFox → MaskedFox23), retry mechanisms for unique generation, and real-time uniqueness checking. Applies to new user creation, device fingerprint changes, and manual username regeneration from profile page. Server-side validation with API endpoints for checking uniqueness and generating variations.
- **Enhanced Notification System**: Real-time notification badge system with WebSocket broadcasting for instant updates. Features include automatic notification creation for post interactions (comments, reactions), immediate badge count updates without page refresh, enhanced notification panel with 5-second refresh intervals, deep linking to specific posts when notifications are clicked, and comprehensive notification storage with read/unread tracking. Notifications appear instantly via WebSocket messages and update the red badge indicator immediately.
- **Smart Feed Visual Caps**: The "X new posts - tap to refresh" banner now caps the displayed count at 20 posts maximum (showing "20+" for higher counts) to maintain clean visual presentation while preserving full system functionality for loading all available posts.
- **Theme Context Labeling**: Daily content now includes "Theme" suffix in display names (e.g., "Drama Week Theme" instead of "Drama Week") to provide clearer context about the type of content users are viewing.
- **Dark Mode Default**: App now starts in dark mode by default with immediate theme application to prevent white flashes on load. Users can switch to light mode through theme settings if preferred.

## External Dependencies
- **Database**: Neon Database (@neondatabase/serverless) for PostgreSQL hosting.
- **ORM**: Drizzle ORM for type-safe database operations.
- **UI Components**: Radix UI primitives, shadcn/ui, Tailwind CSS, class-variance-authority.
- **Validation**: Zod for runtime type validation.
- **Date Handling**: date-fns for time formatting.
- **Session Store**: connect-pg-simple for PostgreSQL session storage.
- **AI Moderation**: OpenAI moderation API.