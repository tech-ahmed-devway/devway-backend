-- sessions_schema.sql
-- DevWay Course Sessions Schema (Google Drive Integration)

CREATE TABLE IF NOT EXISTS sessions (
  id                SERIAL PRIMARY KEY,
  session_number    VARCHAR(50) NOT NULL,
  title             VARCHAR(255) NOT NULL,
  description       TEXT,
  video_url         TEXT NOT NULL,
  drive_folder_url  TEXT,
  duration          VARCHAR(50),
  order_index       INT DEFAULT 1,
  topics            JSONB DEFAULT '[]'::jsonb,
  resources         JSONB DEFAULT '[]'::jsonb,
  notes             TEXT,
  is_published      BOOLEAN DEFAULT true,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS session_settings (
  key               VARCHAR(100) PRIMARY KEY,
  value             JSONB NOT NULL,
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_order ON sessions(order_index);
CREATE INDEX IF NOT EXISTS idx_sessions_published ON sessions(is_published);
