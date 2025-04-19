import { Card } from './Card';
import { PokerPlayer } from './PokerPlayer';

export interface PokerGame {
  gameId: string;
  lobbyId: number;
  players: PokerPlayer[];
  bigBlind: PokerPlayer | null;
  smallBlind: PokerPlayer | null;
  dealer: PokerPlayer | null;
  deck: Card[];
  bigBlindAmount: number;
  smallBlindAmount: number;
  pot: number;
  isGameStarted: boolean;
  createdAt: string;
  gameUrl: string;
}