import React, { Suspense, lazy, useMemo } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import BlogsPage from "./pages/BlogsPage.jsx";
import NavigationMenu from "./components/ui/navigation-menu";
import VerticalSidebar from "./components/ui/VerticalSidebar";
import MobileBottomNav from "./components/ui/MobileBottomNav";
import Login from "./pages/Login";
import Register from "./pages/Register";
import UserDashboard from "./pages/UserDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Courses from "./pages/Courses";
import DashboardLayout from "./components/ui/DashboardLayout";
import { supabase } from "./supabaseClient";
import ChatbotWidget from "./components/ui/ChatbotWidget";
import Profile from "./pages/Profile";
import ProfileAdmin from "./pages/ProfileAdmin";
import ApplicationTracker from "./pages/ApplicationTracker";
import AdminDocuments from "./components/AdminDocuments";
import UpgradePlanForm from "./pages/UpgradePlanForm";
import NewApplicationForm from "./pages/NewApplicationForm";
import AiAdvisor from "./pages/AiAdvisor";
import ExplorePrograms from "./pages/ExplorePrograms";
import ScholarshipsPage from "./pages/ScholarshipsPage";
import "./headline-underline.css";
import Housing from "./pages/Housing";

const AdminUserDetails = lazy(() => import('./pages/AdminUserDetails'));
const EventsPage = lazy(() => import('./pages/EventsPage'));
const CareersPage = lazy(() => import('./pages/CareersPage'));
const ControlPanel = lazy(() => import('./pages/ControlPanel'));

// Centralized auth hook with onboarding redirect
function useAuth() {
  console.log('useAuth called', Date.now());
  const [user, setUser] = React.useState(null);
  const [role, setRole] = React.useState("");
  const [onboardingRequired, setOnboardingRequired] = React.useState(false);
  const [checking, setChecking] = React.useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  React.useEffect(() => {
    let isMounted = true;
    const getSession = async () => {
      setChecking(true);
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      if (session?.user) {
        // Use user_metadata.role for role detection
        const userRole = session.user.user_metadata?.role?.toLowerCase() || "";
        setRole(userRole);
        setOnboardingRequired(false); // You can adjust this if you have onboarding logic elsewhere
        setChecking(false);
      } else {
        setRole("");
        setOnboardingRequired(false);
        setChecking(false);
      }
    };
    getSession();
    const { data: unsubscribe } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        const userRole = session.user.user_metadata?.role?.toLowerCase() || "";
        setRole(userRole);
        setOnboardingRequired(false);
        setChecking(false);
      } else {
        setRole("");
        setOnboardingRequired(false);
        setChecking(false);
      }
    });
    return () => {
      isMounted = false;
      if (typeof unsubscribe === "function") {
        unsubscribe();
      } else if (unsubscribe && typeof unsubscribe.unsubscribe === "function") {
        unsubscribe.unsubscribe();
      }
    };
  }, [navigate, location.pathname]);
  
  // Memoize the return value to prevent unnecessary re-renders
  return useMemo(() => {
    const isAdminValue = role === "admin" || role === "advisor";
    return {
      user, 
      isAdmin: isAdminValue, 
      onboardingRequired, 
      checking
    };
  }, [user, role, onboardingRequired, checking]);
}

function AppContent() {
  const { user, isAdmin, onboardingRequired, checking } = useAuth();
  
  // Determine if we should show the sidebar (not on login/register pages or public pages)
  const location = useLocation();
  const publicPages = ['/login', '/register', '/forgot-password', '/reset-password', '/events', '/careers', '/blogs'];
  const showSidebar = user && !publicPages.includes(location.pathname);

  // Redirect to external site if at base URL
  React.useEffect(() => {
    if (location.pathname === '/' && window.location.hostname !== 'elitescholarsinter.com') {
      window.location.replace('https://elitescholarsinter.com/');
    }
  }, [location.pathname]);

  if (checking) {
    return (
      <>
        {showSidebar && <VerticalSidebar isAdmin={isAdmin} key="checking-sidebar" />}
        <div className={`flex items-center justify-center min-h-screen ${showSidebar ? 'sidebar-offset' : 'px-4'}`}>
          <div className="text-center p-responsive">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-[#6c47ff] mx-auto mb-4"></div>
            <p className="text-responsive-base text-gray-600">Loading...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Sidebar for desktop, bottom nav for mobile */}
      {showSidebar && <>
        <div className="hidden lg:block"><VerticalSidebar isAdmin={isAdmin} key="main-sidebar" /></div>
        <div className="lg:hidden"><MobileBottomNav isAdmin={isAdmin} /></div>
      </>}
      <div style={{ fontFamily: 'Montserrat, Inter, Hedvig Letters Sans, sans-serif', fontWeight: 400 }}>
      <Suspense fallback={
        <div className={`flex items-center justify-center min-h-screen ${showSidebar ? 'sidebar-offset' : 'px-4'}`}>
          <div className="text-center p-responsive">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-[#6c47ff] mx-auto mb-4"></div>
            <p className="text-responsive-base text-gray-600">Loading...</p>
          </div>
        </div>
      }>
        <Routes>
          {/* Authenticated routes - moved to top level to prevent remounting */}
          {user && !onboardingRequired && (
            <>
              <Route path="/courses" element={<Courses />} />
              <Route path="/profile" element={
                user?.user_metadata?.role === 'admin' || user?.user_metadata?.role === 'advisor' ? 
                <Navigate to="/profile-admin" replace /> : 
                <Profile />
              } />
              <Route path="/profile-admin" element={<ProfileAdmin />} />
              <Route path="/application-tracker" element={<ApplicationTracker />} />
              <Route path="/admin-documents" element={<AdminDocuments />} />
              <Route path="/upgrade-plan" element={<NewApplicationForm />} />
              <Route path="/housing" element={<Housing />} />
              <Route path="/scholarships" element={<ScholarshipsPage />} />
              {isAdmin && (
                <>
                  <Route path="/admin-user-details/:userId" element={<AdminUserDetails />} />
                  <Route path="/control-panel" element={<ControlPanel />} />
                </>
              )}
              {/* Redirect any attempt to access dashboard routes based on role */}
              <Route path="/" element={
                <Navigate to={user?.user_metadata?.role === 'admin' || user?.user_metadata?.role === 'advisor' ? '/profile-admin' : '/profile'} replace />
              } />
              <Route path="/user-dashboard" element={
                <Navigate to={user?.user_metadata?.role === 'admin' || user?.user_metadata?.role === 'advisor' ? '/profile-admin' : '/profile'} replace />
              } />
              <Route path="/admin-dashboard" element={
                <Navigate to={user?.user_metadata?.role === 'admin' || user?.user_metadata?.role === 'advisor' ? '/profile-admin' : '/profile'} replace />
              } />
            </>
          )}
          
          {/* Onboarding route */}
          {user && onboardingRequired && (
            <>
              <Route path="/profile" element={
                user?.user_metadata?.role === 'admin' || user?.user_metadata?.role === 'advisor' ? 
                <Navigate to="/profile-admin" replace /> : 
                <Profile />
              } />
              <Route path="/profile-admin" element={<ProfileAdmin />} />
            </>
          )}
          
          {/* Public routes - always available */}
          <Route path="/events" element={<EventsPage />} />
          <Route path="/careers" element={<CareersPage />} />
          <Route path="/explore-programs" element={<ExplorePrograms />} />
          <Route path="/blogs" element={<BlogsPage />} />
          
          {/* Auth routes - always available */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/ai-advisor" element={<AiAdvisor />} />
        </Routes>
      </Suspense>
      {user && !['/login', '/register', '/events', '/careers'].includes(location.pathname) && <ChatbotWidget user={user} />}
      </div>
    </>
  );
}

function App() {
  return <AppContent />;
}

export default App;