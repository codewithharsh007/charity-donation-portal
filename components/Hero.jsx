'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import LoginPromptModal from './LoginPromptModal';

export default function Hero() {
  const router = useRouter();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleDonateClick = (e) => {
    e.preventDefault();
    
    // Check if user is logged in
    const userData = localStorage.getItem('user');
    if (!userData) {
      setShowLoginModal(true);
    } else {
      router.push('/donate');
    }
  };

  return (
    <>
      <section className="w-full bg-gradient-to-b from-white via-sky-50 to-white">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left column: content */}
          <div className="lg:col-span-6">
            <div className="max-w-2xl">
              <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 mb-4 fade-in-up fade-delay-200">
                Trusted · Verified NGOs
              </span>

              <h1 className="mt-4 text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight text-slate-900 fade-in-up fade-delay-300">
                Make an Impact Today — Donate, Partner
              </h1>

              <p className="mt-6 text-lg text-slate-600 fade-in-up fade-delay-400">
                We connect donors and NGOs with verified projects that change
                lives. See transparent outcomes, low fees, and reliable
                reporting — give with confidence.
              </p>
              
             <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/donate"
                  className="inline-flex items-center rounded-md bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow hover:bg-emerald-700 fade-in-up fade-delay-500"
                >
                  Donate Now
                </Link>

                <Link
                  href="/register"
                  className="inline-flex items-center rounded-md border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50 fade-in-up fade-delay-600"
                >
                  Partner With Us
                </Link>
              </div>

             <ul className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-slate-600">
                <li className="fade-in-up fade-delay-500">
                  <strong className="block text-slate-900">99%+</strong>
                  Projects with measurable outcomes
                </li>
                <li className="fade-in-up fade-delay-600">
                  <strong className="block text-slate-900">Low Fees</strong>
                  Transparent platform charges
                </li>
                <li className="fade-in-up fade-delay-700">
                  <strong className="block text-slate-900">Global</strong>
                  NGOs from 50+ countries
                </li>
              </ul>
            </div>
          </div>

             {/* Right column: background visual */}
          <div className="lg:col-span-6 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl slide-in-right slide-delay-300 min-h-[360px] lg:min-h-[480px] xl:min-h-[560px]">
              <Image
                src="/img/hero2.png"
                alt="Hero"
                fill
                style={{ objectFit: "cover", objectPosition: "center" }}
                className="bg-zoom transform-gpu transition-transform duration-1000 hover:scale-105"
                priority
              />
              {/* subtle caption overlay */}
              <div className="absolute left-4 bottom-4 bg-white/80 backdrop-blur-sm rounded-md px-3 py-2 text-xs font-medium text-slate-900">
                Real stories. Real impact.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

      {/* Login Modal */}
      <LoginPromptModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)}
        message="Please login to make a donation and support those in need."
        disableTimer={true}
      />
    </>
  );
}
