-- iBorcuha Database Schema

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('superadmin', 'trainer')),
  avatar TEXT,
  club_name VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS groups (
  id TEXT PRIMARY KEY,
  trainer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  schedule VARCHAR(255),
  subscription_cost INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  trainer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  group_id TEXT REFERENCES groups(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  weight DECIMAL(5,1),
  belt VARCHAR(50),
  birth_date DATE,
  avatar TEXT,
  subscription_expires_at TIMESTAMPTZ,
  status VARCHAR(20) CHECK (status IN (NULL, 'sick', 'injury', 'skip')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  trainer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
  amount INTEGER NOT NULL,
  category VARCHAR(100),
  description TEXT,
  student_id TEXT REFERENCES students(id) ON DELETE SET NULL,
  date TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tournaments (
  id TEXT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  cover_image TEXT,
  date DATE NOT NULL,
  location VARCHAR(255),
  description TEXT,
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS tournament_registrations (
  tournament_id TEXT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  PRIMARY KEY (tournament_id, student_id)
);

CREATE TABLE IF NOT EXISTS news (
  id TEXT PRIMARY KEY,
  trainer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  group_id TEXT REFERENCES groups(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  date TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id SERIAL PRIMARY KEY,
  user_id TEXT,
  student_id TEXT,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notification_settings (
  id SERIAL PRIMARY KEY,
  user_id TEXT,
  student_id TEXT,
  news BOOLEAN DEFAULT true,
  tournaments BOOLEAN DEFAULT true,
  payments BOOLEAN DEFAULT true,
  schedule BOOLEAN DEFAULT true,
  UNIQUE(user_id, student_id)
);

-- Sport type for trainers
DO $$ BEGIN
  ALTER TABLE users ADD COLUMN sport_type VARCHAR(50);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS internal_tournaments (
  id TEXT PRIMARY KEY,
  trainer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  date DATE,
  status VARCHAR(20) DEFAULT 'active',
  brackets JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS author_info (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  name VARCHAR(255),
  instagram VARCHAR(255),
  website VARCHAR(255),
  description TEXT,
  phone VARCHAR(50)
);
