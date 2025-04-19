import React from 'react';
import { useParams } from 'react-router-dom';

function PokerGame() {
  const { gameId } = useParams<{ gameId: string }>();

  return (
    <div>
      <h1>Poker Game</h1>
      <p>Game ID: {gameId}</p>
      {/* TODO: Fetch and display poker game data */}
    </div>
  );
}

export default PokerGame;