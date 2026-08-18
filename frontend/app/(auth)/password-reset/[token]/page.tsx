'use client';

import { useState, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { fetchApi } from '@/lib/api';
import { motion } from 'motion/react';
import { Loader2, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  
  // Use React.use to unwrap the promise
  const resolvedParams = use(params);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    email: email,
    password: '',
    password_confirmation: '',
    token: resolvedParams.token,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.password_confirmation) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await fetchApi('/reset-password', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      if (response.message) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        setError('Failed to reset password. The link might be invalid or expired.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
        <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-400">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-semibold text-white mb-2">Password Reset Complete</h2>
        <p className="text-slate-400 text-sm mb-6">
          Your password has been successfully reset. You can now use your new password to sign in.
        </p>
        <p className="text-sm text-slate-500">Redirecting to login...</p>
      </motion.div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold text-white mb-2">Create New Password</h2>
      <p className="text-slate-400 text-sm mb-6">
        Please enter your new password below.
      </p>
      
      {error && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Email Address</label>
          <input
            type="email"
            required
            readOnly={!!email}
            className={`w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all duration-200 ${email ? 'opacity-70 cursor-not-allowed' : ''}`}
            placeholder="farmer@example.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">New Password</label>
          <input
            type="password"
            required
            minLength={8}
            className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all duration-200"
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Confirm New Password</label>
          <input
            type="password"
            required
            minLength={8}
            className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all duration-200"
            placeholder="••••••••"
            value={formData.password_confirmation}
            onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl px-4 py-3 mt-4 transition-all duration-200 flex items-center justify-center group disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            'Reset Password'
          )}
        </button>
      </form>
      
      <div className="mt-6 text-center">
        <Link href="/login" className="text-sm text-slate-400 hover:text-white transition-colors">
          Cancel and back to login
        </Link>
      </div>
    </div>
  );
}
