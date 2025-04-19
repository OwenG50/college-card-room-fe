export interface Card {
    suit: string;
    rank: string;
  }
  
  export function cardToString(card: Card): string {
    return `${card.rank} of ${card.suit}`;
  }