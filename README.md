# Ghost RPG - Web Edition 👻

A browser-based RPG where players hunt ghosts, complete quests, and collect achievements.

## Features

- **Combat System**: Battle various types of ghosts with different abilities
- **Location System**: Travel between different haunted locations
- **Inventory Management**: Collect and use items
- **Quest System**: Complete daily quests for rewards
- **Achievement System**: Earn achievements and special rewards
- **Shop System**: Buy items to help in your ghost hunting
- **Save System**: Automatic saving and manual save/load functionality

## Game Elements

### Locations
- Town (Safe haven, shopping)
- Haunted Forest (Beginner area)
- Abandoned Manor (Mid-level area)
- Ancient Cemetery (High-level area)

### Character Stats
- HP (Health Points)
- Mana (Magic Points)
- Strength
- Defense
- Experience Points
- Gold

### Items
- Health Potions
- Mana Potions
- Ghost Essence
- Spirit Shards
- Ancient Relics

### Special Features
- Daily quest reset system
- Achievement tracking
- Interactive tutorial for new players
- Collapsible UI panels
- Visual combat effects
- Smooth animations

## Technical Details

### Stack
- Frontend: HTML, CSS, JavaScript
- Backend: Python (Flask)
- Storage: LocalStorage for game state

### File Structure
- /static/js/
  - game.js (Core game mechanics)
  - main.js (Enhancement systems)
- /templates/
  - index.html (Main game interface)
- main.py (Server endpoints)

### Systems
1. **Combat System**
   - Turn-based battles
   - Multiple attack options
   - Enemy scaling

2. **Achievement System**
   - Progress tracking
   - Special rewards
   - Persistent storage

3. **Daily Quest System**
   - Daily reset mechanism
   - Various quest types
   - Reward distribution

4. **Tutorial System**
   - Step-by-step guidance
   - Interactive highlights
   - One-time completion

## Getting Started

1. Clone the repository
2. Install Python dependencies
3. Run main.py
4. Open browser to localhost:5000

## Development

To add new features:
1. Update relevant JavaScript files
2. Add new endpoints in main.py if needed
3. Update UI in index.html
4. Test thoroughly with different save states

## INFO / DISCLAIMER

- This REAMDE was made using AI