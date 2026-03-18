CREATE TABLE players (
  id          TEXT PRIMARY KEY,
  username    TEXT NOT NULL,
  kills       INT  NOT NULL DEFAULT 0,
  deaths      INT  NOT NULL DEFAULT 0,
  wins        INT  NOT NULL DEFAULT 0,
  matches     INT  NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE matches (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id     TEXT NOT NULL,
  started_at  TIMESTAMPTZ DEFAULT now(),
  ended_at    TIMESTAMPTZ,
  winner_id   TEXT REFERENCES players(id)
);

CREATE TABLE match_events (
  id          BIGSERIAL PRIMARY KEY,
  match_id    UUID REFERENCES matches(id),
  tick        INT  NOT NULL,
  event_type  TEXT NOT NULL,        -- 'kill' | 'respawn' | 'round_end'
  payload     JSONB NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX ON match_events(match_id);
