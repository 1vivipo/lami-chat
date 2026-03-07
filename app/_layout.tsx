import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, useColorScheme } from 'react-native';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore, useThemeStore } from '@/store';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/theme';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { themeMode, loadTheme } = useThemeStore();
  const { user, setUser, setIsAuthenticated, setIsLoading, isLoading } = useAuthStore();

  const [fontsLoaded] = useFonts({
    // Add custom fonts here if needed
  });

  // Determine actual theme
  const actualTheme = themeMode === 'system' ? colorScheme || 'light' : themeMode;
  const colors = Colors[actualTheme as 'light' | 'dark'];

  useEffect(() => {
    loadTheme();
    
    // Check initial session
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            account: '',
            nickname: '用户',
            avatar_url: null,
            signature: null,
            theme: 'system',
            created_at: new Date().toISOString(),
            last_account_change_at: null,
          });
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Session check error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          account: '',
          nickname: '用户',
          avatar_url: null,
          signature: null,
          theme: 'system',
          created_at: new Date().toISOString(),
          last_account_change_at: null,
        });
        setIsAuthenticated(true);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsAuthenticated(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (isLoading || !fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style={actualTheme === 'dark' ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="chat/[id]" />
          <Stack.Screen name="add-friend" />
          <Stack.Screen name="friend-requests" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="edit-profile" />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
