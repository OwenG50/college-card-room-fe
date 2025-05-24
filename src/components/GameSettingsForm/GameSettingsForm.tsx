import React, { useState } from 'react';

interface GameSettingsFormProps {
  gameId: string;
  initialSmallBlind: number;
  initialBigBlind: number;
  onSettingsUpdated?: () => void;
}

const GameSettingsForm: React.FC<GameSettingsFormProps> = ({
  gameId,
  initialSmallBlind,
  initialBigBlind,
  onSettingsUpdated,
}) => {
  const [smallBlind, setSmallBlind] = useState(initialSmallBlind);
  const [bigBlind, setBigBlind] = useState(initialBigBlind);
  const [status, setStatus] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('Updating...');
    try {
      const response = await fetch(`http://localhost:5177/api/pokerGames/${gameId}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          smallBlindAmount: smallBlind,
          bigBlindAmount: bigBlind,
        }),
      });
      if (response.ok) {
        setStatus('Settings updated!');
        if (onSettingsUpdated) onSettingsUpdated();
      } else {
        const errorText = await response.text();
        setStatus(`Error: ${errorText}`);
      }
    } catch (err) {
      setStatus('Network error');
    }
  };

  const handleSetDealerAndBlinds = async () => {
    setStatus('Setting dealer and blinds...');
    try {
      const response = await fetch(`http://localhost:5177/api/pokerGames/${gameId}/setInitialDealerAndBlinds`, {
        method: 'POST',
      });
      if (response.ok) {
        setStatus('Dealer and blinds set!');
        if (onSettingsUpdated) onSettingsUpdated();
      } else {
        const errorText = await response.text();
        setStatus(`Error: ${errorText}`);
      }
    } catch (err) {
      setStatus('Network error');
    }
};

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>
          Small Blind:
          <input
            type="number"
            value={smallBlind}
            min={1}
            onChange={e => setSmallBlind(Number(e.target.value))}
          />
        </label>
      </div>
      <div>
        <label>
          Big Blind:
          <input
            type="number"
            value={bigBlind}
            min={1}
            onChange={e => setBigBlind(Number(e.target.value))}
          />
        </label>
      </div>
      <button type="submit">Update Settings</button>
      <button type="button" onClick={handleSetDealerAndBlinds}>
      Set Dealer and Blind Settings
      </button>
      <p>{status}</p>
    </form>
  );
};

export default GameSettingsForm;