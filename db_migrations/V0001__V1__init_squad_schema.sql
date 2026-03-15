
CREATE TABLE IF NOT EXISTS squad_users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar_color VARCHAR(20) DEFAULT '#4C8FE8',
  status VARCHAR(20) DEFAULT 'offline',
  status_text VARCHAR(255) DEFAULT '',
  bio TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT NOW(),
  last_seen_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS squad_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES squad_users(id),
  token VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '30 days'
);

CREATE TABLE IF NOT EXISTS squad_contacts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES squad_users(id),
  contact_id INTEGER REFERENCES squad_users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, contact_id)
);

CREATE TABLE IF NOT EXISTS squad_chats (
  id SERIAL PRIMARY KEY,
  type VARCHAR(20) DEFAULT 'direct',
  name VARCHAR(100),
  created_by INTEGER REFERENCES squad_users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS squad_chat_members (
  id SERIAL PRIMARY KEY,
  chat_id INTEGER REFERENCES squad_chats(id),
  user_id INTEGER REFERENCES squad_users(id),
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(chat_id, user_id)
);

CREATE TABLE IF NOT EXISTS squad_messages (
  id SERIAL PRIMARY KEY,
  chat_id INTEGER REFERENCES squad_chats(id),
  sender_id INTEGER REFERENCES squad_users(id),
  content TEXT NOT NULL,
  encrypted BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS squad_servers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT DEFAULT '',
  abbreviation VARCHAR(5) NOT NULL,
  color VARCHAR(20) DEFAULT '#4C8FE8',
  owner_id INTEGER REFERENCES squad_users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS squad_server_members (
  id SERIAL PRIMARY KEY,
  server_id INTEGER REFERENCES squad_servers(id),
  user_id INTEGER REFERENCES squad_users(id),
  role VARCHAR(20) DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(server_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_sessions_token ON squad_sessions(token);
CREATE INDEX IF NOT EXISTS idx_messages_chat ON squad_messages(chat_id, created_at);
CREATE INDEX IF NOT EXISTS idx_chat_members_user ON squad_chat_members(user_id);
CREATE INDEX IF NOT EXISTS idx_server_members_user ON squad_server_members(user_id);
