'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchApi } from '@/lib/api';
import { motion } from 'motion/react';
import { Loader2, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      router.push('/');
    } else {
      setIsCheckingAuth(false);
    }
  }, [router]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  if (isCheckingAuth) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetchApi('/login', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      if (response.access_token) {
        localStorage.setItem('auth_token', response.access_token);
        localStorage.setItem('user', JSON.stringify(response.user));
        router.push('/');
      } else {
        setError('Login failed. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-semibold text-white mb-8 tracking-tight">Welcome Back</h2>
      
      {error && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2 pl-1">Email Address</label>
          <input
            type="email"
            required
            className="w-full bg-slate-800/60 rounded-2xl px-5 py-4 text-white placeholder-slate-400 focus:outline-none focus:bg-slate-700/80 transition-colors duration-200"
            placeholder="farmer@example.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-2 pl-1 pr-1">
            <label className="block text-sm font-medium text-slate-300">Password</label>
            <Link href="/forgot-password" className="text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors">
              Forgot password?
            </Link>
          </div>
          <input
            type="password"
            required
            className="w-full bg-slate-800/60 rounded-2xl px-5 py-4 text-white placeholder-slate-400 focus:outline-none focus:bg-slate-700/80 transition-colors duration-200"
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-semibold rounded-2xl px-5 py-4 mt-8 transition-colors duration-200 flex items-center justify-center group disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              Sign In
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </form>

      <div className="mt-10 text-center text-slate-400">
        New to Foshol?{' '}
        <Link href="/register" className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors">
          Create an account
        </Link>
      </div>
    </div>
  );
}
