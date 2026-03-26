# Design System Documentation: The Editorial Memo

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Digital Curator."** 

While the functional requirement is a memo-taking app, the visual execution must transcend the "utility" look of a standard tool. We are moving away from the rigid, boxed-in grids of legacy productivity apps and toward a sophisticated, editorial layout. Think of the UI not as a database, but as a high-end physical stationery set laid out on a clean, backlit glass desk. 

By utilizing intentional asymmetry, varying typographic scales, and tonal depth, we create an environment that feels both hyper-productive and mentally calming. The system relies on "Negative Space as Structure," where the absence of lines creates a more breathable, premium experience.

---

## 2. Colors & Surface Logic
Our palette is a disciplined exploration of blues and whites, designed to minimize cognitive load while maximizing professional authority.

### The "No-Line" Rule
Standard 1px borders are strictly prohibited for sectioning. To define boundaries, you must use **Background Tonal Shifts**. For example, a sidebar should not be "lined off"; it should be a `surface-container-low` block sitting against a `surface` background.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. Use the following hierarchy to create depth:
*   **Base Layer:** `surface` (#f8f9fa) – The canvas.
*   **Secondary Layout Elements:** `surface-container-low` (#f3f4f5) – Use for navigation bars or grouping areas.
*   **Interactive Cards/Notes:** `surface-container-lowest` (#ffffff) – These should "pop" against the lower-tier backgrounds.
*   **Overlays/Modals:** `surface-bright` (#f8f9fa) with high-end shadows.

### The "Glass & Gradient" Rule
To prevent the app from feeling "flat" or "generic," floating elements (like a FAB or a hovering toolbar) should utilize **Glassmorphism**. Apply `surface_variant` at 60% opacity with a `backdrop-blur` of 20px. 

For primary actions, move beyond flat color. Use a subtle linear gradient from `primary` (#005bbf) to `primary_container` (#1a73e8) at a 135-degree angle to provide a "lit-from-within" professional polish.

---

## 3. Typography
We use a dual-typeface system to balance character with readability.

*   **Display & Headlines (Manrope):** This geometric sans-serif provides a modern, architectural feel. Use `display-lg` and `headline-md` with generous tracking (-0.02em) to create an editorial header style that makes even a simple "Notes" title feel like a magazine header.
*   **Body & Labels (Inter):** The workhorse. Inter is chosen for its exceptional legibility at small sizes. Use `body-md` for the content of memos to ensure the user can focus on their thoughts without eye strain.
*   **Visual Hierarchy:** High contrast between `headline-lg` and `body-sm` is encouraged. Don't be afraid to make a title significantly larger than the content to create a clear entry point for the eye.

---

## 4. Elevation & Depth
In this system, elevation is conveyed through light and tone, never through heavy strokes.

### The Layering Principle
Depth is achieved by "stacking" surface tiers. Place a `surface-container-lowest` card on a `surface-container-low` section. This creates a soft, natural lift that mimics fine paper on a desk.

### Ambient Shadows
Shadows must be felt, not seen. 
*   **Value:** `0px 8px 24px rgba(25, 28, 29, 0.06)`
*   **Logic:** The shadow color is a low-opacity version of `on-surface` (#191c1d). This creates an ambient light effect rather than a "dirty" grey drop shadow.

### The "Ghost Border" Fallback
If a container requires a border for accessibility (e.g., a search input), use a **Ghost Border**. Apply `outline-variant` (#c1c6d6) at **15% opacity**. High-contrast, 100% opaque borders are forbidden.

---

## 5. Components

### Buttons
*   **Primary:** Rounded `full` (9999px). Gradient fill (`primary` to `primary_container`). Label in `on-primary` (#ffffff).
*   **Secondary:** `surface-container-high` fill with `primary` text. No border.
*   **Tertiary:** Transparent background, `primary` text, `sm` padding.

### Input Fields
*   **Style:** Minimalist. No bottom line or full box. Use a `surface-container-highest` background with a `DEFAULT` (0.5rem) corner radius. 
*   **Focus State:** Transition the background to `surface-container-low` and add a `primary` Ghost Border (20% opacity).

### Cards & Memo Items
*   **Rule:** Forbid divider lines. 
*   **Separation:** Use `Spacing 6` (1.5rem) of vertical white space or a subtle shift from `surface` to `surface-container-lowest`.
*   **Interaction:** On hover, a card should transition from `surface-container-lowest` to `surface-bright` with an Ambient Shadow.

### Chips (Tags)
*   **Construction:** Use `secondary_container` with `on_secondary_container` text. 
*   **Edge:** `full` (9999px) roundedness to contrast against the `DEFAULT` roundedness of memo cards.

### Relevant App-Specific Components
*   **The "Focus Board":** A large, `surface-container-lowest` area with `headline-lg` typography for distraction-free writing.
*   **Pinned Navigation:** A glassmorphic side-rail using `surface-variant` at 40% opacity with heavy blur.

---

## 6. Do's and Don'ts

### Do:
*   **Do** use asymmetrical margins. A wider left margin for titles creates an editorial feel.
*   **Do** use `primary_fixed_dim` for subtle accent icons to keep the "Blue" theme cohesive but varied.
*   **Do** rely on the Typography Scale to move the user's eye, rather than using lines or arrows.

### Don't:
*   **Don't** use 1px solid borders to separate notes. Use white space (`Spacing 4` or `8`).
*   **Don't** use pure black (#000000) for text. Always use `on-surface` (#191c1d) for a softer, premium contrast.
*   **Don't** use standard "Material Blue." Stick strictly to the defined `primary` (#005bbf) which has a deeper, more professional "Ink" tone.