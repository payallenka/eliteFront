import * as React from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";

const NavigationMenu = () => {
  const navigate = useNavigate();
  const [session, setSession] = React.useState<any>(null);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [adminLoading, setAdminLoading] = React.useState(true);

  React.useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      if (data.session?.user) {
        // Use cached admin status for instant UI
        const cachedAdmin = sessionStorage.getItem('isAdmin');
        if (cachedAdmin !== null) {
          setIsAdmin(cachedAdmin === 'true');
        }
        setAdminLoading(true);
        // Always re-check admin/advisor role from user_roles table in background
        const { data: userRole } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.session.user.id)
          .single();
        const isAdminVal = userRole?.role?.toLowerCase() === "admin" || userRole?.role?.toLowerCase() === "advisor";
        setIsAdmin(isAdminVal);
        sessionStorage.setItem('isAdmin', isAdminVal ? 'true' : 'false');
        setAdminLoading(false);
      } else {
        setIsAdmin(false);
        setAdminLoading(false);
        sessionStorage.removeItem('isAdmin');
      }
    };
    getSession();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        setAdminLoading(true);
        // Use user_metadata.role instead of user_roles table
        const role = session.user.user_metadata?.role || 'student';
        const isAdminVal = role === 'admin' || role === 'advisor';
        setIsAdmin(isAdminVal);
        sessionStorage.setItem('isAdmin', isAdminVal ? 'true' : 'false');
        setAdminLoading(false);
      } else {
        setIsAdmin(false);
        setAdminLoading(false);
        sessionStorage.removeItem('isAdmin');
      }
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // Only render navbar if not logged in
  if (session) return null;

  const handleLogout = async () => {
    console.log('Logout: Clearing session data locally');
    // Clear all local session data
    localStorage.clear();
    sessionStorage.clear();
    setSession(null);
    console.log('Logout: Local data cleared, redirecting');
    window.location.href = "/";
  };

  return (
    <nav className="fixed top-0 left-0 w-full bg-white shadow z-50 flex items-center justify-center px-responsive py-2 sm:py-3 md:py-4" style={{ fontFamily: 'Montserrat, Inter, Hedvig Letters Sans, sans-serif' }}>
      <div className="w-full max-w-6xl flex items-center justify-between mx-auto">
        <div className="text-responsive-base font-extrabold text-[#1a0841] tracking-tight break-anywhere" style={{ fontFamily: 'Montserrat, Inter, Hedvig Letters Sans, sans-serif', fontWeight: 400, letterSpacing: '-1px' }}>Elite Scholars</div>
        <div className="flex flex-wrap gap-1 sm:gap-2 lg:gap-3 items-center">
          <button className="bg-[#1a0841] text-white btn-responsive rounded-full font-bold shadow-md transition-colors hover:bg-[#2c1a4e]" onClick={() => navigate("/")}>Home</button>
          {session && (
            <button className="bg-[#1a0841] text-white btn-responsive rounded-full font-bold shadow-md transition-colors hover:bg-[#2c1a4e]" onClick={() => navigate("/courses")}>Courses</button>
          )}
          {session && (
            <button className="bg-[#1a0841] text-white btn-responsive rounded-full font-bold shadow-md transition-colors hover:bg-[#2c1a4e]" onClick={() => navigate("/ai-advisor")}>AI Advisor</button>
          )}
          {session && (adminLoading ? (
            <button className="bg-gray-200 text-gray-400 btn-responsive rounded-full font-bold shadow-md animate-pulse cursor-not-allowed" disabled>Admin...</button>
          ) : isAdmin && (
            <>
              <button className="bg-[#1a0841] text-white btn-responsive rounded-full font-bold shadow-md transition-colors hover:bg-[#2c1a4e] hidden lg:block" onClick={() => navigate("/admin-ai-chats")}>Manage AI Chats</button>
              <button className="bg-[#1a0841] text-white btn-responsive rounded-full font-bold shadow-md transition-colors hover:bg-[#2c1a4e] hidden sm:block" onClick={() => navigate("/admin-user-details/demo-user-id")}>User Details</button>
            </>
          ))}
          {session ? (
            <button className="bg-[#e60023] hover:bg-[#c2001a] text-white btn-responsive rounded-full font-bold shadow-md transition-colors" onClick={handleLogout}>Logout</button>
          ) : (
            <button className="bg-[#e60023] hover:bg-[#c2001a] text-white btn-responsive rounded-full font-bold shadow-md transition-colors" onClick={() => navigate('/login')}>Log In</button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default NavigationMenu;