---
name: Footy Dynasty
colors:
  surface: '#111413'
  surface-dim: '#111413'
  surface-bright: '#373a38'
  surface-container-lowest: '#0c0f0e'
  surface-container-low: '#191c1b'
  surface-container: '#1d201f'
  surface-container-high: '#282b29'
  surface-container-highest: '#323534'
  on-surface: '#e1e3e1'
  on-surface-variant: '#c3c9ae'
  inverse-surface: '#e1e3e1'
  inverse-on-surface: '#2e3130'
  outline: '#8d937b'
  outline-variant: '#434934'
  surface-tint: '#a3d700'
  primary: '#ffffff'
  on-primary: '#263500'
  primary-container: '#bef532'
  on-primary-container: '#526d00'
  inverse-primary: '#4d6700'
  secondary: '#86ceff'
  on-secondary: '#00344c'
  secondary-container: '#3099d1'
  on-secondary-container: '#002d43'
  tertiary: '#ffffff'
  on-tertiary: '#670022'
  tertiary-container: '#ffd9dd'
  on-tertiary-container: '#bd274e'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#bef532'
  primary-fixed-dim: '#a3d700'
  on-primary-fixed: '#151f00'
  on-primary-fixed-variant: '#394d00'
  secondary-fixed: '#c8e6ff'
  secondary-fixed-dim: '#86ceff'
  on-secondary-fixed: '#001e2e'
  on-secondary-fixed-variant: '#004c6d'
  tertiary-fixed: '#ffd9dd'
  tertiary-fixed-dim: '#ffb2bb'
  on-tertiary-fixed: '#400012'
  on-tertiary-fixed-variant: '#910033'
  background: '#111413'
  on-background: '#e1e3e1'
  surface-variant: '#323534'
typography:
  display-lg:
    fontFamily: Bebas Neue
    fontSize: 64px
    fontWeight: '400'
    lineHeight: 60px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Bebas Neue
    fontSize: 32px
    fontWeight: '400'
    lineHeight: 32px
    letterSpacing: 0.02em
  headline-lg-mobile:
    fontFamily: Bebas Neue
    fontSize: 28px
    fontWeight: '400'
    lineHeight: 28px
  title-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '700'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-stats:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '800'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 48px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 40px
---

## Brand & Style
The design system for this product is built on the philosophy of "Aggressive Precision." It targets a dedicated audience of sports enthusiasts and strategists who demand a high-performance, premium environment. The brand personality is elite, energetic, and technologically advanced, mirroring the intensity of professional Australian Rules Football management.

The visual style is a fusion of **Glassmorphism** and **High-Contrast Bold**. It utilizes deep, dark surfaces to allow vibrant accents to pop with luminous intensity. The interface should feel like a high-end tactical HUD—weightless yet structured—using blurred translucency to maintain context while focusing on data-heavy management tasks.

## Colors
The palette is engineered for maximum legibility against a near-black foundation. 

- **Primary (Lime Green):** Used exclusively for interactive elements, successful states, and critical "Call to Action" buttons. It represents the "on-field" energy.
- **Secondary (Cool Blue):** Dedicated to informational overlays, navigation icons, and neutral data points.
- **Warning (Pink-Red):** High-visibility color reserved for injuries, suspension alerts, or negative financial trends.
- **Background/Surface:** The base is `#0B0E0D`. Glass surfaces use a white tint at 5% opacity with a high background blur (20px-40px) to create depth without sacrificing readability.

## Typography
The typography system balances athletic aggression with technical clarity.

- **Headlines:** `Bebas Neue` provides the "stadium screen" aesthetic. It is used for player names, scores, and section headers. Its condensed nature allows for long surnames to fit in tight layouts.
- **Body:** `Inter` is chosen for its exceptional legibility in data-dense lists and news feeds. It remains neutral to allow the display fonts to shine.
- **Technical Labels:** `JetBrains Mono` is used for all player statistics (Kicks, Handballs, Efficiency %). The monospaced nature ensures that columns of numbers align perfectly for easy comparison.

## Layout & Spacing
This design system employs a **Fluid Grid** model based on a 4px baseline rhythm. 

- **Mobile:** 4-column grid with 16px margins. Content cards usually span the full width.
- **Desktop:** 12-column grid with 24px gutters. The layout uses a fixed-width container (max 1440px) to maintain the "cockpit" feel.
- **Vertical Spacing:** Elements are grouped using tight 8px internal padding, with 24px or 48px gaps between major sections to define clear visual hierarchy.

## Elevation & Depth
Depth is created through **Glassmorphism** rather than traditional drop shadows.

1.  **Level 0 (Floor):** The `#0B0E0D` background.
2.  **Level 1 (Sub-surface):** 2% white overlay, no blur. Used for grouped background areas.
3.  **Level 2 (Active Cards):** 5% white overlay with a 20px Backdrop Blur. These cards feature a 1px "Inner Glow" border (`#C8FF3D` at 20% opacity).
4.  **Level 3 (Modals/Pop-overs):** 10% white overlay with 40px Backdrop Blur and a distinct 1px solid Lime border.

Avoid using black shadows; instead, use a saturated "Negative Glow" (a dark, blurred Lime or Blue) behind high-priority elements to make them appear as if they are emitting light onto the surface below.

## Shapes
The shape language is **Soft (Level 1)**. While the typography is aggressive and sharp, the UI containers use a 0.25rem (4px) base radius to ensure the app feels premium and modern rather than dated and "boxy." 

Larger containers (Cards) should use `rounded-lg` (8px), and primary buttons should use `rounded-xl` (12px) to differentiate interactive touch targets from static data containers.

## Components

- **Glass Cards:** The signature component. Must include a `backdrop-filter: blur(20px)`, a semi-transparent background, and a 1px border. In active states, the border color transitions to solid Lime Green.
- **High-Contrast Buttons:** 
    - *Primary:* Solid Lime Green (#C8FF3D) with black text.
    - *Secondary:* Transparent with a 1px Blue (#3AA0D8) border and blue text.
- **Progress Pips:** Used for player stamina or skill levels. Small, vertical rectangles (2px width) that fill from left to right. Active pips glow slightly.
- **Tab Bar:** Floating at the bottom of the screen with a glass background. The active state is indicated by a thick (4px) Lime Green line above the icon.
- **Stat Chips:** Small `JetBrains Mono` text inside a dark gray, semi-opaque capsule.
- **Status Indicators:** A small 8px circle. Pulse animation for "Live" matches. Static for player availability.