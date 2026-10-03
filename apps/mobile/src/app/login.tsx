import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { isConfigured, supabase } from '@/lib/supabase';
import { Button, Card, colors, Field, styles } from '@/components/ui';
import { startDemo } from '@/data/demo';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn() {
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) setError(error.message);
  }

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'center' }}>
        <View style={styles.content}>
          <Text style={styles.h1}>KFA Students</Text>
          <Text style={styles.muted}>Sign in with the account the owner created for you.</Text>
          {!isConfigured && (
            <Card style={{ backgroundColor: colors.warnBg }}>
              <Text style={styles.body}>This build has no server configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_KEY in apps/mobile/.env.</Text>
            </Card>
          )}
          <Card>
            <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
            <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" />
            {error && <Text style={{ color: colors.error }}>{error}</Text>}
            <Button title="Sign in" onPress={signIn} busy={busy} disabled={!email || !password || !isConfigured} />
          </Card>
          <Button title="Try with sample data (no server)" variant="secondary" onPress={() => startDemo()} />
          <Text style={styles.muted}>Sample students and classes stay on this device only. Sign out to leave the demo.</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
