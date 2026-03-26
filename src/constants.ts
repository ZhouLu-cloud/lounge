import { GameRoom } from "./types";

export const ROOMS: GameRoom[] = [
  {
    id: '1',
    name: 'Royal Flush Lounge',
    type: 'POKER',
    players: 6,
    maxPlayers: 9,
    stakes: '50 / 100',
    minBuyIn: 5000,
    status: 'active'
  },
  {
    id: '2',
    name: 'Midnight Blue',
    type: 'POKER',
    players: 4,
    maxPlayers: 9,
    stakes: '10 / 20',
    minBuyIn: 400,
    status: 'active'
  },
  {
    id: '3',
    name: 'Velvet Lounge',
    type: 'POKER',
    players: 7,
    maxPlayers: 9,
    stakes: '25 / 50',
    minBuyIn: 1000,
    status: 'active'
  },
  {
    id: '4',
    name: 'High Stakes Table',
    type: 'DICE',
    players: 5,
    maxPlayers: 8,
    status: 'active',
    chineseName: '摇骰子'
  },
  {
    id: '5',
    name: 'Lady Cards',
    type: 'LADY_CARDS',
    players: 2,
    maxPlayers: 4,
    status: 'active',
    chineseName: '小姐牌'
  }
];
