# Design Guidelines: Multi-Creator Content Platform

## Design Approach
**Reference-Based Strategy**: Drawing inspiration from Patreon's creator economy model, YouTube's video-first interface, and Instagram's profile aesthetics. The platform requires a sophisticated dual-interface approach that serves both creators and consumers with distinct, purpose-built experiences.

## Core Design Principles
1. **Creator Empowerment**: Dashboards and tools that make creators feel professional and in control
2. **Content Discovery**: Visual-first browsing that highlights video thumbnails and creator personalities
3. **Trust & Credibility**: Clean, polished design that instills confidence for financial transactions
4. **Role Clarity**: Distinct visual treatments for creator vs consumer interfaces

## Color Palette

### Light Mode
- **Primary Brand**: 260 70% 55% (vibrant purple - creator empowerment)
- **Secondary**: 200 85% 45% (deep cyan - trust and media)
- **Background**: 0 0% 98% (soft white)
- **Surface**: 0 0% 100% (pure white cards)
- **Text Primary**: 220 15% 15% (near black)
- **Text Secondary**: 220 10% 45% (medium gray)

### Dark Mode
- **Primary Brand**: 260 65% 60% (lighter purple for contrast)
- **Secondary**: 200 70% 50% (brighter cyan)
- **Background**: 220 15% 10% (rich dark blue-gray)
- **Surface**: 220 12% 14% (elevated dark cards)
- **Text Primary**: 0 0% 95% (near white)
- **Text Secondary**: 220 5% 65% (light gray)

## Typography
**Font Families**:
- **Primary**: Inter (headings, UI elements) - modern, professional
- **Secondary**: system-ui (body text, descriptions) - readable, performant

**Scale**:
- Hero Headlines: text-5xl md:text-6xl font-bold
- Section Titles: text-3xl md:text-4xl font-semibold
- Card Titles: text-xl font-semibold
- Body: text-base leading-relaxed
- Small Text: text-sm text-secondary

## Layout System
**Spacing Units**: Use Tailwind spacing primitives: 2, 4, 6, 8, 12, 16, 20, 24, 32
- Component padding: p-4 to p-8
- Section spacing: py-16 to py-24
- Grid gaps: gap-4 to gap-8
- Container max-width: max-w-7xl for content areas

## Component Library

### Navigation
- **Main Nav**: Sticky header with logo, search, Browse/Dashboard/Profile links, role indicator badge
- **Creator Nav**: Additional Upload/Analytics tabs with visual distinction (accent border)
- **Mobile**: Hamburger menu with full-screen overlay

### Video Cards
- **Aspect Ratio**: 16:9 thumbnail with rounded-lg overflow-hidden
- **Lock Icon**: Visible overlay on paid content (semi-transparent backdrop)
- **Hover State**: Subtle scale transform (scale-105) with shadow elevation
- **Meta Info**: Creator avatar (small circular), title, view count, duration badge

### Creator Profiles
- **Hero Section**: Large banner image (h-48 to h-64) with circular profile photo overlapping (-mt-16)
- **Stats Bar**: Horizontal layout showing subscribers, videos, earnings (for creator view)
- **Bio**: max-w-2xl prose formatting
- **Subscription CTA**: Prominent button with pricing display

### Dashboards
- **Creator Dashboard**: Grid layout with stat cards (grid-cols-1 md:grid-cols-3)
  - Total Earnings, Active Subscribers, Total Videos
  - Recent uploads table with thumbnail previews
  - Analytics chart (simple bar chart for views over time)
  
- **Consumer Dashboard**: 
  - Active subscriptions carousel
  - Continue watching section
  - Recommended creators grid

### Forms
- **Video Upload**: Drag-and-drop zone with preview, title/description fields, pricing toggle (free/paid with amount input), category selector
- **Profile Edit**: Two-column layout (left: photo uploads, right: text fields)
- **Payment Forms**: Integrated PayPal button styling within platform design

### Video Player
- **Container**: Full-width player with custom controls matching brand colors
- **Access Control**: Lock screen overlay for paid content with "Subscribe to Unlock" CTA
- **Related Videos**: Sidebar or bottom section with creator's other content

## Visual Elements

### Icons
Use Heroicons (outline style for navigation, solid for filled states)

### Images
**Hero Section** (Landing/Browse Pages): 
- Large banner showcasing diverse creator content in a mosaic grid
- Height: h-96 with gradient overlay for text readability
- Position: Top of browse page with search bar overlaid

**Creator Profile Banners**:
- Wide banner images (1500x400px optimal)
- Custom uploads per creator

**Video Thumbnails**:
- Auto-generated or creator-uploaded custom thumbnails
- Consistent 16:9 ratio across platform

**Profile Photos**:
- Circular avatars throughout (w-10 h-10 for cards, w-24 h-24 for profiles)

### Shadows & Depth
- Cards: shadow-md hover:shadow-lg transition
- Modals: shadow-2xl
- Floating elements: shadow-xl

## Page-Specific Layouts

### Landing/Public Browse
- Hero: Full-width video mosaic with centered search and tagline
- Featured Creators: 4-column grid (responsive to 2-col tablet, 1-col mobile)
- Free Content Feed: Masonry-style grid of video cards
- Footer: Creator signup CTA, links, social

### Creator Dashboard
- Top Stats Row: 3-column metric cards
- Content Management: Tabbed interface (All Videos / Published / Drafts)
- Upload Button: Floating action button (bottom-right) or prominent header CTA

### Consumer Dashboard  
- Active Subscriptions: Horizontal scrolling creator cards
- Recent Videos: Grid feed from subscribed creators
- Discover: Recommended creators section

### Video Watch Page
- Primary: Video player (max-w-4xl centered)
- Sidebar: Creator info card, related videos
- Below: Description, comments section (future)

## Interactions & Animations
**Minimal Approach**:
- Hover states: subtle scale/shadow changes
- Page transitions: simple fade
- Loading states: skeleton screens matching content layout
- Video thumbnails: gentle opacity change on hover

## Accessibility
- Maintain WCAG AA contrast ratios in both light and dark modes
- Form inputs with clear labels and focus states (ring-2 ring-primary)
- Keyboard navigation support throughout
- Alt text for all creator and video images