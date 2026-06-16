import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import path from 'path';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

const PORT = 3001;

// ─── Types ───────────────────────────────────────────────────────────────────

interface PlayerState {
  id: string;
  name: string;
  className: string;
  x: number;
  y: number;
  mapId: string;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  level: number;
  ready: boolean;
}

interface BattleAction {
  playerId: string;
  type: 'attack' | 'magic' | 'item' | 'run';
  targetIndex?: number;
  spellId?: string;
  itemId?: string;
}

interface BattleState {
  enemies: { id: string; name: string; hp: number; maxHp: number; atk: number; def: number }[];
  turn: number;
  actions: Map<string, BattleAction>;
  phase: 'input' | 'resolving' | 'end';
}

interface Room {
  id: string;
  hostId: string;
  players: Map<string, PlayerState>;
  state: 'lobby' | 'overworld' | 'battle';
  battle?: BattleState;
}

// ─── Room management ─────────────────────────────────────────────────────────

const rooms = new Map<string, Room>();

function generateRoomId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = '';
  for (let i = 0; i < 4; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return rooms.has(id) ? generateRoomId() : id;
}

function getRoomByPlayer(playerId: string): Room | undefined {
  for (const room of rooms.values()) {
    if (room.players.has(playerId)) return room;
  }
  return undefined;
}

function broadcastRoom(room: Room, event: string, data: unknown, excludeId?: string) {
  for (const [pid] of room.players) {
    if (pid !== excludeId) {
      io.to(pid).emit(event, data);
    }
  }
}

// ─── Socket events ───────────────────────────────────────────────────────────

io.on('connection', (socket: Socket) => {
  console.log(`[connect] ${socket.id}`);

  // Create room
  socket.on('create_room', (data: { player: PlayerState }) => {
    const roomId = generateRoomId();
    const player = { ...data.player, id: socket.id, ready: false };
    const room: Room = {
      id: roomId,
      hostId: socket.id,
      players: new Map([[socket.id, player]]),
      state: 'lobby',
    };
    rooms.set(roomId, room);
    socket.join(roomId);
    socket.emit('room_created', { roomId, player });
    console.log(`[room] ${roomId} created by ${player.name}`);
  });

  // Join room
  socket.on('join_room', (data: { roomId: string; player: PlayerState }) => {
    const room = rooms.get(data.roomId.toUpperCase());
    if (!room) { socket.emit('error', { msg: 'ルームが見つかりません' }); return; }
    if (room.players.size >= 4) { socket.emit('error', { msg: 'ルームが満員です' }); return; }
    if (room.state !== 'lobby') { socket.emit('error', { msg: 'ゲームが既に開始しています' }); return; }

    const player = { ...data.player, id: socket.id, ready: false };
    room.players.set(socket.id, player);
    socket.join(room.id);

    const playersArray = [...room.players.values()];
    socket.emit('room_joined', { roomId: room.id, players: playersArray, player });
    broadcastRoom(room, 'player_joined', { player }, socket.id);
    console.log(`[room] ${player.name} joined ${room.id}`);
  });

  // Player ready
  socket.on('player_ready', () => {
    const room = getRoomByPlayer(socket.id);
    if (!room) return;
    const p = room.players.get(socket.id);
    if (p) p.ready = true;

    const allReady = [...room.players.values()].every(pl => pl.ready);
    broadcastRoom(room, 'player_ready_update', { playerId: socket.id });
    if (allReady && room.players.size >= 1) {
      room.state = 'overworld';
      io.to(room.id).emit('game_start', { players: [...room.players.values()] });
    }
  });

  // Player moved in overworld
  socket.on('player_move', (data: { x: number; y: number; mapId: string; dir: string }) => {
    const room = getRoomByPlayer(socket.id);
    if (!room || room.state !== 'overworld') return;
    const p = room.players.get(socket.id);
    if (!p) return;
    p.x = data.x; p.y = data.y; p.mapId = data.mapId;
    broadcastRoom(room, 'player_moved', { playerId: socket.id, x: data.x, y: data.y, mapId: data.mapId, dir: data.dir }, socket.id);
  });

  // Battle start (host triggers)
  socket.on('battle_start', (data: { enemies: BattleState['enemies'] }) => {
    const room = getRoomByPlayer(socket.id);
    if (!room || room.hostId !== socket.id) return;
    room.state = 'battle';
    room.battle = {
      enemies: data.enemies,
      turn: 1,
      actions: new Map(),
      phase: 'input',
    };
    io.to(room.id).emit('battle_started', {
      enemies: room.battle.enemies,
      players: [...room.players.values()],
    });
  });

  // Battle action submitted by player
  socket.on('battle_action', (data: BattleAction) => {
    const room = getRoomByPlayer(socket.id);
    if (!room || !room.battle || room.battle.phase !== 'input') return;

    room.battle.actions.set(socket.id, { ...data, playerId: socket.id });

    // Check if all living players submitted
    const livingPlayers = [...room.players.values()].filter(p => p.hp > 0);
    if (room.battle.actions.size >= livingPlayers.length) {
      resolveBattleRound(room);
    }
  });

  // HP update after round
  socket.on('battle_hp_update', (data: { hp: number }) => {
    const room = getRoomByPlayer(socket.id);
    if (!room) return;
    const p = room.players.get(socket.id);
    if (p) p.hp = data.hp;
  });

  // Battle ended
  socket.on('battle_end', (data: { result: 'win' | 'lose' }) => {
    const room = getRoomByPlayer(socket.id);
    if (!room || room.hostId !== socket.id) return;
    room.state = 'overworld';
    room.battle = undefined;
    broadcastRoom(room, 'battle_ended', data, socket.id);
  });

  // Chat message
  socket.on('chat', (data: { text: string }) => {
    const room = getRoomByPlayer(socket.id);
    if (!room) return;
    const p = room.players.get(socket.id);
    if (!p) return;
    io.to(room.id).emit('chat', { name: p.name, text: data.text.slice(0, 64) });
  });

  // Leave / disconnect
  socket.on('disconnect', () => {
    const room = getRoomByPlayer(socket.id);
    if (!room) return;
    const p = room.players.get(socket.id);
    room.players.delete(socket.id);
    broadcastRoom(room, 'player_left', { playerId: socket.id, name: p?.name });
    if (room.players.size === 0) {
      rooms.delete(room.id);
      console.log(`[room] ${room.id} closed (empty)`);
    } else if (room.hostId === socket.id) {
      room.hostId = [...room.players.keys()][0];
      io.to(room.id).emit('host_changed', { newHostId: room.hostId });
    }
    console.log(`[disconnect] ${p?.name ?? socket.id}`);
  });
});

// ─── Battle round resolution ──────────────────────────────────────────────────

function resolveBattleRound(room: Room) {
  if (!room.battle) return;
  const battle = room.battle;
  battle.phase = 'resolving';

  const log: string[] = [];
  const results: {
    playerId?: string;
    enemyIndex?: number;
    type: string;
    damage?: number;
    heal?: number;
    text: string;
  }[] = [];

  // Process player actions
  for (const [pid, action] of battle.actions) {
    const player = room.players.get(pid);
    if (!player || player.hp <= 0) continue;

    if (action.type === 'attack') {
      const target = battle.enemies[action.targetIndex ?? 0];
      if (!target || target.hp <= 0) continue;
      const dmg = Math.max(1, player.level * 5 + 10 - target.def);
      target.hp = Math.max(0, target.hp - dmg);
      const text = `${player.name}の攻撃！ ${target.name}に${dmg}ダメージ！`;
      log.push(text);
      results.push({ playerId: pid, enemyIndex: action.targetIndex, type: 'attack', damage: dmg, text });
    } else if (action.type === 'magic') {
      const target = battle.enemies[action.targetIndex ?? 0];
      if (!target || target.hp <= 0) continue;
      const dmg = Math.max(1, player.level * 8 + 15 - Math.floor(target.def / 2));
      target.hp = Math.max(0, target.hp - dmg);
      player.mp = Math.max(0, player.mp - 8);
      const text = `${player.name}の魔法！ ${target.name}に${dmg}ダメージ！`;
      log.push(text);
      results.push({ playerId: pid, enemyIndex: action.targetIndex, type: 'magic', damage: dmg, text });
    } else if (action.type === 'run') {
      results.push({ playerId: pid, type: 'run', text: `${player.name}は逃げようとしている…` });
    }
  }

  // Enemy attacks (each living enemy attacks random player)
  const livingPlayers = [...room.players.values()].filter(p => p.hp > 0);
  for (const enemy of battle.enemies) {
    if (enemy.hp <= 0 || livingPlayers.length === 0) continue;
    const target = livingPlayers[Math.floor(Math.random() * livingPlayers.length)];
    const dmg = Math.max(1, enemy.atk - Math.floor(target.level * 2));
    target.hp = Math.max(0, target.hp - dmg);
    const text = `${enemy.name}の攻撃！ ${target.name}に${dmg}ダメージ！`;
    log.push(text);
    results.push({ enemyIndex: battle.enemies.indexOf(enemy), type: 'enemy_attack', damage: dmg, text });
  }

  const allEnemiesDead = battle.enemies.every(e => e.hp <= 0);
  const allPlayersDead = [...room.players.values()].every(p => p.hp <= 0);
  const runAttempted = [...battle.actions.values()].some(a => a.type === 'run');

  battle.actions.clear();
  battle.turn++;

  if (allEnemiesDead || allPlayersDead || runAttempted) {
    battle.phase = 'end';
    io.to(room.id).emit('battle_round_result', {
      results,
      enemyHps: battle.enemies.map(e => e.hp),
      playerHps: Object.fromEntries([...room.players.entries()].map(([id, p]) => [id, p.hp])),
      battleOver: true,
      victory: allEnemiesDead,
    });
    room.state = 'overworld';
    room.battle = undefined;
  } else {
    battle.phase = 'input';
    io.to(room.id).emit('battle_round_result', {
      results,
      enemyHps: battle.enemies.map(e => e.hp),
      playerHps: Object.fromEntries([...room.players.entries()].map(([id, p]) => [id, p.hp])),
      battleOver: false,
      victory: false,
    });
  }
}

// ─── Start ────────────────────────────────────────────────────────────────────

app.get('/health', (_, res) => res.json({ ok: true, rooms: rooms.size }));

httpServer.listen(PORT, () => {
  console.log(`\n🗡️  アルデア伝説サーバー起動 → http://localhost:${PORT}\n`);
});
