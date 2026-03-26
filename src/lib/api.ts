import { GameRoom, LadyCard, PokerCard, PokerHand } from '../types';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  const payload = await response.json();

  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error ?? `Request failed: ${response.status}`);
  }

  return payload as T;
}

type RoomsResponse = {
  ok: true;
  rooms: GameRoom[];
};

type DiceRollResponse = {
  ok: true;
  rollId: string;
  results: number[];
  total: number;
};

type LadyDrawResponse = {
  ok: true;
  drawId: string;
  card: LadyCard;
};

type PokerJoinResponse = {
  ok: true;
  room: {
    code: string;
    name: string;
    players: number;
    maxPlayers: number;
    status: string;
  };
  playerName: string;
};

type PokerHandResponse = {
  ok: true;
  hand: PokerHand;
};

export const loungeApi = {
  getRooms: async () => {
    const data = await request<RoomsResponse>('/api/rooms');
    return data.rooms;
  },

  rollDice: async (diceCount: number, playerName = 'Guest') => {
    const data = await request<DiceRollResponse>('/api/dice-roll', {
      method: 'POST',
      body: JSON.stringify({ diceCount, playerName }),
    });

    return {
      id: data.rollId,
      results: data.results,
      total: data.total,
    };
  },

  drawLadyCard: async (playerName = 'Guest') => {
    const data = await request<LadyDrawResponse>('/api/lady-cards-draw', {
      method: 'POST',
      body: JSON.stringify({ playerName }),
    });

    return {
      id: data.drawId,
      card: data.card,
    };
  },

  joinPokerRoom: async (roomCode: string, playerName = 'Guest') => {
    return request<PokerJoinResponse>('/api/poker-join', {
      method: 'POST',
      body: JSON.stringify({ roomCode, playerName }),
    });
  },

  newPokerHand: async (roomCode: string, playerName = 'Guest') => {
    const data = await request<PokerHandResponse>('/api/poker-new-hand', {
      method: 'POST',
      body: JSON.stringify({ roomCode, playerName }),
    });

    return data.hand;
  },

  revealPoker: async (handId: string) => {
    const data = await request<PokerHandResponse>('/api/poker-reveal', {
      method: 'POST',
      body: JSON.stringify({ handId }),
    });

    return data.hand;
  },
};
