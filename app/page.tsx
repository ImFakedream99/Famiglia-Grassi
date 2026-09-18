'use client';

import {useEffect,useMemo,useState} from 'react';
import {supabase} from '../lib/supabase';

declare global {
  interface Window {
    famigliaApp?: {
      credentials:{get:()=>Promise<any>;set:(credentials:any)=>Promise<boolean>;clear:()=>Promise<boolean>};
      updates:{check:()=>Promise<any>;install:()=>Promise<boolean>;onStatus:(callback:(data:any)=>void)=>()=>void};
    }
  }
}

const sections = [
  ['👨‍👩‍👧‍👦','Famiglia','family_members','Membri, contatti e date importanti','blue'],
  ['🏠','Casa','household_tasks','Manutenzioni, attività e utenze','green'],
  ['💶','Finanze','expenses','Spese, entrate e scadenze','yellow'],
  ['🚗','Veicoli','vehicles','Auto, assicurazioni e revisioni','red'],
  ['📄','Documenti','documents','Documenti familiari e scadenze','purple'],
  ['📅','Agenda','events','Appuntamenti, eventi e ricorrenze','teal'],
  ['🛒','Spesa','shopping_items','Lista della spesa e acquisti','orange'],
  ['📦','Inventario','inventory','Oggetti, elettrodomestici e garanzie','blue'],
  ['☑','Attività','household_tasks','Cose da fare e promemoria','violet'],
  ['💳','Abbonamenti','subscriptions','Servizi e rinnovi','pink'],
  ['📝','Note','notes','Appunti e informazioni varie','slate'],
];

const nav = [
  ['🏠','Dashboard','./index.html'],
  ['👨‍👩‍👧‍👦','Famiglia','./area/index.html?table=family_members'],
  ['🏡','Casa','./area/index.html?table=household_tasks'],
  ['💶','Finanze','./area/index.html?table=expenses'],
  ['🚗','Veicoli','./area/index.html?table=vehicles'],
  ['📄','Documenti','./area/index.html?table=documents'],
  ['📅','Agenda','./area/index.html?table=events'],
  ['🛒','Spesa','./area/index.html?table=shopping_items'],
  ['📦','Inventario','./area/index.html?table=inventory'],
  ['☑','Attività','./area/index.html?table=household_tasks'],
  ['💳','Abbonamenti','./area/index.html?table=subscriptions'],
  ['📝','Note','./area/index.html?table=notes'],
];

const euro=(n:number)=>n.toLocaleString('it-IT',{minimumFractionDigits:2,maximumFractionDigits:2});
const dateShort=(value:any)=>{
  if(!value)return '—';
  return new Date(value).toLocaleDateString('it-IT',{day:'2-digit',month:'2-digit'});
};
const dateLong=new Intl.DateTimeFormat('it-IT',{weekday:'long',day:'2-digit',month:'long',year:'numeric'});

export default function Home(){
  const [user,setUser]=useState<any>(null),[loading,setLoading]=useState(true),[search,setSearch]=useState(''),[update,setUpdate]=useState<any>(null);
  const [counts,setCounts]=useState<Record<string,number>>({});
  const [finance,setFinance]=useState({expenses:0,incomes:0});
  const [events,setEvents]=useState<any[]>([]),[expenses,setExpenses]=useState<any[]>([]),[reminders,setReminders]=useState<any[]>([]);

  useEffect(()=>{
    const c=supabase();
    c.auth.getSession().then(({data})=>{setUser(data.session?.user??null);setLoading(false)}).catch(()=>setLoading(false));
    const {data:{subscription}}=c.auth.onAuthStateChange((_e,s)=>{setUser(s?.user??null);setLoading(false)});
    const unsub=window.famigliaApp?.updates?.onStatus?.(d=>setUpdate(d));
    return()=>{subscription.unsubscribe();unsub?.()};
  },[]);

  useEffect(()=>{
    if(!user)return;
    const c=supabase();
    Promise.all([
      ...sections.map(async s=>{const {count}=await c.from(s[2]).select('*',{count:'exact',head:true});return [s[2],count??0] as [string,number]}),
      c.from('expenses').select('amount').then(({data})=>(['expenses', (data??[]).reduce((a,r)=>a+Number(r.amount||0),0)] as [string,number])),
      c.from('incomes').select('amount').then(({data})=>(['incomes', (data??[]).reduce((a,r)=>a+Number(r.amount||0),0)] as [string,number]))
    ]).then(v=>{
      const map=Object.fromEntries(v.filter(Array.isArray) as [string,number][]);
      setCounts(map);setFinance({expenses:map.expenses??0,incomes:map.incomes??0});
    }).catch(()=>{});

    Promise.all([
      c.from('events').select('*').order('event_date',{ascending:true}).limit(4),
      c.from('expenses').select('*').order('expense_date',{ascending:false}).limit(4),
      c.from('documents').select('title,expiry_date').not('expiry_date','is',null).order('expiry_date',{ascending:true}).limit(3),
      c.from('vehicles').select('name,insurance_expiry,inspection_expiry').limit(6),
      c.from('maintenance').select('title,next_due').not('next_due','is',null).order('next_due',{ascending:true}).limit(3)
    ]).then(([ev,ex,docs,veh,maint])=>{
      setEvents(ev.data??[]);setExpenses(ex.data??[]);
      const r=[
        ...(docs.data??[]).map(x=>({title:x.title||'Documento',date:x.expiry_date,color:'red'})),
        ...(veh.data??[]).flatMap(x=>[
          x.insurance_expiry?{title:`Assicurazione ${x.name||'veicolo'}`,date:x.insurance_expiry,color:'yellow'}:null,
          x.inspection_expiry?{title:`Revisione ${x.name||'veicolo'}`,date:x.inspection_expiry,color:'blue'}:null
        ]).filter(Boolean),
        ...(maint.data??[]).map(x=>({title:x.title||'Manutenzione',date:x.next_due,color:'green'}))
      ].filter(Boolean).sort((a:any,b:any)=>new Date(a.date).getTime()-new Date(b.date).getTime()).slice(0,4);
      setReminders(r as any[]);
    }).catch(()=>{});
  },[user]);

  const filtered=useMemo(()=>sections.filter(s=>(s[1]+' '+s[3]).toLowerCase().includes(search.toLowerCase())),[search]);
  const total=Object.values(counts).reduce((a,b)=>a+b,0), balance=finance.incomes-finance.expenses;
  const displayName=user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Mario';
  if(loading)return <main className="app-shell"><div className="loading">Caricamento…</div></main>;
  if(!user)return <Login onLoggedIn={setUser}/>;

  async function checkUpdates(){
    setUpdate({status:'checking'});const r=await window.famigliaApp?.updates.check();
    if(r?.error)setUpdate({status:'error',message:r.error});
    else if(r?.available)setUpdate({status:'available',version:r.version});
    else setUpdate({status:'not-available'});
  }

  return <main className="app-shell">
    <aside className="sidebar">
      <div className="side-brand"><div className="brand-mark">👨‍👩‍👧‍👦</div><div><strong>Famiglia Grassi</strong><span>Insieme, sempre</span></div></div>
      <nav className="side-nav">{nav.map(([icon,label,href],i)=><a key={label} className={i===0?'active':''} href={href}><span className="nav-icon">{icon}</span><span>{label}</span></a>)}</nav>
      <div className="side-bottom"><a href="#"><span className="nav-icon">⚙</span><span>Impostazioni</span></a><button onClick={async()=>{await supabase().auth.signOut();setUser(null)}}><span className="nav-icon">↪</span><span>Esci</span></button></div>
    </aside>

    <section className="main-content">
      <header className="topbar">
        <div className="global-search"><span>⌕</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cerca nella famiglia Grassi..." aria-label="Cerca nella famiglia Grassi"/></div>
        <div className="profile"><div className="avatar">●</div><div><strong>{displayName}</strong><span>Proprietario</span></div><span>⌄</span></div>
      </header>

      <div className="content">
        <section className="hero">
          <div className="hero-copy"><h1>Benvenuto, {displayName}!</h1><p>Questa è la tua area personale di gestione familiare.</p><em>Tutto ciò che conta, in un unico posto.</em></div>
          <div className="hero-side"><strong>▣ &nbsp; {dateLong.format(new Date())}</strong><p>“La famiglia è il luogo dove la vita inizia e l'amore non finisce mai.”</p><span>♥</span></div>
        </section>

        {update?.status&&<div className="notice">{update.status==='checking'?'Controllo aggiornamenti…':update.status==='available'?`È disponibile la versione ${update.version}. Download in corso…`:update.status==='downloaded'?<><span>Aggiornamento pronto.</span> <button onClick={()=>window.famigliaApp?.updates.install()}>Installa e riavvia</button></>:update.status==='not-available'?'✓ L’app è aggiornata.':`Aggiornamento non disponibile: ${update.message||'errore'}`}</div>}

        <section className="quick-grid">{filtered.map(([icon,label,table,desc,tone])=><a className="quick-card" key={label} href={`./area/index.html?table=${table}`}><span className={`quick-icon ${tone}`}>{icon}</span><div><h3>{label}</h3><p>{desc}</p></div><b>›</b></a>)}</section>

        <section className="dashboard-panels">
          <Panel title="Prossimi appuntamenti" icon="▣" action="Vedi tutti">
            {events.length?events.map(e=><div className="list-row" key={e.id}><div className="date-box"><strong>{new Date(e.event_date).getDate()}</strong><span>{new Date(e.event_date).toLocaleDateString('it-IT',{month:'short'}).replace('.','').toUpperCase()}</span></div><div><strong>{e.title}</strong><small>{new Date(e.event_date).toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'})}{e.location?' · '+e.location:''}</small></div><span className="row-symbol">›</span></div>):<Empty text="Nessun appuntamento in programma."/>}
          </Panel>
          <Panel title="Spese recenti" icon="◉" action="Vedi tutte">
            {expenses.length?expenses.map(e=><div className="list-row compact" key={e.id}><span className="row-symbol">🛒</span><div><strong>{e.description}</strong><small>{dateShort(e.expense_date)}{e.paid_by?' · '+e.paid_by:''}</small></div><b>€ {euro(Number(e.amount||0))}</b></div>):<Empty text="Nessuna spesa registrata."/>}
          </Panel>
          <Panel title="Promemoria" icon="♧" action="Vedi tutti">
            {reminders.length?reminders.map((r:any,i)=><div className="list-row compact" key={i}><span className={`dot ${r.color}`}></span><div><strong>{r.title}</strong><small>Entro il {dateShort(r.date)}</small></div></div>):<Empty text="Nessuna scadenza imminente."/>}
          </Panel>
        </section>

        <section className="footer-strip"><span>Famiglia Grassi</span><span>v1.0.0</span><span className="online">● Online</span><span className="db-status">▰ Collegato a Supabase</span><button className="update-link" onClick={checkUpdates}>Controlla aggiornamenti</button></section>
      </div>
    </section>
  </main>
}

function Panel({title,icon,action,children}:{title:string;icon:string;action:string;children:React.ReactNode}){return <section className="panel"><div className="panel-head"><h2><span>{icon}</span>{title}</h2><a href="#">{action}</a></div>{children}</section>}
function Empty({text}:{text:string}){return <div className="empty-row">{text}</div>}

function Login({onLoggedIn}:{onLoggedIn:(user:any)=>void}){
 const [mode,setMode]=useState<'login'|'register'>('login'),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[confirm,setConfirm]=useState(''),[displayName,setDisplayName]=useState(''),[remember,setRemember]=useState(true),[error,setError]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>{window.famigliaApp?.credentials.get().then(saved=>{if(saved?.email){setEmail(saved.email);setPassword(saved.password||'');setRemember(true)}}).catch(()=>{})},[]);
 async function go(e:any){e.preventDefault();setError('');setMessage('');setBusy(true);const c=supabase();if(mode==='register'){if(password.length<8){setError('La password deve contenere almeno 8 caratteri.');setBusy(false);return}if(password!==confirm){setError('Le password non coincidono.');setBusy(false);return}const {data,error}=await c.auth.signUp({email:email.trim(),password,options:{data:{display_name:displayName.trim()}}});if(error){setError(error.message);setBusy(false);return}if(data.session?.user){if(remember)await window.famigliaApp?.credentials.set({email:email.trim(),password});onLoggedIn(data.session.user);setBusy(false);return}setMessage('Registrazione completata. Controlla la tua email e conferma l’account.')}else{const clean=email.trim(),{data,error}=await c.auth.signInWithPassword({email:clean,password});if(error)setError(error.message);else if(data.user){if(remember)await window.famigliaApp?.credentials.set({email:clean,password});else await window.famigliaApp?.credentials.clear();onLoggedIn(data.user)}}setBusy(false)}
 return <main className="login-shell"><div className="login-card"><div className="brand-mark large">👨‍👩‍👧‍👦</div><div className="brand-title">Famiglia Grassi</div><p>Il tuo spazio familiare, semplice e sempre a portata di mano.</p><form onSubmit={go}>{mode==='register'&&<label>Nome<input value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="Il tuo nome"/></label>}<label>Email<input type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Password<input type="password" required minLength={8} value={password} onChange={e=>setPassword(e.target.value)}/></label>{mode==='login'?<label className="check"><input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)}/> Ricordami su questo PC</label>:<label>Conferma password<input type="password" required minLength={8} value={confirm} onChange={e=>setConfirm(e.target.value)}/></label>}<button className="login-btn" disabled={busy}>{busy?'Attendere…':mode==='login'?'Accedi':'Registrati'}</button>{error&&<div className="error">{error}</div>}{message&&<div className="success">{message}</div>}</form><button className="switch" onClick={()=>{setMode(mode==='login'?'register':'login');setError('');setMessage('')}}>{mode==='login'?'Non hai un account? Registrati':'Hai già un account? Accedi'}</button></div></main>
}
