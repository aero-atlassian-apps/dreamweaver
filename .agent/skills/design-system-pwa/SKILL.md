---
name: design-system-pwa
description: >
  Use this skill when implementing UI components with premium aesthetics, ensuring PWA
  compliance (manifest, icons, service worker), creating responsive layouts for mobile/tablet/desktop,
  matching mockup specifications, or implementing sleep mode design adaptations.
  Triggers on: glassmorphism, dark mode, micro-animations, touch targets, safe areas, Lighthouse audit.
---

# Design System & PWA Skill

## 1. Zero Tolerance for "Basic" Design
The user expects a **premium, state-of-the-art** experience. "Default" or "MVP" styling is unacceptably low quality.

### 1.1 Aesthetic Requirements
- **Glassmorphism**: Use translucent backdrops (`backdrop-filter: blur()`) for modals, navbars, and cards.
- **Typography**: Use modern, sans-serif variable fonts (e.g., Inter, Outfit).
- **Micro-interactions**: Every button click, hover, and page transition MUST be animated. Use `framer-motion` for React.
- **Dark Mode**: Deep, rich dark backgrounds (e.g., `slate-900`, not just `#000`).

## 2. Mockup Fidelity
All designs MUST adhere strictly to the mockups located in:
`D:\rouca\DVM\workPlace\DreamWeaver\mockups`

- **Reference First**: Before coding a UI, check the mockups directory.
- **Precision**: Margins, padding, and colors should match the mockups exactly.
- **No Placeholders**: Never use grey boxes. Use `generate_image` or realistic dummy data.

## 3. Progressive Web App (PWA) Standards
The app must be installable and feel like a native app on mobile.

### 3.1 Essential Manifest Fields
- `short_name`, `name`, `start_url`
- `display: "standalone"`
- `background_color`, `theme_color` (Must match the dark mode palette)
- High-res icons (maskable: 192x192, 512x512)

### 3.2 Mobile-First Responsiveness
- **Touch Targets**: All interactive elements must be at least 44x44px.
- **Safe Areas**: Respect iOS notch and home indicator safe areas (`env(safe-area-inset-bottom)`).
- **Gestures**: Support swipe-to-go-back where appropriate.

## 4. Technology Stack Recommendations
- **Styling**: TailwindCSS is preferred for velocity, but use custom `tailwind.config.js` to define the "Premium" color palette.
- **Animations**: `framer-motion` (React) or vanilla CSS keyframes for simple effects.
- **Icons**: Lucide React or similar high-quality SVG sets.

## 5. Development Workflow
1.  **Analyze Mockup**: Identify components.
2.  **Define Tokens**: Colors, spacing, shadows.
3.  **Build Components**: Small, reusable, animated.
4.  **Assemble Page**: Ensure responsiveness.
5.  **Audit**: Check PWA scores (Lighthouse).

## 6. Agentic UI Components
The UI must surface the Agent's "thoughts" and "proactivity", not just display data.

### 6.1 Suggestion Cards
- **Visuals**: Use a "Thinking" glow/pulse animation (Violet/Green) when the agent is working.
- **Copy**: "Tonight I suggest..." rather than just a list.

### 6.2 Child Interaction
- **Big Tap Targets**: Child interactions (if any) must be massive and simple.
- **Visual Feedback**: The screen should react to voice input (e.g., a glowing waveform).

## 7. Sleep Mode Design
As the child falls asleep, the UI must adapt.

### 7.1 Dimming Strategy
- **Auto-Dim**: Reduce brightness and contrast as `sleepConfidence` increases.
- **Colors**: Shift from "Cool Blues" to "Deep Warm Greys/Blacks".
- **Blue Light**: Eliminate all blue light emission in Sleep Mode.

### 7.2 "Invisible" Interface
- In deep sleep mode, the screen should be effectively black (OLED friendly), showing perhaps only a very faint moon icon or nothing at all, while audio continues.

