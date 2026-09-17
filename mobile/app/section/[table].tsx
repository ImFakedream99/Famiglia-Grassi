import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { supabase } from '../../lib/supabase';

const meta: Record<string,{title:string,icon:string,label:string}>={
 family_members:{title:'Famiglia',icon:'👨‍👩‍👧‍👦',label:'Nome'},household_tasks:{title:'Casa',icon:'🏠',label:'Titolo'},expenses:{title:'Finanze',icon:'💶',label:'Descrizione'},vehicles:{title:'Veicoli',icon:'🚗',label:'Nome'},documents:{title:'Documenti',icon:'📄',label:'Titolo'},events:{title:'Agenda',icon:'📅',label:'Titolo'},shopping_items:{title:'Spesa',icon:'🛒',label:'Articolo'},inventory:{title:'Inventario',icon:'📦',label:'Nome'},subscriptions:{title:'Abbonamenti',icon:'🔁',label:'Nome'},notes:{title:'Note',icon:'📝',label:'Titolo'}
};
const textFields:Record<string,string>={family_members:'name',household_tasks:'title',expenses:'description',vehicles:'name',documents:'title',events:'title',shopping_items:'item',inventory:'name',subscriptions:'name',notes:'title'};

export default function Section(){
 const {table}=useLocalSearchParams<{table:string}>(); const router=useRouter(); const info=meta[table]; const [rows,setRows]=useState<any[]>([]); const [value,setValue]=useState(''); const [loading,setLoading]=useState(true);
 async function load(){if(!info)return;setLoading(true);const {data,error}=await supabase.from(table).select('*').order('created_at',{ascending:false}).limit(100);if(error)Alert.alert('Errore',error.message);setRows(data??[]);setLoading(false)}
 useEffect(()=>{load()},[table]);
 async function add(){const field=textFields[table];if(!field||!value.trim())return;const {error}=await supabase.from(table).insert({[field]:value.trim()});if(error)Alert.alert('Errore',error.message);else{setValue('');load()}}
 async function remove(id:string){const {error}=await supabase.from(table).delete().eq('id',id);if(error)Alert.alert('Errore',error.message);else load()}
 if(!info)return <View style={s.center}><Text>Sezione non trovata</Text></View>;
 return <ScrollView style={s.screen} contentContainerStyle={s.content}><Pressable onPress={()=>router.back()}><Text style={s.back}>← Torna indietro</Text></Pressable><Text style={s.icon}>{info.icon}</Text><Text style={s.title}>{info.title}</Text><Text style={s.muted}>{rows.length} elementi</Text><View style={s.add}><TextInput style={s.input} value={value} onChangeText={setValue} placeholder={info.label}/><Pressable style={s.button} onPress={add}><Text style={s.buttonText}>Aggiungi</Text></Pressable></View>{loading?<ActivityIndicator/>:rows.map(r=><View key={r.id} style={s.row}><View style={{flex:1}}><Text style={s.rowTitle}>{r[textFields[table]]||'Elemento'}</Text><Text style={s.muted}>{formatSecondary(r,table)}</Text></View><Pressable onPress={()=>remove(r.id)}><Text style={s.delete}>Elimina</Text></Pressable></View>)}</ScrollView>
}
function formatSecondary(r:any,t:string){if(t==='expenses')return r.amount!=null?`${r.amount} €`:'';if(t==='events')return r.event_date?new Date(r.event_date).toLocaleString('it-IT'):'';if(t==='shopping_items')return r.quantity||'';if(t==='vehicles')return [r.brand,r.model,r.plate].filter(Boolean).join(' · ');return r.notes||r.description||''}
const s=StyleSheet.create({screen:{flex:1,backgroundColor:'#f4f7fb'},content:{padding:18,paddingTop:56,paddingBottom:40},back:{color:'#2563eb',fontWeight:'700',marginBottom:22},icon:{fontSize:42},title:{fontSize:30,fontWeight:'800',marginTop:4},muted:{color:'#667085',fontSize:14},add:{flexDirection:'row',gap:8,marginVertical:20},input:{flex:1,backgroundColor:'#fff',borderWidth:1,borderColor:'#d0d5dd',borderRadius:13,padding:13},button:{backgroundColor:'#2563eb',borderRadius:13,paddingHorizontal:16,justifyContent:'center'},buttonText:{color:'#fff',fontWeight:'700'},row:{backgroundColor:'#fff',borderRadius:16,padding:16,marginBottom:9,flexDirection:'row',alignItems:'center',gap:12},rowTitle:{fontSize:16,fontWeight:'700',marginBottom:3},delete:{color:'#d92d20',fontWeight:'600'},center:{flex:1,alignItems:'center',justifyContent:'center'}});
