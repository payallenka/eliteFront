import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MoreHorizontal, Sparkles } from "lucide-react";
import { getMobileMainNavItems, getMobileMoreItems } from "../../config/navigationConfig";

export default function MobileBottomNav({ isAdmin = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showMore, setShowMore] = useState(false);

  const mainNavItems = getMobileMainNavItems(isAdmin);
  const moreNavItems = getMobileMoreItems(isAdmin);

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "/";
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Floating pill nav */}
      <nav className="
        fixed bottom-4 left-1/2 -translate-x-1/2 z-50 lg:hidden
        flex items-center gap-1 px-3 py-2
        bg-slate-900/95 backdrop-blur-xl
        rounded-2xl shadow-card-xl border border-white/10
        animate-fade-in
      ">
        {mainNavItems.map(({ label, icon: Icon, path }) => {
          const active = isActive(path);
          return (
            <button
              key={label}
              onClick={() => navigate(path)}
              className={`
                relative flex flex-col items-center justify-center gap-0.5
                px-3.5 py-2 rounded-xl text-xs font-medium
                transition-all duration-200
                ${active
                  ? "text-white bg-white/15"
                  : "text-slate-400 hover:text-white hover:bg-white/10"
                }
              `}
            >
              <Icon size={20} />
              <span className="text-[10px] leading-none">{label}</span>
              {active && (
                <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-brand-400 animate-pulse-dot" />
              )}
            </button>
          );
        })}

        {/* More button */}
        <button
          onClick={() => setShowMore(true)}
          className="flex flex-col items-center justify-center gap-0.5 px-3.5 py-2 rounded-xl
                     text-slate-400 hover:text-white hover:bg-white/10
                     transition-all duration-200 text-xs font-medium"
        >
          <MoreHorizontal size={22} />
          <span className="text-[10px] leading-none">More</span>
        </button>
      </nav>

      {/* Bottom sheet */}
      {showMore && (
        <div className="fixed inset-0 z-50 flex items-end justify-center lg:hidden">
          <div
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setShowMore(false)}
          />
          <div className="relative w-full max-w-lg bg-white rounded-t-3xl shadow-card-xl
                          p-4 pb-safe animate-slide-up border-t border-slate-100">
            {/* Handle */}
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5" />

            {/* Logo row */}
            <div className="flex items-center gap-2.5 px-2 mb-4 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-gradient-brand flex items-center justify-center">
                <Sparkles size={15} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 leading-tight">Elite Scholars</p>
                <p className="text-[10px] text-slate-400">Student Portal</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-0.5">
              {moreNavItems.map(({ label, icon: Icon, path, isLogout: isLogoutItem }) => (
                <button
                  key={label}
                  onClick={() => {
                    setShowMore(false);
                    if (isLogoutItem) handleLogout();
                    else navigate(path);
                  }}
                  className={`
                    flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium
                    transition-all duration-150 text-left
                    ${isLogoutItem
                      ? "text-rose-600 hover:bg-rose-50"
                      : "text-slate-700 hover:bg-slate-50"
                    }
                  `}
                >
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center
                    ${isLogoutItem ? "bg-rose-100 text-rose-600" : "bg-slate-100 text-slate-600"}`}>
                    <Icon size={18} />
                  </span>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
