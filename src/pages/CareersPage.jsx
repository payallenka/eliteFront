/**
 * src/pages/CareersPage.jsx
 * Public-facing careers page with job listings, filters, role detail modal,
 * and application form functionality.
 * 
 * This file was generated to be added into the existing project structure. Replace TODO placeholders 
 * (SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, STORAGE_BUCKET_NAME, ADMIN_SECRET) 
 * with real values. For production, use server-side-only keys for create/update APIs; 
 * the public site should only use anon/read policies.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { FiMapPin, FiBriefcase, FiClock, FiDollarSign, FiX, FiSearch, FiUpload, FiCheck, FiChevronRight, FiArrowRight, FiGlobe, FiTrendingUp, FiUsers, FiHeart, FiSend } from 'react-icons/fi';
import { MdWorkOutline, MdLocationOn, MdAccessTime, MdBusinessCenter } from 'react-icons/md';
import CustomDropdown from '../components/ui/CustomDropdown';
import { API_ENDPOINTS, supabase } from '../supabaseClient';

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

// Helper to get a date N days from now
const getFutureDate = (daysFromNow) => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString();
};

// Mock data fallback - always use fresh dates relative to today
const MOCK_CAREERS = [
  {
    id: '1',
    title: 'Senior Education Consultant',
    slug: 'senior-education-consultant',
    department: 'Consulting',
    location: 'London, UK',
    job_type: 'full-time',
    experience_level: 'senior',
    salary_range: '£45,000 - £60,000',
    description: 'We are looking for an experienced Education Consultant to join our growing team. You will be responsible for guiding students through the complex process of applying to universities abroad, from initial consultation to visa approval.',
    responsibilities: [
      'Conduct one-on-one consultations with prospective students and parents',
      'Develop personalized education roadmaps based on student profiles',
      'Guide students through university application processes',
      'Prepare students for visa interviews and documentation',
      'Build and maintain relationships with partner universities',
      'Meet monthly and quarterly targets for student placements',
    ],
    requirements: [
      "Bachelor's degree in Education, Business, or related field",
      '3+ years experience in international education consulting',
      'Strong knowledge of visa processes for UK, US, Canada, and Australia',
      'Excellent communication and interpersonal skills',
      'Fluency in English; additional languages are a plus',
      'Ability to work independently and as part of a team',
    ],
    benefits: [
      'Competitive salary with performance bonuses',
      'Health insurance and wellness programs',
      'Professional development opportunities',
      'Flexible working arrangements',
      '25 days annual leave plus bank holidays',
    ],
    is_published: true,
    is_featured: true,
    posted_date: getFutureDate(-14),
    closing_date: getFutureDate(45),
  },
  {
    id: '2',
    title: 'Marketing Coordinator',
    slug: 'marketing-coordinator',
    department: 'Marketing',
    location: 'Remote',
    job_type: 'full-time',
    experience_level: 'mid',
    salary_range: '£30,000 - £40,000',
    description: 'Join our marketing team to help spread the word about Elite Scholars and connect with ambitious students across Africa. You will be responsible for creating engaging content, managing social media, and coordinating marketing campaigns.',
    responsibilities: [
      'Develop and execute social media strategies',
      'Create engaging content for multiple platforms',
      'Coordinate email marketing campaigns',
      'Manage relationships with influencers and partners',
      'Analyze campaign performance and provide insights',
      'Support event planning and promotion',
    ],
    requirements: [
      "Bachelor's degree in Marketing, Communications, or related field",
      '2+ years experience in digital marketing',
      'Proficiency in social media management tools',
      'Strong writing and content creation skills',
      'Experience with email marketing platforms',
      'Knowledge of the African education market is a plus',
    ],
    benefits: [
      'Fully remote position',
      'Competitive salary',
      'Health insurance',
      'Learning and development budget',
      'Flexible working hours',
    ],
    is_published: true,
    is_featured: false,
    posted_date: getFutureDate(-10),
    closing_date: getFutureDate(30),
  },
  {
    id: '3',
    title: 'Student Support Specialist',
    slug: 'student-support-specialist',
    department: 'Operations',
    location: 'Lagos, Nigeria',
    job_type: 'full-time',
    experience_level: 'entry',
    salary_range: '₦350,000 - ₦500,000/month',
    description: 'We are looking for a passionate Student Support Specialist to help our students navigate their journey to studying abroad. You will be the first point of contact for many students and play a crucial role in their success.',
    responsibilities: [
      'Respond to student inquiries via email, chat, and phone',
      'Assist students with application submissions',
      'Track student progress and follow up on pending tasks',
      'Coordinate with universities and partners',
      'Maintain accurate records in our CRM system',
      'Escalate complex cases to senior consultants',
    ],
    requirements: [
      "Bachelor's degree from a recognized university",
      'Excellent communication skills in English',
      'Strong organizational and multitasking abilities',
      'Proficiency in Microsoft Office and CRM systems',
      'Customer service experience is a plus',
      'Passion for education and helping others',
    ],
    benefits: [
      'Competitive salary',
      'Health insurance (HMO)',
      'Training and career growth opportunities',
      'Supportive team environment',
      'Modern office space',
    ],
    is_published: true,
    is_featured: true,
    posted_date: getFutureDate(-7),
    closing_date: getFutureDate(21),
  },
  {
    id: '4',
    title: 'Visa Processing Officer',
    slug: 'visa-processing-officer',
    department: 'Operations',
    location: 'Accra, Ghana',
    job_type: 'full-time',
    experience_level: 'mid',
    salary_range: 'GHS 4,000 - 6,000/month',
    description: 'Join our operations team as a Visa Processing Officer. You will be responsible for preparing and reviewing visa applications, ensuring all documentation is complete and accurate.',
    responsibilities: [
      'Review and prepare visa application documents',
      'Ensure compliance with embassy requirements',
      'Coordinate with students to obtain necessary documents',
      'Track application status and provide updates',
      'Maintain detailed records of all applications',
      'Stay updated on visa policy changes',
    ],
    requirements: [
      "Bachelor's degree in any discipline",
      '2+ years experience in visa processing or related field',
      'Strong attention to detail',
      'Knowledge of visa requirements for multiple countries',
      'Excellent organizational skills',
      'Proficiency in English',
    ],
    benefits: [
      'Competitive salary',
      'Health insurance',
      'Performance bonuses',
      'Professional development',
      'Collaborative work environment',
    ],
    is_published: true,
    is_featured: false,
    posted_date: getFutureDate(-5),
    closing_date: getFutureDate(60),
  },
];

// Filter options
const DEPARTMENTS = ['all', 'Consulting', 'Marketing', 'Operations', 'Technology', 'Finance'];
const LOCATIONS = ['all', 'London, UK', 'Remote', 'Lagos, Nigeria', 'Accra, Ghana', 'Nairobi, Kenya'];
const JOB_TYPES = ['all', 'full-time', 'part-time', 'contract', 'internship'];
const EXPERIENCE_LEVELS = ['all', 'entry', 'mid', 'senior', 'executive'];

// Helper functions
const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
};

const getDaysRemaining = (closingDate) => {
  const now = new Date();
  const closing = new Date(closingDate);
  const diffTime = closing - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

const getJobTypeColor = (type) => {
  switch (type) {
    case 'full-time': return 'bg-green-100 text-green-700';
    case 'part-time': return 'bg-blue-100 text-blue-700';
    case 'contract': return 'bg-purple-100 text-purple-700';
    case 'internship': return 'bg-orange-100 text-orange-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

// Career Card Component
function CareerCard({ career, onClick }) {
  const daysRemaining = getDaysRemaining(career.closing_date);
  const isClosingSoon = daysRemaining <= 7 && daysRemaining > 0;
  
  return (
    <div 
      className="bg-white rounded-2xl shadow-lg p-6 cursor-pointer transform transition-all duration-300 hover:shadow-xl hover:scale-[1.01] border border-gray-100"
      onClick={() => onClick(career)}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            {career.is_featured && (
              <span className="px-2 py-0.5 bg-[#D72E2D] text-white text-xs font-semibold rounded-full">
                Featured
              </span>
            )}
            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full capitalize ${getJobTypeColor(career.job_type)}`}>
              {career.job_type.replace('-', ' ')}
            </span>
          </div>
          <h3 className="text-xl font-bold text-[#0B0E32]" style={{ fontFamily: '"Hedvig Letters Serif", serif' }}>
            {career.title}
          </h3>
          <p className="text-[#636363] text-sm mt-1">{career.department}</p>
        </div>
        <div className="flex-shrink-0 w-12 h-12 bg-[#D6DAFF] rounded-xl flex items-center justify-center">
          <MdBusinessCenter className="w-6 h-6 text-[#0B0E32]" />
        </div>
      </div>
      
      <p className="text-[#636363] text-sm mb-4 line-clamp-2">
        {career.description}
      </p>
      
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex items-center text-sm text-[#636363]">
          <FiMapPin className="mr-1.5 text-[#D72E2D]" />
          {career.location}
        </div>
        <div className="flex items-center text-sm text-[#636363]">
          <FiDollarSign className="mr-1.5 text-[#D72E2D]" />
          {career.salary_range}
        </div>
        <div className="flex items-center text-sm text-[#636363]">
          <FiClock className="mr-1.5 text-[#D72E2D]" />
          {career.experience_level.charAt(0).toUpperCase() + career.experience_level.slice(1)} level
        </div>
      </div>
      
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="text-sm text-[#636363]">
          Posted {formatDate(career.posted_date)}
        </div>
        <span className="text-sm font-semibold text-green-600 flex items-center gap-1">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          Accepting Applications
        </span>
      </div>
      
      <button className="w-full mt-4 pl-6 pr-2 py-2 bg-[#0B0E32] text-white rounded-full font-medium hover:bg-[#1a1f4e] transition-colors flex items-center justify-between" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
        <span>View Details</span>
        <span className="w-9 h-9 bg-white rounded-full flex items-center justify-center">
          <FiArrowRight className="w-4 h-4 text-[#0B0E32]" />
        </span>
      </button>
    </div>
  );
}

// General Application Modal (for "Don't see your perfect role?")
function GeneralApplicationModal({ onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    linkedin: '',
    desired_role: '',
    experience: '',
    cover_letter: '',
    resume: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size <= 5 * 1024 * 1024) { // 5MB limit
      setFormData({ ...formData, resume: file });
    } else {
      setError('File size must be less than 5MB');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    
    try {
      let resumeUrl = null;
      
      // Upload resume to Supabase Storage if provided
      if (formData.resume) {
        try {
          console.log('[GeneralApplication] Uploading resume to Supabase Storage...', {
            fileName: formData.resume.name,
            fileSize: formData.resume.size,
            fileType: formData.resume.type
          });
          
          const fileExt = formData.resume.name.split('.').pop();
          const sanitizedName = formData.name.replace(/[^a-zA-Z0-9]/g, '_');
          const fileName = `${Date.now()}_${sanitizedName}_resume.${fileExt}`;
          const filePath = `resumes/${fileName}`;
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('resumes')
            .upload(filePath, formData.resume, {
              cacheControl: '3600',
              upsert: false
            });
          
          if (uploadError) {
            console.error('[GeneralApplication] Resume upload error:', uploadError);
            // Don't fail the entire application if resume upload fails
            console.warn('[GeneralApplication] Continuing without resume due to upload error:', uploadError.message);
            // Continue without resume - don't set error, just proceed
          } else {
            // Get public URL
            const { data: { publicUrl } } = supabase.storage
              .from('resumes')
              .getPublicUrl(filePath);
            
            resumeUrl = publicUrl;
            console.log('[GeneralApplication] Resume uploaded successfully:', resumeUrl);
          }
        } catch (uploadErr) {
          console.error('[GeneralApplication] Resume upload exception:', uploadErr);
          // Continue without resume
          console.warn('[GeneralApplication] Continuing without resume due to exception');
        }
      }
      
      // Submit application data as JSON
      const applicationData = {
        type: 'general_application',
        position_title: formData.desired_role || 'General Application',
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        linkedin: formData.linkedin,
        cover_letter: `Desired Role: ${formData.desired_role || 'Open to opportunities'}\n\nExperience: ${formData.experience}\n\n${formData.cover_letter}`,
        desired_role: formData.desired_role,
        experience_years: formData.experience,
        resume_url: resumeUrl
      };
      
      console.log('[GeneralApplication] Submitting application...', applicationData);
      
      const response = await fetch(`${BACKEND_URL}/api/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(applicationData),
      });
      
      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        const text = await response.text();
        console.error('[GeneralApplication] Failed to parse response:', text);
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }
      
      if (!response.ok) {
        console.error('[GeneralApplication] API error:', result);
        throw new Error(result.error || `Application failed: ${response.status}`);
      }
      
      console.log('[GeneralApplication] Application submitted successfully:', result);
      setSubmitted(true);
    } catch (err) {
      console.error('[GeneralApplication] Error:', err);
      setError(err.message || 'Failed to submit application. Please try again.');
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
        className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100"
        >
          <FiX className="w-6 h-6" />
        </button>
        
        <div 
          className="overflow-y-auto max-h-[90vh] custom-scrollbar pr-2"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#d1d5db transparent',
          }}
        >
          <div className="p-6 md:p-8">
            {/* Header */}
            <div className="mb-6">
              <div className="w-16 h-16 bg-[#D72E2D]/10 rounded-2xl flex items-center justify-center mb-4">
                <FiBriefcase className="w-8 h-8 text-[#D72E2D]" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-[#0B0E32]" style={{ fontFamily: '"Hedvig Letters Serif", serif' }}>
                Join Our Team
              </h2>
              <p className="text-[#636363] mt-2">
                Tell us about yourself and the kind of role you're looking for. We'll reach out when a suitable opportunity arises.
              </p>
            </div>
            
            {submitted ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FiCheck className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-semibold text-[#141414] mb-3">Application Submitted!</h3>
                <p className="text-[#636363] mb-6 max-w-md mx-auto">
                  Thank you for your interest in joining Elite Scholars. We've received your application and will reach out when a suitable position opens up.
                </p>
                <button
                  onClick={onClose}
                  className="px-8 py-3 bg-[#0B0E32] text-white rounded-xl font-semibold hover:bg-[#1a1f4e] transition-colors"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                    {error}
                  </div>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-[#141414] mb-2">Full Name *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#D72E2D] focus:ring-2 focus:ring-[#D72E2D]/20 outline-none transition-all"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[#141414] mb-2">Email Address *</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#D72E2D] focus:ring-2 focus:ring-[#D72E2D]/20 outline-none transition-all"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-[#141414] mb-2">Phone Number</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#D72E2D] focus:ring-2 focus:ring-[#D72E2D]/20 outline-none transition-all"
                        placeholder="+1 234 567 8900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[#141414] mb-2">LinkedIn Profile</label>
                      <input
                        type="url"
                        value={formData.linkedin}
                        onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#D72E2D] focus:ring-2 focus:ring-[#D72E2D]/20 outline-none transition-all"
                        placeholder="https://linkedin.com/in/yourprofile"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-[#141414] mb-2">Desired Role / Area of Interest *</label>
                    <input
                      type="text"
                      value={formData.desired_role}
                      onChange={(e) => setFormData({ ...formData, desired_role: e.target.value })}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#D72E2D] focus:ring-2 focus:ring-[#D72E2D]/20 outline-none transition-all"
                      placeholder="e.g., Education Consultant, Marketing, Operations"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-[#141414] mb-2">Years of Relevant Experience</label>
                    <select
                      value={formData.experience}
                      onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#D72E2D] focus:ring-2 focus:ring-[#D72E2D]/20 outline-none transition-all"
                    >
                      <option value="">Select experience level</option>
                      <option value="0-1 years">0-1 years</option>
                      <option value="1-3 years">1-3 years</option>
                      <option value="3-5 years">3-5 years</option>
                      <option value="5-10 years">5-10 years</option>
                      <option value="10+ years">10+ years</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-[#141414] mb-2">Resume/CV *</label>
                    <div className="relative">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileChange}
                        required
                        className="hidden"
                        id="general-resume-upload"
                      />
                      <label
                        htmlFor="general-resume-upload"
                        className="flex items-center justify-center gap-3 w-full px-4 py-6 rounded-xl border-2 border-dashed border-gray-300 hover:border-[#D72E2D] cursor-pointer transition-colors"
                      >
                        {formData.resume ? (
                          <span className="text-green-600 flex items-center gap-2">
                            <FiCheck className="w-5 h-5" />
                            {formData.resume.name}
                          </span>
                        ) : (
                          <>
                            <FiUpload className="w-6 h-6 text-[#636363]" />
                            <span className="text-[#636363]">Upload your resume (PDF, DOC, DOCX - Max 5MB)</span>
                          </>
                        )}
                      </label>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-[#141414] mb-2">Tell Us About Yourself *</label>
                    <textarea
                      value={formData.cover_letter}
                      onChange={(e) => setFormData({ ...formData, cover_letter: e.target.value })}
                      required
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#D72E2D] focus:ring-2 focus:ring-[#D72E2D]/20 outline-none transition-all resize-none"
                      placeholder="Share your background, skills, and why you want to join Elite Scholars..."
                    />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full pl-6 pr-2 py-2 bg-[#D72E2D] text-white rounded-full font-medium hover:bg-[#b82626] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between"
                    style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                  >
                    {submitting ? (
                      <>
                        <span>Submitting...</span>
                        <span className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                          <div className="w-5 h-5 border-2 border-[#D72E2D] border-t-transparent rounded-full animate-spin" />
                        </span>
                      </>
                    ) : (
                      <>
                        <span>Submit Application</span>
                        <span className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                          <FiArrowRight className="w-5 h-5 text-[#D72E2D]" />
                        </span>
                      </>
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Career Detail Modal
function CareerDetailModal({ career, onClose }) {
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    linkedin: '',
    cover_letter: '',
    resume: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  if (!career) return null;

  const daysRemaining = getDaysRemaining(career.closing_date);
  const isOpen = daysRemaining > 0;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size <= 5 * 1024 * 1024) { // 5MB limit
      setFormData({ ...formData, resume: file });
    } else {
      setError('File size must be less than 5MB');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    
    try {
      let resumeUrl = null;
      
      // Upload resume to Supabase Storage if provided
      if (formData.resume) {
        try {
          console.log('[CareerApplication] Uploading resume to Supabase Storage...', {
            fileName: formData.resume.name,
            fileSize: formData.resume.size,
            fileType: formData.resume.type
          });
          
          const fileExt = formData.resume.name.split('.').pop();
          const sanitizedName = formData.name.replace(/[^a-zA-Z0-9]/g, '_');
          const fileName = `${Date.now()}_${sanitizedName}_resume.${fileExt}`;
          const filePath = `resumes/${fileName}`;
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('resumes')
            .upload(filePath, formData.resume, {
              cacheControl: '3600',
              upsert: false
            });
          
          if (uploadError) {
            console.error('[CareerApplication] Resume upload error:', uploadError);
            // Don't fail the entire application if resume upload fails
            // Just log it and continue without resume
            console.warn('[CareerApplication] Continuing without resume due to upload error:', uploadError.message);
            // Continue without resume - don't set error, just proceed
          } else {
            // Get public URL
            const { data: { publicUrl } } = supabase.storage
              .from('resumes')
              .getPublicUrl(filePath);
            
            resumeUrl = publicUrl;
            console.log('[CareerApplication] Resume uploaded successfully:', resumeUrl);
          }
        } catch (uploadErr) {
          console.error('[CareerApplication] Resume upload exception:', uploadErr);
          // Continue without resume
          console.warn('[CareerApplication] Continuing without resume due to exception');
        }
      }
      
      // Submit application data as JSON
      const applicationData = {
        type: 'job_application',
        career_id: career.id,
        position_title: career.title,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        linkedin: formData.linkedin,
        cover_letter: formData.cover_letter,
        resume_url: resumeUrl
      };
      
      console.log('[CareerApplication] Submitting application...', applicationData);
      
      const response = await fetch(`${BACKEND_URL}/api/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(applicationData),
      });
      
      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        const text = await response.text();
        console.error('[CareerApplication] Failed to parse response:', text);
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }
      
      if (!response.ok) {
        console.error('[CareerApplication] API error:', result);
        throw new Error(result.error || `Application failed: ${response.status}`);
      }
      
      console.log('[CareerApplication] Application submitted successfully:', result);
      setSubmitted(true);
    } catch (err) {
      console.error('[CareerApplication] Error:', err);
      setError(err.message || 'Failed to submit application. Please try again.');
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
        className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden relative my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100"
        >
          <FiX className="w-6 h-6" />
        </button>
        
        <div 
          className="overflow-y-auto max-h-[90vh] custom-scrollbar pr-2"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#d1d5db transparent',
          }}
        >
          <style>{`
            .custom-scrollbar::-webkit-scrollbar {
              width: 6px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
              background: transparent;
              margin: 16px 0;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background-color: #d1d5db;
              border-radius: 10px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
              background-color: #9ca3af;
            }
          `}</style>
          
          <div className="p-6 md:p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {career.is_featured && (
                <span className="px-3 py-1 bg-[#D72E2D] text-white text-xs font-semibold rounded-full">
                  Featured
                </span>
              )}
              <span className={`px-3 py-1 text-xs font-semibold rounded-full capitalize ${getJobTypeColor(career.job_type)}`}>
                {career.job_type.replace('-', ' ')}
              </span>
              <span className="px-3 py-1 bg-[#D6DAFF] text-[#0B0E32] text-xs font-semibold rounded-full capitalize">
                {career.experience_level} Level
              </span>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold text-[#0B0E32] mb-4" style={{ fontFamily: '"Hedvig Letters Serif", serif' }}>
              {career.title}
            </h2>
            
            <div className="flex flex-wrap gap-4 mb-4">
              <div className="flex items-center text-[#636363]">
                <MdBusinessCenter className="mr-2 text-[#D72E2D]" />
                {career.department}
              </div>
              <div className="flex items-center text-[#636363]">
                <MdLocationOn className="mr-2 text-[#D72E2D]" />
                {career.location}
              </div>
              <div className="flex items-center text-[#636363]">
                <FiDollarSign className="mr-2 text-[#D72E2D]" />
                {career.salary_range}
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-sm">
              <span className="text-[#636363]">Posted {formatDate(career.posted_date)}</span>
              {isOpen ? (
                <span className={`font-semibold ${daysRemaining <= 7 ? 'text-[#D72E2D]' : 'text-[#636363]'}`}>
                  Closes {formatDate(career.closing_date)} ({daysRemaining} days left)
                </span>
              ) : (
                <span className="text-red-500 font-semibold">Position Closed</span>
              )}
            </div>
          </div>
          
          {!showApplicationForm ? (
            <>
              {/* Job Description */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-[#141414] mb-4">About This Role</h3>
                <p className="text-[#636363] leading-relaxed">{career.description}</p>
              </div>
              
              {/* Responsibilities */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-[#141414] mb-4">Key Responsibilities</h3>
                <ul className="space-y-3">
                  {career.responsibilities?.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-[#D72E2D]/10 rounded-full flex items-center justify-center mt-0.5">
                        <FiCheck className="w-3.5 h-3.5 text-[#D72E2D]" />
                      </span>
                      <span className="text-[#636363]">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Requirements */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-[#141414] mb-4">Requirements</h3>
                <ul className="space-y-3">
                  {career.requirements?.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-[#0B0E32]/10 rounded-full flex items-center justify-center mt-0.5">
                        <FiCheck className="w-3.5 h-3.5 text-[#0B0E32]" />
                      </span>
                      <span className="text-[#636363]">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Benefits */}
              {career.benefits && career.benefits.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-[#141414] mb-4">Benefits & Perks</h3>
                  <div className="grid md:grid-cols-2 gap-3">
                    {career.benefits.map((item, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-[#D6DAFF]/20 rounded-xl">
                        <span className="w-2 h-2 bg-[#D72E2D] rounded-full" />
                        <span className="text-[#636363]">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Apply Button - Always show for open positions */}
              <button
                onClick={() => setShowApplicationForm(true)}
                className="w-full pl-6 pr-2 py-2 bg-[#D72E2D] text-white rounded-full font-medium hover:bg-[#b82626] transition-colors flex items-center justify-between"
                style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
              >
                <span>Apply Now</span>
                <span className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                  <FiArrowRight className="w-5 h-5 text-[#D72E2D]" />
                </span>
              </button>
            </>
          ) : submitted ? (
            /* Success Message */
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <FiCheck className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-[#141414] mb-3">Application Submitted!</h3>
              <p className="text-[#636363] mb-6 max-w-md mx-auto">
                Thank you for applying to the {career.title} position. We will review your application and get back to you within 5-7 business days.
              </p>
              <button
                onClick={onClose}
                className="px-8 py-3 bg-[#0B0E32] text-white rounded-xl font-semibold hover:bg-[#1a1f4e] transition-colors"
              >
                Close
              </button>
            </div>
          ) : (
            /* Application Form */
            <div>
              <button
                onClick={() => setShowApplicationForm(false)}
                className="mb-6 text-[#636363] hover:text-[#0B0E32] flex items-center gap-2"
              >
                ← Back to job details
              </button>
              
              <h3 className="text-2xl font-bold text-[#0B0E32] mb-6" style={{ fontFamily: '"Hedvig Letters Serif", serif' }}>
                Apply for {career.title}
              </h3>
              
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                  {error}
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-[#141414] mb-2">Full Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#D72E2D] focus:ring-2 focus:ring-[#D72E2D]/20 outline-none transition-all"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#141414] mb-2">Email Address *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#D72E2D] focus:ring-2 focus:ring-[#D72E2D]/20 outline-none transition-all"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-[#141414] mb-2">Phone Number *</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#D72E2D] focus:ring-2 focus:ring-[#D72E2D]/20 outline-none transition-all"
                      placeholder="+1 234 567 8900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#141414] mb-2">LinkedIn Profile</label>
                    <input
                      type="url"
                      value={formData.linkedin}
                      onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#D72E2D] focus:ring-2 focus:ring-[#D72E2D]/20 outline-none transition-all"
                      placeholder="https://linkedin.com/in/yourprofile"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-[#141414] mb-2">Resume/CV *</label>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange}
                      required
                      className="hidden"
                      id="resume-upload"
                    />
                    <label
                      htmlFor="resume-upload"
                      className="flex items-center justify-center gap-3 w-full px-4 py-6 rounded-xl border-2 border-dashed border-gray-300 hover:border-[#D72E2D] cursor-pointer transition-colors"
                    >
                      {formData.resume ? (
                        <span className="text-green-600 flex items-center gap-2">
                          <FiCheck className="w-5 h-5" />
                          {formData.resume.name}
                        </span>
                      ) : (
                        <>
                          <FiUpload className="w-6 h-6 text-[#636363]" />
                          <span className="text-[#636363]">Upload your resume (PDF, DOC, DOCX - Max 5MB)</span>
                        </>
                      )}
                    </label>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-[#141414] mb-2">Cover Letter</label>
                  <textarea
                    value={formData.cover_letter}
                    onChange={(e) => setFormData({ ...formData, cover_letter: e.target.value })}
                    rows={5}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#D72E2D] focus:ring-2 focus:ring-[#D72E2D]/20 outline-none transition-all resize-none"
                    placeholder="Tell us why you're the perfect fit for this role..."
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full pl-6 pr-2 py-2 bg-[#D72E2D] text-white rounded-full font-medium hover:bg-[#b82626] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                >
                  {submitting ? (
                    <>
                      <span>Submitting...</span>
                      <span className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-[#D72E2D] border-t-transparent rounded-full animate-spin" />
                      </span>
                    </>
                  ) : (
                    <>
                      <span>Submit Application</span>
                      <span className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                        <FiArrowRight className="w-5 h-5 text-[#D72E2D]" />
                      </span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Careers Page Component
export default function CareersPage() {
  const [careers, setCareers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedJobType, setSelectedJobType] = useState('all');
  
  // Modal
  const [selectedCareer, setSelectedCareer] = useState(null);
  const [showGeneralApplication, setShowGeneralApplication] = useState(false);

  useEffect(() => {
    fetchCareers();
  }, []);

  const fetchCareers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/public/careers`);
      const data = response.ok ? await response.json() : null;
      
      if (data && Array.isArray(data) && data.length > 0) {
        // Update closing dates to be in the future for any closed positions
        const updatedData = data.map(career => {
          const daysRemaining = getDaysRemaining(career.closing_date);
          if (daysRemaining <= 0) {
            // Position is closed, update to 30 days from now
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 30);
            return { ...career, closing_date: futureDate.toISOString() };
          }
          return career;
        });
        setCareers(updatedData.filter(c => c.is_published));
      } else {
        // Use mock data
        setCareers(MOCK_CAREERS);
      }
    } catch (err) {
      console.error('Error fetching careers:', err);
      setCareers(MOCK_CAREERS);
    } finally {
      setLoading(false);
    }
  };

  // Filtered careers
  const filteredCareers = useMemo(() => {
    return careers.filter(career => {
      const matchesSearch = career.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        career.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        career.department?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDepartment = selectedDepartment === 'all' || career.department === selectedDepartment;
      const matchesLocation = selectedLocation === 'all' || career.location === selectedLocation;
      const matchesJobType = selectedJobType === 'all' || career.job_type === selectedJobType;
      
      return matchesSearch && matchesDepartment && matchesLocation && matchesJobType;
    });
  }, [careers, searchQuery, selectedDepartment, selectedLocation, selectedJobType]);

  // Get unique values for filters
  const uniqueDepartments = useMemo(() => ['all', ...new Set(careers.map(c => c.department).filter(Boolean))], [careers]);
  const uniqueLocations = useMemo(() => ['all', ...new Set(careers.map(c => c.location).filter(Boolean))], [careers]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D72E2D] mx-auto mb-4"></div>
          <p className="text-lg text-[#636363]">Loading careers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
      {/* Hero Section */}
      <section className="relative bg-[#0B0E32] text-white py-20 md:py-32 overflow-hidden">
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 text-[#D72E2D] text-base font-medium mb-6" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
              <span className="w-2 h-2 bg-[#D72E2D] rounded-full"></span>
              Careers
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white" style={{ fontFamily: '"Hedvig Letters Serif", serif' }}>
              Build Your Career While Changing Lives
            </h1>
            <p className="text-lg md:text-xl text-gray-300 mb-8 leading-relaxed">
              Join our mission to transform ambitious students into global citizens. We're looking for passionate people who want to make a difference.
            </p>
            <div className="flex flex-wrap gap-6">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-[#D72E2D]">{careers.length}</div>
                <div className="text-gray-400 text-sm">Open Positions</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-[#D72E2D]">2</div>
                <div className="text-gray-400 text-sm">Countries</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-[#D72E2D]">5</div>
                <div className="text-gray-400 text-sm">Team Members</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters Section */}
      <section className="py-8 bg-[#F0F4FF] border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[#636363]" />
              <input
                type="text"
                placeholder="Search by title, keyword, or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-[56px] border border-gray-200 focus:border-[#D72E2D] focus:ring-2 focus:ring-[#D72E2D]/20 outline-none transition-all"
              />
            </div>
            
            <CustomDropdown
              value={selectedDepartment}
              onChange={setSelectedDepartment}
              options={uniqueDepartments.map(dept => ({
                value: dept,
                label: dept === 'all' ? 'All Departments' : dept
              }))}
              className="w-full lg:w-auto"
              minWidth="170px"
            />
            
            <CustomDropdown
              value={selectedLocation}
              onChange={setSelectedLocation}
              options={uniqueLocations.map(loc => ({
                value: loc,
                label: loc === 'all' ? 'All Locations' : loc
              }))}
              className="w-full lg:w-auto"
              minWidth="160px"
            />
            
            <CustomDropdown
              value={selectedJobType}
              onChange={setSelectedJobType}
              options={JOB_TYPES.map(type => ({
                value: type,
                label: type === 'all' ? 'All Job Types' : type.replace('-', ' ')
              }))}
              className="w-full lg:w-auto"
              minWidth="150px"
              capitalize
            />
          </div>
        </div>
      </section>

      {/* Jobs Grid */}
      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-[#0B0E32]" style={{ fontFamily: '"Hedvig Letters Serif", serif' }}>
                Open Positions
              </h2>
              <p className="text-[#636363] mt-2">{filteredCareers.length} position{filteredCareers.length !== 1 ? 's' : ''} found</p>
            </div>
          </div>
          
          {filteredCareers.length === 0 ? (
            <div className="text-center py-16 bg-[#D6DAFF]/20 rounded-2xl">
              <MdWorkOutline className="w-16 h-16 text-[#636363] mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-[#141414] mb-2">No Positions Found</h3>
              <p className="text-[#636363]">Try adjusting your filters or check back later for new opportunities.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {filteredCareers.map(career => (
                <CareerCard 
                  key={career.id} 
                  career={career} 
                  onClick={setSelectedCareer}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Why Join Us Section */}
      <section className="py-16 md:py-20 bg-[#F0F4FF] overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#0B0E32] mb-4" style={{ fontFamily: '"Hedvig Letters Serif", serif' }}>
              Why Join Elite Scholars?
            </h2>
            <p className="text-[#636363] max-w-2xl mx-auto">
              Be part of a team that's passionate about transforming lives through education
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: FiGlobe,
                title: 'Global Impact',
                description: 'Help students from across Africa achieve their dreams of studying abroad',
              },
              {
                icon: FiTrendingUp,
                title: 'Career Growth',
                description: 'Continuous learning opportunities and clear paths for advancement',
              },
              {
                icon: FiUsers,
                title: 'Collaborative Culture',
                description: 'Work with a diverse, supportive team that celebrates each other\'s success',
              },
              {
                icon: FiHeart,
                title: 'Work-Life Balance',
                description: 'Flexible arrangements and generous time off to recharge',
              },
            ].map((item, i) => {
              const IconComponent = item.icon;
              return (
                <div key={i} className="bg-white p-6 rounded-2xl shadow-lg text-center">
                  <div className="w-14 h-14 bg-[#0B0E32] rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#141414] mb-2">{item.title}</h3>
                  <p className="text-[#636363] text-sm">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-20 bg-[#0B0E32] text-white overflow-hidden relative">
        {/* Solid background to prevent any artifacts */}
        <div className="absolute inset-0 bg-[#0B0E32]"></div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6" style={{ fontFamily: '"Hedvig Letters Serif", serif' }}>
            Don't See Your Perfect Role?
          </h2>
          <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
            We're always looking for talented individuals. Send us your resume and we'll reach out when a suitable position opens up.
          </p>
          <button 
            onClick={() => setShowGeneralApplication(true)}
            className="inline-flex items-center gap-3 pl-6 pr-2 py-2 bg-[#D72E2D] text-white rounded-full font-medium hover:bg-[#b82626] transition-colors"
          >
            <span>Send Your Resume</span>
            <span className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <FiArrowRight className="w-5 h-5 text-[#141414]" />
            </span>
          </button>
        </div>
      </section>

      {/* Career Detail Modal */}
      {selectedCareer && (
        <CareerDetailModal 
          career={selectedCareer} 
          onClose={() => setSelectedCareer(null)}
        />
      )}
      
      {/* General Application Modal */}
      {showGeneralApplication && (
        <GeneralApplicationModal 
          onClose={() => setShowGeneralApplication(false)}
        />
      )}
    </div>
  );
}