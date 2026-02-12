# Newspaper Flipbook (Pages 1-4)

Small self-contained flipbook experience with premium page-turn motion, touch/drag support, and a zoomable lightbox.

## Features
- Four image pages rendered with `background-size: contain` (no cropping)
- Premium single-page turn animation with dynamic lighting and shadow
- Edge-reveal affordances: move near left/right edges to reveal chevron hints
- One-time first-visit coach hint (`db_coach_seen`) to suggest turning right
- Controls rail with prev/next, caption, and clickable progress marks
- Help popover (`?`) in header instead of persistent instruction text
- Lightbox with page navigation and zoom
- Open lightbox: double-click (mouse) or center double-tap (touch/pen)
- Close lightbox: backdrop, close button, or `Escape`
- Toggle zoom in lightbox: double-click/double-tap
- Keyboard (viewer): `ArrowLeft`, `ArrowRight`, `PageUp`, `PageDown`, `Space`, `Home`, `End`
- Keyboard (lightbox): `Escape`, arrows, `PageUp/PageDown`, `Home/End`, `Z`
- Responsive layout tuned for desktop and mobile

## Project files
- `index.html` - structure, controls, help popover, lightbox markup
- `styles.css` - visual system, rail UI, affordances, responsive rules
- `app.js` - flip animation/lighting, gestures, keyboard, lightbox, coach hint
- `assets/pages/page-1.jpg` ... `assets/pages/page-4.jpg` - page assets

## Run locally
- Quick open: double-click `index.html`
- Recommended server:
- `python -m http.server 8000`
- Open `http://localhost:8000`
