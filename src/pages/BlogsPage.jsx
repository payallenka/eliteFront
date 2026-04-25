// BlogModal component for displaying full blog details in a popup
function BlogModal({ blog, onClose }) {
  if (!blog) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-xs sm:max-w-lg md:max-w-2xl w-full max-h-[90vh] overflow-hidden relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors">
          <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <div className="overflow-y-auto max-h-[90vh] custom-scrollbar-blog">
          <div className="relative h-48 sm:h-56 md:h-64">
            <img src={blog.cover_image || ''} alt={blog.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E32] via-transparent to-transparent" />
            <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6">
              <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white headline-underline break-anywhere" style={{ fontFamily: 'Hedvig Letters Serif, serif' }}>{blog.title}</h2>
            </div>
          </div>
          <div className="p-4 sm:p-6 md:p-8">
            <div className="flex items-center gap-3 mb-3 sm:mb-4 text-xs sm:text-sm text-[#636363]">
              <span>By {blog.author || 'Elite Scholars'}</span>
              <span>•</span>
              <span>{blog.published_at ? new Date(blog.published_at).toLocaleDateString() : ''}</span>
            </div>
            <p className="text-[#141414] text-base sm:text-lg mb-3 sm:mb-4">{blog.short_description}</p>
            <div className="text-[#636363] text-sm sm:text-base leading-relaxed whitespace-pre-line">{blog.description}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
// BlogCard component for displaying individual blog articles
function BlogCard({ blog, onView }) {
  return (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg overflow-hidden transition-all duration-200 hover:shadow-xl hover:-translate-y-1">
      <div className="relative h-40 sm:h-48 overflow-hidden">
        <img
          src={blog.cover_image || ''}
          alt={blog.title}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-4 sm:p-5">
        <h3 className="text-responsive-base font-bold text-[#0B0E32] mb-2 line-clamp-2 break-anywhere" style={{ fontFamily: 'Hedvig Letters Serif, serif' }}>
          {blog.title}
        </h3>
        <p className="text-[#636363] text-responsive-xs mb-3 line-clamp-2">{blog.short_description || blog.description}</p>
        <div className="flex items-center gap-2 text-xs text-[#636363] mb-3 sm:mb-4">
          <span>By {blog.author || 'Elite Scholars'}</span>
          <span>•</span>
          <span>{blog.published_at ? new Date(blog.published_at).toLocaleDateString() : ''}</span>
        </div>
        <button
          className="w-full pl-4 sm:pl-6 pr-2 py-2 sm:py-2.5 bg-[#D72E2D] text-white rounded-full font-medium hover:bg-[#b82626] transition-colors flex items-center justify-between text-responsive-xs"
          style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
          onClick={onView}
        >
          <span>View Details</span>
          <span className="w-7 h-7 sm:w-9 sm:h-9 bg-white rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-3 h-3 sm:w-4 sm:h-4 text-[#D72E2D]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </span>
        </button>
      </div>
    </div>
  );
}
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
const MOCK_BLOGS = [
  {
    id: '1',
    title: 'How to Win Scholarships Abroad',
    slug: 'how-to-win-scholarships-abroad',
    description: 'Insider tips and strategies for securing scholarships to study overseas.',
    short_description: 'Scholarship tips for international students',
    cover_image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
    author: 'Jane Doe',
    published_at: '2024-12-01T00:00:00Z',
    youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    youtube_id: 'dQw4w9WgXcQ',
    // cover_image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800',
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
            <h2 className="text-2xl md:text-3xl font-bold text-white headline-underline" style={{ fontFamily: '"Hedvig Letters Serif", serif' }}>
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
              <p className="text-[#636363] leading-relaxed">{event.description}</p>
              
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
          
          <h2 className="text-2xl md:text-3xl font-bold text-[#0B0E32] mb-4 headline-underline" style={{ fontFamily: '"Hedvig Letters Serif", serif' }}>
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
export default function BlogsPage() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBlog, setSelectedBlog] = useState(null);

  useEffect(() => {
    const fetchBlogs = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${BACKEND_URL}/api/public/blogs`);
        const data = res.ok ? await res.json() : null;
        if (data && Array.isArray(data)) {
          setBlogs(data);
        } else {
          setBlogs(MOCK_BLOGS);
        }
      } catch (err) {
        setBlogs(MOCK_BLOGS);
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  const filteredBlogs = useMemo(() => {
    return blogs.filter(blog =>
      blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      blog.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [blogs, searchQuery]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center p-responsive">
          <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-[#D72E2D] mx-auto mb-4"></div>
          <p className="text-responsive-base text-[#636363]">Loading blogs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
      {/* Hero Section */}
      <section className="relative bg-[#0B0E32] text-white py-12 sm:py-16 md:py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-[#0B0E32]" />
        <div className="relative container-responsive px-0 sm:px-4">
          <div className="max-w-none sm:max-w-lg md:max-w-2xl lg:max-w-3xl">
            <span className="inline-flex items-center gap-2 text-[#D72E2D] text-responsive-base font-medium mb-4 sm:mb-6" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
              <span className="w-2 h-2 bg-[#D72E2D] rounded-full"></span>
              Blogs
            </span>
            <h1 className="text-responsive-3xl font-bold mb-4 sm:mb-6 headline-underline break-anywhere" style={{ fontFamily: '"Hedvig Letters Serif", serif', letterSpacing: '1.2px' }}>
              Insights, Stories, and Tips for Global Scholars
            </h1>
            <p className="text-responsive-base text-gray-300 mb-6 sm:mb-8 leading-relaxed">
              Explore our curated blog articles to help you on your journey to international education and success.
            </p>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="py-8 sm:py-12 bg-[#D6DAFF]/20 border-b">
        <div className="container-responsive px-0 sm:px-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <FiSearch className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-[#636363]" />
              <input
                type="text"
                placeholder="Search blogs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 rounded-[56px] border border-gray-200 focus:border-[#D72E2D] focus:ring-2 focus:ring-[#D72E2D]/20 outline-none transition-all text-responsive-sm"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Blogs Grid */}
      <section className="py-12 sm:py-16 md:py-20">
        <div className="container-responsive px-0 sm:px-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 sm:mb-10 gap-4">
            <div className="flex-1">
              <h2 className="text-3xl md:text-4xl font-bold text-[#0B0E32] headline-underline" style={{ fontFamily: '"Hedvig Letters Serif", serif' }}>
                Latest Blog Articles
              </h2>
              <p className="text-[#636363] mt-2">{filteredBlogs.length} blogs found</p>
            </div>
          </div>
          {filteredBlogs.length === 0 ? (
            <div className="text-center py-16 bg-[#D6DAFF]/20 rounded-2xl">
              <MdEvent className="w-16 h-16 text-[#636363] mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-[#141414] mb-2">No Blogs Found</h3>
              <p className="text-[#636363]">Try searching for a different topic or check back later.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBlogs.map(blog => (
                <BlogCard key={blog.id} blog={blog} onView={() => setSelectedBlog(blog)} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Blog Modal */}
      {selectedBlog && (
        <BlogModal blog={selectedBlog} onClose={() => setSelectedBlog(null)} />
      )}
    </div>
  );
}
