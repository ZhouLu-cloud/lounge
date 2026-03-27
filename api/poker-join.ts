import { getSupabaseAdmin } from './_lib/supabase';
import { handleApiError, methodNotAllowed, parseJsonBody, sendJson } from './_lib/http';

type JoinBody = {
  roomCode?: string;
  playerName?: string;
  createRoom?: boolean;
  maxPlayers?: number;
};

const ROOM_CODE_REGEX = /^\d{4}$/;

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== 'POST') {
      return methodNotAllowed(req, res, ['POST']);
    }

    const body = await parseJsonBody<JoinBody>(req);
    const roomCode = (body.roomCode ?? '').trim();
    const createRoom = Boolean(body.createRoom);
    const requestedMaxPlayers = Number(body.maxPlayers ?? 6);

    if (!ROOM_CODE_REGEX.test(roomCode)) {
      return sendJson(res, 400, { ok: false, error: 'roomCode must be 4 digits.' });
    }

    if (createRoom && (!Number.isInteger(requestedMaxPlayers) || requestedMaxPlayers < 2 || requestedMaxPlayers > 10)) {
      return sendJson(res, 400, { ok: false, error: 'maxPlayers must be an integer between 2 and 10.' });
    }

    const supabase = getSupabaseAdmin() as any;
    const { data: existingRoom, error: fetchError } = await supabase
      .from('game_rooms')
      .select('id, room_code, game_type, players, max_players, name, status')
      .eq('room_code', roomCode)
      .maybeSingle();

    if (fetchError) {
      throw fetchError;
    }

    if (createRoom && existingRoom) {
      if (existingRoom.game_type !== 'POKER') {
        return sendJson(res, 400, { ok: false, error: 'This room code is used by another game type.' });
      }

      return sendJson(res, 200, {
        ok: true,
        isHost: true,
        room: {
          code: existingRoom.room_code,
          name: existingRoom.name,
          players: existingRoom.players,
          maxPlayers: existingRoom.max_players,
          status: existingRoom.status,
        },
        playerName: body.playerName ?? 'Host',
      });
    }

    if (!createRoom && !existingRoom) {
      return sendJson(res, 404, { ok: false, error: 'Room not found. Host must create this room first.' });
    }

    if (!existingRoom && createRoom) {
      const { data: createdRoom, error: createError } = await supabase
        .from('game_rooms')
        .insert({
          room_code: roomCode,
          name: `Poker Room ${roomCode}`,
          game_type: 'POKER',
          players: 1,
          max_players: requestedMaxPlayers,
          status: 'waiting',
        })
        .select('id, room_code, game_type, players, max_players, name, status')
        .single();

      if (createError) {
        throw createError;
      }

      if (!createdRoom) {
        throw new Error('Failed to create room.');
      }

      return sendJson(res, 200, {
        ok: true,
        isHost: true,
        room: {
          code: createdRoom.room_code,
          name: createdRoom.name,
          players: createdRoom.players,
          maxPlayers: createdRoom.max_players,
          status: createdRoom.status,
        },
        playerName: body.playerName ?? 'Guest',
      });
    }

    if (!existingRoom) {
      return sendJson(res, 500, { ok: false, error: 'Room lookup failed.' });
    }

    if (existingRoom.game_type !== 'POKER') {
      return sendJson(res, 400, { ok: false, error: 'This room is not a poker room.' });
    }

    if (existingRoom.players >= existingRoom.max_players) {
      return sendJson(res, 400, { ok: false, error: 'Room is full.' });
    }

    const nextPlayers = Math.min(existingRoom.players + 1, existingRoom.max_players);
    const nextStatus = nextPlayers >= existingRoom.max_players ? 'full' : 'waiting';

    const { data: updatedRoom, error: updateError } = await supabase
      .from('game_rooms')
      .update({
        players: nextPlayers,
        status: nextStatus,
      })
      .eq('id', existingRoom.id)
      .select('room_code, name, players, max_players, status')
      .single();

    if (updateError) {
      throw updateError;
    }

    if (!updatedRoom) {
      throw new Error('Failed to update room.');
    }

    return sendJson(res, 200, {
      ok: true,
      isHost: false,
      room: {
        code: updatedRoom.room_code,
        name: updatedRoom.name,
        players: updatedRoom.players,
        maxPlayers: updatedRoom.max_players,
        status: updatedRoom.status,
      },
      playerName: body.playerName ?? 'Guest',
    });
  } catch (error) {
    return handleApiError(res, error);
  }
}
