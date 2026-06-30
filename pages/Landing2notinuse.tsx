import React, { useState, useEffect, useRef } from 'react';
import {
  Truck, ChevronRight, Check, Shield, Zap, ArrowRight, Star,
  BarChart2, Database, Mail, Download, Filter, Search,
  ShieldCheck, TrendingUp, Users, FileText, Bell, Globe,
  ChevronDown, X, Layers, Activity, MapPin, Phone
} from 'lucide-react';
import { User } from '../types';
import { updateUserInSupabase, isIPBlocked } from '../services/userService';
import { loginUser, registerUser } from '../services/backendApiService';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

interface LandingProps {
  onLogin: (user: User) => void;
}

// Animated counter hook
const useCounter = (target: number, duration = 1800, start = false) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    const step = target / (duration / 16);
    let current = 0;
    const timer = setInterval(() => {
      current += step;
      if (current >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(current));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration, start]);
  return count;
};

// FAQ Item
const FAQItem: React.FC<{ q: string; a: string }> = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 16, overflow: 'hidden', marginBottom: 12 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', background: open ? 'rgba(124,92,252,0.06)' : 'rgba(248,248,252,0.9)', textAlign: 'left', cursor: 'pointer', border: 'none', color: '#1E293B', transition: 'background 0.2s' }}
      >
        <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: 15 }}>{q}</span>
        <ChevronDown size={18} style={{ color: '#7C5CFC', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s', flexShrink: 0, marginLeft: 16 }} />
      </button>
      {open && (
        <div style={{ padding: '0 24px 20px', background: 'rgba(248,248,252,0.7)', color: '#64748B', fontSize: 14, lineHeight: 1.7 }}>
          {a}
        </div>
      )}
    </div>
  );
};

export const Landing: React.FC<LandingProps> = ({ onLogin }) => {
  const [authMode, setAuthMode] = useState<'login' | 'register' | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [countersStarted, setCountersStarted] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setCountersStarted(true); }, { threshold: 0.3 });
    if (statsRef.current) obs.observe(statsRef.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    setEmail(''); setPassword(''); setName(''); setError(null);
  }, [authMode]);

  const c1 = useCounter(4200000, 2000, countersStarted);
  const c2 = useCounter(1000, 1500, countersStarted);
  const c3 = useCounter(10, 1200, countersStarted);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      let clientIp = '';
      try {
        const ipRes = await fetch(`${BACKEND_URL}/api/get-ip`);
        const ipData = await ipRes.json();
        clientIp = ipData.ip || '';
      } catch { clientIp = ''; }
      if (clientIp) {
        const blocked = await isIPBlocked(clientIp);
        if (blocked) { setError("Your IP address has been blocked. Please contact support."); return; }
      }
      if (authMode === 'register') {
        if (password.length < 8) { setError("Password must be at least 8 characters long."); return; }
        if (!/\d/.test(password) || !/[a-zA-Z]/.test(password)) { setError("Password must contain at least one letter and one number."); return; }
      }
      if (authMode === 'login') {
        const result = await loginUser(email, password);
        if (!result) { setError("Invalid email or password. Please try again."); return; }
        const row = result.user;
        const loggedInUser: User = {
          id: row.user_id, name: row.name, email: row.email, role: row.role, plan: row.plan,
          dailyLimit: row.daily_limit, recordsExtractedToday: row.records_extracted_today,
          lastActive: 'Now', ipAddress: row.ip_address || clientIp, isOnline: true, isBlocked: row.is_blocked || false,
        };
        if (loggedInUser.isBlocked) { setError("Your account has been blocked. Please contact support."); return; }
        updateUserInSupabase({ ...loggedInUser, isOnline: true, lastActive: 'Now', ipAddress: clientIp || loggedInUser.ipAddress }).catch(console.error);
        onLogin(loggedInUser);
      } else {
        const result = await registerUser(name, email.toLowerCase(), password, `user-${Date.now()}`, clientIp);
        if (!result) { setError("Failed to create account. Email may already be in use."); return; }
        const row = result.user;
        const createdUser: User = {
          id: row.user_id, name: row.name, email: row.email, role: row.role || 'user',
          plan: row.plan || 'Free', dailyLimit: row.daily_limit || 50,
          recordsExtractedToday: row.records_extracted_today || 0,
          lastActive: 'Now', ipAddress: row.ip_address || clientIp, isOnline: true, isBlocked: false,
        };
        onLogin(createdUser);
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const S: React.CSSProperties = { fontFamily: 'Syne, sans-serif' };

  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', color: '#1E293B', fontFamily: 'DM Sans, sans-serif', overflowX: 'hidden' }}>

      {/* Background orbs */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-10%', left: '5%', width: 700, height: 700, background: 'rgba(124,92,252,0.06)', borderRadius: '50%', filter: 'blur(120px)' }} />
        <div style={{ position: 'absolute', top: '40%', right: '-10%', width: 500, height: 500, background: 'rgba(139,92,246,0.04)', borderRadius: '50%', filter: 'blur(100px)' }} />
        <div style={{ position: 'absolute', bottom: '10%', left: '30%', width: 400, height: 400, background: 'rgba(59,130,246,0.03)', borderRadius: '50%', filter: 'blur(100px)' }} />
      </div>

      {/* ── NAVBAR ── */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, borderBottom: '1px solid rgba(0,0,0,0.06)', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 12, background: 'linear-gradient(135deg, #7C5CFC, #A78BFA)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(124,92,252,0.25)' }}>
              <Truck size={16} color="white" />
            </div>
            <span style={{ ...S, fontSize: 17, fontWeight: 700, color: '#0F172A' }}>FreightIntel</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => setAuthMode('login')} style={{ padding: '8px 16px', borderRadius: 10, background: 'transparent', border: '1px solid rgba(0,0,0,0.1)', color: '#64748B', fontSize: 14, fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'DM Sans, sans-serif' }}
              onMouseEnter={e => { (e.target as HTMLElement).style.color = '#1E293B'; (e.target as HTMLElement).style.background = 'rgba(0,0,0,0.04)'; }}
              onMouseLeave={e => { (e.target as HTMLElement).style.color = '#64748B'; (e.target as HTMLElement).style.background = 'transparent'; }}>
              Sign In
            </button>
            <button onClick={() => setAuthMode('register')} style={{ padding: '8px 20px', borderRadius: 10, background: 'linear-gradient(135deg, #7C5CFC, #9B7EFD)', border: 'none', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 16px rgba(124,92,252,0.25)', fontFamily: 'DM Sans, sans-serif' }}>
              Get Started <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ position: 'relative', zIndex: 1, paddingTop: 140, paddingBottom: 100, textAlign: 'center', padding: '140px 24px 100px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          {/* Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 999, background: 'rgba(124,92,252,0.08)', border: '1px solid rgba(124,92,252,0.2)', color: '#7C5CFC', fontSize: 12, fontWeight: 600, marginBottom: 32, letterSpacing: '0.05em' }}>
            <Zap size={12} /> AUTOMATED FMCSA DATA PIPELINE
          </div>

          <h1 style={{ ...S, fontSize: 'clamp(44px, 7vw, 76px)', fontWeight: 800, lineHeight: 1.08, marginBottom: 24, letterSpacing: '-0.02em' }}>
            <span style={{ color: '#0F172A' }}>Get the Full Picture</span>
            <br />
            <span style={{ background: 'linear-gradient(135deg, #7C5CFC, #A78BFA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Instantly.</span>
          </h1>

          <p style={{ fontSize: 18, color: '#64748B', maxWidth: 560, margin: '0 auto 40px', lineHeight: 1.7 }}>
            The ultimate motor carrier research platform for insurance professionals. Find carriers, extract contacts, verify authority, and export — all in one place.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 56 }}>
            <button onClick={() => setAuthMode('register')} style={{ padding: '14px 32px', borderRadius: 14, background: 'linear-gradient(135deg, #7C5CFC, #9B7EFD)', border: 'none', color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 8px 30px rgba(124,92,252,0.3)', fontFamily: 'DM Sans, sans-serif', transition: 'all 0.2s' }}>
              Start Free Trial <ChevronRight size={16} />
            </button>
            <button onClick={() => setAuthMode('login')} style={{ padding: '14px 32px', borderRadius: 14, background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.1)', color: '#334155', fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'DM Sans, sans-serif' }}>
              <BarChart2 size={16} /> Sign In
            </button>
          </div>

          {/* Social proof */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {[...Array(5)].map((_, i) => <Star key={i} size={14} style={{ color: '#F59E0B', fill: '#F59E0B' }} />)}
            </div>
            <span style={{ color: '#94A3B8', fontSize: 13 }}>Trusted by 500+ insurance professionals</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 999, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 8px rgba(16,185,129,0.5)', display: 'inline-block' }} />
              <span style={{ fontSize: 12, color: '#059669', fontWeight: 600 }}>Live FMCSA Sync</span>
            </div>
          </div>
        </div>

        {/* Hero mockup */}
        <div style={{ maxWidth: 1000, margin: '72px auto 0', position: 'relative' }}>
          <div style={{ background: 'linear-gradient(135deg, rgba(124,92,252,0.1), rgba(124,92,252,0.03))', border: '1px solid rgba(124,92,252,0.15)', borderRadius: 24, padding: 3, boxShadow: '0 40px 100px rgba(0,0,0,0.1), 0 0 60px rgba(124,92,252,0.06)' }}>
            <div style={{ background: '#F8F9FC', borderRadius: 22, overflow: 'hidden' }}>
              {/* Mock browser bar */}
              <div style={{ background: '#F1F3F8', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  {['#EF4444','#F59E0B','#10B981'].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
                </div>
                <div style={{ flex: 1, background: 'rgba(0,0,0,0.05)', borderRadius: 8, padding: '5px 12px', fontSize: 12, color: '#94A3B8', marginLeft: 8 }}>
                  app.freightintel.io/carrier-database
                </div>
              </div>
              {/* Mock table */}
              <div style={{ padding: '20px 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <span style={{ ...S, color: '#0F172A', fontSize: 16, fontWeight: 700 }}>Carrier Database</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ padding: '6px 14px', borderRadius: 10, background: 'rgba(124,92,252,0.08)', border: '1px solid rgba(124,92,252,0.2)', color: '#7C5CFC', fontSize: 12 }}>Advanced Filters</div>
                    <div style={{ padding: '6px 14px', borderRadius: 10, background: 'linear-gradient(135deg, #7C5CFC, #9B7EFD)', color: 'white', fontSize: 12 }}>Export CSV</div>
                  </div>
                </div>
                {/* Table head */}
                <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 120px 90px 80px', gap: 16, padding: '8px 12px', borderBottom: '1px solid rgba(0,0,0,0.06)', marginBottom: 4 }}>
                  {['MC #','Legal Name','DOT','Status','Entity'].map(h => (
                    <span key={h} style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94A3B8' }}>{h}</span>
                  ))}
                </div>
                {[
                  { mc: 'MC-123456', name: 'Summit Logistics LLC', dot: '3821944', status: 'ACTIVE', entity: 'CARRIER', active: true },
                  { mc: 'MC-789012', name: 'Blue Ridge Transport', dot: '2914532', status: 'ACTIVE', entity: 'CARRIER', active: true },
                  { mc: 'MC-345678', name: 'Horizon Freight Brokers', dot: '1823771', status: 'INACTIVE', entity: 'BROKER', active: false },
                  { mc: 'MC-901234', name: 'Eagle Eye Trucking Co.', dot: '4012893', status: 'ACTIVE', entity: 'CARRIER', active: true },
                  { mc: 'MC-567890', name: 'Pacific Rim Carriers', dot: '3456781', status: 'ACTIVE', entity: 'CARRIER', active: true },
                ].map((row, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 120px 90px 80px', gap: 16, padding: '10px 12px', borderRadius: 10, background: i === 1 ? 'rgba(124,92,252,0.05)' : 'transparent', borderBottom: '1px solid rgba(0,0,0,0.04)', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: '#7C5CFC', fontWeight: 600, fontFamily: 'monospace' }}>{row.mc}</span>
                    <span style={{ fontSize: 13, color: '#1E293B', fontWeight: 500 }}>{row.name}</span>
                    <span style={{ fontSize: 12, color: '#94A3B8', fontFamily: 'monospace' }}>{row.dot}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: row.active ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', color: row.active ? '#059669' : '#DC2626', border: `1px solid ${row.active ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`, display: 'inline-block' }}>{row.status}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: row.entity === 'CARRIER' ? 'rgba(124,92,252,0.08)' : 'rgba(251,146,60,0.08)', color: row.entity === 'CARRIER' ? '#7C5CFC' : '#EA580C', border: `1px solid ${row.entity === 'CARRIER' ? 'rgba(124,92,252,0.2)' : 'rgba(251,146,60,0.2)'}`, display: 'inline-block' }}>{row.entity}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Floating stat cards */}
          <div style={{ position: 'absolute', top: -16, right: -24, background: '#FFFFFF', border: '1px solid rgba(124,92,252,0.15)', borderRadius: 16, padding: '14px 20px', boxShadow: '0 16px 40px rgba(0,0,0,0.1)', display: 'none' }} className="md:block">
            <div style={{ fontSize: 10, color: '#94A3B8', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Email Coverage</div>
            <div style={{ ...S, fontSize: 24, fontWeight: 700, color: '#7C5CFC' }}>68.4%</div>
          </div>
          <div style={{ position: 'absolute', bottom: 24, left: -24, background: '#FFFFFF', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 16, padding: '14px 20px', boxShadow: '0 16px 40px rgba(0,0,0,0.1)', display: 'none' }} className="md:block">
            <div style={{ fontSize: 10, color: '#94A3B8', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Active Carriers</div>
            <div style={{ ...S, fontSize: 24, fontWeight: 700, color: '#059669' }}>2.1M+</div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section ref={statsRef} style={{ position: 'relative', zIndex: 1, padding: '60px 24px', borderTop: '1px solid rgba(0,0,0,0.06)', borderBottom: '1px solid rgba(0,0,0,0.06)', background: '#F8F9FC' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 0 }}>
          {[
            { value: c1 >= 4200000 ? '4.2M+' : c1.toLocaleString(), label: 'Companies Indexed', icon: Database, color: '#7C5CFC' },
            { value: '1,000s', label: 'Data Points Per Carrier', icon: Layers, color: '#10B981' },
            { value: `${c3}+`, label: 'Pro Research Tools', icon: Activity, color: '#F59E0B' },
            { value: 'Weekly', label: 'Feature Releases', icon: Zap, color: '#EC4899' },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'center', padding: '32px 24px', borderRight: i < 3 ? '1px solid rgba(0,0,0,0.06)' : 'none' }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: `${s.color}12`, border: `1px solid ${s.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <s.icon size={20} style={{ color: s.color }} />
              </div>
              <div style={{ ...S, fontSize: 32, fontWeight: 800, color: '#0F172A', marginBottom: 6 }}>{s.value}</div>
              <div style={{ fontSize: 13, color: '#94A3B8' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── TRUSTED BY ── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '80px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#CBD5E1', marginBottom: 40 }}>Trusted by industry professionals</p>
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 32, maxWidth: 900, margin: '0 auto', opacity: 0.5 }}>
          {['Progressive Insurance', 'GEICO Commercial', 'Northland Insurance', 'Canal Insurance', 'Old Republic', 'Travelers'].map(name => (
            <div key={name} style={{ ...S, fontSize: 14, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.02em' }}>{name}</div>
          ))}
        </div>
      </section>

      {/* ── FEATURE 1: SEARCH ── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '80px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 64, alignItems: 'center' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 999, background: 'rgba(124,92,252,0.08)', border: '1px solid rgba(124,92,252,0.15)', color: '#7C5CFC', fontSize: 11, fontWeight: 700, marginBottom: 20, letterSpacing: '0.06em' }}>
              🔍 POWERFUL SEARCH
            </div>
            <h2 style={{ ...S, fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, color: '#0F172A', marginBottom: 20, lineHeight: 1.15 }}>Find Any Carrier in Seconds</h2>
            <p style={{ fontSize: 16, color: '#64748B', lineHeight: 1.7, marginBottom: 32 }}>
              Search by name, DOT number, MC number, state, or equipment type. Filter by authorization status, insurance company, years in business, and 30+ more criteria.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {['Instant search by name, DOT, or MC number', 'Advanced filters — state, cargo type, hazmat, fleet size', 'Filter by insurance company and renewal dates', 'Find carriers with email contacts only'].map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(124,92,252,0.1)', border: '1px solid rgba(124,92,252,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Check size={12} style={{ color: '#7C5CFC' }} />
                  </div>
                  <span style={{ fontSize: 14, color: '#64748B' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 24, padding: 28, boxShadow: '0 24px 60px rgba(0,0,0,0.08)' }}>
            <div style={{ marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#F8F9FC', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12, padding: '10px 14px' }}>
                <Search size={16} style={{ color: '#94A3B8' }} />
                <span style={{ fontSize: 14, color: '#94A3B8' }}>Search by Business Name...</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {['State: TX', 'Entity: Carrier', 'Has Email: Yes', 'Active: Yes'].map(f => (
                  <div key={f} style={{ padding: '8px 12px', background: 'rgba(124,92,252,0.06)', border: '1px solid rgba(124,92,252,0.15)', borderRadius: 10, fontSize: 12, color: '#7C5CFC', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Filter size={11} /> {f}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ fontSize: 10, color: '#CBD5E1', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, fontWeight: 700 }}>Results — 2,847 carriers</div>
            {['Lone Star Transport LLC', 'Texas Eagle Freight Co.', 'Gulf Coast Logistics Inc.', 'Panhandle Carriers LLC'].map((n, i) => (
              <div key={n} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                <div>
                  <div style={{ fontSize: 13, color: '#1E293B', fontWeight: 500 }}>{n}</div>
                  <div style={{ fontSize: 11, color: '#CBD5E1', marginTop: 2 }}>DOT #{3800000 + i * 12347}</div>
                </div>
                <div style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 6, background: 'rgba(16,185,129,0.08)', color: '#059669', border: '1px solid rgba(16,185,129,0.2)' }}>ACTIVE</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURE 2: PROFILES ── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '80px 24px', background: '#F8F9FC' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 64, alignItems: 'center' }}>
          {/* Mock profile card */}
          <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 24, padding: 28, boxShadow: '0 24px 60px rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              <div style={{ width: 52, height: 52, borderRadius: 16, background: 'linear-gradient(135deg, #7C5CFC, #A78BFA)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(124,92,252,0.25)' }}>
                <Truck size={22} color="white" />
              </div>
              <div>
                <div style={{ ...S, fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>Summit Logistics LLC</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ fontSize: 10, padding: '2px 10px', borderRadius: 6, background: 'rgba(16,185,129,0.08)', color: '#059669', border: '1px solid rgba(16,185,129,0.2)', fontWeight: 700 }}>ACTIVE</span>
                  <span style={{ fontSize: 10, padding: '2px 10px', borderRadius: 6, background: 'rgba(124,92,252,0.08)', color: '#7C5CFC', border: '1px solid rgba(124,92,252,0.2)', fontWeight: 700 }}>CARRIER</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
              {[{ l: 'DOT #', v: '3821944', c: '#7C5CFC' }, { l: 'MC #', v: '123456', c: '#7C5CFC' }, { l: 'Fleet Size', v: '47 units', c: '#0F172A' }].map(s => (
                <div key={s.l} style={{ background: '#F8F9FC', borderRadius: 12, padding: 14, border: '1px solid rgba(0,0,0,0.06)' }}>
                  <div style={{ fontSize: 10, color: '#CBD5E1', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{s.l}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: s.c, fontFamily: 'monospace' }}>{s.v}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {[
                { icon: Phone, v: '(512) 555-0192', label: 'Phone' },
                { icon: Mail, v: 'dispatch@summitlogistics.com', label: 'Email' },
                { icon: MapPin, v: 'Austin, TX 78701', label: 'Location' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#F8F9FC', borderRadius: 12, border: '1px solid rgba(0,0,0,0.06)' }}>
                  <item.icon size={14} style={{ color: '#7C5CFC', flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: '#475569' }}>{item.v}</span>
                </div>
              ))}
            </div>
            <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 12, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#059669', fontWeight: 600 }}>✓ Safety Rating: SATISFACTORY</span>
              <span style={{ fontSize: 11, color: '#CBD5E1' }}>Since 2019</span>
            </div>
          </div>

          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 999, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: '#059669', fontSize: 11, fontWeight: 700, marginBottom: 20, letterSpacing: '0.06em' }}>
              📊 COMPLETE PROFILES
            </div>
            <h2 style={{ ...S, fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, color: '#0F172A', marginBottom: 20, lineHeight: 1.15 }}>Comprehensive Carrier Intelligence</h2>
            <p style={{ fontSize: 16, color: '#64748B', lineHeight: 1.7, marginBottom: 32 }}>
              Every carrier profile includes contact details, authority status, insurance history, safety ratings, inspection records, crash data, and fleet information — all in one view.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                { icon: ShieldCheck, label: 'Safety Scores', desc: 'BASIC percentiles & SMS', color: '#10B981' },
                { icon: FileText, label: 'Inspection History', desc: 'Full violation records', color: '#7C5CFC' },
                { icon: Shield, label: 'Insurance Data', desc: 'Coverage & renewal dates', color: '#F59E0B' },
                { icon: Download, label: 'CSV Export', desc: 'Bulk export ready', color: '#EC4899' },
              ].map(f => (
                <div key={f.label} style={{ padding: 16, background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 16 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${f.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                    <f.icon size={16} style={{ color: f.color }} />
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 4 }}>{f.label}</div>
                  <div style={{ fontSize: 12, color: '#94A3B8' }}>{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURE 3: EMAIL EXTRACTION ── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '80px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 64, alignItems: 'center' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 999, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: '#D97706', fontSize: 11, fontWeight: 700, marginBottom: 20, letterSpacing: '0.06em' }}>
              ✉️ EMAIL EXTRACTION
            </div>
            <h2 style={{ ...S, fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, color: '#0F172A', marginBottom: 20, lineHeight: 1.15 }}>Direct Email Access at Scale</h2>
            <p style={{ fontSize: 16, color: '#64748B', lineHeight: 1.7, marginBottom: 32 }}>
              Decode protected carrier email addresses from FMCSA records. Build targeted outreach lists and export thousands of verified contacts in minutes.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {['Decode protected FMCSA email addresses', 'Filter to only carriers with email contacts', 'Bulk export with full contact data to CSV', 'Insurance renewal date targeting'].map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Check size={12} style={{ color: '#D97706' }} />
                  </div>
                  <span style={{ fontSize: 14, color: '#64748B' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Mock export UI */}
          <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 24, padding: 28, boxShadow: '0 24px 60px rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div style={{ ...S, fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>Export Ready</div>
                <div style={{ fontSize: 12, color: '#94A3B8' }}>847 carriers with emails</div>
              </div>
              <div style={{ padding: '8px 16px', borderRadius: 10, background: 'linear-gradient(135deg, #7C5CFC, #9B7EFD)', color: 'white', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <Download size={13} /> Export CSV
              </div>
            </div>
            {[
              { name: 'Lone Star Transport', email: 'ops@lonestar.com', state: 'TX', renewal: 'Mar 2025' },
              { name: 'Blue Ridge Carriers', email: 'info@blueridge.net', state: 'NC', renewal: 'Apr 2025' },
              { name: 'Gulf Coast Freight', email: 'dispatch@gcfreight.io', state: 'LA', renewal: 'May 2025' },
              { name: 'Summit Express LLC', email: 'admin@summitexp.com', state: 'CO', renewal: 'Mar 2025' },
            ].map((r, i) => (
              <div key={i} style={{ padding: '12px 0', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'grid', gridTemplateColumns: '1fr 1fr 40px 80px', gap: 8, alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 12, color: '#1E293B', fontWeight: 500 }}>{r.name}</div>
                  <div style={{ fontSize: 11, color: '#7C5CFC', marginTop: 2 }}>{r.email}</div>
                </div>
                <div style={{ fontSize: 11, color: '#94A3B8' }}>{r.email}</div>
                <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'monospace' }}>{r.state}</div>
                <div style={{ fontSize: 10, color: '#D97706', fontWeight: 600 }}>↻ {r.renewal}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TOOLS GRID ── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '80px 24px', background: '#F8F9FC' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <h2 style={{ ...S, fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, color: '#0F172A', marginBottom: 16 }}>Powerful Research Tools</h2>
            <p style={{ fontSize: 16, color: '#64748B', maxWidth: 520, margin: '0 auto' }}>Everything you need to find leads, verify carriers, and close more accounts.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
            {[
              { icon: Database, title: 'FMCSA Database', desc: '4.2M+ carriers indexed with real-time authority status, contact info, and compliance data.', color: '#7C5CFC', tag: 'Core' },
              { icon: Mail, title: 'Email Extraction', desc: 'Decode protected carrier emails directly from FMCSA registration pages for targeted outreach.', color: '#10B981', tag: 'Popular' },
              { icon: Bell, title: 'Renewal Targeting', desc: 'Filter carriers by insurance renewal month and target expiring policies before competitors.', color: '#F59E0B', tag: 'Hot' },
              { icon: ShieldCheck, title: 'Safety Intelligence', desc: 'Instant access to BASIC scores, inspection history, crash records, and OOS violation rates.', color: '#EC4899', tag: 'Pro' },
              { icon: Filter, title: 'Advanced Filtering', desc: '30+ filter criteria: state, cargo type, hazmat, fleet size, years in business, and more.', color: '#3B82F6', tag: 'Core' },
              { icon: Download, title: 'Bulk CSV Export', desc: 'Export thousands of filtered carrier records with full contact and compliance data instantly.', color: '#8B5CF6', tag: 'Core' },
              { icon: TrendingUp, title: 'New Ventures', desc: 'Target newly registered carriers — the highest-converting segment for commercial insurance.', color: '#F97316', tag: 'Unique' },
              { icon: Globe, title: 'FMCSA Register', desc: 'Monitor new authority applications and be first to reach carriers before they are established.', color: '#06B6D4', tag: 'Pro' },
              { icon: Users, title: 'Batch Enrichment', desc: 'Enrich thousands of carriers with safety ratings, insurance status, and contact data in bulk.', color: '#84CC16', tag: 'Pro' },
            ].map((f, i) => (
              <div key={i} style={{ padding: 24, background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 20, position: 'relative', transition: 'all 0.2s', cursor: 'default' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${f.color}35`; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,0,0,0.07)'; (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}>
                <div style={{ position: 'absolute', top: 16, right: 16, padding: '2px 8px', borderRadius: 6, background: `${f.color}10`, border: `1px solid ${f.color}25`, fontSize: 10, fontWeight: 700, color: f.color, letterSpacing: '0.04em' }}>{f.tag}</div>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: `${f.color}10`, border: `1px solid ${f.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <f.icon size={20} style={{ color: f.color }} />
                </div>
                <div style={{ ...S, fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>{f.title}</div>
                <div style={{ fontSize: 14, color: '#94A3B8', lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '80px 24px' }}>
        <div style={{ maxWidth: 780, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ ...S, fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, color: '#0F172A', marginBottom: 16 }}>Frequently Asked Questions</h2>
            <p style={{ fontSize: 16, color: '#64748B' }}>Everything you need to know about FreightIntel</p>
          </div>
          {[
            { q: 'What is FreightIntel?', a: 'FreightIntel is a comprehensive carrier research platform built specifically for insurance professionals. We provide instant access to FMCSA data — safety ratings, compliance history, insurance coverage, and contact information — for over 4 million motor carriers across the United States.' },
            { q: 'Who can I search for?', a: 'You can search for any entity with a DOT number — motor carriers, freight brokers, and shippers. Filter by state, entity type, authorization status, cargo type, fleet size, and dozens more criteria to build highly targeted lead lists.' },
            { q: 'How does email extraction work?', a: 'FMCSA protects carrier email addresses with encoding. FreightIntel automatically decodes these protected emails from carrier profiles, giving you direct contact information for your outreach campaigns. You can filter specifically for carriers with email addresses on file.' },
            { q: 'Can I export carrier data?', a: 'Yes — export thousands of filtered carriers to CSV with full contact details, safety ratings, authority status, and insurance information. Exports are instant and include all visible data fields.' },
            { q: 'What is the New Ventures feature?', a: 'New Ventures shows you newly registered carriers — typically those in their first 1-2 years of operation. These are among the highest-converting segments for commercial auto and trucking insurance, as they are actively shopping for coverage.' },
            { q: 'Is there a free trial?', a: 'Yes, FreightIntel offers a free trial with access to core features. No credit card required to get started. Upgrade anytime to unlock higher export limits, advanced filters, and batch enrichment tools.' },
          ].map((faq, i) => <FAQItem key={i} q={faq.q} a={faq.a} />)}
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '80px 24px 120px' }}>
        <div style={{ maxWidth: 780, margin: '0 auto', textAlign: 'center', background: 'linear-gradient(135deg, rgba(124,92,252,0.07), rgba(139,92,246,0.03))', border: '1px solid rgba(124,92,252,0.15)', borderRadius: 32, padding: '72px 48px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -60, right: -60, width: 300, height: 300, background: 'rgba(124,92,252,0.08)', borderRadius: '50%', filter: 'blur(60px)', pointerEvents: 'none' }} />
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 14px', borderRadius: 999, background: 'rgba(124,92,252,0.1)', border: '1px solid rgba(124,92,252,0.2)', color: '#7C5CFC', fontSize: 12, fontWeight: 700, marginBottom: 24 }}>
            🚀 START YOUR JOURNEY TODAY
          </div>
          <h2 style={{ ...S, fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 800, color: '#0F172A', marginBottom: 20, lineHeight: 1.1 }}>Ready to Close More Accounts?</h2>
          <p style={{ fontSize: 17, color: '#64748B', maxWidth: 480, margin: '0 auto 40px', lineHeight: 1.7 }}>
            Join hundreds of insurance professionals who use FreightIntel to find, research, and contact carriers every day.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 28 }}>
            <button onClick={() => setAuthMode('register')} style={{ padding: '16px 40px', borderRadius: 14, background: 'linear-gradient(135deg, #7C5CFC, #9B7EFD)', border: 'none', color: 'white', fontSize: 16, fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 32px rgba(124,92,252,0.3)', fontFamily: 'DM Sans, sans-serif', display: 'flex', alignItems: 'center', gap: 8 }}>
              Start Free Trial <ChevronRight size={18} />
            </button>
            <button onClick={() => setAuthMode('login')} style={{ padding: '16px 40px', borderRadius: 14, background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.1)', color: '#334155', fontSize: 16, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
              Sign In
            </button>
          </div>
          <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
            {['Free trial available', 'No credit card required', 'Cancel anytime'].map(t => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#94A3B8' }}>
                <Check size={13} style={{ color: '#7C5CFC' }} /> {t}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ position: 'relative', zIndex: 1, borderTop: '1px solid rgba(0,0,0,0.06)', padding: '40px 24px', background: '#F8F9FC' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg, #7C5CFC, #A78BFA)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Truck size={14} color="white" />
            </div>
            <span style={{ ...S, fontSize: 15, fontWeight: 700, color: '#0F172A' }}>FreightIntel</span>
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            {['Privacy Policy', 'Terms of Service', 'Support'].map(l => (
              <span key={l} style={{ fontSize: 13, color: '#94A3B8', cursor: 'pointer' }}>{l}</span>
            ))}
          </div>
          <div style={{ fontSize: 13, color: '#CBD5E1' }}>© 2025 FreightIntel. All rights reserved.</div>
        </div>
      </footer>

      {/* ── AUTH MODAL ── */}
      {authMode && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(10px)' }}>
          <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', width: '100%', maxWidth: 440, padding: 36, borderRadius: 24, boxShadow: '0 40px 100px rgba(0,0,0,0.15), 0 0 0 1px rgba(124,92,252,0.08)', position: 'relative' }}>
            <button onClick={() => setAuthMode(null)} style={{ position: 'absolute', top: 16, right: 16, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, background: '#F8F9FC', border: '1px solid rgba(0,0,0,0.08)', color: '#94A3B8', cursor: 'pointer' }}>
              <X size={16} />
            </button>
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={{ width: 36, height: 36, borderRadius: 12, background: 'linear-gradient(135deg, #7C5CFC, #A78BFA)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Truck size={16} color="white" />
                </div>
                <span style={{ ...S, fontSize: 15, fontWeight: 700, color: '#0F172A' }}>FreightIntel</span>
              </div>
              <h2 style={{ ...S, fontSize: 22, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>
                {authMode === 'login' ? 'Welcome back' : 'Create your account'}
              </h2>
              <p style={{ fontSize: 14, color: '#94A3B8' }}>
                {authMode === 'login' ? 'Enter your credentials to access the dashboard.' : 'Start finding carrier leads in seconds.'}
              </p>
            </div>
            {error && (
              <div style={{ marginBottom: 20, padding: '12px 16px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, color: '#DC2626', fontSize: 14 }}>
                {error}
              </div>
            )}
            <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {authMode === 'register' && (
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94A3B8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Full Name</label>
                  <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="John Smith"
                    className="input-field" style={{ width: '100%', padding: '12px 16px', fontSize: 14 }} />
                </div>
              )}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94A3B8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Email Address</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="name@company.com"
                  className="input-field" style={{ width: '100%', padding: '12px 16px', fontSize: 14 }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94A3B8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Password</label>
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                  className="input-field" style={{ width: '100%', padding: '12px 16px', fontSize: 14 }} />
              </div>
              <button type="submit" disabled={isLoading}
                style={{ width: '100%', padding: '14px', borderRadius: 12, background: isLoading ? 'rgba(124,92,252,0.5)' : 'linear-gradient(135deg, #7C5CFC, #9B7EFD)', border: 'none', color: 'white', fontSize: 15, fontWeight: 700, cursor: isLoading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 16px rgba(124,92,252,0.25)', fontFamily: 'DM Sans, sans-serif', marginTop: 4 }}>
                {isLoading ? 'Please wait...' : (authMode === 'login' ? 'Sign In' : 'Create Account')}
              </button>
            </form>
            <div style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: '#CBD5E1' }}>
              {authMode === 'login' ? (
                <>Don't have an account?{' '}
                  <button onClick={() => setAuthMode('register')} style={{ color: '#7C5CFC', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>Sign up free</button>
                </>
              ) : (
                <>Already have an account?{' '}
                  <button onClick={() => setAuthMode('login')} style={{ color: '#7C5CFC', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>Log in</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
