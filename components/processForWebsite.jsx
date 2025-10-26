"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export default function ProcessForWebsite() {
  const floatingAnimation = {
    y: [0, -15, 0],
    rotate: [0, 5, 0],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut",
    },
  };

  const particleColors = [
    "bg-emerald-400/30", "bg-cyan-400/25", "bg-sky-400/20",
    "bg-teal-400/25", "bg-emerald-300/20", "bg-sky-300/15",
    "bg-emerald-500/30", "bg-teal-300/25", "bg-cyan-300/20",
  ];

  const floatingParticles = [
    { top: "10%", left: "5%", size: "w-2 h-2", delay: 0, duration: 6 },
    { top: "15%", left: "8%", size: "w-3 h-3", delay: 1.2, duration: 5 },
    { top: "8%", left: "12%", size: "w-1 h-1", delay: 0.8, duration: 7 },
    { top: "12%", right: "10%", size: "w-2 h-2", delay: 0.4, duration: 6.5 },
    { top: "18%", right: "6%", size: "w-3 h-3", delay: 1.6, duration: 5.5 },
    { top: "5%", right: "15%", size: "w-1 h-1", delay: 0.9, duration: 7.2 },
    { bottom: "15%", left: "8%", size: "w-2 h-2", delay: 0.6, duration: 5.8 },
    { bottom: "20%", left: "12%", size: "w-3 h-3", delay: 1.4, duration: 6.2 },
    { bottom: "12%", left: "4%", size: "w-1 h-1", delay: 0.3, duration: 7.5 },
    { bottom: "18%", right: "8%", size: "w-2 h-2", delay: 0.7, duration: 6.8 },
    { bottom: "22%", right: "12%", size: "w-3 h-3", delay: 1.8, duration: 5.2 },
    { bottom: "14%", right: "4%", size: "w-1 h-1", delay: 0.5, duration: 7.8 },
    { top: "45%", left: "20%", size: "w-2 h-2", delay: 1.1, duration: 6.3 },
    { top: "55%", right: "25%", size: "w-3 h-3", delay: 0.2, duration: 5.7 },
    { top: "35%", left: "30%", size: "w-1 h-1", delay: 1.5, duration: 7.1 },
    { top: "25%", left: "25%", size: "w-2 h-2", delay: 0.8, duration: 6.6 },
    { top: "65%", right: "18%", size: "w-3 h-3", delay: 1.3, duration: 5.9 },
    { top: "40%", right: "35%", size: "w-1 h-1", delay: 0.9, duration: 7.4 },
    { bottom: "30%", left: "18%", size: "w-2 h-2", delay: 1.7, duration: 6.1 },
    { bottom: "35%", right: "22%", size: "w-3 h-3", delay: 0.4, duration: 5.4 },
  ];

  return (
    <section className="relative w-full overflow-hidden bg-gradient-to-b from-white via-sky-50 to-white py-16 lg:py-24">
      {/* Background Elements - Static */}
      <div className="absolute top-0 left-0 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-sky-100 to-cyan-100 blur-3xl opacity-60"></div>
      <div className="absolute right-0 bottom-0 h-96 w-96 translate-x-1/3 translate-y-1/3 rounded-full bg-gradient-to-l from-emerald-100 to-emerald-50 blur-3xl opacity-60"></div>

      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-transparent"></div>

      {/* Floating Particles - Keep animated */}
      {floatingParticles.map((particle, index) => (
        <motion.div
          key={index}
          className={`absolute rounded-full ${particle.size} ${particleColors[index % particleColors.length]} backdrop-blur-sm`}
          style={{
            top: particle.top,
            left: particle.left,
            right: particle.right,
            bottom: particle.bottom,
          }}
          animate={{
            y: [0, -20, 10, -5, 0],
            x: [0, 15, -10, 8, 0],
            scale: [1, 1.2, 0.8, 1.1, 1],
            opacity: [0.3, 0.7, 0.4, 0.8, 0.3],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Special accent particles - Keep animated */}
      <motion.div
        className="absolute top-1/4 left-1/4 h-4 w-4 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 opacity-40 backdrop-blur-sm"
        animate={{
          y: [0, -30, 20, -15, 0],
          x: [0, 25, -15, 20, 0],
          rotate: [0, 180, 360],
          scale: [1, 1.3, 0.7, 1.2, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute right-1/3 bottom-1/3 h-3 w-3 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 opacity-50 backdrop-blur-sm"
        animate={{
          y: [0, 25, -20, 15, 0],
          x: [0, -20, 15, -12, 0],
          rotate: [0, -180, -360],
          scale: [1, 1.4, 0.6, 1.1, 1],
        }}
        transition={{
          duration: 7,
          delay: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute top-2/3 left-1/3 h-2 w-2 rounded-full bg-gradient-to-r from-sky-400 to-cyan-400 opacity-60 backdrop-blur-sm"
        animate={{
          y: [0, -15, 25, -10, 0],
          x: [0, 18, -12, 15, 0],
          scale: [1, 1.5, 0.5, 1.3, 1],
        }}
        transition={{
          duration: 9,
          delay: 1,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        {/* Section Header - No load animation */}
        <div className="mb-16 text-center">
          <span className="mb-4 inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
            How It Works
          </span>

          <h2 className="mb-4 text-4xl font-extrabold text-slate-900 lg:text-5xl">
            Our Impact Journey
          </h2>
        </div>

        <div className="flex flex-col items-center gap-12 lg:flex-row lg:gap-16">
          {/* Left: Image with hover */}
          <div className="relative w-full lg:w-1/2">
            <motion.div
              whileHover={{
                scale: 1.02,
                rotateY: 5,
                transition: { duration: 0.3 },
              }}
              className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
            >
              <motion.div
                animate={floatingAnimation}
                className="absolute -top-4 -right-4 h-8 w-8 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-lg"
              ></motion.div>
              <motion.div
                animate={{
                  ...floatingAnimation,
                  transition: { ...floatingAnimation.transition, delay: 1.5 },
                }}
                className="absolute -bottom-3 -left-3 h-6 w-6 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg"
              ></motion.div>

              <div className="relative h-80 lg:h-96">
                <Image
                  src="/img/process.png"
                  alt="Donation process illustration"
                  fill
                  className="object-contain p-4"
                  priority
                />
              </div>
            </motion.div>

            <div className="absolute -bottom-6 -left-6 h-12 w-12 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-500 blur-sm opacity-20"></div>
            <div className="absolute -top-6 -right-6 h-16 w-16 rounded-full bg-gradient-to-br from-sky-400 to-cyan-400 blur-sm opacity-20"></div>
          </div>

          {/* Right: Content - No load animation */}
          <div className="w-full space-y-6 lg:w-1/2">
            {[
              {
                text: "Every donation you make has the power to transform lives. Start by giving what you can — whether it's clothes, books, toys, or funds — and watch it reach those who truly need it.",
                bg: "bg-white",
                border: "border-slate-200",
              },
              {
                text: "Our platform ensures that every contribution is carefully verified, giving you confidence that your kindness makes a real impact.",
                bg: "bg-gradient-to-br from-sky-50 to-cyan-50",
                border: "border-sky-200",
              },
              {
                text: "Together with our dedicated NGOs, your generosity turns into meaningful action, empowering communities and shaping a brighter future.",
                bg: "bg-gradient-to-br from-emerald-50 to-emerald-100",
                border: "border-emerald-200",
              },
            ].map((block, index) => (
              <div
                key={index}
                className={`${block.bg} rounded-xl border p-6 shadow-md ${block.border}`}
              >
                <p className="text-base leading-relaxed text-slate-700 lg:text-lg">
                  {block.text}
                </p>
              </div>
            ))}

            <div className="pt-4">
              <motion.button
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0 20px 40px rgba(16, 185, 129, 0.25)",
                  transition: { duration: 0.3 },
                }}
                whileTap={{ scale: 0.95 }}
                className="relative w-full overflow-hidden rounded-md bg-emerald-600 px-6 py-3 text-base font-semibold text-white shadow-lg transition-all duration-300 hover:bg-emerald-700 lg:w-auto"
              >
                <motion.div
                  className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: "100%" }}
                  transition={{ duration: 0.8 }}
                />
                <span className="relative z-10">Join Our Mission Today</span>
              </motion.button>
            </div>
          </div>
        </div>

        {/* Progress Indicators - No load animation, keep hover */}
        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            { number: "10K+", label: "Lives Impacted" },
            { number: "500+", label: "Verified NGOs" },
            { number: "95%", label: "Direct Reach" },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              whileHover={{
                scale: 1.05,
                y: -8,
                transition: { duration: 0.3 },
              }}
              className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-6 text-center shadow-md"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-sky-50 opacity-0"
                whileHover={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
              <div className="relative z-10 mb-2 text-4xl font-extrabold text-emerald-600">
                {stat.number}
              </div>
              <div className="relative z-10 text-base font-medium text-slate-600">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
