import {
  ClipboardList, UserCircle, BookOpen, Bot, Compass,
  Home, GraduationCap, Users, LayoutDashboard, CalendarDays,
  Briefcase, LogOut, Zap, Building2,
} from "lucide-react";

// Unified navigation configuration for both desktop sidebar and mobile bottom nav
export const getNavigationItems = (isAdmin = false) => {
  if (isAdmin) {
    return {
      main: [
        { label: "Profile", icon: UserCircle, path: "/profile-admin" },
        { label: "User Details", icon: Users, path: "/admin-user-details/demo-user-id" },
        { label: "Control Panel", icon: LayoutDashboard, path: "/control-panel" },
      ],
      resources: [
        { label: "Events", icon: CalendarDays, path: "/events" },
        { label: "Careers", icon: Briefcase, path: "/careers" },
        { label: "Courses", icon: BookOpen, path: "/courses" },
      ],
    };
  }

  return {
    journey: [
      { label: "Application Tracker", icon: ClipboardList, path: "/application-tracker" },
      { label: "Profile", icon: UserCircle, path: "/profile" },
    ],
    resources: [
      { label: "Courses", icon: BookOpen, path: "/courses" },
      { label: "AI Advisor", icon: Bot, path: "/ai-advisor" },
      { label: "Explore Programs", icon: Compass, path: "/explore-programs" },
      { label: "Housing", icon: Home, path: "/housing" },
      { label: "Scholarships", icon: GraduationCap, path: "/scholarships" },
      { label: "Jobs", icon: Building2, path: "/jobs" },
    ],
    community: [
      { label: "Events", icon: CalendarDays, path: "/events" },
      { label: "Careers", icon: Briefcase, path: "/careers" },
    ],
  };
};

// Main items for mobile bottom nav (always visible)
export const getMobileMainNavItems = (isAdmin = false) => {
  if (isAdmin) {
    return [
      { label: "Profile", icon: UserCircle, path: "/profile-admin" },
      { label: "Users", icon: Users, path: "/admin-user-details/demo-user-id" },
      { label: "Control", icon: LayoutDashboard, path: "/control-panel" },
      { label: "Courses", icon: BookOpen, path: "/courses" },
    ];
  }

  return [
    { label: "Tracker", icon: ClipboardList, path: "/application-tracker" },
    { label: "Explore", icon: Compass, path: "/explore-programs" },
    { label: "Profile", icon: UserCircle, path: "/profile" },
    { label: "Advisor", icon: Bot, path: "/ai-advisor" },
  ];
};

// More items for mobile bottom sheet menu
export const getMobileMoreItems = (isAdmin = false) => {
  if (isAdmin) {
    return [
      { label: "Events", icon: CalendarDays, path: "/events" },
      { label: "Careers", icon: Briefcase, path: "/careers" },
      { label: "Logout", icon: LogOut, path: "/logout", isLogout: true },
    ];
  }

  return [
    { label: "Courses", icon: BookOpen, path: "/courses" },
    { label: "Housing", icon: Home, path: "/housing" },
    { label: "Scholarships", icon: GraduationCap, path: "/scholarships" },
    { label: "Jobs", icon: Building2, path: "/jobs" },
    { label: "Events", icon: CalendarDays, path: "/events" },
    { label: "Careers", icon: Briefcase, path: "/careers" },
    { label: "Upgrade Plan", icon: Zap, path: "/upgrade-plan" },
    { label: "Logout", icon: LogOut, path: "/logout", isLogout: true },
  ];
};
