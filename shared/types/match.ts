export interface KillEvent {
  killerId: string;
  killerUsername: string;
  victimId: string;
  victimUsername: string;
  timestamp: number;
}

export interface MatchSummary {
  roomId: string;
  startedAt: number;
  endedAt: number;
  kills: KillEvent[];
  playerRanking: Array<{
    id: string;
    username: string;
    kills: number;
    deaths: number;
  }>;
}
