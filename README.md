# Fruit Merge (HTML5)

Vertical, mobile-first canvas game inspired by Suika. Features physics-based fruit merging, combo system, particle effects, progressive difficulty, rules and stats screens, pause, and persistent local stats.

## Run locally

- Use any static server. Examples:

```bash
# Python 3
python3 -m http.server 5173

# Or Node
npx serve . -l 5173
```

Open http://localhost:5173 in a mobile browser or responsive device emulator.

## Controls
- Drag horizontally at the top and release to drop the fruit
- Tap the pause button to pause
- Keyboard: arrows/space on desktop

## Tech
- HTML5 Canvas, ES Modules
- No dependencies
- Audio via WebAudio API

## Notes
- Stats stored in localStorage
- Designed for 9:16 portrait, auto-scaled