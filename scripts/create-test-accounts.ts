// Initialize Supabase Database and Create Test Accounts
// Run this script after setting up the database schema in Supabase SQL Editor

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://uxpzbwjqfnwvxjllcadj.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4cHpid2pxZm53dnhqbGxjYWRqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjc5ODY4MiwiZXhwIjoyMDg4Mzc0NjgyfQ.6uQgm43-BZqL-yrSA4dKSfW_8SiEP8L_mCAWMVzDDAk';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Test accounts to create
const testAccounts = [
  { email: 'test1@lamichat.com', password: 'Test123456', nickname: '测试用户1', account: 'TEST01' },
  { email: 'test2@lamichat.com', password: 'Test123456', nickname: '测试用户2', account: 'TEST02' },
  { email: 'test3@lamichat.com', password: 'Test123456', nickname: '测试用户3', account: 'TEST03' },
];

async function createTestAccounts() {
  console.log('Creating test accounts...\n');

  for (const account of testAccounts) {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: account.email,
        password: account.password,
        email_confirm: true,
      });

      if (authError) {
        console.log(`❌ Failed to create ${account.email}: ${authError.message}`);
        continue;
      }

      // Create user profile
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: account.email,
          account: account.account,
          nickname: account.nickname,
          signature: `我是${account.nickname}，欢迎使用Lami Chat！`,
        });

      if (profileError) {
        console.log(`❌ Failed to create profile for ${account.email}: ${profileError.message}`);
        continue;
      }

      console.log(`✅ Created: ${account.email}`);
      console.log(`   账号: ${account.account}`);
      console.log(`   密码: ${account.password}`);
      console.log('');
    } catch (error) {
      console.log(`❌ Error creating ${account.email}:`, error);
    }
  }

  console.log('\n=== Test Accounts Summary ===');
  console.log('You can use these accounts to test the app:\n');
  testAccounts.forEach(acc => {
    console.log(`账号: ${acc.account} | 密码: ${acc.password} | 邮箱: ${acc.email}`);
  });
}

// Run the script
createTestAccounts();
