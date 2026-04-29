# Pipeline: The Undersea Maze

A browser-based underwater maze game. Guide your Octopus through the maze to navigate the depths and reach production!

[Play now!](https://pipeline.stevefenton.co.uk)

<img width="1920" height="1048" alt="An Octopus swimming through an underwater maze to collect tokens and avoid the angry jellyfish." src="https://github.com/user-attachments/assets/2ad9dd28-3905-4f2e-b1b0-527a7a8f0602" />

You'll encounter the jellyfish of hazards as you make your way through the maze. Try to avoid the hazards as your next DNS failure will send you back to the start. It will also increase your *change failure rate*. The goal is to score points with short *lead time for changes*, but can you achieve fast flow if you don't watch out for the hazards?

## Controls

Keyboard

- Arrow keys to move
- Space to use telescope

Touchscreen

- Touch to move (relative to center)
- Tap Octopus to use telescope

## Running locally

You can run the game easily on your local machine using `pnpm`.

1. Ensure you have Node.js and [pnpm](https://pnpm.io/) installed.
2. Install the project dependencies:

   ```bash
   pnpm install
   ```

3. Start the local development server:

   ```bash
   pnpm start
   ```

4. Open the local address provided in your terminal (usually `http://localhost:8080` or similar) in your web browser to play the game!

## Game internals

### High-level structure

```mermaid
flowchart TB
    subgraph host["Hosting"]
        serve["pnpm serve (static)"]
    end

    subgraph browser["Browser"]
        html["index.html"]
        css["styles.css"]
        svg["SVG #game-svg — maze, targets, player, effects"]
        module["game/game.js (ES module entry)"]
    end

    serve --> html
    html --> css
    html --> module
    html --> svg
    module -->|"reads/writes"| svg
```

### JavaScript modules

```mermaid
flowchart LR
    game["game.js\n(orchestrator, loop, UI, level logic)"]

    maze["maze.js\n(generateMaze)"]
    physics["physics.js\n(canMoveTo)"]
    sound["sound.js\n(AudioContext, SFX, music)"]
    notes["notes.js\n(note frequencies)"]
    effects["effects.js\n(bubbles)"]
    perf["perf-mode.js\n(auto + override)"]
    device["device.js\n(device heuristics)"]

    game --> maze
    game --> physics
    game --> sound
    game --> effects
    game --> perf
    sound --> notes
    effects --> perf
    perf --> device
```

### Runtime responsibilities

```mermaid
flowchart TB
    inputs["Input: keyboard / touch / perf chip"]
    gameLoop["game.js: requestAnimationFrame loop"]
    mazeGen["maze.js → maze grid"]
    collide["physics.js: wall collision"]
    audio["sound.js: Web Audio"]
    fx["effects.js: DOM bubble animations"]
    perfTier["perf-mode + device: low/high effects"]

    inputs --> gameLoop
    gameLoop --> mazeGen
    gameLoop --> collide
    gameLoop --> audio
    gameLoop --> fx
    perfTier --> gameLoop
    perfTier --> fx
```
