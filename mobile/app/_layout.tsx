import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { supabase } from '../lib/supabase';

export default function Layout() {
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSignedIn(Boolean(data.session));
      setReady(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(Boolean(session));
    });
    return () => subscription.unsubscribe();
  }, []);

  if (!ready) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator size="large" /></View>;

  return <Stack screenOptions={{ headerShown: false }}>
    <Stack.Protected guard={!signedIn}><Stack.Screen name="login" /></Stack.Protected>
    <Stack.Protected guard={signedIn}><Stack.Screen name="index" /></Stack.Protected>
    <Stack.Protected guard={signedIn}><Stack.Screen name="section/[table]" /></Stack.Protected>
  </Stack>;
}
