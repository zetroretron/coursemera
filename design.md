# CourseMera - Design Specification

## 1. Project Overview

CourseMera is a desktop learning platform built with Electron that lets users select a folder containing video courses and provides a YouTube-style viewing experience. It features automatic course scanning, progress tracking, dark/light theme switching, and a full-featured video player.

### Tech Stack
- Electron (desktop framework)
- Express (local server for serving video files)
- HTML/CSS/JS (renderer)
- Inter font (Google Fonts)
- Prism.js (syntax highlighting for HTML lessons)

### Files
- `src/renderer/index.html` - Home page (course listing)
- `src/renderer/course.html` - Course detail page
- `src/renderer/player.html` - Video player page
- `src/renderer/styles.css` - All styles
- `src/renderer/app.js` - Home page logic
- `src/renderer/course.js` - Course page logic
- `src/renderer/player.js` - Player page logic
- `src/main/main.js` - Electron main process
- `src/main/scanner.js` - Course folder scanner
- `src/main/server.js` - Express video server

---

## 2. Design Direction

**Overall feel:** Clean, modern, learning-focused. Dark theme primary with subtle gradients. Category color coding for quick navigation. Spacious cards with smooth hover animations.

**Key principles:**
- Keep existing layout structure (3 pages: home, course, player)
- Replace emoji icons with clean SVG or icon font icons
- Make player controls always visible (not just on hover)
- Improve visual hierarchy on course cards
- Keep folder bar compact and persistent
- Maintain dark/light theme parity
- Preserve all existing functionality and data flow

---

## 3. Color Palette

### Dark Theme (default)
```
--bg-primary: #0d1117       (page background)
--bg-secondary: #161b22     (bars, sidebars)
--bg-card: #21262d         (cards, panels)
--bg-hover: #30363d        (hover states)
--text-primary: #e6edf3     (main text)
--text-secondary: #8b949e   (secondary text)
--text-muted: #6e7681      (disabled, hints)
--border: #30363d          (borders, dividers)
--accent: #0f93ff          (primary actions, links)
--accent-hover: #1a9fff     (hover on accent)
--success: #238636         (completed, watched)
--error: #da3633            (errors)
```

### Category Colors (dark + light)
```
--cat-ai: #8b5cf6 / #7c3aed        (purple)
--cat-web: #3b82f6 / #2563eb       (blue)
--cat-devops: #f97316 / #ea580c   (orange)
--cat-career: #eab308 / #ca8a04   (yellow)
--cat-python: #22c55e / #16a34a   (green)
--cat-java: #ef4444 / #dc2626     (red)
```

---

## 4. Typography

**Font Family:** Inter, -apple-system, BlinkMacSystemFont, sans-serif

**Weights:** 400 (regular), 500 (medium), 600 (semibold), 700 (bold)

**Scale:**
- Logo: 1.5rem, weight 700, gradient text (accent to python green)
- Page titles: 1.75rem, weight 700
- Section headings: 1.5rem, weight 600
- Card titles: 1rem, weight 600, line-height 1.4
- Body text: 1rem, weight 400, line-height 1.6
- Labels: 0.9rem, weight 500
- Small/meta: 0.85rem, weight 400
- Tiny: 0.75rem, weight 400

---

## 5. Spacing System

**Base unit:** 8px

**Spacing values used throughout:**
- 4px (tiny gaps)
- 8px (tight)
- 12px (small)
- 16px (medium)
- 24px (large)
- 32px (section gaps)

**Border radius:**
- 4px (inputs, small elements)
- 6px (buttons, small cards)
- 8px (cards, panels)
- 12px (large cards, pills)
- 16px (hero sections, modals)
- 50% (circular buttons)

---

## 6. Page Layouts

### Page 1: Home (index.html)

**Structure:**
```
<body>
  <header> (sticky, z-index 100)
    - Left: Logo "CourseMera"
    - Center: Search input (max-width 400px)
    - Right: Theme toggle button, Rescan button
  </header>

  <div class="folder-bar"> (below header, always visible)
    - Left: Folder icon + path text (clickable) + meta info
    - Right: Change button, Rescan button
  </div>

  <main>
    <section class="folder-section"> (shown when no folder selected)
      - Welcome card centered, max-width 500px
      - "Select Courses Folder" primary button
    </section>

    <section class="stats-banner"> (shown when courses exist)
      - 3 stats: Total Courses, Total Videos, Completed
    </section>

    <section class="recent-section"> (Continue Learning)
      - Horizontal scrollable ribbon of recent course cards
    </section>

    <section class="filters">
      - Filter pills: All, AI & ML, Web Dev, DevOps, Career, Python, Java
      - Sort dropdown (right-aligned): Recently Accessed, Most Completed, A-Z
    </section>

    <div class="course-grid">
      - Auto-fill grid, minmax(300px, 1fr)
      - Course cards with thumbnail, badge, title, meta, progress bar
    </div>
  </main>
</body>
```

**Current course card design:**
- Left border 4px solid (category color)
- Thumbnail image 160px height
- Badge pill (category name, colored background)
- Title, meta (videos count, duration)
- Progress bar (if started)
- Hover: translateY(-4px) + box-shadow

---

### Page 2: Course Detail (course.html)

**Structure:**
```
<body>
  <header>
    - Left: "Back to Courses" link
    - Center: Logo
    - Right: Theme toggle
  </header>

  <main class="course-main">
    <div class="course-header">
      - Hero image (250px, full width, rounded 16px)
      - Overlay gradient at bottom
      - Badge, title, meta (videos, duration, sections count)
      - Resume button (if has last position)
    </div>

    <div class="course-progress-bar">
      - Progress text: "X / Y completed (Z%)"
      - Progress bar (8px height, rounded)
    </div>

    <div class="course-sections">
      - List of collapsible section cards
      - Each section: header (number + name + count) + content (video list)
      - Video items: icon (watched/play/text) + name + duration
    </div>
  </main>
</body>
```

**Current section design:**
- Cards with 12px radius, 1px border
- Header button: hover state changes background
- Section content: hidden by default, toggle with arrow
- Active video: left 3px border accent
- Watched videos: green check icon

---

### Page 3: Video Player (player.html)

**Structure:**
```
<body>
  <header class="player-header">
    - Left: "Back to Courses"
    - Center: Course title (truncated)
    - Right: Theme toggle
  </header>

  <div class="player-layout">
    <aside class="player-sidebar"> (350px wide)
      - Sidebar header: thumbnail + course title
      - Sidebar content: collapsible section lists
      - Each video item: status icon + name + duration
    </aside>

    <div class="player-content">
      <div class="video-wrapper"> (max-height 70vh)
        - Double-click zones (left 50% / right 50%) for fullscreen
        - Video element (HTML5)
        - Video overlay with large play button (80px circle)
        - Loading spinner (centered, animated)
        - Seek indicator (centered, shows +10s / -10s)
      </div>

      <div class="controls-bar">
        - Progress container: buffered bar + played bar + time tooltip
        - Controls row:
          - Left: Play, Rewind 10s, Forward 10s, Mute, Volume slider, Time display
          - Right: Speed button, Theater mode, Fullscreen, PiP, Help
        - Speed dropdown menu (below controls)
      </div>

      <div class="html-content-container"> (for HTML lessons)
        - Lesson title + content with code highlighting
      </div>
    </div>
  </div>

  <div class="sticky-footer"> (fixed bottom bar)
    - Previous button
    - Mark Complete button
    - Next button
  </div>

  <div class="keyboard-help"> (modal, centered)
    - 2-column grid of keyboard shortcuts
    - Close button
  </div>
</body>
```

**Critical issues to fix in redesign:**
- Player controls bar: below video, hard to see — make more prominent
- Control buttons use emoji icons — replace with SVG icons
- Progress bar is thin (4px) — consider making thicker and more visible
- Controls bar background same as page — consider adding subtle backdrop blur
- Time display "0:00 / 0:00" — make more readable

---

## 7. Component Inventory

### Header
- Sticky top, 1rem padding, bg-secondary, 1px border bottom
- Logo: gradient text (accent to green)
- Icon buttons: 0.5rem padding, bg-card, 1px border, 8px radius, hover: bg-hover + border accent
- Back link: color text-primary, hover: accent

### Folder Bar
- 8px padding, bg-secondary, 1px border bottom, 13px font
- Path text: clickable, color secondary, hover accent
- Meta text: color muted
- Buttons: 4px 10px padding, 6px radius, bg-card, hover: bg-hover + accent border

### Course Card
- bg-card, 12px radius, 1px border
- 4px left border (category color)
- Hover: translateY(-4px), box-shadow (0 8px 24px rgba(0,0,0,0.3))
- Image: 100% width, 160px height, object-fit cover
- Badge: 0.25rem 0.75rem padding, 12px radius, 0.75rem font, category color
- Title: 1rem, weight 600, 1.4 line-height
- Meta: 0.85rem, text-secondary, 1rem gap
- Progress: 4px bar, accent fill

### Section Card
- bg-card, 12px radius, 1px border
- Header: 1rem padding, no border, hover bg-hover
- Section number: text-secondary, weight 500
- Section title: weight 600
- Arrow: rotates on expand
- Content: border-top, hidden default

### Video Item
- 0.75rem 1.25rem padding, hover bg-hover
- Status icon: 24px width, centered
- Name: flex 1, ellipsis
- Duration: text-secondary, 0.85rem
- Active: bg-hover + 3px left border accent
- Watched: success (green) color

### Sidebar Video Item
- 0.5rem 0.75rem padding, 6px radius
- 0.85rem font
- Active: accent background, white text
- Watched: success color

### Controls Bar
- bg-secondary, 0.75rem 1rem padding
- Progress bar: 20px height container, 4px actual bar, buffered vs played
- Ctrl buttons: 0.5rem padding, no border, 1.2rem font emoji icons, hover accent color
- Volume slider: 80px wide, 4px height, accent thumb
- Time display: text-secondary, 0.85rem

### Play Button Large
- 80px x 80px circle
- bg accent (rgba), border none
- 2rem icon, white
- Hover: scale 1.1, solid accent bg

### Sticky Footer
- Fixed bottom, left 350px (sidebar width), right 0
- 1rem 2rem padding, bg-secondary, top border
- Nav buttons: bg-card, 1px border, 8px radius, weight 500
- Complete button: bg success, white text, weight 600

---

## 8. Animation & Transitions

**Global:**
- `transition: all 0.2s` on interactive elements (buttons, cards)
- `transition: background 0.2s` on buttons

**Cards:**
- Hover: `transform: translateY(-4px)`, `box-shadow: 0 8px 24px rgba(0,0,0,0.3)`
- 0.2s ease

**Sections:**
- Arrow rotation: 0.2s transform

**Play button:**
- Hover: `transform: scale(1.1)`, 0.2s

**Progress:**
- Width: `transition: width 0.1s` (fast updates)

**Loading spinner:**
- `@keyframes spin` 1s linear infinite

---

## 9. Shadows

**Card hover:** `0 8px 24px rgba(0,0,0,0.3)`

**No other shadows currently used** — consider adding subtle shadows to:
- Header (sticky)
- Player sidebar
- Modals (keyboard help)
- Course hero overlay (already uses gradient)

---

## 10. Current Icon Set

**Emoji icons used throughout:**
- Moon/Sun (theme toggle)
- Refresh (rescan)
- Folder (folder bar)
- Play/Pause (video controls)
- Rewind/Forward (video controls)
- Volume (video controls)
- Fullscreen/Theater (video controls)
- PiP (video controls)
- Help (video controls)
- Check (watched status)
- Document (HTML lesson)

**Redesign direction:** Replace all emoji with clean SVG icons or use an icon library like Lucide, Feather, or Font Awesome. Ensure consistent stroke width, sizing (24px standard), and style.

---

## 11. Interaction States

### Button States
- Default: bg-card, border, text-primary
- Hover: bg-hover, border-accent
- Active/Pressed: slightly darker
- Disabled: opacity 0.5, cursor not-allowed

### Card States
- Default: bg-card, border
- Hover: translateY(-4px), shadow
- Active (clicked): brief press effect

### Video States
- Not started: play icon
- Playing: pause icon, play button hidden
- Paused: play icon, play button shown
- Watched: check in green
- Active (current): accent border left, bg-hover

### Section States
- Collapsed: arrow right, content hidden
- Expanded: arrow down, content visible

### Filter Pills
- Default: bg-card, text-secondary
- Hover: border-accent, text-primary
- Active: solid category color bg + border, white text

---

## 12. Constraints for Redesign

1. **Keep the same HTML structure** — do not change element IDs, classes, or nesting that JavaScript depends on
2. **Preserve data flow** — course scanning, JSON storage, localStorage sync, IPC communication must remain intact
3. **Maintain dark/light theme** — CSS variables must be preserved, redesign must work for both
4. **Keep all 3 pages** — home, course detail, player
5. **Preserve functionality** — all buttons, filters, search, progress tracking, keyboard shortcuts must continue working
6. **Mobile responsive** — collapse sidebar on small screens, stack elements
7. **Performance** — keep animations lightweight, avoid layout shifts

### Elements that MUST NOT change:
- `<header>`, `<main>`, `<aside>` structure
- IDs: `folderBar`, `courseGrid`, `videoPlayer`, `controlsBar`, `sidebarContent`, etc.
- CSS variable names (`--bg-primary`, `--accent`, etc.)
- JavaScript functions: `loadCourses()`, `renderCourse()`, `setupPlayer()`, `togglePlay()`, etc.
- localStorage keys: `theme`, `coursesData`, `progress`, `recentCourses`, `coursesFolder`

---

## 13. Known Issues to Address

1. **Player controls not visible enough** — controls bar below video is easy to miss. Redesign should make controls more prominent with clearer visual separation from video area.

2. **Emoji icons feel dated** — replace with modern SVG icons throughout the entire app for a more polished look.

3. **Video controls on video area** — double-click zones for fullscreen work but the video area feels empty before playback starts.

4. **Folder bar could be more polished** — ensure it feels integrated, not tacked on.

5. **Course cards are functional but generic** — improve visual hierarchy, category color treatment, and hover states to feel premium.

6. **Sidebar on player page** — ensure it scrolls independently, highlights the active video clearly, and sections are easy to navigate.

---

## 14. Responsive Behavior

**Breakpoint: 768px**

- Header: wrap flex items, search goes to own row
- Stats banner: wrap
- Filters: horizontal scroll
- Course grid: single column
- Player sidebar: hidden
- Sticky footer: full width (no left offset)

**Player in theater mode:**
- Sidebar hidden
- Content full width
- Sticky footer left: 0

---

## 15. Theme Toggle Implementation

The app uses `data-theme="light"` on the `<body>` element to switch themes.

**Dark theme (default):** CSS variables use dark values
**Light theme:** CSS variables override with light values

```css
[data-theme="light"] {
    --bg-primary: #f8f9fa;
    --bg-secondary: #ffffff;
    --bg-card: #ffffff;
    /* etc */
}
```

Toggle button text: Moon (dark mode = click to switch to light) / Sun (light mode = click to switch to dark)