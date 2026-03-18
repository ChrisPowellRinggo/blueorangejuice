export interface PlayerState {
  id: string;
  username: string;
  pos: { x: number; y: number; z: number };
  rot: { yaw: number; pitch: number };
  health: number;
  anim: 'idle' | 'walk' | 'shoot' | 'dead';
  kills: number;
  deaths: number;
}

export interface BulletState {
  id: string;
  ownerId: string;
  createdAt: number;
  pos: { x: number; y: number; z: number };
  dir: { x: number; y: number; z: number };
}

export interface LocalPlayerState extends PlayerState {
  seq: number;
}
