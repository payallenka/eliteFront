/**
 * src/pages/EventsPage.jsx
 * Public-facing events page with hero section, filters, upcoming events grid, event detail modal,
 * registration functionality, podcast strip ("The Story"), and past events gallery.
 * 
 * This file was generated to be added into the existing project structure. Replace TODO placeholders 
 * (SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, STORAGE_BUCKET_NAME, ADMIN_SECRET) 
 * with real values. For production, use server-side-only keys for create/update APIs; 
 * the public site should only use anon/read policies.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { FiCalendar, FiMapPin, FiUsers, FiX, FiPlay, FiSearch, FiFilter, FiClock, FiExternalLink, FiArrowRight } from 'react-icons/fi';
import { MdEvent, MdOndemandVideo, MdHistory } from 'react-icons/md';
import CustomDropdown from '../components/ui/CustomDropdown';
import MonthPicker from '../components/ui/MonthPicker';
import { API_ENDPOINTS, isUpcoming, isPast } from '../supabaseClient';

// Use centralized API configuration
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://elite-scholars-eight.vercel.app';

// Design tokens matching Elite Scholars brand
const COLORS = {
  primary: '#D72E2D',
  darkNavy: '#0B0E32',
  text: '#141414',
  cardBg: '#D6DAFF',
  muted: '#636363',
  white: '#FFFFFF',
};

// Mock data fallback when Supabase is unavailable
const MOCK_EVENTS = [
  {
    id: '1',
    title: 'Global Education Summit 2025',
    slug: 'global-education-summit-2025',
    description: 'Join us for an exclusive summit featuring education leaders from around the world discussing pathways to international education success.',
    short_description: 'Annual summit for aspiring global students',
    event_date: '2025-02-15T10:00:00Z',
    end_date: '2025-02-15T17:00:00Z',
    location: 'London, UK',
    venue: 'Royal Conference Center',
    mode: 'hybrid',
    category: 'conference',
    capacity: 500,
    registered_count: 342,
    cover_image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
    gallery: [],
    registration_url: null,
    is_featured: true,
    is_published: true,
    metadata: { speakers: ['Mohamed Sodik', 'Marie Jeanne'] },
    created_at: '2024-12-01T00:00:00Z',
  },
  {
    id: '2',
    title: 'Visa Application Workshop',
    slug: 'visa-application-workshop',
    description: 'Comprehensive workshop covering visa application strategies, document preparation, and interview tips for multiple countries.',
    short_description: 'Master the visa application process',
    event_date: '2025-01-20T14:00:00Z',
    end_date: '2025-01-20T16:00:00Z',
    location: 'Online',
    venue: 'Zoom Webinar',
    mode: 'online',
    category: 'workshop',
    capacity: 200,
    registered_count: 156,
    cover_image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800',
    gallery: [],
    registration_url: null,
    is_featured: false,
    is_published: true,
    metadata: {},
    created_at: '2024-12-05T00:00:00Z',
  },
  {
    id: '3',
    title: 'Study Abroad Fair - West Africa',
    slug: 'study-abroad-fair-west-africa',
    description: 'Meet representatives from top universities in USA, UK, Canada, and Australia. Get one-on-one consultations and scholarship information.',
    short_description: 'Connect with top global universities',
    event_date: '2025-03-10T09:00:00Z',
    end_date: '2025-03-10T18:00:00Z',
    location: 'Lagos, Nigeria',
    venue: 'Eko Hotels & Suites',
    mode: 'in-person',
    category: 'fair',
    capacity: 1000,
    registered_count: 678,
    cover_image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800',
    gallery: [],
    registration_url: null,
    is_featured: true,
    is_published: true,
    metadata: { universities: ['Harvard', 'Oxford', 'McGill', 'Melbourne'] },
    created_at: '2024-12-10T00:00:00Z',
  },
];

const MOCK_PAST_EVENTS = [
  {
    id: 'p1',
    title: 'Career Pathways Seminar 2024',
    slug: 'career-pathways-seminar-2024',
    description: 'A highly successful seminar that brought together industry leaders, career counselors, and ambitious students to explore international career opportunities. Attendees gained valuable insights into global job markets, visa sponsorship programs, and strategies for building a successful career abroad. The event featured panel discussions, networking sessions, and one-on-one mentoring opportunities.',
    short_description: 'A successful seminar discussing career opportunities abroad.',
    event_date: '2024-11-15T10:00:00Z',
    end_date: '2024-11-15T17:00:00Z',
    location: 'Accra, Ghana',
    venue: 'Accra International Conference Centre',
    mode: 'in-person',
    category: 'seminar',
    capacity: 300,
    cover_image: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800',
    registered_count: 234,
    is_published: true,
    metadata: { speakers: ['Dr. Kwame Asante', 'Sarah Johnson', 'Michael Chen'] },
  },
  {
    id: 'p2',
    title: 'IELTS Prep Masterclass',
    slug: 'ielts-prep-masterclass',
    description: 'An intensive online IELTS preparation masterclass led by certified IELTS trainers with over 10 years of experience. Participants learned proven strategies for all four sections: Listening, Reading, Writing, and Speaking. The session included practice tests, personalized feedback, and tips for achieving band 7+. Many attendees went on to achieve their target scores within weeks of the masterclass.',
    short_description: 'Intensive IELTS preparation session with expert tutors.',
    event_date: '2024-10-20T14:00:00Z',
    end_date: '2024-10-20T18:00:00Z',
    location: 'Online',
    venue: 'Zoom Webinar',
    mode: 'online',
    category: 'workshop',
    capacity: 200,
    cover_image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800',
    registered_count: 189,
    is_published: true,
    metadata: { speakers: ['Prof. Emma Williams', 'David Brown'] },
  },
  {
    id: 'p3',
    title: 'UK University Fair 2024',
    slug: 'uk-university-fair-2024',
    description: 'An exclusive opportunity to meet representatives from over 30 top UK universities including Oxford, Cambridge, Imperial College, and UCL. Prospective students received firsthand information about admission requirements, scholarship opportunities, and campus life. The fair also featured visa guidance sessions and application workshops.',
    short_description: 'Connect with top UK universities and explore your options.',
    event_date: '2024-09-15T09:00:00Z',
    end_date: '2024-09-15T17:00:00Z',
    location: 'Lagos, Nigeria',
    venue: 'Eko Hotels & Suites',
    mode: 'in-person',
    category: 'fair',
    capacity: 500,
    cover_image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800',
    registered_count: 423,
    is_published: true,
    metadata: { universities: ['Oxford', 'Cambridge', 'Imperial College', 'UCL', 'LSE'] },
  },
  {
    id: 'p4',
    title: 'Scholarship Application Workshop',
    slug: 'scholarship-application-workshop',
    description: 'A comprehensive workshop covering the entire scholarship application process from finding opportunities to submitting winning applications. Expert facilitators shared insider tips on writing compelling personal statements, securing strong recommendation letters, and acing scholarship interviews. Several attendees have since won prestigious scholarships including Chevening and Commonwealth.',
    short_description: 'Learn how to find and win scholarships for studying abroad.',
    event_date: '2024-08-25T10:00:00Z',
    end_date: '2024-08-25T15:00:00Z',
    location: 'Nairobi, Kenya',
    venue: 'Kenyatta International Convention Centre',
    mode: 'hybrid',
    category: 'workshop',
    capacity: 250,
    cover_image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800',
    registered_count: 198,
    is_published: true,
    metadata: { speakers: ['Grace Mwangi', 'Dr. James Okonkwo'] },
  },
];

const MOCK_PODCASTS = [
  {
    id: 'pod1',
    title: 'From Lagos to London: My Study Abroad Journey',
    slug: 'lagos-to-london-journey',
    description: 'Ezekiel shares his inspiring story of overcoming challenges to study in the UK.',
    youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    youtube_id: 'dQw4w9WgXcQ',
    cover_image: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800',
    duration_minutes: 45,
    episode_number: 12,
    publish_date: '2024-12-01T00:00:00Z',
    transcript: 'Full transcript available...',
    is_published: true,
    guest_name: 'Ezekiel A.',
    guest_title: 'Student, UK',
  },
  {
    id: 'pod2',
    title: 'Navigating Canadian Immigration as a Student',
    slug: 'canadian-immigration-student',
    description: 'Expert advice on the Canadian student visa process and pathways to permanent residency.',
    youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    youtube_id: 'dQw4w9WgXcQ',
    cover_image: 'https://images.unsplash.com/photo-1503614472-8c93d56e92ce?w=800',
    duration_minutes: 38,
    episode_number: 11,
    publish_date: '2024-11-15T00:00:00Z',
    transcript: 'Full transcript available...',
    is_published: true,
    guest_name: 'Immigration Expert',
    guest_title: 'Consultant',
  },
  {
    id: 'pod3',
    title: 'Scholarship Secrets: How I Got Full Funding',
    slug: 'scholarship-secrets-full-funding',
    description: 'Ama reveals her strategies for winning multiple scholarships to study in New Zealand.',
    youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    youtube_id: 'dQw4w9WgXcQ',
    cover_image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800',
    duration_minutes: 52,
    episode_number: 10,
    publish_date: '2024-11-01T00:00:00Z',
    transcript: 'Full transcript available...',
    is_published: true,
    guest_name: 'Ama K.',
    guest_title: 'Student, New Zealand',
  },
];

// Category options
const CATEGORIES = ['all', 'conference', 'workshop', 'webinar', 'fair', 'seminar', 'networking'];
const MODES = ['all', 'online', 'in-person', 'hybrid'];

// Helper functions
const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
};

const formatTime = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true
  });
};

// Note: isUpcoming and isPast are imported from supabaseClient

// Event Card Component
function EventCard({ event, onClick }) {
  const spotsLeft = event.capacity - (event.registered_count || 0);
  const isAlmostFull = spotsLeft < event.capacity * 0.2;
  
  return (
    <div 
      className="bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl border border-gray-100"
      onClick={() => onClick(event)}
    >
      <div className="relative h-48 overflow-hidden">
        <img 
          src={event.cover_image === '' ? '' : event.cover_image} 
          alt={event.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-3 left-3 flex gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${
            event.mode === 'online' ? 'bg-blue-500' : 
            event.mode === 'hybrid' ? 'bg-purple-500' : 'bg-green-500'
          }`}>
            {event.mode.charAt(0).toUpperCase() + event.mode.slice(1)}
          </span>
          {event.is_featured && (
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#D72E2D] text-white">
              Featured
            </span>
          )}
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          <span className="text-white/90 text-sm capitalize">{event.category}</span>
        </div>
      </div>
      
      <div className="p-5">
        <h3 className="text-lg font-bold text-[#0B0E32] mb-2 line-clamp-2" style={{ fontFamily: '"Hedvig Letters Serif", serif' }}>
          {event.title}
        </h3>
        <p className="text-[#636363] text-sm mb-4 line-clamp-2">
          {event.short_description || event.description?.substring(0, 100)}
        </p>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-[#636363]">
            <FiCalendar className="mr-2 text-[#D72E2D]" />
            {formatDate(event.event_date)} at {formatTime(event.event_date)}
          </div>
          <div className="flex items-center text-sm text-[#636363]">
            <FiMapPin className="mr-2 text-[#D72E2D]" />
            {event.location}
          </div>
          <div className="flex items-center text-sm text-[#636363]">
            <FiUsers className="mr-2 text-[#D72E2D]" />
            {event.registered_count || 0} registered
            {isAlmostFull && <span className="ml-2 text-[#D72E2D] font-semibold">• Almost full!</span>}
          </div>
        </div>
        
        <button className="w-full pl-6 pr-2 py-2 bg-[#D72E2D] text-white rounded-full font-medium hover:bg-[#b82626] transition-colors flex items-center justify-between" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
          <span>View Details</span>
          <span className="w-9 h-9 bg-white rounded-full flex items-center justify-center">
            <FiArrowRight className="w-4 h-4 text-[#D72E2D]" />
          </span>
        </button>
      </div>
    </div>
  );
}

// Event Detail Modal
function EventDetailModal({ event, onClose, onRegister }) {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  if (!event) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'event_registration',
          event_id: event.id,
          event_title: event.title,
          ...formData,
        }),
      });
      
      if (!response.ok) throw new Error('Registration failed');
      
      setSubmitted(true);
    } catch (err) {
      setError(err.message || 'Failed to register. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100"
        >
          <FiX className="w-6 h-6" />
        </button>
        
        <div 
          className="overflow-y-auto max-h-[90vh] custom-scrollbar-event"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#d1d5db transparent',
          }}
        >
          <style>{`
            .custom-scrollbar-event::-webkit-scrollbar {
              width: 6px;
            }
            .custom-scrollbar-event::-webkit-scrollbar-track {
              background: transparent;
              margin: 16px 0;
            }
            .custom-scrollbar-event::-webkit-scrollbar-thumb {
              background-color: #d1d5db;
              border-radius: 10px;
            }
            .custom-scrollbar-event::-webkit-scrollbar-thumb:hover {
              background-color: #9ca3af;
            }
          `}</style>
          
          <div className="relative h-64 md:h-80">
          <img 
            src={event.cover_image === '' ? '' : event.cover_image} 
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E32] via-transparent to-transparent" />
          <div className="absolute bottom-6 left-6 right-6">
            <div className="flex gap-2 mb-3">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${
                event.mode === 'online' ? 'bg-blue-500' : 
                event.mode === 'hybrid' ? 'bg-purple-500' : 'bg-green-500'
              }`}>
                {event.mode.charAt(0).toUpperCase() + event.mode.slice(1)}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white capitalize">
                {event.category}
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white" style={{ fontFamily: '"Hedvig Letters Serif", serif' }}>
              {event.title}
            </h2>
          </div>
        </div>
        
        <div className="p-6 md:p-8">
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-[#D6DAFF]/30 rounded-xl">
                <FiCalendar className="w-5 h-5 text-[#D72E2D] mt-0.5" />
                <div>
                  <p className="font-semibold text-[#141414]">{formatDate(event.event_date)}</p>
                  <p className="text-sm text-[#636363]">{formatTime(event.event_date)} - {formatTime(event.end_date || event.event_date)}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-4 bg-[#D6DAFF]/30 rounded-xl">
                <FiMapPin className="w-5 h-5 text-[#D72E2D] mt-0.5" />
                <div>
                  <p className="font-semibold text-[#141414]">{event.venue || event.location}</p>
                  <p className="text-sm text-[#636363]">{event.location}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-4 bg-[#D6DAFF]/30 rounded-xl">
                <FiUsers className="w-5 h-5 text-[#D72E2D] mt-0.5" />
                <div>
                  <p className="font-semibold text-[#141414]">{event.registered_count || 0} / {event.capacity} registered</p>
                  <p className="text-sm text-[#636363]">{event.capacity - (event.registered_count || 0)} spots remaining</p>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-[#141414] mb-3">About This Event</h3>
              <p className="text-[#636363] leading-relaxed" style={{ whiteSpace: 'pre-line' }}>{event.description}</p>
              
              {event.metadata?.speakers && (
                <div className="mt-4">
                  <h4 className="font-semibold text-[#141414] mb-2">Speakers</h4>
                  <div className="flex flex-wrap gap-2">
                    {event.metadata.speakers.map((speaker, i) => (
                      <span key={i} className="px-3 py-1 bg-[#D6DAFF] rounded-full text-sm text-[#0B0E32]">
                        {speaker}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Past Event Summary */}
          {isPast(event.event_date) && (
            <div className="border-t pt-6">
              <div className="p-6 bg-[#D6DAFF]/30 rounded-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-[#636363] rounded-full flex items-center justify-center">
                    <MdHistory className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#0B0E32]">This Event Has Ended</h3>
                    <p className="text-sm text-[#636363]">Thank you to everyone who attended!</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="bg-white p-4 rounded-xl text-center">
                    <div className="text-2xl font-bold text-[#D72E2D]">{event.registered_count || 0}</div>
                    <div className="text-sm text-[#636363]">Total Attendees</div>
                  </div>
                  <div className="bg-white p-4 rounded-xl text-center">
                    <div className="text-2xl font-bold text-[#0B0E32] capitalize">{event.category}</div>
                    <div className="text-sm text-[#636363]">Event Type</div>
                  </div>
                </div>
                
                {event.metadata?.speakers && (
                  <div className="mt-4 p-4 bg-white rounded-xl">
                    <h4 className="font-semibold text-[#141414] mb-2">Featured Speakers</h4>
                    <div className="flex flex-wrap gap-2">
                      {event.metadata.speakers.map((speaker, i) => (
                        <span key={i} className="px-3 py-1 bg-[#D6DAFF] rounded-full text-sm text-[#0B0E32]">
                          {speaker}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {event.metadata?.universities && (
                  <div className="mt-4 p-4 bg-white rounded-xl">
                    <h4 className="font-semibold text-[#141414] mb-2">Participating Universities</h4>
                    <div className="flex flex-wrap gap-2">
                      {event.metadata.universities.map((uni, i) => (
                        <span key={i} className="px-3 py-1 bg-[#0B0E32] rounded-full text-sm text-white">
                          {uni}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                <p className="text-sm text-[#636363] mt-4 text-center">
                  Stay tuned for similar upcoming events!
                </p>
              </div>
            </div>
          )}
          
          {/* Registration Form - Always at the bottom */}
          {!submitted && (
            <div className="border-t pt-6 mt-6">
              <h3 className="text-xl font-bold text-[#0B0E32] mb-4" style={{ fontFamily: '"Hedvig Letters Serif", serif' }}>
                Register for This Event
              </h3>
              
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                  {error}
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Your Full Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    disabled={isPast(event.event_date)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#D72E2D] focus:ring-2 focus:ring-[#D72E2D]/20 outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    disabled={isPast(event.event_date)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#D72E2D] focus:ring-2 focus:ring-[#D72E2D]/20 outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  disabled={isPast(event.event_date)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#D72E2D] focus:ring-2 focus:ring-[#D72E2D]/20 outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                <button
                  type="submit"
                  disabled={submitting || isPast(event.event_date)}
                  className="w-full pl-6 pr-2 py-2 bg-[#D72E2D] text-white rounded-full font-medium hover:bg-[#b82626] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                >
                  {submitting ? (
                    <>
                      <span>Registering...</span>
                      <span className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-[#D72E2D] border-t-transparent rounded-full animate-spin" />
                      </span>
                    </>
                  ) : (
                    <>
                      <span>{isPast(event.event_date) ? 'Registration Closed' : 'Register Now'}</span>
                      <span className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                        <FiArrowRight className="w-5 h-5 text-[#D72E2D]" />
                      </span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
          
          {submitted && (
            <div className="border-t pt-6 mt-6">
              <div className="text-center p-8 bg-green-50 rounded-2xl">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-green-800 mb-2">Registration Successful!</h3>
                <p className="text-green-700">Check your email for confirmation details.</p>
              </div>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}

// Podcast Card Component
function PodcastCard({ podcast, onClick }) {
  return (
    <div 
      className="bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:z-10 relative"
      onClick={() => onClick(podcast)}
    >
      <div className="relative h-48 overflow-hidden">
        <img 
          src={podcast.cover_image === '' ? '' : podcast.cover_image} 
          alt={podcast.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <div className="w-16 h-16 bg-[#D72E2D] rounded-full flex items-center justify-center">
            <FiPlay className="w-8 h-8 text-white ml-1" />
          </div>
        </div>
        <div className="absolute top-3 left-3 px-3 py-1 bg-[#0B0E32] rounded-full text-xs text-white font-semibold">
          EP {podcast.episode_number}
        </div>
        <div className="absolute bottom-3 right-3 px-3 py-1 bg-black/60 rounded-full text-xs text-white flex items-center gap-1">
          <FiClock className="w-3 h-3" />
          {podcast.duration_minutes} min
        </div>
      </div>
      <div className="p-5">
        <h3 className="text-lg font-bold text-[#0B0E32] mb-2 line-clamp-2" style={{ fontFamily: '"Hedvig Letters Serif", serif' }}>
          {podcast.title}
        </h3>
        <p className="text-[#636363] text-sm mb-3 line-clamp-2">{podcast.description}</p>
        {podcast.guest_name && (
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold text-[#141414]">{podcast.guest_name}</span>
            <span className="text-[#636363]">• {podcast.guest_title}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Podcast Modal
function PodcastModal({ podcast, onClose }) {
  if (!podcast) return null;
  
  const youtubeEmbedUrl = podcast.youtube_url?.includes('youtube.com') 
    ? podcast.youtube_url.replace('watch?v=', 'embed/')
    : podcast.youtube_url?.includes('youtu.be')
    ? `https://www.youtube.com/embed/${podcast.youtube_url.split('/').pop()}`
    : null;
  
  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100"
        >
          <FiX className="w-6 h-6" />
        </button>
        
        <div 
          className="overflow-y-auto max-h-[90vh] custom-scrollbar-podcast pr-2"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#d1d5db transparent',
          }}
        >
          <style>{`
            .custom-scrollbar-podcast::-webkit-scrollbar {
              width: 6px;
            }
            .custom-scrollbar-podcast::-webkit-scrollbar-track {
              background: transparent;
              margin: 16px 0;
            }
            .custom-scrollbar-podcast::-webkit-scrollbar-thumb {
              background-color: #d1d5db;
              border-radius: 10px;
            }
            .custom-scrollbar-podcast::-webkit-scrollbar-thumb:hover {
              background-color: #9ca3af;
            }
          `}</style>
          
          <div className="p-6 md:p-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="px-3 py-1 bg-[#0B0E32] rounded-full text-xs text-white font-semibold">
                EP {podcast.episode_number}
              </span>
            <span className="text-sm text-[#636363]">{formatDate(podcast.publish_date)}</span>
          </div>
          
          <h2 className="text-2xl md:text-3xl font-bold text-[#0B0E32] mb-4" style={{ fontFamily: '"Hedvig Letters Serif", serif' }}>
            {podcast.title}
          </h2>
          
          {podcast.guest_name && (
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-[#D6DAFF] rounded-full flex items-center justify-center">
                <span className="text-lg font-semibold text-[#141414]">{podcast.guest_name.charAt(0)}</span>
              </div>
              <div>
                <p className="font-semibold text-[#141414]">{podcast.guest_name}</p>
                <p className="text-sm text-[#636363]">{podcast.guest_title}</p>
              </div>
            </div>
          )}
          
          {youtubeEmbedUrl && (
            <div className="aspect-video mb-6 rounded-2xl overflow-hidden bg-black">
              <iframe
                src={youtubeEmbedUrl}
                title={podcast.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
          
          <p className="text-[#636363] leading-relaxed mb-6">{podcast.description}</p>
          
          {podcast.youtube_url && (
            <a
              href={podcast.youtube_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#D72E2D] text-white rounded-[56px] font-semibold hover:bg-[#b82626] transition-colors"
            >
              <FiExternalLink className="w-5 h-5" />
              Watch on YouTube
            </a>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}



// ...existing code...
export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  const [podcasts, setPodcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedMode, setSelectedMode] = useState('all');
  const [selectedDate, setSelectedDate] = useState('');

  // Compute available months from events
  const availableMonths = useMemo(() => {
    const monthSet = new Set();
    events.forEach(event => {
      if (event.event_date) {
        const d = new Date(event.event_date);
        const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthSet.add(ym);
      }
    });
    const sortedMonths = Array.from(monthSet).sort();
    return sortedMonths.map(ym => {
      const [year, month] = ym.split('-');
      const date = new Date(year, month - 1, 1);
      return {
        value: ym,
        label: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      };
    });
  }, [events]);
  
  // Modals
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedPodcast, setSelectedPodcast] = useState(null);

  useEffect(() => {
    // Log data for debugging
    console.log('[EventsPage] Events:', events);
    console.log('[EventsPage] Past Events:', pastEvents);
    console.log('[EventsPage] Podcasts:', podcasts);
  }, [events, pastEvents, podcasts]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch events
      console.log('[EventsPage] Fetching events from:', `${BACKEND_URL}/api/public/events`);
      const eventsRes = await fetch(`${BACKEND_URL}/api/public/events`);
      if (!eventsRes.ok) {
        console.error('[EventsPage] API error:', eventsRes.status, await eventsRes.text());
      }
      const eventsData = eventsRes.ok ? await eventsRes.json() : null;
      console.log('[EventsPage] Raw events response:', eventsData);

      // Fetch podcasts
      const podcastsRes = await fetch(`${BACKEND_URL}/api/public/podcasts`);
      const podcastsData = podcastsRes.ok ? await podcastsRes.json() : null;
      console.log('[EventsPage] Raw podcasts response:', podcastsData);
      
      if (eventsData && Array.isArray(eventsData)) {
        console.log('[EventsPage] Raw events before sorting:', eventsData);
        // Sort upcoming events by event_date ascending (soonest first)
        const upcoming = eventsData
          .filter(e => isUpcoming(e.event_date))
          .sort((a, b) => new Date(a.event_date) - new Date(b.event_date));
        // Sort past events by event_date descending (most recent first)
        const past = eventsData
          .filter(e => isPast(e.event_date))
          .sort((a, b) => new Date(b.event_date) - new Date(a.event_date));
        console.log('[EventsPage] Upcoming events after sorting:', upcoming);
        console.log('[EventsPage] Past events after sorting:', past);
        setEvents(upcoming);
        setPastEvents(past);
      } else {
        // Use mock data
        setEvents(MOCK_EVENTS);
        setPastEvents(MOCK_PAST_EVENTS);
      }
      
      // Sort podcasts by publish_date descending (latest first)
      const sortPodcasts = arr =>
        [...arr].sort((a, b) => new Date(b.publish_date) - new Date(a.publish_date));

      if (podcastsData && Array.isArray(podcastsData)) {
        console.log('[EventsPage] Podcasts before sorting:', podcastsData);
        const sortedPodcasts = sortPodcasts(podcastsData);
        console.log('[EventsPage] Podcasts after sorting:', sortedPodcasts);
        setPodcasts(sortedPodcasts);
      } else {
        console.log('[EventsPage] Mock Podcasts before sorting:', MOCK_PODCASTS);
        const sortedMockPodcasts = sortPodcasts(MOCK_PODCASTS);
        console.log('[EventsPage] Mock Podcasts after sorting:', sortedMockPodcasts);
        setPodcasts(sortedMockPodcasts);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      // Fallback to mock data
      setEvents(MOCK_EVENTS);
      setPastEvents(MOCK_PAST_EVENTS);
      // Sort mock podcasts as fallback
      const sortPodcasts = arr =>
        [...arr].sort((a, b) => new Date(b.publish_date) - new Date(a.publish_date));
      setPodcasts(sortPodcasts(MOCK_PODCASTS));
    } finally {
      setLoading(false);
    }
  };

  // Filtered events
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || event.category === selectedCategory;
      const matchesMode = selectedMode === 'all' || event.mode === selectedMode;
      const matchesDate = !selectedDate || event.event_date.startsWith(selectedDate);
      
      return matchesSearch && matchesCategory && matchesMode && matchesDate;
    });
  }, [events, searchQuery, selectedCategory, selectedMode, selectedDate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D72E2D] mx-auto mb-4"></div>
          <p className="text-lg text-[#636363]">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
      {/* Hero Section */}
      <section className="relative bg-[#0B0E32] text-white py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-[#0B0E32]" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 text-[#D72E2D] text-base font-medium mb-6" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
              <span className="w-2 h-2 bg-[#D72E2D] rounded-full"></span>
              Events & Podcasts
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6" style={{ fontFamily: '"Hedvig Letters Serif", serif', letterSpacing: '1.2px' }}>
              Connect, Learn, and Grow with Elite Scholars
            </h1>
            <p className="text-lg md:text-xl text-gray-300 mb-8 leading-relaxed">
              Join our exclusive events, workshops, and webinars designed to help ambitious students achieve their global education dreams.
            </p>
            <div className="flex flex-wrap gap-4">
              <a href="#upcoming" className="pl-6 pr-2 py-2 bg-[#D72E2D] text-white rounded-full font-medium hover:bg-[#b82626] transition-colors flex items-center gap-3" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
                <span>Browse Events</span>
                <span className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                  <FiArrowRight className="w-5 h-5 text-[#D72E2D]" />
                </span>
              </a>
              <a href="#podcasts" className="pl-6 pr-2 py-2 bg-white/10 text-white rounded-full font-medium hover:bg-white/20 transition-colors flex items-center gap-3" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
                <span>Watch The Story</span>
                <span className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <FiArrowRight className="w-5 h-5 text-white" />
                </span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Filters Section */}
      <section id="upcoming" className="py-12 bg-[#D6DAFF]/20 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[#636363]" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-[56px] border border-gray-200 focus:border-[#D72E2D] focus:ring-2 focus:ring-[#D72E2D]/20 outline-none transition-all"
              />
            </div>
            
            <CustomDropdown
              value={selectedCategory}
              onChange={setSelectedCategory}
              options={CATEGORIES.map(cat => ({
                value: cat,
                label: cat === 'all' ? 'All Categories' : cat
              }))}
              className="w-full md:w-auto"
              minWidth="160px"
              capitalize
            />
            
            <CustomDropdown
              value={selectedMode}
              onChange={setSelectedMode}
              options={MODES.map(mode => ({
                value: mode,
                label: mode === 'all' ? 'All Modes' : mode
              }))}
              className="w-full md:w-auto"
              minWidth="140px"
              capitalize
            />
            
            <MonthPicker
              value={selectedDate}
              onChange={setSelectedDate}
              placeholder="Select month"
              className="w-full md:w-auto"
              minWidth="170px"
              months={availableMonths}
            />
          </div>
        </div>
      </section>

      {/* Upcoming Events Grid */}
      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-[#0B0E32]" style={{ fontFamily: '"Hedvig Letters Serif", serif' }}>
                Upcoming Events
              </h2>
              <p className="text-[#636363] mt-2">{filteredEvents.length} events found</p>
            </div>
          </div>
          
          {filteredEvents.length === 0 ? (
            <div className="text-center py-16 bg-[#D6DAFF]/20 rounded-2xl">
              <MdEvent className="w-16 h-16 text-[#636363] mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-[#141414] mb-2">No Events Found</h3>
              <p className="text-[#636363]">Try adjusting your filters or check back later.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {/* Normalize publish_date to full ISO format for sorting */}
                          {(() => {
                            function normalizeDate(dateStr) {
                              if (!dateStr) return '';
                              // If already has time, return as is
                              if (dateStr.length > 10) return dateStr;
                              // If only YYYY-MM-DD, add midnight UTC
                              return dateStr + 'T00:00:00Z';
                            }
                            const sortedPodcasts = [...podcasts]
                              .map(p => ({ ...p, publish_date: normalizeDate(p.publish_date) }))
                              .sort((a, b) => new Date(b.publish_date) - new Date(a.publish_date));
                            // Debug log
                            console.log('Podcast order for rendering:');
                            sortedPodcasts.forEach(p => console.log(p.title, p.publish_date));
                            return sortedPodcasts.map(podcast => (
                              <PodcastCard 
                                key={podcast.id} 
                                podcast={podcast} 
                                onClick={setSelectedPodcast}
                              />
                            ));
                          })()}
              {filteredEvents.map(event => (
                <EventCard 
                  key={event.id} 
                  event={event} 
                  onClick={setSelectedEvent}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Podcast Strip - "The Story" */}
      <section id="podcasts" className="py-16 md:py-20 bg-[#0B0E32] overflow-visible">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <span className="inline-block px-4 py-1.5 bg-[#D72E2D]/20 text-[#D72E2D] rounded-full text-sm font-semibold mb-4">
                The Story
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: '"Hedvig Letters Serif", serif' }}>
                Inspiring Student Journeys
              </h2>
              <p className="text-gray-400 mt-2">Real stories from students who made their dreams come true</p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...podcasts]
              .sort((a, b) => new Date(b.publish_date) - new Date(a.publish_date))
              .map(podcast => (
                <PodcastCard 
                  key={podcast.id} 
                  podcast={podcast} 
                  onClick={setSelectedPodcast}
                />
              ))}
          </div>
        </div>
      </section>

      {/* Past Events Gallery */}
      {pastEvents.length > 0 && (
        <section className="py-16 md:py-20 bg-[#D6DAFF]/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 mb-10">
              <MdHistory className="w-8 h-8 text-[#636363]" />
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-[#0B0E32]" style={{ fontFamily: '"Hedvig Letters Serif", serif' }}>
                  Past Events
                </h2>
                <p className="text-[#636363] mt-1">Relive our successful past events</p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {pastEvents.slice(0, 4).map(event => (
                <div 
                  key={event.id} 
                  className="bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl group"
                  onClick={() => setSelectedEvent(event)}
                >
                  <div className="relative h-40">
                    <img 
                      src={event.cover_image === '' ? '' : event.cover_image} 
                      alt={event.title}
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 opacity-80 group-hover:opacity-100 transition-all duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute top-3 left-3">
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-[#636363] text-white">
                        Completed
                      </span>
                    </div>
                    <div className="absolute bottom-3 left-3 right-3">
                      <span className="text-white/80 text-xs">{formatDate(event.event_date)}</span>
                      <h3 className="text-white font-semibold line-clamp-2">{event.title}</h3>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between text-sm mb-3">
                      <span className="text-[#636363] flex items-center gap-1">
                        <FiMapPin className="w-3 h-3" />
                        {event.location}
                      </span>
                      <span className="text-[#636363] flex items-center gap-1">
                        <FiUsers className="w-3 h-3" />
                        {event.registered_count} attended
                      </span>
                    </div>
                    <button className="w-full pl-4 pr-1.5 py-1.5 bg-[#0B0E32] text-white text-sm rounded-full font-medium group-hover:bg-[#D72E2D] transition-colors flex items-center justify-between" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
                      <span>View Details</span>
                      <span className="w-7 h-7 bg-white rounded-full flex items-center justify-center">
                        <FiArrowRight className="w-3.5 h-3.5 text-[#0B0E32] group-hover:text-[#D72E2D]" />
                      </span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 md:py-20 bg-gradient-to-br from-[#D72E2D] to-[#b82626] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6" style={{ fontFamily: '"Hedvig Letters Serif", serif' }}>
            Ready to Start Your Global Journey?
          </h2>
          <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of ambitious students who have transformed their dreams into reality with Elite Scholars.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="/register" className="pl-6 pr-2 py-2 bg-white text-[#D72E2D] rounded-full font-medium hover:bg-gray-100 transition-colors flex items-center gap-3" style={{ fontFamily: 'Inter, sans-serif' }}>
              <span>Get Started Free</span>
              <span className="w-10 h-10 bg-[#D72E2D] rounded-full flex items-center justify-center">
                <FiArrowRight className="w-5 h-5 text-white" />
              </span>
            </a>
            <a href="#upcoming" className="pl-6 pr-2 py-2 bg-white/10 text-white rounded-full font-medium hover:bg-white/20 transition-colors flex items-center gap-3" style={{ fontFamily: 'Inter, sans-serif' }}>
              <span>View All Events</span>
              <span className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <FiArrowRight className="w-5 h-5 text-white" />
              </span>
            </a>
          </div>
        </div>
      </section>

      {/* Modals */}
      {selectedEvent && (
        <EventDetailModal 
          event={selectedEvent} 
          onClose={() => setSelectedEvent(null)}
        />
      )}
      
      {selectedPodcast && (
        <PodcastModal 
          podcast={selectedPodcast} 
          onClose={() => setSelectedPodcast(null)}
        />
      )}
    </div>
  );
}
