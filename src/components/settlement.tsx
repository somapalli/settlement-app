import React, { useState, useEffect } from 'react';
import './PacoSettlement.css';

interface Player {
  id: number;
  name: string;
  buyIn: number;
  additionalBuyIns: number[];
  totalBuyIn: number;
  payout: number;
}

interface Settlement {
  from: string;
  to: string;
  amount: number;
}

const PacoSettlementApp: React.FC = () => {
  // State management with TypeScript interfaces
  const [players, setPlayers] = useState<Player[]>([]);
  const [newPlayer, setNewPlayer] = useState({ name: '', buyIn: 0 });
  const [gameStarted, setGameStarted] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [error, setError] = useState('');

  // Constants
  const STORAGE_KEY = 'pacoGameState';
  const QUICK_BUY_IN_AMOUNTS = [10, 20];

  // Load saved game state
  useEffect(() => {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) {
      try {
        const { players, gameStarted, gameEnded, settlements } = JSON.parse(savedState);
        setPlayers(players);
        setGameStarted(gameStarted);
        setGameEnded(gameEnded);
        setSettlements(settlements || []);
      } catch (e) {
        console.error('Error loading saved game:', e);
      }
    }
  }, []);

  // Save game state
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      players,
      gameStarted,
      gameEnded,
      settlements
    }));
  }, [players, gameStarted, gameEnded, settlements]);

  // Handle adding a new player
  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedName = newPlayer.name.trim();
    if (!trimmedName) {
      setError('Please enter a player name');
      return;
    }
    if (newPlayer.buyIn <= 0) {
      setError('Buy-in amount must be greater than 0');
      return;
    }
    if (players.some(p => p.name.toLowerCase() === trimmedName.toLowerCase())) {
      setError('A player with this name already exists');
      return;
    }

    const newPlayerData: Player = {
      id: Date.now(),
      name: trimmedName,
      buyIn: parseFloat(newPlayer.buyIn.toFixed(2)),
      additionalBuyIns: [],
      totalBuyIn: parseFloat(newPlayer.buyIn.toFixed(2)),
      payout: 0
    };

    setPlayers(prev => [...prev, newPlayerData]);
    setNewPlayer({ name: '', buyIn: 0 });
  };

  // Handle quick buy-in amount selection
  const handleQuickBuyIn = (amount: number) => {
    setNewPlayer(prev => ({ ...prev, buyIn: prev.buyIn + amount }));
  };

  // Handle additional buy-in during game
  const handleAdditionalBuyIn = (playerId: number, amount: number) => {
    if (amount <= 0) {
      setError('Additional buy-in must be greater than 0');
      return;
    }

    setPlayers(prevPlayers => prevPlayers.map(player => {
      if (player.id === playerId) {
        const additionalBuyIns = [...player.additionalBuyIns, parseFloat(amount.toFixed(2))];
        const totalBuyIn = parseFloat((player.buyIn + additionalBuyIns.reduce((sum, buyIn) => sum + buyIn, 0)).toFixed(2));
        return { ...player, additionalBuyIns, totalBuyIn };
      }
      return player;
    }));
  };

  // Calculate total buy-ins
  const calculateTotalBuyIns = () => {
    return parseFloat(players.reduce((sum, p) => sum + p.totalBuyIn, 0).toFixed(2));
  };

  // Calculate total payouts
  const calculateTotalPayouts = () => {
    return parseFloat(players.reduce((sum, p) => sum + p.payout, 0).toFixed(2));
  };

  // Start the game
  const startGame = () => {
    if (players.length < 2) {
      setError('Need at least 2 players to start');
      return;
    }
    setGameStarted(true);
    setError('');
  };

  // Calculate settlements
  const calculateSettlements = () => {
    const totalBuyIn = calculateTotalBuyIns();
    const totalPayout = calculateTotalPayouts();

    if (Math.abs(totalPayout - totalBuyIn) > 0.01) {
      setError(`Total payouts (${totalPayout.toFixed(2)}) must equal total buy-ins (${totalBuyIn.toFixed(2)})`);
      return;
    }

    let debts: { id: number; name: string; amount: number }[] = [];
    let credits: { id: number; name: string; amount: number }[] = [];

    players.forEach(player => {
      const netResult = parseFloat((player.payout - player.totalBuyIn).toFixed(2));
      if (netResult < 0) {
        debts.push({ id: player.id, name: player.name, amount: Math.abs(netResult) });
      } else if (netResult > 0) {
        credits.push({ id: player.id, name: player.name, amount: netResult });
      }
    });

    // Sort by amount (largest first)
    debts.sort((a, b) => b.amount - a.amount);
    credits.sort((a, b) => b.amount - a.amount);

    const transactions: Settlement[] = [];

    while (debts.length > 0 && credits.length > 0) {
      const debt = debts[0];
      const credit = credits[0];
      const amount = parseFloat(Math.min(debt.amount, credit.amount).toFixed(2));

      transactions.push({ from: debt.name, to: credit.name, amount });

      debt.amount = parseFloat((debt.amount - amount).toFixed(2));
      credit.amount = parseFloat((credit.amount - amount).toFixed(2));

      if (debt.amount < 0.01) debts.shift();
      if (credit.amount < 0.01) credits.shift();
    }

    setSettlements(transactions);
    setGameEnded(true);
    setError('');
  };

  // Update player payout
  const handlePayout = (playerId: number, amount: string) => {
    setPlayers(prevPlayers => prevPlayers.map(player => {
      if (player.id === playerId) {
        return { ...player, payout: parseFloat(amount) || 0 };
      }
      return player;
    }));
  };

  // Reset game
  const resetGame = () => {
    if (window.confirm('Are you sure you want to reset the game? All data will be lost.')) {
      setPlayers([]);
      setNewPlayer({ name: '', buyIn: 0 });
      setGameStarted(false);
      setGameEnded(false);
      setSettlements([]);
      setError('');
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  return (
    <div className="paco-settlement">
      <h1>PACO Settlement App</h1>
      {error && <div className="error-message">{error}</div>}

      <div className={`game-container ${gameEnded ? 'game-ended' : ''}`}>
        {/* Player Form - Always visible until game ends */}
        {!gameEnded && (
          <div className="player-form">
            <h2>{gameStarted ? 'Add New Player' : 'Add Player'}</h2>
            <form onSubmit={handleAddPlayer}>
              <input
                type="text"
                placeholder="Player Name"
                value={newPlayer.name}
                onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
                className="input-field"
              />
              <div className="buy-in-section">
                <div className="buy-in-input">
                  <span className="currency">$</span>
                  <input
                    type="number"
                    placeholder="Buy-in Amount"
                    value={newPlayer.buyIn || ''}
                    onChange={(e) => setNewPlayer({ ...newPlayer, buyIn: Math.max(0, parseFloat(e.target.value) || 0) })}
                    min="0"
                    step="10"
                    className="input-field"
                  />
                </div>
                <div className="quick-amounts">
                  {QUICK_BUY_IN_AMOUNTS.map(amount => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => handleQuickBuyIn(amount)}
                      className="quick-amount-btn"
                    >
                      +${amount}
                    </button>
                  ))}
                </div>
              </div>
              <button type="submit" className="primary-button">
                {gameStarted ? 'Add New Player' : 'Add Player'}
              </button>
            </form>
          </div>
        )}

        {/* Players List and Game Controls */}
        {players.length > 0 && !gameStarted && (
          <div className="players-table">
            <h2>Current Players</h2>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Buy-in</th>
                </tr>
              </thead>
              <tbody>
                {players.map(player => (
                  <tr key={player.id}>
                    <td>{player.name}</td>
                    <td>${player.buyIn.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="total-row">
                  <td><strong>Total</strong></td>
                  <td><strong>${players.reduce((sum, p) => sum + p.buyIn, 0).toFixed(2)}</strong></td>
                </tr>
              </tfoot>
            </table>
            {players.length >= 2 && (
              <button onClick={startGame} className="start-game">Start Game</button>
            )}
          </div>
        )}

        {gameStarted && !gameEnded && (
          <div className="game-section">
            <div className="total-pot-display">
              <h3>Current Pot</h3>
              <div className="pot-amount">
                ${players.reduce((sum, p) => sum + p.totalBuyIn, 0).toFixed(2)}
              </div>
            </div>

            <div className="players-status">
              <h2>Current Players</h2>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Initial Buy-in</th>
                    <th>Total Buy-in</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {players.map(player => (
                    <tr key={player.id}>
                      <td>{player.name}</td>
                      <td>${player.buyIn.toFixed(2)}</td>
                      <td>${player.totalBuyIn.toFixed(2)}</td>
                      <td className="actions">
                        {QUICK_BUY_IN_AMOUNTS.map(amount => (
                          <button
                            key={amount}
                            onClick={() => handleAdditionalBuyIn(player.id, amount)}
                            className="quick-amount-btn"
                          >
                            +${amount}
                          </button>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="total-row">
                    <td colSpan={2}><strong>Total Pot</strong></td>
                    <td colSpan={2}><strong>${players.reduce((sum, p) => sum + p.totalBuyIn, 0).toFixed(2)}</strong></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="payout-section">
              <h2>Enter Final Amounts</h2>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Total Buy-in</th>
                    <th>Final Amount</th>
                    <th>Net Profit/Loss</th>
                  </tr>
                </thead>
                <tbody>
                  {players.map(player => (
                    <tr key={player.id}>
                      <td>{player.name}</td>
                      <td>${player.totalBuyIn.toFixed(2)}</td>
                      <td>
                        <input
                          type="number"
                          value={player.payout || ''}
                          onChange={(e) => handlePayout(player.id, e.target.value)}
                          placeholder="Enter amount"
                          min="0"
                          step="10"
                          className="payout-input"
                        />
                      </td>
                      <td className={player.payout - player.totalBuyIn > 0 ? 'profit' : 'loss'}>
                        ${(player.payout - player.totalBuyIn).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="total-row">
                    <td><strong>Totals</strong></td>
                    <td><strong>${players.reduce((sum, p) => sum + p.totalBuyIn, 0).toFixed(2)}</strong></td>
                    <td><strong>${players.reduce((sum, p) => sum + p.payout, 0).toFixed(2)}</strong></td>
                    <td><strong>${(players.reduce((sum, p) => sum + p.payout, 0) - 
                                 players.reduce((sum, p) => sum + p.totalBuyIn, 0)).toFixed(2)}</strong></td>
                  </tr>
                </tfoot>
              </table>
              <div className="button-group">
                <button onClick={calculateSettlements} className="primary-button">Calculate Settlements</button>
                <button onClick={resetGame} className="secondary-button">Reset Game</button>
              </div>
            </div>
          </div>
        )}

        {gameEnded && (
          <div className="settlement-section">
            <div className="total-pot-display final sticky">
              <h3>Final Pot</h3>
              <div className="pot-amount">
                ${players.reduce((sum, p) => sum + p.totalBuyIn, 0).toFixed(2)}
              </div>
            </div>

            <div className="settlement-summary">
              <div className="summary-item">
                <span>Total Buy-ins:</span>
                <span className="amount">${players.reduce((sum, p) => sum + p.totalBuyIn, 0).toFixed(2)}</span>
              </div>
              <div className="summary-item">
                <span>Total Payouts:</span>
                <span className="amount">${players.reduce((sum, p) => sum + p.payout, 0).toFixed(2)}</span>
              </div>
            </div>

            <div className="settlement-details">
              <h2>Final Settlements</h2>
              <table>
                <thead>
                  <tr>
                    <th>Player</th>
                    <th>Buy-in</th>
                    <th>Payout</th>
                    <th>Net Result</th>
                  </tr>
                </thead>
                <tbody>
                  {players.map(player => (
                    <tr key={player.id}>
                      <td>{player.name}</td>
                      <td>${player.totalBuyIn.toFixed(2)}</td>
                      <td>${player.payout.toFixed(2)}</td>
                      <td className={player.payout - player.totalBuyIn > 0 ? 'profit' : 'loss'}>
                        ${(player.payout - player.totalBuyIn).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="total-row">
                    <td><strong>Totals</strong></td>
                    <td><strong>${players.reduce((sum, p) => sum + p.totalBuyIn, 0).toFixed(2)}</strong></td>
                    <td><strong>${players.reduce((sum, p) => sum + p.payout, 0).toFixed(2)}</strong></td>
                    <td><strong>${(players.reduce((sum, p) => sum + p.payout, 0) - 
                                 players.reduce((sum, p) => sum + p.totalBuyIn, 0)).toFixed(2)}</strong></td>
                  </tr>
                </tfoot>
              </table>

              <div className="settlement-results">
                <h3>Settlement Transactions</h3>
                {settlements.length > 0 ? (
                  <table>
                    <thead>
                      <tr>
                        <th>From</th>
                        <th>To</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {settlements.map((settlement, index) => (
                        <tr key={index}>
                          <td>{settlement.from}</td>
                          <td>{settlement.to}</td>
                          <td>${settlement.amount.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p>No settlements needed. Everyone broke even!</p>
                )}
              </div>

              <button onClick={resetGame} className="new-game">Start New Game</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PacoSettlementApp;
