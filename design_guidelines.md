# Turkish Video Watch Party Social App - Design Guidelines

## Design Approach
**Reference-Based:** Drawing inspiration from Netflix (media consumption), Discord (community), and Instagram (social interaction). This creates a premium social viewing experience that balances content discovery with community engagement.

## Typography System
- **Primary Font:** Inter or DM Sans (modern, clean, excellent at small sizes)
- **Accent Font:** Manrope or Plus Jakarta Sans (for headers, bold statements)
- **Hierarchy:**
  - Hero Titles: 4xl-6xl, font-bold
  - Section Headers: 2xl-3xl, font-semibold
  - Card Titles: lg-xl, font-medium
  - Body Text: base, font-normal
  - Metadata/Timestamps: sm-xs, font-medium

## Layout System
**Spacing Primitives:** Use Tailwind units of 2, 4, 6, 8, 12, 16, 20, 24
- Standard section padding: py-16 to py-24
- Card internal padding: p-6
- Component gaps: gap-4 to gap-8
- Container: max-w-7xl with px-6

## Core Components

### Navigation
**Top Bar:** Sticky header with blur backdrop effect
- Logo left, search bar center (expandable), user avatar + notifications right
- Height: h-16
- Subtle bottom border separator

### Hero Section
**Featured Watch Party Banner:**
- Full-width, height 60vh-70vh
- Gradient overlay from transparent to base background (for text readability)
- Large preview image/video thumbnail background
- Content positioned bottom-left with p-12
- Title (text-4xl font-bold), host info, participant count with avatars, "Join Party" CTA with blurred background
- Countdown timer if party scheduled

### Video Cards
**Primary Card Style:**
- Aspect ratio 16:9 for thumbnails
- Rounded corners (rounded-xl)
- Hover: subtle lift transform and glow effect
- Overlay gradient on thumbnail
- Bottom overlay contains: title, host avatar, live indicator, viewer count
- Card padding: p-0 (image full-bleed with overlay content)

**Watch Party Card Variant:**
- Additional elements: participant avatars (max 4 visible + count), scheduled time badge
- "LIVE" indicator with subtle pulse animation for active parties

### Community Features
**User Presence Indicators:**
- Avatar rings showing online status
- Small badges for party hosts
- Participant lists with compact avatars (w-8 h-8)

**Activity Feed Cards:**
- Timeline layout with avatar-left, content-right
- Compact spacing (gap-3)
- Interaction buttons subtle, only visible on hover

### Room/Party Interface
**Split Layout:**
- Video player: 70% width on desktop, full width mobile
- Chat sidebar: 30% width, sticky, scrollable
- Chat messages: compact bubbles with avatars, timestamps
- Reaction system: floating emoji animations

## Grid Systems
- **Video Grid:** grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
- **Featured Parties:** grid-cols-1 lg:grid-cols-2 (larger cards)
- **Activity Feed:** Single column, max-w-2xl centered
- All grids use gap-6

## Sections Architecture

### Home Page:
1. **Hero:** Featured watch party with large visual
2. **Live Now:** Horizontal scrollable carousel of active parties
3. **Trending:** 2-column grid of popular upcoming parties
4. **Following:** Cards from followed users/communities
5. **Categories:** Icon-based navigation tiles (Turkish TV, Movies, Sports, etc.)
6. **Community Highlights:** Featured user-generated moments

### Discover Page:
- Category filters (pill-style buttons)
- Masonry-style grid for varied content
- "Create Party" floating action button (bottom-right)

## Images
**Hero Section:** Large, cinematic image showing a popular Turkish show/movie scene with multiple viewers enjoying together (convey community). Dimensions: 1920x1080, optimized for web.

**Video Thumbnails:** Throughout all card grids - high-quality show/movie posters and user-uploaded party previews. All 16:9 ratio.

**Category Icons:** Use Material Icons for categories (tv, sports_esports, movie, etc.)

**Profile Avatars:** Circular, consistent sizing (w-10 h-10 standard, w-8 h-8 compact, w-16 h-16 prominent)

## Animation Principles
**Subtle and Purposeful:**
- Card hover: translateY(-4px) with 200ms ease
- Live indicators: gentle pulse (scale 1 to 1.1, 2s infinite)
- Page transitions: fade-in content 300ms
- Chat messages: slide-up entry
- No auto-playing carousels or distracting movements

## Interactive Elements
**Buttons on Images:**
- Backdrop blur (backdrop-blur-md)
- Semi-transparent background
- Clear, high-contrast text
- Adequate padding (px-6 py-3)

**CTAs:**
- Primary: Large, prominent (Join Party, Create Room)
- Secondary: Ghost style with borders
- Tertiary: Text-only links

## Accessibility
- All interactive elements min touch target 44x44px
- Focus states with visible rings
- Proper heading hierarchy throughout
- Alt text for all media
- ARIA labels for icon-only buttons
- Keyboard navigation for all features

## Special Features
**Turkish Localization:** Right-to-left compatible layouts, Turkish character support in all fonts, local time formats

**Social Proof:** Visible participant counts, reaction counts, trending indicators throughout interface

This design creates an immersive, community-focused viewing platform that feels premium and modern while celebrating shared Turkish entertainment experiences.