import { buildPokerHand } from './_lib/games';
import { handleApiError, methodNotAllowed, parseJsonBody, sendJson } from './_lib/http';

type NewHandBody = {
  roomCode?: string;
  playerName?: string;
  isHost?: boolean;
};

const ROOM_CODE_REGEX = /^\d{4}$/;

type RoomRow = {
  id: string;
  room_code: string;
  players: number;
  max_players: number;
  status: string;
  game_type: string;
};

type HandRow = {
  id: string;
  room_code: string;
  player_name: string;
  player_cards: unknown;
  all_community_cards: unknown;
  community_cards: unknown;
  reveal_stage: number;
  created_at: string;
};

function supabaseHeaders(apiKey: string) {
  return {
    apikey: apiKey,
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
}

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== 'POST') {
      return methodNotAllowed(req, res, ['POST']);
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return sendJson(res, 500, { ok: false, error: 'Missing Supabase environment variables.' });
    }

    const body = await parseJsonBody<NewHandBody>(req);
    const roomCode = String(body.roomCode ?? '').trim();
    const isHost = Boolean(body.isHost);

    if (!ROOM_CODE_REGEX.test(roomCode)) {
      return sendJson(res, 400, { ok: false, error: 'roomCode must be 4 digits.' });
    }

    if (!isHost) {
      return sendJson(res, 403, { ok: false, error: 'Only host can start the game.' });
    }

    const roomRes = await fetch(
      `${supabaseUrl}/rest/v1/game_rooms?room_code=eq.${encodeURIComponent(roomCode)}&select=id,room_code,players,max_players,status,game_type`,
      { headers: supabaseHeaders(serviceKey) },
    );

    if (!roomRes.ok) {
      return sendJson(res, 500, { ok: false, error: await roomRes.text() });
    }

    const roomRows = (await roomRes.json()) as RoomRow[];
    const room = roomRows[0];

    if (!room) {
      return sendJson(res, 404, { ok: false, error: 'Room not found.' });
    }

    if (room.game_type !== 'POKER') {
      return sendJson(res, 400, { ok: false, error: 'Invalid room type.' });
    }

    if (room.players < room.max_players) {
      return sendJson(res, 400, { ok: false, error: 'Room is not full yet.' });
    }

    if (room.status === 'active') {
      const activeHandRes = await fetch(
        `${supabaseUrl}/rest/v1/poker_hands?room_code=eq.${encodeURIComponent(roomCode)}&select=id,room_code,player_name,player_cards,all_community_cards,community_cards,reveal_stage,created_at&order=created_at.desc&limit=1`,
        { headers: supabaseHeaders(serviceKey) },
      );

      if (!activeHandRes.ok) {
        return sendJson(res, 500, { ok: false, error: await activeHandRes.text() });
      }

      const activeRows = (await activeHandRes.json()) as HandRow[];
      const activeHand = activeRows[0];

      if (activeHand) {
        return sendJson(res, 200, {
          ok: true,
          hand: {
            id: activeHand.id,
            roomCode: activeHand.room_code,
            playerName: activeHand.player_name,
            playerCards: activeHand.player_cards,
            allCommunityCards: activeHand.all_community_cards,
            communityCards: activeHand.community_cards,
            revealStage: activeHand.reveal_stage,
            createdAt: activeHand.created_at,
          },
        });
      }
    }

    const hand = buildPokerHand();

    const createHandRes = await fetch(`${supabaseUrl}/rest/v1/poker_hands`, {
      method: 'POST',
      headers: {
        ...supabaseHeaders(serviceKey),
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        room_code: roomCode,
        player_name: body.playerName ?? 'Host',
        player_cards: hand.playerCards,
        all_community_cards: hand.allCommunityCards,
        community_cards: hand.communityCards,
        reveal_stage: hand.revealStage,
      }),
    });

    if (!createHandRes.ok) {
      return sendJson(res, 500, { ok: false, error: await createHandRes.text() });
    }

    const handRows = (await createHandRes.json()) as HandRow[];
    const data = handRows[0];

    if (!data) {
      return sendJson(res, 500, { ok: false, error: 'Failed to create poker hand.' });
    }

    const updateRoomRes = await fetch(`${supabaseUrl}/rest/v1/game_rooms?id=eq.${encodeURIComponent(room.id)}`, {
      method: 'PATCH',
      headers: {
        ...supabaseHeaders(serviceKey),
      },
      body: JSON.stringify({ status: 'active' }),
    });

    if (!updateRoomRes.ok) {
      return sendJson(res, 500, { ok: false, error: await updateRoomRes.text() });
    }

    return sendJson(res, 200, {
      ok: true,
      hand: {
        id: data.id,
        roomCode: data.room_code,
        playerName: data.player_name,
        playerCards: data.player_cards,
        allCommunityCards: data.all_community_cards,
        communityCards: data.community_cards,
        revealStage: data.reveal_stage,
        createdAt: data.created_at,
      },
    });
  } catch (error) {
    return handleApiError(res, error);
  }
}
