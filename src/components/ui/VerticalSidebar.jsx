import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import {
  ClipboardList, UserCircle, BookOpen, Bot, Compass,
  Home, GraduationCap, Users, LayoutDashboard, CalendarDays,
  Briefcase, LogOut, Zap, Sparkles,
} from "lucide-react";

const NavItem = ({ icon: Icon, label, collapsed, active, onClick }) => (
  <button
    onClick={onClick}
    title={collapsed ? label : undefined}
    className={`nav-item ${active ? "nav-item-active" : ""}`}
  >
    <Icon size={18} className="flex-shrink-0" />
    {!collapsed && (
      <span className="truncate text-sm animate-fade-in-left">{label}</span>
    )}
    {active && !collapsed && (
      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-400 flex-shrink-0" />
    )}
  </button>
);

const SectionLabel = ({ label, collapsed }) =>
  collapsed ? (
    <div className="my-1 mx-3 border-t border-white/10" />
  ) : (
    <p className="nav-section-label animate-fade-in">{label}</p>
  );

export default function VerticalSidebar({ isAdmin: isAdminProp }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(true);
  const [hovered, setHovered] = useState(false);
  const sidebarRef = useRef(null);

  const isAdminRoute =
    location.pathname === "/profile-admin" ||
    location.pathname.startsWith("/admin-") ||
    location.pathname.startsWith("/control-panel");
  const isAdmin = isAdminRoute || isAdminProp;

  const isActive = (path) => location.pathname === path;
  const isExpanded = !collapsed || hovered;

  useEffect(() => {
    const handleClick = (e) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
        setCollapsed(true);
        setHovered(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const go = (path) => {
    navigate(path);
    setCollapsed(true);
  };

  const userNav = [
    { section: "My Journey" },
    { icon: ClipboardList, label: "Application Tracker", path: "/application-tracker" },
    { icon: UserCircle,    label: "Profile",             path: "/profile" },
    { section: "Resources" },
    { icon: BookOpen,      label: "Courses",             path: "/courses" },
    { icon: Bot,           label: "AI Advisor",          path: "/ai-advisor" },
    { icon: Compass,       label: "Explore Programs",    path: "/explore-programs" },
    { icon: Home,          label: "Housing",             path: "/housing" },
    { icon: GraduationCap, label: "Scholarships",        path: "/scholarships" },
  ];

  const adminNav = [
    { section: "Administration" },
    { icon: UserCircle,      label: "Profile",         path: "/profile-admin" },
    { icon: Users,           label: "User Details",    path: "/admin-user-details/demo-user-id" },
    { icon: LayoutDashboard, label: "Control Panel",   path: "/control-panel" },
    { icon: CalendarDays,    label: "Events",          path: "/events" },
    { icon: Briefcase,       label: "Careers",         path: "/careers" },
    { icon: BookOpen,        label: "Courses",         path: "/courses" },
  ];

  const navItems = isAdmin ? adminNav : userNav;

  return (
    <aside
      ref={sidebarRef}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ width: isExpanded ? "var(--sidebar-expanded)" : "var(--sidebar-collapsed)" }}
      className={`
        fixed left-0 top-0 h-screen z-40 hidden lg:flex flex-col
        bg-slate-900 shadow-sidebar
        transition-all duration-300 ease-smooth overflow-hidden
      `}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-3 py-5 border-b border-white/10 flex-shrink-0">
        <div className="w-8 h-8 rounded-xl bg-gradient-brand flex items-center justify-center flex-shrink-0 shadow-glow-brand">
          <Sparkles size={16} className="text-white" />
        </div>
        {isExpanded && (
          <div className="animate-fade-in-left overflow-hidden">
            <p className="text-sm font-bold text-white leading-tight tracking-tight">Elite Scholars</p>
            <p className="text-[10px] text-slate-400 leading-tight">
              {isAdmin ? "Admin Panel" : "Student Portal"}
            </p>
          </div>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3 space-y-0.5">
        {navItems.map((item, i) =>
          item.section ? (
            <SectionLabel key={i} label={item.section} collapsed={!isExpanded} />
          ) : (
            <NavItem
              key={item.path}
              icon={item.icon}
              label={item.label}
              collapsed={!isExpanded}
              active={isActive(item.path)}
              onClick={() => go(item.path)}
            />
          )
        )}
      </nav>

      {/* Bottom actions */}
      <div className="px-2 py-3 border-t border-white/10 space-y-1 flex-shrink-0">
        {!isAdmin && (
          <button
            onClick={() => go("/upgrade-plan")}
            title={!isExpanded ? "Upgrade Plan" : undefined}
            className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold
              bg-gradient-to-r from-brand-600 to-violet-600
              text-white shadow-xs hover:shadow-card
              transition-all duration-200 active:scale-[0.98]
            `}
          >
            <Zap size={15} className="flex-shrink-0" />
            {isExpanded && <span className="animate-fade-in-left truncate">Upgrade Plan</span>}
          </button>
        )}
        <button
          onClick={handleLogout}
          title={!isExpanded ? "Sign Out" : undefined}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                     text-slate-400 hover:bg-white/10 hover:text-white
                     transition-all duration-150"
        >
          <LogOut size={18} className="flex-shrink-0" />
          {isExpanded && <span className="animate-fade-in-left truncate">Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
