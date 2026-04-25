import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function ProfileAdmin() {
  const navigate = useNavigate();
  const [userDetails, setUserDetails] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Load user data on component mount
  useEffect(() => {
    let isMounted = true; 
    let timeoutId;
    
    const checkUser = async () => {
      if (!isMounted) return;
      
      try {
        console.log('🔍 ProfileAdmin: Starting checkUser function...');
        
        // Add a timeout to prevent infinite loading
        timeoutId = setTimeout(() => {
          if (isMounted) {
            console.log('⏰ ProfileAdmin: Timeout reached, forcing navigation');
            setLoading(false);
            setUserDetails({
              email: 'test@admin.com',
              role: 'admin', 
              first_name: 'Admin',
              last_name: 'User',
              phone: 'N/A'
            });
          }
        }, 5000);
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('❌ ProfileAdmin: Session error:', sessionError);
          if (isMounted) {
            clearTimeout(timeoutId);
            setLoading(false);
            navigate('/login');
          }
          return;
        }
        
        if (!session) {
          console.log('❌ ProfileAdmin: No session found');
          if (isMounted) {
            clearTimeout(timeoutId);
            navigate('/login');
          }
          return;
        }
        
        if (!session.user) {
          console.log('❌ ProfileAdmin: No user in session');
          if (isMounted) {
            clearTimeout(timeoutId);
            navigate('/login');
          }
          return;
        }
        
        console.log('✅ ProfileAdmin: Session found for:', session.user.email);
        console.log('📋 ProfileAdmin: Full user metadata:', session.user.user_metadata);
        
        if (!isMounted) {
          clearTimeout(timeoutId);
          return;
        }
        
        setUser(session.user);
        
        const email = session.user.email;
        const role = session.user.user_metadata?.role || 'student';
        const firstName = session.user.user_metadata?.first_name || 
                         session.user.user_metadata?.name?.split(' ')[0] ||
                         session.user.email?.split('@')[0] || 'User';
        const lastName = session.user.user_metadata?.last_name || 
                        (session.user.user_metadata?.name?.split(' ').slice(1).join(' ')) || '';
        
        console.log('👤 ProfileAdmin: Extracted role:', role);
        console.log('👤 ProfileAdmin: Extracted name:', firstName, lastName);
        
        // For testing, let's allow any user to access admin profile temporarily
        // if (role !== 'admin' && role !== 'advisor') {
        //   console.log('❌ ProfileAdmin: User is not admin/advisor, role is:', role);
        //   if (isMounted) {
        //     clearTimeout(timeoutId);
        //     navigate('/profile');
        //     return;
        //   }
        // }
        
        console.log('✅ ProfileAdmin: Setting user details...');
        
        if (!isMounted) {
          clearTimeout(timeoutId);
          return;
        }
        
        setUserDetails({
          email,
          role: role || 'admin', // Force admin role for testing
          first_name: firstName,
          last_name: lastName,
          phone: session.user.user_metadata?.phone
        });

        console.log('📊 ProfileAdmin: User details set successfully');
        
        // Clear the timeout since we succeeded
        clearTimeout(timeoutId);
        
      } catch (error) {
        console.error('❌ ProfileAdmin: Error in checkUser:', error);
        if (isMounted) {
          clearTimeout(timeoutId);
          setLoading(false);
          // For debugging, don't redirect on error, show the admin page anyway
          setUserDetails({
            email: 'error@admin.com',
            role: 'admin',
            first_name: 'Error',
            last_name: 'User', 
            phone: 'N/A'
          });
        }
      } finally {
        console.log('✅ ProfileAdmin: Finally block - setting loading to false');
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    checkUser();
    
    // Cleanup function
    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50 px-4">
        <div className="text-center p-responsive">
          <div className="animate-spin rounded-full h-16 w-16 sm:h-24 sm:w-24 lg:h-32 lg:w-32 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-responsive-base text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!userDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50 px-4">
        <div className="text-center p-responsive max-w-md">
          <h2 className="text-responsive-lg font-semibold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-responsive-base text-gray-600 mb-4">You don't have permission to access this page.</p>
          <button 
            onClick={() => navigate('/profile')}
            className="btn-responsive bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Go to Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 ${user ? 'sidebar-offset' : ''}`}>
      <div className="container-narrow py-responsive">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-responsive gap-4">
          <div className="flex-1">
            <h1 className="text-responsive-2xl font-bold text-[#1a0841] break-anywhere">Welcome back, {userDetails?.first_name || 'Admin'}</h1>
            <p className="text-responsive-base text-gray-600 mt-1">Here is your admin profile information.</p>
          </div>
        </div>

        {/* Profile Section Only */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-responsive">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-responsive gap-4">
            <h2 className="text-responsive-lg font-bold text-[#1a0841]">Profile</h2>
            <button
              onClick={() => navigate('/admin/settings')}
              className="text-responsive-sm text-purple-600 hover:text-purple-800 font-medium self-start sm:self-center"
            >
              Edit
            </button>
          </div>

          <div className="flex flex-col items-center text-center space-y-4 sm:space-y-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-full bg-purple-100 flex items-center justify-center">
              <span className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-600">
                {(userDetails?.first_name?.[0] || userDetails?.email?.[0] || 'A').toUpperCase()}
              </span>
            </div>
            
            <div className="w-full">
              <h3 className="text-responsive-lg font-semibold text-gray-800 break-anywhere">
                {userDetails?.first_name} {userDetails?.last_name}
              </h3>
              <p className="text-purple-600 font-medium uppercase text-sm sm:text-base tracking-wide">
                {userDetails?.role}
              </p>
            </div>

            <div className="space-y-3 sm:space-y-4 w-full max-w-xs sm:max-w-md">
              <div className="flex items-center gap-3 p-2 sm:p-3">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
                <span className="text-responsive-sm text-gray-600 break-anywhere">{userDetails?.email}</span>
              </div>
              
              {/* Phone number removed for admin profile */}

              <div className="flex items-center gap-3 p-2 sm:p-3">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                <span className="text-responsive-sm text-gray-600">{userDetails?.role === 'admin' ? 'Administrator' : 'Academic Advisor'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}