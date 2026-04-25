
import React, { useState } from 'react';
import { CheckCircle2, X, ChevronLeft, ChevronRight } from 'lucide-react';

const plans = [
  {
    key: 'compass',
    name: 'The Global Compass',
    tagline: 'Get Your Free Roadmap',
    badge: null,
    price: 0,
    priceLabel: 'Free',
    features: [
      'AI-powered strategic direction',
      'High-level eligibility check',
      'Basic admission requirements guide',
      'Instant results',
      'Get clarity with no credit card required'
    ]
  },
  {
    key: 'launchpad',
    name: 'The Launchpad Strategist',
    tagline: 'Your First Step with an Expert',
    badge: null,
    price: 125,
    priceLabel: '$125',
    features: [
      'Everything in The Global Compass, plus:',
      '1-on-1 live consultation with an advisor',
      'In-depth document analysis & review',
      'Personalized roadmap & action plan',
      'Ongoing email support & Q&A'
    ]
  },
  {
    key: 'odyssey',
    name: 'The Odyssey Package',
    tagline: 'The Premier All-in-One Solution',
    badge: 'Most Popular',
    price: 2500,
    priceLabel: '$2,500',
    features: [
      'Everything in The Launchpad Strategist, plus:',
      'Full application & visa management',
      'Direct access to a senior advisor',
      'Live visa interview prep',
      'Housing & relocation guidance',
      'Unlimited access to the Pathfinder Academy'
    ]
  },
  {
    key: 'apex',
    name: 'The Apex Solution',
    tagline: 'The Ultimate, Tailored Plan',
    badge: 'Elite',
    price: null,
    priceLabel: 'Custom Price',
    features: [
      'All services in The Odyssey Package, plus:',
      'Bespoke, long term strategic planning',
      'Exclusive networking opportunities',
      'Priority 24/7 support',
      'Custom deliverables tailored to your needs',
      'Price determined after a detailed consultation'
    ]
  }
];

export default function PlanSelectionModal({ onSelect, onClose }) {
  const handleSelect = (planKey) => {
    setTimeout(() => onSelect && onSelect(planKey), 100);
  };

  return (
    <div
      className="relative bg-white/90 backdrop-blur-md shadow-2xl rounded-3xl border border-gray-200 w-full max-w-6xl xl:max-w-[1400px] mx-auto px-2 sm:px-4 lg:px-0 pt-0 pb-6"
      style={{ 
        boxShadow: '0 8px 40px 0 rgba(80, 60, 180, 0.12), 0 1.5px 6px 0 rgba(80,60,180,0.08)',
        minWidth: 'min(320px, 95vw)',
        maxWidth: 'min(1400px, 98vw)'
      }}
    >
      {/* Sticky Header & Close Button */}
      <div className="sticky top-0 z-10 bg-white/90 rounded-t-3xl pt-6 pb-2 px-2 flex flex-col items-center" style={{ backdropFilter: 'blur(8px)' }}>
        {onClose && (
          <button
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-200 transition"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        )}
        <h2 className="text-2xl font-bold text-[#1a0841] mb-1">Upgrade Your Plan</h2>
        <p className="text-gray-600 mb-1">Compare plans and choose the one that fits your needs</p>
      </div>
      <div className="w-full mt-2 px-0">
        <div className="flex flex-nowrap gap-3 sm:gap-4 lg:gap-6 overflow-x-auto justify-center items-stretch px-4 lg:px-12 py-4">
          {plans.map((plan) => (
            <div
              key={plan.key}
              className="flex-shrink-0 w-[280px] sm:w-[300px] lg:w-[320px] transition-all duration-300 transform cursor-pointer hover:scale-105"
              style={{ maxWidth: '100vw' }}
            >
              <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-xl border-2 border-gray-100 hover:border-gray-200 h-full flex flex-col relative">
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#6c47ff] to-[#a084ff] text-white text-[10px] uppercase font-bold px-3 py-1 rounded-full shadow-lg">
                    {plan.badge}
                  </div>
                )}
                <div className="text-center mb-4 sm:mb-6 mt-2">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900">{plan.name}</h3>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">{plan.tagline}</p>
                  <div className="mt-3 sm:mt-4 text-2xl sm:text-3xl font-black text-[#6c47ff]">
                    {plan.key === 'compass' ? (
                      <span>{plan.priceLabel}</span>
                    ) : plan.key === 'launchpad' ? (
                      <span>{plan.priceLabel}</span>
                    ) : plan.key === 'odyssey' ? (
                      <span>{plan.priceLabel}</span>
                    ) : plan.key === 'apex' ? (
                      <span>{plan.priceLabel}</span>
                    ) : null}
                  </div>
                </div>
                <ul className="space-y-2 sm:space-y-3 mb-4 sm:mb-6 break-words flex-grow">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start text-xs sm:text-sm text-gray-600">
                      <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mr-2 shrink-0 mt-0.5" />
                      <span className="break-words leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>
                {plan.key === 'compass' ? (
                  <button
                    onClick={() => handleSelect(plan.key)}
                    className="w-full py-2.5 sm:py-3 rounded-2xl font-bold transition-all text-sm sm:text-base bg-[#6c47ff] text-white shadow-lg shadow-indigo-200 hover:bg-[#5a3ecc]"
                  >
                    Choose Plan
                  </button>
                ) : plan.key === 'launchpad' ? (
                  <a
                    href="https://buy.stripe.com/00w6oGa7J8CZ7Im7I05Ne03"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full block text-center py-2.5 sm:py-3 rounded-2xl font-bold transition-all text-sm sm:text-base bg-[#6c47ff] text-white shadow-lg shadow-indigo-200 hover:bg-[#5a3ecc]"
                  >
                    Upgrade Now
                  </a>
                ) : plan.key === 'odyssey' ? (
                  <a
                    href="https://buy.stripe.com/00w9AS1BdcTfe6Kfas5Ne04"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full block text-center py-2.5 sm:py-3 rounded-2xl font-bold transition-all text-sm sm:text-base bg-[#6c47ff] text-white shadow-lg shadow-indigo-200 hover:bg-[#5a3ecc]"
                  >
                    Go All-In Now
                  </a>
                ) : plan.key === 'apex' ? (
                  <a
                    href="https://meet.brevo.com/elitescholars/free-elite-consultation"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full block text-center py-2.5 sm:py-3 rounded-2xl font-bold transition-all text-sm sm:text-base bg-[#6c47ff] text-white shadow-lg shadow-indigo-200 hover:bg-[#5a3ecc]"
                  >
                    Contact Us
                  </a>
                ) : null}
              </div>
            </div>
          ))}
        </div>
        {/* Scroll indicator for mobile */}
        <div className="text-center mt-2 text-xs text-gray-400 sm:hidden">
          ← Swipe to see all plans →
        </div>
      </div>
    </div>
  );
}
