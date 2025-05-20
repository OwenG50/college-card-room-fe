import React from 'react';
import { PokerGame } from '../../Types/PokerGame';
import './GameSettingsDisplay.css';

interface GameSettingsDisplayProps {
  game: PokerGame;
}

  // gameId: string;
  // lobbyId: number;
  // players: PokerPlayer[];
  // bigBlind: PokerPlayer | null;
  // smallBlind: PokerPlayer | null;
  // dealer: PokerPlayer | null;
  // deck: Card[];
  // bigBlindAmount: number;
  // smallBlindAmount: number;
  // pot: number;
  // isGameStarted: boolean;
  // createdAt: string;
  // gameUrl: string;

const GameSettingsDisplay: React.FC<GameSettingsDisplayProps> = ({ game }) => (
  <div className="game-settings-display">
    <h2>Game Settings</h2>
    <ul className="game-settings-list">
      <li>
        <strong>Game Started:</strong> {game.isGameStarted ? 'Yes' : 'No'}
      </li>
      <li>
        <strong>Small Blind:</strong> {game.smallBlindAmount}
      </li>
      <li>
        <strong>Big Blind:</strong> {game.bigBlindAmount}
      </li>
      <li>
        <strong>Dealer:</strong> {game.dealer?.userName || 'N/A'}
      </li>
      <li>
        <strong>Small Blind Player:</strong> {game.smallBlind?.userName || 'N/A'}
      </li>
      <li>
        <strong>Big Blind Player:</strong> {game.bigBlind?.userName || 'N/A'}
      </li>
      <li>
        <strong>Pot:</strong> {game.pot}
      </li>
      <li>
        <strong>Created At:</strong> {new Date(game.createdAt).toLocaleString()}
      </li>
    </ul>
  </div>
);

export default GameSettingsDisplay;