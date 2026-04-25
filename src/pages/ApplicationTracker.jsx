import React, { useReducer, useEffect, useState } from 'react';
import { pdfjs } from 'react-pdf';
import { supabase } from '../supabaseClient';
import { getCountryFlag } from '../utils/countries';
import VerticalSidebar from '../components/ui/VerticalSidebar';
import ApplicationStatusStepper from '../components/ui/ApplicationStatusStepper';
import { 
  CheckCircle2, 
  Clock, 
  CircleDot, 
  Calendar, 
  Edit2, 
  UploadCloud, 
  Save, 
  X, 
  ChevronsUpDown,
  Info,
  ChevronDown,
  Check,
  User,
  FileText,
  Brain,
  School,
  Send,
  Mail,
  DollarSign,
  Plane,
  GraduationCap,
  FileCheck,
  MapPin,
  Award,
  Globe,
  BookOpen,
  Target
} from 'lucide-react';

// Base tracker steps with trigger types
const BASE_TRACKER_STEPS = [
  { id: 1, label: 'Profile Created', triggerType: 'Auto', notes: 'Profile successfully created' },
  { id: 2, label: 'Documents Received', triggerType: 'Auto', notes: 'All documents uploaded and verified' },
  { id: 3, label: 'Eligibility & AI Analysis', triggerType: 'Auto + Manual', notes: 'Analysis in progress' },
  { id: 4, label: 'University Selection', triggerType: 'Manual', notes: '' },
  { id: 5, label: 'Application Submitted', triggerType: 'Manual', notes: '' },
  { id: 6, label: 'Offer Letter / Decision', triggerType: 'Manual', notes: '' },
  { id: 7, label: 'Scholarship / Financial Prep', triggerType: 'Auto', notes: '' },
  { id: 8, label: 'Visa Process Started', triggerType: 'Manual', notes: '' },
  { id: 9, label: 'Visa Approved / Ready to Travel', triggerType: 'Manual', notes: '' }
];

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

// --- CONSTANTS & HELPERS ---
const API_URL = "https://elite-scholars-eight.vercel.app/api/analyze-application";

const initialTrackerState = {
  status: 'idle',
  report: null,
  history: [],
  error: null,
  selectedCountry: null,
  trackerSteps: BASE_TRACKER_STEPS
};

function trackerReducer(state, action) {
  switch (action.type) {
    case 'SET_COUNTRY':
      return { 
        ...state, 
        selectedCountry: action.payload,
        trackerSteps: action.trackerSteps || state.trackerSteps
      };
    case 'SET_TRACKER_STEPS':
      return {
        ...state,
        trackerSteps: action.payload
      };
    // Removed UPDATE_STEP_STATUS - users can only read data, not update
    case 'SUBMIT':
      return { ...state, status: 'loading', error: null };
    case 'SUCCESS':
      const newHistoryEntry = { form: action.payload.form, report: action.payload.report, timestamp: new Date().toISOString() };
      return { ...state, status: 'success', report: action.payload.report, history: [newHistoryEntry, ...state.history] };
    case 'ERROR':
      return { ...state, status: 'error', error: action.payload };
    case 'REGENERATE':
      return { ...initialTrackerState };
    default:
      throw new Error(`Unhandled action type: ${action.type}`);
  }
}

function getCurrentStep(trackerSteps) {
  if (!trackerSteps || trackerSteps.length === 0) return 0;
  
  // Find the first step that is not completed
  const currentStepIndex = trackerSteps.findIndex(step => step.status !== 'done');
  return currentStepIndex === -1 ? trackerSteps.length - 1 : currentStepIndex;
}

export default function ApplicationTracker() {
  const [trackerState, dispatch] = useReducer(trackerReducer, initialTrackerState);
  // State to manage which step is currently expanded
  const [activeStepId, setActiveStepId] = useState(null);
  const [isLoadingTracker, setIsLoadingTracker] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  // Add user country filtering state like admin
  const [selectedUserCountryFilter, setSelectedUserCountryFilter] = useState('');
  const [userTargetCountries, setUserTargetCountries] = useState([]);
  const [allUserSteps, setAllUserSteps] = useState([]);
  const [filteredUserSteps, setFilteredUserSteps] = useState([]);

  // Function to trigger a refresh
  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Load existing report and country selection on component mount
  useEffect(() => {
    const loadExistingData = async () => {
      setIsLoadingTracker(true);
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData?.user) {
          console.log("No user found or error:", userError);
          setIsLoadingTracker(false);
          return;
        }
        
        // Load profile first to get target countries and role
        const { data: profile, error: profileError } = await supabase
          .from('user_roles')
          .select('application_report, role, target_countries')
          .eq('user_id', userData.user.id)
          .single();
          
        // Check if user is admin
        setIsAdmin(profile?.role === 'admin' || profile?.role === 'advisor');
          
        if (profileError) {
          console.error('Error loading profile:', profileError);
        }

        // Load tracker data from database
        try {
          console.log('[User Tracker] 🔄 Loading tracker data from database...');
          const trackerResponse = await fetch(`https://elite-scholars-eight.vercel.app/api/tracker/${userData.user.id}?t=${Date.now()}`);
          if (trackerResponse.ok) {
            const trackerData = await trackerResponse.json();
            console.log('[User Tracker] 🚩 Raw API response:', trackerData);
            console.log('[User Tracker] 🔍 Loaded tracker data details:', {
              country: trackerData.country,
              stepsCount: trackerData.steps.length,
              stepDetails: trackerData.steps.map(s => ({
                step_id: s.step_id,
                step_label: s.step_label,
                status: s.status
              })),
              allStepIds: trackerData.steps.map(s => s.step_id)
            });
            
            // Get countries from tracker data or profile target_countries
            const countries = trackerData.countries || profile?.target_countries || ['USA'];
            
            if (trackerData.steps && trackerData.steps.length > 0) {
              // Use database data directly, just like admin does
              console.log('[User Tracker] ✅ Using database steps directly (like admin):', trackerData.steps.length);
              
              const databaseSteps = trackerData.steps.map(dbStep => {
                console.log('[User Tracker] 🔍 Processing DB step:', {
                  step_id: dbStep.step_id,
                  step_id_type: typeof dbStep.step_id,
                  step_label: dbStep.step_label,
                  status: dbStep.status,
                  status_type: typeof dbStep.status
                });
                
                return {
                  id: dbStep.step_id,
                  label: dbStep.step_label,
                  status: dbStep.status || 'not-started',
                  notes: dbStep.notes || '',
                  dateCompleted: dbStep.status === 'done' && dbStep.updated_at ? 
                    new Date(dbStep.updated_at).toISOString().split('T')[0] : null,
                  triggerType: dbStep.triggerType || 'Manual',
                  uploadRequired: dbStep.uploadRequired || false
                };
              });
              
              console.log('[User Tracker] ✅ Database steps processed:', databaseSteps.map(s => ({ id: s.id, status: s.status, label: s.label })));
              
              // Get user's target countries and store all their steps
              const userTargetCountries = profile?.target_countries || [];
              console.log('[User Tracker] 🌍 User target countries:', userTargetCountries);
              setUserTargetCountries(userTargetCountries);
              
              // Include ALL database steps so users can filter any country
              const userSteps = databaseSteps;
              
              console.log('[User Tracker] 🎯 All available steps (all countries):', userSteps.length, userSteps.map(s => s.id));
              
              // Store all user steps for filtering
              setAllUserSteps(userSteps);
              
              // Set initial filter to the first country that has steps, or 'usa' as fallback
              const availableCountries = [...new Set(userSteps.map(step => {
                const stepId = step.id.toString().toLowerCase();
                if (stepId.startsWith('usa-')) return 'usa';
                if (stepId.startsWith('ca-')) return 'canada';
                if (stepId.startsWith('uk-')) return 'uk';
                if (stepId.startsWith('fr-')) return 'france';
                if (stepId.startsWith('other-')) return 'other';
                return null;
              }).filter(Boolean))];
              
              console.log('[User Tracker] 🌍 Available countries with steps:', availableCountries);
              
              // Set initial country filter to the first available country
              const initialCountry = availableCountries.length > 0 ? availableCountries[0] : 'usa';
              setSelectedUserCountryFilter(initialCountry);
              
              // Initial filter - show steps for the detected country
              setFilteredUserSteps(userSteps);
              
              // Update reducer state with all steps (for backward compatibility)
              dispatch({ type: 'SET_TRACKER_STEPS', payload: userSteps });
              // Set countries separately
              dispatch({ type: 'SET_COUNTRY', payload: countries });
              
              // Set active step after loading data
              const currentStepIndex = userSteps.findIndex(step => step.status !== 'done');
              const activeIndex = currentStepIndex === -1 ? userSteps.length - 1 : currentStepIndex;
              if (userSteps[activeIndex]) {
                setActiveStepId(userSteps[activeIndex].id);
              }
            } else {
              // No database data, use empty state
              console.log('[User Tracker] ⚠️ No database data found');
              dispatch({ type: 'SET_COUNTRY', payload: countries });
              dispatch({ type: 'SET_TRACKER_STEPS', payload: [] });
            }
          } else {
            // API call failed, use empty state
            console.log('[User Tracker] ⚠️ API call failed');
            const countries = profile?.target_countries || ['USA'];
            dispatch({ type: 'SET_COUNTRY', payload: countries });
            dispatch({ type: 'SET_TRACKER_STEPS', payload: [] });
          }
        } catch (trackerError) {
          console.error('[User Tracker] Error loading tracker:', trackerError);
          // Fallback to empty state
          const countries = profile?.target_countries || ['USA'];
          dispatch({ type: 'SET_COUNTRY', payload: countries });
          dispatch({ type: 'SET_TRACKER_STEPS', payload: [] });
        }

        // Load existing report if available
        if (profile?.application_report) {
          console.log('Found existing application report, loading...');
          dispatch({ 
            type: 'SUCCESS', 
            payload: { 
              report: profile.application_report,
              form: null // No form data on initial load
            } 
          });
        }
      } catch (err) {
        console.error('Error loading existing data:', err);
      } finally {
        setIsLoadingTracker(false);
      }
    };
    
    loadExistingData();
  }, [refreshTrigger]);

  // Handle user country filtering (similar to admin)
  useEffect(() => {
    console.log('[FILTER] 🔍 Filter effect triggered:', {
      selectedUserCountryFilter,
      allUserStepsCount: allUserSteps.length,
      allUserStepsPreview: allUserSteps.slice(0, 3).map(s => ({ id: s.id, label: s.label }))
    });
    
    // Always show all steps if 'all' is selected, otherwise filter by country prefix
    if (allUserSteps.length > 0) {
      let filtered = allUserSteps;
      if (selectedUserCountryFilter && selectedUserCountryFilter !== 'all') {
        // Handle different country prefixes
        let prefix;
        if (selectedUserCountryFilter.toLowerCase() === 'usa') {
          prefix = 'usa';
        } else if (selectedUserCountryFilter.toLowerCase() === 'canada') {
          prefix = 'ca';
        } else if (selectedUserCountryFilter.toLowerCase() === 'uk') {
          prefix = 'uk';
        } else if (selectedUserCountryFilter.toLowerCase() === 'france') {
          prefix = 'fr';
        } else if (selectedUserCountryFilter.toLowerCase() === 'other') {
          prefix = 'other';
        } else {
          // Fallback: use first 2 characters
          prefix = selectedUserCountryFilter.toLowerCase().slice(0, 2);
        }
        
        console.log('[FILTER] 🎯 Filtering steps:', {
          selectedCountry: selectedUserCountryFilter,
          prefix: prefix,
          searchPattern: prefix + '-'
        });
        
        filtered = allUserSteps.filter(step => step.id && step.id.toString().toLowerCase().startsWith(prefix + '-'));
        
        console.log('[FILTER] ✅ Filter results:', {
          originalCount: allUserSteps.length,
          filteredCount: filtered.length,
          filteredSteps: filtered.map(s => ({ id: s.id, label: s.label }))
        });
      }
      setFilteredUserSteps(filtered);
      dispatch({ type: 'SET_TRACKER_STEPS', payload: filtered });
    } else {
      console.log('[FILTER] ⚠️ No allUserSteps available for filtering');
      setFilteredUserSteps([]);
      dispatch({ type: 'SET_TRACKER_STEPS', payload: [] });
    }
  }, [selectedUserCountryFilter, allUserSteps]);

  // Update activeStepId when trackerSteps change
  useEffect(() => {
     const currentStepIndex = trackerState.trackerSteps.findIndex(step => step.status !== 'done');
     const activeIndex = currentStepIndex === -1 ? trackerState.trackerSteps.length - 1 : currentStepIndex;
     // Only set active step if it's not already set or if the steps array has changed
     if (!activeStepId || !trackerState.trackerSteps.find(s => s.id === activeStepId)) {
        if(trackerState.trackerSteps[activeIndex]) {
          setActiveStepId(trackerState.trackerSteps[activeIndex].id);
        }
     }
  }, [trackerState.trackerSteps, activeStepId]);

  // Removed handleStepUpdate - users can only read data, not write

  const handleRegenerate = () => {
    dispatch({ type: 'REGENERATE' });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 lg:ml-16">
      {/* Page Header */}
      <div className="bg-white border-b border-slate-200 px-5 sm:px-8 py-5">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Application Tracker</h1>
        <p className="text-slate-500 text-sm mt-0.5">Monitor every step of your global education journey.</p>
      </div>

      {isLoadingTracker ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-2 border-slate-200 border-t-brand-600 rounded-full animate-spin mx-auto" />
            <p className="text-slate-500 text-sm">Loading your tracker…</p>
          </div>
        </div>
      ) : (
        <div className="px-5 sm:px-8 py-6 w-full">
          <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6 w-full">
            {/* Left: Country & Progress */}
            <div className="lg:col-span-1 space-y-4">
              <div className="card p-5">
                <h3 className="text-sm font-bold text-slate-900 mb-3">Destination Country</h3>
                <select
                  value={selectedUserCountryFilter}
                  onChange={(e) => setSelectedUserCountryFilter(e.target.value)}
                  className="input"
                >
                  {['USA', 'Canada', 'UK', 'France', 'Other'].map(country => (
                    <option key={country} value={country.toLowerCase()}>
                      {getCountryFlag(country)} {country === 'USA' ? 'United States' : country === 'UK' ? 'United Kingdom' : country}
                    </option>
                  ))}
                </select>
              </div>

              {/* Progress Card */}
              <div className="card p-5">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Progress Summary</h4>
                {/* Stat pills */}
                <div className="grid grid-cols-3 gap-2 mb-5">
                  <div className="bg-brand-50 rounded-xl p-3 text-center">
                    <p className="text-xl font-bold text-brand-600">{filteredUserSteps.filter(s => s.status === 'done').length}</p>
                    <p className="text-[10px] text-brand-500 font-medium mt-0.5">Done</p>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-3 text-center">
                    <p className="text-xl font-bold text-amber-600">{filteredUserSteps.filter(s => s.status === 'in-progress').length}</p>
                    <p className="text-[10px] text-amber-500 font-medium mt-0.5">Active</p>
                  </div>
                  <div className="bg-slate-100 rounded-xl p-3 text-center">
                    <p className="text-xl font-bold text-slate-500">{filteredUserSteps.filter(s => s.status !== 'done' && s.status !== 'in-progress').length}</p>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">Pending</p>
                  </div>
                </div>
                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="font-medium text-slate-600">Overall Progress</span>
                    <span className="font-bold text-brand-600">
                      {filteredUserSteps.length > 0 ? Math.round((filteredUserSteps.filter(s => s.status === 'done').length / filteredUserSteps.length) * 100) : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3">
                    <div className="bg-gradient-to-r from-brand-500 to-violet-500 h-3 rounded-full transition-all duration-700"
                      style={{ width: `${filteredUserSteps.length > 0 ? (filteredUserSteps.filter(s => s.status === 'done').length / filteredUserSteps.length) * 100 : 0}%` }} />
                  </div>
                  <p className="text-xs text-slate-400 mt-2">{filteredUserSteps.length} total steps</p>
                </div>
              </div>
            </div>

            {/* Right: Steps */}
            <div className="card w-full lg:col-span-2 p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5 pb-4 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">Application Progress</h3>
                <span className="badge badge-brand">
                  {selectedUserCountryFilter ? `${selectedUserCountryFilter.toUpperCase()} Pathway` : 'All Countries'}
                </span>
              </div>
              <div className="bg-brand-50 border border-brand-100 rounded-xl px-4 py-3 mb-5">
                <p className="text-xs text-brand-700 font-medium">Your progress is tracked automatically and updated by your advisor.</p>
              </div>
              <div className="max-h-[600px] overflow-y-auto pr-1">
                <div className="relative flex flex-col">
                  {filteredUserSteps.map((step, index) => (
                    <VerticalStepNode
                      key={step.id}
                      step={step}
                      stepNumber={index + 1}
                      isActive={activeStepId === step.id}
                      onToggle={() => setActiveStepId(activeStepId === step.id ? null : step.id)}
                      isLastStep={index === filteredUserSteps.length - 1}
                      isAdmin={isAdmin}
                      handleRefresh={handleRefresh}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- VerticalStepNode Component ---
// This component functions as a node in a vertical timeline.
const VerticalStepNode = ({ step, stepNumber, isActive, onToggle, isLastStep, isAdmin, handleRefresh }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [notes, setNotes] = useState(step.notes || '');

  const getStatusText = (status) => {
    // Use exact same status formatting logic as admin for consistency
    console.log(`[User Tracker] 🎯 getStatusText called with status: "${status}" (type: ${typeof status})`);
    if (!status) return 'Not Started'; // Handle undefined/null/empty status
    if (status === 'done') return 'Completed';
    return status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getStatusIcon = (status) => {
    if (status === 'done') {
      return <Check className="w-5 h-5" />;
    }
    if (status === 'in-progress') {
      return <Clock className="w-5 h-5" />; 
    }
    
    // For pending/other statuses, show icon based on step number
    switch (stepNumber) {
      case 1:
        return <User className="w-4 h-4" />;
      case 2:
        return <FileText className="w-4 h-4" />;
      case 3:
        return <Brain className="w-4 h-4" />;
      case 4:
        return <School className="w-4 h-4" />;
      case 5:
        return <Send className="w-4 h-4" />;
      case 6:
        return <Mail className="w-4 h-4" />;
      case 7:
        return <DollarSign className="w-4 h-4" />;
      case 8:
        return <FileCheck className="w-4 h-4" />;
      case 9:
        return <Plane className="w-4 h-4" />;
      case 10:
        return <GraduationCap className="w-4 h-4" />;
      case 11:
        return <Award className="w-4 h-4" />;
      case 12:
        return <Globe className="w-4 h-4" />;
      case 13:
        return <BookOpen className="w-4 h-4" />;
      case 14:
        return <MapPin className="w-4 h-4" />;
      case 15:
        return <Target className="w-4 h-4" />;
      default:
        return <CircleDot className="w-4 h-4" />;
    }
  };

  const getStatusRingColor = (status) => {
    switch (status) {
      case 'done':        return 'bg-brand-600 shadow-xs';
      case 'in-progress': return 'bg-slate-800 shadow-xs';
      default:            return 'bg-slate-300';
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!isAdmin) {
      console.log('[User Tracker] ⚠️ Status changes disabled for users');
      return;
    }
    
    // Admin can update status
    try {
      const { data: userData } = await supabase.auth.getUser();
      const response = await fetch('https://elite-scholars-eight.vercel.app/api/tracker/update-step', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userData.user.id,
          step_id: step.id,
          updates: { status: newStatus }
        })
      });
      
      if (response.ok) {
        handleRefresh(); // Refresh the tracker data
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleNotesUpdate = async () => {
    if (!isAdmin) {
      console.log('[User Tracker] ⚠️ Notes editing disabled for users');
      setIsEditing(false);
      return;
    }
    
    // Admin can update notes
    try {
      const { data: userData } = await supabase.auth.getUser();
      const response = await fetch('https://elite-scholars-eight.vercel.app/api/tracker/update-step', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userData.user.id,
          step_id: step.id,
          updates: { notes: notes }
        })
      });
      
      if (response.ok) {
        setIsEditing(false);
        handleRefresh(); // Refresh the tracker data
      }
    } catch (error) {
      console.error('Error updating notes:', error);
    }
  };

  // Reset notes field when toggling edit state
  useEffect(() => {
    setNotes(step.notes || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing, step.notes]);

  return (
    <div className="relative pl-10 pb-5">
      {/* Gutter */}
      <div className="absolute left-3 top-0 -translate-x-1/2 flex flex-col items-center h-full">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white z-10 flex-shrink-0 shadow-xs ${getStatusRingColor(step.status)}`}>
          <div className="text-sm">{getStatusIcon(step.status)}</div>
        </div>
        {!isLastStep && <div className="w-px flex-1 bg-slate-200 mt-1" />}
      </div>

      {/* Content */}
      <div className="flex-1 relative -top-0.5">
        <button
          onClick={onToggle}
          className="w-full text-left rounded-xl p-3 hover:bg-white transition-all duration-150 border border-slate-200 bg-white/60 shadow-xs hover:shadow-card"
          aria-expanded={isActive}
          aria-controls={`step-content-${step.id}`}
        >
          <div className="flex justify-between items-center">
            <div className="flex-1 min-w-0 pr-2">
              <h4 className="font-semibold text-sm text-slate-900 truncate">{step.label}</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                {step.status === 'done' ? `Completed: ${step.dateCompleted}` : `Status: ${getStatusText(step.status)}`}
              </p>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform flex-shrink-0 ${isActive ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {isActive && (
          <div
            id={`step-content-${step.id}`}
            className="mt-2 p-4 bg-white rounded-xl border border-slate-200 shadow-xs animate-fade-in"
          >
            <div className="space-y-3 sm:space-y-4">
              
              {/* Step Status Info */}
               <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
                <span className="text-xs sm:text-sm text-gray-600 font-medium sm:w-16 lg:w-20 flex items-center gap-2 flex-shrink-0">
                  <Info className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
                  <span className="sm:hidden">Info:</span>
                  <span className="hidden sm:inline">Info:</span>
                </span>
                <span className="badge badge-brand text-[10px]">
                  {step.status === 'done' ? 'Completed by admin' : 'Pending admin action'}
                </span>
              </div>
              
              {/* Status Display (Read-only) */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <label className="text-xs sm:text-sm text-gray-600 font-medium sm:w-16 lg:w-20 flex-shrink-0">Status:</label>
                <div className="relative">
                  <div className="text-xs font-medium border border-slate-200 rounded-lg px-3 py-1.5 bg-slate-50 min-w-32 cursor-not-allowed opacity-75">
                    {getStatusText(step.status)}
                  </div>
                  <span className="text-xs text-gray-500 ml-2">{isAdmin ? 'Admin can edit' : 'Only admins can update status'}</span>
                </div>
              </div>
            
              {/* Date Completed */}
              {step.dateCompleted && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <span className="text-xs sm:text-sm text-gray-600 font-medium sm:w-16 lg:w-20 flex items-center gap-2 flex-shrink-0">
                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
                    Date:
                  </span>
                  <span className="text-xs sm:text-sm font-medium">{step.dateCompleted}</span>
                </div>
              )}
            
              {/* Notes */}
              <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
                <span className="text-xs sm:text-sm text-gray-600 font-medium sm:w-16 lg:w-20 flex items-center gap-2 flex-shrink-0">
                  <Edit2 className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
                  Notes:
                </span>
                {isEditing ? (
                  <div className="flex-1 min-w-0">
                    <textarea 
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full text-xs sm:text-sm border rounded-md px-2 py-1 sm:px-3 sm:py-2 border-gray-300 focus:ring-2 focus:ring-[#6c47ff] focus:border-[#6c47ff]"
                      rows="2"
                      placeholder="Add notes from counselor..."
                    />
                    <div className="flex flex-wrap gap-2 mt-2">
                      <button
                        onClick={handleNotesUpdate}
                        className="text-xs sm:text-sm bg-brand-600 text-white px-3 py-1.5 rounded-lg hover:bg-brand-700 transition-all inline-flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-500"
                      >
                        <Save className="w-3 h-3 sm:w-4 sm:h-4" />
                        Save
                      </button>
                      <button 
                        onClick={() => setIsEditing(false)}
                        className="text-xs sm:text-sm bg-gray-200 text-gray-700 px-2 py-1 sm:px-3 sm:py-1.5 rounded-md hover:bg-gray-300 transition-all inline-flex items-center gap-1 sm:gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400"
                      >
                        <X className="w-3 h-3 sm:w-4 sm:h-4" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div 
                    className={`flex-1 group min-w-0 ${isAdmin ? 'cursor-pointer hover:bg-gray-50 rounded p-1' : ''}`}
                    onClick={() => isAdmin && setIsEditing(true)}
                  >
                    <span className="text-xs sm:text-sm text-gray-700 break-words">{step.notes || <span className="text-gray-500 italic">No notes added</span>}</span>
                    <span className="ml-2 text-xs text-gray-400 italic">
                      {isAdmin ? '(Click to edit)' : '(Read-only - Admin managed)'}
                    </span>
                  </div>
                )}
              </div>
            
              {/* Upload */}
              {step.uploadRequired && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <span className="text-xs sm:text-sm text-gray-600 font-medium sm:w-16 lg:w-20 flex items-center gap-2 flex-shrink-0">
                    <UploadCloud className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
                    Upload:
                  </span>
                  <button className="text-xs sm:text-sm bg-brand-50 text-brand-700 px-3 py-1.5 rounded-lg hover:bg-brand-100 transition-all inline-flex items-center gap-1.5 font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-500">
                    <UploadCloud className="w-3 h-3 sm:w-4 sm:h-4" />
                    Upload Document
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Admin Application Tracker Component
export function AdminApplicationTracker() {
  const [trackers, setTrackers] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [filteredTrackers, setFilteredTrackers] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchData() {
      const res = await fetch("/api/admin/application-tracker");
      const data = await res.json();
      setTrackers(data);
      // Extract unique users by user_name and user_id
      const userList = Array.from(
        new Map(data.map(t => [t.user_id, t.user_name])).entries()
      ).map(([id, name]) => ({ id, name }));
      setUsers(userList);
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      setFilteredTrackers(trackers.filter(t => t.user_id === selectedUser));
    } else {
      setFilteredTrackers([]);
    }
  }, [selectedUser, trackers]);

  return (
    <div className="min-h-screen bg-white text-[#1a0841] font-sans px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-extrabold mb-6 headline-underline">Application Tracker Management</h1>
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search user name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border rounded px-3 py-2 w-full max-w-md"
          />
          <div className="mt-2">
            <select
              value={selectedUser || ""}
              onChange={e => setSelectedUser(e.target.value)}
              className="border rounded px-3 py-2 w-full max-w-md"
            >
              <option value="">Select user</option>
              {users.filter(u => u.name.toLowerCase().includes(search.toLowerCase())).map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
        </div>
        {selectedUser && (
          <div className="mt-6">
            <h2 className="text-xl font-bold mb-2 headline-underline">
              {users.find(u => u.id === selectedUser)?.name || selectedUser}'s Tracker Steps
            </h2>
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 border">
                <div className="font-semibold text-lg mb-2">
                  User: {users.find(u => u.id === selectedUser)?.name || selectedUser}
                </div>
                <table className="w-full text-left">
                  <thead>
                    <tr>
                      <th className="py-2 px-3">Step</th>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3">Notes</th>
                      <th className="py-2 px-3">Last Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTrackers.map((step, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="py-2 px-3">{step.step_label}</td>
                        <td className="py-2 px-3">{step.status}</td>
                        <td className="py-2 px-3">{step.notes}</td>
                        <td className="py-2 px-3">{step.updated_at}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
