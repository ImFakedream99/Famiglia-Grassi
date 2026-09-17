import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { supabase } from '../lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [register, setRegister] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    const result = register
      ? await supabase.auth.signUp({ email: email.trim(), password })
      : await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (result.error) return Alert.alert('Accesso', result.error.message);
    if (register && !result.data.session) Alert.alert('Controlla la tua email', 'Conferma l’account per completare la registrazione.');
  }

  return <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.screen}>
    <View style={s.card}>
      <Text style={s.logo}>👨‍👩‍👧‍👦</Text><Text style={s.title}>Famiglia Grassi</Text>
      <Text style={s.subtitle}>{register ? 'Crea il tuo account' : 'Il tuo spazio familiare'}</Text>
      <TextInput style={s.input} placeholder="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail}/>
      <TextInput style={s.input} placeholder="Password" secureTextEntry value={password} onChangeText={setPassword}/>
      <Pressable style={s.button} onPress={submit} disabled={busy}><Text style={s.buttonText}>{busy ? 'Attendere…' : register ? 'Registrati' : 'Accedi'}</Text></Pressable>
      <Pressable onPress={() => setRegister(!register)}><Text style={s.link}>{register ? 'Hai già un account? Accedi' : 'Non hai un account? Registrati'}</Text></Pressable>
    </View>
  </KeyboardAvoidingView>;
}

const s = StyleSheet.create({screen:{flex:1,backgroundColor:'#f4f7fb',justifyContent:'center',padding:20},card:{backgroundColor:'#fff',borderRadius:24,padding:24,gap:14},logo:{fontSize:48,textAlign:'center'},title:{fontSize:28,fontWeight:'800',textAlign:'center'},subtitle:{textAlign:'center',color:'#667085',marginBottom:8},input:{borderWidth:1,borderColor:'#d0d5dd',borderRadius:14,padding:15,fontSize:16},button:{backgroundColor:'#2563eb',padding:16,borderRadius:14,alignItems:'center'},buttonText:{color:'#fff',fontWeight:'700',fontSize:16},link:{textAlign:'center',color:'#2563eb',fontWeight:'600',padding:8}});
