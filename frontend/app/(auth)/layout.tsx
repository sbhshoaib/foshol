'use client';

import { ReactNode } from 'react';
import { motion } from 'motion/react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-emerald-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-pulse animation-delay-2000"></div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md z-10 relative px-6 sm:px-8"
      >
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white tracking-tight">
            Foshol
          </h1>
          <p className="text-slate-400 mt-2 text-base">Empowering Farmers, Everywhere.</p>
        </div>
        {children}
      </motion.div>
    </div>
  );
}
