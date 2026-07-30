---
name: Professional Admin System
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#43474f'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#737780'
  outline-variant: '#c3c6d1'
  surface-tint: '#3a5f94'
  primary: '#001e40'
  on-primary: '#ffffff'
  primary-container: '#003366'
  on-primary-container: '#799dd6'
  inverse-primary: '#a7c8ff'
  secondary: '#00658d'
  on-secondary: '#ffffff'
  secondary-container: '#2dbcfe'
  on-secondary-container: '#004866'
  tertiary: '#00240e'
  on-tertiary: '#ffffff'
  tertiary-container: '#003c1b'
  on-tertiary-container: '#00b35d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d5e3ff'
  primary-fixed-dim: '#a7c8ff'
  on-primary-fixed: '#001b3c'
  on-primary-fixed-variant: '#1f477b'
  secondary-fixed: '#c6e7ff'
  secondary-fixed-dim: '#82cfff'
  on-secondary-fixed: '#001e2d'
  on-secondary-fixed-variant: '#004c6b'
  tertiary-fixed: '#6bfe9c'
  tertiary-fixed-dim: '#4ae183'
  on-tertiary-fixed: '#00210c'
  on-tertiary-fixed-variant: '#005228'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 38px
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 32px
  sidebar-width: 260px
---

## Brand & Style

This design system is engineered for high-utility administrative environments where data clarity and user focus are paramount. It adopts a **Corporate / Modern** aesthetic, prioritizing legibility and cognitive ease over decorative elements. 

The system utilizes a structured hierarchy of information, leveraging generous whitespace to prevent data fatigue. The visual tone is authoritative yet accessible, using a deep institutional palette to establish trust and vibrant functional colors to guide user action and status recognition. It is designed for internal tools, dashboards, and enterprise platforms that require long-session durability.

## Colors

The palette is anchored by a deep navy institutional primary, ensuring a sense of stability and professionalism.

- **Primary:** Deep Navy (#003366), used for sidebars, primary branding, and high-level headers.
- **Secondary:** Professional Blue (#00AEEF), used for primary actions, active states, and focus indicators.
- **Semantic:** Clear Green (#2ECC71) for success/positive trends, Amber (#F39C12) for warnings/caution, and Red (#E74C3C) for errors or critical alerts.
- **Neutral:** A range of cool grays starting from #F8FAFC (background) up to #1E293B (text) to ensure high contrast and readability.

## Typography

The system uses **Inter** across all roles to maximize legibility and provide a neutral, systematic feel. 

- **Headlines:** Use Bold (700) or Semi-bold (600) weights to create clear entry points into sections. 
- **Body:** Standardized at 14px for data density without sacrificing readability. 
- **Labels:** Used for metadata and button text, typically in Semi-bold to distinguish from body content.
- **Scale:** Typographic hierarchy is strictly maintained to help users parse complex data tables and multi-card layouts efficiently.

## Layout & Spacing

This design system follows a **Fixed-Fluid Hybrid Grid**. 

1. **Sidebar:** A fixed-width navigation rail (260px) anchored to the left.
2. **Main Content:** A fluid area using a 12-column grid system.
3. **Spacing Rhythm:** Based on a 4px baseline. Components use 8px, 16px, or 24px increments for internal padding.
4. **Breakpoints:**
   - **Mobile (<768px):** Single column, 16px margins, sidebar collapses to a hamburger menu.
   - **Tablet (768px - 1024px):** 2-column card layouts, 24px margins.
   - **Desktop (>1024px):** Full 12-column availability with 32px external margins and 24px gutters between components.

## Elevation & Depth

Visual hierarchy is established through **Tonal Layers** and **Subtle Shadows**. 

- **Level 0 (Background):** Neutral light gray (#F8FAFC), providing a clean canvas.
- **Level 1 (Cards/Containers):** Pure white (#FFFFFF) with a soft 1px border (#E2E8F0) and a subtle ambient shadow (0px 4px 6px rgba(0,0,0,0.05)).
- **Level 2 (Interactive/Floating):** Used for dropdowns and tooltips. More pronounced shadow (0px 10px 15px rgba(0,0,0,0.1)) to indicate focus and separation from the layout.
- **Sidebar:** Uses depth through color (Primary Navy) rather than shadow to ground the navigation.

## Shapes

The design system uses a **Rounded** (Level 2) shape language to soften the corporate aesthetic and make the interface feel modern and approachable.

- **Standard Elements:** 8px (0.5rem) radius for inputs, small buttons, and list items.
- **Cards & Large Containers:** 16px (1rem) radius to define clear sections.
- **Specific Accents:** 24px+ for status badges and pill-shaped utility buttons.

## Components

### Buttons
- **Primary:** Solid Professional Blue (#00AEEF) with white text. 8px corner radius.
- **Secondary:** Transparent background with Primary Navy border and text.
- **Ghost/Tertiary:** No border, text-only blue for low-priority actions.

### Cards
Cards are the primary container for data. They must include a 24px internal padding and a subtle 1px border. Card titles should be in `headline-md` weight.

### Input Fields
Inputs use a white background with a light gray border. Focus states must use a 2px Professional Blue outline. Placeholders should be a light-neutral gray.

### Data Tables
Tables are optimized for high density. Rows use 48px height with a 1px bottom border (#F1F5F9). Alternate row striping is optional but recommended for tables exceeding 10 rows.

### Chips & Badges
Used for status (e.g., "Active", "Pending"). Pill-shaped (fully rounded) with low-opacity background tints of the semantic colors (e.g., 10% opacity green background with 100% opacity green text).