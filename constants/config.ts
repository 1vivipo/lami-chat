// Supabase Configuration
export const SUPABASE_CONFIG = {
  url: 'https://uxpzbwjqfnwvxjllcadj.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4cHpid2pxZm53dnhqbGxjYWRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3OTg2ODIsImV4cCI6MjA4ODM3NDY4Mn0.n_Q9G1x5fsR7Qo-ZyoUK8DtCP77Yk6bS3sCQGD4gndo',
};

// App Configuration
export const APP_CONFIG = {
  name: 'Lami Chat',
  version: '1.0.0',
  
  // Account rules
  account: {
    minLength: 6,
    maxLength: 20,
    pattern: /^[a-zA-Z0-9]+$/,
    changeCooldownDays: 30,
  },
  
  // Group rules (for future use)
  group: {
    minMembers: 3,
    maxMembers: 200,
  },
  
  // Message limits
  message: {
    maxLength: 5000,
    voiceMaxLength: 60, // seconds
  },
  
  // Storage bucket names
  storage: {
    avatars: 'avatars',
    images: 'chat-images',
    voices: 'chat-voices',
  },
};
