
# WANDR — FUNCTIONALITY BRIEF (V1 Web Platform)

## Core Scope

Build a web platform focused on discovering activities in Montreal.

Primary goal:
help users find relevant activities quickly through browsing, filtering, and AI assistance.

---

# Main Navigation

4 primary pages:

1. Home  
2. Sport  
3. Chat  
4. Profile

Global search accessible in top navbar.

---

# HOME PAGE FEATURES

## Featured Carousel

Displays top upcoming activities sorted by date and popularity.

Examples:
- sports events
- concerts
- festivals
- nightlife
- limited-time experiences

Auto-scroll slowly with manual navigation.

---

## Sticky Left Sidebar Filters

Persistent while scrolling.

Filters include:

- Price
- Distance
- Date
- Indoor / Outdoor
- Category
- Trending
- Free / Paid

Multi-select behavior preferred.

---

## Activity Discovery Feed

Grid/list of activities.

Supports:
- infinite scroll or paginated load
- sorting
- hover preview
- save to favorites
- quick open details

---

## Map Integration

Embedded live map.

Features:
- show nearby activities
- clickable pins
- pin/card synchronization
- zoom and pan
- location clustering if dense

---

# ACTIVITY CARD FEATURES

Each activity card includes:

- Cover image
- Title
- Distance
- Price
- Date
- Trend flame score
- Save button
- Location button

---

## Quick Location Action

Click location button opens mini overlay map with exact pin.

Does not open external apps.

---

# ACTIVITY DETAIL PANEL

Triggered when card clicked.

Full overlay experience containing:

- Hero image
- Full description
- Reviews
- Price
- Date/time
- Exact location
- Embedded map
- External booking/source link
- Similar activities
- Save action

---

# TREND FLAME SYSTEM

Custom engagement score.

Inputs may include:

- views
- clicks
- saves
- bookings
- momentum growth
- recency

Outputs:

- low flame
- medium flame
- full flame
- super flame

---

# SPORT PAGE FEATURES

Dedicated sports discovery feed.

Possible internal categories:

- Watch
- Play
- Classes
- Deals
- Outdoor

Supports same card system as Home.

Discount badge examples:
-20%
2-for-1
Limited Offer

---

# CHAT PAGE FEATURES

Full-page AI assistant.

## Input Modes

- free text prompt
- suggested prompts carousel

## Suggested Prompt Examples

- Date idea tonight in Montreal
- Cheap activity for 4 friends
- Indoor activity because of rain
- Best sports class nearby

## AI Output

Returns activity cards with explanation.

Example:
“I found 3 good options based on your mood.”

Cards remain clickable.

---

# PROFILE PAGE FEATURES

## User Summary

- avatar
- name
- profile preferences

## Stats

- viewed activities
- saved count
- completed outings
- favorite category
- monthly usage

## Overlay Panels

Buttons open:

- Favorites
- Preferences
- History
- Settings

---

# FAVORITES SYSTEM

Users can save activities.

Favorites panel supports:

- search favorites
- remove items
- filter by category
- reopen details

---

# SEARCH SYSTEM

Global smart search in navbar.

Supports:

- keywords
- intent search
- categories
- neighborhoods
- date phrases

Examples:
- jazz tonight
- cheap brunch old montreal
- padel this weekend

---

# RESPONSIVE WEB REQUIREMENTS

Designed for laptop-first web usage.

Must remain usable on smaller screens, but primary optimization is desktop browsing.

---

# PERFORMANCE REQUIREMENTS

- fast loading cards
- lazy-loaded images
- smooth scrolling
- responsive map
- instant filter updates where possible

---

# FUTURE-READY (not required now)

- bookings
- accounts sync
- dark mode
- notifications
- recommendations engine
- social sharing
- waitlists
- premium memberships

---

# Success Metric

A user should be able to discover one appealing activity in under 60 seconds.