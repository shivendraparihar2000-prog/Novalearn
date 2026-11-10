import React, { Suspense, createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import * as api from './api.js';
import { useBrowserNavigation } from './useBrowserNavigation.js';
import { loadYouTubeIFrameAPI, createYouTubePlayerController } from './youtubePlayerController.js';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { Canvas } from '@react-three/fiber';
import { Float, OrbitControls, Stars } from '@react-three/drei';
import {
  Activity, ArrowDownRight, ArrowLeft, ArrowRight, ArrowUpRight, Atom, Award,
  BarChart3, Bell, BookOpen, Bookmark, Brain, Check, CheckCircle2, ChevronDown,
  ChevronRight, CircleHelp, Clock3, Compass, Flame, GraduationCap, Headphones,
  Home, Lightbulb, LockKeyhole, LogIn, Mail, Menu, MessageCircle, Pause, Play, Plus,
  RefreshCw, Search, Settings2, ShieldCheck, Sparkles, Star, Target, TrendingUp, Trophy,
  UserRound, Users, X, Zap, Filter, SlidersHorizontal, Eye, EyeOff, ChartNoAxesCombined,
  Timer, Coffee, FileText, Send, AlertCircle, Heart
} from 'lucide-react';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts';
const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
console.log("Google Client ID loaded:", clientId);
const nav = [
  ['Home', Home], ['Explore', Compass], ['My Learning', BookOpen],
  ['Recommendations', Sparkles], ['Journey', GraduationCap], ['Focus Mode', Timer], ['Diagnostic', Brain], ['Progress', TrendingUp], ['Profile', UserRound]
];
const pages = ['Landing Page','Sign Up / Login','Student Dashboard','Explore Courses','Course / Learning View','Quiz / Assessment','Learner Profile','Recommendations','Learning Journey','Progress Analytics','Focus Mode','Guardian Dashboard','How It Works / About'];
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
const DataCtx = createContext({courses:sampleResources,recs:sampleResources,topics:sampleTopics,stats:null,profile:null,knowledge:null,user:null,recMeta:null,recError:'',history:[]});
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
  const guardianNav = user?.role === 'guardian' ? [['Guardian Dashboard', ShieldCheck]] : [];
  return <aside className={`sidebar ${collapsed?'sidebar-collapsed':''}`}>
    <div className="side-top"><Brand/><button className="icon-btn sidebar-toggle" onClick={()=>setCollapsed(!collapsed)} aria-label="Toggle sidebar"><Menu size={18}/></button></div>
    <div className="side-section-label">WORKSPACE</div>
    <nav className="side-nav">{[...nav,...guardianNav].map(([label,Icon])=><button key={label} className={`side-link ${page===label?'active':''}`} onClick={()=>setPage(label)} title={label}><Icon size={18}/><span>{label}</span>{label==='Recommendations'&&<span className="nav-count">{recs.length}</span>}</button>)}</nav>
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
    try{if(signup){await signUp({fullName,email,password});setPage('Onboarding');}else{await signIn({email,password});setPage('Student Dashboard');}}
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
function Onboarding({setPage}) {
  const [category,setCategory]=useState(''),[grade,setGrade]=useState(''),[email,setEmail]=useState(''),[status,setStatus]=useState(''),[busy,setBusy]=useState(false),[initialLoading,setInitialLoading]=useState(true);
  const school=category.startsWith('class_'); const required=category==='class_1_8'||category==='class_9_10'; const optional=category==='class_11_12';

  useEffect(() => {
    let active = true;
    api.getOnboardingStatus().then(st => {
      if (!active) return;
      if (st.education_category) {
        setCategory(st.education_category);
        if (st.school_grade) setGrade(String(st.school_grade));
      }
      if (st.next_step === 'dashboard') {
        setPage('Student Dashboard');
      } else if (st.next_step === 'diagnostic') {
        setStatus('Education category confirmed. You can now take a quick diagnostic to find your starting point.');
      } else if (st.guardian_policy === 'required' && !st.guardian_linked) {
        setStatus('A verified guardian invitation is required before onboarding can finish.');
      }
    }).catch(() => {}).finally(() => {
      if (active) setInitialLoading(false);
    });
    return () => { active = false; };
  }, [setPage]);

  async function continueFlow(e){e.preventDefault();setBusy(true);setStatus('');try{await api.saveEducation(category,school?Number(grade):null);if(required||optional){setStatus(required?'A verified guardian invitation is required before onboarding can finish.':'You may invite a guardian now or continue independently.');}else setPage('Student Dashboard');}catch(err){setStatus(err.message)}finally{setBusy(false)}}
  async function sendInvite(){try{await api.inviteGuardian(email);setStatus('A secure invitation was sent. Your guardian must use the email link to create or sign in to their own account.')}catch(err){setStatus(err.message)}}
  async function continueIndependently(){setBusy(true);setStatus('');try{await api.completeOnboarding();setPage('Student Dashboard')}catch(err){setStatus(err.message)}finally{setBusy(false)}}
  if (initialLoading) {
    return <div className="page-content"><section className="panel" style={{maxWidth:650,margin:'40px auto',padding:32,textAlign:'center'}}><p className="muted">Loading onboarding status…</p></section></div>;
  }
  return <div className="page-content"><section className="panel" style={{maxWidth:650,margin:'40px auto',padding:32}}><div className="eyebrow">SET UP YOUR LEARNING SPACE</div><h2>Tell us where you are learning.</h2><p className="muted">This helps us apply the right account and guardian options. You can continue later.</p><form onSubmit={continueFlow} className="auth-form"><label>Education category<select value={category} onChange={e=>{setCategory(e.target.value);setGrade('')}} required><option value="">Choose one</option><option value="class_1_8">Classes 1–8</option><option value="class_9_10">Classes 9–10</option><option value="class_11_12">Classes 11–12</option><option value="university">University student</option><option value="independent">Independent learner</option></select></label>{school&&<label>Class / grade<select value={grade} onChange={e=>setGrade(e.target.value)} required><option value="">Choose grade</option>{Array.from({length:category==='class_1_8'?8:category==='class_9_10'?2:2},(_,i)=>{const n=(category==='class_1_8'?1:category==='class_9_10'?9:11)+i;return <option key={n} value={n}>{n}</option>})}</select></label>}<Button block disabled={busy||!category||(school&&!grade)}>{busy?'Saving…':'Continue'} <ArrowRight size={15}/></Button></form>{(required||optional)&&status&&<div className="panel" style={{marginTop:18,padding:16}}><p>{status}</p><label>Guardian email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="guardian@example.com"/></label><Button kind="soft" onClick={sendInvite} disabled={!email}>Send secure invitation</Button>{optional&&<Button kind="outline" onClick={continueIndependently} disabled={busy}>Continue independently</Button>}</div>}</section></div>;
}
function Dashboard({setPage,onOpen,onTopic}) {
  const {recs:resources,courses,stats,user,profile}=useData();
  const [activeJourney, setActiveJourney] = useState(null);
  const [journeyProgress, setJourneyProgress] = useState(null);

  useEffect(() => {
    if (!user) return;
    let live = true;
    api.listLearningJourneys().then(r => {
      if (!live) return;
      const current = r.journeys?.find(j => j.status === 'in_progress') || r.journeys?.[0];
      if (current) {
        setActiveJourney(current);
        api.getJourneyProgress(current.id).then(pr => {
          if (live) setJourneyProgress(pr.progress);
        }).catch(() => {});
      }
    }).catch(() => {});
    return () => { live = false; };
  }, [user]);

  const top=resources[0]||(user?courses[0]:null)||sampleResources[0];
  const hour=new Date().getHours(),part=hour<12?'morning':hour<18?'afternoon':'evening';
  return <><div className="welcome-row"><div><div className="eyebrow">{new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'}).toUpperCase()}</div><h1>Good {part}, {user?user.username.replace(/_\d{4}$/,'').replace(/_/g,' '):'learner'} <span className="wave">✦</span></h1><p>Every step counts. Let's make today's a good one.</p></div><div style={{display:'flex',gap:10}}><Button kind="soft" onClick={()=>setPage('Focus Mode')}><Timer size={16}/> Focus Mode</Button><Button kind="soft" onClick={()=>setPage('Explore')}><Compass size={16}/> Explore resources</Button></div></div>
    <div className="stats-grid"><Stat icon={Flame} label="Current streak" value={stats?`${stats.streak} days`:'6 days'} change={stats?'Consecutive active days':'+2 days this week'} tone="amber"/><Stat icon={Clock3} label="Learning time" value={stats?stats.time:'4h 32m'} change={stats?'All time':'+18% this week'} tone="violet"/><Stat icon={Target} label="Average quiz score" value={stats?stats.avgQuiz:'86%'} change={stats?'Recent quizzes':'+8% this month'} tone="mint"/><Stat icon={Trophy} label="Resources completed" value={stats?String(stats.completed):'24'} change={stats?'All time':'3 this week'} tone="blue"/></div>

    {activeJourney && (
      <section className="panel" style={{padding:20,marginBottom:24,background:'rgba(140,124,255,0.05)',borderColor:'rgba(140,124,255,0.2)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:12}}>
          <div>
            <div className="eyebrow" style={{color:'#8c7cff'}}>ACTIVE LEARNING JOURNEY</div>
            <h2 style={{margin:'4px 0 2px',fontSize:20}}>{activeJourney.title}</h2>
            <p className="muted" style={{fontSize:13,margin:0}}>{activeJourney.primary_subject} · {journeyProgress ? `${journeyProgress.completed_steps} of ${journeyProgress.total_steps} steps complete (${journeyProgress.overall_completion_percentage}%)` : 'In progress'}</p>
          </div>
          <div style={{display:'flex',gap:8}}>
            <Button kind="primary" onClick={()=>setPage('Focus Mode')}><Timer size={15}/> Study in Focus Mode</Button>
            <Button kind="outline" onClick={()=>setPage('Journey')}>View Journey <ArrowRight size={15}/></Button>
          </div>
        </div>
        {journeyProgress && (
          <div className="progress-track" style={{height:6,marginTop:12}}>
            <i style={{width:`${journeyProgress.overall_completion_percentage}%`,background:'#8c7cff'}}/>
          </div>
        )}
      </section>
    )}

    <div className="dashboard-grid"><section className="panel map-panel"><div className="panel-heading"><div><div className="eyebrow">YOUR PERSONAL LEARNING SPACE</div><h2>Your learning map</h2></div><button className="icon-btn" onClick={()=>setPage('Profile')}><ArrowUpRight size={17}/></button></div><LearningMap onTopic={onTopic}/><div className="map-legend"><span><i className="legend-dot strong"></i> Demonstrated mastery (&ge;85%, verified)</span><span><i className="legend-dot developing"></i> Developing</span><span><i className="legend-dot attention"></i> Not yet assessed</span></div></section>
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
function Diagnostic({setPage}) {
  const {user}=useData();
  const [session,setSession]=useState(null),[question,setQuestion]=useState(null),[pick,setPick]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
  async function begin(){setBusy(true);setError('');try{const r=await api.startDiagnostic();setSession(r.session);const n=await api.getNextDiagnosticQuestion(r.session.session_id);setSession(n.session);setQuestion(n.question);}catch(e){setError(e.message);}finally{setBusy(false);}}
  async function submit(){if(pick===null||!question)return;setBusy(true);setError('');try{const r=await api.submitDiagnosticAnswer(session.session_id,question.session_question_id,pick);setSession(r.session);setPick(null);const n=await api.getNextDiagnosticQuestion(session.session_id);setSession(n.session);setQuestion(n.question);}catch(e){setError(e.message);}finally{setBusy(false);}}
  if(!user)return <div className="quiz-card panel"><h2>Discover your starting point</h2><p className="muted">Sign in to take a short diagnostic.</p><Button onClick={()=>setPage('Sign Up / Login')}>Sign in <ArrowRight size={15}/></Button></div>;
  if(!session)return <div className="quiz-wrap"><div className="quiz-card panel"><div className="eyebrow">PERSONALIZED DIAGNOSTIC</div><h1>Find your starting point.</h1><p className="muted">A focused 90–120 second check-in using the subjects and topics in your profile. You can safely return if interrupted.</p>{error&&<p className="auth-error-message">{error}</p>}<Button disabled={busy} onClick={begin}>{busy?'Preparing…':'Start diagnostic'} <ArrowRight size={15}/></Button></div></div>;
  if(!question)return <div className="quiz-wrap"><div className="quiz-card panel"><div className="eyebrow">DIAGNOSTIC COMPLETE</div><h1>Thanks for checking in.</h1><p className="muted">Your responses were saved. Personalized insights will appear as the assessment experience develops.</p><Button onClick={()=>setPage('Student Dashboard')}>Back to dashboard <ArrowRight size={15}/></Button></div></div>;
  const progress=session.progress;
  return <div className="quiz-wrap"><button className="back-link" onClick={()=>setPage('Student Dashboard')}><ArrowLeft size={15}/> Save and return later</button><div className="quiz-top"><div><div className="eyebrow">PERSONALIZED DIAGNOSTIC</div><h1>One question at a time.</h1><p className="muted">{question.subject} · {question.topic}</p></div><div className="quiz-counter">QUESTION <b>{String(question.position).padStart(2,'0')}</b> <span>/ {String(progress.total).padStart(2,'0')}</span></div></div><div className="quiz-progress"><i style={{width:`${(progress.answered/progress.total)*100}%`}}/></div><div className="quiz-card panel"><h2>{question.question}</h2><p className="muted">Choose the answer that feels most accurate.</p><div className="answer-list">{question.options.map((option,index)=><button key={index} className={`answer-option ${pick===index?'selected':''}`} onClick={()=>setPick(index)}><span className="answer-letter">{String.fromCharCode(65+index)}</span><span>{option}</span>{pick===index&&<span className="radio-selected"/>}</button>)}</div>{error&&<p className="auth-error-message">{error}</p>}<div className="quiz-card-footer"><span><Clock3 size={14}/> Your progress is saved after each answer</span><Button disabled={pick===null||busy} onClick={submit}>{busy?'Saving…':'Continue'} <ArrowRight size={15}/></Button></div></div></div>;
}
function Profile({onTopic}) {
  const {topics,user,stats,profile,knowledge,saveProfile}=useData(); const [editing,setEditing]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState(''); const [draft,setDraft]=useState({});
  function begin(){setDraft({academic_level:profile?.academic_level||'',selected_subjects:(profile?.selected_subjects||[]).join(', '),selected_topics:(profile?.selected_topics||[]).join(', '),learning_goals:(profile?.learning_goals||[]).join(', '),preferred_pace:profile?.preferred_pace||'balanced',explanation_depth:profile?.explanation_depth||'standard',teaching_approach:profile?.teaching_approach||'mixed',preferred_difficulty:profile?.preferred_difficulty||'adaptive',learning_preferences:profile?.learning_preferences||[]});setMessage('');setEditing(true)}
  async function save(){setBusy(true);setMessage('');try{const list=v=>v.split(',').map(x=>x.trim()).filter(Boolean);await saveProfile({...draft,selected_subjects:list(draft.selected_subjects),selected_topics:list(draft.selected_topics),learning_goals:list(draft.learning_goals)});setEditing(false);setMessage('Profile saved.')}catch(e){setMessage(e.message)}finally{setBusy(false)}}
  return <><SectionTitle eyebrow="GET TO KNOW YOURSELF" title="Your learning profile." sub="A clearer picture of what you know — and where you're headed." action={<Button kind="soft" onClick={begin}><Settings2 size={15}/> Profile settings</Button>}/>{message&&<div className="panel" style={{padding:14,marginBottom:16}}>{message}</div>}{editing&&<section className="panel" style={{padding:22,marginBottom:20}}><div className="panel-heading"><div><h2>Learning preferences</h2><p className="muted">Saved securely to your profile.</p></div></div><div className="auth-form"><label>Academic level<input value={draft.academic_level} onChange={e=>setDraft({...draft,academic_level:e.target.value})}/></label><label>Subjects (comma-separated)<input value={draft.selected_subjects} onChange={e=>setDraft({...draft,selected_subjects:e.target.value})}/></label><label>Topics (comma-separated)<input value={draft.selected_topics} onChange={e=>setDraft({...draft,selected_topics:e.target.value})}/></label><label>Goals (comma-separated)<input value={draft.learning_goals} onChange={e=>setDraft({...draft,learning_goals:e.target.value})}/></label><label>Preferred pace<select value={draft.preferred_pace} onChange={e=>setDraft({...draft,preferred_pace:e.target.value})}><option value="slow">Slow</option><option value="balanced">Balanced</option><option value="fast">Fast</option></select></label><label>Explanation depth<select value={draft.explanation_depth} onChange={e=>setDraft({...draft,explanation_depth:e.target.value})}><option value="concise">Concise</option><option value="standard">Standard</option><option value="detailed">Detailed</option></select></label><label>Teaching approach<select value={draft.teaching_approach} onChange={e=>setDraft({...draft,teaching_approach:e.target.value})}><option value="guided">Guided</option><option value="socratic">Question-led</option><option value="project_based">Project based</option><option value="mixed">Mixed</option></select></label><label>Difficulty<select value={draft.preferred_difficulty} onChange={e=>setDraft({...draft,preferred_difficulty:e.target.value})}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option><option value="adaptive">Adaptive</option></select></label><div>{[['visual','Visual'],['text','Text-based'],['example_driven','Example-driven'],['practice_oriented','Practice-oriented']].map(([v,l])=><label key={v} style={{display:'inline-flex',gap:7,margin:'8px 14px 0 0'}}><input type="checkbox" checked={draft.learning_preferences.includes(v)} onChange={e=>setDraft({...draft,learning_preferences:e.target.checked?[...draft.learning_preferences,v]:draft.learning_preferences.filter(x=>x!==v)})}/>{l}</label>)}</div><div style={{display:'flex',gap:10}}><Button onClick={save} disabled={busy}>{busy?'Saving…':'Save preferences'}</Button><Button kind="outline" onClick={()=>setEditing(false)} disabled={busy}>Cancel</Button></div></div></section>}<div className="profile-overview panel"><div className="profile-avatar-large">{initialOf(user)}</div><div className="profile-intro"><h2>{user?user.username.replace(/_\d{4}$/,'').replace(/_/g,' '):'Curious learner'}</h2><p>{profile?.learning_goals?.length?profile.learning_goals.join(' · '):'Building consistency, one session at a time.'}</p><div className="profile-tags"><span><Flame size={13}/> {stats?stats.streak:6}-day streak</span><span><BookOpen size={13}/> {stats?stats.completed:24} resources completed</span><span><Clock3 size={13}/> {stats?stats.weekHours:4.5} hrs this week</span></div></div><div className="profile-score"><div className="score-ring"><span>{profile?Math.round(profile.engagement_metric*100):68}</span><small>/100</small></div><div><b>{profile?'Engagement (last 30 days)':'Learning momentum'}</b><small>{profile?.preferred_pace?`${profile.preferred_pace} pace`:'Moving in the right direction'}</small></div></div></div><div className="profile-grid"><section className="panel"><div className="panel-heading"><div><h2>Topic mastery</h2><p className="muted">Your current understanding, topic by topic.</p></div><button className="icon-btn"><ArrowUpRight size={16}/></button></div><div className="mastery-list">{topics.map(t=><button className="mastery-row" key={t.name} onClick={()=>onTopic(t)}><span className="mastery-icon" style={{background:t.color+'24',color:t.color}}>{t.icon}</span><span className="mastery-info"><b>{t.name}</b><small>{t.state}</small><span className="progress-track"><i style={{width:t.value+'%',background:t.color}}/></span></span><strong>{t.value}%</strong><ChevronRight size={15}/></button>)}</div></section><section className="panel learning-style"><div className="eyebrow">YOUR LEARNING RHYTHM</div><h2>Finding your flow</h2><div className="rhythm-stat"><span className="rhythm-icon"><Clock3 size={19}/></span><div><small>Preferred pace</small><b>{profile?.preferred_pace||'Not set'}</b></div></div><div className="rhythm-stat"><span className="rhythm-icon mint"><Zap size={19}/></span><div><small>Teaching approach</small><b>{profile?.teaching_approach?.replace('_',' ')||'Not set'}</b></div></div><div className="rhythm-stat"><span className="rhythm-icon amber"><Brain size={19}/></span><div><small>Learning preferences</small><b>{profile?.learning_preferences?.join(', ')||'Not set'}</b></div></div></section></div></>;
}
function KnowledgeEvidence() {
  const {knowledge}=useData();
  if(!knowledge?.evidence?.length)return null;
  return <section className="panel" style={{padding:22,marginTop:20}}><div className="panel-heading"><div><div className="eyebrow">YOUR EVIDENCE HISTORY</div><h2>How your initial estimates were formed</h2><p className="muted">These are early signals from completed diagnostics, not final mastery labels.</p></div></div><div className="mastery-list">{knowledge.evidence.slice(0,5).map((e,i)=><div className="mastery-row" key={`${e.session_id}-${i}`}><span className="mastery-icon" style={{background:e.outcome==='correct'?'#80e0c124':'#ff9eac24',color:e.outcome==='correct'?'#3aa886':'#d55c72'}}>{e.outcome==='correct'?<Check size={16}/>:<X size={16}/>}</span><span className="mastery-info"><b>{e.topic}</b><small>{e.difficulty} diagnostic evidence · {new Date(e.submitted_at).toLocaleDateString()}</small></span><strong>{e.outcome}</strong></div>)}</div></section>;
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
function LearningJourneyView({setPage}) {
  const {user} = useData();
  const [journey, setJourney] = useState(null);
  const [progress, setProgress] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [activeAssessment, setActiveAssessment] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [assessmentResult, setAssessmentResult] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [adaptLoading, setAdaptLoading] = useState(false);
  const [adaptNotice, setAdaptNotice] = useState('');
  const [activeVideo, setActiveVideo] = useState(null);
  const [videoPlayback, setVideoPlayback] = useState({
    currentTime: 0,
    duration: 300,
    isPlaying: false,
    speed: 1.0,
    intervals: [],
    uniqueWatched: 0,
    thresholdReached: false,
    syncLoading: false,
    syncNotice: '',
    errorNotice: '',
  });

  const ytPlayerRef = useRef(null);
  const ytIntervalRef = useRef(null);
  const lastTimeRef = useRef(null);
  const isPlayingRef = useRef(false);
  const currentIntervalsRef = useRef([]);

  async function loadProgress(journeyId) {
    try {
      const res = await api.getJourneyProgress(journeyId);
      setProgress(res.progress);
    } catch (e) {
      // Non-fatal if progress endpoint fails to fetch
    }
  }

  useEffect(() => {
    if (user) {
      api.listLearningJourneys().then(r => {
        if (r.journeys?.length) {
          const jId = r.journeys[0].id;
          api.getLearningJourney(jId).then(j => {
            setJourney(j.journey);
            loadProgress(jId);
          }).catch(() => {});
        }
      }).catch(() => {});
    }
  }, [user]);

  async function generate() {
    setBusy(true); setError('');
    try {
      const res = await api.createLearningJourney({force_regenerate: true});
      setJourney(res.journey);
      if (res.journey?.id) loadProgress(res.journey.id);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleStartActivity(stepId, actId) {
    if (!journey) return;
    setActionLoading(prev => ({...prev, [actId]: true}));
    try {
      await api.startJourneyActivity(journey.id, actId);
      await loadProgress(journey.id);
      const updated = await api.getLearningJourney(journey.id);
      setJourney(updated.journey);
    } catch (e) {
      setError(e.message);
    } finally {
      setActionLoading(prev => ({...prev, [actId]: false}));
    }
  }

  async function handleAdapt() {
    if (!journey) return;
    setAdaptLoading(true); setAdaptNotice(''); setError('');
    try {
      const res = await api.adaptLearningJourney(journey.id, 'learner_progress_adaptation');
      if (res.adapted) {
        setAdaptNotice(`Journey adapted to Version ${res.current_version_number}: ${res.journey?.current_version?.generation_reason || 'Updated with verified evidence'}`);
      } else {
        setAdaptNotice('Journey is already up to date with your current learning evidence.');
      }
      setJourney(res.journey);
      await loadProgress(journey.id);
    } catch (e) {
      setError(e.message);
    } finally {
      setAdaptLoading(false);
    }
  }

  function handleOpenVideo(stepId, act) {
    const tracking = act.payload?.playback_tracking || {};
    const rawDur = act.payload?.duration_seconds;
    const dur = rawDur !== undefined && rawDur !== null && rawDur > 0 ? rawDur : null;
    const initialIntervals = tracking.watched_intervals || [];
    const initialWatched = tracking.unique_watched_seconds || 0;
    currentIntervalsRef.current = initialIntervals;
    lastTimeRef.current = tracking.position_seconds || 0;
    isPlayingRef.current = false;
    setActiveVideo({stepId, act});
    setVideoPlayback({
      currentTime: tracking.position_seconds || 0,
      duration: dur,
      isPlaying: false,
      speed: 1.0,
      intervals: initialIntervals,
      uniqueWatched: initialWatched,
      thresholdReached: !!tracking.threshold_reached || !!act.is_completed,
      syncLoading: false,
      syncNotice: '',
      errorNotice: '',
    });
  }

  function closeVideoModal() {
    isPlayingRef.current = false;
    if (ytIntervalRef.current) {
      clearInterval(ytIntervalRef.current);
      ytIntervalRef.current = null;
    }
    if (ytPlayerRef.current) {
      try {
        ytPlayerRef.current.destroy();
      } catch (_) {}
      ytPlayerRef.current = null;
    }
    setVideoPlayback(p => ({...p, isPlaying: false}));
    setActiveVideo(null);
  }

  async function syncVideoTelemetry(overrideIntervals = null, eventType = 'timeupdate', overridePos = null) {
    if (!journey || !activeVideo) return;
    const intervalsToSend = overrideIntervals || currentIntervalsRef.current || videoPlayback.intervals;
    const posToSend = overridePos !== null ? overridePos : (ytPlayerRef.current?.getCurrentTime?.() ?? videoPlayback.currentTime);
    setVideoPlayback(prev => ({...prev, syncLoading: true, syncNotice: ''}));
    try {
      const res = await api.updateVideoPlayback(journey.id, activeVideo.act.id, {
        event_type: eventType,
        position_seconds: posToSend,
        intervals: intervalsToSend,
      });
      const t = res.playback_tracking || {};
      setVideoPlayback(prev => ({
        ...prev,
        uniqueWatched: t.unique_watched_seconds ?? prev.uniqueWatched,
        thresholdReached: !!t.threshold_reached,
        syncLoading: false,
        syncNotice: t.threshold_reached ? 'Verified: 80% threshold reached!' : 'Playback telemetry synchronized.',
      }));
      await loadProgress(journey.id);
      const updated = await api.getLearningJourney(journey.id);
      setJourney(updated.journey);
    } catch (e) {
      setVideoPlayback(prev => ({...prev, syncLoading: false, syncNotice: `Sync failed: ${e.message}`}));
    }
  }

  useEffect(() => {
    if (!activeVideo) return;
    const vidId = activeVideo.act.payload?.video_id;
    if (!vidId || vidId.startsWith('vid_')) {
      return;
    }

    let isMounted = true;
    let controller = null;

    async function initController() {
      await loadYouTubeIFrameAPI();
      if (!isMounted) return;

      if (ytPlayerRef.current) {
        try { ytPlayerRef.current.destroy(); } catch (_) {}
        ytPlayerRef.current = null;
      }

      controller = createYouTubePlayerController({
        videoId: vidId,
        containerId: 'yt-player-container',
        startPosition: activeVideo.act.payload?.playback_tracking?.position_seconds || 0,
        initialIntervals: currentIntervalsRef.current,
        onReady: ({ duration }) => {
          if (!isMounted) return;
          if (duration && duration > 0) {
            setVideoPlayback(p => ({ ...p, duration }));
          }
        },
        onStateChange: ({ isPlaying, currentTime, eventType }) => {
          if (!isMounted) return;
          isPlayingRef.current = isPlaying;
          setVideoPlayback(p => ({ ...p, isPlaying, currentTime }));
          syncVideoTelemetry(null, eventType, currentTime);
        },
        onSample: ({ currentTime, intervals, uniqueWatched }) => {
          if (!isMounted) return;
          currentIntervalsRef.current = intervals;
          setVideoPlayback(p => ({
            ...p,
            currentTime,
            intervals,
            uniqueWatched,
          }));
        },
        onError: ({ message }) => {
          if (!isMounted) return;
          setVideoPlayback(p => ({ ...p, errorNotice: message }));
        },
      });

      ytPlayerRef.current = controller;
    }

    initController();

    return () => {
      isMounted = false;
      isPlayingRef.current = false;
      if (controller) {
        try { controller.destroy(); } catch (_) {}
      }
      ytPlayerRef.current = null;
    };
  }, [activeVideo?.act?.id]);

  function togglePlayPause() {
    if (ytPlayerRef.current) {
      try {
        if (videoPlayback.isPlaying) {
          ytPlayerRef.current.pauseVideo();
        } else {
          ytPlayerRef.current.playVideo();
        }
      } catch (_) {}
    } else {
      setVideoPlayback(p => ({...p, syncNotice: 'Real YouTube video player is only active for external YouTube video IDs.'}));
    }
  }

  function handleSeek(newPos) {
    lastTimeRef.current = newPos;
    if (ytPlayerRef.current) {
      try {
        ytPlayerRef.current.seekTo(newPos, true);
      } catch (_) {}
    }
    setVideoPlayback(prev => ({...prev, currentTime: newPos}));
    syncVideoTelemetry(null, 'seeking', newPos);
  }

  function handleSpeedChange(newSpeed) {
    const sp = Number(newSpeed);
    if (ytPlayerRef.current && ytPlayerRef.current.setPlaybackRate) {
      try {
        ytPlayerRef.current.setPlaybackRate(sp);
      } catch (_) {}
    }
    setVideoPlayback(p => ({...p, speed: sp}));
  }

  async function handleAttestUnknownDuration() {
    if (!journey || !activeVideo) return;
    setVideoPlayback(p => ({...p, syncLoading: true, syncNotice: ''}));
    try {
      await api.completeJourneyActivity(journey.id, activeVideo.act.id, { self_attested: true });
      setVideoPlayback(p => ({
        ...p,
        thresholdReached: true,
        syncLoading: false,
        syncNotice: 'Self-attested completion recorded successfully.',
      }));
      await loadProgress(journey.id);
      const updated = await api.getLearningJourney(journey.id);
      setJourney(updated.journey);
    } catch (e) {
      setVideoPlayback(p => ({...p, syncLoading: false, syncNotice: `Attestation failed: ${e.message}`}));
    }
  }

  async function handleCompleteGeneric(stepId, actId) {
    if (!journey) return;
    setActionLoading(prev => ({...prev, [actId]: true}));
    try {
      await api.completeJourneyActivity(journey.id, actId);
      await loadProgress(journey.id);
      const updated = await api.getLearningJourney(journey.id);
      setJourney(updated.journey);
    } catch (e) {
      setError(e.message);
    } finally {
      setActionLoading(prev => ({...prev, [actId]: false}));
    }
  }

  async function handleOpenMilestone(stepId) {
    if (!journey) return;
    setError(''); setAssessmentResult(null); setSelectedAnswers({});
    try {
      const res = await api.getMilestoneAssessment(journey.id, stepId);
      setActiveAssessment({stepId, ...res.milestone_assessment});
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleSubmitMilestone() {
    if (!journey || !activeAssessment) return;
    setBusy(true); setError('');
    try {
      const answersList = Object.entries(selectedAnswers).map(([k, v]) => ({
        item_id: Number(k),
        selected_answer_index: Number(v),
      }));
      const res = await api.submitMilestoneAssessment(journey.id, activeAssessment.stepId, {
        milestone_id: activeAssessment.milestone_id,
        answers: answersList,
      });
      setAssessmentResult(res.milestone_result);
      await loadProgress(journey.id);
      const updated = await api.getLearningJourney(journey.id);
      setJourney(updated.journey);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (!user) return (
    <div className="quiz-card panel">
      <h2>Personalized Learning Journey</h2>
      <p className="muted">Sign in to view your structured learning journey and progress tracking.</p>
      <Button onClick={() => setPage('Sign Up / Login')}>Sign in <ArrowRight size={15}/></Button>
    </div>
  );

  return (
    <>
      <SectionTitle
        eyebrow="PROGRESS TRACKING & MILESTONE ASSESSMENTS"
        title="Your Learning Journey."
        sub="Backend-authoritative progress tracking, verified video completions, and demonstrated mastery evidence."
        action={
          <div style={{display: 'flex', gap: 8, alignItems: 'center'}}>
            {journey && (
              <Button onClick={handleAdapt} disabled={adaptLoading || busy}>
                <RefreshCw size={14} style={{marginRight: 4}} className={adaptLoading ? 'spin' : ''}/>
                {adaptLoading ? 'Adapting…' : 'Adapt Journey'}
              </Button>
            )}
            <Button onClick={generate} disabled={busy || adaptLoading}>
              <Sparkles size={14} style={{marginRight: 4}}/>{busy ? 'Generating…' : journey ? 'Regenerate Journey' : 'Generate Journey'}
            </Button>
          </div>
        }
      />

      {error && <div className="panel" style={{padding: 14, marginBottom: 16, color: '#ff9eac', borderColor: 'rgba(255,100,100,0.3)'}}>{error}</div>}

      {adaptNotice && (
        <div className="panel" style={{padding: 12, marginBottom: 16, background: 'rgba(140,124,255,0.08)', borderColor: 'rgba(140,124,255,0.3)', color: '#b9aaff', fontSize: 13}}>
          {adaptNotice}
        </div>
      )}

      {progress && (
        <div className="panel" style={{padding: 20, marginBottom: 20, background: 'rgba(140,124,255,0.04)'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12}}>
            <div>
              <span className="eyebrow" style={{color: '#8c7cff'}}>AUTHORITATIVE PROGRESS</span>
              <h3 style={{margin: '4px 0 2px'}}>{progress.journey_title}</h3>
              <p className="muted" style={{fontSize: 13, margin: 0}}>
                {progress.completed_steps} of {progress.total_steps} steps completed ({progress.overall_completion_percentage}%)
                {progress.blocked_steps > 0 && ` • ${progress.blocked_steps} step(s) waiting for prerequisites`}
              </p>
            </div>
            <div style={{minWidth: 160}}>
              <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4}}>
                <span className="muted">Completion</span>
                <b>{progress.overall_completion_percentage}%</b>
              </div>
              <div className="progress-track" style={{height: 8}}>
                <i style={{width: `${progress.overall_completion_percentage}%`}}/>
              </div>
            </div>
          </div>
        </div>
      )}

      {journey && (
        <div className="panel" style={{padding: 22, marginBottom: 20}}>
          <div className="panel-heading">
            <div>
              <span className="tag">{journey.primary_subject}</span>
              <h2>{journey.title}</h2>
              <p className="muted">{journey.description}</p>
            </div>
            <div style={{display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap'}}>
              <span className="tag tag-easy">Version {journey.current_version_number}</span>
              {journey.current_version?.generation_reason && (
                <span className="tag" style={{fontSize: 11, background: 'rgba(140,124,255,0.1)'}}>
                  {journey.current_version.generation_reason}
                </span>
              )}
              <span className={`tag ${journey.status === 'completed' ? 'tag-easy' : ''}`} style={{textTransform: 'capitalize'}}>
                {journey.status.replace(/_/g, ' ')}
              </span>
            </div>
          </div>

          <div className="mastery-list" style={{marginTop: 16}}>
            {(journey.steps || []).map(s => {
              const isPrereq = s.metadata?.is_prerequisite_preparation;
              const stepProg = progress?.steps?.find(ps => ps.step_id === s.id);
              const completionStatus = stepProg?.completion_status || s.completion_status || 'not_started';
              const topicProf = stepProg?.topic_proficiency;
              const isBlocked = completionStatus === 'blocked';
              const isCompleted = completionStatus === 'completed';

              return (
                <div
                  className="mastery-row"
                  key={s.id}
                  style={{
                    alignItems: 'flex-start',
                    padding: '18px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    opacity: isBlocked ? 0.6 : 1,
                  }}
                >
                  <span
                    className="mastery-icon"
                    style={{
                      background: isCompleted ? '#80e0c124' : isPrereq ? '#ffc87924' : '#8c7cff24',
                      color: isCompleted ? '#80e0c1' : isPrereq ? '#ffc879' : '#8c7cff',
                      minWidth: 34,
                      minHeight: 34,
                    }}
                  >
                    {isCompleted ? <Check size={16}/> : <b>{s.sequence_position}</b>}
                  </span>

                  <div className="mastery-info" style={{flex: 1}}>
                    <div style={{display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap'}}>
                      <b style={{fontSize: 16}}>{s.title}</b>
                      {isPrereq && (
                        <span className="tag" style={{color: '#ffc879', background: '#ffc87915'}}>
                          Prerequisite Preparation
                        </span>
                      )}
                      <span
                        className={`tag ${isCompleted ? 'tag-easy' : isBlocked ? '' : 'tag-medium'}`}
                        style={{textTransform: 'capitalize'}}
                      >
                        {completionStatus.replace(/_/g, ' ')}
                      </span>
                      {s.metadata?.carried_forward_from_version && (
                        <span className="tag" style={{fontSize: 11, background: 'rgba(128,224,193,0.12)', color: '#80e0c1'}}>
                          Preserved from V{s.metadata.carried_forward_from_version}
                        </span>
                      )}
                      <span className="tag" style={{fontSize: 11}}>
                        Readiness: {s.readiness_status?.replace(/_/g, ' ')}
                      </span>
                      {topicProf?.estimate !== null && topicProf?.estimate !== undefined && (
                        <span
                          className="tag"
                          style={{
                            fontSize: 11,
                            background: topicProf.is_demonstrated ? '#80e0c115' : 'rgba(255,255,255,0.05)',
                            color: topicProf.is_demonstrated ? '#80e0c1' : '#b0b7c3',
                          }}
                        >
                          Topic Mastery: {Math.round(topicProf.estimate * 100)}% ({topicProf.assessment_status})
                        </span>
                      )}
                      {s.estimated_duration_minutes && (
                        <span className="muted" style={{fontSize: 12}}>
                          <Clock3 size={11} style={{display: 'inline', marginRight: 3}}/>
                          {s.estimated_duration_minutes} min
                        </span>
                      )}
                    </div>

                    <small style={{display: 'block', marginTop: 4, color: '#b0b7c3'}}>
                      {s.learning_objective}
                    </small>

                    <div style={{marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8}}>
                      {(s.activities || []).map((a, i) => {
                        const actProg = stepProg?.activities?.find(pa => pa.id === a.id);
                        const aStatus = actProg?.status || a.status || (a.is_completed ? 'completed' : 'not_started');
                        const aCompleted = aStatus === 'completed' || a.is_completed;
                        const aLoading = actionLoading[a.id];

                        return (
                          <div
                            key={i}
                            style={{
                              fontSize: 13,
                              background: 'rgba(255,255,255,0.03)',
                              padding: '10px 14px',
                              borderRadius: 8,
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              flexWrap: 'wrap',
                              gap: 10,
                            }}
                          >
                            <div style={{flex: 1, minWidth: 200}}>
                              <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                                <span style={{fontWeight: 500}}>{a.title}</span>
                                {aCompleted ? (
                                  <span className="tag tag-easy" style={{fontSize: 10}}>Completed</span>
                                ) : aStatus === 'in_progress' ? (
                                  <span className="tag" style={{fontSize: 10, color: '#8c7cff'}}>In Progress</span>
                                ) : (
                                  <span className="tag" style={{fontSize: 10, opacity: 0.6}}>Not Started</span>
                                )}
                              </div>
                              {a.payload?.suitability_outcome && (
                                <span className="muted" style={{display: 'block', fontSize: 11, marginTop: 2}}>
                                  Suitability: {a.payload.suitability_outcome} ({a.payload.suitability_score}%)
                                </span>
                              )}
                            </div>

                            <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                              {!aCompleted && !isBlocked && (
                                <>
                                  {aStatus === 'not_started' && (
                                    <Button
                                      size="sm"
                                      disabled={aLoading}
                                      onClick={() => handleStartActivity(s.id, a.id)}
                                    >
                                      Start Activity
                                    </Button>
                                  )}
                                  {aStatus === 'in_progress' && a.activity_type === 'educational_video' && (
                                    <Button
                                      size="sm"
                                      disabled={aLoading}
                                      onClick={() => handleOpenVideo(s.id, a)}
                                    >
                                      <Play size={12} style={{marginRight: 4}}/>Watch Lesson
                                    </Button>
                                  )}
                                  {aStatus === 'in_progress' && (a.activity_type === 'knowledge_checkpoint' || a.activity_type === 'practice_assessment') && (
                                    <Button
                                      size="sm"
                                      onClick={() => handleOpenMilestone(s.id)}
                                    >
                                      Take Assessment
                                    </Button>
                                  )}
                                  {aStatus === 'in_progress' && a.activity_type !== 'educational_video' && a.activity_type !== 'knowledge_checkpoint' && (
                                    <Button
                                      size="sm"
                                      disabled={aLoading}
                                      onClick={() => handleCompleteGeneric(s.id, a.id)}
                                    >
                                      Complete
                                    </Button>
                                  )}
                                </>
                              )}
                              {aCompleted && (
                                <span className="muted" style={{fontSize: 12, color: '#80e0c1', display: 'flex', alignItems: 'center', gap: 4}}>
                                  <Check size={14}/> Verified
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeVideo && (
        <div className="modal-backdrop" onClick={closeVideoModal}>
          <div className="topic-modal" style={{maxWidth: 620, width: '92%'}} onClick={e => e.stopPropagation()}>
            <button className="icon-btn modal-close" onClick={closeVideoModal}>
              <X size={17}/>
            </button>
            <div className="eyebrow" style={{color: '#8c7cff'}}>VERIFIED EDUCATIONAL VIDEO PLAYER</div>
            <h2 style={{fontSize: 18, margin: '6px 0 2px'}}>{activeVideo.act.title}</h2>
            <p className="muted" style={{fontSize: 13, marginBottom: 12}}>
              {activeVideo.act.payload?.channel_name || 'Educational Resource'}
              {activeVideo.act.payload?.suitability_outcome && (
                <> • <span style={{color: '#80e0c1'}}>Suitability: {activeVideo.act.payload.suitability_outcome} ({activeVideo.act.payload.suitability_score}%)</span></>
              )}
            </p>

            <div style={{position: 'relative', width: '100%', height: 260, background: '#0a0d14', borderRadius: 8, overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
              {activeVideo.act.payload?.video_id && !activeVideo.act.payload.video_id.startsWith('vid_') ? (
                <div id="yt-player-container" style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%'}} />
              ) : (
                <div style={{textAlign: 'center', padding: 20}}>
                  <div style={{width: 48, height: 48, borderRadius: '50%', background: 'rgba(140,124,255,0.15)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#8c7cff', marginBottom: 8}}>
                    <Play size={22}/>
                  </div>
                  <div style={{fontWeight: 600, fontSize: 14}}>{activeVideo.act.title}</div>
                  <small className="muted" style={{display: 'block', marginTop: 4}}>
                    Test/Placeholder video identifier ({activeVideo.act.payload?.video_id || 'unknown'}). Official YouTube IFrame Player attaches to real YouTube video IDs.
                  </small>
                </div>
              )}
            </div>

            {videoPlayback.errorNotice && (
              <div style={{color: '#ff8a80', fontSize: 12, marginTop: 8}}>
                {videoPlayback.errorNotice}
              </div>
            )}

            <div style={{marginTop: 14, background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 8}}>
              <div style={{display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8}}>
                <button
                  className="btn btn-sm"
                  style={{padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 6}}
                  onClick={togglePlayPause}
                >
                  {videoPlayback.isPlaying ? <><Pause size={14}/> Pause</> : <><Play size={14}/> Play</>}
                </button>
                <div style={{flex: 1, display: 'flex', alignItems: 'center', gap: 8}}>
                  <input
                    type="range"
                    min="0"
                    max={videoPlayback.duration || 300}
                    value={Math.round(videoPlayback.currentTime)}
                    onChange={e => handleSeek(Number(e.target.value))}
                    style={{flex: 1, accentColor: '#8c7cff'}}
                  />
                  <span style={{fontSize: 12, fontFamily: 'monospace', minWidth: 80, textAlign: 'right'}}>
                    {Math.floor(videoPlayback.currentTime / 60)}:{String(Math.floor(videoPlayback.currentTime % 60)).padStart(2, '0')} / {videoPlayback.duration ? `${Math.floor(videoPlayback.duration / 60)}:${String(Math.floor(videoPlayback.duration % 60)).padStart(2, '0')}` : 'unknown'}
                  </span>
                </div>
                <select
                  value={videoPlayback.speed}
                  onChange={e => handleSpeedChange(e.target.value)}
                  style={{fontSize: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: 4, padding: '3px 6px'}}
                >
                  <option value={0.75}>0.75x</option>
                  <option value={1.0}>1.0x</option>
                  <option value={1.25}>1.25x</option>
                  <option value={1.5}>1.5x</option>
                  <option value={2.0}>2.0x</option>
                </select>
              </div>

              <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 12, marginTop: 10}}>
                <span className="muted">
                  Uniquely Watched: <b>{Math.round(videoPlayback.uniqueWatched)}s</b> {videoPlayback.duration ? `(${Math.min(100, Math.round((videoPlayback.uniqueWatched / videoPlayback.duration) * 100))}%)` : ''}
                </span>
                <span style={{color: videoPlayback.thresholdReached ? '#80e0c1' : '#ffc879'}}>
                  {videoPlayback.thresholdReached ? '✓ 80% Threshold Reached' : (videoPlayback.duration ? `Required: 80% (${Math.round(videoPlayback.duration * 0.8)}s)` : 'Duration Unknown (Self-attestation or Checkpoint required)')}
                </span>
              </div>
              <div className="progress-track" style={{height: 6, marginTop: 6}}>
                <i style={{
                  width: `${videoPlayback.duration ? Math.min(100, (videoPlayback.uniqueWatched / videoPlayback.duration) * 100) : 0}%`,
                  background: videoPlayback.thresholdReached ? '#80e0c1' : '#8c7cff',
                }}/>
              </div>

              {videoPlayback.syncNotice && (
                <small style={{display: 'block', marginTop: 8, color: videoPlayback.thresholdReached ? '#80e0c1' : '#b0b7c3'}}>
                  {videoPlayback.syncNotice}
                </small>
              )}
            </div>

            <div style={{display: 'flex', gap: 10, marginTop: 16}}>
              {!videoPlayback.duration && !videoPlayback.thresholdReached && (
                <Button
                  variant="secondary"
                  disabled={videoPlayback.syncLoading}
                  onClick={handleAttestUnknownDuration}
                  style={{flex: 1, borderColor: '#ffc879', color: '#ffc879'}}
                >
                  Attest Watched (Unknown Duration)
                </Button>
              )}
              <Button
                variant="secondary"
                disabled={videoPlayback.syncLoading}
                onClick={() => syncVideoTelemetry(null, 'timeupdate')}
                style={{flex: 1}}
              >
                {videoPlayback.syncLoading ? 'Syncing Telemetry…' : 'Sync Progress to Server'}
              </Button>
              <Button
                style={{flex: 1}}
                onClick={closeVideoModal}
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Milestone Assessment Modal */}
      {activeAssessment && (
        <div className="modal-backdrop" onClick={() => !busy && setActiveAssessment(null)}>
          <div className="topic-modal" style={{maxWidth: 620}} onClick={e => e.stopPropagation()}>
            <button className="icon-btn modal-close" onClick={() => setActiveAssessment(null)}><X size={17}/></button>
            <div className="auth-icon"><GraduationCap size={24}/></div>
            <div className="eyebrow">MILESTONE ASSESSMENT</div>
            <h2>{activeAssessment.topic}</h2>
            <p className="muted">
              {activeAssessment.insufficient_evidence
                ? 'Insufficient question bank coverage for this topic. No learner failure recorded.'
                : 'Server-graded milestone questions measuring demonstrated learning progress.'}
            </p>

            {activeAssessment.insufficient_evidence ? (
              <div style={{marginTop: 16}}>
                <div className="panel" style={{padding: 14, background: 'rgba(255,255,255,0.02)'}}>
                  <p className="muted" style={{margin: 0}}>
                    No active diagnostic items exist for {activeAssessment.topic}. The system honestly preserves your record as insufficient evidence rather than failure.
                  </p>
                </div>
                <Button block style={{marginTop: 16}} onClick={() => setActiveAssessment(null)}>Close</Button>
              </div>
            ) : assessmentResult ? (
              <div style={{marginTop: 16}}>
                <div style={{textAlign: 'center', padding: '16px 0'}}>
                  <div style={{fontSize: 32, fontWeight: 700, color: assessmentResult.is_mastered ? '#80e0c1' : '#ffc879'}}>
                    {assessmentResult.score_percentage}%
                  </div>
                  <p className="muted" style={{marginTop: 4}}>
                    Score: {assessmentResult.correct_count} of {assessmentResult.questions_count} correct
                  </p>
                  <div style={{display: 'inline-block', marginTop: 8}}>
                    <span className={`tag ${assessmentResult.is_mastered ? 'tag-easy' : 'tag-medium'}`}>
                      {assessmentResult.is_mastered ? 'Demonstrated Mastery' : 'Completed (Developing)'}
                    </span>
                  </div>
                </div>

                <div style={{maxHeight: 240, overflowY: 'auto', marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8}}>
                  {(assessmentResult.feedback || []).map((fb, idx) => (
                    <div key={idx} style={{padding: 10, background: 'rgba(255,255,255,0.03)', borderRadius: 6, fontSize: 13}}>
                      <div style={{fontWeight: 500, color: fb.is_correct ? '#80e0c1' : '#ff9eac'}}>
                        {fb.is_correct ? '✓ Correct' : '✗ Incorrect'}: {fb.question}
                      </div>
                      {fb.explanation && <small className="muted" style={{display: 'block', marginTop: 4}}>{fb.explanation}</small>}
                    </div>
                  ))}
                </div>

                <Button block style={{marginTop: 16}} onClick={() => setActiveAssessment(null)}>Done</Button>
              </div>
            ) : (
              <div style={{marginTop: 16}}>
                <div style={{maxHeight: 320, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14}}>
                  {(activeAssessment.questions || []).map((q, idx) => (
                    <div key={q.item_id || idx} style={{padding: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 8}}>
                      <div style={{fontWeight: 500, fontSize: 14, marginBottom: 8}}>
                        {idx + 1}. {q.question}
                      </div>
                      <div style={{display: 'flex', flexDirection: 'column', gap: 6}}>
                        {(q.options || []).map((opt, optIdx) => (
                          <label
                            key={optIdx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              fontSize: 13,
                              cursor: 'pointer',
                              padding: '6px 8px',
                              borderRadius: 4,
                              background: selectedAnswers[q.item_id] === optIdx ? 'rgba(140,124,255,0.15)' : 'transparent',
                            }}
                          >
                            <input
                              type="radio"
                              name={`q_${q.item_id}`}
                              checked={selectedAnswers[q.item_id] === optIdx}
                              onChange={() => setSelectedAnswers(prev => ({...prev, [q.item_id]: optIdx}))}
                            />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  block
                  style={{marginTop: 16}}
                  disabled={busy || Object.keys(selectedAnswers).length === 0}
                  onClick={handleSubmitMilestone}
                >
                  {busy ? 'Evaluating…' : 'Submit Answers'}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {!journey && !error && (
        <div className="empty-state">
          <Sparkles size={28}/>
          <h3>No active learning journey</h3>
          <p>Click "Generate Journey" to build a structured educational plan with progress tracking and milestone assessments.</p>
        </div>
      )}
    </>
  );
}

function FocusMode({setPage}) {
  const {user} = useData();
  const [session, setSession] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [studyElapsed, setStudyElapsed] = useState(0);
  const [breakElapsed, setBreakElapsed] = useState(0);
  const [customInterval, setCustomInterval] = useState('');
  const heartbeatTimerRef = useRef(null);
  const tickTimerRef = useRef(null);

  // Fetch current session on mount
  useEffect(() => {
    if (!user) return;
    api.getCurrentFocusSession().then(res => {
      if (res.session) {
        setSession(res.session);
        setStudyElapsed(Math.round(res.session.study_duration_seconds || 0));
        setBreakElapsed(Math.round(res.session.break_duration_seconds || 0));
      }
    }).catch(() => {});
  }, [user]);

  // Local tick timer for display
  useEffect(() => {
    if (!session || session.status === 'completed' || session.status === 'abandoned') return;
    tickTimerRef.current = setInterval(() => {
      if (session.status === 'active') {
        setStudyElapsed(prev => prev + 1);
      } else if (session.status === 'in_break') {
        setBreakElapsed(prev => prev + 1);
      }
    }, 1000);
    return () => clearInterval(tickTimerRef.current);
  }, [session?.status, session?.id]);

  // Heartbeat every 15 seconds while session is active
  useEffect(() => {
    if (!session || (session.status !== 'active' && session.status !== 'in_break')) return;
    heartbeatTimerRef.current = setInterval(async () => {
      try {
        const res = await api.heartbeatFocusSession(session.id, studyElapsed);
        setSession(res.session);
      } catch (_) {}
    }, 15000);
    return () => clearInterval(heartbeatTimerRef.current);
  }, [session?.id, session?.status]);

  async function startSession() {
    setBusy(true); setError('');
    try {
      const ci = customInterval ? Number(customInterval) : null;
      const res = await api.startFocusSession(null, null, ci);
      setSession(res.session);
      setStudyElapsed(Math.round(res.session.study_duration_seconds || 0));
      setBreakElapsed(Math.round(res.session.break_duration_seconds || 0));
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  async function takeBreak() {
    if (!session) return;
    setBusy(true);
    try {
      const res = await api.startNovaBreak(session.id);
      setSession(res.session);
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  async function endBreak() {
    if (!session) return;
    setBusy(true);
    try {
      const res = await api.endNovaBreak(session.id);
      setSession(res.session);
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  async function completeSession() {
    if (!session) return;
    setBusy(true);
    try {
      const res = await api.completeFocusSession(session.id);
      setSession(res.session);
      clearInterval(heartbeatTimerRef.current);
      clearInterval(tickTimerRef.current);
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  async function abandonSession() {
    if (!session) return;
    setBusy(true);
    try {
      const res = await api.abandonFocusSession(session.id);
      setSession(res.session);
      clearInterval(heartbeatTimerRef.current);
      clearInterval(tickTimerRef.current);
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  function resetSession() {
    setSession(null);
    setStudyElapsed(0);
    setBreakElapsed(0);
    setError('');
  }

  const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  const studyLimitSec = (session?.study_interval_minutes || 45) * 60;
  const studyPct = Math.min(100, (studyElapsed / studyLimitSec) * 100);
  const isBreakDue = studyElapsed >= studyLimitSec && session?.status === 'active';

  if (!user) return (
    <div className="quiz-card panel">
      <h2>Focus Mode</h2>
      <p className="muted">Sign in to start a distraction-minimizing study session.</p>
      <Button onClick={() => setPage('Sign Up / Login')}>Sign in <ArrowRight size={15}/></Button>
    </div>
  );

  const isEnded = session && (session.status === 'completed' || session.status === 'abandoned');

  return (
    <>
      <SectionTitle
        eyebrow="DISTRACTION-FREE LEARNING"
        title="Focus Mode."
        sub="Structured study sessions with category-aware timers and NovaBreak."
      />

      {error && <div className="panel" style={{padding: 14, marginBottom: 16, color: '#ff9eac'}}>{error}</div>}

      {!session && (
        <div className="panel" style={{padding: 32, maxWidth: 520, margin: '0 auto', textAlign: 'center'}}>
          <div style={{width: 56, height: 56, borderRadius: '50%', background: 'rgba(140,124,255,0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16}}>
            <Timer size={26} style={{color: '#8c7cff'}}/>
          </div>
          <h2 style={{margin: '0 0 6px'}}>Start a Focus Session</h2>
          <p className="muted" style={{marginBottom: 20}}>Your study timer and break duration are set based on your education category. You can optionally set a custom study interval (15–90 minutes).</p>
          <div style={{display: 'flex', gap: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 16}}>
            <label style={{fontSize: 13}}>Custom study interval (min):
              <input
                type="number" min="15" max="90" placeholder="e.g. 30"
                value={customInterval} onChange={e => setCustomInterval(e.target.value)}
                style={{width: 80, marginLeft: 8, padding: '6px 8px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)', color: '#fff'}}
              />
            </label>
          </div>
          <Button onClick={startSession} disabled={busy}>
            {busy ? 'Starting…' : 'Begin Focus Session'} <ArrowRight size={15}/>
          </Button>
        </div>
      )}

      {session && !isEnded && (
        <div className="panel" style={{padding: 28, maxWidth: 580, margin: '0 auto'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12}}>
            <div>
              <span className="eyebrow" style={{color: session.status === 'in_break' ? '#80e0c1' : '#8c7cff'}}>
                {session.status === 'in_break' ? 'NOVABREAK ACTIVE' : 'STUDY SESSION ACTIVE'}
              </span>
              <h3 style={{margin: '4px 0 0'}}>{session.category?.replace(/_/g, ' ')} · {session.study_interval_minutes} min study / {session.break_duration_minutes} min break</h3>
            </div>
            <span className={`tag ${session.status === 'in_break' ? 'tag-easy' : 'tag-medium'}`} style={{textTransform: 'capitalize'}}>
              {session.status === 'in_break' ? 'On Break' : 'Studying'}
            </span>
          </div>

          {/* Timer display */}
          <div style={{textAlign: 'center', padding: '20px 0'}}>
            <div style={{fontSize: 48, fontWeight: 700, fontFamily: 'monospace', color: session.status === 'in_break' ? '#80e0c1' : '#a89bff', letterSpacing: 2}}>
              {session.status === 'in_break' ? fmt(breakElapsed) : fmt(studyElapsed)}
            </div>
            <p className="muted" style={{margin: '6px 0 0', fontSize: 13}}>
              {session.status === 'in_break'
                ? `Break time · Study: ${fmt(studyElapsed)}`
                : `Study time · Breaks: ${session.break_count || 0} (${fmt(breakElapsed)} total)`}
            </p>
          </div>

          {/* Study progress bar */}
          <div style={{marginBottom: 20}}>
            <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4}}>
              <span className="muted">Study Progress</span>
              <b>{Math.round(studyPct)}%</b>
            </div>
            <div className="progress-track" style={{height: 8}}>
              <i style={{width: `${studyPct}%`, background: isBreakDue ? '#ffc879' : '#8c7cff'}}/>
            </div>
            {isBreakDue && (
              <div style={{marginTop: 8, padding: '8px 14px', borderRadius: 8, background: 'rgba(255,200,121,0.1)', color: '#ffc879', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8}}>
                <AlertCircle size={16}/> Study interval complete. Take a NovaBreak to recharge!
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div style={{display: 'flex', gap: 10, flexWrap: 'wrap'}}>
            {session.status === 'active' && (
              <Button kind="soft" onClick={takeBreak} disabled={busy}>
                <Coffee size={14} style={{marginRight: 4}}/> Take NovaBreak
              </Button>
            )}
            {session.status === 'in_break' && (
              <Button onClick={endBreak} disabled={busy}>
                <Play size={14} style={{marginRight: 4}}/> End Break & Resume
              </Button>
            )}
            <Button kind="outline" onClick={completeSession} disabled={busy}>
              <Check size={14} style={{marginRight: 4}}/> Complete Session
            </Button>
            <Button kind="outline" onClick={abandonSession} disabled={busy} style={{color: '#ff9eac', borderColor: 'rgba(255,158,172,0.3)'}}>
              <X size={14} style={{marginRight: 4}}/> Exit
            </Button>
          </div>

          <div style={{marginTop: 16, fontSize: 12, color: '#b0b7c3', display: 'flex', alignItems: 'center', gap: 6}}>
            <ShieldCheck size={13}/> Break time is excluded from your study duration. Heartbeat syncs every 15 seconds.
          </div>
        </div>
      )}

      {isEnded && (
        <div className="panel" style={{padding: 28, maxWidth: 520, margin: '0 auto', textAlign: 'center'}}>
          <div style={{width: 56, height: 56, borderRadius: '50%', background: session.status === 'completed' ? 'rgba(128,224,193,0.12)' : 'rgba(255,158,172,0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16}}>
            {session.status === 'completed' ? <CheckCircle2 size={26} style={{color: '#80e0c1'}}/> : <X size={26} style={{color: '#ff9eac'}}/>}
          </div>
          <h2 style={{margin: '0 0 6px'}}>{session.status === 'completed' ? 'Session Complete!' : 'Session Ended'}</h2>
          <p className="muted">
            Study: <b>{fmt(studyElapsed)}</b> · Breaks: <b>{session.break_count || 0}</b> ({fmt(breakElapsed)})
          </p>
          <div style={{display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16}}>
            <Button onClick={resetSession}>Start New Session <ArrowRight size={15}/></Button>
            <Button kind="outline" onClick={() => setPage('Journey')}>Return to Journey</Button>
          </div>
        </div>
      )}
    </>
  );
}

function GuardianDashboard({setPage}) {
  const {user} = useData();
  const [learners, setLearners] = useState([]);
  const [selectedLearner, setSelectedLearner] = useState(null);
  const [summary, setSummary] = useState(null);
  const [reports, setReports] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'guardian') return;
    api.getGuardianLearners().then(res => {
      setLearners(res.learners || []);
    }).catch(e => setError(e.message));
  }, [user]);

  async function selectLearner(learner) {
    setSelectedLearner(learner);
    setSummary(null); setReports([]); setError('');
    setBusy(true);
    try {
      const [sumRes, repRes] = await Promise.allSettled([
        api.getGuardianLearnerSummary(learner.user_id),
        api.getGuardianLearnerReports(learner.user_id),
      ]);
      if (sumRes.status === 'fulfilled') setSummary(sumRes.value);
      if (repRes.status === 'fulfilled') setReports(repRes.value.reports || []);
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  async function handleGenerate() {
    if (!selectedLearner) return;
    setBusy(true); setNotice('');
    try {
      const res = await api.generateGuardianReport(selectedLearner.user_id);
      setNotice('Weekly report generated successfully.');
      setReports(prev => [res.report, ...prev]);
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  async function handleSend(reportId) {
    if (!selectedLearner) return;
    setBusy(true); setNotice('');
    try {
      await api.sendGuardianReport(selectedLearner.user_id, reportId);
      setNotice('Report emailed to guardian successfully.');
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  if (!user) return (
    <div className="quiz-card panel">
      <h2>Guardian Dashboard</h2>
      <p className="muted">Sign in with a guardian account to view learner progress.</p>
      <Button onClick={() => setPage('Sign Up / Login')}>Sign in <ArrowRight size={15}/></Button>
    </div>
  );

  if (user.role !== 'guardian') return (
    <div className="quiz-card panel">
      <h2>Guardian Dashboard</h2>
      <p className="muted">This section is available to verified guardian accounts. Your current role is <b>{user.role}</b>.</p>
      <Button kind="outline" onClick={() => setPage('Student Dashboard')}>Back to Dashboard</Button>
    </div>
  );

  return (
    <>
      <SectionTitle
        eyebrow="GUARDIAN EXPERIENCE"
        title="Your Learners."
        sub="View learning progress, study time (breaks excluded), and demonstrated mastery for linked learners."
      />

      {error && <div className="panel" style={{padding: 14, marginBottom: 16, color: '#ff9eac'}}>{error}</div>}
      {notice && <div className="panel" style={{padding: 12, marginBottom: 16, background: 'rgba(128,224,193,0.08)', color: '#80e0c1', fontSize: 13}}>{notice}</div>}

      <div style={{display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start'}}>
        {/* Learner list */}
        <div className="panel" style={{padding: 20, minWidth: 260, flex: '0 0 280px'}}>
          <div className="eyebrow">LINKED LEARNERS</div>
          {learners.length === 0 && <p className="muted" style={{marginTop: 12}}>No linked learners found.</p>}
          <div style={{marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8}}>
            {learners.map(l => (
              <button
                key={l.user_id}
                className={`mastery-row ${selectedLearner?.user_id === l.user_id ? 'active' : ''}`}
                onClick={() => selectLearner(l)}
                style={{cursor: 'pointer', background: selectedLearner?.user_id === l.user_id ? 'rgba(140,124,255,0.1)' : 'rgba(255,255,255,0.03)', padding: '12px 14px', borderRadius: 8, border: 'none', textAlign: 'left', width: '100%', color: 'inherit'}}
              >
                <div className="avatar" style={{width: 34, height: 34, fontSize: 14}}>{(l.username || 'L').charAt(0).toUpperCase()}</div>
                <span className="mastery-info">
                  <b>{l.username || `Learner ${l.user_id}`}</b>
                  <small>{l.education_category?.replace(/_/g, ' ') || 'Learner'}{l.study_minutes != null ? ` · ${l.study_minutes} min studied` : ''}</small>
                </span>
                <ChevronRight size={14}/>
              </button>
            ))}
          </div>
        </div>

        {/* Learner detail */}
        {selectedLearner && (
          <div style={{flex: 1, minWidth: 320}}>
            {busy && !summary && <p className="muted">Loading learner data…</p>}

            {summary && (
              <>
                <div className="panel" style={{padding: 20, marginBottom: 16}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12}}>
                    <div>
                      <span className="eyebrow" style={{color: '#8c7cff'}}>LEARNER SUMMARY</span>
                      <h3 style={{margin: '4px 0 0'}}>{summary.username || `Learner ${selectedLearner.user_id}`}</h3>
                      <p className="muted" style={{margin: '4px 0 0', fontSize: 13}}>
                        {summary.education_category?.replace(/_/g, ' ')} · Active journeys: {summary.active_journeys ?? 0}
                      </p>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="stats-grid" style={{marginTop: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))'}}>
                    <div className="stat-card">
                      <div className="stat-icon violet"><Clock3 size={16}/></div>
                      <div className="stat-label">Study Time</div>
                      <div className="stat-value">{summary.study_minutes ?? 0} min</div>
                      <div className="stat-change"><ShieldCheck size={12}/> Breaks excluded</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-icon mint"><Trophy size={16}/></div>
                      <div className="stat-label">Mastery Topics</div>
                      <div className="stat-value">{summary.demonstrated_mastery_count ?? 0}</div>
                      <div className="stat-change"><ArrowUpRight size={12}/> Demonstrated</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-icon amber"><Target size={16}/></div>
                      <div className="stat-label">Topics Assessed</div>
                      <div className="stat-value">{summary.topics_assessed ?? 0}</div>
                      <div className="stat-change"><TrendingUp size={12}/> Total</div>
                    </div>
                  </div>
                </div>

                {/* Topic proficiencies */}
                {summary.topic_proficiencies?.length > 0 && (
                  <div className="panel" style={{padding: 20, marginBottom: 16}}>
                    <div className="eyebrow">TOPIC PROFICIENCY</div>
                    <div className="mastery-list" style={{marginTop: 12}}>
                      {summary.topic_proficiencies.map(tp => (
                        <div className="mastery-row" key={tp.topic} style={{padding: '10px 0'}}>
                          <span className="mastery-icon" style={{background: tp.is_demonstrated ? '#80e0c124' : '#ffc87924', color: tp.is_demonstrated ? '#80e0c1' : '#ffc879', minWidth: 30, minHeight: 30}}>
                            {tp.is_demonstrated ? <Check size={14}/> : <Target size={14}/>}
                          </span>
                          <span className="mastery-info">
                            <b>{tp.topic}</b>
                            <small>{tp.is_demonstrated ? 'Demonstrated Mastery' : tp.assessment_status || 'Developing'}</small>
                            <span className="progress-track"><i style={{width: `${Math.round((tp.estimate || 0) * 100)}%`}}/></span>
                          </span>
                          <strong>{Math.round((tp.estimate || 0) * 100)}%</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reports section */}
                <div className="panel" style={{padding: 20}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8}}>
                    <div className="eyebrow">WEEKLY REPORTS</div>
                    <Button kind="soft" onClick={handleGenerate} disabled={busy}>
                      <FileText size={14} style={{marginRight: 4}}/> Generate Report
                    </Button>
                  </div>
                  {reports.length === 0 && <p className="muted" style={{marginTop: 12}}>No reports generated yet.</p>}
                  <div style={{marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8}}>
                    {reports.map(r => (
                      <div key={r.id} style={{padding: '12px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8}}>
                        <div>
                          <b style={{fontSize: 13}}>Report #{r.id}</b>
                          <small className="muted" style={{display: 'block'}}>{r.period_start} — {r.period_end}</small>
                        </div>
                        <Button kind="soft" onClick={() => handleSend(r.id)} disabled={busy} style={{fontSize: 12, padding: '5px 12px'}}>
                          <Send size={12} style={{marginRight: 4}}/> Email Report
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div style={{marginTop: 16, fontSize: 12, color: '#b0b7c3', display: 'flex', alignItems: 'center', gap: 6}}>
                    <ShieldCheck size={13}/> Learner credentials and raw telemetry are never exposed to guardians.
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}

function Modal({topic,onClose}) {
  if(!topic)return null;
  return <div className="modal-backdrop" onClick={onClose}><div className="topic-modal" onClick={e=>e.stopPropagation()}><button className="icon-btn modal-close" onClick={onClose}><X size={17}/></button><div className="auth-icon"><Target size={23}/></div><div className="eyebrow">TOPIC INSIGHT</div><h2>{topic.name}</h2><p className="muted">{topic.state||'Personalized overview'}</p><div className="modal-score"><b>{topic.value??68}%</b><span>current mastery</span></div><div className="progress-track"><i style={{width:(topic.value??68)+'%'}}/></div><p className="modal-copy">Keep building with short practice sessions and resources selected for your current level.</p><Button block onClick={onClose}>Got it <Check size={15}/></Button></div></div>;
}
function AppContent() {
  const [user,setUser]=useState(()=>api.session.get()?.user||null);
  const [page,setPage]=useBrowserNavigation(api.session.get()?'Student Dashboard':'Landing Page');
  const [collapsed,setCollapsed]=useState(false),[course,setCourse]=useState(sampleResources[0]),[modal,setModal]=useState(null),[quizScore,setQuizScore]=useState(null),[toast,setToast]=useState('');
  const guestData={courses:sampleResources,recs:sampleResources,topics:sampleTopics,stats:null,profile:null,history:[],recMeta:null,recError:''};
  const [data,setData]=useState(guestData);
  const loadAll=useCallback(async()=>{
    const [c,r,p,g,k]=await Promise.allSettled([api.fetchAllCourses(),api.getRecommendations(),api.getProfile(),api.getProgress(),api.getKnowledgeProfile()]);
    setData({
      courses:c.status==='fulfilled'?c.value.map(api.adaptCourse):[],
      recs:r.status==='fulfilled'?r.value.recommendations.map(api.adaptRecommendation):[],
      recMeta:r.status==='fulfilled'?r.value:null,
      recError:r.status==='rejected'?r.reason.message:'',
      topics:p.status==='fulfilled'?api.adaptMastery(p.value.topic_mastery).slice(0,5):[],
      profile:p.status==='fulfilled'?p.value:null,
      knowledge:k.status==='fulfilled'?k.value:null,
      stats:g.status==='fulfilled'?api.buildStats(g.value):null,
      history:g.status==='fulfilled'?g.value.history:[],
    });
    if(c.status==='rejected')showToast(c.reason.message);
  },[]);
  const refreshRecs=useCallback(async()=>{
    try{const r=await api.refreshRecommendations();setData(d=>({...d,recs:r.recommendations.map(api.adaptRecommendation),recMeta:r,recError:''}));}
    catch(e){setData(d=>({...d,recError:e.message}));}
  },[]);
  const saveProfile=useCallback(async(profile)=>{const updated=await api.updateProfile(profile);setData(d=>({...d,profile:updated,topics:api.adaptMastery(updated.topic_mastery).slice(0,5)}));return updated;},[]);
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
  const ctx={...data,user,signIn,signUp,signInWithGoogle,signOut,openAuth,track,refreshRecs,saveProfile};
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
      case 'Onboarding':return <Onboarding setPage={setPage}/>;
      case 'Home':case 'Student Dashboard':return <Dashboard setPage={setPage} onOpen={openCourse} onTopic={setModal}/>;
      case 'Explore':case 'Explore Courses':return <Explore onOpen={openCourse}/>;
      case 'My Learning':return <><SectionTitle eyebrow="YOUR LEARNING SPACE" title="Keep your momentum." sub="Pick up where you left off and keep moving forward."/><div className="resource-grid">{(()=>{const seen=[...new Set(data.history.map(h=>h.course_id))].map(id=>data.courses.find(c=>c.id===id)).filter(Boolean);return(seen.length?seen:data.courses).slice(0,3);})().map(r=><ResourceCard key={r.id} item={r} onOpen={openCourse}/>)}</div><div className="panel my-learning-note"><BookOpen size={21}/><div><h3>Your learning path is taking shape.</h3><p>Complete a lesson or quiz to keep your progress moving.</p></div><Button onClick={()=>setPage('Explore')}>Explore more <ArrowRight size={15}/></Button></div></>;
      case 'Course / Learning View':return <CourseView course={course} onBack={()=>setPage('Explore')} onQuiz={()=>setPage('Quiz / Assessment')} onComplete={markComplete}/>;
      case 'Quiz / Assessment':return <Quiz course={course} onBack={()=>setPage('Course / Learning View')} onSubmit={res=>{setQuizScore(res.score);showToast(`Quiz saved: ${res.score}%`);loadAll();}}/>;
      case 'Diagnostic':return <Diagnostic setPage={setPage}/>;
      case 'Learner Profile':case 'Profile':return <Profile onTopic={setModal}/>;
      case 'Recommendations':return <Recommendations onOpen={openCourse}/>;
      case 'Learning Journey':case 'Journey':return <LearningJourneyView setPage={setPage}/>;
      case 'Progress':case 'Progress Analytics':return <Analytics/>;
      case 'Focus Mode':return <FocusMode setPage={setPage}/>;
      case 'Guardian Dashboard':return <GuardianDashboard setPage={setPage}/>;
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
