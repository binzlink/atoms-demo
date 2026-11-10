CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  current_html TEXT NOT NULL,
  published_html TEXT,
  published_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX idx_messages_project ON messages (project_id, created_at);
