# Architecture

## Goal

The `/game` directory contains loosely coupled JavaScript modules. Each module contains code that is likely to change for the same reasons, making the codebase easier to understand, test, and maintain.

## Modules

| Module | Purpose |
|--------|---------|
| `game.js` | Main entry point. Orchestrates game loop, coordinates other modules, and handles game-specific logic (targets, UI, level progression). |
| `maze.js` | Maze generation using recursive backtracker algorithm. Pure data - takes dimensions, returns maze structure. |
| `physics.js` | Collision detection. Determines if a player can move to a given position based on maze walls. |
| `sound.js` | Audio playback. Handles AudioContext, sound effects (swoosh, victory fanfare), and background music. |
| `effects.js` | Visual effects. Creates and manages bubble animations. |
| `notes.js` | Musical note frequency constants. |
