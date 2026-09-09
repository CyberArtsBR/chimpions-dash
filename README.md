# CHIMPIONS DASH

Fan-made, dependency-free browser arcade runner featuring the 221 characters from The Chimpions collection. It runs entirely in the browser and stores settings, records, favorites, achievements, daily results, and best-run pace splits locally.

## Play

Serve `dist/` over HTTP and open `index.html`.

- Jump: `Space`, `W`, `Arrow Up`, left click, right touch zone
- Slide: `Arrow Down`, `Shift`, `S`, `A`, right click, left touch zone
- Pause: `P`, `Esc`, or the pause button
- Tap jump for a low hop; hold for a high jump.

## Architecture

- `dist/engine.js` — deterministic 120 Hz simulation, player controller, staged speed curve, collision, encounter director, scoring, Flow, shield and seeded runs.
- `dist/render.js` — high-DPI 2D canvas renderer, animated body/NFT bubble composition, biome blending, parallax, terrain, hazards, weather and debug hitboxes.
- `dist/app.js` — UI state machine, input handling, collection UI, save migration, achievements, Daily Jungle, best-run pacing and share cards.
- `dist/audio.js` — gesture-gated procedural Web Audio effects, including monkey jump hoots.
- `dist/collection.json` — 221 unique official names, IDs, image paths and tribes cached on 2026-09-08. No pricing or ownership data.
- `dist/assets/chimp-*.webp` — locally cached NFT portraits used for the original circular player-head crop and collection selector.

## Gameplay systems

- Stage 1 remains at the base pace for its full first 30 seconds. A new stage starts every 30 active seconds and eases toward a soft-capped target speed.
- Data-driven short, tall, wide and overhead hazards are assembled by a seeded encounter director. Early low-hop/high-jump pairs use wider recovery timing.
- Sliding has a minimum useful duration, restores the compact ducking pose, and will not force the standing hitbox into an overhead hazard.
- Every trap family and banana uses the original 2D obstacle atlas, with visible fallbacks if an asset cannot load.
- The scenery, hazards and characters remain deliberately 2D, with a detailed high-resolution pixel-art grass foreground instead of a flat lower panel.
- Each NFT portrait is tightly cropped to the head inside a translucent glass helmet with a pixel-metal collar attached to the runner body.
- A short pre-run sequence brings the selected helmet down in a UFO claw, attaches it to the headless runner, then hands off to READY and the countdown without advancing gameplay time.
- Bananas, rare Golden Bananas, Perfect actions and Near Misses build Flow. Maximum Flow activates eight seconds of Chimpion Mode.
- Shields absorb one hit, resolve that hazard once, and grant brief invulnerability.
- Eight repeating biome treatments blend without loading screens; later stages add deterministic environmental events.
- Daily Jungle derives a deterministic seed from the UTC date. Results remain local.
- All Chimpions are mechanically identical.

## Validation

```sh
node engine-qa.mjs
node qa.cjs
```

The engine suite checks variable jump trajectories, takeoff/coyote and buffered-tap safety, slide clearance and safe exit, exact stage timing, speed easing/cap, wide and overhead patterns, shield invulnerability, single-award collection, deterministic seeds, equivalent 30–240 FPS simulation, and four automated ten-minute runs.

The UI suite checks legacy save migration, storage failure, collection failure, missing images, rejected audio, menus, collection search/favorites/random selection, the frozen UFO intro state, keyboard and pointer jump/slide controls, held-input release, pause/tab freezing, achievements, restart, persistence and canvas resize. The canvas is also rendered independently for art alignment inspection.

Press the backtick key during a run to show development hitboxes. This is off by default and not shown in the public interface.

## Integrity

This project has no wallet, marketplace, purchase, ownership verification, paid advantage, backend, or online leaderboard. It links to the official gallery for collection context but does not depend on it during gameplay.
