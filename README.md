# PixelForge

A fast, modular, vanilla TypeScript photo editor with layers, tools, filters, tabbed projects, export and theme toggle.

Repository: https://github.com/muhammad-fiaz/PixelForge

Quick start

Clone the repo and run the dev server:

```powershell
git clone https://github.com/muhammad-fiaz/PixelForge.git
cd PixelForge
npm install
npm run dev
```

Notes: the project uses Vite and TypeScript. If you use Bun you can run `bun run dev` or `bunx vite` per your environment.

Assumptions:

- Runs fully in the browser with HTML5 Canvas, no server required.
- TIFF/BMP export falls back to browser-supported encoders (PNG when unavailable).
- Fonts available depend on the OS/browser; add webfonts if needed.

Features implemented:

- Tabs with multiple projects; Save Current, Save All (JSON project files)
- Import images (PNG/JPEG/BMP/WEBP via browser support)
- Layer manager: add/toggle/opacity, merge-down, active selection
- Tools: Move, Brush, Eraser, Picker, Zoom (wheel), Crop, Text, Shapes (Rect/Ellipse/Line)
- Filters: Grayscale (B/W), Sepia, Invert, Blur, Sharpen, Contrast, Brightness, Hue
- Export: PNG, JPEG; BMP/TIFF/SVG best-effort
- Responsive UI, Lucide icons, GSAP intro animations
- Theme toggle (light default)

Run:

- Dev: `npm run dev` (or `bun run dev` / `bunx vite`)
- Build: `npm run build`
- Preview: `npm run preview`

Structure:

- src/types: data models
- src/core: render engine and app store
- src/layers: layer factory and manager
- src/tools: all tools
- src/filters: image filters
- src/file: import/export and serialization
- src/ui: UI composition and event wiring
