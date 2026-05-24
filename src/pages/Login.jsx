import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { HiSparkles } from "react-icons/hi2";
import { MdArrowForward, MdCheckCircle, MdAutoAwesome } from "react-icons/md";

const FEATURES = [
  {
    icon: "🎯",
    title: "Eligibility Check",
    desc: "Know exactly where you stand for your dream universities — instantly.",
  },
  {
    icon: "🤖",
    title: "AI Advisor",
    desc: "24/7 personalised chat guidance for every step of your application.",
  },
  {
    icon: "📋",
    title: "Application Tracker",
    desc: "One dashboard to manage every deadline, document, and decision.",
  },
  {
    icon: "🆓",
    title: "100% Free to Start",
    desc: "No credit card. No strings. Get your full admissions report in 60 seconds.",
  },
];

const STATS = [
  { value: "10k+", label: "Students helped" },
  { value: "95%",  label: "Visa success rate" },
  { value: "200+", label: "Partner universities" },
];

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) navigate("/profile");
    });
  }, [navigate]);

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    const { error: pwError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (pwError) {
      if (pwError.message?.toLowerCase().includes("invalid login credentials")) {
        setError("Invalid email or password. If you signed up via magic link, click 'Send magic link' or set a password using 'Forgot / set password?'.");
      } else {
        setError(pwError.message);
      }
    } else {
      setSuccess("Login successful!");
      setTimeout(() => navigate("/profile"), 800);
    }
  };

  const handleMagicLink = async () => {
    setError("");
    setSuccess("");
    if (!email) {
      setError("Please enter your email to receive a magic link.");
      return;
    }
    setMagicLoading(true);
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: window.location.origin + "/profile",
      },
    });
    setMagicLoading(false);
    if (otpError) setError(otpError.message);
    else setSuccess("Magic link sent! Check your inbox to sign in.");
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white">

      {/* ── Left panel ─────────────────────────────────────────────────── */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden flex-col justify-between
                      bg-gradient-dark px-14 py-12">
        {/* Background mesh */}
        <div className="absolute inset-0 bg-gradient-mesh opacity-60 pointer-events-none" />
        {/* Decorative orbs */}
        <div className="absolute top-[-80px] right-[-80px] w-96 h-96 rounded-full
                        bg-brand-600/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-60px] left-[-60px] w-72 h-72 rounded-full
                        bg-rose-600/15 blur-3xl pointer-events-none" />

        {/* Logo */}
        <div className="relative flex items-center gap-3 z-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center shadow-glow-brand">
            <HiSparkles size={20} className="text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">Elite Scholars</span>
        </div>

        {/* Headline */}
        <div className="relative z-10 flex-1 flex flex-col justify-center py-12">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15
                          rounded-full px-3.5 py-1.5 text-xs text-white/80 font-medium mb-6 w-fit">
            <MdAutoAwesome size={14} className="text-brand-300" />
            Trusted by 10,000+ students worldwide
          </div>

          <h1 className="text-4xl xl:text-5xl font-bold text-white leading-[1.1] tracking-tight mb-6">
            Your global education<br />
            <span className="bg-gradient-to-r from-brand-300 to-violet-300 bg-clip-text text-transparent">
              journey starts here.
            </span>
          </h1>
          <p className="text-slate-300 text-base leading-relaxed max-w-sm mb-10">
            Get your personalised admissions report and strategic direction in under 60 seconds — completely free.
          </p>

          {/* Feature list */}
          <div className="space-y-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex items-start gap-3.5">
                <span className="text-xl leading-none mt-0.5">{f.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-white leading-tight">{f.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats bar */}
        <div className="relative z-10 flex items-center gap-8 border-t border-white/10 pt-6">
          {STATS.map((s) => (
            <div key={s.label}>
              <p className="text-2xl font-bold text-white leading-tight">{s.value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel ────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col">
        {/* Mobile-only top bar */}
        <div className="lg:hidden flex items-center gap-2.5 px-5 py-4 border-b border-slate-100">
          <div className="w-8 h-8 rounded-xl bg-gradient-brand flex items-center justify-center">
            <HiSparkles size={16} className="text-white" />
          </div>
          <span className="text-base font-bold text-slate-900 tracking-tight">Elite Scholars</span>
        </div>

        <div className="flex-1 flex items-center justify-center px-5 py-12 sm:px-10 lg:px-16">
          <div className="w-full max-w-md animate-fade-in">

            {/* Heading */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
                Welcome back
              </h2>
              <p className="text-slate-500 text-sm">
                Sign in with your password, or request a magic link.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <label className="input-label" htmlFor="email">Email address</label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                />
              </div>

              <div>
                <label className="input-label" htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input"
                  autoComplete="current-password"
                />
              </div>

              <button
                type="submit"
                disabled={loading || magicLoading}
                className="btn btn-rose btn-lg w-full mt-2 group"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign in
                    <MdArrowForward size={18} className="group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleMagicLink}
                disabled={loading || magicLoading}
                className="btn btn-lg w-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              >
                {magicLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin" />
                    Sending link…
                  </>
                ) : (
                  "Send magic link instead"
                )}
              </button>
            </form>

            {/* Feedback */}
            {error && (
              <div className="mt-4 flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-sm animate-fade-in">
                <span className="mt-0.5 text-rose-400">⚠</span>
                {error}
              </div>
            )}
            {success && (
              <div className="mt-4 flex items-center gap-2.5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm animate-fade-in">
                <MdCheckCircle size={18} className="text-emerald-500 flex-shrink-0" />
                {success}
              </div>
            )}

            {/* Forgot / set password */}
            <p className="text-center text-sm mt-5">
              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
                className="text-slate-600 hover:text-brand-600 underline font-medium transition-colors"
              >
                Forgot / set password?
              </button>
            </p>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-slate-100" />
              <span className="text-xs text-slate-400 font-medium">OR</span>
              <div className="flex-1 h-px bg-slate-100" />
            </div>

            {/* Register CTA */}
            <p className="text-center text-sm text-slate-500">
              New to Elite Scholars?{" "}
              <button
                onClick={() => navigate("/register")}
                className="text-brand-600 font-semibold hover:text-brand-700 transition-colors"
              >
                Create a free account →
              </button>
            </p>

            {/* Mobile feature pills */}
            <div className="mt-8 flex flex-wrap gap-2 justify-center lg:hidden">
              {["Eligibility Check", "AI Advisor", "Free to Start"].map((t) => (
                <span key={t} className="badge badge-brand text-[11px]">{t}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 pb-6 px-4">
          By continuing you agree to our{" "}
          <span className="underline cursor-pointer hover:text-slate-600">Terms</span> &amp;{" "}
          <span className="underline cursor-pointer hover:text-slate-600">Privacy Policy</span>.
        </p>
      </div>
    </div>
  );
}

export default Login;
