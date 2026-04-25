import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import VerticalSidebar from '../components/ui/VerticalSidebar';

function UserDashboard() {
  console.log('UserDashboard rendered');
  const [userDetails, setUserDetails] = useState({ name: '', role: '', email: '' });
  const [editName, setEditName] = useState('');
  const [editing, setEditing] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [reportUrl, setReportUrl] = useState(null);
  const [fetchError, setFetchError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserDetails = async () => {
      setLoading(true);
      setFetchError('');
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        // Try to get name and role from user_roles table
        const { data: userRole, error: userRoleError } = await supabase
          .from("user_roles")
          .select("name, role")
          .eq("user_id", session.user.id)
          .single();
        if (userRoleError) {
          setFetchError('Failed to fetch user role.');
        }
        const role = userRole?.role || '';
        // Redirect advisors/admins to admin dashboard
        if (role === 'advisor' || role === 'admin') {
          navigate('/admin-dashboard');
          return;
        }
        setUserDetails({
          name: userRole?.name || session.user.user_metadata?.name || session.user.email,
          role: role,
          email: session.user.email,
        });
        setEditName(userRole?.name || session.user.user_metadata?.name || session.user.email);
        // Fetch latest report URL
        const { data: reportRows, error: reportError } = await supabase
          .from('user_reports')
          .select('url')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })
          .limit(1);
        if (reportError) {
          setFetchError('Failed to fetch report.');
        }
        if (reportRows && reportRows.length > 0) {
          setReportUrl(reportRows[0].url);
        } else {
          setReportUrl(null);
        }
      }
      setLoading(false);
      setRefreshing(false);
    };
    fetchUserDetails();
  }, [navigate, refreshing]);

  const handleUpdateName = async () => {
    setUpdateError('');
    setUpdateSuccess('');
    if (!editName.trim()) {
      setUpdateError('Name cannot be empty.');
      return;
    }
    setLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) {
      setUpdateError('No user session found.');
      setLoading(false);
      return;
    }
    // Update name in user_roles table
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .update({ name: editName.trim() })
      .eq('user_id', session.user.id)
      .select();
    // Update name in Supabase Auth user_metadata
    const { data: metaData, error: metaError } = await supabase.auth.updateUser({
      data: { name: editName.trim() }
    });
    setLoading(false);
    if (roleError || metaError) {
      setUpdateError(`Failed to update name: ${roleError?.message || metaError?.message || 'Unknown error'}`);
    } else {
      setUserDetails(prev => ({ ...prev, name: editName.trim() }));
      setUpdateSuccess('Name updated successfully!');
      setEditing(false);
    }
  };

  return (
    <div style={{ fontFamily: 'Montserrat, Inter, Hedvig Letters Sans, sans-serif', fontWeight: 400 }}>
      {loading ? (
        <div className="flex items-center justify-center min-h-screen ml-0 lg:ml-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6c47ff] mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">Loading your dashboard...</p>
          </div>
        </div>
      ) : (
        <div className="min-h-screen bg-white text-[#1a0841] font-sans px-2 sm:px-4 py-4 sm:py-8 ml-0 lg:ml-16" style={{ fontFamily: 'Montserrat, Inter, Hedvig Letters Sans, sans-serif', fontWeight: 400 }}>
          <div className="max-w-4xl">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 md:mb-6">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight mb-2 md:mb-0" style={{ fontFamily: 'Montserrat, Inter, Hedvig Letters Sans, sans-serif', fontWeight: 400 }}>User Dashboard</h1>
            </div>
            <div className="mb-6 sm:mb-8">
              <div className="text-lg sm:text-xl md:text-2xl font-bold mb-1 flex items-center gap-2" style={{ fontFamily: 'Montserrat, Inter, Hedvig Letters Sans, sans-serif', fontWeight: 400 }}>
                {editing ? (
                  <>
                    <input
                      type="text"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="border border-gray-300 rounded px-2 py-1 text-sm sm:text-base focus:ring-2 focus:ring-[#6c47ff] focus:border-[#6c47ff] transition"
                      style={{ fontFamily: 'Montserrat, Inter, Hedvig Letters Sans, sans-serif', fontWeight: 400 }}
                    />
                    <button
                      className="bg-[#1a0841] text-white px-2 py-1 sm:px-3 sm:py-1 rounded font-bold hover:bg-[#6c47ff] transition-colors duration-150 shadow-md text-sm sm:text-base"
                      onClick={handleUpdateName}
                      style={{ fontFamily: 'Montserrat, Inter, Hedvig Letters Sans, sans-serif', fontWeight: 400 }}
                    >
                      Save
                    </button>
                    <button
                      className="ml-2 text-gray-500 hover:text-gray-800 text-sm sm:text-base"
                      onClick={() => { setEditing(false); setEditName(userDetails.name); }}
                      style={{ fontFamily: 'Montserrat, Inter, Hedvig Letters Sans, sans-serif', fontWeight: 400 }}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <span className="break-words">Name - {userDetails.name}</span>
                    <button
                      className="ml-2 bg-[#e60023] hover:bg-[#c2001a] text-white rounded-full p-1.5 sm:p-2 transition shadow-md flex items-center justify-center"
                      onClick={() => setEditing(true)}
                      aria-label="Edit Name"
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.536-6.536a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-2.828 0L9 13z" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
              {updateError && <div className="text-[#e60023] text-xs sm:text-sm mb-1 font-semibold bg-[#fff0f3] rounded px-2 py-1 border border-[#e60023]" style={{ fontFamily: 'Montserrat, Inter, Hedvig Letters Sans, sans-serif', fontWeight: 400 }}>{updateError}</div>}
              {updateSuccess && <div className="text-[#1a0841] text-xs sm:text-sm mb-1 font-semibold bg-[#e6e6fa] rounded px-2 py-1 border border-[#6c47ff]" style={{ fontFamily: 'Montserrat, Inter, Hedvig Letters Sans, sans-serif', fontWeight: 400 }}>{updateSuccess}</div>}
              <div className="text-sm sm:text-base font-medium text-gray-700 mb-1 break-words" style={{ fontFamily: 'Montserrat, Inter, Hedvig Letters Sans, sans-serif', fontWeight: 400 }}>Email - {userDetails.email}</div>
              <div className="text-sm sm:text-base font-semibold px-2 py-1 sm:px-3 sm:py-1 rounded bg-purple-100 text-purple-900 inline-block mb-2" style={{ fontFamily: 'Montserrat, Inter, Hedvig Letters Sans, sans-serif', fontWeight: 400 }}>Role - {userDetails.role}</div>
              {/* Removed Preview PDF, Download PDF, Refresh, and AI Advisor buttons as requested */}
              {fetchError && <div className="mt-2 text-red-600 font-semibold">{fetchError}</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserDashboard;
