export type GameType = 'LOBBY' | 'DICE' | 'POKER' | 'LADY_CARDS';

export interface Player {
  id: string;
  name: string;
  avatar: string;
  credits: number;
}

export interface GameRoom {
  id: string;
  name: string;
  type: GameType;
  players: number;
  maxPlayers: number;
  minBuyIn?: number;
  stakes?: string;
  status: 'active' | 'full' | 'waiting';
  chineseName?: string;
}

export interface PokerCard {
  v: string;
  s: string;
  c: 'text-error' | 'text-on-surface';
}

export interface PokerHand {
  id: string;
  roomCode: string;
  playerName: string;
  playerCards: PokerCard[];
  allCommunityCards: PokerCard[];
  communityCards: PokerCard[];
  revealStage: number;
  createdAt: string;
}

export interface LadyCard {
  v: string;
  s: {
    name: string;
    icon: string;
    color: 'text-error' | 'text-on-surface';
  };
  rule: string;
  icon: string;
  name: string;
}
