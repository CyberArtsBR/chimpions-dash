# CHIMPIONS DASH

Fan-made, dependency-free browser arcade runner featuring a lightweight built-in roster of 10 Chimpions. It runs entirely in the browser and stores settings, records, favorites, achievements, daily results, and best-run pace splits locally.

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
- `dist/audio.js` — gesture-gated Web Audio effects plus the looping background-music player and slide/dash loop.
- `dist/collection.json` — the authoritative 10-character built-in roster, with official names, IDs, portrait paths and tribes.
- `dist/assets/chimp-*.webp` — exactly ten locally cached portraits, used by the circular player-head crop and collection selector.

## Built-in roster and future custom characters

The selectable built-in roster is intentionally limited to: The Archon, The Heretic, The Commodore, The Pioneer, The Punk, The Street Fighter, The Bosun, The Adolescent, The Angsty, and The Apologetic. Random selection and favorites operate only on these ten entries. Saves that reference a removed selected character migrate to The Archon while historical run records remain intact.

The selector also exposes a disabled **UPLOAD YOUR 3D CHARACTER (GLB)** extension point. Dash remains a 2D Canvas game and does not ship a GLB parser or Three.js. The clean future approach is an opt-in, lazy-loaded conversion flow: only after the user chooses a GLB, dynamically load an isolated GLB renderer/parser, render a single head/helmet portrait to an offscreen canvas, convert it to WebP/PNG, persist that derived 2D portrait (for example in IndexedDB), dispose the temporary 3D scene, and feed the resulting image back through the existing `selected.image` contract. That keeps the normal game boot and deployment free of a heavy 3D runtime dependency.

## Gameplay systems

- Stage 1 remains at the base pace for its full first 30 seconds. A new stage starts every 30 active seconds and eases toward a soft-capped target speed.
- Data-driven short, tall, wide and overhead hazards are assembled by a seeded encounter director. Early low-hop/high-jump pairs use wider recovery timing.
- Sliding has a minimum useful duration, restores the compact ducking pose, and will not force the standing hitbox into an overhead hazard.
- Every active trap family and banana uses a dedicated transparent PNG in `assets/sprites-clean/`, with collider-sized fallbacks if an asset cannot load.
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
node asset-qa.mjs
```

The engine suite checks variable jump trajectories, takeoff/coyote and buffered-tap safety, slide clearance and safe exit, exact stage timing, speed easing/cap, wide and overhead patterns, shield invulnerability, single-award collection, deterministic seeds, equivalent 30–240 FPS simulation, and four automated ten-minute runs.

The UI suite checks legacy save migration, storage failure, collection failure, missing images, rejected audio, menus, collection search/favorites/random selection, the frozen UFO intro state, keyboard and pointer jump/slide controls, held-input release, pause/tab freezing, achievements, restart, persistence, canvas resize, and a loaded-image renderer smoke path. `asset-qa.mjs` verifies active hazard/collectible coverage, transparent PNG capability, required presentation assets, the exact 10-character portrait allowlist, absence of legacy head portraits/GLBs/Three.js runtime, music presence and renderer asset contracts. `prepare-deploy.mjs` copies `dist/` into a production `site/` directory and appends the commit SHA to module, CSS, collection, music and renderer-loaded asset URLs so a successful Pages deploy is not hidden behind stale browser caches.

Press the backtick key during a run to show development hitboxes. This is off by default and not shown in the public interface.

## Integrity

This project has no wallet, marketplace, purchase, ownership verification, paid advantage, backend, or online leaderboard. It links to the official gallery for collection context but does not depend on it during gameplay.
