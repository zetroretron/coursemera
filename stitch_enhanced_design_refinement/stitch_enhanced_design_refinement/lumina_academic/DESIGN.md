---
name: Lumina Academic
colors:
  surface: '#051424'
  surface-dim: '#051424'
  surface-bright: '#2c3a4c'
  surface-container-lowest: '#010f1f'
  surface-container-low: '#0d1c2d'
  surface-container: '#122131'
  surface-container-high: '#1c2b3c'
  surface-container-highest: '#273647'
  on-surface: '#d4e4fa'
  on-surface-variant: '#c2c6d6'
  inverse-surface: '#d4e4fa'
  inverse-on-surface: '#233143'
  outline: '#8c909f'
  outline-variant: '#424754'
  surface-tint: '#adc6ff'
  primary: '#adc6ff'
  on-primary: '#002e6a'
  primary-container: '#4d8eff'
  on-primary-container: '#00285d'
  inverse-primary: '#005ac2'
  secondary: '#bcc7de'
  on-secondary: '#263143'
  secondary-container: '#3e495d'
  on-secondary-container: '#aeb9d0'
  tertiary: '#a4c9ff'
  on-tertiary: '#00315d'
  tertiary-container: '#4c93e7'
  on-tertiary-container: '#002a51'
  error: '#ef4444'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a42'
  on-primary-fixed-variant: '#004395'
  secondary-fixed: '#d8e3fb'
  secondary-fixed-dim: '#bcc7de'
  on-secondary-fixed: '#111c2d'
  on-secondary-fixed-variant: '#3c475a'
  tertiary-fixed: '#d4e3ff'
  tertiary-fixed-dim: '#a4c9ff'
  on-tertiary-fixed: '#001c39'
  on-tertiary-fixed-variant: '#004883'
  background: '#0b1326'
  on-background: '#d4e4fa'
  surface-variant: '#273647'
  surface-1: '#161e31'
  surface-2: '#1f2942'
  surface-3: '#2d3a54'
  success: '#10b981'
  warning: '#f59e0b'
typography:
  headline-xl:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 14px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-max: 1440px
  gutter: 24px
  margin-edge: 40px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style

The design system is engineered for a high-end, professional learning environment. It prioritizes cognitive ease and deep focus through a **Corporate / Modern** aesthetic with **Minimalist** leanings. The brand personality is authoritative yet encouraging, mirroring the experience of a premium physical campus within a digital SaaS framework. 

The visual language avoids unnecessary ornamentation, opting instead for structural clarity, precise alignment, and a sophisticated dark-mode atmosphere that reduces eye strain during long study sessions. The result is a streamlined dashboard that feels both expensive and utilitarian.

## Colors

This design system utilizes a sophisticated deep-sea palette to define its dark mode environment. The core hierarchy relies on **surface-container layering** rather than traditional drop shadows.

- **Primary Action**: The vibrant `#3b82f6` is reserved exclusively for interactive elements, progress indicators, and primary calls to action.
- **Background Strategy**: The base layer is `#0b1326`. Depth is created by "stepping up" the lightness of container backgrounds (Surface 1 through Surface 3) to represent proximity to the user.
- **Functional Colors**: Use success, warning, and error colors sparingly to maintain the professional, calm atmosphere. Text should primarily use high-contrast slates to ensure readability against the navy depths.

## Typography

Geist is the exclusive typeface for the design system, chosen for its monospaced-influenced precision and exceptional legibility in technical or educational contexts.

- **Headlines**: Utilize tight letter-spacing and heavy weights for a structured, authoritative feel.
- **Body Text**: Maintain generous line heights (1.5x) to facilitate reading of complex course materials.
- **Labels**: Small-caps or increased letter-spacing should be used for metadata and sidebar category headers to differentiate from interactive labels.

## Layout & Spacing

The design system employs a **Fixed-Fluid Hybrid** grid. The main content area is capped at 1440px for optimal readability on ultra-wide monitors, while sidebars and navigation panels are fixed-width to ensure a consistent dashboard experience.

- **Grid**: A 12-column system with 24px gutters.
- **Rhythm**: All spacing is derived from a base unit of 8px. Use 16px (2 units) for standard padding and 32px (4 units) for logical section breaks.
- **Responsive Behavior**: On tablets, margins reduce to 24px and the sidebar collapses into a drawer. On desktop, the sidebar remains persistent to allow for rapid switching between course modules.

## Elevation & Depth

Depth in the design system is communicated through **Tonal Layers** and **Low-Contrast Outlines**.

1.  **Elevation via Color**: Higher-elevation elements (like popovers or active cards) use lighter surface hexes (`surface-3`) rather than heavy shadows.
2.  **Outlines**: Every container should feature a 1px border using a low-opacity variant of the neutral color (`#ffffff10`) to define boundaries without adding visual noise.
3.  **Shadows**: Use only for "floating" elements like dropdown menus or modals. These should be ultra-diffused: `0px 10px 30px rgba(0, 0, 0, 0.5)`.

## Shapes

The shape language is defined by "Soft Rounding." A consistent 8px (`0.5rem`) radius is applied to all primary UI elements including cards, buttons, and input fields. 

- **Exceptions**: Large content containers or hero sections may scale up to 16px (`1rem`) to feel more approachable. 
- **Consistency**: Icons and progress bar caps must match this rounded language (avoiding sharp corners entirely) to maintain the premium, high-end SaaS aesthetic.

## Components

- **Buttons**: Primary buttons are solid `#3b82f6` with white text. Secondary buttons use a ghost style with a `surface-2` background and subtle border.
- **Cards**: The fundamental unit for course modules. Cards use `surface-1` background, an 8px radius, and a 1px border. On hover, the background shifts to `surface-2`.
- **Inputs**: Text fields use the `background` color for the fill to create a "hollow" look against `surface-1` panels. The border glows primary blue only when focused.
- **Progress Bars**: High-contrast components. The track is `surface-3` and the fill is the primary blue. Use a height of 6px for a refined look.
- **Chips**: Used for course tags (e.g., "Intermediate," "Python"). These should be low-contrast, using `surface-3` backgrounds and `neutral-color` text to prevent them from competing with primary buttons.
- **Sidebar**: The navigation backbone. Use semi-transparent backgrounds with a backdrop-blur (10px) to give a subtle hint of the content beneath, reinforcing the "premium" feel.