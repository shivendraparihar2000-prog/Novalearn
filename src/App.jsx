import React, { Suspense, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as api from './api.js';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { Canvas } from '@react-three/fiber';
import { Float, OrbitControls, Stars } from '@react-three/drei';
import {
  Activity, ArrowDownRight, ArrowLeft, ArrowRight, ArrowUpRight, Atom, Award,
  BarChart3, Bell, BookOpen, Bookmark, Brain, Check, CheckCircle2, ChevronDown,
  ChevronRight, CircleHelp, Clock3, Compass, Flame, GraduationCap, Headphones,
  Home, Lightbulb, LockKeyhole, LogIn, Mail, Menu, MessageCircle, Play, Plus,
  Search, Settings2, ShieldCheck, Sparkles, Star, Target, TrendingUp, Trophy,
  UserRound, Users, X, Zap, Filter, SlidersHorizontal, Eye, EyeOff, ChartNoAxesCombined
} from 'lucide-react';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts';
const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
console.log("Google Client ID loaded:", clientId);
const nav = [
  ['Home', Home], ['Explore', Compass], ['My Learning', BookOpen],
  ['Recommendations', Sparkles], ['Progress', TrendingUp], ['Profile', UserRound]
];
const pages = ['Landing Page','Sign Up / Login','Student Dashboard','Explore Courses','Course / Learning View','Quiz / Assessment','Learner Profile','Recommendations','Progress Analytics','How It Works / About'];
const sampleResources = [
  {id:1,title:'Python Fundamentals: Think in Code',topic:'Programming',level:'Beginner',duration:'24 min',type:'Interactive lesson',match:98,icon:'{ }',tone:'violet',why:'Matches your goal and your recent quiz results.'},
  {id:2,title:'Visualising Data with Python',topic:'Data Science',level:'Intermediate',duration:'32 min',type:'Video lesson',match:94,icon:'◒',tone:'mint',why:'Builds on your strong Python foundations.'},
  {id:3,title:'Statistics Made Intuitive',topic:'Mathematics',level:'Beginner',duration:'18 min',type:'Guided practice',match:91,icon:'∑',tone:'amber',why:'Targets the probability concepts you are developing.'},
  {id:4,title:'Algorithms & Problem Solving',topic:'Computer Science',level:'Intermediate',duration:'28 min',type:'Reading',match:88,icon:'⌘',tone:'blue',why:'Recommended for your next programming milestone.'},
  {id:5,title:'SQL Queries in Real Projects',topic:'Databases',level:'Beginner',duration:'21 min',type:'Interactive lesson',match:85,icon:'▤',tone:'pink',why:'Connects your SQL knowledge to practical tasks.'},
  {id:6,title:'Linear Algebra Visualised',topic:'Mathematics',level:'Intermediate',duration:'35 min',type:'Video lesson',match:82,icon:'⌁',tone:'violet',why:'Supports your current mathematics learning path.'}
];
const performance = [
  {week:'W1',score:52,minutes:80},{week:'W2',score:61,minutes:115},{week:'W3',score:58,minutes:95},
  {week:'W4',score:73,minutes:145},{week:'W5',score:79,minutes:165},{week:'W6',score:86,minutes:190}
];
const sampleTopics = [
  {name:'Python',value:88,state:'Strong mastery',color:'#a89bff',x:50,y:20},
  {name:'SQL',value:76,state:'Strong mastery',color:'#80e0c1',x:78,y:40},
  {name:'Statistics',value:48,state:'Developing',color:'#ffc879',x:70,y:76},
  {name:'Algorithms',value:34,state:'Needs attention',color:'#ff9eac',x:27,y:75},
  {name:'Data science',value:63,state:'Developing',color:'#87b8ff',x:19,y:42}
];

sampleTopics.forEach((t,i)=>{t.icon=['Py','SQL','∑','⌘','DS'][i];});
// Shared app data. Guests see the sample data above; signed-in learners see live data from the backend.
const DataCtx = createContext({courses:sampleResources,recs:sampleResources,topics:sampleTopics,stats:null,profile:null,user:null,recMeta:null,recError:'',history:[]});
const useData = () => useContext(DataCtx);
const initialOf = user => (user?.username||'Guest').charAt(0).toUpperCase();
function Brand({light=false}) {
  return <div className={`brand ${light?'brand-light':''}`}><span className="brand-mark"><Sparkles size={18}/></span><span>nova<span className="brand-accent">learn</span></span></div>;
}
function Orb({small=false}) {
  return <div className={`orb-scene ${small?'orb-small':''}`} aria-label="Abstract 3D learning sphere">
    <div className="orb-halo halo-one"></div><div className="orb-halo halo-two"></div>
    <div className="orb-core"><div className="orb-glint"></div><div className="orb-grid"></div></div>
    <span className="orbit-dot dot-one"></span><span className="orbit-dot dot-two"></span><span className="orbit-dot dot-three"></span>
    <div className="float-book book-one"><BookOpen size={20}/></div>
    <div className="float-book book-two"><Atom size={21}/></div>
    <div className="float-book book-three"><Brain size={20}/></div>
  </div>;
}
function Scene3D() {
  return <div className="three-scene">
    <Canvas camera={{position:[0,0,6],fov:45}} dpr={[1,1.5]}>
      <ambientLight intensity={1.1}/><pointLight position={[4,4,5]} intensity={28} color="#a89bff"/><pointLight position={[-4,-2,3]} intensity={15} color="#68e1c0"/>
      <Suspense fallback={null}><Stars radius={30} depth={5} count={550} factor={2} fade speed={0.3}/>
        <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.5}>
          <mesh><icosahedronGeometry args={[1.15,3]}/><meshPhysicalMaterial color="#8e80ff" roughness={0.2} metalness={0.25} transmission={0.28} thickness={1.4} clearcoat={1}/></mesh>
          <mesh rotation={[0.5,0.3,0.2]}><torusGeometry args={[1.55,0.012,12,160]}/><meshStandardMaterial color="#8f83ff" emissive="#5f53e7" emissiveIntensity={1.8}/></mesh>
          <mesh rotation={[1.2,0.2,0.8]}><torusGeometry args={[1.85,0.009,12,160]}/><meshStandardMaterial color="#7ce5c2" emissive="#4cd7ad" emissiveIntensity={1.5}/></mesh>
        </Float>
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.35} />
      </Suspense>
    </Canvas>
    <div className="scene-label label-a"><span className="mini-dot mint"></span> Your learning orbit <small>5 topics connected</small></div>
    <div className="scene-label label-b"><Sparkles size={14}/> Adaptive path <small>Updated for you</small></div>
  </div>;
}
function Button({children,kind='primary',onClick,icon:Icon,block=false, ...props}) {
  return <button className={`btn btn-${kind} ${block?'btn-block':''}`} onClick={onClick} {...props}>{children}{Icon&&<Icon size={16}/>}</button>;
}
function SectionTitle({eyebrow,title,sub,action}) {
  return <div className="section-title"><div>{eyebrow&&<div className="eyebrow">{eyebrow}</div>}<h2>{title}</h2>{sub&&<p>{sub}</p>}</div>{action}</div>;
}
function Stat({icon:Icon,label,value,change,tone='violet'}) {
  return <div className="stat-card"><div className={`stat-icon ${tone}`}><Icon size={18}/></div><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-change"><ArrowUpRight size={13}/>{change}</div></div>;
}
function ResourceCard({item,onOpen,compact=false}) {
  return <article className={`resource-card ${compact?'resource-compact':''}`}>
    <div className={`resource-art art-${item.tone}`}><span className="art-symbol">{item.icon}</span><span className="art-orbit"></span><span className="art-spark">✦</span></div>
    <div className="resource-body"><div className="resource-meta"><span>{item.topic}</span><span className="meta-dot">·</span><span>{item.level}</span></div>
      <h3>{item.title}</h3><div className="resource-bottom"><span><Clock3 size={13}/>{item.duration}</span><span><Play size={13}/>{item.type}</span></div>
      {!compact&&<Button kind="soft" onClick={()=>onOpen(item)}>View resource <ArrowRight size={15}/></Button>}
    </div>
    {compact&&<div className="match-pill"><Sparkles size={12}/>{item.match}% match</div>}
  </article>;
}
function LearningMap({onTopic}) {
  const {topics}=useData();
  return <div className="learning-map">
    <div className="map-stars"></div><div className="map-orbit orbit-a"></div><div className="map-orbit orbit-b"></div>
    <svg className="map-lines" viewBox="0 0 600 330" preserveAspectRatio="none"><line x1="300" y1="165" x2="300" y2="45"/><line x1="300" y1="165" x2="470" y2="120"/><line x1="300" y1="165" x2="430" y2="275"/><line x1="300" y1="165" x2="165" y2="275"/><line x1="300" y1="165" x2="125" y2="110"/></svg>
    <button className="map-center" onClick={()=>onTopic({name:'Your learning profile',value:68,state:'Personalized overview'})}><span className="center-icon"><GraduationCap size={25}/></span><b>You</b><small>Learning profile</small></button>
    {topics.map((t,i)=><button key={t.name} className={`topic-node node-${i}`} onClick={()=>onTopic(t)}><span className="node-dot" style={{'--node-color':t.color}}>{t.icon}</span><span className="node-label">{t.name}</span><small>{t.value}% mastery</small></button>)}
    <div className="map-caption"><span className="mini-dot mint"></span> Learning map <span className="caption-sep">•</span> Click a topic to explore</div>
  </div>;
}
function Sidebar({page,setPage,collapsed,setCollapsed}) {
  const {user,recs,stats,signOut,openAuth}=useData();
  return <aside className={`sidebar ${collapsed?'sidebar-collapsed':''}`}>
    <div className="side-top"><Brand/><button className="icon-btn sidebar-toggle" onClick={()=>setCollapsed(!collapsed)} aria-label="Toggle sidebar"><Menu size={18}/></button></div>
    <div className="side-section-label">WORKSPACE</div>
    <nav className="side-nav">{nav.map(([label,Icon])=><button key={label} className={`side-link ${page===label?'active':''}`} onClick={()=>setPage(label)} title={label}><Icon size={18}/><span>{label}</span>{label==='Recommendations'&&<span className="nav-count">{recs.length}</span>}</button>)}</nav>
    <div className="sidebar-bottom"><div className="streak-card"><div className="streak-icon"><Flame size={17}/></div><div><b>{stats?stats.streak:6} day streak</b><small>{stats&&stats.streak===0?'Start a session today':"You're on a roll!"}</small></div><ArrowUpRight size={15}/></div><div className="side-profile" role="button" tabIndex={0} style={{cursor:'pointer'}} title={user?'Sign out':'Sign in'} onClick={user?signOut:openAuth}><div className="avatar">{initialOf(user)}</div><div className="profile-text"><b>{user?user.username:'Guest'}</b><small>{user?'Click to sign out':'Click to sign in'}</small></div><ChevronDown size={15}/></div></div>
  </aside>;
}
function Topbar({title,setPage}) {
  const {user}=useData();
  return <header className="topbar"><div className="breadcrumb">Workspace <ChevronRight size={13}/><b>{title}</b></div><div className="top-actions"><button className="icon-btn" aria-label="Search" onClick={()=>setPage('Explore')}><Search size={17}/></button><button className="icon-btn notification" aria-label="Notifications"><Bell size={17}/><i></i></button><div className="top-avatar">{initialOf(user)}</div></div></header>;
}
function HeroLearningScene() {
  return <div className="hero-learning-scene" aria-label="Interactive 3D learning network" onMouseMove={e=>{const r=e.currentTarget.getBoundingClientRect();e.currentTarget.style.setProperty("--px",`${((e.clientX-r.left)/r.width-.5)*28}px`);e.currentTarget.style.setProperty("--py",`${((e.clientY-r.top)/r.height-.5)*22}px`);}} onMouseLeave={e=>{e.currentTarget.style.setProperty("--px","0px");e.currentTarget.style.setProperty("--py","0px");}}>
    <div className="hero-space-glow"></div>
    <svg className="hero-network-lines" viewBox="0 0 900 430" preserveAspectRatio="none" aria-hidden="true">
      <defs><linearGradient id="networkGlow" x1="0" x2="1"><stop stopColor="#8b7dff" stopOpacity=".18"/><stop offset=".5" stopColor="#9edfff" stopOpacity=".95"/><stop offset="1" stopColor="#8c7bff" stopOpacity=".25"/></linearGradient></defs>
      <ellipse cx="450" cy="210" rx="265" ry="92" transform="rotate(-12 450 210)" />
      <ellipse cx="450" cy="210" rx="225" ry="125" transform="rotate(27 450 210)" />
      <path d="M155 194 Q300 80 405 195 T720 143" />
      <path d="M190 310 Q340 210 450 210 T725 286" />
      <path d="M260 100 Q410 250 620 330" />
      <path d="M210 275 Q440 95 695 230" />
    </svg>
    <div className="hero-orb-canvas">
      <Canvas camera={{position:[0,0,5.5],fov:42}} dpr={[1,1.5]}>
        <ambientLight intensity={0.8}/>
        <pointLight position={[2,3,4]} intensity={30} color="#a6dfff"/>
        <pointLight position={[-3,-2,2]} intensity={18} color="#6f6bff"/>
        <Suspense fallback={null}>
          <Stars radius={24} depth={5} count={450} factor={2.1} fade speed={0.25}/>
          <Float speed={1.1} rotationIntensity={0.12} floatIntensity={0.14}>
            <mesh>
              <sphereGeometry args={[1.02,64,64]}/>
              <meshPhysicalMaterial color="#6a9cff" emissive="#173baf" emissiveIntensity={0.48} roughness={0.12} metalness={0.12} transmission={0.28} thickness={1.2} clearcoat={1}/>
            </mesh>
            <mesh scale={1.12}><sphereGeometry args={[1,48,48]}/><meshPhysicalMaterial color="#8edfff" transparent opacity={0.13} roughness={0.08} metalness={0.15} side={2}/></mesh>
            <mesh rotation={[0.42,0.2,0.12]}><torusGeometry args={[1.34,0.012,12,150]}/><meshStandardMaterial color="#8be8ff" emissive="#47bfff" emissiveIntensity={2.3}/></mesh>
            <mesh rotation={[1.12,-0.3,0.6]}><torusGeometry args={[1.5,0.009,12,150]}/><meshStandardMaterial color="#9d8bff" emissive="#6c57ff" emissiveIntensity={2}/></mesh>
          </Float>
        </Suspense>
      </Canvas>
    </div>
    <div className="hero-book hero-book-open book-upper-left" aria-hidden="true"><span className="book-cover"></span><span className="book-page page-left"><i></i><i></i><i></i></span><span className="book-page page-right"><i></i><i></i><i></i></span></div>
    <div className="hero-book hero-book-closed book-lower-left" aria-hidden="true"><span className="closed-cover"><GraduationCap size={34}/></span><span className="closed-pages"></span></div>
    <div className="hero-book hero-book-closed book-upper-right" aria-hidden="true"><span className="closed-cover"><BookOpen size={23}/></span><span className="closed-pages"></span></div>
    <div className="hero-book hero-book-open book-lower-right" aria-hidden="true"><span className="book-cover"></span><span className="book-page page-left"><i></i><i></i><i></i><i></i></span><span className="book-page page-right"><i></i><i></i><i></i><i></i></span></div>
    <span className="hero-space-sphere sphere-teal"></span><span className="hero-space-sphere sphere-violet"></span><span className="hero-space-sphere sphere-blue"></span>
    <div className="hero-node node-personalized"><span><UserRound size={15}/></span><b>Personalized</b></div>
    <div className="hero-node node-tools"><span><Sparkles size={15}/></span><b>Learning Tools</b></div>
    <div className="hero-node node-goals"><span><Target size={15}/></span><b>Learning Goals</b></div>
    <div className="hero-node node-test"><span><CheckCircle2 size={15}/></span><b>Test Practice</b></div>
    <div className="hero-node node-topics"><span><BookOpen size={15}/></span><b>Learning Topics</b></div>
    <div className="hero-node node-master"><span><Brain size={15}/></span><b>Master Topics</b></div>
    <div className="hero-scene-caption"><span className="live-dot"></span> A learning ecosystem that evolves with you</div>
  </div>;
}
function Landing({setPage}) {
  return <div className="landing-page"><header className="landing-nav"><Brand light/><nav><a href="#approach">How it works</a><a href="#features">Why NovaLearn</a><a href="#journey">Your journey</a></nav><div className="landing-actions"><button className="text-btn" onClick={()=>setPage('Sign Up / Login')}>Log in</button><Button onClick={()=>setPage('Sign Up / Login')}>Get started <ArrowRight size={15}/></Button></div></header>
    <section className="hero hero-premium">
      <div className="hero-copy hero-copy-centered">
        <div className="hero-badge"><span className="badge-spark">✦</span> ULTRA-PREMIUM EFFECTS</div>
        <h1>Learning that adapts <span>to you.</span></h1>
        <p className="hero-description">You enable EdTech to implement the smarter path for your learning progression and learning projects.</p>
      </div>
      <HeroLearningScene/>
      <div className="hero-buttons hero-buttons-centered"><Button onClick={()=>setPage('Sign Up / Login')}>Start Learning <ArrowRight size={16}/></Button><Button kind="outline" onClick={()=>document.getElementById('approach')?.scrollIntoView({behavior:'smooth'})}><Play size={15}/> See How It Works</Button></div>
    </section>
    <div className="hero-footnote"><span><ShieldCheck size={14}/> Your goals. Your pace. Your path.</span><span>Scroll to explore <ArrowDownRight size={14}/></span></div>
    <section className="approach-section" id="approach"><div className="eyebrow">A BETTER WAY FORWARD</div><h2>Three steps. <span>One you.</span></h2><p className="section-lead">A learning experience that gets to know you, then grows with you.</p><div className="steps-grid">{[['01','Learn','Explore resources that meet you where you are.',BookOpen],['02','Analyze','Your activity reveals strengths and opportunities.',Brain],['03','Recommend','Get your next best step, tailored to you.',Sparkles]].map(([n,t,d,I])=><div className="step-card" key={t}><div className="step-number">{n}</div><div className="step-icon"><I size={22}/></div><h3>{t}</h3><p>{d}</p><ArrowUpRight className="step-arrow" size={17}/></div>)}</div><div className="landing-cta" id="features"><div><Sparkles size={18}/><span>Ready to find your flow?</span></div><Button onClick={()=>setPage('Sign Up / Login')}>Build your learning path <ArrowRight size={15}/></Button></div></section>
    <footer className="landing-footer"><Brand light/><span>Designed around the way you learn.</span><small>© 2026 NovaLearn</small></footer>
  </div>;
}
function Auth({setPage}) {
  const [show,setShow]=useState(false),[signup,setSignup]=useState(false),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[error,setError]=useState(''),[fullName,setFullName]=useState(''),[tilt,setTilt]=useState({x:0,y:0}),[busy,setBusy]=useState(false);
  const {signIn,signUp,signInWithGoogle}=useData();
  async function submit(e){e.preventDefault();if(busy)return;if(signup&&!fullName.trim())return setError('Enter your full name.');if(!email.includes('@'))return setError('Enter a valid email address.');if(password.length<8)return setError('Password must be at least 8 characters.');
    setBusy(true);setError('');
    try{if(signup)await signUp({fullName,email,password});else await signIn({email,password});setPage('Student Dashboard');}
    catch(err){setError(err.message);setBusy(false);}
  }
  const circuitPaths=[
    'M0 120 H100 L130 150 H210 L240 120 H330', 'M0 174 H72 L102 204 H175 L205 174 H330',
    'M0 238 H95 L124 209 H205 L235 239 H330', 'M0 300 H60 L88 272 H154 L184 300 H330',
    'M0 355 H115 L145 325 H205 L235 355 H330', 'M0 415 H72 L103 445 H178 L208 415 H330',
    'M100 0 V62 L126 88 V120', 'M215 0 V45 L192 68 V105', 'M0 470 H126 L151 445 H220',
  ];
  const particles=[{x:7,y:120,d:'2.8s'},{x:28,y:174,d:'3.6s'},{x:43,y:238,d:'4.1s'},{x:21,y:300,d:'3.3s'},{x:51,y:355,d:'4.5s'},{x:32,y:415,d:'3.9s'}];
  function moveCard(e){if(window.matchMedia('(pointer: coarse)').matches)return;const r=e.currentTarget.getBoundingClientRect();setTilt({x:((e.clientY-r.top)/r.height-.5)*-3,y:((e.clientX-r.left)/r.width-.5)*3});}
  function resetTilt(){setTilt({x:0,y:0});}
  function switchMode(){setSignup(v=>!v);setError('');setShow(false);}
  return <div className="auth-futuristic">
    <div className="auth-ambient" aria-hidden="true" />
    <div className="auth-particles" aria-hidden="true">{Array.from({length:26},(_,i)=><i key={i} style={{'--x':`${(i*37+11)%97}%`,'--y':`${(i*53+7)%94}%`,'--delay':`${-(i%9)*.8}s`,'--size':`${i%4===0?3:2}px`}} />)}</div>
    <svg className="auth-circuit auth-circuit-left" viewBox="0 0 330 500" preserveAspectRatio="none" aria-hidden="true">
      <defs><linearGradient id="circuitLeftGlow"><stop offset="0" stopColor="#4c8dff" stopOpacity=".05"/><stop offset=".65" stopColor="#72caff" stopOpacity=".7"/><stop offset="1" stopColor="#9c8cff" stopOpacity=".15"/></linearGradient></defs>
      {circuitPaths.map((d,i)=><g key={d}><path className="circuit-base" d={d}/><path className={`circuit-flow flow-${i%4}`} d={d} pathLength="100"/></g>)}
      {particles.map((p,i)=><circle key={i} className="circuit-junction" cx={p.x*3.3} cy={p.y} r={i%2?2:2.7} style={{'--delay':p.d}}/>)}
    </svg>
    <svg className="auth-circuit auth-circuit-right" viewBox="0 0 330 500" preserveAspectRatio="none" aria-hidden="true">
      <defs><linearGradient id="circuitRightGlow"><stop offset="0" stopColor="#9c8cff" stopOpacity=".15"/><stop offset=".4" stopColor="#72caff" stopOpacity=".65"/><stop offset="1" stopColor="#4c8dff" stopOpacity=".05"/></linearGradient></defs>
      {circuitPaths.map((d,i)=><g key={d}><path className="circuit-base" d={d} transform="translate(330 0) scale(-1 1)"/><path className={`circuit-flow flow-${(i+2)%4}`} d={d} pathLength="100" transform="translate(330 0) scale(-1 1)"/></g>)}
      {particles.map((p,i)=><circle key={i} className="circuit-junction" cx={330-p.x*3.3} cy={p.y+12} r={i%2?2:2.7} style={{'--delay':p.d}}/>)}
    </svg>
    <header className="auth-topbar"><button className="auth-brand-button" onClick={()=>setPage('Landing Page')} aria-label="NovaLearn home"><Brand light/></button><button className="auth-top-action" onClick={switchMode}>{signup?'Sign In':'Sign Up'} <ArrowRight size={14}/></button></header>
    <main className="auth-center-stage">
      <div className="auth-card-stack" onMouseMove={moveCard} onMouseLeave={resetTilt}>
        <div className="auth-card-back auth-card-back-two" style={{transform:`translate(25px,22px) rotateX(${tilt.x*.45}deg) rotateY(${tilt.y*.45}deg)`}} />
        <div className="auth-card-back auth-card-back-one" style={{transform:`translate(12px,11px) rotateX(${tilt.x*.7}deg) rotateY(${tilt.y*.7}deg)`}} />
        <section className="auth-glass-card" style={{transform:`perspective(1200px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`}}>
          <div className="auth-card-edge" aria-hidden="true" />
          <div className="auth-card-content" key={signup?'signup':'signin'}>
            <div className="auth-symbol"><GraduationCap size={23}/></div>
            <div className="auth-form-kicker"><span /> {signup?'YOUR NEXT CHAPTER':'WELCOME BACK'}</div>
            <h1>{signup?'Create your account':'Sign in to NovaLearn'}</h1>
            <p className="auth-form-subtitle">{signup?'Build a learning path that grows with you.':'Your next learning session is waiting.'}</p>
            <form className="auth-form auth-form-dark" onSubmit={submit}>
              {signup&&<label className="auth-field-label">Full name<div className="auth-input-wrap"><UserRound size={16}/><input value={fullName} onChange={e=>setFullName(e.target.value)} placeholder="Your name" autoComplete="name" required/></div></label>}
              <label className="auth-field-label">Email address<div className="auth-input-wrap"><Mail size={16}/><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required/></div></label>
              <label className="auth-field-label">Password<div className="auth-input-wrap"><LockKeyhole size={16}/><input type={show?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 8 characters" autoComplete={signup?'new-password':'current-password'} required/><button type="button" className="auth-eye-button" aria-label={show?'Hide password':'Show password'} onClick={()=>setShow(!show)}>{show?<EyeOff size={16}/>:<Eye size={16}/>}</button></div></label>
              {!signup&&<div className="auth-options auth-options-dark"><label className="check-label"><input type="checkbox"/> <span>Remember me</span></label><button type="button" className="auth-inline-link" onClick={()=>setError('Password recovery is not connected in demo mode.')}>Forgot password?</button></div>}
              {error&&<div className="auth-error-message" role="status">{error}</div>}
              <button type="submit" className="auth-submit-button" disabled={busy}>{busy?'Please wait…':signup?'Create Account':'Sign In'} <ArrowRight size={16}/></button>
              <div className="auth-divider auth-divider-dark"><span>or continue with</span></div>
              <div className="google-login-wrap"><GoogleLogin onSuccess={async credentialResponse=>{if(!credentialResponse.credential){setError('Google did not return a sign-in credential. Please try again.');return;}setBusy(true);setError('');try{await signInWithGoogle(credentialResponse.credential);setPage('Student Dashboard');}catch(err){setError(err.message||'Google sign-in failed.');}finally{setBusy(false);}}} onError={()=>setError('Google sign-in was cancelled or failed. Please try again.')} text="continue_with" shape="pill" theme="filled_black" width="320" /></div>
              {!signup&&<><button type="button" className="guest-btn auth-guest-button" onClick={()=>{setError('');setPage('Student Dashboard')}}><UserRound size={16}/> Continue as Guest <ArrowRight size={15}/></button><p className="guest-note auth-guest-note">Preview NovaLearn with sample learning data. No account required.</p></>}
              <div className="auth-switch auth-switch-dark">{signup?'Already have an account?':'New to NovaLearn?'} <button type="button" className="auth-inline-link" onClick={switchMode}>{signup?'Sign In':'Create an account'}</button></div>
              {signup&&<p className="auth-signup-note"><ShieldCheck size={13}/> Your information stays yours.</p>}
            </form>
          </div>
        </section>
      </div>
      <div className="auth-pagination" aria-hidden="true"><span/><span className="active"/><span/></div>
    </main>
    <div className="auth-corner-star" aria-hidden="true"><Sparkles size={25}/></div>
    <div className="auth-bottom-caption"><span className="auth-status-dot"/> A learning space built around you</div>
  </div>;
}
function Dashboard({setPage,onOpen,onTopic}) {
  const {recs:resources,courses,stats,user}=useData();
  const top=resources[0]||(user?courses[0]:null)||sampleResources[0];
  const hour=new Date().getHours(),part=hour<12?'morning':hour<18?'afternoon':'evening';
  return <><div className="welcome-row"><div><div className="eyebrow">{new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'}).toUpperCase()}</div><h1>Good {part}, {user?user.username.replace(/_\d{4}$/,'').replace(/_/g,' '):'learner'} <span className="wave">✦</span></h1><p>Every step counts. Let's make today's a good one.</p></div><Button kind="soft" onClick={()=>setPage('Explore')}><Compass size={16}/> Explore resources</Button></div>
    <div className="stats-grid"><Stat icon={Flame} label="Current streak" value={stats?`${stats.streak} days`:'6 days'} change={stats?'Consecutive active days':'+2 days this week'} tone="amber"/><Stat icon={Clock3} label="Learning time" value={stats?stats.time:'4h 32m'} change={stats?'All time':'+18% this week'} tone="violet"/><Stat icon={Target} label="Average quiz score" value={stats?stats.avgQuiz:'86%'} change={stats?'Recent quizzes':'+8% this month'} tone="mint"/><Stat icon={Trophy} label="Resources completed" value={stats?String(stats.completed):'24'} change={stats?'All time':'3 this week'} tone="blue"/></div>
    <div className="dashboard-grid"><section className="panel map-panel"><div className="panel-heading"><div><div className="eyebrow">YOUR PERSONAL LEARNING SPACE</div><h2>Your learning map</h2></div><button className="icon-btn" onClick={()=>setPage('Profile')}><ArrowUpRight size={17}/></button></div><LearningMap onTopic={onTopic}/><div className="map-legend"><span><i className="legend-dot strong"></i> Strong mastery</span><span><i className="legend-dot developing"></i> Developing</span><span><i className="legend-dot attention"></i> Needs attention</span></div></section>
    <section className="panel next-panel"><div className="panel-heading"><div><div className="eyebrow">YOUR NEXT BEST RESOURCE</div><h2>Made for your next step</h2></div>{top.match!=null&&<span className="match-pill"><Sparkles size={12}/>{top.match}% match</span>}</div><div className="next-art"><div className="next-art-orb"></div><span className="next-code">{top.icon}</span><div className="next-art-label"><span>PERSONALIZED PICK</span><b>Build on what you know.</b></div></div><div className="resource-meta"><span>{top.topic}</span><span>·</span><span>{top.level}</span></div><h3>{top.title}</h3><p className="muted">{top.why}</p><div className="next-footer"><span><Clock3 size={14}/> {top.duration}</span><Button onClick={()=>onOpen(top)}>Start learning <ArrowRight size={15}/></Button></div></section></div>
    <section className="recommended-section"><SectionTitle eyebrow="A LITTLE MORE PERSONAL" title="Picked for you" sub="Resources that fit your goals, pace, and progress." action={<button className="inline-link" onClick={()=>setPage('Recommendations')}>View all recommendations <ArrowRight size={15}/></button>}/><div className="resource-grid">{resources.slice(0,3).map(r=><ResourceCard key={r.id} item={r} onOpen={onOpen}/>)}</div></section>
  </>;
}
function Explore({onOpen}) {
  const {courses:resources}=useData();
  const [query,setQuery]=useState(''),[topic,setTopic]=useState('All topics'),[level,setLevel]=useState('All levels'),[format,setFormat]=useState('All formats');
  const filtered=resources.filter(r=>(r.title+' '+r.topic).toLowerCase().includes(query.toLowerCase())&&(topic==='All topics'||r.topic===topic)&&(level==='All levels'||r.level===level)&&(format==='All formats'||r.type===format));
  return <><SectionTitle eyebrow="EXPLORE YOUR CURIOSITY" title="Find your next thing." sub="A library of learning, shaped around what you want to achieve."/><div className="explore-tools"><div className="search-field"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search courses, topics, skills..."/></div><div className="filter-wrap"><SlidersHorizontal size={16}/><span>Filters</span><select value={topic} onChange={e=>setTopic(e.target.value)}>{['All topics',...new Set(resources.map(r=>r.topic))].map(x=><option key={x}>{x}</option>)}</select><select value={level} onChange={e=>setLevel(e.target.value)}>{['All levels','Beginner','Intermediate','Advanced'].map(x=><option key={x}>{x}</option>)}</select><select value={format} onChange={e=>setFormat(e.target.value)}>{['All formats',...new Set(resources.map(r=>r.type))].map(x=><option key={x}>{x}</option>)}</select></div></div><div className="results-line"><span><b>{filtered.length}</b> resources to explore</span><button className="inline-link" onClick={()=>{setQuery('');setTopic('All topics');setLevel('All levels');setFormat('All formats')}}>Reset filters <X size={13}/></button></div><div className="resource-grid explore-grid">{filtered.map(r=><ResourceCard key={r.id} item={r} onOpen={onOpen}/>)}</div>{filtered.length===0&&<div className="empty-state"><Search size={28}/><h3>No resources found</h3><p>Try a different search or clear a filter.</p></div>}</>;
}
function CourseView({course,onBack,onQuiz,onComplete}) {
  const [completed,setCompleted]=useState(false);
  const item=course||sampleResources[0];
  const {user,track}=useData();
  useEffect(()=>{ // time_spent is sent when the lesson closes; <5s (e.g. StrictMode's dev remount) is ignored
    if(!user||!item?.id)return;
    const t0=Date.now();
    return()=>{const s=Math.round((Date.now()-t0)/1000);if(s>=5)track(item.id,'time_spent',s);};
  },[user,item?.id]);
  return <><button className="back-link" onClick={onBack}><ArrowLeft size={15}/> Back to Explore</button><div className="course-layout"><div className="course-main"><div className={`course-hero art-${item.tone}`}><div className="course-hero-content"><span className="eyebrow">YOUR LEARNING SPACE</span><div className="course-big-symbol">{item.icon}</div><span className="level-chip">{item.level} · {item.topic}</span></div><div className="course-hero-orbit"></div></div><div className="course-title-row"><div><h1>{item.title}</h1><p className="muted">A guided learning experience built around your pace.</p></div><button className="icon-btn"><Bookmark size={18}/></button></div><div className="lesson-progress"><div><span>Course progress</span><b>{completed?'100%':'35%'}</b></div><div className="progress-track"><i style={{width:completed?'100%':'35%'}}/></div></div><div className="lesson-content"><div className="eyebrow">LESSON 01 · THE FOUNDATIONS</div><h2>Start with the big idea</h2><p>Great learning starts with understanding why a concept matters. In this lesson, you'll explore the core ideas, connect them to what you already know, and practice using them in a real context.</p><div className="learning-callout"><Lightbulb size={20}/><div><b>Think about it</b><p>How would you explain this idea to a friend who is just starting out?</p></div></div><h3>What you'll take away</h3><ul className="takeaway-list"><li><CheckCircle2 size={16}/> Understand the core concept and vocabulary</li><li><CheckCircle2 size={16}/> Connect theory to a practical example</li><li><CheckCircle2 size={16}/> Check your understanding with a short quiz</li></ul></div></div><aside className="course-sidebar panel"><div className="eyebrow">IN THIS COURSE</div><h3>Your learning path</h3>{[['01','The foundations','8 min',true],['02','Explore the concept','10 min',false],['03','Put it into practice','6 min',false]].map(([n,t,d,active])=><div className={`lesson-item ${active?'current':''}`} key={n}><span className="lesson-num">{active?<Play size={12}/>:n}</span><div><b>{t}</b><small>{d}</small></div>{active&&<span className="current-dot"></span>}</div>)}<div className="course-side-note"><Sparkles size={15}/><span>This resource was selected to match your current learning goals.</span></div><Button block onClick={onQuiz}>Take the quick quiz <ArrowRight size={15}/></Button><Button block kind={completed?'soft':'outline'} onClick={()=>{setCompleted(true);onComplete?.()}}>{completed?<><Check size={15}/> Completed</>:'Mark lesson complete'}</Button></aside></div></>;
}
function Quiz({course,onBack,onSubmit}) {
  const {user}=useData();
  const [qs,setQs]=useState(null),[err,setErr]=useState(''),[idx,setIdx]=useState(0),[answers,setAnswers]=useState({}),[result,setResult]=useState(null),[busy,setBusy]=useState(false),[t0]=useState(()=>Date.now());
  useEffect(()=>{
    if(!user||!course?.id)return;
    let live=true;
    api.getCourse(course.id).then(c=>{if(live)setQs(c.quiz||[]);}).catch(e=>{if(live)setErr(e.message);});
    return()=>{live=false;};
  },[user,course?.id]);
  const q=qs?.[idx],picked=q?answers[q.id]:undefined,last=!!qs&&idx===qs.length-1;
  async function finish(){
    setBusy(true);setErr('');
    try{const res=await api.submitQuiz(course.id,answers,Math.round((Date.now()-t0)/1000));setResult(res);onSubmit(res);}
    catch(e){setErr(e.message);}
    finally{setBusy(false);}
  }
  const message=!user?'Sign in to take quizzes and track your progress.':err&&!qs?err:qs===null?'Loading quiz…':qs.length===0?'This course has no quiz yet.':null;
  return <><button className="back-link" onClick={onBack}><ArrowLeft size={15}/> Back to lesson</button><div className="quiz-wrap">
    <div className="quiz-top"><div><div className="eyebrow">QUICK KNOWLEDGE CHECK</div><h1>Let's see what stuck.</h1><p className="muted">{course?.title}</p></div>{qs&&qs.length>0&&!result&&<div className="quiz-counter">QUESTION <b>{String(idx+1).padStart(2,'0')}</b> <span>/ {String(qs.length).padStart(2,'0')}</span></div>}</div>
    {message&&<div className="quiz-card panel"><p className="muted">{message}</p></div>}
    {!message&&result&&<div className="quiz-card panel">
      <div className={`answer-feedback ${result.passed?'good':'try-again'}`}><Sparkles size={18}/><div><b>{result.passed?'Nicely done!':'Good effort — keep going.'}</b><p>You scored {result.score}% ({result.correct} of {result.total} correct). The pass mark is {result.pass_score}%.</p></div></div>
      <div className="answer-list">{result.results.map((r,i)=><div key={r.question_id} className={`answer-option ${r.correct?'correct':'incorrect'}`}><span className="answer-letter">{i+1}</span><span>{qs.find(x=>x.id===r.question_id)?.question}</span>{r.correct?<CheckCircle2 size={18}/>:<X size={18}/>}</div>)}</div>
      <div className="quiz-card-footer"><span><Clock3 size={14}/> Your profile and recommendations were updated</span><Button onClick={onBack}>Continue learning <ArrowRight size={15}/></Button></div>
    </div>}
    {!message&&!result&&q&&<><div className="quiz-progress"><i style={{width:`${((idx+1)/qs.length)*100}%`}}/></div><div className="quiz-card panel">
      <div className="quiz-tags"><span className="tag">{course?.topic}</span><span className="tag tag-easy">{course?.level}</span></div>
      <h2>{q.question}</h2><p className="muted">Choose the best answer.</p>
      <div className="answer-list">{q.options.map((o,i)=><button key={i} className={`answer-option ${picked===i?'selected':''}`} onClick={()=>setAnswers(a=>({...a,[q.id]:i}))}><span className="answer-letter">{String.fromCharCode(65+i)}</span><span>{o}</span>{picked===i?<span className="radio-selected"/>:null}</button>)}</div>
      {err&&<div className="answer-feedback try-again"><Sparkles size={18}/><div><p>{err}</p></div></div>}
      <div className="quiz-card-footer"><span><Clock3 size={14}/> No time pressure</span><div style={{display:'flex',gap:8}}>{idx>0&&<Button kind="outline" onClick={()=>setIdx(idx-1)}>Previous</Button>}{last?<Button disabled={picked===undefined||busy} onClick={finish}>{busy?'Submitting…':'Submit quiz'} <ArrowRight size={15}/></Button>:<Button disabled={picked===undefined} onClick={()=>setIdx(idx+1)}>Next <ArrowRight size={15}/></Button>}</div></div>
    </div></>}
    <div className="quiz-reassurance"><ShieldCheck size={15}/> This is a space to learn, not to be perfect.</div>
  </div></>;
}
function Profile({onTopic}) {
  const {topics,user,stats,profile}=useData();
  return <><SectionTitle eyebrow="GET TO KNOW YOURSELF" title="Your learning profile." sub="A clearer picture of what you know — and where you're headed." action={<Button kind="soft"><Settings2 size={15}/> Profile settings</Button>}/><div className="profile-overview panel"><div className="profile-avatar-large">{initialOf(user)}</div><div className="profile-intro"><h2>{user?user.username.replace(/_\d{4}$/,'').replace(/_/g,' '):'Curious learner'}</h2><p>Building consistency, one session at a time.</p><div className="profile-tags"><span><Flame size={13}/> {stats?stats.streak:6}-day streak</span><span><BookOpen size={13}/> {stats?stats.completed:24} resources completed</span><span><Clock3 size={13}/> {stats?stats.weekHours:4.5} hrs this week</span></div></div><div className="profile-score"><div className="score-ring"><span>{profile?Math.round(profile.engagement_metric*100):68}</span><small>/100</small></div><div><b>{profile?'Engagement (last 30 days)':'Learning momentum'}</b><small>Moving in the right direction</small></div></div></div><div className="profile-grid"><section className="panel"><div className="panel-heading"><div><h2>Topic mastery</h2><p className="muted">Your current understanding, topic by topic.</p></div><button className="icon-btn"><ArrowUpRight size={16}/></button></div><div className="mastery-list">{topics.map(t=><button className="mastery-row" key={t.name} onClick={()=>onTopic(t)}><span className="mastery-icon" style={{background:t.color+'24',color:t.color}}>{t.icon}</span><span className="mastery-info"><b>{t.name}</b><small>{t.state}</small><span className="progress-track"><i style={{width:t.value+'%',background:t.color}}/></span></span><strong>{t.value}%</strong><ChevronRight size={15}/></button>)}</div></section><section className="panel learning-style"><div className="eyebrow">YOUR LEARNING RHYTHM</div><h2>Finding your flow</h2><div className="rhythm-stat"><span className="rhythm-icon"><Clock3 size={19}/></span><div><small>Average session</small><b>26 minutes</b></div></div><div className="rhythm-stat"><span className="rhythm-icon mint"><Zap size={19}/></span><div><small>Most active time</small><b>Evening learner</b></div></div><div className="rhythm-stat"><span className="rhythm-icon amber"><Brain size={19}/></span><div><small>Learning preference</small><b>Practice-first</b></div></div><div className="profile-insight"><Lightbulb size={17}/><p>You tend to retain more when you follow a short concept lesson with a quick practice quiz.</p></div></section></div></>;
}
function Recommendations({onOpen}) {
  const {recs:resources,recMeta,recError,refreshRecs}=useData();
  return <><SectionTitle eyebrow="YOUR PERSONAL LEARNING GUIDE" title="A next step that fits." sub="Ranked for your goals, current mastery, and learning pace." action={<button className="icon-btn" aria-label="Refresh recommendations" title="Refresh recommendations" onClick={refreshRecs}><SlidersHorizontal size={17}/></button>}/><div className="recommendation-banner"><div className="rec-banner-icon"><Sparkles size={23}/></div><div><span>YOUR PATH, PERSONALIZED</span><h3>Small, focused steps create real momentum.</h3><p>These picks are designed to build on what you know next.</p></div><div className="rec-banner-orb"><Orb small/></div></div><div className="recommendation-list">{resources.slice(0,5).map((r,i)=><article className={`recommendation-row ${i===0?'top-pick':''}`} key={r.id}><div className="rank-number">{String(i+1).padStart(2,'0')}</div><div className={`recommendation-art art-${r.tone}`}><span>{r.icon}</span></div><div className="recommendation-details"><div className="resource-meta"><span>{r.topic}</span><span>·</span><span>{r.level}</span></div><h3>{r.title}</h3><p><Lightbulb size={13}/>{r.why}</p><div className="resource-bottom"><span><Clock3 size={13}/>{r.duration}</span><span><Play size={13}/>{r.type}</span></div></div><div className="recommendation-match"><div className="match-ring" style={{'--match':r.match+'%'}}><span>{r.match}</span></div><small>MATCH</small></div><Button kind={i===0?'primary':'outline'} onClick={()=>onOpen(r)}>{i===0?'Start now':'View resource'} <ArrowRight size={14}/></Button></article>)}</div>{resources.length===0&&<div className="empty-state"><Sparkles size={28}/><h3>No recommendations yet</h3><p>{recError||'Open a course or take a quiz, then refresh.'}</p></div>}<div className="rec-footnote"><ShieldCheck size={15}/> {recMeta?((recMeta.cold_start_fallback_active?'Early recommendations based on limited activity; they sharpen as you learn.':'Ranked by a hybrid content and collaborative model.')+(recMeta.model_includes_demo_data?' The model was trained on demo data.':'')):recError?recError:'Sample rankings shown. Sign in to see recommendations based on your own activity.'}</div></>;
}
function Analytics() {
  const [range,setRange]=useState('6 weeks');
  const activity=[{day:'Mon',mins:35},{day:'Tue',mins:52},{day:'Wed',mins:25},{day:'Thu',mins:68},{day:'Fri',mins:43},{day:'Sat',mins:75},{day:'Sun',mins:30}];
  const completion=[{name:'Completed',value:24,color:'#8b7cff'},{name:'In progress',value:8,color:'#83e0c2'},{name:'Saved',value:5,color:'#f8c779'}];
  return <><SectionTitle eyebrow="YOUR PROGRESS, IN PERSPECTIVE" title="Look how far you've come." sub="Small wins add up. Here's your learning story so far." action={<select className="range-select" value={range} onChange={e=>setRange(e.target.value)}><option>6 weeks</option><option>30 days</option><option>7 days</option></select>}/><div className="stats-grid analytics-stats"><Stat icon={Clock3} label="Time invested" value="12h 40m" change="+18% vs last period" tone="violet"/><Stat icon={Award} label="Quiz average" value="78%" change="+12% vs last period" tone="mint"/><Stat icon={CheckCircle2} label="Completed" value="24" change="3 this week" tone="blue"/><Stat icon={Flame} label="Best streak" value="9 days" change="Keep it going" tone="amber"/></div><div className="analytics-grid"><section className="panel chart-panel"><div className="panel-heading"><div><h2>Quiz performance</h2><p className="muted">Your scores are trending up.</p></div><span className="chart-legend"><i></i> Score</span></div><div className="chart-area"><ResponsiveContainer width="100%" height="100%"><AreaChart data={performance}><defs><linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8c7cff" stopOpacity={0.25}/><stop offset="100%" stopColor="#8c7cff" stopOpacity={0.01}/></linearGradient></defs><CartesianGrid strokeDasharray="3 5" stroke="#ecebf4" vertical={false}/><XAxis dataKey="week" axisLine={false} tickLine={false} tick={{fill:'#9998ac',fontSize:11}}/><YAxis domain={[0,100]} axisLine={false} tickLine={false} tick={{fill:'#9998ac',fontSize:11}}/><Tooltip/><Area type="monotone" dataKey="score" stroke="#8b7cff" strokeWidth={3} fill="url(#scoreFill)" activeDot={{r:5}}/></AreaChart></ResponsiveContainer></div><div className="chart-insight"><TrendingUp size={16}/><span>Your latest score is <b>34 points higher</b> than your first recorded quiz.</span></div></section><section className="panel chart-panel"><div className="panel-heading"><div><h2>Time spent learning</h2><p className="muted">Minutes per day this week.</p></div><span className="chart-legend mint-legend"><i></i> Minutes</span></div><div className="chart-area"><ResponsiveContainer width="100%" height="100%"><BarChart data={activity}><CartesianGrid strokeDasharray="3 5" stroke="#ecebf4" vertical={false}/><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill:'#9998ac',fontSize:11}}/><YAxis axisLine={false} tickLine={false} tick={{fill:'#9998ac',fontSize:11}}/><Tooltip/><Bar dataKey="mins" fill="#8edfc5" radius={[7,7,2,2]} maxBarSize={30}/></BarChart></ResponsiveContainer></div><div className="chart-insight mint-insight"><Clock3 size={16}/><span>Saturday is your most active learning day.</span></div></section><section className="panel chart-panel completion-panel"><div className="panel-heading"><div><h2>Resource progress</h2><p className="muted">Your learning library at a glance.</p></div></div><div className="donut-wrap"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={completion} dataKey="value" nameKey="name" innerRadius={58} outerRadius={82} paddingAngle={5} stroke="none">{completion.map((x,i)=><Cell key={i} fill={x.color}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer><div className="donut-center"><b>37</b><small>resources</small></div></div><div className="completion-legend">{completion.map(x=><div key={x.name}><span><i style={{background:x.color}}/>{x.name}</span><b>{x.value}</b></div>)}</div></section></div><div className="analytics-note"><Lightbulb size={17}/><div><b>Keep the momentum going</b><p>Short, consistent sessions can be more effective than occasional long study blocks. Your recent activity suggests you're building a helpful rhythm.</p></div></div></>;
}
function About({setPage}) {
  const steps=[{n:'01',icon:Activity,title:'Activity logging',desc:'Learning sessions, quiz attempts, and completions help the system understand how you learn.'},{n:'02',icon:Brain,title:'Learner profile',desc:'Your profile brings together topic mastery, learning pace, interests, and areas to strengthen.'},{n:'03',icon:BookOpen,title:'Content-based filtering',desc:'Resources are matched to your current skills, goals, topic interests, and preferred formats.'},{n:'04',icon:Users,title:'Collaborative signals',desc:'Where enough anonymous learning patterns exist, similar learner journeys can help surface useful resources.'},{n:'05',icon:Sparkles,title:'Hybrid ranking',desc:'Signals are combined to rank relevant next steps, then refreshed as your learning evolves.'}];
  return <><section className="about-hero"><div className="eyebrow">THE THINKING BEHIND YOUR PATH</div><h1>Personalized isn't a feature.<br/><span>It's the whole point.</span></h1><p>NovaLearn connects the dots between what you learn, how you learn, and what could help you grow next.</p><div className="about-hero-art"><div className="about-node node-left"><BookOpen size={20}/><span>Activity</span></div><div className="about-node node-center"><Brain size={27}/><span>Your profile</span></div><div className="about-node node-right"><Sparkles size={20}/><span>Next best step</span></div><div className="about-connection c1"></div><div className="about-connection c2"></div><div className="about-orbit-ring"></div></div></section><div className="about-process"><SectionTitle eyebrow="BEHIND THE EXPERIENCE" title="A little science. A lot more you." sub="Five steps help turn learning activity into a more personal path."/><div className="process-list">{steps.map((s,i)=><div className="process-step" key={s.n}><div className="process-number">{s.n}</div><div className="process-icon"><s.icon size={21}/></div><div className="process-copy"><h3>{s.title}</h3><p>{s.desc}</p></div><div className="process-line">{i<steps.length-1&&<span/>}</div></div>)}</div></div><div className="about-bottom"><div className="about-bottom-orb"><Orb small/></div><div><div className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</div><h2>Curiosity looks good on you.</h2><p>Find a resource, take a small step, and let your next recommendation grow from there.</p><Button onClick={()=>setPage('Explore')}>Explore your next step <ArrowRight size={15}/></Button></div></div></>;
}
function Modal({topic,onClose}) {
  if(!topic)return null;
  return <div className="modal-backdrop" onClick={onClose}><div className="topic-modal" onClick={e=>e.stopPropagation()}><button className="icon-btn modal-close" onClick={onClose}><X size={17}/></button><div className="auth-icon"><Target size={23}/></div><div className="eyebrow">TOPIC INSIGHT</div><h2>{topic.name}</h2><p className="muted">{topic.state||'Personalized overview'}</p><div className="modal-score"><b>{topic.value??68}%</b><span>current mastery</span></div><div className="progress-track"><i style={{width:(topic.value??68)+'%'}}/></div><p className="modal-copy">Keep building with short practice sessions and resources selected for your current level.</p><Button block onClick={onClose}>Got it <Check size={15}/></Button></div></div>;
}
function AppContent() {
  const [user,setUser]=useState(()=>api.session.get()?.user||null);
  const [page,setPage]=useState(()=>api.session.get()?'Student Dashboard':'Landing Page'),[collapsed,setCollapsed]=useState(false),[course,setCourse]=useState(sampleResources[0]),[modal,setModal]=useState(null),[quizScore,setQuizScore]=useState(null),[toast,setToast]=useState('');
  const guestData={courses:sampleResources,recs:sampleResources,topics:sampleTopics,stats:null,profile:null,history:[],recMeta:null,recError:''};
  const [data,setData]=useState(guestData);
  const loadAll=useCallback(async()=>{
    const [c,r,p,g]=await Promise.allSettled([api.fetchAllCourses(),api.getRecommendations(),api.getProfile(),api.getProgress()]);
    setData({
      courses:c.status==='fulfilled'?c.value.map(api.adaptCourse):[],
      recs:r.status==='fulfilled'?r.value.recommendations.map(api.adaptRecommendation):[],
      recMeta:r.status==='fulfilled'?r.value:null,
      recError:r.status==='rejected'?r.reason.message:'',
      topics:p.status==='fulfilled'?api.adaptMastery(p.value.topic_mastery).slice(0,5):[],
      profile:p.status==='fulfilled'?p.value:null,
      stats:g.status==='fulfilled'?api.buildStats(g.value):null,
      history:g.status==='fulfilled'?g.value.history:[],
    });
    if(c.status==='rejected')showToast(c.reason.message);
  },[]);
  const refreshRecs=useCallback(async()=>{
    try{const r=await api.refreshRecommendations();setData(d=>({...d,recs:r.recommendations.map(api.adaptRecommendation),recMeta:r,recError:''}));}
    catch(e){setData(d=>({...d,recError:e.message}));}
  },[]);
  // Fire-and-forget activity logging; also refreshes stats/profile afterwards.
  const track=useCallback((courseId,eventType,seconds)=>{api.logActivity(courseId,eventType,seconds).then(()=>loadAll()).catch(()=>{});},[loadAll]);
  const signOut=useCallback(()=>{api.session.clear();setUser(null);setData(guestData);setPage('Landing Page');},[]);
  const openAuth=useCallback(()=>setPage('Sign Up / Login'),[]);
  async function establish(res){api.session.set({token:res.access_token,user:res.user});setUser(res.user);await loadAll();}
  const signIn=useCallback(async({email,password})=>establish(await api.login(email,password)),[loadAll]);
  const signInWithGoogle=useCallback(async(credential)=>establish(await api.googleLogin(credential)),[loadAll]);
  const signUp=useCallback(async({fullName,email,password})=>establish(await api.signup(api.makeUsername(fullName,email),email,password)),[loadAll]);
  useEffect(()=>{
    api.setUnauthorizedHandler(()=>{setUser(null);setData(guestData);setPage('Sign Up / Login');showToast('Your session expired. Please sign in again.');});
    if(api.session.get())loadAll();
  },[]);
  const ctx={...data,user,signIn,signUp,signInWithGoogle,signOut,openAuth,track,refreshRecs};
  const appPage=page!=='Landing Page'&&page!=='Sign Up / Login';
  function openCourse(item){setCourse(item);setPage('Course / Learning View');if(user&&item.id)track(item.id,'view');}
  async function markComplete(){
    if(!user){showToast('Sign in to save your progress.');return;}
    try{await api.logActivity(course.id,'completion');showToast('Lesson marked complete.');loadAll();}catch(e){showToast(e.message);}
  }
  function showToast(msg){setToast(msg);setTimeout(()=>setToast(''),2600);}
  const pageComponent=()=>{
    switch(page){
      case 'Landing Page':return <Landing setPage={setPage}/>;
      case 'Sign Up / Login':return <Auth setPage={setPage}/>;
      case 'Home':case 'Student Dashboard':return <Dashboard setPage={setPage} onOpen={openCourse} onTopic={setModal}/>;
      case 'Explore':case 'Explore Courses':return <Explore onOpen={openCourse}/>;
      case 'My Learning':return <><SectionTitle eyebrow="YOUR LEARNING SPACE" title="Keep your momentum." sub="Pick up where you left off and keep moving forward."/><div className="resource-grid">{(()=>{const seen=[...new Set(data.history.map(h=>h.course_id))].map(id=>data.courses.find(c=>c.id===id)).filter(Boolean);return(seen.length?seen:data.courses).slice(0,3);})().map(r=><ResourceCard key={r.id} item={r} onOpen={openCourse}/>)}</div><div className="panel my-learning-note"><BookOpen size={21}/><div><h3>Your learning path is taking shape.</h3><p>Complete a lesson or quiz to keep your progress moving.</p></div><Button onClick={()=>setPage('Explore')}>Explore more <ArrowRight size={15}/></Button></div></>;
      case 'Course / Learning View':return <CourseView course={course} onBack={()=>setPage('Explore')} onQuiz={()=>setPage('Quiz / Assessment')} onComplete={markComplete}/>;
      case 'Quiz / Assessment':return <Quiz course={course} onBack={()=>setPage('Course / Learning View')} onSubmit={res=>{setQuizScore(res.score);showToast(`Quiz saved: ${res.score}%`);loadAll();}}/>;
      case 'Learner Profile':case 'Profile':return <Profile onTopic={setModal}/>;
      case 'Recommendations':return <Recommendations onOpen={openCourse}/>;
      case 'Progress':case 'Progress Analytics':return <Analytics/>;
      case 'How It Works / About':return <About setPage={setPage}/>;
      default:return <Dashboard setPage={setPage} onOpen={openCourse} onTopic={setModal}/>;
    }
  };
  return <DataCtx.Provider value={ctx}><div className={`app-root ${appPage?'app-shell':''}`}>
    {appPage&&<><Sidebar page={page} setPage={setPage} collapsed={collapsed} setCollapsed={setCollapsed}/><main className="main-area"><Topbar title={page} setPage={setPage}/><div className="page-content">{pageComponent()}</div><footer className="app-footer"><span>© 2026 NovaLearn</span><span><span className="mini-dot mint"></span> Your learning journey, your pace.</span><button className="footer-about" onClick={()=>setPage('How It Works / About')}>How it works <ArrowUpRight size={13}/></button></footer></main><button className="floating-help" aria-label="Help" onClick={()=>setModal({name:'Need a hand?',value:100,state:'Learning support'})}><CircleHelp size={18}/></button></>}
    {!appPage&&pageComponent()}
    {modal&&<Modal topic={modal} onClose={()=>setModal(null)}/>}
    {toast&&<div className="toast"><CheckCircle2 size={17}/>{toast}</div>}
  </div></DataCtx.Provider>;
}

// Client ID is public by design; server-side token verification is the security boundary.
export default function App() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId) {
    console.error('Missing VITE_GOOGLE_CLIENT_ID. Add it to the frontend .env file.');
  }
  return <GoogleOAuthProvider clientId={clientId || 'missing-google-client-id'}><AppContent /></GoogleOAuthProvider>;
}
