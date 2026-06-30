import React from 'react';
import { Check, Sparkles } from 'lucide-react';

const plans = [
  {
    name: 'Basic',
    price: '$49',
    period: '/mo',
    description: 'Core access for getting started.',
    features: ['Dashboard', 'Carrier Database', 'Settings & Subscription', 'Page size fixed at 500'],
    cta: 'Get Started',
    popular: false,
  },
  {
    name: 'Essential',
    price: '$99',
    period: '/mo',
    description: 'For small brokerages that need more reach.',
    features: ['Everything in Basic', 'FMCSA Register', 'Advanced Filters', 'Adjustable page size'],
    cta: 'Upgrade to Essential',
    popular: false,
  },
  {
    name: 'Professional',
    price: '$149',
    period: '/mo',
    description: 'For growing teams needing serious data.',
    features: ['Everything in Essential', 'New Ventures', 'Full Advanced Filters', 'Priority Support'],
    cta: 'Upgrade to Professional',
    popular: true,
  },
  {
    name: 'Insurance',
    price: '$499',
    period: '/mo',
    description: 'Full access for large logistics & insurance firms.',
    features: ['Everything unlocked', 'Inspections, Safety & Insurance data', 'Officer names visible', 'Scraper & Pipeline tools'],
    cta: 'Contact Sales',
    popular: false,
  }
];

export const Subscription: React.FC = () => {
  return (
    <div className="p-6 lg:p-8 pb-20 overflow-y-auto h-screen animate-fade-up" style={{ opacity: 0, animationFillMode: 'forwards' }}>
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
        {plans.map((plan, idx) => (
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

            {/* Price */}
            <div className="mb-6">
              <span className={`text-4xl font-bold ${plan.popular ? 'text-white' : 'text-slate-900'}`} style={{ fontFamily: 'Syne, sans-serif' }}>
                {plan.price}
              </span>
              <span className={`text-sm ${plan.popular ? 'text-white/60' : 'text-slate-400'}`}>
                {plan.period}
              </span>
            </div>

            {/* CTA Button */}
            <button
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
              {plan.features.map((feature, fIdx) => (
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
        ))}
      </div>

      {/* Footer */}
      <div className="mt-16 text-center pt-8" style={{ borderTop: '1px solid #E2E8F0' }}>
        <p className="text-slate-400 text-sm">
          Secure payment processing via Stripe. Cancel anytime.
          <br />
          Need a custom data solution?{' '}
          <a href="#" className="font-medium hover:underline" style={{ color: '#7C5CFC' }}>
            Chat with us.
          </a>
        </p>
      </div>
    </div>
  );
};
