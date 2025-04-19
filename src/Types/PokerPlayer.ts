import { Card } from './Card';

export interface PokerPlayer {
  userId: number;
  userName: string;
  chipCount: number;
  seatNumber: number;
  currentHand: Card[];
  isFolded: boolean;
  isBigBlind: boolean;
  isSmallBlind: boolean;
  actions: string[];
  connectionId: string;
}