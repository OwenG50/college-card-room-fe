import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import GameSettingsForm from '../../components/GameSettingsForm/GameSettingsForm';
import { PokerGame } from '../../Types/PokerGame';
import GameSettingsDisplay from '../../components/GameSettingsDisplay/GameSettingsDisplay';
import SignalRService from '../../services/SignalRService';

function PokerGamePage() {
  const { gameId } = useParams<{ gameId: string }>();
  const [game, setGame] = useState<PokerGame | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!gameId) return;
    const fetchGame = async () => {
      setLoading(true);
      try {
        const response = await fetch(`http://localhost:5177/api/pokerGames/${gameId}`);
        if (response.ok) {
          const data = await response.json();
          setGame(data);
        }
      } catch (err) {
        // handle error if needed
      } finally {
        setLoading(false);
      }
    };
    fetchGame();
  }, [gameId]);

  // SignalR: Listen for game settings updates
  useEffect(() => {
    if (!gameId) return;
    const signalRService = SignalRService.getInstance();

    let joinedGroup = false;

    const setupSignalR = async () => {
      await signalRService.startConnection();
      await signalRService.joinGroup(gameId);
      joinedGroup = true;

      signalRService.on('UpdateGameSettings', (updatedGame: PokerGame) => {
        setGame(updatedGame);
      });
    };

    setupSignalR();

    return () => {
      if (joinedGroup) {
        signalRService.leaveGroup(gameId);
      }
      signalRService.off('UpdateGameSettings');
    };
  }, [gameId]);

  const handleSettingsUpdated = () => {
    // Re-fetch game data after settings update
    if (gameId) {
      fetch(`http://localhost:5177/api/pokerGames/${gameId}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => data && setGame(data));
    }
  };

  if (!gameId) return <div>No game ID provided.</div>;
  if (loading) return <div>Loading game...</div>;
  if (!game) return <div>Game not found.</div>;

  return (
    <div>
      <h1>Poker Game</h1>
      <p>Game ID: {gameId}</p>
      <GameSettingsForm
        gameId={gameId}
        initialSmallBlind={game.smallBlindAmount}
        initialBigBlind={game.bigBlindAmount}
        onSettingsUpdated={handleSettingsUpdated}
      />
      <GameSettingsDisplay game={game} />
      {/* Render other game details here */}
    </div>
  );
}

export default PokerGamePage;