import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { CartProvider } from "@/src/context/cart";
import { BookingsProvider } from "@/src/context/bookings";
import { BoardsProvider } from "@/src/context/boards";
import { BoardsBackendProvider } from "@/src/context/boards-backend";
import { BookingsBackendProvider } from "@/src/context/bookings-backend";
import { MessagesBackendProvider } from "@/src/context/messages-backend";
import { UserBackendProvider } from "@/src/context/user-backend";
import { CartBackendProvider } from "@/src/context/cart-backend";
import { UserProvider } from "@/src/context/user";
import { MessagesProvider } from "@/src/context/messages";
import { SessionsProvider } from "@/src/context/sessions";
import { trpc, createTRPCClient } from "@/lib/trpc";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();
const trpcClient = createTRPCClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen 
        name="board-preview" 
        options={{ 
          presentation: "modal",
          headerShown: false,
          gestureEnabled: true,
          animation: "slide_from_bottom"
        }} 
      />
      <Stack.Screen 
        name="checkout" 
        options={{ 
          presentation: "modal",
          headerShown: false,
          gestureEnabled: true,
          animation: "slide_from_bottom"
        }} 
      />
      <Stack.Screen 
        name="booking-details" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="confirmation" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="chat" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="user-edit" 
        options={{ 
          presentation: "modal",
          headerShown: false,
          gestureEnabled: true,
          animation: "slide_from_bottom"
        }} 
      />
      <Stack.Screen 
        name="backend-test" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="data-regeneration" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="session-preview" 
        options={{ 
          presentation: "modal",
          headerShown: false,
          gestureEnabled: true,
          animation: "slide_from_bottom"
        }} 
      />
      <Stack.Screen 
        name="clear-cart" 
        options={{ 
          headerShown: false,
        }} 
      />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <UserProvider>
          <UserBackendProvider>
            <MessagesProvider>
              <MessagesBackendProvider>
                <BookingsProvider>
                  <BookingsBackendProvider>
                    <BoardsProvider>
                      <BoardsBackendProvider>
                        <SessionsProvider>
                          <CartProvider>
                            <CartBackendProvider>
                              <GestureHandlerRootView style={{ flex: 1 }}>
                                <RootLayoutNav />
                              </GestureHandlerRootView>
                            </CartBackendProvider>
                          </CartProvider>
                        </SessionsProvider>
                      </BoardsBackendProvider>
                    </BoardsProvider>
                  </BookingsBackendProvider>
                </BookingsProvider>
              </MessagesBackendProvider>
            </MessagesProvider>
          </UserBackendProvider>
        </UserProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
