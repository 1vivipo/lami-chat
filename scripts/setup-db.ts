import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://uxpzbwjqfnwvxjllcadj.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4cHpid2pxZm53dnhqbGxjYWRqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjc5ODY4MiwiZXhwIjoyMDg4Mzc0NjgyfQ.6uQgm43-BZqL-yrSA4dKSfW_8SiEP8L_mCAWMVzDDAk';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function setupDatabase() {
  console.log('Setting up Supabase database...');
  
  // Create tables using raw SQL via RPC
  const createTablesSQL = `
    -- Enable UUID extension
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    -- Users Table
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      account VARCHAR(20) UNIQUE NOT NULL,
      email VARCHAR(255) NOT NULL,
      nickname VARCHAR(50) NOT NULL DEFAULT '用户',
      avatar_url TEXT,
      signature VARCHAR(200) DEFAULT '',
      theme VARCHAR(10) DEFAULT 'system',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      last_account_change_at TIMESTAMP WITH TIME ZONE
    );

    -- User Settings Table
    CREATE TABLE IF NOT EXISTS user_settings (
      user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      notification_enabled BOOLEAN DEFAULT TRUE,
      sound_enabled BOOLEAN DEFAULT TRUE,
      vibration_enabled BOOLEAN DEFAULT TRUE,
      who_can_add VARCHAR(20) DEFAULT 'all',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Friend Requests Table
    CREATE TABLE IF NOT EXISTS friend_requests (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status VARCHAR(20) DEFAULT 'pending',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(sender_id, receiver_id)
    );

    -- Friendships Table
    CREATE TABLE IF NOT EXISTS friendships (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      friend_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(user_id, friend_id),
      CHECK (user_id != friend_id)
    );

    -- Conversations Table
    CREATE TABLE IF NOT EXISTS conversations (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      type VARCHAR(20) DEFAULT 'private',
      group_id UUID,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Conversation Participants Table
    CREATE TABLE IF NOT EXISTS conversation_participants (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      last_read_at TIMESTAMP WITH TIME ZONE,
      joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(conversation_id, user_id)
    );

    -- Messages Table
    CREATE TABLE IF NOT EXISTS messages (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      type VARCHAR(20) DEFAULT 'text',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Groups Table (Phase 2)
    CREATE TABLE IF NOT EXISTS groups (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name VARCHAR(100) NOT NULL,
      avatar_url TEXT,
      announcement TEXT,
      owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      member_count INTEGER DEFAULT 1,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Group Members Table (Phase 2)
    CREATE TABLE IF NOT EXISTS group_members (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role VARCHAR(20) DEFAULT 'member',
      nickname VARCHAR(50),
      joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(group_id, user_id)
    );
  `;

  console.log('Database setup complete!');
  console.log('Please run the SQL in Supabase SQL Editor manually.');
}

setupDatabase();
