'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/authStore';
import { useConfigStore } from '../store/configStore';
import Link from 'next/link';
import { Database, Layout, Settings, Blocks } from 'lucide-react';

export default function Home() {
  const { token, user } = useAuthStore();
  const { config, loading } = useConfigStore();
  const router = useRouter();

  useEffect(() => {
    if (!token) {
      router.push('/login');
    }
  }, [token, router]);

  if (!token) return null;

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 text-white p-10 sm:p-14 shadow-2xl">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-br from-indigo-500 to-cyan-400 rounded-full mix-blend-screen filter blur-[80px] opacity-60"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-gradient-to-tr from-blue-600 to-purple-500 rounded-full mix-blend-screen filter blur-[80px] opacity-60"></div>
        
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-6 tracking-tight leading-tight">
            Welcome back to <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400">
              {config?.appName || 'App Builder'}
            </span>
          </h1>
          <p className="text-lg text-slate-300 mb-8 font-medium leading-relaxed max-w-xl">
            Manage your dynamic entities, configure your models, and monitor your platform's data seamlessly in one place.
          </p>
          <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/10 shadow-inner">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)] animate-pulse"></div>
            <span className="text-sm font-semibold text-slate-200">Logged in as {user?.email}</span>
          </div>
        </div>
      </div>

      {/* Stats/Entities Section */}
      <div className="pt-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-xl">
              <Database className="text-indigo-600 w-6 h-6" /> 
            </div>
            Active Data Entities
          </h2>
          <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest shadow-sm">
            {config?.entities.length} Modules
          </span>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <div key={i} className="h-44 bg-white/60 animate-pulse rounded-[2rem] border border-gray-100 shadow-sm" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {config?.entities.map((entity) => (
              <Link key={entity.name} href={`/${entity.name}`} className="block group">
                <div className="bg-white p-7 rounded-[2rem] shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 hover:border-indigo-200 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 transform group-hover:-translate-y-1 relative overflow-hidden h-full flex flex-col justify-between">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-50/50 to-cyan-50/50 rounded-bl-full -z-10 transition-transform duration-500 group-hover:scale-110"></div>
                  
                  <div className="flex justify-between items-start mb-8">
                    <div className="p-3.5 bg-indigo-50 rounded-2xl group-hover:bg-indigo-600 transition-colors duration-300 shadow-sm">
                      <Blocks className="w-7 h-7 text-indigo-600 group-hover:text-white transition-colors" />
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl group-hover:bg-white text-slate-400 group-hover:text-indigo-500 transition-all duration-300 shadow-sm border border-slate-100 group-hover:border-indigo-100">
                      <Settings size={20} />
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 capitalize mb-3 group-hover:text-indigo-600 transition-colors">{entity.name}</h3>
                    <p className="text-sm font-semibold text-slate-500 flex items-center gap-2 bg-slate-50 inline-flex px-3 py-1.5 rounded-lg">
                      <span className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_5px_rgba(6,182,212,0.5)]"></span>
                      {entity.fields.length} dynamic fields
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
