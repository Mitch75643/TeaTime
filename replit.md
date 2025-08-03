# replit.md

## Overview

TeaSpill is an anonymous social platform designed for sharing personal stories and gossip across different life categories. The application allows users to post anonymously about college, work, relationships, family, money, politics, and drama situations. It features a unique "Am I in the Wrong?" category where community members can vote on whether the poster was in the wrong, valid, or displaying iconic behavior. The platform emphasizes anonymous interaction through reaction systems (fire, cry, eyes, clown emojis) and community-driven content moderation.

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

## Recent Updates (January 2025)

### Avatar Customization System
- **Profile Picture Persistence**: Implemented comprehensive avatar system with 17 custom SVG avatars across 4 categories (Moods, Animals, Objects, Characters)
- **Avatar Storage**: Using localStorage with custom event system for real-time updates across all app components
- **Avatar Integration**: User-selected avatars now appear in post cards, comment sections, profile page, and top-right header navigation
- **Header Navigation**: Top-right profile icon now displays user's selected avatar and provides clickable navigation to profile page
- **Cross-Component Sync**: Created useUserAvatar hook for consistent avatar state management across all components

### Biometric Authentication System (January 2025)
- **WebAuthn Integration**: Full biometric authentication using Web Authentication API for Face ID, Touch ID, and fingerprint support
- **Privacy-First Design**: Biometric data never leaves user's device - only encrypted tokens stored locally for secure unlock
- **Cross-Device Sync**: Optional account upgrade system with passphrase or email for accessing anonymous data across devices
- **Initial Authentication Flow**: First-time users see welcome screen with choice to "Stay Anonymous" or "Enable Cross-Device Sync"
- **Authentication Options**: Users can choose biometric login, passphrase, email sync, or remain completely anonymous
- **Security Features**: Device-specific credential storage, automatic fallback to manual login, and encrypted token management
- **UI Components**: Comprehensive setup flows for sync configuration and biometric enrollment with clear privacy explanations
- **Profile Integration**: All authentication settings accessible through profile page settings tab (no separate settings page)
- **Anonymous Preservation**: All features maintain complete user anonymity with no personal data collection or tracking
- **Return User Experience**: Existing users bypass welcome screen and continue with their chosen authentication method

### Avatar Categories
- **Moods** (😊): Happy Vibes, Wink Queen, Sassy Energy, Sleepy Mood, Tea Shocked
- **Animals** (🐱): Tea Cat, Gossip Bird, Drama Frog  
- **Objects** (☕): Spilled Tea, Cool Sunglasses, Lipstick Kiss, Pizza Mood, Coffee Vibes
- **Characters** (👽): Meme Energy, Alien Tea, Robot Gossip, Unicorn Dreams

All avatars maintain user anonymity while allowing personality expression through gossip-themed, copyright-free SVG designs.

### Random Fun Username System (January 2025)
- **Auto-Generated Usernames**: Implemented comprehensive random username generator with gossip-themed names like "TiredIntern42", "SpillQueen89", "💅DramaDiva13"
- **Username Categories**: Drama, Chill, Funny, Mysterious, Emotional themes with personality-based combinations
- **Format Variations**: Emoji-style (e.g. 💅DramaDiva13), Combined words + numbers (e.g. TeaSpiller99), Personality-based (e.g. PettyPrince, ChaoticNeutral)
- **Username Persistence**: Uses localStorage with custom event system for real-time updates across all app components
- **Username Selection**: Users can generate new usernames anytime through profile settings with interactive username selector
- **Keep This Fix**: Fixed "Keep This" functionality to properly save selected usernames without generating new ones
- **Global Integration**: User usernames appear on posts, comments, profile page, and all user interactions, replacing "Anonymous User"
- **Session Sync**: Username system integrates with session management to show user's current username for their own content while preserving stored usernames for others

### Community Topic Features Enhancement (January 2025)
- **Celebrity Tea Features**: Top celebs trending list with drama meters, "Spill This" buttons, and red carpet icons flair
- **Story Time Features**: Category filters (Horror, Funny, Cringe, Sad, Feel-Good), random story prompts, and story type labels (Real, Fake, Undisclosed)
- **Hot Topics Features**: Trending hashtags with vote counts, weekly leaderboard of most-reacted discussions, and topic idea submission system
- **Daily Debate Features**: Big debate card with live voting, visual results with progress bars, and future debate prompt suggestions
- **Tea Experiments Features**: Lab-themed polling system with visual results, progress bars, and "This blew my mind" badges for close votes
- **Just for Fun Features**: Category selector (Meme, Rant, Confession, Question), preloaded GIF picker, meme templates, and punchline-style cards
- **Suggestions Features**: Bug reports, feature requests, and general ideas with upvote/downvote system, status badges (Planned, In Review, Completed), and admin feedback visibility
- **Interactive Elements**: Each topic now has unique specialized components with topic-specific icons, animations, and themed styling that align with TeaSpill's gossip culture

### Community Topic Celebration Animations (January 2025)
- **Celebrity Tea**: Paparazzi camera flash with sparkles and gentle camera click + excited murmur sounds
- **Story Time**: Glowing open book with magical sparkles rising out, plus soft page-turn and twinkle sounds  
- **Hot Topics**: Flickering flame emoji with fire trail effects and soft fire crackle/sizzle sounds
- **Daily Debate**: Animated thought bubbles and question marks with soft "hmm" thinking sounds
- **Tea Experiments**: Chemistry-themed bubbling beaker animation with playful fizz-pop sounds (triggers on "Launch Experiment")
- **Feedback & Suggestions**: Pulsing lightbulb with spark animations and calm "ding" realization sounds
- **Smart Animation System**: Each animation plays for 1-2 seconds after successful post submission, all sounds are gentle and natural (under 1 second), works perfectly on mobile and desktop, matches TeaSpill's fun expressive vibe
- **Enhanced Daily Spill**: Prominent yellow-highlighted prompt display with clear user guidance above text area

### Home Page Category Animations (January 2025)
- **School (🏫)**: Floating pencils/graduation caps with chalk dust effect + soft page flip sound
- **Work (💼)**: Flying briefcase with paper documents + keyboard typing + email swoosh sounds
- **Relationships (❤️)**: Floating hearts with central pulse + calm heartbeat sounds
- **Family (👨‍👩‍👧‍👦)**: Cozy home with warm glow and sparkles + gentle lullaby chord
- **Money (💸)**: Flying dollar signs with gold sparkles + soft coin jingle + gentle cha-ching
- **Hot Takes (🔥)**: Flame effects with sparks and fire emojis + controlled flame burst sound
- **Am I in the Wrong? (🤔)**: Question marks with scales of justice + light suspense swell
- **Category-Specific System**: Each home page category has unique themed animation triggered after successful post submission, ~1.5 seconds duration, mobile-optimized, expandable for future categories

### Weekly Theme Animations for Daily Spill (January 2025)
- **Love Week**: Red/pink hearts floating upward + soft romantic chime/gentle heart "bloop"
- **Pet Peeves Week**: Angry face emojis/scribbles + quiet grumble/eye-roll sound
- **Cringe/Funny Week**: "😂" emojis/comic "LOL" bubbles + playful giggle/light cartoon boing
- **Secrets Week**: Whisper bubbles/shushing face + whisper "shhh"/light wind noise
- **Embarrassing Moments Week**: Blush emojis/sweat drops + soft gasp/light "oops" chime
- **Drama Week**: Floating drama masks 🎭/explosive text bubbles + soft dramatic sting/rising suspense tone
- **Self-Care Week**: Calm sparkles/glowing wellness icons + soft spa-like chime/gentle breath sound
- **Theme Configuration System**: THEME_CONFIG object stores visual colors and sound mappings for easy future theme updates, expandable system with default fallback animation for unknown themes, 1.5-2 second duration animations triggered by current week's theme after Daily Spill post submission

### Home Page UI Polish (January 2025)
- **Enhanced Modal UX**: Added prominent close button with circular background and hover effects for better mobile accessibility
- **Page Branding**: Implemented gradient "Spill the Tea" header with tagline to establish page identity and brand personality
- **Mobile Responsiveness**: Complete layout optimization with proper text wrapping, modal sizing, and touch-friendly interactions
- **Category Filtering**: Fully functional category filtering system with visual active states and clear filter indicators
- **Layout Consistency**: Standardized spacing, padding, and responsive breakpoints across all components
- **Filter UX**: Added filter indicator with clear button and category-specific empty state messages