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

  const raw = await response.text();
  let payload: any = null;

  try {
    payload = raw ? JSON.parse(raw) : null;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const fallbackMessage = raw && !raw.trim().startsWith('<')
      ? raw
      : `Request failed: ${response.status}`;
    throw new Error(`[${path}] ${payload?.error ?? fallbackMessage}`);
  }

  if (!payload?.ok) {
    throw new Error(`[${path}] ${payload?.error ?? 'Unexpected server response.'}`);
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
  isHost: boolean;
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

type PokerRoomStatusResponse = {
  ok: true;
  room: {
    code: string;
    name: string;
    players: number;
    maxPlayers: number;
    status: string;
  };
  hand: {
    id: string;
    playerCards: PokerCard[];
    communityCards: PokerCard[];
    revealStage: number;
    createdAt: string;
  } | null;
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
      body: JSON.stringify({ roomCode, playerName, createRoom: false }),
    });
  },

  createPokerRoom: async (roomCode: string, maxPlayers: number, playerName = 'Guest') => {
    return request<PokerJoinResponse>('/api/poker-join', {
      method: 'POST',
      body: JSON.stringify({ roomCode, playerName, createRoom: true, maxPlayers }),
    });
  },

  getPokerRoomStatus: async (roomCode: string) => {
    return request<PokerRoomStatusResponse>(`/api/poker-room-status?roomCode=${encodeURIComponent(roomCode)}`);
  },

  newPokerHand: async (roomCode: string, playerName = 'Guest', isHost = false) => {
    const data = await request<PokerHandResponse>('/api/poker-new-hand', {
      method: 'POST',
      body: JSON.stringify({ roomCode, playerName, isHost }),
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
