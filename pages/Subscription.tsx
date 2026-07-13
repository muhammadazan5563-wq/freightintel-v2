import React, { useState, useEffect } from 'react';
import { Check, Sparkles, Zap, Clock } from 'lucide-react';

const plans = [
  {
    name: 'Basic',
    oldPrice: '$49',
    price: '$25',
    period: '/mo',
    description: 'Core access for getting started.',
    features: ['Dashboard', 'Carrier Database', 'Settings & Subscription', 'Page size fixed at 500'],
    cta: 'Get Started',
    popular: false,
  },
  {
    name: 'Essential',
    oldPrice: '$99',
    price: '$50',
    period: '/mo',
    description: 'For small brokerages that need more reach.',
    features: ['Everything in Basic', 'FMCSA Register', 'Advanced Filters', 'Adjustable page size'],
    cta: 'Upgrade to Essential',
    popular: false,
  },
  {
    name: 'Professional',
    oldPrice: '$149',
    price: '$75',
    soloPrice: '$35',
    soloOldPrice: '$69',
    period: '/mo',
    description: 'For growing teams needing serious data.',
    features: ['Everything in Essential', 'New Ventures', 'Full Advanced Filters', 'Priority Support', '4 Users (contact for more)'],
    soloFeatures: ['Everything in Essential', 'New Ventures', 'Full Advanced Filters', 'Priority Support', '1 User'],
    cta: 'Upgrade to Professional',
    popular: true,
  },
  {
    name: 'Insurance',
    oldPrice: '$499',
    price: '$250',
    period: '/mo',
    description: 'Full access for large logistics & insurance firms.',
    features: ['Everything unlocked', 'Inspections, Safety & Insurance data', 'Officer names visible', 'Scraper & Pipeline tools'],
    cta: 'Contact Sales',
    popular: false,
  }
];

export const Subscription: React.FC = () => {
  const [proMode, setProMode] = useState<'team' | 'solo'>('team');

  // 3-day countdown timer
  const [timeLeft, setTimeLeft] = useState({ days: 3, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 3);
    endDate.setHours(23, 59, 59, 999);

    const storedEnd = localStorage.getItem('offer_end_date');
    const targetDate = storedEnd ? new Date(storedEnd) : endDate;

    if (!storedEnd) {
      localStorage.setItem('offer_end_date', endDate.toISOString());
    }

    const updateTimer = () => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;

      if (distance <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 lg:p-8 pb-20 overflow-y-auto h-screen animate-fade-up" style={{ opacity: 0, animationFillMode: 'forwards' }}>
      {/* Limited Offer Banner */}
      <div className="max-w-3xl mx-auto mb-8">
        <div className="relative overflow-hidden rounded-2xl px-6 py-4 text-center" style={{ background: 'linear-gradient(135deg, #7C5CFC 0%, #9B7EFD 50%, #B69FFF 100%)' }}>
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 50%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          <div className="relative flex items-center justify-center gap-3 flex-wrap">
            <Zap size={20} className="text-yellow-300 animate-pulse" />
            <span className="text-white font-bold text-lg tracking-wide">LIMITED TIME OFFER</span>
            <span className="bg-white/20 backdrop-blur-sm text-white text-sm font-semibold px-3 py-1 rounded-full">
              50% OFF All Plans
            </span>
            <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
              <Clock size={14} className="text-white" />
              <span className="text-white text-sm font-bold tabular-nums">
                {timeLeft.days}d {String(timeLeft.hours).padStart(2, '0')}h {String(timeLeft.minutes).padStart(2, '0')}m {String(timeLeft.seconds).padStart(2, '0')}s
              </span>
            </div>
            <Zap size={20} className="text-yellow-300 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-14">
        <p className="section-label mb-3" style={{ color: '#7C5CFC', letterSpacing: '0.12em' }}>Pricing Plans</p>
        <h1 className="heading-display text-3xl lg:text-4xl text-slate-900 tracking-tight mb-4">
          Choose your data power
        </h1>
        <p className="text-base text-slate-500 leading-relaxed">
          Unlock the full potential of the FMCSA database with our engine.
          Stop manual copy-pasting and start closing deals.
        </p>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-7xl mx-auto">
        {plans.map((plan, idx) => {
          const isPro = plan.name === 'Professional';
          const displayPrice = isPro && proMode === 'solo' ? (plan as any).soloPrice : plan.price;
          const displayOldPrice = isPro && proMode === 'solo' ? (plan as any).soloOldPrice : plan.oldPrice;

          return (
            <div
              key={idx}
              className={`relative flex flex-col transition-all duration-300 ${
                plan.popular
                  ? 'card-purple text-white scale-[1.03] z-10 shadow-xl'
                  : 'stat-card'
              }`}
              style={plan.popular ? { padding: '2rem' } : { padding: '2rem' }}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg" style={{ color: '#7C5CFC' }}>
                  <Sparkles size={12} />
                  Most Popular
                </div>
              )}

              {/* Plan Name & Description */}
              <div className="mb-6">
                <h3 className={`heading-display text-xl mb-2 ${plan.popular ? 'text-white' : 'text-slate-900'}`}>
                  {plan.name}
                </h3>
                <p className={`text-sm h-10 ${plan.popular ? 'text-white/70' : 'text-slate-500'}`}>
                  {plan.description}
                </p>
              </div>

              {/* Solo/Team Toggle for Professional */}
              {isPro && (
                <div className="mb-4 flex items-center justify-center gap-1 p-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.15)' }}>
                  <button
                    onClick={() => setProMode('solo')}
                    className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold transition-all ${
                      proMode === 'solo'
                        ? 'bg-white shadow-sm'
                        : 'text-white/80 hover:text-white'
                    }`}
                    style={proMode === 'solo' ? { color: '#7C5CFC' } : {}}
                  >
                    Solo
                  </button>
                  <button
                    onClick={() => setProMode('team')}
                    className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold transition-all ${
                      proMode === 'team'
                        ? 'bg-white shadow-sm'
                        : 'text-white/80 hover:text-white'
                    }`}
                    style={proMode === 'team' ? { color: '#7C5CFC' } : {}}
                  >
                    Team
                  </button>
                </div>
              )}

              {/* Price */}
              <div className="mb-6 flex items-baseline gap-2">
                <span className={`text-lg line-through ${plan.popular ? 'text-white/50' : 'text-slate-400'}`} style={{ fontFamily: 'Syne, sans-serif' }}>
                  {displayOldPrice}
                </span>
                <span className={`text-4xl font-bold ${plan.popular ? 'text-white' : 'text-slate-900'}`} style={{ fontFamily: 'Syne, sans-serif' }}>
                  {displayPrice}
                </span>
                <span className={`text-sm ${plan.popular ? 'text-white/60' : 'text-slate-400'}`}>
                  {plan.period}
                </span>
              </div>

              {/* CTA Button */}
              <button
                onClick={() => window.open('https://api.whatsapp.com/send?phone=966591860764', '_blank')}
                className={`w-full py-3.5 rounded-xl font-semibold mb-6 transition-all text-sm ${
                  plan.popular
                    ? 'bg-white hover:bg-slate-50 shadow-lg'
                    : 'btn-primary'
                }`}
                style={plan.popular ? { color: '#7C5CFC' } : {}}
              >
                {plan.cta}
              </button>

              {/* Features */}
              <div className="space-y-3.5 flex-1">
                {(isPro && proMode === 'solo' ? (plan as any).soloFeatures || plan.features : plan.features).map((feature: string, fIdx: number) => (
                  <div key={fIdx} className="flex items-center gap-3">
                    <div
                      className="rounded-full p-1 flex-shrink-0"
                      style={{
                        background: plan.popular ? 'rgba(255,255,255,0.2)' : 'rgba(124,92,252,0.08)',
                      }}
                    >
                      <Check size={12} style={{ color: plan.popular ? '#FFFFFF' : '#7C5CFC' }} />
                    </div>
                    <span className={`text-sm ${plan.popular ? 'text-white/90' : 'text-slate-600'}`}>
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-16 text-center pt-8" style={{ borderTop: '1px solid #E2E8F0' }}>
        <p className="text-slate-400 text-sm">
          Secure payment processing via Stripe. Cancel anytime.
          <br />
          Need a custom data solution?{' '}
          <a href="https://api.whatsapp.com/send?phone=966591860764" target="_blank" rel="noopener noreferrer" className="font-medium hover:underline" style={{ color: '#7C5CFC' }}>
            Chat with us.
          </a>
        </p>
      </div>
    </div>
  );
};
