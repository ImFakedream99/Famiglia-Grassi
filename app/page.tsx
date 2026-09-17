'use client';
import {useEffect,useState} from 'react';
import {supabase} from '../lib/supabase';

declare global { interface Window { famigliaApp?: { credentials:{get:()=>Promise<any>;set:(credentials:any)=>Promise<boolean>;clear:()=>Promise<boolean>}; updates:{check:()=>Promise<any>;install:()=>Promise<boolean>;onStatus:(callback:(data:any)=>void)=>()=>void} } } }

const sections=[['Famiglia','family_members','Persone, contatti e date importanti'],['Casa','household_tasks','Attività e manutenzione della casa'],['Finanze','expenses','Spese e scadenze'],['Veicoli','vehicles','Auto, assicurazioni e revisioni'],['Documenti','documents','Documenti e date di scadenza'],['Agenda','events','Appuntamenti ed eventi'],['Spesa','shopping_items','Lista della spesa'],['Inventario','inventory','Oggetti, quantità e garanzie'],['Abbonamenti','subscriptions','Servizi e pagamenti ricorrenti'],['Note','notes','Note e informazioni della famiglia']];

export default function Home(){
 const [user,setUser]=useState<any>(null); const [loading,setLoading]=useState(true); const [update,setUpdate]=useState<any>(null);
 useEffect(()=>{
   const client=supabase();
   client.auth.getSession().then(({data})=>{setUser(data.session?.user ?? null);setLoading(false);});
   const {data:{subscription}}=client.auth.onAuthStateChange((_event,session)=>{setUser(session?.user ?? null);setLoading(false);});
   const unsubscribe=window.famigliaApp?.updates.onStatus((data)=>setUpdate(data));
   return ()=>{subscription.unsubscribe();unsubscribe?.()};
 },[]);
 if(loading)return <main className="wrap"><p>Caricamento…</p></main>;
 if(!user)return <Login onLoggedIn={setUser}/>;
 async function checkUpdates(){setUpdate({status:'checking'});const result=await window.famigliaApp?.updates.check();if(result?.error)setUpdate({status:'error',message:result.error});else if(result?.available)setUpdate({status:'available',version:result.version});else setUpdate({status:'not-available'});}
 return <main className="wrap"><div className="top"><div><div className="brand">Famiglia Grassi</div><div className="muted">Area familiare privata</div></div><div style={{display:'flex',gap:8,alignItems:'center'}}><button className="btn secondary" onClick={checkUpdates}>Controlla aggiornamenti</button><button className="btn secondary" onClick={async()=>{await supabase().auth.signOut();setUser(null)}}>Esci</button></div></div>{update?.status==='checking'&&<div className="success">Controllo aggiornamenti…</div>}{update?.status==='available'&&<div className="success">È disponibile la versione {update.version}. Download in corso…</div>}{update?.status==='downloading'&&<div className="success">Aggiornamento in download: {update.percent}%</div>}{update?.status==='downloaded'&&<div className="success">Aggiornamento {update.version} pronto. <button className="linkbtn" type="button" onClick={()=>window.famigliaApp?.updates.install()}>Installa e riavvia</button></div>}{update?.status==='not-available'&&<div className="success">Hai già l'ultima versione.</div>}{update?.status==='error'&&<div className="error">Aggiornamento non disponibile: {update.message}</div>}<div className="grid">{sections.map(([label,table,desc])=><a className="card" key={table} href={'./area/?table='+table}><span className="pill">Tabella</span><h3>{label}</h3><div className="muted">{desc}</div></a>)}</div></main>
}

function Login({onLoggedIn}:{onLoggedIn:(user:any)=>void}){
 const [mode,setMode]=useState<'login'|'register'>('login'); const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [confirm,setConfirm]=useState(''); const [displayName,setDisplayName]=useState(''); const [remember,setRemember]=useState(true);
 const [error,setError]=useState(''); const [message,setMessage]=useState(''); const [busy,setBusy]=useState(false);
 useEffect(()=>{window.famigliaApp?.credentials.get().then((saved)=>{if(saved?.email){setEmail(saved.email);setPassword(saved.password||'');setRemember(true);}}).catch(()=>{})},[]);
 async function go(e:any){
   e.preventDefault(); setError(''); setMessage(''); setBusy(true); const client=supabase();
   if(mode==='register'){
     if(password.length<8){setError('La password deve contenere almeno 8 caratteri.');setBusy(false);return;}
     if(password!==confirm){setError('Le password non coincidono.');setBusy(false);return;}
     const {data,error}=await client.auth.signUp({email:email.trim(),password,options:{data:{display_name:displayName.trim()}}});
     if(error){setError(error.message);setBusy(false);return;}
     if(data.session?.user){if(remember)await window.famigliaApp?.credentials.set({email:email.trim(),password});onLoggedIn(data.session.user);setBusy(false);return;}
     setMessage('Registrazione completata. Controlla la tua email e conferma l’account, poi torna qui per accedere.');
   } else {
     const cleanEmail=email.trim(); const {data,error}=await client.auth.signInWithPassword({email:cleanEmail,password});
     if(error){setError(error.message);} else if(data.user){if(remember)await window.famigliaApp?.credentials.set({email:cleanEmail,password});else await window.famigliaApp?.credentials.clear();onLoggedIn(data.user);}
   }
   setBusy(false);
 }
 return <main className="wrap"><div className="card login"><div className="brand">Famiglia Grassi</div><p className="muted">{mode==='login'?"Accesso all'area familiare":'Crea il tuo account familiare'}</p><form onSubmit={go}>{mode==='register'&&<label className="field">Nome<input type="text" value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="Il tuo nome" autoComplete="name"/></label>}<label className="field">Email<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email"/></label><label className="field">Password<input type="password" required minLength={8} value={password} onChange={e=>setPassword(e.target.value)} autoComplete={mode==='register'?'new-password':'current-password'}/></label>{mode==='login'&&<label style={{display:'flex',gap:8,alignItems:'center',margin:'10px 0 14px'}}><input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)}/> Ricordami su questo PC</label>}{mode==='register'&&<label className="field">Conferma password<input type="password" required minLength={8} value={confirm} onChange={e=>setConfirm(e.target.value)} autoComplete="new-password"/></label>}<button className="btn" disabled={busy}>{busy?'Attendere…':mode==='login'?'Accedi':'Registrati'}</button>{error&&<div className="error">{error}</div>}{message&&<div className="success">{message}</div>}</form><button className="linkbtn" type="button" onClick={()=>{setMode(mode==='login'?'register':'login');setError('');setMessage('')}}>{mode==='login'?'Non hai un account? Registrati':'Hai già un account? Accedi'}</button></div></main>
}
