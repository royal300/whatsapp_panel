# Design System Specification: The Fluid Authority

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Fluid Authority."** 

In the crowded landscape of WhatsApp SaaS platforms, most tools feel like utilitarian spreadsheets. This design system breaks that template by blending the organic, approachable nature of conversational tech with the rigid precision of high-end enterprise software. We achieve this through **Intentional Asymmetry** and **Tonal Depth**. Instead of a standard 12-column rigid grid, we utilize expansive white space (breathing room) and overlapping surface layers to create a "Digital Editorial" feel. The interface should not feel like a website; it should feel like a premium, custom-tooled dashboard.

---

## 2. Color Strategy & Surface Architecture
We move beyond flat hex codes to a system of "Luminous Containers." 

### The "No-Line" Rule
**Strict Mandate:** Designers are prohibited from using 1px solid borders to define sections. Layout boundaries must be established solely through:
*   **Background Shifts:** e.g., A `surface-container-low` (#ebf5ff) section sitting on a `surface` (#f6f9ff) background.
*   **Tonal Transitions:** Using subtle variations in the surface palette to imply hierarchy.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers—like stacked sheets of frosted glass.
*   **Base:** `surface` (#f6f9ff)
*   **Secondary Content:** `surface-container-low` (#ebf5ff)
*   **Interactive Cards:** `surface-container-lowest` (#ffffff)
*   **Overlays/Modals:** `surface-container-high` (#e0e9f3)

### The Glass & Gradient Rule
To prevent a "generic" SaaS look, use **Glassmorphism** for floating elements (e.g., navigation sidebars or quick-action menus). 
*   **Implementation:** Use `surface` colors at 70% opacity with a `backdrop-blur` of 20px. 
*   **Signature Textures:** Main CTAs should not be flat. Apply a linear gradient from `primary` (#006d2f) to `primary-container` (#25d366) at a 135° angle to provide "visual soul."

---

## 3. Typography: Editorial Precision
The system pairs the geometric authority of **Plus Jakarta Sans** for high-impact display with the functional clarity of **Inter** for data-heavy tasks.

*   **Display & Headlines (Plus Jakarta Sans):** Used for "The Hook." High-contrast scaling (e.g., `display-lg` at 3.5rem) creates an editorial feel that commands attention.
*   **Body & Labels (Inter):** Used for "The Action." Optimized for readability at small scales (`body-md` 0.875rem).
*   **Tonal Hierarchy:** Use `on-surface-variant` (#3c4a3d) for secondary information to reduce cognitive load while maintaining a professional, muted green undertone.

---

## 4. Elevation & Depth
Hierarchy is achieved through **Tonal Layering** rather than traditional structural lines.

*   **The Layering Principle:** Place a `surface-container-lowest` card on a `surface-container-low` section. This creates a soft, natural lift that feels architectural rather than "pasted."
*   **Ambient Shadows:** For floating elements, use extra-diffused shadows. 
    *   *Values:* `0px 20px 40px rgba(20, 29, 36, 0.06)`. 
    *   Note the use of `on-surface` (#141d24) at 6% opacity rather than pure black to keep the shadow "organic."
*   **The "Ghost Border" Fallback:** If a container needs separation on a white background, use the `outline-variant` (#bbcbb9) at 20% opacity. 100% opaque borders are strictly forbidden.

---

## 5. Component Logic

### Buttons: The Tactile Interaction
*   **Primary:** Gradient of `primary` to `primary-container`. `lg` (0.5rem) roundedness. On hover: a subtle inner-glow effect and 2px lift.
*   **Secondary:** `secondary-container` (#8cf1e1) with `on-secondary-container` (#006f64) text. No border.
*   **Tertiary:** Ghost style. No background, only `on-surface` text.

### Sleek Input Fields
Input fields must feel "embedded" rather than "placed."
*   **Base State:** `surface-container-highest` (#dae3ee) background, no border.
*   **Focus State:** A 2px "Ghost Border" of `primary` at 40% opacity and a subtle backdrop shift to `surface-container-lowest`.
*   **Micro-interaction:** The label should float and shrink using `label-sm` (0.6875rem) when the field is active.

### Cards & Lists (The Divider-Free Approach)
*   **Forbid Divider Lines:** Separate list items using vertical white space (`spacing-4` or 1rem) or by alternating background tones between `surface-container-low` and `surface-container-lowest`.
*   **WhatsApp Context:** Conversation threads should use `surface-container-low` for "Read" states and `surface-container-lowest` with a `primary` left-accent bar for "Unread" states.

### Chips: The Status Indicators
*   **Action Chips:** High roundedness (`full`). Use `secondary-fixed` (#8ff4e3) backgrounds with `on-secondary-fixed` (#00201c) text for high legibility in the WhatsApp management context.

---

## 6. Do’s and Don’ts

### Do:
*   **Use the Spacing Scale religiously.** Layouts should feel mathematically consistent.
*   **Embrace white space.** If a section feels "busy," increase the padding to the next tier in the scale (e.g., from `spacing-8` to `spacing-12`).
*   **Use Tonal Shifts.** Always ask: "Can I separate these elements using a color shift instead of a line?"

### Don’t:
*   **Don't use pure black (#000000).** Use `on-surface` (#141d24) for text and shadows to maintain the professional green-tinted depth.
*   **Don't use "Out-of-the-box" Shadows.** Avoid high-contrast, tight shadows that look like 2010-era web design.
*   **Don't crowd the viewport.** This system is high-end; it should feel like a luxury car dashboard, not a cockpit. If it's too dense, it's not this design system.