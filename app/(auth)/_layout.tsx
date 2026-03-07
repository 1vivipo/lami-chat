import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/theme';

export default function AuthLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen 
        name="login" 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="register" 
        options={{ 
          title: '注册',
          headerBackTitle: '返回',
        }}
      />
      <Stack.Screen 
        name="verify" 
        options={{ 
          title: '验证邮箱',
          headerBackTitle: '返回',
        }}
      />
    </Stack>
  );
}
