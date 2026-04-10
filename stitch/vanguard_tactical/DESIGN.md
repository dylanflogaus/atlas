# Design System Strategy: Tactical Command

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Digital Command Center."** 

Unlike generic political apps that feel like lightweight social platforms, this system is built for the high-stakes, rapid-response environment of field operations. It eschews "friendly" roundness for sharp, intentional geometry and moves beyond flat "template" layouts. We employ **Asymmetric Structuralism**—using heavy typographic weight and deep tonal layering to create a sense of authoritative urgency. The UI is not just a tool; it is a tactical briefing. 

We break the grid through overlapping map overlays and high-contrast "Command Headers" that anchor the user’s focus. The experience is designed to feel mission-critical, stable, and undeniably professional.

---

## 2. Colors: Tonal Depth & Tactical Logic
The palette is rooted in a high-contrast relationship between deep Navy and bold Red. 

*   **Primary (`#9e001f`):** The primary engine for action. Use this for high-priority CTAs and critical status indicators.
*   **Secondary (`#4e5d86`):** Used for tactical information and supporting navigation elements.
*   **Neutral/Background (`#f8f9fa`):** A clean, "paper-white" base that ensures high legibility in outdoor, direct-sunlight environments.

### The "No-Line" Rule
To achieve a high-end editorial feel, **1px solid borders are strictly prohibited** for sectioning. Boundaries must be defined through:
*   **Surface Shifts:** Placing a `surface-container-low` card on a `surface` background.
*   **Negative Space:** Using generous, intentional gaps to imply a boundary.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical, tactical layers. 
1.  **Base:** `surface` (The map or background).
2.  **Panels:** `surface-container-low` (General UI grouping).
3.  **Active Cards:** `surface-container-lowest` (Floating voter cards or active data points).
Nesting these tiers creates depth without visual clutter.

### The "Glass & Gradient" Rule
For floating map controls and persistent navigation, use **Glassmorphism**. Apply `surface-container-highest` with a 12px Backdrop Blur and 80% opacity. This prevents the UI from feeling "pasted on" the map, allowing geographic context to bleed through the edges of the tactical interface.

---

## 3. Typography: The Editorial Voice
We utilize a high-contrast scale to separate "Command" (Headings) from "Intel" (Body).

*   **The Command Scale (Public Sans):** Used for `display`, `headline`, and `title`. It is bold, uppercase-capable, and authoritative. It mirrors the feeling of a printed campaign poster or a military brief.
*   **The Intel Scale (Inter):** Used for `body` and `label`. Inter’s high x-height provides maximum readability for field staff scanning data while walking.

**Scale Highlights:**
*   **Display-LG (3.5rem):** Reserved for hero metrics (e.g., "48% Voted").
*   **Title-MD (1.125rem):** The standard for Voter Name headers on cards.
*   **Label-SM (0.6875rem):** Used for tactical metadata (e.g., "PRECINCT 402").

---

## 4. Elevation & Depth: Tonal Layering
Traditional drop shadows are too "web 2.0." This system uses **Ambient Tonal Layering**.

*   **The Layering Principle:** Soft lift is achieved by stacking. A `surface-container-lowest` card placed on a `surface-dim` background provides a natural "pop" that feels architectural rather than digital.
*   **Ambient Shadows:** If a floating action button (FAB) requires a shadow, use a large blur (24px) at 6% opacity, tinted with the `primary` color (`#9e001f`) to simulate natural light interacting with the brand color.
*   **The "Ghost Border" Fallback:** If accessibility requires a stroke, use `outline-variant` at 15% opacity. Never use a 100% opaque border.

---

## 5. Components: Tactical primitive styling

### Buttons (Tactical Actions)
*   **Primary:** Solid `primary` (`#9e001f`) with `on-primary` text. Use a subtle linear gradient from `primary` to `primary-container` to add "soul" and depth. Roundedness: `md` (0.375rem).
*   **Tertiary:** Transparent background with `primary` text. No border.

### Voter Cards
*   **Structure:** No dividers. Use `surface-container-low` backgrounds.
*   **Hierarchy:** Name in `title-md` (Inter). Support status in a high-contrast `label-md` chip.
*   **Spacing:** Use `0.75rem` (xl) internal padding to ensure touch targets are field-ready.

### Map Overlays & Overlays
*   **Glass Controls:** Floating map zoom and "locate me" buttons must use the `surface-container-highest` glass effect (80% opacity + blur). 
*   **Route Geometry:** Follow the reference image style—wide, high-contrast paths (using `tertiary`) with `full` rounded end-caps.

### Bottom Navigation Bar
*   **Style:** A "Command Dock." 
*   **Visuals:** Use `surface-container-lowest` with a top "Ghost Border" (10% `outline-variant`).
*   **Active State:** Avoid simple color changes. Use a small, `primary` color bar at the top of the active icon to signify the current "Mission Mode."

---

## 6. Do’s and Don’ts

### Do
*   **Do** use asymmetrical layouts for headers to create a custom, editorial feel.
*   **Do** leverage `surface-dim` for map backgrounds to make Red `primary` actions pop.
*   **Do** prioritize "Glanceable Data"—if a field worker can't read it while walking, the typography is too small.
*   **Do** use `secondary_container` for passive "Information" chips to distinguish them from "Action" chips.

### Don’t
*   **Don’t** use 1px black or grey borders. Use background shifts instead.
*   **Don’t** use standard "Material Design Blue" for links. Use the tactical `primary` red or `secondary` navy.
*   **Don’t** use high-radius corners (e.g., 20px+). Keep things sharp (`0.375rem` or `0.25rem`) to maintain a professional, "tool-not-toy" aesthetic.
*   **Don’t** use dividers in lists. Use vertical whitespace to separate voter entries.