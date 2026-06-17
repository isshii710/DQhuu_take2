import { io, Socket } from 'socket.io-client';
import type { NetPlayer, BattleActionPayload, BattleRoundResult } from '../types';
import { SERVER_URL } from '../config';

type MPEvent =
  | 'room_created'
  | 'room_joined'
  | 'player_joined'
  | 'player_left'
  | 'player_ready_update'
  | 'game_start'
  | 'player_moved'
  | 'battle_started'
  | 'battle_round_result'
  | 'battle_ended'
  | 'host_changed'
  | 'chat'
  | 'error'
  // DQ9スタイル
  | 'world_opened'
  | 'world_joined'
  | 'guest_arrived'
  | 'world_closed';

type MPListener = (data: unknown) => void;

export class MultiplayerManager {
  private socket: Socket | null = null;
  private listeners = new Map<MPEvent, Set<MPListener>>();

  get connected() { return this.socket?.connected ?? false; }
  get socketId() { return this.socket?.id ?? ''; }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = io(SERVER_URL || window.location.origin, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
      });
      this.socket.once('connect', () => { this.setupListeners(); resolve(); });
      this.socket.once('connect_error', (err) => reject(err));
    });
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }

  private setupListeners() {
    if (!this.socket) return;
    const events: MPEvent[] = [
      'room_created','room_joined','player_joined','player_left',
      'player_ready_update','game_start','player_moved',
      'battle_started','battle_round_result','battle_ended',
      'host_changed','chat','error',
      'world_opened','world_joined','guest_arrived','world_closed',
    ];
    for (const ev of events) {
      this.socket.on(ev, (data: unknown) => {
        this.listeners.get(ev)?.forEach(fn => fn(data));
      });
    }
  }

  on(event: MPEvent, fn: MPListener) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(fn);
  }

  off(event: MPEvent, fn: MPListener) {
    this.listeners.get(event)?.delete(fn);
  }

  offAll() { this.listeners.clear(); }

  // ─── Emit helpers ────────────────────────────────────────────────────────

  createRoom(player: NetPlayer) {
    this.socket?.emit('create_room', { player });
  }

  joinRoom(roomId: string, player: NetPlayer) {
    this.socket?.emit('join_room', { roomId, player });
  }

  setReady() {
    this.socket?.emit('player_ready');
  }

  movePlayer(x: number, y: number, mapId: string, dir: string) {
    this.socket?.emit('player_move', { x, y, mapId, dir });
  }

  startBattle(enemies: { id: string; name: string; hp: number; maxHp: number; atk: number; def: number }[]) {
    this.socket?.emit('battle_start', { enemies });
  }

  submitAction(action: BattleActionPayload) {
    this.socket?.emit('battle_action', action);
  }

  updateHp(hp: number) {
    this.socket?.emit('battle_hp_update', { hp });
  }

  endBattle(result: 'win' | 'lose') {
    this.socket?.emit('battle_end', { result });
  }

  sendChat(text: string) {
    this.socket?.emit('chat', { text });
  }

  // ── DQ9スタイル ────────────────────────────────────────────────────────────
  openWorld(player: NetPlayer) {
    this.socket?.emit('open_world', { player });
  }

  closeWorld() {
    this.socket?.emit('close_world');
  }

  guestJoin(roomId: string, player: NetPlayer) {
    this.socket?.emit('guest_join', { roomId, player });
  }
}

// Singleton
export const mpManager = new MultiplayerManager();
