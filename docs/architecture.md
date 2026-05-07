# Architecture

## Goal

The `/game` directory contains loosely coupled JavaScript modules. Each module contains code that is likely to change for the same reasons, making the codebase easier to understand, test, and maintain.

## Modules

| Module         | Purpose                                                                                                                                                          |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `game.js`      | Main entry point. Orchestrates the game loop, coordinates other modules, and owns targets, hazards (jellyfish), shark shadows, scoring, DORA metrics, and UI. |
| `maze.js`      | Maze generation using recursive backtracker algorithm. Pure data — takes dimensions, returns maze structure.                                                      |
| `physics.js`   | Collision detection. Determines if a player can move to a given position based on maze walls.                                                                     |
| `sound.js`     | Audio playback. Handles AudioContext, sound effects (swoosh, victory fanfare), and background music.                                                              |
| `effects.js`   | Visual effects. Creates and manages bubble animations with adaptive counts and sizes based on device performance.                                                 |
| `notes.js`     | Musical note frequency constants.                                                                                                                                 |
| `device.js`    | Device capability detection. Combines hardware heuristics, a synchronous canvas benchmark, and rAF frame-budget sampling to classify devices as low or high performance. |
| `perf-mode.js` | Performance mode management. Merges the `device.js` benchmark result with a user override (`auto` / `full` / `reduced`) persisted in localStorage.                |
