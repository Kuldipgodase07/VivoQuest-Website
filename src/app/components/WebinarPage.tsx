import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as Accordion from '@radix-ui/react-accordion';
import { motion } from 'motion/react';
import {
  Calendar, Clock, Users, Globe, Brain, Activity,
  ArrowRight, CheckCircle, Linkedin, ChevronDown,
  Sparkles, Video, Mic, BookOpen, MessageSquare, Zap,
  Target, BarChart3, Trophy, Heart, TrendingUp
} from 'lucide-react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
const ease = [0.25, 0.46, 0.45, 0.94] as const;

// ─── Data ─────────────────────────────────────────────────
const speakers = [
  {
    name: 'Dr. Arjun Mehta',
    role: 'Chief Medical Officer',
    org: 'VivoQuest',
    expertise: ['Metabolic Medicine', 'Preventive Care', 'AI Health Systems'],
    photo: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=500&h=600&fit=crop&auto=format',
    webinar: 1,
    color: '#D97706',
  },
  {
    name: 'Dr. Sarah Chen',
    role: 'Head of AI Research',
    org: 'VivoQuest',
    expertise: ['Machine Learning', 'Biomarker Analysis', 'Digital Health'],
    photo: 'https://images.unsplash.com/photo-1659353888906-adb3e0041693?w=500&h=600&fit=crop&auto=format',
    webinar: 1,
    color: '#60A5FA',
  },
  {
    name: 'Dr. Marcus Williams',
    role: 'Director, Metabolic Science',
    org: 'VivoQuest',
    expertise: ['Metabolic Research', 'Clinical Trials', 'Nutrition Science'],
    photo: 'https://images.unsplash.com/photo-1637059824899-a441006a6875?w=500&h=600&fit=crop&auto=format',
    webinar: 2,
    color: '#4ADE80',
  },
  {
    name: 'Dr. Priya Nair',
    role: 'VP, Corporate Wellness',
    org: 'VivoQuest',
    expertise: ['Behaviour Change', 'Employee Health', 'Wellness Analytics'],
    photo: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=500&h=600&fit=crop&auto=format',
    webinar: 2,
    color: '#F472B6',
  },
];

const agendaItems = [
  { time: '2:55 PM', icon: Mic, title: 'Welcome & Introductions', detail: 'Meet the speakers and agenda overview', duration: '5 min', accent: false },
  { time: '3:00 PM', icon: Zap, title: 'Opening Keynote', detail: 'The global metabolic health crisis and opportunity', duration: '20 min', accent: false },
  { time: '3:20 PM', icon: BookOpen, title: 'Product Vision', detail: 'VivoQuest platform deep dive and roadmap', duration: '25 min', accent: false },
  { time: '3:45 PM', icon: Video, title: 'Live Demo', detail: 'AI Coach & real-time metabolic scoring walkthrough', duration: '20 min', accent: false },
  { time: '4:05 PM', icon: Users, title: 'Case Studies', detail: 'Real outcomes from community & corporate pilots', duration: '15 min', accent: false },
  { time: '4:20 PM', icon: MessageSquare, title: 'Open Q&A', detail: 'Live audience questions with expert panel', duration: '20 min', accent: false },
  { time: '4:40 PM', icon: Sparkles, title: 'Early Access Reveal', detail: 'Exclusive beta access for registered attendees', duration: '5 min', accent: true },
];

const faqs = [
  { q: 'Who should attend this webinar?', a: 'Healthcare professionals, corporate wellness leaders, HR executives, academic researchers, community health managers, and anyone passionate about the future of preventive health and AI-driven wellness. Both sessions are designed to be accessible to non-technical audiences.' },
  { q: 'Is the webinar free to attend?', a: 'Yes, both webinar sessions are completely free. Seats are limited to 100 per session. All registered attendees also receive exclusive beta access to the VivoQuest platform plus a complimentary personal metabolic assessment upon launch.' },
  { q: 'Will a recording be available?', a: 'Registered attendees receive a full recording within 48 hours of the live event, exclusively available for 30 days post-session. Summary slide decks and resource guides are also included with your registration.' },
  { q: 'What technology do I need to join?', a: 'A modern web browser (Chrome, Firefox, Safari, or Edge) and a stable internet connection. No software download is required. A Zoom link will be sent to your registered email 24 hours and 1 hour before the event starts.' },
  { q: 'Can I register multiple colleagues?', a: 'Absolutely. We encourage team registrations from healthcare organizations and corporations. Each team member should register individually using their own work email. Group enterprise packages will be announced at the webinar.' },
  { q: 'What is included with early access?', a: 'Early access members get priority beta access to the full VivoQuest platform, a personal AI metabolic health assessment, one-on-one onboarding with a wellness specialist, and lifetime founding member pricing when we launch.' },
  { q: 'Is VivoQuest available in my country?', a: 'VivoQuest is launching globally, initially in the US, UK, Canada, Australia, India, UAE, and Singapore. Corporate and enterprise deployments are available globally on request. Register your interest and we will notify you when your region opens.' },
  { q: 'How does VivoQuest differ from other health apps?', a: 'VivoQuest is the only platform combining real-time metabolic AI scoring, gamified community health challenges, preventive care pathways, and enterprise wellness programs — built on clinical evidence, not just engagement metrics.' },
];

// ─── Webinar Card ─────────────────────────────────────────
function WebinarCard({ num, title, date, time, seats, total, topics, tags }: {
  num: string; title: string; date: string; time: string;
  seats: number; total: number;
  topics: { icon: any; label: string }[];
  tags: string[];
}) {
  const used = total - seats;
  const pct = (used / total) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="bg-white rounded-3xl overflow-hidden border border-[#E7E2D5] shadow-sm flex flex-col"
    >
      {/* Header */}
      <div className="relative overflow-hidden px-7 pt-7 pb-6"
        style={{ background: 'linear-gradient(150deg, #070f0b 0%, #0F3424 40%, #1A4D3A 100%)' }}>
        <div className="absolute top-4 right-5 text-[80px] font-light text-white/[0.04] leading-none select-none pointer-events-none"
          style={{ fontFamily: 'Fraunces, serif' }}>
          {num}
        </div>
        <div className="flex items-center gap-2 mb-4">
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#4ADE80' }} />
          <span className="text-white/50 text-[10px] tracking-widest uppercase" style={{ fontFamily: 'Sora, sans-serif' }}>Live Webinar · Free</span>
        </div>
        <h3 className="text-xl font-light text-white leading-snug mb-5 pr-8" style={{ fontFamily: 'Fraunces, serif' }}>{title}</h3>
        <div className="flex flex-wrap gap-4 text-xs text-white/55" style={{ fontFamily: 'Sora, sans-serif' }}>
          <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{date}</span>
          <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{time}</span>
          <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" />Online · Zoom</span>
        </div>
      </div>

      {/* Body */}
      <div className="p-6 flex flex-col flex-1">
        <p className="text-[10px] font-semibold text-[#78716C] uppercase tracking-widest mb-3" style={{ fontFamily: 'Sora, sans-serif' }}>
          Topics Covered
        </p>
        <div className="space-y-2.5 mb-5">
          {topics.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#F0EBE0' }}>
                <Icon className="w-3.5 h-3.5" style={{ color: '#1A4D3A' }} strokeWidth={1.8} />
              </div>
              <span className="text-sm text-[#1C1917]" style={{ fontFamily: 'Sora, sans-serif' }}>{label}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 mb-5">
          {tags.map(t => (
            <span key={t} className="text-[11px] px-3 py-1 rounded-full border border-[#E7E2D5] text-[#78716C]"
              style={{ fontFamily: 'Sora, sans-serif' }}>{t}</span>
          ))}
        </div>

        {/* Seat indicator */}
        <div className="p-4 rounded-2xl mb-5" style={{ backgroundColor: '#F0EBE0' }}>
          <div className="flex justify-between text-xs mb-2" style={{ fontFamily: 'Sora, sans-serif' }}>
            <span className="font-semibold" style={{ color: '#1A4D3A' }}>{seats} seats available</span>
            <span className="text-[#78716C]">{total} capacity</span>
          </div>
          <div className="h-2 rounded-full" style={{ backgroundColor: '#E7E2D5' }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: pct > 70 ? '#D97706' : '#1A4D3A' }} />
          </div>
          <p className="text-[10px] text-[#78716C] mt-1.5" style={{ fontFamily: 'Sora, sans-serif' }}>{used} of {total} seats reserved</p>
        </div>

        <a href="#reg-form"
          className="mt-auto w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-semibold text-white transition-all hover:brightness-110 hover:shadow-lg"
          style={{ backgroundColor: '#1A4D3A', fontFamily: 'Sora, sans-serif' }}>
          Reserve My Seat <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </motion.div>
  );
}

// ─── Speaker Card ─────────────────────────────────────────
function SpeakerCard({ s, idx }: { s: typeof speakers[0]; idx: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, ease, delay: idx * 0.1 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className="bg-white rounded-2xl overflow-hidden border border-[#E7E2D5] group"
    >
      <div className="relative overflow-hidden" style={{ height: '240px', backgroundColor: '#F0EBE0' }}>
        <img
          src={s.photo}
          alt={`${s.name}, ${s.role}`}
          className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 55%)' }} />
        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
          <span
            className="text-[10px] font-semibold px-2.5 py-1 rounded-full text-white"
            style={{ backgroundColor: s.color + 'cc', fontFamily: 'Sora, sans-serif' }}
          >
            Webinar {s.webinar}
          </span>
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-semibold text-[#1C1917] text-base mb-0.5" style={{ fontFamily: 'Sora, sans-serif' }}>{s.name}</h3>
        <p className="text-sm font-medium mb-0.5" style={{ color: '#1A4D3A', fontFamily: 'Sora, sans-serif' }}>{s.role}</p>
        <p className="text-xs text-[#78716C] mb-4" style={{ fontFamily: 'Sora, sans-serif' }}>{s.org}</p>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {s.expertise.map(tag => (
            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-md border border-[#E7E2D5] text-[#78716C]"
              style={{ fontFamily: 'Sora, sans-serif' }}>{tag}</span>
          ))}
        </div>
        <a href="#" className="inline-flex items-center gap-1.5 text-xs font-medium hover:underline transition-colors"
          style={{ color: '#1A4D3A', fontFamily: 'Sora, sans-serif' }}>
          <Linkedin className="w-3.5 h-3.5" /> View LinkedIn
        </a>
      </div>
    </motion.div>
  );
}

// ─── Registration Form ────────────────────────────────────
interface RegData { name: string; email: string; phone: string; organization: string; webinar: string; }

function RegistrationForm() {
  const [apiError, setApiError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting, isSubmitSuccessful }, reset } = useForm<RegData>();
  const onSubmit = async (data: RegData) => {
    setApiError(null);
    try {
      const q = query(collection(db, 'webinar_registrations'), where('email', '==', data.email.trim().toLowerCase()));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        throw new Error('This email is already registered for a webinar.');
      }
      await addDoc(collection(db, 'webinar_registrations'), {
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone?.trim() || null,
        organization: data.organization?.trim() || null,
        webinar_session: data.webinar,
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
    <div id="reg-form" className="bg-white rounded-3xl p-8 border border-[#E7E2D5] shadow-sm">
      <h3 className="text-2xl font-light text-[#1C1917] mb-1" style={{ fontFamily: 'Fraunces, serif' }}>Register Now</h3>
      <p className="text-[#78716C] text-sm mb-7" style={{ fontFamily: 'Sora, sans-serif' }}>Free to attend. Receive the recording and beta access upon confirmation.</p>

      {isSubmitSuccessful ? (
        <div className="text-center py-10">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ backgroundColor: '#1A4D3A' }}>
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <h4 className="text-xl font-light text-[#1C1917] mb-2" style={{ fontFamily: 'Fraunces, serif' }}>You're Registered!</h4>
          <p className="text-[#78716C] text-sm" style={{ fontFamily: 'Sora, sans-serif' }}>
            Check your inbox for a confirmation and your Zoom link.
          </p>
        </div>
      ) : (
        <form onSubmit={wrappedSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#1C1917] mb-2" style={{ fontFamily: 'Sora, sans-serif' }}>Full Name *</label>
            <input {...register('name', { required: true })} placeholder="Your full name"
              className={`${field} ${errors.name ? 'border-red-400' : ''}`} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#1C1917] mb-2" style={{ fontFamily: 'Sora, sans-serif' }}>Work Email *</label>
            <input {...register('email', { required: true, pattern: /^\S+@\S+\.\S+$/ })} type="email"
              placeholder="you@organization.com"
              className={`${field} ${errors.email ? 'border-red-400' : ''}`} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#1C1917] mb-2" style={{ fontFamily: 'Sora, sans-serif' }}>Phone</label>
            <input {...register('phone')} type="tel" placeholder="+1 (555) 000-0000" className={field} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#1C1917] mb-2" style={{ fontFamily: 'Sora, sans-serif' }}>Organization</label>
            <input {...register('organization')} placeholder="Hospital / Company / University" className={field} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#1C1917] mb-2" style={{ fontFamily: 'Sora, sans-serif' }}>Select Session *</label>
            <select {...register('webinar', { required: true })} className={`${field} ${errors.webinar ? 'border-red-400' : ''}`}>
              <option value="">Choose a session…</option>
              <option value="1">Webinar 1 · Future of Metabolic Health · July 15, 2026</option>
              <option value="2">Webinar 2 · AI & Community Wellness · August 5, 2026</option>
              <option value="both">Both Sessions</option>
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
              ? <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Registering…</span>
              : <span className="flex items-center gap-2">Confirm Registration <ArrowRight className="w-4 h-4" /></span>
            }
          </button>
          <p className="text-center text-xs text-[#78716C]" style={{ fontFamily: 'Sora, sans-serif' }}>
            Free event · No spam · Unsubscribe anytime
          </p>
        </form>
      )}
    </div>
  );
}

// ─── Seat Panel ───────────────────────────────────────────
function SeatPanel() {
  const sessions = [
    { label: 'Webinar 1 · Future of Metabolic Health', date: 'July 15, 2026', remaining: 32, total: 100 },
    { label: 'Webinar 2 · AI & Community Wellness', date: 'August 5, 2026', remaining: 47, total: 100 },
  ];

  return (
    <div className="space-y-5">
      <h3 className="text-xl font-light text-[#1C1917]" style={{ fontFamily: 'Fraunces, serif' }}>Seat Availability</h3>

      {sessions.map((s, i) => {
        const used = s.total - s.remaining;
        const pct = (used / s.total) * 100;
        const urgent = s.remaining < 40;
        return (
          <div key={i} className="bg-white rounded-2xl p-5 border border-[#E7E2D5]">
            <div className="flex items-start justify-between mb-1 gap-2">
              <span className="text-sm font-semibold text-[#1C1917] leading-snug" style={{ fontFamily: 'Sora, sans-serif' }}>{s.label}</span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${urgent ? 'text-[#D97706]' : 'text-[#1A4D3A]'}`}
                style={{ backgroundColor: urgent ? '#FEF3C7' : '#F0EBE0', fontFamily: 'Sora, sans-serif' }}>
                {urgent ? 'Filling Fast' : 'Available'}
              </span>
            </div>
            <p className="text-xs text-[#78716C] mb-3" style={{ fontFamily: 'Sora, sans-serif' }}>{s.date}</p>
            <div className="flex justify-between text-xs mb-1.5" style={{ fontFamily: 'Sora, sans-serif' }}>
              <span className="font-semibold" style={{ color: '#1A4D3A' }}>{s.remaining} remaining</span>
              <span className="text-[#78716C]">{s.total} total</span>
            </div>
            <div className="h-2 rounded-full" style={{ backgroundColor: '#F0EBE0' }}>
              <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: urgent ? '#D97706' : '#1A4D3A' }} />
            </div>
            <p className="text-[10px] text-[#78716C] mt-1.5" style={{ fontFamily: 'Sora, sans-serif' }}>{used} of {s.total} spots reserved</p>
          </div>
        );
      })}

      {/* Benefits */}
      <div className="rounded-2xl p-6" style={{ backgroundColor: '#1A4D3A' }}>
        <h4 className="text-white font-semibold text-sm mb-4" style={{ fontFamily: 'Sora, sans-serif' }}>What You'll Receive</h4>
        {[
          'Live Q&A with expert speakers',
          '30-day recording access',
          'Exclusive VivoQuest beta access',
          'Personal metabolic health assessment',
          'Founding member pricing',
          'Resource guide & slide deck',
        ].map(item => (
          <div key={item} className="flex items-start gap-2.5 mb-3 last:mb-0">
            <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#D97706' }} />
            <span className="text-white/70 text-xs leading-relaxed" style={{ fontFamily: 'Sora, sans-serif' }}>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── FAQ ──────────────────────────────────────────────────
function FAQ() {
  return (
    <section style={{ backgroundColor: '#F0EBE0' }} className="py-28">
      <div className="max-w-3xl mx-auto px-6">
        <motion.div className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.6, ease }}>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest uppercase text-[#D97706] mb-4"
            style={{ fontFamily: 'Sora, sans-serif' }}>FAQ</span>
          <h2 className="text-4xl sm:text-5xl font-light text-[#1C1917]" style={{ fontFamily: 'Fraunces, serif' }}>
            Common Questions
          </h2>
        </motion.div>

        <Accordion.Root type="single" collapsible className="space-y-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, ease, delay: i * 0.04 }}
            >
              <Accordion.Item value={`faq-${i}`} className="bg-white rounded-2xl border border-[#E7E2D5] overflow-hidden">
                <Accordion.Header>
                  <Accordion.Trigger className="w-full flex items-center justify-between px-6 py-5 text-left group cursor-pointer">
                    <span className="text-sm font-semibold text-[#1C1917] pr-4 leading-snug" style={{ fontFamily: 'Sora, sans-serif' }}>
                      {faq.q}
                    </span>
                    <ChevronDown
                      className="w-4 h-4 text-[#78716C] flex-shrink-0 transition-transform duration-300 group-data-[state=open]:rotate-180"
                    />
                  </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Content className="overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
                  <div className="px-6 pb-5 pt-1 text-sm text-[#78716C] leading-relaxed" style={{ fontFamily: 'Sora, sans-serif' }}>
                    {faq.a}
                  </div>
                </Accordion.Content>
              </Accordion.Item>
            </motion.div>
          ))}
        </Accordion.Root>
      </div>
    </section>
  );
}

// ─── Main Page ────────────────────────────────────────────
export function WebinarPage() {
  const w1Topics = [
    { icon: Brain, label: 'AI Health Coaching & Personalization' },
    { icon: Activity, label: 'Digital Health Technology Landscape' },
    { icon: Globe, label: 'Population Wellness at Scale' },
    { icon: Heart, label: 'Preventive Care Pathways' },
  ];
  const w2Topics = [
    { icon: Zap, label: 'Behaviour Change Science & AI' },
    { icon: Users, label: 'Community Engagement Strategies' },
    { icon: BarChart3, label: 'Wellness Analytics & Reporting' },
    { icon: Trophy, label: 'Gamified Health Programs' },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden">
      <Navbar />

      {/* ─── Hero ─────────────────────────────────────────── */}
      <section
        className="relative pt-36 pb-24 overflow-hidden"
        style={{ background: 'linear-gradient(150deg, #070f0b 0%, #0F3424 45%, #1A4D3A 100%)' }}
      >
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full opacity-[0.15]"
            style={{ background: 'radial-gradient(circle, #D97706 0%, transparent 65%)' }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '64px 64px' }} />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease }}>
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 mb-10 border border-white/10"
              style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)' }}
            >
              <Video className="w-3.5 h-3.5" style={{ color: '#D97706' }} />
              <span className="text-white/60 text-xs tracking-widest" style={{ fontFamily: 'Sora, sans-serif' }}>Live Webinar Series · 2026</span>
            </div>

            <h1
              className="text-4xl sm:text-6xl lg:text-7xl font-light text-white leading-[1.1] mb-8"
              style={{ fontFamily: 'Fraunces, serif', letterSpacing: '-0.02em' }}
            >
              Join the Future of<br />
              <em style={{ color: '#D97706' }}>Metabolic Health</em>
            </h1>

            <p
              className="text-white/55 text-lg sm:text-xl max-w-2xl mx-auto mb-12 leading-relaxed"
              style={{ fontFamily: 'Sora, sans-serif', fontWeight: 300 }}
            >
              Learn how AI, preventive healthcare, community wellness, and metabolic intelligence are transforming lives across the globe.
            </p>

            <div className="flex flex-wrap justify-center gap-5 mb-12">
              {[
                { icon: Calendar, label: 'July 15 & Aug 5, 2026' },
                { icon: Clock, label: '3:00 PM UTC · 60 Minutes' },
                { icon: Users, label: 'Limited to 100 Seats' },
                { icon: Globe, label: 'Free · Online via Zoom' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 text-white/60 text-sm" style={{ fontFamily: 'Sora, sans-serif' }}>
                  <Icon className="w-4 h-4" style={{ color: '#D97706' }} />
                  {label}
                </div>
              ))}
            </div>

            <a href="#reg-form"
              className="inline-flex items-center gap-2 px-9 py-4 rounded-full font-semibold text-white text-sm transition-all hover:brightness-110 hover:shadow-xl"
              style={{ backgroundColor: '#D97706', fontFamily: 'Sora, sans-serif' }}>
              Reserve My Seat <ArrowRight className="w-4 h-4" />
            </a>
          </motion.div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
          <svg viewBox="0 0 1440 70" fill="none" className="w-full block">
            <path d="M0 70 L1440 70 L1440 18 Q1080 70 720 28 Q360 -14 0 28 Z" fill="#FAF6EF" />
          </svg>
        </div>
      </section>

      {/* ─── Webinar Cards ────────────────────────────────── */}
      <section style={{ backgroundColor: '#FAF6EF' }} className="py-28">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div className="text-center mb-14"
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6, ease }}>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest uppercase text-[#D97706] mb-4"
              style={{ fontFamily: 'Sora, sans-serif' }}>
              <Calendar className="w-3.5 h-3.5" /> Two Sessions
            </span>
            <h2 className="text-4xl sm:text-5xl font-light text-[#1C1917]" style={{ fontFamily: 'Fraunces, serif' }}>
              Choose Your Session
            </h2>
          </motion.div>
          <div className="grid md:grid-cols-2 gap-6">
            <WebinarCard num="01" title="Future of Metabolic Health & Preventive Care"
              date="July 15, 2026" time="3:00 PM UTC" seats={32} total={100}
              topics={w1Topics} tags={['Healthcare Pros', 'Digital Health', 'Free', '60 Min']} />
            <WebinarCard num="02" title="AI, Gamification & Community Wellness Revolution"
              date="August 5, 2026" time="3:00 PM UTC" seats={47} total={100}
              topics={w2Topics} tags={['Corporate Wellness', 'Community Leaders', 'Free', '60 Min']} />
          </div>
        </div>
      </section>

      {/* ─── Speakers ─────────────────────────────────────── */}
      <section style={{ backgroundColor: '#F0EBE0' }} className="py-28">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div className="text-center mb-14"
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6, ease }}>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest uppercase text-[#D97706] mb-4"
              style={{ fontFamily: 'Sora, sans-serif' }}>
              <Mic className="w-3.5 h-3.5" /> Expert Speakers
            </span>
            <h2 className="text-4xl sm:text-5xl font-light text-[#1C1917] mb-4" style={{ fontFamily: 'Fraunces, serif' }}>
              World-Class<br />Health Innovators
            </h2>
            <p className="text-[#78716C] max-w-md mx-auto" style={{ fontFamily: 'Sora, sans-serif' }}>
              Learn directly from the physicians, AI scientists, and wellness leaders building the future of health.
            </p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {speakers.map((s, i) => <SpeakerCard key={s.name} s={s} idx={i} />)}
          </div>
        </div>
      </section>

      {/* ─── Agenda ───────────────────────────────────────── */}
      <section style={{ backgroundColor: '#FAF6EF' }} className="py-28">
        <div className="max-w-3xl mx-auto px-6">
          <motion.div className="text-center mb-14"
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6, ease }}>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest uppercase text-[#D97706] mb-4"
              style={{ fontFamily: 'Sora, sans-serif' }}>
              <Clock className="w-3.5 h-3.5" /> Agenda
            </span>
            <h2 className="text-4xl sm:text-5xl font-light text-[#1C1917]" style={{ fontFamily: 'Fraunces, serif' }}>
              What to Expect
            </h2>
          </motion.div>

          <div className="space-y-3">
            {agendaItems.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, ease, delay: i * 0.06 }}
                className={`flex items-center gap-4 p-5 rounded-2xl border transition-all hover:shadow-md ${
                  item.accent ? 'border-[#D97706]/30' : 'border-[#E7E2D5] bg-white'
                }`}
                style={item.accent ? { backgroundColor: '#FEF3C7' } : {}}
              >
                <div className="flex-shrink-0 w-[52px] text-right">
                  <span className="text-xs font-medium text-[#78716C]" style={{ fontFamily: 'Sora, sans-serif' }}>{item.time}</span>
                </div>
                <div
                  className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: item.accent ? '#D97706' : '#1A4D3A' }}
                >
                  <item.icon className="w-4 h-4 text-white" strokeWidth={1.8} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-[#1C1917]" style={{ fontFamily: 'Sora, sans-serif' }}>{item.title}</div>
                  <div className="text-xs text-[#78716C] mt-0.5" style={{ fontFamily: 'Sora, sans-serif' }}>{item.detail}</div>
                </div>
                <span className="flex-shrink-0 text-xs px-2.5 py-1 rounded-full border border-[#E7E2D5] text-[#78716C] bg-white"
                  style={{ fontFamily: 'Sora, sans-serif' }}>{item.duration}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Registration + Seat Availability ────────────── */}
      <section style={{ backgroundColor: '#F0EBE0' }} className="py-28">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div className="mb-10"
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6, ease }}>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest uppercase text-[#D97706] mb-4"
              style={{ fontFamily: 'Sora, sans-serif' }}>
              <Sparkles className="w-3.5 h-3.5" /> Register
            </span>
            <h2 className="text-4xl sm:text-5xl font-light text-[#1C1917]" style={{ fontFamily: 'Fraunces, serif' }}>
              Claim Your Spot
            </h2>
          </motion.div>
          <div className="grid lg:grid-cols-5 gap-8">
            <motion.div className="lg:col-span-3"
              initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.6, ease }}>
              <RegistrationForm />
            </motion.div>
            <motion.div className="lg:col-span-2"
              initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.6, ease, delay: 0.12 }}>
              <div className="sticky top-24">
                <SeatPanel />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── FAQ ──────────────────────────────────────────── */}
      <FAQ />

      <Footer />
    </div>
  );
}
