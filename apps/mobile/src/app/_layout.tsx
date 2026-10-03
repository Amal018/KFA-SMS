import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { isDemo } from '@/data/demo';
import { onDataChange } from '@/data/events';
import { colors } from '@/components/ui';

export default function RootLayout() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [demo, setDemo] = useState(isDemo());

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    const off = onDataChange(() => setDemo(isDemo()));
    return () => {
      data.subscription.unsubscribe();
      off();
    };
  }, []);

  if (session === undefined) return null;
  const signedIn = !!session || demo;

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTitleStyle: { color: colors.text, fontWeight: '700' },
          headerTintColor: colors.primary,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Protected guard={signedIn}>
          <Stack.Screen name="index" options={{ title: 'KFA Attendance' }} />
          <Stack.Screen name="attendance" options={{ title: 'Attendance mode', headerShown: false }} />
          <Stack.Screen name="register" options={{ title: "Today's register" }} />
          <Stack.Screen name="students/index" options={{ title: 'Students' }} />
          <Stack.Screen name="students/new" options={{ title: 'Add student' }} />
          <Stack.Screen name="students/[id]" options={{ title: 'Student' }} />
        </Stack.Protected>
        <Stack.Protected guard={!signedIn}>
          <Stack.Screen name="login" options={{ headerShown: false }} />
        </Stack.Protected>
      </Stack>
    </>
  );
}
