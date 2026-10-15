import React, { useEffect } from 'react';
import { Stack, DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { useColorScheme, StatusBar } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { CartProvider } from '@/context/CartContext';
import { Colors } from '@/constants/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <ThemeProvider value={theme}>
      <CartProvider>
        <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="product/[id]"
            options={{
              presentation: 'card',
              headerShown: true,
              headerTitle: '',
              headerBackTitle: 'Quay lại',
            }}
          />
        </Stack>
      </CartProvider>
    </ThemeProvider>
  );
}
