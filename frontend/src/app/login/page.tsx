'use client';
import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../lib/axios';
import { useRouter } from 'next/navigation';
import { Blocks } from 'lucide-react';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const setAuth = useAuthStore(state => state.setAuth);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        const res = await authApi.post('/login', { email, password });
        setAuth(res.data.token, res.data.user);
        router.push('/');
      } else {
        await authApi.post('/register', { email, password });
        setIsLogin(true);
        setError('Registration successful! Please sign in.');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'An error occurred');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="w-full max-w-[420px] relative">
        {/* Decorative blur blobs */}
        <div className="absolute top-0 -left-10 w-72 h-72 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-10 -right-10 w-72 h-72 bg-cyan-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-700"></div>
        
        <div className="relative bg-white/80 backdrop-blur-xl p-10 sm:p-12 rounded-[2.5rem] shadow-[0_8px_40px_rgb(0,0,0,0.04)] border border-white">
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-cyan-500 rounded-[1.25rem] mx-auto mb-6 flex items-center justify-center shadow-xl shadow-indigo-500/20 transform -rotate-3 hover:rotate-3 transition-transform duration-300">
              <Blocks className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {isLogin ? 'Welcome back' : 'Create an account'}
            </h1>
            <p className="text-sm font-medium text-slate-500 mt-3">
              {isLogin ? 'Enter your details to access your workspace' : 'Start building your dynamic platform today'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-slate-900 placeholder-slate-400 font-medium"
                placeholder="name@company.com"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-slate-900 placeholder-slate-400 font-medium"
                placeholder="••••••••"
              />
            </div>
            
            {error && (
              <div className={`p-4 rounded-2xl text-sm font-bold flex items-center gap-3 ${error.includes('successful') ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                {error}
              </div>
            )}
            
            <button type="submit" className="w-full py-4 px-4 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 text-white font-bold text-base rounded-2xl shadow-xl shadow-indigo-500/20 transform transition-all active:scale-[0.98] focus:ring-4 focus:ring-indigo-500/30">
              {isLogin ? 'Sign In to Workspace' : 'Create Workspace'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm font-medium text-slate-600">
              {isLogin ? "New to the platform? " : "Already registered? "}
              <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="text-indigo-600 font-bold hover:text-indigo-800 hover:underline transition-colors ml-1">
                {isLogin ? 'Create an account' : 'Sign in here'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
