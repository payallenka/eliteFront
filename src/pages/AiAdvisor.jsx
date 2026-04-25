import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import AdvisorWidget from '../components/ui/AdvisorWidget';

export default function AiAdvisor() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setLoading(false);
      console.log('[AiAdvisor] user:', session?.user);
    };
    getSession();
  }, []);

  return (
    <div className="flex flex-col bg-slate-50 lg:ml-16" style={{ height: '100dvh' }}>
      {/* Header */}
      <header className="flex-shrink-0 bg-white border-b border-slate-200 px-5 sm:px-8 py-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-brand-600 flex items-center justify-center text-white text-base font-bold shadow-xs flex-shrink-0">✦</div>
        <div>
          <h1 className="text-lg font-bold text-slate-900 leading-tight">AI Advisor</h1>
          <p className="text-xs text-slate-400">Powered by Elite Scholars knowledge base</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-slate-500 font-medium">Online</span>
        </div>
      </header>

      {/* Chat Body */}
      <div className="flex-1 min-h-0 flex flex-col">
        {loading ? (
          <div className="flex items-center justify-center flex-1">
            <div className="text-center">
              <div className="w-10 h-10 border-2 border-slate-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-slate-500">Loading advisor…</p>
            </div>
          </div>
        ) : user ? (
          <AdvisorWidget user={user} />
        ) : (
          <div className="flex items-center justify-center flex-1">
            <p className="text-rose-600 font-semibold text-sm">No user session found. Please log in.</p>
          </div>
        )}
      </div>
    </div>
  );
}
