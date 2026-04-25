import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import VerticalSidebar from '../components/ui/VerticalSidebar';

export default function AdminDashboard() {
  const [userDetails, setUserDetails] = useState({ name: '', role: '', email: '' });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserDetails = async () => {
      setLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        const name = session.user.user_metadata?.name || session.user.email;
        const email = session.user.email;
        // Updated: fetch by user_id instead of id
        const { data: userRole } = await supabase
          .from('user_roles')
          .select('role, name')
          .eq('user_id', session.user.id)
          .single();
        setUserDetails({
          name: userRole?.name || name,
          role: userRole?.role || '',
          email,
        });
      }
      setLoading(false);
    };
    fetchUserDetails();
  }, []);

  return (
    <div style={{ fontFamily: 'Montserrat, Inter, Hedvig Letters Sans, sans-serif', fontWeight: 400 }}>
      {loading ? (
        <div className="flex items-center justify-center min-h-screen ml-0 lg:ml-16 px-0 sm:px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6c47ff] mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">Loading admin dashboard...</p>
          </div>
        </div>
      ) : (
        <div className="min-h-screen bg-white text-[#1a0841] font-sans px-0 sm:px-4 py-8 ml-0 lg:ml-16" style={{ fontFamily: 'Montserrat, Inter, Hedvig Letters Sans, sans-serif', fontWeight: 400 }}>
          <div className="max-w-4xl">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 md:mb-6">
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2 md:mb-0" style={{ fontFamily: 'Montserrat, Inter, Hedvig Letters Sans, sans-serif', fontWeight: 400 }}>Admin Dashboard</h1>
            </div>
            <div className="mb-8">
              <div className="text-xl md:text-2xl mb-1 flex items-center gap-2" style={{ fontFamily: 'Montserrat, Inter, Hedvig Letters Sans, sans-serif', fontWeight: 400 }}>
                Name - {userDetails.name}
              </div>
              <div className="text-base text-gray-700 mb-1" style={{ fontFamily: 'Montserrat, Inter, Hedvig Letters Sans, sans-serif', fontWeight: 400 }}>Email - {userDetails.email}</div>
              <div className="text-base px-3 py-1 rounded bg-purple-100 text-purple-900 inline-block mb-2" style={{ fontFamily: 'Montserrat, Inter, Hedvig Letters Sans, sans-serif', fontWeight: 400 }}>Role - {userDetails.role}</div>
              {/* Logout button removed as requested */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
