import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTrackerData() {
  // Check application_tracker table
  const { data: trackers, error: trackersError } = await supabase
    .from('application_tracker')
    .select('*')
    .limit(10);
    
  console.log('Application tracker entries:', trackers?.length || 0);
  if (trackers && trackers.length > 0) {
    console.log('Sample tracker:', trackers[0]);
  }
  
  if (trackersError) {
    console.error('Tracker error:', trackersError);
  }
  
  // Check user_roles table
  const { data: users, error: usersError } = await supabase
    .from('user_roles')
    .select('*')
    .limit(5);
    
  console.log('User roles entries:', users?.length || 0);
  if (users && users.length > 0) {
    console.log('Sample user:', users[0]);
  }
  
  if (usersError) {
    console.error('Users error:', usersError);
  }
}

checkTrackerData();
