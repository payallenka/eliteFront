import React, { useEffect, useState } from 'react';
import Loader from '../components/ui/Loader';
import { FiSearch } from 'react-icons/fi';
import { 
  User, 
  FileText, 
  Brain, 
  University, 
  Send, 
  Mail, 
  DollarSign, 
  Plane, 
  CheckCircle,
  Circle,
  FileCheck,
  GraduationCap,
  Award,
  Globe,
  BookOpen,
  MapPin,
  Target
} from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://elite-scholars-eight.vercel.app';

export default function AdminApplicationTracker() {
  const [trackers, setTrackers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedUser, setExpandedUser] = useState(null);
  const [search, setSearch] = useState('');
  const [stepUpdates, setStepUpdates] = useState({}); // Track local updates

  const getStepIcon = (step, isCompleted = false) => {
    if (isCompleted) {
      return <CheckCircle size={16} className="text-green-600" />;
    }
    
    const stepLabel = step.step_label || '';
    const stepId = step.step_id || 1;
    
    // Map by step ID first, then by label content
    switch (stepId) {
      case 1:
        return <User size={16} className="text-blue-600" />;
      case 2:
        return <FileText size={16} className="text-purple-600" />;
      case 3:
        return <Brain size={16} className="text-orange-600" />;
      case 4:
        return <University size={16} className="text-indigo-600" />;
      case 5:
        return <Send size={16} className="text-cyan-600" />;
      case 6:
        return <Mail size={16} className="text-yellow-600" />;
      case 7:
        return <DollarSign size={16} className="text-green-600" />;
      case 8:
        return <FileCheck size={16} className="text-red-600" />;
      case 9:
        return <Plane size={16} className="text-blue-600" />;
      case 10:
        return <GraduationCap size={16} className="text-purple-600" />;
      case 11:
        return <Award size={16} className="text-yellow-600" />;
      case 12:
        return <Globe size={16} className="text-green-600" />;
      case 13:
        return <BookOpen size={16} className="text-blue-600" />;
      case 14:
        return <MapPin size={16} className="text-red-600" />;
      case 15:
        return <Target size={16} className="text-orange-600" />;
      default:
        // Fallback to label-based matching for backwards compatibility
        if (stepLabel.includes('Profile')) return <User size={16} className="text-blue-600" />;
        if (stepLabel.includes('Documents')) return <FileText size={16} className="text-purple-600" />;
        if (stepLabel.includes('Analysis') || stepLabel.includes('Eligibility')) return <Brain size={16} className="text-orange-600" />;
        if (stepLabel.includes('University') || stepLabel.includes('Selection')) return <University size={16} className="text-indigo-600" />;
        if (stepLabel.includes('Application') || stepLabel.includes('Submitted')) return <Send size={16} className="text-cyan-600" />;
        if (stepLabel.includes('Offer') || stepLabel.includes('Decision')) return <Mail size={16} className="text-yellow-600" />;
        if (stepLabel.includes('Scholarship') || stepLabel.includes('Financial')) return <DollarSign size={16} className="text-green-600" />;
        if (stepLabel.includes('Visa') && stepLabel.includes('Started')) return <FileCheck size={16} className="text-red-600" />;
        if (stepLabel.includes('Visa') && (stepLabel.includes('Approved') || stepLabel.includes('Travel'))) return <Plane size={16} className="text-blue-600" />;
        if (stepLabel.includes('Graduation') || stepLabel.includes('Program')) return <GraduationCap size={16} className="text-purple-600" />;
        
        return <Circle size={16} className="text-gray-600" />;
    }
  };

  const handleStepUpdate = (userId, stepId, field, value) => {
    const key = `${userId}-${stepId}`;
    setStepUpdates(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    }));
  };

  const saveStepChanges = async (userId, stepId) => {
    const key = `${userId}-${stepId}`;
    const updates = stepUpdates[key];
    if (!updates) return;

    try {
      console.log('[ADMIN] Attempting to update step:', { userId, stepId, updates });
      const response = await fetch(`${BACKEND_URL}/api/tracker/update-step`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          step_id: stepId,
          updates: updates
        })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update step');
      }

      // Find the user and step info for email notification
      const user = trackers.find(t => t.user_id === userId);
      const step = user?.steps?.find(s => s.step_id === stepId) || {};
      const userEmail = user?.user_email || user?.email; // Adjust field name as per your data
      const stepLabel = step.step_label || step.label || `Step ${stepId}`;
      const newStatus = updates.status || step.status;
      const newNotes = updates.notes ?? step.notes;

      console.log('[ADMIN] Preparing to send email notification:', {
        userEmail,
        stepLabel,
        newStatus,
        newNotes
      });

      // Send email notification if userEmail is available
      if (userEmail) {
        try {
          const emailRes = await fetch('https://elite-scholars-eight.vercel.app/api/send-tracker-update-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userEmail,
              stepLabel,
              newStatus,
              newNotes
            })
          });
          const emailResult = await emailRes.json();
          console.log('[ADMIN] Email API response:', emailResult);
        } catch (emailErr) {
          console.error('Error sending notification email:', emailErr);
        }
      } else {
        console.warn('User email not found, cannot send notification email.');
      }

      // Clear local updates for this step
      setStepUpdates(prev => {
        const newUpdates = { ...prev };
        delete newUpdates[key];
        return newUpdates;
      });

      // Refresh data
      await fetchTrackers();
      console.log('Step updated successfully');
    } catch (err) {
      console.error('Error updating step:', err);
      alert('Error updating step: ' + err.message);
    }
  };

  // Move fetchTrackers outside useEffect
  const fetchTrackers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/application-tracker`);
      if (!res.ok) throw new Error('Failed to fetch application trackers');
      const data = await res.json();
      console.log('Received application tracker data:', data);
      setTrackers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrackers();
  }, []);

  // Group trackers by user_id and user_name
  const grouped = {};
  trackers.forEach(tracker => {
    if (!grouped[tracker.user_id]) {
      grouped[tracker.user_id] = {
        user_id: tracker.user_id,
        user_name: tracker.user_name,
        steps: []
      };
    }
    grouped[tracker.user_id].steps.push(tracker);
  });
  const groupedTrackers = Object.values(grouped);

  // Filter users by search
  const filteredTrackers = groupedTrackers.filter(user =>
    (user.user_name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white text-[#1a0841] font-sans px-4 py-8 ml-0 lg:ml-16" style={{ fontFamily: 'Montserrat, Inter, Hedvig Letters Sans, sans-serif', fontWeight: 400 }}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 md:mb-6">
        <h2 className="text-3xl md:text-4xl tracking-tight mb-2 md:mb-0">Application Tracker Management</h2>
      </div>
      <div className="mb-6 flex items-center justify-start">
        <div className="relative w-full max-w-xs">
          <input
            type="text"
            placeholder="Search user name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 pr-4 py-3 w-full rounded-xl border border-gray-300 shadow focus:outline-none focus:ring-2 focus:ring-[#6c47ff] bg-gray-50 text-base"
          />
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6c47ff] text-xl pointer-events-none">
            <FiSearch />
          </span>
        </div>
      </div>
      {loading && <Loader message="Loading application trackers..." />}
      {error && <div className="text-red-500">Error: {error}</div>}
      {!loading && !error && (
        <div className="border rounded-2xl shadow divide-y bg-gray-50">
          {filteredTrackers.length === 0 ? (
            <div className="p-4 text-center">No application trackers found.</div>
          ) : (
            filteredTrackers.map(user => (
              <div key={user.user_id}>
                <button
                  className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 flex justify-between items-center rounded-t-xl"
                  onClick={() => setExpandedUser(expandedUser === user.user_id ? null : user.user_id)}
                >
                  <span className="font-semibold">{user.user_name}</span>
                  <span className="text-sm text-gray-500">{user.steps.length} step{user.steps.length !== 1 ? 's' : ''}</span>
                  <span className="ml-2">{expandedUser === user.user_id ? '▲' : '▼'}</span>
                </button>
                {expandedUser === user.user_id && (
                  <div className="overflow-x-auto bg-white rounded-b-xl">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="p-2 text-left">Step</th>
                          <th className="p-2 text-left">Status</th>
                          <th className="p-2 text-left">Notes</th>
                          <th className="p-2 text-left">Last Updated</th>
                          <th className="p-2 text-left">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {user.steps.map((step, idx) => (
                          <tr key={step.step_id + idx} className="border-t">
                            <td className="p-2 font-semibold">
                              <div className="flex items-center gap-2">
                                {getStepIcon(step, step.status === 'done')}
                                <span>{step.step_label || step.step_id}</span>
                              </div>
                            </td>
                            <td className="p-2">
                              {step.manual ? (
                                <select
                                  value={stepUpdates[`${user.user_id}-${step.step_id}`]?.status || step.status}
                                  onChange={e => handleStepUpdate(user.user_id, step.step_id, 'status', e.target.value)}
                                  className="border rounded px-2 py-1"
                                >
                                  <option value="not-started">Not Started</option>
                                  <option value="in-progress">In Progress</option>
                                  <option value="done">Done</option>
                                </select>
                              ) : (
                                <span>{step.status}</span>
                              )}
                            </td>
                            <td className="p-2">
                              <textarea
                                value={stepUpdates[`${user.user_id}-${step.step_id}`]?.notes ?? (step.notes || '')}
                                onChange={e => handleStepUpdate(user.user_id, step.step_id, 'notes', e.target.value)}
                                className="border rounded px-2 py-1 w-full"
                                rows={1}
                              />
                            </td>
                            <td className="p-2">{step.updated_at ? new Date(step.updated_at).toLocaleString() : 'N/A'}</td>
                            <td className="p-2">
                              <button
                                className="bg-[#6c47ff] text-white px-3 py-1 rounded shadow hover:bg-[#1a0841]"
                                onClick={() => saveStepChanges(user.user_id, step.step_id)}
                                disabled={!stepUpdates[`${user.user_id}-${step.step_id}`]}
                              >
                                Save
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
