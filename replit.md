# Watch Party Video Platform - Project Overview

## Project Description
A Turkish social video streaming platform where users can create "rooms" to watch YouTube videos together in real-time. Features include:
- Synchronized video playback across multiple users
- Real-time chat in watch party rooms
- Room creation and discovery
- Replit Auth integration
- WebSocket-based real-time communication

## Project Structure

### Frontend (`/client/src`)
- **Pages**: Home (room discovery), Room (watch party interface)
- **Components**: 
  - Navigation bar with auth user info
  - Create room dialog
  - Room cards with previews
  - Shadcn UI component library
- **Hooks**: Auth, rooms, websocket, toast notifications
- **Lib**: Query client (TanStack Query), auth utilities
- **Styling**: Tailwind CSS with dark theme, custom glass effects

### Backend (`/server`)
- **Express API**: REST endpoints for rooms and messages
- **Routes**: Room CRUD, messaging
- **Storage**: PostgreSQL database with Drizzle ORM
- **Integrations**: Replit Auth for user authentication
- **WebSocket**: Real-time video sync and chat

### Shared (`/shared`)
- **Schema**: Drizzle ORM table definitions for rooms and messages
- **Models**: User/auth models from Replit Auth integration
- **Routes**: API endpoint definitions

## Technology Stack
- **Frontend**: React 18, TypeScript, Vite, TailwindCSS, Shadcn UI, Wouter
- **Backend**: Express, WebSockets, Drizzle ORM
- **Database**: PostgreSQL (Replit Neon)
- **Auth**: Replit Auth
- **State Management**: TanStack Query (React Query)
- **Real-time**: WebSocket for video sync

## Design System
- **Color Scheme**: Deep space dark theme (240 10% 4% background) with vibrant violet accent (265 89% 66%)
- **Typography**: Outfit (display), Inter (body)
- **Components**: Shadcn UI with custom glass effects
- **Animations**: Framer Motion for smooth transitions
- **Spacing**: Consistent Tailwind spacing system

## Development Guidelines
- Put logic in frontend, backend handles data persistence
- Use TanStack Query for all data fetching
- Follow Shadcn component patterns
- Maintain Turkish language support (date-fns with tr locale)
- Add data-testid to all interactive elements
- Use Tailwind for all styling (no inline CSS)

## Key Features Status
- [x] Authentication (Replit Auth)
- [x] Room creation and listing
- [x] Database schema (rooms, messages)
- [x] Homepage with hero and room cards
- [x] Real-time WebSocket setup
- [ ] Video player integration
- [ ] Message sending and display
- [ ] Room settings/controls
- [ ] User presence indicators

## Environment Variables
- Database connection handled by Replit
- Replit Auth configured via integration
- Frontend communicates with backend on same port

## How to Run
```bash
npm run dev
```

Starts both Express backend and Vite frontend dev servers on port 5000.

## Next Steps
1. Complete room page with video player
2. Implement real-time chat messaging
3. Add video synchronization logic
4. User profile pages
5. Room settings and customization
