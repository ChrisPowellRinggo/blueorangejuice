export const TICK_RATE = 20 as const; // server updates per second
export const MAX_PLAYERS_PER_ROOM = 16 as const;
export const PLAYER_SPEED = 5 as const; // units per second
export const PLAYER_START_HEALTH = 100 as const;
export const AMMO_MAX = 30 as const;
export const INPUT_BUFFER_SIZE = 64 as const;
export const KILLFEED_DISPLAY_MS = 4000 as const;

export const SPAWN_POINTS: { x: number; y: number; z: number }[] = [
  { x:  0,   y: 1, z:  0   },
  { x:  8,   y: 1, z:  8   },
  { x: -8,   y: 1, z:  8   },
  { x:  8,   y: 1, z: -8   },
  { x: -8,   y: 1, z: -8   },
  { x:  15,  y: 1, z:  0   },
  { x: -15,  y: 1, z:  0   },
  { x:  0,   y: 1, z:  15  },
  { x:  0,   y: 1, z: -15  },
  { x:  12,  y: 1, z:  12  },
  { x: -12,  y: 1, z: -12  },
  { x:  5,   y: 1, z: -18  },
];
