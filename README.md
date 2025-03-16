# PACO Settlement App

A React-based settlement calculator for managing buy-ins and payouts in group games.

## Features

- Add and manage players with buy-ins
- Track additional buy-ins during the game
- Calculate final settlements automatically
- Persistent storage of game state
- Responsive design for mobile and desktop
- Quick buy-in buttons ($10, $20)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/settlement-app.git
cd settlement-app
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The app will be available at http://localhost:3000

## Usage

1. **Adding Players**
   - Enter player name and buy-in amount
   - Use quick buy-in buttons for common amounts
   - Add at least 2 players to start the game

2. **During the Game**
   - Track additional buy-ins for each player
   - Current pot size is always visible
   - Add new players at any time

3. **Settlement**
   - Enter final amounts for each player
   - System automatically calculates settlements
   - View detailed transaction list for settling up

## Technologies Used

- React
- TypeScript
- Local Storage for persistence
- CSS3 with Flexbox/Grid

## Development

To run tests:
```bash
npm test
```

To build for production:
```bash
npm run build
```

## License

MIT License - feel free to use and modify for your own purposes.
