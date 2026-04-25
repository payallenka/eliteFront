import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = createClient(supabaseUrl, supabaseKey);

// API Configuration
export const API_ENDPOINTS = {
  events: '/api/public/events',
  podcasts: '/api/public/podcasts',
  careers: '/api/public/careers',
  apply: '/api/apply',
};

// Helper functions for date comparisons
export const isUpcoming = (dateStr) => {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const now = new Date();
  return date > now;
};

export const isPast = (dateStr) => {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const now = new Date();
  return date < now;
};