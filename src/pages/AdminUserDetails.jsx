import React, { useState, useEffect, useMemo, useRef } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { ReportPDF, getPDFFileName } from './ReportPDF';
import { ApplicationFormPDF, getApplicationPDFFileName } from './ApplicationFormPDF';
import DocumentsList from '../components/DocumentsList';
import AdminDocumentUpload from '../components/AdminDocumentUpload';
import VerticalSidebar from '../components/ui/VerticalSidebar';
import { supabase } from '../supabaseClient';
import { getCountryFlag } from '../utils/countries';

// --- ICONS & LOADER ---
const User = ({ className = "w-6 h-6" }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const Search = ({ className = "w-5 h-5" }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const CheckCircle = ({ className = "w-4 h-4" }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
const Clock = ({ className = "w-4 h-4" }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const FileText = ({ className = "w-5 h-5" }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>;
const MessageSquare = ({ className = "w-6 h-6" }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
const Download = ({ className = "w-4 h-4" }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
const Eye = ({ className = "w-4 h-4" }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s4-8 10-8 10 8 10 8-4 8-10 8-10-8-10-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const X = ({ className = "w-6 h-6" }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const Rocket = ({ className = "w-6 h-6" }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5L2 22l-.5-2.5c0 0 3.24-1.5 4.5-3.75"/><path d="M10 20l-1.5-1.5"/><path d="M13 14l-1.5-1.5"/><path d="M7 17l-1.5-1.5"/><path d="M17 11.5l-1.5-1.5"/><path d="M19 19l-1.5-1.5"/><path d="M15 15l-1.5-1.5"/><path d="M12 4.5v15"/><path d="M17 5l-1.5-1.5"/><path d="M10 2l1.5 1.5"/><path d="M12 21l-.5 2.5c0 0-3.24 1.5-4.5 3.75"/></svg>;

const Loader = ({ message }) => (
  <div className="flex flex-col items-center justify-center p-4">
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#6c47ff]"></div>
    <p className="mt-2 text-sm text-gray-500">{message || 'Loading...'}</p>
  </div>
);
// --- END ICONS & LOADER ---

// Helper function for user initials
const getUserInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ').filter(n => n.length > 0);
    if (parts.length > 1) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
};

// Fetch reports directly from Supabase - handle RLS properly
const fetchAllReports = async () => {
  try {
    console.log('[Admin] Fetching all reports directly from Supabase...');
    
    // Check current user's role first
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      console.log('[Admin] No session found');
      return [];
    }
    
    console.log('[Admin] Current user:', session.user.id);
    
    // Check if current user is admin/advisor
    const { data: currentUserRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .single();
    
    if (roleError) {
      console.error('[Admin] Error checking user role:', roleError);
    } else {
      console.log('[Admin] Current user role:', currentUserRole?.role);
    }
    
    // Try to fetch all reports directly
    const { data: reports, error } = await supabase
      .from('user_reports')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('[Admin] Error fetching reports (likely RLS issue):', error);
      console.warn('[Admin] RLS policy might be preventing admin from viewing user reports');
      console.warn('[Admin] Solution: Update Supabase RLS policies to allow admin access');
      
      // For now, return empty array but log the issue
      return [];
    }
    
    console.log('[Admin] Successfully fetched all reports:', reports?.length || 0);
    return reports || [];
  } catch (err) {
    console.error('[Admin] Exception fetching reports:', err);
    return [];
  }
};

const fetchAllUserRoles = async () => {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('*');
    if (error) {
      console.error('Error fetching user roles:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('Exception fetching user roles:', err);
    return [];
  }
};

const fetchAllChats = async () => {
  try {
    const { data, error } = await supabase
      .from('chat_history')
      .select('*')
      .order('inserted_at', { ascending: false });
    if (error) {
      console.error('Error fetching chats:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('Exception fetching chats:', err);
    return [];
  }
};


export default function AdminUserDetails() {
    // Track search input focus
    const [searchActive, setSearchActive] = useState(false);
    const searchInputRef = useRef(null);
  const [allUsers, setAllUsers] = useState([]); // All users fetched
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [reports, setReports] = useState([]);
  const [trackers, setTrackers] = useState([]);
  const [chats, setChats] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState(null);
  // New state for chat management
  const [selectedUserChat, setSelectedUserChat] = useState(null);
  // Country filter state for admin
  const [selectedCountryFilter, setSelectedCountryFilter] = useState('all');
  // Modal preview state
  const [previewModal, setPreviewModal] = useState({ isOpen: false, report: null, formData: null });
    const [previewError, setPreviewError] = useState(null);
  
  // Collapsible sections state
  const [sectionStates, setSectionStates] = useState({
    profile: true,
    tracker: false,
    documents: false,
    adminDocuments: false,
    reports: false,
    chat: false
  });

  // Error boundary fallback
  if (usersError && usersError.includes('Failed')) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold text-red-600 mb-4">Error Loading Admin Data</h2>
        <p className="text-gray-600 mb-4">{usersError}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Reload Page
        </button>
      </div>
    );
  }

  // Load all data on mount
  useEffect(() => {
    console.log('[AdminUserDetails] Starting to load data...');
    
    // Check who is currently logged in (fundamental debug)
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('[AdminUserDetails] Current logged-in user:', session?.user?.id || 'No session');
      console.log('[AdminUserDetails] Current user metadata:', session?.user?.user_metadata || 'No metadata');
    });
    
    setUsersLoading(true);
    setUsersError(null);
    Promise.all([
      fetchAllReports(),
      fetchAllUserRoles(),
      fetchAllChats()
    ]).then(async ([allReports, allUserRoles, allChats]) => {
      console.log('[AdminUserDetails] Data loaded:', { 
        reportsCount: allReports?.length, 
        userRolesCount: allUserRoles?.length, 
        chatsCount: allChats?.length 
      });
      
      setReports(allReports);
      setTrackers(allUserRoles); // Use user_roles as trackers
      setChats(allChats);

      // Try to fetch auth users - this might fail due to RLS/permissions
      let authUserMap = {};
      try {
        console.log('[AdminUserDetails] Attempting auth.admin.listUsers...');
        const authUsersResult = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
        console.log('[AdminUserDetails] Auth users result:', authUsersResult);
        
        if (authUsersResult && authUsersResult.data && Array.isArray(authUsersResult.data.users)) {
          console.log('[AdminUserDetails] Processing auth users:', authUsersResult.data.users.length);
          authUsersResult.data.users.forEach(u => {
            if (u.id) {
              authUserMap[u.id] = u.user_metadata || {};
              if (u.email === 'romanoffwatson@gmail.com') {
                console.log('[AdminUserDetails] DEBUG Roma auth user:', u);
                console.log('[AdminUserDetails] DEBUG Roma user_metadata:', u.user_metadata);
              }
            }
          });
        } else if (authUsersResult && Array.isArray(authUsersResult.users)) {
          console.log('[AdminUserDetails] Processing auth users (fallback):', authUsersResult.users.length);
          authUsersResult.users.forEach(u => {
            if (u.id) {
              authUserMap[u.id] = u.user_metadata || {};
              if (u.email === 'romanoffwatson@gmail.com') {
                console.log('[AdminUserDetails] DEBUG Roma auth user (fallback):', u);
                console.log('[AdminUserDetails] DEBUG Roma user_metadata (fallback):', u.user_metadata);
              }
            }
          });
        } else {
          console.error('[AdminUserDetails] No auth users found or unexpected format:', authUsersResult);
        }
      } catch (authError) {
        console.error('[AdminUserDetails] Auth admin call failed:', authError);
        console.warn('[AdminUserDetails] Proceeding without user_metadata - this is likely due to RLS permissions');
      }

      const userMap = {};
      allUserRoles.forEach(role => {
        if (role.user_id && role.name) {
          const user_metadata = authUserMap[role.user_id] || {};
          
          // Debug logging for phone and WhatsApp fields (log for every user)
          console.log('[AdminUserDetails] DEBUG User phone/whatsapp mapping:', {
            user_id: role.user_id,
            name: role.name,
            email: role.email,
            role_phone: role.phone,
            role_phone_number: role.phone_number,
            role_phoneNumber: role.phoneNumber,
            role_whatsapp: role.whatsapp,
            role_whatsapp_number: role.whatsapp_number,
            role_whatsappNumber: role.whatsappNumber,
            metadata_phone: user_metadata.phone,
            metadata_phone_number: user_metadata.phone_number,
            metadata_phoneNumber: user_metadata.phoneNumber,
            metadata_whatsapp: user_metadata.whatsapp,
            metadata_whatsapp_number: user_metadata.whatsapp_number,
            metadata_whatsappNumber: user_metadata.whatsappNumber,
            full_metadata: user_metadata,
            full_role: role
          });

          // Ensure phone from user_metadata is always included
          let phoneValue = role.phone || role.phone_number || role.phoneNumber;
          if (!phoneValue && user_metadata.phone) phoneValue = user_metadata.phone;
          if (!phoneValue && user_metadata.phone_number) phoneValue = user_metadata.phone_number;
          if (!phoneValue && user_metadata.phoneNumber) phoneValue = user_metadata.phoneNumber;

          // Ensure WhatsApp from user_metadata is always included
          let whatsappValue = role.whatsapp || role.whatsapp_number || role.whatsappNumber;
          if (!whatsappValue && user_metadata.whatsapp) whatsappValue = user_metadata.whatsapp;
          if (!whatsappValue && user_metadata.whatsapp_number) whatsappValue = user_metadata.whatsapp_number;
          if (!whatsappValue && user_metadata.whatsappNumber) whatsappValue = user_metadata.whatsappNumber;

          userMap[role.user_id] = {
            user_id: role.user_id,
            name: role.name,
            email: role.email,
            documents: role.documents || [],
            role: role.role,
            target_countries: role.target_countries,
            application_report: role.application_report,
            phone: phoneValue || '',
            whatsapp: whatsappValue || '',
            gpa: role.gpa || user_metadata.gpa || '',
            language_score: role.language_score || user_metadata.language_score || '',
            budget: role.budget || user_metadata.budget || '',
            degree_level: role.degree_level || user_metadata.degree_level || '',
            languages: role.languages || user_metadata.languages || [],
            has_docs: role.has_docs || '',
            schooling_country: role.schooling_country || user_metadata.schooling_country || '',
            bachelor_country: role.bachelor_country || user_metadata.bachelor_country || '',
            master_country: role.master_country || user_metadata.master_country || '',
            last_login: role.last_login || '',
            registration_completed: role.registration_completed || false,
            profile_completion_status: role.profile_completion_status || '',
            documents_status: role.documents_status || {},
            application_metadata: role.application_metadata || {},
            user_metadata // keep full metadata for future use
          };
        }
      });

      // Add users from reports if not already in map
      allReports.forEach(r => {
        if (r.user_id && !userMap[r.user_id]) {
          userMap[r.user_id] = {
            user_id: r.user_id,
            name: r.file_name?.split('_')[1] || 'Unknown User',
            documents: []
          };
        }
      });

      // Add users from chats if not already in map
      allChats.forEach(c => {
        if (c.user_id && !userMap[c.user_id]) {
          userMap[c.user_id] = {
            user_id: c.user_id,
            name: 'Chat User',
            documents: []
          };
        }
      });

      // Filter out likely admin/advisor accounts
      const usersArr = Object.values(userMap).filter(u => {
        const n = (u.name || '').toLowerCase();
        const e = (u.email || '').toLowerCase();
        return n && !n.includes('admin') && !n.includes('advisor') && !e.includes('admin') && !e.includes('advisor');
      });
      setAllUsers(usersArr);
      setUsersLoading(false);
    }).catch((e) => {
      console.error('Error loading data:', e);
      setUsersError('Failed to load user data');
      setUsersLoading(false);
    });
  }, []);

  // Update filteredUsers to show only students/users (exclude admin/advisor if EITHER name OR email contains those terms)
  const filteredUsers = useMemo(() => {
    if (!searchTerm) return allUsers.filter(user => {
      const n = (user.name || '').toLowerCase();
      const e = (user.email || '').toLowerCase();
      // Exclude if either name or email contains admin/advisor
      return !((n.includes('admin') || n.includes('advisor') || e.includes('admin') || e.includes('advisor')));
    });
    const lowerCaseSearch = searchTerm.toLowerCase();
    return allUsers.filter(user => {
      const n = (user.name || '').toLowerCase();
      const e = (user.email || '').toLowerCase();
      return (
        (user.name?.toLowerCase().includes(lowerCaseSearch) || 
         user.email?.toLowerCase().includes(lowerCaseSearch) ||
         user.user_id.includes(lowerCaseSearch)) &&
        !((n.includes('admin') || n.includes('advisor') || e.includes('admin') || e.includes('advisor')))
      );
    });
  }, [allUsers, searchTerm]);

  // Debug: log all users and filtered users
  useEffect(() => {
    console.log('All users:', allUsers);
  }, [allUsers]);
  useEffect(() => {
    console.log('Filtered users:', filteredUsers);
  }, [filteredUsers]);

  // Get selected user's data and fetch their reports
  const [userReports, setUserReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  
  // Handle preview for different report types
  const handlePreview = async (report) => {
    setPreviewError(null);
    setPreviewModal({ isOpen: true, report, formData: null });
    if (report.report_type === 'application_form' && report.url.endsWith('.json')) {
      try {
        const response = await fetch(report.url);
        if (response.ok) {
          const formData = await response.json();
          setPreviewModal({ isOpen: true, report, formData });
        } else {
          setPreviewError('Failed to fetch form data: ' + response.status);
        }
      } catch (error) {
        setPreviewError('Error fetching form data: ' + error.message);
      }
    } else {
      // For PDF files and other formats, open directly
      window.open(report.url, '_blank');
    }
  };
  
  // Fetch reports for the selected user (same approach as user profile)
  useEffect(() => {
    if (!selectedUserId) {
      setUserReports([]);
      return;
    }
    const fetchUserReports = async () => {
      setLoadingReports(true);
      try {
        console.log('📊 [Admin] Fetching reports for user:', selectedUserId);
        
        // First check if user exists in user_roles table
        const { data: userRole, error: userRoleError } = await supabase
          .from('user_roles')
          .select('user_id, name, email')
          .eq('user_id', selectedUserId)
          .single();
        
        if (userRoleError) {
          console.log('⚠️ [Admin] User not found in user_roles:', userRoleError);
        } else {
          console.log('✅ [Admin] User exists in user_roles:', userRole);
        }
        
        // Fetch reports directly from Supabase
        console.log('🔍 [Admin] Attempting to fetch reports for user_id:', selectedUserId);
        
        // Check current admin user session
        const { data: { session } } = await supabase.auth.getSession();
        console.log('👤 [Admin] Current session user role:', session?.user?.user_metadata?.role);
        
        // Try different approaches based on admin privileges
        let queryResult;
        
        // Approach 1: Direct query with admin context
        console.log('🔍 [Admin] Trying direct query...');
        queryResult = await supabase
          .from('user_reports')
          .select('*')
          .eq('user_id', selectedUserId)
          .order('created_at', { ascending: false });
          
        console.log('📊 [Admin] Direct query result:', { 
          data: queryResult.data, 
          error: queryResult.error,
          dataLength: queryResult.data?.length,
          errorCode: queryResult.error?.code,
          errorMessage: queryResult.error?.message,
          errorDetails: queryResult.error?.details
        });
        
        // If direct query failed, try with generated_at ordering
        if (queryResult.error) {
          console.log('🔄 [Admin] Direct query failed, trying with generated_at ordering...');
          const altResult = await supabase
            .from('user_reports')
            .select('*')
            .eq('user_id', selectedUserId)
            .order('generated_at', { ascending: false });
            
          console.log('📊 [Admin] Alternative query result:', { 
            data: altResult.data, 
            error: altResult.error,
            dataLength: altResult.data?.length 
          });
          
          if (!altResult.error) {
            queryResult = altResult;
          }
        }
        
        // Final result processing
        if (queryResult.error) {
          console.error('❌ [Admin] All queries failed:', queryResult.error);
          console.warn('⚠️ [Admin] Possible causes:');
          console.warn('   1. RLS policy preventing admin from viewing user reports');
          console.warn('   2. Admin user lacks proper role assignment');
          console.warn('   3. user_reports table schema mismatch');
          console.warn('   4. No reports exist for this user yet');
          
          setUserReports([]);
        } else {
          console.log('✅ [Admin] Successfully fetched reports:', queryResult.data?.length || 0);
          console.log('📋 [Admin] Report details:', queryResult.data?.map(r => ({
            id: r.id,
            file_name: r.file_name,
            report_type: r.report_type,
            created_at: r.created_at,
            generated_at: r.generated_at
          })));
          setUserReports(queryResult.data || []);
        }
        console.log('📋 [Admin] Final reports data:', queryResult.data);
        
        // Also check if this user has reports in the global reports state
        const globalReports = reports.filter(r => r.user_id === selectedUserId);
        console.log('🌐 [Admin] Global reports for this user:', globalReports.length);
        if (globalReports.length !== (queryResult.data?.length || 0)) {
          console.warn('⚠️ [Admin] Mismatch between global and user-specific report counts');
        }
      } catch (err) {
        console.error('❌ [Admin] Exception in user reports fetch:', err);
        setUserReports([]);
      }
      setLoadingReports(false);
    };

    fetchUserReports();
  }, [selectedUserId, reports]); // Added reports dependency to compare with global state
  // --- All code below is outside useEffect ---
  const userTracker = trackers.find(t => t.user_id === selectedUserId);
  // Sort chats by an assumed timestamp or index to ensure chronological order
  const userChats = chats.filter(c => c.user_id === selectedUserId).sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
  const selectedUser = allUsers.find(u => u.user_id === selectedUserId);

  // Debug function to check current user's reports
  const checkCurrentUserReports = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      console.log('[DEBUG] Checking reports for current user:', session.user.id);
      const { data: currentUserReports, error } = await supabase
        .from('user_reports')
        .select('*')
        .eq('user_id', session.user.id);
      
      console.log('[DEBUG] Current user reports:', currentUserReports);
      if (error) console.error('[DEBUG] Error:', error);
      
      // Also check if current user exists in user_roles
      const { data: currentUserRole, error: roleError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();
      
      console.log('[DEBUG] Current user role:', currentUserRole);
      if (roleError) console.error('[DEBUG] Role error:', roleError);
    }
  };
  useEffect(() => {
    if (selectedUserId) {
      console.log('[AdminUserDetails] Selected User ID:', selectedUserId);
      console.log('[AdminUserDetails] User Reports for selected user:', userReports);
      console.log('[AdminUserDetails] Selected User:', selectedUser);
    }
  }, [selectedUserId, userReports, selectedUser]);

  // Set selectedUserChat when user changes or chats update
  useEffect(() => {
    if (!selectedUserId) {
      setSelectedUserChat(null);
      setSelectedCountryFilter('all');
      return;
    }
    // Only update selectedUserChat if selectedUserId changes
    setSelectedCountryFilter('all');
    const chatObj = chats.find(c => c.user_id === selectedUserId);
    setSelectedUserChat(chatObj || null);
  }, [selectedUserId]);

  // Keep selectedUserChat in sync with chats, but only update its messages if the chat exists
  useEffect(() => {
    if (!selectedUserChat) return;
    const updatedChat = chats.find(c => c.id === selectedUserChat.id);
    if (updatedChat) {
      // Only update if there are meaningful changes (messages, not just typing indicators)
      if (JSON.stringify(updatedChat.messages) !== JSON.stringify(selectedUserChat.messages) ||
          updatedChat.handover !== selectedUserChat.handover) {
        setSelectedUserChat(updatedChat);
      }
    }
  }, [chats, selectedUserChat]);


  // --- Helper components for rendering ---

  const ProfileCard = ({ user }) => (
    <div className="p-6 bg-white rounded-xl shadow-lg border-t-4 border-[#6c47ff] flex items-center gap-6 mb-8">
      <div className="w-16 h-16 bg-[#1a0841] text-white rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0">
        {getUserInitials(user?.name)}
      </div>
      <div>
        <h3 className="text-3xl font-bold text-[#1a0841]">{user?.name}</h3>
        <div className="text-gray-600 mt-1">
          <span className="font-semibold">Email:</span> {user?.email || 'N/A'}
        </div>
        <div className="text-gray-400 text-xs mt-1">
          <span className="font-semibold">ID:</span> {user?.user_id}
        </div>
      </div>
      
      {/* Application Form Preview Modal */}
      <ApplicationFormModal />
    </div>
  );

  const TrackerTimeline = ({ tracker }) => {
    const [activeStepId, setActiveStepId] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editingStepId, setEditingStepId] = useState(null);
    const [notes, setNotes] = useState('');
    const [loadingUpdate, setLoadingUpdate] = useState(false);

    // Complete country-separated step definitions - each country has its own full set
    const COUNTRY_COMPLETE_STEPS = {
      USA: [
        { id: 'usa-1', label: 'Profile Created (USA)', triggerType: 'Auto', status: 'done', dateCompleted: '2024-01-15', notes: 'Profile successfully created' },
        { id: 'usa-2', label: 'Documents Received (USA)', triggerType: 'Auto', status: 'done', dateCompleted: '2024-01-20', notes: 'All documents uploaded and verified' },
        { id: 'usa-3', label: 'Eligibility & AI Analysis (USA)', triggerType: 'Auto + Manual', status: 'in-progress', dateCompleted: null, notes: 'Analysis in progress' },
        { id: 'usa-4', label: 'University Selection (USA)', triggerType: 'Manual', status: 'not-started', dateCompleted: null, notes: '' },
        { id: 'usa-5', label: 'Application Submitted (USA)', triggerType: 'Manual', status: 'not-started', dateCompleted: null, notes: '' },
        { id: 'usa-6', label: 'Offer Letter / Decision (USA)', triggerType: 'Manual', status: 'not-started', dateCompleted: null, notes: '' },
        { id: 'usa-7', label: 'I-20 Issued by School (USA)', triggerType: 'Auto', status: 'not-started', dateCompleted: null, notes: '', uploadRequired: true },
        { id: 'usa-8', label: 'Scholarship / Financial Prep (USA)', triggerType: 'Auto', status: 'not-started', dateCompleted: null, notes: '' },
        { id: 'usa-9', label: 'Visa Process Started (USA)', triggerType: 'Manual', status: 'not-started', dateCompleted: null, notes: '' },
        { id: 'usa-10', label: 'SEVIS Fee Payment (USA)', triggerType: 'Manual', status: 'not-started', dateCompleted: null, notes: '', uploadRequired: true },
        { id: 'usa-11', label: 'Visa Interview Scheduled (USA)', triggerType: 'Manual', status: 'not-started', dateCompleted: null, notes: '' },
        { id: 'usa-12', label: 'Visa Approved / Ready to Travel (USA)', triggerType: 'Manual', status: 'not-started', dateCompleted: null, notes: '' }
      ],
      Canada: [
        { id: 'ca-1', label: 'Profile Created (Canada)', triggerType: 'Auto', status: 'done', dateCompleted: '2024-01-15', notes: 'Profile successfully created' },
        { id: 'ca-2', label: 'Documents Received (Canada)', triggerType: 'Auto', status: 'done', dateCompleted: '2024-01-20', notes: 'All documents uploaded and verified' },
        { id: 'ca-3', label: 'Eligibility & AI Analysis (Canada)', triggerType: 'Auto + Manual', status: 'in-progress', dateCompleted: null, notes: 'Analysis in progress' },
        { id: 'ca-4', label: 'University Selection (Canada)', triggerType: 'Manual', status: 'not-started', dateCompleted: null, notes: '' },
        { id: 'ca-5', label: 'Application Submitted (Canada)', triggerType: 'Manual', status: 'not-started', dateCompleted: null, notes: '' },
        { id: 'ca-6', label: 'Offer Letter / Decision (Canada)', triggerType: 'Manual', status: 'not-started', dateCompleted: null, notes: '' },
        { id: 'ca-7', label: 'LOA (Letter of Acceptance) (Canada)', triggerType: 'Auto', status: 'not-started', dateCompleted: null, notes: '', uploadRequired: true },
        { id: 'ca-8', label: 'Scholarship / Financial Prep (Canada)', triggerType: 'Auto', status: 'not-started', dateCompleted: null, notes: '' },
        { id: 'ca-9', label: 'Visa Process Started (Canada)', triggerType: 'Manual', status: 'not-started', dateCompleted: null, notes: '' },
        { id: 'ca-10', label: 'GIC Account / Proof of Funds Submitted (Canada)', triggerType: 'Manual', status: 'not-started', dateCompleted: null, notes: '', uploadRequired: true },
        { id: 'ca-11', label: 'Biometrics / Medical Exam Completed (Canada)', triggerType: 'Manual', status: 'not-started', dateCompleted: null, notes: '' },
        { id: 'ca-12', label: 'Visa Approved / Ready to Travel (Canada)', triggerType: 'Manual', status: 'not-started', dateCompleted: null, notes: '' }
      ],
      UK: [
        { id: 'uk-1', label: 'Profile Created (UK)', triggerType: 'Auto', status: 'done', dateCompleted: '2024-01-15', notes: 'Profile successfully created' },
        { id: 'uk-2', label: 'Documents Received (UK)', triggerType: 'Auto', status: 'done', dateCompleted: '2024-01-20', notes: 'All documents uploaded and verified' },
        { id: 'uk-3', label: 'Eligibility & AI Analysis (UK)', triggerType: 'Auto + Manual', status: 'in-progress', dateCompleted: null, notes: 'Analysis in progress' },
        { id: 'uk-4', label: 'University Selection (UK)', triggerType: 'Manual', status: 'not-started', dateCompleted: null, notes: '' },
        { id: 'uk-5', label: 'Application Submitted (UK)', triggerType: 'Manual', status: 'not-started', dateCompleted: null, notes: '' },
        { id: 'uk-6', label: 'Offer Letter / Decision (UK)', triggerType: 'Manual', status: 'not-started', dateCompleted: null, notes: '' },
        { id: 'uk-7', label: 'CAS Issued (UK)', triggerType: 'Auto', status: 'not-started', dateCompleted: null, notes: '', uploadRequired: true },
        { id: 'uk-8', label: 'Scholarship / Financial Prep (UK)', triggerType: 'Auto', status: 'not-started', dateCompleted: null, notes: '' },
        { id: 'uk-9', label: 'Visa Process Started (UK)', triggerType: 'Manual', status: 'not-started', dateCompleted: null, notes: '' },
        { id: 'uk-10', label: 'Visa Application Submitted (UK)', triggerType: 'Manual', status: 'not-started', dateCompleted: null, notes: '' },
        { id: 'uk-11', label: 'Visa Approved / Ready to Travel (UK)', triggerType: 'Manual', status: 'not-started', dateCompleted: null, notes: '' }
      ],
      France: [
        { id: 'fr-1', label: 'Profile Created (France)', triggerType: 'Auto', status: 'done', dateCompleted: '2024-01-15', notes: 'Profile successfully created' },
        { id: 'fr-2', label: 'Documents Received (France)', triggerType: 'Auto', status: 'done', dateCompleted: '2024-01-20', notes: 'All documents uploaded and verified' },
        { id: 'fr-3', label: 'Eligibility & AI Analysis (France)', triggerType: 'Auto + Manual', status: 'in-progress', dateCompleted: null, notes: 'Analysis in progress' },
        { id: 'fr-4', label: 'University Selection (France)', triggerType: 'Manual', status: 'not-started', dateCompleted: null, notes: '' },
        { id: 'fr-5', label: 'Application Submitted (France)', triggerType: 'Manual', status: 'not-started', dateCompleted: null, notes: '' },
        { id: 'fr-6', label: 'Campus France Application Submitted (France)', triggerType: 'Manual', status: 'not-started', dateCompleted: null, notes: '', uploadRequired: true },
        { id: 'fr-7', label: 'Offer Letter / Decision (France)', triggerType: 'Manual', status: 'not-started', dateCompleted: null, notes: '' },
        { id: 'fr-8', label: 'Scholarship / Financial Prep (France)', triggerType: 'Auto', status: 'not-started', dateCompleted: null, notes: '' },
        { id: 'fr-9', label: 'Visa Process Started (France)', triggerType: 'Manual', status: 'not-started', dateCompleted: null, notes: '' },
        { id: 'fr-10', label: 'Campus France Interview Completed (France)', triggerType: 'Manual', status: 'not-started', dateCompleted: null, notes: '' },
        { id: 'fr-11', label: 'Visa Appointment Scheduled (France)', triggerType: 'Manual', status: 'not-started', dateCompleted: null, notes: '' },
        { id: 'fr-12', label: 'Visa Approved / Ready to Travel (France)', triggerType: 'Manual', status: 'not-started', dateCompleted: null, notes: '' }
      ],
      Other: [
        { id: 'other-1', label: 'Profile Created (Other)', triggerType: 'Auto', status: 'done', dateCompleted: '2024-01-15', notes: 'Profile successfully created' },
        { id: 'other-2', label: 'Documents Received (Other)', triggerType: 'Auto', status: 'done', dateCompleted: '2024-01-20', notes: 'All documents uploaded and verified' },
        { id: 'other-3', label: 'Eligibility & AI Analysis (Other)', triggerType: 'Auto + Manual', status: 'in-progress', dateCompleted: null, notes: 'Analysis in progress' },
        { id: 'other-4', label: 'University Selection (Other)', triggerType: 'Manual', status: 'not-started', dateCompleted: null, notes: '' },
        { id: 'other-5', label: 'Application Submitted (Other)', triggerType: 'Manual', status: 'not-started', dateCompleted: null, notes: '' },
        { id: 'other-6', label: 'Offer Letter / Decision (Other)', triggerType: 'Manual', status: 'not-started', dateCompleted: null, notes: '' },
        { id: 'other-7', label: 'Documentation Review (Other)', triggerType: 'Manual', status: 'not-started', dateCompleted: null, notes: '', uploadRequired: true },
        { id: 'other-8', label: 'Scholarship / Financial Prep (Other)', triggerType: 'Auto', status: 'not-started', dateCompleted: null, notes: '' },
        { id: 'other-9', label: 'Visa Process Started (Other)', triggerType: 'Manual', status: 'not-started', dateCompleted: null, notes: '' },
        { id: 'other-10', label: 'Visa Application Review (Other)', triggerType: 'Manual', status: 'not-started', dateCompleted: null, notes: '' },
        { id: 'other-11', label: 'Visa Approved / Ready to Travel (Other)', triggerType: 'Manual', status: 'not-started', dateCompleted: null, notes: '' }
      ]
    };

    // Generate completely separated steps for each country
    const generateDynamicSteps = (countries) => {
      let allSteps = [];
      
      if (countries && countries.length > 0) {
        // Generate separate step sets for each target country
        countries.forEach(country => {
          if (COUNTRY_COMPLETE_STEPS[country]) {
            const countrySteps = COUNTRY_COMPLETE_STEPS[country].map(step => ({ ...step }));
            allSteps.push(...countrySteps);
          }
        });
      }
      
      return allSteps;
    };

    // Generate filtered steps based on admin's country filter selection
    const generateFilteredSteps = (countries, countryFilter) => {
      // Always generate steps for ALL user's target countries to preserve data
      const allSteps = generateDynamicSteps(countries);
      
      if (countryFilter === 'all') {
        return allSteps;
      } else {
        // Filter display to show only steps for the selected country
        return allSteps.filter(step => {
          // All steps now have country prefixes, so filter by country
          const isUSA = step.id.startsWith('usa-') && countryFilter === 'USA';
          const isCanada = step.id.startsWith('ca-') && countryFilter === 'Canada';  
          const isUK = step.id.startsWith('uk-') && countryFilter === 'UK';
          const isFrance = step.id.startsWith('fr-') && countryFilter === 'France';
          const isOther = step.id.startsWith('other-') && countryFilter === 'Other';
          return isUSA || isCanada || isUK || isFrance || isOther;
        });
      }
    };

    // Merge database tracker data with dynamic steps
    const [trackerSteps, setTrackerSteps] = useState([]);
    const [allTrackerSteps, setAllTrackerSteps] = useState([]); // Store ALL steps here

    useEffect(() => {
      if (tracker && selectedUser) {
        console.log('[Admin Tracker] Processing tracker data:', tracker);
        console.log('[Admin Tracker] Raw tracker.steps:', tracker.steps);
        
        // Use steps directly from database (all users now have all country steps)
        let allSteps = [];
        
        // Use actual tracker data from database
        if (tracker.steps && Array.isArray(tracker.steps) && tracker.steps.length > 0) {
          allSteps = tracker.steps.map(dbStep => ({
            id: dbStep.step_id,
            step_id: dbStep.step_id,
            label: dbStep.step_label || dbStep.label,
            status: dbStep.status || 'not-started',
            notes: dbStep.notes || '',
            dateCompleted: dbStep.status === 'done' && dbStep.updated_at ? 
              new Date(dbStep.updated_at).toISOString().split('T')[0] : 
              null,
            triggerType: dbStep.manual ? 'Manual' : 'Auto'
          }));
          console.log('[Admin Tracker] Mapped steps from database:', allSteps.length);
        } else {
          console.warn('[Admin Tracker] No steps found in tracker data - falling back to generated steps');
          // Fallback: generate steps for all countries if database has none
          const ALL_COUNTRIES = ['USA', 'Canada', 'UK', 'France', 'Other'];
          allSteps = generateDynamicSteps(ALL_COUNTRIES);
          console.log('[Admin Tracker] Generated fallback steps:', allSteps.length);
        }
        
        // Store ALL steps (preserve all country data)
        setAllTrackerSteps(allSteps);
        
        // Filter steps for display based on country filter
        const filteredSteps = selectedCountryFilter === 'all' ? 
          allSteps : 
          allSteps.filter(step => {
            // All steps now have country prefixes, so filter by country
            const isUSA = step.id && step.id.toString().startsWith('usa-') && selectedCountryFilter === 'USA';
            const isCanada = step.id && step.id.toString().startsWith('ca-') && selectedCountryFilter === 'Canada';  
            const isUK = step.id && step.id.toString().startsWith('uk-') && selectedCountryFilter === 'UK';
            const isFrance = step.id && step.id.toString().startsWith('fr-') && selectedCountryFilter === 'France';
            const isOther = step.id && step.id.toString().startsWith('other-') && selectedCountryFilter === 'Other';
            return isUSA || isCanada || isUK || isFrance || isOther;
          });
        
        setTrackerSteps(filteredSteps);
        console.log('[Admin Tracker] All steps:', allSteps.length, 'Filtered steps for', selectedCountryFilter, ':', filteredSteps.length);
        console.log('[Admin Tracker] Filtered step IDs:', filteredSteps.map(s => s.id));
      }
    }, [tracker, selectedUser, selectedCountryFilter]);

    // Function to refresh tracker data from server
    const refreshTrackerData = async () => {
      if (!selectedUser) return;
      
      try {
        console.log('[Admin Tracker] 🔄 Refreshing tracker data for user:', selectedUser.user_id);
        
        // Fetch fresh tracker data from server
        const response = await fetch(`https://elite-scholars-eight.vercel.app/api/tracker/${selectedUser.user_id}`);
        if (response.ok) {
          const freshTrackerData = await response.json();
          console.log('[Admin Tracker] 📥 FRESH DATA FROM SERVER:', {
            full_response: freshTrackerData,
            steps_count: freshTrackerData.steps?.length || 0,
            steps_detail: freshTrackerData.steps?.map(s => ({ 
              step_id: s.step_id, 
              step_label: s.step_label, 
              status: s.status,
              admin_updated: s.admin_updated 
            })) || []
          });
          
          // Update the tracker in the trackers list
          const oldTrackerData = trackers.find(t => t.user_id === selectedUser.user_id);
          console.log('[Admin Tracker] 🔄 UPDATING TRACKERS LIST:', {
            before: oldTrackerData ? { 
              steps_count: oldTrackerData.steps?.length || 0,
              steps: oldTrackerData.steps?.map(s => ({ step_id: s.step_id, status: s.status })) || []
            } : 'no_tracker_found',
            after: {
              steps_count: freshTrackerData.steps?.length || 0,
              steps: freshTrackerData.steps?.map(s => ({ step_id: s.step_id, status: s.status })) || []
            }
          });
          
          setTrackers(prevTrackers => 
            prevTrackers.map(t => 
              t.user_id === selectedUser.user_id 
                ? { ...t, ...freshTrackerData } 
                : t
            )
          );
          
          console.log('[Admin Tracker] ✅ Tracker data refreshed successfully');
        } else {
          console.error('[Admin Tracker] Failed to refresh tracker data - response not ok:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('[Admin Tracker] Error refreshing tracker:', error);
      }
    };

    // Admin update step function
    const handleStepUpdate = async (stepId, updates) => {
      if (!selectedUser) return;
      setLoadingUpdate(true);
      try {
        console.log('[Admin Tracker] 🚀 STARTING UPDATE:', { 
          stepId, 
          updates,
          selectedUser: selectedUser.user_id,
          currentTrackerSteps: trackerSteps.map(s => ({ id: s.id, status: s.status, label: s.label }))
        });
        // Update local state immediately for better UX
        setAllTrackerSteps(prevAllSteps => {
          return prevAllSteps.map(step => 
            (step.id === stepId || step.step_id === stepId)
              ? { 
                  ...step, 
                  ...updates,
                  dateCompleted: updates.status === 'done' ? 
                    new Date().toISOString().split('T')[0] : 
                    (updates.status === 'not-started' ? null : step.dateCompleted)
                }
              : step
          );
        });
        setTrackerSteps(prevSteps => {
          const updatedSteps = prevSteps.map(step => 
            (step.id === stepId || step.step_id === stepId)
              ? { 
                  ...step, 
                  ...updates,
                  dateCompleted: updates.status === 'done' ? 
                    new Date().toISOString().split('T')[0] : 
                    (updates.status === 'not-started' ? null : step.dateCompleted)
                }
              : step
          );
          console.log('[Admin Tracker] 🔄 LOCAL STATE UPDATE:', {
            stepId,
            updates,
            beforeUpdate: prevSteps.map(s => ({ id: s.id, status: s.status })),
            afterUpdate: updatedSteps.map(s => ({ id: s.id, status: s.status }))
          });
          return updatedSteps;
        });

        const requestBody = {
          user_id: selectedUser.user_id,
          step_id: stepId.toString(),
          updates: {
            ...updates,
            admin_updated: true,
            admin_updated_at: new Date().toISOString()
          }
        };
        console.log('[Admin Tracker] 📤 API REQUEST BODY:', requestBody);

        // Update in database via new tracker API
        const response = await fetch('https://elite-scholars-eight.vercel.app/api/tracker/admin-update-step', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          let errorMessage = `Server error: ${response.status}`;
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
            console.log('[Admin Tracker] 📤 API ERROR RESPONSE:', errorData);
          } catch (parseError) {
            console.error('[Admin Tracker] Failed to parse error response:', parseError);
            errorMessage = `Server error ${response.status}: ${response.statusText}`;
          }
          console.error('[Admin Tracker] Update failed:', errorMessage);
          throw new Error(errorMessage);
        }

        const result = await response.json();
        console.log('[Admin Tracker] 📥 API SUCCESS RESPONSE:', result);
        console.log('[Admin Tracker] ✅ Step update completed - using local state');

        // --- EMAIL NOTIFICATION LOGIC ---
        if (selectedUser?.email) {
          const emailPayload = {
            to: selectedUser.email,
            subject: `Your Application Tracker Was Updated`,
            text: `Hello ${selectedUser.name || ''},\n\nYour application tracker step "${updates.label || stepId}" was updated to status: ${updates.status}.\nNotes: ${updates.notes || ''}\n\nIf you have questions, please contact your advisor.`,
            stepId: stepId,
            status: updates.status,
            notes: updates.notes || '',
            user_id: selectedUser.user_id
          };
          console.log('[Admin Tracker] 📧 Sending tracker update email:', emailPayload);
          try {
            const emailRes = await fetch('https://elite-scholars-eight.vercel.app/api/send-tracker-update-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(emailPayload)
            });
            const emailResult = await emailRes.json();
            console.log('[Admin Tracker] 📧 Email API response:', emailResult);
          } catch (emailErr) {
            console.error('[Admin Tracker] Error sending tracker update email:', emailErr);
          }
        } else {
          console.warn('[Admin Tracker] No user email found, cannot send tracker update notification.');
        }
        // --- END EMAIL LOGIC ---

      } catch (error) {
        console.error('[Admin Tracker] Error updating step:', error);
      }
      setLoadingUpdate(false);
    };

    const getStatusIcon = (status) => {
      switch (status) {
        case 'done':
          return <CheckCircle className="w-4 h-4 text-white" />;
        case 'in-progress':
          return <Clock className="w-4 h-4 text-white" />;
        default:
          return <span className="w-4 h-4 rounded-full bg-white text-gray-600 text-xs font-bold flex items-center justify-center">•</span>;
      }
    };

    const getStatusColor = (status) => {
      switch (status) {
        case 'done': return 'bg-green-500';
        case 'in-progress': return 'bg-yellow-500'; 
        default: return 'bg-gray-400';
      }
    };

    const getTriggerTypeColor = (triggerType) => {
      switch (triggerType) {
        case 'Auto': return 'bg-blue-100 text-blue-800';
        case 'Manual': return 'bg-orange-100 text-orange-800';
        case 'Auto + Manual': return 'bg-purple-100 text-purple-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };

    const handleNotesUpdate = async () => {
      if (editingStepId) {
        await handleStepUpdate(editingStepId, { notes });
        setIsEditing(false);
        setEditingStepId(null);
        setNotes('');
      }
    };

    if (!tracker || trackerSteps.length === 0) {
      return (
        <div className="p-6 bg-white rounded-xl shadow border border-gray-100 mb-8">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-3 text-[#1a0841]">
            <Rocket className="w-6 h-6 text-[#6c47ff]" /> Application Tracker
          </h3>
          <div className="text-gray-500 italic">
            No tracker data available. User may need to complete registration or generate a report.
          </div>
        </div>
      );
    }

    return (
      <div className="p-4 sm:p-6 bg-white rounded-xl shadow border border-gray-100 mb-8 overflow-x-auto min-w-0 w-full max-w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold flex items-center gap-3 text-[#1a0841]">
            <Rocket className="w-6 h-6 text-[#6c47ff]" /> Application Tracker
            {tracker.country && (
              <span className="ml-3 text-sm font-normal bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                {tracker.country} Pathway
              </span>
            )}
          </h3>
          <div className="flex items-center gap-3">
            {/* Country Filter Dropdown */}
            {selectedUser && (
              <div className="flex items-center gap-2 min-w-0 w-full overflow-x-auto">
                <label className="text-sm font-medium text-gray-700">Filter by Country:</label>
                <select
                  value={selectedCountryFilter}
                  onChange={(e) => setSelectedCountryFilter(e.target.value)}
                  className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-[#6c47ff] focus:border-transparent w-full min-w-0"
                >
                  <option value="all">All Countries</option>
                  {Object.keys(COUNTRY_COMPLETE_STEPS).map(country => (
                    <option key={country} value={country}>
                      {getCountryFlag(country)} {country === 'USA' ? 'United States' : 
                       country === 'UK' ? 'United Kingdom' : country}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex items-center gap-2">
              {loadingUpdate && (
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-[#6c47ff]"></div>
              )}
              <button
                onClick={() => refreshTrackerData()}
                disabled={loadingUpdate}
                className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors disabled:opacity-50"
              >
                🔄 Refresh
              </button>
            </div>
          </div>
        </div>
        
        {/* Filter Status and Progress Summary */}
        <div className="mb-6 p-3 sm:p-4 bg-gray-50 rounded-lg overflow-x-auto min-w-0 w-full max-w-full">
          {/* Filter Status */}
          {selectedCountryFilter !== 'all' && (
            <div className="mb-3 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-md px-3 py-2">
              <span className="font-medium">Filtered View:</span> Showing steps for {selectedCountryFilter} only
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center min-w-0 w-full max-w-full">
            <div>
              <div className="text-2xl font-bold text-green-600">
                {trackerSteps.filter(step => step.status === 'done').length}
              </div>
              <div className="text-xs text-gray-600">Completed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">
                {trackerSteps.filter(step => step.status === 'in-progress').length}
              </div>
              <div className="text-xs text-gray-600">In Progress</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-600">
                {trackerSteps.filter(step => step.status === 'not-started').length}
              </div>
              <div className="text-xs text-gray-600">Not Started</div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Overall Progress</span>
              <span>
                {Math.round((trackerSteps.filter(step => step.status === 'done').length / trackerSteps.length) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-[#6c47ff] h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${(trackerSteps.filter(step => step.status === 'done').length / trackerSteps.length) * 100}%`
                }}
              ></div>
            </div>
          </div>
          
          {/* Data Sync Information */}
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="text-xs text-yellow-800">
              <strong>⚠️ Note:</strong> Changes made here are immediately saved to the database. 
              Users will need to refresh their Application Tracker page to see the updated status.
              {tracker.last_updated && (
                <div className="mt-1">
                  Last updated: {new Date(tracker.last_updated).toLocaleString()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Detailed Steps Timeline */}
        <div className="relative">
          {trackerSteps.map((step, idx) => (
            <div key={step.id} className="relative flex items-start pb-6">
              {/* Timeline Line */}
              {idx < trackerSteps.length - 1 && (
                <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-gray-200"></div>
              )}
              
              {/* Status Icon */}
              <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center ${getStatusColor(step.status)} mr-4 flex-shrink-0`}>
                {getStatusIcon(step.status)}
              </div>
              
              {/* Step Content */}
              <div className="flex-1 min-w-0">
                {/* Step Header */}
                <div className="mb-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-gray-900">{step.label}</h4>
                    <button
                      onClick={() => setActiveStepId(activeStepId === step.id ? null : step.id)}
                      className="text-sm text-[#6c47ff] hover:text-[#4d36b8] font-medium"
                    >
                      {activeStepId === step.id ? 'Hide Details' : 'Edit'}
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTriggerTypeColor(step.triggerType)}`}>
                      {step.triggerType}
                    </span>
                    <span className="text-sm text-gray-600">
                      {step.status === 'done' ? `Completed: ${step.dateCompleted}` : `Status: ${step.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}`}
                    </span>
                  </div>
                </div>
                
                {/* Expandable Details */}
                {activeStepId === step.id && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                    <div className="space-y-4">
                      
                      {/* Status Selector */}
                      <div className="flex items-center gap-4">
                        <label className="text-sm font-medium text-gray-700 w-20">Status:</label>
                        <select 
                          value={step.status} 
                          onChange={(e) => handleStepUpdate(step.id, { status: e.target.value })}
                          className="text-sm border border-gray-300 rounded-md px-3 py-1 bg-white shadow-sm focus:ring-2 focus:ring-[#6c47ff] focus:border-[#6c47ff]"
                          disabled={loadingUpdate}
                        >
                          <option value="not-started">Not Started</option>
                          <option value="in-progress">In Progress</option>
                          <option value="done">Completed</option>
                        </select>
                      </div>
                    
                      {/* Notes */}
                      <div className="flex items-start gap-4">
                        <label className="text-sm font-medium text-gray-700 w-20 pt-1">Notes:</label>
                        {isEditing && editingStepId === step.id ? (
                          <div className="flex-1">
                            <textarea 
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                              className="w-full text-sm border rounded-md px-3 py-2 border-gray-300 focus:ring-2 focus:ring-[#6c47ff] focus:border-[#6c47ff]"
                              rows="3"
                              placeholder="Add admin notes..."
                            />
                            <div className="flex gap-2 mt-2">
                              <button 
                                onClick={handleNotesUpdate}
                                className="text-sm bg-[#1a0841] text-white px-3 py-1 rounded-md hover:bg-[#6c47ff] transition-colors"
                                disabled={loadingUpdate}
                              >
                                Save
                              </button>
                              <button 
                                onClick={() => {
                                  setIsEditing(false);
                                  setEditingStepId(null);
                                  setNotes('');
                                }}
                                className="text-sm bg-gray-200 text-gray-700 px-3 py-1 rounded-md hover:bg-gray-300 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex-1 group">
                            <div className="text-sm text-gray-700 mb-2">
                              {step.notes || <span className="text-gray-500 italic">No notes added</span>}
                            </div>
                            <button 
                              onClick={() => {
                                setIsEditing(true);
                                setEditingStepId(step.id);
                                setNotes(step.notes || '');
                              }}
                              className="text-sm text-[#6c47ff] font-medium hover:underline"
                            >
                              Edit Notes
                            </button>
                          </div>
                        )}
                      </div>
                      
                      {/* Upload Section */}
                      {step.uploadRequired && (
                        <div className="flex items-center gap-4">
                          <label className="text-sm font-medium text-gray-700 w-20">Upload:</label>
                          <div className="text-sm text-gray-600">
                            Document upload required for this step
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const ReportsList = ({ reports, loading }) => {
    // Categorize reports by type
    const categorizedReports = {
      application_analysis: [],
      application_form: [],
      other: []
    };
    
    if (Array.isArray(reports)) {
      reports.forEach(report => {
        if (report && report.file_name && report.url) {
          const type = report.report_type || 'other';
          if (categorizedReports[type]) {
            categorizedReports[type].push(report);
          } else {
            categorizedReports.other.push(report);
          }
        }
      });
    }
    
    const getReportTypeInfo = (type) => {
      switch (type) {
        case 'application_analysis':
          return { 
            title: 'AI Analysis Reports', 
            icon: '', 
            color: 'bg-blue-100 text-blue-800',
            description: 'AI-generated eligibility and profile analysis'
          };
        case 'application_form':
          return { 
            title: 'Application Form Data', 
            icon: '', 
            color: 'bg-green-100 text-green-800',
            description: 'User-submitted application form data'
          };
        default:
          return { 
            title: 'Other Reports', 
            icon: '', 
            color: 'bg-gray-100 text-gray-800',
            description: 'Miscellaneous reports and documents'
          };
      }
    };

    // --- State to cache loaded form data for application_form reports ---
    const [formDataCache, setFormDataCache] = React.useState({});

    React.useEffect(() => {
      // For each application_form report, fetch JSON if not already cached
      categorizedReports.application_form.forEach((report) => {
        if (report.url && !formDataCache[report.url]) {
          fetch(report.url)
            .then((res) => res.json())
            .then((data) => {
              setFormDataCache((prev) => ({ ...prev, [report.url]: data }));
            })
            .catch(() => {});
        }
      });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reports]);

    return (
      <div className="p-6 bg-white rounded-xl shadow border border-gray-100 mb-8">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-3 text-[#1a0841]">
          Submitted Reports ({Array.isArray(reports) ? reports.length : 0})
        </h3>
        {loading ? (
          <div className="text-gray-500 italic flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-[#6c47ff]"></div>
            Loading reports...
          </div>
        ) : !Array.isArray(reports) || reports.length === 0 ? (
          <div className="text-gray-500 italic">
            {!Array.isArray(reports) ? 'Error loading reports.' : 'No reports found for this user.'}
            <div className="text-xs text-gray-400 mt-2">
              Make sure the user has generated reports and they are properly saved in the database.
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(categorizedReports).map(([type, typeReports]) => {
              if (typeReports.length === 0) return null;
              const typeInfo = getReportTypeInfo(type);
              return (
                <div key={type} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{typeInfo.icon}</span>
                      <div>
                        <h4 className="font-semibold text-gray-800">{typeInfo.title}</h4>
                        <p className="text-xs text-gray-600">{typeInfo.description}</p>
                      </div>
                      <span className={`ml-auto px-2 py-1 rounded-full text-xs font-medium ${typeInfo.color}`}>
                        {typeReports.length} {typeReports.length === 1 ? 'report' : 'reports'}
                      </span>
                    </div>
                  </div>
                  <ul className="divide-y divide-gray-100">
                    {typeReports.map((report, idx) => {
                      // Safely parse dates with fallbacks
                      const createdDate = report.created_at 
                        ? new Date(report.created_at).toLocaleDateString()
                        : 'Unknown date';
                      const generatedDate = report.generated_at 
                        ? new Date(report.generated_at).toLocaleDateString() 
                        : createdDate;
                      // For application_form, get formData from cache
                      const formData = type === 'application_form' ? formDataCache[report.url] : undefined;
                      return (
                        <li key={report.id || report.file_name + idx} className="p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <FileText className="w-5 h-5 text-gray-400" />
                              <div>
                                <div className="font-medium text-sm text-gray-900">{report.file_name}</div>
                                <div className="text-xs text-gray-500 mt-1">
                                  <span className="inline-flex items-center gap-1">
                                    <span>Generated: {generatedDate}</span>
                                    {report.user_id && (
                                      <span className="text-gray-300 ml-2">
                                        ID: {report.user_id.substring(0, 8)}...
                                      </span>
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {type === 'application_form' && formData ? (
                                <PDFDownloadLink
                                  document={<ApplicationFormPDF formData={formData} generatedAt={report.generated_at || new Date().toISOString()} />}
                                  fileName={getApplicationPDFFileName(formData)}
                                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors px-2 py-1 rounded-md hover:bg-blue-100"
                                >
                                  {({ loading }) => (
                                    <>
                                      <Download className="w-4 h-4" /> {loading ? 'Preparing PDF...' : 'Download'}
                                    </>
                                  )}
                                </PDFDownloadLink>
                              ) : (
                                <a href={report.url} target="_blank" rel="noopener noreferrer" 
                                   className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors px-2 py-1 rounded-md hover:bg-blue-100">
                                  <Download className="w-4 h-4" /> Download
                                </a>
                              )}
                              <button onClick={() => handlePreview(report)} 
                                      className="flex items-center gap-1 text-sm text-[#6c47ff] hover:text-[#4d36b8] font-medium transition-colors px-2 py-1 rounded-md hover:bg-[#efeafc]">
                                <Eye className="w-4 h-4" /> Preview
                              </button>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // Application Form Preview Modal
// --- Simple Markdown to HTML for bold, italics, and lists ---
function simpleMarkdownToHtml(md) {
  if (!md) return '';
  let html = md;
  // Bold **text** or __text__
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
  // Italic *text* or _text_
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.*?)_/g, '<em>$1</em>');
  // Unordered lists
  html = html.replace(/\n\s*[-*+] (.*?)(?=\n|$)/g, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/g, '<ul>$1</ul>');
  // Line breaks
  html = html.replace(/\n/g, '<br>');
  return html;
}

const ApplicationFormModal = () => {
    if (!previewModal.isOpen) return null;
    const { report, formData } = previewModal;
    const formatFieldName = (key) => {
      return key.replace(/([A-Z])/g, ' $1')
                .replace(/^./, str => str.toUpperCase())
                .replace(/_/g, ' ');
    };
    const formatValue = (value) => {
      if (typeof value === 'boolean') return value ? 'Yes' : 'No';
      if (Array.isArray(value)) return value.join(', ');
      if (value === '' || value === null || value === undefined) return 'Not provided';
      return String(value);
    };
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-bold text-[#1a0841]">Application Form Preview</h2>
              <p className="text-sm text-gray-600 mt-1">{report?.file_name}</p>
            </div>
            <button 
              onClick={() => setPreviewModal({ isOpen: false, report: null, formData: null })}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-6">
            {previewError && (
              <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
                <strong>Error:</strong> {previewError}
              </div>
            )}
            {!formData && !previewError && (
              <div className="flex flex-col items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#6c47ff] mb-2"></div>
                <span className="text-gray-500">Loading form data...</span>
              </div>
            )}
            {formData && !previewError && (
              <>
                {/* --- AI Analysis Section --- */}
                {formData.aiAnalysis && (
                  <div className="mb-8 p-4 bg-[#f6f6fa] border-l-4 border-[#6c47ff] rounded">
                    <h3 className="text-lg font-bold text-[#6c47ff] mb-2">AI Profile Analysis</h3>
                    <div
                      className="prose prose-sm max-w-none text-gray-900"
                      style={{ fontFamily: 'inherit' }}
                      dangerouslySetInnerHTML={{ __html: simpleMarkdownToHtml(formData.aiAnalysis) }}
                    />
                  </div>
                )}
                {/* All Form Data in a Single Balanced Two-Column Grid */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-[#1a0841] border-b border-gray-200 pb-2">Form Data</h3>
                  {(() => {
                    const keys = Object.keys(formData).filter(key => !['aiAnalysis', 'submittedAt'].includes(key));
                    const rows = [];
                    for (let i = 0; i < keys.length; i += 2) {
                      const key1 = keys[i];
                      const key2 = keys[i + 1];
                      rows.push(
                        <div key={key1 + (key2 || '')} className="flex flex-row gap-8 py-1">
                          <div className="flex-1 flex justify-between">
                            <span className="text-sm font-medium text-gray-700">{formatFieldName(key1)}:</span>
                            <span className="text-sm text-gray-900 ml-2">{formatValue(formData[key1])}</span>
                          </div>
                          {key2 && (
                            <div className="flex-1 flex justify-between">
                              <span className="text-sm font-medium text-gray-700">{formatFieldName(key2)}:</span>
                              <span className="text-sm text-gray-900 ml-2">{formatValue(formData[key2])}</span>
                            </div>
                          )}
                        </div>
                      );
                    }
                    return rows;
                  })()}
                </div>
                {/* Submission Info */}
                {formData.submittedAt && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-sm font-semibold text-gray-800 mb-2">Submission Information</h3>
                    <p className="text-sm text-gray-600">
                      Submitted on: {new Date(formData.submittedAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
          {/* Modal Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
            <button 
              onClick={() => setPreviewModal({ isOpen: false, report: null, formData: null })}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Close
            </button>
            {formData && (
              <PDFDownloadLink
                document={<ReportPDF report={{ form: formData, generated_at: new Date().toISOString() }} />}
                fileName={getPDFFileName({ form: formData })}
                className="px-4 py-2 bg-[#6c47ff] text-white rounded-md hover:bg-[#5a3fd4] transition-colors"
              >
                {({ loading }) => (loading ? 'Preparing PDF...' : 'Download PDF')}
              </PDFDownloadLink>
            )}
          </div>
        </div>
      </div>
    );
  };

  // --- Chat Management Panel (AdminAIChats style, embedded) ---
  function ChatManagementPanel({ chat, setChat, setChats }) {
    const [adminMsg, setAdminMsg] = useState("");
    const [handoverLoading, setHandoverLoading] = useState(false);
    const [userTyping, setUserTyping] = useState(false);
    const chatEndRef = React.useRef(null);
    let typingTimeout = React.useRef(null);
    // Track previous message count to only scroll on new message
    const prevMsgCount = React.useRef(0);

    // Scroll to bottom only when new message arrives
    useEffect(() => {
      if (!chat || !chat.messages) return;
      if (chat.messages.length !== prevMsgCount.current) {
        if (chatEndRef.current) {
          chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
        prevMsgCount.current = chat.messages.length;
      }
    }, [chat?.messages]);

    // Subscribe to live updates for this chat
    useEffect(() => {
      if (!chat) return;
      const subscription = supabase
        .channel('admin-chat-' + chat.id)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'chat_history',
            filter: 'id=eq.' + chat.id
          },
          payload => {
            // Only update messages if they actually changed
            if (payload?.new?.messages && JSON.stringify(payload.new.messages) !== JSON.stringify(chat.messages)) {
              setChat(prev => prev ? { ...prev, messages: payload.new.messages } : prev);
              setChats(prev => prev.map(c => c.id === chat.id ? { ...c, messages: payload.new.messages } : c));
            }
            // Update handover status if changed
            if (payload?.new?.handover !== undefined && payload.new.handover !== chat.handover) {
              setChat(prev => prev ? { ...prev, handover: payload.new.handover } : prev);
              setChats(prev => prev.map(c => c.id === chat.id ? { ...c, handover: payload.new.handover } : c));
            }
            // Update typing indicator locally without triggering parent re-renders
            setUserTyping(!!payload?.new?.user_typing);
          }
        )
        .subscribe();
      return () => {
        supabase.removeChannel(subscription);
      };
    }, [chat, setChat, setChats, setUserTyping]);

    // Handover/takeover logic
    const handleHandover = async (id, handover, e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      setHandoverLoading(true);
      await fetch("https://elite-scholars-eight.vercel.app/api/chats/handover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, handover })
      });
      // Don't update state directly - let the real-time subscription handle it
      setHandoverLoading(false);
    };

    // Admin reply logic
    const handleAdminReply = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!adminMsg.trim()) return;
      const updatedMessages = [...(chat.messages || []), { role: "admin", content: adminMsg }];
      await fetch("https://elite-scholars-eight.vercel.app/api/chats/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: chat.id, messages: updatedMessages })
      });
      // Don't update state directly - let the real-time subscription handle it
      // This prevents triggering the parent useEffect that causes dropdown to close
      setAdminMsg("");
    };

    // Typing indicator logic
    const handleTyping = async (e) => {
      setAdminMsg(e.target.value);
      
      // Only update typing indicator if we're not already typing
      if (!typingTimeout.current) {
        await supabase
          .from("chat_history")
          .update({ admin_typing: true })
          .eq("id", chat.id);
      }
      
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(async () => {
        await supabase
          .from("chat_history")
          .update({ admin_typing: false })
          .eq("id", chat.id);
        typingTimeout.current = null;
      }, 2000);
    };

    if (!chat) return <div className="text-gray-500 italic">No chat selected.</div>;

    return (
      <div 
        className="p-6 bg-white rounded-xl shadow border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold mb-4 flex items-center gap-3 text-[#1a0841]">
          <MessageSquare className="w-6 h-6 text-[#6c47ff]" /> Chat Management
        </h3>
        <div className="mb-2">User: {chat.user_name && chat.user_name !== 'null' ? `${chat.user_name} (${chat.user_id})` : `No name (${chat.user_id})`}</div>
        <div className="mb-1 text-sm">Handover: {chat.handover ? "Yes" : "No"}</div>
        <div className="mb-2 text-xs text-gray-600">Messages: {chat.messages?.length || 0}</div>
        <div className="flex-1 overflow-y-auto px-1 py-2 space-y-2 max-h-[45vh] mb-2">
          {chat.messages?.map((msg, i) => (
            <div key={i} className={`px-3 py-2 rounded-lg ${msg.role === "user" ? "bg-blue-100 text-blue-900" : "bg-gray-200 text-gray-800"}`}>
              <span>{msg.role}:</span> {msg.content}
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
        {chat.handover ? (
          <form className="flex gap-2 mt-2" onSubmit={handleAdminReply}>
            <input
              name="adminMsg"
              type="text"
              className="flex-1 px-3 py-2 rounded-lg border border-gray-300"
              placeholder="Type a message as admin..."
              autoComplete="off"
              value={adminMsg}
              onChange={handleTyping}
            />
            <button
              type="submit"
              className="bg-[#1a0841] text-white px-4 py-2 rounded-lg hover:bg-[#2c1a4e]"
              disabled={handoverLoading}
            >
              Send
            </button>
          </form>
        ) : (
          <button
            className="w-full bg-[#e60023] text-white px-4 py-2 rounded-full hover:bg-[#c2001a] mt-2"
            onClick={(e) => handleHandover(chat.id, true, e)}
            disabled={handoverLoading}
          >
            Take Over Chat
          </button>
        )}
        {chat.handover && (
          <button
            className="mt-2 bg-gray-300 text-[#1a0841] px-4 py-2 rounded-lg hover:bg-gray-400"
            onClick={(e) => handleHandover(chat.id, false, e)}
            disabled={handoverLoading}
          >
            Undo Takeover
          </button>
        )}
        {userTyping && (
          <div className="my-2 text-left">
            <span className="inline-block px-3 py-2 rounded-lg bg-blue-100 text-blue-900 border border-gray-300 opacity-70 animate-pulse">
              User is typing...
            </span>
          </div>
        )}
      </div>
    );
  };

// CollapsibleSection component - state managed by parent
const CollapsibleSection = ({ title, icon, children, isOpen, onToggle }) => {
  return (
    <div className="rounded-xl shadow bg-white border border-gray-100 mb-2 sm:mb-4">
      <button
        className="w-full flex items-center justify-between px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left focus:outline-none focus:ring-2 focus:ring-[#6c47ff] rounded-xl group"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-2 sm:gap-3 text-lg sm:text-xl font-bold text-[#1a0841]">
          {icon} {title}
        </span>
        <svg className={`w-4 h-4 sm:w-5 sm:h-5 ml-2 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
      </button>
      {isOpen && <div className="px-3 sm:px-4 lg:px-6 pb-3 sm:pb-4 lg:pb-6 w-full max-w-full min-w-0 overflow-x-auto">{children}</div>}
    </div>
  );
};

  return (
    <div style={{ fontFamily: 'Montserrat, Inter, Hedvig Letters Sans, sans-serif', fontWeight: 400 }}>
      <VerticalSidebar />
      <div className="min-h-screen bg-gray-50 text-[#1a0841] font-sans flex flex-col lg:flex-row antialiased ml-0 lg:ml-16">
        {/* User List Sidebar */}
        {/* User List Sidebar: always visible on md+, only visible when searching on mobile */}
        <div className="w-full lg:w-64 lg:min-w-64 border-b lg:border-r lg:border-b-0 border-gray-200 bg-white p-2 sm:p-4 flex flex-col overflow-y-auto shadow-xl shadow-gray-100/50 max-h-64 lg:max-h-none">
          <h2 className="text-lg sm:text-xl font-bold mb-2 sm:mb-4 text-[#1a0841]">All Students ({filteredUsers.length})</h2>
          <div className="relative mb-2 sm:mb-4">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search by name, email, or ID..."
              className="w-full px-2 sm:px-3 py-2 pl-8 sm:pl-10 pr-8 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#6c47ff] transition-all"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setSearchActive(true);
              }}
              onFocus={() => setSearchActive(true)}
              onBlur={() => setTimeout(() => setSearchActive(false), 100)}
            />
            <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}
          </div>
          {/* User list: always visible on md+, only visible when searching on mobile */}
          <div className="hidden md:block">
            {usersLoading ? <Loader message="Loading users..." /> : usersError ? <div className="text-red-600 text-sm">{usersError}</div> : (
              <ul className="space-y-2 flex-grow overflow-y-auto pr-1">
                {filteredUsers.map(user => (
                  <li key={user.user_id}>
                    <button
                      className={`w-full text-left px-2 sm:px-3 py-2 rounded-lg transition-all border ${(searchActive || searchTerm) && selectedUserId === user.user_id ? 'bg-[#6c47ff] text-white shadow-md border-[#4d36b8]' : 'bg-gray-50 text-[#1a0841] hover:bg-gray-200 border-transparent'}`}
                      onClick={() => {
                        setSelectedUserId(user.user_id);
                        setSearchTerm('');
                        setSearchActive(false);
                        setTimeout(() => searchInputRef.current && searchInputRef.current.blur(), 0);
                      }}
                    >
                      <div className="font-semibold truncate text-sm sm:text-base">{user.name}</div>
                      <div className={`text-xs truncate ${(searchActive || searchTerm) && selectedUserId === user.user_id ? 'text-white/80' : 'text-gray-500'}`}>{user.email || 'ID: ' + user.user_id.substring(0, 8) + '...'}</div>
                    </button>
                  </li>
                ))}
                {filteredUsers.length === 0 && <div className="text-center text-gray-500 pt-4">No users match your search.</div>}
              </ul>
            )}
          </div>
          <div className={`md:hidden ${searchActive || searchTerm ? '' : 'hidden'}`}>
            {usersLoading ? <Loader message="Loading users..." /> : usersError ? <div className="text-red-600 text-sm">{usersError}</div> : (
              <ul className="space-y-2 flex-grow overflow-y-auto pr-1">
                {filteredUsers.map(user => (
                  <li key={user.user_id}>
                    <button
                      className={`w-full text-left px-2 sm:px-3 py-2 rounded-lg transition-all border ${(searchActive || searchTerm) && selectedUserId === user.user_id ? 'bg-[#6c47ff] text-white shadow-md border-[#4d36b8]' : 'bg-gray-50 text-[#1a0841] hover:bg-gray-200 border-transparent'}`}
                      onClick={() => {
                        setSelectedUserId(user.user_id);
                        setSearchTerm('');
                        setSearchActive(false);
                        setTimeout(() => searchInputRef.current && searchInputRef.current.blur(), 0);
                      }}
                    >
                      <div className="font-semibold truncate text-sm sm:text-base">{user.name}</div>
                      <div className={`text-xs truncate ${(searchActive || searchTerm) && selectedUserId === user.user_id ? 'text-white/80' : 'text-gray-500'}`}>{user.email || 'ID: ' + user.user_id.substring(0, 8) + '...'}</div>
                    </button>
                  </li>
                ))}
                {filteredUsers.length === 0 && <div className="text-center text-gray-500 pt-4">No users match your search.</div>}
              </ul>
            )}
          </div>
        </div>
        {/* User Details Panel */}
        <div className="flex-1 px-2 sm:px-4 lg:px-8 py-2 sm:py-4 lg:py-8 overflow-y-auto w-full max-w-full min-w-0">
          {!selectedUserId && (
            <div className="flex flex-col items-center justify-center h-full text-center p-4 sm:p-8 lg:p-12 bg-white rounded-xl shadow-lg">
              <User className="w-12 sm:w-16 h-12 sm:h-16 text-[#6c47ff] mb-4" />
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-700">Student Dashboard</h2>
              <p className="text-sm sm:text-lg text-gray-500 mt-2">Select a student from the left sidebar to view their detailed application data, reports, and communication history.</p>
            </div>
          )}
          {selectedUserId && selectedUser && !((selectedUser.name || '').toLowerCase().includes('admin') || (selectedUser.name || '').toLowerCase().includes('advisor') || (selectedUser.email || '').toLowerCase().includes('admin') || (selectedUser.email || '').toLowerCase().includes('advisor')) && (
            <>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-4 sm:mb-6 lg:mb-8 text-[#1a0841]">Student Overview</h1>
              <CollapsibleSection 
                title="Profile" 
                icon={<User className="w-6 h-6 text-[#6c47ff]" />} 
                isOpen={sectionStates.profile}
                onToggle={() => setSectionStates(prev => ({ ...prev, profile: !prev.profile }))}
              >
                <div className="relative">
                  <ProfileCard user={selectedUser} />
                  <div className="mb-4">
                    <div className="space-y-3 relative z-10">
                      {/* Email */}
                      <div className="flex items-center p-3 bg-gray-50 rounded-xl border border-gray-100 w-full">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500">Email</p>
                          <p className="text-sm font-medium text-gray-900 break-all" title={selectedUser.email}>{selectedUser.email || '-'}</p>
                        </div>
                      </div>
                      {/* Phone */}
                      <div className="flex items-center p-3 bg-gray-50 rounded-xl border border-gray-100 w-full">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-3">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2zm0 4a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2zm4-4a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1H8a1 1 0 01-1-1v-2zm0 4a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1H8a1 1 0 01-1-1v-2zm4-4a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1h-2a1 1 0 01-1-1v-2zm0 4a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1h-2a1 1 0 01-1-1v-2zm4-4a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1h-2a1 1 0 01-1-1v-2zm0 4a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1h-2a1 1 0 01-1-1v-2z" /></svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500">Phone</p>
                          <p className="text-sm font-medium text-gray-900 break-all">{selectedUser.phone || '-'}</p>
                        </div>
                      </div>
                      {/* WhatsApp */}
                      <div className="flex items-center p-3 bg-gray-50 rounded-xl border border-gray-100 w-full">
                        <div className="w-8 h-8 rounded-full bg-green-200 flex items-center justify-center text-green-700 mr-3">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.72 11.06c-.13-.07-1.31-.65-1.51-.73-.2-.07-.34-.13-.48.13-.13.26-.51.73-.63.88-.12.13-.23.15-.43.05-.2-.09-.84-.31-1.6-.99-.59-.53-.99-1.18-1.11-1.38-.12-.2-.01-.3.09-.39.09-.09.2-.23.3-.35.1-.12.13-.2.2-.33.07-.13.03-.25-.01-.35-.05-.09-.48-1.16-.66-1.59-.17-.41-.34-.36-.48-.37-.12-.01-.26-.01-.4-.01-.13 0-.35.05-.53.25-.18.2-.7.68-.7 1.65 0 .97.71 1.91.81 2.05.1.13 1.4 2.14 3.39 2.92.47.2.84.32 1.13.41.47.15.9.13 1.24.08.38-.06 1.31-.54 1.5-1.07.19-.53.19-.98.13-1.07-.06-.09-.2-.14-.41-.25z" /></svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500">WhatsApp</p>
                          <p className="text-sm font-medium text-gray-900 break-all">{selectedUser.whatsapp || '-'}</p>
                        </div>
                      </div>
                      {/* Role */}
                      <div className="flex items-center p-3 bg-gray-50 rounded-xl border border-gray-100 w-full">
                        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 mr-3">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" /></svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500">Role</p>
                          <p className="text-sm font-medium text-gray-900 capitalize">{selectedUser.role || '-'}</p>
                        </div>
                      </div>
                      {/* GPA */}
                      <div className="flex items-center p-3 bg-gray-50 rounded-xl border border-gray-100 w-full">
                        <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 mr-3">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9h18" /></svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500">GPA</p>
                          <p className="text-sm font-medium text-gray-900 break-all">
                            {selectedUser.gpa || selectedUser?.application_report?.form?.gpa || '-'}
                          </p>
                        </div>
                      </div>
                      {/* Language Score */}
                      <div className="flex items-center p-3 bg-gray-50 rounded-xl border border-gray-100 w-full">
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 mr-3">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500">Language Score</p>
                          <p className="text-sm font-medium text-gray-900 break-all">
                            {selectedUser.language_score || selectedUser?.application_report?.form?.languageScore || '-'}
                          </p>
                        </div>
                      </div>
                      {/* Budget */}
                      <div className="flex items-center p-3 bg-gray-50 rounded-xl border border-gray-100 w-full">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-3">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" /></svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500">Budget</p>
                          <p className="text-sm font-medium text-gray-900 break-all">
                            {selectedUser.budget || selectedUser?.application_report?.form?.budget || '-'}
                          </p>
                        </div>
                      </div>
                      {/* Target Countries */}
                      <div className="flex items-center p-3 bg-gray-50 rounded-xl border border-gray-100 w-full">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2a10 10 0 100 20 10 10 0 000-20z" /></svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500">Target Countries</p>
                          <p className="text-sm font-medium text-gray-900 break-all flex gap-2 items-center">
                            {(() => {
                              const countries = selectedUser.target_countries || selectedUser?.application_report?.form?.country;
                              if (Array.isArray(countries) && countries.length > 0) {
                                return countries.map((c, i) => <span key={i}>{getCountryFlag(c)} {c}</span>);
                              } else if (typeof countries === 'string' && countries) {
                                return <span>{getCountryFlag(countries)} {countries}</span>;
                              } else {
                                return '-';
                              }
                            })()}
                          </p>
                        </div>
                      </div>
                      {/* Degree Level */}
                      <div className="flex items-center p-3 bg-gray-50 rounded-xl border border-gray-100 w-full">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mr-3">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9h18" /></svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500">Degree Level</p>
                          <p className="text-sm font-medium text-gray-900 break-all">
                            {selectedUser.degree_level || selectedUser?.application_report?.form?.degreeLevel || '-'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Eligible Universities Dropdown inside Profile section */}
                  {selectedUser?.application_report?.eligible && Array.isArray(selectedUser.application_report.eligible) && selectedUser.application_report.eligible.length > 0 && (
                    <div className="mt-2">
                      <details className="group">
                        <summary className="cursor-pointer text-base font-semibold text-[#1a0841] mb-2 flex items-center justify-between select-none">
                          Eligible Universities
                          <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-bold">{selectedUser.application_report.eligible.length}</span>
                          <svg className="w-4 h-4 ml-2 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </summary>
                        <div className="mt-2 max-h-56 overflow-y-auto space-y-2 border rounded-lg bg-white shadow-inner p-2">
                          {selectedUser.application_report.eligible.map((university, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 rounded-lg border bg-green-50 border-green-200">
                              <div className="flex items-center gap-3">
                                <span className="font-bold text-base text-[#1a0841] w-6">{idx + 1}.</span>
                                <div>
                                  <span className="font-semibold text-[#1a0841] block">{university.Name || university.name}</span>
                                  <span className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                    <span>{getCountryFlag(university.Country || university.country)}</span>
                                    {university.Country || university.country}
                                  </span>
                                </div>
                              </div>
                              {university.matchPercentage !== undefined && (
                                <span className="text-xl font-bold text-[#6c47ff]">{university.matchPercentage}%</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </details>
                    </div>
                  )}
                </div>
              </CollapsibleSection>
              <CollapsibleSection 
                title="Application Tracker" 
                icon={<Rocket className="w-6 h-6 text-[#6c47ff]" />} 
                isOpen={sectionStates.tracker}
                onToggle={() => setSectionStates(prev => ({ ...prev, tracker: !prev.tracker }))}
              >
                <TrackerTimeline tracker={userTracker} />
              </CollapsibleSection>
              <CollapsibleSection 
                title="User Documents (Registration & Upgrade)" 
                icon={<FileText className="w-6 h-6 text-[#6c47ff]" />} 
                isOpen={sectionStates.documents}
                onToggle={() => setSectionStates(prev => ({ ...prev, documents: !prev.documents }))}
              >
                <DocumentsList 
                  documents={selectedUser?.documents || {}} 
                  userId={selectedUserId} 
                  userEmail={selectedUser?.email} 
                  showOnlyRegistrationAndUpgrade={true}
                />
              </CollapsibleSection>
              <CollapsibleSection 
                title="Admin Document Upload" 
                icon={<FileText className="w-6 h-6 text-[#f39c12]" />} 
                isOpen={sectionStates.adminDocuments}
                onToggle={() => setSectionStates(prev => ({ ...prev, adminDocuments: !prev.adminDocuments }))}
              >
                <AdminDocumentUpload 
                  userId={selectedUserId} 
                  userName={selectedUser?.name || 'Unknown User'} 
                />
              </CollapsibleSection>
              <CollapsibleSection 
                title="Submitted Reports" 
                icon={<FileText className="w-6 h-6 text-[#6c47ff]" />} 
                isOpen={sectionStates.reports}
                onToggle={() => setSectionStates(prev => ({ ...prev, reports: !prev.reports }))}
              >
                <ReportsList reports={userReports} loading={loadingReports} />
              </CollapsibleSection>
              <CollapsibleSection 
                title="Chat Management" 
                icon={<MessageSquare className="w-6 h-6 text-[#6c47ff]" />} 
                isOpen={sectionStates.chat}
                onToggle={() => setSectionStates(prev => ({ ...prev, chat: !prev.chat }))}
              >
                <ChatManagementPanel
                  chat={selectedUserChat}
                  setChat={setSelectedUserChat}
                  setChats={setChats}
                />
              </CollapsibleSection>
            </>
          )}
        </div>
      </div>
      {/* Application Form Preview Modal rendered at root */}
      <ApplicationFormModal />
    </div>
  );
}
