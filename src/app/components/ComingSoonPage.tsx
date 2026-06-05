import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { motion, useInView } from 'motion/react';
import { useForm } from 'react-hook-form';
import {
  Brain, Activity, Map, Users, BarChart3, Trophy,
  Zap, Shield, Heart, Target, Building2, Sparkles,
  ArrowRight, CheckCircle, Calendar, Clock, ChevronRight,
  TrendingUp, Flame, Star, Award, MessageCircle
} from 'lucide-react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
// ─── Easing ───────────────────────────────────────────────
const ease = [0.25, 0.46, 0.45, 0.94] as const;

// ─── Typewriter ───────────────────────────────────────────
function TypewriterText({ text, delay = 0, speed = 55 }: { text: string; delay?: number; speed?: number }) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    let i = 0;
    const start = setTimeout(() => {
      const id = setInterval(() => {
        i++;
        setDisplayed(text.slice(0, i));
        if (i >= text.length) { clearInterval(id); setDone(true); }
      }, speed);
      return () => clearInterval(id);
    }, delay);
    return () => clearTimeout(start);
  }, [text, delay, speed]);

  return (
    <em style={{ color: '#D97706', fontStyle: 'italic', display: 'block' }}>
      {displayed}
      <motion.span
        style={{ display: 'inline-block', width: '3px', height: '0.85em', backgroundColor: '#D97706', marginLeft: '2px', verticalAlign: 'middle', borderRadius: '1px' }}
        animate={{ opacity: done ? 0 : [1, 0, 1] }}
        transition={done
          ? { duration: 0.4, delay: 0.8 }
          : { duration: 0.55, repeat: Infinity, ease: 'easeInOut' }
        }
      />
    </em>
  );
}

// ─── Countdown ────────────────────────────────────────────
function CountdownTimer() {
  const target = new Date('2026-10-01T00:00:00Z');
  const [t, setT] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const tick = () => {
      const diff = target.getTime() - Date.now();
      if (diff <= 0) return;
      setT({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const pad = (n: number) => String(n).padStart(2, '0');
  const units = [
    { label: 'Days', val: pad(t.days) },
    { label: 'Hours', val: pad(t.hours) },
    { label: 'Min', val: pad(t.minutes) },
    { label: 'Sec', val: pad(t.seconds) },
  ];

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-5">
      {units.map((u, i) => (
        <div key={u.label} className="flex items-center gap-2 sm:gap-5">
          <div
            className="flex flex-col items-center px-4 py-3 sm:px-6 sm:py-4 rounded-2xl border border-white/10"
            style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)' }}
          >
            <span
              className="text-3xl sm:text-5xl text-white tabular-nums leading-none"
              style={{ fontFamily: 'Fraunces, serif', fontWeight: 300 }}
            >
              {u.val}
            </span>
            <span className="text-white/40 text-[10px] tracking-widest uppercase mt-1.5" style={{ fontFamily: 'Sora, sans-serif' }}>
              {u.label}
            </span>
          </div>
          {i < 3 && (
            <span className="text-white/30 text-2xl sm:text-4xl font-light mb-4" style={{ fontFamily: 'Fraunces, serif' }}>:</span>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Count-up ─────────────────────────────────────────────
function useCountUp(end: number, inView: boolean) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const step = end / 72;
    let cur = 0;
    const id = setInterval(() => {
      cur += step;
      if (cur >= end) { setN(end); clearInterval(id); }
      else setN(Math.floor(cur));
    }, 18);
    return () => clearInterval(id);
  }, [end, inView]);
  return n;
}

// ─── App Mockup Cards ─────────────────────────────────────
function AICoachCard() {
  return (
    <div className="space-y-2.5">
      <div className="flex gap-2.5 items-start">
        <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(217,119,6,0.25)' }}>
          <Brain className="w-3.5 h-3.5" style={{ color: '#D97706' }} />
        </div>
        <div className="rounded-2xl rounded-tl-sm px-3 py-2 text-xs text-white/80 max-w-[80%] leading-relaxed"
          style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
          Your metabolic score improved 12% this week! Time to level up. 🎉
        </div>
      </div>
      <div className="flex justify-end">
        <div className="rounded-2xl rounded-tr-sm px-3 py-2 text-xs text-white/80"
          style={{ backgroundColor: 'rgba(217,119,6,0.25)' }}>
          What should I focus on today?
        </div>
      </div>
      <div className="flex gap-2.5 items-center">
        <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(217,119,6,0.25)' }}>
          <Brain className="w-3.5 h-3.5" style={{ color: '#D97706' }} />
        </div>
        <div className="px-3 py-2 rounded-2xl flex gap-1 items-center" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
          {[0, 150, 300].map(d => (
            <div key={d} className="w-1.5 h-1.5 rounded-full bg-white/50 animate-bounce" style={{ animationDelay: `${d}ms` }} />
          ))}
        </div>
      </div>
      <div className="rounded-xl flex gap-2 items-center px-3 py-2 mt-1 border border-white/10"
        style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
        <MessageCircle className="w-3.5 h-3.5 text-white/30" />
        <span className="text-xs text-white/30" style={{ fontFamily: 'Sora, sans-serif' }}>Ask your AI coach…</span>
      </div>
    </div>
  );
}

function MetabolicScoreCard() {
  const circumference = 2 * Math.PI * 42;
  const offset = circumference * (1 - 0.874);
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <svg viewBox="0 0 100 100" className="w-24 h-24 -rotate-90">
          <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="7" />
          <circle cx="50" cy="50" r="42" fill="none" stroke="#D97706" strokeWidth="7"
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-light text-white leading-none" style={{ fontFamily: 'Fraunces, serif', color: '#D97706' }}>87.4</span>
          <span className="text-[9px] text-white/50 tracking-wider mt-0.5" style={{ fontFamily: 'Sora, sans-serif' }}>SCORE</span>
        </div>
      </div>
      <div className="text-center">
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: 'rgba(74,222,128,0.15)', color: '#4ADE80', fontFamily: 'Sora, sans-serif' }}>
          Excellent ↑
        </span>
      </div>
      <div className="w-full grid grid-cols-3 gap-1.5">
        {[{ l: 'HRV', v: '45ms' }, { l: 'Glucose', v: '92' }, { l: 'Sleep', v: '7.8h' }].map(m => (
          <div key={m.l} className="text-center py-1.5 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
            <div className="text-xs font-medium text-white" style={{ fontFamily: 'Sora, sans-serif' }}>{m.v}</div>
            <div className="text-[9px] text-white/40" style={{ fontFamily: 'Sora, sans-serif' }}>{m.l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HealthJourneyCard() {
  const days = Array.from({ length: 28 }, (_, i) => i + 1);
  const done = new Set([1,2,3,4,5,7,8,9,10,11,12,14,15,16,17,18,19,21,22,23,24,25,26,28]);
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Flame className="w-4 h-4" style={{ color: '#F97316' }} />
          <span className="text-sm font-semibold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>28-Day Streak</span>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(249,115,22,0.15)', color: '#F97316', fontFamily: 'Sora, sans-serif' }}>🔥 On Fire</span>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map(d => (
          <div key={d} className={`aspect-square rounded-md flex items-center justify-center text-[9px] transition-all ${
            done.has(d) ? 'text-white' : 'text-white/20'
          }`} style={{ backgroundColor: done.has(d) ? '#1A4D3A' : 'rgba(255,255,255,0.05)', fontFamily: 'Sora, sans-serif' }}>
            {done.has(d) ? <CheckCircle className="w-2.5 h-2.5 text-[#4ADE80]" strokeWidth={2.5} /> : d}
          </div>
        ))}
      </div>
      <div className="rounded-lg p-2.5" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
        <div className="flex justify-between text-[10px] text-white/50 mb-1.5" style={{ fontFamily: 'Sora, sans-serif' }}>
          <span>Week 4 of 12</span><span>78%</span>
        </div>
        <div className="h-1.5 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
          <div className="h-full rounded-full" style={{ width: '78%', backgroundColor: '#4ADE80' }} />
        </div>
      </div>
    </div>
  );
}

function CommunityCard() {
  const members = [
    { name: 'A.R.', rank: 1, pts: 3240, badge: '🥇' },
    { name: 'S.K.', rank: 2, pts: 2890, badge: '🥈' },
    { name: 'M.P.', rank: 3, pts: 2647, badge: '🥉' },
  ];
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-white/80" style={{ fontFamily: 'Sora, sans-serif' }}>Corporate Wellness League</span>
        <span className="text-[10px] text-white/40 flex items-center gap-1" style={{ fontFamily: 'Sora, sans-serif' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />1,247 active
        </span>
      </div>
      {members.map(m => (
        <div key={m.rank} className={`flex items-center gap-2.5 p-2 rounded-xl ${m.rank === 3 ? 'ring-1 ring-[#D97706]/40' : ''}`}
          style={{ backgroundColor: m.rank === 3 ? 'rgba(217,119,6,0.1)' : 'rgba(255,255,255,0.05)' }}>
          <span className="text-sm">{m.badge}</span>
          <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-semibold text-white/70"
            style={{ fontFamily: 'Sora, sans-serif' }}>
            {m.name}
          </div>
          <div className="flex-1">
            <div className="h-1 rounded-full bg-white/10">
              <div className="h-full rounded-full" style={{ width: `${(m.pts / 3240) * 100}%`, backgroundColor: m.rank === 1 ? '#D97706' : 'rgba(255,255,255,0.3)' }} />
            </div>
          </div>
          <span className="text-xs text-white/60" style={{ fontFamily: 'Sora, sans-serif' }}>{m.pts.toLocaleString()}</span>
        </div>
      ))}
      <div className="flex items-center justify-center gap-1.5 py-2 rounded-xl border border-[#D97706]/20"
        style={{ backgroundColor: 'rgba(217,119,6,0.08)' }}>
        <Star className="w-3 h-3" style={{ color: '#D97706' }} />
        <span className="text-xs font-semibold" style={{ color: '#D97706', fontFamily: 'Sora, sans-serif' }}>You're in Top 15%</span>
      </div>
    </div>
  );
}

function DashboardCard() {
  const bars = [65, 82, 55, 90, 78, 88, 72];
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-1.5">
        {[{ l: 'Steps', v: '9,241', c: '#4ADE80', d: '+8%' }, { l: 'Calories', v: '1,847', c: '#60A5FA', d: '+3%' }, { l: 'Active Min', v: '64', c: '#F472B6', d: '+12%' }].map(s => (
          <div key={s.l} className="rounded-xl p-2 text-center" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
            <div className="text-sm font-semibold" style={{ color: s.c, fontFamily: 'Fraunces, serif' }}>{s.v}</div>
            <div className="text-[9px] text-white/40 mt-0.5" style={{ fontFamily: 'Sora, sans-serif' }}>{s.l}</div>
            <div className="text-[9px] font-semibold mt-1" style={{ color: '#4ADE80', fontFamily: 'Sora, sans-serif' }}>{s.d}</div>
          </div>
        ))}
      </div>
      <div className="rounded-xl p-3" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}>
        <p className="text-[10px] text-white/40 mb-2" style={{ fontFamily: 'Sora, sans-serif' }}>Weekly Activity</p>
        <div className="flex items-end gap-1 h-10">
          {bars.map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full rounded-sm transition-all" style={{ height: `${h}%`, backgroundColor: 'rgba(74,222,128,0.5)' }} />
              <span className="text-[8px] text-white/30" style={{ fontFamily: 'Sora, sans-serif' }}>{days[i]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LeaderboardCard() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Trophy className="w-4 h-4" style={{ color: '#D97706' }} />
        <span className="text-xs font-semibold text-white/80" style={{ fontFamily: 'Sora, sans-serif' }}>Global Rankings</span>
      </div>
      {[
        { rank: '#1', user: 'Emma W.', pts: '4,821 pts', badge: '👑', up: '+2' },
        { rank: '#2', user: 'James L.', pts: '4,650 pts', badge: '🌟', up: '+5' },
        { rank: '#3', user: 'You', pts: '2,847 pts', badge: '⚡', up: '+12', highlight: true },
        { rank: '#4', user: 'Priya N.', pts: '2,310 pts', badge: '🔥', up: '+1' },
      ].map(r => (
        <div key={r.rank} className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl ${r.highlight ? 'ring-1 ring-[#D97706]/50' : ''}`}
          style={{ backgroundColor: r.highlight ? 'rgba(217,119,6,0.12)' : 'rgba(255,255,255,0.04)' }}>
          <span className="text-[10px] font-bold text-white/40 w-5" style={{ fontFamily: 'Sora, sans-serif' }}>{r.rank}</span>
          <span className="text-sm">{r.badge}</span>
          <span className="flex-1 text-xs text-white/80" style={{ fontFamily: 'Sora, sans-serif', fontWeight: r.highlight ? 600 : 400 }}>{r.user}</span>
          <span className="text-[10px] text-white/40" style={{ fontFamily: 'Sora, sans-serif' }}>{r.pts}</span>
          <span className="text-[10px] font-semibold" style={{ color: '#4ADE80', fontFamily: 'Sora, sans-serif' }}>{r.up}</span>
        </div>
      ))}
    </div>
  );
}

const showcase = [
  { icon: Brain, title: 'AI Coach', subtitle: 'Personalized Intelligence', color: '#D97706', content: <AICoachCard /> },
  { icon: Activity, title: 'Metabolic Score', subtitle: 'Real-time Analysis', color: '#4ADE80', content: <MetabolicScoreCard /> },
  { icon: Flame, title: 'Health Journey', subtitle: 'Streak & Progress', color: '#F97316', content: <HealthJourneyCard /> },
  { icon: Users, title: 'Community', subtitle: 'Group Challenges', color: '#60A5FA', content: <CommunityCard /> },
  { icon: BarChart3, title: 'Dashboard', subtitle: 'Wellness Analytics', color: '#A78BFA', content: <DashboardCard /> },
  { icon: Trophy, title: 'Leaderboard', subtitle: 'Rank & Rewards', color: '#D97706', content: <LeaderboardCard /> },
];

// ─── Marquee ──────────────────────────────────────────────
function PartnersMarquee() {
  const items = [
    '🏥 Apollo Health', '🔬 Stanford Medicine', '🎓 Harvard', '💼 Google Health',
    '🏢 Deloitte', '🔭 MIT Health Lab', '🌏 WHO Partner', '🎓 IIT Mumbai',
    '🏥 Cleveland Clinic', '🏢 Microsoft', '🔬 Johns Hopkins', '🎓 Oxford',
    '💼 Accenture', '🏥 Fortis Hospitals', '🌏 NUS Singapore', '🏢 McKinsey Health',
  ];
  const doubled = [...items, ...items];

  return (
    <div className="overflow-hidden select-none" style={{ maskImage: 'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)' }}>
      <motion.div
        className="flex gap-4"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
      >
        {doubled.map((item, i) => (
          <div
            key={i}
            className="flex-shrink-0 px-5 py-3 rounded-xl border border-[#E7E2D5] bg-white text-sm text-[#78716C] whitespace-nowrap hover:border-[#1A4D3A]/30 hover:text-[#1A4D3A] transition-all cursor-default"
            style={{ fontFamily: 'Sora, sans-serif' }}
          >
            {item}
          </div>
        ))}
      </motion.div>
    </div>
  );
}

// ─── Registration Form ────────────────────────────────────
interface FormData { name: string; email: string; phone: string; organization: string; country: string; }

function EarlyAccessForm() {
  const [apiError, setApiError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting, isSubmitSuccessful }, reset } = useForm<FormData>();
  const onSubmit = async (data: FormData) => {
    setApiError(null);
    try {
      const q = query(collection(db, 'early_access_signups'), where('email', '==', data.email.trim().toLowerCase()));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        throw new Error('This email has already signed up for early access.');
      }
      await addDoc(collection(db, 'early_access_signups'), {
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone?.trim() || null,
        organization: data.organization?.trim() || null,
        country: data.country.trim(),
        createdAt: serverTimestamp(),
      });
      reset();
    } catch (e: any) {
      throw new Error(e.message || 'Submission failed. Please try again.');
    }
  };
  const wrappedSubmit = handleSubmit(async (data) => {
    try { await onSubmit(data); } catch (e: any) { setApiError(e.message); }
  });
  const field = "w-full px-4 py-3.5 rounded-xl border border-[#E7E2D5] bg-[#FDFAF5] text-[#1C1917] placeholder-[#78716C]/50 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A4D3A]/25 focus:border-[#1A4D3A] transition-all";

  return (
    <section id="register" style={{ backgroundColor: '#FAF6EF' }} className="py-28">
      <div className="max-w-2xl mx-auto px-6">
        <motion.div className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.6, ease }}>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest uppercase mb-4"
            style={{ color: '#D97706', fontFamily: 'Sora, sans-serif' }}>
            <Sparkles className="w-3.5 h-3.5" /> Early Access
          </span>
          <h2 className="text-4xl sm:text-5xl font-light text-[#1C1917] mb-4" style={{ fontFamily: 'Fraunces, serif' }}>
            Be First to Transform
          </h2>
          <p className="text-[#78716C] leading-relaxed" style={{ fontFamily: 'Sora, sans-serif' }}>
            Join thousands of individuals, clinicians, and organizations shaping the future of metabolic health.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.7, ease, delay: 0.1 }}>
          {isSubmitSuccessful ? (
            <div className="bg-white rounded-3xl p-12 border border-[#E7E2D5] text-center shadow-sm">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ backgroundColor: '#1A4D3A' }}>
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-light text-[#1C1917] mb-2" style={{ fontFamily: 'Fraunces, serif' }}>You're on the list!</h3>
              <p className="text-[#78716C] text-sm" style={{ fontFamily: 'Sora, sans-serif' }}>We'll be in touch with your early access details before launch.</p>
            </div>
          ) : (
            <form onSubmit={wrappedSubmit} className="bg-white rounded-3xl p-8 sm:p-10 border border-[#E7E2D5] shadow-sm space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1C1917] mb-2" style={{ fontFamily: 'Sora, sans-serif' }}>Full Name *</label>
                  <input {...register('name', { required: true })} placeholder="Dr. Alex Johnson"
                    className={`${field} ${errors.name ? 'border-red-400' : ''}`} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1C1917] mb-2" style={{ fontFamily: 'Sora, sans-serif' }}>Work Email *</label>
                  <input {...register('email', { required: true, pattern: /^\S+@\S+\.\S+$/ })} type="email"
                    placeholder="alex@organization.com"
                    className={`${field} ${errors.email ? 'border-red-400' : ''}`} />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1C1917] mb-2" style={{ fontFamily: 'Sora, sans-serif' }}>Phone</label>
                  <input {...register('phone')} type="tel" placeholder="+1 (555) 000-0000" className={field} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1C1917] mb-2" style={{ fontFamily: 'Sora, sans-serif' }}>Organization</label>
                  <input {...register('organization')} placeholder="Hospital / Company / School" className={field} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#1C1917] mb-2" style={{ fontFamily: 'Sora, sans-serif' }}>Country *</label>
                <select {...register('country', { required: true })} className={`${field} ${errors.country ? 'border-red-400' : ''}`}>
                  <option value="">Select your country</option>
                  {['United States','United Kingdom','Canada','Australia','India','Singapore','UAE','Germany','France','Japan','Brazil','South Africa','Other'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              {apiError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3" style={{ fontFamily: 'Sora, sans-serif' }}>
                  ⚠ {apiError}
                </p>
              )}
              <button type="submit" disabled={isSubmitting}
                className="w-full py-4 rounded-2xl font-semibold text-white text-sm flex items-center justify-center gap-2 transition-all hover:brightness-110 hover:shadow-lg disabled:opacity-60"
                style={{ backgroundColor: '#1A4D3A', fontFamily: 'Sora, sans-serif' }}>
                {isSubmitting
                  ? <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Submitting…</span>
                  : <span className="flex items-center gap-2">Get Early Access <ArrowRight className="w-4 h-4" /></span>
                }
              </button>
              <p className="text-center text-xs text-[#78716C]" style={{ fontFamily: 'Sora, sans-serif' }}>
                No credit card · Cancel anytime · HIPAA & GDPR Compliant
              </p>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
}

// ─── Webinar Booking ──────────────────────────────────────
function WebinarBooking() {
  const webinars = [
    {
      num: '01',
      title: 'Future of Metabolic Health & Preventive Care',
      date: 'July 15, 2026', time: '3:00 PM UTC',
      seats: 32, total: 100,
      tags: ['AI Health Coaching', 'Digital Health', 'Preventive Care', 'Population Wellness'],
    },
    {
      num: '02',
      title: 'AI, Gamification & Community Wellness Revolution',
      date: 'August 5, 2026', time: '3:00 PM UTC',
      seats: 47, total: 100,
      tags: ['Behaviour Change', 'Community Engagement', 'Wellness Analytics', 'Gamification'],
    },
  ];

  return (
    <section className="py-24" style={{ backgroundColor: '#F0EBE0' }}>
      <div className="max-w-5xl mx-auto px-6">
        <motion.div className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.6, ease }}>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest uppercase mb-4"
            style={{ color: '#D97706', fontFamily: 'Sora, sans-serif' }}>
            <Calendar className="w-3.5 h-3.5" /> Upcoming Sessions
          </span>
          <h2 className="text-4xl sm:text-5xl font-light text-[#1C1917]" style={{ fontFamily: 'Fraunces, serif' }}>
            Reserve Your Seat
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {webinars.map((w, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.6, ease, delay: i * 0.12 }}
              className="bg-white rounded-3xl overflow-hidden border border-[#E7E2D5] hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className="px-7 pt-7 pb-5" style={{ background: 'linear-gradient(135deg, #0F3424 0%, #1A4D3A 100%)' }}>
                <span className="text-5xl font-light text-white/10 leading-none block mb-3" style={{ fontFamily: 'Fraunces, serif' }}>{w.num}</span>
                <h3 className="text-lg font-light text-white leading-snug mb-4" style={{ fontFamily: 'Fraunces, serif' }}>{w.title}</h3>
                <div className="flex flex-wrap gap-3 text-xs text-white/60" style={{ fontFamily: 'Sora, sans-serif' }}>
                  <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" />{w.date}</span>
                  <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" />{w.time}</span>
                </div>
              </div>
              <div className="p-6">
                <div className="flex flex-wrap gap-2 mb-5">
                  {w.tags.map(t => (
                    <span key={t} className="text-xs px-2.5 py-1 rounded-full border border-[#E7E2D5] text-[#78716C]"
                      style={{ fontFamily: 'Sora, sans-serif' }}>{t}</span>
                  ))}
                </div>
                <div className="mb-5 p-3.5 rounded-xl" style={{ backgroundColor: '#F0EBE0' }}>
                  <div className="flex justify-between text-xs mb-2" style={{ fontFamily: 'Sora, sans-serif' }}>
                    <span className="font-semibold" style={{ color: '#1A4D3A' }}>{w.seats} seats remaining</span>
                    <span className="text-[#78716C]">{w.total} total</span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ backgroundColor: '#E7E2D5' }}>
                    <div className="h-full rounded-full" style={{ width: `${((w.total - w.seats) / w.total) * 100}%`, backgroundColor: '#1A4D3A' }} />
                  </div>
                </div>
                <Link to="/webinar"
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold text-white transition-all hover:brightness-110 hover:shadow-md"
                  style={{ backgroundColor: '#1A4D3A', fontFamily: 'Sora, sans-serif' }}>
                  Reserve My Seat <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Main Page ────────────────────────────────────────────
export function ComingSoonPage() {
  const impactRef = useRef<HTMLDivElement>(null);
  const impactInView = useInView(impactRef, { once: true, margin: '-100px' });

  const members = useCountUp(50000, impactInView);
  const communities = useCountUp(200, impactInView);
  const programs = useCountUp(500, impactInView);
  const journeys = useCountUp(10000, impactInView);

  const features = [
    { icon: Brain, title: 'AI-Powered Health Intelligence', desc: 'Adaptive machine learning that builds a unique metabolic profile for each individual.' },
    { icon: Trophy, title: 'Gamified Wellness Journeys', desc: 'Earn points, unlock achievements, and build lasting health habits through play.' },
    { icon: Users, title: 'Community Health Challenges', desc: 'Team up with friends, colleagues, and global communities for group wellness challenges.' },
    { icon: Activity, title: 'Metabolic Health Tracking', desc: 'Continuous monitoring of biomarkers with actionable, real-time health intelligence.' },
    { icon: Building2, title: 'Corporate Wellness Programs', desc: 'Enterprise-grade wellness ecosystems that measurably reduce healthcare expenditure.' },
    { icon: Heart, title: 'Personalized Health Coaching', desc: 'An AI health coach that learns your lifestyle and guides you 24/7 toward your goals.' },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden">
      <Navbar />

      {/* ─── Hero ─────────────────────────────────────────── */}
      <section
        className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
        style={{ background: 'linear-gradient(150deg, #070f0b 0%, #0F3424 45%, #1A4D3A 100%)' }}
      >
        {/* Layered ambient orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            className="absolute top-[-10%] right-[-5%] w-[700px] h-[700px] rounded-full opacity-[0.18]"
            style={{ background: 'radial-gradient(circle, #D97706 0%, transparent 65%)' }}
            animate={{ scale: [1, 1.06, 1], x: [0, 12, 0], y: [0, -10, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute bottom-[-15%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-[0.12]"
            style={{ background: 'radial-gradient(circle, #4ADE80 0%, transparent 65%)' }}
            animate={{ scale: [1, 1.08, 1], x: [0, -8, 0], y: [0, 14, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          />
          {/* Fine grid */}
          <div className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '64px 64px' }} />
        </div>

        <div className="relative z-10 text-center px-6 max-w-5xl mx-auto pt-28 pb-36">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease }}>
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 mb-10 border border-white/10"
              style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)' }}
            >
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#4ADE80' }} />
              <span className="text-white/60 text-xs tracking-widest" style={{ fontFamily: 'Sora, sans-serif' }}>Global Launch · October 2026</span>
            </div>

            <h1
              className="text-5xl sm:text-6xl lg:text-[5.25rem] font-light text-white leading-[1.08] mb-8"
              style={{ fontFamily: 'Fraunces, serif', letterSpacing: '-0.025em' }}
            >
              Transform Your Metabolism,<br />
              <TypewriterText text="Transform Your Life Together." delay={900} speed={55} />
            </h1>

            <p
              className="text-white/55 text-lg sm:text-xl max-w-2xl mx-auto mb-12 leading-relaxed"
              style={{ fontFamily: 'Sora, sans-serif', fontWeight: 300 }}
            >
              The future of AI-powered metabolic health is arriving. Join a movement designed for individuals, families, communities, schools, and organizations.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <a
                href="#register"
                className="w-full sm:w-auto px-9 py-4 rounded-full font-semibold text-white text-sm transition-all hover:brightness-110 hover:shadow-xl flex items-center justify-center gap-2"
                style={{ backgroundColor: '#D97706', fontFamily: 'Sora, sans-serif' }}
              >
                Join Early Access <ArrowRight className="w-4 h-4" />
              </a>
              <Link
                to="/webinar"
                className="w-full sm:w-auto px-9 py-4 rounded-full font-semibold text-white/80 text-sm border border-white/20 transition-all hover:bg-white/8 hover:text-white flex items-center justify-center gap-2"
                style={{ fontFamily: 'Sora, sans-serif', backdropFilter: 'blur(8px)' }}
              >
                Reserve Webinar Seat
              </Link>
            </div>

            <div className="mb-14">
              <p className="text-white/30 text-xs tracking-widest uppercase mb-6" style={{ fontFamily: 'Sora, sans-serif' }}>
                Launching In
              </p>
              <CountdownTimer />
            </div>
          </motion.div>

          {/* Hero stats */}
          <motion.div
            className="flex flex-wrap justify-center gap-x-10 gap-y-4 pt-10 border-t border-white/[0.08]"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.6 }}
          >
            {[
              { v: '50K+', l: 'Early Signups' },
              { v: '12', l: 'Countries' },
              { v: '200+', l: 'Organizations' },
              { v: '94%', l: 'Efficacy Verified' },
            ].map(s => (
              <div key={s.l} className="text-center">
                <div className="text-2xl sm:text-3xl font-light" style={{ fontFamily: 'Fraunces, serif', color: '#D97706' }}>{s.v}</div>
                <div className="text-white/40 text-xs mt-0.5" style={{ fontFamily: 'Sora, sans-serif' }}>{s.l}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Wave */}
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
          <svg viewBox="0 0 1440 80" fill="none" className="w-full block">
            <path d="M0 80 L1440 80 L1440 20 Q1080 80 720 30 Q360 -20 0 30 Z" fill="#FAF6EF" />
          </svg>
        </div>
      </section>

      {/* ─── Product Showcase ──────────────────────────────── */}
      <section id="features" style={{ backgroundColor: '#FAF6EF' }} className="py-28">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6, ease }}>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest uppercase mb-4"
              style={{ color: '#D97706', fontFamily: 'Sora, sans-serif' }}>
              <Zap className="w-3.5 h-3.5" /> Platform Preview
            </span>
            <h2 className="text-4xl sm:text-5xl font-light text-[#1C1917] mb-4" style={{ fontFamily: 'Fraunces, serif' }}>
              Six Pillars of<br />Metabolic Transformation
            </h2>
            <p className="text-[#78716C] max-w-lg mx-auto" style={{ fontFamily: 'Sora, sans-serif' }}>
              Every feature built from the ground up for health outcomes — not just engagement.
            </p>
          </motion.div>

          <div className="rounded-[2rem] p-6 sm:p-8 lg:p-10"
            style={{ background: 'linear-gradient(150deg, #070f0b 0%, #0F3424 40%, #1A4D3A 100%)' }}>
            <motion.div
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
              initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}
              variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
            >
              {showcase.map((card) => (
                <motion.div
                  key={card.title}
                  variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease } } }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="rounded-2xl border border-white/[0.08] overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(8px)' }}
                >
                  {/* Card header */}
                  <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-white/[0.07]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${card.color}20` }}>
                        <card.icon className="w-4 h-4" style={{ color: card.color }} strokeWidth={1.8} />
                      </div>
                      <div>
                        <div className="text-white text-xs font-semibold leading-tight" style={{ fontFamily: 'Sora, sans-serif' }}>{card.title}</div>
                        <div className="text-white/40 text-[10px]" style={{ fontFamily: 'Sora, sans-serif' }}>{card.subtitle}</div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#4ADE80' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                    </div>
                  </div>
                  {/* Card content */}
                  <div className="p-4">{card.content}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── Why VivoQuest ────────────────────────────────── */}
      <section style={{ backgroundColor: '#F0EBE0' }} className="py-28">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div className="text-center mb-14"
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6, ease }}>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest uppercase mb-4"
              style={{ color: '#D97706', fontFamily: 'Sora, sans-serif' }}>
              <Shield className="w-3.5 h-3.5" /> Why VivoQuest
            </span>
            <h2 className="text-4xl sm:text-5xl font-light text-[#1C1917] mb-4" style={{ fontFamily: 'Fraunces, serif' }}>
              Built for Every Dimension<br />of Health
            </h2>
            <p className="text-[#78716C] max-w-lg mx-auto" style={{ fontFamily: 'Sora, sans-serif' }}>
              From individual wellness to corporate health transformation — VivoQuest is the only platform built for all of them.
            </p>
          </motion.div>

          <motion.div
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}
            variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
          >
            {features.map(({ icon: Icon, title, desc }) => (
              <motion.div
                key={title}
                variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease } } }}
                whileHover={{ y: -3, transition: { duration: 0.18 } }}
                className="bg-white rounded-2xl p-7 border border-[#E7E2D5] cursor-default group transition-shadow hover:shadow-lg"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-all duration-300 group-hover:scale-110"
                  style={{ backgroundColor: '#F0EBE0' }}>
                  <Icon className="w-6 h-6" style={{ color: '#1A4D3A' }} strokeWidth={1.6} />
                </div>
                <h3 className="font-semibold text-[#1C1917] mb-2.5" style={{ fontFamily: 'Sora, sans-serif' }}>{title}</h3>
                <p className="text-[#78716C] text-sm leading-relaxed" style={{ fontFamily: 'Sora, sans-serif' }}>{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Impact Section ────────────────────────────────── */}
      <section
        ref={impactRef}
        className="py-28"
        style={{ background: 'linear-gradient(150deg, #070f0b 0%, #0F3424 45%, #1A4D3A 100%)' }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest uppercase mb-4"
              style={{ color: '#D97706', fontFamily: 'Sora, sans-serif' }}>
              <Target className="w-3.5 h-3.5" /> Our Impact
            </span>
            <h2 className="text-4xl sm:text-5xl font-light text-white" style={{ fontFamily: 'Fraunces, serif' }}>
              A Movement in the Making
            </h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-10 mb-20">
            {[
              { n: members, suffix: '+', label: 'Future Members', sub: 'Individuals & families' },
              { n: communities, suffix: '+', label: 'Communities', sub: 'Cities & organizations' },
              { n: programs, suffix: '+', label: 'Wellness Programs', sub: 'Structured pathways' },
              { n: journeys, suffix: '+', label: 'Transformations', sub: 'Health journeys tracked' },
            ].map(({ n, suffix, label, sub }) => (
              <div key={label} className="text-center">
                <div className="text-5xl sm:text-6xl lg:text-7xl font-light text-white mb-2 tabular-nums"
                  style={{ fontFamily: 'Fraunces, serif', color: '#D97706' }}>
                  {n.toLocaleString()}{suffix}
                </div>
                <div className="text-white/70 font-medium text-sm mb-1" style={{ fontFamily: 'Sora, sans-serif' }}>{label}</div>
                <div className="text-white/35 text-xs" style={{ fontFamily: 'Sora, sans-serif' }}>{sub}</div>
              </div>
            ))}
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { icon: Shield, t: 'HIPAA & GDPR Compliant', d: 'Enterprise-grade privacy and security built into every layer.' },
              { icon: Zap, t: 'AI-First Architecture', d: 'Proprietary ML models trained on millions of metabolic data points.' },
              { icon: Award, t: 'Clinically Validated', d: 'Outcomes validated through university research and clinical partnerships.' },
            ].map(({ icon: Icon, t, d }) => (
              <div key={t} className="rounded-2xl p-6 border border-white/[0.08]" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <Icon className="w-6 h-6 mb-3" style={{ color: '#D97706' }} strokeWidth={1.6} />
                <h3 className="text-white font-semibold text-sm mb-2" style={{ fontFamily: 'Sora, sans-serif' }}>{t}</h3>
                <p className="text-white/45 text-sm leading-relaxed" style={{ fontFamily: 'Sora, sans-serif' }}>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Partners ─────────────────────────────────────── */}
      <section id="partners" style={{ backgroundColor: '#FAF6EF' }} className="py-28">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div className="text-center mb-14"
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6, ease }}>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest uppercase text-[#D97706] mb-4"
              style={{ fontFamily: 'Sora, sans-serif' }}>
              Trusted By
            </span>
            <h2 className="text-4xl sm:text-5xl font-light text-[#1C1917] mb-4" style={{ fontFamily: 'Fraunces, serif' }}>
              World-Class Partners
            </h2>
            <p className="text-[#78716C] max-w-md mx-auto" style={{ fontFamily: 'Sora, sans-serif' }}>
              Built in collaboration with leading healthcare, research, academic, and corporate institutions globally.
            </p>
          </motion.div>

          <PartnersMarquee />

          <motion.div
            className="mt-14 pt-10 border-t border-[#E7E2D5] flex flex-wrap justify-center gap-x-8 gap-y-3"
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
            viewport={{ once: true }} transition={{ duration: 0.8 }}
          >
            {['SOC 2 Type II', 'HIPAA Compliant', 'ISO 27001', 'GDPR Ready', 'FDA Registered', 'HL7 FHIR'].map(badge => (
              <div key={badge} className="flex items-center gap-2 text-sm text-[#78716C]" style={{ fontFamily: 'Sora, sans-serif' }}>
                <CheckCircle className="w-4 h-4" style={{ color: '#1A4D3A' }} />
                {badge}
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Early Access Form ────────────────────────────── */}
      <EarlyAccessForm />

      {/* ─── Webinar Booking ──────────────────────────────── */}
      <WebinarBooking />

      <Footer />
    </div>
  );
}
