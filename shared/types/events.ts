import type { PlayerState, BulletState } from './player';

export interface ServerToClientEvents {
  room_joined:   (d: { roomId: string; players: PlayerState[] }) => void;
  world_state:   (d: { players: PlayerState[]; bullets: BulletState[]; tick: number }) => void;
  player_hit:    (d: { targetId: string; damage: number; shooterId: string }) => void;
  player_died:   (d: { id: string; killerId: string }) => void;
  player_joined: (d: { id: string }) => void;
  player_left:   (d: { id: string }) => void;
}

export interface ClientToServerEvents {
  join_room:    (data: { roomId: string; username: string }) => void;
  player_input: (input: PlayerInput) => void;
}

export interface PlayerInput {
  move: { x: number; z: number };
  yaw: number;
  pitch: number;
  shooting: boolean;
  seq: number;
}
