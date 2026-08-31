# 🚇 Metro Rush — 3D Endless Runner Game

An original 3D pseudo-perspective endless runner game inspired by the mechanics of Subway Surfers, built with **HTML5 Canvas, Web Audio API, and Django (MVT + REST APIs)**.

---

## 🌟 Key Features

### 🏃 Core Gameplay Mechanics
- **3-Lane Track Switching**: Smooth snappy transitions between Left, Middle, and Right lanes.
- **Dynamic Obstacles**:
  - 🚧 **Low Hurdles**: Jump over with `W` / `Space` / `Swipe Up`.
  - ⚠️ **High Signs**: Slide / duck underneath with `S` / `Swipe Down`.
  - 🛑 **Block Walls**: Construction blockades requiring quick lane changes.
  - 🚆 **Static Subway Trains**: Parked trains with front ramps that let you jump onto and run along train rooftops.
  - 🚇 **Moving Oncoming Trains**: High speed oncoming trains with glowing dual headlights and loud horn blasts!
- **Power-Ups**:
  - 🧲 **Coin Magnet**: Auto-attracts all nearby coins with magnetic particle suction.
  - 🚀 **Rocket Jetpack**: Launches player into high flight above all obstacles with golden skyway coins.
  - 🛡️ **Energy Shield**: Absorbs 1 fatal obstacle crash with energy burst resonance.
  - ✖️ **2x Score Multiplier**: Doubles score accumulation.
  - 👟 **Super Sneakers**: High bouncy jumping power.
- **Procedural Track Generator**: Infinite procedural track segments with varied obstacle patterns, rainbow coin arches, neon tunnel rings, and city skyline.

### 🎵 Web Audio Sound Synthesizer (Zero External Dependencies)
- Real-time procedural audio synthesis using HTML5 Web Audio API:
  - Jump frequency sweeps, slide noise swishes, dual-tone crystal coin chimes, powerup arpeggios, train horns, and crash explosion noise bursts.
  - Dynamic Synthwave Background Music that scales in tempo with game speed!

### 🏗️ Django Backend Architecture
- **`apps/accounts`**: User registration, authentication, session state management.
- **`apps/players`**: Player profiles, character selection (Dash, Blaze, Cyber Ninja, Roxy), custom skin colorways, power-up upgrade shop.
- **`apps/game`**: Game sessions, run submission with anti-cheat verification heuristics, run telemetry.
- **`apps/leaderboard`**: All-Time, Weekly, and Daily global leaderboards.
- **`apps/missions`**: Daily challenges & career objectives with instant reward claiming.
- **`apps/achievements`**: Milestone trophy system with progress tracking and reward bonuses.
- **`apps/analytics`**: Gameplay telemetry and run metrics.

---

## 🎮 Controls

| Action | Keyboard | Touch / Mobile |
|---|---|---|
| **Move Left** | `A` or `← Left Arrow` | Swipe Left / Tap Left Button |
| **Move Right** | `D` or `→ Right Arrow` | Swipe Right / Tap Right Button |
| **Jump** | `W` or `↑ Up Arrow` or `Space` | Swipe Up / Tap Jump Button |
| **Slide / Duck** | `S` or `↓ Down Arrow` | Swipe Down / Tap Slide Button |
| **Pause / Resume**| `P` or `Esc` | Tap Pause (⏸️) Button |

---

## 🚀 Quickstart Guide

### 1. Setup & Migration
```powershell
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py seed_game_data
```

### 2. Run Test Suite
```powershell
python manage.py test
```

### 3. Start Development Server
```powershell
python manage.py runserver 8000
```
Open your browser at **`http://localhost:8000`** and start dashing!
