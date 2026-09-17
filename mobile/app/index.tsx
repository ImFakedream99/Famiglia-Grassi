import { Link, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { supabase } from '../lib/supabase';

const sections = [
  ['👨‍👩‍👧‍👦','Famiglia','family_members','Persone e contatti'],['🏠','Casa','household_tasks','Attività e manutenzione'],['💶','Finanze','expenses','Spese registrate'],['🚗','Veicoli','vehicles','Auto e scadenze'],['📄','Documenti','documents','Documenti e scadenze'],['📅','Agenda','events','Appuntamenti ed eventi'],['🛒','Spesa','shopping_items','Lista della spesa'],['📦','Inventario','inventory','Oggetti e garanzie'],['🔁','Abbonamenti','subscriptions','Pagamenti ricorrenti'],['📝','Note','notes','Note della famiglia']
] as const;

export default function Home() {
  const router = useRouter();
  const [search,setSearch]=useState(''); const [counts,setCounts]=useState<Record<string,number>>({}); const [loading,setLoading]=useState(true);
  useEffect(()=>{let alive=true; Promise.all(sections.map(async ([,,table])=>{const {count}=await supabase.from(table).select('*',{count:'exact',head:true});return [table,count??0] as const})).then(v=>{if(alive)setCounts(Object.fromEntries(v));setLoading(false)}).catch(()=>setLoading(false));return()=>{alive=false}},[]);
  const filtered=useMemo(()=>sections.filter(([,label,,desc])=>(label+' '+desc).toLowerCase().includes(search.toLowerCase())),[search]);
  async function logout(){await supabase.auth.signOut();}
  return <ScrollView style={s.screen} contentContainerStyle={s.content}>
    <View style={s.header}><View><Text style={s.brand}>Famiglia Grassi</Text><Text style={s.muted}>Tutto ciò che serve alla famiglia.</Text></View><Pressable onPress={logout}><Text style={s.logout}>Esci</Text></Pressable></View>
    <View style={s.hero}><Text style={s.eyebrow}>AREA FAMILIARE</Text><Text style={s.title}>Ciao 👋</Text><Text style={s.muted}>Gestisci insieme a tutti i membri della famiglia.</Text><TextInput value={search} onChangeText={setSearch} placeholder="Cerca una sezione…" style={s.search}/></View>
    <View style={s.stats}><Stat value={counts.events??0} label="Agenda"/><Stat value={counts.shopping_items??0} label="Spesa"/><Stat value={counts.household_tasks??0} label="Casa"/><Stat value={counts.expenses??0} label="Spese"/></View>
    <Text style={s.h2}>Le tue sezioni</Text>
    {loading ? <ActivityIndicator/> : <View style={s.grid}>{filtered.map(([icon,label,table,desc])=><Link key={table} href={{pathname:'/section/[table]',params:{table}}} asChild><Pressable style={s.card}><Text style={s.icon}>{icon}</Text><View style={s.badge}><Text style={s.badgeText}>{counts[table]??0}</Text></View><Text style={s.cardTitle}>{label}</Text><Text style={s.muted}>{desc}</Text><Text style={s.open}>Apri →</Text></Pressable></Link>)}</View>}
  </ScrollView>
}
function Stat({value,label}:{value:number,label:string}){return <View style={s.stat}><Text style={s.statValue}>{value}</Text><Text style={s.muted}>{label}</Text></View>}
const s=StyleSheet.create({screen:{flex:1,backgroundColor:'#f4f7fb'},content:{padding:18,paddingTop:56,paddingBottom:40},header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:18},brand:{fontSize:22,fontWeight:'800'},muted:{color:'#667085',fontSize:14},logout:{color:'#2563eb',fontWeight:'700'},hero:{backgroundColor:'#fff',borderRadius:22,padding:20,marginBottom:14},eyebrow:{color:'#2563eb',fontSize:11,fontWeight:'800',letterSpacing:1},title:{fontSize:30,fontWeight:'800',marginVertical:4},search:{marginTop:16,borderWidth:1,borderColor:'#e4e7ec',borderRadius:13,padding:13,fontSize:15},stats:{flexDirection:'row',gap:8,marginBottom:22},stat:{flex:1,backgroundColor:'#fff',borderRadius:16,padding:12},statValue:{fontSize:22,fontWeight:'800',marginBottom:2},h2:{fontSize:20,fontWeight:'800',marginBottom:12},grid:{gap:10},card:{backgroundColor:'#fff',borderRadius:18,padding:17,minHeight:145},icon:{fontSize:30,marginBottom:10},badge:{position:'absolute',right:14,top:14,backgroundColor:'#eef4ff',borderRadius:20,paddingHorizontal:9,paddingVertical:5},badgeText:{color:'#2563eb',fontWeight:'800'},cardTitle:{fontSize:18,fontWeight:'800',marginBottom:3},open:{color:'#2563eb',fontWeight:'700',marginTop:12}});
